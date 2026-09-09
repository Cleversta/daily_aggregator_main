'use client';
import { useEffect, useRef, useState } from 'react';
import { categories, normalizeGuide } from '../../../lib/guide-workflow.mjs';

const empty = () => ({ slug: '', name: '', category: 'images', description: '', phrases: [], steps: [], sources: [], recommendations: [], verification: 'unverified', verified_on: '' });
const field = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-ink';
const button = 'rounded-lg border border-line px-4 py-2 text-sm font-bold disabled:opacity-50';
function Field({ label, value, onChange, multiline = false, ...props }) {
  return <label className="block space-y-1"><span className="text-sm font-bold">{label}</span>{multiline
    ? <textarea className={field} rows={3} value={value || ''} onChange={e => onChange(e.target.value)} {...props} />
    : <input className={field} value={value || ''} onChange={e => onChange(e.target.value)} {...props} />}</label>;
}
export default function AdminGuideForm() {
  const [adminEmail, setAdminEmail] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [usage, setUsage] = useState([]);
  const [flags, setFlags] = useState([]);
  const [content, setContent] = useState(empty);
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Cloudflare Access protects this workspace. Load it to continue.');
  const [publication, setPublication] = useState(null);
  const [editorStatus, setEditorStatus] = useState('draft');
  const editorRef = useRef(null);
  const change = (key, value) => { setContent(c => ({ ...c, [key]: value })); setDirty(true); setReviewed(false); };
  const lines = value => value.split('\n');
  async function api(action, payload = {}) {
    const response = await fetch('/admin/guide-api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    let data;
    try { data = await response.json(); } catch {
      if (window.location.hostname === 'localhost') {
        throw new Error('The Cloudflare Worker API does not run on localhost:3000. Deploy the latest code and use the live /admin/guide page.');
      }
      throw new Error(`Server returned a non-JSON response (${response.status}). Check that the latest Worker is deployed.`);
    }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }
  async function refresh() {
    const data = await api('list'); setDrafts(data.drafts); setJobs(data.jobs); setUsage(data.usage); setFlags(data.flags || []); setAdminEmail(data.adminEmail || '');
  }
  async function run(fn) {
    setBusy(true);
    try { await fn(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  function load(draft) {
    setContent(draft.content); setVersion(draft.version); setEditorStatus(draft.status);
    setPublication(draft.publication_id); setDirty(false); setReviewed(false);
    setMessage(`Loaded ${draft.content.name}. ${draft.status === 'review' ? 'AI draft: verify sources and instructions before publishing.' : 'Ready to edit.'}`);
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  async function save() {
    const normalized = normalizeGuide(content);
    if (!dirty && version) return version;
    const data = await api('save', { content: normalized, version });
    setContent(data.draft.content); setVersion(data.draft.version); setDirty(false); setEditorStatus('draft');
    return data.draft.version;
  }
  async function publish() {
    normalizeGuide(content, true);
    const savedVersion = await save();
    const data = await api('publish', { slug: content.slug, version: savedVersion, reviewed });
    setPublication(data.publicationId); setEditorStatus('published'); setMessage(data.message); await refresh();
  }
  async function checkLive() {
    if (!publication) throw new Error('Publish this guide first.');
    const response = await fetch(`/guide/${content.slug}?check=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('The guide page is not available yet. Check the Cloudflare deployment.');
    const document = new DOMParser().parseFromString(await response.text(), 'text/html');
    const deployedId = document.querySelector('[data-guide-publication]')?.getAttribute('data-guide-publication');
    setMessage(deployedId === publication
      ? 'This published revision is included in the deployed build. Open its guide page to review it.'
      : 'This revision is not in the deployed build yet. Check Cloudflare or retry the rebuild.');
  }
  const activeJob = jobs.find(j => j.slug === content.slug && ['queued', 'running', 'waiting'].includes(j.status));
  return <div className="space-y-8">
    <div className="max-w-lg space-y-3">
      {adminEmail && <p className="text-sm">Signed in through Cloudflare as <strong>{adminEmail}</strong></p>}
      <div className="flex gap-3">
        <button className={button} disabled={busy} onClick={() => run(async () => { await refresh(); setMessage('Workspace refreshed. Open a draft below; unsaved editor changes were preserved.'); })}>Load / refresh workspace</button>
        <a className={button} href="/cdn-cgi/access/logout">Sign out</a>
      </div>
      <p className="text-sm text-slate">Cloudflare Access protects Guide administration. Research is processed by the scheduled worker, not by page visitors.</p>
    </div>
    <p role="status" aria-live="polite" className="border-l-4 border-wire pl-4 text-sm">{busy ? 'Working…' : message}</p>
    <ol className="grid gap-2 text-sm sm:grid-cols-3">
      <li className="rounded-lg border border-line p-3"><strong>1. Choose a guide</strong><span className="mt-1 block text-slate">Click its Edit button below.</span></li>
      <li className="rounded-lg border border-line p-3"><strong>2. Make changes</strong><span className="mt-1 block text-slate">Edit the fields, then save the draft.</span></li>
      <li className="rounded-lg border border-line p-3"><strong>3. Publish</strong><span className="mt-1 block text-slate">Review, publish, then rebuild the site.</span></li>
    </ol>
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={busy} onClick={() => run(async () => { const data = await api('seed'); await refresh(); setMessage(data.message); })}>Prepare 15 starter drafts</button>
      <button className={button} disabled={busy || dirty} onClick={() => { setContent(empty()); setVersion(0); setPublication(null); setEditorStatus('draft'); setReviewed(false); }}>New guide</button>
      <button className={button} disabled={busy} onClick={() => run(async () => setMessage((await api('rebuild')).message))}>Retry rebuild</button>
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
    <section className="lg:sticky lg:top-4"><h2 className="font-display text-xl font-bold mb-3">Your guides</h2>
      {drafts.length > 0 ? <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-2">{drafts.map(d => <button key={d.slug} disabled={busy || dirty} onClick={() => load(d)} className={`${button} text-left ${content.slug === d.slug ? 'border-ink bg-slate-50' : ''}`}>
        <span className="flex items-center justify-between gap-3"><span>{d.content.name}</span><span className="shrink-0 underline">Edit →</span></span>
        <span className="block text-xs font-normal text-slate">{d.status === 'published' ? 'Live' : d.status === 'review' ? 'Ready for review' : 'Draft'} · version {d.version}</span>
      </button>)}</div> : <p className="text-sm text-slate">Load the workspace to see your guides.</p>}
      {dirty && <p className="mt-2 text-sm">Save your edits before opening another draft. <button className="underline" disabled={busy} onClick={() => { const saved = drafts.find(d => d.slug === content.slug); if (saved) load(saved); else { setContent(empty()); setVersion(0); setDirty(false); } }}>Discard unsaved edits</button></p>}
    </section>
    <fieldset ref={editorRef} disabled={busy} className="min-w-0 scroll-mt-4 space-y-5 rounded-xl border border-line p-4 sm:p-6">
      <legend className="px-2 font-display text-xl font-bold">{content.name ? `Editing: ${content.name}` : 'Create a guide'}</legend>
      <p className="text-sm text-slate">Status: {editorStatus === 'published' ? 'Live' : editorStatus === 'review' ? 'Ready for review' : 'Draft'}{dirty ? ' · You have unsaved changes' : ''}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Task title" value={content.name} onChange={v => change('name', v)} />
        <Field label="URL slug (fixed after first save)" value={content.slug} disabled={version > 0} onChange={v => change('slug', v)} placeholder="make-photo-smaller" />
      </div>
      <label className="block text-sm font-bold">Category<select className={field} value={content.category} onChange={e => change('category', e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <Field label="Short answer / description" multiline value={content.description} onChange={v => change('description', v)} />
      <Field label="Search phrases — one per line" multiline value={content.phrases.join('\n')} onChange={v => change('phrases', lines(v))} />
      <Field label="Instructions — one step per line" multiline value={content.steps.join('\n')} onChange={v => change('steps', lines(v))} />
      <section className="space-y-3"><h3 className="font-bold">Evidence sources</h3>
        <p className="text-sm text-slate">Open the sources and verify claims. Search excerpts and AI drafts are not proof of personal testing.</p>
        {content.sources.map((s, i) => <div key={i} className="grid sm:grid-cols-2 gap-2">
          <Field label={`Source ${i + 1} title`} value={s.title} onChange={v => change('sources', content.sources.map((x, n) => n === i ? { ...x, title: v } : x))} />
          <Field label="Source URL" value={s.url} onChange={v => change('sources', content.sources.map((x, n) => n === i ? { ...x, url: v } : x))} />
          {/^https?:\/\//.test(s.url) && <a className="text-sm underline" href={s.url} target="_blank" rel="noopener noreferrer">Read source</a>}
          <button type="button" className="text-sm underline text-left" onClick={() => change('sources', content.sources.filter((_, n) => n !== i))}>Remove source</button>
        </div>)}
        <button className={button} disabled={content.sources.length >= 12} onClick={() => change('sources', [...content.sources, { title: '', url: '' }])}>Add source</button>
      </section>
      <section className="space-y-5"><h3 className="font-bold">Recommendations</h3>
        {content.recommendations.map((rec, i) => <div key={i} className="border border-line rounded-lg p-4 space-y-3">
          <p className="font-bold">Recommendation {i + 1}</p>
          {['name', 'url', 'description', 'reason', 'limitations', 'signup', 'privacy'].map(key => <Field key={key} label={key === 'signup' ? 'Signup requirements' : key.charAt(0).toUpperCase() + key.slice(1)} value={rec[key]} multiline={!['name','url','signup'].includes(key)} onChange={v => change('recommendations', content.recommendations.map((r, n) => n === i ? { ...r, [key]: v } : r))} />)}
          <Field label="Supporting source URLs — one per line" multiline value={(rec.source_urls || []).join('\n')} onChange={v => change('recommendations', content.recommendations.map((r, n) => n === i ? { ...r, source_urls: lines(v) } : r))} />
          <button className="underline text-sm" onClick={() => change('recommendations', content.recommendations.filter((_, n) => n !== i))}>Remove recommendation</button>
        </div>)}
        <button className={button} disabled={content.recommendations.length >= 5} onClick={() => change('recommendations', [...content.recommendations, { name: '', url: '', description: '', reason: '', limitations: '', signup: '', privacy: '', source_urls: [] }])}>Add recommendation</button>
      </section>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm font-bold">Verification<select className={field} value={content.verification} onChange={e => change('verification', e.target.value)}>
          <option value="unverified">Not yet verified</option><option value="documentation">I checked official documentation</option><option value="tested">I personally tested the instructions</option>
        </select></label>
        <Field label="Date you verified it" type="date" value={content.verified_on} onChange={v => change('verified_on', v)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button className={button} onClick={() => run(async () => { await save(); await refresh(); setMessage('Draft saved.'); })}>Save draft</button>
        <button className={button} disabled={!!activeJob} onClick={() => run(async () => { const v = await save(); const data = await api('research', { slug: content.slug, version: v }); setMessage(data.message); await refresh(); })}>{activeJob ? 'AI research already queued' : 'Research with AI'}</button>
      </div>
      {activeJob && <p className="text-sm">Research {activeJob.status}: {activeJob.message || 'Awaiting the next worker run.'} {activeJob.status === 'waiting' && `Next attempt after ${new Date(activeJob.available_at).toLocaleString()}.`}</p>}
      <div className="sticky bottom-3 z-20 space-y-3 rounded-xl border border-line bg-paper/95 p-4 shadow-lg backdrop-blur">
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I reviewed this revision and its sources.</label>
        <div className="flex flex-wrap gap-3">
          <button className={`${button} bg-ink text-white`} disabled={!reviewed || busy} onClick={() => run(publish)}>{busy ? 'Publishing…' : 'Publish reviewed guide'}</button>
          <button className={button} disabled={!publication} onClick={() => run(checkLive)}>Check live publication</button>
          {publication && <a className={`${button} inline-block`} href={`/guide/${content.slug}`} target="_blank" rel="noopener noreferrer">Open public page</a>}
        </div>
        <p role="status" aria-live="polite" className="border-l-4 border-wire pl-4 text-sm">{message}</p>
      </div>
    </fieldset>
    </div>
    {flags.length > 0 && <section><h2 className="font-display text-xl font-bold">Recommendations needing review</h2><ul className="space-y-3">{flags.map((f, i) => <li key={i} className="text-sm"><strong>{f.name}</strong> · {f.is_stale ? 'Previously marked stale' : 'Link check needs attention'}<p>{f.url}</p><button className="underline" disabled={busy || dirty || !drafts.some(d => d.slug === f.guide_intents?.slug)} onClick={() => load(drafts.find(d => d.slug === f.guide_intents?.slug))}>Open guide for review</button></li>)}</ul></section>}
    {(jobs.length > 0 || usage.length > 0) && <details className="rounded-xl border border-line p-4"><summary className="cursor-pointer font-bold">System status and AI jobs</summary>
      {jobs.length > 0 && <section className="mt-5"><h2 className="font-display text-xl font-bold">Recent research jobs</h2><ul className="divide-y divide-line">{jobs.slice(0, 15).map(j => <li key={j.id} className="py-3 text-sm"><strong>{j.slug}</strong> · {j.status}<p>{j.message || 'Waiting for the worker.'}</p></li>)}</ul></section>}
      {usage.length > 0 && <section className="mt-5"><h2 className="font-display text-xl font-bold">Guide request reservations</h2><p className="text-sm text-slate">Includes failed attempts. Other site pipelines are not counted here. Limits are configured in the worker environment.</p><ul>{usage.slice(0, 8).map(u => <li key={`${u.provider}-${u.period}`} className="text-sm">{u.provider} · {u.period}: {u.used} requests reserved</li>)}</ul></section>}
    </details>}
  </div>;
}
