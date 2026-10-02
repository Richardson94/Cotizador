import { QuoteLine, ServiceCatalogItem, ServiceGroup } from '../models/models';
import { createId } from './id';

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineSubtotal(unitPrice: number, quantity: number): number {
  return roundMoney(roundMoney(unitPrice) * roundMoney(quantity));
}

export function quoteTotal(lines: QuoteLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));
}

export function formatQty(value: number): string {
  return roundMoney(value).toLocaleString('es-BO', { maximumFractionDigits: 2 });
}

export function formatAmount(value: number): string {
  const rounded = roundMoney(value);
  return rounded.toLocaleString('es-BO', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatBs(value: number): string {
  return `Bs ${formatAmount(value)}`;
}

export function formatEditableNumber(value: number): string {
  const rounded = roundMoney(value);
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
}

export function parseDecimal(raw: string): number | null {
  let cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (cleaned.startsWith('.')) {
    cleaned = `0${cleaned}`;
  }
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    return null;
  }
  return roundMoney(value);
}

export function buildQuoteLine(service: ServiceCatalogItem, quantity: number, id = createId()): QuoteLine {
  const qty = roundMoney(quantity);
  const unitPrice = roundMoney(service.price);
  return {
    id,
    serviceId: service.id,
    name: service.name,
    unit: service.unit,
    unitPrice,
    quantity: qty,
    category: service.category,
    subtotal: lineSubtotal(unitPrice, qty),
  };
}

export function groupByCategory(items: ServiceCatalogItem[]): ServiceGroup[] {
  const groups: ServiceGroup[] = [];
  const index = new Map<string, ServiceGroup>();

  for (const item of items) {
    const category = item.category.trim() || 'Otros';
    let group = index.get(category);
    if (!group) {
      group = { category, items: [] };
      index.set(category, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

export function lineFormula(line: QuoteLine): string {
  return `${formatQty(line.quantity)} ${line.unit} × ${formatBs(line.unitPrice)}`;
}
