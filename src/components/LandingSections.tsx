'use client';
import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Button } from './ui/primitives';
import { priceLabel } from '@/lib/pricing';
import { supportLink } from '@/lib/support';
import { STAGES, STAGE_LABEL } from '@/lib/pipeline';
import type { Key } from '@/lib/i18n';
import {
  Columns3, CalendarClock, Receipt, Wallet, Tags, TrendingUp, Users, Check, ArrowRight,
  Gift, MessageCircle, UserPlus, Film, FileText,
} from 'lucide-react';

const FEATURES: { icon: typeof Receipt; title: Key; sub: Key }[] = [
  { icon: Columns3, title: 'lp_f1', sub: 'lp_f1s' },
  { icon: CalendarClock, title: 'lp_f2', sub: 'lp_f2s' },
  { icon: Receipt, title: 'lp_f3', sub: 'lp_f3s' },
  { icon: Wallet, title: 'lp_f4', sub: 'lp_f4s' },
  { icon: Tags, title: 'lp_f5', sub: 'lp_f5s' },
  { icon: Users, title: 'lp_f6', sub: 'lp_f6s' },
];

const STEPS: { icon: typeof Receipt; title: Key; sub: Key }[] = [
  { icon: UserPlus, title: 'lp_s1', sub: 'lp_s1s' },
  { icon: Film, title: 'lp_s2', sub: 'lp_s2s' },
  { icon: FileText, title: 'lp_s3', sub: 'lp_s3s' },
];

const PLAN: Key[] = ['lp_p1', 'lp_p2', 'lp_p3', 'lp_p4', 'lp_p5', 'lp_p6'];

/** Illustrative cards for the product preview — clearly an example, not data. */
const DEMO: Record<string, { title: string; price: string; due?: Key; late?: boolean; rev?: number }[]> = {
  brief: [{ title: 'Podcast — Ep. 12', price: '6,000' }],
  editing: [{ title: 'Reel — Promo', price: '3,000', due: 'due_tomorrow' }, { title: 'Vlog YouTube', price: '8,000' }],
  review: [{ title: 'Ad 30s', price: '12,000', due: 'today' }],
  revision: [{ title: 'Reel — Teaser', price: '3,000', rev: 2 }],
  delivered: [{ title: 'Showreel 2026', price: '15,000' }, { title: 'Reel — Launch', price: '3,000' }],
};

/** Fades a block in the first time it scrolls into view. */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/** Small drawn scenes, one per feature — each shows the thing rather than naming it. */
function Art({ kind }: { kind: number }) {
  const { t } = useApp();
  const chip = 'rounded-full px-2 py-1 text-[0.6rem] font-extrabold';
  if (kind === 0) return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((s, n) => (
        <div key={s} className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate rounded-lg border px-2 py-2 text-center text-[0.6rem] font-extrabold"
            style={{ borderColor: `rgba(13,124,251,${0.18 + n * 0.2})`, background: `rgba(13,124,251,${0.05 + n * 0.07})`, color: n > 2 ? '#fff' : 'rgba(255,255,255,.75)' }}>
            {t(STAGE_LABEL[s])}
          </span>
          {n < STAGES.length - 1 && <ArrowRight size={11} className="shrink-0 text-white/25 rtl:rotate-180" />}
        </div>
      ))}
    </div>
  );
  if (kind === 1) return (
    <div className="flex flex-wrap gap-1.5">
      <span className={chip} style={{ background: 'rgba(13,124,251,.2)', color: '#8CC2FF' }}>{t('due_tomorrow')}</span>
      <span className={chip} style={{ background: 'rgba(229,72,77,.16)', color: '#FF8A8E' }}>{t('late_by', 2)}</span>
      <span className={`${chip} tnum`} style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)' }}>↻ 2</span>
    </div>
  );
  if (kind === 2) return (
    <div dir="ltr" className="rounded-xl bg-white p-3 text-[#0B111A]">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-extrabold tracking-wide text-[#0D7CFB]">FACTURE</span>
        <span className="tnum text-[0.56rem] font-bold text-[#5c6478]">NIF · NIS · RC · RIP</span>
      </div>
      <div className="mt-2 rounded-md border border-dashed border-[#D5DBE7] bg-[#F6F8FB] px-2 py-1.5">
        <p className="text-[0.5rem] font-bold text-[#5c6478]">Arrêtée la présente facture à la somme de :</p>
        <p className="text-[0.62rem] font-extrabold">Vingt-six mille dinars algériens</p>
      </div>
      <div className="tnum mt-2 flex items-center justify-between rounded-md bg-[#0B111A] px-2.5 py-1.5 text-white">
        <span className="text-[0.5rem] font-bold tracking-widest text-white/70">TOTAL TTC</span>
        <span className="text-[0.7rem] font-extrabold">26,000 DA</span>
      </div>
    </div>
  );
  if (kind === 3) return (
    <div dir="ltr" className="tnum flex flex-col gap-1.5">
      {[['26,000', 'DA', 100], ['450', '$', 62], ['300', '€', 44]].map(([v, c, w]) => (
        <div key={c as string} className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/8 text-[0.66rem] font-extrabold text-white/80">{c}</span>
          <span className="h-1.5 rounded-full" style={{ width: `${(w as number) * 0.6}%`, background: 'linear-gradient(90deg,#0D7CFB,#7CC0FF)' }} />
          <span className="text-[0.72rem] font-extrabold">{v}</span>
        </div>
      ))}
    </div>
  );
  if (kind === 4) return (
    <div dir="ltr" className="flex flex-wrap gap-1.5">
      {[['Reel', '3,000'], ['YouTube', '8,000'], ['Ad 30s', '12,000']].map(([n, p], k) => (
        <span key={n} className="rounded-xl border px-2.5 py-1.5"
          style={k === 0 ? { borderColor: '#0D7CFB', background: 'rgba(13,124,251,.16)' } : { borderColor: 'rgba(255,255,255,.1)' }}>
          <span className="block text-[0.66rem] font-extrabold" style={{ color: k === 0 ? '#8CC2FF' : '#fff' }}>{n}</span>
          <span className="tnum block text-[0.56rem] text-white/50">{p} DA</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex items-center">
      {['A', 'S', 'M', 'K'].map((x, n) => (
        <span key={x} className="-ms-2 grid size-9 place-items-center rounded-full border-2 text-[0.7rem] font-extrabold first:ms-0"
          style={{ borderColor: '#0B111A', background: `rgba(13,124,251,${0.95 - n * 0.2})` }}>{x}</span>
      ))}
      <span className="ms-3 h-px flex-1 bg-white/10" />
    </div>
  );
}

const SPAN = ['lg:col-span-4', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3'];

const H2 = ({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[#5FA8FF] rtl:tracking-normal">{kicker}</p>
    <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[1.12] tracking-tight text-white md:text-[2.9rem] rtl:leading-[1.3]">{title}</h2>
    {sub && <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">{sub}</p>}
  </div>
);

export function LandingSections({ onSignUp }: { onSignUp: () => void }) {
  const { t, lang } = useApp();
  const wa = supportLink('Khedmti');

  return (
    <div className="relative text-white" style={{ background: '#05080F' }}>
      {/* ── the product, shown ─────────────────────────────── */}
      <section id="product" className="scroll-mt-16 border-t border-white/8 px-4 py-20 md:px-8 md:py-28">
        <Reveal><H2 kicker={t('lp_k_product')} title={t('lp_product')} sub={t('lp_product_sub')} /></Reveal>

        <div aria-hidden className="relative mx-auto mt-10 max-w-6xl">
          <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(13,124,251,.28), transparent 65%)' }} />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,.6)]"
            style={{ background: '#0B111A' }}>
            <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3">
              {[0, 1, 2].map((n) => <span key={n} className="size-2.5 rounded-full bg-white/12" />)}
              <span dir="ltr" className="mx-auto rounded-md bg-white/[.05] px-3 py-1 text-[0.62rem] text-white/40">khedmti.app</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.56rem] font-bold text-white/40">{t('lp_example')}</span>
            </div>
            <div className="flex gap-2.5 overflow-hidden p-3 md:p-4">
              {STAGES.map((s, n) => (
                <div key={s} className={`min-w-0 flex-1 rounded-xl border border-white/8 bg-white/[.025] p-2 ${n > 2 ? 'hidden md:block' : n > 1 ? 'hidden sm:block' : ''}`}>
                  <p className="mb-2 flex items-center gap-1.5 px-1 text-[0.66rem] font-extrabold text-white/85">
                    <span className="size-2 rounded-full" style={{ background: `rgba(13,124,251,${0.25 + n * 0.19})` }} />
                    {t(STAGE_LABEL[s])}
                    <span className="tnum text-white/35">{DEMO[s].length}</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {DEMO[s].map((c) => (
                      <div key={c.title} className="rounded-lg border border-white/8 p-2.5" style={{ background: '#11161F' }}>
                        <p className="truncate text-[0.7rem] font-bold text-white/90">{c.title}</p>
                        <div className="mt-2 flex gap-[3px]">
                          {STAGES.map((x, k) => (
                            <span key={x} className="h-[3px] flex-1 rounded-full"
                              style={{ background: k <= n ? `rgba(13,124,251,${0.35 + n * 0.16})` : 'rgba(255,255,255,.08)' }} />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="tnum text-[0.68rem] font-black text-white">{c.price} <span className="font-bold text-white/40">DA</span></span>
                          {c.due && <span className="rounded-full bg-[rgba(13,124,251,.18)] px-1.5 py-0.5 text-[0.54rem] font-extrabold text-[#7DB8FF]">{t(c.due)}</span>}
                          {c.rev && <span className="tnum rounded-full bg-white/8 px-1.5 py-0.5 text-[0.54rem] font-extrabold text-white/60">↻ {c.rev}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── what it does ───────────────────────────────────── */}
      <section id="features" className="scroll-mt-16 border-t border-white/8 px-4 py-20 md:px-8 md:py-28">
        <Reveal><H2 kicker={t('lp_k_features')} title={t('lp_features')} /></Reveal>
        <ul className="mx-auto mt-12 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map(({ icon: Icon, title, sub }, n) => (
            <li key={title} className={SPAN[n]}>
              <Reveal delay={(n % 3) * 80} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/8 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-[rgba(13,124,251,.5)]"
                  style={{ background: 'linear-gradient(165deg, rgba(255,255,255,.055), rgba(255,255,255,.012))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                  <span aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: 'rgba(13,124,251,.35)' }} />
                  <div aria-hidden className="relative mb-6 flex min-h-[5.5rem] flex-col justify-center"><Art kind={n} /></div>
                  <h3 className="relative flex items-center gap-2 text-[1.05rem] font-extrabold">
                    <Icon size={17} className="shrink-0 text-[#7DB8FF]" />{t(title)}
                  </h3>
                  <p className="relative mt-1.5 text-[0.84rem] leading-relaxed text-white/55">{t(sub)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ── how it works ───────────────────────────────────── */}
      <section className="border-t border-white/8 px-4 py-20 md:px-8 md:py-28">
        <Reveal><H2 kicker={t('lp_k_steps')} title={t('lp_steps')} /></Reveal>
        <ol className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, sub }, n) => (
            <li key={title} className="relative rounded-2xl border border-white/8 p-6" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,.05), rgba(255,255,255,.01))' }}>
              <span className="tnum absolute end-5 top-4 text-5xl font-black leading-none text-white/[.06]">{n + 1}</span>
              <Icon size={22} className="text-[#7DB8FF]" />
              <h3 className="mt-4 text-base font-extrabold">{t(title)}</h3>
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-white/55">{t(sub)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── price ──────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-16 border-t border-white/8 px-4 py-20 md:px-8 md:py-28">
        <Reveal><H2 kicker={t('lp_k_price')} title={t('lp_price')} sub={t('lp_price_sub')} /></Reveal>
        <div className="relative mx-auto mt-10 max-w-md">
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[3rem] opacity-70 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(13,124,251,.25), transparent 70%)' }} />
          <div className="relative overflow-hidden rounded-3xl border p-7 md:p-8"
            style={{ borderColor: 'rgba(13,124,251,.45)', background: 'linear-gradient(165deg, #0F1C33 0%, #0B111A 60%)' }}>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold"
              style={{ background: 'rgba(13,124,251,.22)', color: '#8CC2FF' }}>
              <Gift size={12} />{t('trial_badge')}
            </span>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="tnum text-5xl font-black tracking-tight">{priceLabel(lang)}</span>
              <span className="text-sm font-bold text-white/50">/ {t('lp_month')}</span>
            </p>
            <p className="mt-2 text-[0.8rem] text-white/55">{t('lp_price_note')}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {PLAN.map((k) => (
                <li key={k} className="flex items-center gap-2.5 text-sm font-bold text-white/90">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full" style={{ background: '#0D7CFB' }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t(k)}
                </li>
              ))}
            </ul>
            <Button variant="primary" size="lg" onClick={onSignUp}
              className="mt-7 min-h-13 w-full !rounded-2xl shadow-[0_10px_30px_rgba(13,124,251,.35)]">
              {t('start_trial')}<ArrowRight size={17} className="rtl:rotate-180" />
            </Button>
            <p className="mt-3 text-center text-[0.7rem] text-white/45">{t('trial_b2')}</p>
          </div>
        </div>
      </section>

      {/* ── affiliate + closing ────────────────────────────── */}
      <section className="border-t border-white/8 px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/8 bg-white/[.025] p-7">
            <TrendingUp size={22} className="text-[#7DB8FF]" />
            <h3 className="mt-4 text-xl font-black">{t('lp_aff')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{t('lp_aff_sub')}</p>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-3xl p-7"
            style={{ background: 'linear-gradient(150deg,#0D7CFB 0%,#1652A2 90%)' }}>
            <div>
              <h3 className="text-xl font-black">{t('lp_cta')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{t('lp_cta_sub')}</p>
            </div>
            <button onClick={onSignUp}
              className="flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white text-sm font-extrabold text-[#0B111A] transition-transform active:scale-[.98]">
              {t('start_trial')}<ArrowRight size={17} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[0.74rem] text-white/45">
          <span>© {new Date().getFullYear()} {t('app')}</span>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer"
              className="flex min-h-11 items-center gap-1.5 font-bold text-white/70 hover:text-white">
              <MessageCircle size={14} />{t('contact_support')}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
