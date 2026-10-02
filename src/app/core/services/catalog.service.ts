import { Injectable, inject, signal } from '@angular/core';
import { ServiceCatalogItem } from '../models/models';
import { createId } from '../utils/id';
import { roundMoney } from '../utils/money';
import { StorageService } from './storage.service';

export interface ServiceInput {
  name: string;
  unit: string;
  price: number;
  category: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly storage = inject(StorageService);
  readonly services = signal<ServiceCatalogItem[]>([]);

  constructor() {
    this.services.set(this.storage.readServices());
  }

  add(input: ServiceInput): ServiceCatalogItem {
    const item: ServiceCatalogItem = {
      id: createId(),
      name: input.name.trim(),
      unit: input.unit.trim(),
      price: roundMoney(input.price),
      category: input.category.trim(),
      active: input.active,
    };
    this.services.update((services) => [...services, item]);
    this.persist();
    return item;
  }

  update(id: string, input: ServiceInput): void {
    this.services.update((services) =>
      services.map((service) =>
        service.id === id
          ? {
              ...service,
              name: input.name.trim(),
              unit: input.unit.trim(),
              price: roundMoney(input.price),
              category: input.category.trim(),
              active: input.active,
            }
          : service,
      ),
    );
    this.persist();
  }

  remove(id: string): void {
    this.services.update((services) => services.filter((service) => service.id !== id));
    this.persist();
  }

  private persist(): void {
    this.storage.writeServices(this.services());
  }
}
