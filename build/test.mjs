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
import { original as upstreamHtml } from './compare.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const original = readFileSync(join(ROOT, 'www/index.html'), 'utf8');
const tmp = mkdtempSync(join(tmpdir(), 'ggm-build-'));
try {
  assert.equal(build(join(ROOT, 'src')), original, 'src 빌드 결과가 www/index.html과 달라요 (node build/build.mjs 실행 필요)');
  console.log('ok 1  src 빌드 == www/index.html');

  split(original, join(tmp, 'rt'));
  assert.equal(build(join(tmp, 'rt')), original);
  console.log('ok 2  split → build 왕복 동일');
  let base = null; try { base = upstreamHtml(); } catch (e) {}
  if (base) { split(base, join(tmp, 'base')); assert.equal(build(join(tmp, 'base')), base); console.log('ok 2b 원본(13a3fe9 = jjhk0803 2026.10.24.1)도 나눴다 합치면 바이트 단위로 같음'); }
  else console.log('skip 2b 원본 커밋 없음(git)');

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

  // 7) 건조/영입 엔진(순수 함수): 등급 개방·확률·역할 편향·레시피·조건·이미지 프롬프트
  const K = createRequire(import.meta.url)(join(ROOT, 'src/modules/app/020-construct.js'));
  const seq = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const low = K.rates([30, 30, 30, 30], {}), mid = K.rates([300, 300, 300, 300], {}), high = K.rates([999, 999, 999, 999], {});
  assert.equal(low.rarity[1], 100); assert.equal(mid.rarity[3], 0); assert.ok(mid.rarity[2] > 0 && !mid.open[3]);
  assert.ok(high.open[3] && Math.abs(high.rarity[3] - 10) < 1e-9 && Math.abs(high.rarity[2] - 40) < 1e-9, JSON.stringify(high.rarity));
  // 분류 캡: 최소 투입은 지원만, 탄약 100↑이면 공격, 합금 100↑이면 방어가 열려요
  const open = t => K.rates(t, {}).groups.filter(g => g.open).map(g => g.id).join();
  assert.equal(open([30, 30, 30, 30]), 'g_sup'); assert.equal(open([30, 100, 30, 30]), 'g_sup,g_atk'); assert.equal(open([30, 100, 100, 30]), 'g_sup,g_atk,g_def');
  const atkHeavy = K.rates([100, 700, 100, 100], {}).groups, gp = id => atkHeavy.find(g => g.id === id).p;
  assert.ok(gp('g_atk') > 60 && gp('g_def') < 20 && Math.abs(atkHeavy.reduce((a, g) => a + g.p, 0) - 100) < 1e-9);
  const pool = [{ id: 'a', rarity: 1, role: 'atk' }, { id: 'd', rarity: 1, role: 'def' }, { id: 's', rarity: 1, role: 'sup' }, { id: 'S', rarity: 3, role: 'sup' }], rng = seq(7), cnt = { a: 0, d: 0, s: 0, S: 0 };
  const tb = K.table([100, 700, 100, 100], {}, pool); assert.ok(Math.abs(tb.rows.reduce((a, r) => a + r.p, 0) - 100) < 1e-9 && !tb.rows.some(r => r.id === 'S'), 'SSR 캡이 닫혀 있으면 SSR은 테이블에 없어요');
  for (let i = 0; i < 3000; i++) cnt[K.roll([100, 700, 100, 100], {}, pool, [], rng).id]++;
  assert.ok(cnt.a > cnt.d * 2.5 && cnt.a > cnt.s * 2.5 && cnt.S === 0, JSON.stringify(cnt));
  assert.ok(K.table([999, 999, 999, 999], {}, pool).rows.some(r => r.id === 'S'), 'SSR 캡이 열리면 테이블에 들어와요');
  const rc = { recipes: [{ id: 'x', name: 'x', min: [100, 600, 100, 100], effect: { type: 'char', value: 'a', up: 3 } }] };
  assert.deepEqual(K.rates([100, 700, 100, 100], rc).recipes.map(r => r.id), ['x']); assert.equal(K.rates([100, 500, 100, 100], rc).recipes.length, 0);
  const shareCfg = { groups: [{ id: 'g', name: 'g', match: {}, min: [30, 30, 30, 30], share: { 3: [0.4, 1] }, weight: { base: 1 } }] };
  assert.equal(K.rates([100, 100, 100, 100], shareCfg).groups[0].open, false); assert.equal(K.rates([100, 100, 100, 300], shareCfg).groups[0].open, true);
  assert.equal(K.roll([30, 30, 30, 30], {}, [{ id: 'z', rarity: 3, role: 'atk' }], [], seq(3)).kind, 'none'); // SSR만 있고 아직 안 열림
  const tpl = { id: 'v', name: '수영복', prompt: 'swimsuit, beach', chance: 100, recipe: { min: [400, 100, 100, 400] } };
  assert.equal(K.roll([400, 100, 100, 400], {}, pool, [{ tpl, bases: [{ id: 'b' }] }], seq(5)).kind, 'variant');
  const ch = { name: '세라', faction: '새벽등대', role: 'atk', elem: '홍', atk: 170, rarity: 3, naiPrompt: '1girl, solo, long crimson hair, amber eyes, black tactical bodysuit, long dark coat, holding sniper rifle, full body', weapon: { prompt: 'no humans, object focus, long sniper rifle with red scope, simple background' } };
  assert.ok(K.condMatch({ factions: ['새벽등대'], stats: [{ k: 'atk', op: '>=', v: 150 }], lv: 10 }, ch, { own: { lv: 12 } }));
  assert.ok(!K.condMatch({ stats: [{ k: 'atk', op: '>=', v: 200 }] }, ch, {}) && !K.condMatch({ cleared: ['s11'] }, ch, { cleared: {} }) && K.condMatch({}, ch, {}));
  const vp = K.variantPrompt(ch, tpl);
  assert.ok(/swimsuit/.test(vp) && /long crimson hair/.test(vp) && /crimson color scheme/.test(vp) && /long sniper rifle with red scope motif/.test(vp) && !/bodysuit|coat|holding/.test(vp), vp);
  console.log('ok 7  건조 엔진: 분류 캡(자원별 최소·비율) 해제로 확률 테이블 구성, 총량으로 희귀도 캡, 특수 레시피·바리에이션·조건·디자인 프롬프트');

  // 10) 원정 엔진: 인지도 등급(배정 → 선택), 컨디션 회복·휴식·저하, 방송·콘텐츠 보상, 경영 실적·평판
  const X = createRequire(import.meta.url)(join(ROOT, 'src/modules/app/030-expedition.js')), H = 3600e3;
  assert.equal(X.tierOf(0, {}).name, '신인'); assert.equal(X.tierOf(700, {}).name, '인기'); assert.equal(X.tierOf(99999, {}).name, '톱');
  const o0 = X.idolOffers(0, {}, seq(11)), o5 = X.idolOffers(5000, {}, seq(11));
  assert.ok(o0.offers.length === 1 && !o0.choice && o0.offers[0].assigned && ['local', 'sign', 'ad'].includes(o0.offers[0].id), JSON.stringify(o0));
  assert.ok(o5.offers.length === 6 && o5.choice && o5.offers.every(x => !x.assigned));
  const payOf = (o, id) => (o.offers.find(x => x.id === id) || {}).pay; const both = o5.offers.find(x => x.id === o0.offers[0].id);
  if (both) assert.ok(both.pay > o0.offers[0].pay * 3, '톱 등급은 보수가 크게 올라요');
  assert.equal(X.condNow({ v: 20, at: 0 }, 2 * H, {}), 32); assert.equal(X.condNow({ v: 20, at: 0, rest: 2 * H }, 2 * H, {}), 56); assert.equal(X.condNow({ v: 50, at: 5 * H }, 2 * H, {}), 50);
  assert.ok(X.condFactor(10, {}) < 1 && X.condFactor(80, {}) === 1);
  const job = { pay: 1000, fame: 10, cond: 20 }; assert.equal(X.idolResult(job, 80, 0, {}).cond, 20); assert.equal(X.idolResult(job, 80, 3, {}).cond, 30); assert.ok(X.idolResult(job, 10, 0, {}).gold < 1000);
  const pf = X.config({}).streamer.platforms, P2 = id => pf.find(x => x.id === id);
  assert.ok(X.streamResult(P2('live'), 2000, 80, {}, () => .5).gold > X.streamResult(P2('live'), 0, 80, {}, () => .5).gold);
  assert.ok(X.streamResult(P2('vod'), 0, 80, {}).lib > 0 && X.streamResult(P2('short'), 0, 80, {}, () => 0).viral);
  const lib = [{ at: 0, base: 1000 }]; assert.ok(X.libIncome(lib, 0, 24 * H, {}) > X.libIncome(lib, 14 * 24 * H, 15 * 24 * H, {}) * 3);
  const chars = { a: { spd: 120, atk: 180, hp: 1200, def: 70 } };
  assert.equal(X.bizPerformance({}, chars, {}, {}).perf, 0);
  const pA = X.bizPerformance({ floor: ['a'] }, chars, { a: 100 }, {}).perf, pB = X.bizPerformance({ floor: ['a'], kitchen: ['a'] }, chars, { a: 100 }, {}).perf;
  assert.ok(pA > 0 && pB > pA); assert.ok(X.bizPerformance({ floor: ['a'] }, chars, { a: 5 }, {}).perf < pA, '컨디션이 낮으면 실적↓');
  const s1 = X.bizSettle(.9, 0, 5, {}), s2 = X.bizSettle(.9, 800, 5, {}), s3 = X.bizSettle(.2, 500, 5, {});
  assert.ok(s1.rep > 0 && s2.gold > s1.gold && s3.rep < 500 && X.bizSettle(.9, 0, 100, {}).hours === 24);
  console.log('ok 10 원정 엔진: 인지도 등급(배정 1건 → 선택 6건·보수↑), 컨디션·휴식·연속 출연, 영상·라이브·숏폼, 경영 실적×평판(파트 합산)');

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
  // 사용자가 압축을 풀고 고친 뒤 다시 묶은 경우: 맨 앞 폴더가 붙고 deflate로 압축돼도 읽혀야 해요
  const rez = await p2.evaluate(async () => {
    const z = await zipRead(window.__ZIP__), entries = [];
    for (const [n, b] of z) { let d = new Uint8Array(await b.arrayBuffer()); if (n.endsWith('chars.json')) { const c = JSON.parse(new TextDecoder().decode(d)); c[0].name = '직접수정'; d = new TextEncoder().encode(JSON.stringify(c)); } entries.push({ name: 'my-folder/' + n, data: d }); }
    const r = await dataReadZip(zipMake(entries)); let bad = '';
    try { await dataReadZip(zipMake(entries.map(e => e.name.endsWith('world.json') ? { ...e, data: new TextEncoder().encode('{oops') } : e))); } catch (e) { bad = e.message; }
    return { name: r.game.chars[0].name, media: r.media.length, bad };
  });
  assert.equal(rez.name, '직접수정'); assert.equal(rez.media, 1); assert.match(rez.bad, /world\.json/);
  await p2.evaluate(() => { appConfirm = async () => true; dataImport(window.__ZIP__); });
  await p2.waitForEvent('load', { timeout: 20000 });
  await p2.waitForFunction(() => typeof PJ === 'function' && typeof G === 'object' && typeof idbGet === 'function', null, { timeout: 15000 });
  const after = await p2.evaluate(async c => { const b = await idbGet(IMGNS + c); return { n: PJ().list.length, active: PJ().active, title: G.meta.title, img: G.chars[0].img, blob: b && b.size }; }, r5.cid);

  // 8) 실제 빌드에서 건조/영입: 켜기 → 시작 자원, 구매, 원정 보상, 일반 건조, 레시피로 바리에이션(AI 없이 규칙 디자인), 뽑기 풀에서 제외
  const p8 = await browser.newPage(), err8 = []; p8.on('pageerror', e => err8.push(String(e)));
  await p8.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p8.goto(`http://127.0.0.1:${server.address().port}/?t=8`);
  await p8.waitForFunction(() => typeof conSave === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r8 = await p8.evaluate(async () => {
    const out = {}; tab = 'studio'; STTAB = 'game'; render(); out.panel = !!document.querySelector('[data-act="contoggle"]');
    openConSet(); document.querySelector('#con_on').checked = true; const fac = document.querySelector('[data-vi="0"] [data-vf="factions"]'); fac.value = G.chars[0].faction; await conSave();
    out.on = conOn(); out.start = { ...CRES() }; out.cond = VARIANTS()[0].cond.factions;
    P().gems = 10000; conBuy('res1'); out.bought = CRES().res1 - out.start.res1; out.gems = P().gems;
    out.disp = Object.keys(dispOffer([]).reward).filter(k => /^res/.test(k)).length;
    const base = G.chars[0]; if (!own(base.id)) grantOwned(base, 't'); conMeta().recipes = []; // 레시피 편향 없이
    tab = 'construct'; render(); out.page = !!document.querySelector('[data-act="conbuild"]');
    Math.random = (() => { let s = 42; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const before = CRES().res2; [30, 30, 30, 30].forEach((v, i) => { document.querySelector('#con_' + i).value = v; }); await conBuild(); out.spent = before - CRES().res2; out.n1 = CBUILD().n;
    VARIANTS().forEach(t => { t.chance = t.id === 'v_swim' ? 100 : 0; }); CRES().res1 += 1000; CRES().res4 += 1000;
    [400, 100, 100, 400].forEach((v, i) => { document.querySelector('#con_' + i).value = v; }); await conBuild();
    const v = G.chars.find(x => x.cvar === 'v_swim'), vb = v && charById(v.alt); out.variant = v && { base: vb && vb.name, baseOwned: !!(vb && own(vb.id)), name: v.name, owned: !!own(v.id), prompt: v.naiPrompt, inGacha: bannerPool(G.banners[0]).includes(v) };
    out.found = !!CBUILD().found['v:v_swim']; out.log = CBUILD().log.length; return out;
  });
  assert.ok(r8.panel && r8.on && r8.page, JSON.stringify(r8));
  assert.ok(Object.values(r8.start).every(v => v >= 600)); assert.equal(r8.bought, 300); assert.equal(r8.gems, 10000 - 60); assert.equal(r8.disp, 2); assert.equal(r8.spent, 30); assert.equal(r8.n1, 1);
  assert.ok(r8.variant && r8.variant.owned && r8.variant.baseOwned && r8.variant.name === r8.variant.base + '(수영복)' && /swimsuit/.test(r8.variant.prompt) && !r8.variant.inGacha, JSON.stringify(r8.variant));
  assert.ok(r8.found && r8.log === 2 && r8.cond.length === 1); assert.deepEqual(err8, [], '페이지 오류');
  console.log(`ok 8  건조/영입: 켜기·시작 자원·가챠돌 구매·원정 보상·일반 건조·레시피 바리에이션(${r8.variant.name})·뽑기 제외`);

  // 9) 상속형 이격: 수정치만 저장, 원본을 고치면 안 바꾼 항목은 같이 바뀜, 바꾼 항목은 유지, 능력치는 가중치로
  const p9 = await browser.newPage(), err9 = []; p9.on('pageerror', e => err9.push(String(e)));
  await p9.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const url9 = `http://127.0.0.1:${server.address().port}/?t=9`; await p9.goto(url9);
  await p9.waitForFunction(() => typeof inheritDiff === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r9 = await p9.evaluate(async () => {
    const b = G.chars.find(c => !c.alt && !c.cvar), a = cleanChar({ ...JSON.parse(JSON.stringify(b)), name: b.name + '(테스트)' });
    a.alt = b.id; Object.assign(a, { faction: b.faction, role: b.role, skills: JSON.parse(JSON.stringify(b.skills)), profile: b.profile, lines: b.lines, touch: b.touch, affLines: b.affLines, lvLines: b.lvLines, dupLines: b.dupLines, files: b.files, intro: b.intro, rarity: b.rarity, skill: b.skill, age: b.age, hp: b.hp, def: b.def, spd: b.spd });
    a.elem = ELEMS.find(e => e !== b.elem); a.atk = Math.round(b.atk * 1.2); G.chars.push(a); mark('c:' + a.id);
    const o = { over: Object.keys(a.over).sort(), mul: a.over.statMul };
    b.faction = '상속테스트'; b.elem = ELEMS.find(e => e !== b.elem && e !== a.elem); b.atk = b.atk + 50; b.skills.passive.name = '원본스킬수정'; mark('c:' + b.id);
    o.faction = a.faction; o.elemKept = a.elem !== b.elem; o.atk = [a.atk, Math.round(b.atk * a.over.statMul.atk)]; o.skill = a.skills.passive.name;
    await flush(); const stored = JSON.parse(appStorage.getItem(LKEY)).chars.find(c => c.id === a.id);
    o.stored = { faction: 'faction' in stored, atk: 'atk' in stored, skills: 'skills' in stored, elem: stored.elem === a.elem, over: !!stored.over, name: stored.name };
    o.html = inheritHTML(a).includes('data-act="inhreset"'); window.__A = a.id; window.__B = b.id; return o;
  });
  await p9.reload(); await p9.waitForFunction(() => typeof G === 'object' && typeof inheritReset === 'function', null, { timeout: 15000 });
  const r9b = await p9.evaluate(() => { const a = charById(window.__A || ''), id = a ? a.id : G.chars.find(c => c.alt && c.over && c.name.endsWith('(테스트)')).id, x = charById(id), b = charById(x.alt);
    const o = { faction: x.faction, base: b.faction, skill: x.skills.passive.name, elemDiff: x.elem !== b.elem, atk: x.atk === Math.round(b.atk * x.over.statMul.atk) };
    inheritReset(x, 'elem'); o.reset = x.elem === b.elem && !('elem' in x.over);
    o.orphan = (() => { const ids = new Set(); return Object.keys(inheritStore(x, ids)).includes('faction'); })(); // 원본이 없으면 전체 저장
    return o; });
  assert.ok(r9.over.includes('elem') && !r9.over.includes('faction') && r9.mul && r9.mul.atk === 1.2, JSON.stringify(r9));
  assert.equal(r9.faction, '상속테스트'); assert.ok(r9.elemKept); assert.equal(r9.atk[0], r9.atk[1]); assert.equal(r9.skill, '원본스킬수정');
  assert.ok(!r9.stored.faction && !r9.stored.atk && !r9.stored.skills && r9.stored.elem && r9.stored.over && r9.html, JSON.stringify(r9.stored));
  assert.ok(r9b.faction === '상속테스트' && r9b.base === '상속테스트' && r9b.skill === '원본스킬수정' && r9b.elemDiff && r9b.atk && r9b.reset && r9b.orphan, JSON.stringify(r9b));
  assert.deepEqual(err9, [], '페이지 오류');
  console.log('ok 9  상속형 이격: 저장은 수정치만(over), 원본 수정(소속·스킬·능력치)이 이격에 반영, 바꾼 속성은 유지, 되돌리기, 다시 열어도 같음');

  // 11) 원정 모드별 실제 흐름: 방송 출연(배정→출연→보상·인지도, 휴식, 톱이면 선택), 스트리머(영상→라이브러리 수익), 경영(배치→정산·평판), 전투 불가
  const p11 = await browser.newPage(), err11 = []; p11.on('pageerror', e => err11.push(String(e)));
  await p11.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p11.goto(`http://127.0.0.1:${server.address().port}/?t=11`);
  await p11.waitForFunction(() => typeof exSave === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r11 = await p11.evaluate(async () => {
    const o = {}, setMode = async m => { openExSet(); document.querySelector(`[name=ex_mode][value=${m}]`).checked = true; appConfirm = async () => true; await exSave(); };
    const c = G.chars.filter(x => !x.alt)[0]; if (!own(c.id)) grantOwned(c, 't'); const id = c.id, back = (jid, h) => { EXS().jobs[jid].start -= h * 3600e3; };
    await setMode('idol'); tab = 'disp'; render(); o.idolPage = !!document.querySelector('[data-act="exjob"]');
    const off = exOffers(id); o.assigned = off.offers.length === 1 && !off.choice; const g0 = P().gold, c0 = exCond(id);
    exStart(id, off.offers[0]); o.busy = busyIds().has(id); o.condDrop = c0 - (EXS().cond[id].v); const jid = Object.keys(EXS().jobs)[0]; back(jid, 10); exClaim(jid);
    o.gold = P().gold > g0; o.fame = EXS().fame[id] > 0; exRest(id, 4); o.resting = exResting(id) && busyIds().has(id);
    EXS().fame[id] = 5000; delete EXS().offers[id]; EXS().cond[id] = { v: 90, at: Date.now() }; const top = exOffers(id); o.top = top.choice && top.offers.length > 1; render(); o.topPage = document.querySelectorAll('[data-act="exjob"]').length > 1;
    await setMode('streamer'); render(); o.streamPage = !!document.querySelector('[data-act="exstream"]');
    exStart(id, EXC().streamer.platforms.find(p => p.kind === 'vod')); const j2 = Object.keys(EXS().jobs)[0]; back(j2, 10); exClaim(j2); o.lib = EXS().lib.length;
    EXS().libAt -= 24 * 3600e3; EXS().lib.forEach(v => { v.at -= 24 * 3600e3; }); const g1 = P().gold; exLibSettle(); o.libGold = P().gold > g1;
    await setMode('business'); render(); o.bizPage = !!document.querySelector('[data-exassign]');
    exAssign('floor', 0, id); o.bizBusy = busyIds().has(id); EXS().biz.at -= 5 * 3600e3; EXS().cond[id].at -= 5 * 3600e3; EXS().biz.rep = 500; const g2 = P().gold, rep0 = EXS().biz.rep;
    exBizSettle(true); o.bizGold = P().gold > g2; o.repMoved = EXS().biz.rep !== rep0; o.bizCond = exCond(id) < 100;
    await setMode('combat'); render(); o.combatPage = !!document.querySelector('[data-act="dispset"],[data-act="dispredo"]'); o.freed = !busyIds().has(id);
    return o; });
  assert.ok(Object.values(r11).every(v => v === true || (typeof v === 'number' && v > 0)), JSON.stringify(r11)); assert.deepEqual(err11, [], '페이지 오류');
  console.log('ok 11 원정 모드: 방송 출연(배정→출연→보수·인지도·컨디션, 휴식, 톱이면 선택), 스트리머(영상 라이브러리 수익), 경영(배치·정산·평판), 일하는 중 전투 불가');

  // 12) 콘텐츠 점검·업그레이드: 빠진 것·구버전 감지 → 자동 변환·AI 채우기·지정 변환·스테이지 대본, 되돌리기, 새 캐릭터 생성 버전
  const p12 = await browser.newPage(), err12 = []; p12.on('pageerror', e => err12.push(String(e)));
  await p12.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p12.goto(`http://127.0.0.1:${server.address().port}/?t=12`);
  await p12.waitForFunction(() => typeof auditScan === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r12 = await p12.evaluate(async () => {
    const o = {}, A0 = G.chars.filter(c => !c.alt)[0], A = cleanChar({ ...JSON.parse(JSON.stringify(A0)), name: '구버전캐릭' }); G.chars.push(A); o.sampleNotOld = !auditScan().some(g => g.rule.id === 'c_old' && g.items.includes(A0)); const R = id => AUDIT_RULES.find(r => r.id === id), has = (id, x) => (auditScan().find(g => g.rule.id === id) || { items: [] }).items.includes(x);
    A.lines = []; A.naiPrompt = (A.naiPrompt || '1girl, solo') + ', mature female'; delete A.genVer; delete A.symColor; delete A.symItem; mark('c:' + A.id);
    const st = G.chapters.find(c => c.kind === 'main').stages[0]; const preBefore = st.pre; st.pre = '';
    o.detect = has('c_lines', A) && has('c_age', A) && has('c_old', A) && has('c_symbol', A) && has('s_script', st);
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="audopen"]') && !!document.body.innerHTML.includes('생성 기능 향상');
    await auditFix(R('c_age'), [A]); o.ageFixed = !has('c_age', A); await auditFix(R('c_symbol'), [A]); o.symbol = !!A.symColor;
    auditUndo(); o.undo = !A.symColor && has('c_symbol', A);
    let asked = ''; SAMPLE = { json: async p => { asked = p; return /"pre"/.test(p) ? { pre: '[사무소]\n세라: 시작하자.' } : /다음 지시대로/.test(p) ? { lines: ['반말1', '반말2', '반말3'] } : { lines: ['대사1', '대사2', '대사3', '대사4'] }; } };
    await auditFix(R('c_lines'), [A]); o.aiFill = A.lines.length === 4 && !has('c_lines', A) && /평소 대사/.test(asked);
    await auditConvert([A], ['lines'], '대사를 모두 반말로'); o.convert = A.lines[0] === '반말1'; auditUndo(); o.convertUndo = A.lines[0] === '대사1';
    await auditFix(R('s_script'), [st]); o.stage = /세라: 시작하자/.test(st.pre); st.pre = preBefore;
    await auditFix(R('c_old'), [A]); o.stamped = A.genVer === auditGenVer() && !has('c_old', A); closeModal();
    o.newChar = cleanChar({ name: '새캐릭' }).genVer === auditGenVer();
    openAudit(); o.seen = G.meta.auditSeen === auditVer() && !!document.querySelector('[data-act="audconv"]'); closeModal();
    return o; });
  assert.ok(Object.values(r12).every(v => v === true), JSON.stringify(r12)); assert.deepEqual(err12, [], '페이지 오류');
  console.log('ok 12 콘텐츠 점검: 빠진 대사·나이 태그·상징·구버전·빈 대본 감지 → 자동 변환·AI 채우기·지정 변환·되돌리기, 새 캐릭터 genVer');

  // 13) 게임 규칙: 속성 추가·제거·상성표·반응, 포지션(프리셋·기능·배정), 기본형 능력치, 진영 시너지, 관계 → 전투 엔진·캐릭터 화면·도감, 다시 열어도 유지
  const p13 = await browser.newPage(), err13 = []; p13.on('pageerror', e => err13.push(String(e)));
  await p13.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p13.goto(`http://127.0.0.1:${server.address().port}/?t=13`);
  await p13.waitForFunction(() => typeof openRules === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r13 = await p13.evaluate(async () => {
    const o = {}, E = G.meta.elems.map(e => e.n), set = (k, v) => { const el = document.querySelector(`#modal [data-rk="${k}"]`); if (!el) throw Error('no ' + k); el.value = v; }, click = (act, k) => document.querySelector(`#modal [data-act="${act}"]${k ? `[data-k="${k}"]` : ''}`).click();
    const om = v2Options().elemMat; o.defaults = om[E[0]][E[1]] === 1.5 && om[E[1]][E[0]] === .75 && om[E[0]][E[2]] === .75 && POSITIONS().length === 3 && posOf(G.chars[0]).base === G.chars[0].role;
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="rulesopen"]');
    openRules(); set('adv', '2'); set('e.0.d', '불꽃의 힘'); click('rulesadd', 'elem'); set('e.3.n', '광'); set('e.3.beat', E[0]); set('e.0.beat', E[2]); set(`g.${E[1]}.${E[2]}`, '1.3');
    click('rulesadd', 'reaction'); set('r.0.a', E[0]); set('r.0.b', E[2]); set('r.0.name', '증기 폭발'); set('r.0.type', 'burst'); set('r.0.value', '2'); document.querySelector('#modal [data-rk="r.0.both"]').checked = true;
    click('rulespreset', 'squad8'); set('syn.n', '2'); set('syn.atk', '10'); click('rulesadd', 'rel'); set('l.0.by', 'pos'); set('l.0.a', '방벽'); set('l.0.b', '사수'); set('l.0.mul', '1.4');
    click('rulessave');
    const m = v2Options().elemMat; o.elems = G.meta.elems.length === 4 && BEATS[E[0]] === E[2] && BEATS['광'] === E[0] && m[E[0]][E[2]] === 2 && m[E[1]][E[2]] === 1.3 && m['광'][E[0]] === 2 && m[E[2]][E[0]] === 2 && m[E[0]]['광'] === .75; // 3→1도 기본 순환대로 남아 서로 유리
    o.pos = POSITIONS().length === 8 && G.chars.every(c => posById(c.pos) && posById(c.pos).base === c.role);
    const rel = v2Options().rel[0], wall = POSITIONS().find(p => p.name === '방벽'), snipe = POSITIONS().find(p => p.name === '사수'); o.rel = rel.by === 'pos' && rel.a === wall.id && rel.b === snipe.id;
    // 실제 전투 엔진: 포지션 기능(방벽 체력 +15%), 반응(순서 무관 증기 폭발), 시너지
    const kit = () => GGMCombat.generationDefaults({ role: 'atk' }), mk = (name, elem, pos, f) => ({ name, role: 'atk', pos, elem, faction: f, hp: 1000, atk: 100, def: 50, spd: 100, kit: GGMCombat.normalize(kit()), baseKit: GGMCombat.normalize(kit()), ready: {} });
    const sim = GGMCombat.create([mk('a', E[0], wall.id, 'F'), mk('b', E[2], snipe.id, 'F')], [{ ...mk('e', E[1], '', ''), hp: 99999, maxhp: 99999 }], { ...v2Options(), seed: 3 });
    o.trait = sim.allies[0].maxhp === 1150 && sim.allies[0].posT.threat === 80; o.synergy = sim.allies[1].atk === 110;
    for (let i = 0; i < 400 && !sim.winner; i++) GGMCombat.step(sim); o.reaction = sim.allies.some(u => (u.reactions || 0) > 0);
    const html = rulesCharHTML(G.chars.find(c => c.elem === E[0]) || G.chars[0]); o.charLine = html.includes('포지션') && (html.includes('증기 폭발') || !G.chars.some(c => c.elem === E[0]));
    G.chars[0].elem = '광'; mark('c:' + G.chars[0].id); openRules(); // 4번째 속성(광) 삭제 → 그 속성 캐릭터는 첫 속성으로
    document.querySelector('#modal [data-act="rulesedel"][data-i="3"]').click(); click('rulessave');
    o.removed = G.meta.elems.length === 3 && !G.meta.elems.some(e => e.n === '광') && G.chars[0].elem === G.meta.elems[0].n && !('광' in BEATS);
    openCharEdit(G.chars[1].id); o.editPos = document.querySelectorAll('#f_pos option').length === 8; closeModal();
    openRules(); click('rulescodex'); o.codex = ['[규칙] 포지션', '[규칙] 속성 반응', '[규칙] 진영 시너지', '[규칙] 관계'].every(t => G.world.codex.some(x => x.title === t)); closeModal();
    const nc = cleanChar({ name: '새', pos: '의무', role: 'atk' }); o.newChar = posById(nc.pos).name === '의무' && nc.role === 'sup';
    await flush(); return o; });
  await p13.reload(); await p13.waitForFunction(() => typeof G === 'object' && typeof rulesOptions === 'function', null, { timeout: 15000 });
  const r13b = await p13.evaluate(() => ({ desc: G.meta.elems[0].d === '불꽃의 힘', n: G.meta.elems.length === 3, adv: rulesOptions().elemAdv === 2, pos: POSITIONS().length === 8, react: rulesOptions().reactions[0].name === '증기 폭발' }));
  assert.ok(Object.values(r13).every(v => v === true), JSON.stringify(r13)); assert.ok(Object.values(r13b).every(v => v === true), JSON.stringify(r13b)); assert.deepEqual(err13, [], '페이지 오류');
  console.log('ok 13 게임 규칙: 속성 추가·제거·상성표·반응(엔진에서 발동), 포지션 프리셋·기능(엔진 반영)·자동 배정·편집, 시너지·관계, 도감, 다시 열어도 유지');

  // 14) 밸런스: 능력치 편차 점검·보수(성향 유지), 생성 시 자동 보정, 세대 정책(고정·자동 상승), 구캐릭터 AS(전투 보정·리마스터), 점검 규칙, 되돌리기
  const p14 = await browser.newPage(), err14 = []; p14.on('pageerror', e => err14.push(String(e)));
  await p14.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p14.goto(`http://127.0.0.1:${server.address().port}/?t=14`);
  await p14.waitForFunction(() => typeof openBalance === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r14 = await p14.evaluate(async () => {
    const o = {}, mkc = x => { const c = cleanChar(x); G.chars.push(c); return c; };
    G.meta.balance = { autoNorm: false }; const big = mkc({ name: '과잉', role: 'atk', rarity: 1, hp: 2000, atk: 200, def: 120, spd: 100 });
    o.detect = balInfo(big).statOut && auditScan().some(g => g.rule.id === 'c_statband' && g.items.includes(big));
    const ratio = big.hp / big.atk, spd = big.spd; openBalance(); document.querySelectorAll('[data-bal]').forEach(x => { x.checked = x.dataset.bal === big.id; });
    await balFix('edge'); o.edge = Math.abs(balDev(big)) <= .151 && big.spd === spd && Math.abs(big.hp / big.atk - ratio) / ratio < .05;
    const pick = () => document.querySelectorAll('[data-bal]').forEach(x => { x.checked = x.dataset.bal === big.id; }); pick(); await balFix('center'); o.center = Math.abs(balDev(big)) < .02; auditUndo(); o.undo = Math.abs(balDev(big)) > .01 && Math.abs(balDev(big)) <= .151;
    G.meta.balance = { autoNorm: true }; const auto = mkc({ name: '자동', role: 'atk', rarity: 2, hp: 2000, atk: 200, def: 120 }); o.autoNorm = Math.abs(balDev(auto)) <= .151;
    G.meta.balance = { creep: 'fixed', baseGen: 2 }; o.fixed = v2CurrentGeneration() === 2 && mkc({ name: '고정', role: 'sup' }).generation === 2;
    G.meta.balance = { creep: 'auto', baseGen: 1, per: 2, maxGen: 3, released: 0 }; const g = [1, 2, 3, 4, 5].map(i => mkc({ name: 'a' + i, role: 'atk' }).generation); o.auto = JSON.stringify(g) === '[1,1,2,2,3]' && v2CurrentGeneration() === 3;
    const old = G.chars.find(c => c.name === 'a1');
    G.meta.balance = Object.assign(G.meta.balance, { catchUp: 'boost', pct: 10, max: 30 }); const op = v2Options(); o.boostOpt = op.genBoost.cur === 3 && op.genBoost.pct === 10;
    const kit = GGMCombat.normalize(GGMCombat.generationDefaults({ role: 'atk' })), u = (c, gen) => ({ name: 'u', role: 'atk', elem: G.meta.elems[0].n, hp: 1000, atk: 100, def: 50, spd: 100, kit, baseKit: kit, ready: {}, c: { ...c, generation: gen } });
    const sim = GGMCombat.create([u(old, 1), u(old, 3)], [{ ...u(old, 3), c: null }], { ...op, seed: 2 }); o.boost = sim.allies[0].maxhp === 1200 && sim.allies[1].maxhp === 1000;
    G.meta.balance = Object.assign(G.meta.balance, { catchUp: 'remaster', lag: 1 }); o.lagDetect = auditScan().some(gr => gr.rule.id === 'c_genlag' && gr.items.includes(old)); o.remaster = balRemaster(old) && old.generation === 2 && !old.skillBalance;
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="balopen"]'); openBalance(); o.modal = !!document.querySelector('#bal_creep') && document.querySelectorAll('[data-bal]').length >= 8; closeModal();
    return o; });
  assert.ok(Object.values(r14).every(v => v === true), JSON.stringify(r14)); assert.deepEqual(err14, [], '페이지 오류');
  console.log('ok 14 밸런스: 능력치 편차 점검·보수(성향 유지·기준값)·생성 시 자동 보정, 세대 고정·자동 상승, 구캐릭터 AS 전투 보정(엔진)·리마스터, 점검 규칙, 되돌리기');

  // 15) 캐릭터 개성·매력: 개성 시트·프로필 템플릿·검수(빠짐·흔함·겹침·말투), AI 채우기·다듬기, 인연 톡(호감도 해금), 메모리얼(로비 대사), 상속, 점검 규칙
  const p15 = await browser.newPage(), err15 = []; p15.on('pageerror', e => err15.push(String(e)));
  await p15.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p15.goto(`http://127.0.0.1:${server.address().port}/?t=15`);
  await p15.waitForFunction(() => typeof personaReview === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r15 = await p15.evaluate(async () => {
    const o = {}, sera = charById('sera'); o.sample = !!(sera.persona && sera.persona.gap) && personaReview(sera).score > 40 && ctx().includes('반전 매력');
    const copy = cleanChar({ name: '복사', role: 'atk', persona: sera.persona, lines: sera.lines }); G.chars.push(copy); o.dup = personaReview(copy).issues.some(x => x.msg.includes('세라'));
    const gen = cleanChar({ name: '흔함', role: 'sup', persona: { traits: ['밝음', '친절', '상냥'], ending: '~냥' }, lines: ['안녕하세요', '좋은 아침', '힘내요'] }); G.chars.push(gen);
    const rg = personaReview(gen); o.generic = rg.issues.some(x => x.msg.includes('흔해요')) && rg.issues.some(x => x.msg.includes('말투')) && rg.score < personaReview(sera).score;
    SAMPLE = { json: async p => /인연 톡/.test(p) ? { threads: [2, 4, 6, 8].map(lv => ({ lv, title: '톡' + lv, script: `흔함: 안녕~냥 ${lv}\n선택: 응 | 아니` })) } : /메모리얼/.test(p) ? { title: '별빛 약속', script: '[옥상]\n흔함: 고마워~냥', lines: ['기억할게~냥', '또 와~냥'] } : { persona: { traits: ['겁 많은 수호자', '고양이 말투', '밤샘 연구'], self: '나', ending: '~냥', quirk: '냥냥', catch: '지켜줄게~냥', gap: '겁쟁이인데 위기에선 제일 앞에 선다', flaw: '거절을 못 한다', want: '평온한 하루', fear: '천둥' }, pfields: { 생일: '3월 3일', 신장: '158cm' }, lines: ['좋은 아침이다~냥', '지켜줄게~냥', '냥냥, 힘내자', '천둥은 싫어~냥'] } };
    await personaAI(gen, 'fill'); o.fill = gen.persona.gap && gen.persona.traits.includes('밝음') && gen.pfields.생일 === '3월 3일';
    await personaAI(gen, 'improve', { lines: true }); o.improve = gen.persona.traits.includes('겁 많은 수호자') && gen.lines[0] === '좋은 아침이다~냥' && personaReview(gen).score > rg.score;
    if (!own(gen.id)) grantOwned(gen, 't'); const n = await talkAffGen(gen); o.talk = n === 4 && affThreads(gen).length === 4;
    const ok = await memorialGen(gen); o.memo = ok && gen.memorial.lv === 8 && !memoOpen(gen);
    P().seenOpening = true; addAff(gen, 100000); checkTriggers(true); o.unlock = memoOpen(gen) && affThreads(gen).every(t => P().inbox[t.id]);
    P().memoOn = { [gen.id]: true }; o.lobby = affLinePool0(gen).includes('기억할게~냥');
    const alt = cleanChar({ name: '흔함(수영복)', role: 'sup', persona: gen.persona }); alt.alt = gen.id; G.chars.push(alt); mark('c:' + alt.id); gen.persona = { ...gen.persona, catch: '원본이 바꾼 대사' }; mark('c:' + gen.id); o.inherit = alt.persona.catch === '원본이 바꾼 대사';
    openChar(gen.id); o.infoTab = document.body.innerHTML.includes('개성') && document.body.innerHTML.includes('인연 톡'); closeModal();
    openPersona(gen.id); document.querySelector('[data-ps="catch"]').value = '바꾼 대사'; document.querySelector('[data-act="pssave"]').click(); o.edit = gen.persona.catch === '바꾼 대사'; closeModal();
    const hanna = charById('hanna'); o.audit = auditScan().some(g => g.rule.id === 'c_afftalk' && g.items.includes(hanna)) && auditScan().some(g => g.rule.id === 'c_memorial' && g.items.includes(hanna));
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="psopen"]'); openPersonaAll(); document.querySelector('#ps_tpl').value = 'idol'; document.querySelector('#ps_tpl').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('[data-act="pscfg"]').click(); o.tpl = PERSONA_CFG().tpl.includes('팬덤 이름'); closeModal();
    return o; });
  assert.ok(Object.values(r15).every(v => v === true), JSON.stringify(r15)); assert.deepEqual(err15, [], '페이지 오류');
  console.log('ok 15 캐릭터 개성: 개성 시트·검수(겹침·흔함·말투)·AI 채우기·다듬기, 인연 톡(호감도 해금), 메모리얼(로비 대사), 상속, 점검 규칙, 프로필 템플릿');
  // 16) 시나리오 설계: 막·반전(복선→공개)·분기 → 장 프롬프트에 그 장에 필요한 것만, 대본 [분기: id] 선택이 플래그로 남아 다음 장에 반영, 점검, AI 설계, 편집 화면
  const p16 = await browser.newPage(), err16 = []; p16.on('pageerror', e => err16.push(String(e)));
  await p16.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p16.goto(`http://127.0.0.1:${server.address().port}/?t=16`);
  await p16.waitForFunction(() => typeof planCtx === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r16 = await p16.evaluate(async () => {
    const o = {}; o.empty = planCtx(1) === '';
    G.world.plan = { logline: '잃어버린 별을 찾는 여정', theme: '신뢰', ending: '별을 되찾는다', acts: [{ name: '1막 만남', upto: 3, goal: '동료를 모은다' }, { name: '2막 균열', upto: 6, goal: '배신이 드러난다' }],
      twists: [{ id: 't1', truth: '안내인이 적의 첩자다', reveal: 5, who: '안내인', clues: [{ ch: 2, hint: '안내인이 밤마다 사라진다' }, { ch: 4, hint: '적이 우리 경로를 안다' }] }],
      branches: [{ id: 'b1', at: 2, question: '안내인을 믿을까', options: [{ label: '믿는다', result: '안내인이 마음을 연다' }, { label: '의심한다', result: '안내인과 거리가 생긴다' }] }], arcs: [{ name: '세라', start: '혼자 싸움', change: '동료를 의지', end: '앞장서는 리더' }] };
    const c2 = planCtx(2), c5 = planCtx(5);
    o.ctx2 = c2.includes('1막 만남') && c2.includes('밤마다 사라진다') && c2.includes('아직 밝히지 말 진실') && c2.includes('[분기: id]') && c2.includes('b1') && !c2.includes('적이 우리 경로를 안다');
    o.ctx5 = c5.includes('2막 균열') && c5.includes('이번 장에서 밝힐 반전: 안내인이 적의 첩자다') && !c5.includes('아직 밝히지 말 진실');
    o.wired = aiChapterGen0.toString().includes('planCtx(k+1)');
    playStory('분기 시험', '세라: 어떻게 할까?\n[분기: b1]\n선택: 믿는다 | 의심한다\n세라: 알겠어');
    for (let i = 0; i < 8 && !document.querySelector('[data-act="vnpick"]'); i++) { document.querySelector('#vn').click(); await new Promise(r => setTimeout(r, 30)); if (S && S.typing) document.querySelector('#vn').click(); }
    document.querySelector('[data-act="vnpick"][data-n="2"]').click(); o.flag = P().flags.b1 && P().flags.b1.n === 2 && !S.branch; vnEnd && vnEnd();
    const c3 = planCtx(3); o.after = c3.includes('「의심한다」') && c3.includes('거리가 생긴다');
    const iss = planCheck(); o.check = iss.some(x => x.includes('[분기: b1]')) === (G.chapters.filter(c => c.kind === 'main').length >= 2) && planCheck().length >= 0;
    G.world.plan.twists.push({ id: 't2', truth: '복선 없는 반전', reveal: 3, clues: [] }); o.check2 = planCheck().some(x => x.includes('복선이 없어요'));
    SAMPLE = { json: async p => /메인 시나리오를/.test(p) ? { logline: '새 로그라인', acts: [{ name: '3막 귀환', upto: 9, goal: '결착' }], twists: [{ id: 't9', truth: '별은 처음부터 곁에 있었다', reveal: 9, clues: [{ ch: 7, hint: '세라의 목걸이가 빛난다' }] }], branches: [], arcs: [] } : {} };
    await planAI('extend'); o.extend = G.world.plan.acts.length === 3 && G.world.plan.twists.some(t => t.id === 't9') && G.world.plan.logline === '잃어버린 별을 찾는 여정';
    openPlan(); document.querySelector('[data-pl="logline"]').value = '바뀐 로그라인'; document.querySelector('[data-pl="t.0.clues"]').value = '1 | 첫 복선\n2 | 둘째 복선'; document.querySelector('[data-act="plansave"]').click();
    o.edit = G.world.plan.logline === '바뀐 로그라인' && G.world.plan.twists[0].clues.length === 2 && G.world.plan.twists[0].clues[0].hint === '첫 복선'; closeModal();
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="planopen"]');
    return o; });
  assert.ok(Object.values(r16).every(v => v === true), JSON.stringify(r16)); assert.deepEqual(err16, [], '페이지 오류');
  console.log('ok 16 시나리오 설계: 막·반전(복선→공개 장)·분기·아크 → 장마다 필요한 설계만 프롬프트에, [분기: id] 선택이 플래그로 남아 다음 장에 반영, 점검, AI 설계(잇기), 편집');
  // 17) 프롬프트 스튜디오: 조각 덮어쓰기·덧붙이기·기본으로, 그림 가드(배경·소품의 사람 태그 제거), 교훈 기록 → llmWrap 주입, 점검 규칙, 화면
  const p17 = await browser.newPage(), err17 = []; p17.on('pageerror', e => err17.push(String(e)));
  await p17.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p17.goto(`http://127.0.0.1:${server.address().port}/?t=17`);
  await p17.waitForFunction(() => typeof imgGuard === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r17 = await p17.evaluate(async () => {
    const o = {}, base = BATTLE_FLOW; o.frags = ['SCRIPT_FMT', 'THREAD_FMT', 'NAI_CHAR', 'TITLE_RULE', 'BATTLE_FLOW', 'JSON_STRICT', 'POS_RULE', 'IMG_GUIDE'].every(k => window.__PF[k] && String(window[k]).length > 20);
    pfSet('BATTLE_FLOW', { text: '전투는 짧게', add: '' }); o.over = BATTLE_FLOW === '전투는 짧게'; pfSet('BATTLE_FLOW', { text: '', add: '추가 규칙' }); o.add = BATTLE_FLOW === base + '\n추가 규칙'; pfSet('BATTLE_FLOW', null); o.reset = BATTLE_FLOW === base;
    const g = imgGuard('bg', '1girl, solo, long hair, red eyes, forest, night, moonlight'); o.guard = g.out.startsWith('no humans, scenery') && !/1girl|long hair|red eyes|solo/.test(g.out) && g.out.includes('forest') && g.removed.length === 4;
    const gp = imgGuard('prop', 'holding, 1girl, sword, gold hilt'); o.prop = gp.out.startsWith('no humans, object focus') && gp.out.includes('gold hilt') && !gp.out.includes('holding');
    o.charSafe = imgGuard('char', '1girl, long hair').out === '1girl, long hair';
    try { appStorage.removeItem('ggm-plessons'); } catch (e) {}
    const ci = composeNai('bg', '1boy, short hair, ruined city', {}).input; o.compose = !/1boy|short hair/.test(ci) && ci.includes('ruined city') && plList().some(l => l.id === 'img-person-bg' && l.hits === 1);
    const w = llmWrap('배경 NovelAI 영어 태그를 써라\nJSON만 출력: {}'); o.inject = w.includes('[프롬프트 교훈]') && w.includes('no humans, scenery') && w.indexOf('[프롬프트 교훈]') < w.indexOf('JSON만 출력');
    o.noTag = !llmWrap('대사를 써라\nJSON만 출력: {}').includes('[프롬프트 교훈]');
    plAdd('실제 게임 이름을 쓰지 않는다', 'all'); o.all = llmWrap('대사를 써라\nJSON만 출력: {}').includes('실제 게임 이름을 쓰지 않는다');
    const bg = { id: uid(), kind: 'bg', name: '숲', prompt: '1girl, smile, forest' }; G.lib.push(bg);
    o.audit = auditScan().some(x => x.rule.id === 'l_imgperson' && x.items.includes(bg)) && imgAuditScan().some(x => x.o === bg);
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="psopen"]');
    openStudio('img'); document.querySelector('[data-act="psimgfix"]').click(); o.fix = bg.prompt === 'no humans, scenery, forest' && !auditScan().some(x => x.rule.id === 'l_imgperson');
    document.querySelector('[data-act="psundo"]').click(); o.undo = bg.prompt === '1girl, smile, forest';
    openStudio('frag'); document.querySelector('[data-pf="TITLE_RULE"][data-k="add"]').value = '영문 금지'; document.querySelector('[data-act="pfsave"][data-id="TITLE_RULE"]').click(); o.ui = TITLE_RULE.endsWith('영문 금지') && G.meta.prompts.TITLE_RULE.add === '영문 금지';
    openStudio('lesson'); o.lessonUI = document.querySelectorAll('[data-act="pltog"]').length >= 2; openStudio('log'); o.logUI = document.body.innerHTML.includes('AI 기록 자세히'); closeModal();
    return o; });
  assert.ok(Object.values(r17).every(v => v === true), JSON.stringify(r17)); assert.deepEqual(err17, [], '페이지 오류');
  console.log('ok 17 프롬프트 스튜디오: 조각 덮어쓰기·덧붙이기·기본으로, 그림 가드(배경·소품의 사람 태그 제거), 교훈 기록→요청에 주입, 그림 점검·정리·되돌리기, 점검 규칙');
  // 18) 전투 개선·탑: 전장 규칙(능력치 반영·시간 제한)·별 조건, 집중 지시(엔진 focus), 새 장 생성 시 규칙(AI 지정·자동), 예전 스테이지 점검, 시련의 탑(제한 탑 출전 제한·층 보상)
  const p18 = await browser.newPage(), err18 = []; p18.on('pageerror', e => err18.push(String(e)));
  await p18.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p18.goto(`http://127.0.0.1:${server.address().port}/?t=18`);
  await p18.waitForFunction(() => typeof towerStage === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r18 = await p18.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); P().seenOpening = true;
    G.chars.slice(0, 4).forEach(c => { if (!own(c.id)) grantOwned(c, 't'); }); P().squad = G.chars.slice(0, 4).map(c => c.id);
    const A = [{ elem: ELEMS[0], role: 'atk', atk: 100, def: 50, maxhp: 1000, hp: 1000, spd: 100, c: G.chars[0] }], E = [{ elem: ELEMS[1], atk: 100, def: 50, maxhp: 1000, hp: 1000, spd: 100 }];
    fieldApply({ field: { k: 'resonance', a: ELEMS[0] } }, A, E); fieldApply({ field: { k: 'armor' } }, A, E); o.field = A[0].atk === 130 && E[0].atk === 100 && E[0].def === 80 && E[0].maxhp === 850;
    o.clean = ruleClean(FIELDS, { k: 'resonance', a: '없는속성' }) === null && ruleClean(GOALS, { k: 'few', a: '3' }).a === 3 && fieldTime({ field: { k: 'timed', a: 45 } }) === 45;
    const st = buildStages([{ title: 'a', enemies: [{ name: 'x' }] }, { title: 'b', enemies: [{ name: 'y' }], field: { k: 'swift' } }, { title: 'c', enemies: [{ name: 'z', boss: true }] }], { max: 5, reward: () => 10, hp: 1000, atk: 80, def: 40, elem: ELEMS[0] });
    o.gen = !st[0].field && st[1].field.k === 'swift' && ['fast', 'hp'].includes(st[2].goal.k) && st.every(s => s.rulesV === 1) && stageSchema(false).includes('"field"');
    const ch = G.chapters.find(c => c.kind === 'main'), old = ch.stages.find(s => !s.story && s.enemies.length); delete old.rulesV; delete old.field; delete old.goal;
    const ag = auditScan().find(g => g.rule.id === 's_rules'); o.audit = !!ag && ag.items.includes(old); await auditFix(ag.rule, ag.items); o.auditFix = old.rulesV === 1 && !!old.goal;
    const s2 = ch.stages[1]; s2.field = { k: 'timed', a: 30 }; s2.goal = { k: 'few', a: 4 }; await openFormation(s2, { kind: 'main', ch }, 'stagestart'); o.intel = document.body.innerHTML.includes('시간 제한') && document.body.innerHTML.includes('4명 이하로 승리'); closeModal();
    await startStage(s2, { kind: 'main', ch }); o.maxTime = B && B.engine.maxTime === 30;
    document.querySelector('#u_e0').click(); o.focus = B.enemies[0].status.some(s => s.id === 'order' && s.type === 'focus') && B.log.some(l => l.includes('집중 공격'));
    document.querySelector('#u_e0').click(); o.focusCd = B.enemies[0].status.filter(s => s.id === 'order').length === 1;
    B.speed = 3; bRun(); for (let i = 0; i < 1500 && !document.querySelector('.result'); i++) await wait(20); o.goalShown = !!document.querySelector('.result') && (document.querySelector('.result').innerHTML.includes('4명 이하로 승리') || document.querySelector('.result').innerHTML.includes('작전 실패'));
    B && (B.over = true, clearInterval(B.timer)); B = null; closeOv();
    const L = towerList(); o.towers = L.length >= 1 + ELEMS.length && L.some(t => t.id.startsWith('f:'));
    const t5 = towerStage('all', 5), t1 = towerStage('all', 1), t20 = towerStage('all', 20); o.floors = t5.enemies.some(e => e.boss) && !t1.enemies.some(e => e.boss) && stagePower(t20) > stagePower(t1) && t5.goal && towerStage('all', 5).enemies[0].hp === t5.enemies[0].hp;
    const e0 = ELEMS[0], et = towerById('e:' + e0); towerGo('e:' + e0); await wait(50); o.restrict = !!FORM && [...document.querySelectorAll('.froster [data-act="fpick"]')].every(b => charById(b.dataset.id).elem === e0); closeModal();
    const gems = P().gems; tab = 'challenge'; render(); o.page = !!document.querySelector('[data-act="towergo"][data-v="all"]');
    towerGo('all'); await wait(50); document.querySelector('[data-act="towerstart"]').click(); await wait(50); o.tower = B && B.ctx.kind === 'tower' && B.ctx.floor === 1;
    bEnd(true); o.towerWin = TOWER().all.best === 1 && P().gems > gems && document.querySelector('.result').innerHTML.includes('1층 돌파'); document.querySelector('.result [data-act="bdone"]').click(); o.closed = !B;
    return o; });
  assert.ok(Object.values(r18).every(v => v === true), JSON.stringify(r18)); assert.deepEqual(err18, [], '페이지 오류');
  console.log('ok 18 전투 개선·탑: 전장 규칙(능력치·시간 제한)·별 조건·편성 화면 안내, 집중 지시, 새 장 규칙(AI 지정·자동)·예전 스테이지 점검, 시련의 탑(제한 탑·보스층·첫 돌파 보상)');
  // 19) 일정: 장소(자동·AI)·좋아하는 장소·하루 3번·호감도/보상·장면(AI·기본), 점검 규칙 g_spots·c_spot
  const p19 = await browser.newPage(), err19 = []; p19.on('pageerror', e => err19.push(String(e)));
  await p19.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p19.goto(`http://127.0.0.1:${server.address().port}/?t=19`);
  await p19.waitForFunction(() => typeof schedHTML === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r19 = await p19.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); P().seenOpening = true; G.chars.slice(0, 4).forEach(c => { if (!own(c.id)) grantOwned(c, 't'); });
    G.meta.spots = []; o.auditG = auditScan().some(g => g.rule.id === 'g_spots'); spotsAuto(); o.auto = spots().length > 0 && !auditScan().some(g => g.rule.id === 'g_spots');
    SAMPLE = { json: async p => /함께 시간을 보낼 장소/.test(p) ? { spots: [{ name: '별빛 카페', desc: '조용한 카페', bg: '', tags: ['커피', '디저트'] }, { name: '옥상 정원', desc: '', bg: '', tags: ['꽃'] }] } : /우연히 만나/.test(p) ? { scenes: [{ spot: '별빛 카페', script: '[배경: 별빛 카페]\n세라: 여기 커피 좋아\n선택: 나도 | 별로\n1) 세라: 그치?\n2) 세라: 흥' }] } : {} };
    await spotsAI(); o.ai = spots().length === 2 && spots()[0].tags.includes('커피');
    const c = G.chars.find(x => own(x.id)); c.persona = Object.assign({}, c.persona, { likes: ['커피'] }); const cafe = spots()[0]; o.fav = spotFav(c, cafe) && spotWho(cafe).includes(c);
    o.auditC = auditScan().some(g => g.rule.id === 'c_spot' && g.items.includes(c)); await spotTalkAI(c); o.talk = (c.spotTalk || {})[cafe.id].includes('커피 좋아');
    o.tpl = spotTemplate(G.chars[1], spots()[1]).startsWith('[배경: 옥상 정원]') && parseScript(spotTemplate(G.chars[1], spots()[1])).some(l => l.type === 'choice');
    tab = 'sched'; render(); o.page = !!document.querySelector(`[data-act="scvisit"][data-c="${c.id}"]`); const aff = own(c.id).aff || 0, gold = P().gold;
    document.querySelector(`[data-act="scvisit"][data-c="${c.id}"]`).click(); for (let i = 0; i < 30 && S; i++) { document.querySelector('#vn') && document.querySelector('#vn').click(); const pk = document.querySelector('[data-act="vnpick"]'); if (pk) pk.click(); await wait(40); }
    o.visit = !S && (own(c.id).aff || 0) === aff + 30 && P().gold > gold && SCHED().left === 2 && SCHED().done.includes(cafe.id);
    schedVisit(cafe.id, c.id); o.once = !S && SCHED().left === 2; tab = 'lobby'; render(); o.lobby = !!document.querySelector('[data-act="go"][data-to="sched"]');
    return o; });
  assert.ok(Object.values(r19).every(v => v === true), JSON.stringify(r19)); assert.deepEqual(err19, [], '페이지 오류');
  console.log('ok 19 일정: 장소(자동·AI)·좋아하는 장소(호감도 1.5배)·하루 3번·보상, 장면(AI·기본 대본), 점검 규칙(장소·장면), 로비 진입');
  // 20) 연출 엔진: 이름[표정|감정|동작] 파싱, [연출]·[효과]·[스티커], 두 사람 무대, 자동 감정·끄기, 메신저 스티커, 대본 형식 안내, AI 연출 입히기(대사 보존 검증)·점검 규칙
  const p20 = await browser.newPage(), err20 = []; p20.on('pageerror', e => err20.push(String(e)));
  await p20.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p20.goto(`http://127.0.0.1:${server.address().port}/?t=20`);
  await p20.waitForFunction(() => typeof vnStage === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r20 = await p20.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); P().seenOpening = true; closeModal(); closeOv();
    const L = parseScript('세라[미소|하트|점프]: 정말?\n[연출: 이브 땀 떨림]\n[효과: 비]\n이브[당황]: 어어…\n[스티커: 화남]');
    o.parse = L[0].type === 'say' && L[0].who === '세라' && L[0].face === '미소' && L[0].dir.emo === '하트' && L[0].dir.motion === '점프' && L[1].cmd === '연출' && L[2].cmd === '효과' && L[3].dir.emo === '땀' && L[3].face === '' && L[4].cmd === '스티커';
    o.plain = parseScript('세라[미소]: 안녕')[0].face === '미소' && !parseScript('세라[미소]: 안녕')[0].dir;
    o.auto = autoEmote('뭐라고?!') === '놀람' && autoEmote('좋아해') === '하트' && autoEmote('그냥 걷자') === '';
    o.guide = SCRIPT_FMT.includes('감정 아이콘') && SCRIPT_FMT.includes('[효과: 흔들림') && THREAD_FMT.includes('[스티커:');
    const step = async () => { const v = document.querySelector('#vn'); if (!v) return; v.click(); if (S && S.typing) v.click(); await wait(60); };
    playStory('t', '세라: 안녕\n이브[미소|하트|점프]: 반가워요\n[효과: 회상]\n[연출: 세라 땀 떨림]\n세라: 어\n[효과: 회상 끝]\n카야: 셋째');
    const until = async f => { for (let i = 0; i < 12 && !f(); i++) await step(); return !!f(); };
    o.duo = await until(() => !!document.querySelector('.vn-slot.speak .emo[data-emo="하트"]')) && document.querySelectorAll('#vnChar .vn-slot').length === 2 && document.querySelector('#vnChar').classList.contains('duo') && document.querySelector('.vn-slot.speak').classList.contains('m-jump');
    o.memory = await until(() => document.querySelector('#vn').classList.contains('fx-memory') && !!document.querySelector('.vn-slot .emo[data-emo="땀"]'));
    o.memEnd = await until(() => $('#vnName').textContent === '카야') && !document.querySelector('#vn').classList.contains('fx-memory') && document.querySelectorAll('#vnChar .vn-slot').length === 2;
    vnEnd();
    P().vnStage = 'single'; P().vnDirect = 'off'; playStory('t', '세라: 안녕\n이브[하트]: 좋아해'); await until(() => $('#vnName').textContent === '이브'); o.off = document.querySelectorAll('#vnChar .vn-slot').length === 1 && !document.querySelector('.emo'); vnEnd(); P().vnStage = 'duo'; P().vnDirect = 'auto';
    o.sticker = emoteHTML('♥', true).includes('data-emo="하트"') && bubbleHTML({ w: 'k', t: '하트' }, G.chars[0]).includes('sticker');
    const src = '세라: 정말이야?\n이브: 네\n선택: 믿는다 | 의심한다\n1) 세라: 고마워';
    SAMPLE = { json: async p => /연출만 더하라/.test(p) ? { script: /의심/.test(p) ? '세라[놀람]: 정말이야?\n이브[|끄덕]: 네\n선택: 믿는다 | 의심한다\n1) 세라[미소|하트]: 고마워' : '' } : {} };
    const d = await directScript(src); o.direct = !!d && dirCount(d) >= 2 && dirStrip(d) === dirStrip(src);
    SAMPLE = { json: async () => ({ script: '세라[놀람]: 정말이야? 바뀜\n이브: 네' }) }; o.reject = (await directScript(src)) === null;
    const ch = G.chapters.find(c => c.kind === 'main'), st = ch.stages.find(s => (s.pre || '').split('\n').length >= 6 || ((s.pre || '') + (s.post || '')).split('\n').length >= 6);
    o.audit = !!st && auditScan().some(g => g.rule.id === 's_direct' && g.items.includes(st));
    SAMPLE = { json: async p => { const m = p.match(/대본:\n([\s\S]*)\n\nJSON만 출력/); const t = m ? m[1] : ''; return { script: t.replace(/^([^:\n\[]{1,20}): /m, '$1[|놀람]: ') }; } };
    const g = auditScan().find(x => x.rule.id === 's_direct'); await auditFix(g.rule, [st]); o.auditFix = st.dirV === 1 && dirCount((st.pre || '') + '\n' + (st.post || '')) >= 1;
    tab = 'studio'; STTAB = 'view'; render(); o.setting = !!document.querySelector('[data-pset="vnDirect"]') && !!document.querySelector('[data-pset="vnStage"]');
    return o; });
  assert.ok(Object.values(r20).every(v => v === true), JSON.stringify(r20)); assert.deepEqual(err20, [], '페이지 오류');
  console.log('ok 20 연출 엔진: 이름[표정|감정|동작]·[연출]·[효과](회상·집중선 등)·[스티커], 두 사람 무대, 자동 감정·끄기, 메신저 스티커, 대본 형식 안내, AI 연출 입히기(대사 보존)·점검 규칙');
  // 21) 에셋 관리: 공유 보관함 넣기·가져오기(다른 게임에서도), 새 자료 자동 재사용(addLib), 사용처·중복 합치기(별칭)·되돌리기, 감정 아이콘 그림 교체, AI 컨텍스트에 보관함 배경
  const p21 = await browser.newPage(), err21 = []; p21.on('pageerror', e => err21.push(String(e)));
  await p21.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p21.goto(`http://127.0.0.1:${server.address().port}/?t=21`);
  await p21.waitForFunction(() => typeof shPut === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r21 = await p21.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); P().seenOpening = true; closeModal(); closeOv();
    const png = await (await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')).blob();
    const bg = { id: 'l' + uid(), kind: 'bg', name: '공유 시험 바다', prompt: 'no humans, scenery, sea', img: null }; G.lib.push(bg); await storeImage(bg, png);
    o.put = await shPut(bg) && shList().some(x => x.name === '공유 시험 바다');
    G.lib = G.lib.filter(l => l !== bg); addLib('bg', [{ name: '공유 시험 바다', prompt: '' }]); await wait(300); const nb = G.lib.find(l => l.name === '공유 시험 바다'); o.adopt = !!nb && !!nb.img && !!imgSrc(nb) && !!nb.shared;
    o.ctx = ctx().includes('배경 목록') ; shSave(shList().concat([{ id: 'sx', kind: 'bg', name: '보관함 전용 숲', prompt: '', from: 'x', at: 1 }])); o.ctxShared = ctx().includes('보관함 전용 숲');
    const a = { id: 'l' + uid(), kind: 'prop', name: '열쇠 A', prompt: 'no humans, object focus, key', img: null }, b2 = { id: 'l' + uid(), kind: 'prop', name: '열쇠 B', prompt: 'no humans, object focus, key', img: null }; G.lib.push(a, b2);
    const D = libDupes(); o.dupes = D.some(x => x.keep === a && x.dup === b2); libMerge(D); o.merge = b2.alias === a.id; auditUndo(); o.undo = !b2.alias;
    G.chapters[0].stages[0].pre = (G.chapters[0].stages[0].pre || '') + '\n[소품: 열쇠 A]'; o.usage = libUsage()['열쇠 A'] >= 1 && !libUsage()['열쇠 B'];
    const em = { id: 'l' + uid(), kind: 'emote', name: '하트', prompt: '', img: null }; G.lib.push(em); await storeImage(em, png); o.emote = emoteHTML('하트').includes('<img');
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="amopen"]');
    await openAssets('shared'); o.ui1 = !!document.querySelector('[data-act="amtake"]'); await openAssets('game'); o.ui2 = !!document.querySelector('[data-act="amput"]'); await openAssets('emote'); o.ui3 = document.querySelectorAll('[data-amemo]').length === Object.keys(EMOTES).length; closeModal();
    return o; });
  assert.ok(Object.values(r21).every(v => v === true), JSON.stringify(r21)); assert.deepEqual(err21, [], '페이지 오류');
  console.log('ok 21 에셋 관리: 공유 보관함(넣기·가져오기)·새 자료 자동 재사용·AI 컨텍스트, 사용처·중복 합치기(별칭)·되돌리기, 감정 아이콘 그림 교체');
  // 22) 대열·출격 경로: 엔진 대열(근접은 전열만·엄호·후열 지원 회복), 사거리 추정·편성 경고, 출격(전초전→갈림길(지원형 조건)→보스), 체력 유지·진격·퇴각·이어 하기, 행동력 1번, 생성(route·range)·점검 c_range
  const p22 = await browser.newPage(), err22 = []; p22.on('pageerror', e => err22.push(String(e)));
  await p22.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p22.goto(`http://127.0.0.1:${server.address().port}/?t=22`);
  await p22.waitForFunction(() => typeof sortieBegin === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r22 = await p22.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); P().seenOpening = true; closeModal(); closeOv();
    const mk = (side, n, role, range, hp = 3000) => ({ side, name: n, role, range, elem: ELEMS[0], maxhp: hp, hp, atk: 120, def: 40, spd: 100 });
    const A = [mk('a', 'A1', 'def', 'melee', 9000), mk('a', 'A2', 'atk', 'melee', 9000), mk('a', 'A3', 'sup', 'support'), mk('a', 'A4', 'atk', 'ranged')], E = [mk('e', 'E1', 'atk', 'melee'), mk('e', 'E2', 'atk', 'melee')];
    const sim = GGMCombat.create(A, E, { seed: 5, formation: true, maxTime: 40 }); let hitBack = 0, hitFront = 0, guard = 0;
    for (let i = 0; i < 230 && !sim.winner; i++) { const ev = GGMCombat.step(sim, true) || []; ev.forEach(x => { if (x.type === 'damage' && x.source.side === 'e' && x.basic) { if (x.target.row === 'back') hitBack++; else hitFront++; } if (x.type === 'status' && x.label === '엄호') guard++; }); }
    o.rows = A.map(u => u.row).join() === 'front,front,back,back' && E.every(u => u.row === 'front');
    o.block = hitFront > 0 && hitBack === 0;
    o.rangeOf = GGMCombat.rangeOf({ role: 'sup' }) === 'support' && GGMCombat.rangeOf({ role: 'def' }) === 'melee';
    const sera = charById('sera'); o.charRange = ['melee', 'ranged', 'support'].includes(charRange(sera)) && (sera.range = 'melee', charRange(sera) === 'melee') && rowWarn(sera, 3, 4).includes('후열 근접') && (delete sera.range, true);
    o.opts = v2Options().formation === true; G.meta.rules = Object.assign({}, G.meta.rules, { formation: false }); o.optOff = v2Options().formation === false; G.meta.rules.formation = true;
    G.chars.slice(0, 5).forEach(c => { if (!own(c.id)) grantOwned(c, 't'); }); const ch = G.chapters.find(c => c.kind === 'main'), s = ch.stages.find(x => !x.story && x.enemies.length); P().cleared[s.id] = true;
    P().squad = G.chars.filter(c => own(c.id) && c.role !== 'sup').slice(0, 3).map(c => c.id); const stam0 = stam().v;
    startBattle(ch.id, s.id); for (let i = 0; i < 50 && !SORTIE(); i++) await wait(100); await wait(100);
    o.begin = !!SORTIE() && SORTIE().node === 'n1' && !!document.querySelector('.so-map') && !B;
    document.querySelector('[data-act="sogo"]').click(); for (let i = 0; i < 60 && !B; i++) await wait(100);
    o.node1 = B && B.ctx.sortie && !B.ctx.boss && B.s.enemies.length <= 2 && B.s.enemies.every(e => !e.boss);
    B.allies[0].hp = Math.round(B.allies[0].maxhp * .2); const hurt = B.allies[0].c.id; bEnd(true);
    o.nodeWin = SORTIE().path.includes('n1') && Math.abs(SORTIE().hp[hurt] - .2) < .02 && document.querySelector('.result').innerHTML.includes('돌파');
    document.querySelector('[data-act="somap"]').click(); await wait(50);
    o.fork = !!document.querySelector('[data-act="sonext"][data-v="n2a"]') && document.querySelector('[data-act="sonext"][data-v="n2b"]').disabled && document.body.innerHTML.includes('대파');
    closeModal(); document.body.insertAdjacentHTML('beforeend', `<button id="_st" data-act="stage" data-ch="${ch.id}" data-st="${s.id}"></button>`); document.querySelector('#_st').click(); await wait(50); o.resume = !!document.querySelector('.so-map'); document.querySelector('#_st').remove();
    document.querySelector('[data-act="sonext"][data-v="n2a"]').click(); await wait(30); document.querySelector('[data-act="sogo"]').click(); for (let i = 0; i < 60 && !B; i++) await wait(100);
    o.carry = B && B.ctx.node !== 'x' && Math.abs(B.allies.find(u => u.c.id === hurt).hp / B.allies.find(u => u.c.id === hurt).maxhp - .2) < .02 && B.s.enemies.length === 3;
    bEnd(true); document.querySelector('[data-act="somap"]').click(); await wait(50); document.querySelector('[data-act="sonext"][data-v="n3"]').click(); await wait(30); document.querySelector('[data-act="sogo"]').click(); for (let i = 0; i < 60 && !B; i++) await wait(100);
    o.boss = B && B.ctx.boss && B.s === s; bEnd(true); o.cleared = !SORTIE() && !!document.querySelector('.rs-stars'); document.querySelector('.result [data-act="bdone"]').click(); await wait(50);
    o.stam = stam().v === stam0 - stamCost('main');
    startBattle(ch.id, s.id); for (let i = 0; i < 50 && !SORTIE(); i++) await wait(100); await wait(50); const g0 = P().gold; document.querySelector('[data-act="soretreat"]').click(); o.retreat = !SORTIE() && P().gold === g0;
    const st = buildStages([{ title: 'a', enemies: [{ name: 'x' }], route: { n1: '항구 전초', a: '정면 부두', b: '뒷골목', fork: '안개 낀 갈림길', boss: '선창 본대' } }], { max: 3, reward: () => 1, hp: 1000, atk: 80, def: 40, elem: ELEMS[0] });
    const R = routeOf(st[0]); o.route = R.nodes[0].name === '항구 전초' && R.nodes[1].name === '정면 부두' && R.fork === '안개 낀 갈림길' && stageSchema(false).includes('"route"');
    o.schema = charSchema().includes('"range"') && cleanChar({ name: 'r', role: 'atk', range: 'ranged' }).range === 'ranged';
    const c = G.chars[1]; delete c.range; o.audit = auditScan().some(g => g.rule.id === 'c_range' && g.items.includes(c));
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="bsys"][data-k="sortie"]');
    return o; });
  assert.ok(Object.values(r22).every(v => v === true), JSON.stringify(r22)); assert.deepEqual(err22, [], '페이지 오류');
  console.log('ok 22 대열·출격 경로: 근접은 전열만 공격·엄호·후열 회복(엔진), 사거리·편성 경고, 전초전→갈림길(지원형 조건)→보스, 체력 유지·진격·퇴각·이어 하기, 생성(route·range)·점검');
  // 23) 세력·몬스터·등장: 세력 종류·장별 관계(stance)·AI 컨텍스트, 깊이 점검·AI 채우기, 몬스터가 캐릭터·NPC로 생성되지 않음·톡 제외·전환, 첫 등장 전 픽업 잠금·적대 세력 잠금, 만나지 않은 보유 캐릭터 안내, 점검 규칙
  const p23 = await browser.newPage(), err23 = []; p23.on('pageerror', e => err23.push(String(e)));
  await p23.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p23.goto(`http://127.0.0.1:${server.address().port}/?t=23`);
  await p23.waitForFunction(() => typeof factionReview === 'function' && typeof G === 'object', null, { timeout: 15000 });
  const r23 = await p23.evaluate(async () => {
    const o = {}; P().seenOpening = true; closeModal(); closeOv();
    const F = factions(); o.sample = F.find(f => f.name === '잔광').kind === 'monster' && F.find(f => f.name === '헬릭스 컨소시엄').kind === 'hostile' && factionReview().score >= 70 && monsterNames().some(l => l.desc);
    const hx = facByName('헬릭스 컨소시엄'); hx.stance = [{ ch: 1, s: 'neutral', why: '' }, { ch: 3, s: 'ally', why: '내분' }];
    o.stance = stanceAt(hx, 1) === 'neutral' && stanceAt(hx, 2) === 'neutral' && stanceAt(hx, 3) === 'ally' && stanceAt(facByName('잔광'), 1) === 'hostile';
    const cx = ctx(); o.ctx = cx.includes('적대 세력') && cx.includes('3장부터 우호 예정') && cx.includes('몬스터 도감') && cx.includes('잔광 하운드');
    stanceApply([{ faction: '회색구 시민회', s: 'hostile', why: '오해' }], 2); o.apply = stanceAt(facByName('회색구 시민회'), 2) === 'hostile' && stanceAt(facByName('회색구 시민회'), 1) === 'neutral';
    const ch = G.chapters.find(c => c.kind === 'main'), st = ch.stages[ch.stages.length - 1];
    const n0 = G.chars.length; addNewChars([{ name: '빛의 늑대', role: 'atk', naiPrompt: 'no humans, monster, wolf' }, { name: '잔광 하운드', role: 'atk', naiPrompt: '1girl, solo' }, { name: '새 동료', role: 'atk', naiPrompt: '1girl, solo', faction: '새벽등대', debutStage: 4 }], 3, ch.stages, { src: 't' });
    const nc = G.chars.find(c => c.name === '새 동료'); o.noMonster = G.chars.length === n0 + 1 && !!nc && G.lib.some(l => l.kind === 'enemy' && l.name === '빛의 늑대');
    const nn = (G.npcs || []).length; addNpcs([{ name: '그림자 마수', role: '마수', profile: '' }, { name: '상인 라오', role: '상인', profile: '', naiPrompt: '1boy, solo' }]); o.noMonsterNpc = (G.npcs || []).length === nn + 1 && G.npcs.some(n => n.name === '상인 라오');
    nc.debut = st.id; delete P().cleared[st.id]; const bn = { id: 'bt', name: 't', type: 'pickup', pool: { mode: 'all' }, pickup: [nc.id], rate: 50 };
    o.pickupLock = !bannerPool(bn).includes(nc) && castLock(nc).includes('깨면 열려요'); G.meta.cast = { pickupGate: false }; o.pickupOff = bannerPool(bn).includes(nc); G.meta.cast = {};
    P().cleared[st.id] = true; o.debutOpen = bannerPool(bn).includes(nc);
    const fx = facByName('새벽등대'); fx.stance = [{ ch: 1, s: 'hostile', why: '처음엔 적' }]; o.hostile = castLock(nc).includes('적대') && !bannerPool({ ...bn, pickup: [] }).includes(nc); fx.stance = [];
    const sera = charById('sera'); if (!own(sera.id)) grantOwned(sera, 't'); o.unmet = typeof metInStory === 'function' && (metInStory(sera) ? true : ctx().includes('이미 계약으로 합류'));
    const mc = cleanChar({ name: '잔광 파수꾼', role: 'def' }); G.chars.push(mc); o.auditMon = auditScan().some(g => g.rule.id === 'c_monster' && g.items.includes(mc));
    grantOwned(mc, 't'); G.threads.push({ id: 'tm', charId: mc.id, title: 'x', script: '잔광 파수꾼: …', trigger: { type: 'start' } }); charToMonster(mc); o.toMonster = mc.monster && !trigOk(G.threads.at(-1)) && !castOk(mc) && !spotWho({ id: 's', name: 'x', tags: [] }).includes(mc) && !ctx().includes('잔광 파수꾼(');
    const mid = G.chars.find(c => !own(c.id) && !c.debut && !c.alt); const ch2 = G.chapters.filter(c => c.kind === 'main')[1] || ch; if (mid) { const s2 = ch2.stages[0]; s2.pre = (s2.pre || '') + `\n${mid.name}: 처음 뵙겠습니다`; o.debutAudit = G.chapters.filter(c => c.kind === 'main').indexOf(ch2) > 0 ? auditScan().some(g => g.rule.id === 'c_debut' && g.items.includes(mid)) : true; } else o.debutAudit = true;
    G.world.factions = [{ name: '얕은 세력', desc: '짧음' }]; o.shallow = factionReview().score < 70 && auditScan().some(g => g.rule.id === 'w_faction');
    SAMPLE = { json: async p => /세력과 몬스터 설정을 깊이/.test(p) ? { factions: [{ name: '얕은 세력', kind: 'hostile', desc: '도시의 지하를 장악한 밀수 조직. 성핵 파편을 몰래 사고판다.', goal: '성핵 시장 장악', leader: '그림자 회장', base: '지하 수로', ideology: '돈이 곧 법', rel: { '새벽등대': '적대' }, stance: [{ ch: 2, s: 'neutral', why: '휴전' }] }, { name: '새벽등대', kind: 'playable', desc: '작은 계약사무소. 회색구를 지킨다.', goal: '주민 보호', leader: '관리관', base: '등대', ideology: '사람이 먼저' }], bestiary: [{ name: '잔광 하운드', faction: '얕은 세력', desc: '실험체', nature: '무리', weak: '코어' }] } : {} };
    await factionAI(); const sh = facByName('얕은 세력'); o.ai = sh.kind === 'hostile' && sh.goal === '성핵 시장 장악' && sh.stance.some(s => s.ch === 2) && !!facByName('새벽등대').goal;
    tab = 'studio'; STTAB = 'game'; render(); o.panel = !!document.querySelector('[data-act="fwopen"]');
    openWorldDesign('cast'); const sel = document.querySelector(`[data-fw="c.${nc.id}.debut"]`); sel.value = ''; document.querySelector('[data-act="fwsave"]').click(); o.ui = !nc.debut; openWorldDesign('mon'); o.ui2 = !!document.querySelector('[data-fw^="m."]'); openWorldDesign('fac'); o.ui3 = !!document.querySelector('[data-fw="f.0.stance"]'); closeModal();
    return o; });
  assert.ok(Object.values(r23).every(v => v === true), JSON.stringify(r23)); assert.deepEqual(err23, [], '페이지 오류');
  console.log('ok 23 세력·몬스터·등장: 세력 종류·장별 관계·AI 컨텍스트, 깊이 점검·AI 채우기, 몬스터의 캐릭터·NPC 생성 차단·톡 제외·전환, 첫 등장 전 픽업 잠금·적대 잠금, 점검 규칙');
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
