import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Quote } from '../../core/models/models';
import { PdfService } from '../../core/services/pdf.service';
import { QuoteStore } from '../../core/services/quote-store.service';
import { formatDisplayDate } from '../../core/utils/dates';
import { formatBs, lineFormula } from '../../core/utils/money';

@Component({
  selector: 'app-quote-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quote-detail-page.component.html',
})
export class QuoteDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(QuoteStore);
  private readonly pdf = inject(PdfService);

  readonly quote = signal<Quote | null>(null);
  readonly missing = signal(false);
  readonly confirmDelete = signal(false);
  readonly pdfError = signal('');
  readonly money = formatBs;
  readonly dateLabel = formatDisplayDate;
  readonly formula = lineFormula;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      const found = this.store.find(params.get('id') ?? '');
      this.quote.set(found);
      this.missing.set(!found);
      this.confirmDelete.set(false);
    });
  }

  download(): void {
    const quote = this.quote();
    if (!quote) {
      return;
    }
    try {
      this.pdf.download(quote);
      this.pdfError.set('');
    } catch {
      this.pdfError.set('No se pudo crear el PDF.');
    }
  }

  remove(): void {
    const quote = this.quote();
    if (!quote) {
      return;
    }
    this.store.deleteQuote(quote.id);
    void this.router.navigate(['/historial']);
  }
}
