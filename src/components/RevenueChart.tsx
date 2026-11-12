'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/primitives';
import { money, fmtNumber, symbol } from '@/lib/money';
import type { Currency, Video } from '@/lib/types';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MONTHS = 6;
const PLOT_H = 148;

type Bucket = { key: string; label: string; paid: number; unpaid: number };

const compact = (n: number) =>
  n >= 1e6 ? `${fmtNumber(n / 1e6)}M` : n >= 1e3 ? `${fmtNumber(n / 1e3)}k` : fmtNumber(n);

/** Round the axis top up to a clean figure so the gridlines read easily. */
const niceMax = (n: number) => {
  if (n <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(n));
  const m = n / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
};

/** Six months of logged work, split into what was paid and what is still owed.
 *  One currency at a time: amounts in different currencies are never added. */
export function RevenueChart({ videos, base }: { videos: Video[]; base: Currency }) {
  const { t, lang } = useApp();

  const currencies = useMemo(() => {
    const set = new Set<Currency>(videos.map((v) => v.currency ?? base));
    return [base, ...[...set].filter((c) => c !== base)].filter((c) => set.has(c) || c === base);
  }, [videos, base]);
  const [picked, setPicked] = useState<Currency | null>(null);
  const cur = picked && currencies.includes(picked) ? picked : currencies[0];

  const buckets = useMemo<Bucket[]>(() => {
    const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en', { month: 'short' });
    const now = new Date();
    const out: Bucket[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: fmt.format(d), paid: 0, unpaid: 0,
      });
    }
    const at = new Map(out.map((b) => [b.key, b]));
    videos.forEach((v) => {
      if ((v.currency ?? base) !== cur) return;
      const b = at.get(v.date.slice(0, 7));
      if (b) b[v.paid ? 'paid' : 'unpaid'] += Number(v.price) || 0;
    });
    return out;
  }, [videos, base, cur, lang]);

  const [hover, setHover] = useState<number | null>(null);
  const top = niceMax(Math.max(...buckets.map((b) => b.paid + b.unpaid)));
  const last = buckets[MONTHS - 1], prev = buckets[MONTHS - 2];
  const lastTotal = last.paid + last.unpaid, prevTotal = prev.paid + prev.unpaid;
  const delta = prevTotal > 0 ? Math.round(((lastTotal - prevTotal) / prevTotal) * 100) : null;
  const empty = buckets.every((b) => b.paid + b.unpaid === 0);
  const shown = hover ?? MONTHS - 1;

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xs font-extrabold">
            <span className="text-[var(--accent)]"><TrendingUp size={14} /></span>
            {t('revenue_6m')}
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="tnum text-2xl font-black leading-none">{money(lastTotal, cur, lang)}</span>
            <span className="text-[0.7rem] font-bold text-muted">{t('this_month')}</span>
            {delta !== null && (
              <span className="tnum inline-flex items-center gap-0.5 text-[0.7rem] font-extrabold text-muted">
                {delta >= 0 ? <ArrowUpRight size={12} className="text-[var(--accent)]" /> : <ArrowDownRight size={12} />}
                {delta >= 0 ? '+' : ''}{delta}% <span className="font-bold text-faint">{t('vs_last_month')}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-3 text-[0.66rem] font-bold text-muted">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-[3px]" style={{ background: 'var(--accent)' }} />{t('paid')}</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-[3px]" style={{ background: 'var(--chart-pending)' }} />{t('unpaid')}</span>
          </span>
          {currencies.length > 1 && (
            <div className="flex gap-0.5 rounded-lg border p-0.5" role="tablist" aria-label={t('currency')}>
              {currencies.map((c) => (
                <button key={c} role="tab" aria-selected={c === cur} onClick={() => setPicked(c)}
                  className={`relative min-h-7 rounded-md px-2 text-[0.66rem] font-extrabold transition-colors cursor-pointer after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] ${
                    c === cur ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted'}`}>
                  {symbol(c, lang)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {/* y axis: three recessive ticks */}
        <div className="tnum flex shrink-0 flex-col justify-between text-end text-[0.6rem] text-faint" style={{ height: PLOT_H }} aria-hidden>
          <span className="-translate-y-1/2">{compact(top)}</span>
          <span>{compact(top / 2)}</span>
          <span className="translate-y-1/2">0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: PLOT_H }} onMouseLeave={() => setHover(null)}>
            {[0, 50, 100].map((p) => (
              <span key={p} aria-hidden className="absolute inset-x-0 border-t"
                style={{ top: `${p}%`, borderColor: 'var(--border)', borderStyle: p === 100 ? 'solid' : 'dashed', opacity: p === 100 ? 1 : 0.6 }} />
            ))}
            <div className="absolute inset-0 flex items-end">
              {buckets.map((b, i) => {
                const total = b.paid + b.unpaid;
                const hPaid = (b.paid / top) * PLOT_H, hUnpaid = (b.unpaid / top) * PLOT_H;
                const on = hover === i;
                return (
                  <button key={b.key} type="button"
                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    onClick={() => setHover(i)}
                    aria-label={`${b.label}: ${t('paid')} ${money(b.paid, cur, lang)}, ${t('unpaid')} ${money(b.unpaid, cur, lang)}`}
                    className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end gap-[2px] outline-none"
                    style={{ background: on ? 'color-mix(in oklab, var(--surface-2) 70%, transparent)' : undefined }}>
                    {total > 0 && (i === MONTHS - 1 || on) && (
                      <span className="tnum mb-1 text-[0.62rem] font-extrabold">{compact(total)}</span>
                    )}
                    {b.unpaid > 0 && (
                      <span className="w-[46%] max-w-9 transition-[height] duration-500"
                        style={{ height: Math.max(2, hUnpaid), background: 'var(--chart-pending)', borderRadius: '4px 4px 0 0' }} />
                    )}
                    {b.paid > 0 && (
                      <span className="w-[46%] max-w-9 transition-[height] duration-500"
                        style={{ height: Math.max(2, hPaid), background: 'var(--accent)', borderRadius: b.unpaid > 0 ? 0 : '4px 4px 0 0' }} />
                    )}
                    <span className="pointer-events-none absolute inset-0 rounded-md group-focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]" />
                  </button>
                );
              })}
            </div>
            {empty && (
              <p className="absolute inset-0 grid place-items-center text-[0.72rem] text-faint">{t('no_videos')}</p>
            )}
          </div>
          <div className="mt-1.5 flex" aria-hidden>
            {buckets.map((b, i) => (
              <span key={b.key} className={`flex-1 text-center text-[0.64rem] ${i === shown ? 'font-extrabold text-[var(--text)]' : 'text-faint'}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* the month under the pointer (or the current one), spelled out */}
      <div className="tnum mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[0.7rem]">
        <b className="font-extrabold">{buckets[shown].label}</b>
        <span className="text-muted">{t('paid')} <b className="text-[var(--text)]">{money(buckets[shown].paid, cur, lang)}</b></span>
        <span className="text-muted">{t('unpaid')} <b className="text-[var(--text)]">{money(buckets[shown].unpaid, cur, lang)}</b></span>
        <span className="text-muted">{t('total')} <b className="text-[var(--text)]">{money(buckets[shown].paid + buckets[shown].unpaid, cur, lang)}</b></span>
      </div>

      <table className="sr-only">
        <caption>{t('revenue_6m')} ({cur})</caption>
        <thead><tr><th>{t('date')}</th><th>{t('paid')}</th><th>{t('unpaid')}</th></tr></thead>
        <tbody>{buckets.map((b) => <tr key={b.key}><td>{b.label}</td><td>{b.paid}</td><td>{b.unpaid}</td></tr>)}</tbody>
      </table>
    </Card>
  );
}
