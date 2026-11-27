'use client';
import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Chip, Empty } from '@/components/ui/primitives';
import { GettingStarted } from '@/components/GettingStarted';
import { RevenueChart } from '@/components/RevenueChart';
import { buildInsights } from '@/lib/insights';
import { money, showMap } from '@/lib/money';
import { fmtDate, today } from '@/lib/utils';
import { STAGE_LABEL, STAGE_TONE, stageOf, dueState, byUrgency } from '@/lib/pipeline';
import type { TabId } from '@/components/Shell';
import {
  Plus, Film,
  CheckSquare, ChevronLeft, CalendarClock,
} from 'lucide-react';

export function Dashboard({ setTab }: { setTab: (t: TabId) => void }) {
  const { t, lang, data, agency, worker } = useApp();
  const base = data.settings.currency.base;
  const s = useMemo(() => buildInsights(data, worker?.id), [data, worker]);
  const dash = money(0, base, lang);

  // work in progress that has a date on it, nearest first
  const deadlines = useMemo(() => (worker ? data.videos.filter((v) => v.editorId === worker.id) : data.videos)
    .filter((v) => stageOf(v) !== 'delivered' && v.due)
    .sort(byUrgency).slice(0, 5), [data.videos, worker]);

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
            {worker?.name ?? agency?.name}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setTab('videos')} className="shrink-0">
          <Plus size={16} />{t('new_video')}
        </Button>
      </header>

      {showGuide && <GettingStarted setTab={setTab} />}

      {/* financial position, four plain figures */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={t('total')} value={showMap(s.revenue, lang, dash)} accent />
        <Kpi tone="var(--accent)" label={t('paid')} value={showMap(s.collected, lang, dash)} />
        <Kpi tone="var(--chart-pending)" label={t('outstanding')} value={showMap(s.outstanding, lang, dash)} />
        <Kpi
          label={t('overdue')}
          value={showMap(s.overdue, lang, dash)}
          sub={s.overdueCount > 0 ? `${s.overdueCount}` : undefined}
          danger={s.overdueCount > 0}
          onClick={() => setTab('invoices')}
        />
      </div>

      <RevenueChart videos={worker ? data.videos.filter((v) => v.editorId === worker.id) : data.videos} base={base} />

      {deadlines.length > 0 && (
        <Panel title={t('deadlines')} icon={<CalendarClock size={14} />} onMore={() => setTab('videos')}
          badge={deadlines.filter((v) => dueState(v)?.late).length || undefined}>
          <ul>
            {deadlines.map((v) => {
              const d = dueState(v)!;
              const st = stageOf(v);
              return (
                <li key={v.id} className="row flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full"
                    style={{ background: d.late ? 'var(--danger)' : STAGE_TONE[st] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{v.title || '—'}</span>
                    <span className="block truncate text-[0.66rem] text-muted">
                      {data.clients.find((c) => c.id === v.clientId)?.name ?? '—'} · {t(STAGE_LABEL[st])}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[0.68rem] font-bold"
                    style={{ color: d.late ? 'var(--danger)' : d.soon ? 'var(--accent)' : 'var(--text-faint)' }}>
                    {d.late ? t('late_by', -d.days) : d.days === 0 ? t('today') : d.days === 1 ? t('due_tomorrow') : t('due_in', d.days)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* recent work */}
        <Panel title={t('videos')} icon={<Film size={14} />} onMore={() => setTab('videos')} className="lg:col-span-2">
          {s.recentVideos.length === 0 ? <Empty compact icon={<Film size={16} />} title={t('no_videos')} /> : (
            <Table
              head={[t('video_title'), t('clients'), t('date'), t('deadline'), t('amount')]}
              rows={s.recentVideos.map((v) => ({
                key: v.id,
                accent: v.paid ? 'var(--accent)' : 'var(--text-faint)',
                cells: [
                  <span key="t" className="truncate font-bold">{v.title || '—'}</span>,
                  <span key="c" className="truncate text-muted">
                    {data.clients.find((c) => c.id === v.clientId)?.name ?? '—'}
                  </span>,
                  <span key="d" className="tnum whitespace-nowrap text-muted">{fmtDate(v.date)}</span>,
                  <span key="dl" className="tnum whitespace-nowrap font-semibold"
                    style={{ color: dueState(v)?.late ? 'var(--danger)' : 'var(--text-muted)' }}>{v.due ? fmtDate(v.due) : '—'}</span>,
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
        <Panel title={t('open_tasks')} icon={<CheckSquare size={14} />} onMore={() => setTab('tasks')} className="lg:col-span-2"
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
      </div>
    </div>
  );
}

/* ── pieces ──────────────────────────────────────────────── */

/** A figure and its name. The coloured rule says what kind of money it is:
 *  blue collected, gray still owed, red late — no pictograms. */
function Kpi({ label, value, sub, accent, danger, tone, onClick }: {
  label: string; value: string; sub?: string;
  accent?: boolean; danger?: boolean; tone?: string; onClick?: () => void;
}) {
  const rule = danger ? 'var(--danger)' : accent ? 'var(--text)' : tone ?? 'var(--border)';
  const body = (
    <Card hover={!!onClick} className="relative h-full overflow-hidden px-4 py-3.5">
      <span aria-hidden className="absolute inset-y-3.5 start-0 w-[3px] rounded-e-full" style={{ background: rule }} />
      <span className="flex items-center gap-1.5">
        <span className="truncate text-[0.7rem] font-semibold text-muted">{label}</span>
        {sub && (
          <span className="tnum rounded-full px-1.5 text-[0.6rem] font-extrabold"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>{sub}</span>
        )}
      </span>
      <span className="tnum mt-1 block truncate text-lg font-black leading-tight tracking-tight sm:text-[1.35rem]"
        style={danger ? { color: 'var(--danger)' } : undefined}>{value}</span>
    </Card>
  );
  return onClick
    ? <button onClick={onClick} className="cursor-pointer text-start">{body}</button>
    : body;
}

function Panel({ title, badge, onMore, children, className }: {
  title: string; icon?: React.ReactNode; badge?: number;
  onMore?: () => void; children: React.ReactNode; className?: string;
}) {
  const { t } = useApp();
  return (
    <Card className={`flex flex-col overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-[0.8rem] font-extrabold">
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
      <table className="w-full min-w-[40rem] border-collapse text-sm">
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
