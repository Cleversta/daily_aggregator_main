'use client';
import { useState } from 'react';
import Icon from './Icon';
import { calculate, formatResult } from '../../lib/calculator.mjs';

const operations = {
  add: { label: 'Add', symbol: '+', fields: ['First number', 'Second number'] },
  subtract: { label: 'Subtract', symbol: '−', fields: ['First number', 'Second number'] },
  multiply: { label: 'Multiply', symbol: '×', fields: ['First number', 'Second number'] },
  divide: { label: 'Divide', symbol: '÷', fields: ['First number', 'Second number'] },
  percent: { badge: '%', short: 'Percent of', label: 'Percentage of a number', fields: ['Percentage (%)', 'Number'], hint: 'Example: 20% of 150 = 30.' },
  portion: { badge: '÷ %', short: 'Part / whole', label: 'One number as a percentage', fields: ['Part', 'Whole'], hint: 'Example: 30 is 20% of 150.' },
  change: { badge: '↗ %', short: 'Percent change', label: 'Percentage change', fields: ['Original value', 'New value'], hint: 'Example: 100 → 120 is a 20% increase. For negative originals, the original’s absolute value is the denominator.' },
};
export default function Calculator({ initialOperation = 'add' }) {
  const [operation, setOperation] = useState(initialOperation);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const selected = operations[operation];
  function update(setter, value) { setter(value); setResult(null); setError(''); setCopied(''); }
  function submit(event) {
    event.preventDefault(); setCopied('');
    try {
      const value = calculate(first, second, operation);
      const a = Number(first), b = Number(second);
      const expression = selected.symbol ? `${a} ${selected.symbol} ${b}` : operation === 'percent' ? `${a}% of ${b}` : operation === 'portion' ? `${a} as a percentage of ${b}` : `Change from ${a} to ${b}`;
      setResult({ text: formatResult(value), suffix: ['portion', 'change'].includes(operation) ? '%' : '', expression }); setError('');
    } catch (err) { setResult(null); setError(err.message); }
  }
  async function copy() {
    const text = result.text + result.suffix;
    try { await navigator.clipboard.writeText(text); setCopied('Copied.'); }
    catch { setCopied('Copy unavailable. Select the result to copy it manually.'); }
  }
  const inputClass = 'mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-lg text-ink';
  return <section id="calculator" aria-labelledby="calculator-title" className="mb-8 rounded-2xl border border-[#D8CBA6] bg-[#F7F3E8] p-5 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-widest text-[#725C27]">A little help with the numbers</p>
    <h2 id="calculator-title" className="mt-2 font-display text-3xl font-bold">Calculate it here.</h2>
    <p className="mt-2 text-sm text-slate">Arithmetic and percentages, calculated on your device. No account or upload.</p>
    <form onSubmit={submit} className="mt-6 grid items-start gap-6 md:grid-cols-[1.2fr_1fr]">
      <div>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">What would you like to calculate?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(operations).map(([key, item]) => <button key={key} type="button" aria-pressed={operation === key} aria-label={item.label} onClick={() => update(setOperation, key)} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 transition-colors ${operation === key ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-wire hover:bg-[#EEE7CE]'}`}>
              <span aria-hidden="true" className={`text-2xl font-bold ${operation === key ? 'text-[#E7CF8D]' : 'text-[#725C27]'}`}>{item.badge || item.symbol}</span>
              <span className="text-xs font-bold">{item.short || item.label}</span>
            </button>)}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{[[first, setFirst], [second, setSecond]].map(([value, setter], index) => <div key={index}><label htmlFor={`calculator-number-${index}`} className="text-sm font-bold">{selected.fields[index]}</label><input id={`calculator-number-${index}`} value={value} onChange={e => update(setter, e.target.value)} type="text" inputMode="text" autoComplete="off" spellCheck={false} maxLength={80} placeholder={index ? 'e.g. 150' : 'e.g. 20'} className={inputClass} aria-invalid={!!error} aria-describedby={error ? 'calculator-error' : undefined} /></div>)}</div>
        {selected.hint && <p className="mt-3 text-sm leading-relaxed text-slate">{selected.hint}</p>}
        <div className="mt-5 flex flex-wrap gap-3"><button type="submit" className="min-h-12 rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white"><span aria-hidden="true" className="mr-2 text-lg">=</span>Calculate</button><button type="button" onClick={() => { setFirst(''); setSecond(''); setResult(null); setError(''); setCopied(''); }} className="min-h-12 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold"><span aria-hidden="true" className="mr-2">↺</span>Clear</button></div>
        {error && <p id="calculator-error" role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
      </div>
      <div className="min-w-0 rounded-2xl bg-ink p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E7CF8D]"><span aria-hidden="true" className="mr-2 text-lg">=</span>Your result</p>
        <div role="status" aria-live="polite" className="mt-5 min-h-24">{result ? <><p className="break-words text-sm text-white/75">{result.expression}</p><output className="mt-3 block break-all font-display text-4xl font-bold">{result.text}{result.suffix}</output></> : <p className="text-sm leading-relaxed text-white/75">Enter two numbers and press Calculate or Enter.</p>}</div>
        {result && <button type="button" onClick={copy} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-bold"><Icon name="copy" className="h-4 w-4" />Copy result</button>}
        <p role="status" className="mt-2 text-xs text-white/80">{copied}</p>
        <p className="mt-5 border-t border-white/20 pt-4 text-xs leading-relaxed text-white/70">Results are rounded to 12 significant digits. Very large or tiny values may use scientific notation. This is a general-purpose calculator, not exact accounting software.</p>
      </div>
    </form>
  </section>;
}
