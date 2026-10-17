import type { AppData, Invoice, Task, Video } from './types';
import { totals } from './invoice';
import { addTo, type CurrencyMap } from './money';
import { today } from './utils';

/** Everything the dashboard needs, derived from stored data — nothing invented. */
export type Insights = {
  revenue: CurrencyMap;      // all work logged
  collected: CurrencyMap;    // paid work
  outstanding: CurrencyMap;  // work not yet paid
  overdue: CurrencyMap;      // invoices past their due date
  overdueCount: number;
  month: CurrencyMap;
  monthCount: number;
  recentVideos: Video[];
  attention: Task[];         // overdue, due today, or urgent
  unpaidInvoices: Invoice[];
  activity: Activity[];
};

export type Activity = {
  id: string; kind: 'video' | 'invoice' | 'task';
  title: string; at: string; meta?: string;
};

export function buildInsights(d: AppData, editorId?: string): Insights {
  const base = d.settings.currency.base;
  const cur = (v: { currency?: string }) => (v.currency ?? base) as typeof base;
  const videos = editorId ? d.videos.filter((v) => v.editorId === editorId) : d.videos;
  const tasks = editorId ? d.tasks.filter((k) => k.editorId === editorId) : d.tasks;

  const revenue: CurrencyMap = {}, collected: CurrencyMap = {}, outstanding: CurrencyMap = {};
  const month: CurrencyMap = {};
  const since = new Date(); since.setDate(1); since.setHours(0, 0, 0, 0);
  let monthCount = 0;

  videos.forEach((v) => {
    addTo(revenue, cur(v), v.price);
    addTo(v.paid ? collected : outstanding, cur(v), v.price);
    if (new Date(v.date) >= since) { addTo(month, cur(v), v.price); monthCount++; }
  });

  const now = today();
  const overdue: CurrencyMap = {};
  const unpaidInvoices = d.invoices.filter((i) => i.status !== 'paid');
  let overdueCount = 0;
  unpaidInvoices.forEach((i) => {
    if (i.due && i.due < now) { addTo(overdue, i.currency, totals(i).ttc); overdueCount++; }
  });

  const attention = tasks
    .filter((k) => k.status !== 'done' && (k.priority === 'high' || (k.due && k.due <= now)))
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));

  const recentVideos = [...videos].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const activity: Activity[] = [
    ...videos.filter((v) => v.createdAt).map((v) => ({
      id: `v${v.id}`, kind: 'video' as const, title: v.title || '—', at: v.createdAt!,
    })),
    ...d.invoices.filter((i) => i.createdAt).map((i) => ({
      id: `i${i.id}`, kind: 'invoice' as const, title: i.number, at: i.createdAt!,
    })),
    ...tasks.filter((k) => k.createdAt).map((k) => ({
      id: `k${k.id}`, kind: 'task' as const, title: k.title, at: k.createdAt!,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return {
    revenue, collected, outstanding, overdue, overdueCount,
    month, monthCount, recentVideos, attention,
    unpaidInvoices: unpaidInvoices.slice(0, 5), activity,
  };
}

/** "2h", "3d" — compact and language-neutral. */
export const ago = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
};
