import { Injectable } from '@angular/core';
import { DEFAULT_COMPANY, DEFAULT_SERVICES, STORAGE_KEYS } from '../data/defaults';
import { CompanyConfig, Quote, QuoteDraft, QuoteLine, ServiceCatalogItem } from '../models/models';
import { isIsoDate } from '../utils/dates';
import { isMeaningfulDraft } from '../utils/draft';
import { lineSubtotal, roundMoney } from '../utils/money';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly memory = new Map<string, string>();
  private persistent = true;

  constructor() {
    try {
      const probe = '__cleaning_quote_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
    } catch {
      this.persistent = false;
    }
  }

  readServices(): ServiceCatalogItem[] {
    const raw = this.get(STORAGE_KEYS.services);
    if (raw === null) {
      const seeded = DEFAULT_SERVICES.map((service) => ({ ...service }));
      this.writeServices(seeded);
      return seeded;
    }
    const parsed = this.parseJson(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeService).filter((service): service is ServiceCatalogItem => service !== null);
  }

  writeServices(services: ServiceCatalogItem[]): void {
    this.set(STORAGE_KEYS.services, JSON.stringify(services));
  }

  readQuotes(): Quote[] {
    const raw = this.get(STORAGE_KEYS.quotes);
    if (raw === null) {
      return [];
    }
    const parsed = this.parseJson(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeQuote)
      .filter((quote): quote is Quote => quote !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  writeQuotes(quotes: Quote[]): void {
    this.set(STORAGE_KEYS.quotes, JSON.stringify(quotes));
  }

  readCompany(): CompanyConfig {
    const raw = this.get(STORAGE_KEYS.company);
    if (raw === null) {
      const seeded = { ...DEFAULT_COMPANY };
      this.writeCompany(seeded);
      return seeded;
    }
    const parsed = this.parseJson(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_COMPANY };
    }
    return normalizeCompany(parsed as Partial<CompanyConfig>);
  }

  writeCompany(company: CompanyConfig): void {
    this.set(STORAGE_KEYS.company, JSON.stringify(company));
  }

  readDraft(): QuoteDraft | null {
    const raw = this.get(STORAGE_KEYS.draft);
    if (raw === null) {
      return null;
    }
    const parsed = this.parseJson(raw);
    const draft = normalizeDraft(parsed);
    return isMeaningfulDraft(draft) ? draft : null;
  }

  writeDraft(draft: QuoteDraft): void {
    this.set(STORAGE_KEYS.draft, JSON.stringify(draft));
  }

  clearDraft(): void {
    this.remove(STORAGE_KEYS.draft);
  }

  nextQuoteNumber(existing: Quote[]): string {
    const stored = Number(this.get(STORAGE_KEYS.sequence) ?? '0');
    const fromQuotes = existing.reduce((max, quote) => {
      const value = Number(quote.number.replace(/\D/g, ''));
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    const next = Math.max(Number.isFinite(stored) ? stored : 0, fromQuotes) + 1;
    this.set(STORAGE_KEYS.sequence, String(next));
    return `COT-${String(next).padStart(6, '0')}`;
  }

  private get(key: string): string | null {
    try {
      if (this.persistent) {
        return localStorage.getItem(key);
      }
    } catch {
      this.persistent = false;
    }
    return this.memory.get(key) ?? null;
  }

  private set(key: string, value: string): void {
    try {
      if (this.persistent) {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      this.persistent = false;
    }
    this.memory.set(key, value);
  }

  private remove(key: string): void {
    try {
      if (this.persistent) {
        localStorage.removeItem(key);
      }
    } catch {
      this.persistent = false;
    }
    this.memory.delete(key);
  }

  private parseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

function normalizeService(value: unknown): ServiceCatalogItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Partial<ServiceCatalogItem>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.unit !== 'string') {
    return null;
  }
  const price = Number(record.price);
  if (!Number.isFinite(price) || price < 0) {
    return null;
  }
  return {
    id: record.id,
    name: record.name,
    unit: record.unit,
    price: roundMoney(price),
    category: typeof record.category === 'string' ? record.category : '',
    active: record.active !== false,
  };
}

function normalizeLine(value: unknown): QuoteLine | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Partial<QuoteLine>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.unit !== 'string') {
    return null;
  }
  const unitPrice = Number(record.unitPrice);
  const quantity = Number(record.quantity);
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }
  const price = roundMoney(unitPrice);
  const qty = roundMoney(quantity);
  return {
    id: record.id,
    serviceId: typeof record.serviceId === 'string' ? record.serviceId : record.id,
    name: record.name,
    unit: record.unit,
    unitPrice: price,
    quantity: qty,
    category: typeof record.category === 'string' ? record.category : '',
    subtotal: lineSubtotal(price, qty),
  };
}

function normalizeQuote(value: unknown): Quote | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Partial<Quote>;
  if (typeof record.id !== 'string' || typeof record.number !== 'string' || typeof record.clientName !== 'string') {
    return null;
  }
  if (typeof record.date !== 'string' || typeof record.address !== 'string' || !Array.isArray(record.lines)) {
    return null;
  }
  const lines = record.lines.map(normalizeLine).filter((line): line is QuoteLine => line !== null);
  return {
    id: record.id,
    number: record.number,
    clientName: record.clientName,
    date: record.date,
    address: record.address,
    lines,
    total: roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0)),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.date,
  };
}

function normalizeCompany(value: Partial<CompanyConfig>): CompanyConfig {
  const text = (field: keyof CompanyConfig, fallback: string) =>
    typeof value[field] === 'string' ? String(value[field]) : fallback;

  return {
    name: text('name', DEFAULT_COMPANY.name),
    tagline: text('tagline', DEFAULT_COMPANY.tagline),
    logoDataUrl: typeof value.logoDataUrl === 'string' && value.logoDataUrl.startsWith('data:image/')
      ? value.logoDataUrl
      : null,
    address: text('address', ''),
    phone: text('phone', ''),
    mobile: text('mobile', ''),
    whatsapp: text('whatsapp', ''),
    email: text('email', ''),
    website: text('website', ''),
    footerNote: text('footerNote', DEFAULT_COMPANY.footerNote),
  };
}

function normalizeDraft(value: unknown): QuoteDraft | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Partial<QuoteDraft>;
  const lines = Array.isArray(record.lines)
    ? record.lines.map(normalizeLine).filter((line): line is QuoteLine => line !== null)
    : [];
  const date = typeof record.date === 'string' && isIsoDate(record.date) ? record.date : '';
  return {
    clientName: typeof record.clientName === 'string' ? record.clientName : '',
    date,
    address: typeof record.address === 'string' ? record.address : '',
    lines,
    step: record.step === 'catalog' ? 'catalog' : 'client',
  };
}
