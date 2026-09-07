'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

// index: [{ type: 'brief' | 'topic', title, subtitle, href }], built at
// build time in layout.js from the articles + topics tables and passed
// down as a prop — no runtime Supabase calls needed, since this is a
// static export and the data is small enough to embed directly.
export default function SiteSearch({ index = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Focus after the modal has painted, not before.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      // Prevent the page behind the modal from scrolling on touch devices
      // while it's open (otherwise iOS Safari lets a touch-drag scroll the
      // background through the semi-transparent backdrop).
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        cancelAnimationFrame(id);
        document.body.style.overflow = previousOverflow;
      };
    }
    setQuery('');
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
      // Cmd/Ctrl+K opens search from anywhere on the site.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((item) => item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [index, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 text-sm font-medium text-slate transition-colors hover:text-ink"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m13.5 13.5-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Search
        <span className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-slate/70 sm:inline">⌘K</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[6dvh] sm:pt-[10dvh]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-line bg-white shadow-lg"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <svg className="h-4 w-4 shrink-0 text-slate" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="m13.5 13.5-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search briefs and topics…"
                aria-label="Search briefs and topics"
                className="w-full text-base text-ink placeholder:text-slate-400 focus:outline-none sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="shrink-0 text-xs text-slate hover:text-ink"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[55dvh] overflow-y-auto sm:max-h-[60dvh]">
              {query.trim() === '' && (
                <p className="px-4 py-6 text-center text-sm text-slate">Start typing to search all briefs and topics.</p>
              )}
              {query.trim() !== '' && results.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate">No matches for &quot;{query}&quot;.</p>
              )}
              {results.length > 0 && (
                <ul className="divide-y divide-line">
                  {results.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#FCF8ED]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                          {item.subtitle && <p className="truncate text-xs text-slate">{item.subtitle}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                          {item.type === 'topic' ? 'Topic' : 'Brief'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}