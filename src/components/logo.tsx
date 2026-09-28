// Placeholder mark: a shopping bag with a speech-bubble tail ("معاك" = "with you").
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--accent)" />
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
    <span className="inline-flex items-center gap-3">
      <LogoMark />
      <span className="text-xl font-bold tracking-tight">{name}</span>
    </span>
  );
}
