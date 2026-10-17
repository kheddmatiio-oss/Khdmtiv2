'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { api, ApiError } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { Building2, User, Mail, Lock, Phone, ArrowLeft, Languages, Sun, Moon } from 'lucide-react';
import type { Key } from '@/lib/i18n';

type Mode = 'landing' | 'signin' | 'signup';

const CODE_TO_KEY: Record<string, Key> = {
  not_found: 'err_wrong', bad_password: 'err_wrong', agency_not_found: 'err_wrong',
  duplicate_email: 'err_dup', weak_password: 'err_pw', network: 'err_net',
  no_session: 'err_session', forbidden: 'err_wrong',
};

export function Auth() {
  const { t, lang, setLang, dark, toggleTheme, signIn } = useApp();
  const [mode, setMode] = useState<Mode>('landing');

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -end-40 -top-40 size-[34rem] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 65%)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -start-32 size-[26rem] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 68%)' }} />

      <div className="absolute end-4 top-4 flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          <Languages size={14} />{lang === 'ar' ? 'EN' : 'ع'}
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="theme">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        {mode === 'landing'
          ? <Landing onPick={setMode} />
          : <AuthForm mode={mode} onBack={() => setMode('landing')} onDone={signIn} />}
      </div>
    </div>
  );
}

function Landing({ onPick }: { onPick: (m: Mode) => void }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center text-center">
      <Logo size={76} />
      <h1 className="mt-5 text-[2.1rem] font-black leading-tight tracking-tight">{t('app')}</h1>
      <div className="my-3 h-1 w-14 rounded-full" style={{ background: 'linear-gradient(90deg,var(--accent),transparent)' }} />
      <p className="mb-7 text-sm leading-relaxed text-muted">{t('solo_hint')}</p>
      <div className="flex w-full flex-col gap-2.5">
        <Button variant="primary" size="lg" onClick={() => onPick('signup')}>{t('start_free')}</Button>
        <Button size="lg" onClick={() => onPick('signin')}>{t('have_account')}</Button>
      </div>
    </div>
  );
}

function AuthForm({ mode, onBack, onDone }: {
  mode: Exclude<Mode, 'landing'>; onBack: () => void;
  onDone: ReturnType<typeof useApp>['signIn'];
}) {
  const { t } = useApp();
  const [who, setWho] = useState<'admin' | 'worker'>('admin');
  const [type, setType] = useState<'solo' | 'agency'>('solo');
  const [f, setF] = useState({ name: '', email: '', phone: '', pw: '' });
  const [err, setErr] = useState<Key | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (mode === 'signup' && !f.name.trim()) return setErr('err_name');
    if (!f.email.includes('@')) return setErr('err_email');
    if (f.pw.length < 4) return setErr('err_pw');
    setBusy(true);
    try {
      if (mode === 'signup') {
        onDone(await api.register(f.name.trim(), f.email.trim().toLowerCase(), f.pw, f.phone.trim(), type));
      } else if (who === 'worker') {
        const r = await api.loginWorker(f.email.trim().toLowerCase(), f.pw);
        onDone(r.agency, r.worker, r.data);
      } else {
        onDone(await api.login(f.email.trim().toLowerCase(), f.pw));
      }
    } catch (e2) {
      setErr(CODE_TO_KEY[e2 instanceof ApiError ? e2.code : 'network'] ?? 'err_net');
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <Logo size={34} />
        <h2 className="text-lg font-black">{mode === 'signup' ? t('signup') : t('signin')}</h2>
      </div>

      {mode === 'signin' && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-2)] p-1">
          {(['admin', 'worker'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setWho(v)}
              className={cn('flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer',
                who === v ? 'surface text-[var(--accent)] shadow-[var(--shadow-sm)]' : 'text-muted')}>
              {v === 'admin' ? <Building2 size={13} /> : <User size={13} />}{t(v === 'admin' ? 'admin' : 'worker')}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {mode === 'signup' && (
          <>
            <Field label={t('acc_type')}>
              <Select value={type} onChange={(e) => setType(e.target.value as 'solo' | 'agency')}>
                <option value="solo">{t('solo')} — {t('solo_hint')}</option>
                <option value="agency">{t('admin')} — {t('admin_hint')}</option>
              </Select>
            </Field>
            <Field label={type === 'solo' ? t('your_name') : t('workspace')}>
              <Input value={f.name} onChange={set('name')} autoFocus />
            </Field>
          </>
        )}

        <Field label={who === 'worker' && mode === 'signin' ? t('workspace_email') : t('email')}>
          <div className="relative">
            <Mail size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
            <Input type="email" inputMode="email" autoComplete="email" className="ps-9"
              value={f.email} onChange={set('email')} placeholder="you@email.com" />
          </div>
        </Field>

        {mode === 'signup' && (
          <Field label={t('phone')}>
            <div className="relative">
              <Phone size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
              <Input className="ps-9" value={f.phone} onChange={set('phone')} placeholder="0555 12 34 56" />
            </div>
          </Field>
        )}

        <Field label={t('password')} hint={mode === 'signup' ? t('pw_hint') : undefined}
          error={err ? t(err) : undefined}>
          <div className="relative">
            <Lock size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
            <Input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="ps-9" value={f.pw} onChange={set('pw')} />
          </div>
        </Field>

        <Button type="submit" variant="primary" size="lg" loading={busy} className="mt-1">
          {mode === 'signup' ? t('start_free') : t('signin')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={13} className="rtl:rotate-180" />{t('back')}
        </Button>
      </form>
    </Card>
  );
}
