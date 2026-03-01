import { createHash, randomBytes } from "crypto";

export type SignatureRequestState = "pending" | "submitted";

export function createSignatureToken() {
  return randomBytes(24).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isExpired(expiresAtMs: number, nowMs = Date.now()) {
  return nowMs > expiresAtMs;
}

export function canSubmit(status: SignatureRequestState, expiresAtMs: number, nowMs = Date.now()) {
  return status === "pending" && !isExpired(expiresAtMs, nowMs);
}
