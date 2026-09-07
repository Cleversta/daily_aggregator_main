'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HUBS } from '../../lib/categories';

// Flat, searchable list built once from HUBS: every active category plus
// its parent hub name, so "crypto" matches the category and "finance"
// matches the hub. Inactive ("soon") categories are excluded — nothing to
// navigate to yet.
const SEARCH_INDEX = HUBS.flatMap((hub) =>
  hub.categories
    .filter((category) => category.active)
    .map((category) => ({
      slug: category.slug,
      title: category.title,
      icon: category.icon,
      hubTitle: hub.title,
      hubIcon: hub.icon,
      href: `/category/${category.slug}`,
    }))
);

function searchCategories(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_INDEX.filter(
    (item) => item.title.toLowerCase().includes(q) || item.hubTitle.toLowerCase().includes(q)
  ).slice(0, 8);
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  const results = useMemo(() => searchCategories(query), [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = (href) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex].href);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-24 sm:pt-32"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-paper shadow-xl">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-slate" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Search categories… (e.g. crypto, AI)"
            className="w-full bg-transparent text-sm text-ink placeholder:text-slate focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-slate sm:block">
            Esc
          </kbd>
        </div>

        {query.trim() && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate">
                No categories match "{query}".
              </p>
            ) : (
              results.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item.href)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    index === activeIndex ? 'bg-[#FCF8ED] text-ink' : 'text-ink hover:bg-[#FCF8ED]'
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
                  <span className="flex-1">{item.title}</span>
                  <span className="text-xs text-slate">
                    <span aria-hidden="true">{item.hubIcon}</span> {item.hubTitle}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Drop <SearchTrigger /> anywhere in the header — it's fully self-contained
// (own open/close state, own Cmd/Ctrl+K listener), so it doesn't need any
// props or state lifted into layout.js.
export default function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search categories"
        className="group flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-slate transition-all duration-200 hover:scale-105 hover:border-wire hover:text-ink"
      >
        <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m13 13-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <kbd className="hidden text-[10px] sm:inline">⌘K</kbd>
      </button>
      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  );
}