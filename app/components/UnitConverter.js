'use client';
import { useState } from 'react';
import { unitGroups, convertUnit } from '../../lib/unit-converter.mjs';
import { formatResult } from '../../lib/calculator.mjs';
import Icon from './Icon';

export default function UnitConverter() {
  const [group, setGroup] = useState('length');
  const [from, setFrom] = useState('cm');
  const [to, setTo] = useState('m');
  const [input, setInput] = useState('100');
  const [copied, setCopied] = useState('');
  const units = unitGroups[group].units;
  let result = null, error = '';
  if (input.trim()) {
    try { result = formatResult(convertUnit(input, group, from, to)); }
    catch (err) { error = err.message; }
  }
  function changeCategory(key) {
    const keys = Object.keys(unitGroups[key].units);
    setGroup(key); setFrom(keys[0]); setTo(keys[1]); setCopied('');
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${result} ${to}`); setCopied('Copied.'); }
    catch { setCopied('Select the result to copy it manually.'); }
  }
  const control = 'mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink';
  return <section aria-labelledby="converter-heading" className="rounded-2xl border border-[#B9D3C5] bg-[#F0F6F2] p-5 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-widest text-[#285B50]">Different units. Same measurement.</p>
    <h2 id="converter-heading" className="mt-2 font-display text-3xl font-bold">Convert in a moment.</h2>
    <p className="mt-2 text-sm text-slate">Results update as you type. Everything is calculated on your device.</p>
    <fieldset className="mt-6"><legend className="mb-3 text-sm font-bold">Choose a measurement</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries(unitGroups).map(([key, item]) => <button key={key} type="button" aria-pressed={group === key} onClick={() => changeCategory(key)} className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-3 ${group === key ? 'border-[#285B50] bg-[#285B50] text-white' : 'border-line bg-white text-ink hover:border-wire'}`}><span aria-hidden="true" className="text-2xl">{item.symbol}</span><span className="mt-1 text-sm font-bold">{item.label}</span></button>)}</div></fieldset>
    <div className="mt-6 grid gap-6 md:grid-cols-2"><div>
      <label htmlFor="unit-value" className="text-sm font-bold">Value to convert</label><input id="unit-value" type="text" inputMode="text" autoComplete="off" maxLength={80} value={input} onChange={e => { setInput(e.target.value); setCopied(''); }} aria-invalid={!!error} aria-describedby={error ? 'unit-error' : 'unit-input-help'} className={control} />
      <p id="unit-input-help" className="mt-2 text-xs text-slate">Use a decimal point, without thousands separators.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{[['From', from, setFrom], ['To', to, setTo]].map(([label, value, setter]) => <div key={label}><label htmlFor={`unit-${label}`} className="text-sm font-bold">{label}</label><select id={`unit-${label}`} value={value} onChange={e => { setter(e.target.value); setCopied(''); }} className={control}>{Object.entries(units).map(([key, [name]]) => <option key={key} value={key}>{name}</option>)}</select></div>)}</div>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => { setFrom(to); setTo(from); setCopied(''); }} className="min-h-12 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold"><span aria-hidden="true" className="mr-2 text-xl">⇄</span>Swap units</button><button type="button" onClick={() => { setInput(''); setCopied(''); }} className="min-h-12 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold">Clear</button></div>
      <p className="mt-3 text-xs text-slate">Swap reverses the units and keeps your input value.</p>
      {error && <p id="unit-error" role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
    </div><div className="min-w-0 rounded-2xl bg-ink p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#B9D3C5]">Converted result</p><div role="status" aria-live="polite" className="mt-5 min-h-28">{result !== null ? <><p className="break-words text-sm text-white/75">{input} {from} =</p><output className="mt-3 block break-all font-display text-4xl font-bold">{result} <span className="text-2xl">{to}</span></output><p className="mt-2 text-sm text-white/75">{units[to][0]}</p></> : <p className="text-sm text-white/75">{error ? 'Check the value you entered.' : 'Enter a value to see your conversion.'}</p>}</div>
      {result !== null && <button type="button" onClick={copy} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-bold"><Icon name="copy" className="h-4 w-4" />Copy result</button>}<p role="status" className="mt-2 text-xs text-white/80">{copied}</p>
      <p className="mt-5 border-t border-white/20 pt-4 text-xs leading-relaxed text-white/70">Rounded to 12 significant digits. {unitGroups[group].note}</p>
    </div></div>
  </section>;
}
