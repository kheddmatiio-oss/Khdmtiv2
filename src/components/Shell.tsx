'use client';
import { useState, type ReactNode } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { Button } from './ui/primitives';
import type { Key } from '@/lib/i18n';
import {
  LayoutGrid, Film, CheckSquare, Receipt, Briefcase, Users, Settings as Cog,
  MoreHorizontal, LogOut, Sun, Moon, Languages, X,
} from 'lucide-react';

export type TabId = 'dashboard' | 'videos' | 'tasks' | 'invoices' | 'clients' | 'team' | 'settings';

const ICON = {
  dashboard: LayoutGrid, videos: Film, tasks: CheckSquare, invoices: Receipt,
  clients: Briefcase, team: Users, settings: Cog,
} as const;

/** Daily work sits in the dock; setup lives behind "more". */
const PRIMARY: TabId[] = ['dashboard', 'videos', 'tasks', 'invoices'];
const SECONDARY: TabId[] = ['clients', 'team', 'settings'];

const LABEL: Record<TabId, Key> = {
  dashboard: 'dashboard', videos: 'videos', tasks: 'tasks',
  invoices: 'invoices', clients: 'clients', team: 'team', settings: 'settings',
};

export function Shell({ tab, setTab, children }: {
  tab: TabId; setTab: (t: TabId) => void; children: ReactNode;
}) {
  const { t, lang, setLang, dark, toggleTheme, agency, worker, signOut, saving } = useApp();
  const [more, setMore] = useState(false);
  const solo = agency?.account_type === 'solo';
  const visible = (id: TabId) => !(solo && id === 'team') && !(worker && (id === 'team' || id === 'settings' || id === 'clients'));
  const secondary = SECONDARY.filter(visible);

  const NavItem = ({ id, onClick }: { id: TabId; onClick?: () => void }) => {
    const Icon = ICON[id];
    const on = tab === id;
    return (
      <button
        onClick={() => { setTab(id); onClick?.(); }}
        aria-current={on ? 'page' : undefined}
        className={cn(
          'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors cursor-pointer',
          on ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
        )}
      >
        {on && (
          <span aria-hidden className="absolute inset-y-1.5 start-0 w-[3px] rounded-full"
            style={{ background: 'var(--accent)' }} />
        )}
        <Icon size={17} />
        {t(LABEL[id])}
      </button>
    );
  };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-e p-3 surface md:flex">
        <div className="mb-2 flex items-center gap-2.5 px-1 py-2">
          <Logo size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold leading-tight">{worker?.name ?? agency?.name}</p>
            <p className="truncate text-[0.66rem] text-faint">{worker ? agency?.name : agency?.email}</p>
          </div>
          {saving && (
            <span aria-label="saving" className="size-1.5 shrink-0 rounded-full"
              style={{ background: 'var(--accent)', animation: 'pulse 1.1s ease infinite' }} />
          )}
        </div>
        {[...PRIMARY, ...secondary].filter(visible).map((id) => <NavItem key={id} id={id} />)}
        <div className="mt-auto flex flex-col gap-1 border-t pt-2">
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted hover:bg-[var(--surface-2)] cursor-pointer">
            <Languages size={17} />{lang === 'ar' ? 'English' : 'العربية'}
          </button>
          <button onClick={toggleTheme} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted hover:bg-[var(--surface-2)] cursor-pointer">
            {dark ? <Sun size={17} /> : <Moon size={17} />}{dark ? 'Light' : 'Dark'}
          </button>
          <button onClick={signOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)] cursor-pointer">
            <LogOut size={17} />{t('logout')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* mobile header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-4 py-2.5 backdrop-blur-xl md:hidden"
          style={{ background: 'color-mix(in oklab, var(--bg) 88%, transparent)' }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={30} />
            <p className="truncate text-sm font-extrabold">{worker?.name ?? agency?.name}</p>
          </div>
          <div className="flex items-center gap-1">
            {saving && <span className="text-[0.6rem] text-faint">…</span>}
            <Button size="sm" variant="ghost" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="language">
              {lang === 'ar' ? 'EN' : 'ع'}
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="theme">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-28 md:px-6 md:py-7 md:pb-10">
          {children}
        </main>
      </div>

      {/* mobile dock */}
      <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md rounded-2xl border p-1 shadow-[var(--shadow-lg)] backdrop-blur-xl md:hidden"
        style={{ background: 'color-mix(in oklab, var(--surface) 92%, transparent)' }}>
        {PRIMARY.map((id) => {
          const Icon = ICON[id]; const on = tab === id;
          return (
            <button key={id} onClick={() => { setTab(id); setMore(false); }}
              className={cn('relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[0.58rem] font-extrabold transition-all duration-200 cursor-pointer',
                on ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-faint)] active:scale-95')}>
              <Icon size={18} className={cn('transition-transform', on && 'scale-110')} />{t(LABEL[id])}
            </button>
          );
        })}
        {secondary.length > 0 && (
          <button onClick={() => setMore((v) => !v)}
            className={cn('flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[0.58rem] font-extrabold cursor-pointer',
              more || secondary.includes(tab) ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-faint)]')}>
            <MoreHorizontal size={18} />{t('more')}
          </button>
        )}
      </nav>

      {/* overflow sheet */}
      {more && (
        <div className="fixed inset-0 z-45 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-3 bottom-20 mx-auto max-w-md rounded-2xl border p-1.5 surface shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}>
            {secondary.map((id) => <NavItem key={id} id={id} onClick={() => setMore(false)} />)}
            <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--danger)] cursor-pointer">
              <LogOut size={17} />{t('logout')}
            </button>
            <button onClick={() => setMore(false)} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-faint cursor-pointer">
              <X size={13} />{t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
