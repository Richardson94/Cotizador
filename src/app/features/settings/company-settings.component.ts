import { Component, inject, signal } from '@angular/core';
import { CompanyService } from '../../core/services/company.service';
import { resizeImageFile } from '../../core/utils/image';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  templateUrl: './company-settings.component.html',
})
export class CompanySettingsComponent {
  private readonly company = inject(CompanyService);

  readonly name = signal('');
  readonly tagline = signal('');
  readonly logo = signal<string | null>(null);
  readonly address = signal('');
  readonly phone = signal('');
  readonly mobile = signal('');
  readonly whatsapp = signal('');
  readonly email = signal('');
  readonly website = signal('');
  readonly footerNote = signal('');
  readonly logoError = signal('');
  readonly savedMessage = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    const config = this.company.config();
    this.name.set(config.name);
    this.tagline.set(config.tagline);
    this.logo.set(config.logoDataUrl);
    this.address.set(config.address);
    this.phone.set(config.phone);
    this.mobile.set(config.mobile);
    this.whatsapp.set(config.whatsapp);
    this.email.set(config.email);
    this.website.set(config.website);
    this.footerNote.set(config.footerNote);
  }

  setText(field: 'name' | 'tagline' | 'address' | 'phone' | 'mobile' | 'whatsapp' | 'email' | 'website' | 'footerNote', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this[field].set(value);
    this.savedMessage.set('');
  }

  async onLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.logoError.set('Selecciona una imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.logoError.set('La imagen supera 5 MB.');
      return;
    }
    try {
      this.logo.set(await resizeImageFile(file));
      this.logoError.set('');
      this.savedMessage.set('');
    } catch {
      this.logoError.set('No se pudo usar esa imagen.');
    }
  }

  removeLogo(): void {
    this.logo.set(null);
    this.savedMessage.set('');
  }

  save(event: Event): void {
    event.preventDefault();
    this.company.save({
      name: this.name(),
      tagline: this.tagline(),
      logoDataUrl: this.logo(),
      address: this.address(),
      phone: this.phone(),
      mobile: this.mobile(),
      whatsapp: this.whatsapp(),
      email: this.email(),
      website: this.website(),
      footerNote: this.footerNote(),
    });
    this.savedMessage.set('Datos guardados en este dispositivo.');
  }
}
