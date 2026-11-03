// 생성 본체: 앱의 실제 생성 경로를 돌리고 글 AI 요청(Anthropic 형식)만 응답 표로 답한다.
//   responses: { kind: 응답 글 | {status, text}(HTTP 오류 흉내) }. 없는 kind는 onPrompt(kind, 프롬프트)로 넘기고 529(대기)로 돌려준다.
//   phase: 'new'(input → 새 게임) | 'skills'(game의 임시 스킬 대원) | 'chapter'(game에 다음 메인 장)
// 명령줄은 tools/play/generate.mjs, 실패 주입은 tools/play/faults.mjs
import { withPage } from './page.mjs';
import { kindOf } from './kind.mjs';

export async function runGenerate({ phase, responses = {}, input = null, game = null, stages = 4, direction = '메인 플롯을 따라 자연스럽게 이어서', onPrompt = null, tag = 'generate', settleMs = 4000 }) {
  return withPage(async page => {
    await page.exposeFunction('__onPrompt', (kind, text) => { if (onPrompt) onPrompt(kind, text); });
    return page.evaluate(async ({ phase, responses, input, game, stages, direction, settleMs, kindSrc }) => {
      const log = [], pending = new Set(), toasts = [], seenSkill = {};
      P().seenOpening = true; closeModal(); closeOv(); try { appStorage.removeItem('ggm-ng-draft'); } catch (e) {}
      const tt = toast; toast = m => { toasts.push(String(m)); return tt(m); };
      appStorage.setItem(PKEY, JSON.stringify({ active: 'gen', fallback: false, list: [{ id: 'gen', type: 'anthropic', name: 'tools/play', key: 'replay', model: 'replay', quick: 'replay-quick' }] })); setupAI();
      const kindOf = p => (new Function('return ' + kindSrc)())(p, phase, seenSkill);
      const realHttp = http;
      http = async (url, opts) => {
        if (!/api\.anthropic\.com\/v1\/messages/.test(url)) return realHttp(url, opts);
        const body = opts.body, msgs = body.messages, first = msgs[0].content, prompt = typeof first === 'string' ? first : first.map(b => b.text || '').join('');
        let kind = kindOf(prompt); if (msgs.length > 1) kind += '-cont' + (msgs.length - 1) / 2;
        const rec = { kind, len: prompt.length, max_tokens: body.max_tokens, at: Date.now() }; log.push(rec); const r = responses[kind];
        await new Promise(res => setTimeout(res, 30)); /* 실제 네트워크처럼 매크로태스크로 응답 — 즉시 응답하면 앱의 setTimeout 콜백(백그라운드 작업)이 생성이 끝날 때까지 못 돌아 실제와 순서가 달라짐 */
        if (r == null) { pending.add(kind); await window.__onPrompt(kind, prompt); rec.pending = true; return { status: 529, text: JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'pending response' } }) }; }
        if (typeof r === 'object') { rec.injected = r.status; return r; }
        rec.outLen = r.length;
        return { status: 200, text: JSON.stringify({ content: [{ type: 'text', text: r }], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } }) };
      };
      const settle = ms => new Promise(r => setTimeout(r, ms)), result = {};
      if (phase === 'new') {
        let saved = null; const orig = appStorage.commitRecords.bind(appStorage); appStorage.commitRecords = async recs => { for (const [, v] of Object.entries(recs)) if (/"chapters"/.test(v)) { try { saved = JSON.parse(v); result.commitAtCall = log.length; } catch (e) {} } return orig(recs); };
        window.reloadGame = () => {}; const btn = document.createElement('button'); document.body.appendChild(btn);
        const stat = []; const mo = new MutationObserver(() => { const s = document.getElementById('ng_stat'); if (s && s.textContent && stat.at(-1) !== s.textContent) stat.push(s.textContent); }); mo.observe(document.body, { subtree: true, childList: true, characterData: true });
        const t0 = performance.now(); try { await newGame(btn, input); } /* 실제 진입점(NEW_GAME_SOURCE를 켜고 끝나면 원래 게임으로) */ catch (e) { result.thrown = String(e && (e.message || e.code) || e); }
        result.ms = Math.round(performance.now() - t0); await settle(settleMs); mo.disconnect(); result.stat = stat; result.game = saved;
        let draft = null; try { draft = appStorage.getItem('ggm-ng-draft'); } catch (e) {} result.draftKept = !!draft;
      } else {
        G = fix(JSON.parse(game)); applyMeta(); window.reloadGame = () => {};
        if (phase === 'skills') {
          const defNames = c => JSON.stringify(Object.values(GGMCombat.generationDefaults(c) || {}).filter(x => x && x.name).map(x => x.name)), kitNames = c => JSON.stringify(Object.values(c.skills || {}).filter(x => x && x.name).map(x => x.name));
          const todo = G.chars.filter(c => !c.alt && (c.skillGenerationWarning || kitNames(c) === defNames(c))); // 임시 상태이거나 기본 스킬 그대로인 대원만(인라인 스킬이 검증을 통과했으면 건드리지 않음)
          result.todo = todo.map(c => c.name + ' | ' + (c.skillGenerationWarning || '설계 기록 없음'));
          for (const c of todo) { try { const kit = await v2GenerateSkills(c, '', () => {}); c.skills = kit; delete c.skillGenerationWarning; } catch (e) { c.skillGenerationWarning = String(e.message || e.code || e); } }
        } else {
          const t0 = performance.now(); let res = null; try { res = await aiChapterGen(direction, stages, [], null); } catch (e) { result.thrown = String(e && (e.message || e.code) || e); }
          result.ms = Math.round(performance.now() - t0); await settle(settleMs); result.chapter = res ? { title: res.ch.title, nb: res.nb, nt: res.nt, nc: (res.nc || []).map(c => c.name) } : null;
        }
        result.game = JSON.parse(JSON.stringify(G));
      }
      Object.assign(result, { log, pending: [...pending], toasts: toasts.slice(0, 30), ailog: (typeof AILOG !== 'undefined' ? AILOG : []).slice(0, 40).map(x => ({ ok: x.ok, stage: x.stage, err: x.err, reqLen: x.reqLen })) });
      return result;
    }, { phase, responses, input, game, stages, direction, settleMs, kindSrc: kindOf.toString() });
  }, { tag });
}
