#!/usr/bin/env node
// 연관 맵 도구(사용자 지시): 모듈 집합(src) → 빌드 → index.html(생성기·실행기·편집기) → 생성·실행·편집 → data 게임 파일의 연결을 맵으로 — 연관 지점을 매번 다시 찾지 않게
//   index.html 층은 기능 표면(메뉴 → 화면·패널·창 · 배경 — lib/surface.mjs)으로 추상화하고 모듈이 어느 기능에 얽혔는지·조각(합칠 곳)·슈퍼(나눌 기능) 판정
//   node tools/map.mjs                 입력(src 파일·www/index.html·시험 게임 data)이 바뀌었으면 맵을 다시 만들고 바뀐 연결을 "최근 변화"에 남김(증분 갱신), 안 바뀌었으면 그대로
//   node tools/map.mjs --check         맵이 지금 입력과 맞나(안 맞으면 exit 1 — CI)
//   node tools/map.mjs --why <말>      거꾸로 따라가기: data 경로·함수·모듈 이름 또는 docs/modules.md 절 제목의 말(시나리오·스킬·이격 …) → 만드는 곳(역할) → index.html 줄 → src 모듈 → 점검 규칙·프롬프트 조각·연계 모듈
//   node tools/map.mjs --strict        기능 표면 판정(조각·슈퍼 모듈·파편화 기능 단위)이 기준선보다 늘면 exit 1 · --update-baseline
//   node tools/map.mjs --game <폴더>    게임 하나(tools/play/games/<이름> 또는 pc/data/<게임id>)의 data 경로마다 값이 있나와 만드는 곳
//   [--force] 바뀐 게 없어도 다시 만듦 → docs/map.md(사람이 따라가는 맵) · docs/map.json(질의·차이 비교)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { buildMap, mapDiff, valuesAt } from './lib/map.mjs';
import { readGame, gidOf } from './play/lib/data.mjs';
import { compare, readBaseline, writeBaseline } from './lib/ratchet.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const JSONF = join(ROOT, 'docs/map.json'), MDF = join(ROOT, 'docs/map.md'), PC = join(ROOT, 'pc'), GAMES = join(ROOT, 'tools/play/games');
const sha = t => createHash('sha1').update(t).digest('hex').slice(0, 12), tree = d => readdirSync(d).sort().flatMap(f => statSync(join(d, f)).isDirectory() ? tree(join(d, f)) : [join(d, f)]);
const games = () => existsSync(GAMES) ? readdirSync(GAMES).map(d => ({ name: d, gid: gidOf(join(GAMES, d)) })).filter(x => x.gid && existsSync(join(PC, 'data', x.gid, 'game.json'))) : [];
// 입력 해시: src 파일마다 · 빌드된 index.html · 시험 게임 data(종류별 파일)
function inputs() { const src = Object.fromEntries(tree(join(ROOT, 'src')).filter(f => /\.(js|html|css)$/.test(f)).map(f => [relative(ROOT, f), sha(readFileSync(f))]));
  const www = existsSync(join(ROOT, 'www/index.html')) ? sha(readFileSync(join(ROOT, 'www/index.html'))) : '', gm = Object.fromEntries(games().map(g => [g.name, sha(tree(join(PC, 'data', g.gid)).map(f => readFileSync(f, 'utf8')).join('\n'))]));
  const tool = sha(['tools/map.mjs', ...['map', 'flow', 'graph', 'wiring', 'lifecycle', 'upgrade', 'source', 'scope', 'surface'].map(n => `tools/lib/${n}.mjs`)].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n')); /* 맵을 만드는 도구가 바뀌어도 다시 만듦 */
  return { src, www, games: gm, tool }; }
const changedInputs = (a, b) => { if (!a) return { first: true }; const keys = o => Object.keys(o || {}), diff = (x, y) => ({ added: keys(y).filter(k => !(k in (x || {}))), removed: keys(x).filter(k => !(k in (y || {}))), changed: keys(y).filter(k => k in (x || {}) && x[k] !== y[k]) });
  const s = diff(a.src, b.src), g = diff(a.games, b.games), any = d => d.added.length + d.removed.length + d.changed.length; return any(s) || any(g) || a.www !== b.www || a.tool !== b.tool ? { src: s, www: a.www !== b.www, games: g, tool: a.tool !== b.tool } : null; };
const head = () => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };

async function make() { const units = await loadUnits(ROOT), fns = buildGraph(units).fns, sf = stateFlow(units, fns), html = existsSync(join(ROOT, 'www/index.html')) ? readFileSync(join(ROOT, 'www/index.html'), 'utf8') : '';
  const m = buildMap(units, fns, sf, html), G = games().map(g => ({ name: g.name, game: readGame(PC, g.gid).game }));
  for (const [k, d] of Object.entries(m.data)) d.games = G.map(g => valuesAt(g.game, d.file, d.path).length ? 1 : 0).reduce((a, b) => a + b, 0); /* 시험 게임 중 값이 있는 게임 수 */
  m.gamesN = G.length; return m; }

// ── docs/map.md ──
const ROLES = ['생성기', '실행기', '편집기', '기타'], FILE_TITLE = { 'chars.json': '캐릭터', 'npcs.json': 'NPC', 'chapters.json': '시나리오(장·스테이지·대본·적)', 'world.json': '세계관(세력·도감·설정)', 'meta.json': '게임 설정·규칙(건조·포지션·밸런스·일정 …)', 'prog.json': '진행(플레이어)', 'lib.json': '자료실(배경·소품·CG·적)', 'threads.json': '메신저(톡)', 'events.json': '이벤트', 'banners.json': '배너(가챠)', 'dispatches.json': '파견', 'rels.json': '관계', 'opening.json': '오프닝', 'game.json': '나머지' };
const short = m => String(m).replace(/^src\/(main|modules)\//, '').replace(/\.js$/, ''), cell = (fs, map, n = 4) => fs?.length ? fs.slice(0, n).map(k => `${map.fns[k]?.name || k}<sub>${short(map.fns[k]?.module || '')}</sub>`).join(' ') + (fs.length > n ? ` …외 ${fs.length - n}` : '') : '';
function md(m) { const L = [], t = (h, rows) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');
  L.push('# 연관 맵 — 모듈 → 빌드 → index.html(생성기·실행기·편집기) → data 게임 파일', '', `생성: \`node tools/map.mjs\` · ${m.at} · git ${m.head} · 입력: src ${Object.keys(m.inputs.src).length}파일 · www/index.html ${m.inputs.www} · 시험 게임 ${m.gamesN} — 입력이 바뀌면 다시 만들고 바뀐 연결은 맨 아래 "최근 변화"에(증분 갱신, CI \`--check\`가 맵이 낡았는지 봄)`, '',
    '## 읽는 법 — 거꾸로 따라가기', '', 'index.html은 **생성기**(새 게임을 만듦)·**실행기**(만든 게임을 구동 — 플레이·실행 중 AI·예전 게임 불러오기)·**편집기**(만든 게임의 내용을 고치고 업데이트 — 편집 화면·콘텐츠 점검·AI 추가 지시)를 겸합니다(CLAUDE.md §0). 게임 data(`data/<게임id>/<종류>.json`)의 어떤 경로가 이상하면:',
    '', '1. 아래 1절에서 그 파일·경로를 찾아 **누가 만들고 고치나**(역할별 함수<sub>모듈</sub>)를 봄 — 시나리오면 `chapters.json`, 캐릭터 밸런스·스킬·이격이면 `chars.json`(`[].skills`·`[].hp`·`[].alt`·`[].over` …)',
    '2. `node tools/map.mjs --why <경로·함수·말>` — 함수마다 src 파일:줄 · index.html 줄 · 쓰는 프롬프트 조각, 그 경로의 점검 규칙·읽는 모듈·연계 모듈까지 한 번에', '3. 4절에서 그 모듈의 index.html 줄 범위·쓰는 데이터·연계 모듈(호출 수)을 보고, 고친 뒤 `node tools/map.mjs`로 맵을 갱신', '4. 화면·창이 이상하면 2절(기능 표면)에서 그 기능 단위에 얽힌 모듈을, 3절에서 모듈 판정(조각·슈퍼)을 봄 — `--why <화면·창 이름>`도 기능 단위를 찾음', '',
    `역할 판정(정적): 생성기 = 새 게임 생성 단계(newGame…)가 부르는 함수 · 실행기 = 실행 중 AI(liveTick)·불러오기(fix)·앱을 열 때(부팅·게임 열기)가 부르거나, 사용자 조작이 진행(prog.json)을 쓰거나, 플레이 조작(진행을 쓰는 사용자 함수 — CRES()·CBUILD() 같은 접근 함수로 받은 객체 포함, 액션 분배기 제외)에서 닿는 콘텐츠 쓰기(예: 건조 바리에이션) · 편집기 = 사용자 조작이 플레이 조작을 거치지 않고 콘텐츠를 씀 · 기타 = 위 시작점에서 닿지 않음(엔진 안쪽 등). 한 함수가 여러 역할일 수 있음(예: cleanChar는 생성·실행 중 AI 둘 다). 「게임」 = 시험 게임 ${m.gamesN}개 중 값이 있는 수`, '', '## 1. data 게임 파일 → 만드는 곳(역할) → 모듈', '');
  const byFile = new Map(); for (const [k, d] of Object.entries(m.data)) { if (!byFile.has(d.file)) byFile.set(d.file, []); byFile.get(d.file).push([k, d]); }
  for (const [file, rows] of [...byFile].sort((a, b) => a[0].localeCompare(b[0]))) { const wr = rows.filter(([, d]) => Object.keys(d.writers).length); if (!wr.length) continue;
    L.push(`### ${file} — ${FILE_TITLE[file] || ''}`, '', t(['경로', '생성기', '실행기', '편집기', '기타', '점검 규칙', '프롬프트 조각', '게임'], wr.map(([, d]) => [d.path || '(파일 전체)', ...ROLES.map(r => cell(d.writers[r], m)), d.audits.join(' '), d.prompts.slice(0, 5).join(' ') + (d.prompts.length > 5 ? ` …외 ${d.prompts.length - 5}` : ''), m.gamesN ? `${d.games}/${m.gamesN}` : ''])), ''); }
  L.push(...surfaceMd(m, t));
  L.push('## 4. 모듈 → index.html 줄 · 역할 · 쓰는 데이터 · 연계 모듈', '', t(['모듈', 'index.html 줄', '함수', '역할(쓰기 수)', '쓰는 data', '연계 모듈(호출 수)'], Object.entries(m.modules).filter(([, v]) => v.fns).map(([mod, v]) => [short(mod), v.files.filter(f => f.www).map(f => `${f.www[0]}~${f.www[1]}`).join(', '), v.fns, Object.entries(v.roles).map(([r, n]) => `${r} ${n}`).join(' · '), v.writes.slice(0, 6).join(', ') + (v.writes.length > 6 ? ` …외 ${v.writes.length - 6}` : ''), v.neighbors.slice(0, 5).map(([n, c]) => `${short(n)} ${c}`).join(', ')])), '');
  L.push('## 5. 최근 변화(증분 갱신 기록)', ''); for (const c of (m.changes || []).slice(0, 8)) { const f = c.inputs || {}, src = f.src ? [...f.src.added.map(x => '+' + x), ...f.src.removed.map(x => '−' + x), ...f.src.changed] : [];
    L.push(`- ${c.at} · git ${c.head}${f.first ? ' · 처음 만듦' : ''}${src.length ? ` · src ${src.length}: ${src.slice(0, 8).map(short).join(', ')}${src.length > 8 ? ' …' : ''}` : ''}${f.www ? ' · index.html 다시 빌드' : ''}${f.games && (f.games.changed.length + f.games.added.length) ? ` · 게임 data ${[...f.games.added, ...f.games.changed].join(', ')}` : ''}`);
    if (c.fns && (c.fns.added.length + c.fns.removed.length + c.fns.moved.length)) L.push(`  - 함수: 추가 ${c.fns.added.length}${c.fns.added.length ? ` (${c.fns.added.slice(0, 6).join(', ')})` : ''} · 삭제 ${c.fns.removed.length}${c.fns.removed.length ? ` (${c.fns.removed.slice(0, 6).join(', ')})` : ''} · 옮김 ${c.fns.moved.length}${c.fns.moved.length ? ` (${c.fns.moved.slice(0, 4).join('; ')})` : ''}`);
    for (const d of (c.data || []).slice(0, 10)) L.push(`  - ${d.path}: ${d.added.length ? '+' + d.added.join(' +') : ''}${d.removed.length ? ' −' + d.removed.join(' −') : ''}`); }
  return L.join('\n') + '\n'; }

// 2·3절: index.html 기능 표면(lib/surface.mjs) — 메뉴 → 기능 단위(화면·패널·공용 창·배경) → 얽힌 모듈, 모듈 판정
const KIND = { screen: '화면', panel: '패널', window: '공용 창', background: '배경' };
function surfaceMd(m, t) { const S = m.surface; if (!S) return []; const L = [], F = S.feats, lab = u => F[u]?.label || u, mods = xs => xs.slice(0, 5).map(([x, n]) => `${short(x)} ${n}`).join(', ') + (xs.length > 5 ? ` …외 ${xs.length - 5}` : '');
  const menus = [...S.tabs.map(x => [x.key, x.label]), ['배경', '배경(누르지 않아도 하는 일)'], ['공용', '여러 메뉴가 여는 창']];
  L.push('## 2. index.html 기능 표면 → 기능 단위 → 얽힌 모듈', '', '산출물 index.html이 사용자에게 보여 주고 수행하는 기능을 코드에서 뽑은 분류(지금 모듈 구조는 기준이 아님 — 원안 한 파일을 고려 없이 나눈 것이라 대어 보는 대상): 아래 탭(메뉴) → 화면(경로표)·설정 하위 화면의 패널 → 창(openModal) + 배경(새 게임 생성·실행 중 AI·불러오기·앱 시작). 한 화면에서만 여는 창은 그 화면 안, 여러 단위가 여는 창은 공용 창. 함수는 동작(data-act → 처리기)과 호출을 따라 **가장 가까운 기능 단위**에 붙임(같은 거리면 같이 씀 — 공용·엔진). 「함수」 = 그 단위에서만 닿는 함수 수', '');
  for (const [mk, ml] of menus) { const rows = Object.entries(F).filter(([, f]) => f.menu === mk && f.n).sort((a, b) => b[1].n - a[1].n); if (!rows.length) continue;
    L.push(`### ${ml}`, '', t(['기능 단위', '종류', '함수', '얽힌 모듈(함수 수)', '안의 창'], rows.map(([u, f]) => [f.label, KIND[f.kind] || f.kind, f.n, mods(f.mods), f.windows.slice(0, 4).join(' · ') + (f.windows.length > 4 ? ` …외 ${f.windows.length - 4}` : '')])), ''); }
  const V = S.verdicts, cnt = k => V.filter(v => v.kind === k).length;
  L.push('## 3. 모듈 판정 — 고유 · 조각(합칠 곳) · 슈퍼(나눌 기능) · 엔진 · 기반', '', `src/main 모듈 ${V.length}: 고유 ${cnt('고유')} · 조각 ${cnt('조각')} · 슈퍼 ${cnt('슈퍼')} · 엔진 ${cnt('엔진')} · 기반 ${cnt('기반')} · 파편화 단위 ${S.frag.length} — 판정(lib/surface.mjs moduleVerdicts): 고유 = 한 기능 단위가 중심(같은 데이터·창·도우미를 짝으로 같이 쓰는 실행기 화면·편집기 패널·창은 한 기능) · 조각 = 중심 단위 함수가 다른 모듈에 2배 이상 → 그 모듈로 합칠 대상 · 슈퍼 = 관계없는 기능(함수 max(3, 20%)↑)을 둘 이상, 또는 함수 2개↑ 기능을 4개 이상 담음 → 나눌 대상 · 엔진 = 여러 메뉴가 같이 쓰는 함수 중심 · 기반 = 허브 함수 중심. \`node tools/map.mjs --strict\`: 조각·슈퍼·파편화가 기준선(tools/baseline.json의 surface)보다 늘면 실패`, '');
  const sp = V.filter(v => v.kind === '슈퍼'); if (sp.length) L.push('### 슈퍼 모듈 — 나눌 기능', '', t(['모듈', '함수(기능·공용·기반·닿지 않음)', '나눌 기능 묶음 → 옮길 곳(그 단위 함수가 가장 많은 다른 모듈, 없으면 새 자리)'], sp.map(v => [short(v.mod), `${v.n} (${v.feat}·${v.shared}·${v.base}·${v.unreached})`, v.split.map(x => `[${x.units.slice(0, 3).map(lab).join(' + ')}${x.units.length > 3 ? ' …' : ''}] ${x.n} → ${x.to ? short(x.to) : '새 자리'}`).join(' / ')])), '');
  const fr = V.filter(v => v.kind === '조각'); if (fr.length) L.push('### 조각 모듈 — 합칠 곳', '', t(['모듈', '함수', '중심 기능 단위', '이 모듈', '합칠 곳(그 단위 함수)'], fr.map(v => [short(v.mod), v.n, lab(v.unit), v.n0, `${short(v.to)} (${v.n1})`])), '');
  if (S.frag.length) L.push('### 파편화 기능 단위 — 3개 이상 모듈에 흩어지고 가장 많은 모듈 몫 60% 미만', '', t(['기능 단위', '함수', '가장 많은 모듈 몫', '모듈(함수 수)'], S.frag.map(x => [lab(x.unit), x.n, x.top + '%', mods(x.mods)])), '');
  const rest = V.filter(v => !['슈퍼', '조각'].includes(v.kind)); L.push('### 그 밖의 모듈', '', t(['모듈', '판정', '함수(기능·공용·기반·닿지 않음)', '중심 기능 단위'], rest.map(v => [short(v.mod), v.kind, `${v.n} (${v.feat}·${v.shared}·${v.base}·${v.unreached})`, v.unit ? lab(v.unit) : ''])), '');
  return L; }

// ── 거꾸로 따라가기 ──
// docs/modules.md에서 그 말이 든 절(제목이면 절 전체, 본문이면 그 줄): src 경로 · `이름`(함수) · `c.alt` 같은 필드
function sections(q) { const p = join(ROOT, 'docs/modules.md'), out = { paths: new Set(), names: new Set(), fields: new Set() }; if (!existsSync(p)) return out; let on = false;
  for (const line of readFileSync(p, 'utf8').split('\n')) { if (/^##\s/.test(line)) { on = line.includes(q); continue; } if (!on && !line.includes(q)) continue;
    for (const m of line.matchAll(/src\/(?:main|modules)\/[\w./-]+/g)) out.paths.add(m[0]); if (!line.includes(q)) continue;
    for (const m of line.matchAll(/`([^`]+)`/g)) { const t = m[1]; if (/^[A-Za-z_$][\w$]*$/.test(t)) out.names.add(t); const f = t.match(/^(?:c|ch|s|f|G(?:\.\w+)*)\.([A-Za-z_]\w*)(?:\s|$|=)/); if (f) out.fields.add(f[1]); } }
  return out; }
function why(m, q) { const lq = q.toLowerCase(), sec = sections(q), mods = new Set([...sec.paths].map(f => /\/$/.test(f) ? f : (Object.keys(m.modules).find(x => f === x || f.startsWith(x)) || f))), files = Object.keys(FILE_TITLE).filter(f => FILE_TITLE[f].includes(q));
  /* 맞는 정도: data 경로·파일 설명(시나리오 → chapters.json)·docs/modules.md 그 말 줄의 필드(`c.alt`) 3 · 함수 이름(그 줄에 적힌 함수 포함) 2 · 그 절·줄의 모듈, 모듈 경로 1 — 같으면 쓰는 함수가 많은 것부터 */
  const score = ([k, d]) => { const ws = Object.values(d.writers).flat(), mod = f => m.fns[f]?.module || '', nm = f => m.fns[f]?.name || '', leaf = String(d.path).split('.').pop().replace(/\[\]$/, ''); return k.toLowerCase().includes(lq) || files.includes(d.file) || sec.fields.has(leaf) ? 3 : ws.some(f => nm(f).toLowerCase() === lq || sec.names.has(nm(f))) ? 2 : ws.some(f => mods.has(mod(f)) || mod(f).toLowerCase().includes(lq)) ? 1 : 0; };
  const hitData = Object.entries(m.data).map(e => [e, score(e)]).filter(([, s]) => s).sort((a, b) => b[1] - a[1] || Object.values(b[0][1].writers).flat().length - Object.values(a[0][1].writers).flat().length).map(([e]) => e);
  const out = [`「${q}」 — data 경로 ${hitData.length}${mods.size ? ` · docs/modules.md 절의 모듈: ${[...mods].map(short).join(', ')}` : ''}`];
  for (const [k, d] of hitData.slice(0, 20)) { out.push('', `■ ${k}${m.gamesN ? `  (시험 게임 ${d.games}/${m.gamesN}에 값 있음)` : ''}`);
    for (const r of ROLES) if (d.writers[r]) out.push(`  ${r}: ${d.writers[r].slice(0, 8).map(f => { const x = m.fns[f]; return x ? `${x.name} (${x.file}:${x.line}${x.www ? ` · index.html ${x.www}줄` : ''})` : f; }).join(', ')}${d.writers[r].length > 8 ? ` …외 ${d.writers[r].length - 8}` : ''}`);
    if (d.audits.length) out.push(`  점검 규칙: ${d.audits.join(', ')}`); const pw = [...new Set(Object.values(d.writers).flat())].filter(f => m.fns[f]?.prompts.length); if (pw.length) out.push(`  프롬프트 조각(함수별): ${pw.slice(0, 6).map(f => `${m.fns[f].name} ${m.fns[f].prompts.slice(0, 8).join('·')}${m.fns[f].prompts.length > 8 ? ` …외 ${m.fns[f].prompts.length - 8}` : ''}`).join(' / ')}`); if (d.readers.length) out.push(`  읽는 모듈: ${d.readers.slice(0, 6).map(([x, n]) => `${short(x)} ${n}`).join(', ')}`); }
  const wm = new Set(hitData.flatMap(([, d]) => Object.values(d.writers).flat().map(f => m.fns[f]?.module).filter(Boolean)));
  if (wm.size) { out.push('', '■ 관련 모듈(index.html 줄 · 연계 모듈)'); for (const x of [...wm].slice(0, 12)) { const v = m.modules[x]; if (v) out.push(`  ${short(x)}: index.html ${v.files.filter(f => f.www).map(f => `${f.www[0]}~${f.www[1]}`).join(', ')} · 연계 ${v.neighbors.slice(0, 5).map(([n, c]) => `${short(n)} ${c}`).join(', ')}`); } }
  if (hitData.length > 20) out.push('', `…외 ${hitData.length - 20}개 경로 — 말을 더 좁혀 보세요`);
  const hitF = Object.entries(m.surface?.feats || {}).filter(([, f]) => f.label.toLowerCase().includes(lq) || f.windows.some(w => w.toLowerCase().includes(lq)));
  if (hitF.length) { out.push('', `■ index.html 기능 단위 ${hitF.length}`); for (const [u, f] of hitF.slice(0, 8)) { const fs = Object.entries(m.fns).filter(([, x]) => x.place === u).map(([, x]) => `${x.name}<${short(x.module)}>`); out.push(`  ${f.label} (${KIND[f.kind] || f.kind} · ${f.menu}) — 함수 ${f.n} · 모듈 ${f.mods.slice(0, 6).map(([x, n]) => `${short(x)} ${n}`).join(', ')}${f.windows.length ? ` · 창 ${f.windows.slice(0, 5).join(' · ')}` : ''}`); if (fs.length) out.push(`    data를 쓰는 함수: ${fs.slice(0, 10).join(', ')}${fs.length > 10 ? ` …외 ${fs.length - 10}` : ''}`); } }
  return out.join('\n'); }
function gameView(m, dir) { const d = resolve(dir), gid = gidOf(d) || basename(d), g = readGame(existsSync(join(d, 'game.json')) ? resolve(d, '../..') : PC, gid).game, rows = [];
  for (const [k, x] of Object.entries(m.data)) { if (!Object.keys(x.writers).length) continue; const n = valuesAt(g, x.file, x.path).length; rows.push([k, n, Object.entries(x.writers).map(([r, fs]) => `${r} ${fs.slice(0, 3).map(f => m.fns[f]?.name || f).join('·')}`).join(' / ')]); }
  return [`게임 ${gid}: data 경로 ${rows.length} · 값 없음 ${rows.filter(r => !r[1]).length}`, ...rows.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([k, n, w]) => `${n ? '  ' : '∅ '}${k}${n ? ` (${n})` : ''} — ${w}`)].join('\n'); }

const old = existsSync(JSONF) ? JSON.parse(readFileSync(JSONF, 'utf8')) : null, now = inputs(), ch = changedInputs(old?.inputs, now);
if (argv.includes('--check')) { console.log(ch ? `맵이 낡았어요 — node tools/map.mjs로 갱신하세요(${ch.first ? '맵 없음' : `src ${ch.src.added.length + ch.src.removed.length + ch.src.changed.length} · index.html ${ch.www ? '바뀜' : '같음'} · 게임 ${ch.games.added.length + ch.games.changed.length + ch.games.removed.length}${ch.tool ? ' · 맵 도구 바뀜' : ''}`})` : '맵이 지금 입력과 맞아요'); process.exit(ch ? 1 : 0); }
let map = old;
if (ch || argv.includes('--force') || !old) { const m = await make(), diff = mapDiff(old, m); m.at = new Date().toISOString().slice(0, 16); m.head = head(); m.inputs = now; m.changes = [{ at: m.at, head: m.head, inputs: ch || { forced: true }, ...diff }, ...(old?.changes || [])].slice(0, 20);
  writeFileSync(JSONF, JSON.stringify(m, null, 1) + '\n'); writeFileSync(MDF, md(m)); map = m;
  console.log(`연관 맵 갱신: data 경로 ${Object.keys(m.data).length} · 함수 ${Object.keys(m.fns).length} · 모듈 ${Object.keys(m.modules).length} · 바뀐 연결: 함수 +${diff.fns.added.length} −${diff.fns.removed.length} 옮김 ${diff.fns.moved.length} · data ${diff.data.length}경로 → docs/map.md · docs/map.json`); }
else if (!arg('--why') && !arg('--game')) console.log('변화 없음 — 맵 그대로(docs/map.md)');
/* 래칫: 조각·슈퍼 모듈과 파편화 단위가 기준선(tools/baseline.json의 surface)보다 늘면 --strict 실패. 처음엔 지금 값을 기준선으로 */
if (argv.includes('--strict') || argv.includes('--update-baseline')) { const S = map.surface || {}, F = [...(S.verdicts || []).filter(v => v.kind === '슈퍼' || v.kind === '조각').map(v => ({ key: `기능 표면 ${v.kind}|${v.mod}`, num: { 함수: v.kind === '슈퍼' ? v.feat : v.n }, text: `${v.kind} ${short(v.mod)}` })),
    ...(S.frag || []).map(x => ({ key: `기능 표면 파편화|${S.feats[x.unit]?.label || x.unit}`, num: { 모듈: x.mods.length }, text: `파편화 ${S.feats[x.unit]?.label || x.unit} 모듈 ${x.mods.length}` }))], B = readBaseline(ROOT, 'surface'), D = B ? compare(B, F) : null;
  if (argv.includes('--update-baseline')) { if (D && (D.added.length || D.worse.length)) { console.log('기준선을 올리는 갱신은 하지 않아요 — 모듈을 고치세요'); process.exit(1); } writeBaseline(ROOT, F, 'surface'); console.log(`기능 표면 기준선: ${F.length}개`); }
  else if (D) { console.log(`기능 표면 판정 기준선 대비: 새로 생김 ${D.added.length} · 나빠짐 ${D.worse.length} · 해결 ${D.fixed.length} · 좋아짐 ${D.better.length}`); [...D.added, ...D.worse].forEach(f => console.log('  + ' + f.text)); if (D.added.length || D.worse.length) process.exit(1); }
  else console.log('기능 표면 기준선 없음 — node tools/map.mjs --update-baseline'); }
if (arg('--why')) console.log(why(map, arg('--why')));
if (arg('--game')) console.log(gameView(map, arg('--game')));
