'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { api, ApiError } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { Welcome } from '@/components/Welcome';
import { Button, Card, Field, Input } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { supportLink } from '@/lib/support';
import { priceLabel } from '@/lib/pricing';
import type { Key } from '@/lib/i18n';
import {
  Building2, User, Mail, Lock, Phone, ArrowLeft, Languages, Sun, Moon,
  Eye, EyeOff, Check, MessageCircle, Gift,
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
      <Welcome onSignUp={() => setMode('signup')} onSignIn={() => setMode('signin')} />
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

      {mode === 'signup' ? (
        <div className="fade-in grid w-full max-w-[22rem] gap-4 md:max-w-3xl md:grid-cols-[1fr_22rem] md:items-stretch md:gap-5">
          <TrialPanel />
          <AuthForm mode={mode} onBack={() => setMode('landing')} onDone={signIn} />
        </div>
      ) : (
        <div className="w-full max-w-[22rem] fade-in">
          <AuthForm mode={mode} onBack={() => setMode('landing')} onDone={signIn} />
        </div>
      )}
    </div>
  );
}

/** What the trial gives you — a full panel beside the form on desktop,
 *  a compact strip above it on phones so the form stays in reach. */
function TrialPanel() {
  const { t, lang } = useApp();
  const points: Key[] = ['trial_b1', 'trial_b2', 'trial_b3', 'trial_b4'];
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 text-white md:flex md:flex-col md:justify-between md:p-7"
      style={{ background: 'linear-gradient(150deg,#0B111A 0%,#10294F 70%,#1652A2 130%)' }}>
      <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full opacity-30 blur-3xl"
        style={{ background: '#0D7CFB' }} />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold"
          style={{ background: 'rgba(13,124,251,.22)', color: '#8CC2FF' }}>
          <Gift size={12} />{t('trial_badge')}
        </span>
        <h1 className="mt-3 text-lg font-black leading-snug md:text-2xl">{t('trial_title')}</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-white/60 md:text-sm">{t('trial_sub')}</p>
        <p className="tnum mt-3 inline-block rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white/90"
          style={{ background: 'rgba(255,255,255,.08)' }}>{t('then_price', priceLabel(lang))}</p>
      </div>
      <ul className="relative mt-4 hidden flex-col gap-3 md:flex">
        {points.map((k) => (
          <li key={k} className="flex items-center gap-2.5 text-sm font-bold text-white/90">
            <span className="grid size-5 shrink-0 place-items-center rounded-full" style={{ background: '#0D7CFB' }}>
              <Check size={12} strokeWidth={3} />
            </span>
            {t(k)}
          </li>
        ))}
      </ul>
      <p className="relative mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] font-bold text-white/70 md:hidden">
        {points.slice(0, 2).map((k) => (
          <span key={k} className="flex items-center gap-1"><Check size={11} strokeWidth={3} />{t(k)}</span>
        ))}
      </p>
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
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('acc_type')}>
                {(['solo', 'agency'] as const).map((v) => {
                  const on = type === v;
                  return (
                    <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setType(v)}
                      className={cn('flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-colors cursor-pointer',
                        on ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-2)]')}>
                      <span className={cn('flex items-center gap-1.5 text-xs font-extrabold', on && 'text-[var(--accent)]')}>
                        {v === 'solo' ? <User size={14} /> : <Building2 size={14} />}
                        {t(v === 'solo' ? 'solo' : 'admin')}
                      </span>
                      <span className="text-[0.64rem] leading-snug text-faint">{t(v === 'solo' ? 'solo_hint' : 'admin_hint')}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={type === 'solo' ? t('your_name') : t('workspace')} error={show('name') || undefined}>
              <Input value={f.name} onChange={set('name')} onBlur={blur('name')}
                aria-invalid={!!show('name')} autoComplete="name" className="min-h-11" />
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
            : (signup ? t('start_trial') : t('signin'))}
        </Button>
        {!signup && <ForgotPassword email={f.email} />}

        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="min-h-10">
          <ArrowLeft size={13} className="rtl:rotate-180" />{t('back')}
        </Button>
      </form>
    </Card>
  );
}

function ForgotPassword({ email }: { email: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const href = supportLink(
    `${t('forgot_pw')} — ${email || '…'}`,
  );

  return (
    <div className="text-center">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="min-h-10 px-2 text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer">
        {t('forgot_pw')}
      </button>
      {open && (
        <div className="fade-in mt-1 rounded-xl border p-3 text-start"
          style={{ background: 'var(--surface-2)' }}>
          <p className="text-[0.72rem] leading-relaxed text-muted">{t('forgot_help')}</p>
          {href && (
            <a href={href} target="_blank" rel="noreferrer"
              className="mt-2 flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'var(--accent)' }}>
              <MessageCircle size={13} />{t('contact_support')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
