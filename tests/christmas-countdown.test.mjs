import test from 'node:test';
import assert from 'node:assert/strict';
import { christmasCountdown } from '../lib/christmas-countdown.mjs';
test('Christmas Eve counts down to local midnight',()=>{
 assert.deepEqual(christmasCountdown(new Date(2026,11,24,23,59,59)),{year:2026,celebrating:false,days:0,hours:0,minutes:0,seconds:1});
});
test('greeting lasts all of Christmas Day',()=>{
 for(const date of [new Date(2026,11,25), new Date(2026,11,25,23,59,59)]) {
  const result=christmasCountdown(date);assert.equal(result.celebrating,true);assert.equal(result.seconds,0);assert.equal(result.days,0);
 }
});
test('December 26 targets next year and January targets this year',()=>{
 assert.equal(christmasCountdown(new Date(2026,11,26)).year,2027);
 assert.equal(christmasCountdown(new Date(2027,0,1)).year,2027);
});
test('leap day and clock jumps recalculate from the supplied clock',()=>{
 const now=new Date(2028,1,29,12), target=new Date(2028,11,25);
 const result=christmasCountdown(now);
 assert.equal(result.days*86400+result.hours*3600+result.minutes*60+result.seconds,(target-now)/1000);
 assert.equal(christmasCountdown(new Date(2026,11,24,23,59,58,500)).seconds,2);
 assert.throws(()=>christmasCountdown(new Date('invalid')));
});
