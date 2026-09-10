'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

export default function SearchTrigger({ items = [] }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = items.filter(item => (type === 'All' || type === item.type) && terms.every(term => `${item.title} ${item.description}`.toLowerCase().includes(term)));
  function close() { dialog.current?.close(); }
  useEffect(() => {
    function shortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close(); else dialog.current?.showModal();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  return <>
    <button ref={trigger} type="button" onClick={() => dialog.current?.showModal()} aria-label="Search news, creator ideas, and guides" className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm text-slate hover:border-wire"><Icon name="search" /><span className="hidden sm:inline">Search</span></button>
    <dialog ref={dialog} aria-labelledby="site-search-title" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === event.currentTarget) close(); }} className="site-search-dialog w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line bg-paper p-0 text-ink shadow-xl backdrop:bg-ink/50">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 id="site-search-title" className="font-display text-2xl font-bold">Find something useful</h2><button type="button" onClick={close} className="min-h-11 px-3 text-sm font-bold">Close</button></div>
        <label htmlFor="site-search" className="text-sm text-slate">Search news, creator ideas, and guides</label>
        <input autoFocus id="site-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try AI, football, or resize image" className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-base" />
        <div className="my-4 flex flex-wrap gap-2" aria-label="Search content type">{['All', 'News', 'Creator ideas', 'Guides'].map(value => <button type="button" key={value} onClick={() => setType(value)} aria-pressed={type === value} className={`min-h-11 rounded-full border border-line px-3 text-sm ${value === type ? 'bg-ink text-white' : 'bg-white'}`}>{value}</button>)}</div>
        <p role="status" className="mb-3 text-xs text-slate">{terms.length ? `${results.length} results` : 'Browse recent content or enter a search'}{results.length > 20 ? ' · Showing the first 20; refine your search for more.' : ''}</p>
        <div className="max-h-[45dvh] space-y-2 overflow-y-auto">
          {results.slice(0, 20).map(item => <Link href={item.href} key={item.href} onClick={close} className="block rounded-xl border border-line bg-white p-4 hover:border-wire"><span className="text-xs font-bold text-wire">{item.type}</span><span className="mt-1 block font-display text-lg font-bold">{item.title}</span><span className="mt-1 block line-clamp-2 text-sm text-slate">{item.description}</span></Link>)}
          {results.length === 0 && <div className="py-5 text-sm text-slate"><p>No matches yet. Try a shorter phrase or a different content type.</p><button type="button" onClick={() => { setQuery(''); setType('All'); }} className="action-link mt-2">Clear search</button><Link href="/topics" onClick={close} className="action-link ml-4">Browse topics →</Link></div>}
        </div>
      </div>
    </dialog>
  </>;
}
