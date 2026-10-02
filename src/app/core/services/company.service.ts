import { Injectable, signal } from '@angular/core';
import { DEFAULT_COMPANY } from '../data/defaults';
import { CompanyConfig } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  readonly config = signal<CompanyConfig>({ ...DEFAULT_COMPANY });
}
