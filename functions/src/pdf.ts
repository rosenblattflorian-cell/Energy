import { PDFDocument } from "pdf-lib";

export function parseDataUrlPngBytes(signatureDataUrl: string) {
  const [meta, payload] = signatureDataUrl.split(",");
  if (!meta?.startsWith("data:image/png;base64") || !payload) {
    throw new Error("Signature must be a PNG data URL");
  }
  return Uint8Array.from(Buffer.from(payload, "base64"));
}

export async function embedSignatureInPdf(options: {
  pdfBytes: Uint8Array;
  pngBytes: Uint8Array;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const { pdfBytes, pngBytes, x = 50, y = 50, width = 180, height = 70 } = options;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  if (pages.length === 0) {
    throw new Error("PDF has no pages");
  }

  const page = pages[pages.length - 1];
  const signatureImage = await pdfDoc.embedPng(pngBytes);
  page.drawImage(signatureImage, { x, y, width, height });

  return pdfDoc.save();
}
