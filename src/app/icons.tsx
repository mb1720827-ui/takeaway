import type { ReactNode } from "react";

// Takeaway's icon set: 24px grid, 2px round strokes (the same drawing rules as Stride's).
const paths: Record<string, ReactNode> = {
  home: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="12" r="2" />
      <path d="M7 19l1.5-3h7l1.5 3" />
    </>
  ),
  review: (
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
    </>
  ),
  recall: (
    <>
      <rect x="4" y="6" width="13" height="14" rx="2" />
      <path d="M8 3h10a2 2 0 0 1 2 2v12" />
    </>
  ),
  ask: <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" />,
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  chevron: <path d="M9 5.5l6.5 6.5L9 18.5" />,
  back: <path d="M15 5.5L8.5 12l6.5 6.5" />,
  external: <path d="M14 4.5h5.5V10M19.5 4.5L11 13M18 14v5.5H4.5V6H10" />,
  alert: (
    <>
      <path d="M12 3.5l9 16h-18z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-6" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
