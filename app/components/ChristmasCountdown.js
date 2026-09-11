'use client';
import { useEffect, useState } from 'react';
import { christmasCountdown } from '../../lib/christmas-countdown.mjs';

export default function ChristmasCountdown() {
  const [countdown, setCountdown] = useState(null);
  const [zone, setZone] = useState('');
  useEffect(() => {
    const update = () => setCountdown(christmasCountdown(new Date()));
    update();
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'device local time');
    const timer = setInterval(update, 1000);
    const visible = () => { if (!document.hidden) update(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, []);
  return <section aria-labelledby="christmas-heading" className="relative overflow-hidden rounded-3xl bg-[#173F38] p-6 text-[#FFFAEE] sm:p-10">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="christmas-star absolute right-8 top-8 text-4xl text-[#F0C674]">✦</span>
      <span className="christmas-star absolute left-8 top-28 text-xl text-[#F0C674]">✧</span>
      <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10" />
      <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />
    </div>
    <div className="relative">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F0C674]">A little Christmas anticipation</p>
      <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_160px]">
        <div><h2 id="christmas-heading" className="font-display text-3xl font-bold leading-tight sm:text-5xl">{countdown?.celebrating ? 'Merry Christmas!' : 'The magic is getting closer.'}</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-[#D6E6DE] sm:text-base">{countdown?.celebrating ? 'December 25 is here. Wishing you a peaceful day, good company, and a little joy.' : `Counting down to midnight on December 25${countdown ? `, ${countdown.year}` : ''}, wherever you are.`}</p></div>
        <svg viewBox="0 0 160 190" aria-hidden="true" className="mx-auto hidden h-40 w-36 sm:block"><path d="m80 8 5 14 15 1-12 9 4 15-12-8-12 8 4-15-12-9 15-1Z" fill="#F0C674" /><path d="m80 38 38 49H98l34 42h-28l39 39H17l39-39H28l34-42H42Z" fill="#3F7B61" /><path d="M73 168h14v17H73z" fill="#E5BA79" /><g fill="#F0C674"><circle cx="78" cy="75" r="4" /><circle cx="62" cy="108" r="4" /><circle cx="98" cy="128" r="4" /><circle cx="55" cy="151" r="4" /></g><path d="m61 89 37 20m-48 20 60 25" fill="none" stroke="#F6DEAA" strokeWidth="2" /></svg>
      </div>
      {!countdown ? <p role="status" className="mt-8 rounded-2xl border border-white/20 p-6">Reading your local clock…</p> : countdown.celebrating ? <div className="mt-8 rounded-2xl border border-[#F0C674]/40 bg-white/5 p-6"><p className="font-display text-2xl font-bold">Today is the day. Enjoy every moment.</p><p className="mt-2 text-sm text-[#D6E6DE]">The countdown to next Christmas begins on December 26.</p></div> : <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" role="timer" aria-live="off" aria-label={`Time until Christmas ${countdown.year}`}>
        {['days','hours','minutes','seconds'].map(unit => <div key={unit} className="rounded-2xl border border-white/20 bg-white/5 px-3 py-5 text-center"><span className="block font-display text-4xl font-bold tabular-nums text-[#FFFAEE] sm:text-5xl">{String(countdown[unit]).padStart(2,'0')}</span><span className="mt-2 block text-xs font-bold uppercase tracking-widest text-[#F0C674]">{unit}</span></div>)}
      </div>}
      <p className="mt-5 text-xs leading-relaxed text-[#D6E6DE]">{zone ? `Your time zone: ${zone.replace(/_/g,' ')}. ` : ''}Uses your device’s date and time. One countdown day means 24 hours; daylight-saving changes can affect the hours shown.</p>
    </div>
  </section>;
}
