'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Chip, Empty, Field, FilterPill, FilterRow, Input, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { uid, today, fmtDate, isPast } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';
import { CheckSquare, Pencil, Trash2, Plus, Check } from 'lucide-react';

const NEXT: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' };

export function Tasks() {
  const { t, data, mutate, toast, worker, agency } = useApp();
  const solo = agency?.account_type === 'solo' || !!worker;
  const [view, setView] = useState<'open' | 'done' | 'all'>('open');
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const mine = useMemo(
    () => (worker ? data.tasks.filter((k) => k.editorId === worker.id) : data.tasks),
    [data.tasks, worker],
  );

  const list = useMemo(() => {
    const f = view === 'all' ? mine
      : view === 'done' ? mine.filter((k) => k.status === 'done')
      : mine.filter((k) => k.status !== 'done');
    // in progress first, then urgent, then nearest deadline
    return [...f].sort((a, b) =>
      (a.status === 'doing' ? 0 : 1) - (b.status === 'doing' ? 0 : 1) ||
      Number(b.priority === 'high') - Number(a.priority === 'high') ||
      (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  }, [mine, view]);

  const counts = {
    open: mine.filter((k) => k.status !== 'done').length,
    done: mine.filter((k) => k.status === 'done').length,
    all: mine.length,
  };

  const cycle = (k: Task) =>
    mutate((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === k.id ? { ...x, status: NEXT[x.status] } : x)) }));

  const save = (k: Task) => {
    mutate((d) => ({
      ...d,
      tasks: editing
        ? d.tasks.map((x) => (x.id === editing.id ? { ...x, ...k } : x))
        : [{ ...k, id: uid(), createdAt: new Date().toISOString(), editorId: worker?.id ?? k.editorId }, ...d.tasks],
    }));
    toast(t('saved'));
    setOpen(false); setEditing(null);
  };

  const remove = (k: Task) => {
    if (!confirm(t('confirm_delete'))) return;
    mutate((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== k.id) }));
    toast(t('deleted'));
  };

  const statusTone = (s: TaskStatus) =>
    s === 'done' ? 'var(--accent)' : s === 'doing' ? 'var(--accent)' : 'var(--text-faint)';

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('tasks')}</h1>
          <p className="tnum text-xs text-muted">{counts.open} {t('open_tasks')}</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={15} />{t('new_task')}
        </Button>
      </header>

      <FilterRow>
        {(['open', 'done', 'all'] as const).map((v) => (
          <FilterPill key={v} active={view === v} count={counts[v]} onClick={() => setView(v)}>
            {t(v === 'open' ? 'open_tasks' : v === 'done' ? 'done' : 'all')}
          </FilterPill>
        ))}
      </FilterRow>

      <Card className="overflow-hidden">
        {list.length === 0 ? <Empty icon={<CheckSquare size={22} />} title={t('no_tasks')} /> : (
          <ul>
            {list.map((k) => {
              const late = k.status !== 'done' && isPast(k.due);
              const dueToday = k.status !== 'done' && k.due === today();
              const client = data.clients.find((c) => c.id === k.clientId);
              const assignee = data.editors.find((e) => e.id === k.editorId);
              return (
                <li key={k.id} className="row relative flex items-start gap-3 border-b px-4 py-3 last:border-0">
                  <span aria-hidden className="absolute inset-y-0 start-0 w-[3px]"
                    style={{ background: k.priority === 'high' && k.status !== 'done' ? 'var(--danger)' : statusTone(k.status), opacity: k.status === 'done' ? .4 : 1 }} />
                  <button onClick={() => cycle(k)} aria-label={t(k.status)}
                    className="mt-0.5 grid size-5 shrink-0 cursor-pointer place-items-center rounded-md border-2 transition-colors"
                    style={{
                      borderColor: statusTone(k.status),
                      background: k.status === 'done' ? 'var(--accent)' : 'transparent',
                    }}>
                    {k.status === 'done' && <Check size={11} className="text-white" />}
                    {k.status === 'doing' && <span className="size-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={`text-sm font-bold ${k.status === 'done' ? 'text-faint line-through' : ''}`}>{k.title}</p>
                      {k.priority === 'high' && k.status !== 'done' && <Chip tone="danger">{t('urgent')}</Chip>}
                    </div>
                    <p className="tnum mt-0.5 flex flex-wrap gap-x-1.5 text-[0.68rem] text-muted">
                      <span style={{ color: statusTone(k.status), fontWeight: 700 }}>{t(k.status)}</span>
                      {!solo && <>· <span>{assignee?.name ?? t('unassigned')}</span></>}
                      {client && <>· <span>{client.name}</span></>}
                      {k.due && (
                        <>· <span style={{ color: late ? 'var(--danger)' : dueToday ? 'var(--warn)' : undefined, fontWeight: late || dueToday ? 700 : 400 }}>
                          {late ? `${t('overdue')} · ` : dueToday ? `${t('today')} · ` : ''}{fmtDate(k.due)}
                        </span></>
                      )}
                    </p>
                    {k.notes && <p className="mt-1 text-[0.68rem] text-faint">{k.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(k); setOpen(true); }} aria-label={t('edit')}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(k)} aria-label={t('delete')}>
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {open && <TaskForm initial={editing} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function TaskForm({ initial, onClose, onSave }: {
  initial: Task | null; onClose: () => void; onSave: (k: Task) => void;
}) {
  const { t, data, agency, worker } = useApp();
  const solo = agency?.account_type === 'solo' || !!worker;
  const [f, setF] = useState<Task>(initial ?? {
    id: '', title: '', status: 'todo', priority: 'normal',
    editorId: '', clientId: '', due: '', notes: '',
  });
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return setErr(t('err_name'));
    onSave({ ...f, title: f.title.trim() });
  };

  return (
    <Modal title={initial ? t('edit') : t('new_task')} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label={t('task_title')} error={err || undefined}>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          {!solo && (
            <Field label={t('assigned_to')}>
              <Select value={f.editorId ?? ''} onChange={(e) => setF({ ...f, editorId: e.target.value })}>
                <option value="">{t('unassigned')}</option>
                {data.editors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label={t('clients')}>
            <Select value={f.clientId ?? ''} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
              <option value="">—</option>
              {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('due')}>
            <Input type="date" value={f.due ?? ''} onChange={(e) => setF({ ...f, due: e.target.value })} />
          </Field>
          <Field label={t('priority')}>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-2)] p-1">
              {(['normal', 'high'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setF({ ...f, priority: p })}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    f.priority === p ? 'surface shadow-[var(--shadow-sm)]' : 'text-muted'}`}
                  style={f.priority === p ? { color: p === 'high' ? 'var(--danger)' : 'var(--text)' } : undefined}>
                  {t(p === 'high' ? 'urgent' : 'normal')}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label={t('todo') + ' / ' + t('doing') + ' / ' + t('done')}>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-2)] p-1">
            {(['todo', 'doing', 'done'] as TaskStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setF({ ...f, status: s })}
                className={`rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  f.status === s ? 'surface text-[var(--accent)] shadow-[var(--shadow-sm)]' : 'text-muted'}`}>
                {t(s)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('object')}>
          <Textarea rows={2} value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
        <ModalActions>
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1">{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
