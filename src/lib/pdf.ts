import { PDFDocument } from "pdf-lib";

const DEFAULT_SIGNATURE_BOX = { x: 50, y: 50, width: 180, height: 70 };
const SIGNATURE_FIELD_MAP: Record<string, { x: number; y: number; width: number; height: number }> = {
  customerSignature: DEFAULT_SIGNATURE_BOX,
};

export async function embedSignatureInPdf(
  pdfBytes: Uint8Array,
  pngBytes: Uint8Array,
  fieldName = "customerSignature"
) {
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();
  const page = pages[pages.length - 1];
  const image = await pdf.embedPng(pngBytes);
  const box = SIGNATURE_FIELD_MAP[fieldName] ?? DEFAULT_SIGNATURE_BOX;

  page.drawImage(image, box);
  return pdf.save();
}

export function dataUrlToBytes(dataUrl: string) {
  const [header, payload] = dataUrl.split(",");
  if (!header?.startsWith("data:image/png;base64") || !payload) {
    throw new Error("signatureDataUrl must be a PNG data URL");
  }
  return Uint8Array.from(Buffer.from(payload, "base64"));
}
