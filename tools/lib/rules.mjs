// 규칙 전수검사(사용자 지시: 하나씩 고치지 말고 전수검사 — 도구는 자동화만이 아니라 하나의 원칙과 규칙으로 제어하는 것).
//   원칙(CLAUDE.md §0-2 개발자 역할: 계층 · 상태·데이터 · 저장 정책 · 보안 · AI 연동, §0-1 구조 원칙)을 이 표 한곳에 규칙으로 두고,
//   규칙마다 판정(어떤 분석이 무엇을 위반으로 보나) · 고치는 법(한 가지) · 막는 정도를 정함. 판정은 SPA에 들어가는 코드 전체(src/main · src/modules · src/boot)에.
//   결과는 규칙 단위로 처리(규칙의 고치는 법을 그 규칙의 모든 건에) — node tools/rules.mjs → tools/out/rules.md · rules.json
import { layers, elementParams, LAYER_DEF } from './arch.mjs';
import { moduleOf } from './scope.mjs';
import { reachable } from './history.mjs';
import { classTable, aliasOf } from './graph.mjs';
import { unboundRefs } from './scope.mjs';
import { walk } from './source.mjs';
export { LAYER_DEF };

// 함수 키 → 단위(main · modules · boot)
const scopeOf = (fns, k) => { const u = fns.get(k)?.unit || ''; return u === 'main' ? 'main' : u.startsWith('module:') ? 'modules' : u.startsWith('boot:') ? 'boot' : 'main'; };
const scopeOfLoc = loc => /src\/modules\//.test(loc) ? 'modules' : /src\/boot\//.test(loc) ? 'boot' : 'main';
const fnLoc = (fns, k) => fns.get(k)?.loc || k;

// 그리다가 바꿈(L2)의 원인 — 끝 함수(실제로 상태를 바꾸는 함수)의 성질로 나눔. 원인마다 고치는 법 하나(L2_CAUSES)
export const L2_CAUSES = {
  '처리 호출': { judge: '끝 함수가 입출력 어댑터·저장소 쓰기·네트워크(통신·저장·AI)', fix: '그 화면 함수는 처리를 하지 않음 — 처리는 처리기(액션)·흐름(Controller)으로 옮기고 화면은 결과만 그림(화면이 붙인 콜백이면 data-act 액션으로)' },
  '읽기가 progSlot': { judge: '끝 함수가 진행 칸을 progSlot(맞춰 저장)으로 읽음', fix: '읽기는 progRead(상태 그대로)로 — 만들기·날 바뀜은 그리기 전 처리(progTick)가 함' },
  '없으면 만들어 씀': { judge: '끝 함수가 쓴 자리를 그대로 돌려줌(if(!x.k) x.k = 기본값; return x.k 꼴의 게터)', fix: '읽기(없으면 기본값을 돌려주기만)와 만들기(쓰는 쪽·불러오기 fix·그리기 전 처리)로 나눔 — 정의는 한곳(PROG_SLOTS처럼)' },
  '상태 바꿈': { judge: '그 밖에 끝 함수가 게임 상태를 씀', fix: '상태 변경은 처리기·그리기 전 처리(SCREEN_ENTER)로 옮기고 화면은 읽기만' },
};
function l2Cause(c, k) { const o = c.L.layer.get(k), f = c.fns.get(k); if (!o || !f) return '상태 바꿈'; if (o.lazy) return '없으면 만들어 씀'; /* 더 구체적인 원인 먼저(저장소에 만들어 두는 게터도) */ if (o.adapter || o.service || o.store) return '처리 호출'; if (/\bprogSlot\(/.test(f.node.text)) return '읽기가 progSlot'; return '상태 바꿈'; }

// 역할 꼴(무리): 그 역할의 중심 함수를 부르는 함수 — 같은 역할을 따로 구현하는 무리(docs/redesign.md 1절 ③). 무리마다 맡을 상위 class(3절 설계)
export const ROLES = { 'AI 생성 흐름': /^(aiJSON|aiCall|aiJSONRetry|aiOne)$/, '그림 생성': /^(naiGenerate|naiDraw|naiDrawItem|naiDrawItem0|comfyGenerate|imageCandidates)$/, '창 열기': /^openModal$/, '진행 칸 쓰기': /^progSlot$/, '게임 칸 쓰기': /^gameSlot$/ };
export const ROLE_BASE = { 'AI 생성 흐름': 'Generator', '그림 생성': 'ImageJob', '창 열기': 'Dialog', '진행 칸 쓰기': 'Slot', '게임 칸 쓰기': 'Repository', '화면 그리기(HTML)': 'Screen' };
/* 무리 구성원(중심 함수 자신은 뺌)마다 class와 그 무리의 상위 class 아래인지(under) */
export function roleFamilies(fns, classes = new Map()) { const under = (c, base) => { for (let k = c, i = 0; k && i < 20; k = classes.get(k), i++) if (k === base) return true; return false; };
  const row = (f, role) => ({ name: f.name, key: f.key, cls: f.cls || null, mod: f.loc.split(':')[0], loc: f.loc, under: under(f.cls, ROLE_BASE[role]) }), out = {};
  for (const [role, re] of Object.entries(ROLES)) out[role] = [...fns.values()].filter(f => f.top && !f.table && !re.test(f.name) && [...f.calls.keys()].some(k => re.test(fns.get(k)?.name || ''))).map(f => row(f, role));
  out['화면 그리기(HTML)'] = [...fns.values()].filter(f => f.top && !f.table && /HTML\d*$/.test(f.name)).map(f => row(f, '화면 그리기(HTML)')); return out; }
/* 옛 이름 다리(src/main/99-aliases.js — function n(...a){ return Class.n(...a); })로 부르는 곳: 코드의 풀리지 않는 참조(전역으로 감) · HTML·글 속 처리기(onclick="n(…)") */
export function aliasUses(units, html = '', drivers = []) { const main = units.find(u => u.name === 'main'), alias = new Map(); if (!main) return [];
  for (let i = 0; i < main.tree.rootNode.childCount; i++) { const c = main.tree.rootNode.child(i), to = aliasOf(c); if (to) alias.set(c.childForFieldName('name').text, to); } if (!alias.size) return [];
  const out = [], RE = new RegExp(`(^|[^\\w$.])(${[...alias.keys()].join('|')})\\s*\\(`, 'g');
  for (const u of units) { for (const n of unboundRefs(u.tree.rootNode, { topFree: true }).refs) if (alias.has(n.text) && !aliasOf(n.parent)) out.push({ at: u.loc(n), name: n.text, to: alias.get(n.text) });
    walk(u.tree.rootNode, n => { if (n.type !== 'string_fragment') return; for (const m of n.text.matchAll(RE)) out.push({ at: u.loc(n), name: m[2], to: alias.get(m[2]), inText: true }); }); }
  String(html).split('\n').forEach((l, i) => { for (const m of l.matchAll(RE)) out.push({ at: `src/index.html:${i + 1}`, name: m[2], to: alias.get(m[2]), inText: true }); });
  /* 페이지를 모는 시험 도구(build/test.mjs · tools/play): 다리 이름을 덮어써 가로채면(window.aiJSON = 가짜) 코드는 Class.이름을 부르므로 가로채지지 않음 */
  const SET = new RegExp(`(?:window\\.|globalThis\\.|[^\\w$.]|^)(${[...alias.keys()].join('|')})\\s*=(?![="'])`, 'g'); /* HTML 속성(data-pf="…")은 아님 */
  const DECL = /(\b(const|let|var)\s+[\w$,\s{}\[\]:]*|[{,(]\s*)$/; /* 선언·매개변수 기본값·구조 분해·객체 칸(Node 쪽 이름)은 덮어쓰기가 아님 */
  for (const d of drivers) String(d.text).split('\n').forEach((l, i) => { for (const m of l.matchAll(SET)) { const pre = l.slice(0, m.index + m[0].indexOf(m[1])); if ((!/(window|globalThis)\.$/.test(pre) && DECL.test(pre)) || /\/\/(?!.*['"`])/.test(pre)) continue; /* 주석 속 글은 아님 */ out.push({ at: `${d.path}:${i + 1}`, name: m[1], to: alias.get(m[1]), driver: true, text: l.trim().slice(0, 90) }); } });
  return out; }

// 규칙표: id · 무리 · 원칙 · 판정 · 고치는 법 · 막는 정도 · 건(ctx → [{at, what, scope}])
export const RULES = [
  { id: 'L1', group: '계층', name: '계층 섞임', why: 'View는 상태를 바꾸지 않고 Model은 화면을 부르지 않음 — 한 함수에 섞지 않음',
    judge: '함수 자신이 화면 바꿈(V)과 상태 바꿈(S)을 함께 가짐 — 계층 정의 LAYER_DEF(lib/arch.mjs)',
    fix: '화면 식은 View 함수로(tools/extract.mjs), 상태 쓰기는 Model 함수로 떼고 원래 함수는 둘을 잇는 흐름(Controller)으로 — 꼴별 계획은 map.mjs --split', block: '래칫(map.mjs --strict — 늘면 실패)',
    find: c => [...c.L.layer].filter(([, x]) => x.layer === '섞임').map(([k]) => ({ at: fnLoc(c.fns, k), what: c.fns.get(k).name, scope: scopeOf(c.fns, k) })) },
  { id: 'L2', group: '계층', name: '그리다가 바꿈', why: 'View는 상태를 바꾸지 않음(그리다가 지연 생성·저장 표시 포함)',
    judge: 'View 함수가 바꾸는 함수(상태 바꿈이 있거나 그런 함수를 부르는 함수)를 부름 — 화면 갱신 요청 render·renderView만 뺌(LAYER_DEF.direction)',
    fix: '상태 변경은 그리기 전 처리(render의 SCREEN_ENTER·progTick)나 처리기로 옮기고 View는 읽기(progRead·읽기 함수)만', block: '래칫(map.mjs --strict)',
    find: c => c.L.bad.filter(b => b.kind.startsWith('View')).map(b => { const p = (b.path || []).map(k => c.fns.get(k)?.name || k), endK = (b.path || []).at(-1), cause = l2Cause(c, endK); return { at: fnLoc(c.fns, b.fn), what: `${c.fns.get(b.fn)?.name} → ${p.join(' → ')}${b.inner ? ' (화면이 붙인 콜백 안)' : ''}`, end: p.at(-1), cause, scope: scopeOf(c.fns, b.fn) }; }) },
  { id: 'L3', group: '계층', name: '처리가 화면을 부름', why: 'Model은 화면을 부르지 않음',
    judge: 'Model 함수가 화면 함수(View·섞임 — toast·openModal 같은 갱신 통로 포함)를 부름(LAYER_DEF.direction)',
    fix: 'Model은 결과를 돌려주거나 창 이벤트로 알리고(기존 꼴 ggm-saved·ggm-storage-error), 화면은 Model을 부른 Controller(처리기·흐름)가 부름. 진행 표시는 Controller가 만든 진행 알림(uiProg·genStep)을 받아 부름', block: '래칫(map.mjs --strict)',
    find: c => c.L.bad.filter(b => b.kind.startsWith('Model')).map(b => ({ at: fnLoc(c.fns, b.fn), what: `${c.fns.get(b.fn)?.name} → ${c.fns.get(b.to)?.name}`, scope: scopeOf(c.fns, b.fn) })) },
  { id: 'L4', group: '계층', name: 'Model이 화면 요소를 받음', why: 'Model은 화면(DOM)을 모름',
    judge: '화면이 아닌 함수(Model·섞임)의 매개변수가 DOM 요소로 쓰이거나 그런 자리로 넘어감(lib/arch.mjs elementParams — 호출 그래프 고정점)',
    fix: 'Controller가 uiProg(단추[, 글 칸])로 만든 진행 알림을 넘기고, 작업은 rep(글)·rep.end()만 부름', block: '보고',
    find: c => c.EP.map(x => ({ at: fnLoc(c.fns, x.fn), what: `${c.fns.get(x.fn)?.name}(${x.param})${x.direct ? ' 직접' : ' → ' + x.via}`, scope: scopeOf(c.fns, x.fn) })) },
  { id: 'D1', group: '상태·데이터', name: '읽기 결과에 쓰기', why: '같은 상태의 정의(기본값·만들기)는 한곳 — 읽기는 상태를 바꾸지 않고, 바꿀 때는 상태에 씀',
    judge: '상태를 쓰지 않고 어떤 길에서 새 값을 돌려주는 읽기 함수(progRead·conMeta·VARIANTS …)의 결과에 바로 대입·push·delete(lib/extra.mjs freshReaderWrites)',
    fix: 'progSlot(칸) 또는 G.meta.x = Object.assign(읽기(), 바꿀 값)처럼 상태에 씀', block: '오류(check.mjs)',
    find: c => c.R.freshW.map(x => ({ at: x.loc, what: `${x.fn}() — ${x.text}`, scope: scopeOfLoc(x.loc) })) },
  { id: 'D2', group: '상태·데이터', name: '저장 표시 없는 상태 쓰기', why: '게임 내용은 data(JSON)에 — 바꾼 상태는 저장 표시(mark)로 data 동기화',
    judge: 'G·P()를 쓰는 함수가 자신·부르는 쪽 어디에도 mark() 등 저장 표시가 없음(lib/flow.mjs mutations)',
    fix: '상태를 바꾸는 Model 함수 안에서 mark(그 칸)', block: '경고(check.mjs)',
    find: c => c.mu.unsaved.map(x => ({ at: x.fn.loc, what: `${x.fn.name} — ${x.ex?.what || ''}`, scope: scopeOf(c.fns, x.fn.key) })) },
  { id: 'D3', group: '상태·데이터', name: 'data 창구가 갈라짐', why: '기능이란 CRUD 일괄 포함하는 단위 — 생성하는 측·수정하는 측·제거하는 측을 따로 두지 않고 하나의 일괄 창구에서 관리하며 갈라지지 않음(사용자 지시)',
    judge: '한 data 경로(연관 맵 docs/map.md — 상태 칸·엔티티 필드)를 만들고·고치고·지우는 함수(연관 맵 data.writers — 생성기·실행기·편집기)가 둘 이상의 모듈에 있음',
    fix: '그 기능 모듈에 창구(만들기·고치기·지우기 Model 함수)를 두고, 다른 모듈(생성기·편집 화면·실행 중 AI·처리기)은 창구를 부름', block: '래칫(rules.mjs --strict)',
    find: c => Object.entries(c.M.data).flatMap(([k, d]) => { const ws = [...new Set(Object.values(d.writers).flat())].filter(w => c.M.fns[w]), mods = [...new Set(ws.map(w => c.M.fns[w].module))]; if (mods.length < 2) return [];
      const by = m => ws.filter(w => c.M.fns[w].module === m).map(w => c.M.fns[w].name); return [{ at: k, what: `${mods.length}개 모듈 — ${mods.map(m => `${String(m).replace(/^src\/(main|modules)\//, '')}(${by(m).slice(0, 3).join('·')}${by(m).length > 3 ? '…' : ''})`).join(' / ')}`, scope: scopeOf(c.fns, ws[0]) }]; }) },
  { id: 'S1', group: '저장 정책', name: '갈래 없는 저장 키', why: '브라우저 저장소는 캐시, 원본은 PC 서버 옆 data — 새 저장 키는 동기화 대상인지부터 정함',
    judge: '코드가 쓰는 localStorage·appStorage·sessionStorage 키가 STORE_POLICY(0360-sync/010-common.js) 어느 갈래에도 없음',
    fix: 'STORE_POLICY에 갈래(sync·secret·keep·device·cache·legacy)를 정해 넣음', block: '래칫(map.mjs --strict)',
    find: c => (c.M.arch.store?.keys || []).filter(k => !k.kind).map(k => ({ at: fnLoc(c.fns, (k.fns || [])[0]), what: k.key, scope: scopeOf(c.fns, (k.fns || [])[0]) })) },
  { id: 'N1', group: '구조', name: '정의 안 된 이름', why: '분석한 코드 = 빌드된 SPA 코드 — 부르면 ReferenceError가 나는 이름 없음',
    judge: '범위 사슬로 풀리지 않고 맨 위 선언·전역에 붙인 이름·브라우저 전역(tools/browser-globals.json) 어디에도 없는 참조(lib/extra.mjs undefinedNames)',
    fix: '이름을 바로잡거나(매개변수 이름 등) 선언을 둠', block: '오류(check.mjs)',
    find: c => c.R.undef.map(x => ({ at: x.loc, what: x.name, scope: scopeOfLoc(x.loc) })) },
  { id: 'N2', group: '구조', name: '불러올 때 아직 없는 이름(TDZ)', why: '모듈 블록 → main 이름순 실행 — 앱이 뜨지 않는 순서 문제 없음',
    judge: '함수 밖(불러올 때 계산)에서 뒤에 선언된 const·let·class를 읽음(lib/extra.mjs tdzRefs)', fix: '선언을 앞으로 옮기거나 함수 안(나중에 돎)에서 읽음', block: '오류(check.mjs)',
    find: c => c.R.tdz.map(x => ({ at: x.loc, what: `${x.name} — 선언 ${x.decl}`, scope: scopeOfLoc(x.loc) })) },
  { id: 'E1', group: '구조', name: '순수 모듈이 DOM·앱 상태를 참조', why: '규칙 엔진(GGMCombat 010~030·GGMConstruct·GGMExpedition)은 순수 — Web Worker에서도 돎',
    judge: '순수 모듈 블록이 document·window·G·P() 등 앱·DOM을 참조(lib/prompts.mjs pureModules)', fix: '필요한 값은 인자로 받음', block: '오류(check.mjs)',
    find: c => (c.R.pure || []).map(x => ({ at: x.loc, what: x.name, scope: 'modules' })) },
  { id: 'P1', group: 'AI 연동', name: '프롬프트가 스튜디오 밖', why: '프롬프트 글·기법은 스튜디오 조각에 — 흩어 넣지 않음',
    judge: '스튜디오 모듈(0015-prompt-studio/) 밖의 LLM 지시문·프롬프트 글·그림 태그·조립 함수(lib/prompts.mjs)', fix: 'tools/prompts-move.mjs로 스튜디오 조각(pfDef)·요청 조립·조립 함수로', block: '오류(check.mjs)',
    find: c => [...c.R.prompts, ...c.R.promptAll, ...c.R.promptImg].map(x => ({ at: x.loc, what: `${x.key} ${x.chars}자`, scope: scopeOfLoc(x.loc) })).concat(c.R.builders.builders.map(x => ({ at: x.loc, what: x.fn, scope: scopeOfLoc(x.loc) }))) },
  { id: 'C1', group: '재설계', name: '역할 무리가 상위 class 밖', why: '같은 역할(AI 생성 흐름·창·화면 그리기·칸 쓰기·그림 생성)은 상위 class 하나(템플릿 메서드)의 하위가 다른 점만 가짐 — 같은 흐름을 따로 구현하지 않음(DRY · docs/redesign.md 3절)',
    judge: '역할 무리(ROLES — 그 역할의 중심 함수 aiJSON·openModal·progSlot·gameSlot·naiGenerate…를 부르는 함수, 이름이 …HTML인 화면 그리기)가 무리의 상위 class(ROLE_BASE) 하위의 메서드가 아님', fix: '무리의 상위 class 하위로 — 흐름은 상위의 템플릿 메서드, 하위는 다른 점(프롬프트·검사·반영·창 내용)만', block: '래칫(rules.mjs --strict)',
    find: c => Object.entries(c.RF).flatMap(([role, xs]) => xs.filter(x => !x.under).map(x => ({ at: x.loc, what: `${role} → ${ROLE_BASE[role]}: ${x.cls ? x.cls + '.' : ''}${x.name}`, kind: `${role} → ${ROLE_BASE[role]}`, scope: scopeOfLoc(x.loc) }))) },
  { id: 'A1', group: '재설계', name: '옛 이름 다리로 부름', why: '함수는 class에 — 옛 전역 이름 다리(src/main/99-aliases.js)는 옮기는 동안만 두는 임시 길(docs/restructure.md R6)',
    judge: '코드의 풀리지 않는 참조·HTML과 글 속 처리기(onclick="이름(…)")가 다리 이름을 부름 · 페이지를 모는 시험 도구(build/test.mjs·tools/play)가 다리 이름을 덮어써 가로챔(aliasUses)', fix: 'Class.이름으로 바꿈 — 다 바꾸면 다리를 지움', block: '래칫(rules.mjs --strict)',
    find: c => c.AU.map(x => ({ at: x.at, what: `${x.name} → ${x.to}.${x.name}${x.inText ? ' (글 속)' : ''}${x.text ? ` — ${x.text}` : ''}`, kind: x.driver ? '시험 도구가 덮어씀(가로채기 안 됨)' : x.at.startsWith('src/index.html') ? 'HTML 처리기' : x.inText ? '글 속 처리기' : '코드', scope: x.driver ? 'tools' : scopeOfLoc(x.at) })) },
  { id: 'X1', group: '보안', name: 'HTML에 이스케이프 없이 넣음', why: 'innerHTML로 가는 값은 esc(), AI 출력은 신뢰하지 않는 입력(OWASP XSS·LLM Top 10)',
    judge: 'HTML 템플릿의 ${…}에 esc() 없이 이름·제목·설명·용어 같은 글(또는 HTML 안전하지 않은 함수의 결과)이 들어감(lib/extra.mjs htmlInject)', fix: 'esc(값)', block: '경고(check.mjs)',
    find: c => c.R.inj.out.map(x => ({ at: x.loc, what: x.what, scope: scopeOfLoc(x.loc) })) },
];

// 전수검사: analyze(check.mjs와 같은 분석)·buildMap(map.mjs와 같은 계층 판정에 쓰는 data 쓰기)을 받아 규칙마다 건을 모음 — 계층 판정은 모든 단위(main·modules·boot)의 함수에
// 모듈 판정(사용자 지시: 「SOLID/DRY/KISS/YAGNI로 재면서 위반하는것들을 쳐 내서」「지금 있다고 그냥 유지하는게 아니라. 대다수는 폐기/통합/재구축으로 쳐내야」 — 유지가 기본이 아님)
//   원칙마다 이 코드에서 재는 것(아래 JUDGE_DEF)과 판정 순서. 모듈 = 파일(폴더 모듈은 폴더 — lib/scope.mjs moduleOf)
export const JUDGE_DEF = {
  S: 'SRP 단일 책임 — 관계없는 기능 둘 이상(연관 맵 모듈 판정 슈퍼·흩어짐) · 자연 경계 기능 섞임',
  O: 'OCP 개방·폐쇄 — 이 모듈의 함수를 다른 모듈의 액션 분배기(handle…Action)가 직접 부름(기능을 고치면 분배기도 고쳐야 함): 부르는 수',
  D: 'DIP 의존 역전 — Model이 화면을 부름(L3)·Model이 화면 요소를 받음(L4): 건',
  LI: 'LSP·ISP — 클래스·상속·인터페이스가 없는 함수 모듈이라 재지 않음',
  DRY: 'DRY — 같은 본문 함수 묶음(check 다중화) + 이 모듈이 다른 모듈과 함께 쓰는 data 경로(D3 창구 갈라짐)',
  KISS: 'KISS — 복잡한 함수(복잡도 40↑·120줄↑·중첩 7↑) + 계층 섞인 함수(L1)',
  YAGNI: 'YAGNI — 진입점(부팅·html·화면 조작·생성·실행 중 AI·불러오기 — lib/history.mjs reachable)에서 닿지 않는 함수 + 쓰기만 하고 아무도 안 읽는 상태 키. 브라우저 시험에서 실행 안 된 함수(GGM_COVERAGE=1 node build/test.mjs)는 참고로만',
  verdict: '폐기: 닿지 않는 함수가 절반↑ · 통합: 게으른 모듈(연관 맵 판정 조각 → 그 기능의 모듈로) · 해체: SRP 위반(기능별로 나눠 각 기능 모듈로) · 재구축: O·D·DRY·KISS 위반이 하나라도 · 유지: 위반 없음 — 앞에서부터 먼저 걸린 것',
};
const locOfDup = s => String(s).slice(String(s).lastIndexOf('(') + 1, -1);
export function judgeModules(c, RS, { units = [], html = '', cov = null } = {}) {
  const fileMod = loc => moduleOf(String(loc).split(':')[0]), modOf = k => fileMod(c.fns.get(k)?.loc || ''), byMod = new Map();
  for (const f of c.fns.values()) { if (!f.top || f.table) continue; const m = modOf(f.key); if (!byMod.has(m)) byMod.set(m, []); byMod.get(m).push(f); }
  const V = new Map((c.M.arch?.verdicts || []).map(v => [v.mod, v])), nat = new Set((c.R.nat?.mixed || []).map(x => x.mod)), items = id => RS.find(r => r.id === id)?.items || [], cnt = (id, m) => items(id).filter(x => fileMod(x.at) === m).length;
  const reach = units.length ? reachable(units, c.fns, html, new Set((c.R.act?.deadH || []).map(x => x.act))) : null, ran = cov ? new Set(cov.ran) : null, unusedK = new Set(c.R.unused.map(f => f.key)), complexK = new Set(c.R.complex.map(f => f.key));
  const dupN = m => c.R.dup.filter(g => g.fns.some(x => fileMod(locOfDup(x)) === m)).length, wOnly = m => (c.R.sf?.writeOnly || []).filter(x => [...x.w].some(w => modOf(w) === m)).length;
  const shared = m => Object.values(c.M.data).filter(d => { const ms = new Set(Object.values(d.writers).flat().map(w => c.M.fns[w]?.module).filter(Boolean)); return ms.size > 1 && ms.has(m); }).length;
  const disp = new Map(); for (const f of c.fns.values()) if (f.top && /^handle\w+Action$/.test(f.name)) for (const k of f.calls.keys()) { const m = modOf(k); if (m && m !== modOf(f.key)) disp.set(m, (disp.get(m) || 0) + 1); }
  return [...byMod].map(([m, fs]) => { const v = V.get(m), n = fs.length, dead = fs.filter(f => unusedK.has(f.key) || (reach && !reach.has(f.key))), notRan = ran ? fs.filter(f => !ran.has(f.name)).length : null;
    const S = (v && ['슈퍼', '흩어짐'].includes(v.kind) ? 1 : 0) + (nat.has(m) ? 1 : 0), O = disp.get(m) || 0, D = cnt('L3', m) + cnt('L4', m), DRY = dupN(m) + shared(m), KISS = fs.filter(f => complexK.has(f.key)).length + cnt('L1', m), YAGNI = dead.length + wOnly(m);
    const verdict = n && dead.length * 2 >= n ? '폐기' : v?.kind === '조각' ? '통합' : S ? '해체' : (O || D || DRY || KISS) ? '재구축' : '유지';
    const to = verdict === '통합' ? [v.to] : verdict === '해체' ? [...new Set((v?.split || v?.spread || []).map(x => x.to).filter(Boolean))] : [];
    return { mod: m, n, kind: v?.kind || null, S, O, D, DRY, KISS, YAGNI, dead: dead.map(f => f.name), notRan, verdict, to }; })
    .sort((a, b) => ['폐기', '통합', '해체', '재구축', '유지'].indexOf(a.verdict) - ['폐기', '통합', '해체', '재구축', '유지'].indexOf(b.verdict) || a.mod.localeCompare(b.mod)); }
export function runRules({ A, M, html = '', drivers = [] }) { const writers = new Set(Object.values(M.data).flatMap(d => Object.values(d.writers).flat())), L = layers(A.fns, writers);
  const EP = elementParams(A.fns).filter(x => !['View', 'Controller'].includes(L.layer.get(x.fn)?.layer) && !L.layer.get(x.fn)?.handler);
  const ctx = { fns: A.fns, R: A.R, mu: A.mu, M, L, EP, RF: roleFamilies(A.fns, classTable(A.units || [])), AU: aliasUses(A.units || [], html, drivers) };
  return RULES.map(r => { const items = r.find(ctx), by = { main: 0, modules: 0, boot: 0 }; items.forEach(x => { by[x.scope] = (by[x.scope] || 0) + 1; }); return { ...r, find: undefined, n: items.length, by, items }; }); }
