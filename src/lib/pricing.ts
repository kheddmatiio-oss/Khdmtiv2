import { money } from './money';

/** The one subscription price, shown wherever the trial is mentioned. */
export const PRICE = { amount: 999, currency: 'DZD' as const, days: 30 };

export const priceLabel = (lang: 'ar' | 'en') => money(PRICE.amount, PRICE.currency, lang);
