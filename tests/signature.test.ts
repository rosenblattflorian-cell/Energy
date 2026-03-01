import { describe, expect, it } from "vitest";
import { canSubmitSignature, hashToken, isTokenExpired } from "@/lib/signature";

describe("signature token logic", () => {
  it("hashes token deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("fails when expired", () => {
    expect(isTokenExpired(1000, 1001)).toBe(true);
    expect(canSubmitSignature({ status: "pending", expiresAt: 1000 }, 1001)).toBe(false);
  });
});
