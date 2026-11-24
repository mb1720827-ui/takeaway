"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the page every few seconds while an answer is being written. */
export function AutoRefresh({ everyMs = 4000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs]);
  return null;
}
