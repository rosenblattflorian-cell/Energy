import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase-admin/app";
import QRCode from "qrcode";
import { createSignatureToken, hashToken, canSubmitSignature } from "../../src/lib/signature";
import { dataUrlToBytes, embedSignatureInPdf } from "../../src/lib/pdf";

initializeApp();

export const createSignatureRequest = onRequest(async (req, res) => {
  const { projectId, docId, fieldName = "customerSignature" } = req.body;
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
    fieldName,
    tokenHash,
    status: "pending",
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  return res.json({ url, qrDataUrl: await QRCode.toDataURL(url), expiresAt });
});

export const submitSignature = onRequest(async (req, res) => {
  const { token, signatureDataUrl } = req.body;
  if (!token || !signatureDataUrl) {
    return res.status(400).json({ error: "token and signatureDataUrl are required" });
  }

  const db = getFirestore();
  const storage = getStorage().bucket();
  const tokenHash = hashToken(token);
  const requestSnap = await db.collection("signatureRequests").where("tokenHash", "==", tokenHash).limit(1).get();

  if (requestSnap.empty) {
    return res.status(404).json({ error: "invalid token" });
  }

  const requestRef = requestSnap.docs[0].ref;
  const signaturePngBytes = dataUrlToBytes(signatureDataUrl);

  const transactionResult = await db.runTransaction(async (tx) => {
    const freshRequest = await tx.get(requestRef);
    const requestData = freshRequest.data() as
      | {
          status: "pending" | "submitted";
          expiresAt: number;
          docId: string;
          projectId: string;
          fieldName?: string;
        }
      | undefined;

    if (!requestData || !canSubmitSignature({ status: requestData.status, expiresAt: requestData.expiresAt })) {
      throw new Error("token invalid or expired");
    }

    const documentRef = db.collection("documents").doc(requestData.docId);
    const documentSnap = await tx.get(documentRef);
    const documentData = documentSnap.data() as { currentStoragePath?: string; version?: number } | undefined;
    const currentVersion = documentData?.version ?? 1;
    const currentPath =
      documentData?.currentStoragePath ??
      `projects/${requestData.projectId}/documents/${requestData.docId}/versions/${currentVersion}.pdf`;

    const [currentPdfBytes] = await storage.file(currentPath).download();
    const signedBytes = await embedSignatureInPdf(currentPdfBytes, signaturePngBytes, requestData.fieldName);

    const newVersion = currentVersion + 1;
    const newPath = `projects/${requestData.projectId}/documents/${requestData.docId}/versions/${newVersion}.pdf`;
    await storage.file(newPath).save(Buffer.from(signedBytes), { contentType: "application/pdf" });

    tx.update(requestRef, {
      status: "submitted",
      submittedAt: FieldValue.serverTimestamp(),
      signatureMeta: { format: "png", fieldName: requestData.fieldName ?? "customerSignature" },
    });

    tx.set(
      documentRef,
      {
        version: newVersion,
        status: "signed",
        updatedAt: FieldValue.serverTimestamp(),
        currentStoragePath: newPath,
      },
      { merge: true }
    );

    tx.set(db.collection("documentVersions").doc(), {
      docId: requestData.docId,
      version: newVersion,
      storagePath: newPath,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "submitSignature",
    });

    return { newPath, newVersion };
  });

  const [pdfUrl] = await storage
    .file(transactionResult.newPath)
    .getSignedUrl({ action: "read", expires: Date.now() + 3600_000 });

  logger.info("signature submitted", { tokenHash, newPath: transactionResult.newPath, version: transactionResult.newVersion });
  return res.json({ success: true, pdfUrl, version: transactionResult.newVersion });
});
