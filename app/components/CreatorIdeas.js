'use client';

import { useState } from 'react';

export default function CreatorIdeas({ ideas }) {
  const [copied, setCopied] = useState(null);

  async function copyPrompt(id, prompt) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  if (ideas.length === 0) return null;

  return (
    <section aria-labelledby="creator-ideas" className="border-b border-line pb-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Creator studio</p>
        <h2 id="creator-ideas" className="mt-2 font-display text-2xl font-bold text-ink">Ready-to-use creator prompts.</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate">Copy a prompt, paste it into your AI tool, then adapt the result to your own voice and audience.</p>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {ideas.map((idea) => (
          <article key={idea.id} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">{idea.category}</span>
              <span className="rounded-full bg-[#F1EEE6] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate">{idea.platform}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-bold leading-snug text-ink">{idea.title}</h3>
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
            <button
              type="button"
              onClick={() => copyPrompt(idea.id, idea.prompt)}
              className="mt-5 rounded-md border border-ink px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
            >
              {copied === idea.id ? 'Copied' : 'Copy prompt'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
