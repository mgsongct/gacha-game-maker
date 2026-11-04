// 식을 함수로 떼기(계층 나누기 도구 — CLAUDE.md §0-2): 섞인 함수(map.mjs --split) 안의 화면 식(창 HTML 등)을 View 함수로 떼어 그 함수를 Controller·Model로 남김.
//   node tools/extract.mjs --at <src 파일:줄> --call <호출 이름, 예: openModal> [--arg <몇째 인자, 기본 0>] --name <새 함수> --doc "<설명 주석>" [--to <src 파일>] [--dry]
//   그 줄에서 시작하는 <호출 이름>(…) 호출의 인자 식을 떼어 function 새 함수(지역 이름들){ return 식; } 으로 만들고, 자리는 새 함수(지역 이름들)로 바꿈.
//   식이 쓰는 이름 중 그 함수 안에서 묶인 것(지역)만 인자로 넘김(최상위·전역 이름은 그대로 — lib/scope.mjs freeNames) — 뜻이 같음.
//   await·this·바깥 지역 이름에 쓰기가 든 식은 옮기지 않음(뜻이 바뀜). 새 함수는 같은 파일이면 원래 함수 바로 앞, --to면 그 파일 끝.
//   뗀 뒤: node build/build.mjs · node tools/check.mjs --strict(정의 안 된 이름·TDZ) · node build/test.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits, walk } from './lib/source.mjs';
import { freeNames } from './lib/scope.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const FN = new Set(['function_declaration', 'function_expression', 'arrow_function', 'method_definition', 'generator_function_declaration']);

// 그 파일:줄에서 시작하는 호출 이름(…)의 인자 노드와, 그것을 품은 맨 위 함수
export function findTarget(units, at, call, argIndex) { const [file, line] = [at.slice(0, at.lastIndexOf(':')), +at.slice(at.lastIndexOf(':') + 1)];
  for (const u of units) { let hit = null; walk(u.tree.rootNode, n => { if (hit || n.type !== 'call_expression' || n.childForFieldName('function')?.text !== call) return; if (u.loc(n) !== `${file}:${line}`) return; const a = n.childForFieldName('arguments')?.namedChildren[argIndex]; if (a) hit = a; });
    if (!hit) continue; let top = hit; while (top.parent && top.parent.type !== 'program') top = top.parent; let fn = hit.parent; while (fn && !FN.has(fn.type)) fn = fn.parent; return { unit: u, node: hit, top, fn }; }
  return null; }
// 뗄 수 있나·인자: 지역 이름(등장 순서)
export function extractPlan(node) { const f = freeNames(node); if (f.hasAwait || f.hasThis || f.writes.length) return { ok: false, why: f.hasAwait ? 'await' : f.hasThis ? 'this' : '바깥 이름에 씀 ' + f.writes.join(',') }; return { ok: true, params: f.locals }; }
// 파일 글에 적용: 식 자리 → 호출, 새 함수 넣기
export function applyExtract(src, { exprText, topText, name, params, doc, sameFile }) { const at = src.indexOf(exprText); if (at < 0 || src.indexOf(exprText, at + 1) >= 0) throw new Error('식 글을 파일에서 한 번만 찾을 수 없어요');
  const call = `${name}(${params.join(',')})`, fnText = `/* ${doc} */\nfunction ${name}(${params.join(',')}){ return ${exprText}; }\n`, t = src.indexOf(topText); let out = src.slice(0, at) + call + src.slice(at + exprText.length);
  if (sameFile) { if (t < 0 || t > at) throw new Error('원래 함수를 찾을 수 없어요'); const ls = src.lastIndexOf('\n', t - 1) + 1; out = out.slice(0, ls) + fnText + out.slice(ls); } /* 새 함수는 원래 함수 앞(식 자리보다 앞이라 자리 바꿈과 겹치지 않음) */
  return { src: out, fnText }; }

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = arg('--at'), call = arg('--call'), name = arg('--name'), doc = arg('--doc'), to = arg('--to'), dry = argv.includes('--dry'), ai = +(arg('--arg') || 0);
  if (!at || !call || !name || !doc) { console.log('사용: node tools/extract.mjs --at <src 파일:줄> --call <호출 이름> [--arg <n>] --name <새 함수> --doc "<설명>" [--to <src 파일>] [--dry]'); process.exit(1); }
  const units = await loadUnits(ROOT), T = findTarget(units, at, call, ai); if (!T) { console.log(`${at}에서 시작하는 ${call}(…)를 찾지 못했어요`); process.exit(1); }
  if (units.some(u => new RegExp(`(^|\\n)(async\\s+)?function\\s+${name}\\s*\\(`).test(u.text))) { console.log(`이미 있는 이름이에요: ${name}`); process.exit(1); }
  const P = extractPlan(T.node); if (!P.ok) { console.log(`옮기지 않음 — ${P.why}`); process.exit(1); }
  const file = at.slice(0, at.lastIndexOf(':')), path = join(ROOT, file), src = readFileSync(path, 'utf8'), R = applyExtract(src, { exprText: T.node.text, topText: T.top.text, name, params: P.params, doc, sameFile: !to || to === file });
  console.log(`${dry ? '(미리보기) ' : ''}${at} ${call}의 인자 → ${name}(${P.params.join(', ')})${to && to !== file ? ' · ' + to + ' 끝에' : ''}`);
  if (!dry) { writeFileSync(path, R.src); if (to && to !== file) { const tp = join(ROOT, to); writeFileSync(tp, readFileSync(tp, 'utf8').replace(/\n*$/, '\n') + R.fnText); } } }
