import type { Invoice, InvoiceLine, Client, Settings } from '@/lib/types';

export const MUTED = '#5c6478', FAINT = '#8a91a3', LINE = '#e3e7ef', SOFT = '#f6f8fb', INK = '#0B111A';

export type TemplateId = 'studio' | 'bold' | 'classic';
export const TEMPLATES: TemplateId[] = ['studio', 'bold', 'classic'];

/** Everything a template needs, computed once by the sheet. */
export type Ctx = {
  invoice: Invoice; client?: Client; C: Settings['company'];
  lines: InvoiceLine[]; gross: number; ht: number; vat: number; ttc: number;
  ink: string; onInk: string; tint: string;
  t: (k: string) => string; L: 'ar' | 'en' | 'fr'; rtl: boolean;
  start: 'left' | 'right'; end: 'left' | 'right';
  paid: boolean; object: string; payMode: string;
  seller: string[][]; buyer: (string | undefined)[][];
  meta: [string, string][];
  cols: [string, 'left' | 'right' | 'center', string][];
};

/** White or near-black, whichever reads on the chosen colour. */
export const readableOn = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return lum > 0.5 ? INK : '#fff';
};

export const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex justify-between gap-3 py-1 text-[0.76rem]" style={{ color: strong ? '#101223' : '#5c6478', fontWeight: strong ? 800 : 500 }}>
    <span>{label}</span><span className="tnum">{value}</span>
  </div>
);
