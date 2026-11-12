'use client';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { api } from '@/lib/api';
import { Button, Card, Chip, Empty, Spinner } from './ui/primitives';
import { fmtNumber } from '@/lib/money';
import { fmtDate } from '@/lib/utils';
import type { AffiliateMe } from '@/lib/types';
import { Copy, Share2, Users, CircleCheck, Clock, Gift, Check } from 'lucide-react';

const SITE = 'https://khedmti.app';

/** Totals kept per currency — a commission earned in USD is not DZD. */
const byCurrency = (rows: { amount: number; currency: string }[]) =>
  rows.reduce<Record<string, number>>((m, r) => {
    m[r.currency] = (m[r.currency] ?? 0) + Number(r.amount);
    return m;
  }, {});
const show = (m: Record<string, number>) => {
  const k = Object.keys(m).filter((c) => m[c]);
  return k.length ? k.map((c) => `${fmtNumber(m[c])} ${c}`).join(' · ') : '0';
};

export function AffiliatePanel() {
  const { t, toast } = useApp();
  const [me, setMe] = useState<AffiliateMe | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.affiliateMe().then(setMe).catch(() => setFailed(true));
  }, []);

  const link = me ? `${SITE}/?ref=${me.code}` : '';

  const sums = useMemo(() => {
    const c = me?.commissions ?? [];
    return {
      pending: byCurrency(c.filter((x) => x.status === 'pending')),
      paid: byCurrency(c.filter((x) => x.status === 'paid')),
      paying: (me?.referrals ?? []).filter((r) => r.plan !== 'free' && r.plan !== 'trial').length,
    };
  }, [me]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { toast(link); }
  };

  const share = async () => {
    const text = `${t('aff_share_text')} ${link}`;
    // native share sheet on phones; WhatsApp on desktop, where people actually send it
    if (navigator.share) {
      try { await navigator.share({ text, url: link }); return; } catch { /* dismissed */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  if (failed) return <Empty compact icon={<Gift size={16} />} title={t('err_net')} />;
  if (!me) return <div className="grid place-items-center py-12"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      {/* the offer, stated plainly */}
      <Card className="relative overflow-hidden p-4 sm:p-5">
        <span aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)' }} />
        <div className="relative flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Gift size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-black">{t('affiliate')}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('aff_pitch', me.rate)}</p>
          </div>
        </div>

        <p className="relative mb-1.5 mt-4 text-xs font-bold text-muted">{t('aff_link')}</p>
        <div className="relative flex gap-2">
          <code dir="ltr" className="tnum min-h-11 flex-1 truncate rounded-xl border bg-[var(--surface-2)] px-3 py-3 text-xs">
            {link}
          </code>
          <Button onClick={copy} aria-label={t('copy')} className="min-h-11 shrink-0">
            {copied ? <Check size={15} style={{ color: 'var(--accent)' }} /> : <Copy size={15} />}
            <span className="hidden sm:inline">{copied ? t('copied') : t('copy')}</span>
          </Button>
          <Button variant="primary" onClick={share} aria-label={t('share')} className="min-h-11 shrink-0">
            <Share2 size={15} /><span className="hidden sm:inline">{t('share')}</span>
          </Button>
        </div>
      </Card>

      {/* results */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<Users size={15} />} label={t('aff_referrals')} value={String(me.referrals.length)} />
        <Kpi icon={<CircleCheck size={15} />} label={t('aff_paying')} value={String(sums.paying)} />
        <Kpi icon={<Clock size={15} />} label={t('aff_pending')} value={show(sums.pending)} accent />
        <Kpi icon={<Check size={15} />} label={t('aff_paid')} value={show(sums.paid)} />
      </div>

      {/* how it works — only until the first commission lands */}
      {me.commissions.length === 0 && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-extrabold">{t('aff_how')}</p>
          <ol className="flex flex-col gap-2.5">
            {[t('aff_step1'), t('aff_step2'), t('aff_step3', me.rate)].map((s, i) => (
              <li key={i} className="flex items-center gap-3 text-[0.8rem]">
                <span className="tnum grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-black"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b px-4 py-2.5 text-xs font-extrabold">{t('aff_history')}</div>
        {me.commissions.length === 0 ? (
          <Empty compact icon={<Gift size={16} />} title={t('aff_none')} />
        ) : (
          <ul>
            {me.commissions.map((c) => (
              <li key={c.id} className="row flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.name}</span>
                  <span className="tnum block text-[0.66rem] text-faint">{fmtDate(c.created_at)} · {c.rate}%</span>
                </span>
                <Chip tone={c.status === 'paid' ? 'accent' : 'neutral'}>
                  {c.status === 'paid' ? t('aff_paid') : t('aff_pending')}
                </Chip>
                <b className="tnum shrink-0 text-sm">{fmtNumber(c.amount)} {c.currency}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="flex items-start gap-2.5 p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg"
        style={{ background: accent ? 'var(--accent-soft)' : 'var(--surface-2)', color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.66rem] font-semibold text-muted">{label}</span>
        <span className="tnum block truncate text-base font-black">{value}</span>
      </span>
    </Card>
  );
}
