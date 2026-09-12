import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const env = {
  ASSETS: { fetch: () => new Response('<h1>Page</h1>', { headers: { 'Content-Type': 'text/html' } }) },
};

test('static responses receive security headers', async () => {
  const response = await worker.fetch(new Request('https://dailyaggregator.online/about'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy'), /object-src 'none'/);
  assert.match(response.headers.get('strict-transport-security'), /max-age=31536000/);
});

test('HTTP and www redirect to the canonical HTTPS origin', async () => {
  for (const input of [
    'http://dailyaggregator.online/guide?q=one',
    'https://www.dailyaggregator.online/guide?q=one',
  ]) {
    const response = await worker.fetch(new Request(input), env);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://dailyaggregator.online/guide?q=one');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('local worker preview is not redirected', async () => {
  const response = await worker.fetch(new Request('http://localhost:8787/'), env);
  assert.equal(response.status, 200);
});
