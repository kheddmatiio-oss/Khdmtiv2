'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { configError } from '@/lib/api';
import { Auth } from '@/screens/Auth';
import { Dashboard } from '@/screens/Dashboard';
import { Clients } from '@/screens/Clients';
import { Videos } from '@/screens/Videos';
import { Tasks } from '@/screens/Tasks';
import { Invoices } from '@/screens/Invoices';
import { SettingsScreen } from '@/screens/Settings';
import { Team } from '@/screens/Team';
import { SuperAdmin } from '@/screens/SuperAdmin';
import { Shell, type TabId } from '@/components/Shell';
import { Logo } from '@/components/Logo';
import { Card, Button, Skeleton, ListSkeleton } from '@/components/ui/primitives';
import { SupportChat } from '@/components/SupportChat';
import { supportLink } from '@/lib/support';
import { isSuspended } from '@/lib/utils';
import { Ban, MessageCircle } from 'lucide-react';

export default function Page() {
  const { phase, agency } = useApp();
  const [tab, setTab] = useState<TabId>('dashboard');

  if (configError) return <ConfigError />;
  if (phase === 'booting') return <Boot />;
  if (phase === 'anon') return <Auth />;
  if (agency?.is_super) return <SuperAdmin />;

  if (isSuspended(agency)) return <Blocked />;

  return (
    <Shell tab={tab} setTab={setTab}>
      <div key={tab} className="fade-in">
      {tab === 'dashboard' && <Dashboard setTab={setTab} />}
      {tab === 'videos' && <Videos />}
      {tab === 'tasks' && <Tasks />}
      {tab === 'invoices' && <Invoices />}
      {tab === 'clients' && <Clients />}
      {tab === 'team' && <Team />}
      {tab === 'settings' && <SettingsScreen />}
      </div>
    </Shell>
  );
}

/** Shown when the build had no Supabase keys — tells whoever deployed it
 *  exactly what to fix, rather than failing silently. */
function ConfigError() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <Card className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          <Ban size={24} />
        </span>
        <p className="text-lg font-black">Configuration incomplete</p>
        <p className="text-sm text-muted">{configError}</p>
        <p className="text-xs text-faint">
          Add them in your host&apos;s environment variables, then redeploy — these
          values are baked in at build time.
        </p>
      </Card>
    </div>
  );
}

/** Suspended by the admin. An ended trial or subscription does not land
 *  here — it opens the workspace read-only (see Shell). */
function Blocked() {
  const { t, signOut, agency } = useApp();
  const href = supportLink(`${t('contact_support')} — ${agency?.email ?? ''}`);
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <Card className="fade-in flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          <Ban size={24} />
        </span>
        <div>
          <p className="text-lg font-black">{t('suspended')}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{t('suspended_sub')}</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          {href && (
            <a href={href} target="_blank" rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--accent)' }}>
              <MessageCircle size={16} />{t('contact_support')}
            </a>
          )}
          <Button variant="ghost" className="min-h-10 w-full" onClick={signOut}>{t('logout')}</Button>
        </div>
      </Card>
      {/* locked out of the app, but not out of support */}
      <SupportChat />
    </div>
  );
}

/** Mirrors the dashboard's shape so the page does not jump when data lands. */
function Boot() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden h-dvh flex-col gap-2 border-e p-3 surface md:flex">
        <div className="mb-3 flex items-center gap-2.5 px-1 py-2">
          <Logo size={34} />
          <span className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" /><Skeleton className="h-2 w-16" />
          </span>
        </div>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
      </aside>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <Skeleton className="mb-4 h-7 w-40" />
        <Skeleton className="mb-4 h-36 rounded-2xl" />
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Card className="overflow-hidden"><ListSkeleton rows={3} /></Card>
      </main>
    </div>
  );
}
