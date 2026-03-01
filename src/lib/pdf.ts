import { PDFDocument } from "pdf-lib";

export async function embedSignatureInPdf(pdfBytes: Uint8Array, pngBytes: Uint8Array) {
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();
  const page = pages[pages.length - 1];
  const image = await pdf.embedPng(pngBytes);
  page.drawImage(image, { x: 50, y: 50, width: 180, height: 70 });
  return pdf.save();
}

export function dataUrlToBytes(dataUrl: string) {
  const payload = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(Buffer.from(payload, "base64"));
}
