import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { formatEditableNumber, parseDecimal, roundMoney } from '../core/utils/money';

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  template: `
    <div class="stepper">
      <button type="button" (click)="change(-1)" aria-label="Disminuir cantidad">−</button>
      <input
        #qty
        [value]="display"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
        inputmode="decimal"
        autocomplete="off"
        aria-label="Cantidad"
      />
      <button type="button" (click)="change(1)" aria-label="Aumentar cantidad">+</button>
    </div>
  `,
})
export class QuantityStepperComponent implements OnChanges, AfterViewInit {
  @Input() quantity = 1;
  @Input() autoFocus = false;
  @Output() quantityChange = new EventEmitter<number>();
  @Output() submitQty = new EventEmitter<void>();
  @ViewChild('qty') private input?: ElementRef<HTMLInputElement>;

  display = '1';
  private focused = false;
  private lastGood = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['quantity'] || this.focused) {
      return;
    }
    this.apply(this.quantity > 0 ? this.quantity : 1);
  }

  ngAfterViewInit(): void {
    if (!this.autoFocus) {
      return;
    }
    queueMicrotask(() => {
      this.input?.nativeElement.focus();
      this.input?.nativeElement.select();
    });
  }

  onFocus(): void {
    this.focused = true;
    this.input?.nativeElement.select();
  }

  onInput(event: Event): void {
    this.display = (event.target as HTMLInputElement).value;
    const parsed = parseDecimal(this.display);
    if (parsed !== null && parsed > 0) {
      this.lastGood = parsed;
      this.quantityChange.emit(parsed);
    }
  }

  onBlur(): void {
    this.focused = false;
    const parsed = parseDecimal(this.display);
    if (parsed === null || parsed <= 0) {
      this.display = formatEditableNumber(this.lastGood);
      return;
    }
    this.apply(parsed);
    this.quantityChange.emit(parsed);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    this.onBlur();
    this.submitQty.emit();
  }

  change(delta: number): void {
    const parsed = parseDecimal(this.display);
    const current = parsed !== null && parsed > 0 ? parsed : this.lastGood;
    const next = roundMoney(current + delta);
    if (next <= 0) {
      return;
    }
    this.apply(next);
    this.quantityChange.emit(next);
  }

  private apply(value: number): void {
    this.lastGood = roundMoney(value);
    this.display = formatEditableNumber(this.lastGood);
  }
}
