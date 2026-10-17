'use client';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide }: {
  title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  // Escape closes, and the page behind must not scroll while a sheet is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
      style={{ animation: 'fade .18s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border surface shadow-[var(--shadow-lg)] sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        style={{ animation: 'sheet .3s cubic-bezier(.32,.72,0,1)' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3.5">
          <h2 className="text-base font-black">{title}</h2>
          <button onClick={onClose} aria-label="close"
            className="grid size-8 place-items-center rounded-full border text-muted transition-colors hover:bg-[var(--surface-2)] cursor-pointer">
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </div>
      <style>{`
        @keyframes fade{from{opacity:0}to{opacity:1}}
        @keyframes sheet{from{transform:translateY(100%);opacity:.6}to{transform:none;opacity:1}}
        @media (min-width:640px){@keyframes sheet{from{transform:scale(.97);opacity:0}to{transform:none;opacity:1}}}
      `}</style>
    </div>,
    document.body,
  );
}

/** Sticky footer for modal actions — always reachable on a phone. */
export const ModalActions = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 -mx-5 mt-4 flex gap-2 border-t px-5 py-3 surface">{children}</div>
);
