'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button, Card, Chip, Empty, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { InvoiceSheet } from '@/components/InvoiceSheet';
import { totals, nextNumber, unbilledFor, liveLines } from '@/lib/invoice';
import { money, showMap, fmtNumber, type CurrencyMap } from '@/lib/money';
import { uid, today, fmtDate, isPast } from '@/lib/utils';
import type { Invoice, InvoiceLine, InvoiceStatus, Currency } from '@/lib/types';
import { Receipt, Pencil, Trash2, Plus, Printer, Check, Send } from 'lucide-react';

const STATUS: InvoiceStatus[] = ['draft', 'sent', 'paid'];

export function Invoices() {
  const { t, lang, data, mutate, toast } = useApp();
  const st = data.settings;
  const [filter, setFilter] = useState<InvoiceStatus | ''>('');
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);

  const list = filter ? data.invoices.filter((i) => i.status === filter) : data.invoices;

  const sums = useMemo(() => {
    const all: CurrencyMap = {}, awaiting: CurrencyMap = {};
    data.invoices.forEach((i) => {
      const { ttc } = totals(i);
      all[i.currency] = (all[i.currency] ?? 0) + ttc;
      if (i.status !== 'paid') awaiting[i.currency] = (awaiting[i.currency] ?? 0) + ttc;
    });
    return { all, awaiting };
  }, [data.invoices]);

  const save = (inv: Invoice) => {
    mutate((d) => ({
      ...d,
      invoices: editing
        ? d.invoices.map((x) => (x.id === editing.id ? { ...x, ...inv } : x))
        : [{ ...inv, id: uid(), number: nextNumber(d.invoices, d.settings.invoice.prefix), status: 'draft', createdAt: new Date().toISOString() }, ...d.invoices],
    }));
    toast(t('saved'));
    setOpen(false); setEditing(null);
  };

  /** Marking an invoice paid settles exactly the videos it covers. */
  const markPaid = (inv: Invoice) => {
    const ids = new Set(liveLines(inv.lines).map((l) => l.videoId).filter(Boolean) as string[]);
    mutate((d) => ({
      ...d,
      invoices: d.invoices.map((x) => (x.id === inv.id ? { ...x, status: 'paid', paidAt: new Date().toISOString() } : x)),
      videos: d.videos.map((v) => (ids.has(v.id) ? { ...v, paid: true } : v)),
    }));
    toast(t('saved'));
  };

  const setStatus = (inv: Invoice, status: InvoiceStatus) =>
    mutate((d) => ({ ...d, invoices: d.invoices.map((x) => (x.id === inv.id ? { ...x, status } : x)) }));

  const remove = (inv: Invoice) => {
    if (!confirm(t('confirm_delete'))) return;
    mutate((d) => ({ ...d, invoices: d.invoices.filter((x) => x.id !== inv.id) }));
    toast(t('deleted'));
  };

  if (data.clients.length === 0) return <Empty icon={<Receipt size={22} />} title={t('no_clients')} />;

  // blue carries sent/paid, neutral gray carries draft
  const tone = (s: InvoiceStatus): 'accent' | 'neutral' => (s === 'draft' ? 'neutral' : 'accent');

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('invoices')}</h1>
          <p className="tnum text-xs text-muted">{data.invoices.length}</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={15} />{t('new_invoice')}
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[0.68rem] font-semibold text-muted">{t('total_invoiced')}</p>
          <p className="tnum text-lg font-black">{showMap(sums.all, lang, money(0, st.currency.base, lang))}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[0.68rem] font-semibold text-muted">{t('awaiting')}</p>
          <p className="tnum text-lg font-black">{showMap(sums.awaiting, lang, money(0, st.currency.base, lang))}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['', ...STATUS] as const).map((v) => (
          <button key={v || 'all'} onClick={() => setFilter(v as InvoiceStatus | '')}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              filter === v ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'surface text-muted'}`}>
            {v ? t(v) : t('all')}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {list.length === 0 ? <Empty icon={<Receipt size={22} />} title={t('no_invoices')} /> : (
          <ul>
            {list.map((inv) => {
              const { ttc, lines } = totals(inv);
              const late = inv.status !== 'paid' && isPast(inv.due);
              const client = data.clients.find((c) => c.id === inv.clientId);
              return (
                <li key={inv.id} className="row relative border-b px-4 py-3 last:border-0">
                  <span aria-hidden className="absolute inset-y-0 start-0 w-[3px]"
                    style={{ background: inv.status === 'draft' ? 'var(--text-faint)' : 'var(--accent)' }} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="tnum text-sm font-extrabold">{inv.number}</p>
                        <Chip tone={tone(inv.status)}>{t(inv.status)}</Chip>
                        {late && <Chip tone="danger">{t('overdue')}</Chip>}
                      </div>
                      <p className="tnum truncate text-[0.68rem] text-muted">
                        {client?.name ?? '—'} · {lines.length} {t('items')} · {fmtDate(inv.date)}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-base font-black">{money(ttc, inv.currency, lang)}</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Button size="sm" onClick={() => setViewing(inv)}><Printer size={12} />{t('print')}</Button>
                    {inv.status === 'draft' && (
                      <Button size="sm" onClick={() => setStatus(inv, 'sent')}><Send size={12} />{t('sent')}</Button>
                    )}
                    {inv.status !== 'paid' && (
                      <Button size="sm" onClick={() => markPaid(inv)}
                        className="!bg-[var(--accent-soft)] !text-[var(--accent)]"><Check size={12} />{t('paid')}</Button>
                    )}
                    <span className="flex-1" />
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(inv); setOpen(true); }} aria-label={t('edit')}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(inv)} aria-label={t('delete')}>
                      <Trash2 size={13} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {open && <InvoiceForm initial={editing} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />}
      {viewing && <InvoiceSheet invoice={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function InvoiceForm({ initial, onClose, onSave }: {
  initial: Invoice | null; onClose: () => void; onSave: (i: Invoice) => void;
}) {
  const { t, lang, data } = useApp();
  const st = data.settings;
  const [f, setF] = useState<Invoice>(initial ?? {
    id: '', number: '', clientId: data.clients[0]?.id ?? '', date: today(), due: '', period: '',
    currency: st.currency.base, lines: [], vat: Number(st.invoice.vat) || 0, discount: 0,
    object: st.invoice.object, paymentMode: st.invoice.paymentMode, notes: '', status: 'draft',
  });
  const [err, setErr] = useState('');
  const [picking, setPicking] = useState(false);

  const pool = useMemo(
    () => unbilledFor(data, f.clientId, initial?.id),
    [data, f.clientId, initial?.id],
  );
  const taken = new Set(f.lines.map((l) => l.videoId).filter(Boolean));
  // An invoice is denominated in one currency. Offering a video earned in
  // another would silently bill the wrong amount, so only matching work is
  // selectable once the invoice has lines.
  const available = pool.filter((v) => !taken.has(v.id) && (f.lines.length === 0 || v.currency === f.currency));
  const otherCurrency = pool.filter((v) => !taken.has(v.id) && f.lines.length > 0 && v.currency !== f.currency).length;

  const setLine = (id: string, k: keyof InvoiceLine, v: string) =>
    setF((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, [k]: k === 'qty' || k === 'pu' ? Number(v) : v } : l)) }));
  const addBlank = () =>
    setF((p) => ({ ...p, lines: [...p.lines, { id: uid(), ref: String(p.lines.length + 1), desc: '', qty: 1, pu: 0 }] }));
  const addVideo = (v: typeof pool[number]) =>
    setF((p) => ({
      ...p,
      // the first line sets the invoice currency, so pulled work keeps its value
      currency: p.lines.length === 0 ? v.currency : p.currency,
      lines: [...p.lines, { id: uid(), ref: String(p.lines.length + 1), desc: v.title || '—', qty: 1, pu: v.price, videoId: v.id, date: v.date }],
    }));
  const delLine = (id: string) => setF((p) => ({ ...p, lines: p.lines.filter((l) => l.id !== id) }));

  const { ht, vat, ttc } = totals(f);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.clientId) return setErr(t('err_name'));
    const lines = liveLines(f.lines).map((l, n) => ({ ...l, ref: String(n + 1) }));
    if (!lines.length) return setErr(t('err_items'));
    onSave({ ...f, lines, discount: Number(f.discount) || 0, vat: Number(f.vat) || 0 });
  };

  return (
    <Modal wide title={initial ? t('edit') : t('new_invoice')} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('clients')}>
            <Select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value, lines: [] })}>
              {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label={t('currency')} hint={f.lines.some((l) => l.videoId) ? '🔒' : undefined}>
            <Select value={f.currency} disabled={f.lines.some((l) => l.videoId)}
              className="disabled:opacity-60"
              onChange={(e) => setF({ ...f, currency: e.target.value as Currency })}>
              {st.currency.list.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </Select>
          </Field>
        </div>

        <Field label={t('items')} error={err || undefined}>
          <div className="flex flex-col gap-2">
            {f.lines.map((l, n) => (
              <div key={l.id} className="rounded-xl border bg-[var(--surface-2)] p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="tnum w-4 text-[0.62rem] font-extrabold text-faint">{n + 1}</span>
                  <Input className="flex-1 !py-1.5 !text-xs" placeholder={t('designation')}
                    value={l.desc} onChange={(e) => setLine(l.id, 'desc', e.target.value)} />
                  <button type="button" onClick={() => delLine(l.id)} aria-label={t('delete')} className="shrink-0 cursor-pointer p-1">
                    <Trash2 size={13} className="text-[var(--danger)]" />
                  </button>
                </div>
                <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-2">
                  <Input type="number" step="any" inputMode="decimal" className="tnum !py-1.5 text-center !text-xs"
                    placeholder={t('qty')} value={l.qty || ''} onChange={(e) => setLine(l.id, 'qty', e.target.value)} />
                  <Input type="number" step="any" inputMode="decimal" className="tnum !py-1.5 !text-xs"
                    placeholder={t('unit_price')} value={l.pu || ''} onChange={(e) => setLine(l.id, 'pu', e.target.value)} />
                  <span className="tnum min-w-20 text-end text-xs font-extrabold">{fmtNumber(l.qty * l.pu)}</span>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" size="sm" onClick={addBlank} className="border-dashed">+ {t('custom_line')}</Button>
              <Button type="button" size="sm" onClick={() => setPicking((v) => !v)}
                className={picking ? 'border-dashed !border-[var(--accent-border)] !text-[var(--accent)]' : 'border-dashed'}>
                + {t('from_videos')}
              </Button>
            </div>
            {picking && (
              <div className="max-h-40 overflow-y-auto rounded-xl border bg-[var(--surface-2)]">
                {available.length === 0
                  ? <p className="p-4 text-center text-xs text-muted">
                      {otherCurrency > 0 ? `${otherCurrency} · ${f.currency}` : t('no_unbilled')}
                    </p>
                  : available.map((v) => (
                    <button key={v.id} type="button" onClick={() => addVideo(v)}
                      className="flex w-full items-center gap-2 border-b px-3 py-2 text-start last:border-0 hover:bg-[var(--surface)] cursor-pointer">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{v.title || '—'}</span>
                        <span className="tnum block text-[0.6rem] text-faint">{fmtDate(v.date)}</span>
                      </span>
                      <span className="tnum text-xs font-extrabold text-[var(--accent)]">{money(v.price, v.currency, lang)}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('issue_date')}>
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
          <Field label={t('due_date')}>
            <Input type="date" value={f.due ?? ''} onChange={(e) => setF({ ...f, due: e.target.value })} />
          </Field>
          <Field label={t('discount')}>
            <Input type="number" step="any" inputMode="decimal" className="tnum"
              value={f.discount || ''} onChange={(e) => setF({ ...f, discount: Number(e.target.value) })} />
          </Field>
          <Field label={t('vat_rate')}>
            <Input type="number" step="any" inputMode="decimal" className="tnum"
              value={f.vat || ''} onChange={(e) => setF({ ...f, vat: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label={t('period')}>
          <Input value={f.period ?? ''} onChange={(e) => setF({ ...f, period: e.target.value })}
            placeholder={lang === 'ar' ? 'سبتمبر 2026' : 'September 2026'} />
        </Field>
        <Field label={t('object')}>
          <Input value={f.object ?? ''} onChange={(e) => setF({ ...f, object: e.target.value })} />
        </Field>
        <Field label={t('payment_mode')}>
          <Input value={f.paymentMode ?? ''} onChange={(e) => setF({ ...f, paymentMode: e.target.value })} />
        </Field>

        <div className="rounded-xl border bg-[var(--surface-2)] p-3.5">
          {[[t('subtotal_ht'), ht], [`${t('vat')}${f.vat > 0 ? ` (${f.vat}%)` : ''}`, vat]].map(([k, v]) => (
            <div key={k as string} className="mb-1 flex justify-between text-xs text-muted">
              <span>{k}</span><span className="tnum">{money(v as number, f.currency, lang)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1.5 font-black">
            <span>{t('total_ttc')}</span>
            <span className="tnum text-[var(--accent)]">{money(ttc, f.currency, lang)}</span>
          </div>
        </div>

        <ModalActions>
          <Button type="button" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" className="flex-1">{t('save')}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
