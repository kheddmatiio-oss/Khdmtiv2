'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Field, Input, Section, Select, Textarea } from '@/components/ui/primitives';
import { ALL_CURRENCIES } from '@/lib/money';
import type { Currency, Settings as S } from '@/lib/types';
import { Building2, Receipt, Wallet, Palette, Trash2, Upload } from 'lucide-react';

type Tab = 'company' | 'invoice' | 'currency' | 'appearance';
const PALETTE = ['', '#0D7CFB', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#14B8A6', '#0EA5E9'];
const MAX_LOGO = 500 * 1024;

export function SettingsScreen() {
  const { t, data, mutate, toast } = useApp();
  const [tab, setTab] = useState<Tab>('company');
  const [draft, setDraft] = useState<S>(data.settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);

  const set = <K extends keyof S>(sec: K, patch: Partial<S[K]>) =>
    setDraft((p) => ({ ...p, [sec]: { ...p[sec], ...patch } }));

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO) return toast(t('logo') + ' — 500 KB', 'err');
    const r = new FileReader();
    r.onload = () => set('company', { logo: String(r.result) });
    r.readAsDataURL(file);
  };

  const apply = () => { mutate((d) => ({ ...d, settings: draft })); toast(t('saved')); };

  const TABS: [Tab, string, React.ReactNode][] = [
    ['company', t('sec_company'), <Building2 key="a" size={13} />],
    ['invoice', t('sec_invoice'), <Receipt key="b" size={13} />],
    ['currency', t('sec_currency'), <Wallet key="c" size={13} />],
    ['appearance', t('sec_appearance'), <Palette key="d" size={13} />],
  ];
  const C = draft.company, I = draft.invoice;

  return (
    <div className={`flex flex-col gap-4 ${dirty ? 'pb-20' : ''}`}>
      <h1 className="text-2xl font-black tracking-tight">{t('settings')}</h1>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(([v, label, icon]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              tab === v ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'surface text-muted'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <Section title={t('sec_company')}>
          <div className="flex flex-col gap-3.5 p-4">
            <div className="flex items-center gap-4">
              <div className="grid size-18 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed bg-[var(--surface-2)]">
                {C.logo ? <img src={C.logo} alt="" className="max-h-full max-w-full object-contain" />
                        : <Building2 size={20} className="text-faint" />}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                  <Upload size={12} className="inline" /> {t('upload_logo')}
                  <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
                </label>
                {C.logo && (
                  <Button size="sm" variant="ghost" onClick={() => set('company', { logo: '' })}>
                    <Trash2 size={12} />{t('remove')}
                  </Button>
                )}
              </div>
            </div>
            <Field label={t('company_name')}>
              <Input value={C.name} onChange={(e) => set('company', { name: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('email')}>
                <Input type="email" value={C.email} onChange={(e) => set('company', { email: e.target.value })} />
              </Field>
              <Field label={t('phone')}>
                <Input value={C.phone} onChange={(e) => set('company', { phone: e.target.value })} />
              </Field>
            </div>
            <Field label={t('address')}>
              <Textarea rows={2} value={C.address} onChange={(e) => set('company', { address: e.target.value })} />
            </Field>
            <p className="-mt-1 text-[0.68rem] text-faint">{t('fiscal_hint')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['nif', 'nis', 'rc', 'art'] as const).map((k) => (
                <Field key={k} label={k.toUpperCase()}>
                  <Input className="tnum" value={C[k]} onChange={(e) => set('company', { [k]: e.target.value } as never)} />
                </Field>
              ))}
            </div>
            <Field label="RIP">
              <Input className="tnum" value={C.rip} onChange={(e) => set('company', { rip: e.target.value })} />
            </Field>
          </div>
        </Section>
      )}

      {tab === 'invoice' && (
        <Section title={t('sec_invoice')}>
          <div className="flex flex-col gap-3.5 p-4">
            <Field label={t('invoice_lang')} hint={t('invoice_lang_hint')}>
              <Select value={I.lang} onChange={(e) => set('invoice', { lang: e.target.value as S['invoice']['lang'] })}>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('vat_rate')}>
                <Input type="number" step="any" inputMode="decimal" className="tnum"
                  value={I.vat || ''} onChange={(e) => set('invoice', { vat: Number(e.target.value) })} />
              </Field>
              <Field label={t('invoice_no')}>
                <Input value={I.prefix} placeholder="F" onChange={(e) => set('invoice', { prefix: e.target.value })} />
              </Field>
            </div>
            <Field label={t('payment_mode')}>
              <Input value={I.paymentMode} onChange={(e) => set('invoice', { paymentMode: e.target.value })} />
            </Field>
            <Field label={t('object')}>
              <Input value={I.object} onChange={(e) => set('invoice', { object: e.target.value })} />
            </Field>
          </div>
        </Section>
      )}

      {tab === 'currency' && (
        <Section title={t('sec_currency')}>
          <div className="flex flex-col gap-3.5 p-4">
            <Field label={t('base_currency')}>
              <Select value={draft.currency.base}
                onChange={(e) => set('currency', { base: e.target.value as Currency })}>
                {draft.currency.list.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </Select>
            </Field>
            <div className="flex flex-col gap-2">
              {draft.currency.list.map((c) => {
                const isBase = c.code === draft.currency.base;
                return (
                  <div key={c.code} className="flex items-center gap-3 rounded-xl border bg-[var(--surface-2)] px-3 py-2"
                    style={isBase ? { borderColor: 'var(--accent-border)' } : undefined}>
                    <span className="w-12 text-sm font-black" style={{ color: isBase ? 'var(--accent)' : undefined }}>{c.code}</span>
                    <span className="flex-1 text-[0.65rem] text-muted">
                      {isBase ? t('base_currency') : t('rate_to', draft.currency.base)}
                    </span>
                    <Input type="number" step="any" inputMode="decimal" disabled={isBase}
                      className="tnum w-24 !py-1.5 text-center !text-xs disabled:opacity-50"
                      value={c.rate}
                      onChange={(e) => set('currency', {
                        list: draft.currency.list.map((x) => x.code === c.code ? { ...x, rate: Number(e.target.value) } : x),
                      })} />
                    {!isBase && (
                      <button onClick={() => set('currency', { list: draft.currency.list.filter((x) => x.code !== c.code) })}
                        aria-label={t('delete')} className="cursor-pointer p-1">
                        <Trash2 size={13} className="text-[var(--danger)]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <Field label={t('add_currency')}>
              <Select value="" onChange={(e) => {
                const code = e.target.value as Currency;
                if (code) set('currency', { list: [...draft.currency.list, { code, rate: 1 }] });
              }}>
                <option value="">—</option>
                {ALL_CURRENCIES.filter((c) => !draft.currency.list.some((x) => x.code === c))
                  .map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
        </Section>
      )}

      {tab === 'appearance' && (
        <Section title={t('sec_appearance')}>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-xs font-bold text-muted">{t('accent_color')}</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => {
                const on = (draft.theme.accent || '') === c;
                return (
                  <button key={c || 'default'} onClick={() => set('theme', { accent: c })}
                    aria-label={c || t('theme_default')}
                    className="grid size-10 cursor-pointer place-items-center rounded-xl text-[0.55rem] font-black text-white transition-transform hover:scale-105"
                    style={{
                      background: c || 'linear-gradient(135deg,#0D7CFB,#1652A2)',
                      outline: on ? '3px solid var(--text)' : '1px solid var(--border)',
                      outlineOffset: on ? 2 : 0,
                    }}>
                    {!c && '★'}
                  </button>
                );
              })}
            </div>
            <p className="text-[0.68rem] text-faint">★ = {t('theme_default')}</p>
          </div>
        </Section>
      )}

      {dirty && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6">
          <Button variant="primary" size="lg" onClick={apply} className="w-full max-w-sm !rounded-full shadow-[var(--shadow-lg)]">
            {t('save')}
          </Button>
        </div>
      )}
    </div>
  );
}
