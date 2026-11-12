'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { PRICE } from '@/lib/pricing';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { Button, Card, Chip, Empty, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { SupportInbox } from '@/components/SupportInbox';
import { AffiliatesAdmin } from '@/components/AffiliatesAdmin';
import { fmtDate } from '@/lib/utils';
import type { Agency, AppData } from '@/lib/types';
import { Crown, LogOut, Pencil, Trash2, Eye, Sun, Moon, Languages, ShieldCheck, Ban, KeyRound } from 'lucide-react';

const daysLeft = (a: Agency) =>
  a.plan_expires_at ? Math.max(0, Math.ceil((+new Date(a.plan_expires_at) - Date.now()) / 86400000)) : null;
const expired = (a: Agency) => !!a.plan_expires_at && new Date(a.plan_expires_at) < new Date();

export function SuperAdmin() {
  const { t, lang, setLang, dark, toggleTheme, signOut, toast } = useApp();
  const [rows, setRows] = useState<Agency[] | null>(null);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [peek, setPeek] = useState<{ agency: Agency; data: AppData } | null>(null);
  // bumped after a payment so the affiliate totals reload with the new commission
  const [tick, setTick] = useState(0);

  const refresh = () => api.adminAgencies().then(setRows).catch(() => toast(t('err_net'), 'err'));
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const update = async (id: string, patch: Partial<Agency>) => {
    try {
      await api.adminUpdate(id, patch);
      setRows((r) => r?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? null);
      toast(t('saved')); setEditing(null);
    } catch { toast(t('err_net'), 'err'); }
  };

  const remove = async (a: Agency) => {
    if (!confirm(`${t('confirm_delete')}\n\n${a.name} — ${a.email}`)) return;
    try { await api.adminDelete(a.id); setRows((r) => r?.filter((x) => x.id !== a.id) ?? null); toast(t('deleted')); }
    catch { toast(t('err_net'), 'err'); }
  };

  const view = async (a: Agency) => {
    try { setPeek({ agency: a, data: await api.adminData(a.id) }); }
    catch { toast(t('err_net'), 'err'); }
  };

  const stats = rows && {
    total: rows.length,
    active: rows.filter((a) => a.is_active && !expired(a)).length,
    paying: rows.filter((a) => a.plan !== 'free' && a.plan !== 'trial').length,
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-xl"
        style={{ background: 'color-mix(in oklab, var(--bg) 88%, transparent)' }}>
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black">
              Super Admin <Crown size={13} style={{ color: 'var(--warn)' }} />
            </p>
            <p className="text-[0.62rem] text-faint">{rows?.length ?? '…'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <Languages size={14} />{lang === 'ar' ? 'EN' : 'ع'}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="theme">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </Button>
          <Button size="sm" variant="danger" onClick={signOut}><LogOut size={14} />{t('logout')}</Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[['Accounts', stats.total], ['Active', stats.active], ['Paying', stats.paying]].map(([k, v]) => (
              <Card key={k as string} className="p-4">
                <p className="text-[0.68rem] font-semibold text-muted">{k}</p>
                <p className="tnum text-2xl font-black">{v}</p>
              </Card>
            ))}
          </div>
        )}

        <SupportInbox />
        <AffiliatesAdmin refreshKey={tick} />

        <Card className="overflow-hidden">
          {!rows ? <Empty icon={<ShieldCheck size={22} />} title={t('loading')} />
            : rows.length === 0 ? <Empty icon={<ShieldCheck size={22} />} title="—" />
            : (
              <ul>
                {rows.map((a) => {
                  const d = daysLeft(a), exp = expired(a);
                  return (
                    <li key={a.id} className="row flex items-center gap-3 border-b px-4 py-3 last:border-0">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-black"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-bold">{a.name}</p>
                          <Chip tone={a.plan === 'free' || a.plan === 'trial' ? 'neutral' : 'accent'}>{a.plan}</Chip>
                          {a.is_super && <Chip tone="warn"><Crown size={9} /></Chip>}
                          {!a.is_active && <Chip tone="danger"><Ban size={9} /></Chip>}
                          {exp && a.is_active && <Chip tone="danger">expired</Chip>}
                        </div>
                        <p className="truncate text-[0.66rem] text-muted">{a.email}{a.phone && ` · ${a.phone}`}</p>
                        {d !== null && !exp && (
                          <p className="tnum text-[0.6rem]" style={{ color: d < 7 ? 'var(--danger)' : 'var(--text-faint)' }}>
                            {d}d · {fmtDate(a.plan_expires_at ?? undefined)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button size="sm" variant="ghost" onClick={() => view(a)} aria-label="view"><Eye size={14} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(a)} aria-label={t('edit')}><Pencil size={14} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(a)} aria-label={t('delete')}>
                          <Trash2 size={14} className="text-[var(--danger)]" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
        </Card>
      </main>

      {editing && <AgencyForm agency={editing} onClose={() => setEditing(null)} onSave={update}
        onPaid={() => { setEditing(null); refresh(); setTick((n) => n + 1); }} />}
      {peek && (
        <Modal title={peek.agency.name} onClose={() => setPeek(null)}>
          <div className="grid grid-cols-3 gap-2">
            {([['clients', peek.data.clients.length], ['videos', peek.data.videos.length],
               ['invoices', peek.data.invoices.length], ['tasks', peek.data.tasks.length],
               ['team', peek.data.editors.length]] as const).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
                <p className="tnum text-xl font-black" style={{ color: 'var(--accent)' }}>{v}</p>
                <p className="text-[0.6rem] text-muted">{k}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function AgencyForm({ agency, onClose, onSave, onPaid }: {
  agency: Agency; onClose: () => void;
  onSave: (id: string, patch: Partial<Agency>) => void;
  onPaid: () => void;
}) {
  const { t, toast } = useApp();
  const [active, setActive] = useState(agency.is_active);
  const [notes, setNotes] = useState(agency.notes ?? '');
  const [downgrade, setDowngrade] = useState(false);

  // paid plans are only ever set through a recorded payment, so no renewal
  // can slip past the affiliate who brought the account in
  const [payPlan, setPayPlan] = useState<'basic' | 'pro'>(agency.plan === 'basic' ? 'basic' : 'pro');
  const [payDays, setPayDays] = useState('30');
  const [amount, setAmount] = useState(String(PRICE.amount));
  const [currency, setCurrency] = useState('DZD');
  const [paying, setPaying] = useState(false);

  const [newPw, setNewPw] = useState('');
  const [resetting, setResetting] = useState(false);

  const resetPassword = async () => {
    if (newPw.length < 4) return toast(t('err_pw'), 'err');
    setResetting(true);
    try { await api.adminSetPassword(agency.id, newPw); setNewPw(''); toast(t('reset_pw_done')); }
    catch { toast(t('err_net'), 'err'); }
    finally { setResetting(false); }
  };

  const recordPayment = async () => {
    const n = Number(amount);
    if (!(n >= 0) || amount === '') return toast(t('amount_paid'), 'err');
    setPaying(true);
    try {
      await api.adminRecordPayment(agency.id, n, currency, payPlan, Number(payDays));
      toast(t('payment_recorded'));
      onPaid();
    } catch { toast(t('err_net'), 'err'); }
    finally { setPaying(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: Partial<Agency> = { is_active: active, notes };
    if (downgrade) { patch.plan = 'free'; patch.plan_expires_at = null; }
    onSave(agency.id, patch);
  };

  return (
    <Modal title={agency.name} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {/* record a payment — activates or renews, and credits the referrer */}
        <div className="rounded-xl border p-3" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
          <p className="mb-2.5 text-xs font-extrabold" style={{ color: 'var(--accent)' }}>{t('record_payment')}</p>
          <div className="grid grid-cols-2 gap-2">
            <Select value={payPlan} onChange={(e) => setPayPlan(e.target.value as 'basic' | 'pro')} className="min-h-11">
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </Select>
            <Select value={payDays} className="min-h-11" onChange={(e) => {
              // keep the suggested amount in step with the period, unless it was typed by hand
              const auto = (d: string) => String(Math.round(PRICE.amount * Number(d) / PRICE.days));
              if (amount === '' || amount === auto(payDays)) setAmount(auto(e.target.value));
              setPayDays(e.target.value);
            }}>
              <option value="30">30 d</option>
              <option value="90">90 d</option>
              <option value="365">365 d</option>
            </Select>
            <Input type="number" inputMode="decimal" min="0" step="any" placeholder={t('amount_paid')}
              className="tnum min-h-11" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} className="min-h-11">
              {['DZD', 'EUR', 'USD'].map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <Button type="button" variant="primary" className="mt-2.5 w-full" loading={paying}
            disabled={amount === ''} onClick={recordPayment}>
            {t('record_payment')}
          </Button>
        </div>

        {agency.plan !== 'free' && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-bold">
            <input type="checkbox" checked={downgrade} onChange={(e) => setDowngrade(e.target.checked)}
              className="size-4 accent-[var(--danger)]" />
            <span style={{ color: downgrade ? 'var(--danger)' : undefined }}>→ free</span>
          </label>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3"
          style={{ background: active ? 'var(--accent-soft)' : 'var(--danger-soft)' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
            className="size-4 accent-[var(--accent)]" />
          <span className="text-sm font-bold" style={{ color: active ? 'var(--accent)' : 'var(--danger)' }}>
            {active ? 'Active' : 'Suspended'}
          </span>
        </label>
        <Field label="Notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="rounded-xl border p-3">
          <Field label={t('reset_pw')} hint={t('reset_pw_hint')}>
            <div className="flex gap-2">
              <Input type="text" autoComplete="off" className="flex-1" value={newPw}
                onChange={(e) => setNewPw(e.target.value)} placeholder="••••••" />
              <Button type="button" onClick={resetPassword} loading={resetting} disabled={newPw.length < 4}>
                <KeyRound size={14} />
              </Button>
            </div>
          </Field>
        </div>

        <ModalActions>
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1">{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
