'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { api } from '@/lib/api';
import { Button, Card, Empty, Input, Spinner } from './ui/primitives';
import { fmtNumber } from '@/lib/money';
import type { AffiliateRow, CurrencyTotals } from '@/lib/types';
import { Gift, Check } from 'lucide-react';

const show = (m: CurrencyTotals) => {
  const k = Object.keys(m ?? {}).filter((c) => Number(m[c]));
  return k.length ? k.map((c) => `${fmtNumber(Number(m[c]))} ${c}`).join(' · ') : '—';
};

export function AffiliatesAdmin({ refreshKey }: { refreshKey: number }) {
  const { t, toast } = useApp();
  const [data, setData] = useState<{ rate: number; rows: AffiliateRow[] } | null>(null);
  const [rate, setRate] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.adminAffiliates()
      .then((d) => { setData(d); setRate(String(d.rate)); })
      .catch(() => toast(t('err_net'), 'err'));
  }, [t, toast]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const saveRate = async () => {
    const n = Number(rate);
    if (!(n >= 0 && n <= 100)) return toast(t('commission_rate'), 'err');
    setBusy('rate');
    try { await api.adminSetRate(n); toast(t('saved')); load(); }
    catch { toast(t('err_net'), 'err'); }
    finally { setBusy(null); }
  };

  const payOut = async (row: AffiliateRow) => {
    if (!confirm(`${t('mark_paid_out')}\n\n${row.name} — ${show(row.pending)}`)) return;
    setBusy(row.id);
    try { await api.adminAffiliatePaid(row.id); toast(t('saved')); load(); }
    catch { toast(t('err_net'), 'err'); }
    finally { setBusy(null); }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-extrabold">
          <Gift size={14} className="text-[var(--accent)]" />{t('affiliates')}
        </h2>
        {/* a rate change applies to future payments only */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.66rem] text-muted">{t('commission_rate')}</span>
          <Input type="number" min="0" max="100" step="any" value={rate} onChange={(e) => setRate(e.target.value)}
            className="tnum !w-16 !py-1.5 text-center !text-xs" />
          <Button size="sm" onClick={saveRate} loading={busy === 'rate'}
            disabled={!data || Number(rate) === data.rate}>{t('save')}</Button>
        </div>
      </div>

      {!data ? (
        <div className="grid place-items-center py-10"><Spinner /></div>
      ) : data.rows.length === 0 ? (
        <Empty compact icon={<Gift size={16} />} title={t('no_affiliates')} />
      ) : (
        <ul>
          {data.rows.map((r) => (
            <li key={r.id} className="row flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{r.name}</span>
                <span className="tnum block truncate text-[0.66rem] text-muted">
                  {r.referrals} {t('aff_referrals')} · {r.paying} {t('aff_paying')} · ref={r.ref_code}
                </span>
                <span className="tnum block text-[0.66rem] text-faint">{t('aff_paid')}: {show(r.paid)}</span>
              </span>
              <span className="shrink-0 text-end">
                <span className="block text-[0.6rem] text-muted">{t('aff_pending')}</span>
                <b className="tnum block text-sm" style={{ color: r.pending_count ? 'var(--accent)' : undefined }}>
                  {show(r.pending)}
                </b>
              </span>
              {r.pending_count > 0 && (
                <Button size="sm" onClick={() => payOut(r)} loading={busy === r.id} className="shrink-0">
                  <Check size={13} />{t('mark_paid_out')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
