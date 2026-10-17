import type { Currency, Settings } from './types';

export const CURRENCY_SYMBOL: Record<Currency, { ar: string; en: string; fr: string }> = {
  DZD: { ar: 'دج', en: 'DA', fr: 'DA' },
  USD: { ar: '$', en: '$', fr: '$' },
  EUR: { ar: '€', en: '€', fr: '€' },
  MAD: { ar: 'درهم', en: 'MAD', fr: 'MAD' },
  TND: { ar: 'د.ت', en: 'TND', fr: 'TND' },
  GBP: { ar: '£', en: '£', fr: '£' },
  SAR: { ar: 'ر.س', en: 'SAR', fr: 'SAR' },
  AED: { ar: 'د.إ', en: 'AED', fr: 'AED' },
  CAD: { ar: 'C$', en: 'C$', fr: 'C$' },
};

export const ALL_CURRENCIES = Object.keys(CURRENCY_SYMBOL) as Currency[];

export const fmtNumber = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Math.round((Number(n) || 0) * 100) / 100,
  );

export const symbol = (c: Currency, lang: 'ar' | 'en' | 'fr' = 'ar') =>
  CURRENCY_SYMBOL[c]?.[lang] ?? c;

export const money = (n: number, c: Currency, lang: 'ar' | 'en' | 'fr' = 'ar') =>
  `${fmtNumber(n)} ${symbol(c, lang)}`;

export const rateOf = (c: Currency, s: Settings) =>
  Number(s.currency.list.find((x) => x.code === c)?.rate) || 1;

/** Value of `n` (held in `from`) expressed in the base currency. */
export const toBase = (n: number, from: Currency, s: Settings) =>
  (Number(n) || 0) * rateOf(from, s) / rateOf(s.currency.base, s);

/** Totals are kept per currency — blending them would be a lie. */
export type CurrencyMap = Partial<Record<Currency, number>>;

export const addTo = (m: CurrencyMap, c: Currency, n: number): CurrencyMap => {
  m[c] = (m[c] ?? 0) + (Number(n) || 0);
  return m;
};

export const sumBy = <T,>(
  rows: T[],
  pick: (r: T) => number,
  cur: (r: T) => Currency,
): CurrencyMap => rows.reduce<CurrencyMap>((m, r) => addTo(m, cur(r), pick(r)), {});

export const showMap = (m: CurrencyMap, lang: 'ar' | 'en' | 'fr' = 'ar', empty = '—') => {
  const keys = (Object.keys(m) as Currency[]).filter((c) => m[c]);
  return keys.length ? keys.map((c) => money(m[c]!, c, lang)).join(' · ') : empty;
};

/** Single comparable figure, for sorting only — never for display. */
export const mapToBase = (m: CurrencyMap, s: Settings) =>
  (Object.keys(m) as Currency[]).reduce((n, c) => n + toBase(m[c]!, c, s), 0);
