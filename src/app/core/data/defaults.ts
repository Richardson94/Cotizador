import { CompanyConfig, ServiceCatalogItem } from '../models/models';

export const STORAGE_KEYS = {
  services: 'cleaning_quote_services',
  quotes: 'cleaning_quotes',
  company: 'cleaning_company_config',
  draft: 'cleaning_quote_draft',
  sequence: 'cleaning_quote_sequence',
} as const;

export const DEFAULT_SERVICES: ServiceCatalogItem[] = [
  {
    id: 'svc-suelo',
    name: 'Suelo',
    unit: 'm²',
    price: 2,
    category: 'Pisos',
    active: true,
  },
  {
    id: 'svc-ventana-pequena',
    name: 'Ventana pequeña',
    unit: 'unidad',
    price: 10,
    category: 'Ventanas',
    active: true,
  },
  {
    id: 'svc-ceramico-acrilico',
    name: 'Cerámico acrílico',
    unit: 'm²',
    price: 1,
    category: 'Pisos',
    active: true,
  },
];

export const DEFAULT_COMPANY: CompanyConfig = {
  name: 'Servicios de limpieza',
  tagline: 'Servicio de limpieza',
  logoDataUrl: null,
  address: '',
  phone: '',
  mobile: '',
  whatsapp: '',
  email: '',
  website: '',
  footerNote: 'Gracias por confiar en nuestros servicios.',
};

export const SUGGESTED_CATEGORIES = ['Pisos', 'Ventanas', 'Otros'];
export const SUGGESTED_UNITS = ['m²', 'unidad'];
