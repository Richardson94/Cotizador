import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CompanyConfig, Quote } from '../models/models';
import { formatDisplayDate } from '../utils/dates';
import { formatBs, formatQty } from '../utils/money';
import { CompanyService } from './company.service';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly companyService = inject(CompanyService);

  private logoPromise: Promise<string | null> | null = null;

  async download(quote: Quote): Promise<void> {
    const company = { ...this.companyService.config(), logoDataUrl: await this.logo() };
    const doc = this.build(quote, company);
    doc.save(fileName(quote));
  }

  private logo(): Promise<string | null> {
    this.logoPromise ??= loadLogoDataUrl();
    return this.logoPromise;
  }

  private build(quote: Quote, company: CompanyConfig): jsPDF {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const blue: [number, number, number] = [59, 120, 224];
    const ink: [number, number, number] = [27, 31, 39];
    const muted: [number, number, number] = [107, 114, 128];
    const line: [number, number, number] = [229, 231, 235];
    const soft: [number, number, number] = [234, 241, 252];

    doc.setProperties({
      title: `Cotización ${quote.number}`,
      subject: quote.clientName,
      creator: company.name || 'Cotizador',
    });

    let y = drawLetterhead(doc, company, pageWidth, margin, blue, ink, muted);

    doc.setTextColor(...ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('COTIZACIÓN', margin, y);
    doc.setFontSize(12);
    doc.text(quote.number, pageWidth - margin, y, { align: 'right' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(`Fecha: ${formatDisplayDate(quote.date)}`, pageWidth - margin, y, { align: 'right' });
    y += 8;

    doc.setDrawColor(...line);
    doc.setFillColor(247, 251, 250);
    const clientLines = doc.splitTextToSize(`Dirección: ${quote.address}`, contentWidth - 10) as string[];
    const clientBoxHeight = 16 + clientLines.length * 5;
    doc.roundedRect(margin, y, contentWidth, clientBoxHeight, 2, 2, 'FD');
    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.text('DATOS DEL CLIENTE', margin + 5, y + 6);
    doc.setTextColor(...ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(quote.clientName, margin + 5, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(clientLines, margin + 5, y + 19);
    y += clientBoxHeight + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...blue);
    doc.text('DETALLE DE SERVICIOS', margin, y);
    y += 4;

    const columns = [
      { title: 'Servicio', width: 104, align: 'left' as const },
      { title: 'Cantidad', width: 26, align: 'right' as const },
      { title: 'Unidad', width: 22, align: 'left' as const },
      { title: 'Subtotal', width: 30, align: 'right' as const },
    ];

    const drawHeader = () => {
      doc.setFillColor(...soft);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...blue);
      let x = margin;
      for (const column of columns) {
        const textX = column.align === 'right' ? x + column.width - 2 : x + 2;
        doc.text(column.title, textX, y + 5.4, { align: column.align });
        x += column.width;
      }
      y += 8;
    };

    const ensureSpace = (height: number) => {
      if (y + height <= 272) {
        return;
      }
      doc.addPage();
      y = 16;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...blue);
      doc.text(company.name || 'Cotización', margin, y);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.text(quote.number, pageWidth - margin, y, { align: 'right' });
      y += 6;
      drawHeader();
    };

    drawHeader();

    quote.lines.forEach((item, index) => {
      const nameLines = doc.splitTextToSize(item.name, columns[0].width - 4) as string[];
      const rowHeight = Math.max(9, nameLines.length * 4.4 + 4);
      ensureSpace(rowHeight + 2);
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 251, 250);
      }
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...ink);
      const values = [
        nameLines,
        formatQty(item.quantity),
        item.unit,
        formatBs(item.subtotal),
      ];
      let x = margin;
      columns.forEach((column, columnIndex) => {
        const value = values[columnIndex];
        const textX = column.align === 'right' ? x + column.width - 2 : x + 2;
        doc.text(value, textX, y + 5.5, { align: column.align });
        x += column.width;
      });
      y += rowHeight;
    });

    doc.setDrawColor(...line);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    ensureSpace(28);
    const totalWidth = 78;
    const totalX = pageWidth - margin - totalWidth;
    doc.setFillColor(...soft);
    doc.setDrawColor(...blue);
    doc.roundedRect(totalX, y, totalWidth, 22, 2, 2, 'FD');
    doc.setTextColor(...blue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL', totalX + 5, y + 8);
    doc.setFontSize(16);
    doc.text(formatBs(quote.total), totalX + totalWidth - 5, y + 16, { align: 'right' });

    const pages = doc.getNumberOfPages();
    const footer = (company.footerNote || company.name || 'Gracias por confiar en nuestros servicios.').trim();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(...line);
      doc.line(margin, 286, pageWidth - margin, 286);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      const note = (doc.splitTextToSize(footer, 150) as string[])[0] ?? '';
      doc.text(note, margin, 293);
      doc.text(`${page}/${pages}`, pageWidth - margin, 293, { align: 'right' });
    }

    return doc;
  }
}

function drawLetterhead(
  doc: jsPDF,
  company: CompanyConfig,
  pageWidth: number,
  margin: number,
  blue: [number, number, number],
  ink: [number, number, number],
  muted: [number, number, number],
): number {
  const logoWidth = 26;
  const logoHeight = logoWidth * (533 / 468);
  let textX = margin;
  let blockBottom = 28;
  if (company.logoDataUrl) {
    try {
      const format = imageFormat(company.logoDataUrl);
      doc.addImage(company.logoDataUrl, format, margin, 10, logoWidth, logoHeight);
      textX = margin + logoWidth + 4;
      blockBottom = 10 + logoHeight;
    } catch {
      textX = margin;
    }
  }

  const nameWidth = pageWidth - textX - margin;
  doc.setTextColor(...blue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const name = company.name || 'Corporación Genesis ITG';
  const nameLines = doc.splitTextToSize(name, nameWidth) as string[];
  doc.text(nameLines, textX, 16);
  let textY = 16 + nameLines.length * 5.6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  const tagline = company.tagline.trim();
  if (tagline) {
    const tagLines = doc.splitTextToSize(tagline, nameWidth) as string[];
    doc.text(tagLines, textX, textY);
    textY += tagLines.length * 4.6;
  }

  const ruleY = Math.max(blockBottom, textY) + 3;
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.6);
  doc.line(margin, ruleY, pageWidth - margin, ruleY);

  const contacts = [company.address, company.phone ? `Tel. ${company.phone}` : ''].filter(
    (value) => value.trim().length > 0,
  );

  let y = ruleY + 6;
  if (contacts.length > 0) {
    doc.setTextColor(...muted);
    doc.setFontSize(9);
    const contactLines = contacts.flatMap(
      (value) => doc.splitTextToSize(value, pageWidth - margin * 2) as string[],
    );
    doc.text(contactLines, margin, y);
    y += contactLines.length * 4.5 + 4;
  } else {
    y += 2;
  }

  doc.setTextColor(...ink);
  return y;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('assets/logo.png');
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.includes('image/png')) {
    return 'PNG';
  }
  if (dataUrl.includes('image/webp')) {
    return 'WEBP';
  }
  return 'JPEG';
}

function fileName(quote: Quote): string {
  const client = quote.clientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return client ? `${quote.number}-${client}.pdf` : `${quote.number}.pdf`;
}
