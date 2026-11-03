#!/usr/bin/env node
// 생성된 게임 QA·플레이 점검: game.json을 앱에 불러와
//   ① 구성(요청 대비 결과) ② 기본값 섞임·정합성 ③ 앱 자체 점검(콘텐츠 점검·개성·시나리오·세력·밸런스·그림 가드)
//   ④ 대본 QA(화자·첫 등장·배경/음악·분량·영어 섞임) ⑤ 새 플레이어로 플레이(첫 10연 → 편성 → 메인 장 전투, 레벨 1·10·20 × 시드 20)
// 결과: <게임 폴더>/qa/<파일>.json · <파일>.md (발견 목록은 상·중·하)
//   node tools/play/qa.mjs <게임 폴더> [game.json]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { runQA, md } from './lib/qa.mjs';

const dir = resolve(process.argv[2] || ''), file = process.argv[3] || 'game.json';
if (!process.argv[2] || !existsSync(join(dir, file))) { console.log('사용법: node tools/play/qa.mjs <게임 폴더> [game.json]'); process.exit(2); }
const game = readFileSync(join(dir, file), 'utf8'), input = existsSync(join(dir, 'input.json')) ? JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')) : {};

const R = await runQA(game, input), name = basename(file, '.json'); mkdirSync(join(dir, 'qa'), { recursive: true });
writeFileSync(join(dir, 'qa', name + '.json'), JSON.stringify(R, null, 1)); writeFileSync(join(dir, 'qa', name + '.md'), md(R, name));
const n = s => R.findings.filter(f => f.sev === s).length;
console.log(`QA ${R.meta.title}: 발견 상 ${n('상')} · 중 ${n('중')} · 하 ${n('하')} → ${join(dir, 'qa', name + '.md')}`); R.findings.filter(f => f.sev !== '하').slice(0, 12).forEach(f => console.log(`  [${f.sev}] ${f.area}: ${f.msg}`));
