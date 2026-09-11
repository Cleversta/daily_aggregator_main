import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDate,dateDifference,shiftDate,calendarAge} from '../lib/date-calculator.mjs';
test('calendar differences span leap days and daylight saving',()=>{
 assert.equal(dateDifference('2024-02-28','2024-03-01'),2);
 assert.equal(dateDifference('2026-03-07','2026-03-09'),2);
 assert.equal(dateDifference('2026-09-12','2026-09-10'),-2);
 assert.equal(dateDifference('2026-09-12','2026-09-12'),0);
});
test('date shifts cross month and year boundaries',()=>{
 assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');
 assert.equal(shiftDate('2024-02-28',2),'2024-03-01');
 assert.equal(shiftDate('2026-09-12',0),'2026-09-12');
 assert.throws(()=>shiftDate('9999-12-31',1));
 assert.throws(()=>shiftDate('2026-01-01',1.5));
});
test('age clamps anniversaries to month end',()=>{
 assert.deepEqual(calendarAge('2000-02-29','2026-02-28'),{years:26,months:0,days:0});
 assert.deepEqual(calendarAge('2000-02-29','2026-02-27'),{years:25,months:11,days:29});
 assert.deepEqual(calendarAge('2026-01-31','2026-03-30'),{years:0,months:1,days:30});
 assert.deepEqual(calendarAge('2026-09-12','2026-09-12'),{years:0,months:0,days:0});
 assert.throws(()=>calendarAge('2026-09-12','2026-09-11'));
});
test('reject impossible and malformed dates',()=>{
 for(const value of ['','2026-02-29','2026-04-31','2026-13-01','99-01-01','0000-01-01']) assert.throws(()=>parseDate(value));
});
