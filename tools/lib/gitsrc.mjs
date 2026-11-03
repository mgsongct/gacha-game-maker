// git 기준 트리의 src/만 tools/out/ref-src/<sha>/에 풀어 두고(캐시) 최상위 함수 키·프로퍼티 이름을 뽑음 — wiring.mjs·names.mjs가 같이 씀
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { loadUnits } from './source.mjs';
import { buildGraph } from './graph.mjs';
import { allProps } from './wiring.mjs';

export async function srcAt(ROOT, OUT, ref) { const sha = execSync(`git rev-parse --verify ${JSON.stringify(ref + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim(), dir = join(OUT, 'ref-src', sha), cache = join(dir, 'names.json');
  if (existsSync(cache)) return { sha, ...JSON.parse(readFileSync(cache, 'utf8')) };
  mkdirSync(dir, { recursive: true }); execSync(`git archive ${sha} src | tar -x -C ${JSON.stringify(dir)}`, { cwd: ROOT });
  const units = await loadUnits(dir), { fns } = buildGraph(units), r = { fns: [...fns.values()].filter(f => f.top).map(f => f.key), props: [...allProps(units)] };
  writeFileSync(cache, JSON.stringify(r)); return { sha, ...r }; }
