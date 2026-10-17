'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { api } from '@/lib/api';
import { Button, Card, Chip, Empty, Field, Input, Select } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { showMap, sumBy } from '@/lib/money';
import { uid } from '@/lib/utils';
import type { Editor, Role } from '@/lib/types';
import { Users, Pencil, Trash2, Plus, Info } from 'lucide-react';

const ROLES: Role[] = ['editor', 'filmmaker', 'designer'];
const ROLE_LABEL: Record<Role, string> = { editor: 'Editor', filmmaker: 'Filmmaker', designer: 'Designer' };

export function Team() {
  const { t, lang, data, mutate, toast } = useApp();
  const base = data.settings.currency.base;
  const [editing, setEditing] = useState<Editor | null>(null);
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const m: Record<string, { count: number; total: ReturnType<typeof sumBy>; owed: ReturnType<typeof sumBy> }> = {};
    data.editors.forEach((e) => {
      const v = data.videos.filter((x) => x.editorId === e.id);
      m[e.id] = {
        count: v.length,
        total: sumBy(v, (x) => x.price, (x) => x.currency ?? base),
        owed: sumBy(v.filter((x) => !x.paid), (x) => x.price, (x) => x.currency ?? base),
      };
    });
    return m;
  }, [data.editors, data.videos, base]);

  const save = async (name: string, role: Role, pw: string) => {
    // passwords are bcrypted server-side; plaintext never reaches a row
    let hash: string | undefined;
    if (pw) {
      try { hash = await api.hashPassword(pw); }
      catch { return toast(t('err_net'), 'err'); }
    }
    mutate((d) => ({
      ...d,
      editors: editing
        ? d.editors.map((x) => (x.id === editing.id ? { ...x, name, role, ...(hash ? { pw: hash } : {}) } : x))
        : [...d.editors, { id: uid(), name, role, pw: hash }],
    }));
    toast(t('saved'));
    setOpen(false); setEditing(null);
  };

  const remove = (e: Editor) => {
    if (!confirm(t('confirm_delete'))) return;
    mutate((d) => ({
      ...d,
      editors: d.editors.filter((x) => x.id !== e.id),
      videos: d.videos.filter((v) => v.editorId !== e.id),
      tasks: d.tasks.map((k) => (k.editorId === e.id ? { ...k, editorId: '' } : k)),
    }));
    toast(t('deleted'));
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('team')}</h1>
          <p className="tnum text-xs text-muted">{data.editors.length}</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={15} />{t('add')}
        </Button>
      </header>

      <Card className="flex items-start gap-2.5 p-3 text-[0.72rem]"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
        <p style={{ color: 'var(--accent)' }}>{t('pw_hint')} — {t('workspace_email')}</p>
      </Card>

      <Card className="overflow-hidden">
        {data.editors.length === 0 ? <Empty icon={<Users size={22} />} title={t('team')} /> : (
          <ul>
            {data.editors.map((e) => {
              const s = stats[e.id] ?? { count: 0, total: {}, owed: {} };
              return (
                <li key={e.id} className="row flex items-center gap-3 border-b px-4 py-3 last:border-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-black text-white"
                    style={{ background: 'linear-gradient(135deg,var(--accent),color-mix(in oklab,var(--accent) 60%,black))' }}>
                    {e.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-bold">{e.name}</p>
                      <Chip>{ROLE_LABEL[e.role] ?? e.role}</Chip>
                    </div>
                    <p className="tnum truncate text-[0.68rem] text-muted">
                      {s.count} {t('videos')}
                      {Object.keys(s.total).length > 0 && ` · ${showMap(s.total, lang)}`}
                      {Object.keys(s.owed).length > 0 && ` · ⏳ ${showMap(s.owed, lang)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }} aria-label={t('edit')}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(e)} aria-label={t('delete')}>
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {open && <MemberForm initial={editing} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function MemberForm({ initial, onClose, onSave }: {
  initial: Editor | null; onClose: () => void;
  onSave: (name: string, role: Role, pw: string) => Promise<void>;
}) {
  const { t } = useApp();
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState<Role>(initial?.role ?? 'editor');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr(t('err_name'));
    if (!initial && pw.length < 4) return setErr(t('err_pw'));
    if (initial && pw && pw.length < 4) return setErr(t('err_pw'));
    setBusy(true);
    await onSave(name.trim(), role, pw);
    setBusy(false);
  };

  return (
    <Modal title={initial ? t('edit') : t('worker')} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label={t('your_name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </Field>
        <Field label={t('password')} hint={initial ? '—' : t('pw_hint')} error={err || undefined}>
          <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <ModalActions>
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1" loading={busy}>{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
