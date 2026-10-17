'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/primitives';
import { totals } from '@/lib/invoice';
import { fmtNumber, money } from '@/lib/money';
import { fmtDate } from '@/lib/utils';
import { translate } from '@/lib/i18n';
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
};

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
  const { lines, ht, vat, ttc } = totals(invoice);
  const C = st.company;
  const ink = st.theme.accent || '#101223';
  const seller = [['NIF', C.nif], ['NIS', C.nis], ['RC', C.rc], ['ART', C.art], ['RIP', C.rip]].filter(([, v]) => v);
  const buyer = [['NIF', client?.nif], ['NIS', client?.nis], ['RC', client?.rc]].filter(([, v]) => v);
  const start = rtl ? 'right' : 'left';
  const end = rtl ? 'left' : 'right';

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
            className="inv-paper flex flex-col rounded-lg shadow-2xl"
            style={{ width: A4_W, minHeight: A4_H, background: '#fff', color: '#101223',
                     transform: `scale(${scale})`, transformOrigin: 'top left' }}>

            {/* masthead */}
            <div className="inv-ink flex items-start justify-between gap-4 px-8 py-6" style={{ background: ink, color: '#fff' }}>
              <div className="flex min-w-0 items-center gap-3">
                {C.logo && <img src={C.logo} alt="" className="size-12 shrink-0 rounded-lg bg-white object-contain p-1" />}
                <div className="min-w-0">
                  <p className="text-xl font-black">{C.name || '—'}</p>
                  {C.address && <p className="whitespace-pre-wrap text-[0.68rem] opacity-70">{C.address}</p>}
                  <p className="text-[0.68rem] opacity-70">{[C.phone, C.email].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <div style={{ textAlign: end }}>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] opacity-60">{t('invoice')}</p>
                <p className="tnum text-lg font-extrabold">{invoice.number}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col px-8 py-6">
              {/* parties */}
              <div className="mb-5 grid grid-cols-2 gap-6">
                {[{ title: t('issued_by'), name: C.name, addr: C.address, rows: seller },
                  { title: t('billed_to'), name: client?.name, addr: client?.address, rows: buyer }].map((p, i) => (
                  <div key={i}>
                    <p className="mb-1 text-[0.58rem] font-bold uppercase tracking-[0.16em]" style={{ color: '#8a8fa8' }}>{p.title}</p>
                    <p className="text-[0.92rem] font-extrabold">{p.name || '—'}</p>
                    {p.addr && <p className="whitespace-pre-wrap text-[0.68rem]" style={{ color: '#5c6185' }}>{p.addr}</p>}
                    {p.rows.map(([k, v]) => (
                      <p key={k} className="tnum text-[0.68rem]" style={{ color: '#5c6185' }}>{k} : {v}</p>
                    ))}
                  </div>
                ))}
              </div>

              {/* headline strip */}
              <div className="inv-rule mb-5 grid grid-cols-3 gap-px overflow-hidden rounded"
                style={{ background: '#e6e8f0', border: '1px solid #e6e8f0' }}>
                {[[t('invoice_no'), invoice.number],
                  [t('period'), invoice.period || fmtDate(invoice.date)],
                  [t('total_ttc'), money(ttc, invoice.currency, L)]].map(([k, v], i) => (
                  <div key={k} className="px-3 py-2 text-center" style={{ background: '#fff' }}>
                    <p className="text-[0.52rem] font-bold uppercase tracking-[0.14em]" style={{ color: '#8a8fa8' }}>{k}</p>
                    <p className="tnum mt-0.5" style={{ fontWeight: i === 2 ? 900 : 700, fontSize: i === 2 ? '0.95rem' : '0.82rem', color: i === 2 ? ink : undefined }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* lines */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="inv-rule" style={{ borderBottom: `2px solid ${ink}` }}>
                    {[[t('ref'), start, '2.5rem'], [t('designation'), start, ''],
                      [t('qty'), 'center', '3.5rem'], [t('unit_price'), end, '6rem'], [t('amount'), end, '7rem']]
                      .map(([label, align, w]) => (
                      <th key={label as string} className="px-2 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em]"
                        style={{ textAlign: align as 'left', width: w as string, color: '#8a8fa8' }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, n) => (
                    <tr key={l.id} className="inv-rule" style={{ borderBottom: '1px solid #e6e8f0' }}>
                      <td className="tnum px-2 py-2.5 text-[0.8rem]" style={{ textAlign: start, color: '#8a8fa8' }}>{l.ref || n + 1}</td>
                      <td className="px-2 py-2.5 text-[0.8rem] font-semibold" style={{ textAlign: start }}>{l.desc || '—'}</td>
                      <td className="tnum px-2 py-2.5 text-center text-[0.8rem]">{l.qty}</td>
                      <td className="tnum px-2 py-2.5 text-[0.8rem]" style={{ textAlign: end }}>{fmtNumber(l.pu)}</td>
                      <td className="tnum px-2 py-2.5 text-[0.8rem] font-bold" style={{ textAlign: end }}>{fmtNumber(l.qty * l.pu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* totals */}
              <div className="inv-keep mt-4 flex" style={{ justifyContent: rtl ? 'flex-start' : 'flex-end' }}>
                <div className="min-w-64">
                  {invoice.discount > 0 && (
                    <Row label={t('discount')} value={`− ${fmtNumber(invoice.discount)}`} />
                  )}
                  <Row label={t('subtotal_ht')} value={money(ht, invoice.currency, L)} />
                  <Row label={`${t('vat')}${invoice.vat > 0 ? ` (${invoice.vat}%)` : ''}`} value={money(vat, invoice.currency, L)} />
                  <div className="inv-rule mt-1 flex justify-between px-2 py-2.5 text-base font-black" style={{ borderTop: `2px solid ${ink}` }}>
                    <span>{t('total_ttc')}</span>
                    <span className="tnum">{money(ttc, invoice.currency, L)}</span>
                  </div>
                </div>
              </div>

              {/* footer facts */}
              <div className="inv-keep mt-6 flex flex-col gap-1 text-[0.74rem]" style={{ color: '#5c6185' }}>
                {(invoice.object || st.invoice.object) && (
                  <p><b style={{ color: '#101223' }}>{t('object')} :</b> {invoice.object || st.invoice.object}</p>
                )}
                {(invoice.paymentMode || st.invoice.paymentMode) && (
                  <p><b style={{ color: '#101223' }}>{t('payment_mode')} :</b> {invoice.paymentMode || st.invoice.paymentMode}</p>
                )}
                {invoice.due && <p><b style={{ color: '#101223' }}>{t('due_date')} :</b> {fmtDate(invoice.due)}</p>}
                {invoice.notes && <p className="whitespace-pre-wrap">{invoice.notes}</p>}
              </div>

              <div className="mt-auto flex justify-between gap-4 pt-4 text-[0.6rem]"
                style={{ borderTop: '1px solid #e6e8f0', color: '#a3a8c5' }}>
                <span>{C.name}</span>
                <span className="tnum">{invoice.number} · {fmtDate(invoice.date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body > *:not(.inv-root) { display: none !important; }
          .inv-root { position: static !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
          .no-print { display: none !important; }
          .inv-scale { height: auto !important; overflow: visible !important; }
          .inv-paper { width: auto !important; min-height: 0 !important; transform: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .inv-ink { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between px-2 py-1 text-[0.78rem]" style={{ color: '#5c6185' }}>
    <span>{label}</span><span className="tnum">{value}</span>
  </div>
);
