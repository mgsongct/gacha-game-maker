// 분석 대상 불러오기: 빌드(build/build.mjs)와 같은 순서로 src/main/을 한 스크립트로 이어 붙이고(줄 → 원본 파일 지도),
// 모듈(src/modules/**)·부트(src/boot/*.js)는 파일마다 따로 파싱. tree-sitter(web-tree-sitter) 트리와 ast-grep 루트를 함께 만든다.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { Parser, Language } from 'web-tree-sitter';
import { parse as sgParse, Lang } from '@ast-grep/napi';

const req = createRequire(import.meta.url);
const tree = d => readdirSync(d).filter(f => !f.startsWith('.')).sort().flatMap(f => statSync(join(d, f)).isDirectory() ? tree(join(d, f)) : [join(d, f)]);
let parser = null, JS = null;
export async function tsInit() { if (parser) return { parser, JS }; await Parser.init(); JS = await Language.load(req.resolve('tree-sitter-javascript/tree-sitter-javascript.wasm')); parser = new Parser(); parser.setLanguage(JS); return { parser, JS }; }

function unit(root, name, parts) { // parts: [{path, text}]
  let text = '', row = 0; const files = [];
  for (const p of parts) { const n = p.text.split('\n').length - 1; files.push({ path: relative(root, p.path), start: row, end: row + n }); text += p.text; row += n; }
  const t = parser.parse(text), at = r => { const f = files.find(x => r >= x.start && r < x.end) || files.at(-1); return { file: f.path, line: r - f.start + 1 }; };
  return { name, text, files, tree: t, sg: sgParse(Lang.JavaScript, text).root(), at, loc: node => { const p = at(node.startPosition.row); return `${p.file}:${p.line}`; } };
}
export async function loadUnits(root) {
  await tsInit(); const src = join(root, 'src'), read = p => ({ path: p, text: readFileSync(p, 'utf8') }), units = [];
  units.push(unit(root, 'main', tree(join(src, 'main')).filter(f => f.endsWith('.js')).map(read)));
  if (existsSync(join(src, 'modules'))) tree(join(src, 'modules')).filter(f => f.endsWith('.js')).forEach(f => units.push(unit(root, 'module:' + relative(src, f), [read(f)])));
  if (existsSync(join(src, 'boot'))) tree(join(src, 'boot')).filter(f => f.endsWith('.js')).forEach(f => units.push(unit(root, 'boot:' + relative(src, f), [read(f)])));
  return units;
}
// 빌드된(또는 원안) index.html 한 파일을 바로 읽음(사용자 지시 U21 — 재설계의 입력은 index.html): 스크립트 블록마다 단위 —
//   ggm-main(text/ggm-main) → main · ggm-module 블록 → module:<id> · 그 밖의 인라인 스크립트 → boot:<id 또는 순번>. 위치는 index.html#<id>:줄
export async function loadHtmlUnits(html, label = 'index.html') { await tsInit(); const units = [], re = /<script([^>]*)>([\s\S]*?)<\/script>/g; let m, i = 0;
  while ((m = re.exec(html))) { const attrs = m[1], code = m[2], type = (attrs.match(/type="([^"]+)"/) || [])[1] || '', id = (attrs.match(/id="([^"]+)"/) || [])[1] || `script${++i}`; if (/\bsrc=/.test(attrs) || !code.trim() || (type && !/^(text\/javascript|text\/ggm-module|text\/ggm-main|module)$/.test(type))) continue;
    const name = type === 'text/ggm-main' || id === 'ggm-main' ? 'main' : type === 'text/ggm-module' ? 'module:' + id : 'boot:' + id; units.push(unit('/', name, [{ path: `/${label}#${id}`, text: code.endsWith('\n') ? code : code + '\n' }])); }
  return units; }
// 메타 점검 대상: 도구 자신(tools/**, build/*.mjs)도 앱과 같은 품질 규칙(빈 catch·복잡도·다중화·되풀이 문자열·안 쓰는 함수)으로 봄 — 파일마다 따로
export async function loadToolUnits(root) {
  await tsInit(); const read = p => ({ path: p, text: readFileSync(p, 'utf8') }), skip = /(^|[\\/])(node_modules|out|fixtures|games|reports)[\\/]/;
  const files = [...(existsSync(join(root, 'tools')) ? tree(join(root, 'tools')) : []), ...(existsSync(join(root, 'build')) ? tree(join(root, 'build')) : [])].filter(f => /\.(mjs|js)$/.test(f) && !skip.test(relative(root, f))); // 건너뛰기는 루트 기준 경로로(기준 트리를 tools/out/ref/ 아래에 풀어도 그 트리의 도구를 잼)
  return files.map(f => unit(root, 'tool:' + relative(root, f), [read(f)]));
}
// tree-sitter 노드 순회
export function walk(node, fn, depth = 0) { if (fn(node, depth) === false) return; for (let i = 0; i < node.childCount; i++) walk(node.child(i), fn, depth + 1); }
