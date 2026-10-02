import { Component, computed, inject, signal } from '@angular/core';
import { ServiceCatalogItem } from '../../core/models/models';
import { SUGGESTED_CATEGORIES, SUGGESTED_UNITS } from '../../core/data/defaults';
import { CatalogService } from '../../core/services/catalog.service';
import { formatBs, formatEditableNumber, parseDecimal } from '../../core/utils/money';

@Component({
  selector: 'app-price-settings',
  standalone: true,
  templateUrl: './price-settings.component.html',
})
export class PriceSettingsComponent {
  private readonly catalog = inject(CatalogService);

  readonly services = this.catalog.services;
  readonly money = formatBs;
  readonly mode = signal<'closed' | 'create' | 'edit'>('closed');
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly unit = signal('m²');
  readonly price = signal('');
  readonly category = signal('');
  readonly active = signal(true);
  readonly formError = signal('');
  readonly pendingDeleteId = signal<string | null>(null);

  readonly categorySuggestions = computed(() => {
    const names = new Set<string>(SUGGESTED_CATEGORIES);
    for (const service of this.services()) {
      const category = service.category.trim();
      if (category) {
        names.add(category);
      }
    }
    return [...names];
  });

  readonly unitSuggestions = computed(() => {
    const units = new Set<string>(SUGGESTED_UNITS);
    for (const service of this.services()) {
      const unit = service.unit.trim();
      if (unit) {
        units.add(unit);
      }
    }
    return [...units];
  });

  openCreate(): void {
    this.mode.set('create');
    this.editingId.set(null);
    this.name.set('');
    this.unit.set('m²');
    this.price.set('');
    this.category.set('');
    this.active.set(true);
    this.formError.set('');
  }

  openEdit(service: ServiceCatalogItem): void {
    this.mode.set('edit');
    this.editingId.set(service.id);
    this.name.set(service.name);
    this.unit.set(service.unit);
    this.price.set(formatEditableNumber(service.price));
    this.category.set(service.category);
    this.active.set(service.active);
    this.formError.set('');
    this.pendingDeleteId.set(null);
  }

  closeForm(): void {
    this.mode.set('closed');
    this.formError.set('');
  }

  setName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  setUnit(event: Event): void {
    this.unit.set((event.target as HTMLInputElement).value);
  }

  setPrice(event: Event): void {
    this.price.set((event.target as HTMLInputElement).value);
  }

  setCategory(event: Event): void {
    this.category.set((event.target as HTMLInputElement).value);
  }

  setActive(event: Event): void {
    this.active.set((event.target as HTMLInputElement).checked);
  }

  save(event: Event): void {
    event.preventDefault();
    const name = this.name().trim();
    const unit = this.unit().trim();
    const price = parseDecimal(this.price());
    if (!name) {
      this.formError.set('Escribe el nombre del servicio.');
      return;
    }
    if (!unit) {
      this.formError.set('Indica la unidad.');
      return;
    }
    if (price === null) {
      this.formError.set(this.price().trim().startsWith('-') ? 'El precio no puede ser negativo.' : 'Escribe un precio válido.');
      return;
    }
    if (price < 0) {
      this.formError.set('El precio no puede ser negativo.');
      return;
    }

    const input = {
      name,
      unit,
      price,
      category: this.category().trim(),
      active: this.active(),
    };
    const editingId = this.editingId();
    if (this.mode() === 'edit' && editingId) {
      this.catalog.update(editingId, input);
    } else {
      this.catalog.add(input);
    }
    this.closeForm();
  }

  remove(id: string): void {
    this.catalog.remove(id);
    this.pendingDeleteId.set(null);
    if (this.editingId() === id) {
      this.closeForm();
    }
  }
}
