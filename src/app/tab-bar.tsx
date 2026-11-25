"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/review", label: "Review", icon: "review" },
  { href: "/recall", label: "Recall", icon: "recall" },
  { href: "/ask", label: "Ask", icon: "ask" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function TabBar() {
  return <TabBarFrame path={usePathname()} />;
}

/** Bottom tab bar on phones (thumb reach), a top bar on wider screens. The Suspense fallback renders it unmarked. */
export function TabBarFrame({ path }: { path: string }) {
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/i/") || path.startsWith("/c/") || path.startsWith("/saves") : path.startsWith(href));
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-white pb-[max(env(safe-area-inset-bottom),10px)] md:top-0 md:bottom-auto md:border-t-0 md:border-b md:pb-0"
    >
      <div className="mx-auto flex max-w-xl items-center px-2 pt-1.5 md:h-16 md:justify-between md:px-4 md:pt-0">
        <span className="hidden text-xl font-extrabold tracking-tight text-tape md:inline">Takeaway</span>
        <div className="flex flex-1 items-center md:flex-none md:gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active(t.href) ? "page" : undefined}
              className={`press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs md:flex-none md:flex-row md:gap-1.5 md:px-2 md:text-sm ${
                active(t.href) ? "font-extrabold text-tape" : "font-semibold text-muted hover:text-ink"
              }`}
            >
              <Icon name={t.icon} className="size-6 md:size-5" />
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
