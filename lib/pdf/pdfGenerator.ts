
import { PDFDocument, StandardFonts } from "pdf-lib";

export async function generatePDF(project:any){
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("Solar Mitte Angebot", { x:50, y:750, size:18, font });
  page.drawText("Projekt: " + project.name, { x:50, y:720, size:12, font });

  return await pdfDoc.save();
}
