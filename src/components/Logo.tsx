export function Logo({ size = 36 }: { size?: number }) {
  // Brand rule: the mark always sits on a dark ground with strong contrast,
  // so the navy tile stays in both themes.
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-[27%]"
      style={{ width: size, height: size, background: 'linear-gradient(145deg,#1A1D22,#0B111A)', boxShadow: '0 4px 14px rgb(11 17 26 / .45)' }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect x="4" y="3" width="7.5" height="19" rx="3.5" fill="#fff" />
        <path d="M13 21.5 27 7.5h8.5L21.5 21.5z" fill="#0D7CFB" />
        <path d="M13 24.5 21.5 33l6 7.5H19L10 31z" fill="#fff" />
        <rect x="4" y="26" width="7.5" height="18" rx="3.5" fill="#fff" />
        <rect x="31" y="9" width="13" height="6" rx="3" fill="#fff" />
        <rect x="27" y="21" width="17" height="6" rx="3" fill="#fff" />
        <circle cx="30" cy="24" r="3" fill="#0D7CFB" />
        <rect x="27" y="33" width="11" height="6" rx="3" fill="#fff" />
        <circle cx="42" cy="36" r="3.2" fill="#0D7CFB" />
      </svg>
    </span>
  );
}
