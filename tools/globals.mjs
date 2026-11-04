// 브라우저 전역 이름 목록(정의 안 된 이름 점검의 기준 — tools/lib/extra.mjs undefinedNames): 크로미움 창(window)과 Web Worker(self)의 전역 이름을
//   실제 브라우저에서 읽어 tools/browser-globals.json에 둠(CI에 브라우저가 없어도 점검은 이 파일로). 브라우저를 올렸거나 새 API를 쓰면 다시 만듦
//   node tools/globals.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/browser-globals.json');
const { chromium } = createRequire(import.meta.url)('playwright');
/* 보안 문맥(127.0.0.1)에서 읽어야 파일 저장 창 같은 API까지 보임 */
const server = createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end('<!doctype html><title>g</title>'); }); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(), page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const names = () => { const s = new Set(); for (let o = globalThis; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) for (const k of Object.getOwnPropertyNames(o)) s.add(k); return [...s]; };
const win = await page.evaluate(names), worker = await page.evaluate(async src => { const w = new Worker(URL.createObjectURL(new Blob([`postMessage((${src})())`], { type: 'text/javascript' }))); return await new Promise(r => { w.onmessage = e => r(e.data); }); }, names.toString());
const version = browser.version(); await browser.close(); server.close();
const ok = k => /^[A-Za-z_$][\w$]*$/.test(k);
writeFileSync(OUT, JSON.stringify({ browser: version, window: [...new Set(win)].filter(ok).sort(), worker: [...new Set(worker)].filter(ok).sort() }, null, 0) + '\n');
console.log(`브라우저 전역: ${version} · window ${win.length} · worker ${worker.length} → tools/browser-globals.json`);
