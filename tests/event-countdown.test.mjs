import test from 'node:test';
import assert from 'node:assert/strict';
import { eventCountdown, localDate } from '../lib/event-countdown.mjs';
test('annual event stays today then rolls next year', () => {
 const event={month:12,day:25};
 assert.equal(eventCountdown(event,new Date(2026,11,25,23)).today,true);
 assert.equal(eventCountdown(event,new Date(2026,11,26)).target.getFullYear(),2027);
});
test('dated holidays and custom dates never repeat', () => {
 assert.equal(eventCountdown({date:'2026-09-16'},new Date(2027,0,1)).past,true);
});
test('reject invalid dates and support leap days', () => {
 assert.equal(localDate('2026-02-29'),null);
 assert.equal(localDate(''),null);
 assert.ok(localDate('2028-02-29'));
});
test('remaining time uses local midnight', () => {
 const result=eventCountdown({date:'2026-09-16'},new Date(2026,8,15,23,59,58));
 assert.equal(result.seconds,2); assert.equal(result.days,0);
});
