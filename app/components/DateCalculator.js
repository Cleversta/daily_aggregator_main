'use client';
import { useEffect, useState } from 'react';
import { dateDifference, shiftDate, calendarAge } from '../../lib/date-calculator.mjs';
const inputClass='mt-2 block w-full rounded-xl border border-line bg-white p-3 font-normal text-ink';
export default function DateCalculator() {
  const [mode,setMode]=useState('difference');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const [days,setDays]=useState('30');
  const [direction,setDirection]=useState('add');
  const [inclusive,setInclusive]=useState(false);
  useEffect(()=>{const now=new Date(); const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;setStart(today);setEnd(today);},[]);
  let result='',detail='',error='';
  try {
    if (start && (mode==='shift' || end)) {
      if (mode==='difference') {
        const difference=dateDifference(start,end);
        const total=Math.abs(difference)+(inclusive?1:0);
        result=`${total.toLocaleString()} ${total===1?'day':'days'}`;
        detail=`${Math.floor(total/7).toLocaleString()} weeks and ${total%7} days. ${difference<0?'The second date is earlier than the first. ':''}${inclusive?'Both dates included.':'Elapsed calendar days; the starting date is not counted.'}`;
      } else if(mode==='shift') {
        if(!/^-?\d+$/.test(days) || Number(days)<0) throw new Error('Enter a whole number of days, zero or greater.');
        result=shiftDate(start,Number(days)*(direction==='add'?1:-1));
        detail=`${direction==='add'?'Adding':'Subtracting'} ${Number(days).toLocaleString()} calendar days. Result shown as year-month-day.`;
      } else {
        const age=calendarAge(start,end);
        result=`${age.years} years, ${age.months} months, ${age.days} days`;
        detail=`${dateDifference(start,end).toLocaleString()} total calendar days.`;
      }
    }
  } catch(e) {error=e.message;}
  return <section className="rounded-3xl border border-line bg-[#F0F6F3] p-5 sm:p-8" aria-label="Date calculator">
    <div className="flex flex-wrap gap-2" aria-label="Calculation type">{[['difference','Days between dates'],['shift','Add or subtract days'],['age','Calculate age']].map(([value,label])=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>setMode(value)} className={`min-h-11 rounded-xl border px-4 py-3 text-sm font-bold ${mode===value?'border-ink bg-ink text-white':'border-line bg-white text-ink'}`}>{label}</button>)}</div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="font-bold">{mode==='age'?'Date of birth':'Start date'}<input type="date" min="1000-01-01" max="9999-12-31" value={start} onChange={e=>setStart(e.target.value)} className={inputClass} /></label>
      {mode!=='shift' ? <label className="font-bold">{mode==='age'?'Age on this date':'End date'}<input type="date" min="1000-01-01" max="9999-12-31" value={end} onChange={e=>setEnd(e.target.value)} className={inputClass} /></label> : <div className="grid grid-cols-2 gap-3"><label className="font-bold">Action<select value={direction} onChange={e=>setDirection(e.target.value)} className={inputClass}><option value="add">Add days</option><option value="subtract">Subtract days</option></select></label><label className="font-bold">Days<input type="number" min="0" step="1" value={days} onChange={e=>setDays(e.target.value)} className={inputClass} /></label></div>}
    </div>
    {mode==='difference' && <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={inclusive} onChange={e=>setInclusive(e.target.checked)} />Include both start and end dates</label>}
    <div role="status" aria-live="polite" className="mt-6 rounded-2xl bg-[#173F38] p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#F0C674]">Your result</p><p className="mt-3 break-words font-display text-3xl font-bold">{error || result || 'Choose your dates to begin.'}</p>{!error && <p className="mt-3 text-sm text-white/80">{detail}</p>}</div>
    <p className="mt-4 text-sm text-slate">Calculations use calendar dates, so daylight-saving time does not change the result. All days count, including weekends and holidays. Your dates stay in this page and are cleared on reload.</p>
    {mode==='age' && <p className="mt-3 text-sm text-slate">Age uses completed calendar months. If the birth day is missing in a month, its anniversary uses that month’s last day (February 29 becomes February 28 in a non-leap year).</p>}
  </section>;
}
