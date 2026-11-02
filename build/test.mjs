#!/usr/bin/env node
// 빌드 검증: node build/test.mjs
//  1) src → 빌드 결과가 www/index.html과 바이트 단위로 같다
//  2) split ↔ build 왕복이 원본을 그대로 되돌린다
//  3) 모듈 추가·수정: 임시 src에 모듈/파트를 넣고 빌드하면 제 위치에 들어가고, 브라우저에서 실제로 실행된다
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { build } from './build.mjs';
import { split } from './split.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const original = readFileSync(join(ROOT, 'www/index.html'), 'utf8');
const tmp = mkdtempSync(join(tmpdir(), 'ggm-build-'));
try {
  assert.equal(build(join(ROOT, 'src')), original, 'src 빌드 결과가 www/index.html과 달라요 (node build/build.mjs 실행 필요)');
  console.log('ok 1  src 빌드 == www/index.html');

  split(original, join(tmp, 'rt'));
  assert.equal(build(join(tmp, 'rt')), original);
  console.log('ok 2  split → build 왕복 동일');

  const src = join(tmp, 'src'); cpSync(join(ROOT, 'src'), src, { recursive: true });
  writeFileSync(join(src, 'modules/app/020-hello.js'), 'window.__HELLO_MODULE__=typeof GGMStorage;\n');
  writeFileSync(join(src, 'main/0545-hello.js'), 'window.__HELLO_MAIN__=typeof render+":"+typeof G;\n');
  const rules = join(src, 'main/0010-rules.js');
  writeFileSync(rules, readFileSync(rules, 'utf8') + 'window.__EDITED__=1;\n');
  const html = build(src), at = s => { const k = html.indexOf(s); assert.ok(k >= 0, '없음: ' + s); return k; };
  assert.ok(at('<script type="text/ggm-module" id="ggm-app-confirm">') < at('<script type="text/ggm-module" id="ggm-app-hello">'));
  assert.ok(at('id="ggm-app-hello"') < at('id="ggm-combat-catalog"'));
  assert.ok(at('window.__EDITED__=1;') < at('window.__HELLO_MAIN__') && at('window.__HELLO_MAIN__') < at('독립 앱 전용'));
  console.log('ok 3  추가 모듈·파트가 제 순서로 들어감');

  let chromium; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) {}
  if (!chromium) { console.log('skip 4  playwright 없음: 브라우저 실행 검사 생략'); process.exit(0); }
  const www = join(tmp, 'www'); cpSync(join(ROOT, 'www'), www, { recursive: true }); writeFileSync(join(www, 'index.html'), html);
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/json', '.png': 'image/png' };
  const server = createServer((q, r) => { try { const p = join(www, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/\/$/, '/index.html')); r.writeHead(200, { 'content-type': type[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p)); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise(ok => server.listen(0, ok));
  const browser = await chromium.launch(), page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); // 외부(폰트·AI) 차단
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.__HELLO_MAIN__, null, { timeout: 15000 });
  const got = await page.evaluate(() => ({ m: window.__HELLO_MODULE__, main: window.__HELLO_MAIN__, ed: window.__EDITED__, view: document.querySelector('#view').innerHTML.length }));
  await browser.close(); server.close();
  assert.deepEqual(errors, [], '페이지 오류');
  assert.equal(got.m, 'object'); assert.equal(got.main, 'function:object'); assert.equal(got.ed, 1); assert.ok(got.view > 100, '화면이 그려지지 않음');
  console.log('ok 4  브라우저: 추가 모듈·파트·수정 실행, 앱 화면 렌더링, 오류 없음');
} finally { rmSync(tmp, { recursive: true, force: true }); }
