#!/usr/bin/env node
// 생성기 견고성(실패 주입): 고정 게임(fixtures/mini)의 응답을 바탕으로, 글 AI가 흔히 내는 실패를 한 가지씩 넣어 새 게임 생성을 돌리고
// "게임이 만들어졌는지 · 무엇이 잘못 남았는지 · 호출이 몇 번 나갔는지 · 사용자에게 무엇이 보였는지"를 표로 남겨요.
//   node tools/play/faults.mjs [시나리오…]  → tools/play/reports/faults.md · faults.json
// 시나리오: ok · badjson_world · thinworld · fewchars · nochapter · opening_timeout · chars_network
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGenerate } from './lib/generate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), FIX = join(HERE, 'fixtures/mini'), base = {};
for (const f of readdirSync(join(FIX, 'responses'))) base[f.slice(0, -4)] = readFileSync(join(FIX, 'responses', f), 'utf8');
const input = JSON.parse(readFileSync(join(FIX, 'input.json'), 'utf8')), J = s => JSON.parse(s);
const httpErr = (status, type, message) => ({ status, text: JSON.stringify({ type: 'error', error: { type, message } }) });
const SCEN = {
  ok: { desc: '정상 응답', resp: {} },
  badjson_world: { desc: '세계관 응답이 계속 JSON이 아님', resp: { world: '세계관은 다음과 같습니다: 제목은 시험등대이고…' } },
  thinworld: { desc: '세계관 응답에 플롯·설정·세력이 없음', resp: { world: JSON.stringify((w => { delete w.world.plot; delete w.world.lore; delete w.world.factions; return w; })(J(base.world))) } },
  fewchars: { desc: '대원 4명 요청에 3명(이름 중복·없는 역할·등급 9·80자 이름·모르는 세력·빈 프로필)', resp: { chars: JSON.stringify({ chars: [{ ...J(base.chars).chars[0], role: 'healer', rarity: 9 }, J(base.chars).chars[0], { ...J(base.chars).chars[1], name: '가'.repeat(80), faction: '없는세력', profile: '' }] }) } },
  nochapter: { desc: '1장 응답이 빈 객체', resp: { chapter1: '{}' } },
  opening_timeout: { desc: '오프닝 요청 시간 초과(504)', resp: { opening: httpErr(504, 'timeout_error', 'upstream timeout') } },
  chars_network: { desc: '대원 요청 서버 오류(500)', resp: { chars: httpErr(500, 'api_error', 'internal error') } },
};
const pick = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCEN), rows = [];
for (const name of pick) {
  const sc = SCEN[name]; if (!sc) { console.log('모르는 시나리오:', name); continue; }
  const { out, errors } = await runGenerate({ phase: 'new', input, responses: { ...base, ...sc.resp }, tag: 'faults-' + name, settleMs: 5000 });
  const g = out.game, calls = out.log.length, skill = out.log.filter(x => /^skill-/.test(x.kind)).length;
  const row = { name, desc: sc.desc, saved: !!g, calls, skillCalls: skill, commitAtCall: out.commitAtCall ?? null, draftKept: out.draftKept, toasts: [...new Set(out.toasts)].slice(0, 4), toastRepeats: out.toasts.length - new Set(out.toasts).size, pageErrors: errors.length };
  if (g) { const ch = g.chars.filter(c => !c.alt); Object.assign(row, { title: g.meta.title, plot: String(g.world.plot || '').slice(0, 40), factions: (g.world.factions || []).map(f => f.name).join(', '), chars: ch.map(c => `${c.name.slice(0, 10)}(${c.role},${c.rarity})`).join(' '), skillPending: ch.filter(c => c.skillGenerationWarning).length }); }
  rows.push(row); console.log(`${name}: 저장 ${row.saved} · 호출 ${calls}(스킬 ${skill}) · 알림 반복 ${row.toastRepeats}${g ? ` · 플롯 "${row.plot}" · 임시 스킬 ${row.skillPending}/${g.chars.length}` : ''}`);
}
mkdirSync(join(HERE, 'reports'), { recursive: true }); writeFileSync(join(HERE, 'reports/faults.json'), JSON.stringify(rows, null, 1));
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
writeFileSync(join(HERE, 'reports/faults.md'), [`# 생성기 실패 주입 결과`, '', `생성: \`node tools/play/faults.mjs\` · ${new Date().toISOString().slice(0, 16)} · 기준 응답: \`tools/play/fixtures/mini\``, '',
  t(['시나리오', '내용', '게임 저장', '호출(스킬)', '저장 시점(호출 순번)', '초안 남음', '같은 알림 반복', '임시 스킬', '저장된 플롯·세력·대원'], rows.map(r => [r.name, r.desc, r.saved ? '예' : '아니오', `${r.calls}(${r.skillCalls})`, r.commitAtCall ?? '-', r.draftKept ? '예' : '아니오', r.toastRepeats, r.saved ? `${r.skillPending}명` : '-', r.saved ? `${r.plot}… / ${r.factions} / ${r.chars}` : '-'])), '',
  '알림(시나리오별 앞 4개):', ...rows.map(r => `- ${r.name}: ${r.toasts.join(' / ') || '없음'}`), ''].join('\n'));
console.log('→ tools/play/reports/faults.md');
