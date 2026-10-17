import type { Invoice, InvoiceLine, Video, AppData } from './types';

/** A line is the unit of billing. */
export const lineTotal = (l: InvoiceLine) => (Number(l.qty) || 0) * (Number(l.pu) || 0);

/** Blank rows are dropped on read as well as on save, so a half-filled
 *  draft never reaches a printed page. */
export const liveLines = (lines: InvoiceLine[] = []) =>
  lines.filter((l) => String(l.desc ?? '').trim() || lineTotal(l));

export function totals(inv: Pick<Invoice, 'lines' | 'discount' | 'vat'>) {
  const lines = liveLines(inv.lines);
  const gross = lines.reduce((n, l) => n + lineTotal(l), 0);
  const ht = Math.max(0, gross - (Number(inv.discount) || 0));
  const vat = ht * ((Number(inv.vat) || 0) / 100);
  return { lines, gross, ht, vat, ttc: ht + vat };
}

export const nextNumber = (invoices: Invoice[], prefix = 'F') => {
  const max = invoices.reduce((m, i) => {
    const n = parseInt(String(i.number ?? '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix || 'F'}-${String(max + 1).padStart(4, '0')}`;
};

/** A video belongs to at most one invoice. */
export const billedVideoIds = (invoices: Invoice[], exceptId?: string) => {
  const s = new Set<string>();
  invoices.forEach((i) => {
    if (exceptId && i.id === exceptId) return;
    liveLines(i.lines).forEach((l) => l.videoId && s.add(l.videoId));
  });
  return s;
};

export const unbilledFor = (d: AppData, clientId: string, exceptId?: string): Video[] => {
  const billed = billedVideoIds(d.invoices, exceptId);
  return d.videos.filter((v) => v.clientId === clientId && !billed.has(v.id));
};
