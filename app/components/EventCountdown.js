'use client';
import { useEffect, useState } from 'react';
import { events, eventCountdown } from '../../lib/event-countdown.mjs';

export default function EventCountdown() {
  const [selected, setSelected] = useState('christmas');
  const [date, setDate] = useState('');
  const [name, setName] = useState('My event');
  const [now, setNow] = useState(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = setInterval(update,1000);
    const visible = () => { if (!document.hidden) update(); };
    document.addEventListener('visibilitychange',visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange',visible); };
  },[]);
  const event = selected === 'custom' ? { name: name.trim() || 'My event', date } : events.find(item => item.id === selected);
  const result = now && (selected !== 'custom' || date) ? eventCountdown(event,now) : null;
  return <div className="space-y-6">
    <section className="surface-card space-y-4 p-5 sm:p-7" aria-label="Choose your countdown">
      <label className="block font-bold" htmlFor="countdown-event">What are you looking forward to?</label>
      <select id="countdown-event" value={selected} onChange={e => setSelected(e.target.value)} className="w-full rounded-xl border border-line bg-white p-3 text-ink">
        <optgroup label="Annual occasions">{events.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
        <option value="custom">Choose my own date…</option>
      </select>
      {selected === 'custom' && <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Event name<input maxLength={80} value={name} onChange={e => setName(e.target.value)} className="mt-2 block w-full rounded-xl border border-line p-3 font-normal" placeholder="Birthday, trip, wedding…" /></label><label className="font-bold">Event date<input type="date" min="1000-01-01" max="9999-12-31" value={date} onChange={e => setDate(e.target.value)} className="mt-2 block w-full rounded-xl border border-line p-3 font-normal" /></label></div>}
      <p className="text-sm text-slate">Annual occasions repeat each year. An occasion is not necessarily a public holiday where you live.</p>
    </section>
    <section aria-label="Countdown preview" className="relative overflow-hidden rounded-3xl bg-[#173F38] p-6 text-[#FFFAEE] sm:p-10">
      <span aria-hidden="true" className="christmas-star pointer-events-none absolute right-6 top-5 text-5xl text-[#F0C674]">✦</span>
      <p className="text-xs font-bold uppercase tracking-widest text-[#F0C674]">Make every day count</p>
      <h2 className="mt-4 break-words pr-10 font-display text-3xl font-bold sm:text-5xl">{event.name}</h2>
      <p className="mt-4 text-[#D6E6DE]">{!now ? 'Reading your local clock…' : !result ? 'Choose a valid date to start your countdown.' : `${result.target.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · local midnight`}</p>
      {result && (result.today || result.past ? <p role="status" className="mt-8 rounded-2xl border border-white/20 p-6 text-2xl font-bold">{result.today ? 'Today is the day!' : 'This date has passed. Choose another event or date.'}</p> : <div role="timer" aria-live="off" aria-label={`Time until ${event.name}`} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{['days','hours','minutes','seconds'].map(unit => <div key={unit} className="rounded-2xl border border-white/20 bg-white/5 p-4 text-center"><span className="block text-4xl font-bold tabular-nums sm:text-5xl">{String(result[unit]).padStart(2,'0')}</span><span className="mt-2 block text-xs uppercase tracking-widest text-[#F0C674]">{unit}</span></div>)}</div>)}
      <p className="mt-6 text-xs text-[#D6E6DE]">{now ? `Time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. ` : ''}Uses your device clock. Days are 24-hour periods; daylight-saving changes can affect the hours shown. Your custom event stays in this page and is cleared on reload.</p>
    </section>
  </div>;
}
