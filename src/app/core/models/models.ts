export interface ServiceCatalogItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: string;
  active: boolean;
}

export interface QuoteLine {
  id: string;
  serviceId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  category: string;
  subtotal: number;
}

export interface Quote {
  id: string;
  number: string;
  clientName: string;
  date: string;
  address: string;
  lines: QuoteLine[];
  total: number;
  createdAt: string;
}

export type QuoteStep = 'client' | 'catalog';

export interface QuoteDraft {
  clientName: string;
  date: string;
  address: string;
  lines: QuoteLine[];
  step: QuoteStep;
}

export interface CompanyConfig {
  name: string;
  tagline: string;
  logoDataUrl: string | null;
  address: string;
  phone: string;
  mobile: string;
  whatsapp: string;
  email: string;
  website: string;
  footerNote: string;
}

export interface ServiceGroup {
  category: string;
  items: ServiceCatalogItem[];
}

export interface NewQuoteInput {
  clientName: string;
  date: string;
  address: string;
  lines: QuoteLine[];
}
