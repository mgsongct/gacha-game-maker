// 데이터 생애주기: 게임 데이터 키(G.meta.* · G.world.* · G.* · P().*)를 "누가 언제 쓰는가"로 나눔.
//   생성     — 새 게임 생성(newGame·newGameManual·buildNewGameDraft·buildManualGameDraft)에서 부르는 함수들이 쓰는 키(만드는 중인 게임 ng.* 포함)
//   실행 중 AI — 게임이 구동되는 동안 주기적으로 AI가 콘텐츠를 만드는 경로(liveTick: 시즌·장·이벤트·픽업·의상·톡)
//   사용자    — 화면 조작(handle*Action 처리기, 최상위 이벤트 리스너 콜백이 부르는 함수)
//   불러오기  — 저장된 게임을 고쳐 읽고 기본값을 채우는 곳(fix·defaults·applyMeta)
// 원안(포크 전) 트리에도 같은 분석을 돌려, 원안이 무엇을 언제 만들었는지와 포크 기능 데이터가 그 경계의 어디에 붙었는지 비교
import { walk } from './source.mjs';
import { closure, generatorVocab } from './wiring.mjs';

export const STAGES = { 생성: ['newGame', 'newGameManual', 'buildNewGameDraft', 'buildManualGameDraft'], '실행 중 AI': ['liveTick'], 불러오기: ['fix', 'defaults', 'applyMeta'] };
// 최상위 addEventListener 콜백(이름 없는 함수)이 부르는 최상위 함수 — 함수 그래프에는 호출자가 없어 따로 모음
export function listenerCallees(units, fns) { const out = new Set();
  for (const u of units) { if (u.name !== 'main') continue;
    for (let i = 0; i < u.tree.rootNode.childCount; i++) walk(u.tree.rootNode.child(i), n => { if (n.type !== 'call_expression' || !/addEventListener$/.test(n.childForFieldName('function')?.text || '')) return;
      const cb = n.childForFieldName('arguments')?.namedChildren.find(a => a.type === 'arrow_function' || a.type === 'function_expression'); if (!cb) return;
      walk(cb, m => { if (m.type === 'call_expression') { const f = m.childForFieldName('function'); if (f?.type === 'identifier' && fns.has(f.text) && fns.get(f.text).top) out.add(f.text); } }); }); }
  return [...out]; }
export function stageRoots(units, fns) { return { ...STAGES, 사용자: [...[...fns.values()].filter(f => f.top && /^handle\w+Action$/.test(f.name)).map(f => f.key), ...listenerCallees(units, fns)] }; }
export function stageClosures(units, fns) { return Object.fromEntries(Object.entries(stageRoots(units, fns)).map(([k, roots]) => [k, closure(fns, roots, k === '불러오기' ? 2 : k === '사용자' ? 4 : 5)])); }
// 키마다 단계별 쓰는 함수(몇 개만) — 생성은 ng.* 쓰기까지 포함
export function lifecycle(units, fns, sf) { const S = stageClosures(units, fns), gv = generatorVocab(fns, S.생성.keys(), new Set()), rows = new Map(), row = k => { if (!rows.has(k)) rows.set(k, { key: k, readers: 0, stages: {} }); return rows.get(k); };
  for (const x of sf.list) { if (!/^(G\.meta\.|G\.world\.|P\(\)\.|G\.)\w+$/.test(x.key) || /^G\.(meta|world|prog)$/.test(x.key)) continue; const r = row(x.key); r.readers = x.r.size;
    for (const [st, cl] of Object.entries(S)) { const w = [...x.w].filter(f => cl.has(f)); if (w.length) r.stages[st] = w; } }
  for (const [k, ws] of gv.writes) { if (!/^(G\.meta\.|G\.world\.|P\(\)\.|G\.)\w+$/.test(k) || /^G\.(meta|world|prog)$/.test(k)) continue; const r = row(k); r.stages.생성 = [...new Set([...(r.stages.생성 || []), ...ws])]; }
  return { rows: [...rows.values()].sort((a, b) => a.key.localeCompare(b.key)), sizes: Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v.size])) }; }
