'use client';

import { useState } from 'react';

// title/text are for the X share intent only; the actual URL always comes
// from window.location so this works correctly on any domain/environment
// without needing a build-time SITE_URL passed in.
export default function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (older browsers, permissions) — fall back
      // to selecting nothing and just leaving the button as-is rather than
      // throwing an error at the person.
    }
  }

  function handleShareX() {
    const url = window.location.href;
    const text = title || document.title;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, '_blank', 'noopener,noreferrer,width=550,height=420');
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:border-wire"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 6V3.5A1.5 1.5 0 0 1 7.5 2h5A1.5 1.5 0 0 1 14 3.5v5A1.5 1.5 0 0 1 12.5 10H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="2" y="6" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button
        type="button"
        onClick={handleShareX}
        aria-label="Share on X"
        className="flex items-center justify-center rounded-md border border-line bg-white p-1.5 text-ink transition-colors hover:border-wire"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.3l-5.7-7.5L3.8 22H.6l8.1-9.3L.9 2h7.5l5.2 6.9L18.9 2Zm-1.3 18h1.8L7.5 3.9H5.6L17.6 20Z" />
        </svg>
      </button>
    </div>
  );
}