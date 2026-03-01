import { createHash, randomBytes } from "crypto";

export type SignatureRequestRecord = {
  status: "pending" | "submitted";
  expiresAt: number;
  submittedAt?: number;
};

export function createSignatureToken() {
  return randomBytes(24).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isTokenExpired(expiresAt: number, now = Date.now()) {
  return now > expiresAt;
}

export function canSubmitSignature(record: SignatureRequestRecord, now = Date.now()) {
  return record.status === "pending" && !isTokenExpired(record.expiresAt, now);
}
