'use client';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Chip, Empty, Field, Input, Select } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { money, showMap, sumBy } from '@/lib/money';
import { uid, today, fmtDate, matches } from '@/lib/utils';
import { cn } from '@/lib/cn';
import {
  STAGES, STAGE_LABEL, STAGE_TONE, stageOf, nextStage, dueState, byUrgency, type DueState,
} from '@/lib/pipeline';
import type { Video, Currency, VideoStage } from '@/lib/types';
import {
  Film, Pencil, Trash2, Plus, Search, ClipboardList, Scissors, Eye, RefreshCcw, CheckCheck,
  ArrowRight, CalendarClock, Link2, Columns3, List as ListIcon, GripVertical, Tags,
} from 'lucide-react';

type Filter = 'all' | 'paid' | 'unpaid';
type View = 'board' | 'list';

const STAGE_ICON = {
  brief: ClipboardList, editing: Scissors, review: Eye, revision: RefreshCcw, delivered: CheckCheck,
} as const;

const VIEW_KEY = 'khedmti.videos.view';
const DELIVERED_CAP = 8;

export function Videos() {
  const { t, lang, data, mutate, toast, agency, worker } = useApp();
  const base = data.settings.currency.base;
  const solo = agency?.account_type === 'solo' || !!worker;

  const [q, setQ] = useState('');
  const [paidFilter, setPaidFilter] = useState<Filter>('all');
  const [clientFilter, setClientFilter] = useState('');
  const [editing, setEditing] = useState<Video | null>(null);
  const [draftStage, setDraftStage] = useState<VideoStage | null>(null);
  const [view, setViewState] = useState<View>('board');
  const [pickedStage, setMobileStage] = useState<VideoStage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<VideoStage | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [allDelivered, setAllDelivered] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(VIEW_KEY) === 'list') setViewState('list'); } catch { /* private mode */ }
  }, []);
  const setView = (v: View) => {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ }
  };

  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? '—';
  const editorName = (id: string) => data.editors.find((e) => e.id === id)?.name ?? '—';

  const list = useMemo(() => {
    let v = worker ? data.videos.filter((x) => x.editorId === worker.id) : data.videos;
    if (clientFilter) v = v.filter((x) => x.clientId === clientFilter);
    if (paidFilter !== 'all') v = v.filter((x) => (paidFilter === 'paid' ? x.paid : !x.paid));
    if (q) v = v.filter((x) => matches(q, x.title, data.clients.find((c) => c.id === x.clientId)?.name));
    return v;
  }, [data.videos, data.clients, q, paidFilter, clientFilter, worker]);

  const columns = useMemo(() => {
    const m = Object.fromEntries(STAGES.map((s) => [s, [] as Video[]])) as Record<VideoStage, Video[]>;
    list.forEach((v) => m[stageOf(v)].push(v));
    STAGES.forEach((s) => m[s].sort(s === 'delivered'
      ? (a, b) => b.date.localeCompare(a.date) : byUrgency));
    return m;
  }, [list]);

  // until the user picks one, a phone opens on the first stage that has work in it
  const mobileStage = pickedStage ?? STAGES.find((x) => x !== 'delivered' && columns[x].length) ?? 'brief';

  const active = list.filter((v) => stageOf(v) !== 'delivered');
  const lateCount = active.filter((v) => dueState(v)?.late).length;
  const weekCount = active.filter((v) => { const d = dueState(v); return d && !d.late && d.days <= 7; }).length;
  const activeValue = sumBy(active, (v) => v.price, (v) => v.currency ?? base);
  const owed = sumBy(list.filter((v) => !v.paid), (v) => v.price, (v) => v.currency ?? base);

  const closeForm = () => { setEditing(null); setDraftStage(null); };

  const save = (v: Video) => {
    mutate((d) => ({
      ...d,
      videos: editing
        ? d.videos.map((x) => (x.id === editing.id ? { ...x, ...v } : x))
        : [{ ...v, id: uid(), createdAt: new Date().toISOString() }, ...d.videos],
    }));
    toast(t('saved'));
    closeForm();
  };

  const move = (v: Video, to: VideoStage) => {
    const from = stageOf(v);
    if (from === to) return;
    mutate((d) => ({
      ...d,
      videos: d.videos.map((x) => (x.id === v.id ? {
        ...x, stage: to,
        // every trip back to the editor is one more round the client asked for
        revisions: to === 'revision' ? (x.revisions ?? 0) + 1 : x.revisions,
      } : x)),
    }));
    setFlash(v.id);
    setTimeout(() => setFlash((f) => (f === v.id ? null : f)), 900);
    if (to === 'delivered') toast(t('delivered_toast'));
  };

  const togglePaid = (v: Video) =>
    mutate((d) => ({ ...d, videos: d.videos.map((x) => (x.id === v.id ? { ...x, paid: !x.paid } : x)) }));

  const remove = (v: Video) => {
    if (!confirm(t('confirm_delete'))) return;
    mutate((d) => ({ ...d, videos: d.videos.filter((x) => x.id !== v.id) }));
    toast(t('deleted'));
  };

  if (data.clients.length === 0) {
    return <Empty icon={<Film size={22} />} title={t('no_clients')} />;
  }

  const dueText = (d: DueState) =>
    d.late ? t('late_by', -d.days) : d.days === 0 ? t('today') : d.days === 1 ? t('due_tomorrow') : t('due_in', d.days);

  const cardProps = { t, lang, base, solo, clientName, editorName, dueText, togglePaid, move, flash };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{t('videos')}</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 rounded-xl border p-0.5 surface" role="tablist">
            {(['board', 'list'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={cn('flex min-h-9 items-center gap-1.5 rounded-[0.6rem] px-3 text-xs font-bold transition-colors cursor-pointer',
                  view === v ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted hover:text-[var(--text)]')}>
                {v === 'board' ? <Columns3 size={14} /> : <ListIcon size={14} />}
                <span className="hidden sm:inline">{t(v === 'board' ? 'view_board' : 'view_list')}</span>
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => { setEditing(null); setDraftStage('brief'); }}>
            <Plus size={15} />{t('new_video')}
          </Button>
        </div>
      </header>

      {/* the whole pipeline at a glance */}
      <Card className="overflow-hidden p-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex gap-5">
            <Figure label={t('in_pipeline')} value={active.length} />
            <Figure label={t('due_week')} value={weekCount} />
            <Figure label={t('late_n')} value={lateCount} danger={lateCount > 0} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.7rem]">
            <span className="text-muted">{t('pipeline_value')} <b className="tnum text-[var(--text)]">{showMap(activeValue, lang)}</b></span>
            <span className="text-muted">{t('outstanding')} <b className="tnum text-[var(--accent)]">{showMap(owed, lang)}</b></span>
          </div>
        </div>
        <div className="mt-3.5 flex h-2 gap-[3px] overflow-hidden rounded-full" aria-hidden>
          {list.length === 0
            ? <span className="flex-1 rounded-full bg-[var(--surface-2)]" />
            : STAGES.filter((s) => columns[s].length).map((s) => (
              <span key={s} className="rounded-full transition-[flex-grow] duration-500"
                style={{ flexGrow: columns[s].length, background: STAGE_TONE[s] }} />
            ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {STAGES.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[0.66rem] text-muted">
              <span className="size-1.5 rounded-full" style={{ background: STAGE_TONE[s] }} />
              {t(STAGE_LABEL[s])} <b className="tnum text-[var(--text)]">{columns[s].length}</b>
            </span>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
          <Input className="min-h-11 bg-[var(--surface)] ps-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="min-h-11 w-auto bg-[var(--surface)]" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
          <option value="">{t('clients')} — {t('all')}</option>
          {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <div className="flex gap-0.5 rounded-xl border p-0.5 surface">
          {(['all', 'unpaid', 'paid'] as Filter[]).map((v) => (
            <button key={v} onClick={() => setPaidFilter(v)} aria-pressed={paidFilter === v}
              className={cn('min-h-10 rounded-[0.6rem] px-3 text-xs font-bold transition-colors cursor-pointer',
                paidFilter === v ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted')}>
              {t(v === 'all' ? 'all' : v === 'paid' ? 'paid' : 'unpaid')}
            </button>
          ))}
        </div>
      </div>

      {view === 'board' ? (
        <>
          {/* phones show one stage at a time; the strip is the column switcher */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:hidden">
            {STAGES.map((s) => {
              const Icon = STAGE_ICON[s]; const on = mobileStage === s;
              return (
                <button key={s} onClick={() => setMobileStage(s)} aria-pressed={on}
                  className={cn('flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors cursor-pointer',
                    on ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'surface text-muted')}>
                  <Icon size={13} />{t(STAGE_LABEL[s])}
                  <span className="tnum opacity-70">{columns[s].length}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 md:overflow-x-auto md:pb-2">
            {STAGES.map((s) => {
              const Icon = STAGE_ICON[s];
              const rows = columns[s];
              const capped = s === 'delivered' && !allDelivered && rows.length > DELIVERED_CAP;
              const shown = capped ? rows.slice(0, DELIVERED_CAP) : rows;
              const isOver = over === s && dragId !== null;
              return (
                <section key={s} aria-label={t(STAGE_LABEL[s])}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setOver(s); } }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((o) => (o === s ? null : o)); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const v = data.videos.find((x) => x.id === dragId);
                    if (v) move(v, s);
                    setOver(null); setDragId(null);
                  }}
                  className={cn(
                    'min-w-0 flex-1 flex-col rounded-2xl border transition-[background,border-color,box-shadow] duration-150 md:flex md:min-w-[13rem]',
                    mobileStage === s ? 'flex' : 'hidden',
                    isOver ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]' : '',
                  )}
                  style={{ background: isOver ? 'var(--accent-soft)' : 'color-mix(in oklab, var(--surface-2) 55%, transparent)' }}>
                  <header className="flex items-center gap-2 px-3 pb-2 pt-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: STAGE_TONE[s] }}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[0.8rem] font-extrabold leading-tight">
                        {t(STAGE_LABEL[s])}
                        <span className="tnum rounded-full bg-[var(--surface)] px-1.5 text-[0.62rem] text-muted">{rows.length}</span>
                      </p>
                      <p className="tnum truncate text-[0.62rem] text-faint">
                        {showMap(sumBy(rows, (v) => v.price, (v) => v.currency ?? base), lang, ' ')}
                      </p>
                    </div>
                    <button onClick={() => { setEditing(null); setDraftStage(s); }} aria-label={t('add_here')} title={t('add_here')}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-[var(--surface)] hover:text-[var(--accent)] cursor-pointer">
                      <Plus size={15} />
                    </button>
                  </header>

                  <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                    {shown.map((v) => (
                      <VideoCard key={v.id} v={v} {...cardProps}
                        dragging={dragId === v.id}
                        onDragStart={() => setDragId(v.id)}
                        onDragEnd={() => { setDragId(null); setOver(null); }}
                        onEdit={() => setEditing(v)} />
                    ))}
                    {rows.length === 0 && (
                      <p className="grid min-h-20 flex-1 place-items-center rounded-xl border border-dashed px-3 text-center text-[0.68rem] text-faint">
                        {isOver ? t('drop_here') : t('col_empty')}
                      </p>
                    )}
                    {s === 'delivered' && rows.length > DELIVERED_CAP && (
                      <button onClick={() => setAllDelivered((x) => !x)}
                        className="min-h-10 rounded-xl text-[0.7rem] font-bold text-muted hover:text-[var(--accent)] cursor-pointer">
                        {capped ? t('more_n', rows.length - DELIVERED_CAP) : t('show_less')}
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="overflow-hidden">
          {list.length === 0 ? <Empty icon={<Film size={22} />} title={t('no_videos')} /> : (
            <ul>
              {[...list].sort((a, b) => b.date.localeCompare(a.date)).map((v) => {
                const st = stageOf(v); const due = dueState(v);
                return (
                  <li key={v.id} className="row relative flex items-center gap-3 border-b px-4 py-3 last:border-0">
                    <span aria-hidden className="absolute inset-y-0 start-0 w-[3px]" style={{ background: STAGE_TONE[st] }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-bold">{v.title || '—'}</p>
                        <Chip tone={st === 'delivered' ? 'accent' : 'neutral'}>{t(STAGE_LABEL[st])}</Chip>
                        <button onClick={() => togglePaid(v)} aria-pressed={v.paid}
                          className="relative cursor-pointer after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">
                          <Chip tone={v.paid ? 'accent' : 'neutral'}>{v.paid ? t('paid') : t('unpaid')}</Chip>
                        </button>
                        {due && <Chip tone={due.late ? 'danger' : due.soon ? 'accent' : 'neutral'}><CalendarClock size={10} />{dueText(due)}</Chip>}
                      </div>
                      <p className="tnum truncate text-[0.68rem] text-muted">
                        {clientName(v.clientId)}
                        {!solo && ` · ${editorName(v.editorId)}`}
                        {` · ${fmtDate(v.date)}`}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-sm font-extrabold">{money(v.price, v.currency ?? base, lang)}</span>
                    <div className="flex shrink-0 gap-0.5">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(v)} aria-label={t('edit')}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(v)} aria-label={t('delete')}>
                        <Trash2 size={14} className="text-[var(--danger)]" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {(editing || draftStage) && (
        <VideoForm initial={editing} stage={draftStage ?? 'brief'} onClose={closeForm} onSave={save}
          onDelete={editing ? () => { remove(editing); closeForm(); } : undefined} />
      )}

      <style>{`
        @keyframes landed{0%{box-shadow:0 0 0 0 var(--accent-border);transform:scale(.97)}60%{box-shadow:0 0 0 8px transparent;transform:scale(1.015)}100%{box-shadow:0 0 0 0 transparent;transform:none}}
        .landed{animation:landed .7s cubic-bezier(.32,.72,0,1)}
      `}</style>
    </div>
  );
}

const Figure = ({ label, value, danger }: { label: string; value: number; danger?: boolean }) => (
  <div>
    <p className="tnum text-2xl font-black leading-none" style={danger ? { color: 'var(--danger)' } : undefined}>{value}</p>
    <p className="mt-1 text-[0.66rem] font-bold text-muted">{label}</p>
  </div>
);

/** Five ticks, like frames on a strip: how far along this video is. */
const Track = ({ stage }: { stage: VideoStage }) => {
  const at = STAGES.indexOf(stage);
  return (
    <div className="flex gap-[3px]" aria-hidden>
      {STAGES.map((s, i) => (
        <span key={s} className="h-[3px] flex-1 rounded-full transition-colors duration-300"
          style={{ background: i <= at ? STAGE_TONE[stage] : 'var(--border)' }} />
      ))}
    </div>
  );
};

function VideoCard({
  v, t, lang, base, solo, clientName, editorName, dueText, togglePaid, move, flash,
  dragging, onDragStart, onDragEnd, onEdit,
}: {
  v: Video; t: ReturnType<typeof useApp>['t']; lang: 'ar' | 'en'; base: Currency; solo: boolean;
  clientName: (id: string) => string; editorName: (id: string) => string;
  dueText: (d: DueState) => string; togglePaid: (v: Video) => void;
  move: (v: Video, to: VideoStage) => void; flash: string | null;
  dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onEdit: () => void;
}) {
  const st = stageOf(v);
  const due = dueState(v);
  const next = nextStage(st);
  const client = clientName(v.clientId);
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };

  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', v.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter') onEdit(); }}
      tabIndex={0}
      className={cn(
        'group card lift relative flex cursor-pointer flex-col gap-2.5 p-3 outline-none focus-visible:border-[var(--accent)]',
        dragging && 'opacity-40', flash === v.id && 'landed',
        due?.late && 'border-[color-mix(in_oklab,var(--danger)_45%,var(--border))]',
      )}>
      <div className="flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-md text-[0.62rem] font-black text-[var(--accent)]"
          style={{ background: 'var(--accent-soft)' }}>
          {(client.trim()[0] ?? '•').toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.68rem] font-bold text-muted">
          {client}{!solo && ` · ${editorName(v.editorId)}`}
        </span>
        <GripVertical size={13} className="hidden shrink-0 text-[var(--text-faint)] opacity-0 transition-opacity group-hover:opacity-100 md:block" />
      </div>

      <p className="line-clamp-2 text-[0.84rem] font-bold leading-snug">{v.title || '—'}</p>

      {(due || !!v.revisions || v.link) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {due && (
            <Chip tone={due.late ? 'danger' : due.soon ? 'accent' : 'neutral'}>
              <CalendarClock size={10} />{dueText(due)}
            </Chip>
          )}
          {!!v.revisions && <Chip><RefreshCcw size={10} /><span className="tnum">{v.revisions}</span></Chip>}
          {v.link && (
            <a href={v.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
              aria-label={t('open_file')} title={t('open_file')}
              className="relative inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[0.62rem] font-extrabold text-muted hover:text-[var(--accent)] after:absolute after:-inset-2 after:content-['']">
              <Link2 size={10} />
            </a>
          )}
        </div>
      )}

      <Track stage={st} />

      <div className="flex items-center justify-between gap-2">
        <span className="tnum text-[0.84rem] font-black">{money(v.price, v.currency ?? base, lang)}</span>
        <button onClick={stop(() => togglePaid(v))} aria-pressed={v.paid}
          className="relative cursor-pointer after:absolute after:-inset-2 after:content-['']">
          <Chip tone={v.paid ? 'accent' : 'neutral'}>{v.paid ? t('paid') : t('unpaid')}</Chip>
        </button>
      </div>

      {(next || st === 'review') && (
        <div className="-mx-1 -mb-1 flex gap-1 border-t pt-2">
          {st === 'review' && (
            <button onClick={stop(() => move(v, 'revision'))} title={t('move_to', t('stage_revision'))}
              className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg text-[0.68rem] font-bold text-muted transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] cursor-pointer">
              <RefreshCcw size={12} />{t('stage_revision')}
            </button>
          )}
          {next && (
            <button onClick={stop(() => move(v, next))} title={t('move_to', t(STAGE_LABEL[next]))}
              className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg text-[0.68rem] font-bold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] cursor-pointer">
              {t(STAGE_LABEL[next])}<ArrowRight size={12} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function VideoForm({ initial, stage, onClose, onSave, onDelete }: {
  initial: Video | null; stage: VideoStage; onClose: () => void;
  onSave: (v: Video) => void; onDelete?: () => void;
}) {
  const { t, lang, data, agency, worker } = useApp();
  const st = data.settings;
  const services = st.services.filter((x) => x.name.trim() && x.price > 0);
  const solo = agency?.account_type === 'solo';
  const selfId = worker?.id ?? 'self';

  const [f, setF] = useState<Video>(initial ? { ...initial, stage: stageOf(initial) } : {
    id: '', title: '', clientId: data.clients[0]?.id ?? '',
    editorId: solo || worker ? selfId : (data.editors[0]?.id ?? selfId),
    date: today(), price: 0, currency: st.currency.base, paid: false, stage,
  });
  const [err, setErr] = useState('');
  const cur = f.stage ?? 'brief';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.clientId) return setErr(t('err_name'));
    if (!(Number(f.price) > 0)) return setErr(t('price'));
    const link = f.link?.trim();
    onSave({
      ...f, title: f.title.trim(), price: Number(f.price),
      due: f.due || undefined,
      link: link ? (/^https?:\/\//i.test(link) ? link : `https://${link}`) : undefined,
      revisions: Number(f.revisions) > 0 ? Math.floor(Number(f.revisions)) : undefined,
    });
  };

  return (
    <Modal title={initial ? t('edit') : t('new_video')} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {services.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-muted">{t('quick_pick')}</span>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {services.map((sv) => {
                const on = f.price === sv.price && f.currency === sv.currency && f.title.startsWith(sv.name);
                return (
                  <button key={sv.id} type="button" aria-pressed={on}
                    onClick={() => setF({
                      ...f, price: sv.price, currency: sv.currency,
                      // only fill the title when it is empty or still an untouched pick
                      title: !f.title.trim() || services.some((x) => x.name === f.title) ? sv.name : f.title,
                    })}
                    className={cn('flex min-h-11 shrink-0 flex-col items-start justify-center rounded-xl border px-3 text-start transition-colors cursor-pointer',
                      on ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-2)]')}>
                    <span className={cn('text-[0.72rem] font-extrabold leading-tight', on && 'text-[var(--accent)]')}>{sv.name}</span>
                    <span className="tnum text-[0.62rem] text-muted">{money(sv.price, sv.currency, lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : !initial && !worker && (
          <p className="flex items-start gap-2 rounded-xl px-3 py-2 text-[0.68rem] leading-relaxed text-muted" style={{ background: 'var(--surface-2)' }}>
            <Tags size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />{t('services_tip')}
          </p>
        )}

        <Field label={t('video_title')}>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus={!initial} />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-muted">{t('stage')}</span>
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-[var(--surface-2)] p-1" role="radiogroup" aria-label={t('stage')}>
            {STAGES.map((s) => {
              const Icon = STAGE_ICON[s]; const on = cur === s;
              return (
                <button key={s} type="button" role="radio" aria-checked={on} onClick={() => setF({ ...f, stage: s })}
                  className={cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-[0.58rem] font-extrabold leading-tight transition-all cursor-pointer',
                    on ? 'text-white shadow-[var(--shadow-sm)]' : 'text-muted hover:text-[var(--text)]')}
                  style={on ? { background: STAGE_TONE[s] } : undefined}>
                  <Icon size={15} />{t(STAGE_LABEL[s])}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`grid gap-3 ${solo || worker ? '' : 'sm:grid-cols-2'}`}>
          <Field label={t('clients')}>
            <Select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
              {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          {!solo && !worker && (
            <Field label={t('team')}>
              <Select value={f.editorId} onChange={(e) => setF({ ...f, editorId: e.target.value })}>
                <option value="self">{t('admin')}</option>
                {data.editors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('date')}>
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
          <Field label={t('deadline')}>
            <Input type="date" value={f.due ?? ''} onChange={(e) => setF({ ...f, due: e.target.value })} />
          </Field>
        </div>

        <Field label={t('price')} error={err || undefined}>
          <div className="flex gap-1.5">
            <Input type="number" inputMode="decimal" step="any" className="tnum flex-1"
              value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
            <Select className="w-24" value={f.currency}
              onChange={(e) => setF({ ...f, currency: e.target.value as Currency })}>
              {st.currency.list.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </Select>
          </div>
        </Field>

        <div className="grid grid-cols-[1fr_6.5rem] gap-3">
          <Field label={t('file_link')}>
            <Input dir="ltr" inputMode="url" placeholder="drive.google.com/…" className="text-start"
              value={f.link ?? ''} onChange={(e) => setF({ ...f, link: e.target.value })} />
          </Field>
          <Field label={t('revisions_n')}>
            <Input type="number" inputMode="numeric" min={0} className="tnum"
              value={f.revisions || ''} placeholder="0"
              onChange={(e) => setF({ ...f, revisions: Number(e.target.value) })} />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border bg-[var(--surface-2)] px-3.5 py-3">
          <input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })}
            className="size-4 accent-[var(--accent)]" />
          <span className="text-sm font-bold">{t('paid')}</span>
        </label>

        <ModalActions>
          {onDelete && (
            <Button type="button" variant="danger" onClick={onDelete} aria-label={t('delete')}>
              <Trash2 size={15} />
            </Button>
          )}
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1">{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
