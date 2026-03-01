import { PDFDocument } from "pdf-lib";

export function dataUrlToBytes(dataUrl: string) {
  const payload = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(Buffer.from(payload, "base64"));
}

export function signatureCoordinates(fieldName?: string) {
  // Minimal fallback mapping until template-specific coordinate metadata is introduced.
  if (fieldName === "customerSignature") {
    return { x: 360, y: 96, width: 160, height: 64 };
  }
  return { x: 50, y: 50, width: 180, height: 70 };
}

export async function embedSignatureInPdf(
  pdfBytes: Uint8Array,
  pngBytes: Uint8Array,
  fieldName?: string,
) {
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();
  const page = pages[pages.length - 1];
  const image = await pdf.embedPng(pngBytes);
  page.drawImage(image, signatureCoordinates(fieldName));
  return pdf.save();
}
