import { createHash, randomBytes } from "crypto";

export type SignatureRequestStatus = "pending" | "processing" | "submitted";

export function createSignatureToken() {
  return randomBytes(24).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isTokenExpired(expiresAt: number, now = Date.now()) {
  return now > expiresAt;
}

export function assertSubmittable(status: string, expiresAt: number, now = Date.now()) {
  if (status !== "pending") {
    throw new Error("token already used");
  }
  if (isTokenExpired(expiresAt, now)) {
    throw new Error("token expired");
  }
}
