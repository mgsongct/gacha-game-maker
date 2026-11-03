// 앱을 브라우저에서 띄우는 공통 하네스: www/를 로컬 서버로 열고, 외부 요청(AI·폰트 등)은 모두 막은 페이지에서 fn(page)를 실행.
// playwright가 필요해요(build/test.mjs와 같은 방식으로 찾음). 없으면 hasBrowser()가 false.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const WWW = join(ROOT, 'www'), TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let chromium = null; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) {}
export const hasBrowser = () => !!chromium;

export async function withPage(fn, { tag = 'play', viewport } = {}) {
  if (!chromium) throw new Error('playwright가 없어요: 브라우저 도구(tools/play)는 playwright가 설치된 환경에서만 돌아요');
  const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = join(WWW, p);
    if (!f.startsWith(WWW) || !existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0);
  const b = await chromium.launch(), page = await b.newPage(), errors = [];
  if (viewport) await page.setViewportSize(viewport);
  page.on('pageerror', e => errors.push(String(e))); await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(`http://127.0.0.1:${srv.address().port}/?t=${tag}`);
  await page.waitForFunction(() => typeof buildNewGameDraft === 'function' && typeof G === 'object', null, { timeout: 20000 });
  try { return { out: await fn(page), errors }; } finally { await b.close(); srv.close(); }
}
