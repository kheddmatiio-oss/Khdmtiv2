/* eslint-disable @next/next/no-img-element */
import { fmtNumber, money } from '@/lib/money';
import { fmtDate } from '@/lib/utils';
import { MUTED, FAINT, SOFT, type Ctx } from './shared';

/** The total is the hero: one big colour block states who, what and how much
 *  before the detail begins. Rounded, borderless, generous. */
export function Bold(x: Ctx) {
  const { C, ink, onInk, end, start, rtl, t, invoice, paid, seller, buyer, client, object, cols,
    lines, L, ttc, payMode, gross, ht, vat, totalLabel } = x;
  const dim = onInk === '#fff' ? 'rgba(255,255,255,.66)' : 'rgba(11,17,26,.62)';
  const glass = onInk === '#fff' ? 'rgba(255,255,255,.13)' : 'rgba(11,17,26,.09)';
  const caps = { letterSpacing: rtl ? 0 : '0.14em' } as const;
  const ids = seller.filter(([k]) => k !== 'RIP');

  return (
    <div className="flex flex-1 flex-col" style={{ padding: '34px 38px 26px' }}>
      {/* sender */}
      <div className="flex items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-3">
          {C.logo
            ? <img src={C.logo} alt="" className="shrink-0 object-contain" style={{ width: 50, height: 50, borderRadius: 14 }} />
            : (
              <span className="grid shrink-0 place-items-center text-xl font-extrabold" style={{ width: 50, height: 50, borderRadius: 14, background: ink, color: onInk }}>
                {(C.name.trim()[0] ?? 'K').toUpperCase()}
              </span>
            )}
          <div className="min-w-0">
            <p className="text-[1.05rem] font-extrabold leading-tight">{C.name || '—'}</p>
            {C.phone && <p className="tnum text-[0.66rem]" dir="ltr" style={{ color: MUTED, textAlign: start }}>{C.phone}</p>}
            {C.email && <p className="text-[0.66rem]" dir="ltr" style={{ color: MUTED, textAlign: start }}>{C.email}</p>}
          </div>
        </div>
        {C.address && <p className="max-w-[15rem] whitespace-pre-wrap text-[0.66rem] leading-snug" style={{ color: MUTED, textAlign: end }}>{C.address}</p>}
      </div>

      {/* hero */}
      <div className="relative mt-5 overflow-hidden" style={{
        borderRadius: 26, padding: '26px 28px 22px', color: onInk,
        background: `linear-gradient(125deg, ${ink} 0%, color-mix(in oklab, ${ink} 70%, #2B8DFF) 100%)`,
      }}>
        <span aria-hidden className="absolute rounded-full" style={{ width: 340, height: 340, insetInlineEnd: -110, top: -190, background: 'rgba(255,255,255,.08)' }} />
        <span aria-hidden className="absolute rounded-full" style={{ width: 220, height: 220, insetInlineEnd: 120, bottom: -160, background: 'rgba(255,255,255,.06)' }} />

        <div className="relative flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-[0.62rem] font-extrabold uppercase" style={{ color: dim, ...caps }}>
              {t('invoice')}
              {paid && <span className="rounded-full px-2.5 py-1 text-[0.54rem]" style={{ background: onInk, color: ink }}>{t('paid_stamp')}</span>}
            </p>
            <p className="tnum mt-1.5 text-[2.3rem] font-extrabold leading-none" style={{ letterSpacing: '-0.03em' }}>{invoice.number}</p>
          </div>
          <div style={{ textAlign: end }}>
            <p className="text-[0.62rem] font-extrabold uppercase" style={{ color: dim, ...caps }}>{totalLabel}</p>
            <p className="tnum mt-1.5 text-[2.3rem] font-extrabold leading-none" style={{ letterSpacing: '-0.03em' }}>{money(ttc, invoice.currency, L)}</p>
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[0.56rem] font-bold uppercase" style={{ color: dim, ...caps }}>{t('billed_to')}</p>
            <p className="mt-1 text-[1.15rem] font-extrabold leading-tight">{client?.name || '—'}</p>
            {client?.address && <p className="mt-0.5 whitespace-pre-wrap text-[0.68rem]" style={{ color: dim }}>{client.address}</p>}
          </div>
          <div className="tnum flex shrink-0 gap-1.5">
            {x.meta.slice(0, -1).map(([k, v]) => (
              <div key={k} className="px-3 py-2" style={{ borderRadius: 14, background: glass }}>
                <p className="text-[0.5rem] font-bold uppercase" style={{ color: dim, ...caps }}>{k}</p>
                <p className="mt-0.5 text-[0.74rem] font-extrabold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* identifiers */}
      {(ids.length > 0 || buyer.length > 0) && (
        <div className="tnum mt-3 flex gap-3 text-[0.64rem]">
          {[{ title: t('issued_by'), rows: ids }, { title: t('billed_to'), rows: buyer }].filter((p) => p.rows.length).map((p, n) => (
            <div key={n} className="flex flex-1 flex-wrap items-center gap-x-3.5 gap-y-1 px-4 py-2.5" style={{ borderRadius: 16, background: SOFT }}>
              <span className="text-[0.52rem] font-extrabold uppercase" style={{ color: ink === '#0B111A' ? MUTED : ink, ...caps }}>{p.title}</span>
              {p.rows.map(([k, v]) => <span key={k}><b style={{ color: FAINT }}>{k}</b> <span className="font-semibold">{v}</span></span>)}
            </div>
          ))}
        </div>
      )}

      {object && <p className="mt-4 text-[0.76rem]"><b className="font-extrabold">{t('object')} : </b><span style={{ color: '#2b3040' }}>{object}</span></p>}

      {/* lines: soft pills, no rules */}
      <table className="mt-3 w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 5px' }}>
        <thead>
          <tr className="inv-gap"><td colSpan={5} /></tr>
          <tr>
            {cols.map(([label, align, w]) => (
              <th key={label} className="px-3.5 pb-0.5 text-[0.54rem] font-bold uppercase" style={{ textAlign: align, width: w, color: FAINT, ...caps }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, n) => {
            const cell = { background: SOFT } as const;
            const r = 14;
            return (
              <tr key={l.id}>
                <td className="tnum px-3.5 py-2.5 text-[0.7rem] font-bold" style={{ ...cell, textAlign: start, color: ink === '#0B111A' ? FAINT : ink, borderStartStartRadius: r, borderEndStartRadius: r }}>
                  {l.ref || String(n + 1).padStart(2, '0')}
                </td>
                <td className="px-3.5 py-2.5 text-[0.82rem] font-bold" style={{ ...cell, textAlign: start }}>
                  {l.desc || '—'}
                  {l.date && <span className="tnum block text-[0.62rem] font-normal" style={{ color: FAINT }}>{fmtDate(l.date)}</span>}
                </td>
                <td className="tnum px-3.5 py-2.5 text-center text-[0.8rem]" style={cell}>{l.qty}</td>
                <td className="tnum px-3.5 py-2.5 text-[0.8rem]" style={{ ...cell, textAlign: end }}>{fmtNumber(l.pu)}</td>
                <td className="tnum px-3.5 py-2.5 text-[0.84rem] font-extrabold" style={{ ...cell, textAlign: end, borderStartEndRadius: r, borderEndEndRadius: r }}>{fmtNumber(l.qty * l.pu)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot><tr className="inv-gap"><td colSpan={5} /></tr></tfoot>
      </table>

      {/* totals */}
      <div className="inv-keep mt-3 flex" style={{ justifyContent: 'flex-end' }}>
        <div className="tnum px-5 py-3.5" style={{ borderRadius: 20, background: SOFT, width: '16.5rem' }}>
          {invoice.discount > 0 && (
            <>
              <Line label={t('gross_total')} value={fmtNumber(gross)} />
              <Line label={t('discount')} value={`− ${fmtNumber(invoice.discount)}`} />
            </>
          )}
          {(invoice.vat > 0 || invoice.discount > 0) && <Line label={t('subtotal_ht')} value={money(ht, invoice.currency, L)} />}
          {invoice.vat > 0 && <Line label={`${t('vat')} (${invoice.vat}%)`} value={money(vat, invoice.currency, L)} />}
          <div className="flex items-center justify-between gap-3 text-[0.92rem] font-extrabold"
            style={invoice.vat > 0 || invoice.discount > 0 ? { borderTop: '1px solid #dfe4ee', marginTop: 6, paddingTop: 8 } : undefined}>
            <span className="text-[0.62rem] uppercase" style={caps}>{totalLabel}</span>
            <span>{money(ttc, invoice.currency, L)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && <p className="inv-keep mt-3 whitespace-pre-wrap px-1 text-[0.72rem] leading-relaxed" style={{ color: MUTED }}>{invoice.notes}</p>}

      {/* payment · signature */}
      <div className="inv-keep mt-3 grid grid-cols-[1fr_16.5rem] gap-3">
        <div className="tnum px-5 py-4 text-[0.72rem]" style={{ borderRadius: 20, border: '1.5px solid #e3e7ef', visibility: payMode || C.rip ? 'visible' : 'hidden' }}>
          <p className="text-[0.54rem] font-extrabold uppercase" style={{ color: FAINT, ...caps }}>{t('payment_mode')}</p>
          {payMode && <p className="mt-1 font-bold">{payMode}</p>}
          {C.rip && <p className="mt-1.5"><b style={{ color: FAINT }}>RIP</b> <span className="font-bold" style={{ letterSpacing: '0.04em' }}>{C.rip}</span></p>}
        </div>
        <div className="px-5 py-3 text-center" style={{ borderRadius: 20, border: '1.5px dashed #d5dbe7', minHeight: 104 }}>
          <p className="text-[0.6rem] font-semibold" style={{ color: MUTED }}>{t('signature')}</p>
        </div>
      </div>

      <p className="tnum mt-auto flex justify-between pt-5 text-[0.56rem]" style={{ color: FAINT }}>
        <span>{C.name} · {invoice.number} · {fmtDate(invoice.date)}</span>
        <span dir="ltr">khedmti.app</span>
      </p>
    </div>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 py-1 text-[0.74rem]" style={{ color: MUTED }}>
    <span>{label}</span><span className="font-semibold" style={{ color: '#2b3040' }}>{value}</span>
  </div>
);
