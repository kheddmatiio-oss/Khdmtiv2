/** Amounts spelled out — an Algerian invoice states its total in words
 *  ("Arrêtée la présente facture à la somme de…"). */

const FR_U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const FR_T = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

/** 0–99. `final` is false when another word follows (quatre-vingts → quatre-vingt). */
function fr99(n: number, final: boolean): string {
  if (n < 20) return FR_U[n];
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10;
    return u === 0 ? FR_T[t] : u === 1 ? `${FR_T[t]} et un` : `${FR_T[t]}-${FR_U[u]}`;
  }
  if (n < 80) return n === 71 ? 'soixante et onze' : `soixante-${FR_U[n - 60]}`;
  if (n === 80) return final ? 'quatre-vingts' : 'quatre-vingt';
  return `quatre-vingt-${FR_U[n - 80]}`;
}

function fr999(n: number, final: boolean): string {
  const h = Math.floor(n / 100), r = n % 100;
  if (h === 0) return fr99(r, final);
  const head = h === 1 ? 'cent' : `${FR_U[h]} cent${r === 0 && final ? 's' : ''}`;
  return r === 0 ? head : `${head} ${fr99(r, final)}`;
}

export function frInt(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'zéro';
  const parts: string[] = [];
  const mds = Math.floor(n / 1e9), mns = Math.floor((n % 1e9) / 1e6);
  const ths = Math.floor((n % 1e6) / 1e3), rest = n % 1e3;
  if (mds) parts.push(`${fr999(mds, true)} milliard${mds > 1 ? 's' : ''}`);
  if (mns) parts.push(`${fr999(mns, true)} million${mns > 1 ? 's' : ''}`);
  if (ths) parts.push(ths === 1 ? 'mille' : `${fr999(ths, false)} mille`);   // "mille" never takes un / s
  if (rest) parts.push(fr999(rest, true));
  return parts.join(' ');
}

const EN_U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function en999(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  const tail = r < 20 ? (r ? EN_U[r] : '') : EN_T[Math.floor(r / 10)] + (r % 10 ? `-${EN_U[r % 10]}` : '');
  return [h ? `${EN_U[h]} hundred` : '', tail].filter(Boolean).join(' ');
}

export function enInt(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'zero';
  const units: [number, string][] = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand'], [1, '']];
  const parts: string[] = [];
  for (const [v, name] of units) {
    const q = Math.floor(n / v) % 1000;
    if (q) parts.push(`${en999(q)}${name ? ` ${name}` : ''}`);
  }
  return parts.join(' ');
}

const AR_U = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
  'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const AR_T = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const AR_H = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function ar999(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  const tail = r < 20 ? AR_U[r] : (r % 10 ? `${AR_U[r % 10]} و${AR_T[Math.floor(r / 10)]}` : AR_T[Math.floor(r / 10)]);
  return [AR_H[h], tail].filter(Boolean).join(' و');
}

/** Scale word agreement: 1 → singular, 2 → dual, 3–10 → plural, 11+ → singular accusative. */
function arScale(q: number, one: string, two: string, few: string, many: string): string {
  if (q === 1) return one;
  if (q === 2) return two;
  const last = q % 100;
  if (last >= 3 && last <= 10) return `${ar999(q)} ${few}`;
  return `${ar999(q)} ${many}`;
}

export function arInt(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'صفر';
  const parts: string[] = [];
  const mds = Math.floor(n / 1e9), mns = Math.floor((n % 1e9) / 1e6);
  const ths = Math.floor((n % 1e6) / 1e3), rest = n % 1e3;
  if (mds) parts.push(arScale(mds, 'مليار', 'ملياران', 'مليارات', 'مليار'));
  if (mns) parts.push(arScale(mns, 'مليون', 'مليونان', 'ملايين', 'مليون'));
  if (ths) parts.push(arScale(ths, 'ألف', 'ألفان', 'آلاف', 'ألف'));
  if (rest) parts.push(ar999(rest));
  return parts.join(' و');
}

type Names = { main: [string, string]; sub: [string, string] };
const CUR: Record<'fr' | 'en' | 'ar', Record<string, Names>> = {
  fr: {
    DZD: { main: ['dinar algérien', 'dinars algériens'], sub: ['centime', 'centimes'] },
    USD: { main: ['dollar américain', 'dollars américains'], sub: ['cent', 'cents'] },
    EUR: { main: ['euro', 'euros'], sub: ['centime', 'centimes'] },
    MAD: { main: ['dirham marocain', 'dirhams marocains'], sub: ['centime', 'centimes'] },
    TND: { main: ['dinar tunisien', 'dinars tunisiens'], sub: ['millime', 'millimes'] },
    GBP: { main: ['livre sterling', 'livres sterling'], sub: ['penny', 'pence'] },
    SAR: { main: ['riyal saoudien', 'riyals saoudiens'], sub: ['halala', 'halalas'] },
    AED: { main: ['dirham émirati', 'dirhams émiratis'], sub: ['fils', 'fils'] },
    CAD: { main: ['dollar canadien', 'dollars canadiens'], sub: ['cent', 'cents'] },
  },
  en: {
    DZD: { main: ['Algerian dinar', 'Algerian dinars'], sub: ['centime', 'centimes'] },
    USD: { main: ['US dollar', 'US dollars'], sub: ['cent', 'cents'] },
    EUR: { main: ['euro', 'euros'], sub: ['cent', 'cents'] },
    MAD: { main: ['Moroccan dirham', 'Moroccan dirhams'], sub: ['centime', 'centimes'] },
    TND: { main: ['Tunisian dinar', 'Tunisian dinars'], sub: ['millime', 'millimes'] },
    GBP: { main: ['pound sterling', 'pounds sterling'], sub: ['penny', 'pence'] },
    SAR: { main: ['Saudi riyal', 'Saudi riyals'], sub: ['halala', 'halalas'] },
    AED: { main: ['UAE dirham', 'UAE dirhams'], sub: ['fils', 'fils'] },
    CAD: { main: ['Canadian dollar', 'Canadian dollars'], sub: ['cent', 'cents'] },
  },
  ar: {
    DZD: { main: ['دينار جزائري', 'دينار جزائري'], sub: ['سنتيم', 'سنتيم'] },
    USD: { main: ['دولار أمريكي', 'دولار أمريكي'], sub: ['سنت', 'سنت'] },
    EUR: { main: ['يورو', 'يورو'], sub: ['سنتيم', 'سنتيم'] },
    MAD: { main: ['درهم مغربي', 'درهم مغربي'], sub: ['سنتيم', 'سنتيم'] },
    TND: { main: ['دينار تونسي', 'دينار تونسي'], sub: ['مليم', 'مليم'] },
    GBP: { main: ['جنيه إسترليني', 'جنيه إسترليني'], sub: ['بنس', 'بنس'] },
    SAR: { main: ['ريال سعودي', 'ريال سعودي'], sub: ['هللة', 'هللة'] },
    AED: { main: ['درهم إماراتي', 'درهم إماراتي'], sub: ['فلس', 'فلس'] },
    CAD: { main: ['دولار كندي', 'دولار كندي'], sub: ['سنت', 'سنت'] },
  },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Vingt-six mille dinars algériens et cinquante centimes" */
export function amountInWords(amount: number, currency: string, lang: 'fr' | 'en' | 'ar'): string {
  const cents = Math.round((Number(amount) || 0) * 100);
  const whole = Math.floor(cents / 100), frac = cents % 100;
  const names = CUR[lang][currency] ?? { main: [currency, currency], sub: ['', ''] };
  const say = lang === 'fr' ? frInt : lang === 'en' ? enInt : arInt;
  const pick = (n: number, p: [string, string]) => (n > 1 ? p[1] : p[0]);
  // French: "un million de dinars" — "de" after a round million/milliard
  const de = lang === 'fr' && whole >= 1e6 && whole % 1e6 === 0 ? 'de ' : '';
  let out = `${say(whole)} ${de}${pick(whole, names.main)}`;
  if (frac > 0 && names.sub[0]) {
    out += `${lang === 'ar' ? ' و' : lang === 'fr' ? ' et ' : ' and '}${say(frac)} ${pick(frac, names.sub)}`;
  }
  return lang === 'ar' ? out : cap(out);
}
