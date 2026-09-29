// Placeholder mark: a shopping bag with a speech-bubble tail ("معاك" = "with you").
export function LogoMark({ className = "h-9 w-9 drop-shadow-[0_6px_14px_rgba(18,161,80,0.35)]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="var(--accent)" />
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
