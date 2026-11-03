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
  return out;
}

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
  return [`## ${title}`, '', `새로 생김 ${d.added.length} · 나빠짐 ${d.worse.length} · 해결 ${d.fixed.length} · 좋아짐 ${d.better.length}`, '',
    '### 새로 생김', ...(d.added.length ? d.added.map(row) : ['없음']), '', '### 나빠짐', ...(d.worse.length ? d.worse.map(row) : ['없음']), '',
    '### 해결', ...(d.fixed.length ? d.fixed.map(row) : ['없음']), '', '### 좋아짐', ...(d.better.length ? d.better.map(row) : ['없음']), ''].join('\n');
}
