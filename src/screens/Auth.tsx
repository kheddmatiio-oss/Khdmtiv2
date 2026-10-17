'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { api, ApiError } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { Welcome } from '@/components/Welcome';
import { Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { Key } from '@/lib/i18n';
import {
  Building2, User, Mail, Lock, Phone, ArrowLeft, Languages, Sun, Moon,
  Eye, EyeOff, Check,
} from 'lucide-react';

type Mode = 'landing' | 'signin' | 'signup';

const CODE_TO_KEY: Record<string, Key> = {
  not_found: 'err_wrong', bad_password: 'err_wrong', agency_not_found: 'err_wrong',
  duplicate_email: 'err_dup', weak_password: 'err_pw', network: 'err_net',
  no_session: 'err_session', forbidden: 'err_wrong',
};

export function Auth() {
  const { t, lang, setLang, dark, toggleTheme, signIn } = useApp();
  const [mode, setMode] = useState<Mode>('landing');

  if (mode === 'landing') {
    return (
      <>
        <div className="absolute end-3 top-3 z-10 flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="!text-white/70 hover:!bg-white/10">
            <Languages size={14} />{lang === 'ar' ? 'EN' : 'ع'}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="theme"
            className="!text-white/70 hover:!bg-white/10">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </Button>
        </div>
        <Welcome onSignUp={() => setMode('signup')} onSignIn={() => setMode('signin')} />
      </>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute end-3 top-3 flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          <Languages size={14} />{lang === 'ar' ? 'EN' : 'ع'}
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="theme">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
      </div>

      <div className="w-full max-w-[22rem] fade-in">
        <AuthForm mode={mode} onBack={() => setMode('landing')} onDone={signIn} />
      </div>
    </div>
  );
}

function AuthForm({ mode, onBack, onDone }: {
  mode: Exclude<Mode, 'landing'>; onBack: () => void;
  onDone: ReturnType<typeof useApp>['signIn'];
}) {
  const { t } = useApp();
  const signup = mode === 'signup';
  const [who, setWho] = useState<'admin' | 'worker'>('admin');
  const [type, setType] = useState<'solo' | 'agency'>('solo');
  const [f, setF] = useState({ name: '', email: '', phone: '', pw: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<Key | null>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [reveal, setReveal] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setFormError(null);
  };
  const blur = (k: string) => () => setTouched((p) => ({ ...p, [k]: true }));

  // validated per field so the message sits next to what is wrong
  const errors = {
    name: signup && !f.name.trim() ? t('required') : '',
    email: !f.email.trim() ? t('required') : !f.email.includes('@') ? t('err_email') : '',
    pw: !f.pw ? t('required') : f.pw.length < 4 ? t('err_pw') : '',
  };
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '');
  const valid = !errors.email && !errors.pw && (!signup || !errors.name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, pw: true });
    if (!valid) return;
    setState('busy'); setFormError(null);
    try {
      const email = f.email.trim().toLowerCase();
      let result;
      if (signup) result = { agency: await api.register(f.name.trim(), email, f.pw, f.phone.trim(), type) };
      else if (who === 'worker') {
        const r = await api.loginWorker(email, f.pw);
        result = { agency: r.agency, worker: r.worker, data: r.data };
      } else result = { agency: await api.login(email, f.pw) };

      setState('done');
      // a beat of confirmation before the app replaces the screen
      setTimeout(() => onDone(result.agency, result.worker, result.data), 450);
    } catch (e2) {
      setFormError(CODE_TO_KEY[e2 instanceof ApiError ? e2.code : 'network'] ?? 'err_net');
      setState('idle');
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <Logo size={32} />
        <div className="min-w-0">
          <h2 className="text-base font-black leading-tight">
            {signup ? t('create_workspace') : t('welcome_back')}
          </h2>
          <p className="text-[0.68rem] text-faint">{signup ? t('signup') : t('signin')}</p>
        </div>
      </div>

      {!signup && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-2)] p-1" role="tablist">
          {(['admin', 'worker'] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={who === v} onClick={() => setWho(v)}
              className={cn('flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                who === v ? 'surface text-[var(--accent)] shadow-[var(--shadow-sm)]' : 'text-muted')}>
              {v === 'admin' ? <Building2 size={13} /> : <User size={13} />}{t(v === 'admin' ? 'admin' : 'worker')}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {signup && (
          <>
            <Field label={t('acc_type')}>
              <Select value={type} onChange={(e) => setType(e.target.value as 'solo' | 'agency')} className="min-h-11">
                <option value="solo">{t('solo')}</option>
                <option value="agency">{t('admin')}</option>
              </Select>
            </Field>
            <Field label={type === 'solo' ? t('your_name') : t('workspace')} error={show('name') || undefined}>
              <Input value={f.name} onChange={set('name')} onBlur={blur('name')}
                aria-invalid={!!show('name')} autoComplete="name" className="min-h-11" autoFocus />
            </Field>
          </>
        )}

        <Field
          label={who === 'worker' && !signup ? t('workspace_email') : t('email')}
          hint={signup ? t('email_hint') : undefined}
          error={show('email') || undefined}
        >
          <div className="relative">
            <Mail size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
            <Input type="email" inputMode="email" autoComplete="email" dir="ltr"
              className="min-h-11 ps-9 text-start" placeholder="you@email.com"
              aria-invalid={!!show('email')} value={f.email} onChange={set('email')} onBlur={blur('email')} />
          </div>
        </Field>

        {signup && (
          <Field label={t('phone')} hint={t('phone_hint')}>
            <div className="relative">
              <Phone size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
              <Input className="min-h-11 ps-9 text-start" dir="ltr" inputMode="tel" autoComplete="tel"
                placeholder="0555 12 34 56" value={f.phone} onChange={set('phone')} />
            </div>
          </Field>
        )}

        <Field label={t('password')} hint={signup ? t('pw_rule_len') : undefined} error={show('pw') || undefined}>
          <div className="relative">
            <Lock size={14} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-[var(--text-faint)]" />
            <Input type={reveal ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'}
              className="min-h-11 px-10" aria-invalid={!!show('pw')}
              value={f.pw} onChange={set('pw')} onBlur={blur('pw')} />
            <button type="button" onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? t('hide_pw') : t('show_pw')}
              className="absolute inset-y-0 end-1 my-auto grid size-9 place-items-center rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer">
              {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        {formError && (
          <p role="alert" className="rounded-lg px-3 py-2 text-xs font-bold"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {t(formError)}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={state === 'busy'}
          disabled={state === 'done'} className="mt-1 min-h-12">
          {state === 'done' ? <><Check size={16} />{t('welcome_done')}</>
            : state === 'busy' ? (signup ? t('creating') : t('signing_in'))
            : (signup ? t('start_free') : t('signin'))}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="min-h-10">
          <ArrowLeft size={13} className="rtl:rotate-180" />{t('back')}
        </Button>
      </form>
    </Card>
  );
}
