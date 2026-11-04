// 모듈 경계 분석: 원안의 index.html 한 파일을 개발 편의·혼돈 방지를 위해 나눈 모듈(src/main 파일·src/modules 파일)이
// 제 영역만 맡는지(영역 침범) · 한 가지 일이 여러 모듈에 흩어지지 않았는지(파편화)를 함수 그래프·상태 흐름으로 잼.
//   모듈 지도   — 모듈마다 제목(/* ===== … ===== */)·함수 수·줄 수·주로 부르는 모듈·주로 불리는 모듈
//   상태 주인   — 상태 키(G.meta.x·G.world.x·G.x·P().x)를 가장 많이 쓰는 모듈. 다른 모듈이 쓰면 "남의 상태 쓰기"
//   파편화      — 3개 이상 모듈이 쓰는 상태 키
//   영역 침범   — 함수가 참조(호출·상태 읽기/쓰기)하는 대상의 대부분이 다른 한 모듈에 있음(그 모듈의 일을 하는 함수)
// 공용 기반은 영역 판단에서 뺌: 부르는 함수가 많은 허브 함수(T·esc·mark·openModal 같은 공용 도구)와, 모듈의 절반 이상이 부르는 공용 기반 모듈(유틸·저장·모달 등).
import { progAccessors } from './flow.mjs';
import { walk } from './source.mjs';
const fileOf = loc => String(loc || '').split(':')[0];
const SEEDS = 15; // 기능 섞임을 확인할 때 다른 순서로 묶는 횟수(5번이면 과반 경계의 모듈이 다른 곳을 고칠 때마다 생겼다 사라짐 — 21번으로 재 보니 3/5가 14/21 같은 모듈이 있었음)
const HUB = 25; // 이만큼 많은 함수가 부르면 공용 기반으로 봄

// opts.modOf: 파일 → 모듈(폴더 모듈은 폴더 전체 — tools/lib/scope.mjs moduleOf) · opts.layer: 설계상 여러 모듈의 데이터를 읽는 층(프롬프트 스튜디오 — 기능 데이터로 프롬프트를 만듦)은 영역 침범 판단에서 뺌
// 상태 주인: 상태 키(G.meta.x·G.world.x·G.x·P().x)를 가장 많이 쓰는 모듈
function stateOwners(sf, fileOf) { const owner = new Map(), keyFiles = new Map();
  for (const k of sf.list) { if (!/^(G\.meta\.|G\.world\.|P\(\)\.|G\.)\w+$/.test(k.key) || /^G\.(meta|world|prog)$/.test(k.key)) continue; const c = new Map(); k.wl.forEach(l => { const f = fileOf(l); c.set(f, (c.get(f) || 0) + 1); });
    if (!c.size) continue; owner.set(k.key, [...c].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0][0]); keyFiles.set(k.key, c); }
  return { owner, keyFiles }; }
// 영역 침범 후보: 참조(호출·상태 읽기/쓰기, 공용 기반 제외) 6↑ 중 자기 모듈 ≤25%이고 다른 한 모듈 ≥50%. 액션 분배기(원안 설계상 화면 동작을 기능으로 넘기는 층)·설계상 층(opts.layer)은 뺌
function envyOf(top, refs, fileOf, layer) { const envy = [];
  for (const f of top) { const m = refs.get(f.key); if (!m || /^handle\w+Action$/.test(f.name) || (layer && fileOf(f.loc) === layer)) continue; const own = fileOf(f.loc), tot = [...m.values()].reduce((x, y) => x + y, 0), [tm, tn] = [...m].filter(([x]) => x !== own).sort((x, y) => y[1] - x[1])[0] || [];
    if (tot >= 6 && (m.get(own) || 0) / tot <= 0.25 && tn / tot >= 0.5) envy.push({ fn: f.name, file: own, to: tm, share: Math.round(100 * tn / tot), refs: tot }); }
  return envy.sort((x, y) => y.share - x.share); }
// opts.modOf: 파일 → 모듈(폴더 모듈은 폴더 전체 — tools/lib/scope.mjs moduleOf) · opts.layer: 설계상 여러 모듈의 데이터를 읽는 층(프롬프트 스튜디오 — 기능 데이터로 프롬프트를 만듦)은 영역 침범 판단에서 뺌
export function moduleMap(units, fns, sf, opts = {}) { const fileOf = loc => (opts.modOf || (f => f))(String(loc || '').split(':')[0]);
  const title = new Map(), lines = new Map();
  for (const u of units) for (const f of u.files || []) { const t = u.text.split('\n').slice(f.start, f.end), m = t.find(l => /^\/\*\s*=====\s*.+?\s*=====/.test(l)), k = fileOf(f.path); if (!title.get(k)) title.set(k, m ? m.replace(/^\/\*\s*=====\s*|\s*=====.*$/g, '') : ''); lines.set(k, (lines.get(k) || 0) + f.end - f.start); }
  const top = [...fns.values()].filter(f => f.top && !f.table), modOf = new Map(top.map(f => [f.key, fileOf(f.loc)])), breadth = new Map();
  /* 공용 기반 모듈: 부르는 쪽을 파일 단위로 셈(폴더로 묶거나 모듈을 합쳐도 판정이 흔들리지 않게 — 모듈 단위로 세면 두 모듈을 합칠 때 그 둘이 같이 부르던 모듈의 "부르는 모듈 수"가 줄어 공용에서 빠짐) */
  const rawFile = loc => String(loc || '').split(':')[0];
  for (const f of top) for (const [ck] of f.calls) { const b = modOf.get(ck), a = modOf.get(f.key); if (b && a !== b) { if (!breadth.has(b)) breadth.set(b, new Set()); breadth.get(b).add(rawFile(f.loc)); } }
  const nFiles = new Set(top.map(f => rawFile(f.loc))).size, infra = new Set([...breadth].filter(([, v]) => v.size >= nFiles / 2).map(([k]) => k)), hub = new Set(top.filter(f => f.callers.size >= HUB || infra.has(modOf.get(f.key))).map(f => f.key));
  const { owner, keyFiles } = stateOwners(sf, fileOf);
  // 함수가 참조하는 모듈(공용 기반 제외)
  const refs = new Map(), add = (fk, mod, n = 1) => { if (!mod) return; const m = refs.get(fk) || new Map(); m.set(mod, (m.get(mod) || 0) + n); refs.set(fk, m); };
  for (const f of top) for (const [ck, n] of f.calls) if (modOf.has(ck) && !hub.has(ck) && ck !== f.key) add(f.key, modOf.get(ck), n); // 호출 횟수만큼
  for (const k of sf.list) { const o = owner.get(k.key); if (!o) continue; [...k.r, ...k.w].forEach(fk => { if (modOf.has(fk)) add(fk, o); }); }
  // 모듈 지도: 부르는/불리는 모듈(공용 기반 제외)
  const mods = new Map(), M = p => { if (!mods.has(p)) mods.set(p, { file: p, title: title.get(p) || '', lines: lines.get(p) || 0, fns: 0, out: new Map(), in: new Map(), owns: 0 }); return mods.get(p); };
  for (const f of top) { const a = M(fileOf(f.loc)); a.fns++; for (const [ck] of f.calls) { const b = modOf.get(ck); if (!b || b === a.file || hub.has(ck)) continue; a.out.set(b, (a.out.get(b) || 0) + 1); M(b).in.set(a.file, (M(b).in.get(a.file) || 0) + 1); } }
  for (const [, o] of owner) M(o).owns++;
  const foreign = []; for (const [k, c] of keyFiles) { const o = owner.get(k); for (const [f, n] of c) if (f !== o) foreign.push({ key: k, owner: o, file: f, n }); }
  const scattered = [...keyFiles].filter(([, c]) => c.size >= 3).map(([k, c]) => ({ key: k, owner: owner.get(k), files: [...c.keys()] })).sort((x, y) => y.files.length - x.files.length);
  return { refs, infra: [...infra].sort(), mods: [...mods.values()].sort((x, y) => x.file.localeCompare(y.file)), envy: envyOf(top, refs, fileOf, opts.layer), foreign, scattered, hubs: [...hub].sort() };
}
// 기능 영역(docs/modules.md의 ## 절 — 절마다 적은 파일·함수 이름이 그 기능의 선언): 영역마다
//   선언과 코드가 맞나(적힌 함수가 영역 파일 밖에 있음 = 흩어짐, 없음 = 문서 낡음) · 영역 상태(영역 파일이 주인인 키)를 영역 밖에서 씀 ·
//   영역 밖 함수가 영역 일을 함(영역 침범 후보 중 몰린 곳이 영역) · 영역 함수가 남의 일을 함 · 영역이 부르는/불리는 다른 영역
// docs/modules.md의 ## 절마다 적은 src 파일·함수 이름(그 기능의 선언) — areaMap·모듈 판정(rules.mjs)이 같이 씀
export function areaSections(doc, fns) { const top = [...fns.values()].filter(f => f.top && !f.table), byName = new Map(top.map(f => [f.name, f])), all = new Set(top.map(f => fileOf(f.loc)));
  return String(doc).split(/^## /m).slice(1).map(t => { const title = t.split('\n')[0].trim(), body = t.slice(title.length);
    const files = [...new Set([...body.matchAll(/`(src\/[\w\/.-]+?)`/g)].map(m => m[1]).flatMap(p => p.endsWith('.js') ? [p] : [...all].filter(f => f.startsWith(p.replace(/\/?$/, '/')))))].filter(f => all.has(f));
    const names = [...new Set([...body.matchAll(/`([^`\n]+)`/g)].flatMap(m => m[1].match(/[A-Za-z_$][\w$]*(?=\(|$|[`·,\s])/g) || []))].filter(n => byName.has(n));
    return { title, files, names }; }).filter(s => s.files.length); }
export function areaMap(doc, units, fns, M) {
  const top = [...fns.values()].filter(f => f.top && !f.table), byName = new Map(top.map(f => [f.name, f])), fileOf2 = f => fileOf(f.loc);
  const secs = areaSections(doc, fns);
  const areaOf = new Map(); secs.forEach(s => s.files.forEach(f => { if (!areaOf.has(f)) areaOf.set(f, s.title); }));
  return secs.map(s => { const F = new Set(s.files), inA = f => F.has(f);
    // 흩어진 함수: 절에 적힌 함수가 영역 파일 밖에 있고, 그 함수의 참조(호출·상태)가 절반 이상 영역 파일로 감(다른 영역을 가리키려고 적은 이름은 뺌)
    const share = f => { const m = M.refs.get(f.key); if (!m) return 0; const tot = [...m.values()].reduce((a, b) => a + b, 0); return tot ? [...m].filter(([k]) => inA(k)).reduce((a, [, n]) => a + n, 0) / tot : 0; };
    const misplaced = s.names.map(n => byName.get(n)).filter(f => !inA(fileOf2(f)) && !M.infra.includes(fileOf2(f)) && share(f) >= 0.5).map(f => `${f.name}(${fileOf2(f).replace(/^src\/(main|modules)\//, '')} ${Math.round(100 * share(f))}%)`);
    const foreignW = M.foreign.filter(x => inA(x.owner) && !inA(x.file)).map(x => `${x.key} ← ${x.file.replace(/^src\/(main|modules)\//, '')}`);
    const envyIn = M.envy.filter(e => inA(e.to) && !inA(e.file)).map(e => `${e.fn}(${e.file.replace(/^src\/(main|modules)\//, '')} ${e.share}%)`), envyOut = M.envy.filter(e => inA(e.file) && !inA(e.to)).map(e => `${e.fn}→${e.to.replace(/^src\/(main|modules)\//, '')}`);
    const out = new Map(), inn = new Map(); for (const m of M.mods) { if (inA(m.file)) for (const [b, n] of m.out) if (!inA(b)) { const a = areaOf.get(b) || b.replace(/^src\/(main|modules)\//, ''); out.set(a, (out.get(a) || 0) + n); } if (!inA(m.file)) for (const [b, n] of m.out) if (inA(b)) { const a = areaOf.get(m.file) || m.file.replace(/^src\/(main|modules)\//, ''); inn.set(a, (inn.get(a) || 0) + n); } }
    const top3 = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k}(${n})`).join(', ');
    return { title: s.title, files: s.files, fns: top.filter(f => inA(fileOf2(f))).length, misplaced, foreignW, envyIn, envyOut, calls: top3(out), calledBy: top3(inn) }; }); }

// ── 자연 경계(정밀): 함수 그래프(호출 + 같은 상태 키를 읽고 쓰는 사이)를 모듈성 최대화(Louvain)로 묶어, 코드가 실제로 뭉치는 경계를 찾고 파일(모듈) 경계와 견줌.
//   과잉 분할 — 한 묶음이 여러 모듈에 걸치고, 그 모듈들 각각의 함수 대부분(≥50%)이 그 묶음: 사실상 한 기능을 여러 파일로 쪼갬
//   기능 섞임 — 한 모듈의 함수가 여러 묶음으로 갈림(두 번째 묶음도 ≥30%·3함수↑): 한 파일에 여러 기능
//   기능 분산(제자리 아닌 함수) — 함수가 속한 묶음의 주인 모듈(그 묶음 함수가 가장 많은 모듈)이 자기 모듈과 다름: 다른 기능의 조각이 이 파일에 있음
//   모듈성 Q — 파일 경계로 나눴을 때와 찾은 경계의 Q. 차이가 클수록 파일 경계가 코드의 실제 뭉침과 어긋남
// 공용 기반(허브 함수·공용 모듈)과 액션 분배기(handle*Action — 원안 설계상 모든 기능으로 넘기는 층)는 그래프에서 뺌. 상태 키는 접근 함수가 2~15개인 것만(G.chars 같은 전역 키는 모두를 잇기만 함)
// seed: 노드를 훑는 순서(0 = 이름순, 그 밖은 이름 해시를 섞은 순서 — 결과가 순서에 기대는지 보려고)
const seedKey = (seed, n) => { let h = seed * 2654435761 >>> 0; for (const ch of String(n)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; }, seedSort = (arr, seed) => seed ? arr.sort((a, b) => seedKey(seed, a) - seedKey(seed, b) || String(a).localeCompare(String(b))) : arr.sort();
export function louvain(adj, seed = 0) { // adj: Map(node → Map(nbr → w)) 무향
  let nodes = seedSort([...adj.keys()], seed), comm = new Map(nodes.map(n => [n, n])), level = adj, members = new Map(nodes.map(n => [n, [n]]));
  for (let pass = 0; pass < 10; pass++) {
    const N = seedSort([...level.keys()], seed), k = new Map(N.map(n => [n, [...level.get(n).values()].reduce((a, b) => a + b, 0)])), m2 = [...k.values()].reduce((a, b) => a + b, 0) || 1, c = new Map(N.map(n => [n, n])), tot = new Map(k);
    let moved = true, any = false;
    for (let it = 0; it < 50 && moved; it++) { moved = false;
      for (const i of N) { const ci = c.get(i), ki = k.get(i), w = new Map(); for (const [j, x] of level.get(i)) if (j !== i) w.set(c.get(j), (w.get(c.get(j)) || 0) + x);
        tot.set(ci, tot.get(ci) - ki); let best = ci, bg = (w.get(ci) || 0) - tot.get(ci) * ki / m2;
        for (const [cj, x] of [...w].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) { const g = x - tot.get(cj) * ki / m2; if (g > bg + 1e-12) { bg = g; best = cj; } }
        tot.set(best, (tot.get(best) || 0) + ki); if (best !== ci) { c.set(i, best); moved = true; any = true; } } }
    if (!any) break;
    const next = new Map(), mem2 = new Map(); for (const n of N) { const cn = c.get(n); if (!next.has(cn)) { next.set(cn, new Map()); mem2.set(cn, []); } mem2.get(cn).push(...members.get(n)); }
    for (const n of N) for (const [j, x] of level.get(n)) { const a = c.get(n), b = c.get(j); next.get(a).set(b, (next.get(a).get(b) || 0) + x); }
    level = next; members = mem2; }
  for (const [cn, ms] of members) ms.forEach(n => comm.set(n, cn)); return comm; }
export function modularity(adj, part) { let m2 = 0, q = 0; const deg = new Map(), tot = new Map(); for (const [n, nb] of adj) { const d = [...nb.values()].reduce((a, b) => a + b, 0); deg.set(n, d); m2 += d; tot.set(part.get(n), (tot.get(part.get(n)) || 0) + d); }
  for (const [n, nb] of adj) for (const [j, w] of nb) if (part.get(n) === part.get(j)) q += w; let s = 0; for (const t of tot.values()) s += (t / (m2 || 1)) ** 2; return m2 ? q / m2 - s : 0; }
// 함수 그래프: 호출(부르는 함수가 많은 함수일수록 가볍게 — 여러 기능이 같이 쓰는 도구) + 같은 상태 키(접근 함수 2~8개인 것만, 1/(n-1))
//   진행 접근 함수(칸 하나를 돌려주는 함수 — 예전 RG()·CRES())는 노드로 두지 않음: 그 호출은 상태 흐름에서 진행 칸 접근(P().x)으로 잡히므로 — 칸 이름 접근(progSlot('x'))으로 바꿔도 같은 그래프
//   같은 표(최상위 상수 — 규칙 표·임무 표 등)를 쓰는 사이도 같은 데이터(공통 폐쇄): 2~8개 함수가 쓰는 표만, 1/(n-1)
// 맨 위 문장에서 바로 넘긴 콜백(addEventListener 처리기 등)마다 그 안에서 부르는 맨 위 함수 키 묶음
export function listenerGroups(fns) { const tops = [...fns.values()].filter(f => f.top && !f.table), byName = new Map(), roots = new Map(); for (const f of tops) { if (!byName.has(f.name) || f.unit === 'main') byName.set(f.name, f.key); let r = f.node; while (r.parent) r = r.parent; roots.set(f.unit, r); }
  const out = []; for (const r of roots.values()) for (let i = 0; i < r.childCount; i++) { const st = r.child(i); if (st.type !== 'expression_statement') continue;
    walk(st, cb => { if (!/^(arrow_function|function_expression)$/.test(cb.type) || cb.parent?.type !== 'arguments') return; const S = new Set(); walk(cb, n => { if (n.type === 'call_expression' && n.childForFieldName('function')?.type === 'identifier' && byName.has(n.childForFieldName('function').text)) S.add(byName.get(n.childForFieldName('function').text)); }); if (S.size) out.push(S); return false; }); }
  return out; }
function fnGraph(fns, sf, M, modOfFile, consts = new Set(), layer = null) { const acc = progAccessors(fns);
  /* 설계상 층(프롬프트 스튜디오 — 여러 기능의 프롬프트를 조립)은 공용 기반·분배기처럼 노드에서 뺌: 기능마다의 생성 흐름이 스튜디오 조립 함수를 거쳐 한 묶음으로 붙지 않게 */
  const top = [...fns.values()].filter(f => f.top && !f.table && !acc.has(f.name) && !M.hubs.includes(f.key) && !/^handle\w+Action$/.test(f.name) && !M.infra.includes(fileOf(f.loc)) && !(layer && modOfFile(fileOf(f.loc)) === layer)), keys = new Set(top.map(f => f.key)), adj = new Map(top.map(f => [f.key, new Map()]));
  const add = (a, b, w) => { if (a === b || !keys.has(a) || !keys.has(b)) return; adj.get(a).set(b, (adj.get(a).get(b) || 0) + w); adj.get(b).set(a, (adj.get(b).get(a) || 0) + w); };
  for (const f of top) for (const [ck, n] of f.calls) { const c = fns.get(ck); add(f.key, ck, Math.min(n, 3) / Math.log2(2 + (c ? c.callers.size : 1))); }
  for (const k of sf.list) { const S = [...new Set([...k.r, ...k.w])].filter(x => keys.has(x)); if (S.length < 2 || S.length > 8) continue; const w = 1 / (S.length - 1); for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) add(S[i], S[j], w); }
  /* 같은 맨 위 이벤트 콜백(모듈이 화면 동작을 받는 익명 처리기 — 이름 있는 함수가 아니라 호출 그래프에 안 잡힘)이 부르는 함수들: 같은 동작을 받는 한 기능 — 상태 키처럼 2~8개면 서로 이음 */
  for (const S0 of listenerGroups(fns)) { const S = [...S0].filter(x => keys.has(x)); if (S.length < 2 || S.length > 8) continue; const w = 1 / (S.length - 1); for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) add(S[i], S[j], w); }
  if (consts.size) { const byC = new Map(); for (const f of top) { const seen = new Set(); walk(f.node, n => { if (n.type === 'identifier' && consts.has(n.text) && !seen.has(n.text)) { seen.add(n.text); if (!byC.has(n.text)) byC.set(n.text, []); byC.get(n.text).push(f.key); } }); }
    for (const [, fs] of byC) { if (fs.length < 2 || fs.length > 8) continue; const w = 1 / (fs.length - 1); for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) add(fs[i], fs[j], w); } }
  for (const [n, nb] of [...adj]) if (!nb.size) adj.delete(n); // 홀로 있는 함수는 뺌
  return { adj, modOf: new Map(top.map(f => [f.key, modOfFile(fileOf(f.loc))])), name: new Map(top.map(f => [f.key, f.name])) }; }
const r2 = x => Math.round(x * 100) / 100, groupBy = (it, f) => { const m = new Map(); for (const x of it) { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };
// 과잉 분할: 두 모듈 사이 무게가 둘 중 작은 쪽의 안 무게 이상이고 서로가 서로의 가장 강한 바깥 연결 / 위성: 함수 4개 이하 모듈의 바깥 무게 70%↑가 한 모듈
function overSplitOf(adj, modOf, byMod, name = new Map()) {
  const intra = new Map(), inter = new Map(), pk = (a, b) => a < b ? a + '|' + b : b + '|' + a;
  for (const [n, nb] of adj) for (const [j, w] of nb) { if (n > j) continue; const a = modOf.get(n), b = modOf.get(j); if (a === b) intra.set(a, (intra.get(a) || 0) + w); else inter.set(pk(a, b), (inter.get(pk(a, b)) || 0) + w); }
  const ext = m => [...inter].filter(([k]) => k.split('|').includes(m)).map(([k, w]) => [k.split('|').find(x => x !== m) || m, w]).sort((a, b) => b[1] - a[1]), out = [];
  for (const [k, w] of inter) { const [a, b] = k.split('|'), ia = intra.get(a) || 0, ib = intra.get(b) || 0, ea = ext(a)[0], eb = ext(b)[0];
    if (w >= Math.min(ia, ib) && w >= 1 && ea && eb && ea[0] === b && eb[0] === a) out.push({ kind: '서로 강하게 묶임', mods: [a, b], inter: r2(w), intra: [r2(ia), r2(ib)], fns: [(byMod.get(a) || []).length, (byMod.get(b) || []).length] }); }
  for (const [m, ns] of byMod) { if (ns.length > 4) continue; const e = ext(m), tot = e.reduce((s2, [, w]) => s2 + w, 0) + (intra.get(m) || 0);
    if (e.length && tot >= 1 && e[0][1] / tot >= 0.7 && !out.some(x => x.mods.includes(m))) out.push({ kind: '위성 모듈(작고 한 모듈에 매달림)', mods: [m, e[0][0]], inter: r2(e[0][1]), intra: [r2(intra.get(m) || 0), r2(intra.get(e[0][0]) || 0)], fns: [ns.length, (byMod.get(e[0][0]) || []).length] }); }
  for (const x of out) { const [a, b] = x.mods, lean = []; /* 고칠 단서: 상대 모듈 쪽 무게가 제 모듈 쪽보다 큰 함수(옮길 후보) */
    for (const [n, nb] of adj) { const m = modOf.get(n); if (m !== a && m !== b) continue; const o = m === a ? b : a; let wo = 0, wm = 0; for (const [j, w] of nb) { if (modOf.get(j) === o) wo += w; else if (modOf.get(j) === m) wm += w; } if (wo > wm && wo >= 1) lean.push({ fn: name.get(n) || n, from: m, to: o, w: r2(wo), own: r2(wm) }); }
    x.lean = lean.sort((p, q) => q.w - p.w); }
  return out.sort((a, b) => b.inter - a.inter); }
// 기능 섞임: 모듈 함수가 여러 묶음(두 번째 묶음 ≥30%·3함수) — 묶음 이름은 그 묶음에 함수가 많은 모듈 둘
function mixedOf(comm, modOf, name, byComm, byMod) {
  const label = c => [...groupBy(byComm.get(c), n => modOf.get(n))].map(([m, xs]) => [m, xs.length]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m, k]) => `${m}(${k})`).join('+'), out = [];
  for (const [m, ns] of byMod) { const parts = [...groupBy(ns, n => comm.get(n))].map(([c, xs]) => [c, xs.length]).sort((a, b) => b[1] - a[1]);
    if (parts.length >= 2 && parts[1][1] >= 3 && parts[1][1] / ns.length >= 0.3) out.push({ mod: m, fns: ns.length, parts: parts.slice(0, 3).map(([c, k]) => ({ n: k, cluster: label(c), sample: byComm.get(c).filter(x => modOf.get(x) === m).slice(0, 4).map(x => name.get(x)), fns: byComm.get(c).filter(x => modOf.get(x) === m).map(x => name.get(x)) /* 고칠 때 옮길 묶음 전체(out/modules.json) */ })) }); }
  return out; }
// 기능 분산(제자리 아닌 함수): 함수의 연결 무게가 다른 한 모듈로 60%↑이고 자기 모듈 쪽의 2배↑(근거 무게 2↑)
function displacedOf(adj, modOf, name, layer) { const out = [];
  for (const [n, nb] of adj) { const own = modOf.get(n), by = new Map(); if (layer && own === layer) continue; /* 설계상 층(프롬프트 스튜디오)은 여러 기능 데이터를 읽음 */ let tot = 0; for (const [j, w] of nb) { by.set(modOf.get(j), (by.get(modOf.get(j)) || 0) + w); tot += w; }
    const [tm, tw] = [...by].filter(([m]) => m !== own).sort((a, b) => b[1] - a[1])[0] || []; if (tm && tot >= 2 && tw / tot >= 0.6 && tw >= 2 * (by.get(own) || 0)) out.push({ fn: name.get(n), mod: own, to: tm, share: Math.round(100 * tw / tot), weight: r2(tot) }); }
  return out.sort((a, b) => a.to.localeCompare(b.to) || b.share - a.share); }
// 함수 하나의 연결 무게를 모듈별로(자연 경계와 같은 그래프 — map.mjs --why <함수>가 보여 줌): [[모듈, 무게]] 무거운 순, 그래프에서 빠진 함수(공용 기반·분배기·층)는 null
export function naturalLean(fns, sf, M, key, modOfFile = f => f, layer = null, consts = new Set()) { const { adj, modOf } = fnGraph(fns, sf, M, modOfFile, consts, layer), nb = adj.get(key); if (!nb) return null;
  const by = new Map(); for (const [j, w] of nb) by.set(modOf.get(j), (by.get(modOf.get(j)) || 0) + w); return [...by].map(([m, w]) => [m, r2(w)]).sort((a, b) => b[1] - a[1]); }
export function naturalBoundaries(fns, sf, M, modOfFile = f => f, layer = null, consts = new Set()) {
  const { adj, modOf, name } = fnGraph(fns, sf, M, modOfFile, consts, layer), comm = louvain(adj), byComm = groupBy(comm.keys(), n => comm.get(n)), byMod = groupBy(comm.keys(), n => modOf.get(n));
  /* 기능 섞임은 묶음(Louvain)에 기대고, 묶음은 노드 순서에 따라 갈림 — 순서를 바꿔 SEEDS번 묶어 과반에서 섞임으로 나온 모듈만(다른 곳을 고쳤을 뿐인데 섞임이 생겼다 사라지는 흔들림을 걸러냄) */
  const votes = new Map(); for (let sd = 1; sd <= SEEDS; sd++) { const c2 = louvain(adj, sd), bc2 = groupBy(c2.keys(), n => c2.get(n)); for (const x of mixedOf(c2, modOf, name, bc2, byMod)) votes.set(x.mod, (votes.get(x.mod) || 0) + 1); }
  const stable = m => (votes.get(m) || 0) * 2 > SEEDS, mixed0 = mixedOf(comm, modOf, name, byComm, byMod), mixed = mixed0.filter(x => stable(x.mod)).map(x => ({ ...x, votes: votes.get(x.mod) }));
  const Qfile = modularity(adj, new Map([...adj.keys()].map(n => [n, modOf.get(n)]))), Qnat = modularity(adj, comm);
  return { nodes: adj.size, clusters: byComm.size, Qfile: Math.round(Qfile * 1000) / 1000, Qnat: Math.round(Qnat * 1000) / 1000, overSplit: overSplitOf(adj, modOf, byMod, name), mixed, mixedUnstable: mixed0.filter(x => !stable(x.mod)).map(x => ({ mod: x.mod, votes: votes.get(x.mod) || 0 })), displaced: displacedOf(adj, modOf, name, layer) }; }
