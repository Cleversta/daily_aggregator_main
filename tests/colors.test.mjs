import test from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, rgbToHex, rgbToHsl, hslToRgb, contrastRatio } from '../lib/colors.mjs';
test('accepted formats converge on the same color',()=>{
 for(const value of ['#f00','#FF0000','rgb(255, 0, 0)','hsl(0, 100%, 50%)','hsl(360, 100%, 50%)']) assert.equal(rgbToHex(parseColor(value)),'#FF0000');
 assert.equal(rgbToHex(parseColor('hsl(-120, 100%, 50%)')),'#0000FF');
});
test('invalid and unsupported colors are rejected',()=>{
 for(const value of ['', '#12', '#12345678', 'transparent','rgb(256, 0, 0)','hsl(20, 101%, 50%)','rgba(0,0,0,0.5)']) assert.throws(()=>parseColor(value));
});
test('HSL round trips primary, gray and arbitrary RGB colors',()=>{
 for(const rgb of [[0,0,0],[255,255,255],[128,128,128],[255,0,0],[0,255,0],[0,0,255],[40,91,80],[13,114,237]]) assert.deepEqual(hslToRgb(...rgbToHsl(rgb)),rgb);
});
test('WCAG contrast fixtures and symmetry',()=>{
 assert.equal(contrastRatio([0,0,0],[255,255,255]),21);
 assert.equal(contrastRatio([40,91,80],[40,91,80]),1);
 const white=[255,255,255];
 assert.ok(contrastRatio(parseColor('#777777'),white)<4.5);
 assert.ok(contrastRatio(parseColor('#767676'),white)>4.5);
 assert.equal(contrastRatio([20,30,40],white),contrastRatio(white,[20,30,40]));
});
