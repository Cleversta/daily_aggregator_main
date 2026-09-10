import test from 'node:test';
import assert from 'node:assert/strict';
import { cropRectangle, outputHeight } from '../lib/image-geometry.mjs';

test('full image is preserved without cropping', () => {
  assert.deepEqual(cropRectangle(2048, 2044), { x: 0, y: 0, width: 2048, height: 2044 });
});
test('square crop can be positioned at either horizontal edge', () => {
  assert.deepEqual(cropRectangle(400, 200, '1', 100, 0, 50), { x: 0, y: 0, width: 200, height: 200 });
  assert.equal(cropRectangle(400, 200, '1', 100, 100, 50).x, 200);
});
test('quarter turns swap proportions; half turns preserve them', () => {
  const crop = cropRectangle(400, 200);
  assert.equal(outputHeight(100, crop, 0), 50);
  assert.equal(outputHeight(100, crop, 90), 200);
  assert.equal(outputHeight(100, crop, 180), 50);
  assert.equal(outputHeight(100, crop, 270), 200);
});
test('all presets stay within source bounds for tiny, portrait and landscape images', () => {
  for (const [w, h] of [[1, 1], [4000, 3000], [3000, 4000], [1, 2000]]) {
    for (const ratio of ['original', '1', '1.3333333333333333', '1.7777777777777777', '0.8', '0.5625']) {
      for (const zoom of [10, 50, 100]) for (const position of [0, 50, 100]) {
        const crop = cropRectangle(w, h, ratio, zoom, position, position);
        assert.ok(crop.width >= 1 && crop.height >= 1);
        assert.ok(crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= w && crop.y + crop.height <= h);
      }
    }
  }
});
