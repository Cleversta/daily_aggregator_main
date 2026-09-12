import Link from 'next/link';
import ImageTool from '../../components/ImageTool';

export const metadata = {
  title: 'Image format converter — JPG, PNG and WebP',
  description: 'Convert JPG, PNG, and WebP images locally in your browser. No upload, account, or server processing.',
  alternates: { canonical: '/tools/jpg-to-png' },
};

export default function JpgToPngPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/guide" className="text-sm text-slate underline">← All guides</Link>
      <h1 className="mt-5 font-display text-4xl font-bold leading-tight">Image format converter</h1>
      <p className="mb-6 mt-3 max-w-3xl leading-relaxed text-slate">
        Convert JPG to PNG, PNG to JPG, or either format to WebP. The conversion happens only in your browser.
      </p>
      <ImageTool mode="convert-png" />
      <section className="max-w-3xl space-y-4 text-slate">
        <h2 className="font-display text-2xl font-bold text-ink">Which format should you choose?</h2>
        <p>JPG is usually a good choice for photographs. PNG uses lossless compression and supports transparency, but photo files can be much larger. WebP often gives smaller web images and can preserve transparency.</p>
        <p>Converting a JPG to PNG does not restore detail already removed by JPG compression. Converting a transparent PNG or WebP to JPG replaces transparent areas with white.</p>
        <p>The tool preserves the image’s pixel dimensions, but browser export may remove camera metadata and embedded color information. Reloading the page clears the selected image and result.</p>
        <Link href="/guide/compress-image" className="inline-block font-bold text-ink underline">Need a smaller file instead? Open the image compressor →</Link>
      </section>
    </div>
  );
}
