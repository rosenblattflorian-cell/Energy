import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import QRCode from "qrcode";
import { canSubmit, createSignatureToken, hashToken } from "./signature";
import { embedSignatureInPdf, parseDataUrlPngBytes } from "./pdf";

initializeApp();

const SIGNATURE_TTL_MS = 10 * 60 * 1000;

function parseTimestampMs(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export const createSignatureRequest = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { projectId, docId } = req.body ?? {};
  if (!projectId || !docId) {
    res.status(400).json({ error: "projectId and docId are required" });
    return;
  }

  const authHeader = req.headers.authorization;
  const match = typeof authHeader === "string" ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  if (!match) {
    res.status(401).json({ error: "missing bearer token" });
    return;
  }

  try {
    await getAuth().verifyIdToken(match[1]);
  } catch {
    res.status(401).json({ error: "invalid bearer token" });
    return;
  }

  const documentSnap = await getFirestore().collection("documents").doc(String(docId)).get();
  if (!documentSnap.exists) {
    res.status(404).json({ error: "document not found" });
    return;
  }

  const documentProjectId = String(documentSnap.data()?.projectId ?? "");
  if (documentProjectId && documentProjectId !== String(projectId)) {
    res.status(403).json({ error: "project/document mismatch" });
    return;
  }

  const token = createSignatureToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + SIGNATURE_TTL_MS;
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

  const qrDataUrl = await QRCode.toDataURL(url);
  res.json({ success: true, url, qrDataUrl, expiresAt });
});

export const submitSignature = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { token, signatureDataUrl } = req.body ?? {};
  if (!token || !signatureDataUrl) {
    res.status(400).json({ error: "token and signatureDataUrl are required" });
    return;
  }

  const db = getFirestore();
  const tokenHash = hashToken(token);
  const match = await db
    .collection("signatureRequests")
    .where("tokenHash", "==", tokenHash)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (match.empty) {
    res.status(404).json({ error: "invalid or already used token" });
    return;
  }

  const signatureRequestRef = match.docs[0].ref;
  const signatureRequestData = match.docs[0].data();
  const expiresAtMs = parseTimestampMs(signatureRequestData.expiresAt);
  if (!canSubmit(signatureRequestData.status, expiresAtMs)) {
    res.status(400).json({ error: "token expired or not pending" });
    return;
  }

  const docId = String(signatureRequestData.docId);
  const projectId = String(signatureRequestData.projectId);
  const documentRef = db.collection("documents").doc(docId);
  const documentSnap = await documentRef.get();

  if (!documentSnap.exists) {
    res.status(404).json({ error: "document not found" });
    return;
  }

  const reservation = await db.runTransaction(async (tx) => {
    const reqSnap = await tx.get(signatureRequestRef);
    const reqData = reqSnap.data();
    if (!reqData) {
      throw new Error("signature request missing");
    }

    const stillExpiresAt = parseTimestampMs(reqData.expiresAt);
    if (!canSubmit(reqData.status, stillExpiresAt)) {
      throw new Error("token no longer valid");
    }

    const txDocumentSnap = await tx.get(documentRef);
    if (!txDocumentSnap.exists) {
      throw new Error("document not found");
    }

    const documentData = txDocumentSnap.data() ?? {};
    const currentVersion = Number(documentData.version ?? 1);
    const nextVersion = Number(documentData.nextVersion ?? currentVersion + 1);
    const reservedVersion = Math.max(currentVersion + 1, nextVersion);
    const sourceStoragePath =
      typeof documentData.currentStoragePath === "string"
        ? documentData.currentStoragePath
        : `projects/${projectId}/documents/${docId}/versions/${currentVersion}.pdf`;
    const reservedStoragePath = `projects/${projectId}/documents/${docId}/versions/${reservedVersion}.pdf`;

    tx.update(documentRef, {
      nextVersion: reservedVersion + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(signatureRequestRef, {
      status: "processing",
      reservedVersion,
      reservedStoragePath,
      sourceStoragePath,
      processingStartedAt: FieldValue.serverTimestamp(),
    });

    return {
      sourceStoragePath,
      reservedStoragePath,
      reservedVersion,
    };
  });

  const bucket = getStorage().bucket();
  const [originalPdf] = await bucket.file(reservation.sourceStoragePath).download();
  const pngBytes = parseDataUrlPngBytes(String(signatureDataUrl));

  const signedPdf = await embedSignatureInPdf({
    pdfBytes: originalPdf,
    pngBytes,
    x: 50,
    y: 50,
    width: 180,
    height: 70,
  });

  await bucket.file(reservation.reservedStoragePath).save(Buffer.from(signedPdf), {
    contentType: "application/pdf",
    resumable: false,
    preconditionOpts: { ifGenerationMatch: 0 },
  });

  await db.runTransaction(async (tx) => {
    const reqSnap = await tx.get(signatureRequestRef);
    const reqData = reqSnap.data();
    if (!reqData) {
      throw new Error("signature request missing");
    }

    if (reqData.status !== "processing") {
      throw new Error("signature request is not reserved for processing");
    }

    if (
      Number(reqData.reservedVersion) !== reservation.reservedVersion ||
      String(reqData.reservedStoragePath ?? "") !== reservation.reservedStoragePath
    ) {
      throw new Error("signature request reservation mismatch");
    }

    const txDocumentSnap = await tx.get(documentRef);
    const txDocumentData = txDocumentSnap.data() ?? {};
    const txCurrentVersion = Number(txDocumentData.version ?? 1);

    if (txCurrentVersion >= reservation.reservedVersion) {
      throw new Error("document has advanced past reserved version");
    }

    tx.update(signatureRequestRef, {
      status: "submitted",
      submittedAt: FieldValue.serverTimestamp(),
      signatureMeta: {
        format: "png",
        width: 180,
        height: 70,
        x: 50,
        y: 50,
      },
      signedStoragePath: reservation.reservedStoragePath,
    });

    tx.set(
      documentRef,
      {
        version: reservation.reservedVersion,
        status: "signed",
        updatedAt: FieldValue.serverTimestamp(),
        currentStoragePath: reservation.reservedStoragePath,
      },
      { merge: true },
    );

    tx.set(db.collection("documentVersions").doc(), {
      docId,
      projectId,
      version: reservation.reservedVersion,
      storagePath: reservation.reservedStoragePath,
      sourceStoragePath: reservation.sourceStoragePath,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "submitSignature",
      kind: "signed",
    });
  });

  const [pdfUrl] = await bucket.file(reservation.reservedStoragePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });

  logger.info("Signature submitted", { docId, projectId, version: reservation.reservedVersion });
  res.json({ success: true, pdfUrl, version: reservation.reservedVersion });
});
