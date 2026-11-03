// 생성된 게임 QA·플레이 점검 본체(runQA)와 보고서(md). 명령줄은 tools/play/qa.mjs, 자체 검사는 tools/play/test.mjs
import { withPage } from './page.mjs';

export async function runQA(game, input) { const { out, errors } = await withPage(page => page.evaluate(async ({ game, input }) => {
  const R = { findings: [] }, F = (sev, area, msg) => R.findings.push({ sev, area, msg });
  let seed = 12345; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  closeModal(); closeOv(); G = fix(JSON.parse(game)); applyMeta(); window.reloadGame = () => {};
  const main = G.chapters.filter(c => c.kind === 'main'), chars = G.chars.filter(c => !c.alt), npcs = G.npcs || [], elems = new Set((G.meta.elems || []).map(e => e.n));
  const cnt = (a, f) => a.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {}), L = r => Array.isArray(r) ? r : (r && r.issues) || [];
  // ① 구성
  R.meta = { title: G.meta.title, sub: G.meta.sub, theme: G.meta.theme, terms: G.meta.terms, elems: (G.meta.elems || []).map(e => `${e.n}>${e.beats || BEATS[e.n] || '?'}`), farms: (G.meta.farms || []).map(f => f.name) };
  R.world = { name: G.world.name, summary: G.world.summary, plotLen: String(G.world.plot || '').length, loreLen: String(G.world.lore || '').length, factions: (G.world.factions || []).map(f => `${f.name}/${f.kind}`), plan: !!(G.world.plan && (G.world.plan.acts || []).length) };
  R.chars = chars.map(c => ({ name: c.name, rarity: RL[c.rarity], role: c.role, elem: c.elem, faction: c.faction, debut: c.debut ? 'stage' : c.debutLater ? 'later' : 'start', profileLen: String(c.profile || '').length, lines: (c.lines || []).length, persona: c.persona ? Object.keys(c.persona).filter(k => String(c.persona[k] || '').trim()).length : 0, skills: Object.values(c.skills || {}).filter(x => x && x.name).map(x => x.name).join(' / '), skillWarn: c.skillGenerationWarning || '', weapon: c.weapon && c.weapon.name, look: String(c.naiPrompt || '').slice(0, 140) }));
  R.dist = { rarity: cnt(chars, c => RL[c.rarity]), role: cnt(chars, c => c.role), elem: cnt(chars, c => c.elem), faction: cnt(chars, c => c.faction) };
  R.chapters = G.chapters.map(ch => ({ kind: ch.kind, title: ch.title, logline: ch.logline, stages: (ch.stages || []).map(s => ({ title: s.title, mode: s.mode || (s.story || !(s.enemies || []).length ? 'story' : 'battle'), enemies: (s.enemies || []).map(e => `${e.name}(${e.elem}${e.boss ? ',보스' : ''}) ${e.hp}/${e.atk}/${e.def}`), field: s.field ? (s.field.name || '') : '', pre: String(s.pre || '').split('\n').filter(l => l.trim()).length, post: String(s.post || '').split('\n').filter(l => l.trim()).length })) }));
  R.banners = G.banners.map(b => ({ name: b.name, type: b.type, active: b.active, pickup: (b.pickup || []).map(id => (charById(id) || {}).name || '없는 대원 ' + id), rate: b.rate }));
  R.lib = cnt(G.lib, l => l.kind); R.threads = G.threads.map(t => ({ title: t.title, char: (charById(t.charId) || {}).name || '?', lines: String(t.script || '').split('\n').filter(Boolean).length })); R.npcs = npcs.map(n => n.name);
  // ② 기본값 섞임·정합성
  const DW = DEFAULT_WORLD, DM = DEFAULT_META;
  if (G.world.plot && G.world.plot === DW.plot) F('상', '기본값 섞임', '세계관 플롯이 기본(샘플) 플롯 그대로');
  if (G.world.lore && G.world.lore === DW.lore) F('상', '기본값 섞임', '세계관 설정이 기본(샘플) 설정 그대로');
  const dFac = (DW.factions || []).map(f => f.name), leak = (G.world.factions || []).filter(f => dFac.includes(f.name)).map(f => f.name); if (leak.length) F('상', '기본값 섞임', '기본(샘플) 세력이 섞임: ' + leak.join(', '));
  const dFarm = (DM.farms || []).map(f => f.name), fl = (G.meta.farms || []).filter(f => dFarm.includes(f.name)).map(f => f.name); if (fl.length) F('중', '기본값 섞임', '재료 던전 이름이 기본값 그대로: ' + fl.join(', '));
  const sameTerms = Object.keys(DM.terms).filter(k => G.meta.terms[k] === DM.terms[k] && !['player', 'abyss'].includes(k)); if (sameTerms.length > 4) F('하', '기본값 섞임', `용어 ${sameTerms.length}개가 기본값 그대로: ${sameTerms.slice(0, 8).map(k => `${k}=${DM.terms[k]}`).join(', ')}`);
  if (JSON.stringify(G.meta.shop || {}) === JSON.stringify(DM.shop || {})) F('하', '기본값 섞임', `상점 NPC·대사가 기본값 그대로(「${(DM.shop || {}).name}」)`);
  const res = ['res1', 'res2', 'res3', 'res4'].filter(k => G.meta.terms[k] === DM.terms[k]); if (res.length === 4) F('하', '기본값 섞임', `영입 자원 이름이 기본값 그대로: ${res.map(k => DM.terms[k]).join('/')}`);
  { const rt = String(RULES), pairs = [...rt.matchAll(/([^\s,(]+?)[은는] ([^\s,]+?)에 강함/g)].map(m => [m[1], m[2]]), wrong = pairs.filter(([a, b]) => elems.has(a) && BEATS[a] !== b);
    R.rulesElemText = pairs.map(p => p.join('>')).join(', '); if (wrong.length) F('중', '생성 프롬프트', `공통 규칙(RULES)의 속성 상성 설명이 실제와 다름: ${wrong.map(([a, b]) => `${a}>${b}(실제 ${a}>${BEATS[a]})`).join(', ')} — 모든 생성 요청에 틀린 상성이 들어감`); }
  R.sampleNames = [...new Set([...(DW.factions || []).map(f => f.name), ...(typeof DEFAULT_LIB !== 'undefined' ? DEFAULT_LIB : []).filter(l => ['bg', 'prop'].includes(l.kind)).map(l => l.name), ...(typeof DEFAULT_CHARS !== 'undefined' ? DEFAULT_CHARS : []).map(c => c.name)])].filter(n => n && n.length >= 3);
  const names = chars.map(c => c.name), dup = names.filter((n, i) => names.indexOf(n) !== i); if (dup.length) F('상', '대원', '이름 중복: ' + [...new Set(dup)].join(', '));
  if (input.n && chars.length < Math.ceil(input.n * 0.8)) F('중', '대원', `요청 ${input.n}명인데 ${chars.length}명`);
  const ssr = chars.filter(c => c.rarity === 3).length; if (input.n && (ssr < 1 || ssr > Math.max(3, Math.ceil(input.n / 2)))) F('중', '대원', `SSR ${ssr}명(요청: SSR 2~3명)`);
  const facNames = new Set((G.world.factions || []).map(f => f.name)); chars.filter(c => c.faction && !facNames.has(c.faction)).forEach(c => F('중', '세력', `${c.name}의 세력 「${c.faction}」이 세계관 세력 목록에 없음`));
  (G.world.factions || []).filter(f => !f.desc && f.kind === 'playable').forEach(f => F('하', '세력', `세력 「${f.name}」 설명 없음(대원 소속에서 자동으로 생긴 세력일 수 있음)`));
  const defNames = Object.values(GGMCombat.generationDefaults({ role: 'atk' }) || {}).filter(x => x && x.name).map(x => x.name);
  chars.forEach(c => { const sk = Object.values(c.skills || {}).filter(x => x && x.name).map(x => x.name); if (c.skillPending) F('하', '스킬', `${c.name}: 인라인 스킬이 검증에 걸려 게임을 연 뒤 스킬을 설계함(skillPending)`); else if (c.skillGenerationWarning) F('상', '스킬', `${c.name}: 스킬이 임시 상태로 저장됨 — "${c.skillGenerationWarning.slice(0, 40)}"`); else if (sk.length && sk.every(n => defNames.includes(n) || /^(스킬|수호|응급 지원|전술 공격|전투 태세)$/.test(n))) F('중', '스킬', `${c.name}: 기본 스킬(${sk.join('/')})`); });
  G.chapters.forEach(ch => (ch.stages || []).forEach((s, i) => (s.enemies || []).forEach(e => { if (e.elem && !elems.has(e.elem)) F('중', '적', `${ch.title} ${i + 1}: 적 「${e.name}」 속성 「${e.elem}」이 이 게임 속성 목록에 없음`); })));
  G.banners.filter(b => b.type === 'pickup' && b.active).forEach(b => (b.pickup || []).forEach(id => { const c = charById(id); if (!c) F('중', '배너', `「${b.name}」 픽업 대상이 없는 대원`); else if (typeof castOk === 'function' && !castOk(c)) F('중', '배너', `「${b.name}」 픽업 대상 ${c.name}이(가) 아직 만나지 않은 대원(뽑을 수 없음)`); }));
  [3, 2, 1].forEach(r => { const n = chars.filter(c => c.rarity === r && !c.debutLater).length; if (n === 1) F('중', '뽑기', `${RL[r]} 대원이 1명뿐 — 그 등급 확률(${({ 3: 'SSR', 2: 'SR', 1: 'R' })[r]})이 모두 한 사람에게 몰려 중복이 쏟아짐`); });
  // ③ 앱 자체 점검
  const a = auditScan(); R.audit = { total: a.reduce((s, x) => s + x.items.length, 0), rules: a.map(x => `${x.rule.id}(${x.rule.kind}) ${x.rule.label}: ${x.items.length}`) };
  const pr = chars.map(c => { const r = personaReview(c); return { n: c.name, score: r.score, issues: L(r).map(i => i.msg) }; }); R.persona = { avg: Math.round(pr.reduce((s, x) => s + (x.score || 0), 0) / Math.max(1, pr.length)), detail: pr };
  R.plan = L(planCheck()).map(x => x.msg || x); const fr = factionReview(); R.faction = { score: fr.score, issues: L(fr).map(x => x.msg) };
  R.balance = balReport().map(b => ({ n: b.c.name, dev: b.dev })); R.imgPerson = imgAuditScan().map(x => `${x.kind}:${x.name} -${x.removed.join(',')}`);
  if (R.imgPerson.length) F('하', '그림 프롬프트', `배경·소품 프롬프트에 인물 태그 ${R.imgPerson.length}건(그릴 때 가드가 제거)`);
  // ④ 대본 QA
  const known = new Set([...names, ...npcs.map(n => n.name)]), bgs = new Set(G.lib.filter(l => l.kind === 'bg').map(l => l.name)), bgms = new Set(G.lib.filter(l => l.kind === 'bgm').map(l => l.name));
  const order = main.flatMap(ch => (ch.stages || []).map(s => s.id)), scripts = [['프롤로그', G.opening && G.opening.prologue, null]];
  G.chapters.forEach(ch => (ch.stages || []).forEach((s, si) => { scripts.push([`${ch.title} ${si + 1} 전`, s.pre, s]); scripts.push([`${ch.title} ${si + 1} 후`, s.post, s]); }));
  G.threads.forEach(t => scripts.push([`톡 「${t.title}」`, t.script, null]));
  const qa = { sayLines: 0, choices: 0, branches: 0, unknownSpeakers: {}, missingBg: {}, missingBgm: {}, faces: {}, commands: {}, longLines: 0, english: [], parseErrors: [], debutViolations: [] };
  for (const [where, text, st] of scripts) { if (!text) continue; let ls; try { ls = parseScript(text); } catch (e) { qa.parseErrors.push(where + ': ' + e.message); continue; }
    for (const l of ls) {
      if (l.type === 'say') { qa.sayLines++; const who = l.who; if (who && !known.has(who) && !isMe(who) && !/^(나레이션|내레이션|해설|\?\?\?|모두|일동|목소리|방송|아나운서|사회자|관객|모두들)$/.test(who)) qa.unknownSpeakers[who] = (qa.unknownSpeakers[who] || 0) + 1;
        if (l.face) qa.faces[l.face] = (qa.faces[l.face] || 0) + 1; const tx = String(l.text || ''); if (tx.length > 140) qa.longLines++; if (/[A-Za-z]{6,}/.test(tx) && qa.english.length < 10) qa.english.push(`${where}: ${tx.slice(0, 60)}`);
        if (st && who) { const c = chars.find(x => x.name === who); if (c && c.debut && order.includes(st.id) && order.indexOf(c.debut) > order.indexOf(st.id)) qa.debutViolations.push(`${who} — ${where}(첫 등장 예정: ${order.indexOf(c.debut) + 1}번째 스테이지)`); if (c && c.debutLater && order.includes(st.id)) qa.debutViolations.push(`${who} — ${where}(나중 등장 예정인데 등장)`); } }
      else if (l.type === 'choice') qa.choices++;
      else if (l.type === 'place') { const v = String(l.text || '').trim(); qa.places = (qa.places || 0) + 1; if (v && !bgs.has(v)) qa.missingBg[v] = (qa.missingBg[v] || 0) + 1; }
      else if (l.type === 'cmd') { const v = String(l.arg || '').trim(); qa.commands[l.cmd] = (qa.commands[l.cmd] || 0) + 1; if (l.cmd === '분기') qa.branches++; if (l.cmd === '배경' && v && !bgs.has(v)) qa.missingBg[v] = (qa.missingBg[v] || 0) + 1; if (l.cmd === '음악' && v && !bgms.has(v) && !/^(끄기|정지|없음|off|stop)$/i.test(v)) qa.missingBgm[v] = (qa.missingBgm[v] || 0) + 1; } } }
  R.scriptQA = qa;
  if (qa.parseErrors.length) F('상', '대본', `대본 읽기 오류 ${qa.parseErrors.length}건`);
  Object.entries(qa.unknownSpeakers).forEach(([w, n]) => F('중', '대본', `등록되지 않은 화자 「${w}」 ${n}줄(초상·표정·톡이 연결되지 않음)`));
  qa.debutViolations.slice(0, 6).forEach(v => F('중', '등장 계획', v));
  Object.entries(qa.missingBg).forEach(([w, n]) => F('중', '대본', `배경 목록에 없는 장소·배경 「${w}」 ${n}회(그림이 연결되지 않음)`)); Object.entries(qa.missingBgm).forEach(([w, n]) => F('하', '대본', `없는 음악 「${w}」 ${n}회`));
  if (qa.english.length) F('하', '대본', `대사에 영어 단어 ${qa.english.length}건`);
  const ch1 = main[0]; if (ch1) (ch1.stages || []).forEach((s, i) => { const pre = String(s.pre || '').split('\n').filter(l => l.trim()).length, post = String(s.post || '').split('\n').filter(l => l.trim()).length; if (pre < 15 || pre > 25 || post < 8 || post > 15) F('하', '분량', `1장 ${i + 1}: 전 ${pre}줄·후 ${post}줄(지시: 전 15~25·후 8~15)`); });
  { const texts = []; for (const t of ['lobby', 'ops', 'contract', 'crew']) { tab = t; render(); texts.push(document.getElementById('view').innerText); } const ui = texts.join('\n'), bad = new Set();
    const jong = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? c % 28 : -1; };
    Object.values(G.meta.terms || {}).filter(v => typeof v === 'string' && v.trim()).forEach(v => { const j = jong(v); if (j > 0 && j !== 8 && new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '로(?![가-힣])').test(ui)) bad.add(`${v}로`); if (j === 0 && new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '으로').test(ui)) bad.add(`${v}으로`); });
    const both = (ui.match(/[가-힣]+(을\(를\)|이\(가\)|은\(는\)|과\(와\))/g) || []).slice(0, 4); R.uiText = ui.replace(/\s+/g, ' ').slice(0, 600);
    if (bad.size) F('하', '화면 문장', `생성된 용어에 맞지 않는 조사: ${[...bad].join(', ')}`); if (both.length) F('하', '화면 문장', `조사를 고르지 못한 표기: ${both.join(', ')}`); }
  // ⑥ 건조(자원 투입식 영입)·원정 — 생성기가 설정했는지, 사용자가 켜면 생성된 대원으로 어떤 테이블이 되는지
  { const C = { on: !!(G.meta.construct && G.meta.construct.on), configured: !!G.meta.construct, expedition: (G.meta.expedition && G.meta.expedition.mode) || '(기본 combat)', resTerms: ['res1', 'res2', 'res3', 'res4'].map(k => G.meta.terms[k]) };
    if (!C.configured) F('중', '건조·원정', `생성기가 건조(자원 투입식 영입)를 설정하지 않음 — 꺼진 채 시작, 자원 이름 ${C.resTerms.join('/')}(기본값)${/아이돌|방송|기획사|스트리머|가게|카페/.test(JSON.stringify(G.world).slice(0, 4000)) && C.expedition.includes('combat') ? `, 원정은 전투형(${C.expedition}) — 세계관과 맞는 원정 방식(방송·스트리머·경영)이 있는데 고르지 않음` : ''}`);
    const D = (G.dispatches || []).map(d => ({ name: d.name, hours: d.hours, need: d.need, reward: d.reward, val: (d.reward.gold || 0) + (d.reward.exp || 0) * 300 + (d.reward.wmat || 0) * 600 + (d.reward.core || 0) * 2500 }));
    C.dispatches = D.map(d => `${d.name} ${d.hours}h·${d.need}명 → ${JSON.stringify(d.reward)}`);
    if (D.length > 1) { const byH = [...D].sort((a, b) => a.hours * a.need - b.hours * b.need), lo = byH[0], hi = byH.at(-1); if (lo.val > hi.val) F('중', '건조·원정', `파견 보상이 시간·인원과 거꾸로: 「${lo.name}」(${lo.hours}시간·${lo.need}명) 보상 > 「${hi.name}」(${hi.hours}시간·${hi.need}명) — 보상이 순서대로 고정 표에서 붙음`); }
    const keep = G.meta.construct; G.meta.construct = Object.assign({ on: true }, keep || {}); try { conMeta(); const cfg = CON(), pool = conPool(), inputs = { '최소 30×4': [30, 30, 30, 30], '균등 300×4': [300, 300, 300, 300], '공격 쏠림 100/600/100/100': [100, 600, 100, 100], '균등 500×4': [500, 500, 500, 500], '최대 999×4': [999, 999, 999, 999] };
      C.groups = (cfg.groups || []).map(g => `${g.name}(${JSON.stringify(g.match)})`); C.start = cfg.start; C.buy = cfg.buy; const seen = new Set();
      C.tables = Object.entries(inputs).map(([k, t]) => { const r = GGMConstruct.rates(t, cfg), tb = GGMConstruct.table(t, cfg, pool); tb.rows.filter(x => x.p > 0).forEach(x => seen.add(x.id));
        return { input: k, open: r.groups.filter(g => g.open).map(g => `${g.name} ${g.p.toFixed(0)}%`).join(' · '), rarity: `R ${(r.rarity[1] || 0).toFixed(0)} / SR ${(r.rarity[2] || 0).toFixed(0)} / SSR ${(r.rarity[3] || 0).toFixed(1)}`, rows: tb.rows.filter(x => x.p > 0).sort((a, b) => b.p - a.p).slice(0, 6).map(x => `${(charById(x.id) || {}).name} ${x.p.toFixed(1)}%`).join(', ') }; });
      C.poolSize = pool.length; C.never = pool.filter(c => !seen.has(c.id)).map(c => (charById(c.id) || {}).name);
      if (C.never.length) F('중', '건조·원정', `어떤 투입으로도 건조되지 않는 대원: ${C.never.join(', ')}`);
      const byRole = cnt(pool, c => c.role); Object.entries(byRole).filter(([, n]) => n === 1).forEach(([r]) => F('하', '건조·원정', `건조 분류 「${(ROLE && ROLE[r]) || r}」 후보가 1명 — 그 분류를 열면 같은 대원만 나옴`));
      const inc = (G.dispatches || []).map(d => conDispReward(d.hours, d.need)), perH = (G.dispatches || []).map((d, i) => Object.values(inc[i]).reduce((a, v) => a + v, 0) / d.hours);
      C.expIncome = (G.dispatches || []).map((d, i) => `${d.name} ${Object.values(inc[i]).reduce((a, v) => a + v, 0)}(시간당 ${Math.round(perH[i])})`);
    } catch (e) { C.err = e.message; } finally { G.meta.construct = keep; }
    R.construct = C; }
  // ⑤ 플레이
  const realRandom = Math.random; Math.random = rnd;
  P().owned = {}; P().squad = []; P().gems = Math.max(P().gems, 3000); P().firstTen = true; P().pity = 0; P().cleared = {};
  const b0 = curBanner(); let pulled = [];
  try { await pull(10); await new Promise(r => setTimeout(r, 300)); ((GC && GC.timers) || []).forEach(clearTimeout); /* 건너뛰기와 같이 연출 타이머를 지우고 닫음 */ closeOv(); pulled = (P().history || []).slice(0, 10).map(id => { const c = charById(id); return c ? `${RL[c.rarity]} ${c.name}` : id; }); } catch (e) { pulled = ['오류: ' + e.message]; }
  R.firstPull = { banner: b0 && b0.name, results: pulled, owned: Object.keys(P().owned).map(id => charById(id)?.name), squad: P().squad.map(id => charById(id)?.name) };
  if (R.firstPull.owned.length < 4) F('중', '플레이', `첫 10연 뒤 서로 다른 대원 ${R.firstPull.owned.length}명 — 편성 ${Math.min(4, R.firstPull.owned.length)}명으로 시작`);
  const squad = P().squad.map(charById).filter(Boolean); squad.forEach(c => { try { v2Ensure(c); } catch (e) { F('상', '플레이', `${c.name}: 전투 스킬 준비(v2Ensure) 오류 — ${e.message}`); } });
  const sim = (s, lv, seeds) => { const res = []; for (const sd of seeds) { squad.forEach(c => { own(c.id).lv = lv; }); const fb = factionBonus(squad.map(c => c.id));
      const allies = squad.map((c, i) => { const st = stats(c), o = own(c.id) || { wlv: 0 }; try { v2EnsureEquipment(c); } catch (e) { F('상', '플레이', `${c.name}: 장비 준비(v2EnsureEquipment) 오류 — ${e.message}`); } return { side: 'a', slot: i, c, name: c.name, range: charRange(c), elem: c.elem, role: c.role, maxhp: st.hp, hp: st.hp, atk: Math.round(st.atk * (1 + (fb[c.faction] || 0) / 100)), def: st.def, spd: st.spd, g: rnd() * 600, sh: 0, mul: 1, skillTraining: GGMCombat.trainingState(o.skillTraining), wlv: o.wlv || 0 }; });
      const enemies = (s.enemies || []).map(e => ({ side: 'e', name: e.name, elem: e.elem, role: e.role, boss: e.boss, maxhp: e.hp, hp: e.hp, baseHp: e.hp, atk: e.atk, def: e.def, spd: e.spd, g: rnd() * 400, turns: 0, sh: 0, mul: 1, pattern: e.pattern, skills: e.skills }));
      try { fieldApply(s, allies, enemies); res.push(GGMCombat.run(allies, enemies, { ...v2Options(), seed: sd, maxTime: fieldTime(s) || 119 })); } catch (e) { res.push({ err: e.message }); } }
    const ok = res.filter(r => !r.err); return { win: ok.length ? Math.round(100 * ok.filter(r => r.win).length / ok.length) : null, time: ok.length ? Math.round(ok.reduce((x, r) => x + r.time, 0) / ok.length) : null, err: res.find(r => r.err)?.err }; };
  const seeds = Array.from({ length: 20 }, (_, i) => 1000 + i);
  R.battles = squad.length ? main.map(ch => ({ chapter: ch.title, stages: (ch.stages || []).map((s, i) => { const mode = s.mode || (s.story || !(s.enemies || []).length ? 'story' : 'battle'); if (mode !== 'battle') return { n: i + 1, title: s.title, mode };
    return { n: i + 1, title: s.title, mode, boss: (s.enemies || []).some(e => e.boss), lv1: sim(s, 1, seeds), lv10: sim(s, 10, seeds), lv20: sim(s, 20, seeds) }; }) })) : [];
  Math.random = realRandom; squad.forEach(c => { own(c.id).lv = 1; });
  // ⑦ 바리에이션(이격): 템플릿·조건·레시피, 건조로 이격 만들기, 상속(기본 캐릭터 수정이 이격에 반영되는지) — 첫 10연 보유 대원 기준
  { const V = { templates: [], made: [] }; const keep = G.meta.construct; G.meta.construct = Object.assign({ on: true }, keep || {}); const keepSample = SAMPLE; SAMPLE = null;
    try { const tpls = VARIANTS(), cfg = CON(), start = cfg.start, owned = Object.keys(P().owned).map(charById).filter(c => c && !c.alt);
      V.templates = tpls.map(t => { const bases = conTargets(t), need = (t.recipe && t.recipe.min) || []; return { name: t.name, prompt: t.prompt, chance: t.chance, recipe: need.join('/'), cond: JSON.stringify(t.cond || {}), eligible: bases.map(b => b.name), affordable: need.length ? Math.floor(Math.min(...need.map(x => (+start || 0) / Math.max(1, x)))) : 0 }; });
      const generic = tpls.filter(t => /^v_(swim|school|armor|stage[123])$/.test(t.id) && !t.cond || JSON.stringify(t.cond || {}) === '{}').length;
      if (tpls.length && tpls.every(t => /^v_(swim|school|armor|stage[123])$/.test(t.id))) F('중', '바리에이션', `바리에이션 템플릿이 모든 게임 공통 기본값 ${tpls.length}종(${tpls.map(t => t.name).join('·')}) — 생성기가 세계관에 맞게 만들지 않음`);
      if (generic === tpls.length && tpls.length) F('하', '바리에이션', '모든 템플릿의 조건이 비어 있어 보유 대원 누구나 대상(속성·포지션·능력치·업적 조건 없음)');
      const b = owned[0], t0 = tpls[0];
      if (b && t0) { const v = await conMakeVariant(b, t0), base0 = String(v.profile || '');
        const tagOk = String(v.naiPrompt || '').includes(String(t0.prompt || '').split(',')[0].trim());
        b.profile = String(b.profile || '') + ' [QA 상속 확인]'; mark('c:' + b.id); await new Promise(r => setTimeout(r, 200));
        const v2 = G.chars.find(x => x.id === v.id), inherited = String(v2 && v2.profile || '').includes('[QA 상속 확인]') || (typeof inheritStore === 'function' && !JSON.stringify(inheritStore(v2, new Set(G.chars.filter(x => !x.alt).map(x => x.id)))).includes('[QA 상속 확인]'));
        V.made.push({ base: b.name, tpl: t0.name, name: v.name, rarity: RL[v.rarity], tagOk, look: String(v.naiPrompt || '').slice(0, 160), inherited });
        if (!tagOk) F('중', '바리에이션', `이격 「${v.name}」 외형 태그에 템플릿 의상(${t0.prompt})이 들어가지 않음`);
        if (!inherited) F('중', '바리에이션', `기본 캐릭터 ${b.name}의 프로필 수정이 이격 「${v.name}」에 반영되지 않음(상속)`); }
    } catch (e) { V.err = e.message; } finally { G.meta.construct = keep; SAMPLE = keepSample; }
    R.variants = V; }
  R.squadStats = squad.map(c => { const st = stats(c); return `${c.name}(${RL[c.rarity]} ${ROLE[c.role] || c.role}) 체력${st.hp} 공격${st.atk} 방어${st.def}`; });
  R.battles.forEach(ch => ch.stages.filter(s => s.lv1).forEach(s => { if (s.lv1.err) F('상', '전투', `${ch.chapter} ${s.n}: 전투 시뮬레이션 오류 ${s.lv1.err}`); else if (s.n === 1 && s.lv1.win < 50) F('상', '난이도', `${ch.chapter} 1: 첫 편성(레벨 1) 승률 ${s.lv1.win}% — 첫 전투에서 막힘`); else if (s.lv20.win === 0) F('중', '난이도', `${ch.chapter} ${s.n}: 레벨 20에서도 승률 0%`); else if (s.lv1.win === 100 && (s.boss || s.lv1.time < 15)) F('하', '난이도', `${ch.chapter} ${s.n}${s.boss ? '(보스)' : ''}: 첫 편성·레벨 1로 ${s.lv1.time}초 만에 승률 100% — 성장 없이 깸`); }));
  return R;
}, { game, input }), { tag: 'qa' }); out.pageErrors = errors; if (errors.length) out.findings.push({ sev: '상', area: '페이지 오류', msg: errors.slice(0, 3).join(' | ') }); return out; }

export function md(R, name) {
  const order = { 상: 0, 중: 1, 하: 2 }, fs = [...R.findings].sort((a, b) => order[a.sev] - order[b.sev]), t = (h, rows) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');
  return [`# QA·플레이 보고서 — ${R.meta.title} (${name})`, '', `생성: \`node tools/play/qa.mjs\` · ${new Date().toISOString().slice(0, 16)}`, '',
    `## 발견 (${fs.length}) — 상 ${fs.filter(f => f.sev === '상').length} · 중 ${fs.filter(f => f.sev === '중').length} · 하 ${fs.filter(f => f.sev === '하').length}`, '', fs.length ? t(['심각도', '영역', '내용'], fs.map(f => [f.sev, f.area, f.msg])) : '없음', '',
    '## 구성', '', `- 제목 ${R.meta.title} / ${R.meta.sub} · 테마 ${R.meta.theme} · 속성 ${R.meta.elems.join(', ')}`, `- 세계관 ${R.world.name}: ${String(R.world.summary || '').slice(0, 120)} (플롯 ${R.world.plotLen}자 · 설정 ${R.world.loreLen}자 · 시나리오 설계 ${R.world.plan ? '있음' : '없음'})`, `- 세력: ${R.world.factions.join(', ')}`,
    `- 대원 ${R.chars.length}명 · 등급 ${JSON.stringify(R.dist.rarity)} · 역할 ${JSON.stringify(R.dist.role)} · 속성 ${JSON.stringify(R.dist.elem)}`, `- NPC ${R.npcs.length} · 톡 ${R.threads.length} · 자료 ${JSON.stringify(R.lib)} · 배너 ${R.banners.map(b => `${b.name}(${b.type}${b.pickup.length ? ':' + b.pickup.join('/') : ''})`).join(', ')}`, '',
    t(['대원', '등급', '역할', '속성', '세력', '등장', '프로필', '대사', '개성 항목', '스킬', '스킬 경고'], R.chars.map(c => [c.name, c.rarity, c.role, c.elem, c.faction, c.debut, c.profileLen, c.lines, c.persona, c.skills, c.skillWarn])), '',
    t(['장', '스테이지', '양식', '적', '전장 규칙', '대본 전·후(줄)'], R.chapters.flatMap(ch => ch.stages.map((s, i) => [ch.title, `${i + 1} ${s.title}`, s.mode, s.enemies.join(', '), s.field, `${s.pre}·${s.post}`]))), '',
    '## 앱 자체 점검', '', `- 콘텐츠 점검 ${R.audit.total}건: ${R.audit.rules.join(' · ') || '없음'}`, `- 개성 검수 평균 ${R.persona.avg}점: ${R.persona.detail.map(d => `${d.n} ${d.score}`).join(', ')}`, `- 시나리오 설계: ${R.plan.join(', ') || '문제 없음'}`, `- 세력 점수 ${R.faction.score}: ${R.faction.issues.join(', ') || '문제 없음'}`, `- 배경·소품 인물 태그: ${R.imgPerson.length}건`, '',
    '## 대본', '', `- 대사 ${R.scriptQA.sayLines}줄 · 선택지 ${R.scriptQA.choices} · 분기 ${R.scriptQA.branches} · 연출 명령 ${JSON.stringify(R.scriptQA.commands)}`, `- 표정 ${Object.keys(R.scriptQA.faces).length}종: ${Object.entries(R.scriptQA.faces).map(([k, v]) => `${k}×${v}`).join(', ')}`, `- 등록 안 된 화자: ${Object.entries(R.scriptQA.unknownSpeakers).map(([k, v]) => `${k}×${v}`).join(', ') || '없음'}`, `- 첫 등장 위반: ${R.scriptQA.debutViolations.join(' / ') || '없음'}`, '',
    '## 생성 기록', '', R.folder ? `- 프롬프트 ${R.folder.prompts}개 · ${R.folder.chars}자 · 새 게임 호출 ${R.folder.calls ?? '-'}회(저장 시점 ${R.folder.commitAtCall ?? '-'}번째) · 인라인 스킬 통과 ${R.folder.inlineSkillPass ?? '-'} · 공통 규칙의 속성 상성 설명: ${R.rulesElemText || '-'}` : '- (게임 폴더 정보 없음)', R.folder && R.folder.mainSteps ? `- 기본 단계 요청 크기(자): ${R.folder.mainSteps.join(' · ')}` : '', '',
    '## 건조·원정', '', R.construct ? [`- 생성 상태: 건조 ${R.construct.configured ? (R.construct.on ? '켜짐' : '설정됨·꺼짐') : '설정 없음(꺼짐)'} · 원정 방식 ${R.construct.expedition} · 자원 이름 ${R.construct.resTerms.join('/')}`, `- 파견: ${(R.construct.dispatches || []).join(' · ')}`, `- (사용자가 켰을 때) 분류: ${(R.construct.groups || []).join(', ')} · 시작 자원 ${JSON.stringify(R.construct.start)} · 구매 ${JSON.stringify(R.construct.buy)} · 후보 ${R.construct.poolSize}명 · 건조 불가 ${(R.construct.never || []).join(', ') || '없음'}`, `- 원정 1회 건조 자원: ${(R.construct.expIncome || []).join(' · ')}`, '', t(['투입', '열린 분류', '희귀도(%)', '확률 상위'], (R.construct.tables || []).map(x => [x.input, x.open, x.rarity, x.rows]))].join('\n') : '', '',
    '## 바리에이션(이격)', '', R.variants ? [t(['템플릿', '레시피(최소 투입)', '확률', '조건', '대상(첫 10연 보유)', '시작 자원으로 가능 횟수'], (R.variants.templates || []).map(x => [x.name, x.recipe, x.chance + '%', x.cond, x.eligible.join(', ') || '없음', x.affordable])), '', ...(R.variants.made || []).map(m => `- 만들어 본 이격: ${m.base} → 「${m.name}」(${m.rarity}) · 템플릿 의상 태그 ${m.tagOk ? '들어감' : '없음'} · 기본 캐릭터 수정 반영(상속) ${m.inherited ? '됨' : '안 됨'} · 외형 \`${m.look}\``), R.variants.err ? `- 오류: ${R.variants.err}` : ''].join('\n') : '', '',
    '## 플레이', '', `- 첫 10연(${R.firstPull.banner}): ${R.firstPull.results.join(', ')}`, `- 편성: ${R.squadStats.join(' · ')}`, '',
    R.battles.length ? t(['장', '스테이지', '양식', '레벨 1 승률·시간', '레벨 10', '레벨 20'], R.battles.flatMap(ch => ch.stages.map(s => [ch.chapter, `${s.n} ${s.title}`, s.mode, s.lv1 ? `${s.lv1.win}% · ${s.lv1.time}초` : '-', s.lv10 ? `${s.lv10.win}%` : '-', s.lv20 ? `${s.lv20.win}%` : '-']))) : '편성할 대원이 없어 전투를 돌리지 못함', ''].join('\n');
}

// 게임 폴더의 prompts/·runs.json 검사(노드 쪽): 프롬프트에 원본 샘플 이름, 재요청 프롬프트에 서버 오류 문구, 인라인 스킬 통과율, 요청 크기
import { readFileSync as _rf, readdirSync as _rd, existsSync as _ex } from 'node:fs';
import { join as _j } from 'node:path';
export function folderQA(dir, R) {
  const F = (sev, area, msg) => R.findings.push({ sev, area, msg }), P = _j(dir, 'prompts'), out = { prompts: 0, chars: 0 };
  if (_ex(P)) { const files = _rd(P).filter(f => f.endsWith('.txt')); out.prompts = files.length; const hits = {}, infra = [];
    for (const f of files) { const t = _rf(_j(P, f), 'utf8'); out.chars += t.length; for (const n of R.sampleNames || []) if (t.includes(n)) (hits[n] = hits[n] || new Set()).add(f.slice(0, -4));
      if (/요청을 제한|연결에 실패|대기 시간이 90초|pending response|서비스 오류/.test(t) && /-\d+$/.test(f.slice(0, -4)) && !/-1$/.test(f.slice(0, -4))) infra.push(f.slice(0, -4)); }
    const hn = Object.keys(hits); out.sampleInPrompts = Object.fromEntries(hn.map(n => [n, [...hits[n]]]));
    if (hn.length) F('상', '생성 프롬프트', `프롬프트에 원본 샘플 이름 ${hn.length}개(${hn.slice(0, 6).join(', ')}…)가 들어감 — ${[...new Set(hn.flatMap(n => [...hits[n]]))].slice(0, 4).join(', ')}`);
    if (infra.length) F('중', '생성 프롬프트', `서버·네트워크 오류 문구가 "직전 실패를 수정하라"는 재요청 프롬프트에 들어감: ${infra.slice(0, 4).join(', ')}`); }
  const RJ = _j(dir, 'runs.json'); if (_ex(RJ)) { const runs = JSON.parse(_rf(RJ, 'utf8')), nw = runs.filter(r => r.phase === 'new'), last = nw.at(-1);
    if (last) { const skillNames = new Set(nw.flatMap(r => r.log).filter(x => /^skill-/.test(x.kind)).map(x => x.kind.replace(/^skill-(.+)-\d+$/, '$1'))) /* 새 게임 단계의 어느 실행에서든 스킬 설계 요청이 나간 대원 = 인라인 스킬이 검증에 걸린 대원 */, total = (R.chars || []).length;
      out.inlineSkillPass = `${total - skillNames.size}/${total}`; out.commitAtCall = last.commitAtCall; out.calls = last.log.length; out.mainSteps = last.log.filter(x => !/^skill-/.test(x.kind)).map(x => `${x.kind}:${x.len}`);
      if (skillNames.size) F(skillNames.size === total ? '중' : '하', '생성', `대원 생성 단계에서 쓴 인라인 스킬 중 ${skillNames.size}/${total}명이 앱 검증에 걸려 따로 스킬 설계 요청(${[...skillNames].slice(0, 6).join(', ')})`); } }
  R.folder = out; return R;
}
