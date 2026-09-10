'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import { readSavedItems, saveItem, removeSavedItem, subscribeSavedItems } from './SavedItems';

export default function CreatorIdeas({ ideas, browse = false }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const update = () => {
      const items = readSavedItems();
      setSaved(ideas.filter(idea => items.some(item => item.id === `prompt-${idea.id}`)).map(idea => idea.id));
    };
    update();
    return subscribeSavedItems(update);
  }, [ideas]);

  async function copyPrompt(id, prompt) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(id);
      setFeedback('Prompt copied. Ready to paste.');
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
      setFeedback('Copy unavailable. Select the prompt text and copy it manually.');
    }
  }

  function savePrompt(idea) {
    try {
    if (readSavedItems().some(item => item.id === `prompt-${idea.id}`)) {
      removeSavedItem(`prompt-${idea.id}`);
      setFeedback('Prompt removed from saved items.');
      return;
    }
    saveItem({ id: `prompt-${idea.id}`, type: 'prompt', title: idea.title, description: idea.hook, content: idea.prompt, savedAt: Date.now() });
    setFeedback('Prompt saved on this device.');
    } catch { setFeedback('Unable to save. Your browser may have disabled local storage.'); }
  }

  const visibleIdeas = ideas.filter((idea) =>
    (!category || idea.category === category) &&
    (!platform || idea.platform === platform) &&
    `${idea.title} ${idea.hook} ${idea.prompt} ${idea.category} ${idea.platform}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  if (ideas.length === 0) return browse ? <p id="creator-ideas" className="rounded-xl border border-line bg-white p-6 text-slate">New creator prompts are being prepared. Explore the formats below while you wait for the next briefing.</p> : null;

  return (
    <section aria-labelledby="creator-ideas" className="border-b border-line pb-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Creator studio</p>
        <h2 id="creator-ideas" className="mt-2 font-display text-2xl font-bold text-ink">Ready-to-use creator prompts.</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate">Copy a prompt, paste it into your AI tool, then adapt the result to your own voice and audience.</p>
      </div>
      <p role="status" className="text-sm text-slate">{feedback}</p>
      {!browse && <a href="/creator-ideas" className="mt-4 inline-block text-sm font-bold text-wire hover:underline">Explore all creator ideas →</a>}
      {browse && <div className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold">Search ideas<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try AI, video, or a topic" className="mt-2 w-full rounded-lg border border-line bg-white p-3 font-normal" /></label>
          <label className="text-sm font-bold">Topic<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-white p-3 font-normal"><option value="">All topics</option>{[...new Set(ideas.map(idea => idea.category))].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="text-sm font-bold">Platform<select value={platform} onChange={(event) => setPlatform(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-white p-3 font-normal"><option value="">All platforms</option>{[...new Set(ideas.map(idea => idea.platform).filter(Boolean))].map(value => <option key={value}>{value}</option>)}</select></label>
        </div>
        <p role="status" className="text-sm text-slate">{visibleIdeas.length} {visibleIdeas.length === 1 ? 'idea' : 'ideas'} found</p>
        {visibleIdeas.length === 0 && <button type="button" onClick={() => { setQuery(''); setCategory(''); setPlatform(''); }} className="text-sm font-bold text-wire hover:underline">Clear filters</button>}
      </div>}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {visibleIdeas.map((idea) => (
          <article id={`idea-${idea.id}`} key={idea.id} className="surface-card p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">{idea.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EEE6] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate"><Icon name="play" className="h-3 w-3" />{idea.platform}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-bold leading-snug text-ink">{idea.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate">“{idea.hook}”</p>
            <details className="disclosure mt-3">
              <summary className="action-link cursor-pointer">View prompt & script <Icon name="chevron" className="h-4 w-4" /></summary>
              <div className="disclosure-content">
            <div className="mt-4 rounded-lg bg-ink p-4 text-[#F9F6EE]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F0C674]">Copy-ready AI prompt</p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/90">{idea.prompt}</p>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">First 3 seconds</p>
                <p className="mt-1 font-medium text-ink">“{idea.hook}”</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">Script outline</p>
                <ol className="mt-1 list-decimal space-y-1 pl-4">
                  {(idea.outline || []).map((step, index) => <li key={index}>{step}</li>)}
                </ol>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">Caption</p>
                <p className="mt-1">{idea.caption}</p>
              </div>
              <div className="rounded-md bg-[#F6F3EA] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">Thumbnail text</p>
                <p className="mt-1 font-bold text-ink">{idea.thumbnail_text}</p>
              </div>
            </div>
              </div>
            </details>
            <button
              type="button"
              onClick={() => copyPrompt(idea.id, idea.prompt)}
              className="inline-flex min-h-11 items-center gap-2 mt-5 rounded-md border border-ink px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
            >
              <Icon name={copied === idea.id ? 'check' : 'copy'} className="h-4 w-4" />{copied === idea.id ? 'Copied' : 'Copy prompt'}
            </button>
            <button
              type="button"
              onClick={() => savePrompt(idea)}
              aria-pressed={saved.includes(idea.id)}
              aria-label={saved.includes(idea.id) ? `Unsave ${idea.title}` : `Save ${idea.title}`}
              className={`save-toggle ml-3 mt-5 ${saved.includes(idea.id) ? "is-saved" : ""}`}
            >
              <Icon name={saved.includes(idea.id) ? 'bookmarkFilled' : 'bookmark'} className="h-4 w-4" />{saved.includes(idea.id) ? 'Unsave' : 'Save'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
