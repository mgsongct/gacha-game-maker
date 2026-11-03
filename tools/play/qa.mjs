#!/usr/bin/env node
// 생성된 게임 QA·플레이 점검: 게임 폴더의 pc/data(PC 서버 data 폴더 — 실제 저장 형식)에서 활성 게임을 읽어 앱에 불러와
//   ① 구성(요청 대비 결과) ② 기본값 섞임·정합성 ③ 앱 자체 점검(콘텐츠 점검·개성·시나리오·세력·밸런스·그림 가드)
//   ④ 대본 QA(화자·첫 등장·배경/음악·분량·영어 섞임) ⑤ 새 플레이어로 플레이(첫 10연 → 편성 → 메인 장 전투, 레벨 1·10·20 × 시드 20)
// 결과: <게임 폴더>/qa/<파일>.json · <파일>.md (발견 목록은 상·중·하)
//   node tools/play/qa.mjs <게임 폴더>   (게임 데이터는 pc/data/<그 폴더의 게임 id>)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { runQA, md, folderQA } from './lib/qa.mjs';
import { hasGame, readGame, gidOf } from './lib/data.mjs';
import { PC_DIR } from './lib/page.mjs';

const dir = resolve(process.argv[2] || ''), gid = process.argv[2] && gidOf(dir);
if (!gid || !hasGame(PC_DIR, gid)) { console.log('사용법: node tools/play/qa.mjs <게임 폴더> — pc/data에 그 폴더의 게임이 없어요'); process.exit(2); }
const G0 = readGame(PC_DIR, gid), game = JSON.stringify(G0.game), file = 'game', input = existsSync(join(dir, 'input.json')) ? JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')) : {};

const R = folderQA(dir, await runQA(game, input)), name = basename(file, '.json'); mkdirSync(join(dir, 'qa'), { recursive: true });
writeFileSync(join(dir, 'qa', name + '.json'), JSON.stringify(R, null, 1)); writeFileSync(join(dir, 'qa', name + '.md'), md(R, name));
const n = s => R.findings.filter(f => f.sev === s).length;
console.log(`QA ${R.meta.title}: 발견 상 ${n('상')} · 중 ${n('중')} · 하 ${n('하')} → ${join(dir, 'qa', name + '.md')}`); R.findings.filter(f => f.sev !== '하').slice(0, 12).forEach(f => console.log(`  [${f.sev}] ${f.area}: ${f.msg}`));
