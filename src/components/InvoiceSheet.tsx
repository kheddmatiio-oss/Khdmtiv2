'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/primitives';
import { totals } from '@/lib/invoice';
import { fmtNumber, money } from '@/lib/money';
import { fmtDate } from '@/lib/utils';
import { translate } from '@/lib/i18n';
import { amountInWords } from '@/lib/words';
import type { Invoice } from '@/lib/types';
import { Printer, X } from 'lucide-react';

// A4 at 96dpi. The sheet is laid out at real page size and scaled to fit the
// viewport, so the preview is the printed page rather than an approximation.
const A4_W = 794, A4_H = 1123;

const FR: Record<string, string> = {
  invoice: 'FACTURE', issued_by: 'Prestataire', billed_to: 'Client',
  invoice_no: 'Facture n°', period: 'Période', issue_date: "Date d'émission",
  due_date: 'Échéance', ref: 'Réf', designation: 'Désignation', qty: 'Qté',
  unit_price: 'P.U.', amount: 'Montant', subtotal_ht: 'Total HT', vat: 'TVA',
  total_ttc: 'TOTAL TTC', discount: 'Remise', object: 'Objet',
  payment_mode: 'Mode de paiement',
  amount_words: 'Arrêtée la présente facture à la somme de',
  signature: 'Cachet et signature', paid_stamp: 'PAYÉE', gross_total: 'Total brut',
};

const MUTED = '#5c6478', FAINT = '#8a91a3', LINE = '#e3e7ef', SOFT = '#f6f8fb';

export function InvoiceSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { data, t: tApp } = useApp();
  const st = data.settings;
  // Invoice language is deliberately separate from the UI language.
  const L = st.invoice.lang;
  const t = (k: string) => (L === 'fr' ? FR[k] ?? k : translate(L, k as never));
  const rtl = L === 'ar';

  const wrap = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [boxH, setBoxH] = useState(A4_H);

  useEffect(() => {
    const fit = () => {
      const avail = wrap.current?.clientWidth ?? A4_W;
      const k = Math.min(1, avail / A4_W);
      setScale(k);
      setBoxH(Math.max(A4_H, paper.current?.scrollHeight ?? A4_H) * k);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (paper.current) ro.observe(paper.current);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [invoice]);

  const client = data.clients.find((c) => c.id === invoice.clientId);
  const { lines, gross, ht, vat, ttc } = totals(invoice);
  const C = st.company;
  const ink = st.theme.accent || '#0B111A';
  const seller = [['NIF', C.nif], ['NIS', C.nis], ['RC', C.rc], ['ART', C.art], ['RIP', C.rip]].filter(([, v]) => v);
  const buyer = [['NIF', client?.nif], ['NIS', client?.nis], ['RC', client?.rc]].filter(([, v]) => v);
  const start = rtl ? 'right' : 'left';
  const end = rtl ? 'left' : 'right';
  const paid = invoice.status === 'paid';
  const object = invoice.object || st.invoice.object;
  const payMode = invoice.paymentMode || st.invoice.paymentMode;
  // tints are mixed from the chosen colour, so any accent stays coherent
  const tint = `color-mix(in oklab, ${ink} 7%, #fff)`;
  const meta: [string, string][] = [
    [t('issue_date'), fmtDate(invoice.date)],
    ...(invoice.due ? [[t('due_date'), fmtDate(invoice.due)] as [string, string]] : []),
    ...(invoice.period ? [[t('period'), invoice.period] as [string, string]] : []),
    [t('total_ttc'), money(ttc, invoice.currency, L)],
  ];
  const cols: [string, 'left' | 'right' | 'center', string][] = [
    [t('ref'), start, '3rem'], [t('designation'), start, ''],
    [t('qty'), 'center', '3.5rem'], [t('unit_price'), end, '6.5rem'], [t('amount'), end, '7.5rem'],
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="inv-root fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-black/70 px-4 pb-16 pt-4 backdrop-blur-sm">
      <div className="no-print sticky top-0 z-10 mx-auto mb-4 flex w-fit gap-2 rounded-full p-1.5 backdrop-blur-xl"
        style={{ background: 'color-mix(in oklab, var(--surface) 70%, transparent)' }}>
        <Button variant="primary" onClick={() => window.print()}><Printer size={15} />{tApp('print')}</Button>
        <Button onClick={onClose}><X size={15} />{tApp('cancel')}</Button>
      </div>

      <div ref={wrap} className="mx-auto" style={{ maxWidth: A4_W }}>
        <div className="inv-scale overflow-hidden" style={{ height: boxH }}>
          <div ref={paper} dir={rtl ? 'rtl' : 'ltr'}
            className="inv-paper flex flex-col overflow-hidden rounded-lg shadow-2xl"
            style={{ width: A4_W, minHeight: A4_H, background: '#fff', color: '#101223',
                     transform: `scale(${scale})`, transformOrigin: 'top left' }}>

            {/* a slim band of the brand colour instead of an ink-heavy masthead */}
            <div className="inv-bar" style={{ height: 8, background: ink }} />

            <div className="inv-pad flex flex-1 flex-col" style={{ padding: '34px 44px 28px' }}>
              {/* header: who is invoicing · what document this is */}
              <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 items-center gap-3.5">
                  {C.logo
                    ? <img src={C.logo} alt="" className="shrink-0 object-contain" style={{ width: 64, height: 64, borderRadius: 14 }} />
                    : (
                      <span className="grid shrink-0 place-items-center text-2xl font-black text-white"
                        style={{ width: 64, height: 64, borderRadius: 14, background: ink }}>
                        {(C.name.trim()[0] ?? 'K').toUpperCase()}
                      </span>
                    )}
                  <div className="min-w-0">
                    <p className="text-[1.3rem] font-black leading-tight">{C.name || '—'}</p>
                    {C.address && <p className="mt-0.5 whitespace-pre-wrap text-[0.7rem] leading-snug" style={{ color: MUTED }}>{C.address}</p>}
                    <p className="tnum text-[0.7rem]" style={{ color: MUTED }}>{[C.phone, C.email].filter(Boolean).join('  ·  ')}</p>
                  </div>
                </div>

                <div className="shrink-0" style={{ textAlign: end }}>
                  <p className="text-[1.9rem] font-black leading-none" style={{ color: ink, letterSpacing: rtl ? 0 : '0.04em' }}>{t('invoice')}</p>
                  <p className="tnum mt-1.5 text-[0.95rem] font-extrabold">{invoice.number}</p>
                  {paid && (
                    <span className="mt-2 inline-block rounded-md px-2.5 py-1 text-[0.62rem] font-black"
                      style={{ border: `1.5px solid ${ink}`, color: ink, letterSpacing: rtl ? 0 : '0.14em' }}>
                      {t('paid_stamp')}
                    </span>
                  )}
                </div>
              </div>

              {/* dates */}
              <div className="mt-6 flex overflow-hidden rounded-xl" style={{ border: `1px solid ${LINE}` }}>
                {meta.map(([k, v], n) => (
                  <div key={k} className="flex-1 px-4 py-2.5" style={{ borderInlineStart: n ? `1px solid ${LINE}` : undefined, background: SOFT }}>
                    <p className="text-[0.56rem] font-bold uppercase" style={{ color: FAINT, letterSpacing: rtl ? 0 : '0.14em' }}>{k}</p>
                    <p className="tnum mt-0.5 text-[0.82rem] font-extrabold">{v}</p>
                  </div>
                ))}
              </div>

              {/* parties */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {[{ title: t('issued_by'), name: C.name, addr: C.address, rows: seller, strong: false },
                  { title: t('billed_to'), name: client?.name, addr: client?.address, rows: buyer, strong: true }].map((p, n) => (
                  <div key={n} className="rounded-xl px-4 py-3.5"
                    style={p.strong
                      ? { background: tint, borderInlineStart: `4px solid ${ink}` }
                      : { border: `1px solid ${LINE}` }}>
                    <p className="text-[0.56rem] font-bold uppercase" style={{ color: p.strong ? ink : FAINT, letterSpacing: rtl ? 0 : '0.16em' }}>{p.title}</p>
                    <p className="mt-1 text-[0.98rem] font-black leading-tight">{p.name || '—'}</p>
                    {p.addr && <p className="mt-0.5 whitespace-pre-wrap text-[0.7rem] leading-snug" style={{ color: MUTED }}>{p.addr}</p>}
                    {p.rows.length > 0 && (
                      <div className="tnum mt-2 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 text-[0.68rem]">
                        {p.rows.map(([key, v]) => (
                          <div key={key} className="contents">
                            <span className="font-bold" style={{ color: FAINT }}>{key}</span>
                            <span style={{ color: '#2b3040' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {object && (
                <p className="mt-4 text-[0.78rem]">
                  <b className="font-extrabold">{t('object')} : </b><span style={{ color: '#2b3040' }}>{object}</span>
                </p>
              )}

              {/* lines */}
              <table className="mt-4 w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {cols.map(([label, align, w], n) => (
                      <th key={label} className="px-3 py-2.5 text-[0.6rem] font-extrabold uppercase text-white"
                        style={{
                          textAlign: align, width: w, background: ink, letterSpacing: rtl ? 0 : '0.1em',
                          borderStartStartRadius: n === 0 ? 10 : 0, borderEndStartRadius: n === 0 ? 10 : 0,
                          borderStartEndRadius: n === cols.length - 1 ? 10 : 0, borderEndEndRadius: n === cols.length - 1 ? 10 : 0,
                        }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, n) => (
                    <tr key={l.id} style={{ background: n % 2 ? SOFT : '#fff' }}>
                      <td className="tnum px-3 py-2.5 text-[0.76rem]" style={{ textAlign: start, color: FAINT, borderBottom: `1px solid ${LINE}` }}>
                        {l.ref || String(n + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2.5 text-[0.82rem] font-bold" style={{ textAlign: start, borderBottom: `1px solid ${LINE}` }}>
                        {l.desc || '—'}
                        {l.date && <span className="tnum block text-[0.64rem] font-normal" style={{ color: FAINT }}>{fmtDate(l.date)}</span>}
                      </td>
                      <td className="tnum px-3 py-2.5 text-center text-[0.8rem]" style={{ borderBottom: `1px solid ${LINE}` }}>{l.qty}</td>
                      <td className="tnum px-3 py-2.5 text-[0.8rem]" style={{ textAlign: end, borderBottom: `1px solid ${LINE}` }}>{fmtNumber(l.pu)}</td>
                      <td className="tnum px-3 py-2.5 text-[0.82rem] font-extrabold" style={{ textAlign: end, borderBottom: `1px solid ${LINE}` }}>{fmtNumber(l.qty * l.pu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* amount in words · totals */}
              <div className="inv-keep mt-5 grid grid-cols-[1fr_17rem] items-start gap-5">
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl px-4 py-3" style={{ background: SOFT, border: `1px dashed ${LINE}` }}>
                    <p className="text-[0.62rem] font-bold" style={{ color: MUTED }}>{t('amount_words')} :</p>
                    <p className="mt-1 text-[0.84rem] font-extrabold leading-snug">{amountInWords(ttc, invoice.currency, L)}</p>
                  </div>
                  {(payMode || C.rip) && (
                    <div className="tnum grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.72rem]">
                      {payMode && <><span className="font-bold" style={{ color: FAINT }}>{t('payment_mode')}</span><span className="font-bold">{payMode}</span></>}
                      {C.rip && <><span className="font-bold" style={{ color: FAINT }}>RIP</span><span className="font-bold">{C.rip}</span></>}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${LINE}` }}>
                  <div className="px-4 py-2.5">
                    {invoice.discount > 0 && (
                      <>
                        <Row label={t('gross_total')} value={fmtNumber(gross)} />
                        <Row label={t('discount')} value={`− ${fmtNumber(invoice.discount)}`} />
                      </>
                    )}
                    <Row label={t('subtotal_ht')} value={money(ht, invoice.currency, L)} strong />
                    <Row label={`${t('vat')}${invoice.vat > 0 ? ` (${invoice.vat}%)` : ''}`} value={money(vat, invoice.currency, L)} />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" style={{ background: ink }}>
                    <span className="text-[0.7rem] font-extrabold" style={{ letterSpacing: rtl ? 0 : '0.08em' }}>{t('total_ttc')}</span>
                    <span className="tnum text-[1.1rem] font-black">{money(ttc, invoice.currency, L)}</span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <p className="inv-keep mt-4 whitespace-pre-wrap rounded-xl px-4 py-3 text-[0.74rem] leading-relaxed"
                  style={{ border: `1px solid ${LINE}`, color: '#2b3040' }}>{invoice.notes}</p>
              )}

              {/* signature */}
              <div className="inv-keep mt-7 flex" style={{ justifyContent: 'flex-end' }}>
                <div style={{ width: '15rem', textAlign: 'center' }}>
                  <p className="text-[0.66rem] font-bold" style={{ color: MUTED }}>{t('signature')}</p>
                  <div className="mt-1.5 rounded-xl" style={{ height: 86, border: `1px dashed ${LINE}` }} />
                </div>
              </div>

              {/* legal footer */}
              <div className="mt-auto pt-6">
                <div className="tnum flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 pt-3 text-center text-[0.62rem]"
                  style={{ borderTop: `1px solid ${LINE}`, color: MUTED }}>
                  <b style={{ color: '#101223' }}>{C.name}</b>
                  {seller.filter(([key]) => key !== 'RIP').map(([key, v]) => <span key={key}>{key} : {v}</span>)}
                </div>
                <p className="mt-1.5 flex justify-between text-[0.56rem]" style={{ color: FAINT }}>
                  <span className="tnum">{invoice.number} · {fmtDate(invoice.date)}</span>
                  <span dir="ltr">khedmti.app</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 11mm 12mm; }
          body > *:not(.inv-root) { display: none !important; }
          .inv-root { position: static !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
          .no-print { display: none !important; }
          .inv-scale { height: auto !important; overflow: visible !important; }
          .inv-paper { width: auto !important; min-height: 272mm !important; transform: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .inv-pad { padding: 18px 0 0 !important; }
          .inv-paper, .inv-paper * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          .inv-keep { page-break-inside: avoid; }
        }
      `}</style>
    </div>,
    document.body,
  );
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex justify-between gap-3 py-1 text-[0.76rem]" style={{ color: strong ? '#101223' : '#5c6478', fontWeight: strong ? 800 : 500 }}>
    <span>{label}</span><span className="tnum">{value}</span>
  </div>
);
