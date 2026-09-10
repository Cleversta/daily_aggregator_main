'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

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

export function removeSavedItem(id) {
  window.localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(readSavedItems().filter(item => item.id !== id)));
  window.dispatchEvent(new Event(SAVED_ITEMS_EVENT));
}

export function subscribeSavedItems(update) {
  const onStorage = event => { if (event.key === SAVED_ITEMS_KEY || event.key === null) update(); };
  window.addEventListener(SAVED_ITEMS_EVENT, update);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SAVED_ITEMS_EVENT, update);
    window.removeEventListener('storage', onStorage);
  };
}

export default function SavedItems({ full = false }) {
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const update = () => setItems(readSavedItems());
    update();
    setReady(true);
    return subscribeSavedItems(update);
  }, []);

  function remove(item) {
    try { removeSavedItem(item.id); setFeedback(`${item.title} removed from saved items.`); }
    catch { setFeedback('Unable to remove this item. Please try again.'); }
  }

  async function copy(item) {
    try { await navigator.clipboard.writeText(item.content); setFeedback('Prompt copied.'); }
    catch { setFeedback('Copy unavailable. Open the saved prompt below and copy the text manually.'); }
  }
  if (!ready && full) return <p role="status" className="text-slate">Loading your saved items…</p>;
  if (items.length === 0) return full ? <div className="rounded-2xl border border-line bg-white p-6"><p role="status" className="mb-3 text-sm text-slate">{feedback}</p><p className="text-slate">Your library is ready for your first save. Save a brief or creator prompt to find it here.</p><div className="mt-4 flex flex-wrap gap-5"><Link href="/" className="action-link">Explore news →</Link><Link href="/creator-ideas" className="action-link">Find creator ideas →</Link></div></div> : null;

  return (
    <section className="border-b border-line pb-12" aria-labelledby="saved-items">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Your library</p>
          <h2 id="saved-items" className="mt-2 font-display text-2xl font-bold text-ink">Saved for later.</h2>
        </div>
        <span className="text-xs text-slate">Saved only on this device</span>
      </div>
      <p role="status" className="mt-3 text-sm text-slate">{feedback}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.slice(0, full ? 30 : 6).map((item) => (
          <article key={item.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">{item.type === 'prompt' ? 'Creator prompt' : 'Daily brief'}</p>
              <button type="button" onClick={() => remove(item)} aria-label={`Unsave ${item.title}`} className="save-toggle is-saved"><Icon name="bookmarkFilled" className="h-4 w-4" />Unsave</button>
            </div>
            <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">{item.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{item.description}</p>
            {item.type === 'brief' ? (
              <Link href={item.href} className="mt-4 inline-block text-xs font-bold uppercase tracking-wide text-ink hover:text-wire">Open brief →</Link>
            ) : (
              <div><button type="button" onClick={() => copy(item)} className="action-link mt-4">Copy prompt</button><details className="mt-2"><summary className="cursor-pointer py-3 text-sm">View saved prompt</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate">{item.content}</p></details></div>
            )}

          </article>
        ))}
      </div>
    </section>
  );
}
