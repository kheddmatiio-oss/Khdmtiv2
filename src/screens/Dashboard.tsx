'use client';
import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Card, Chip, Empty, Section, Button } from '@/components/ui/primitives';
import { money, showMap, sumBy, type CurrencyMap } from '@/lib/money';
import type { TabId } from '@/components/Shell';
import { TrendingUp, CircleCheck, Clock, Film, CheckSquare, Receipt, ArrowLeft } from 'lucide-react';

export function Dashboard({ setTab }: { setTab: (t: TabId) => void }) {
  const { t, lang, data, agency, worker } = useApp();
  const st = data.settings;
  const base = st.currency.base;

  const mine = useMemo(
    () => (worker ? data.videos.filter((v) => v.editorId === worker.id) : data.videos),
    [data.videos, worker],
  );

  const s = useMemo(() => {
    const cur = (v: { currency?: string }) => (v.currency ?? base) as typeof base;
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const month = mine.filter((v) => new Date(v.date) >= start);
    return {
      total: sumBy(mine, (v) => v.price, cur),
      paid: sumBy(mine.filter((v) => v.paid), (v) => v.price, cur),
      owed: sumBy(mine.filter((v) => !v.paid), (v) => v.price, cur),
      month: sumBy(month, (v) => v.price, cur),
      monthCount: month.length,
      openTasks: data.tasks.filter((k) => k.status !== 'done' && (!worker || k.editorId === worker.id)).length,
      unpaidInv: data.invoices.filter((i) => i.status !== 'paid').reduce<CurrencyMap>((m, i) => {
        const gross = i.lines.reduce((n, l) => n + l.qty * l.pu, 0);
        const ht = Math.max(0, gross - (i.discount || 0));
        const c = i.currency ?? base;
        m[c] = (m[c] ?? 0) + ht * (1 + (i.vat || 0) / 100);
        return m;
      }, {}),
    };
  }, [mine, data.tasks, data.invoices, base, worker]);

  if (!data.videos.length && !data.clients.length) {
    return (
      <Empty
        icon={<Film size={24} />}
        title={t('no_clients')}
        action={<Button variant="primary" onClick={() => setTab('clients')}>{t('new_client')}</Button>}
      />
    );
  }

  const multi = Object.keys(s.month).length > 1;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight">{t('dashboard')}</h1>
        <p className="text-xs text-muted">{worker?.name ?? agency?.name}</p>
      </header>

      {/* headline: this month */}
      <Card className="relative overflow-hidden border-0 p-5 text-white"
        style={{ background: 'linear-gradient(130deg,var(--accent),color-mix(in oklab,var(--accent) 55%,black))' }}>
        <div aria-hidden className="absolute -end-10 -top-10 size-40 rounded-full bg-white/10" />
        <p className="relative text-[0.7rem] font-semibold opacity-75">
          {t('this_month')} · {s.monthCount} {t('videos')}
        </p>
        <p className={`relative tnum font-black leading-tight ${multi ? 'text-2xl' : 'text-4xl'}`}>
          {showMap(s.month, lang, money(0, base, lang))}
        </p>
        <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] opacity-85">
          <span>✓ {showMap(s.paid, lang)}</span>
          <span>⏳ {showMap(s.owed, lang)}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<TrendingUp size={15} />} label={t('total')} value={showMap(s.total, lang)} accent />
        <Metric icon={<CircleCheck size={15} />} label={t('paid')} value={showMap(s.paid, lang)} />
        <Metric icon={<Clock size={15} />} label={t('outstanding')} value={showMap(s.owed, lang)} />
        <Metric icon={<Film size={15} />} label={t('video_count')} value={String(mine.length)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => setTab('tasks')} className="text-start cursor-pointer">
          <Card className="p-4 transition-transform hover:-translate-y-0.5">
            <p className="mb-2 flex items-center gap-2 text-[0.7rem] font-semibold text-muted">
              <CheckSquare size={14} className="text-[var(--accent)]" />{t('open_tasks')}
            </p>
            <p className="tnum text-2xl font-black">{s.openTasks}</p>
          </Card>
        </button>
        <button onClick={() => setTab('invoices')} className="text-start cursor-pointer">
          <Card className="p-4 transition-transform hover:-translate-y-0.5">
            <p className="mb-2 flex items-center gap-2 text-[0.7rem] font-semibold text-muted">
              <Receipt size={14} className="text-[var(--accent)]" />{t('awaiting')}
            </p>
            <p className="tnum text-2xl font-black">{showMap(s.unpaidInv, lang, money(0, base, lang))}</p>
          </Card>
        </button>
      </div>

      <Section
        title={t('videos')}
        action={<Button size="sm" variant="ghost" onClick={() => setTab('videos')}>
          <ArrowLeft size={13} className="ltr:rotate-180" />
        </Button>}
      >
        {mine.length === 0
          ? <Empty icon={<Film size={22} />} title={t('no_videos')} />
          : <ul>
              {mine.slice(0, 6).map((v) => {
                const client = data.clients.find((c) => c.id === v.clientId);
                return (
                  <li key={v.id} className="relative flex items-center justify-between gap-3 border-b px-4 py-3 last:border-0">
                    <span aria-hidden className="absolute inset-y-0 start-0 w-[3px]"
                      style={{ background: v.paid ? 'var(--accent)' : 'var(--text-faint)' }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{v.title || '—'}</p>
                      <p className="truncate text-[0.68rem] text-faint">{client?.name ?? '—'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Chip tone={v.paid ? 'accent' : 'neutral'}>{v.paid ? t('paid') : t('unpaid')}</Chip>
                      <span className="tnum text-sm font-extrabold">{money(v.price, v.currency ?? base, lang)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>}
      </Section>
    </div>
  );
}

function Metric({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden p-4">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2.5px]"
        style={{ background: `linear-gradient(90deg, ${accent ? 'var(--accent)' : 'var(--text-faint)'}, transparent)` }} />
      <span className="mb-3 grid size-8 place-items-center rounded-lg"
        style={{ background: accent ? 'var(--accent-soft)' : 'var(--surface-2)', color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>
        {icon}
      </span>
      <p className="text-[0.68rem] font-semibold text-muted">{label}</p>
      <p className="tnum text-lg font-black leading-tight">{value}</p>
    </Card>
  );
}
