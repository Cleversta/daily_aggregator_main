'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export const SAVED_ITEMS_KEY = 'daily-aggregator-saved-items';
const SAVED_ITEMS_EVENT = 'daily-aggregator-saved-items-changed';

export function readSavedItems() {
  try {
    const items = JSON.parse(window.localStorage.getItem(SAVED_ITEMS_KEY) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveItem(item) {
  const items = readSavedItems();
  const next = [item, ...items.filter((saved) => saved.id !== item.id)].slice(0, 30);
  window.localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SAVED_ITEMS_EVENT));
}

export default function SavedItems() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const update = () => setItems(readSavedItems());
    update();
    window.addEventListener(SAVED_ITEMS_EVENT, update);
    return () => window.removeEventListener(SAVED_ITEMS_EVENT, update);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="border-b border-line pb-12" aria-labelledby="saved-items">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Your library</p>
          <h2 id="saved-items" className="mt-2 font-display text-2xl font-bold text-ink">Saved for later.</h2>
        </div>
        <span className="text-xs text-slate">Saved only on this device</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <article key={item.id} className="rounded-lg border border-line bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">{item.type === 'prompt' ? 'Creator prompt' : 'Daily brief'}</p>
            <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">{item.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{item.description}</p>
            {item.type === 'brief' ? (
              <Link href={item.href} className="mt-4 inline-block text-xs font-bold uppercase tracking-wide text-ink hover:text-wire">Open brief →</Link>
            ) : (
              <button type="button" onClick={() => navigator.clipboard.writeText(item.content)} className="mt-4 text-xs font-bold uppercase tracking-wide text-ink hover:text-wire">Copy prompt</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
