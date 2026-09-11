export function rgbToHex(rgb) {
  if (rgb.length !== 3 || rgb.some(v => !Number.isFinite(v) || v < 0 || v > 255)) throw new Error('RGB channels must be between 0 and 255.');
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function hslToRgb(h, s, l) {
  if (![h,s,l].every(Number.isFinite) || s < 0 || s > 100 || l < 0 || l > 100) throw new Error('Use saturation and lightness from 0% to 100%.');
  h = ((h % 360) + 360) % 360 / 60; s /= 100; l /= 100;
  const c = (1 - Math.abs(2*l-1))*s, x = c*(1-Math.abs(h%2-1)), m = l-c/2;
  const values = h < 1 ? [c,x,0] : h < 2 ? [x,c,0] : h < 3 ? [0,c,x] : h < 4 ? [0,x,c] : h < 5 ? [x,0,c] : [c,0,x];
  return values.map(v => Math.round((v+m)*255));
}
export function parseColor(value) {
  const text = value.trim();
  const hex = text.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) { const full = hex[1].length === 3 ? [...hex[1]].map(v=>v+v).join('') : hex[1]; return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16)); }
  const rgb = text.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) { const values = rgb.slice(1).map(Number); rgbToHex(values); return values; }
  const hsl = text.match(/^hsl\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*(\d+(?:\.\d*)?)%\s*,\s*(\d+(?:\.\d*)?)%\s*\)$/i);
  if (hsl) return hslToRgb(...hsl.slice(1).map(Number));
  throw new Error('Use #AABBCC, #ABC, rgb(20, 40, 60), or hsl(210, 50%, 40%). Opaque colors only.');
}
export function rgbToHsl(rgb) {
  const [r,g,b] = rgb.map(v=>v/255), max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min, l=(max+min)/2;
  let h=0, s=0;
  if (d) { s=d/(1-Math.abs(2*l-1)); h=60*(max===r ? ((g-b)/d+6)%6 : max===g ? (b-r)/d+2 : (r-g)/d+4); }
  return [h,s*100,l*100].map(v=>Math.round(v*100)/100);
}
// WCAG relative luminance: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
export function contrastRatio(first, second) {
  const luminance = rgb => rgb.map(v=>v/255).map(v=>v<=0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
  const a=luminance(first), b=luminance(second);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
