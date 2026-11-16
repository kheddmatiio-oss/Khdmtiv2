/* eslint-disable @next/next/no-img-element */
import { fmtNumber, money } from '@/lib/money';
import { fmtDate } from '@/lib/utils';
import { MUTED, FAINT, LINE, type Ctx } from './shared';

/** A full-height colour column carries the sender; the page itself stays
 *  white and airy, with the total set as the largest thing on it. */
export function Studio(x: Ctx) {
  const { C, ink, onInk, end, start, rtl, t, invoice, paid, seller, buyer, client, object, cols,
    lines, L, ttc, payMode, gross, ht, vat, totalLabel } = x;
  const dim = onInk === '#fff' ? 'rgba(255,255,255,.62)' : 'rgba(11,17,26,.6)';
  const rule = onInk === '#fff' ? 'rgba(255,255,255,.16)' : 'rgba(11,17,26,.14)';
  const caps = { letterSpacing: rtl ? 0 : '0.16em' } as const;
  const ids = seller.filter(([k]) => k !== 'RIP');

  return (
    <div className="flex flex-1">
      {/* ── sender column ── */}
      <aside className="relative flex shrink-0 flex-col overflow-hidden" style={{
        width: 232, padding: '40px 26px 28px', color: onInk,
        background: `linear-gradient(170deg, ${ink} 0%, color-mix(in oklab, ${ink} 78%, #000) 100%)`,
      }}>
        <span aria-hidden className="absolute rounded-full" style={{ width: 260, height: 260, insetInlineEnd: -150, top: -110, background: 'rgba(255,255,255,.07)' }} />
        <span aria-hidden className="absolute rounded-full" style={{ width: 190, height: 190, insetInlineStart: -110, bottom: 90, background: 'rgba(255,255,255,.05)' }} />

        <div className="relative">
          {C.logo
            ? <img src={C.logo} alt="" className="object-contain" style={{ width: 62, height: 62, borderRadius: 16, background: '#fff', padding: 5 }} />
            : (
              <span className="grid place-items-center text-2xl font-extrabold" style={{ width: 62, height: 62, borderRadius: 16, background: onInk, color: ink }}>
                {(C.name.trim()[0] ?? 'K').toUpperCase()}
              </span>
            )}
          <p className="mt-4 text-[1.12rem] font-extrabold leading-tight">{C.name || '—'}</p>
          {C.address && <p className="mt-1.5 whitespace-pre-wrap text-[0.68rem] leading-relaxed" style={{ color: dim }}>{C.address}</p>}
        </div>

        <div className="relative mt-7 flex flex-col gap-5 text-[0.68rem]">
          {(C.phone || C.email) && (
            <div>
              <p className="mb-1.5 text-[0.54rem] font-bold uppercase" style={{ color: dim, ...caps }}>Contact</p>
              {C.phone && <p className="tnum font-semibold" dir="ltr" style={{ textAlign: start }}>{C.phone}</p>}
              {C.email && <p className="break-all font-semibold" dir="ltr" style={{ textAlign: start }}>{C.email}</p>}
            </div>
          )}
          {ids.length > 0 && (
            <div className="pt-5" style={{ borderTop: `1px solid ${rule}` }}>
              <p className="mb-2 text-[0.54rem] font-bold uppercase" style={{ color: dim, ...caps }}>{t('issued_by')}</p>
              <div className="tnum flex flex-col gap-1.5">
                {ids.map(([k, v]) => (
                  <p key={k}><span className="block text-[0.52rem] font-bold" style={{ color: dim }}>{k}</span><span className="break-all font-semibold">{v}</span></p>
                ))}
              </div>
            </div>
          )}
          {(payMode || C.rip) && (
            <div className="pt-5" style={{ borderTop: `1px solid ${rule}` }}>
              <p className="mb-2 text-[0.54rem] font-bold uppercase" style={{ color: dim, ...caps }}>{t('payment_mode')}</p>
              {payMode && <p className="font-semibold">{payMode}</p>}
              {C.rip && (
                <p className="tnum mt-1.5"><span className="block text-[0.52rem] font-bold" style={{ color: dim }}>RIP</span><span className="break-all font-semibold">{C.rip}</span></p>
              )}
            </div>
          )}
        </div>

        <p dir="ltr" className="relative mt-auto pt-8 text-[0.54rem]" style={{ color: dim, textAlign: start }}>khedmti.app</p>
      </aside>

      {/* ── the invoice ── */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ padding: '40px 40px 28px 38px' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-extrabold uppercase" style={{ color: ink, ...caps }}>{t('invoice')}</p>
            <p className="tnum mt-1 text-[2.5rem] font-extrabold leading-none" style={{ letterSpacing: '-0.03em' }}>{invoice.number}</p>
          </div>
          {paid && (
            <span className="mt-1 rounded-full px-3.5 py-1.5 text-[0.62rem] font-extrabold" style={{ background: ink, color: onInk, ...caps }}>
              {t('paid_stamp')}
            </span>
          )}
        </div>

        <div className="tnum mt-6 flex gap-8 pb-5" style={{ borderBottom: `1px solid ${LINE}` }}>
          {x.meta.slice(0, -1).map(([k, v]) => (
            <div key={k}>
              <p className="text-[0.54rem] font-bold uppercase" style={{ color: FAINT, ...caps }}>{k}</p>
              <p className="mt-1 text-[0.84rem] font-bold">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-[0.54rem] font-bold uppercase" style={{ color: FAINT, ...caps }}>{t('billed_to')}</p>
          <p className="mt-1 text-[1.3rem] font-extrabold leading-tight">{client?.name || '—'}</p>
          {client?.address && <p className="mt-0.5 whitespace-pre-wrap text-[0.72rem]" style={{ color: MUTED }}>{client.address}</p>}
          {buyer.length > 0 && (
            <p className="tnum mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.66rem]" style={{ color: MUTED }}>
              {buyer.map(([k, v]) => <span key={k}><b style={{ color: FAINT }}>{k}</b> {v}</span>)}
            </p>
          )}
        </div>

        {object && (
          <p className="mt-4 rounded-lg px-3 py-2 text-[0.74rem]" style={{ background: `color-mix(in oklab, ${ink} 6%, #fff)` }}>
            <b className="font-extrabold">{t('object')} : </b>{object}
          </p>
        )}

        <table className="mt-5 w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="inv-gap"><td colSpan={5} /></tr>
            <tr>
              {cols.map(([label, align, w]) => (
                <th key={label} className="px-1.5 pb-2 text-[0.54rem] font-bold uppercase"
                  style={{ textAlign: align, width: w, color: FAINT, borderBottom: `2px solid ${ink}`, ...caps }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, n) => (
              <tr key={l.id}>
                <td className="tnum px-1.5 py-3 text-[0.7rem]" style={{ textAlign: start, color: FAINT, borderBottom: `1px solid ${LINE}` }}>{l.ref || String(n + 1).padStart(2, '0')}</td>
                <td className="px-1.5 py-3 text-[0.82rem] font-bold" style={{ textAlign: start, borderBottom: `1px solid ${LINE}` }}>
                  {l.desc || '—'}
                  {l.date && <span className="tnum block text-[0.62rem] font-normal" style={{ color: FAINT }}>{fmtDate(l.date)}</span>}
                </td>
                <td className="tnum px-1.5 py-3 text-center text-[0.8rem]" style={{ borderBottom: `1px solid ${LINE}` }}>{l.qty}</td>
                <td className="tnum px-1.5 py-3 text-[0.8rem]" style={{ textAlign: end, borderBottom: `1px solid ${LINE}` }}>{fmtNumber(l.pu)}</td>
                <td className="tnum px-1.5 py-3 text-[0.84rem] font-extrabold" style={{ textAlign: end, borderBottom: `1px solid ${LINE}` }}>{fmtNumber(l.qty * l.pu)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="inv-gap"><td colSpan={5} /></tr></tfoot>
        </table>

        <div className="inv-keep mt-5 flex" style={{ justifyContent: 'flex-end' }}>
          <div className="tnum" style={{ width: '16.5rem' }}>
            {invoice.discount > 0 && (
              <>
                <Line label={t('gross_total')} value={fmtNumber(gross)} />
                <Line label={t('discount')} value={`− ${fmtNumber(invoice.discount)}`} />
              </>
            )}
            {(invoice.vat > 0 || invoice.discount > 0) && <Line label={t('subtotal_ht')} value={money(ht, invoice.currency, L)} />}
            {invoice.vat > 0 && <Line label={`${t('vat')} (${invoice.vat}%)`} value={money(vat, invoice.currency, L)} />}
            <div className="mt-2 pt-3" style={{ borderTop: `2px solid ${ink}`, textAlign: end }}>
              <p className="text-[0.56rem] font-extrabold uppercase" style={{ color: FAINT, ...caps }}>{totalLabel}</p>
              <p className="mt-0.5 text-[2rem] font-extrabold leading-none" style={{ color: ink === '#0B111A' ? '#0B111A' : ink, letterSpacing: '-0.02em' }}>
                {money(ttc, invoice.currency, L)}
              </p>
            </div>
          </div>
        </div>

        {invoice.notes && <p className="inv-keep mt-4 whitespace-pre-wrap text-[0.72rem] leading-relaxed" style={{ color: MUTED }}>{invoice.notes}</p>}

        <div className="inv-keep mt-auto flex items-end justify-between gap-6 pt-8">
          <p className="tnum text-[0.56rem]" style={{ color: FAINT }}>{invoice.number} · {fmtDate(invoice.date)}</p>
          <div style={{ width: '13.5rem', textAlign: 'center' }}>
            <div style={{ height: 78, borderBottom: `1.5px solid ${LINE}` }} />
            <p className="mt-1.5 text-[0.62rem] font-semibold" style={{ color: MUTED }}>{t('signature')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 py-1 text-[0.76rem]" style={{ color: MUTED }}>
    <span>{label}</span><span className="font-semibold" style={{ color: '#2b3040' }}>{value}</span>
  </div>
);
