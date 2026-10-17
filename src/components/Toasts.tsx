'use client';
import { useApp } from '@/lib/store';
import { Check, TriangleAlert } from 'lucide-react';

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex max-w-[92vw] items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-lg)] animate-[toast_.25s_cubic-bezier(.34,1.56,.64,1)]"
          style={{
            background: t.tone === 'err'
              ? 'var(--danger)'
              : 'linear-gradient(135deg,var(--accent),color-mix(in oklab,var(--accent) 62%,black))',
          }}
        >
          {t.tone === 'err' ? <TriangleAlert size={14} /> : <Check size={14} />}
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes toast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
