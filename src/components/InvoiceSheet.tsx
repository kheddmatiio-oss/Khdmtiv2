'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/primitives';
import { totals } from '@/lib/invoice';
import { money } from '@/lib/money';
import { fmtDate } from '@/lib/utils';
import { translate } from '@/lib/i18n';
import { Classic } from './invoice/Classic';
import { Studio } from './invoice/Studio';
import { Bold } from './invoice/Bold';
import { readableOn, TEMPLATES, type Ctx, type TemplateId } from './invoice/shared';
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
  total_ttc: 'TOTAL TTC', total_plain: 'TOTAL', discount: 'Remise', object: 'Objet',
  payment_mode: 'Mode de paiement',
  signature: 'Cachet et signature', paid_stamp: 'PAYÉE', gross_total: 'Total brut',
};


export function InvoiceSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { data, mutate, worker, t: tApp } = useApp();
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
  const start: 'left' | 'right' = rtl ? 'right' : 'left';
  const end: 'left' | 'right' = rtl ? 'left' : 'right';
  const paid = invoice.status === 'paid';
  const object = invoice.object || st.invoice.object || '';
  const payMode = invoice.paymentMode || st.invoice.paymentMode || '';
  // tints are mixed from the chosen colour, so any accent stays coherent
  const totalLabel = invoice.vat > 0 ? t('total_ttc') : t('total_plain').toUpperCase();
  const tint = `color-mix(in oklab, ${ink} 7%, #fff)`;
  const meta: [string, string][] = [
    [t('issue_date'), fmtDate(invoice.date)],
    ...(invoice.due ? [[t('due_date'), fmtDate(invoice.due)] as [string, string]] : []),
    ...(invoice.period ? [[t('period'), invoice.period] as [string, string]] : []),
    [totalLabel, money(ttc, invoice.currency, L)],
  ];
  const cols: [string, 'left' | 'right' | 'center', string][] = [
    [t('ref'), start, '3rem'], [t('designation'), start, ''],
    [t('qty'), 'center', '3.5rem'], [t('unit_price'), end, '6.5rem'], [t('amount'), end, '7.5rem'],
  ];

  const tpl: TemplateId = st.invoice.template ?? 'studio';
  const ctx: Ctx = {
    invoice, client, C, lines, gross, ht, vat, ttc, ink, onInk: readableOn(ink), tint,
    t, L, rtl, start, end, paid, object, payMode, totalLabel, seller, buyer, meta, cols,
  };
  const pickTemplate = (id: TemplateId) =>
    mutate((d) => ({ ...d, settings: { ...d.settings, invoice: { ...d.settings.invoice, template: id } } }));

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="inv-root fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-black/70 px-4 pb-16 pt-4 backdrop-blur-sm">
      <div className="no-print sticky top-0 z-10 mx-auto mb-4 flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-3xl p-1.5 backdrop-blur-xl"
        style={{ background: 'color-mix(in oklab, var(--surface) 70%, transparent)' }}>
        <Button variant="primary" onClick={() => window.print()}><Printer size={15} />{tApp('print')}</Button>
        {!worker && (
          <div className="flex gap-0.5 rounded-full border p-0.5" role="tablist" aria-label={tApp('inv_template')}>
            {TEMPLATES.map((id) => (
              <button key={id} role="tab" aria-selected={tpl === id} onClick={() => pickTemplate(id)}
                className={`min-h-9 cursor-pointer rounded-full px-3 text-xs font-bold transition-colors ${
                  tpl === id ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted hover:text-[var(--text)]'}`}>
                {tApp(`tpl_${id}` as never)}
              </button>
            ))}
          </div>
        )}
        <Button onClick={onClose}><X size={15} />{tApp('cancel')}</Button>
      </div>

      <div ref={wrap} className="mx-auto" style={{ maxWidth: A4_W }}>
        <div className="inv-scale overflow-hidden" style={{ height: boxH }}>
          <div ref={paper} dir={rtl ? 'rtl' : 'ltr'}
            className="inv-paper flex flex-col overflow-hidden rounded-lg shadow-2xl"
            style={{ width: A4_W, minHeight: A4_H, background: '#fff', color: '#101223',
                     transform: `scale(${scale})`, transformOrigin: 'top left' }}>

            {tpl === 'classic' ? <Classic {...ctx} /> : tpl === 'bold' ? <Bold {...ctx} /> : <Studio {...ctx} />}
          </div>
        </div>
      </div>

      <style>{`
        .inv-gap { display: none; }
        @media print {
          @page { size: A4; margin: ${tpl === 'classic' ? '11mm 12mm' : '0'}; }
          body > *:not(.inv-root) { display: none !important; }
          .inv-root { position: static !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
          .no-print { display: none !important; }
          .inv-scale { height: auto !important; overflow: visible !important; }
          .inv-paper { width: ${tpl === 'classic' ? 'auto' : '210mm'} !important; min-height: ${tpl === 'classic' ? '272mm' : '297mm'} !important; transform: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .inv-pad { padding: 18px 0 0 !important; }
          .inv-gap { display: table-row !important; }
          .inv-gap td { height: 9mm; padding: 0; border: 0; background: none !important; }
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
