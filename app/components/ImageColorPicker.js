'use client';
import { useEffect, useRef, useState } from 'react';
import { rgbToHex } from '../../lib/colors.mjs';

export default function ImageColorPicker({ onText, onBackground }) {
  const canvasRef = useRef(null);
  const generation = useRef(0);
  const [ready, setReady] = useState(false);
  const [point, setPoint] = useState(null);
  const [picked, setPicked] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => () => { generation.current++; }, []);
  function sample(x, y) {
    const canvas = canvasRef.current;
    x = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
    y = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
    const rgb = Array.from(canvas.getContext('2d').getImageData(x,y,1,1).data).slice(0,3);
    setPoint({x,y}); setPicked({hex:rgbToHex(rgb), rgb:`rgb(${rgb.join(', ')})`}); setMessage('');
  }
  async function load(file) {
    const current = ++generation.current;
    setReady(false); setPicked(null); setPoint(null); setMessage('');
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 25 * 1024 * 1024) {
      setMessage('Choose a JPG, PNG, or WebP image up to 25 MB.'); return;
    }
    setMessage('Opening image…');
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      if (current !== generation.current) return;
      if (bitmap.width * bitmap.height > 40000000) throw new Error('large');
      const scale = Math.min(1, 2400 / Math.max(bitmap.width,bitmap.height));
      const canvas = canvasRef.current;
      canvas.width = Math.max(1, Math.round(bitmap.width*scale));
      canvas.height = Math.max(1, Math.round(bitmap.height*scale));
      const context = canvas.getContext('2d', {willReadFrequently:true});
      context.fillStyle = '#ffffff'; context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      setReady(true); setMessage('Tap the photo to pick a color.');
    } catch {
      if (current === generation.current) setMessage('Could not open this image. Try a JPG, PNG, or WebP under 40 megapixels.');
    } finally { bitmap?.close(); }
  }
  async function copy(value) {
    try { await navigator.clipboard.writeText(value); setMessage('Color code copied.'); }
    catch { setMessage('Copy unavailable. Select the displayed code and copy it manually.'); }
  }
  return <section className="mt-5 rounded-2xl border border-line bg-white p-4 sm:p-5" aria-labelledby="photo-color-heading">
    <h3 id="photo-color-heading" className="font-display text-xl font-bold">Pick a color from a photo</h3>
    <p className="mt-2 text-sm text-slate">Choose a photo, tap a spot, then use its color for your text or background. Your image stays on this device.</p>
    <label className="mt-4 block text-sm font-bold">Choose a photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>load(e.target.files?.[0])} className="mt-2 block w-full text-sm" /></label>
    <p className="mt-2 text-xs text-slate">JPG, PNG, WebP · Up to 25 MB and 40 megapixels. Large images are resized to 2,400 pixels for sampling. Transparent areas appear white; sampled colors reflect this preview. Animated images use a still frame.</p>
    <div className={ready ? 'relative mt-4 w-fit max-w-full' : 'hidden'}>
      <canvas ref={canvasRef} tabIndex={ready ? 0 : -1} role="img" aria-label="Photo color picker. Tap a spot, or use arrow keys to pick pixels starting at the center. Hold Shift to move ten pixels." className="block h-auto max-h-[480px] max-w-full cursor-crosshair rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2" onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();sample((e.clientX-rect.left)*e.currentTarget.width/rect.width,(e.clientY-rect.top)*e.currentTarget.height/rect.height);}} onKeyDown={e=>{
        const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        if (!offsets[e.key]) return;
        e.preventDefault(); const step=e.shiftKey?10:1;
        sample((point?.x ?? e.currentTarget.width/2)+offsets[e.key][0]*step,(point?.y ?? e.currentTarget.height/2)+offsets[e.key][1]*step);
      }} />
      {point && <span aria-hidden="true" className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_black]" style={{left:`${(point.x+.5)/canvasRef.current.width*100}%`,top:`${(point.y+.5)/canvasRef.current.height*100}%`}} />}
    </div>
    {picked && <div className="mt-4 space-y-3 rounded-xl border border-line p-4"><div className="flex items-center gap-3"><span className="h-12 w-12 shrink-0 rounded-lg border border-line" style={{backgroundColor:picked.hex}} /><div><p className="text-xs font-bold">Picked color</p><code className="block">{picked.hex}</code><code className="block text-sm">{picked.rgb}</code></div></div><div className="flex flex-wrap gap-2">{[['Copy HEX',()=>copy(picked.hex)],['Copy RGB',()=>copy(picked.rgb)],['Use for text',()=>{onText(picked.hex);setMessage('Text color updated in the live preview.');}],['Use for background',()=>{onBackground(picked.hex);setMessage('Background color updated in the live preview.');}]].map(([label,action])=><button key={label} type="button" onClick={action} className="min-h-11 rounded-lg border border-line px-3 text-sm font-bold">{label}</button>)}</div></div>}
    <p role="status" className="mt-3 text-sm text-slate">{message}</p>
  </section>;
}
