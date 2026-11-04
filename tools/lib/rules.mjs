// 규칙 전수검사(사용자 지시: 하나씩 고치지 말고 전수검사 — 도구는 자동화만이 아니라 하나의 원칙과 규칙으로 제어하는 것).
//   원칙(CLAUDE.md §0-2 개발자 역할: 계층 · 상태·데이터 · 저장 정책 · 보안 · AI 연동, §0-1 구조 원칙)을 이 표 한곳에 규칙으로 두고,
//   규칙마다 판정(어떤 분석이 무엇을 위반으로 보나) · 고치는 법(한 가지) · 막는 정도를 정함. 판정은 SPA에 들어가는 코드 전체(src/main · src/modules · src/boot)에.
//   결과는 규칙 단위로 처리(규칙의 고치는 법을 그 규칙의 모든 건에) — node tools/rules.mjs → tools/out/rules.md · rules.json
import { layers, elementParams, LAYER_DEF } from './arch.mjs';
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
  { id: 'X1', group: '보안', name: 'HTML에 이스케이프 없이 넣음', why: 'innerHTML로 가는 값은 esc(), AI 출력은 신뢰하지 않는 입력(OWASP XSS·LLM Top 10)',
    judge: 'HTML 템플릿의 ${…}에 esc() 없이 이름·제목·설명·용어 같은 글(또는 HTML 안전하지 않은 함수의 결과)이 들어감(lib/extra.mjs htmlInject)', fix: 'esc(값)', block: '경고(check.mjs)',
    find: c => c.R.inj.out.map(x => ({ at: x.loc, what: x.what, scope: scopeOfLoc(x.loc) })) },
];

// 전수검사: analyze(check.mjs와 같은 분석)·buildMap(map.mjs와 같은 계층 판정에 쓰는 data 쓰기)을 받아 규칙마다 건을 모음 — 계층 판정은 모든 단위(main·modules·boot)의 함수에
export function runRules({ A, M }) { const writers = new Set(Object.values(M.data).flatMap(d => Object.values(d.writers).flat())), L = layers(A.fns, writers);
  const EP = elementParams(A.fns).filter(x => !['View', 'Controller'].includes(L.layer.get(x.fn)?.layer) && !L.layer.get(x.fn)?.handler);
  const ctx = { fns: A.fns, R: A.R, mu: A.mu, M, L, EP };
  return RULES.map(r => { const items = r.find(ctx), by = { main: 0, modules: 0, boot: 0 }; items.forEach(x => { by[x.scope] = (by[x.scope] || 0) + 1; }); return { ...r, find: undefined, n: items.length, by, items }; }); }
