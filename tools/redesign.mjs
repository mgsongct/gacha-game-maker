#!/usr/bin/env node
// 재설계용 거꾸로 분석(사용자 지시 U20: 「추상적으로 index.html 빌드된 형상에서 역으로 거슬러 재설계부터하라」 — 함수만 늘어놓고 class·상속 계층이 없고 중복 구현이 많음)
//   node tools/redesign.mjs [--html <index.html> | --rev <커밋>] [--label <이름>] → tools/out/redesign[-이름].md · .json
//     기본은 지금 빌드된 www/index.html, --rev는 그 커밋의 index.html(원안 13a3fe9는 루트 index.html)
//   대상: 빌드된 SPA의 코드(www/index.html — src와 바이트까지 같음, build/test.mjs 1). 파일 배치가 아니라 제품이 하는 일에서 거꾸로:
//   ① 구조가 같은 함수 묶음 — 이름·글자 값을 지운 구문 트리 꼴이 같음(복사해 이름만 바꾼 중복 구현)
//   ② 같은 호출 뼈대 — 공용 함수(25곳↑에서 불림)를 뺀 부르는 함수 집합이 같은 함수 묶음(같은 흐름을 따로 구현)
//   ③ 역할 꼴 — AI 생성 흐름 · 그림 생성 · 창 열기 · 화면 그리기(HTML) · 진행 칸 쓰기: 같은 역할을 하는 함수 수·모듈(공통 상위 class 후보)
//   ④ data 엔티티 — 연관 맵 data 파일(chars.json·world.json …)마다 만들기·고치기·지우기 함수와 모듈(한 창구 class 후보)
//   --map: docs/redesign.md 2절 추상 매핑 표(data → 기능)를 읽어 함수마다 기능·class 종류를 냄(사용자 지시 U22) → tools/out/redesign-map-<이름>.md·.json
//     기능 = 쓰는 data(엔티티 필드까지)의 주인 기능 → 없으면 읽는 상태 키 → 없으면 부르는·불리는 함수의 기능(더 바뀌지 않을 때까지)
//     종류 = Generator(글 AI 호출) · Dialog(창 열기) · Screen(화면 그리기) · Service(밖과의 입출력) · Repository(data 쓰기) · Controller(동작 처리) · Helper
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadHtmlUnits, walk } from './lib/source.mjs';
import { stateFlow } from './lib/flow.mjs';
import { buildMap } from './lib/map.mjs';
import { layers } from './lib/arch.mjs';
import { surfaceOf, placeOf } from './lib/surface.mjs';
import { execFileSync } from 'node:child_process';
import { buildGraph } from './lib/graph.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/out');
const LEAF = /^(identifier|property_identifier|shorthand_property_identifier|shorthand_property_identifier_pattern|statement_identifier)$/, LIT = /^(string|template_string|number|regex|true|false|null)$/;
// 구문 트리 꼴: 이름은 i, 글자 값은 l(템플릿 속 식은 남김)
export function shapeOf(node) { const out = []; let n = 0; walk(node, x => { if (!x.isNamed) return; n++; if (LEAF.test(x.type)) { out.push('i'); return false; } if (LIT.test(x.type) && x.type !== 'template_string') { out.push('l'); return false; } out.push(x.type); }); return { key: createHash('md5').update(out.join(' ')).digest('hex'), size: n }; }
export function sameShapes(fns, min = 40) { const g = new Map(); for (const f of fns.values()) { if (!f.top || f.table) continue; const b = f.node.childForFieldName('body'); if (!b) continue; const s = shapeOf(b); if (s.size < min) continue; if (!g.has(s.key)) g.set(s.key, []); g.get(s.key).push(f); }
  return [...g.values()].filter(x => x.length > 1).map(x => ({ size: shapeOf(x[0].node.childForFieldName('body')).size, fns: x.map(f => ({ name: f.name, loc: f.loc })) })).sort((a, b) => b.size * b.fns.length - a.size * a.fns.length); }
export function sameSkeletons(fns, min = 3) { const g = new Map(); for (const f of fns.values()) { if (!f.top || f.table) continue; const cs = [...f.calls.keys()].map(k => fns.get(k)).filter(c => c?.top && c.callers.size < 25).map(c => c.name).sort(); if (cs.length < min) continue; const k = cs.join(','); if (!g.has(k)) g.set(k, []); g.get(k).push(f); }
  return [...g].filter(([, x]) => x.length > 1).map(([k, x]) => ({ calls: k.split(','), fns: x.map(f => ({ name: f.name, loc: f.loc })) })).sort((a, b) => b.fns.length * b.calls.length - a.fns.length * a.calls.length); }
const ROLES = { 'AI 생성 흐름': /^(aiJSON|aiCall|aiJSONRetry|aiOne)$/, '그림 생성': /^(naiGenerate|naiDraw|naiDrawItem|naiDrawItem0|comfyGenerate|imageCandidates)$/, '창 열기': /^openModal$/, '진행 칸 쓰기': /^progSlot$/, '게임 칸 쓰기': /^gameSlot$/ };
export function roleFamilies(fns) { const out = {}; for (const [role, re] of Object.entries(ROLES)) { const hit = [...fns.values()].filter(f => f.top && !f.table && [...f.calls.keys()].some(k => re.test(fns.get(k)?.name || ''))); out[role] = hit.map(f => ({ name: f.name, mod: f.loc.split(':')[0] })); }
  out['화면 그리기(HTML)'] = [...fns.values()].filter(f => f.top && !f.table && /HTML\d*$/.test(f.name)).map(f => ({ name: f.name, mod: f.loc.split(':')[0] })); return out; }

// 추상 매핑 표 읽기: | 기능 | `파일.json` … | meta 칸 | prog 칸 | world 칸 | → 'chars.json' · 'meta.json›variants' … → 기능
export function readDataMap(md) { const sec = String(md).split(/^## /m).find(t => t.startsWith('2. 추상 매핑')) || '', out = new Map();
  for (const line of sec.split('\n')) { const c = line.split('|').map(x => x.trim()); if (c.length < 7 || !/^[A-Za-z]+$/.test(c[1])) continue; const f = c[1], tok = t => [...t.matchAll(/`([^`]+)`/g)].map(m => m[1]);
    tok(c[2]).forEach(x => out.set(x, f)); tok(c[3]).forEach(x => out.set('meta.json›' + x, f)); tok(c[4]).forEach(x => out.set('prog.json›' + x, f)); tok(c[5]).forEach(x => out.set('world.json›' + x, f)); }
  return out; }
// 화면 → 기능 표(2-2절): | 기능 | `화면` `패널` … | → [[이름, 기능]] 긴 이름부터
export function readScreenMap(md) { const sec = (String(md).split(/^### /m).find(t => t.startsWith('2-2.')) || '').split(/^## /m)[0], out = [];
  for (const line of sec.split('\n')) { const c = line.split('|').map(x => x.trim()); if (c.length < 4 || !/^[A-Za-z]+$/.test(c[1])) continue; [...c[2].matchAll(/`([^`]+)`/g)].forEach(m => out.push([m[1], c[1]])); }
  return out.sort((a, b) => b[0].length - a[0].length); }
const featOfData = (DM, file, path) => DM.get(file) || DM.get(`${file}›${String(path || '').split(/[.[]/)[0]}`) || null;
const featOfKey = (DM, k) => { const m = /^P\(\)\.(\w+)/.exec(k) || null; if (m) return DM.get('prog.json›' + m[1]); const g = /^G\.(meta|world)\.(\w+)/.exec(k); if (g) return DM.get(`${g[1]}.json›${g[2]}`); const t = /^G\.(\w+)/.exec(k); return t ? DM.get(`${t[1]}.json`) : null; };
export function featureMap(units, fns, html, DM, SM = []) { const sf = stateFlow(units, fns), M = buildMap(units, fns, sf, html), L = layers(fns, new Set(Object.values(M.data).flatMap(d => Object.values(d.writers).flat()))), top = [...fns.values()].filter(f => f.top && !f.table), feat = new Map(), why = new Map(), cnt = () => new Map(), add = (m, k) => m.set(k, (m.get(k) || 0) + 1), best = m => [...m].sort((a, b) => b[1] - a[1])[0]?.[0];
  const W = new Map(); for (const d of Object.values(M.data)) { const ft = featOfData(DM, d.file, d.path); if (!ft) continue; for (const w of Object.values(d.writers).flat()) { if (!W.has(w)) W.set(w, cnt()); add(W.get(w), ft); } }
  const Rd = new Map(); for (const x of sf.list) { const ft = featOfKey(DM, x.key); if (!ft) continue; for (const r of x.r) { if (!Rd.has(r)) Rd.set(r, cnt()); add(Rd.get(r), ft); } }
  /* 화면 자리(연관 맵 화면 단위 — 단위 하나면 그 단위, 메뉴 하나면 그 메뉴; 창은 여는 메뉴) → 화면 표 */
  const S = surfaceOf(units, fns, html), scr = label => (SM.find(([n]) => String(label || '').includes(n)) || [])[1] || null, screenOf = k => { const p = placeOf(S, k); if (p.kind === '단위') { const u = S.feats.get(p.unit); return scr(u?.label) || scr(u?.menu); } return p.kind === '메뉴' ? scr(p.menu) : null; };
  for (const f of top) { const sc = screenOf(f.key); if (W.has(f.key)) { feat.set(f.key, best(W.get(f.key))); why.set(f.key, '쓰는 data'); } else if (sc) { feat.set(f.key, sc); why.set(f.key, '화면'); } else if (Rd.has(f.key)) { feat.set(f.key, best(Rd.get(f.key))); why.set(f.key, '읽는 상태'); } }
  /* 공용: 25곳↑에서 불리는 함수, 또는 이어진 함수의 기능이 한쪽으로 60%↑ 몰리지 않는 함수(여러 기능이 같이 씀 — 상위 class·공용 도구 후보) */
  for (const f of top) if (!feat.has(f.key) && f.callers.size >= 25) { feat.set(f.key, 'Shared'); why.set(f.key, '공용(많이 불림)'); }
  for (let round = 0, more = true; more && round < 20; round++) { more = false; for (const f of top) { if (feat.has(f.key)) continue; const c = cnt(); [...f.calls.keys(), ...f.callers].forEach(k => { const g = fns.get(k); if (feat.has(k) && feat.get(k) !== 'Shared' && g && g.callers.size < 25) add(c, feat.get(k)); }); const b = best(c), tot = [...c.values()].reduce((x, y) => x + y, 0); if (!b) continue;
    if (c.get(b) / tot >= 0.6) { feat.set(f.key, b); why.set(f.key, '부르는·불리는 함수'); } else { feat.set(f.key, 'Shared'); why.set(f.key, '공용(여러 기능)'); } more = true; } }
  const AI = /^(aiJSON|aiCall|aiJSONRetry|aiOne)$/, kindOf = f => { const o = L.layer.get(f.key) || {}, calls = [...f.calls.keys()].map(k => fns.get(k)?.name || ''); return calls.some(n => AI.test(n)) ? 'Generator' : calls.includes('openModal') ? 'Dialog' : (/HTML\d*$/.test(f.name) || o.layer === 'View' || o.layer === '섞임' && o.markup) ? 'Screen' : (o.adapter || o.service || o.store) ? 'Service' : W.has(f.key) || o.write ? 'Repository' : (o.layer === 'Controller' || o.handler) ? 'Controller' : 'Helper'; };
  return top.map(f => ({ name: f.name, loc: f.loc, feature: feat.get(f.key) || '미정', why: why.get(f.key) || '—', kind: kindOf(f) })); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; }, rev = arg('--rev'), label = arg('--label') || (rev ? rev.slice(0, 7) : 'www');
  const html = rev ? (() => { for (const p of ['www/index.html', 'index.html']) { try { const t = execFileSync('git', ['show', `${rev}:${p}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }); if (/ggm-main/.test(t)) return t; } catch { /* 그 커밋에 없음 */ } } throw new Error(`${rev}에 index.html이 없어요`); })() : readFileSync(resolve(arg('--html') || join(ROOT, 'www/index.html')), 'utf8');
  const units = await loadHtmlUnits(html, `${label}/index.html`), { fns } = buildGraph(units), top = [...fns.values()].filter(f => f.top && !f.table), short = m => String(m);
  const S = sameShapes(fns), K = sameSkeletons(fns), R = roleFamilies(fns), sf = stateFlow(units, fns);
  if (process.argv.includes('--map')) { const RD = readFileSync(join(ROOT, 'docs/redesign.md'), 'utf8'), DM = readDataMap(RD), F = featureMap(units, fns, html, DM, readScreenMap(RD)), feats = [...new Set(F.map(x => x.feature))].sort(), kinds = ['Repository', 'Generator', 'Service', 'Controller', 'Screen', 'Dialog', 'Helper'];
    const md = [`# 추상 매핑 — 함수 → 기능 · class 종류 (${label})`, '', `생성: \`node tools/redesign.mjs --map${rev ? ' --rev ' + rev : ''}\` · 매핑 표: docs/redesign.md 2절(data ${DM.size}칸) · 함수 ${F.length}`, '', `| 기능 | 합 | ${kinds.join(' | ')} |`, `|---|---|${kinds.map(() => '---').join('|')}|`,
      ...feats.map(ft => { const xs = F.filter(x => x.feature === ft); return `| ${ft} | ${xs.length} | ${kinds.map(k => xs.filter(x => x.kind === k).length).join(' | ')} |`; }), '', `기능이 정해진 까닭: ${['쓰는 data', '화면', '읽는 상태', '부르는·불리는 함수', '공용(많이 불림)', '공용(여러 기능)', '—'].map(w => `${w} ${F.filter(x => x.why === w).length}`).join(' · ')}`, '',
      '## 미정 함수(매핑 표에 없는 data만 다루거나 이어진 함수가 없음)', '', F.filter(x => x.feature === '미정').map(x => x.name).join(' · ')];
    writeFileSync(join(OUT, `redesign-map-${label}.md`), md.join('\n') + '\n'); writeFileSync(join(OUT, `redesign-map-${label}.json`), JSON.stringify(F, null, 1)); console.log(md.slice(4, 6 + feats.length).join('\n')); console.log(md[6 + feats.length + 1]); process.exit(0); }
  /* data 엔티티 = 연관 맵의 data 파일(chars.json·prog.json … — 상태 칸과 엔티티 필드까지, lib/map.mjs buildMap을 이 index.html에 돌림): 경로 수·쓰는 함수 수 */
  const M = buildMap(units, fns, sf, html), ent = new Map(); for (const d of Object.values(M.data)) { const e = ent.get(d.file) || { paths: 0, writers: new Set(), mods: new Set() }; e.paths++; Object.values(d.writers).flat().forEach(w => { e.writers.add(w); e.mods.add(String(fns.get(w)?.loc || '').split(':')[0]); }); ent.set(d.file, e); }
  const byMod = list => { const m = new Map(); list.forEach(x => m.set(short(x.mod), (m.get(short(x.mod)) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '); };
  const md = [`# 재설계용 거꾸로 분석 — ${label}`, '', `생성: \`node tools/redesign.mjs${rev ? ' --rev ' + rev : ''}\` · ${new Date().toISOString().slice(0, 16)} · 입력: ${rev ? rev + '의 index.html' : 'www/index.html'}(스크립트 블록 ${units.length})`, '',
    `함수 ${top.length} · class 선언 ${units.reduce((n, u) => { let c = 0; walk(u.tree.rootNode, x => { if (x.type === 'class_declaration') c++; }); return n + c; }, 0)} · 구조가 같은 함수 묶음 ${S.length}(함수 ${S.reduce((n, x) => n + x.fns.length, 0)}) · 같은 호출 뼈대 묶음 ${K.length}(함수 ${K.reduce((n, x) => n + x.fns.length, 0)})`, '',
    '## ③ 역할 꼴 — 같은 역할을 하는 함수(공통 상위 class 후보)', '', '| 역할 | 함수 수 | 모듈별 |', '|---|---|---|', ...Object.entries(R).map(([r, xs]) => `| ${r} | ${xs.length} | ${byMod(xs)} |`), '',
    '## ④ data 엔티티 — 만들기·고치기·지우기 함수와 모듈(한 창구 class 후보)', '', '| data 파일 | 경로 | 쓰는 함수 | 쓰는 스크립트 블록 |', '|---|---|---|---|', ...[...ent].sort((a, b) => b[1].mods.size - a[1].mods.size).map(([f, e]) => `| ${f} | ${e.paths} | ${e.writers.size} | ${e.mods.size} (${[...e.mods].map(short).slice(0, 8).join(' · ')}${e.mods.size > 8 ? ' …' : ''}) |`), '',
    '## ① 구조가 같은 함수 묶음(이름·글자 값만 다름)', '', ...S.slice(0, 40).map(x => `- 노드 ${x.size} × ${x.fns.length}: ${x.fns.map(f => `${f.name} (${f.loc.replace(/^src\//, '')})`).join(' · ')}`), S.length > 40 ? `- …외 ${S.length - 40}` : '', '',
    '## ② 같은 호출 뼈대(같은 흐름을 따로 구현)', '', ...K.slice(0, 40).map(x => `- [${x.calls.join(', ')}] × ${x.fns.length}: ${x.fns.map(f => f.name).join(' · ')}`), K.length > 40 ? `- …외 ${K.length - 40}` : ''];
  mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, `redesign-${label}.md`), md.join('\n') + '\n'); writeFileSync(join(OUT, `redesign-${label}.json`), JSON.stringify({ shapes: S, skeletons: K, roles: R, entities: Object.fromEntries([...ent].map(([f, e]) => [f, { paths: e.paths, writers: e.writers.size, mods: [...e.mods] }])) }, null, 1));
  console.log(md.slice(4, 5).join('') + ` → tools/out/redesign-${label}.md`); console.log(Object.entries(R).map(([r, xs]) => `${r} ${xs.length}`).join(' · ')); }
