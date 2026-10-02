import { Injectable, inject, signal } from '@angular/core';
import { CompanyConfig } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly storage = inject(StorageService);
  readonly config = signal<CompanyConfig>(this.storage.readCompany());

  save(config: CompanyConfig): void {
    const next: CompanyConfig = {
      ...config,
      name: config.name.trim(),
      tagline: config.tagline.trim(),
      address: config.address.trim(),
      phone: config.phone.trim(),
      mobile: config.mobile.trim(),
      whatsapp: config.whatsapp.trim(),
      email: config.email.trim(),
      website: config.website.trim(),
      footerNote: config.footerNote.trim(),
    };
    this.config.set(next);
    this.storage.writeCompany(next);
  }
}
