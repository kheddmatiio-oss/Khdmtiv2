'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
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
import { Card, Button } from '@/components/ui/primitives';
import { Clock, Ban } from 'lucide-react';

export default function Page() {
  const { phase, agency } = useApp();
  const [tab, setTab] = useState<TabId>('dashboard');

  if (phase === 'booting') return <Boot />;
  if (phase === 'anon') return <Auth />;
  if (agency?.is_super) return <SuperAdmin />;

  const suspended = agency && !agency.is_active;
  const expired = agency?.plan_expires_at && new Date(agency.plan_expires_at) < new Date() && agency.plan !== 'free';
  if (suspended || expired) return <Blocked suspended={!!suspended} />;

  return (
    <Shell tab={tab} setTab={setTab}>
      {tab === 'dashboard' && <Dashboard setTab={setTab} />}
      {tab === 'videos' && <Videos />}
      {tab === 'tasks' && <Tasks />}
      {tab === 'invoices' && <Invoices />}
      {tab === 'clients' && <Clients />}
      {tab === 'team' && <Team />}
      {tab === 'settings' && <SettingsScreen />}
    </Shell>
  );
}

function Blocked({ suspended }: { suspended: boolean }) {
  const { t, signOut } = useApp();
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <Card className="flex max-w-sm flex-col items-center gap-4 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {suspended ? <Ban size={24} /> : <Clock size={24} />}
        </span>
        <p className="text-lg font-black">{suspended ? 'Account suspended' : 'Subscription expired'}</p>
        <p className="text-sm text-muted">WhatsApp</p>
        <Button className="w-full" onClick={signOut}>{t('logout')}</Button>
      </Card>
    </div>
  );
}

function Boot() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Logo size={64} />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-[var(--accent)]"
              style={{ animation: `pulse 1.2s ${i * 0.15}s ease infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
    </div>
  );
}
