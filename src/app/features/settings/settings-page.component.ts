import { Component } from '@angular/core';
import { PriceSettingsComponent } from './price-settings.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [PriceSettingsComponent],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {}
