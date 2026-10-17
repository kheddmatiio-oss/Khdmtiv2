'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Auth } from '@/screens/Auth';
import { Dashboard } from '@/screens/Dashboard';
import { Shell, type TabId } from '@/components/Shell';
import { Logo } from '@/components/Logo';
import { Empty } from '@/components/ui/primitives';
import { Wrench } from 'lucide-react';

export default function Page() {
  const { phase } = useApp();
  const [tab, setTab] = useState<TabId>('dashboard');

  if (phase === 'booting') return <Boot />;
  if (phase === 'anon') return <Auth />;

  return (
    <Shell tab={tab} setTab={setTab}>
      {tab === 'dashboard'
        ? <Dashboard setTab={setTab} />
        : <Empty icon={<Wrench size={22} />} title={`${tab} — قيد البناء`} />}
    </Shell>
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
