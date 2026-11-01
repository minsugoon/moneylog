import type { TabKey } from './navItems.ts'

function NavIcon({ name, className, size }: { name: TabKey; className?: string; size?: number }) {
  const dimensions = size ?? 24

  return (
    <svg
      className={className}
      width={dimensions}
      height={dimensions}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === 'list' && <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />}
      {name === 'entry' && <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />}
      {name === 'view' && <path d="M5 20V11M12 20V5M19 20v-7" />}
      {name === 'settings' && (
        <>
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </>
      )}
    </svg>
  )
}

export default NavIcon
