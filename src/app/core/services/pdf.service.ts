import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CompanyConfig, Quote } from '../models/models';
import { formatDisplayDate } from '../utils/dates';
import { formatBs, formatQty } from '../utils/money';
import { CompanyService } from './company.service';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly companyService = inject(CompanyService);

  download(quote: Quote): void {
    const company = this.companyService.config();
    const doc = this.build(quote, company);
    doc.save(fileName(quote));
  }

  private build(quote: Quote, company: CompanyConfig): jsPDF {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const teal: [number, number, number] = [11, 107, 102];
    const ink: [number, number, number] = [19, 36, 33];
    const muted: [number, number, number] = [90, 110, 106];
    const line: [number, number, number] = [217, 229, 225];
    const soft: [number, number, number] = [228, 243, 241];
    const gold: [number, number, number] = [184, 110, 18];

    doc.setProperties({
      title: `Cotización ${quote.number}`,
      subject: quote.clientName,
      creator: company.name || 'Cotizador',
    });

    let y = drawLetterhead(doc, company, pageWidth, margin, teal, gold, ink, muted);

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
    doc.setTextColor(...teal);
    doc.text('DETALLE DE SERVICIOS', margin, y);
    y += 4;

    const columns = [
      { title: 'Servicio', width: 74, align: 'left' as const },
      { title: 'Cantidad', width: 24, align: 'right' as const },
      { title: 'Unidad', width: 28, align: 'left' as const },
      { title: 'Precio', width: 26, align: 'right' as const },
      { title: 'Subtotal', width: 30, align: 'right' as const },
    ];

    const drawHeader = () => {
      doc.setFillColor(...soft);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...teal);
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
      doc.setTextColor(...teal);
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
        formatBs(item.unitPrice),
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
    doc.setFillColor(...teal);
    doc.roundedRect(totalX, y, totalWidth, 22, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL', totalX + 5, y + 8);
    doc.setFontSize(16);
    doc.text(formatBs(quote.total), totalX + totalWidth - 5, y + 16, { align: 'right' });

    const pages = doc.getNumberOfPages();
    const footer = (company.footerNote || company.name || 'Gracias por confiar en nuestros servicios.').trim();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setFillColor(...teal);
      doc.rect(0, 287, pageWidth, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
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
  teal: [number, number, number],
  gold: [number, number, number],
  ink: [number, number, number],
  muted: [number, number, number],
): number {
  doc.setFillColor(...teal);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, 38, pageWidth, 2.2, 'F');

  let textX = margin;
  if (company.logoDataUrl) {
    try {
      const format = imageFormat(company.logoDataUrl);
      doc.addImage(company.logoDataUrl, format, margin, 8, 22, 22);
      textX = margin + 26;
    } catch {
      textX = margin;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const name = company.name || 'Servicios de limpieza';
  const nameWidth = pageWidth - textX - margin;
  doc.text((doc.splitTextToSize(name, nameWidth) as string[])[0] ?? name, textX, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const tagline = company.tagline || 'Servicio de limpieza';
  doc.text((doc.splitTextToSize(tagline, nameWidth) as string[])[0] ?? tagline, textX, 24);

  const contacts = [
    company.address,
    company.phone ? `Tel. ${company.phone}` : '',
    company.mobile ? `Cel. ${company.mobile}` : '',
    company.whatsapp ? `WhatsApp ${company.whatsapp}` : '',
    company.email,
    company.website,
  ].filter((value) => value.trim().length > 0);

  let y = 48;
  if (contacts.length > 0) {
    doc.setTextColor(...muted);
    doc.setFontSize(9);
    const contactLines = doc.splitTextToSize(contacts.join('   ·   '), pageWidth - margin * 2) as string[];
    doc.text(contactLines, margin, y);
    y += contactLines.length * 4.5 + 6;
  } else {
    y += 2;
  }

  doc.setTextColor(...ink);
  return y;
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
