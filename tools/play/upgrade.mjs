#!/usr/bin/env node
// 구버전·미비 생성 게임 감지·보완 검증(동적): 생성기·실행기가 계속 바뀌어도, 예전 빌드로 만들었거나 빠진 데 있는 게임을 지금 index.html이 알아채고 채우는지(사용자 지시).
//   항목: 포크 기능이 새로 만든 키·필드(tools/wiring.mjs의 구버전 감지·보완 표 — out/wiring.json upgrade). 게임: tools/play/games의 저장 게임(PC 서버 data)
//   항목마다 그 데이터만 뺀 "예전 게임"을 만들고(점검 판 auditSeen·캐릭터 생성 판 genVer도 0으로) 지금 빌드에 불러옴(앱의 불러오기 fix) →
//   ① 불러온 뒤 그대로 비었나(불러오기 이전이 채우면 보완) ② 점검 알림이 뜨나(auditSeen < auditVer) ③ 콘텐츠 점검(auditScan)이 그 항목을 잡나
//   ④ 자동 보완(앱의 liveFill + 점검 규칙 고치기 auditFixOne — 가짜 글 AI는 프롬프트의 형식 견본을 그럴듯한 답으로 채워 답함: tools/lib/combos.mjs fakeAnswer) 뒤 채워졌나
//   ⑤ 보완 뒤 다른 점검 항목이 새로 생기거나 늘었나: 실행 중 자동 채움 대상이 아니면 보완이 다른 데를 깬 것(새 문제 — 종료 코드 1), 대상이면 이어서 채울 항목
//   판정: 보완됨 · 감지됨(채우지는 못함) · 기본값으로 동작(없으면 코드 기본값 — 그 게임에 맞춘 값은 아님) · 놓침
//   node tools/play/upgrade.mjs [게임 폴더…]   → tools/play/reports/upgrade.md · upgrade.json (놓침이 있으면 종료 코드 1). 먼저 node tools/wiring.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPage, PC_DIR, ROOT } from './lib/page.mjs';
import { readGame, gidOf, hasGame } from './lib/data.mjs';
import { schemaOf, lenientJSON, fakeAnswer } from '../lib/combos.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const WJ = join(ROOT, 'tools/out/wiring.json'); if (!existsSync(WJ)) { console.log('먼저 node tools/wiring.mjs (구버전 감지·보완 표)'); process.exit(2); }
const items = JSON.parse(readFileSync(WJ, 'utf8')).upgrade.flatMap(f => f.rows.map(r => ({ f: f.id, what: r.what, kind: r.kind, via: r.via, status: r.status })));
const uniq = [...new Map(items.map(x => [x.what, x])).values()];
const dirs = (args.length ? args.map(d => resolve(d)) : readdirSync(join(HERE, 'games')).map(d => join(HERE, 'games', d))).filter(d => gidOf(d) && hasGame(PC_DIR, gidOf(d)));
const results = [];
for (const dir of dirs) { const g = readGame(PC_DIR, gidOf(dir));
  const { out, errors } = await withPage(page => page.evaluate(async ({ game, items, libSrc }) => {
    const [schemaOf, lenientJSON, fakeAnswer] = ['schemaOf', 'lenientJSON', 'fakeAnswer'].map(k => new Function('return ' + libSrc[k])()), fakeSt = { n: 0 };
    appStorage.setItem(PKEY, JSON.stringify({ active: 'gen', fallback: false, list: [{ id: 'gen', type: 'anthropic', name: 'tools/play', key: 'replay', model: 'replay', quick: 'replay-quick' }] })); setupAI();
    let sent = 0; const realHttp = http; http = async (url, opts) => { if (!/api\.anthropic\.com\/v1\/messages/.test(url)) return realHttp(url, opts); sent++; const first = opts.body.messages[0].content, prompt = typeof first === 'string' ? first : first.map(b => b.text || '').join(''), sc = schemaOf(prompt), v = sc && sc.body ? lenientJSON(sc.body) : null;
      await new Promise(r => setTimeout(r, 10)); return { status: 200, text: JSON.stringify({ content: [{ type: 'text', text: v ? JSON.stringify(fakeAnswer(v, fakeSt)) : '{}' }], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } }) }; };
    toast = () => {}; appConfirm = async () => true; window.reloadGame = () => {}; P().seenOpening = true;
    const ents = (g, on) => on === '캐릭터' ? (g.chars || []) : on === '세력' ? ((g.world || {}).factions || []) : on === '스테이지' ? (g.chapters || []).flatMap(c => c.stages || []) : [];
    const get = (g, what) => { if (what.startsWith('G.')) { let v = g; for (const k of what.split('.').slice(1)) { if (v == null) return undefined; v = v[k]; } return v; } const [on, f] = what.split('.'); return ents(g, on).map(o => o[f]); };
    const filled = v => Array.isArray(v) ? (v.length > 0 && v.some(x => x != null && x !== '' && !(Array.isArray(x) && !x.length) && !(typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length))) : v != null && v !== '' && !(typeof v === 'object' && !Object.keys(v).length);
    const strip = (g, what) => { if (what.startsWith('G.')) { const p = what.split('.').slice(1), last = p.pop(); let o = g; for (const k of p) o = o && o[k]; if (o) delete o[last]; return; } const [on, f] = what.split('.'); ents(g, on).forEach(o => { delete o[f]; }); };
    const R = [];
    for (const it of items) { const g0 = JSON.parse(game), had = filled(get(g0, it.what)); if (!had) { R.push({ what: it.what, res: '건너뜀', why: '원래 게임에도 비어 있음' }); continue; }
      strip(g0, it.what); g0.meta = g0.meta || {}; g0.meta.auditSeen = 0; (g0.chars || []).forEach(c => { c.genVer = 0; }); // 예전 빌드로 만든 게임처럼
      G = fix(g0); applyMeta(); const afterLoad = filled(get(G, it.what)), notice = (+G.meta.auditSeen || 0) < auditVer(), scan0 = auditScan(), rules = (it.via || []).map(v => v.replace(/\(.*$/, '')).filter(id => AUDIT_RULES.some(r => r.id === id)), hit = scan0.filter(x => rules.includes(x.rule.id)).map(x => `${x.rule.id} ${x.items.length}`);
      let up = afterLoad, err = ''; const sent0 = sent; if (!afterLoad) { try { await liveFill([]); for (const x of auditScan().filter(x => rules.includes(x.rule.id))) for (const o of x.items.slice(0, 6)) await auditFixOne(x.rule, o); } catch (e) { err = String(e && e.message || e).slice(0, 120); } up = filled(get(G, it.what)); }
      const cnt = sc => Object.fromEntries(sc.map(x => [x.rule.id, x.items.length])), c0 = cnt(scan0), c1 = cnt(auditScan()), more = Object.keys(c1).filter(id => c1[id] > (c0[id] || 0)), fill = new Set([...LIVE_FILL_AUTO, ...LIVE_FILL_AI]), worse = more.filter(id => !fill.has(id)).map(id => `${id} ${c0[id] || 0}→${c1[id]}`), next = more.filter(id => fill.has(id)).map(id => `${id} ${c0[id] || 0}→${c1[id]}`);
      /* 보완이 다른 점검 항목을 새로 만들지 않았나(예: 포지션을 바꿨는데 캐릭터 포지션이 목록에 없음). 자동 채움 대상이면 이어서 채울 항목(예: 일정 장소를 만들면 캐릭터별 장소 장면이 새로 필요) */
      const lazy = (it.via || []).includes('없으면 기본값');
      const asked = sent - sent0; R.push({ what: it.what, worse, next, res: afterLoad ? '보완됨(불러오기)' : up ? '보완됨(자동)' : hit.length ? (asked ? '감지됨·보완 요청했으나 안 채워짐' : '감지됨(보완 요청 없음)') : lazy ? '기본값으로 동작' : '놓침', notice, hit, err: err || (asked ? `글 AI 요청 ${asked}` : '') }); }
    return R; }, { game: JSON.stringify(g.game), items: uniq, libSrc: { schemaOf: schemaOf.toString(), lenientJSON: lenientJSON.toString(), fakeAnswer: fakeAnswer.toString() } }), { tag: 'upgrade-' + basename(dir) });
  results.push({ game: basename(dir), title: g.title, rows: out, pageErrors: errors.slice(0, 5) });
  const c = k => out.filter(x => x.res.startsWith(k)).length; console.log(`${basename(dir)}: 보완됨 ${c('보완됨')} · 감지됨 ${c('감지됨')} · 기본값으로 동작 ${c('기본값')} · 놓침 ${c('놓침')} · 건너뜀 ${c('건너뜀')} · 보완 뒤 새 문제 ${out.filter(x => (x.worse || []).length).length}`); }
const T = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const md = [`# 구버전·미비 생성 게임 감지·보완 검증`, '', `생성: \`node tools/play/upgrade.mjs\` · ${new Date().toISOString().slice(0, 16)} · 항목 ${uniq.length}(tools/out/wiring.json — 포크 기능이 새로 만든 키·필드) · 항목마다 그 데이터만 뺀 예전 게임(점검 판·생성 판 0)을 지금 빌드에 불러와 감지·자동 보완`, '',
  ...results.flatMap(r => [`## ${r.game} — ${r.title}`, '', T(['키·필드', '판정', '점검 알림', '점검 발견', '보완 뒤 새 문제', '이어서 채울 항목', '비고'], r.rows.map(x => [x.what, x.res, x.notice ? '뜸' : x.res === '건너뜀' ? '' : '안 뜸', (x.hit || []).join(', '), (x.worse || []).join(', '), (x.next || []).join(', '), x.err || x.why || ''])), r.pageErrors.length ? `\n페이지 오류: ${r.pageErrors.join(' / ')}` : '', ''])].join('\n');
mkdirSync(join(HERE, 'reports'), { recursive: true }); writeFileSync(join(HERE, 'reports/upgrade.md'), md); writeFileSync(join(HERE, 'reports/upgrade.json'), JSON.stringify(results, null, 1));
console.log('→ tools/play/reports/upgrade.md'); if (results.some(r => r.rows.some(x => x.res === '놓침' || (x.worse || []).length))) process.exitCode = 1;
