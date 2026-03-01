import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { dataUrlToBytes, embedSignatureInPdf } from "@/lib/pdf";

describe("pdf signing helper", () => {
  it("embeds png bytes in pdf", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const base = await doc.save();
    const png = dataUrlToBytes(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+XxjVfQAAAABJRU5ErkJggg=="
    );
    const signed = await embedSignatureInPdf(base, png);
    expect(signed.length).toBeGreaterThan(base.length);
  });
});
