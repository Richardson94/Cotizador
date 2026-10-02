import { Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Quote, ServiceCatalogItem } from '../../core/models/models';
import { CatalogService } from '../../core/services/catalog.service';
import { PdfService } from '../../core/services/pdf.service';
import { QuoteStore } from '../../core/services/quote-store.service';
import { formatDisplayDate, isIsoDate, todayIso } from '../../core/utils/dates';
import { isMeaningfulDraft } from '../../core/utils/draft';
import { buildQuoteLine, formatBs, formatQty, groupByCategory, lineFormula, lineSubtotal, quoteTotal } from '../../core/utils/money';
import { QuantityStepperComponent } from '../../shared/quantity-stepper.component';

type PageStep = 'ask' | 'client' | 'catalog' | 'success';

@Component({
  selector: 'app-quote-page',
  standalone: true,
  imports: [QuantityStepperComponent, RouterLink],
  templateUrl: './quote-page.component.html',
})
export class QuotePageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly store = inject(QuoteStore);
  private readonly pdf = inject(PdfService);
  private readonly desktopQuery = window.matchMedia('(min-width: 960px)');

  readonly step = signal<PageStep>('client');
  readonly clientName = signal('');
  readonly date = signal(todayIso());
  readonly address = signal('');
  readonly lines = signal(this.store.draft()?.lines ?? []);
  readonly expandedId = signal<string | null>(null);
  readonly expandedQty = signal(1);
  readonly cartOpen = signal(false);
  readonly clientAttempt = signal(false);
  readonly errors = signal<string[]>([]);
  readonly qtyError = signal('');
  readonly pdfError = signal('');
  readonly savedQuote = signal<Quote | null>(null);
  readonly search = signal('');
  readonly category = signal('all');
  readonly isDesktop = signal(this.desktopQuery.matches);

  readonly money = formatBs;
  readonly qty = formatQty;
  readonly dateLabel = formatDisplayDate;
  readonly formula = lineFormula;

  readonly activeServices = computed(() => this.catalog.services().filter((service) => service.active));
  readonly categories = computed(() => {
    const names: string[] = [];
    for (const service of this.activeServices()) {
      const name = service.category.trim() || 'Otros';
      if (!names.includes(name)) {
        names.push(name);
      }
    }
    return names;
  });
  readonly showSearch = computed(() => this.activeServices().length > 6);
  readonly showCategories = computed(() => this.categories().length > 1);
  readonly groups = computed(() => {
    const query = this.search().trim().toLowerCase();
    const category = this.category();
    const items = this.activeServices().filter((service) => {
      const serviceCategory = service.category.trim() || 'Otros';
      if (category !== 'all' && serviceCategory !== category) {
        return false;
      }
      if (!query) {
        return true;
      }
      return service.name.toLowerCase().includes(query) || serviceCategory.toLowerCase().includes(query);
    });
    return groupByCategory(items);
  });
  readonly total = computed(() => quoteTotal(this.lines()));
  readonly draftPreview = computed(() => this.store.draft());

  constructor() {
    const draft = this.store.draft();
    this.step.set(isMeaningfulDraft(draft) ? 'ask' : 'client');
    if (!isMeaningfulDraft(draft)) {
      this.lines.set([]);
    }

    const onChange = (event: MediaQueryListEvent) => this.isDesktop.set(event.matches);
    this.desktopQuery.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => {
      this.desktopQuery.removeEventListener('change', onChange);
      document.body.classList.remove('sheet-open');
    });

    effect(() => {
      document.body.classList.toggle('sheet-open', this.cartOpen() && !this.isDesktop() && this.step() === 'catalog');
    });
  }

  @HostListener('document:keydown.escape')
  closeCart(): void {
    this.cartOpen.set(false);
  }

  continueDraft(): void {
    const draft = this.store.draft();
    if (!draft) {
      this.startNew();
      return;
    }
    this.clientName.set(draft.clientName);
    this.date.set(draft.date || todayIso());
    this.address.set(draft.address);
    this.lines.set(draft.lines);
    this.clientAttempt.set(false);
    this.errors.set([]);
    this.step.set(draft.step === 'catalog' && this.clientErrors().length === 0 ? 'catalog' : 'client');
  }

  startNew(): void {
    this.store.clearDraft();
    this.clientName.set('');
    this.date.set(todayIso());
    this.address.set('');
    this.lines.set([]);
    this.expandedId.set(null);
    this.cartOpen.set(false);
    this.clientAttempt.set(false);
    this.errors.set([]);
    this.qtyError.set('');
    this.pdfError.set('');
    this.savedQuote.set(null);
    this.search.set('');
    this.category.set('all');
    this.step.set('client');
  }

  setClientName(event: Event): void {
    this.clientName.set((event.target as HTMLInputElement).value);
    this.persist();
  }

  setDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
    this.persist();
  }

  setAddress(event: Event): void {
    this.address.set((event.target as HTMLTextAreaElement).value);
    this.persist();
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  continueToCatalog(): void {
    this.clientAttempt.set(true);
    if (this.clientErrors().length > 0) {
      return;
    }
    this.errors.set([]);
    this.step.set('catalog');
    this.persist();
  }

  editClient(): void {
    this.step.set('client');
    this.cartOpen.set(false);
    this.persist();
  }

  clientErrors(): string[] {
    const messages: string[] = [];
    if (!this.clientName().trim()) {
      messages.push('Escribe el nombre del cliente.');
    }
    if (!isIsoDate(this.date())) {
      messages.push('Indica la fecha.');
    }
    if (!this.address().trim()) {
      messages.push('Escribe la dirección del servicio.');
    }
    return messages;
  }

  timesInCart(serviceId: string): number {
    return this.lines().filter((line) => line.serviceId === serviceId).length;
  }

  openService(service: ServiceCatalogItem): void {
    if (this.expandedId() === service.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(service.id);
    this.expandedQty.set(1);
    this.qtyError.set('');
  }

  previewSubtotal(service: ServiceCatalogItem): number {
    return lineSubtotal(service.price, this.expandedQty());
  }

  confirmAdd(service: ServiceCatalogItem): void {
    const quantity = this.expandedQty();
    if (!(quantity > 0)) {
      this.qtyError.set('La cantidad debe ser mayor que 0.');
      return;
    }
    const line = buildQuoteLine(service, quantity);
    this.lines.update((lines) => [...lines, line]);
    this.expandedId.set(null);
    this.qtyError.set('');
    this.errors.set([]);
    this.persist();
  }

  updateLineQty(id: string, quantity: number): void {
    if (!(quantity > 0)) {
      return;
    }
    this.lines.update((lines) =>
      lines.map((line) =>
        line.id === id
          ? { ...line, quantity, subtotal: lineSubtotal(line.unitPrice, quantity) }
          : line,
      ),
    );
    this.persist();
  }

  removeLine(id: string): void {
    this.lines.update((lines) => lines.filter((line) => line.id !== id));
    this.persist();
  }

  cartLabel(): string {
    const count = this.lines().length;
    return `${count} ${count === 1 ? 'servicio' : 'servicios'}`;
  }

  async generate(): Promise<void> {
    const messages = [
      ...this.clientErrors(),
      ...(this.lines().length === 0 ? ['Agrega al menos un servicio para generar la cotización.'] : []),
    ];
    this.errors.set(messages);
    if (this.clientErrors().length > 0) {
      this.clientAttempt.set(true);
      this.step.set('client');
      this.cartOpen.set(false);
      return;
    }
    if (messages.length > 0) {
      if (!this.isDesktop()) {
        this.cartOpen.set(true);
      }
      return;
    }

    const quote = this.store.saveQuote({
      clientName: this.clientName(),
      date: this.date(),
      address: this.address(),
      lines: this.lines(),
    });
    this.savedQuote.set(quote);
    this.step.set('success');
    this.cartOpen.set(false);
    this.pdfError.set('');
    try {
      await this.pdf.download(quote);
    } catch {
      this.pdfError.set('No se pudo crear el PDF. La cotización quedó guardada en el historial.');
    }
  }

  async redownload(): Promise<void> {
    const quote = this.savedQuote();
    if (!quote) {
      return;
    }
    try {
      await this.pdf.download(quote);
      this.pdfError.set('');
    } catch {
      this.pdfError.set('No se pudo crear el PDF. Puedes descargarlo desde el historial.');
    }
  }

  private persist(): void {
    const step = this.step();
    if (step !== 'client' && step !== 'catalog') {
      return;
    }
    const draft = {
      clientName: this.clientName(),
      date: this.date(),
      address: this.address(),
      lines: this.lines(),
      step: step === 'catalog' ? 'catalog' as const : 'client' as const,
    };
    if (!isMeaningfulDraft(draft)) {
      this.store.clearDraft();
      return;
    }
    this.store.saveDraft(draft);
  }
}
