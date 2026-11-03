#!/usr/bin/env node
// 개발 내역 검증 보고서: 원본을 포크해 src/로 나눈 뒤(49cec7a)의 커밋마다 지시해 개발한 내역이 지금 코드에 시행돼 있는지.
//   커밋이 새로 들인 최상위 함수 → 지금도 있나 · 진입점에서 닿나(tools/lib/history.mjs reachable) · 테스트가 부르나(build/test.mjs·tools/play)
//   커밋 설명·조사 노트(docs/research)에 적힌 코드 이름 → 지금 코드(src·tools·build·pc)에 있나
//   node tools/history.mjs [--from <git 기준, 기본 49cec7a>] [--strict]   → tools/out/history.md · history.json
//   동적 검증은 먼저 GGM_COVERAGE=1 node build/test.mjs (브라우저 테스트의 V8 커버리지 → tools/out/coverage.json). --strict: 안 닿거나 실행 안 된 포크 함수가 있으면 실패
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { loadUnits, loadToolUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { srcAt } from './lib/gitsrc.mjs';
import { reachable, claimNames, nameExists } from './lib/history.mjs';
import { actions } from './lib/flow.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/out'), argv = process.argv.slice(2), fi = argv.indexOf('--from'), FROM = fi >= 0 ? argv[fi + 1] : '49cec7a';
const git = c => execSync(c, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
const units = await loadUnits(ROOT), { fns } = buildGraph(units), html = readFileSync(join(ROOT, 'src/index.html'), 'utf8'), reach = reachable(units, fns, html, new Set(actions(units, html).deadH.map(x => x.act)));
const head = new Map([...fns.values()].filter(f => f.top && !f.table).map(f => [f.key, f]));
const testText = [join(ROOT, 'build/test.mjs'), ...readdirSync(join(ROOT, 'tools/play/lib')).map(f => join(ROOT, 'tools/play/lib', f))].filter(existsSync).map(f => readFileSync(f, 'utf8')).join('\n');
const covFile = join(OUT, 'coverage.json'), cov = existsSync(covFile) ? JSON.parse(readFileSync(covFile, 'utf8')) : null, ran = cov ? new Set(cov.ran) : null; // GGM_COVERAGE=1 node build/test.mjs 가 남긴 실행 기록(동적)
const tested = n => ran ? ran.has(n) : new RegExp(`(^|[^\\w$])${n.replace(/\$/g, '\\$')}([^\\w$]|$)`).test(testText);
const toolUnits = await loadToolUnits(ROOT), pcText = ['pc/ggm-server.py', 'proxy/worker.js', 'proxy/vercel/api/proxy.js'].filter(f => existsSync(join(ROOT, f))).map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n');
const codeText = [...units.map(u => u.text), html, ...toolUnits.map(u => u.text), pcText].join('\n'), files = git('git ls-files src tools build pc').split('\n');
const commits = git(`git log --reverse --no-merges --format=%H ${FROM}..HEAD`).split('\n').filter(Boolean), rows = [];
// 원안(FROM) 형상: 그 트리에서 진입점으로 닿던 함수 — 포크가 지운 원안 기능 찾기
const base = await srcAt(ROOT, OUT, FROM), baseDir = join(OUT, 'ref-src', base.sha), bUnits = await loadUnits(baseDir), bFns = buildGraph(bUnits).fns, bHtml = readFileSync(join(baseDir, 'src/index.html'), 'utf8'), bReach = reachable(bUnits, bFns, bHtml, new Set(actions(bUnits, bHtml).deadH.map(x => x.act))), baseSet = new Set(base.fns);
for (const c of commits) {
  const msg = git(`git log -1 --format=%B ${c}`), subj = msg.split('\n')[0], touched = git(`git show --name-only --format= ${c}`).split('\n').some(f => f.startsWith('src/'));
  let added = [], removedBase = [];
  if (touched) { const [now, before] = [await srcAt(ROOT, OUT, c), await srcAt(ROOT, OUT, c + '^')], b = new Set(before.fns), n = new Set(now.fns); added = now.fns.filter(k => !b.has(k) && !k.includes('.')); removedBase = before.fns.filter(k => !n.has(k) && baseSet.has(k) && !k.includes('.')); }
  const present = added.filter(k => head.has(k)), gone = added.filter(k => !head.has(k)), unreached = present.filter(k => !reach.has(head.get(k).name)), untested = present.filter(k => !tested(head.get(k).name));
  const missing = claimNames(msg).filter(n => !nameExists(n, codeText, files)).map(n => { const by = git(`git log --format=%h -S ${JSON.stringify(n)} ${c}..HEAD -- src tools`).trim().split('\n')[0]; return by ? `${n}(→${by}에서 바뀜)` : n; }); // 뒤 커밋이 이름을 바꾸거나 지웠으면 그 커밋
  const lost = removedBase.filter(k => !head.has(k) && bReach.has(k)); rows.push({ sha: c.slice(0, 7), subj, lost, removedBase: removedBase.length, added: added.length, present: present.length, gone, unreached, untested: untested.length, notRan: untested.map(k => head.get(k).name), missing });
}
// 조사 노트·모듈 문서가 말하는 이름
const docs = [...readdirSync(join(ROOT, 'docs/research')).filter(f => f.endsWith('.md')).map(f => 'docs/research/' + f), 'docs/modules.md'].map(f => ({ f, missing: claimNames(readFileSync(join(ROOT, f), 'utf8')).filter(n => !nameExists(n, codeText, files)) })).filter(d => d.missing.length);
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const sum = k => rows.reduce((a, r) => a + (Array.isArray(r[k]) ? r[k].length : r[k]), 0);
const md = [`# 개발 내역 검증`, '', `생성: \`node tools/history.mjs --from ${FROM}\` · 커밋 ${rows.length}개(병합 제외) · 지금 함수 ${head.size}개 중 진입점에서 닿는 함수 ${reach.size}개`, '',
  `- 커밋이 새로 들인 함수 ${sum('added')}개 → 지금 있음 ${sum('present')} · 사라짐 ${sum('gone')}(이름 바꿈·합침·지움) · 있지만 진입점에서 안 닿음 ${sum('unreached')} · ${ran ? `브라우저 테스트에서 실제로 실행 안 됨 ${sum('untested')}(커버리지 ${cov.at.slice(0, 16)})` : `테스트가 이름을 안 부름 ${sum('untested')}(커버리지 없음 — GGM_COVERAGE=1 node build/test.mjs)`}`,
  `- 커밋 설명에 적혔는데 코드에 없는 이름 ${sum('missing')} · 조사 노트·모듈 문서에 적혔는데 코드에 없는 이름 ${docs.reduce((a, d) => a + d.missing.length, 0)}`, '',
  `## 원안에서 진입점으로 닿던 함수 중 포크가 지운 것 (${sum('lost')})`, '', '지시 없이 원안 기능이 사라졌을 수 있는 곳 — 지운 커밋별. 이름 바꿈·합침이면 지금 다른 이름으로 있음(확인 필요)', '', t(['커밋', '설명', '지운 원안 함수(원안에서 닿음)'], rows.filter(r => r.lost.length).map(r => [r.sha, r.subj.slice(0, 50), r.lost.join(', ')])), '',
  `## 커밋별`, '', t(['커밋', '설명', '새 함수(지금 있음/전체)', '진입점에서 안 닿음', ran ? '테스트에서 실행 안 됨' : '테스트 안 부름', '사라진 함수', '설명 속 이름 중 코드에 없음'], rows.map(r => [r.sha, r.subj.slice(0, 60), r.added ? `${r.present}/${r.added}` : '', r.unreached.join(', '), ran ? r.notRan.join(', ') : (r.untested || ''), r.gone.join(', '), r.missing.join(', ')])), '',
  `## 조사 노트·모듈 문서에 적혔는데 코드에 없는 이름`, '', '모듈 문서(docs/modules.md)는 코드 설명이라 없으면 고칠 것. 조사 노트(docs/research)는 조사 자료라 외부 이름(다른 게임·API·노드 이름)과 아직 하지 않은 제안이 들어 있을 수 있음', '', ...docs.map(d => `- ${d.f}: ${d.missing.join(', ')}`), ''].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'history.md'), md); writeFileSync(join(OUT, 'history.json'), JSON.stringify({ from: FROM, rows, docs, reach: reach.size, fns: head.size }, null, 1));
console.log(`원안에서 닿던 함수 중 포크가 지운 것 ${sum('lost')} · 커밋 ${rows.length} · 새 함수 ${sum('added')} → 있음 ${sum('present')} · 사라짐 ${sum('gone')} · 안 닿음 ${sum('unreached')} · ${ran ? '테스트에서 실행 안 됨' : '테스트 안 부름'} ${sum('untested')} · 설명 속 없는 이름 ${sum('missing')} · 문서 속 없는 이름 ${docs.reduce((a, d) => a + d.missing.length, 0)}`);
console.log('→ tools/out/history.md');
if (argv.includes('--strict') && (sum('unreached') || (ran && sum('untested')))) { console.log(`실패: 진입점에서 안 닿는 포크 함수 ${sum('unreached')}${ran ? ` · 브라우저 테스트에서 실행 안 된 포크 함수 ${sum('untested')}` : ''}`); process.exit(1); }
