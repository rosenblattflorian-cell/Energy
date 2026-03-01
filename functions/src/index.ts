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
  const { projectId, docId } = req.body;
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

  res.json({ url, qrDataUrl: await QRCode.toDataURL(url), expiresAt });
});

export const submitSignature = onRequest(async (req, res) => {
  const { token, signatureDataUrl } = req.body;
  const db = getFirestore();
  const tokenHash = hashToken(token);
  const requestSnap = await db.collection("signatureRequests").where("tokenHash", "==", tokenHash).limit(1).get();

  if (requestSnap.empty) return res.status(404).json({ error: "invalid token" });
  const doc = requestSnap.docs[0];
  const data = doc.data() as any;
  if (!canSubmitSignature({ status: data.status, expiresAt: data.expiresAt })) {
    return res.status(400).json({ error: "token invalid or expired" });
  }

  const storage = getStorage().bucket();
  const currentPath = data.currentStoragePath ?? `projects/${data.projectId}/documents/${data.docId}/versions/1.pdf`;
  const currentBytes = await storage.file(currentPath).download();
  const signedBytes = await embedSignatureInPdf(currentBytes[0], dataUrlToBytes(signatureDataUrl));

  const newVersion = (data.version ?? 1) + 1;
  const newPath = `projects/${data.projectId}/documents/${data.docId}/versions/${newVersion}.pdf`;
  await storage.file(newPath).save(Buffer.from(signedBytes), { contentType: "application/pdf" });

  await db.runTransaction(async (tx) => {
    tx.update(doc.ref, {
      status: "submitted",
      submittedAt: FieldValue.serverTimestamp(),
      signatureMeta: { format: "png" },
    });
    const documentRef = db.collection("documents").doc(data.docId);
    tx.set(documentRef, {
      version: newVersion,
      status: "signed",
      updatedAt: FieldValue.serverTimestamp(),
      currentStoragePath: newPath,
    }, { merge: true });
    tx.set(db.collection("documentVersions").doc(), {
      docId: data.docId,
      version: newVersion,
      storagePath: newPath,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "submitSignature",
    });
  });

  const [pdfUrl] = await storage.file(newPath).getSignedUrl({ action: "read", expires: Date.now() + 3600_000 });
  logger.info("signature submitted", { docId: data.docId, newPath });
  res.json({ success: true, pdfUrl });
});
