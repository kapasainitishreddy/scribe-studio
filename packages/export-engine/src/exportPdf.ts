import { paginateScreenplay, PAGE, type PaginationOptions } from "../../screenplay-core/src/screenplayFormat";

const POINTS_PER_INCH = 72;
const FONT_SIZE = 12;
const LINE_HEIGHT = POINTS_PER_INCH / PAGE.linesPerInch; // 12pt
const CHAR_WIDTH = POINTS_PER_INCH / PAGE.charactersPerInch; // 7.2pt Courier 12pt

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export interface PdfExportOptions extends PaginationOptions {
  pageNumbers?: boolean;
  header?: string;
  footer?: string;
}

export function buildScreenplayPdf(document: string, options: PdfExportOptions = {}): Uint8Array {
  const pages = paginateScreenplay(document, options);
  const pageWidth = PAGE.widthInches * POINTS_PER_INCH;
  const pageHeight = PAGE.heightInches * POINTS_PER_INCH;
  const leftEdge = PAGE.leftMarginInches * POINTS_PER_INCH;
  const topBaseline = pageHeight - PAGE.topMarginInches * POINTS_PER_INCH - FONT_SIZE;

  const contents = pages.map((page) => {
    const commands: string[] = ["BT", `/F1 ${FONT_SIZE} Tf`, `${LINE_HEIGHT} TL`];
    if (options.pageNumbers !== false && page.number > 0) {
      const label = `${page.number}.`;
      const x = pageWidth - PAGE.rightMarginInches * POINTS_PER_INCH - label.length * CHAR_WIDTH;
      commands.push(
        `1 0 0 1 ${x.toFixed(2)} ${(pageHeight - PAGE.topMarginInches * POINTS_PER_INCH + LINE_HEIGHT / 2).toFixed(2)} Tm`,
        `(${escapePdfText(label)}) Tj`
      );
    }
    if (options.header) {
      commands.push(
        `1 0 0 1 ${leftEdge.toFixed(2)} ${(pageHeight - PAGE.topMarginInches * POINTS_PER_INCH + LINE_HEIGHT / 2).toFixed(2)} Tm`,
        `(${escapePdfText(options.header)}) Tj`
      );
    }
    commands.push(`1 0 0 1 ${leftEdge.toFixed(2)} ${topBaseline.toFixed(2)} Tm`);
    page.lines.forEach((line, index) => {
      if (index > 0) commands.push("T*");
      if (line.text.trim()) commands.push(`(${escapePdfText(line.text)}) Tj`);
    });
    if (options.footer) {
      const y = PAGE.bottomMarginInches * POINTS_PER_INCH - LINE_HEIGHT;
      commands.push(`1 0 0 1 ${leftEdge.toFixed(2)} ${y.toFixed(2)} Tm`, `(${escapePdfText(options.footer)}) Tj`);
    }
    commands.push("ET");
    return commands.join("\n");
  });

  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  pages.forEach((_, index) => {
    const contentId = pageObjectIds[index] + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    objects.push(`<< /Length ${contents[index].length} >>\nstream\n${contents[index]}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff;
  }
  return bytes;
}
