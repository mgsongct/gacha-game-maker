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
  const names = chars.map(c => c.name), dup = names.filter((n, i) => names.indexOf(n) !== i); if (dup.length) F('상', '대원', '이름 중복: ' + [...new Set(dup)].join(', '));
  if (input.n && chars.length < Math.ceil(input.n * 0.8)) F('중', '대원', `요청 ${input.n}명인데 ${chars.length}명`);
  const ssr = chars.filter(c => c.rarity === 3).length; if (input.n && (ssr < 1 || ssr > Math.max(3, Math.ceil(input.n / 2)))) F('중', '대원', `SSR ${ssr}명(요청: SSR 2~3명)`);
  const facNames = new Set((G.world.factions || []).map(f => f.name)); chars.filter(c => c.faction && !facNames.has(c.faction)).forEach(c => F('중', '세력', `${c.name}의 세력 「${c.faction}」이 세계관 세력 목록에 없음`));
  (G.world.factions || []).filter(f => !f.desc && f.kind === 'playable').forEach(f => F('하', '세력', `세력 「${f.name}」 설명 없음(대원 소속에서 자동으로 생긴 세력일 수 있음)`));
  const defNames = Object.values(GGMCombat.generationDefaults({ role: 'atk' }) || {}).filter(x => x && x.name).map(x => x.name);
  chars.forEach(c => { const sk = Object.values(c.skills || {}).filter(x => x && x.name).map(x => x.name); if (c.skillGenerationWarning) F('상', '스킬', `${c.name}: 스킬이 임시 상태로 저장됨 — "${c.skillGenerationWarning.slice(0, 40)}"`); else if (sk.length && sk.every(n => defNames.includes(n) || /^(스킬|수호|응급 지원|전술 공격|전투 태세)$/.test(n))) F('중', '스킬', `${c.name}: 기본 스킬(${sk.join('/')})`); });
  G.chapters.forEach(ch => (ch.stages || []).forEach((s, i) => (s.enemies || []).forEach(e => { if (e.elem && !elems.has(e.elem)) F('중', '적', `${ch.title} ${i + 1}: 적 「${e.name}」 속성 「${e.elem}」이 이 게임 속성 목록에 없음`); })));
  G.banners.filter(b => b.type === 'pickup' && b.active).forEach(b => (b.pickup || []).forEach(id => { const c = charById(id); if (!c) F('중', '배너', `「${b.name}」 픽업 대상이 없는 대원`); else if (typeof castOk === 'function' && !castOk(c)) F('중', '배너', `「${b.name}」 픽업 대상 ${c.name}이(가) 아직 만나지 않은 대원(뽑을 수 없음)`); }));
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
      else if (l.type === 'cmd') { const v = String(l.arg || '').trim(); qa.commands[l.cmd] = (qa.commands[l.cmd] || 0) + 1; if (l.cmd === '분기') qa.branches++; if (l.cmd === '배경' && v && !bgs.has(v)) qa.missingBg[v] = (qa.missingBg[v] || 0) + 1; if (l.cmd === '음악' && v && !bgms.has(v) && !/^(끄기|정지|없음|off|stop)$/i.test(v)) qa.missingBgm[v] = (qa.missingBgm[v] || 0) + 1; } } }
  R.scriptQA = qa;
  if (qa.parseErrors.length) F('상', '대본', `대본 읽기 오류 ${qa.parseErrors.length}건`);
  Object.entries(qa.unknownSpeakers).forEach(([w, n]) => F('중', '대본', `등록되지 않은 화자 「${w}」 ${n}줄(초상·표정·톡이 연결되지 않음)`));
  qa.debutViolations.slice(0, 6).forEach(v => F('중', '등장 계획', v));
  Object.entries(qa.missingBg).forEach(([w, n]) => F('중', '대본', `없는 배경 「${w}」 ${n}회`)); Object.entries(qa.missingBgm).forEach(([w, n]) => F('하', '대본', `없는 음악 「${w}」 ${n}회`));
  if (qa.english.length) F('하', '대본', `대사에 영어 단어 ${qa.english.length}건`);
  const ch1 = main[0]; if (ch1) (ch1.stages || []).forEach((s, i) => { const pre = String(s.pre || '').split('\n').filter(l => l.trim()).length, post = String(s.post || '').split('\n').filter(l => l.trim()).length; if (pre < 15 || pre > 25 || post < 8 || post > 15) F('하', '분량', `1장 ${i + 1}: 전 ${pre}줄·후 ${post}줄(지시: 전 15~25·후 8~15)`); });
  // ⑤ 플레이
  const realRandom = Math.random; Math.random = rnd;
  P().owned = {}; P().squad = []; P().gems = Math.max(P().gems, 3000); P().firstTen = true; P().pity = 0; P().cleared = {};
  const b0 = curBanner(); let pulled = [];
  try { await pull(10); await new Promise(r => setTimeout(r, 300)); closeOv(); pulled = (P().history || []).slice(0, 10).map(id => { const c = charById(id); return c ? `${RL[c.rarity]} ${c.name}` : id; }); } catch (e) { pulled = ['오류: ' + e.message]; }
  R.firstPull = { banner: b0 && b0.name, results: pulled, owned: Object.keys(P().owned).map(id => charById(id)?.name), squad: P().squad.map(id => charById(id)?.name) };
  if (R.firstPull.owned.length < 3) F('중', '플레이', `첫 10연 뒤 보유 대원 ${R.firstPull.owned.length}명`);
  const squad = P().squad.map(charById).filter(Boolean); squad.forEach(c => { try { v2Ensure(c); } catch (e) {} });
  const sim = (s, lv, seeds) => { const res = []; for (const sd of seeds) { squad.forEach(c => { own(c.id).lv = lv; }); const fb = factionBonus(squad.map(c => c.id));
      const allies = squad.map((c, i) => { const st = stats(c), o = own(c.id) || { wlv: 0 }; try { v2EnsureEquipment(c); } catch (e) {} return { side: 'a', slot: i, c, name: c.name, range: charRange(c), elem: c.elem, role: c.role, maxhp: st.hp, hp: st.hp, atk: Math.round(st.atk * (1 + (fb[c.faction] || 0) / 100)), def: st.def, spd: st.spd, g: rnd() * 600, sh: 0, mul: 1, skillTraining: GGMCombat.trainingState(o.skillTraining), wlv: o.wlv || 0 }; });
      const enemies = (s.enemies || []).map(e => ({ side: 'e', name: e.name, elem: e.elem, role: e.role, boss: e.boss, maxhp: e.hp, hp: e.hp, baseHp: e.hp, atk: e.atk, def: e.def, spd: e.spd, g: rnd() * 400, turns: 0, sh: 0, mul: 1, pattern: e.pattern, skills: e.skills }));
      try { fieldApply(s, allies, enemies); res.push(GGMCombat.run(allies, enemies, { ...v2Options(), seed: sd, maxTime: fieldTime(s) || 119 })); } catch (e) { res.push({ err: e.message }); } }
    const ok = res.filter(r => !r.err); return { win: ok.length ? Math.round(100 * ok.filter(r => r.win).length / ok.length) : null, time: ok.length ? Math.round(ok.reduce((x, r) => x + r.time, 0) / ok.length) : null, err: res.find(r => r.err)?.err }; };
  const seeds = Array.from({ length: 20 }, (_, i) => 1000 + i);
  R.battles = squad.length ? main.map(ch => ({ chapter: ch.title, stages: (ch.stages || []).map((s, i) => { const mode = s.mode || (s.story || !(s.enemies || []).length ? 'story' : 'battle'); if (mode !== 'battle') return { n: i + 1, title: s.title, mode };
    return { n: i + 1, title: s.title, mode, lv1: sim(s, 1, seeds), lv10: sim(s, 10, seeds), lv20: sim(s, 20, seeds) }; }) })) : [];
  Math.random = realRandom; squad.forEach(c => { own(c.id).lv = 1; });
  R.squadStats = squad.map(c => { const st = stats(c); return `${c.name}(${RL[c.rarity]} ${ROLE[c.role] || c.role}) 체력${st.hp} 공격${st.atk} 방어${st.def}`; });
  R.battles.forEach(ch => ch.stages.filter(s => s.lv1).forEach(s => { if (s.lv1.err) F('상', '전투', `${ch.chapter} ${s.n}: 전투 시뮬레이션 오류 ${s.lv1.err}`); else if (s.n === 1 && s.lv1.win < 50) F('상', '난이도', `${ch.chapter} 1: 첫 편성(레벨 1) 승률 ${s.lv1.win}% — 첫 전투에서 막힘`); else if (s.lv20.win === 0) F('중', '난이도', `${ch.chapter} ${s.n}: 레벨 20에서도 승률 0%`); else if (s.lv1.win === 100 && s.lv1.time < 15) F('하', '난이도', `${ch.chapter} ${s.n}: 레벨 1에서 ${s.lv1.time}초 만에 100% — 너무 쉬움`); }));
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
    '## 플레이', '', `- 첫 10연(${R.firstPull.banner}): ${R.firstPull.results.join(', ')}`, `- 편성: ${R.squadStats.join(' · ')}`, '',
    R.battles.length ? t(['장', '스테이지', '양식', '레벨 1 승률·시간', '레벨 10', '레벨 20'], R.battles.flatMap(ch => ch.stages.map(s => [ch.chapter, `${s.n} ${s.title}`, s.mode, s.lv1 ? `${s.lv1.win}% · ${s.lv1.time}초` : '-', s.lv10 ? `${s.lv10.win}%` : '-', s.lv20 ? `${s.lv20.win}%` : '-']))) : '편성할 대원이 없어 전투를 돌리지 못함', ''].join('\n');
}
