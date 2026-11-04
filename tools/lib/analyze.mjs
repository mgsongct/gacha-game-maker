// 분석 한 번 돌리기: 저장소 루트(지금 작업 트리 또는 --diff로 풀어 놓은 git 기준 트리)를 받아 모든 분석 결과를 돌려줌.
// check.mjs가 보고서를 만들고, 기준선·기준 커밋과 비교(ratchet.mjs)할 때 같은 함수로 두 번 돌려요.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadUnits, loadToolUnits } from './source.mjs';
import { buildGraph, unused, unusedVars, cycles, cycleGuard, deepest, hubs, complexAnon, selfLoops } from './graph.mjs';
import { actions, mutations, stateFlow } from './flow.mjs';
import { parseErrors, dupBodies, repeatedStrings, sgRules, complexFns, complexCases, commentedCode } from './quality.mjs';
import { domIds, htmlInject, saveKeys, listenerLeaks, cssCheck, sideFiles, relayHosts, spaCheck, tdzRefs, undefinedNames, freshReaderWrites } from './extra.mjs';
import { inlinePrompts, pureModules, fragmentFiles, promptText, IMAGE_SINKS, tagText, sharedHelpers, promptBuilders } from './prompts.mjs';
import { moduleMap, naturalBoundaries } from './modules.mjs';
import { moduleOf } from './scope.mjs';

export async function analyze(ROOT) {
  const units = await loadUnits(ROOT), html = readFileSync(join(ROOT, 'src/index.html'), 'utf8'), testText = existsSync(join(ROOT, 'build/test.mjs')) ? readFileSync(join(ROOT, 'build/test.mjs'), 'utf8') : '';
  const allText = units.map(u => u.text).join('\n') + html + testText; // fix.mjs와 같은 기준(브라우저 테스트가 부르는 함수는 쓰는 것)
  const { fns, issues, tops } = buildGraph(units), act = actions(units, html), mu = mutations(units, fns), sf = stateFlow(units, fns), sg = sgRules(units);
  const syncCycles = cycles(fns, true);
  const R = { parse: parseErrors(units), issues, unused: unused(fns, allText), unusedVars: unusedVars(tops, fns, allText), cycles: syncCycles, acycles: cycles(fns).filter(c => !syncCycles.some(s => s.length === c.length && s.every(k => c.includes(k)))), deep: deepest(fns), hubs: hubs(fns, mu.mut), complex: complexFns(fns), anon: complexAnon(units), ccases: complexCases(fns), dup: dupBodies(fns), strings: repeatedStrings(units), act, unsaved: mu.unsaved, sf, sg,
    dom: domIds(units, html), inj: htmlInject(units, fns), keys: saveKeys(units), leaks: listenerLeaks(units, fns), css: cssCheck(ROOT, units.map(u => u.text).join('\n') + html), side: await sideFiles(ROOT) };
  R.relay = relayHosts(units, R.side.hosts);
  R.cmt = commentedCode(units); // 주석 속 코드(한 줄 코드 중간 // 주석으로 뒤 문장이 빠졌을 수 있음)
  R.tdz = tdzRefs(units); // 불러올 때 아직 없는 이름(코드를 옮겨 생기는 앱 시작 실패)
  R.freshW = freshReaderWrites(units, fns, mu.mut); // 읽기 결과(없으면 새 값)에 쓰기 — 쓴 것이 사라짐
  R.undef = undefinedNames(units, existsSync(join(ROOT, 'tools/browser-globals.json')) ? JSON.parse(readFileSync(join(ROOT, 'tools/browser-globals.json'), 'utf8')) : {}); // 정의 안 된 이름(부르면 ReferenceError)
  R.spa = spaCheck(ROOT, units); // SPA 단일 파일 전제(www/index.html이 로컬 파일을 따로 불러오지 않음, 분석한 src = 빌드가 SPA에 넣은 코드)
  const shared = sharedHelpers(ROOT); R.prompts = inlinePrompts(units, { shared }); // 프롬프트 스튜디오 밖(코드에 직접 쓴) 지시문
  R.sharedStale = shared.filter(n => ![...fns.values()].some(f => f.top && f.name === n));
  R.builders = promptBuilders(units, { home: fragmentFiles(units).home, shared }); // 스튜디오 밖 프롬프트 조립 함수·불러올 때 조각 읽기
  R.pure = pureModules(units); // 순수 모듈(규칙 엔진)이 DOM·앱 상태를 참조
  R.frag = fragmentFiles(units); // 프롬프트 조각이 스튜디오 한곳에 모였는지
  R.mod = moduleMap(units, fns, sf, { modOf: moduleOf, layer: R.frag.home });
  { const N = naturalBoundaries(fns, sf, R.mod, moduleOf, R.frag.home, new Set([...tops].filter(([, v]) => v.kind !== 'function').map(([k]) => k))); R.nat = { overSplit: N.overSplit, mixed: N.mixed.map(x => ({ mod: x.mod, fns: x.fns, parts: x.parts.map(p => p.n) })), displaced: N.displaced, Qfile: N.Qfile, Qnat: N.Qnat }; } // 자연 경계: 과잉 분할·기능 섞임·기능 분산(늘면 실패) // 모듈 경계: 영역 침범·남의 상태 쓰기·파편화
  R.promptAll = inlinePrompts(units, { pred: promptText, home: R.frag.home, shared }); R.promptImg = inlinePrompts(units, { sinks: IMAGE_SINKS, pred: tagText, home: R.frag.home, shared, tables: true }); // 스튜디오 밖 LLM 프롬프트 글 전체·이미지 프롬프트 조각
  // 메타 점검: 도구 코드 자체의 위반(쓸데없는 예외 처리·복잡도·다중화·되풀이 문자열·안 쓰는 함수)
  const tu = await loadToolUnits(ROOT), tg = buildGraph(tu), tText = tu.map(u => u.text).join('\n');
  R.tools = { files: tu.length, cmt: commentedCode(tu), parse: parseErrors(tu), complex: [...complexFns(tg.fns), ...complexAnon(tu)], dup: dupBodies(tg.fns), strings: repeatedStrings(tu), emptyCatch: sgRules(tu).emptyCatch, unused: unused(tg.fns, tText, u => u.startsWith('tool:')) };
  const errors = [...R.parse.map(p => ({ kind: '파싱 오류', msg: `${p.loc} ${p.text}` })), ...issues.filter(i => i.sev === 'error'), ...act.missing.map(m => ({ kind: '처리기 없는 액션', msg: `data-act="${m.act}" (${m.at.join(', ')})` })), ...act.regMissing.map(m => ({ kind: '분배 표에 있지만 처리 안 함', msg: `${m.act} → ${m.fn}에 case가 없음 (${m.loc}) — 눌러도 아무 일 없음` })),
    ...R.prompts.map(x => ({ kind: '프롬프트 지시문이 스튜디오 조각이 아님(코드에 직접 씀 — pfDef 조각으로)', msg: `${x.key} ${x.chars}자 (${x.loc})` })),
    ...[...R.promptAll, ...R.promptImg].map(x => ({ kind: '프롬프트 글이 스튜디오 모듈 밖(스튜디오로 옮기거나, 화면과 같이 쓰는 글 도구면 tools/prompt-shared.json에 이유와 함께)', msg: `${x.key} ${x.chars}자 (${x.loc})` })),
    ...R.sharedStale.map(n => ({ kind: '공용 글 도구 목록(tools/prompt-shared.json)에 있는데 코드에 없는 함수', msg: n })),
    ...R.builders.builders.map(x => ({ kind: '프롬프트 조립 함수(조각을 고르고 이음)가 스튜디오 모듈 밖', msg: `${x.fn} (${x.loc})` })), ...R.builders.loadTime.map(x => ({ kind: '불러올 때 조각을 읽음(게임별 수정이 반영 안 됨 — 쓸 때 읽게)', msg: `${x.text} (${x.loc})` })),
    ...selfLoops(fns).map(x => ({ kind: '조건 없이 자기를 부름(끝나지 않음 — 스택 넘침)', msg: `${x.fn} (${x.loc})` })),
    ...R.tdz.map(x => ({ kind: x.cond ? '불러올 때 아직 없는 이름(TDZ — 갈래 안: data에 따라 앱이 뜨지 않음)' : '불러올 때 아직 없는 이름(TDZ — 앱이 뜨지 않음)', msg: `${x.name} ${x.loc} — 선언 ${x.decl}${x.via ? ' · 길: ' + x.via : ''}` })), ...R.freshW.map(x => ({ kind: '읽기 함수가 돌려준 값에 씀(저장 칸이 없으면 새 값이라 사라짐 — progSlot·G.meta.x = …로)', msg: `${x.fn}() ${x.loc} ${x.text}` })), ...R.undef.map(x => ({ kind: '정의 안 된 이름(부르면 ReferenceError — 지역·맨 위 선언·전역·브라우저 전역 어디에도 없음)', msg: `${x.name} ${x.loc}` })), ...R.css.errors.map(e => ({ kind: 'CSS 파싱 오류', msg: `${e.loc} ${e.text} — 뒤 규칙이 무시될 수 있음` })), ...R.side.parse.map(e => ({ kind: '부속 파일 파싱 오류', msg: `${e.loc} ${e.text}` })), ...R.spa.errors.map(e => ({ kind: 'SPA 단일 파일 전제 깨짐', msg: `${e.loc} ${e.text}` })), ...R.frag.stray.map(x => ({ kind: '프롬프트 조각이 스튜디오 밖에 흩어짐', msg: `${x.file} — pfDef ${x.n}개(조각은 ${R.frag.home} 한곳에 모음)` })), ...R.pure.map(x => ({ kind: '순수 모듈이 DOM·앱 상태를 참조', msg: `${x.loc} ${x.name} — 규칙 엔진은 DOM·G 없이(docs/build.md §3)` }))];
  const warns = [...R.cycles.filter(c => !cycleGuard(fns, c)).map(c => ({ kind: '멈춤 조건 없는 동기 순환', msg: c.slice(0, 6).join(' ↔ ') })), ...R.sg.emptyCatch.filter(x => x.cat === '비동기 작업').map(x => ({ kind: '비동기 작업의 빈 catch(실패 원인을 잃음)', msg: `${x.loc} — catch(e){ quietErr(e,'위치'); }` })), ...act.regOrphan.map(m => ({ kind: '분배 표에 없는 case(실행 안 됨)', msg: `${m.act} — ${m.fn} (${m.loc})${m.to ? ` · 표는 ${m.to}로 보냄` : ''}` })), ...act.multi.map(m => ({ kind: '여러 곳에서 처리하는 액션', msg: `${m.act}: ${m.locs.slice(0, 3).join(', ')}` })), ...R.unsaved.map(x => ({ kind: '저장 표시 없는 상태 변경', msg: `${x.fn.name} (${x.fn.loc}) — ${x.ex.what} 외 ${x.n - 1}곳, 자신·호출자 모두 mark() 없음` })), ...R.dup.map(d => ({ kind: '같은 본문 함수', msg: d.fns.join(' = ') })),
    ...R.cmt.map(x => ({ kind: '주석 속 코드(한 줄 코드 중간 // 주석으로 뒤 문장이 빠졌을 수 있음)', msg: `${x.loc} ${x.text}` })), ...R.dom.missing.map(m => ({ kind: '없는 요소를 찾는 코드(늘 null)', msg: `#${m.id} (${m.at.join(', ')})` })), ...R.inj.out.map(x => ({ kind: 'esc() 없이 HTML에 넣는 글', msg: `${x.loc} \${${x.what}}` })),
    ...(R.keys?.bad || []).map(x => ({ kind: 'writeKey가 모르는 저장 키', msg: `mark('${x.key}') ${x.loc} — PC·클라우드 문서 저장에서 빠짐` })), ...R.leaks.map(x => ({ kind: '떼지 않는 전역 리스너(누수)', msg: `'${x.ev}' ${x.loc} — ${x.why} 붙음, once·signal·removeEventListener 없음` })),
    ...(R.relay?.diff || []).map(x => ({ kind: '중계 서버 허용 주소 차이', msg: `${x.host} 이(가) ${x.missingIn}에 없음` })), ...(R.relay?.notAllowed || []).map(x => ({ kind: '중계 서버가 막는 API 주소', msg: `${x.host} (${x.loc}) — 웹 버전 중계에서 host not allowed` }))];
  const J = { errors, warns, hubs: R.hubs.map(h => ({ name: h.f.name, loc: h.f.loc, fanIn: h.fanIn, cc: h.f.cc, mut: h.mut })), cycles: R.cycles, deep: R.deep, complex: R.complex.map(f => ({ name: f.name, loc: f.loc, cc: f.cc, lines: f.lines, depth: f.depth })), complexCases: R.ccases, anon: R.anon, unused: R.unused.map(f => f.name), unusedVars: R.unusedVars, actions: { missing: act.missing, deadHandlers: act.deadH, multi: act.multi }, state: { writeOnly: R.sf.writeOnly.map(x => x.key), scattered: R.sf.scattered.map(x => [x.key, x.writers]) }, strings: R.strings, emptyCatch: R.sg.emptyCatch, rawHTML: R.inj.out, domMissing: R.dom.missing, saveKeys: R.keys?.bad || [], leaks: R.leaks, css: { errors: R.css.errors, dead: R.css.dead }, inlinePrompts: R.prompts, modules: { envy: R.mod.envy, foreign: R.mod.foreign, scattered: R.mod.scattered, natural: R.nat }, promptAll: R.promptAll.map(({ key, chars, loc }) => ({ key, chars, loc })), promptImg: R.promptImg.map(({ key, chars, loc }) => ({ key, chars, loc })), side: { parse: R.side.parse, hosts: R.side.hosts }, relay: R.relay,
    tools: { files: R.tools.files, cmt: R.tools.cmt, parse: R.tools.parse, complex: R.tools.complex.map(f => ({ name: f.name, unit: f.unit, loc: f.loc, cc: f.cc, lines: f.lines, depth: f.depth })), dup: R.tools.dup.map(d => d.fns), strings: R.tools.strings, emptyCatch: R.tools.emptyCatch, unused: R.tools.unused.map(f => ({ name: f.name, loc: f.loc })) } };
  return { units, fns, act, mu, R, errors, warns, J, fnsN: [...fns.values()].filter(f => f.top).length };
}
