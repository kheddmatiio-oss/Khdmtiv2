'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Empty, Field, Input, Textarea } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { money, showMap, sumBy } from '@/lib/money';
import { uid, matches } from '@/lib/utils';
import type { Client } from '@/lib/types';
import { Briefcase, Pencil, Trash2, Plus, Search } from 'lucide-react';

export function Clients() {
  const { t, lang, data, mutate, toast } = useApp();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);
  const base = data.settings.currency.base;

  const stats = useMemo(() => {
    const m: Record<string, { count: number; total: ReturnType<typeof sumBy> }> = {};
    data.clients.forEach((c) => {
      const vids = data.videos.filter((v) => v.clientId === c.id);
      m[c.id] = { count: vids.length, total: sumBy(vids, (v) => v.price, (v) => v.currency ?? base) };
    });
    return m;
  }, [data.clients, data.videos, base]);

  const list = data.clients.filter((c) => matches(q, c.name, c.nif, c.rc));

  const save = (c: Client) => {
    mutate((d) => ({
      ...d,
      clients: editing
        ? d.clients.map((x) => (x.id === editing.id ? { ...x, ...c } : x))
        : [...d.clients, { ...c, id: uid() }],
    }));
    toast(t('saved'));
    setOpen(false); setEditing(null);
  };

  const remove = (c: Client) => {
    if (!confirm(t('confirm_delete'))) return;
    // deleting a client takes its work and paperwork with it
    mutate((d) => ({
      ...d,
      clients: d.clients.filter((x) => x.id !== c.id),
      videos: d.videos.filter((v) => v.clientId !== c.id),
      invoices: d.invoices.filter((i) => i.clientId !== c.id),
      tasks: d.tasks.filter((k) => k.clientId !== c.id),
    }));
    toast(t('deleted'));
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('clients')}</h1>
          <p className="tnum text-xs text-muted">{data.clients.length}</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={15} />{t('new_client')}
        </Button>
      </header>

      {data.clients.length > 4 && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
          <Input className="ps-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <Empty icon={<Briefcase size={22} />} title={t('no_clients')} />
        ) : (
          <ul>
            {list.map((c) => {
              const s = stats[c.id] ?? { count: 0, total: {} };
              const fiscal = [c.nif && `NIF ${c.nif}`, c.rc && `RC ${c.rc}`].filter(Boolean).join(' · ');
              return (
                <li key={c.id} className="row flex items-center gap-3 border-b px-4 py-3 last:border-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-black"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="truncate text-[0.68rem] text-muted">
                      {s.count} {t('videos')}
                      {Object.keys(s.total).length > 0 && ` · ${showMap(s.total, lang)}`}
                    </p>
                    {fiscal && <p className="tnum truncate text-[0.6rem] text-faint">{fiscal}</p>}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }} aria-label={t('edit')}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c)} aria-label={t('delete')}>
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {open && (
        <ClientForm
          initial={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function ClientForm({ initial, onClose, onSave }: {
  initial: Client | null; onClose: () => void; onSave: (c: Client) => void;
}) {
  const { t } = useApp();
  const [f, setF] = useState<Client>(initial ?? { id: '', name: '', address: '', nif: '', nis: '', rc: '' });
  const [err, setErr] = useState('');
  const set = (k: keyof Client) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr(t('err_name'));
    onSave({ ...f, name: f.name.trim() });
  };

  return (
    <Modal title={initial ? t('edit') : t('new_client')} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label={t('client_name')} error={err || undefined}>
          <Input value={f.name} onChange={set('name')} autoFocus />
        </Field>
        <Field label={t('address')}>
          <Textarea rows={2} value={f.address ?? ''} onChange={set('address')} />
        </Field>
        <p className="-mt-1 text-[0.68rem] text-faint">{t('fiscal_hint')}</p>
        <div className="grid grid-cols-3 gap-2">
          <Field label="NIF"><Input className="tnum" value={f.nif ?? ''} onChange={set('nif')} /></Field>
          <Field label="NIS"><Input className="tnum" value={f.nis ?? ''} onChange={set('nis')} /></Field>
          <Field label="RC"><Input className="tnum" value={f.rc ?? ''} onChange={set('rc')} /></Field>
        </div>
        <ModalActions>
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1">{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
