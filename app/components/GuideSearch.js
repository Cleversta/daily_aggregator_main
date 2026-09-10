'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

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
    <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor="guide-task-search" className="mb-2 block text-xs font-bold uppercase tracking-widest text-ink">Find your next task</label>
      <div className="relative"><span className="pointer-events-none absolute left-4 top-4 text-wire"><Icon name="search" /></span>
      <input
        id="guide-task-search"
        type="search"
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. compress a photo, merge PDFs, format JSON..."
        className="w-full rounded-xl border border-line bg-white py-4 pl-12 pr-4 text-ink shadow-sm placeholder:text-slate focus:border-wire"
      />
      </div>
      {open && q.length >= 2 && matches.length === 0 && <p className="mt-2 text-sm text-slate" role="status">No matching guides. Try a shorter task or browse the categories below.</p>}
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-white shadow-sm overflow-hidden">
          {matches.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => router.push(`/guide/${item.slug}`)}
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