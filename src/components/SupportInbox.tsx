'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { api } from '@/lib/api';
import { Button, Card, Empty, Spinner } from './ui/primitives';
import { cn } from '@/lib/cn';
import { ago } from '@/lib/insights';
import type { SupportMessage, SupportThread } from '@/lib/types';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';

export function SupportInbox() {
  const { t, toast } = useApp();
  const [threads, setThreads] = useState<SupportThread[] | null>(null);
  const [open, setOpen] = useState<SupportThread | null>(null);
  const [msgs, setMsgs] = useState<SupportMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(() => {
    api.adminSupportThreads().then(setThreads).catch(() => toast(t('err_net'), 'err'));
  }, [t, toast]);

  const loadThread = useCallback((id: string) => {
    api.adminSupportList(id).then(setMsgs).catch(() => toast(t('err_net'), 'err'));
  }, [t, toast]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (!open) return;
    loadThread(open.agency_id);
    const id = setInterval(() => loadThread(open.agency_id), 8_000);
    return () => clearInterval(id);
  }, [open, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !open || sending) return;
    setSending(true);
    setDraft('');
    try {
      await api.adminSupportSend(open.agency_id, body);
      loadThread(open.agency_id);
      loadThreads();
    } catch { toast(t('err_net'), 'err'); setDraft(body); }
    finally { setSending(false); }
  };

  const totalUnread = threads?.reduce((n, x) => n + Number(x.unread || 0), 0) ?? 0;

  if (open) {
    return (
      <Card className="flex h-[32rem] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
          <Button size="sm" variant="ghost" onClick={() => { setOpen(null); setMsgs(null); loadThreads(); }}
            aria-label={t('back')}>
            <ArrowLeft size={15} className="rtl:rotate-180" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{open.agency_name}</p>
            <p className="truncate text-[0.64rem] text-faint">{open.agency_email}</p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
          {msgs === null
            ? <div className="grid place-items-center py-10"><Spinner /></div>
            : msgs.map((m) => (
              <div key={m.id} className={cn('flex flex-col gap-1', m.from_admin ? 'items-end' : 'items-start')}>
                <div className={cn('max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[0.82rem] leading-relaxed',
                  m.from_admin ? 'text-white' : 'surface-2 border')}
                  style={m.from_admin ? { background: 'var(--accent)' } : undefined}>
                  {m.body}
                </div>
                <span className="px-1 text-[0.6rem] text-faint">{ago(m.created_at)}</span>
              </div>
            ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={reply} className="flex shrink-0 items-end gap-2 border-t p-2.5">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); reply(e); } }}
            placeholder={t('write_message')}
            className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
          <Button type="submit" variant="primary" disabled={!draft.trim()} loading={sending}
            aria-label={t('send')} className="size-11 !rounded-xl !px-0">
            {!sending && <Send size={16} className="rtl:rotate-180" />}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-extrabold">
          <MessageCircle size={14} className="text-[var(--accent)]" />
          {t('support_threads')}
          {totalUnread > 0 && (
            <span className="tnum rounded-full px-1.5 text-[0.6rem] font-black text-white"
              style={{ background: 'var(--danger)' }}>{totalUnread}</span>
          )}
        </h2>
      </div>

      {threads === null ? (
        <div className="grid place-items-center py-10"><Spinner /></div>
      ) : threads.length === 0 ? (
        <Empty compact icon={<MessageCircle size={16} />} title={t('no_threads')} />
      ) : (
        <ul>
          {threads.map((x) => (
            <li key={x.agency_id}>
              <button onClick={() => setOpen(x)}
                className="row flex w-full items-center gap-3 border-b px-4 py-3 text-start last:border-0 cursor-pointer">
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-black"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {x.agency_name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{x.agency_name}</span>
                    {Number(x.unread) > 0 && (
                      <span className="tnum rounded-full px-1.5 text-[0.58rem] font-black text-white"
                        style={{ background: 'var(--danger)' }}>{x.unread}</span>
                    )}
                  </span>
                  <span className="block truncate text-[0.68rem] text-muted">{x.last_body}</span>
                </span>
                <span className="tnum shrink-0 text-[0.62rem] text-faint">{ago(x.last_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
