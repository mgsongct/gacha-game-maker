// 앱을 브라우저에서 띄우는 공통 하네스. 외부 요청(AI·폰트 등)은 모두 막은 페이지에서 fn(page)를 실행.
// 두 방식:
//  - 기본: www/를 로컬 정적 서버로 엶(빈 브라우저 + 앱 기본 게임)
//  - pcHome: 실제 PC 서버(pc/ggm-server.py)를 그 폴더(PC서버-시작.bat과 같은 경로)에서 켬 — 게임은 그 폴더의 data/<게임id>/<종류>.json(영구 저장소),
//    브라우저 IndexedDB는 캐시. 빈 브라우저로 접속하면 앱이 서버 data에서 게임을 받아 오고(pcPull), 끝나면 앱의 pcPush로 data에 다시 씀.
//    (CLAUDE.md §0의 실제 흐름 그대로 — 게임을 JSON으로 따로 덤프하지 않음)
// playwright가 필요해요(build/test.mjs와 같은 방식으로 찾음). 없으면 hasBrowser()가 false.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, copyFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const WWW = join(ROOT, 'www'), TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let chromium = null, noBrowser = ''; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) { noBrowser = e.message.split('\n')[0]; } // 없는 환경이면 이유를 남겨 둠(hasBrowser()가 false)
export const hasBrowser = () => !!chromium;
export const hasPython = () => spawnSync('python3', ['--version']).status === 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms, what) { const t = Date.now(); for (;;) { const v = await fn().catch(() => null); if (v) return v; if (Date.now() - t > ms) throw new Error('시간 초과: ' + what); await sleep(300); } }

// PC 서버 켜기: pcHome = PC서버-시작.bat·ggm-server.py가 있는 폴더(저장소의 pc/). 서버는 그 폴더의 www/(빌드 결과를 복사 — git에서 뺌)를 띄우고,
// 게임은 그 폴더의 data/에 저장(실제 설치와 같은 배치). pc/가 아닌 폴더를 주면(시험용 설치) 서버 스크립트도 복사
export const PC_DIR = join(ROOT, 'pc');
async function startPC(pcHome, www = WWW) {
  if (!hasPython()) throw new Error('python3가 없어요: PC 서버(pc/ggm-server.py)로 도는 분석 도구는 python3가 필요해요');
  mkdirSync(pcHome, { recursive: true }); if (resolve(pcHome) !== PC_DIR) copyFileSync(join(PC_DIR, 'ggm-server.py'), join(pcHome, 'ggm-server.py')); rmSync(join(pcHome, 'www'), { recursive: true, force: true }); cpSync(www, join(pcHome, 'www'), { recursive: true });
  const port = 20000 + Math.floor(Math.random() * 20000), proc = spawn('python3', ['ggm-server.py', '--no-tunnel', '--no-update'], { cwd: pcHome, env: { ...process.env, GGM_PORT: String(port), BROWSER: 'true' }, stdio: 'ignore' });
  await until(async () => (await fetch(`http://127.0.0.1:${port}/api/hello`)).ok, 15000, 'PC 서버 시작');
  return { port, proc, key: readFileSync(join(pcHome, 'ggm-data/key.txt'), 'utf8').trim() };
}

/* 앱 class 이름(src/main의 맨 위 class 선언): 시험 도구가 Class.이름으로 덮어쓰고 부름 */
export function appClassNames() { const dir = join(ROOT, 'src/main'); return existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.js')).flatMap(f => [...readFileSync(join(dir, f), 'utf8').matchAll(/^class ([A-Z][\w$]*)/gm)].map(m => m[1])) : []; }
export async function withPage(fn, { tag = 'play', viewport, pcHome, gid, www = WWW } = {}) {
  if (!chromium) throw new Error('playwright가 없어요: 브라우저 도구(tools/play)는 playwright가 설치된 환경에서만 돌아요 — ' + noBrowser);
  let srv = null, pc = null, url;
  if (pcHome) { pc = await startPC(resolve(pcHome), www); url = `http://127.0.0.1:${pc.port}/?pc=${pc.key}&t=${tag}`; }
  else { srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = join(www, p);
      if (!f.startsWith(www) || !existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0);
    url = `http://127.0.0.1:${srv.address().port}/?t=${tag}`; }
  const b = await chromium.launch(), page = await b.newPage(), errors = [];
  await page.addInitScript(names => { for (const c of names) if (!(c in window)) window[c] = window; }, appClassNames()); /* 옛 빌드 호환(--ref): 시험 도구가 쓰는 Class.이름 — 새 빌드는 class 선언이 가리고, class가 없는 옛 빌드는 전역 함수(window)로 */
  if (viewport) await page.setViewportSize(viewport);
  page.on('pageerror', e => errors.push(String(e.stack || e).split('\n').slice(0, 4).join(' ← '))); await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  try {
    await page.goto(url);
    await page.waitForFunction(() => typeof buildNewGameDraft === 'function' && typeof G === 'object', null, { timeout: 20000 });
    if (pc) { // 빈 브라우저: 서버 data에 게임이 있으면 앱이 받아 와서 다시 시작함 — 받은 게임이 활성이 될 때까지 기다림
      const has = await fetch(`http://127.0.0.1:${pc.port}/api/store/state`, { headers: { 'X-GGM-Key': pc.key } }).then(r => r.ok).catch(() => false);
      if (has) await until(() => page.evaluate(() => typeof PJ === 'function' && PJ().active !== 'main' && typeof G === 'object' && !!G && Array.isArray(G.chars)), 60000, 'PC 서버 data에서 게임 받기');
      await page.waitForFunction(() => typeof buildNewGameDraft === 'function' && typeof G === 'object' && !!PCS(), null, { timeout: 20000 });
      if (gid && await page.evaluate(id => PJ().active !== id, gid)) { // 그 게임으로 전환(앱의 switchProject — 다시 시작함)
        await page.evaluate(id => { switchProject(id); }, gid).catch(() => {});
        await until(() => page.evaluate(id => typeof PJ === 'function' && PJ().active === id && typeof G === 'object' && !!G && Array.isArray(G.chars) && typeof buildNewGameDraft === 'function', gid), 60000, '게임 전환 ' + gid); } }
    return { out: await fn(page), errors, pc: pc && { port: pc.port } };
  } finally { await b.close(); if (srv) srv.close(); if (pc) pc.proc.kill(); }
}

// 앱의 PC 저장(pcPush)으로 지금 브라우저 캐시를 서버 data 폴더에 씀 — 활성 게임 id를 돌려줌
export async function pcSave(page) { return page.evaluate(async () => { await flush(); await appStorage.drain(); const ok = await pcPush(true, true); return { ok: !!ok, gid: PJ().active }; }); }
