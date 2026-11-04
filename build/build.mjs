#!/usr/bin/env node
// src/ → www/index.html 하나로 합치기 (TiddlyWiki식 단일 파일 빌드). 의존성 없음, Node 18+.
//   node build/build.mjs            빌드 + version.json의 build·sha256 갱신
//   node build/build.mjs --check    빌드 결과가 www/index.html과 같은지만 확인(다르면 exit 1)
//   node build/build.mjs --src D --out F --no-version   (테스트용)
//   node build/build.mjs --zip      PC 서버 배포본 gacha-game-maker-pc.zip을 pc/의 실행 파일로 다시 묶음
//   --check는 배포본도 봄: version.json의 build·sha256이 www/index.html과 맞는지, zip이 pc/ 실행 파일과 같은지, README.txt에 서버 버전이 있는지
//
// src/index.html 템플릿 지시어 (한 줄 전체를 차지):
//   <!--@ path -->                파일 내용을 그대로 넣음. path가 /로 끝나면 폴더 안 파일을 이름순으로 이어 붙임(하위 폴더 포함)
//   <!--@modules dir id-prefix -->  폴더 안 파일마다 <script type="text/ggm-module" id="<id-prefix><이름>"> 블록 생성
//                                  (파일명 앞 숫자- 와 .js 는 id에서 뺌: 020-catalog.js → ggm-combat-catalog)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { zipWrite, zipRead } from './zip.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// PC 서버 배포본: 원본 배포 zip과 같은 구성(실행 파일 + 안내). 앱(www/)은 서버를 켤 때 GitHub에서 받음
export const PC_FILES = ['ggm-server.py', 'start.sh', 'PC서버-시작.bat', 'README.txt'], PC_ZIP = 'gacha-game-maker-pc.zip';
// 배포본 점검: [이름, 맞나, 다르면 할 일]
export function releaseCheck(root, html) { const out = [], sha = createHash('sha256').update(html).digest('hex'), built = (html.match(/var BUILT='([^']+)'/) || [])[1];
  const v = existsSync(join(root, 'version.json')) ? JSON.parse(readFileSync(join(root, 'version.json'), 'utf8')) : {};
  out.push(['version.json build = BUILT', v.build === built, `node build/build.mjs (지금 ${v.build} · BUILT ${built})`], ['version.json sha256 = www/index.html', v.sha256 === sha, 'node build/build.mjs']);
  const z = existsSync(join(root, PC_ZIP)) ? zipRead(readFileSync(join(root, PC_ZIP))) : new Map(), names = [...z.keys()].sort().join(','), want = [...PC_FILES].sort().join(',');
  out.push([`${PC_ZIP} 구성 = ${PC_FILES.join(' · ')}`, names === want, `node build/build.mjs --zip (지금 ${names || '없음'})`]);
  for (const f of PC_FILES) out.push([`${PC_ZIP}의 ${f} = pc/${f}`, !!z.get(f) && existsSync(join(root, 'pc', f)) && Buffer.compare(z.get(f), readFileSync(join(root, 'pc', f))) === 0, 'node build/build.mjs --zip']);
  const sv = (readFileSync(join(root, 'pc/ggm-server.py'), 'utf8').match(/SERVER_VER = '([^']+)'/) || [])[1]; out.push([`pc/README.txt에 서버 버전 ${sv}`, !!sv && readFileSync(join(root, 'pc/README.txt'), 'utf8').includes(sv), 'pc/README.txt에 바뀐 점과 버전을 적기']);
  return out; }
const DIRECTIVE = /^<!--@(modules)?\s+(\S+)(?:\s+(\S+))?\s*-->$/;

const files = dir => readdirSync(dir).filter(f => !f.startsWith('.') && statSync(join(dir, f)).isFile()).sort();
// 폴더 포함: 이름순, 하위 폴더는 그 자리에서 다시 이름순으로 (main/0510-actions/ → 0500 다음, 0520 앞)
const tree = dir => readdirSync(dir).filter(f => !f.startsWith('.')).sort().flatMap(f => statSync(join(dir, f)).isDirectory() ? tree(join(dir, f)) : [join(dir, f)]);
const text = f => {
  const s = readFileSync(f, 'utf8');
  if (s && !s.endsWith('\n')) throw Error(`줄바꿈으로 끝나야 해요: ${f}`);
  return s;
};

export function build(src) {
  const lines = readFileSync(join(src, 'index.html'), 'utf8').split('\n');
  let out = '';
  lines.forEach((line, i) => {
    const m = line.match(DIRECTIVE);
    if (!m) { out += line + (i < lines.length - 1 ? '\n' : ''); return; }
    const [, modules, path, prefix] = m, p = join(src, path);
    if (!existsSync(p)) throw Error(`없는 경로: ${path} (src/index.html ${i + 1}줄)`);
    if (modules) {
      if (!prefix) throw Error(`id 접두사가 필요해요: ${line}`);
      for (const f of files(p)) {
        const id = prefix + f.replace(/^\d+-/, '').replace(/\.js$/, '');
        if (!/^[a-z0-9-]+$/.test(id)) throw Error(`모듈 파일 이름은 영문 소문자·숫자·-만 써요: ${f}`);
        out += `<script type="text/ggm-module" id="${id}">\n${text(join(p, f))}</script>\n`;
      }
    } else out += path.endsWith('/') ? tree(p).map(text).join('') : text(p);
  });
  return out;
}

// 구문 검사: 빌드한 HTML의 스크립트 블록(main·모듈·부트 — 일반 스크립트로 도는 것)마다 실제 JS 엔진으로 컴파일해 봄. tree-sitter 분석은 오류에 너그러워
//   async 아닌 함수 속 await 같은 것을 놓치고, 그러면 앱이 아예 안 뜸. 오류 줄이 든 src 파일도 찾아 줌(src가 있으면)
export function syntaxErrors(html, src) { const out = [], re = /<script([^>]*)>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) { const attrs = m[1], code = m[2], type = (attrs.match(/type="([^"]+)"/) || [])[1] || ''; if (/\bsrc=/.test(attrs) || (type && !/^(text\/javascript|text\/ggm-module|text\/ggm-main)$/.test(type)) || !code.trim()) continue;
    try { new vm.Script(code, { filename: 'script' }); } catch (e) { const line = +((String(e.stack).match(/script:(\d+)/) || [])[1] || 0), text = (code.split('\n')[line - 1] || '').trim(), id = (attrs.match(/id="([^"]+)"/) || [])[1] || '(이름 없는 스크립트)';
      const file = src && text ? tree(src).find(f => /\.js$/.test(f) && readFileSync(f, 'utf8').includes(text.slice(0, 120))) : null; out.push({ id, line, msg: e.message, file: file ? file.replace(ROOT + '/', '') : '', text: text.slice(0, 160) }); } }
  return out; }
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const src = resolve(arg('--src', join(ROOT, 'src'))), outFile = resolve(arg('--out', join(ROOT, 'www/index.html')));
  const html = build(src), sha = createHash('sha256').update(html).digest('hex');
  const se = syntaxErrors(html, src); if (se.length) { se.forEach(x => console.log(`구문 오류: ${x.id} ${x.line}줄${x.file ? ` (${x.file})` : ''} — ${x.msg}\n  ${x.text}`)); console.log('빌드하지 않았어요 — 구문 오류를 고치세요'); process.exit(1); }
  if (process.argv.includes('--zip')) { writeFileSync(join(ROOT, PC_ZIP), zipWrite(PC_FILES.map(f => ({ name: f, data: readFileSync(join(ROOT, 'pc', f)) })))); console.log(`배포본: ${PC_ZIP} ← pc/${PC_FILES.join(', pc/')}`); process.exit(0); }
  if (process.argv.includes('--check')) {
    const same = existsSync(outFile) && readFileSync(outFile, 'utf8') === html;
    console.log(same ? `OK: ${outFile}와 같아요 (sha256 ${sha})` : `다름: ${outFile}을(를) 다시 빌드해야 해요`);
    const rel = outFile === join(ROOT, 'www/index.html') ? releaseCheck(ROOT, html) : []; rel.filter(r => !r[1]).forEach(([n, , fix]) => console.log(`다름: ${n} — ${fix}`)); if (rel.length && rel.every(r => r[1])) console.log(`OK: 배포본(version.json · ${PC_ZIP} · pc/README.txt) ${rel.length}개 항목`);
    process.exit(same && rel.every(r => r[1]) ? 0 : 1);
  }
  writeFileSync(outFile, html);
  console.log(`빌드: ${outFile} (${Buffer.byteLength(html).toLocaleString()} bytes, sha256 ${sha})`);
  const vf = join(ROOT, 'version.json');
  if (!process.argv.includes('--no-version') && existsSync(vf)) {
    const v = JSON.parse(readFileSync(vf, 'utf8')), built = (html.match(/var BUILT='([^']+)'/) || [])[1];
    // ponytail: build·sha256만 맞춤. notes·apk·at은 릴리스할 때 손으로.
    if (built) v.build = built;
    v.sha256 = sha;
    writeFileSync(vf, JSON.stringify(v, null, 2));
    console.log(`version.json: build ${v.build}, sha256 갱신`);
  }
}
