import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase-admin/app";
import { createHash, randomBytes } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

initializeApp();

type SignatureRequest = {
  projectId: string;
  docId: string;
  tokenHash: string;
  status: "pending" | "submitted";
  expiresAt: number;
  submittedAt?: Timestamp;
};

function createSignatureToken() {
  return randomBytes(24).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function dataUrlToBytes(dataUrl: string) {
  const payload = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(Buffer.from(payload, "base64"));
}

async function embedSignatureInPdf(pdfBytes: Uint8Array, pngBytes: Uint8Array) {
  const pdf = await PDFDocument.load(pdfBytes);
  const page = pdf.getPages()[pdf.getPageCount() - 1];
  const image = await pdf.embedPng(pngBytes);
  page.drawImage(image, { x: 50, y: 50, width: 180, height: 70 });
  return pdf.save();
}

export const createSignatureRequest = onRequest(async (req, res) => {
  const { projectId, docId } = req.body ?? {};
  if (!projectId || !docId) {
    return res.status(400).json({ error: "projectId and docId are required" });
  }

  const token = createSignatureToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/sign/${token}`;

  await getFirestore().collection("signatureRequests").add({
    projectId,
    docId,
    tokenHash,
    status: "pending",
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  return res.json({ url, qrDataUrl: await QRCode.toDataURL(url), expiresAt });
});

export const submitSignature = onRequest(async (req, res) => {
  const { token, signatureDataUrl } = req.body ?? {};
  if (!token || !signatureDataUrl) {
    return res.status(400).json({ error: "token and signatureDataUrl are required" });
  }

  const db = getFirestore();
  const storage = getStorage().bucket();
  const tokenHash = hashToken(token);

  const requestQuery = await db.collection("signatureRequests").where("tokenHash", "==", tokenHash).limit(1).get();
  if (requestQuery.empty) {
    return res.status(404).json({ error: "invalid token" });
  }

  const requestRef = requestQuery.docs[0].ref;

  const txResult = await db.runTransaction(async (tx) => {
    const requestSnap = await tx.get(requestRef);
    const requestData = requestSnap.data() as SignatureRequest | undefined;
    if (!requestData) throw new Error("missing signature request");

    if (requestData.status !== "pending" || Date.now() > requestData.expiresAt) {
      throw new Error("token invalid or expired");
    }

    tx.update(requestRef, {
      status: "submitted",
      submittedAt: FieldValue.serverTimestamp(),
      signatureMeta: { format: "png" },
    });

    return { projectId: requestData.projectId, docId: requestData.docId };
  }).catch((error: Error) => {
    if (error.message === "token invalid or expired") {
      return null;
    }
    throw error;
  });

  if (!txResult) {
    return res.status(400).json({ error: "token invalid or expired" });
  }

  const documentRef = db.collection("documents").doc(txResult.docId);
  const documentSnap = await documentRef.get();
  if (!documentSnap.exists) {
    return res.status(404).json({ error: "document not found" });
  }

  const documentData = documentSnap.data() as { currentStoragePath?: string; version?: number };
  const currentVersion = documentData.version ?? 1;
  const currentPath =
    documentData.currentStoragePath ??
    `projects/${txResult.projectId}/documents/${txResult.docId}/versions/${currentVersion}.pdf`;

  const [currentPdfBytes] = await storage.file(currentPath).download();
  const signedPdfBytes = await embedSignatureInPdf(currentPdfBytes, dataUrlToBytes(signatureDataUrl));

  const newVersion = currentVersion + 1;
  const newPath = `projects/${txResult.projectId}/documents/${txResult.docId}/versions/${newVersion}.pdf`;

  await storage.file(newPath).save(Buffer.from(signedPdfBytes), { contentType: "application/pdf" });

  await db.runTransaction(async (tx) => {
    tx.set(
      documentRef,
      {
        version: newVersion,
        status: "signed",
        updatedAt: FieldValue.serverTimestamp(),
        currentStoragePath: newPath,
      },
      { merge: true },
    );

    tx.set(db.collection("documentVersions").doc(), {
      docId: txResult.docId,
      version: newVersion,
      storagePath: newPath,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "submitSignature",
    });
  });

  const [pdfUrl] = await storage.file(newPath).getSignedUrl({
    action: "read",
    expires: Date.now() + 3600_000,
  });

  logger.info("signature submitted", { docId: txResult.docId, newPath, version: newVersion });
  return res.json({ success: true, pdfUrl, version: newVersion });
});
