import test from 'node:test';
import assert from 'node:assert/strict';
import { convertUnit, unitGroups } from '../lib/unit-converter.mjs';
const near=(actual, expected)=>assert.ok(Math.abs(actual-expected)<1e-9*Math.max(1,Math.abs(expected)), `${actual} != ${expected}`);
test('known length, mass, and US volume conversions',()=>{
 near(convertUnit('1','length','in','cm'),2.54);
 near(convertUnit('1','length','mi','km'),1.609344);
 near(convertUnit('1','weight','lb','g'),453.59237);
 near(convertUnit('16','weight','oz','lb'),1);
 near(convertUnit('1','volume','gal','L'),3.785411784);
});
test('temperature fixed points and absolute zero',()=>{
 near(convertUnit('0','temperature','C','F'),32);
 near(convertUnit('212','temperature','F','C'),100);
 near(convertUnit('-40','temperature','C','F'),-40);
 near(convertUnit('-459.67','temperature','F','K'),0);
 near(convertUnit('0','temperature','K','C'),-273.15);
});
test('round trips and identity across every unit pair',()=>{
 for(const [group,{units}] of Object.entries(unitGroups)) for(const from of Object.keys(units)) for(const to of Object.keys(units)) {
  const result=convertUnit('123.456',group,from,to);
  near(convertUnit(String(result),group,to,from),123.456);
 }
});
test('invalid inputs, domain errors, and overflow',()=>{
 for(const input of ['', ' ', '1,000','NaN','Infinity','1+2']) assert.throws(()=>convertUnit(input,'length','m','cm'));
 assert.throws(()=>convertUnit('-1','weight','kg','lb'));
 for(const [unit,input] of [['K','-1'],['C','-273.16'],['F','-459.68']]) assert.throws(()=>convertUnit(input,'temperature',unit,'C'));
 assert.throws(()=>convertUnit('1','length','kg','m'));
 assert.throws(()=>convertUnit('1e308','length','km','cm'));
 assert.equal(convertUnit('0','length','m','cm'),0);
});
test('extended categories use the correct measurement conventions',()=>{
 near(convertUnit('1','length','nmi','m'),1852);
 near(convertUnit('1','weight','st','lb'),14);
 near(convertUnit('1','weight','US ton','lb'),2000);
 near(convertUnit('1','volume','US tbsp','US tsp'),3);
 near(convertUnit('1','volume','metric cup','mL'),250);
 near(convertUnit('1','volume','US cup','mL'),236.5882365);
 near(convertUnit('1','volume','imp gal','L'),4.54609);
 near(convertUnit('1','area','acre','ft²'),43560);
 near(convertUnit('1','area','ha','m²'),10000);
 near(convertUnit('36','speed','km/h','m/s'),10);
 near(convertUnit('1','speed','kn','km/h'),1.852);
 near(convertUnit('1','time','week','h'),168);
 near(convertUnit('1','storage','B','bit'),8);
 near(convertUnit('1','storage','GB','MB'),1000);
 near(convertUnit('1','storage','GiB','MiB'),1024);
 near(convertUnit('1','storage','MiB','B'),1048576);
});
