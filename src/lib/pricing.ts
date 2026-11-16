import { money } from './money';

export type PlanKind = 'solo' | 'agency';

/** Launch prices: `was` is the regular price, shown struck through, so the
 *  day the discount ends nobody is surprised by the real figure. */
export const PRICES: Record<PlanKind, { amount: number; was: number }> = {
  solo: { amount: 999, was: 1999 },
  agency: { amount: 1999, was: 2999 },
};
export const PRICE = { ...PRICES.solo, currency: 'DZD' as const, days: 30 };

const kind = (k?: string | null): PlanKind => (k === 'agency' ? 'agency' : 'solo');

export const priceOf = (k?: string | null) => PRICES[kind(k)].amount;
export const priceLabel = (lang: 'ar' | 'en', k?: string | null) => money(PRICES[kind(k)].amount, 'DZD', lang);
export const wasLabel = (lang: 'ar' | 'en', k?: string | null) => money(PRICES[kind(k)].was, 'DZD', lang);
