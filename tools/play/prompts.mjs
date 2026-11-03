#!/usr/bin/env node
// 생성 프롬프트 점검(프롬프트 스튜디오 관점): 게임 폴더의 prompts/(앱이 실제로 보낸 글)를
//   ① 스튜디오 조각(pfDef)으로 덮인 비율 vs 호출 지점에 하드코딩된 비율 ② 스튜디오 밖 큰 정적 덩어리(공통 규칙·스킬 작성 규칙)
//   ③ 여러 요청에 되풀이되는 덩어리(재사용·캐싱 후보) ④ 같은 지시의 중복 ⑤ 서로 충돌하는 지시 ⑥ 원본 샘플 이름 으로 나눠 봄
//   node tools/play/prompts.mjs [--regress] <게임 폴더…>  → tools/play/reports/prompts.md · prompts.json
//   --regress: 회귀 재생(regress.mjs)이 지금 빌드로 보낸 프롬프트(<게임 폴더>/regress/prompts)를 봄 → reports/prompts-regress.md · .json
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPage } from './lib/page.mjs';
import { readGame, gidOf } from './lib/data.mjs';
import { PC_DIR } from './lib/page.mjs';
import { promptConflicts } from './lib/conflicts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), RG = argv.includes('--regress'), dirs = argv.filter(a => a !== '--regress').map(d => resolve(d)), SUB = RG ? 'regress/prompts' : 'prompts', REP = RG ? 'prompts-regress' : 'prompts';
if (!dirs.length) { console.log('사용법: node tools/play/prompts.mjs [--regress] <게임 폴더…>'); process.exit(2); }
const out = [];
for (const dir of dirs) {
  const P = join(dir, SUB), files = readdirSync(P).filter(f => f.endsWith('.txt') && !/-\d+$/.test(f.slice(0, -4)) || /-1\.txt$/.test(f)).sort(), texts = Object.fromEntries(files.map(f => [f.slice(0, -4), readFileSync(join(P, f), 'utf8')]));
  const game = JSON.stringify(readGame(PC_DIR, gidOf(dir)).game), input = existsSync(join(dir, 'input.json')) ? JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')) : {};
  const { out: env } = await withPage(page => page.evaluate(game => { G = fix(JSON.parse(game)); applyMeta();
    const frags = Object.values(window.__PF || {}).map(f => ({ id: f.id, label: f.label, text: promptFrag(f.id) }));
    return { frags, rules: String(RULES), skill: String(pf('SKILL_RULE', GGMCombat.promptData())), sample: [...new Set([...(DEFAULT_WORLD.factions || []).map(f => f.name), ...(typeof DEFAULT_LIB !== 'undefined' ? DEFAULT_LIB : []).filter(l => ['bg', 'prop', 'bgm'].includes(l.kind)).map(l => l.name)])].filter(n => n && n.length >= 2) }; }, game), { tag: 'prompts' });
  const lineSet = t => new Set(t.split('\n').map(l => l.trim()).filter(l => l.length >= 30));
  const rows = Object.entries(texts).map(([k, t]) => {
    const used = env.frags.filter(f => f.text && f.text.length >= 20 && t.includes(f.text.trim().slice(0, 200))), fragChars = used.reduce((a, f) => a + Math.min(f.text.length, t.length), 0);
    const rulesIn = t.includes(env.rules.slice(0, 120)), skillIn = t.includes(env.skill.slice(0, 200)), json = (t.match(/JSON만 출력/g) || []).length;
    const fixed = (rulesIn ? env.rules.length : 0) + (skillIn ? env.skill.length : 0);
    return { kind: k, len: t.length, frags: used.map(f => f.id), fragPct: Math.round(100 * fragChars / t.length), rulesIn, skillIn, fixedPct: Math.round(100 * fixed / t.length), json, sample: env.sample.filter(n => t.includes(n)).length };
  });
  // 여러 요청에 되풀이되는 긴 줄(재사용·캐싱 후보)
  const occ = new Map(); for (const [k, t] of Object.entries(texts)) for (const l of lineSet(t)) { if (!occ.has(l)) occ.set(l, new Set()); occ.get(l).add(k); }
  const repeated = [...occ].filter(([l, ks]) => ks.size >= 2 && l.length >= 120).map(([l, ks]) => ({ chars: l.length, n: ks.size, head: l.slice(0, 70), frag: env.frags.find(f => f.text.includes(l.slice(0, 80)))?.id || (env.rules.includes(l.slice(0, 80)) ? 'RULES(조각 아님)' : env.skill.includes(l.slice(0, 80)) ? '스킬 규칙(조각 아님)' : '하드코딩') })).sort((a, b) => b.chars * b.n - a.chars * a.n);
  const all = Object.values(texts).join('\n'), conflicts = promptConflicts(all);
  const genreConflict = /전투 대신|전투 없|비전투/.test(input.auto || '') && /마지막 스테이지는 반드시 전투|반드시 전투\(battle/.test(all);
  out.push({ game: basename(dir), title: JSON.parse(game).meta.title, frags: env.frags.map(f => ({ id: f.id, label: f.label, chars: f.text.length, usedIn: rows.filter(r => r.frags.includes(f.id)).length })), rulesChars: env.rules.length, skillChars: env.skill.length, rows, repeated: repeated.slice(0, 15), conflicts, genreConflict });
}
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const md = [`# 생성 프롬프트 점검 (프롬프트 스튜디오 관점)`, '', `생성: \`node tools/play/prompts.mjs${RG ? ' --regress' : ''}\` · 프롬프트: ${SUB} · ${new Date().toISOString().slice(0, 16)} · 대상: ${out.map(o => `${o.game}(${o.title})`).join(', ')}`, '',
  '스튜디오 조각(`pfDef`)은 설정 → 프롬프트 스튜디오에서 게임마다 덮어쓰기·덧붙이기할 수 있는 부분입니다. 공통 규칙(`RULES`)과 스킬 작성 규칙(`GGMCombat.prompt()`)은 조각이 아니라 고칠 수 없습니다.', '',
  ...out.flatMap(o => [`## ${o.game} — ${o.title}`, '',
    `- 조각 ${o.frags.length}개(사용된 요청 수): ${o.frags.map(f => `${f.id} ${f.chars}자(${f.usedIn})`).join(', ')}`, `- 스튜디오 밖 정적 덩어리: 공통 규칙 RULES ${o.rulesChars}자 · 스킬 작성 규칙 ${o.skillChars}자`, '',
    t(['요청', '길이(자)', '조각 비율', '조각', 'RULES', '스킬 규칙', '고정 덩어리 비율', '"JSON만 출력" 횟수', '샘플 이름'], o.rows.map(r => [r.kind, r.len, r.fragPct + '%', r.frags.join(' '), r.rulesIn ? '예' : '', r.skillIn ? '예' : '', r.fixedPct + '%', r.json, r.sample || ''])), '',
    `### 여러 요청에 되풀이되는 긴 줄 (재사용·캐싱 후보)`, '', t(['길이', '요청 수', '어디서', '첫머리'], o.repeated.map(r => [r.chars, r.n, r.frag, r.head])), '',
    `### 충돌하는 지시`, '', ...(o.conflicts.length ? o.conflicts.map(c => `- **${c.name}** — ${c.desc}`) : ['- 없음']), o.genreConflict ? '- **장르 충돌** — 입력 아이디어가 "전투 대신/없음"인데 프롬프트가 전투를 강제' : '', '']), ''].join('\n');
mkdirSync(join(HERE, 'reports'), { recursive: true }); writeFileSync(join(HERE, `reports/${REP}.md`), md); writeFileSync(join(HERE, `reports/${REP}.json`), JSON.stringify(out, null, 1));
for (const o of out) console.log(`${o.game}: 요청 ${o.rows.length} · 평균 조각 비율 ${Math.round(o.rows.reduce((a, r) => a + r.fragPct, 0) / o.rows.length)}% · 고정 덩어리 비율 평균 ${Math.round(o.rows.reduce((a, r) => a + r.fixedPct, 0) / o.rows.length)}% · 되풀이 ${o.repeated.length} · 충돌 ${o.conflicts.length}${o.genreConflict ? '+장르' : ''}`);
console.log(`→ tools/play/reports/${REP}.md`);
