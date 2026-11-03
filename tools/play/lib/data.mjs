// 분석에 쓰는 게임 데이터 읽기: 게임은 PC 서버 폴더(저장소의 pc/ — PC서버-시작.bat과 같은 경로)의 data/<게임id>/<종류>.json
// (앱 dataSplit·서버 save_games와 같은 배치 — 종류별 JSON + game.json(나머지 키)). 합치는 법은 앱 dataJoin·서버 load_state와 같음.
// tools/play/games/<이름>/은 그 게임의 생성 입력·프롬프트·응답·실행 기록(runs.json — 마지막으로 저장한 게임 id)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PC_DIR } from './page.mjs';

export const hasGame = (pcHome, gid) => existsSync(join(pcHome, 'data/index.json')) && existsSync(join(pcHome, 'ggm-data/state.json')) && (!gid || existsSync(join(pcHome, 'data', gid, 'game.json')));
export function gidOf(dir) { const f = join(dir, 'runs.json'); if (!existsSync(f)) return null; const r = JSON.parse(readFileSync(f, 'utf8')).filter(x => x.saved && x.saved.gid).pop(); return r ? r.saved.gid : null; }
export function listGames(pcHome = PC_DIR) { const f = join(pcHome, 'data/index.json'); return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')).list || []).filter(x => x.id !== 'main' && existsSync(join(pcHome, 'data', x.id, 'game.json'))) : []; } // main = 앱 기본(샘플) 게임
export function readGame(pcHome, gid) {
  const D = join(pcHome, 'data'), ix = JSON.parse(readFileSync(join(D, 'index.json'), 'utf8')); gid = gid || ix.active;
  const d = join(D, gid); if (!existsSync(join(d, 'game.json'))) throw new Error(`게임 폴더가 없어요: ${d}`);
  const game = JSON.parse(readFileSync(join(d, 'game.json'), 'utf8'));
  for (const f of readdirSync(d)) if (f.endsWith('.json') && f !== 'game.json' && f !== 'media.json') game[f.slice(0, -5)] = JSON.parse(readFileSync(join(d, f), 'utf8'));
  return { gid, game, title: ((ix.list || []).find(x => x.id === gid) || {}).title || (game.meta || {}).title || gid };
}
