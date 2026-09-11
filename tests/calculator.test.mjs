import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, formatResult, parseNumber } from '../lib/calculator.mjs';
test('arithmetic handles negatives and decimals', () => {
  assert.equal(calculate('-2.5','4','add'),1.5);
  assert.equal(calculate('3','5','subtract'),-2);
  assert.equal(calculate('-3','5','multiply'),-15);
  assert.equal(calculate('10','4','divide'),2.5);
  assert.equal(formatResult(calculate('.1','.2','add')),'0.3');
});
test('percentage calculations and signed changes', () => {
  assert.equal(calculate('20','150','percent'),30);
  assert.equal(calculate('30','150','portion'),20);
  assert.equal(calculate('100','120','change'),20);
  assert.equal(calculate('100','80','change'),-20);
  assert.equal(calculate('-100','-80','change'),20);
});
test('undefined results and overflow are rejected', () => {
  for (const operation of ['divide','portion']) assert.throws(()=>calculate('2','0',operation),/zero/);
  assert.throws(()=>calculate('0','20','change'),/zero/);
  assert.throws(()=>calculate('1e308','1e308','multiply'),/large/);
});
test('input parser never evaluates expressions and preserves zero', () => {
  for (const value of ['', ' ', '1,000','1+2','Infinity','NaN','0x10','alert(1)']) assert.throws(()=>parseNumber(value));
  assert.equal(parseNumber(' -1.2e3 '),-1200);
  assert.equal(formatResult(calculate('-0','0','add')),'0');
  assert.throws(()=>calculate('1','2','eval'));
});
