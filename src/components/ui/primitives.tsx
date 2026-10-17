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
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg relative after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']',
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
export const Card = ({ className, children, hover, ...rest }: {
  className?: string; children: ReactNode; hover?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cn('card', hover && 'lift', className)}>{children}</div>
);

/* ── Loading ─────────────────────────────────────────────── */
export const Skeleton = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn('skel block', className)} />
);

/** Mirrors the shape of a list so the page does not jump when data lands. */
export const ListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <ul>
    {Array.from({ length: rows }).map((_, i) => (
      <li key={i} className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <span className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-2.5 w-3/5" />
        </span>
        <Skeleton className="h-4 w-16 shrink-0" />
      </li>
    ))}
  </ul>
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

/* ── Filters ─────────────────────────────────────────────── */
/** One pill, used for every filter row, so touch sizing and the active
 *  treatment stay identical across screens. */
export function FilterPill({ active, count, children, onClick }: {
  active?: boolean; count?: number; children: ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold',
        'transition-colors cursor-pointer',
        // keeps a thumb-sized hit area without growing the pill
        "after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']",
        active
          ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'surface text-muted hover:text-[var(--text)]',
      )}
    >
      {children}
      {count !== undefined && <span className="tnum opacity-70">{count}</span>}
    </button>
  );
}

/** Horizontal filter strip that scrolls instead of wrapping on a phone. */
export const FilterRow = ({ children }: { children: ReactNode }) => (
  <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]{display:none}">
    {children}
  </div>
);

/* ── Empty state ─────────────────────────────────────────── */
export function Empty({ icon, title, hint, action, compact }: {
  icon: ReactNode; title: ReactNode; hint?: ReactNode; action?: ReactNode; compact?: boolean;
}) {
  // Inside a panel an empty state must not balloon the card it sits in.
  if (compact) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-5 text-xs text-faint">
        <span className="shrink-0">{icon}</span>{title}
      </div>
    );
  }
  return (
    <div className="fade-in flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="relative grid size-16 place-items-center rounded-2xl text-[var(--text-faint)]"
        style={{ background: 'var(--surface-2)' }}>
        <span aria-hidden className="absolute inset-0 rounded-2xl opacity-40"
          style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-soft), transparent 70%)' }} />
        <span className="relative">{icon}</span>
      </div>
      <p className="text-sm font-bold">{title}</p>
      {hint && <p className="max-w-xs text-xs text-faint">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
