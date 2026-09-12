import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBill, calculateDiscount, formatMoney } from '../lib/money-calculator.mjs';

test('tip and bill splitting expose totals and per-person values', () => {
  assert.deepEqual(calculateBill({ amount: '100', tipPercent: '15', people: '2' }), { bill: 100, tip: 15, total: 115, perPerson: 57.5, tipPerPerson: 7.5, people: 2 });
  assert.throws(() => calculateBill({ amount: '100', tipPercent: '15', people: '2.5' }), /whole number/);
  assert.throws(() => calculateBill({ amount: '-1', tipPercent: '15', people: '2' }));
});

test('discounts apply sequentially and tax follows discounts', () => {
  const result = calculateDiscount({ price: '100', firstDiscount: '20', secondDiscount: '10', taxPercent: '5' });
  assert.equal(result.subtotal, 72);
  assert.equal(result.saved, 28);
  assert.ok(Math.abs(result.effectiveDiscount - 28) < 1e-10);
  assert.equal(result.tax, 3.6);
  assert.equal(result.final, 75.6);
});

test('zero price and strict percentage limits behave safely', () => {
  assert.equal(calculateDiscount({ price: '0', firstDiscount: '20', secondDiscount: '0', taxPercent: '0' }).effectiveDiscount, 0);
  assert.throws(() => calculateDiscount({ price: '100', firstDiscount: '101', secondDiscount: '0', taxPercent: '0' }));
  assert.throws(() => calculateDiscount({ price: '1,000', firstDiscount: '10', secondDiscount: '0', taxPercent: '0' }));
});

test('currency formatting supports common currencies only', () => {
  assert.match(formatMoney(12.5, 'USD'), /12\.50/);
  assert.match(formatMoney(1200, 'JPY'), /1,200/);
  assert.throws(() => formatMoney(10, 'XYZ'));
});
