import { deterministicBucket } from '../lib/evaluation';

test('deterministicBucket stable and range', () => {
  const a = deterministicBucket('w1', 'f1', 'u1');
  const b = deterministicBucket('w1', 'f1', 'u1');
  expect(a).toBe(b);
  expect(a).toBeGreaterThanOrEqual(0);
  expect(a).toBeLessThanOrEqual(9999);
});
