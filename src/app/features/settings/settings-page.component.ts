import { Component, signal } from '@angular/core';
import { CompanySettingsComponent } from './company-settings.component';
import { PriceSettingsComponent } from './price-settings.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [PriceSettingsComponent, CompanySettingsComponent],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {
  readonly tab = signal<'prices' | 'company'>('prices');
}
