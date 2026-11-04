#!/usr/bin/env node
// 플레이 연계 검증(동적): 빌드한 index.html(www/)에 생성된 게임(tools/play/games의 저장 게임 — PC 서버 data)을 새 플레이어로 불러
//   앱의 실제 함수로 차례로 플레이하면서, 한 기능의 결과가 다른 기능에 이어지는지 확인해요(연계). 글·그림 AI는 쓰지 않음(막음).
//   ① 가챠 → 보유·배너 후보(세력 배너는 그 세력만)·등장 계획(아직 첫 등장 전인 대원은 안 나옴)
//   ② 장 진행(메인 1·2장, 스테이지 양식대로: 전투는 앱의 전투 끝 판정 bCheck, 회담·콘테스트는 modeClear, 대화만은 대본 재생 끝) →
//      클리어 기록 · 첫 등장 스테이지를 깨면 그 대원이 등장 가능(castOk) · 장 끝 영입(recruits) · 메신저 배달(checkTriggers) · 진행 장(mainNow)
//   ③ 진행 장 → 세력 태도(stanceAt — 장마다 바뀌는 태도)와 AI 컨텍스트(ctx)가 지금 장의 태도를 씀 · 관계(rels)가 AI 컨텍스트에 들어감
//   ④ 파견 → 보낸 대원은 일하는 중(busyIds)이라 전투 편성에서 빠짐 · 시간이 지나면 보상(건조가 켜져 있으면 건조 자원)
//   ⑤ 원정(전투가 아닌 방식) → 일하는 대원은 busyIds에 들어감 · 끝나면 인기·보상
//   ⑥ 건조 → 자원을 쓰고 대원·바리에이션(이격)을 얻음 · 이격은 기본 대원을 상속(기본 대원을 고치면 이격에도 반영)
//   node tools/play/link.mjs [--saved] [게임 폴더…]   → tools/play/reports/link.md · link.json (하나라도 실패면 종료 코드 1)
//   기본: 게임 폴더의 입력·기록된 응답으로 지금 빌드에서 새 게임을 생성(tools/out/link/<이름> — PC 서버 배치)한 뒤 그 게임을 플레이. --saved: 저장된 게임(pc/data)으로
//   게임 설정에서 꺼진 기능(건조·전투가 아닌 원정)은 「상황: 켬」으로 켜고 확인(근거에 표시)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPage, PC_DIR, ROOT } from './lib/page.mjs';
import { runGenerate } from './lib/generate.mjs';
import { readGame, gidOf } from './lib/data.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), SAVED = argv.includes('--saved'), args = argv.filter(a => !a.startsWith('--'));
const dirs = (args.length ? args.map(d => resolve(d)) : readdirSync(join(HERE, 'games')).map(d => join(HERE, 'games', d))).filter(d => SAVED ? gidOf(d) : existsSync(join(d, 'input.json')) && existsSync(join(d, 'responses')));
const results = [];
for (const dir of dirs) {
  // 게임: 기본은 지금 빌드(www/index.html)로 새로 생성(기록된 글 AI 응답을 넣어 앱의 생성 경로 그대로 — PC 서버 data에 저장), --saved면 이미 저장된 게임
  let g, gen = null;
  if (SAVED) g = readGame(PC_DIR, gidOf(dir));
  else { const home = join(ROOT, 'tools/out/link', basename(dir)), input = JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')), responses = {};
    for (const f of readdirSync(join(dir, 'responses'))) if (f.endsWith('.txt')) responses[f.slice(0, -4)] = readFileSync(join(dir, 'responses', f), 'utf8');
    rmSync(home, { recursive: true, force: true }); const { out: r, errors } = await runGenerate({ phase: 'new', input, responses, tag: 'link-gen-' + basename(dir), pcHome: home });
    gen = { calls: r.log.length, pending: r.pending, saved: !!(r.saved && r.saved.ok), errors: errors.slice(0, 5), thrown: r.thrown || '' };
    if (!gen.saved) { results.push({ game: basename(dir), title: '(생성 실패)', gen, checks: [{ area: '생성', link: '지금 빌드로 새 게임 생성·저장', res: '실패', why: JSON.stringify(gen).slice(0, 300) }], pageErrors: errors }); console.log(`${basename(dir)}: 생성 실패`); continue; }
    g = readGame(home, r.saved.gid); }
  const { out, errors } = await withPage(page => page.evaluate(async game => {
    const R = [], ok = (area, link, pass, why) => R.push({ area, link, res: pass === null ? '건너뜀' : pass ? '통과' : '실패', why: String(why || '').slice(0, 300) });
    const step = async (area, fn) => { try { await fn(); } catch (e) { R.push({ area, link: '(실행)', res: '실패', why: String(e && (e.stack || e.message) || e).split('\n').slice(0, 3).join(' ← ').slice(0, 300) }); } };
    const g = JSON.parse(game); delete g.prog; G = fix(g); applyMeta(); const p = P(); p.seenOpening = true; SAMPLE = null; const toasts = []; toast = m => { toasts.push(String(m)); }; appConfirm = async () => true; closeModal(); closeOv(); // 연출(playGacha는 const)은 그대로 — 결과 화면은 닫음
    const names = ids => ids.map(id => (charById(id) || {}).name || id).join(', ');
    // ① 가챠
    await step('가챠', async () => { p.gems = 999999; const bn = (G.banners || []).find(b => b.active && b.type === 'std') || (G.banners || [])[0]; if (!bn) return ok('가챠', '배너', null, '배너 없음'); p.curBanner = bn.id;
      const before = new Set(Object.keys(p.owned)), locked = G.chars.filter(c => !castOk(c)).map(c => c.id); await pull(10); { const sk = document.querySelector('.gc .skipb'); if (sk) await handleNavigationAndToolsAction('gcskip', sk, '', p, { target: sk }); } closeOv(); closeModal(); /* 앱의 건너뛰기로 연출 타이머를 끝냄 */ const got = Object.keys(p.owned).filter(id => !before.has(id)), pool = new Set(bannerPool(bn).map(c => c.id));
      ok('가챠', '10연 → 보유 대원', got.length > 0, `새 보유 ${got.length}명: ${names(got)}`);
      ok('가챠', '뽑힌 대원은 배너 후보 안', got.every(id => pool.has(id)), got.filter(id => !pool.has(id)).length ? '후보 밖: ' + names(got.filter(id => !pool.has(id))) : `후보 ${pool.size}명`);
      ok('가챠 ↔ 등장 계획', '첫 등장 전 대원은 안 나옴', locked.length ? !got.some(id => locked.includes(id)) : null, locked.length ? `잠긴 대원 ${locked.length}명(${names(locked).slice(0, 80)})` : '잠긴 대원 없음');
      const fb = (G.banners || []).find(b => b.pool && b.pool.mode === 'faction'); if (fb) { const fp = bannerPool(fb); const own2 = fp.filter(c => (fb.pool.factions || []).includes(c.faction)), have = new Set(own2.map(c => c.rarity)), off = fp.filter(c => !(fb.pool.factions || []).includes(c.faction) && !(fb.pickup || []).includes(c.id)), bad = off.filter(c => have.has(c.rarity)); /* bannerPool: 그 세력에 없는 등급은 상시 대원으로 채움(설계) */
      ok('가챠 ↔ 세력', '세력 배너 후보는 그 세력만(픽업·없는 등급 채움 제외)', !bad.length, `${(fb.pool.factions || []).join(',')}: 후보 ${fp.length}명${off.length ? ' · 다른 소속 ' + off.map(c => `${c.name}(${c.faction || '무소속'}·${['', 'R', 'SR', 'SSR'][c.rarity]}${have.has(c.rarity) ? '' : ' — 세력에 이 등급 없어 채움'})`).join(', ') : ''}`); } else ok('가챠 ↔ 세력', '세력 배너', null, '세력 배너 없음'); });
    // ② 장 진행
    const main = G.chapters.filter(ch => (ch.kind || 'main') === 'main'), stanceLog = [];
    await step('장 진행', async () => { const realPlay = playStory; playStory = (t, sc, done) => { if (done) done(); };
      for (const ch of main.slice(0, 2)) { for (const s of ch.stages || []) {
        const debutOf = G.chars.filter(c => c.debut === s.id).map(c => c.id), inbox0 = (p.inbox || []).length, owned0 = Object.keys(p.owned).length, last = ch.stages.at(-1) === s;
        if (s.mode === 'debate' || s.mode === 'contest') modeClear(ch, s, 3);
        else if (s.story || !(s.enemies || []).length) playStoryStage(ch, s);
        else { if (!p.squad.filter(id => own(id)).length) Object.keys(p.owned).slice(0, 4).forEach(id => { if (!p.squad.includes(id)) p.squad.push(id); });
          await startStage(s, { kind: 'main', ch }); for (let i = 0; i < 50 && !(B && B.engine); i++) await new Promise(r => setTimeout(r, 50));
          if (!B) { ok('장 진행', `${ch.title} · ${s.title}: 전투 시작`, false, '전투가 시작되지 않음(편성할 대원 없음?)'); continue; }
          B.enemies.forEach(en => { en.hp = 0; }); B.presentationBusy = false; B.ending = false; bCheck(); for (let i = 0; i < 40 && !B.over; i++) await new Promise(r => setTimeout(r, 50)); closeOv(); }
        checkTriggers(true);
        ok('장 진행', `${ch.title} · ${s.title}: 클리어 기록`, !!p.cleared[s.id], s.mode || (s.story ? '대화만' : '전투'));
        if (debutOf.length) ok('장 진행 ↔ 등장 계획', `${s.title}: 첫 등장 대원이 등장 가능`, debutOf.every(id => castOk(charById(id))), names(debutOf));
        if (last && (ch.recruits || []).length) ok('장 진행 ↔ 영입', `${ch.title} 끝: 영입 대원 합류`, ch.recruits.every(id => own(id)), names(ch.recruits));
        const trig = (G.threads || []).filter(t => t.trigger && t.trigger.type === 'stage' && t.trigger.value === s.id).map(t => t.id); if (trig.length) ok('장 진행 ↔ 메신저', `${s.title}: 클리어 톡 배달`, trig.every(id => (p.inbox || []).some(x => (x.tid || x.id || x) === id) || (p.inbox || []).length > inbox0), `톡 ${trig.length}개 · 받은 편지함 ${inbox0}→${(p.inbox || []).length}`);
        void owned0; }
        stanceLog.push({ ch: main.indexOf(ch) + 1, now: mainNow() }); }
      playStory = realPlay;
      ok('장 진행', '진행 장(mainNow)이 깬 장 다음으로', main.length >= 2 ? mainNow() >= Math.min(3, main.length + 1) || mainNow() === main.findIndex(ch => ch.stages.some(s => !p.cleared[s.id])) + 1 : null, JSON.stringify(stanceLog)); });
    // ③ 세력 태도·관계 ↔ AI 컨텍스트
    await step('세력·관계', async () => { const F = factions(), n = mainNow(), changing = F.filter(f => (f.stance || []).length);
      ok('세력', '장마다 바뀌는 태도', changing.length ? true : null, changing.length ? changing.map(f => `${f.name}: ${(f.stance || []).map(x => x.ch + '장 ' + FSTANCE[x.s]).join('→')}`).join(' / ').slice(0, 200) : '장별 태도 변화 없음(생성 게임에 stance 없음)');
      const C = ctx(); for (const f of changing.slice(0, 4)) { const s = stanceAt(f, n); ok('세력 ↔ AI 컨텍스트', `${f.name}: 지금 장(${n})의 태도 「${FSTANCE[s]}」가 컨텍스트에`, C.includes(f.name) && C.includes(FSTANCE[s]), C.includes(f.name) ? '' : '컨텍스트에 세력 이름 없음'); }
      const rs = RELS().filter(r => charById(r.a) && charById(r.b)); if (!rs.length) return ok('관계 ↔ AI 컨텍스트', '인물 관계', null, '대원 사이 관계 없음'); const r0 = rs[0], txt = `${charById(r0.a).name} ${charById(r0.b).name}`, RC = relCtx(txt);
      ok('관계 ↔ AI 컨텍스트', '장면에 나오는 두 인물의 관계가 관계 컨텍스트(relCtx)에', RC.includes(r0.kind), `${txt}: ${r0.kind} · 관계 ${rs.length}개`); });
    // ④ 파견
    await step('파견', async () => { if (typeof dispList !== 'function' || !dispList().length) return ok('파견', '파견 목록', null, '파견 없음');
      const d = dispList().find(x => !p.disp[x.id]), busy0 = busyIds(), free = Object.keys(p.owned).filter(id => !busy0.has(id)); if (!d || free.length < (d.need || 1)) return ok('파견', '보낼 대원', null, `대원 ${free.length}명 · 필요 ${d && d.need}`);
      DSEL = { id: d.id, ids: free.slice(0, d.need || 1) }; await handleEconomyAction('dispgo', document.createElement('button'), d.id, p, {}); const sent = (p.disp[d.id] || {}).chars || [];
      ok('파견', '보낸 대원 기록', sent.length === (d.need || 1), `${d.name}: ${names(sent)}`);
      ok('파견 ↔ 전투 편성', '파견 중인 대원은 편성에서 빠짐', sent.every(id => busyIds().has(id)), `busyIds ${busyIds().size}명`);
      const cres0 = conOn() ? JSON.stringify(progSlot('cres')) : '', gold0 = p.gold; p.disp[d.id].start -= (p.disp[d.id].hours || d.hours) * 3600e3 + 1000; // 시간이 지난 것으로
      await handleEconomyAction('dispget', document.createElement('button'), d.id, p, {});
      ok('파견', '완료 보상', !p.disp[d.id] && (p.gold !== gold0 || JSON.stringify(CRES ? progSlot('cres') : {}) !== cres0), `골드 ${gold0}→${p.gold}`);
      ok('파견 ↔ 건조', '건조가 켜져 있으면 파견 보상에 건조 자원', conOn() ? JSON.stringify(progSlot('cres')) !== cres0 : null, conOn() ? `${cres0} → ${JSON.stringify(progSlot('cres'))}` : '건조 꺼짐');
      ok('파견', '끝나면 다시 편성 가능', sent.every(id => !busyIds().has(id)), ''); });
    // ⑤ 원정(전투가 아닌 방식)
    await step('원정', async () => { const forced = exMode() === 'combat'; if (forced) G.meta.expedition = { mode: 'idol' }; const mode = exMode(), tag = forced ? ' (상황: 원정 아이돌로 켬)' : '';
      const id = Object.keys(p.owned).find(x => !busyIds().has(x)); if (!id) return ok('원정', '대원', null, '쉬는 대원 없음');
      if (mode !== 'idol') return ok('원정', `방식 ${mode}`, null, '아이돌 방식만 자동 확인(나머지는 화면 흐름이 달라 미구현)');
      const o = exOffers(id), job = (Object.values(o).find(Array.isArray) || [])[0]; if (!job) return ok('원정', '의뢰', null, '오늘 의뢰 없음');
      exStart(id, job); const jid = exJobOf(id); ok('원정', '일 시작' + tag, !!jid, `${(charById(id) || {}).name} · ${job.name || job.id}`);
      ok('원정 ↔ 전투 편성', '일하는 대원은 편성에서 빠짐' + tag, busyIds().has(id), '');
      if (jid) { progSlot('exped').jobs[jid].start -= job.hours * 3600e3 + 1000; const fame0 = progSlot('exped').fame[id] || 0, r = exClaim(jid); ok('원정', '끝나면 결과·인기' + tag, !!r && (progSlot('exped').fame[id] || 0) >= fame0, `인기 ${fame0}→${progSlot('exped').fame[id] || 0}`); } if (forced) G.meta.expedition = { mode: 'combat' }; });
    // ⑥ 건조
    await step('건조', async () => { const forced = !conOn(); if (forced) G.meta.construct = Object.assign(conMeta(), { on: true }); /* conMeta()는 읽기(없으면 새 값) — 켤 때는 conSave처럼 G.meta.construct에 씀 */ const tag = forced ? ' (상황: 건조 켬)' : '';
      CON_RES.forEach(k => { progSlot('cres')[k] = 99999; }); const cfg = CON(), pool = conPool(), inp = GGMConstruct.normalize(conReadInput(), cfg), info = GGMConstruct.roll(inp, cfg, pool, conVariantChoices(inp)).info || {}, mem = gr => pool.filter(c => Object.entries(gr.match || {}).every(([k, v]) => c[k] === v)).length;
      ok('건조 ↔ 생성된 대원', '분류마다 나올 대원이 있음' + tag, cfg.groups.every(gr => mem(gr) > 0), cfg.groups.map(gr => `${gr.name} ${mem(gr)}명`).join(' · '));
      const tb = GGMConstruct.table(inp, cfg, pool), rar = Object.entries(info.rarity || {}).filter(([, v]) => v > 0).map(([k]) => ['', 'R', 'SR', 'SSR'][k]).join('·');
      ok('건조 ↔ 생성된 대원', '기본 투입으로 나올 대원이 있음(열린 분류·허용 희귀도 안 — 첫 건조가 빈손이 아님)' + tag, tb.rows.length > 0, `투입 ${inp.join('/')} → 열림 ${(info.groups || []).filter(gr => gr.open).map(gr => `${gr.name} ${pool.filter(c => Object.entries(gr.match || {}).every(([k, v]) => c[k] === v)).map(c => ['', 'R', 'SR', 'SSR'][c.rarity]).join('') || '없음'}`).join(', ')} · 허용 희귀도 ${rar} · 나올 대원 ${tb.rows.length}명`);
      CON_RES.forEach(k => { progSlot('cres')[k] = 0; }); /* 자원이 모자라도 멈추지 않음: 캐시 상점 ₩0 보충으로 건조(PL1) */
      const h0 = (p.hist2 || []).length, owned0 = new Set(Object.keys(p.owned)), chars0 = G.chars.length, r0 = JSON.stringify(progSlot('cres')), t0 = toasts.length; await conBuild(); for (let i = 0; i < 40 && CONJOB; i++) await new Promise(r => setTimeout(r, 50));
      const gotOwn = Object.keys(p.owned).filter(id => !owned0.has(id)), made = G.chars.slice(chars0);
      ok('건조', '자원이 0이어도 캐시 상점 ₩0 보충으로 대원을 얻음' + tag, (p.hist2 || []).length > h0, `얻음 ${(p.hist2 || []).length > h0 ? names([p.hist2[0].id]) + (p.hist2[0].n ? '(새 대원)' : '(중복)') : '없음'} · 새 캐릭터 ${made.length}${toasts.length > t0 ? ' · 알림: ' + toasts.slice(t0).join(' / ') : ''}`);
      { const B = progSlot('cbuild'), mn = [cfg.min, cfg.min, cfg.min, cfg.min], empty = !GGMConstruct.table(mn, cfg, pool).rows.length; B.input = mn; CON_RES.forEach(k => { progSlot('cres')[k] = 0; }); const h1 = (p.hist2 || []).length; await conBuild(); for (let i = 0; i < 40 && CONJOB; i++) await new Promise(r => setTimeout(r, 50));
        ok('건조', `최소 투입(${mn.join('/')}${empty ? ' — 나올 대원 없음' : ''})이어도 빈손으로 끝나지 않음(나올 수 있게 맞춘 투입으로)` + tag, (p.hist2 || []).length > h1, `${empty ? '맞춘 투입 ' + (B.input || []).join('/') : '최소 투입으로 나옴'} · 얻음 ${(p.hist2 || []).length > h1 ? names([p.hist2[0].id]) : '없음'}`); }
      { const r1 = JSON.stringify(progSlot('cres')), k = CASH_RES().find(x => x.id === 'cr_con'); if (k) await handleEconomyAction('cashpkg', { dataset: {} }, k.id, P(), {}); /* 앱의 캐시 상점 구매 액션 그대로 */ ok('캐시 상점 ↔ 건조', '자원 보급(₩0)에 건조 자원 꾸러미' + tag, !!k && JSON.stringify(progSlot('cres')) !== r1 && /자원 보급/.test(cashHTML()), k ? rewardText(k.give) : '없음'); }
      const v = G.chars.find(c => c.alt && c.base && charById(c.base)); if (!v) return ok('건조 ↔ 바리에이션', '이격 상속' + tag, null, '이격 없음(건조 결과에 이격이 안 나옴)');
      const base = charById(v.base), k = ['speech', 'profile'].find(x => !(v.inh && v.inh.own && v.inh.own.includes(x))) || 'speech', mark0 = '연계검증_' + Date.now(); base[k] = mark0; mark('c:' + base.id); inheritAll && inheritAll();
      ok('건조 ↔ 바리에이션', `기본 대원을 고치면 이격에 반영(${k})` + tag, charById(v.id)[k] === mark0, `${base.name} → ${v.name}`); });
    return R; }, JSON.stringify(g.game)), { tag: 'link-' + basename(dir) });
  if (gen) out.unshift({ area: '생성', link: '지금 빌드로 새 게임 생성·저장', res: '통과', why: `요청 ${gen.calls} · 대기(답 없음) ${gen.pending.length}${gen.errors.length ? ' · 페이지 오류 ' + gen.errors.length : ''}` });
  results.push({ game: basename(dir), title: g.title, gen, checks: out, pageErrors: errors });
  console.log(`${basename(dir)}: 통과 ${out.filter(x => x.res === '통과').length} · 실패 ${out.filter(x => x.res === '실패').length} · 건너뜀 ${out.filter(x => x.res === '건너뜀').length} · 페이지 오류 ${errors.length}`);
}
const T = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');
const md = [`# 플레이 연계 검증`, '', `생성: \`node tools/play/link.mjs\` · ${new Date().toISOString().slice(0, 16)} · 빌드된 www/index.html에 생성된 게임을 새 플레이어로 불러 앱 함수로 플레이`, '',
  ...results.flatMap(r => [`## ${r.game} — ${r.title}`, '', `통과 ${r.checks.filter(x => x.res === '통과').length} · 실패 ${r.checks.filter(x => x.res === '실패').length} · 건너뜀 ${r.checks.filter(x => x.res === '건너뜀').length}${r.pageErrors.length ? ` · 페이지 오류 ${r.pageErrors.length}: ${r.pageErrors.slice(0, 3).join(' / ')}` : ''}`, '', T(['영역', '연계', '결과', '근거'], r.checks.map(c => [c.area, c.link, c.res, c.why])), ''])].join('\n');
mkdirSync(join(HERE, 'reports'), { recursive: true }); writeFileSync(join(HERE, 'reports/link.md'), md); writeFileSync(join(HERE, 'reports/link.json'), JSON.stringify(results, null, 1));
console.log('→ tools/play/reports/link.md'); if (results.some(r => r.checks.some(c => c.res === '실패'))) process.exitCode = 1;
