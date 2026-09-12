const test = require('node:test');
const assert = require('node:assert/strict');
const { sourceTrust } = require('../lib/source-trust.cjs');

test('accepts curated publishers and institutional subdomains', () => {
  assert.equal(sourceTrust('https://www.reuters.com/world/story').trusted, true);
  assert.equal(sourceTrust('https://news.mit.edu/article').trusted, true);
  assert.equal(sourceTrust('https://www.nasa.gov/news').trusted, true);
});

test('rejects unknown, insecure, local, IP and credential URLs', () => {
  for (const url of [
    'https://unknown-source.invalid/story', 'http://reuters.com/story',
    'https://localhost/story', 'https://127.0.0.1/story',
    'https://user:password@reuters.com/story',
  ]) assert.equal(sourceTrust(url).trusted, false, url);
});
