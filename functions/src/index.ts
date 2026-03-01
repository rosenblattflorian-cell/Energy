import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import QRCode from "qrcode";
import { assertSubmittable, createSignatureToken, hashToken } from "./lib/signature";
import { dataUrlToBytes, embedSignatureInPdf } from "./lib/pdf";

initializeApp();

const TOKEN_TTL_MS = 10 * 60 * 1000;

export const createSignatureRequest = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const { projectId, docId } = req.body ?? {};
  if (!projectId || !docId) {
    res.status(400).json({ error: "projectId and docId are required" });
    return;
  }

  const token = createSignatureToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + TOKEN_TTL_MS;
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

  res.json({ url, qrDataUrl: await QRCode.toDataURL(url), expiresAt: new Date(expiresAt).toISOString() });
});

export const submitSignature = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const { token, signatureDataUrl } = req.body ?? {};
  if (!token || !signatureDataUrl) {
    res.status(400).json({ error: "token and signatureDataUrl are required" });
    return;
  }

  const db = getFirestore();
  const tokenHash = hashToken(token);
  const requestSnap = await db
    .collection("signatureRequests")
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  if (requestSnap.empty) {
    res.status(404).json({ error: "invalid token" });
    return;
  }

  const requestRef = requestSnap.docs[0].ref;
  let requestData: FirebaseFirestore.DocumentData | null = null;

  await db.runTransaction(async (tx) => {
    const current = await tx.get(requestRef);
    if (!current.exists) {
      throw new Error("invalid token");
    }

    const data = current.data()!;
    assertSubmittable(data.status, data.expiresAt);

    tx.update(requestRef, {
      status: "processing",
      processingAt: FieldValue.serverTimestamp(),
    });

    requestData = data;
  });

  if (!requestData) {
    res.status(500).json({ error: "signature request not found" });
    return;
  }

  try {
    const projectId = requestData.projectId as string;
    const docId = requestData.docId as string;
    const documentRef = db.collection("documents").doc(docId);
    const documentSnap = await documentRef.get();
    const documentData = documentSnap.data() ?? {};

    const currentVersion = Number(documentData.version ?? 1);
    const currentStoragePath =
      (documentData.currentStoragePath as string | undefined) ??
      `projects/${projectId}/documents/${docId}/versions/${currentVersion}.pdf`;

    const storage = getStorage().bucket();
    const [currentPdfBytes] = await storage.file(currentStoragePath).download();
    const signedPdfBytes = await embedSignatureInPdf(
      currentPdfBytes,
      dataUrlToBytes(signatureDataUrl),
      (requestData.fieldName as string | undefined) ?? "customerSignature",
    );

    const nextVersion = currentVersion + 1;
    const newStoragePath = `projects/${projectId}/documents/${docId}/versions/${nextVersion}.pdf`;

    await storage.file(newStoragePath).save(Buffer.from(signedPdfBytes), {
      contentType: "application/pdf",
    });

    await db.runTransaction(async (tx) => {
      tx.update(requestRef, {
        status: "submitted",
        submittedAt: FieldValue.serverTimestamp(),
        signatureMeta: { format: "png", signedVersion: nextVersion },
      });

      tx.set(
        documentRef,
        {
          projectId,
          version: nextVersion,
          status: "signed",
          updatedAt: FieldValue.serverTimestamp(),
          currentStoragePath: newStoragePath,
        },
        { merge: true },
      );

      tx.set(db.collection("documentVersions").doc(), {
        projectId,
        docId,
        version: nextVersion,
        storagePath: newStoragePath,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: "submitSignature",
      });
    });

    const [pdfUrl] = await storage
      .file(newStoragePath)
      .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });

    logger.info("signature submitted", { docId, newStoragePath, version: nextVersion });
    res.json({ success: true, pdfUrl, version: nextVersion });
  } catch (error) {
    await requestRef.update({
      status: "pending",
      processingAt: FieldValue.delete(),
      lastError: error instanceof Error ? error.message : "unknown error",
    });

    const message = error instanceof Error ? error.message : "unknown error";
    const statusCode = message.includes("token") ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});
