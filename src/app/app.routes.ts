import { Routes } from '@angular/router';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cotizar' },
  {
    path: 'cotizar',
    loadComponent: () => import('./features/quote/quote-page.component').then((m) => m.QuotePageComponent),
    title: 'Cotizar',
  },
  {
    path: 'historial',
    loadComponent: () => import('./features/history/history-page.component').then((m) => m.HistoryPageComponent),
    title: 'Historial',
  },
  {
    path: 'historial/:id',
    loadComponent: () =>
      import('./features/history/quote-detail-page.component').then((m) => m.QuoteDetailPageComponent),
    title: 'Cotización',
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./features/settings/settings-page.component').then((m) => m.SettingsPageComponent),
    title: 'Configuración',
  },
  { path: '**', redirectTo: 'cotizar' },
];
