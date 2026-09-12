function number(value, label, { minimum = 0, maximum = 1000000000000 } = {}) {
  const text = String(value).trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) throw new Error(`Enter a valid ${label}.`);
  const result = Number(text);
  if (!Number.isFinite(result) || result < minimum || result > maximum) throw new Error(`${label} must be between ${minimum} and ${maximum.toLocaleString('en-US')}.`);
  return result;
}

export function calculateBill({ amount, tipPercent, people }) {
  const bill = number(amount, 'bill amount');
  const tipRate = number(tipPercent, 'tip percentage', { maximum: 1000 });
  const split = number(people, 'number of people', { minimum: 1, maximum: 1000 });
  if (!Number.isInteger(split)) throw new Error('Number of people must be a whole number.');
  const tip = bill * tipRate / 100;
  const total = bill + tip;
  return { bill, tip, total, perPerson: total / split, tipPerPerson: tip / split, people: split };
}

export function calculateDiscount({ price, firstDiscount, secondDiscount = 0, taxPercent = 0 }) {
  const original = number(price, 'original price');
  const first = number(firstDiscount, 'first discount', { maximum: 100 });
  const second = number(secondDiscount, 'second discount', { maximum: 100 });
  const taxRate = number(taxPercent, 'tax percentage', { maximum: 1000 });
  const afterFirst = original * (1 - first / 100);
  const subtotal = afterFirst * (1 - second / 100);
  const saved = original - subtotal;
  const tax = subtotal * taxRate / 100;
  return { original, subtotal, saved, effectiveDiscount: original === 0 ? 0 : saved / original * 100, tax, final: subtotal + tax };
}

export function formatMoney(value, currency = 'USD') {
  if (!['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD'].includes(currency)) throw new Error('Choose a supported currency.');
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(value);
}
