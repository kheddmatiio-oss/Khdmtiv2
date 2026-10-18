import type { AppData, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  company: { name: '', logo: '', email: '', phone: '', address: '', nif: '', nis: '', rc: '', art: '', rip: '' },
  // invoice.lang is deliberately separate from the UI language: an Algerian
  // invoice usually goes to a client or accountant in French, whatever
  // language the freelancer works in.
  invoice: { vat: 0, paymentMode: '', object: '', prefix: 'F', lang: 'fr' },
  currency: { base: 'DZD', list: [{ code: 'DZD', rate: 1 }, { code: 'USD', rate: 135 }, { code: 'EUR', rate: 150 }] },
  theme: { accent: '' },
  onboarding: { dismissed: false },
};

export const EMPTY_DATA: AppData = {
  editors: [], clients: [], videos: [], invoices: [], tasks: [],
  settings: DEFAULT_SETTINGS,
};

/** Rows written by older versions may miss newer collections. */
export function normalize(d: Partial<AppData> | null | undefined): AppData {
  const s = d?.settings;
  return {
    editors: d?.editors ?? [],
    clients: d?.clients ?? [],
    videos: d?.videos ?? [],
    invoices: d?.invoices ?? [],
    tasks: d?.tasks ?? [],
    settings: {
      company: { ...DEFAULT_SETTINGS.company, ...(s?.company ?? {}) },
      invoice: { ...DEFAULT_SETTINGS.invoice, ...(s?.invoice ?? {}) },
      currency: {
        base: s?.currency?.base ?? DEFAULT_SETTINGS.currency.base,
        list: s?.currency?.list?.length ? s.currency.list : DEFAULT_SETTINGS.currency.list,
      },
      theme: { ...DEFAULT_SETTINGS.theme, ...(s?.theme ?? {}) },
      onboarding: { ...DEFAULT_SETTINGS.onboarding, ...(s?.onboarding ?? {}) },
    },
  };
}
