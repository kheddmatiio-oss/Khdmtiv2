'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { api } from '@/lib/api';
import { Button, Spinner } from './ui/primitives';
import { cn } from '@/lib/cn';
import { ago } from '@/lib/insights';
import type { SupportMessage } from '@/lib/types';
import { MessageCircle, X, Send } from 'lucide-react';

/** Polled rather than realtime: the tables stay locked behind RPCs, and at
 *  this volume a short poll while the panel is open is plenty. */
const POLL_OPEN = 8_000;
const POLL_BADGE = 45_000;

export function SupportChat() {
  const { t, agency } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<SupportMessage[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try { setMsgs(await api.supportList()); setUnread(0); } catch { /* offline */ }
  }, []);

  // badge keeps ticking while the panel is closed
  useEffect(() => {
    if (open) return;
    let alive = true;
    const check = () => api.supportUnread().then((n) => { if (alive) setUnread(n); }).catch(() => {});
    check();
    const id = setInterval(check, POLL_BADGE);
    return () => { alive = false; clearInterval(id); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    load();
    const id = setInterval(load, POLL_OPEN);
    return () => clearInterval(id);
  }, [open, load]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    // shown immediately; the poll reconciles with the server copy
    const optimistic: SupportMessage = {
      id: `tmp-${Date.now()}`, agency_id: agency?.id ?? '', from_admin: false,
      body, seen: false, created_at: new Date().toISOString(),
    };
    setMsgs((m) => [...(m ?? []), optimistic]);
    setDraft('');
    try { await api.supportSend(body); await load(); }
    catch { setMsgs((m) => (m ?? []).filter((x) => x.id !== optimistic.id)); setDraft(body); }
    finally { setSending(false); }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t('support')}
          className="fixed bottom-24 end-4 z-40 grid size-13 place-items-center rounded-full text-white shadow-[0_8px_26px_var(--accent-border)] transition-transform hover:scale-105 active:scale-95 cursor-pointer md:bottom-6"
          style={{ background: 'linear-gradient(135deg,var(--accent),color-mix(in oklab,var(--accent) 62%,black))' }}
        >
          <MessageCircle size={21} />
          {unread > 0 && (
            <span className="tnum absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[0.6rem] font-black text-white"
              style={{ background: 'var(--danger)', boxShadow: '0 0 0 2px var(--bg)' }}>
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-2xl border surface shadow-[var(--shadow-lg)] sm:inset-x-auto sm:end-5 sm:bottom-5 sm:w-[23rem]"
          style={{ animation: 'chatIn .26s cubic-bezier(.32,.72,0,1)' }}>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-black">{t('support')}</p>
              <p className="truncate text-[0.66rem] text-faint">{t('support_hint')}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t('cancel')}
              className="grid size-9 shrink-0 place-items-center rounded-full border text-muted hover:bg-[var(--surface-2)] cursor-pointer">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-3.5">
            {msgs === null ? (
              <div className="grid place-items-center py-10"><Spinner /></div>
            ) : msgs.length === 0 ? (
              <p className="py-10 text-center text-xs text-faint">{t('support_empty')}</p>
            ) : (
              msgs.map((m) => <Bubble key={m.id} m={m} />)
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t p-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter breaks the line
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); }
              }}
              rows={1}
              placeholder={t('write_message')}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--accent)]"
            />
            <Button type="submit" variant="primary" aria-label={t('send')}
              disabled={!draft.trim()} loading={sending} className="size-11 !rounded-xl !px-0">
              {!sending && <Send size={16} className="rtl:rotate-180" />}
            </Button>
          </form>

          <style>{`@keyframes chatIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
        </div>
      )}
    </>
  );
}

function Bubble({ m }: { m: SupportMessage }) {
  const { t } = useApp();
  const mine = !m.from_admin;
  return (
    <div className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn('max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[0.82rem] leading-relaxed',
          mine ? 'text-white' : 'surface-2 border')}
        style={mine ? { background: 'var(--accent)', borderEndEndRadius: '.35rem' } : { borderEndStartRadius: '.35rem' }}
      >
        {m.body}
      </div>
      <span className="px-1 text-[0.6rem] text-faint">
        {mine ? t('support_you') : t('support_team')} · {ago(m.created_at)}
      </span>
    </div>
  );
}
