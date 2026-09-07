'use client';

import { useEffect, useState } from 'react';

// Keep in sync with the schedule in .github/workflows/daily-fetch.yml
const CRON_HOUR_UTC = 5;
const CRON_MINUTE_UTC = 0;

function getNextBriefTime() {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), CRON_HOUR_UTC, CRON_MINUTE_UTC, 0)
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

// Human phrasing instead of a raw "22h 2m" stopwatch readout.
function formatRelative(ms) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 1) return 'any moment now';
  if (minutes === 1) return 'in 1 minute';
  if (minutes < 60) return `in ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? 'in about 1 hour' : `in about ${hours} hours`;
}

// Static fallback shown before hydration (and if JS never runs) — same
// look as the old badge, so there's no layout jump.
function StaticBadge() {
  return (
    <span className="bg-ink text-[#F0C674] text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full font-bold whitespace-nowrap">
      Daily brief
    </span>
  );
}

// Classic "live" indicator: a soft expanding ring pinging outward behind a
// solid dot, rather than a flat opacity pulse.
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F0C674] opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F0C674]" />
    </span>
  );
}

export default function NextBrief() {
  const [now, setNow] = useState(null);
  const [nextTime, setNextTime] = useState(null);

  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);
      setNextTime((prev) => (prev && prev.getTime() > current.getTime() ? prev : getNextBriefTime()));
    };
    tick();
    // 30s is plenty for a minutes-level countdown — no need to burn battery.
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // now/nextTime are only set client-side after mount, so this also
  // doubles as the SSR-safe fallback (avoids a hydration mismatch on the
  // localized time string).
  if (!now || !nextTime) return <StaticBadge />;

  const localTime = nextTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const relative = formatRelative(nextTime.getTime() - now.getTime());

  return (
    <span
      title={`New stories land daily around 5:00 AM UTC — that's ${localTime} your time.`}
      className="flex items-center gap-1.5 bg-ink text-[#F0C674] text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full font-bold whitespace-nowrap animate-[fadeSlideDown_0.5s_ease-out_0.1s_both]"
    >
      <LiveDot />
      Next brief {relative}
    </span>
  );
}