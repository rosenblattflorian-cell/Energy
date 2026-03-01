import { PDFDocument } from "pdf-lib";

export function dataUrlToPngBytes(dataUrl: string): Uint8Array {
  if (!dataUrl.startsWith("data:image/png;base64,")) {
    throw new Error("signature must be png data url");
  }
  const payload = dataUrl.split(",")[1];
  if (!payload) {
    throw new Error("invalid signature payload");
  }
  return Uint8Array.from(Buffer.from(payload, "base64"));
}

export async function embedSignature(
  originalPdfBytes: Uint8Array,
  signaturePngBytes: Uint8Array,
  fieldName?: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(originalPdfBytes);
  const pages = pdf.getPages();
  const page = pages[pages.length - 1];

  const image = await pdf.embedPng(signaturePngBytes);
  const placement = getPlacement(fieldName, page.getWidth(), page.getHeight());

  page.drawImage(image, placement);
  return pdf.save();
}

function getPlacement(fieldName: string | undefined, pageWidth: number, pageHeight: number) {
  const presets: Record<string, { x: number; y: number; width: number; height: number }> = {
    customerSignature: { x: 80, y: 90, width: 180, height: 70 },
  };

  return (
    (fieldName ? presets[fieldName] : undefined) ?? {
      x: Math.max(48, pageWidth - 260),
      y: 80,
      width: 180,
      height: 70,
    }
  );
}
