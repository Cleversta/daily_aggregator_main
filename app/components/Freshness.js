'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

const FreshnessContext = createContext(null);
const STORAGE_KEY = 'daily-aggregator:last-visit';

// Wrap the story grid with this once. On mount it reads whenever the
// person last had the site open, hands that timestamp to any <NewBadge>
// below it, then stamps "now" as the new lastVisit for next time.
export function FreshnessProvider({ children }) {
  // undefined = "haven't checked localStorage yet" (avoids a flash of
  // badges during server render / first paint before we know).
  const [lastVisit, setLastVisit] = useState(undefined);
  // React Strict Mode runs effects twice in development. Without this guard,
  // the second run would read back the "now" we just wrote in the first run
  // and overwrite the real lastVisit before anything could use it.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    setLastVisit(stored ? new Date(stored) : null);
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }, []);

  return <FreshnessContext.Provider value={lastVisit}>{children}</FreshnessContext.Provider>;
}

// Read the resolved lastVisit anywhere under <FreshnessProvider>.
// undefined = not resolved yet, null = first-ever visit (no baseline),
// Date = a real previous visit to compare against.
export function useLastVisit() {
  return useContext(FreshnessContext);
}

// True once we know a given timestamp is newer than the visitor's last visit.
// Same "no baseline yet" rule as NewBadge: returns false until lastVisit
// resolves and on someone's very first-ever visit.
export function isNewSince(fetchedAt, lastVisit) {
  if (!lastVisit || !fetchedAt) return false;
  return new Date(fetchedAt) > lastVisit;
}

// Wrap any content that should only render while the item counts as "new"
// (same rule as NewBadge) — e.g. a one-line change summary next to a badge.
export function IfNew({ fetchedAt, children }) {
  const lastVisit = useLastVisit();
  if (!isNewSince(fetchedAt, lastVisit)) return null;
  return children;
}

// Drop next to any category pill. Renders nothing until we've resolved
// lastVisit, and nothing on someone's very first-ever visit (there's no
// baseline yet, so nothing should read as "new").
export function NewBadge({ fetchedAt }) {
  const lastVisit = useLastVisit();

  if (!lastVisit || !fetchedAt) return null;
  if (new Date(fetchedAt) <= lastVisit) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white bg-alert px-2 py-0.5 rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
      New
    </span>
  );
}