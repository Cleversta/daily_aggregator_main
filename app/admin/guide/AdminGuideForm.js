'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['images', 'documents', 'coding', 'money', 'writing', 'design'];
const MAX_TOOLS = 5;
const EMPTY_TOOL = { name: '', url: '', description: '', reason: '' };

const FIELD_CLASS =
  'w-full rounded-lg border border-line px-3 py-2.5 text-ink placeholder:text-slate focus:outline-none focus:border-wire';
const LABEL_CLASS = 'block text-xs font-bold uppercase tracking-wide text-wire mb-1.5';

export default function AdminGuideForm() {
  const [secret, setSecret] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'images',
    description: '',
    phrases: '',
  });
  const [tools, setTools] = useState([{ ...EMPTY_TOOL }]);
  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', message }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSecret(localStorage.getItem('guideAdminSecret') || '');
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateTool = (index, field) => (e) => {
    setTools((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: e.target.value };
      return next;
    });
  };

  const addTool = () => {
    if (tools.length < MAX_TOOLS) setTools((prev) => [...prev, { ...EMPTY_TOOL }]);
  };

  const removeTool = (index) => {
    setTools((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/admin-add-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, ...form, recommendations: tools }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        setStatus({
          type: 'error',
          message: `Server returned a non-JSON response (status ${res.status}) — the function may not be deployed yet.`,
        });
        return;
      }

      if (!res.ok) {
        setStatus({ type: 'error', message: `(${res.status}) ${data.error || 'Something went wrong.'}` });
      } else {
        localStorage.setItem('guideAdminSecret', secret);
        setStatus({ type: 'ok', message: `Saved ${data.savedCount} tool(s) to /guide/${data.slug}` });
        setForm({ name: '', category: form.category, description: '', phrases: '' });
        setTools([{ ...EMPTY_TOOL }]);
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Connection failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Password</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className={FIELD_CLASS}
          required
        />
      </div>

      <hr className="border-line" />

      <div>
        <label className={LABEL_CLASS}>Task name (e.g. "Compress an image")</label>
        <input value={form.name} onChange={update('name')} className={FIELD_CLASS} required />
      </div>

      <div>
        <label className={LABEL_CLASS}>Category</label>
        <select value={form.category} onChange={update('category')} className={FIELD_CLASS}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>Short description</label>
        <textarea value={form.description} onChange={update('description')} className={FIELD_CLASS} rows={2} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Search phrases (comma-separated)</label>
        <input
          value={form.phrases}
          onChange={update('phrases')}
          placeholder="compress image, make photo smaller"
          className={FIELD_CLASS}
        />
      </div>

      <hr className="border-line" />

      {tools.map((tool, i) => (
        <div key={i} className="rounded-lg border border-line p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide font-bold text-wire">Tool {i + 1}</p>
            {tools.length > 1 && (
              <button
                type="button"
                onClick={() => removeTool(i)}
                className="text-xs text-slate hover:text-ink"
              >
                Remove
              </button>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Tool name</label>
            <input value={tool.name} onChange={updateTool(i, 'name')} className={FIELD_CLASS} />
          </div>

          <div>
            <label className={LABEL_CLASS}>Tool URL</label>
            <input value={tool.url} onChange={updateTool(i, 'url')} className={FIELD_CLASS} />
          </div>

          <div>
            <label className={LABEL_CLASS}>What it's good for</label>
            <textarea
              value={tool.description}
              onChange={updateTool(i, 'description')}
              className={FIELD_CLASS}
              rows={2}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Why you're recommending it</label>
            <textarea value={tool.reason} onChange={updateTool(i, 'reason')} className={FIELD_CLASS} rows={2} />
          </div>
        </div>
      ))}

      {tools.length < MAX_TOOLS && (
        <button
          type="button"
          onClick={addTool}
          className="w-full rounded-lg border border-dashed border-line py-2.5 text-sm text-slate hover:text-ink hover:border-wire"
        >
          + Add another tool
        </button>
      )}

      {status && (
        <p className={status.type === 'ok' ? 'text-sm text-green-700' : 'text-sm text-red-700'}>
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-ink text-white font-bold py-3 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}