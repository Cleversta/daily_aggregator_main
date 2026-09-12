'use client';

import { useState } from 'react';
import { calculateBill, calculateDiscount, formatMoney } from '../../lib/money-calculator.mjs';

const inputClass = 'mt-2 block min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink';
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD'];

function NumberField({ id, label, value, onChange, min = '0', max, step = 'any', help }) {
  return <label htmlFor={id} className="block text-sm font-bold">{label}<input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={event => onChange(event.target.value)} className={inputClass} />{help && <span className="mt-1 block text-xs font-normal text-slate">{help}</span>}</label>;
}

export default function MoneyCalculator() {
  const [mode, setMode] = useState('tip');
  const [currency, setCurrency] = useState('USD');
  const [bill, setBill] = useState('100');
  const [tip, setTip] = useState('15');
  const [people, setPeople] = useState('2');
  const [price, setPrice] = useState('100');
  const [discount, setDiscount] = useState('20');
  const [secondDiscount, setSecondDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  let result;
  let error = '';
  try {
    result = mode === 'tip'
      ? calculateBill({ amount: bill, tipPercent: tip, people })
      : calculateDiscount({ price, firstDiscount: discount, secondDiscount, taxPercent: tax });
  } catch (caught) { error = caught.message; }

  const money = value => formatMoney(value, currency);
  return <section className="rounded-3xl border border-[#D8CBA6] bg-[#F7F3E8] p-4 sm:p-8" aria-labelledby="money-calculator-heading">
    <p className="text-xs font-bold uppercase tracking-widest text-[#725C27]">Quick money maths</p>
    <h2 id="money-calculator-heading" className="mt-2 font-display text-3xl font-bold">Know what you’ll pay.</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate">Calculate a tip, split a bill, or find a sale price. Your values stay on this device.</p>

    <div className="mt-5 grid grid-cols-2 gap-2" aria-label="Calculator type">
      {[['tip', 'Tip & split bill'], ['discount', 'Discount & tax']].map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-bold ${mode === value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'}`}>{label}</button>)}
    </div>

    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <div className="rounded-2xl border border-line bg-white/60 p-4 sm:p-5">
        <label htmlFor="money-currency" className="block text-sm font-bold">Currency<select id="money-currency" value={currency} onChange={event => setCurrency(event.target.value)} className={inputClass}>{currencies.map(code => <option value={code} key={code}>{code}</option>)}</select></label>
        {mode === 'tip' ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField id="bill-amount" label="Bill amount" value={bill} onChange={setBill} />
          <NumberField id="tip-percent" label="Tip (%)" value={tip} onChange={setTip} max="1000" />
          <NumberField id="bill-people" label="Number of people" value={people} onChange={setPeople} min="1" max="1000" step="1" help="Use a whole number." />
          <div><span className="block text-sm font-bold">Quick tip</span><div className="mt-2 grid grid-cols-3 gap-2">{[10,15,20].map(value => <button key={value} type="button" onClick={() => setTip(String(value))} className="min-h-12 rounded-xl border border-line bg-white text-sm font-bold">{value}%</button>)}</div></div>
        </div> : <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField id="original-price" label="Original price" value={price} onChange={setPrice} />
          <NumberField id="first-discount" label="Discount (%)" value={discount} onChange={setDiscount} max="100" />
          <NumberField id="second-discount" label="Second discount (%)" value={secondDiscount} onChange={setSecondDiscount} max="100" help="Optional; applied after the first discount." />
          <NumberField id="sales-tax" label="Tax after discount (%)" value={tax} onChange={setTax} max="1000" help="Optional. Enter 0 when tax is already included." />
        </div>}
      </div>

      <div className="min-w-0 rounded-2xl bg-ink p-5 text-white sm:p-6" role="status" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E7CF8D]">Your result</p>
        {error ? <p className="mt-4 text-sm text-[#FFE1D9]">{error}</p> : mode === 'tip' ? <>
          <p className="mt-4 text-sm text-white/70">Total bill</p><output className="mt-1 block break-all font-display text-4xl font-bold">{money(result.total)}</output>
          <dl className="mt-5 space-y-3 border-t border-white/20 pt-4 text-sm"><div className="flex justify-between gap-3"><dt>Tip</dt><dd className="font-bold">{money(result.tip)}</dd></div><div className="flex justify-between gap-3"><dt>Each person</dt><dd className="font-bold">{money(result.perPerson)}</dd></div><div className="flex justify-between gap-3"><dt>Tip per person</dt><dd className="font-bold">{money(result.tipPerPerson)}</dd></div></dl>
        </> : <>
          <p className="mt-4 text-sm text-white/70">Final price</p><output className="mt-1 block break-all font-display text-4xl font-bold">{money(result.final)}</output>
          <dl className="mt-5 space-y-3 border-t border-white/20 pt-4 text-sm"><div className="flex justify-between gap-3"><dt>Price after discounts</dt><dd className="font-bold">{money(result.subtotal)}</dd></div><div className="flex justify-between gap-3"><dt>You save</dt><dd className="font-bold">{money(result.saved)} · {result.effectiveDiscount.toFixed(2)}%</dd></div><div className="flex justify-between gap-3"><dt>Tax</dt><dd className="font-bold">{money(result.tax)}</dd></div></dl>
        </>}
      </div>
    </div>
    <p className="mt-4 text-xs leading-relaxed text-slate">Currency selection changes formatting only; it does not convert exchange rates. Results are estimates rounded for display. Check the final receipt, local tax rules, and service-charge policy.</p>
  </section>;
}
