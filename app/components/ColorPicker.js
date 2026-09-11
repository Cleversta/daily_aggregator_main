'use client';
import { useState } from 'react';
import { parseColor, rgbToHex, rgbToHsl, contrastRatio } from '../../lib/colors.mjs';
import Icon from './Icon';
import ImageColorPicker from './ImageColorPicker';

function ColorControl({ id, title, description, color, onChange }) {
  const [input, setInput] = useState(color);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const rgb = parseColor(color), hsl = rgbToHsl(rgb);
  const codes = { HEX: color, RGB: `rgb(${rgb.join(', ')})`, HSL: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` };
  function apply(value) { onChange(value); setInput(value); setError(''); setMessage(''); }
  function editCode(value) {
    setInput(value); setMessage('');
    try { onChange(rgbToHex(parseColor(value))); setError(''); }
    catch { setError('Finish entering a valid HEX, RGB, or HSL code. The preview keeps your last valid color.'); }
  }
  async function copy(label, value) {
    try { await navigator.clipboard.writeText(value); setMessage(`${title}: ${label} copied.`); }
    catch { setMessage('Copy unavailable. Select the code to copy it manually.'); }
  }
  return <section className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5" aria-labelledby={`${id}-heading`}>
    <h3 id={`${id}-heading`} className="font-display text-xl font-bold">{title}</h3>
    <p className="mt-1 text-sm text-slate">{description}</p>
    <div className="mt-3 flex items-start gap-3">
      <div><label htmlFor={`${id}-wheel`} className="sr-only">Choose {title.toLowerCase()}</label>
        <input id={`${id}-wheel`} type="color" value={color} onChange={e=>apply(e.target.value.toUpperCase())} className="h-12 w-14 cursor-pointer rounded-lg border border-line bg-white p-1" />
      </div>
      <div className="min-w-0 flex-1"><label htmlFor={`${id}-code`} className="sr-only">{title} code</label>
        <input id={`${id}-code`} type="text" value={input} onChange={e=>editCode(e.target.value)} maxLength={100} autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={`${id}-help`} className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm" />
      </div>
    </div>
    <p id={`${id}-help`} className="mt-2 text-xs text-slate">Tap the color square, or type a code. Updates automatically.</p>
    {error && <p role="status" className="mt-2 text-xs text-red-800">{error}</p>}
    <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">Copy HEX, RGB, or HSL codes</summary>
    <div className="space-y-2">{Object.entries(codes).map(([label,value])=><div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3"><div className="min-w-0"><p className="text-xs font-bold text-slate">{label}</p><code className="break-all text-sm">{value}</code></div><button type="button" onClick={()=>copy(label,value)} aria-label={`Copy ${title.toLowerCase()} ${label} code`} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs font-bold"><Icon name="copy" className="h-4 w-4" />Copy</button></div>)}</div>
    </details>
    <p role="status" className="mt-2 text-sm text-slate">{message}</p>
  </section>;
}

export default function ColorPicker() {
  const [foreground, setForeground] = useState('#285B50');
  const [background, setBackground] = useState('#FFFFFF');
  const [photoRevision, setPhotoRevision] = useState(0);
  const ratio = contrastRatio(parseColor(foreground), parseColor(background));
  return <section className="rounded-2xl border border-[#DCCFE4] bg-[#F6F0F8] p-5 sm:p-8" aria-labelledby="color-heading">
    <p className="text-xs font-bold uppercase tracking-widest text-[#754985]">A color for every idea</p>
    <h2 id="color-heading" className="mt-2 font-display text-3xl font-bold">Two colors. One clear preview.</h2>
    <p className="mt-2 text-sm text-slate">Pick a color or type a code below. The preview changes automatically—no Apply button needed.</p>
    <div className="color-live-preview z-10 mt-5 rounded-xl border border-line bg-[#F6F0F8] p-2 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1"><h3 className="text-sm font-bold">Live preview</h3><span className="text-xs text-slate">Contrast {ratio.toFixed(2)}:1 · {ratio >= 4.5 ? 'AA normal text passes' : 'AA normal text fails'}</span></div>
      <div className="rounded-lg border border-line px-5 py-4" style={{color:foreground,backgroundColor:background}}><p className="font-display text-2xl font-bold sm:text-3xl">Aa. Stay curious.</p><p className="mt-2 text-sm">Your text color on your background.</p></div>
    </div>
    <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
      <ColorControl key={`text-${photoRevision}`} id="text-color" title="Text color" description="Changes the letters above." color={foreground} onChange={setForeground} />
      <ColorControl key={`background-${photoRevision}`} id="background-color" title="Background color" description="Changes the background above." color={background} onChange={setBackground} />
    </div>
    <ImageColorPicker onText={color=>{setForeground(color);setPhotoRevision(v=>v+1);}} onBackground={color=>{setBackground(color);setPhotoRevision(v=>v+1);}} />
    <div className="mt-6">
      <div className="rounded-2xl bg-ink p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#DFC8EC]">Text contrast</p><p className="mt-3 text-4xl font-bold" aria-live="polite">{ratio.toFixed(2)}:1</p><ul className="mt-4 space-y-2 text-sm">{[['AA normal text',4.5],['AA large text',3],['AAA normal text',7],['AAA large text',4.5]].map(([label,minimum])=><li key={label} className="flex flex-wrap justify-between gap-2"><span>{label} · {minimum}:1</span><strong>{ratio>=minimum?'✓ Pass':'✕ Fail'}</strong></li>)}</ul><p className="mt-4 text-xs leading-relaxed text-white/75">Large text means at least 24 CSS pixels, or about 18.67 pixels when bold. Decisions use the unrounded ratio. This checks opaque sRGB text contrast only, not full accessibility compliance.</p><a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline">How WCAG contrast works ↗</a></div>
    </div>
  </section>;
}
