'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Chip, Empty, Field, Input, Select, Stat } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { money, showMap, sumBy } from '@/lib/money';
import { uid, today, fmtDate, matches } from '@/lib/utils';
import type { Video, Currency } from '@/lib/types';
import { Film, Pencil, Trash2, Plus, Search } from 'lucide-react';

type Filter = 'all' | 'paid' | 'unpaid';

export function Videos() {
  const { t, lang, data, mutate, toast, agency, worker } = useApp();
  const base = data.settings.currency.base;
  const solo = agency?.account_type === 'solo' || !!worker;

  const [q, setQ] = useState('');
  const [paidFilter, setPaidFilter] = useState<Filter>('all');
  const [clientFilter, setClientFilter] = useState('');
  const [editing, setEditing] = useState<Video | null>(null);
  const [open, setOpen] = useState(false);

  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? '—';
  const editorName = (id: string) => data.editors.find((e) => e.id === id)?.name ?? '—';

  const list = useMemo(() => {
    let v = worker ? data.videos.filter((x) => x.editorId === worker.id) : data.videos;
    if (clientFilter) v = v.filter((x) => x.clientId === clientFilter);
    if (paidFilter !== 'all') v = v.filter((x) => (paidFilter === 'paid' ? x.paid : !x.paid));
    if (q) v = v.filter((x) => matches(q, x.title, clientName(x.clientId)));
    return [...v].sort((a, b) => b.date.localeCompare(a.date));
  }, [data.videos, data.clients, q, paidFilter, clientFilter, worker]);

  const totals = sumBy(list, (v) => v.price, (v) => v.currency ?? base);
  const owed = sumBy(list.filter((v) => !v.paid), (v) => v.price, (v) => v.currency ?? base);

  const save = (v: Video) => {
    mutate((d) => ({
      ...d,
      videos: editing
        ? d.videos.map((x) => (x.id === editing.id ? { ...x, ...v } : x))
        : [{ ...v, id: uid(), createdAt: new Date().toISOString() }, ...d.videos],
    }));
    toast(t('saved'));
    setOpen(false); setEditing(null);
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

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('videos')}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Stat label={t('video_count')} value={list.length} />
            <Stat label={t('total')} value={showMap(totals, lang)} />
            <Stat label={t('outstanding')} value={showMap(owed, lang)} tone="var(--accent)" />
          </div>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={15} />{t('new_video')}
        </Button>
      </header>

      <Card className="flex flex-col gap-2 p-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
          <Input className="ps-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select className="min-h-11 w-auto flex-1" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">{t('clients')} — {t('all')}</option>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="flex gap-1 rounded-xl bg-[var(--surface-2)] p-1">
            {(['all', 'unpaid', 'paid'] as Filter[]).map((v) => (
              <button key={v} onClick={() => setPaidFilter(v)}
                aria-pressed={paidFilter === v}
                className={`min-h-10 flex-1 rounded-lg px-3 text-xs font-bold transition-colors cursor-pointer ${
                  paidFilter === v ? 'surface text-[var(--accent)] shadow-[var(--shadow-sm)]' : 'text-muted'}`}>
                {t(v === 'all' ? 'all' : v === 'paid' ? 'paid' : 'unpaid')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {list.length === 0 ? <Empty icon={<Film size={22} />} title={t('no_videos')} /> : (
          <ul>
            {list.map((v) => (
              <li key={v.id} className="row relative flex items-center gap-3 border-b px-4 py-3 last:border-0">
                <span aria-hidden className="absolute inset-y-0 start-0 w-[3px]"
                  style={{ background: v.paid ? 'var(--accent)' : 'var(--text-faint)' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-bold">{v.title || '—'}</p>
                    <button onClick={() => togglePaid(v)} aria-pressed={v.paid}
                      aria-label={v.paid ? t('paid') : t('unpaid')}
                      className="relative cursor-pointer after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">
                      <Chip tone={v.paid ? 'accent' : 'neutral'}>{v.paid ? t('paid') : t('unpaid')}</Chip>
                    </button>
                  </div>
                  <p className="tnum truncate text-[0.68rem] text-muted">
                    {clientName(v.clientId)}
                    {!solo && ` · ${editorName(v.editorId)}`}
                    {` · ${fmtDate(v.date)}`}
                  </p>
                </div>
                <span className="tnum shrink-0 text-sm font-extrabold">{money(v.price, v.currency ?? base, lang)}</span>
                <div className="flex shrink-0 gap-0.5">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(v); setOpen(true); }} aria-label={t('edit')}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(v)} aria-label={t('delete')}>
                    <Trash2 size={14} className="text-[var(--danger)]" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && (
        <VideoForm initial={editing} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />
      )}
    </div>
  );
}

function VideoForm({ initial, onClose, onSave }: {
  initial: Video | null; onClose: () => void; onSave: (v: Video) => void;
}) {
  const { t, data, agency, worker } = useApp();
  const st = data.settings;
  const solo = agency?.account_type === 'solo';
  const selfId = worker?.id ?? 'self';

  const [f, setF] = useState<Video>(initial ?? {
    id: '', title: '', clientId: data.clients[0]?.id ?? '',
    editorId: solo || worker ? selfId : (data.editors[0]?.id ?? selfId),
    date: today(), price: 0, currency: st.currency.base, paid: false,
  });
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.clientId) return setErr(t('err_name'));
    if (!(Number(f.price) > 0)) return setErr(t('price'));
    onSave({ ...f, title: f.title.trim(), price: Number(f.price) });
  };

  return (
    <Modal title={initial ? t('edit') : t('new_video')} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label={t('video_title')}>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
        </Field>
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
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border bg-[var(--surface-2)] px-3.5 py-3">
          <input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })}
            className="size-4 accent-[var(--accent)]" />
          <span className="text-sm font-bold">{t('paid')}</span>
        </label>
        <ModalActions>
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1">{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
