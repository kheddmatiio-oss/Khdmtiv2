'use client';
import { useApp } from '@/lib/store';
import { Button, Card } from './ui/primitives';
import { cn } from '@/lib/cn';
import type { TabId } from './Shell';
import type { Key } from '@/lib/i18n';
import { Briefcase, Film, Receipt, Check, ArrowLeft, X } from 'lucide-react';

type Step = {
  id: TabId; icon: typeof Film; title: Key; desc: Key; done: boolean;
};

/**
 * Shown while a workspace is still empty. Four of seven accounts signed up
 * and never entered anything — an empty dashboard gave them no first move.
 * Steps mark themselves done from real data, so this disappears on its own.
 */
export function GettingStarted({ setTab }: { setTab: (t: TabId) => void }) {
  const { t, data, mutate } = useApp();

  const steps: Step[] = [
    { id: 'clients', icon: Briefcase, title: 'step_client', desc: 'step_client_desc', done: data.clients.length > 0 },
    { id: 'videos', icon: Film, title: 'step_video', desc: 'step_video_desc', done: data.videos.length > 0 },
    { id: 'invoices', icon: Receipt, title: 'step_invoice', desc: 'step_invoice_desc', done: data.invoices.length > 0 },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  // the first unfinished step is the one we point at
  const activeIndex = steps.findIndex((s) => !s.done);

  const dismiss = () =>
    mutate((d) => ({ ...d, settings: { ...d.settings, onboarding: { dismissed: true } } }));

  return (
    <Card className="gs relative overflow-hidden p-4 sm:p-5">
      {/* a single soft wash, not a decorative blob */}
      <span aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)' }} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-black">{allDone ? t('gs_done_title') : t('getting_started')}</h2>
          <p className="text-xs text-muted">{allDone ? t('gs_done_sub') : t('gs_sub')}</p>
        </div>
        <button onClick={dismiss} aria-label={t('skip')}
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[0.68rem] font-bold text-faint transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-muted)] cursor-pointer">
          {t('skip')}<X size={12} />
        </button>
      </div>

      {/* progress */}
      <div className="relative mt-3.5 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="gs-bar h-full rounded-full"
            style={{
              width: `${(doneCount / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 65%, white))',
            }} />
        </div>
        <span className="tnum shrink-0 text-[0.68rem] font-extrabold text-muted">
          {t('gs_progress', doneCount, steps.length)}
        </span>
      </div>

      <ol className="relative mt-4 flex flex-col gap-2">
        {steps.map((s, i) => {
          const active = i === activeIndex;
          const Icon = s.icon;
          return (
            <li key={s.id} className="gs-step" style={{ animationDelay: `${i * 70}ms` }}>
              <div className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                active ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]' : 'border-transparent bg-[var(--surface-2)]',
                s.done && 'opacity-60',
              )}>
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
                  s.done ? 'text-white' : active ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]')}
                  style={{
                    background: s.done ? 'var(--accent)' : active ? 'var(--surface)' : 'transparent',
                    boxShadow: active && !s.done ? '0 0 0 1px var(--accent-border)' : undefined,
                  }}>
                  {s.done
                    ? <Check size={16} className="gs-check" strokeWidth={3} />
                    : <Icon size={16} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm font-bold', s.done && 'line-through decoration-1')}>
                    {t(s.title)}
                  </span>
                  {!s.done && <span className="block text-[0.68rem] leading-snug text-muted">{t(s.desc)}</span>}
                </span>

                {active && (
                  <Button size="sm" variant="primary" onClick={() => setTab(s.id)} className="shrink-0">
                    {t('next')}
                    <ArrowLeft size={12} className="ltr:rotate-180" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <style>{`
        .gs-step { animation: gsIn .34s cubic-bezier(.2,.8,.3,1) both; }
        @keyframes gsIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        .gs-bar { transition: width .5s cubic-bezier(.4,0,.2,1); }
        .gs-check { animation: gsPop .32s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes gsPop { from { transform: scale(.4); opacity: 0 } to { transform: none; opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .gs-step, .gs-check { animation: none; }
          .gs-bar { transition: none; }
        }
      `}</style>
    </Card>
  );
}
