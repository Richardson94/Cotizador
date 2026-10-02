import { CompanyConfig, ServiceCatalogItem } from '../models/models';

export const STORAGE_KEYS = {
  services: 'cleaning_quote_services',
  catalogVersion: 'cleaning_quote_catalog_version',
  quotes: 'cleaning_quotes',
  draft: 'cleaning_quote_draft',
  sequence: 'cleaning_quote_sequence',
} as const;

export const CATALOG_VERSION = '2';

function service(
  id: string,
  name: string,
  unit: string,
  price: number,
  category: string,
): ServiceCatalogItem {
  return { id, name, unit, price, category, active: true };
}

export const DEFAULT_SERVICES: ServiceCatalogItem[] = [
  service('piso-flotante', 'Tratamiento de piso flotante', 'm²', 10, 'Pisos'),
  service('piso-ceramica', 'Tratamiento de piso de cerámica', 'm²', 10, 'Pisos'),
  service('piso-madera', 'Tratamiento de piso de madera', 'm²', 10, 'Pisos'),

  service('alfombra-fija', 'Lavado de alfombras fijas', 'm²', 12, 'Alfombras'),
  service('alfombra-suelta-pequena', 'Lavado de alfombra suelta pequeña', 'unidad', 180, 'Alfombras'),
  service('alfombra-suelta-mediana', 'Lavado de alfombra suelta mediana', 'unidad', 250, 'Alfombras'),
  service('alfombra-suelta-grande', 'Lavado de alfombra suelta grande', 'unidad', 400, 'Alfombras'),
  service('alfombra-persa', 'Lavado de alfombras persas', 'm²', 50, 'Alfombras'),
  service('alfombra-china', 'Lavado de alfombras chinas', 'm²', 50, 'Alfombras'),
  service('alfombra-coco', 'Lavado de alfombra de coco original', 'm²', 50, 'Alfombras'),

  service('sillas', 'Lavado de sillas', 'unidad', 30, 'Muebles'),
  service('sillones', 'Lavado de sillones', 'cuerpo', 90, 'Muebles'),
  service('sofacama', 'Lavado de sofacama', 'unidad', 580, 'Muebles'),

  service('vidrios-interiores', 'Limpieza de vidrios interiores', 'm²', 18, 'Vidrios'),
  service('vidrios-exteriores', 'Limpieza de vidrios exteriores', 'm²', 18, 'Vidrios'),

  service('bano-con-tina', 'Limpieza de baños con tina', 'unidad', 230, 'Baños'),
  service('bano-sin-tina', 'Limpieza de baños sin tina', 'unidad', 180, 'Baños'),

  service('cocina-pequena', 'Desengrasado de cocina pequeña', 'unidad', 300, 'Cocinas'),
  service('cocina-mediana', 'Desengrasado de cocina mediana', 'unidad', 500, 'Cocinas'),
  service('cocina-grande', 'Desengrasado de cocina grande', 'unidad', 800, 'Cocinas'),

  service('cortina-gruesa', 'Lavado de cortinas gruesas', 'm²', 18, 'Cortinas'),
  service('cortina-store', 'Lavado de cortinas stores', 'm²', 8, 'Cortinas'),
  service('cortina-seda', 'Lavado de cortinas de seda', 'm²', 18, 'Cortinas'),

  service('colchon-1', 'Lavado de colchón 1 plaza', 'unidad', 380, 'Colchones'),
  service('colchon-2', 'Lavado de colchón 2 plazas', 'unidad', 500, 'Colchones'),
  service('colchon-3', 'Lavado de colchón 3 plazas', 'unidad', 800, 'Colchones'),
  service('colchon-king', 'Lavado de colchón king size', 'unidad', 1000, 'Colchones'),

  service('vehiculo-pequeno', 'Limpieza de vehículo pequeño', 'unidad', 300, 'Vehículos'),
  service('vehiculo-mediano', 'Limpieza de vehículo mediano', 'unidad', 580, 'Vehículos'),
  service('vehiculo-grande', 'Limpieza de vehículo grande', 'unidad', 1500, 'Vehículos'),

  service('fumigacion', 'Fumigación plagas y virus', 'piso', 325, 'Fumigación'),
];

export const DEFAULT_COMPANY: CompanyConfig = {
  name: 'Corporación Genesis ITG',
  tagline: 'Empresa de Servicios de Limpieza y Mantenimiento',
  logoDataUrl: null,
  address: 'Sucursal 0: Calle Juan Ondarza Nro 1575 Villa Nuevo Potosi, La Paz',
  phone: '76513333 - 72025610',
  mobile: '',
  whatsapp: '',
  email: '',
  website: '',
  footerNote: 'Gracias por confiar en nuestros servicios.',
};

export const SUGGESTED_CATEGORIES = [
  'Pisos',
  'Alfombras',
  'Muebles',
  'Vidrios',
  'Baños',
  'Cocinas',
  'Cortinas',
  'Colchones',
  'Vehículos',
  'Fumigación',
  'Otros',
];

export const SUGGESTED_UNITS = ['m²', 'unidad', 'cuerpo', 'piso'];
