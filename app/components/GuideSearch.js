'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Reads /guide-index.json, generated at build time by
// scripts/generate-guide-index.js. A flat list of { slug, name, phrases } —
// small enough (a few hundred intents max) to load whole and filter in the
// browser. No API call, no server round trip.
export default function GuideSearch() {
  const [index, setIndex] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/guide-index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  const q = query.trim().toLowerCase();
  const matches =
    q.length < 2
      ? []
      : index
          .filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              item.phrases.some((p) => p.toLowerCase().includes(q))
          )
          .slice(0, 6);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. compress a photo, merge PDFs, format JSON..."
        className="w-full rounded-lg border border-line px-4 py-3 text-ink placeholder:text-slate focus:outline-none focus:border-wire"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-white shadow-sm overflow-hidden">
          {matches.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onMouseDown={() => router.push(`/guide/${item.slug}`)}
                className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-[#FCF8ED]"
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}