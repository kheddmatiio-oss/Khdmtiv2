'use client';
import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Chip, Empty } from '@/components/ui/primitives';
import { GettingStarted } from '@/components/GettingStarted';
import { buildInsights, ago, type Activity } from '@/lib/insights';
import { totals } from '@/lib/invoice';
import { money, showMap, type CurrencyMap } from '@/lib/money';
import { fmtDate, today } from '@/lib/utils';
import type { TabId } from '@/components/Shell';
import {
  Plus, TrendingUp, CircleCheck, Clock, TriangleAlert, Film, Receipt,
  CheckSquare, ChevronLeft,
} from 'lucide-react';

export function Dashboard({ setTab }: { setTab: (t: TabId) => void }) {
  const { t, lang, data, agency, worker } = useApp();
  const base = data.settings.currency.base;
  const s = useMemo(() => buildInsights(data, worker?.id), [data, worker]);
  const dash = money(0, base, lang);

  // the guide stays until all three steps are done, or it is skipped
  const setupDone = data.clients.length > 0 && data.videos.length > 0 && data.invoices.length > 0;
  const showGuide = !data.settings.onboarding.dismissed && !setupDone;
  const blank = !data.clients.length && !data.videos.length;

  if (blank && showGuide) {
    return (
      <div className="flex flex-col gap-5">
        <header className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{t('dashboard')}</h1>
          <p className="truncate text-xs text-muted">{worker?.name ?? agency?.name}</p>
        </header>
        <GettingStarted setTab={setTab} />
      </div>
    );
  }

  if (blank) {
    return (
      <Empty
        icon={<Film size={24} />}
        title={t('no_clients')}
        hint={t('solo_hint')}
        action={<Button variant="primary" onClick={() => setTab('clients')}>
          <Plus size={15} />{t('new_client')}
        </Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* title + the one action that matters most */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{t('dashboard')}</h1>
          <p className="truncate text-xs text-muted">
            {worker?.name ?? agency?.name} · {t('this_month')} {showMap(s.month, lang, dash)}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setTab('videos')} className="shrink-0">
          <Plus size={16} />{t('new_video')}
        </Button>
      </header>

      {showGuide && <GettingStarted setTab={setTab} />}

      {/* financial position, four plain figures */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<TrendingUp size={15} />} label={t('total')} value={showMap(s.revenue, lang, dash)} accent />
        <Kpi icon={<CircleCheck size={15} />} label={t('paid')} value={showMap(s.collected, lang, dash)} />
        <Kpi icon={<Clock size={15} />} label={t('outstanding')} value={showMap(s.outstanding, lang, dash)} />
        <Kpi
          icon={<TriangleAlert size={15} />} label={t('overdue')}
          value={showMap(s.overdue, lang, dash)}
          sub={s.overdueCount > 0 ? `${s.overdueCount}` : undefined}
          danger={s.overdueCount > 0}
          onClick={() => setTab('invoices')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* recent work */}
        <Panel title={t('videos')} icon={<Film size={14} />} onMore={() => setTab('videos')} className="lg:col-span-2">
          {s.recentVideos.length === 0 ? <Empty compact icon={<Film size={16} />} title={t('no_videos')} /> : (
            <Table
              head={[t('video_title'), t('clients'), t('date'), t('amount')]}
              rows={s.recentVideos.map((v) => ({
                key: v.id,
                accent: v.paid ? 'var(--accent)' : 'var(--text-faint)',
                cells: [
                  <span key="t" className="truncate font-bold">{v.title || '—'}</span>,
                  <span key="c" className="truncate text-muted">
                    {data.clients.find((c) => c.id === v.clientId)?.name ?? '—'}
                  </span>,
                  <span key="d" className="tnum whitespace-nowrap text-muted">{fmtDate(v.date)}</span>,
                  <span key="a" className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <Chip tone={v.paid ? 'accent' : 'neutral'}>{v.paid ? t('paid') : t('unpaid')}</Chip>
                    <b className="tnum">{money(v.price, v.currency ?? base, lang)}</b>
                  </span>,
                ],
              }))}
            />
          )}
        </Panel>

        {/* tasks that cannot wait */}
        <Panel title={t('open_tasks')} icon={<CheckSquare size={14} />} onMore={() => setTab('tasks')}
          badge={s.attention.length || undefined}>
          {s.attention.length === 0 ? <Empty compact icon={<CheckSquare size={16} />} title={t('no_tasks')} /> : (
            <ul>
              {s.attention.slice(0, 5).map((k) => {
                const late = !!k.due && k.due < today();
                const now = k.due === today();
                return (
                  <li key={k.id} className="row flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full"
                      style={{ background: late ? 'var(--danger)' : k.priority === 'high' ? 'var(--warn)' : 'var(--accent)' }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{k.title}</span>
                    {k.due && (
                      <span className="tnum shrink-0 text-[0.68rem] font-bold"
                        style={{ color: late ? 'var(--danger)' : now ? 'var(--warn)' : 'var(--text-faint)' }}>
                        {late ? t('overdue') : now ? t('today') : fmtDate(k.due)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* money still owed */}
        <Panel title={t('awaiting')} icon={<Receipt size={14} />} onMore={() => setTab('invoices')}
          badge={s.unpaidInvoices.length || undefined}>
          {s.unpaidInvoices.length === 0 ? <Empty compact icon={<Receipt size={16} />} title={t('no_invoices')} /> : (
            <ul>
              {s.unpaidInvoices.map((i) => {
                const late = !!i.due && i.due < today();
                return (
                  <li key={i.id} className="row flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
                    <span className="tnum shrink-0 text-xs font-extrabold">{i.number}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.72rem] text-muted">
                      {data.clients.find((c) => c.id === i.clientId)?.name ?? '—'}
                    </span>
                    {late && <Chip tone="danger">{t('overdue')}</Chip>}
                    <b className="tnum shrink-0 text-xs">{money(totals(i).ttc, i.currency, lang)}</b>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* what happened lately */}
        <Panel title={t('this_month')} icon={<Clock size={14} />} className="lg:col-span-2">
          {s.activity.length === 0 ? <Empty compact icon={<Clock size={16} />} title="—" /> : (
            <ul className="grid sm:grid-cols-2">
              {s.activity.map((a) => <ActivityRow key={a.id} a={a} />)}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── pieces ──────────────────────────────────────────────── */

function Kpi({ icon, label, value, sub, accent, danger, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  accent?: boolean; danger?: boolean; onClick?: () => void;
}) {
  const tint = danger ? 'var(--danger)' : accent ? 'var(--accent)' : 'var(--text-muted)';
  const bg = danger ? 'var(--danger-soft)' : accent ? 'var(--accent-soft)' : 'var(--surface-2)';
  const body = (
    <Card hover={!!onClick} className="flex items-start gap-3 p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: bg, color: tint }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[0.68rem] font-semibold text-muted">{label}</span>
          {sub && (
            <span className="tnum rounded-full px-1.5 text-[0.6rem] font-extrabold"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>{sub}</span>
          )}
        </span>
        <span className="tnum block truncate text-base font-black leading-tight sm:text-lg"
          style={danger ? { color: 'var(--danger)' } : undefined}>{value}</span>
      </span>
    </Card>
  );
  return onClick
    ? <button onClick={onClick} className="cursor-pointer text-start">{body}</button>
    : body;
}

function Panel({ title, icon, badge, onMore, children, className }: {
  title: string; icon: React.ReactNode; badge?: number;
  onMore?: () => void; children: React.ReactNode; className?: string;
}) {
  const { t } = useApp();
  return (
    <Card className={`flex flex-col overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-extrabold">
          <span className="text-[var(--accent)]">{icon}</span>
          {title}
          {badge !== undefined && (
            <span className="tnum rounded-full bg-[var(--surface-2)] px-1.5 text-[0.6rem] text-muted">{badge}</span>
          )}
        </h2>
        {onMore && (
          <Button size="sm" variant="ghost" onClick={onMore} aria-label={title}>
            <ChevronLeft size={14} className="ltr:rotate-180" />
          </Button>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

/** Scrolls horizontally on small screens instead of overflowing the page. */
function Table({ head, rows }: {
  head: string[];
  rows: { key: string; accent?: string; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            {head.map((h, i) => (
              <th key={h} className="px-4 py-2 text-[0.62rem] font-bold uppercase tracking-wider text-faint"
                style={{ textAlign: i === head.length - 1 ? 'end' : 'start' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="row relative border-b last:border-0">
              {r.cells.map((c, i) => (
                <td key={i} className="max-w-0 px-4 py-2.5"
                  style={{ textAlign: i === r.cells.length - 1 ? 'end' : 'start' }}>
                  {i === 0 && r.accent && (
                    <span aria-hidden className="absolute inset-y-0 start-0 w-[3px]" style={{ background: r.accent }} />
                  )}
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityRow({ a }: { a: Activity }) {
  const Icon = a.kind === 'invoice' ? Receipt : a.kind === 'task' ? CheckSquare : Film;
  return (
    <li className="row flex items-center gap-3 border-b px-4 py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
        <Icon size={12} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.78rem] font-semibold">{a.title}</span>
      <span className="tnum shrink-0 text-[0.66rem] text-faint">{ago(a.at)}</span>
    </li>
  );
}
