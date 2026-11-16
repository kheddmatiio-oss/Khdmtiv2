'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { LandingSections } from './LandingSections';
import { priceLabel } from '@/lib/pricing';
import { STAGE_LABEL } from '@/lib/pipeline';
import {
  ArrowRight, Gift, Languages, Sun, Moon, Check,
} from 'lucide-react';

export function Welcome({ onSignUp, onSignIn }: { onSignUp: () => void; onSignIn: () => void }) {
  const { t, lang, setLang, dark, toggleTheme } = useApp();

  // arriving through someone's link is worth acknowledging
  const [invited, setInvited] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    try {
      // the URL is checked too: on a first visit the code has not been stored yet
      setInvited(!!localStorage.getItem('khedmti.ref') || /[?&]ref=[a-z0-9]{4,16}/i.test(window.location.search));
    } catch { /* private mode */ }
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="overflow-x-clip text-white" style={{ background: '#05080F' }}>
      {/* ── nav ─────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-30 transition-[background,border-color,backdrop-filter] duration-300"
        style={scrolled
          ? { background: 'rgba(5,8,15,.72)', backdropFilter: 'blur(18px) saturate(1.4)', borderBottom: '1px solid rgba(255,255,255,.07)' }
          : { borderBottom: '1px solid transparent' }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
          <Logo size={34} />
          <span className="text-[1.05rem] font-extrabold tracking-tight">{t('app')}</span>
          <nav className="ms-8 hidden items-center gap-7 text-[0.82rem] font-semibold text-white/60 md:flex">
            <a href="#features" className="transition-colors hover:text-white">{t('lp_nav_features')}</a>
            <a href="#pricing" className="transition-colors hover:text-white">{t('lp_nav_price')}</a>
            <a href="#faq" className="transition-colors hover:text-white">{t('faq_k')}</a>
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="language"
              className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-white/65 transition-colors hover:bg-white/8 hover:text-white">
              <Languages size={15} />{lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <button onClick={toggleTheme} aria-label="theme"
              className="hidden size-10 cursor-pointer place-items-center rounded-xl text-white/65 transition-colors hover:bg-white/8 hover:text-white sm:grid">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={onSignIn}
              className="min-h-10 cursor-pointer rounded-xl px-3 text-[0.82rem] font-bold text-white/80 transition-colors hover:bg-white/8 hover:text-white">
              {t('signin')}
            </button>
            <button onClick={onSignUp}
              className="hidden min-h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 text-[0.82rem] font-extrabold text-[#0B111A] transition-transform active:scale-[.97] sm:flex">
              {t('start_free')}
            </button>
          </div>
        </div>
      </header>

      {/* ── hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <Aurora />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-28 md:px-8 md:pt-36 lg:min-h-dvh lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:pb-24">
          <div className="fade-in min-w-0 text-center lg:text-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-bold"
              style={invited
                ? { borderColor: 'rgba(13,124,251,.55)', background: 'rgba(13,124,251,.16)', color: '#9CCBFF' }
                : { borderColor: 'rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.7)' }}>
              {invited && <Gift size={13} />}
              {invited ? t('lp_invited') : t('lp_made')}
            </span>

            <h1 className="mt-6 text-[2.7rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl xl:text-[4.4rem] rtl:leading-[1.25]">
              {t('lp_h1a')}
              <span className="grad-text block pb-1">{t('lp_h1b')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg lg:mx-0">
              {t('lp_hero_sub')}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button onClick={onSignUp}
                className="group flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 text-[0.98rem] font-extrabold text-white shadow-[0_14px_40px_rgba(13,124,251,.45),inset_0_1px_0_rgba(255,255,255,.25)] transition-[transform,filter] hover:brightness-110 active:scale-[.98] sm:w-auto"
                style={{ background: 'linear-gradient(135deg,#2B8DFF,#0D7CFB 45%,#0A5FCC)' }}>
                {t('start_trial')}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </button>
              <button onClick={onSignIn}
                className="min-h-14 w-full cursor-pointer rounded-2xl border border-white/12 bg-white/[.04] px-7 text-[0.95rem] font-bold text-white/85 backdrop-blur-sm transition-colors hover:bg-white/[.09] sm:w-auto">
                {t('have_account')}
              </button>
            </div>

            <ul className="tnum mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.78rem] font-semibold text-white/55 lg:justify-start">
              {[t('trial_badge'), t('price_month', priceLabel(lang)), t('trial_b2')].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <span className="grid size-4 place-items-center rounded-full bg-[rgba(13,124,251,.25)] text-[#8CC2FF]"><Check size={10} strokeWidth={3.5} /></span>{x}
                </li>
              ))}
            </ul>
          </div>

          <HeroScene />
        </div>
      </section>

      <LandingSections onSignUp={onSignUp} />
    </div>
  );
}

/** One still wash of light behind the hero. No motion, no grid. */
function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 78% 8%, rgba(13,124,251,.2), transparent 70%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(to top, #05080F, transparent)' }} />
    </div>
  );
}

type Stage = 'brief' | 'editing' | 'review' | 'delivered';
type Demo = { title: string; client: string; price: string; due?: 'today' | 'due_tomorrow'; rev?: number; paid?: boolean };
const BOARD: { stage: Stage; cards: Demo[] }[] = [
  { stage: 'brief', cards: [{ title: 'Podcast — Ep. 12', client: 'Atlas Media', price: '6,000' }, { title: 'Reel — Menu', client: 'Café Lina', price: '3,000' }] },
  { stage: 'editing', cards: [{ title: 'Reel — Promo', client: 'Studio Nord', price: '3,000', due: 'due_tomorrow' }, { title: 'Vlog YouTube', client: 'K. Benali', price: '8,000' }, { title: 'Teaser 15s', client: 'Atlas Media', price: '4,500' }] },
  { stage: 'review', cards: [{ title: 'Ad 30s', client: 'Studio Nord', price: '12,000', due: 'today', rev: 2 }] },
  { stage: 'delivered', cards: [{ title: 'Showreel 2026', client: 'K. Benali', price: '15,000', paid: true }, { title: 'Reel — Launch', client: 'Café Lina', price: '3,000', paid: true }] },
];
const NAV = ['dashboard', 'videos', 'tasks', 'invoices', 'clients'] as const;

/** The product as it is: the videos board, straight on and at reading size,
 *  running off the edge of the page. Illustrative content only. */
function HeroScene() {
  const { t } = useApp();
  return (
    <div aria-hidden className="relative w-full min-w-0">
      <div className="flex h-[26rem] overflow-hidden rounded-xl border border-white/10 text-start shadow-[0_30px_80px_rgba(0,0,0,.55)] sm:h-[30rem] lg:w-[58rem] lg:max-w-none"
        style={{ background: '#0B111A', maskImage: 'linear-gradient(to bottom, #000 72%, transparent)' }}>
        {/* sidebar */}
        <div className="hidden w-44 shrink-0 flex-col gap-0.5 border-e border-white/8 p-3 sm:flex" style={{ background: '#0E141E' }}>
          <div className="mb-3 flex items-center gap-2 px-1 py-1">
            <Logo size={24} />
            <span className="min-w-0">
              <span className="block truncate text-[0.72rem] font-extrabold">Studio Nord</span>
              <span dir="ltr" className="block truncate text-[0.56rem] text-white/40">hello@studionord.co</span>
            </span>
          </div>
          {NAV.map((id) => (
            <span key={id} className="rounded-lg px-2.5 py-2 text-[0.72rem] font-bold"
              style={id === 'videos' ? { background: 'rgba(13,124,251,.14)', color: '#6FB1FF' } : { color: 'rgba(255,255,255,.5)' }}>
              {t(id)}
            </span>
          ))}
        </div>

        {/* videos board */}
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-extrabold leading-tight">{t('videos')}</p>
              <p className="tnum text-[0.62rem] text-white/45">8 · 54,500 DA</p>
            </div>
            <span className="rounded-lg px-3 py-2 text-[0.68rem] font-bold text-white" style={{ background: '#0D7CFB' }}>+ {t('new_video')}</span>
          </div>

          <div className="mt-4 grid min-w-0 flex-1 grid-cols-2 gap-2.5 lg:grid-cols-4">
            {BOARD.map((col, n) => (
              <div key={col.stage} className={`min-w-0 rounded-lg p-2 ${n > 1 ? 'hidden lg:block' : ''}`} style={{ background: 'rgba(255,255,255,.03)' }}>
                <p className="mb-2 flex items-center justify-between px-1 text-[0.66rem] font-extrabold text-white/80">
                  {t(STAGE_LABEL[col.stage])}
                  <span className="tnum font-bold text-white/35">{col.cards.length}</span>
                </p>
                <div className="flex flex-col gap-2">
                  {col.cards.map((c) => (
                    <div key={c.title} className="rounded-md border border-white/8 p-2.5" style={{ background: '#141B27' }}>
                      <p className="truncate text-[0.72rem] font-bold text-white/90">{c.title}</p>
                      <p className="truncate text-[0.6rem] text-white/45">{c.client}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-1.5">
                        <span className="tnum text-[0.7rem] font-extrabold">{c.price} <span className="font-semibold text-white/40">DA</span></span>
                        {c.due && <span className="rounded px-1.5 py-0.5 text-[0.54rem] font-bold" style={{ background: 'rgba(13,124,251,.16)', color: '#7DB8FF' }}>{t(c.due)}</span>}
                        {c.paid && <span className="rounded px-1.5 py-0.5 text-[0.54rem] font-bold" style={{ background: 'rgba(13,124,251,.16)', color: '#7DB8FF' }}>{t('paid')}</span>}
                        {!c.due && !c.paid && c.rev === undefined && <span className="rounded bg-white/[.06] px-1.5 py-0.5 text-[0.54rem] font-bold text-white/50">{t('unpaid')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
