#!/usr/bin/env node
// 프롬프트 조합 검증(정적 + 동적): 흐름(글 AI 요청 지점)마다, 상황(게임 설정·상태·새 게임 입력)마다 실제로 어떤 프롬프트가 조합되어 나가는지 보고 검사.
//   정적(tools/lib/combos.mjs): 요청 지점 · 쓰는 스튜디오 조각 · 갈래(조건에 따라 조각·글이 들고 남 — 가능한 조합 2^갈래) · 응답에서 코드가 읽는 키
//   동적: 실제 index.html(www/ 또는 --ref 빌드)을 띄워 상황마다 흐름을 실행하고(가짜 글 AI — 새 게임은 기록된 응답, 나머지는 프롬프트의 형식 견본을 그대로 답함)
//         보낸 프롬프트를 스택으로 요청 지점에 붙이고 검사: 깨짐(안 채운 자리·undefined·빈 머리말·표식·견본) · 과잉(같은 줄·조각 되풀이·충돌 지시·읽지 않는 키 요구) · 과소(형식 지시 없음·요구하지 않은 키 읽음)
//         갈래 관찰: 각 갈래의 두 쪽이 실제 프롬프트에 나왔는지 — 한 번도 안 나온 쪽은 검증 안 된 조합
//   node tools/play/combos.mjs [--ref <git>] [--quick]   → tools/play/reports/combos.md · combos.json
//   --ref: 같은 상황·흐름을 그 커밋 빌드에서도 돌려 보낸 프롬프트를 바이트 단위로 비교(프롬프트 코드를 옮기거나 고친 뒤 뜻이 같은지). 다르면 종료 코드 1
//   --quick: 기본 게임 하나·상황 기본만(자체 테스트·빠른 확인) · --www <폴더>: 지금 쪽 빌드(기본 www/) · --ref-www <폴더>: 기준을 git 대신 빌드 폴더로 · --sit <글>: 이름에 그 글이 든 상황만 · --report <이름>: 보고서 이름
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadUnits } from '../lib/source.mjs';
import { IMAGE_SINKS } from '../lib/prompts.mjs';
import { promptSitesStatic, checkPrompt, composition, schemaOf, lenientJSON, fakeAnswer } from '../lib/combos.mjs';
import { withPage, ROOT, PC_DIR, hasBrowser } from './lib/page.mjs';
import { readGame, gidOf, hasGame } from './lib/data.mjs';
import { kindOf } from './lib/kind.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), ri = argv.indexOf('--ref'), REF = ri >= 0 ? argv[ri + 1] : null, QUICK = argv.includes('--quick');
// 상황(한 번에 한 가지만 바꿈 — 기본 대비 그 상황에서 달라지는 조합을 봄). 경로는 앱이 읽는 곳: storyCfg()=G.meta.story · exMode()=G.meta.expedition.mode · castRule=G.meta.castSex · ctx 원작=G.world.source · 개성=c.persona · 세력=G.world.factions
export const SITUATIONS = [
  ['기본', ''],
  ['마지막 스테이지: 전투', "G.meta.story=Object.assign(G.meta.story||{},{finale:'battle'})"],
  ['마지막 스테이지: 콘테스트', "G.meta.story=Object.assign(G.meta.story||{},{finale:'contest'})"],
  ['마지막 스테이지: 회담', "G.meta.story=Object.assign(G.meta.story||{},{finale:'debate'})"],
  ['이야기 빠르게', "G.meta.story=Object.assign(G.meta.story||{},{depth:'fast'})"],
  ['플레이어가 쓴 플롯', "G.meta.story=Object.assign(G.meta.story||{},{plot:'주인공이 잃어버린 동생을 찾아 떠나고, 마지막에 동생이 적의 지도자임을 알게 된다.'})"],
  ['대화만 스테이지 없음', "G.meta.story=Object.assign(G.meta.story||{},{talkOnly:0})"],
  ['파견: 아이돌', "G.meta.expedition={mode:'idol'}"], ['파견: 방송', "G.meta.expedition={mode:'streamer'}"], ['파견: 경영', "G.meta.expedition={mode:'business'}"],
  ['출연 성별: 여성만', "G.meta.castSex='f'"], ['출연 성별: 남성만', "G.meta.castSex='m'"],
  ['2차 창작', "G.world.source='별빛 연대기'"],
  ['개성 시트 없음', "G.chars.forEach(c=>{ delete c.persona; })"],
  ['세력 없음', "G.world.factions=[]"],
];
// 새 게임 입력(생성기 흐름) — 기록된 게임 입력에서 한 가지씩 바꿈
const NEWGAME = [
  ['자동', d => d],
  ['직접: 플롯·2차 창작·주인공', d => ({ mode: 'draft', kw: d.auto || d.kw, n: 6, fan: true, src: '별빛 연대기', story: '주인공은 몰락한 가문의 후계자다. 1장에서 옛 동료를 만나 반란군의 음모를 알게 된다.', stages: 4, hero: { name: '한결', call: '단장', gender: '여성', look: '은발 단발' } })],
  ['직접: 초안 대원·NPC', d => ({ mode: 'draft', kw: d.auto || d.kw, n: 6, chars: [{ name: '세라', rank: 3, role: '검사', profile: '냉정한 검사', speech: '단호한 존댓말', look: '흑발 장발' }, { name: '노인 하멜', kind: 'npc', role: '대장장이', look: '흰 수염' }] })],
  ['직접: 여성만·빠르게', d => ({ mode: 'draft', kw: d.auto || d.kw, n: 6, castSex: 'f', depth: 'fast', talkOnly: 0 })],
];
// 흐름: 요청 지점을 부르는 진입(앱이 부르는 방식대로). 도우미 이름은 앱 전역(B·C 등)과 겹치지 않게 __로. __C()=대원 · __ALT()=이격 · __CH()=메인 장 · __ST()=대본 있는 스테이지 · __B()=버튼. 분배기 case(화면 동작)는 아래 자동 운전
const FLOWS = {
  naiBlocksSeparate: 'LiveOps.naiBlocksSeparate(__C().naiPrompt||"1girl, solo, long hair, red eyes, armor", __B())',
  designAI: 'Core.designAI(__B())', weaponPromptAI: 'Characters.weaponPromptAI(G.chars.slice(0,2).map(c=>({c,name:(c.weapon||{}).name||"검",desc:(c.weapon||{}).desc||"",cur:(c.weapon||{}).prompt||""})),null,G.world)',
  jaBatch: 'System.jaBatch(["다시 만나서 반가워요","오늘도 잘 부탁해요"])', toJa: 'System.toJa("오늘은 같이 걸을까요")',
  spotsAI: 'LiveOps.spotsAI(__B())', spotTalkAI: '(async()=>{ if(!LiveOps.spots().length) await LiveOps.spotsAI(null); return LiveOps.spotTalkAI(__C(),__B()); })()',
  heroTags: 'NewGame.heroTags({gender:"여성",look:"은발 단발, 군복",hide:false})', fcSend: 'Core.fcSend()', fcSummarize: 'Core.fcSummarize(__C().id)',
  rulesAIData: 'Rules.rulesAIData(__B())', rulesPosAI: 'Rules.rulesPosAI(__B())', skinAuto: 'LiveOps.skinAuto("")',
  ensureLibPrompts: '(()=>{ G.lib.filter(l=>l.kind==="bg").slice(0,2).forEach(l=>{ l.prompt=""; }); return Art.ensureLibPrompts(); })()',
  aiChapterGen0: 'StoryCtl.aiChapterGen("메인 플롯을 따라 자연스럽게 이어서",4,[],null)', writeStages: 'StoryCtl.aiChapterGen("메인 플롯을 따라 자연스럽게 이어서",4,[],null)',
  aiEventGen0: 'CoreCtl.aiEventGen("여름 축제에서 생긴 일",3,true,[],null)',
  drPolish: '(()=>{ StoryView.openDraft(); return Core.drPolish("world",__B()); })()', drPolishHero: '(()=>{ StoryView.openDraft(); return Characters.drPolishHero(__B()); })()', drHarmony: '(()=>{ StoryView.openDraft(); return Characters.drHarmony(__B()); })()', drFillChar: '(()=>{ StoryView.openDraft(); return Core.drFillChar(0,__B()); })()',
  skinLinesAI: 'Misc.skinLinesAI(__C(),(__C().skins||[])[0]||{name:"여름 휴가",idea:"수영복"},null)', dailyTalks: 'Messenger.dailyTalks()',
  aiNewPickupChar: 'Characters.aiNewPickupChar("","ai",null)', aiAltChar: 'Characters.aiAltChar(__C(),"","ai",null)', cxDiscover: 'World.cxDiscover(__B())', cxDeepen: '(async()=>{ const k=(World.cxEntries()[0]||{}).key; return k?World.cxDeepen(k,__B()):null; })()',
  autoNpcs: 'Characters.autoNpcs([__CH()])', factionAI: 'World.factionAI()', relSeedAI: 'Core.relSeedAI(__B())',
  personaAI: 'Characters.personaAI(__C(),"fill")', personaAIReview: 'Misc.personaAIReview(__C(),__B())', talkAffGen: 'Characters.talkAffGen(__C(),__B())', memorialGen: 'Characters.memorialGen(__C(),__B())',
  directScript: 'System.directScript((__ST()||{}).pre||"세라: 안녕하세요\\n나레이션: 바람이 분다.")', planAI: 'Story.planAI("new",null)',
  smExtract: 'Story.smExtract(__CH())', storyWrapUp: 'StoryCtl.storyWrapUp(__CH(),"1~2")', auditAIFill: 'LiveOps.auditAIFill(__C(),["profile","speech"])', auditAIStage: 'Story.auditAIStage(__ST())',
  v2ConceptPrompt: '(async()=>{ const c=__C(); return v2ConceptPrompt({items:{},slot:"ult",preview:null},c); })()',
  // 그림(가짜 NovelAI 키 — 그림 요청의 프롬프트·제외 태그를 받아 적고 오류로 답함)
  '그림: 캐릭터': 'NewGame.naiDraw("char",__C().naiPrompt||"1girl, solo")', '그림: 상반신': 'Core.naiDrawItem({k:"upper",o:{prompt:""},c:__C()})',
  '그림: 배경': '(()=>{ const l=G.lib.find(x=>x.kind==="bg")||{prompt:"castle, sky"}; return NewGame.naiDraw("bg",l.prompt||"castle"); })()', '그림: 소품': '(()=>{ const l=G.lib.find(x=>x.kind==="prop")||{prompt:"sword"}; return NewGame.naiDraw("prop",l.prompt||"sword"); })()',
  '그림: 적': 'NewGame.naiDraw("enemy","monster, claws")', '그림: CG': '(()=>{ const it=G.lib.find(x=>x.kind==="cg")||{name:"테스트 CG",prompt:"sunset, two people",chars:[__C().id]}; return NewGame.naiDraw("cg",null,{item:it}); })()',
  '(최상위 문장)': '(()=>{ const b=document.createElement("button"); b.dataset.act="pstai"; b.dataset.id=Object.keys(window.__PF)[0]; document.body.appendChild(b); b.click(); return new Promise(r=>setTimeout(r,1500)); })()',
};
const LAYER = new Set(['setupAI', 'aiJSON', 'aiJSONRetry', 'naiGenerate', 'naiGenerate0', 'run']); // 모든 요청이 지나는 층(감싸기·연결 · Generator.run — AI 생성 흐름의 상위 템플릿 메서드) — 요청 지점으로 세지 않음

if (!hasBrowser()) { console.log('skip tools/play/combos: playwright 없음(브라우저 도구 — tools/play/test.mjs와 같이 건너뜀)'); process.exit(0); }
const units = await loadUnits(ROOT), S1 = promptSitesStatic(units), S2 = promptSitesStatic(units, { sinks: IMAGE_SINKS, tables: true }), sites = [...S1.sites, ...S2.sites.map(x => ({ ...x, key: '그림 ' + x.key, image: true }))], wrappers = [...S1.wrappers, ...S2.wrappers], layerTexts = S1.layerTexts, skip = new Set([...LAYER, ...wrappers, ...sites.filter(s => s.layer).map(s => s.owner)]);
// 분배기 case(화면 동작) 운전 재료: case 값·그 본문이 읽는 입력 칸($('#x'))·버튼 dataset 키
const acts = [];
{ const { walk } = await import('../lib/source.mjs'); for (const s of sites.filter(x => /^handle\w+Action$/.test(x.owner))) { const u = units.find(x => x.files?.some(f => s.loc.startsWith(f.path + ':')));
    if (!u) continue; const [file, line] = s.loc.split(':'), f = u.files.find(x => x.path === file), row = f.start + (+line) - 1; let hit = null;
    walk(u.tree.rootNode, n => { if (hit) return false; if (n.type === 'switch_case' && n.startPosition.row <= row && n.endPosition.row >= row) { hit = n; } });
    if (!hit) continue; const a = hit.childForFieldName('value')?.text.replace(/^['"]|['"]$/g, ''), body = hit.text;
    acts.push({ key: s.key, owner: s.owner, act: a, ids: [...new Set([...body.matchAll(/\$\(\s*['"]#([\w-]+)['"]\s*\)/g)].map(m => m[1]))], ds: [...new Set([...body.matchAll(/t\.dataset\.(\w+)/g)].map(m => m[1]))], npc: /npcs/.test(body), num: [...new Set([...body.matchAll(/\+\$\(\s*['"]#([\w-]+)['"]\s*\)/g)].map(m => m[1]))], sel: [...new Set([...body.matchAll(/\$\(\s*['"]#([\w-]+)['"]\s*\)\.selectedOptions/g)].map(m => m[1]))], chk: [...new Set([...body.matchAll(/\$\(\s*['"]#([\w-]+)['"]\s*\)\.checked/g)].map(m => m[1]))] }); } }
const uniqActs = [...new Map(acts.map(a => [a.owner + a.act, a])).values()];
const owners = [...new Set(sites.map(s => s.owner))].filter(o => !skip.has(o));

// 기준 게임: tools/play/games/*의 마지막 저장 게임(PC 서버 data) — 없으면 앱 기본 게임
const games = []; for (const d of existsSync(join(HERE, 'games')) ? readdirSync(join(HERE, 'games')) : []) { const dir = join(HERE, 'games', d), gid = gidOf(dir); if (!gid || !hasGame(PC_DIR, gid)) continue; // PC data에 없는 게임 폴더는 건너뜀
  const g = readGame(PC_DIR, gid), responses = {}; if (existsSync(join(dir, 'responses'))) for (const f of readdirSync(join(dir, 'responses'))) if (f.endsWith('.txt')) responses[f.slice(0, -4)] = readFileSync(join(dir, 'responses', f), 'utf8');
  games.push({ name: d, game: JSON.stringify(g.game), input: JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')), responses }); }
if (!games.length) games.push({ name: '앱 기본 게임', game: null, input: { mode: 'auto', auto: '하늘섬 기사단 판타지', n: 6 }, responses: {} });
const si = argv.indexOf('--sit'), SF = si >= 0 ? argv[si + 1] : null, pick = (L, q) => SF ? L.filter(([n]) => (q + n).includes(SF)) : L; // --sit <글>: 이름에 그 글이 든 상황만
const GAMES = QUICK ? games.slice(0, 1) : games, SITS = pick(QUICK ? SITUATIONS.slice(0, 1) : SITUATIONS, ''), NG = pick(QUICK ? NEWGAME.slice(0, 1) : NEWGAME, '새 게임 · ');

// 페이지 안: 가짜 글 AI(http 가로채기) · 보낸 프롬프트·스택 기록 · 상황 적용 · 흐름 실행
async function runSide(www, tag) {
  const records = [];
  for (const gm of GAMES) {
    const plan = [...SITS.map(([sit, code]) => ({ kind: 'state', sit, code })), ...NG.map(([sit, fn]) => ({ kind: 'new', sit: '새 게임 · ' + sit, input: fn(gm.input) }))];
    for (const step of plan) {
      const { out } = await withPage(async page => {
        await page.clock.setFixedTime(new Date('2026-11-01T09:00:00+09:00'));
        return page.evaluate(async ({ step, game, owners, skip, flows, acts, responses, kindSrc, libSrc }) => {
          let seed = 12345; Math.random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); Error.stackTraceLimit = 80;
          const recs = [], kindOfP = new Function('return ' + kindSrc)(), seenSkill = {}; let cur = '';
          P().seenOpening = true; CoreView.closeModal(); CoreView.closeOv(); appStorage.removeItem('ggm-ng-draft');
          appStorage.setItem(PKEY, JSON.stringify({ active: 'gen', fallback: false, list: [{ id: 'gen', type: 'anthropic', name: 'tools/play', key: 'replay', model: 'replay', quick: 'replay-quick' }] })); System.setupAI();
          // 형식 견본을 그대로 답(견본 속 범위·설명은 앞 값으로) — 흐름이 응답을 받아 다음 단계로 가게
          const [schemaOf, lenientJSON, fakeAnswer] = ['schemaOf', 'lenientJSON', 'fakeAnswer'].map(k => new Function('return ' + libSrc[k])());
          const fakeSt = { n: 0 }; // 형식 견본을 그럴듯한 답으로(tools/lib/combos.mjs fakeAnswer — 번호를 붙여 서로 다르게: 대원마다 같은 글이면 같은 줄 되풀이가 가짜로 생김)
          const echo = p => { const sc = schemaOf(p), v = sc && sc.body ? lenientJSON(sc.body) : null; return v ? JSON.stringify(fakeAnswer(v, fakeSt)) : '{}'; };
          const realHttp = System.http;
          appStorage.setItem(NKEY, JSON.stringify({ key: 'combos-fake', retries: 0 })); // 그림 AI가 켜진 것으로(요청은 아래에서 가로챔)
          System.http = async (url, opts) => { if (/image\.novelai\.net/.test(url)) { const b = typeof opts.body === 'string' ? JSON.parse(opts.body) : (opts.body || {}), pr = b.parameters || {}; const frames = String(new Error().stack).split('\n').map(l => (/at (?:async )?([\w$.]+) \(/.exec(l) || [])[1]).filter(Boolean).map(f => f.replace(/^[A-Z][\w$]*\./, '')) /* Class.이름 → 이름(요청 지점 이름) */;
              recs.push({ flow: cur, owner: frames.find(f => owners.includes(f) && !skip.includes(f)) || '', image: true, prompt: [b.input || '', '[제외] ' + (pr.negative_prompt || ''), pr.v4_prompt ? '[v4] ' + JSON.stringify(pr.v4_prompt) : '', pr.v4_negative_prompt ? '[v4 제외] ' + JSON.stringify(pr.v4_negative_prompt) : ''].filter(Boolean).join('\n'), frames: frames.slice(0, 12).join('<') }); return { status: 500, text: 'combos: image request recorded' }; }
            if (!/api\.anthropic\.com\/v1\/messages/.test(url)) return realHttp(url, opts);
            const body = opts.body, first = body.messages[0].content, prompt = typeof first === 'string' ? first : first.map(b => b.text || '').join('');
            const frames = String(new Error().stack).split('\n').map(l => (/at (?:async )?([\w$.]+) \(/.exec(l) || [])[1]).filter(Boolean).map(f => f.replace(/^[A-Z][\w$]*\./, '')) /* Class.이름 → 이름(요청 지점 이름) */, owner = frames.find(f => owners.includes(f) && !skip.includes(f)) || '';
            const kind = step.kind === 'new' ? kindOfP(prompt, 'new', seenSkill) : ''; recs.push({ flow: cur, owner, prompt, max_tokens: body.max_tokens, frames: frames.slice(0, 12).join('<') });
            await new Promise(r => setTimeout(r, 20)); const r = (kind && responses[kind]) || echo(prompt);
            return { status: 200, text: JSON.stringify({ content: [{ type: 'text', text: r }], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } }) }; };
          // 응답 키 읽기 기록: 받은 객체의 첫 단계 키를 게터로 — 직렬화(JSON.stringify·저장 복제)가 읽는 것은 뺌. 요청 기록에 붙임(프롬프트 앞부분이 든 마지막 요청)
          const watch = (prompt, r) => { if (!r || typeof r !== 'object' || Array.isArray(r)) return r; const head = String(prompt).slice(0, 160), rec = [...recs].reverse().find(x => x.prompt.includes(head)); if (!rec) return r; rec.used = rec.used || []; rec.asked = Object.keys(r);
            for (const k of Object.keys(r)) { let v = r[k]; Object.defineProperty(r, k, { enumerable: true, configurable: true, get() { const st = String(new Error().stack); if (!/JSON\.stringify|structuredClone|\.put \(|clone/.test(st) && !rec.used.includes(k)) rec.used.push(k); return v; }, set(x) { v = x; } }); } return r; };
          const oj = Core.aiJSON; Core.aiJSON = async (...a) => watch(a[0], await oj(...a)); const sj = SAMPLE.json; SAMPLE.json = async (...a) => watch(a[0], await sj(...a));
          CoreView.toast = () => {}; appConfirm = async () => true; SystemView.reloadGame = () => {};
          const errs = [], S0 = game || JSON.stringify(G), load = () => { G = Characters.fix(JSON.parse(S0)); SystemView.applyMeta(); if (step.code) { (0, eval)(step.code); SystemView.applyMeta(); } };
          window.__C = () => G.chars.find(c => !c.alt) || G.chars[0]; window.__ALT = () => G.chars.find(c => c.alt); window.__CH = () => G.chapters.find(c => c.kind === 'main' && (c.stages || []).some(s => s.pre)) || G.chapters[0]; window.__ST = () => (__CH().stages || []).find(s => s.pre) || (__CH().stages || [])[0]; window.__B = () => CoreView.uiProg(document.createElement('button')); /* 처리기가 단추로 만든 진행 알림(uiProg)을 넘기는 것처럼 */
          const run = async (name, code) => { cur = name; load(); const n0 = recs.length; try { await Promise.race([(0, eval)(code), new Promise((_, rj) => setTimeout(() => rj(Error('시간 초과 20초')), 20000))]); } catch (e) { errs.push({ flow: name, err: String(e && (e.message || e.code) || e).slice(0, 200) }); recs.slice(n0).forEach(x => { x.failed = true; }); } await new Promise(r => setTimeout(r, 300)); };
          if (step.kind === 'new') { load(); cur = '새 게임'; const btn = document.createElement('button'); document.body.appendChild(btn); try { await Promise.race([NewGame.newGame(CoreView.uiProg(btn, '#ng_stat'), step.input.mode === 'auto' ? step.input : (() => { appStorage.setItem(DR2KEY, JSON.stringify(step.input)); return Core.drLoad(); })()), new Promise((_, rj) => setTimeout(() => rj(Error('시간 초과 120초')), 120000))]); } catch (e) { errs.push({ flow: '새 게임', err: String(e && (e.message || e) || e).slice(0, 200) }); } await new Promise(r => setTimeout(r, 1500)); }
          else {
            for (const [name, code] of Object.entries(flows)) await run(name, code);
            for (const a of acts) { cur = a.owner + ':' + a.act; try { load(); const box = document.createElement('div'); box.style.display = 'none'; document.body.appendChild(box);
              for (const id of a.ids) { if (document.getElementById(id)) continue; const el = a.sel.includes(id) ? Object.assign(document.createElement('select'), { innerHTML: '<option value="1">1</option>' }) : a.chk.includes(id) ? Object.assign(document.createElement('input'), { type: 'checkbox' }) : document.createElement('textarea'); el.id = id; if (!a.sel.includes(id) && !a.chk.includes(id)) el.value = a.num.includes(id) ? '1' : (id === 'f_name' ? __C().name : '여름 축제'); box.appendChild(el); }
              const t = document.createElement('button'); t.dataset.act = a.act; for (const k of a.ds) t.dataset[k] = /^(i|j)$/.test(k) ? '0' : k === 's' ? ((__C().skins || [])[0] || {}).id || '' : k === 'k' ? 'bg' : ''; box.appendChild(t);
              const id = a.npc ? ((G.npcs || [])[0] || {}).id : __C().id;
              try { await Promise.race([__ggmFn(a.owner)(a.act, t, id, P(), { target: t }), new Promise((_, rj) => setTimeout(() => rj(Error('시간 초과 20초')), 20000))]); } catch (e) { errs.push({ flow: cur, err: String(e && (e.message || e.code) || e).slice(0, 200) }); }
              await new Promise(r => setTimeout(r, 300)); box.remove(); CoreView.closeModal(); } catch (e) { errs.push({ flow: cur, err: '운전 준비: ' + String(e && e.message || e).slice(0, 200) }); } }
          }
          load(); const frags = Object.fromEntries(Object.values(window.__PF || {}).map(f => [f.id, System.promptFrag(f.id)]));
          return { recs, errs, frags };
        }, { step, game: gm.game, owners, skip: [...skip], flows: step.kind === 'new' ? {} : FLOWS, acts: step.kind === 'new' ? [] : uniqActs, responses: gm.responses, kindSrc: kindOf.toString(), libSrc: { schemaOf: schemaOf.toString(), lenientJSON: lenientJSON.toString(), fakeAnswer: fakeAnswer.toString() } });
      }, { tag: `combos-${tag}`, www });
      out.recs.forEach((r, i) => records.push({ ...r, game: gm.name, sit: step.sit, seq: i, frags: out.frags }));
      (out.errs || []).forEach(e => records.push({ game: gm.name, sit: step.sit, error: e }));
      console.log(`${tag} · ${gm.name} · ${step.sit}: 요청 ${out.recs.length} · 흐름 오류 ${(out.errs || []).length}`);
    }
  }
  return records;
}

// 기록 → 요청 지점: 스택의 주인 함수가 같은 지점 중 코드 글 덩어리가 가장 많이 든 것(주인을 못 찾으면 전체에서)
const byOwner = new Map(); sites.forEach(s => { if (!byOwner.has(s.owner)) byOwner.set(s.owner, []); byOwner.get(s.owner).push(s); });
const siteOf = r => { const cand = byOwner.get(r.owner) || sites.filter(s => !skip.has(s.owner)); let best = null, bs = -Infinity; for (const s of cand) { const sc = s.heads.reduce((a, h) => a + (r.prompt.includes(h) ? h.length : -h.length / 2), 0); if (sc > bs) { bs = sc; best = s; } } return r.owner || bs > 0 ? best : null; }; // 그 지점 코드 글이 많이 들고 적게 빠질수록
const has = (r, comp, m) => m.startsWith('「') ? r.prompt.includes(m.slice(1, -1)) : comp.used.includes(m);

const wi = argv.indexOf('--www'), www = wi >= 0 ? resolve(argv[wi + 1]) : join(ROOT, 'www'), now = await runSide(www, '지금'); // --www: 지금 쪽 빌드 폴더(작업 중 다시 빌드해도 흔들리지 않게 복사본으로)
let ref = null;
const rwi = argv.indexOf('--ref-www'); if (rwi >= 0) ref = { sha: 'www:' + basename(resolve(argv[rwi + 1])), records: await runSide(resolve(argv[rwi + 1]), '기준 ' + basename(argv[rwi + 1])) }; // 빌드 폴더끼리 비교(git 빌드 없이)
else if (REF) { const sha = execSync(`git rev-parse --verify ${JSON.stringify(REF + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim(), refDir = join(ROOT, 'tools/out/regress', 'build-' + sha.slice(0, 12));
  if (!existsSync(join(refDir, 'www/index.html'))) { mkdirSync(refDir, { recursive: true }); execSync(`git archive ${sha} src build | tar -x -C ${JSON.stringify(refDir)}`, { cwd: ROOT }); execSync(`cp -r ${JSON.stringify(www)} ${JSON.stringify(join(refDir, 'www'))}`);
    execSync(`node ${JSON.stringify(join(refDir, 'build/build.mjs'))} --src ${JSON.stringify(join(refDir, 'src'))} --out ${JSON.stringify(join(refDir, 'www/index.html'))} --no-version`, { cwd: refDir, stdio: 'ignore' }); }
  ref = { sha, records: await runSide(join(refDir, 'www'), '기준 ' + sha.slice(0, 7)) }; }

// 분석
const reqs = now.filter(r => r.prompt), errors = now.filter(r => r.error), per = new Map(), findings = new Map();
for (const r of reqs) { const s = siteOf(r), key = s ? s.key : '(지점 모름) ' + (r.owner || r.flow), comp = composition(r.prompt, r.frags);
  const x = per.get(key) || { key, site: s, n: 0, sits: new Set(), combos: new Map(), lens: [], seen: s ? s.switches.map(() => ({ yes: 0, no: 0 })) : [] }; per.set(key, x);
  x.n++; x.sits.add(`${r.game} · ${r.sit}`); x.lens.push(r.prompt.length); const ck = comp.used.join(','); x.combos.set(ck, (x.combos.get(ck) || 0) + 1);
  if (s) s.switches.forEach((w, i) => { if (w.yes.some(m => has(r, comp, m))) x.seen[i].yes++; if (w.no.some(m => has(r, comp, m))) x.seen[i].no++; });
  for (const f of r.image ? [] : checkPrompt(r.prompt, { sink: s?.sink, frags: Object.fromEntries(comp.used.map(id => [id, r.frags[id]])), reads: s?.readsFound ? s.reads : null, used: r.used && !r.failed ? r.used : null, got: r.asked, strip: layerTexts })) {
    const fk = `${key}|${f.code}|${f.msg}`, y = findings.get(fk) || { key, ...f, sits: new Set() }; y.sits.add(`${r.game} · ${r.sit}`); findings.set(fk, y); } }
const covered = new Set([...per.values()].filter(x => x.site).map(x => x.site.key)), uncovered = sites.filter(s => !covered.has(s.key) && !skip.has(s.owner));
// 기준 비교: (게임·상황·흐름·주인·순번)마다 프롬프트 글이 같은지
const diffs = []; if (ref) { const idx = rs => { const m = new Map(), c = new Map(); for (const r of rs.filter(x => x.prompt)) { const k0 = `${r.game}|${r.sit}|${r.flow}|${r.owner}`, n = (c.get(k0) || 0) + 1; c.set(k0, n); m.set(`${k0}|${n}`, r.prompt); } return m; };
  const A = idx(ref.records), B = idx(now); for (const k of new Set([...A.keys(), ...B.keys()])) { const a = A.get(k), b = B.get(k); if (a === b) continue; let i = 0; if (a && b) while (i < a.length && a[i] === b[i]) i++;
    diffs.push({ at: k, ref: a == null ? '(없음)' : `${a.length}자`, now: b == null ? '(없음)' : `${b.length}자`, first: a && b ? `${i}자째: 기준 「${a.slice(i, i + 40)}」 / 지금 「${b.slice(i, i + 40)}」` : '' }); } }

const T = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');
const F = [...findings.values()], cnt = k => F.filter(f => f.kind === k).length, rows = [...per.values()].sort((a, b) => a.key.localeCompare(b.key));
const md = [`# 프롬프트 조합 검증`, '', `생성: \`node tools/play/combos.mjs${REF ? ' --ref ' + REF : ''}${QUICK ? ' --quick' : ''}\` · 게임 ${GAMES.map(g => g.name).join(', ')} · 상황 ${SITS.length} + 새 게임 입력 ${NG.length}`, '',
  `## 요약`, '', `- 요청 지점(정적) ${sites.length - sites.filter(s => skip.has(s.owner)).length}곳 중 실행으로 닿은 곳 ${covered.size} · 안 닿은 곳 ${uncovered.length}`, `- 보낸 프롬프트 ${reqs.length}개 · 흐름 오류 ${errors.length}`,
  `- 발견: 깨짐 ${cnt('깨짐')} · 과잉 ${cnt('과잉')} · 과소 ${cnt('과소')} · 정보 ${cnt('정보')}`, ref ? `- 기준(${ref.sha.slice(0, 7)})과 다른 프롬프트 ${diffs.length}` : '', '',
  `## 지점별 조합`, '', '갈래: 정적으로 찾은 조건 수(가능한 조합 2^갈래) · 두 쪽 다 봄 / 한 쪽만 / 못 봄 = 실제 프롬프트에서 그 갈래의 글이 나왔는지', '',
  T(['지점', '프롬프트 수', '상황 수', '서로 다른 조각 조합', '글자(최소~최대)', '갈래', '두 쪽 다 봄', '한 쪽만', '못 봄'], rows.map(x => [x.key, x.n, x.sits.size, x.combos.size, `${Math.min(...x.lens)}~${Math.max(...x.lens)}`, x.site ? x.site.switches.length : '', x.seen.filter(v => v.yes && v.no).length, x.seen.filter(v => !!v.yes !== !!v.no).length, x.seen.filter(v => !v.yes && !v.no).length])), '',
  `## 발견 (깨짐·과잉·과소)`, '', T(['종류', '항목', '지점', '내용', '상황'], F.filter(f => f.kind !== '정보').sort((a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key)).map(f => [f.kind, f.code, f.key, f.msg, [...f.sits].slice(0, 3).join(' / ') + (f.sits.size > 3 ? ` 외 ${f.sits.size - 3}` : '')])), '',
  `## 정보`, '', T(['항목', '지점', '내용'], F.filter(f => f.kind === '정보').map(f => [f.code, f.key, f.msg])), '',
  `## 실행으로 안 닿은 요청 지점 (${uncovered.length})`, '', T(['지점', '위치', '갈래'], uncovered.map(s => [s.key, s.loc, s.switches.length])), '',
  `## 흐름 오류 (${errors.length})`, '', T(['게임', '상황', '흐름', '오류'], errors.slice(0, 80).map(r => [r.game, r.sit, r.error.flow, r.error.err])), '',
  ...(ref ? [`## 기준(${ref.sha.slice(0, 7)})과 다른 프롬프트 (${diffs.length})`, '', T(['게임|상황|흐름|주인|순번', '기준', '지금', '처음 다른 곳'], diffs.slice(0, 100).map(d => [d.at, d.ref, d.now, d.first])), ''] : []),
  `## 못 본 갈래 (지점별 앞 8개)`, '', ...rows.filter(x => x.site && x.seen.some(v => !v.yes || !v.no)).map(x => `- ${x.key}: ${x.site.switches.map((w, i) => ({ w, v: x.seen[i] })).filter(({ v }) => !v.yes || !v.no).slice(0, 8).map(({ w, v }) => `\`${w.cond}\`(${!v.yes && w.yes.length ? '참 못 봄' : ''}${!v.no && w.no.length ? ' 거짓 못 봄' : ''})`).join(' · ')}`), ''].join('\n');
const SAMPLES = join(ROOT, 'tools/out/combos'); mkdirSync(SAMPLES, { recursive: true }); for (const x of rows) { const r = reqs.find(q => (siteOf(q)?.key || '(지점 모름) ' + (q.owner || q.flow)) === x.key); if (r) writeFileSync(join(SAMPLES, x.key.replace(/[^\w가-힣.#-]+/g, '_') + '.txt'), `# ${r.game} · ${r.sit} · 흐름 ${r.flow}\n${r.prompt}`); } // 지점마다 견본 프롬프트 하나(검토용 — tools/out/combos, git에서 뺌)
const RN = argv.indexOf('--report') >= 0 ? argv[argv.indexOf('--report') + 1] : 'combos'; writeFileSync(join(HERE, `reports/${RN}.md`), md); // --report <이름>: 보고서 이름(동시에 둘 돌릴 때)
const J = { at: new Date().toISOString(), ref: ref?.sha || null, sites: rows.map(x => ({ key: x.key, n: x.n, situations: [...x.sits], combos: Object.fromEntries(x.combos), switches: x.site ? x.site.switches.map((w, i) => ({ ...w, seen: x.seen[i] })) : [] })), findings: F.map(f => ({ ...f, sits: [...f.sits] })), requestsFile: 'tools/out/combos/requests.json', _r: reqs.map(r => ({ game: r.game, sit: r.sit, flow: r.flow, owner: r.owner, site: siteOf(r)?.key || null, len: r.prompt.length, asked: r.asked || null, used: r.used || null, failed: !!r.failed })), uncovered: uncovered.map(s => s.key), errors: errors.map(r => ({ game: r.game, sit: r.sit, ...r.error })), diffs }; writeFileSync(join(SAMPLES, 'requests.json'), JSON.stringify(J._r, null, 1)); delete J._r; writeFileSync(join(HERE, `reports/${RN}.json`), JSON.stringify(J, null, 1)); // 요청별 기록은 크니 tools/out에
console.log(`요청 지점 ${covered.size}/${sites.length - sites.filter(s => skip.has(s.owner)).length} 닿음 · 프롬프트 ${reqs.length} · 깨짐 ${cnt('깨짐')} · 과잉 ${cnt('과잉')} · 과소 ${cnt('과소')}${ref ? ` · 기준과 다른 프롬프트 ${diffs.length}` : ''}`);
console.log(`→ tools/play/reports/${RN}.md`);
if (ref && diffs.length) process.exit(1);
