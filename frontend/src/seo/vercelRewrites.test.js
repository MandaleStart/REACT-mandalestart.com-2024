import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));

test('Vercel rewrites nested client, admin, and legacy configuration routes to the SPA', () => {
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  for (const route of [
    '/area-cliente/:path*',
    '/administracion/:path*',
    '/configuraciones/:path*',
  ]) {
    assert.equal(rewrites.get(route), '/index.html', `Missing SPA rewrite for ${route}`);
  }
});
