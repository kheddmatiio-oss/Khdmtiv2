'use client';
import { cn } from '@/lib/cn';
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/* ── Button ──────────────────────────────────────────────── */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary:
    'text-white shadow-[0_4px_14px_var(--accent-border)] hover:brightness-110 active:brightness-95 [background:linear-gradient(135deg,var(--accent),color-mix(in_oklab,var(--accent)_62%,black))]',
  secondary:
    'surface border text-[var(--text)] hover:bg-[var(--surface-2)]',
  ghost:
    'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
  danger:
    'text-[var(--danger)] bg-[var(--danger-soft)] hover:brightness-105',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[0.95rem] gap-2 rounded-xl',
};

export function Button({
  variant = 'secondary', size = 'md', className, loading, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: Size; loading?: boolean;
}) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold whitespace-nowrap',
        'transition-[filter,background,transform] duration-150 active:scale-[.97]',
        'disabled:opacity-60 disabled:pointer-events-none cursor-pointer',
        VARIANT[variant], SIZE[size], className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn('inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin', className)}
  />
);

/* ── Surfaces ────────────────────────────────────────────── */
export const Card = ({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cn('card', className)}>{children}</div>
);

export function Section({ title, action, children, className }: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h3 className="text-sm font-extrabold">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

/* ── Form controls ───────────────────────────────────────── */
const FIELD =
  'w-full rounded-xl border bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] ' +
  'outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-faint)] ' +
  'focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]';

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...rest} className={cn(FIELD, className)} />
);
export const Select = ({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest} className={cn(FIELD, 'cursor-pointer', className)}>{children}</select>
);
export const Textarea = ({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...rest} className={cn(FIELD, 'resize-none', className)} />
);

export function Field({ label, hint, error, children }: {
  label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-bold text-muted">{label}</span>}
      {children}
      {hint && !error && <span className="text-[0.68rem] text-faint">{hint}</span>}
      {error && <span className="text-[0.7rem] font-bold text-[var(--danger)]">{error}</span>}
    </label>
  );
}

/* ── Status chip ─────────────────────────────────────────── */
export function Chip({ tone = 'neutral', children, className }: {
  tone?: 'neutral' | 'accent' | 'danger' | 'warn'; children: ReactNode; className?: string;
}) {
  const tones = {
    neutral: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
    warn: 'bg-[color-mix(in_oklab,var(--warn)_14%,transparent)] text-[var(--warn)]',
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold', tones[tone], className)}>
      {children}
    </span>
  );
}

/** A number is meaningless without its label — used wherever figures are summarised. */
export const Stat = ({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: string }) => (
  <span className="inline-flex items-baseline gap-1.5 rounded-full border surface px-2.5 py-1 text-[0.68rem]">
    <span className="text-muted">{label}</span>
    <b className="tnum font-extrabold" style={tone ? { color: tone } : undefined}>{value}</b>
  </span>
);

/* ── Empty state ─────────────────────────────────────────── */
export function Empty({ icon, title, action }: { icon: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-faint)]">{icon}</div>
      <p className="text-sm text-muted">{title}</p>
      {action}
    </div>
  );
}
