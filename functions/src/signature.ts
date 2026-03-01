import { createHash, randomBytes } from "node:crypto";

export type RequestStatus = "pending" | "submitted" | "expired";

export function createSignatureToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isExpired(expiresAtMs: number, nowMs = Date.now()): boolean {
  return nowMs >= expiresAtMs;
}

export function assertPendingAndValid(status: RequestStatus, expiresAtMs: number): void {
  if (status !== "pending") {
    throw new Error("token already used");
  }
  if (isExpired(expiresAtMs)) {
    throw new Error("token expired");
  }
}
