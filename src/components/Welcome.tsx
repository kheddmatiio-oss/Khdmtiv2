'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { Button } from './ui/primitives';
import { cn } from '@/lib/cn';
import { LayoutGrid, Users, Zap, ArrowRight } from 'lucide-react';
import type { Key } from '@/lib/i18n';

const SLIDES: { title: Key | 'app'; sub: Key }[] = [
  { title: 'app', sub: 'tagline' },
  { title: 'slide2_title', sub: 'slide2_sub' },
  { title: 'slide3_title', sub: 'slide3_sub' },
];

const FEATURES: { icon: typeof Zap; label: Key }[] = [
  { icon: LayoutGrid, label: 'feat_tasks' },
  { icon: Users, label: 'feat_clients' },
  { icon: Zap, label: 'feat_invoices' },
];

export function Welcome({ onSignUp, onSignIn }: { onSignUp: () => void; onSignIn: () => void }) {
  const { t, lang } = useApp();
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);

  // advances on its own, but any interaction hands control back to the reader
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5200);
    return () => clearInterval(id);
  }, [auto]);

  const go = (n: number) => { setAuto(false); setI((n + SLIDES.length) % SLIDES.length); };

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 48) return;
    // in RTL a leftward swipe still means "forward"
    const forward = lang === 'ar' ? dx > 0 : dx < 0;
    go(i + (forward ? 1 : -1));
  };

  const slide = SLIDES[i];

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{ background: '#060B14' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Backdrop />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <Logo size={76} />

        <div key={i} className="fade-in mt-6 flex min-h-[7.5rem] flex-col items-center">
          <h1 className="text-[2.4rem] font-black leading-tight tracking-tight text-white">
            {slide.title === 'app' ? t('app') : t(slide.title)}
          </h1>
          <p className="mt-2.5 max-w-[19rem] text-sm leading-relaxed text-white/60">
            {t(slide.sub)}
          </p>
        </div>

        <div className="mt-8 flex w-full max-w-[21rem] flex-col gap-3">
          <Button variant="primary" size="lg" onClick={onSignUp}
            className="min-h-13 !rounded-2xl text-[0.95rem] shadow-[0_10px_30px_rgba(13,124,251,.35)]">
            {t('start_free')}
            <ArrowRight size={17} className="rtl:rotate-180" />
          </Button>
          <button onClick={onSignIn}
            className="min-h-13 cursor-pointer rounded-2xl border border-white/12 bg-white/[.04] text-sm font-bold text-white/85 backdrop-blur-sm transition-colors hover:bg-white/[.08]">
            {t('have_account')}
          </button>
        </div>
      </div>

      {/* what the product actually does */}
      <div className="relative border-t border-white/8 px-4 pb-7 pt-5">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {FEATURES.map(({ icon: Icon, label }, n) => (
            <li key={label}
              className={cn('flex flex-col items-center gap-2 px-2 text-center',
                n < FEATURES.length - 1 && 'border-e border-white/10')}>
              <Icon size={20} className="text-white/85" strokeWidth={2.2} />
              <span className="text-[0.7rem] font-bold leading-tight text-white/65">{t(label)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-center gap-2">
          {SLIDES.map((_, n) => (
            <button key={n} onClick={() => go(n)} aria-label={`${n + 1}`} aria-current={n === i}
              className="cursor-pointer p-2">
              <span className={cn('block h-1.5 rounded-full transition-all duration-300',
                n === i ? 'w-5 bg-[var(--color-brand-500)]' : 'w-1.5 bg-white/25')} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Depth without a stock photo: layered glows, a faint grid, and an
 *  abstract screen shape suggesting the product behind the glass. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [&_.mock]:rtl:scale-x-[-1]">
      <div className="absolute -end-32 -top-24 size-[38rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(13,124,251,.30), transparent 62%)' }} />
      <div className="absolute -bottom-40 -start-28 size-[30rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(22,82,162,.34), transparent 66%)' }} />
      <div className="absolute inset-0 opacity-[.055]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse at 50% 35%, #000 35%, transparent 72%)',
        }} />
      {/* the "screen" — a hint of a dashboard, never literal enough to read */}
      <div className="absolute start-[-10%] top-[6%] hidden w-[30rem] mock rotate-[-10deg] rounded-2xl border border-white/10 p-3 opacity-80 lg:block"
        style={{ background: 'linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.01))', backdropFilter: 'blur(2px)' }}>
        <div className="mb-2.5 flex gap-1.5">
          {[0, 1, 2].map((n) => <span key={n} className="size-1.5 rounded-full bg-white/20" />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((n) => (
            <div key={n} className="rounded-lg border border-white/8 bg-white/[.03] p-2.5">
              <div className="mb-2 h-1.5 w-8 rounded-full bg-white/15" />
              <div className="h-2.5 w-12 rounded-full"
                style={{ background: n === 0 ? 'rgba(13,124,251,.55)' : 'rgba(255,255,255,.14)' }} />
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1.5 rounded-lg border border-white/8 bg-white/[.03] p-2.5">
          {[70, 52, 61, 44].map((w, n) => (
            <div key={n} className="flex items-center gap-2">
              <span className="h-1.5 flex-1 rounded-full bg-white/10" style={{ maxWidth: `${w}%` }} />
              <span className="h-1.5 w-6 rounded-full bg-white/14" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, #060B14 4%, rgba(6,11,20,.55) 40%, rgba(6,11,20,.2) 100%)' }} />
    </div>
  );
}
