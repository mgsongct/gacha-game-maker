// 생성 본체: 앱의 실제 생성 경로를 돌리고 글 AI 요청(Anthropic 형식)만 응답 표로 답한다.
//   responses: { kind: 응답 글 | {status, text}(HTTP 오류 흉내) }. 없는 kind는 onPrompt(kind, 프롬프트)로 넘기고 529(대기)로 돌려준다.
//   phase: 'new'(input → 새 게임) | 'skills'(game의 임시 스킬 대원) | 'chapter'(game에 다음 메인 장)
// 명령줄은 tools/play/generate.mjs, 실패 주입은 tools/play/faults.mjs
import { withPage } from './page.mjs';

export async function runGenerate({ phase, responses = {}, input = null, game = null, stages = 4, direction = '메인 플롯을 따라 자연스럽게 이어서', onPrompt = null, tag = 'generate', settleMs = 4000 }) {
  return withPage(async page => {
    await page.exposeFunction('__onPrompt', (kind, text) => { if (onPrompt) onPrompt(kind, text); });
    return page.evaluate(async ({ phase, responses, input, game, stages, direction, settleMs }) => {
      const log = [], pending = new Set(), toasts = [], seenSkill = {};
      P().seenOpening = true; closeModal(); closeOv(); try { appStorage.removeItem('ggm-ng-draft'); } catch (e) {}
      const tt = toast; toast = m => { toasts.push(String(m)); return tt(m); };
      appStorage.setItem(PKEY, JSON.stringify({ active: 'gen', fallback: false, list: [{ id: 'gen', type: 'anthropic', name: 'tools/play', key: 'replay', model: 'replay', quick: 'replay-quick' }] })); setupAI();
      const kindOf = p => {
        if (/속성\(elems\)은/.test(p)) return 'world';
        if (/debut 항목/.test(p)) return 'chars';
        if (/이 게임의 시작 부분을 만들어라/.test(p)) return 'opening';
        if (/프롤로그 다음으로 이어지는 1장/.test(p)) return 'chapter1';
        if (/캐릭터의 패시브·액티브·궁극기를 한 주역할로 설계하세요/.test(p)) { const nm = (p.match(/"name":"([^"]+)"/) || [, 'x'])[1]; seenSkill[nm] = (seenSkill[nm] || 0) + 1; return `skill-${nm}-${seenSkill[nm]}`; }
        const head = p.replace(/^[\s\S]*?(다음[^\n]{0,30}|[^\n]{0,40}(만들어라|써라|정하라|작성하라|구성하라))/, '$1').slice(0, 24).replace(/[^\w가-힣]+/g, '_');
        let h = 0; for (const ch of p.slice(0, 400)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return `${phase}-${head}-${(h % 46656).toString(36)}`;
      };
      const realHttp = http;
      http = async (url, opts) => {
        if (!/api\.anthropic\.com\/v1\/messages/.test(url)) return realHttp(url, opts);
        const body = opts.body, msgs = body.messages, first = msgs[0].content, prompt = typeof first === 'string' ? first : first.map(b => b.text || '').join('');
        let kind = kindOf(prompt); if (msgs.length > 1) kind += '-cont' + (msgs.length - 1) / 2;
        const rec = { kind, len: prompt.length, max_tokens: body.max_tokens, at: Date.now() }; log.push(rec); const r = responses[kind];
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
        const t0 = performance.now(); try { await buildNewGameDraft(btn, input, PJ().active); } catch (e) { result.thrown = String(e && (e.message || e.code) || e); }
        result.ms = Math.round(performance.now() - t0); await settle(settleMs); mo.disconnect(); result.stat = stat; result.game = saved;
        let draft = null; try { draft = appStorage.getItem('ggm-ng-draft'); } catch (e) {} result.draftKept = !!draft;
      } else {
        G = fix(JSON.parse(game)); applyMeta(); window.reloadGame = () => {};
        if (phase === 'skills') {
          const todo = G.chars.filter(c => !c.alt && (c.skillGenerationWarning || !c.skillDesignLog || !c.skillDesignLog.length));
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
    }, { phase, responses, input, game, stages, direction, settleMs });
  }, { tag });
}
