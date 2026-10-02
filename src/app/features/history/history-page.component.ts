import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuoteStore } from '../../core/services/quote-store.service';
import { formatDisplayDate } from '../../core/utils/dates';
import { formatBs } from '../../core/utils/money';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './history-page.component.html',
})
export class HistoryPageComponent {
  private readonly store = inject(QuoteStore);
  readonly query = signal('');
  readonly date = signal('');
  readonly money = formatBs;
  readonly dateLabel = formatDisplayDate;

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const date = this.date();
    return this.store.quotes().filter((quote) => {
      if (date && quote.date !== date) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        quote.clientName.toLowerCase().includes(query) ||
        quote.address.toLowerCase().includes(query) ||
        quote.number.toLowerCase().includes(query)
      );
    });
  });

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }
}
