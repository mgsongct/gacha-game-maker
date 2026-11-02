#!/usr/bin/env node
// 빌드 검증: node build/test.mjs
//  1) src → 빌드 결과가 www/index.html과 바이트 단위로 같다
//  2) split ↔ build 왕복이 원본을 그대로 되돌린다
//  3) 모듈 추가·수정: 임시 src에 모듈/파트를 넣고 빌드하면 제 위치에 들어가고, 브라우저에서 실제로 실행된다
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
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
  assert.deepEqual(errors, [], '페이지 오류');
  assert.equal(got.m, 'object'); assert.equal(got.main, 'function:object'); assert.equal(got.ed, 1); assert.ok(got.view > 100, '화면이 그려지지 않음');
  console.log('ok 4  브라우저: 추가 모듈·파트·수정 실행, 앱 화면 렌더링, 오류 없음');

  // 5) 실제 빌드(www/index.html)로 데이터 폴더 내보내기 → zip → 새 게임으로 가져오기 (그림 자료 포함)
  writeFileSync(join(www, 'index.html'), original);
  const p2 = await browser.newPage(), err2 = []; p2.on('pageerror', e => err2.push(String(e)));
  await p2.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p2.goto(`http://127.0.0.1:${server.address().port}/?t=5`);
  await p2.waitForFunction(() => typeof dataExportZip === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r5 = await p2.evaluate(async () => {
    const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : 1)) : v);
    const c = G.chars[0], pic = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: 'image/png' });
    await idbPut(IMGNS + c.id, pic); c.img = { idb: true }; mark('c:' + c.id); await flush();
    const zip = await dataExportZip(JSON.parse(JSON.stringify(G)), PJ().active), names = [...(await zipRead(zip)).keys()], back = await dataReadZip(zip);
    window.__ZIP__ = new File([zip], 'x.zip');
    return { names, same: canon(back.game) === canon(G), media: back.media.map(m => [m.key, m.blob.type, m.blob.size]), cid: c.id, title: G.meta.title, n: PJ().list.length };
  });
  assert.ok(r5.same, '내보낸 zip을 다시 읽으면 게임 내용이 같아야 해요');
  for (const f of ['data/index.json', 'data/main/chars.json', 'data/main/chapters.json', 'data/main/world.json', 'data/main/prog.json', 'data/main/game.json', 'data/main/media.json', 'data/main/media/' + r5.cid]) assert.ok(r5.names.includes(f), '없음: ' + f);
  assert.deepEqual(r5.media, [[r5.cid, 'image/png', 7]]);
  await p2.evaluate(() => { appConfirm = async () => true; dataImport(window.__ZIP__); });
  await p2.waitForEvent('load', { timeout: 20000 });
  await p2.waitForFunction(() => typeof PJ === 'function' && typeof G === 'object' && typeof idbGet === 'function', null, { timeout: 15000 });
  const after = await p2.evaluate(async c => { const b = await idbGet(IMGNS + c); return { n: PJ().list.length, active: PJ().active, title: G.meta.title, img: G.chars[0].img, blob: b && b.size }; }, r5.cid);
  await browser.close(); server.close();
  assert.equal(after.n, r5.n + 1); assert.notEqual(after.active, 'main'); assert.equal(after.title, r5.title);
  assert.deepEqual(after.img, { idb: true }); assert.equal(after.blob, 7);
  assert.deepEqual(err2, [], '페이지 오류');
  console.log('ok 5  데이터 폴더 zip: data/<id>/<종류>.json + media 내보내기 → 같은 내용으로 읽힘 → 새 게임으로 가져오기(그림 포함)');
  // 6) PC 서버(pc/ggm-server.py)를 실제로 켜고, 앱에서 저장하면 서버의 data/<게임id>/<종류>.json 으로 자동 동기화되는지
  const py = spawnSync('python3', ['--version']).status === 0 ? 'python3' : null;
  if (!py) { console.log('skip 6  python3 없음'); } else {
    const pcDir = join(tmp, 'pc'); mkdirSync(pcDir); copyFileSync(join(ROOT, 'pc/ggm-server.py'), join(pcDir, 'ggm-server.py')); cpSync(www, join(pcDir, 'www'), { recursive: true });
    const port = 20000 + Math.floor(Math.random() * 20000), proc = spawn(py, ['ggm-server.py', '--no-tunnel', '--no-update'], { cwd: pcDir, env: { ...process.env, GGM_PORT: String(port), BROWSER: 'true' }, stdio: 'ignore' });
    try {
      const until = async (fn, ms, what) => { const t = Date.now(); for (;;) { try { const v = await fn(); if (v) return v; } catch (e) {} if (Date.now() - t > ms) throw Error('시간 초과: ' + what); await new Promise(r => setTimeout(r, 300)); } };
      await until(async () => (await fetch(`http://127.0.0.1:${port}/api/hello`)).ok, 15000, 'PC 서버 시작');
      const key = readFileSync(join(pcDir, 'ggm-data/key.txt'), 'utf8').trim(), b3 = await chromium.launch(), p3 = await b3.newPage(), err3 = [];
      p3.on('pageerror', e => err3.push(String(e)));
      await p3.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
      await p3.goto(`http://127.0.0.1:${port}/?pc=${key}`);
      await p3.waitForFunction(() => typeof PCS === 'function' && PCS() && typeof G === 'object', null, { timeout: 15000 });
      const gold = await p3.evaluate(async () => { P().gold += 777; mark('prog'); await flush(); return P().gold; });
      const prog = join(pcDir, 'data/main/prog.json');
      await until(() => JSON.parse(readFileSync(prog, 'utf8')).gold === gold, 30000, '자동 동기화(prog.json)');
      for (const f of ['meta', 'world', 'chars', 'chapters', 'lib', 'game']) assert.ok(JSON.parse(readFileSync(join(pcDir, 'data/main', f + '.json'), 'utf8')), f);
      assert.ok(JSON.parse(readFileSync(join(pcDir, 'data/index.json'), 'utf8')).list);
      const st = JSON.parse(readFileSync(join(pcDir, 'ggm-data/state.json'), 'utf8'));
      assert.ok(!('starfall-contract-v1' in st.ls) && st._dataGames.includes('main'), 'state.json에 게임 본문이 남아 있으면 안 돼요');
      // 빈 기기(새 브라우저 = 빈 IndexedDB)가 접속하면 서버 data 폴더의 게임을 받아 캐시로 씀
      const c4 = await b3.newContext(), p4 = await c4.newPage(); p4.on('pageerror', e => err3.push(String(e)));
      await p4.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
      await p4.goto(`http://127.0.0.1:${port}/?pc=${key}`);
      await until(() => p4.evaluate(() => typeof P === 'function' && P().gold).catch(() => 0).then(v => v === gold), 30000, '빈 기기에서 PC 게임 받기');
      await b3.close(); assert.deepEqual(err3, [], '페이지 오류');
      console.log('ok 6  PC 서버: 앱 저장 → data/main/*.json 자동 동기화, 빈 기기는 서버 data 폴더에서 받아 옴');
    } finally { proc.kill(); }
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
