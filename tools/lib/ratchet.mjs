// 위반 래칫: 분석 결과를 "줄 번호 없는 안정된 키"의 발견 목록으로 바꾸고, 기준선(tools/baseline.json) 또는 git 기준 커밋과 비교해
// 새로 생김 · 나빠짐(같은 항목의 복잡도·줄·횟수 증가) · 해결 · 좋아짐을 가려요. --strict는 새로 생김·나빠짐이 있으면 실패.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const noLoc = s => String(s).replace(/[\w./가-힣-]+\.(?:js|mjs|css|html|py):\d+(?::\d+)?/g, '@').replace(/\s+/g, ' ').trim();
const file = loc => String(loc || '').split(':')[0];

// 분석 결과(J) → [{cat, key, text, num}] — key는 줄이 바뀌어도 같은 항목이면 같게
export function findings(J) {
  const F = [], add = (cat, key, text, num = {}) => F.push({ cat, key: `${cat}|${key}`, text, num });
  J.errors.forEach(e => add('오류', `${e.kind} ${noLoc(e.msg)}`, `${e.kind}: ${e.msg}`));
  J.warns.forEach(e => add('경고', `${e.kind} ${noLoc(e.msg)}`, `${e.kind}: ${e.msg}`));
  J.complex.forEach(f => add('복잡한 함수', f.name, `${f.name} (${f.loc}) 복잡도 ${f.cc} · ${f.lines}줄 · 중첩 ${f.depth}`, { 복잡도: f.cc, 줄: f.lines, 중첩: f.depth }));
  (J.anon || []).forEach(f => add('복잡한 익명 콜백', `${f.unit} ${f.name}`, `${f.name} (${f.loc}) 복잡도 ${f.cc} · ${f.lines}줄 · 중첩 ${f.depth}`, { 복잡도: f.cc, 줄: f.lines, 중첩: f.depth }));
  J.complexCases.forEach(c => add('복잡한 분배기 case', `${c.fn} ${c.act}`, `${c.fn} · ${c.act} (${c.loc}) 복잡도 ${c.cc} · ${c.lines}줄 · 중첩 ${c.depth}`, { 복잡도: c.cc, 줄: c.lines, 중첩: c.depth }));
  J.cycles.forEach(c => add('동기 순환', [...c].sort().join(','), c.join(' ↔ '), { 크기: c.length }));
  J.unused.forEach(n => add('안 쓰는 함수', n, n));
  J.unusedVars.forEach(v => add('안 쓰는 최상위 변수', v.name, `${v.name} (${v.loc})`));
  J.strings.forEach(s => add('되풀이 문자열', s.text, `×${s.n} "${s.text}…"`, { 횟수: s.n }));
  const ec = new Map(); J.emptyCatch.forEach(x => { const k = `${file(x.loc)} ${x.cat}`; ec.set(k, (ec.get(k) || 0) + 1); });
  ec.forEach((n, k) => add('빈 catch', k, `${k} ${n}개`, { 개수: n }));
  J.state.scattered.forEach(([k, w]) => add('흩어진 상태 쓰기', k, `${k} — ${w}곳에서 씀`, { 쓰는곳: w }));
  J.state.writeOnly.forEach(k => add('쓰기만 하는 키', k, k));
  J.actions.deadHandlers.forEach(x => add('발신 없는 처리기', x.act, `${x.act}`));
  J.css.dead.forEach(x => add('안 쓰는 CSS 클래스', x.cls, `.${x.cls} (${x.loc})`));
  const MD = J.modules || {}; (MD.envy || []).forEach(e => add('영역 침범 후보', `${e.file} ${e.fn}`, `${e.fn} (${e.file}) — 참조 ${e.share}%가 ${e.to}`)); (MD.foreign || []).forEach(x => add('남의 상태 쓰기', `${x.file} ${x.key}`, `${x.file}가 ${x.key}(주인 ${x.owner})를 씀 ${x.n}곳`, { 곳: x.n })); (MD.scattered || []).forEach(x => add('파편화 상태', x.key, `${x.key} — ${x.files.length}개 모듈이 씀`, { 모듈: x.files.length }));
  const NB = MD.natural || {}; (NB.overSplit || []).forEach(x => add('과잉 분할', [...x.mods].sort().join(' ↔ '), `${x.kind}: ${x.mods.join(' ↔ ')} — 사이 ${x.inter} · 안 ${x.intra.join('/')}`)); (NB.mixed || []).forEach(x => add('기능 섞임', x.mod, `${x.mod} — 묶음 ${x.parts.join('·')}`, { 묶음: x.parts.length })); (NB.displaced || []).forEach(x => add('기능 분산', `${x.mod} ${x.fn}`, `${x.fn} (${x.mod}) — 연결 ${x.share}%가 ${x.to}`)); // 자연 경계(모듈성 최대화) — 늘면 실패
  (J.promptAll || []).forEach(p => add('스튜디오 밖 LLM 프롬프트 글', p.key, `${p.key} ${p.chars}자 (${p.loc})`, { 글자: p.chars })); (J.promptImg || []).forEach(p => add('스튜디오 밖 이미지 프롬프트', p.key, `${p.key} ${p.chars}자 (${p.loc})`, { 글자: p.chars }));
  (J.inlinePrompts || []).forEach(p => add('스튜디오 밖 프롬프트 글', p.key, `${p.key} ${p.chars}자 (${p.loc})`, { 글자: p.chars })); // 늘면 나빠짐: 프롬프트는 스튜디오 조각(pfDef)으로
  const T = J.tools; if (T) { // 메타 점검(도구 코드)
    (T.cmt || []).forEach(c => add('도구 주석 속 코드', noLoc(`${c.loc} ${c.text}`), `${c.loc} ${c.text}`));
    T.parse.forEach(p => add('도구 파싱 오류', noLoc(`${p.loc} ${p.text}`), `${p.loc} ${p.text}`));
    T.complex.forEach(f => add('도구 복잡한 함수', `${f.unit} ${f.name}`, `${f.name} (${f.loc}) 복잡도 ${f.cc} · ${f.lines}줄 · 중첩 ${f.depth}`, { 복잡도: f.cc, 줄: f.lines, 중첩: f.depth }));
    T.dup.forEach(d => add('도구 같은 본문 함수', d.join('='), d.join(' = ')));
    T.strings.forEach(s => add('도구 되풀이 문자열', s.text, `×${s.n} "${s.text}…"`, { 횟수: s.n }));
    const tc = new Map(); T.emptyCatch.forEach(x => { const k = file(x.loc); tc.set(k, (tc.get(k) || 0) + 1); }); tc.forEach((n, k) => add('도구 빈 catch', k, `${k} ${n}개`, { 개수: n }));
    T.unused.forEach(f => add('도구 안 쓰는 함수', `${file(f.loc)} ${f.name}`, `${f.name} (${f.loc})`)); }
  return F;
}

export function compare(base, cur) {
  const B = new Map(base.map(f => [f.key, f])), C = new Map(cur.map(f => [f.key, f])), out = { added: [], worse: [], fixed: [], better: [] };
  for (const [k, f] of C) { const b = B.get(k); if (!b) { out.added.push(f); continue; }
    const up = Object.keys(f.num).filter(n => (+f.num[n] || 0) > (+b.num?.[n] || 0)), down = Object.keys(f.num).filter(n => (+f.num[n] || 0) < (+b.num?.[n] || 0));
    if (up.length) out.worse.push({ ...f, was: b.num, up }); else if (down.length) out.better.push({ ...f, was: b.num, down }); }
  for (const [k, f] of B) if (!C.has(k)) out.fixed.push(f);
  return renamed(moved(out, base, cur));
}
// 이름 바꿈: 함수 이름이 정체인 범주(복잡한 함수)에서 같은 파일의 해결 + 새로 생김 짝 — 수치(복잡도·줄·중첩)가 같거나 줄었으면 같은 본문의 이름만 바뀐 것(옮김), 늘었으면 그대로 새로 생김
const RENAMABLE = new Set(['복잡한 함수', '도구 복잡한 함수']), fileOf = f => (String(f.text || f.key).match(/(?:src|tools|build|pc|www)\/[\w./가-힣-]*?(?=:\d|$|\s|\))/) || [''])[0];
function renamed(out) { const sig = f => `${String(f.key).split('|')[0]}|${fileOf(f)}|${JSON.stringify(f.num || {})}`;
  const le = (a, f) => String(a.key).split('|')[0] === String(f.key).split('|')[0] && fileOf(a) === fileOf(f) && Object.keys(a.num || {}).every(k => (+a.num[k] || 0) <= (+f.num?.[k] || 0)); /* 같은 파일에서 수치가 같거나 줄었으면(이름을 바꾸며 조금 덜어 냄) */
  for (const a of [...out.added]) { if (!RENAMABLE.has(String(a.key).split('|')[0])) continue; let i = out.fixed.findIndex(f => sig(f) === sig(a)); if (i < 0) i = out.fixed.findIndex(f => le(a, f)); if (i < 0) continue; out.fixed.splice(i, 1); out.added.splice(out.added.indexOf(a), 1); (out.moved ||= []).push(a); }
  return out; }
// 옮김: 코드를 다른 파일로 옮기면 키의 파일 경로만 바뀌어 같은 항목이 "해결 + 새로 생김"으로 갈림(줄 이동을 무시하듯 파일 이동도 가림).
//   경로가 위치일 뿐인 범주만(빈 catch·이름 모호는 파일별 개수, 함수·상태 키 항목) — 경로를 뺀 정체(종류·함수 이름·상태 키)로 묶어
//   그 정체의 합계(개수·복잡도 등, 수치 없으면 항목 수)가 기준보다 늘지 않았고 같은 정체가 기준 쪽에서 줄었으면 옮김(실패 아님, 따로 보고).
//   모듈 자체가 정체인 범주(과잉 분할·기능 섞임)는 그대로. 계층 섞임·방향 위반의 모듈별 수도 위치일 뿐(함수를 기능 모듈로 모으면 모듈만 바뀜) — 합계로
const MOVABLE = new Set(['규칙 L1', '규칙 L2', '규칙 L3', '규칙 S1', '규칙 C1', '규칙 A1', '규칙 Y1', '규칙 Y2', '계층 섞임', '계층 방향', '빈 catch', '도구 빈 catch', '이름 모호', '영역 침범 후보', '기능 분산', '남의 상태 쓰기', '복잡한 함수', '복잡한 익명 콜백', '복잡한 분배기 case', '도구 복잡한 함수', '도구 안 쓰는 함수']);
const PATHS = /@?\s*(?:src|tools|build|pc|www)\/[\w./가-힣-]*(?::\d+)?/g; /* 줄 번호도 위치일 뿐 */
export const movedId = f => { const k = String(f.key), cat = k.split('|')[0]; return MOVABLE.has(cat) ? k.replace(PATHS, ' ').replace(/\s+/g, ' ').replace(/\|\s/, '|').trim() : null; };
function moved(out, base, cur) { out.moved = [];
  const sum = (L, id) => { const s = {}; let n = 0; for (const f of L) if (movedId(f) === id) { n++; for (const [k, v] of Object.entries(f.num || {})) s[k] = (s[k] || 0) + (+v || 0); } return { s, n }; };
  for (const id of new Set([...out.added, ...out.worse].map(movedId).filter(Boolean))) { if (![...out.fixed, ...out.better].some(f => movedId(f) === id)) continue;
    const b = sum(base, id), c = sum(cur, id), keys = Object.keys(c.s); if (keys.length ? !keys.every(k => c.s[k] <= (b.s[k] || 0)) : c.n > b.n) continue;
    const other = f => movedId(f) !== id; out.moved.push(...[...out.added, ...out.worse].filter(f => !other(f)));
    out.added = out.added.filter(other); out.worse = out.worse.filter(other); out.fixed = out.fixed.filter(other); out.better = out.better.filter(other); }
  return out; }

export const BASELINE = 'tools/baseline.json';
export function readBaseline(ROOT, part = 'findings') { const p = join(ROOT, BASELINE); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))[part] || null : null; }
export function writeBaseline(ROOT, F, part = 'findings') { const p = join(ROOT, BASELINE), cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}; // 다른 부분(배선 점검 wiring 등)은 그대로 둠
  cur.note = '자기점검·배선 점검 기준선 — 늘리지 않음(CLAUDE.md §2). 줄면 node tools/check.mjs --update-baseline · node tools/wiring.mjs --update-baseline'; cur[part] = F.map(({ key, num, text }) => ({ key, num, text }));
  writeFileSync(p, JSON.stringify(cur, null, 1) + '\n'); }

// git 기준(ref)의 트리를 tools/out/ref/<sha>/에 풀어 둠(이미 있으면 그대로) — 같은 분석을 그 트리에 돌려 비교
export function refTree(ROOT, ref, OUT) {
  const sha = execSync(`git rev-parse --verify ${JSON.stringify(ref + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('git 기준을 찾지 못했어요: ' + ref);
  const dir = join(OUT, 'ref', sha); if (!existsSync(join(dir, 'src'))) { mkdirSync(dir, { recursive: true }); execSync(`git archive ${sha} | tar -x -C ${JSON.stringify(dir)}`, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] }); }
  return { sha, dir };
}

export function diffMd(d, title) {
  const row = f => `- ${f.text}${f.was ? ` (전: ${Object.entries(f.was).map(([k, v]) => `${k} ${v}`).join(' · ')})` : ''}`;
  return [`## ${title}`, '', `새로 생김 ${d.added.length} · 나빠짐 ${d.worse.length} · 해결 ${d.fixed.length} · 좋아짐 ${d.better.length} · 옮김 ${(d.moved || []).length}`, '',
    '### 새로 생김', ...(d.added.length ? d.added.map(row) : ['없음']), '', '### 나빠짐', ...(d.worse.length ? d.worse.map(row) : ['없음']), '',
    '### 해결', ...(d.fixed.length ? d.fixed.map(row) : ['없음']), '', '### 좋아짐', ...(d.better.length ? d.better.map(row) : ['없음']), '', '### 옮김(코드를 다른 파일로 — 같은 정체의 합계가 늘지 않음)', ...((d.moved || []).length ? d.moved.map(row) : ['없음']), ''].join('\n');
}
