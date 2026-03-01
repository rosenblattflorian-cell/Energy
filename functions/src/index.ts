import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import QRCode from "qrcode";
import { assertPendingAndValid, createSignatureToken, hashToken } from "./signature";
import { dataUrlToPngBytes, embedSignature } from "./pdf";

initializeApp();

type SignatureRequestDoc = {
  projectId: string;
  docId: string;
  tokenHash: string;
  status: "pending" | "submitted" | "expired";
  expiresAt: Timestamp;
  createdAt: Timestamp;
  signatureField?: string;
};

type DocumentDoc = {
  projectId: string;
  storagePath: string;
  currentStoragePath?: string;
  version?: number;
};

export const createSignatureRequest = onRequest(async (req, res) => {
  try {
    const { projectId, docId, signatureField } = req.body as {
      projectId?: string;
      docId?: string;
      signatureField?: string;
    };

    if (!projectId || !docId) {
      res.status(400).json({ error: "projectId and docId are required" });
      return;
    }

    const token = createSignatureToken();
    const tokenHash = hashToken(token);
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
    const urlBase = process.env.BASE_URL ?? "http://localhost:3000";
    const url = `${urlBase}/sign/${token}`;

    await getFirestore().collection("signatureRequests").add({
      projectId,
      docId,
      tokenHash,
      status: "pending",
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      signatureField: signatureField ?? "customerSignature",
    } satisfies Partial<SignatureRequestDoc>);

    const qrDataUrl = await QRCode.toDataURL(url);
    res.json({ url, qrDataUrl, expiresAt: expiresAt.toDate().toISOString() });
  } catch (error) {
    logger.error("createSignatureRequest failed", error);
    res.status(500).json({ error: "create signature request failed" });
  }
});

export const submitSignature = onRequest(async (req, res) => {
  try {
    const { token, signatureDataUrl } = req.body as { token?: string; signatureDataUrl?: string };

    if (!token || !signatureDataUrl) {
      res.status(400).json({ error: "token and signatureDataUrl are required" });
      return;
    }

    const db = getFirestore();
    const tokenHash = hashToken(token);
    const requestSnap = await db
      .collection("signatureRequests")
      .where("tokenHash", "==", tokenHash)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (requestSnap.empty) {
      res.status(404).json({ error: "invalid signature token" });
      return;
    }

    const requestRef = requestSnap.docs[0].ref;
    const requestData = requestSnap.docs[0].data() as SignatureRequestDoc;

    assertPendingAndValid(requestData.status, requestData.expiresAt.toMillis());

    const documentRef = db.collection("documents").doc(requestData.docId);
    const documentSnap = await documentRef.get();
    if (!documentSnap.exists) {
      res.status(404).json({ error: "document not found" });
      return;
    }

    const documentData = documentSnap.data() as DocumentDoc;
    const currentVersion = documentData.version ?? 1;
    const currentPath = documentData.currentStoragePath ?? documentData.storagePath;

    if (!currentPath) {
      res.status(400).json({ error: "document storagePath missing" });
      return;
    }

    const bucket = getStorage().bucket();
    const [pdfBytes] = await bucket.file(currentPath).download();
    const signatureBytes = dataUrlToPngBytes(signatureDataUrl);
    const signedPdfBytes = await embedSignature(pdfBytes, signatureBytes, requestData.signatureField);

    const nextVersion = currentVersion + 1;
    const signedPath = `projects/${requestData.projectId}/documents/${requestData.docId}/versions/${nextVersion}.pdf`;
    const signedFile = bucket.file(signedPath);
    await signedFile.save(Buffer.from(signedPdfBytes), { contentType: "application/pdf" });

    await db.runTransaction(async (transaction) => {
      transaction.update(requestRef, {
        status: "submitted",
        submittedAt: FieldValue.serverTimestamp(),
        signatureMeta: {
          mimeType: "image/png",
          submittedAt: FieldValue.serverTimestamp(),
        },
      });

      transaction.update(documentRef, {
        version: nextVersion,
        currentStoragePath: signedPath,
        status: "signed",
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("documentVersions").doc(), {
        docId: requestData.docId,
        projectId: requestData.projectId,
        version: nextVersion,
        storagePath: signedPath,
        previousStoragePath: currentPath,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: "submitSignature",
      });
    });

    const [pdfUrl] = await signedFile.getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
    res.json({ success: true, pdfUrl, version: nextVersion });
  } catch (error) {
    logger.error("submitSignature failed", error);
    const message = error instanceof Error ? error.message : "submit signature failed";
    const statusCode = message.includes("expired") || message.includes("used") ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});
