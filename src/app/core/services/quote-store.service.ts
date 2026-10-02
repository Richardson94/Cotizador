import { Injectable, inject, signal } from '@angular/core';
import { NewQuoteInput, Quote, QuoteDraft } from '../models/models';
import { createId } from '../utils/id';
import { lineSubtotal, quoteTotal, roundMoney } from '../utils/money';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class QuoteStore {
  private readonly storage = inject(StorageService);
  readonly quotes = signal<Quote[]>(this.storage.readQuotes());
  readonly draft = signal<QuoteDraft | null>(this.storage.readDraft());

  saveDraft(draft: QuoteDraft): void {
    this.draft.set(draft);
    this.storage.writeDraft(draft);
  }

  clearDraft(): void {
    this.draft.set(null);
    this.storage.clearDraft();
  }

  saveQuote(input: NewQuoteInput): Quote {
    const lines = input.lines.map((line) => {
      const quantity = roundMoney(line.quantity);
      const unitPrice = roundMoney(line.unitPrice);
      return {
        ...line,
        quantity,
        unitPrice,
        subtotal: lineSubtotal(unitPrice, quantity),
      };
    });
    const quote: Quote = {
      id: createId(),
      number: this.storage.nextQuoteNumber(this.quotes()),
      clientName: input.clientName.trim(),
      date: input.date,
      address: input.address.trim(),
      lines,
      total: quoteTotal(lines),
      createdAt: new Date().toISOString(),
    };
    this.quotes.update((quotes) => [quote, ...quotes]);
    this.storage.writeQuotes(this.quotes());
    this.clearDraft();
    return quote;
  }

  deleteQuote(id: string): void {
    this.quotes.update((quotes) => quotes.filter((quote) => quote.id !== id));
    this.storage.writeQuotes(this.quotes());
  }

  find(id: string): Quote | null {
    return this.quotes().find((quote) => quote.id === id) ?? null;
  }
}
