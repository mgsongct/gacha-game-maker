// 모듈 경계 분석: 원안의 index.html 한 파일을 개발 편의·혼돈 방지를 위해 나눈 모듈(src/main 파일·src/modules 파일)이
// 제 영역만 맡는지(영역 침범) · 한 가지 일이 여러 모듈에 흩어지지 않았는지(파편화)를 함수 그래프·상태 흐름으로 잼.
//   모듈 지도   — 모듈마다 제목(/* ===== … ===== */)·함수 수·줄 수·주로 부르는 모듈·주로 불리는 모듈
//   상태 주인   — 상태 키(G.meta.x·G.world.x·G.x·P().x)를 가장 많이 쓰는 모듈. 다른 모듈이 쓰면 "남의 상태 쓰기"
//   파편화      — 3개 이상 모듈이 쓰는 상태 키
//   영역 침범   — 함수가 참조(호출·상태 읽기/쓰기)하는 대상의 대부분이 다른 한 모듈에 있음(그 모듈의 일을 하는 함수)
// 공용 기반은 영역 판단에서 뺌: 부르는 함수가 많은 허브 함수(T·esc·mark·openModal 같은 공용 도구)와, 모듈의 절반 이상이 부르는 공용 기반 모듈(유틸·저장·모달 등).
const fileOf = loc => String(loc || '').split(':')[0];
const HUB = 25; // 이만큼 많은 함수가 부르면 공용 기반으로 봄

export function moduleMap(units, fns, sf) {
  const title = new Map(), lines = new Map();
  for (const u of units) for (const f of u.files || []) { const t = u.text.split('\n').slice(f.start, f.end), m = t.find(l => /^\/\*\s*=====\s*.+?\s*=====/.test(l)); title.set(f.path, m ? m.replace(/^\/\*\s*=====\s*|\s*=====.*$/g, '') : ''); lines.set(f.path, f.end - f.start); }
  const top = [...fns.values()].filter(f => f.top && !f.table), modOf = new Map(top.map(f => [f.key, fileOf(f.loc)])), breadth = new Map();
  for (const f of top) for (const [ck] of f.calls) { const b = modOf.get(ck), a = modOf.get(f.key); if (b && a !== b) { if (!breadth.has(b)) breadth.set(b, new Set()); breadth.get(b).add(a); } }
  const nMods = new Set(modOf.values()).size, infra = new Set([...breadth].filter(([, v]) => v.size >= nMods / 2).map(([k]) => k)), hub = new Set(top.filter(f => f.callers.size >= HUB || infra.has(modOf.get(f.key))).map(f => f.key));
  // 상태 주인: 가장 많이 쓰는 모듈
  const owner = new Map(), keyFiles = new Map();
  for (const k of sf.list) { if (!/^(G\.meta\.|G\.world\.|P\(\)\.|G\.)\w+$/.test(k.key) || /^G\.(meta|world|prog)$/.test(k.key)) continue; const c = new Map(); k.wl.forEach(l => { const f = fileOf(l); c.set(f, (c.get(f) || 0) + 1); });
    if (!c.size) continue; const best = [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]; owner.set(k.key, best); keyFiles.set(k.key, c); }
  // 함수가 참조하는 모듈(공용 기반 제외)
  const refs = new Map(), add = (fk, mod, n = 1) => { if (!mod) return; const m = refs.get(fk) || new Map(); m.set(mod, (m.get(mod) || 0) + n); refs.set(fk, m); };
  for (const f of top) for (const [ck, n] of f.calls) if (modOf.has(ck) && !hub.has(ck) && ck !== f.key) add(f.key, modOf.get(ck), n); // 호출 횟수만큼
  for (const k of sf.list) { const o = owner.get(k.key); if (!o) continue; [...k.r, ...k.w].forEach(fk => { if (modOf.has(fk)) add(fk, o); }); }
  const envy = [];
  for (const f of top) { const m = refs.get(f.key); if (!m || /^handle\w+Action$/.test(f.name)) continue; /* 액션 분배기는 원안 설계상 화면 동작을 기능 모듈로 넘기는 층 */ const own = fileOf(f.loc), tot = [...m.values()].reduce((a, b) => a + b, 0), [tm, tn] = [...m].filter(([x]) => x !== own).sort((a, b) => b[1] - a[1])[0] || [];
    if (tot >= 6 && (m.get(own) || 0) / tot <= 0.25 && tn / tot >= 0.5) envy.push({ fn: f.name, file: own, to: tm, share: Math.round(100 * tn / tot), refs: tot }); }
  // 모듈 지도: 부르는/불리는 모듈(공용 기반 제외)
  const mods = new Map(), M = p => { if (!mods.has(p)) mods.set(p, { file: p, title: title.get(p) || '', lines: lines.get(p) || 0, fns: 0, out: new Map(), in: new Map(), owns: 0 }); return mods.get(p); };
  for (const f of top) { const a = M(fileOf(f.loc)); a.fns++; for (const [ck] of f.calls) { const b = modOf.get(ck); if (!b || b === a.file || hub.has(ck)) continue; a.out.set(b, (a.out.get(b) || 0) + 1); M(b).in.set(a.file, (M(b).in.get(a.file) || 0) + 1); } }
  for (const [, o] of owner) M(o).owns++;
  const foreign = []; for (const [k, c] of keyFiles) { const o = owner.get(k); for (const [f, n] of c) if (f !== o) foreign.push({ key: k, owner: o, file: f, n }); }
  const scattered = [...keyFiles].filter(([, c]) => c.size >= 3).map(([k, c]) => ({ key: k, owner: owner.get(k), files: [...c.keys()] })).sort((a, b) => b.files.length - a.files.length);
  return { infra: [...infra].sort(), mods: [...mods.values()].sort((a, b) => a.file.localeCompare(b.file)), envy: envy.sort((a, b) => b.share - a.share), foreign, scattered, hubs: [...hub].sort() };
}
