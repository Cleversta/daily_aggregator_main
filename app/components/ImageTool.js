'use client';

import { useEffect, useRef, useState } from 'react';
import { cropRectangle, outputHeight } from '../../lib/image-geometry.mjs';

const MAX_PIXELS = 16000000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const bytes = value => value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / (1024 * 1024)).toFixed(2)} MB`;

export default function ImageTool({ mode = 'compress' }) {
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState('original');
  const [zoom, setZoom] = useState(100);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const [source, setSource] = useState(null);
  const [result, setResult] = useState(null);
  const [width, setWidth] = useState('');
  const [format, setFormat] = useState('image/webp');
  const [quality, setQuality] = useState(80);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operation = useRef(0);
  const sourceUrl = useRef(null);
  const resultUrl = useRef(null);
  const input = useRef(null);
  const crop = source ? cropRectangle(source.width, source.height, aspect, zoom, cropX, cropY) : null;
  const height = crop && Number(width) > 0 ? outputHeight(Number(width), crop, rotation) : 0;

  useEffect(() => {
    if (!source) return;
    const timer = setTimeout(() => processImage(), 400);
    return () => { clearTimeout(timer); operation.current++; };
  }, [source, width, format, quality, rotation, aspect, zoom, cropX, cropY]);

  useEffect(() => () => {
    operation.current++;
    if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
  }, []);

  function clearResult() {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
    setResult(null);
  }

  function reset() {
    operation.current++;
    if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    sourceUrl.current = null;
    clearResult();
    setSource(null);
    setRotation(0); setAspect('original'); setZoom(100); setCropX(50); setCropY(50);
    setWidth('');
    setBusy(false);
    setError('');
    if (input.current) input.current.value = '';
  }

  async function selectFile(file) {
    reset();
    setFormat('image/webp'); setQuality(80);
    if (!file) return;
    if (!types[file.type]) { setError('Choose a JPG, PNG, or WebP image. Other formats are not supported.'); return; }
    if (file.size > MAX_FILE_BYTES) { setError('Choose an image smaller than 25 MB.'); return; }
    const job = ++operation.current;
    setBusy(true);
    const url = URL.createObjectURL(file);
    sourceUrl.current = url;
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (job !== operation.current) return;
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) {
        throw new Error('Choose an image with no more than 40 megapixels.');
      }
      const initialWidth = Math.min(image.naturalWidth, mode === 'resize' ? 1200 : image.naturalWidth, Math.floor(Math.sqrt(MAX_PIXELS * image.naturalWidth / image.naturalHeight)), Math.floor(8192 * image.naturalWidth / image.naturalHeight), 8192);
      setSource({ file, image, url, width: image.naturalWidth, height: image.naturalHeight });
      setWidth(String(Math.max(1, initialWidth)));
    } catch (err) {
      if (job !== operation.current) return;
      URL.revokeObjectURL(url);
      sourceUrl.current = null;
      setError(err.message.startsWith('Choose') ? err.message : 'This image could not be opened. Try a different JPG, PNG, or WebP file.');
    } finally {
      if (job === operation.current) setBusy(false);
    }
  }

  async function processImage(event) {
    event?.preventDefault();
    if (!source) return;
    clearResult();
    setError('');
    const targetWidth = Number(width);
    if (!Number.isInteger(targetWidth) || targetWidth < 1 || targetWidth > 8192 || height > 8192 || targetWidth * height > MAX_PIXELS) {
      setBusy(false);
      setError('Use whole-number dimensions up to 8,192 pixels per side and 16 megapixels in total. Try a smaller width.');
      return;
    }
    const job = ++operation.current;
    setBusy(true);
    let canvas;
    try {
      // Yield so the busy state can paint before the browser draws the image.
      await new Promise(resolve => setTimeout(resolve, 30));
      if (job !== operation.current) return;
      canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not create the image. Try a smaller width.');
      if (format === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, targetWidth, height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.translate(targetWidth / 2, height / 2);
      context.rotate(rotation * Math.PI / 180);
      const drawWidth = rotation % 180 === 0 ? targetWidth : height;
      const drawHeight = rotation % 180 === 0 ? height : targetWidth;
      context.drawImage(source.image, crop.x, crop.y, crop.width, crop.height, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality / 100));
      if (job !== operation.current) return;
      if (!blob) throw new Error('The image could not be created. Try a smaller width.');
      if (blob.type !== format) throw new Error('Your browser cannot export this format. Choose JPG or PNG.');
      const url = URL.createObjectURL(blob);
      resultUrl.current = url;
      const stem = source.file.name.replace(/\.[^.]+$/, '') || 'image';
      setResult({ url, size: blob.size, width: targetWidth, height, filename: `${stem}-${targetWidth}w.${types[blob.type]}` });
    } catch (err) {
      if (job === operation.current) setError(err.message || 'Something went wrong. Try a smaller image.');
    } finally {
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      if (job === operation.current) setBusy(false);
    }
  }

  function changeSetting(setter, value) { operation.current++; clearResult(); setBusy(true); setError(''); setter(value); }

  return (
    <section id="image-tool" aria-labelledby="image-tool-heading" className="mb-10 rounded-2xl border border-[#B9D3C5] bg-[#F3F8F3] p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-[#285B50]">Try it here</p>
      <h2 id="image-tool-heading" className="mt-2 font-display text-2xl font-bold">{mode === 'resize' ? 'Resize your image' : 'Make your image smaller'}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate">Your image stays on this device. No upload, account, or server processing.</p>
      <div className="mt-5 rounded-xl border-2 border-dashed border-[#B9D3C5] bg-white p-5">
        <label htmlFor="image-file" className="block font-bold">Choose an image</label>
        {source && <p className="mt-2 break-all text-sm text-slate">Selected: {source.file.name}</p>}
        <input ref={input} id="image-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => selectFile(event.target.files?.[0])} className="mt-3 block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-3 file:font-bold file:text-white" aria-describedby="image-file-help" />
        <p id="image-file-help" className="mt-3 text-xs leading-relaxed text-slate">JPG, PNG, or WebP · Up to 25 MB and 40 megapixels. Animated files become a still image. Export may remove metadata and change colors.</p>
      </div>
      {source && <form onSubmit={processImage} className="mt-5">
        <fieldset className="mb-5 rounded-xl border border-line bg-white p-4">
          <legend className="px-2 text-sm font-bold">Crop & rotate</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="image-crop" className="block text-sm font-bold">Crop shape</label><select id="image-crop" value={aspect} onChange={event => changeSetting(setAspect, event.target.value)} className="mt-2 w-full rounded-lg border border-line px-3 py-2"><option value="original">Original proportions</option><option value="1">Square · 1:1</option><option value="1.3333333333333333">Landscape · 4:3</option><option value="1.7777777777777777">Widescreen · 16:9</option><option value="0.8">Portrait · 4:5</option><option value="0.5625">Story · 9:16</option></select></div>
            <div><span className="block text-sm font-bold">Rotate · {rotation}° clockwise</span><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => changeSetting(setRotation, (rotation + 270) % 360)} className="min-h-11 rounded-lg border border-line px-3 text-sm font-bold">↶ Left 90°</button><button type="button" onClick={() => changeSetting(setRotation, (rotation + 90) % 360)} className="min-h-11 rounded-lg border border-line px-3 text-sm font-bold">↷ Right 90°</button></div></div>
            {[['image-crop-size', 'Area to keep', zoom, setZoom, 10], ['image-crop-x', 'Horizontal crop position', cropX, setCropX, 0], ['image-crop-y', 'Vertical crop position', cropY, setCropY, 0]].map(([id, label, value, setter, min]) => <div key={id}><label htmlFor={id} className="block text-sm font-bold">{label} · {value}%</label><input id={id} type="range" min={min} max="100" value={value} onChange={event => changeSetting(setter, Number(event.target.value))} className="mt-2 min-h-8 w-full accent-[#285B50]" /></div>)}
          </div>
          <p className="mt-2 text-xs text-slate">The outlined area on the original is kept, then rotated. Use the position sliders to choose what stays in frame.</p>
          <button type="button" onClick={() => { operation.current++; clearResult(); setBusy(true); setRotation(0); setAspect('original'); setZoom(100); setCropX(50); setCropY(50); }} disabled={rotation === 0 && aspect === 'original' && zoom === 100 && cropX === 50 && cropY === 50} className="mt-2 min-h-11 text-sm font-bold underline disabled:opacity-40">Reset crop & rotation</button>
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="image-width" className="block text-sm font-bold">Width (pixels)</label><input id="image-width" type="number" min="1" max="8192" step="1" required value={width} onChange={event => changeSetting(setWidth, event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2" /><p className="mt-1 text-xs text-slate">Height: {height || '—'} px · Proportions locked</p></div>
          <div><label htmlFor="image-format" className="block text-sm font-bold">Save as</label><select id="image-format" value={format} onChange={event => changeSetting(setFormat, event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2"><option value="image/webp">WebP — smaller web images</option><option value="image/jpeg">JPG — photos</option><option value="image/png">PNG — can make photos larger</option></select></div>
          <div><label htmlFor="image-quality" className="block text-sm font-bold">Quality {format !== 'image/png' && `${quality}%`}</label><input id="image-quality" type="range" min="10" max="100" value={quality} disabled={format === 'image/png'} onChange={event => changeSetting(setQuality, Number(event.target.value))} className="mt-3 min-h-8 w-full accent-[#285B50]" /><p className="text-xs text-slate">{format === 'image/png' ? 'PNG ignores quality and can make photos larger.' : '80% means image quality, not 80% smaller. File size updates automatically.'}</p></div>
        </fieldset>
        <p className="mt-3 text-xs text-slate">{format === 'image/jpeg' ? 'Transparent areas will become white in JPG.' : 'PNG and WebP preserve transparent areas.'} Preview and actual download size update after you stop adjusting. Large photos may take a few seconds.</p>
        <div className="mt-4 flex flex-wrap gap-3"><button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Updating preview…' : 'Refresh preview'}</button><button type="button" onClick={reset} className="min-h-11 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold">Clear image</button></div>
      </form>}
      <p role="status" className="mt-3 text-sm text-[#285B50]">{busy ? 'Calculating actual file size…' : result ? `Ready. ${bytes(result.size)}. ${result.size < source.file.size ? `${Math.round((1 - result.size / source.file.size) * 100)}% smaller.` : 'This result is not smaller. Try WebP, lower quality, or a smaller width.'}` : ''}</p>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-800">{error}</p>}
      {source && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <figure className="min-w-0 rounded-xl border border-line bg-white p-3"><div className="image-tool-preview"><div className="relative mx-auto" style={{ maxWidth: `${Math.min(100, 100 * source.width / source.height)}%` }}><img src={source.url} alt="Original image with crop area outlined" className="block h-auto w-full" /><div className="pointer-events-none absolute border-2 border-white outline outline-2 outline-[#285B50]" style={{ left: `${crop.x / source.width * 100}%`, top: `${crop.y / source.height * 100}%`, width: `${crop.width / source.width * 100}%`, height: `${crop.height / source.height * 100}%`, boxShadow: '0 0 0 999px #0005' }} /></div></div><figcaption className="mt-3 text-sm"><strong>Original · {bytes(source.file.size)}</strong><span className="block text-xs text-slate">{source.width} × {source.height} px</span></figcaption></figure>
        {result ? <figure className="min-w-0 rounded-xl border border-line bg-white p-3"><div className="image-tool-preview"><img src={result.url} alt="Processed image preview" className="h-48 w-full object-contain" /></div><figcaption className="mt-3 text-sm"><strong>Result · {bytes(result.size)}</strong><span className="block text-xs text-slate">{result.width} × {result.height} px</span></figcaption><a href={result.url} download={result.filename} className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#285B50] px-4 py-3 text-sm font-bold text-white">Download image ↓</a></figure> : <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-[#B9D3C5] p-6 text-center text-sm text-slate">Your preview and download size will appear here automatically.</div>}
      </div>}
    </section>
  );
}
