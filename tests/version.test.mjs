import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const version = pkg.version;
const cacheVersion = version.replaceAll('.', '-');

test('versão pública é coerente entre os ficheiros ativos', () => {
  const index = read('index.html');
  const enhancements = read('enhancements.js');
  const sw = read('sw.js');
  const readme = read('README.md');
  const quality = read('QUALITY.md');

  assert.match(index, new RegExp(`id="appVersionSide">${version.replaceAll('.', '\\.')}</span>`));
  assert.match(index, new RegExp(`id="appVersion">${version.replaceAll('.', '\\.')}</span>`));
  assert.ok(enhancements.includes(`const VERSION='${version}'`), 'enhancements.js deve usar a versão do package.json');
  assert.ok(sw.includes(`v${cacheVersion}`), 'cache do Service Worker deve refletir a versão do package.json');
  assert.ok(readme.startsWith(`# Foco & Jornada ${version}\n`), 'README deve apresentar a versão atual');
  assert.ok(quality.startsWith(`# Qualidade — ${version}\n`), 'QUALITY.md deve apresentar a versão atual');
});

test('interface ativa não volta a anunciar versões anteriores', () => {
  const index = read('index.html');
  const enhancements = read('enhancements.js');
  for (const old of ['4.0.0', '4.1.0']) {
    assert.equal(index.includes(old), false, `index.html não deve anunciar ${old}`);
    assert.equal(enhancements.includes(`VERSION='${old}'`), false, `enhancements.js não deve anunciar ${old}`);
  }
});
