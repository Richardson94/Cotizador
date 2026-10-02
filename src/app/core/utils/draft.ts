import { QuoteDraft } from '../models/models';

export function isMeaningfulDraft(draft: QuoteDraft | null): boolean {
  if (!draft) {
    return false;
  }
  return draft.clientName.trim().length > 0 || draft.address.trim().length > 0 || draft.lines.length > 0;
}
