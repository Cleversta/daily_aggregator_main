'use client';

import { useState } from 'react';

// Posts to a Netlify Function, not a Next.js API route — this site is a
// static export (output: 'export' in next.config.js) and has no server.
// No account is created here; this is a mailing list, and the confirm link
// email is the only verification step.
export default function Subscribe({ categorySlug }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          categories: categorySlug ? [categorySlug] : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again shortly.');
        return;
      }

      setStatus('done');
      setMessage(data.message || 'Check your inbox to confirm.');
    } catch {
      setStatus('error');
      setMessage('Network error — try again shortly.');
    }
  }

  if (status === 'done') {
    return <p className="text-sm text-slate">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-wire"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Get daily updates'}
      </button>
      {status === 'error' && <p className="text-xs text-amber-600 sm:self-center">{message}</p>}
    </form>
  );
}