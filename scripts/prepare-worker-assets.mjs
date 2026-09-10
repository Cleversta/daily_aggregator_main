import { access, cp, mkdir, rm } from 'node:fs/promises';

// Keep Wrangler's watched asset directory separate from Next's disposable
// export directory. A production build must not remove a running preview.
await access(new URL('../out/index.html', import.meta.url));
const destination = new URL('../.wrangler/local-assets/', import.meta.url);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(new URL('../out/', import.meta.url), destination, { recursive: true });
console.log('Prepared local Worker assets from the completed Next.js export.');
