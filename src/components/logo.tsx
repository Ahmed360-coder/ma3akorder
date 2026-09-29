// Placeholder mark: a shopping bag with a speech-bubble tail ("معاك" = "with you").
export function LogoMark({ className = "h-9 w-9 drop-shadow-[0_6px_14px_rgba(255,138,61,0.35)]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-g)" />
      <path
        d="M20 24h24l-2 22a4 4 0 0 1-4 3.6H26a4 4 0 0 1-4-3.6z"
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M26 24v-3a6 6 0 0 1 12 0v3" fill="none" stroke="var(--accent-ink)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="36" r="3" fill="var(--accent-ink)" />
    </svg>
  );
}

export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight">{name}</span>
    </span>
  );
}
