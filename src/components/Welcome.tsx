'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { LandingSections } from './LandingSections';
import { priceLabel } from '@/lib/pricing';
import { STAGE_LABEL } from '@/lib/pipeline';
import {
  ArrowRight, Gift, Languages, Sun, Moon, CalendarClock, Check, MapPin, TrendingUp,
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
              {invited ? <Gift size={13} /> : <MapPin size={13} />}
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

/** Slow-moving light behind the hero: depth without a stock photo. */
function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-[20%] end-[-10%] size-[52rem] rounded-full opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(13,124,251,.42), transparent 60%)', animation: 'aurora 16s ease-in-out infinite' }} />
      <div className="absolute bottom-[-30%] start-[-12%] size-[44rem] rounded-full opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(22,82,162,.5), transparent 62%)', animation: 'aurora 22s ease-in-out infinite reverse' }} />
      <div className="absolute start-[38%] top-[30%] size-[26rem] rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(124,192,255,.25), transparent 65%)', animation: 'aurora 19s ease-in-out infinite' }} />
      <div className="absolute inset-0 opacity-[.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 75%)',
        }} />
      <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(to top, #05080F, transparent)' }} />
    </div>
  );
}

const BOARD: { stage: 'editing' | 'review' | 'delivered'; cards: { title: string; price: string; fill: number }[] }[] = [
  { stage: 'editing', cards: [{ title: 'Reel — Promo', price: '3,000', fill: 2 }, { title: 'Vlog YouTube', price: '8,000', fill: 2 }] },
  { stage: 'review', cards: [{ title: 'Ad 30s', price: '12,000', fill: 3 }] },
  { stage: 'delivered', cards: [{ title: 'Showreel 2026', price: '15,000', fill: 5 }, { title: 'Reel — Launch', price: '3,000', fill: 5 }] },
];

/** The product, staged: a tilted board with an invoice and two notes floating
 *  over it. Illustrative content only. */
function HeroScene() {
  const { t, lang } = useApp();
  const rtl = lang === 'ar';
  return (
    <div aria-hidden className="relative mx-auto w-full min-w-0 max-w-[36rem] px-3 sm:px-0 lg:max-w-none" style={{ perspective: 1800 }}>
      <div className="relative" style={{ transform: `rotateY(${rtl ? 13 : -13}deg) rotateX(7deg) rotateZ(${rtl ? -1 : 1}deg)`, transformStyle: 'preserve-3d' }}>
        {/* board */}
        <div className="overflow-hidden rounded-2xl border border-white/12 shadow-[0_50px_120px_rgba(0,0,0,.7),0_0_0_1px_rgba(255,255,255,.04)]"
          style={{ background: 'linear-gradient(180deg,#121A27,#0B111A)' }}>
          <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3">
            {[0, 1, 2].map((n) => <span key={n} className="size-2.5 rounded-full bg-white/14" />)}
            <span dir="ltr" className="mx-auto rounded-md bg-white/[.06] px-3 py-1 text-[0.6rem] text-white/45">khedmti.app</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 p-3.5">
            {BOARD.map((col, n) => (
              <div key={col.stage} className="rounded-xl border border-white/8 bg-white/[.03] p-2">
                <p className="mb-2 flex items-center gap-1.5 px-1 text-[0.64rem] font-extrabold text-white/85">
                  <span className="size-2 rounded-full" style={{ background: `rgba(13,124,251,${0.45 + n * 0.27})` }} />
                  {t(STAGE_LABEL[col.stage])}
                </p>
                <div className="flex flex-col gap-2">
                  {col.cards.map((c) => (
                    <div key={c.title} className="rounded-lg border border-white/8 p-2.5" style={{ background: '#151C29', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }}>
                      <p className="truncate text-[0.68rem] font-bold text-white/90">{c.title}</p>
                      <div className="mt-2 flex gap-[3px]">
                        {[0, 1, 2, 3, 4].map((k) => (
                          <span key={k} className="h-[3px] flex-1 rounded-full" style={{ background: k < c.fill ? '#0D7CFB' : 'rgba(255,255,255,.09)' }} />
                        ))}
                      </div>
                      <p className="tnum mt-2 text-[0.66rem] font-extrabold">{c.price} <span className="font-semibold text-white/40">DA</span></p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* invoice */}
        <div className="absolute -bottom-14 start-[-7%] w-[46%] rounded-xl bg-white p-3.5 text-[#0B111A] shadow-[0_30px_70px_rgba(0,0,0,.55)]"
          style={{ transform: 'translateZ(70px)', animation: 'floaty 7s ease-in-out infinite' }}>
          <div className="h-1 w-full rounded-full bg-[#0D7CFB]" />
          <div className="mt-2.5 flex items-start justify-between" dir="ltr">
            <div>
              <p className="text-[0.74rem] font-extrabold tracking-wide text-[#0D7CFB]">FACTURE</p>
              <p className="tnum text-[0.56rem] font-bold text-[#5c6478]">F-0042</p>
            </div>
            <span className="rounded border border-[#0D7CFB] px-1.5 py-0.5 text-[0.48rem] font-extrabold tracking-widest text-[#0D7CFB]">PAYÉE</span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {[78, 62, 70].map((w, n) => (
              <div key={n} className="flex items-center gap-2">
                <span className="h-1.5 rounded-full bg-[#E3E7EF]" style={{ width: `${w}%` }} />
                <span className="ms-auto h-1.5 w-7 rounded-full bg-[#CBD3E1]" />
              </div>
            ))}
          </div>
          <div className="tnum mt-3 flex items-center justify-between rounded-md bg-[#0B111A] px-2.5 py-1.5 text-white" dir="ltr">
            <span className="text-[0.5rem] font-bold tracking-widest text-white/70">TOTAL TTC</span>
            <span className="text-[0.74rem] font-extrabold">26,000 DA</span>
          </div>
        </div>

        {/* deadline note */}
        <div className="absolute -top-6 end-[-5%] flex items-center gap-2.5 rounded-2xl border border-white/14 px-3.5 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,.5)] backdrop-blur-xl"
          style={{ background: 'rgba(20,28,42,.82)', transform: 'translateZ(90px)', animation: 'floaty 6s ease-in-out infinite .8s' }}>
          <span className="grid size-8 place-items-center rounded-xl bg-[rgba(13,124,251,.22)] text-[#8CC2FF]"><CalendarClock size={15} /></span>
          <span>
            <span className="block text-[0.68rem] font-extrabold">{t('lp_mock_due')}</span>
            <span className="block text-[0.58rem] text-white/50">Reel — Promo</span>
          </span>
        </div>

        {/* revenue note */}
        <div className="absolute bottom-[-4.5rem] end-[2%] w-[34%] rounded-2xl border border-white/14 p-3 shadow-[0_20px_50px_rgba(0,0,0,.5)] backdrop-blur-xl"
          style={{ background: 'rgba(20,28,42,.82)', transform: 'translateZ(50px)', animation: 'floaty 8s ease-in-out infinite .3s' }}>
          <p className="flex items-center gap-1.5 text-[0.6rem] font-extrabold text-white/75"><TrendingUp size={12} className="text-[#8CC2FF]" />{t('lp_mock_rev')}</p>
          <div className="mt-2.5 flex h-12 items-end gap-1.5">
            {[32, 48, 40, 64, 56, 88].map((h, n) => (
              <span key={n} className="flex-1 rounded-t-[3px]" style={{ height: `${h}%`, background: n === 5 ? '#0D7CFB' : 'rgba(13,124,251,.35)' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}
