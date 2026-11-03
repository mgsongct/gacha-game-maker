#!/usr/bin/env node
// src/ → www/index.html 하나로 합치기 (TiddlyWiki식 단일 파일 빌드). 의존성 없음, Node 18+.
//   node build/build.mjs            빌드 + version.json의 build·sha256 갱신
//   node build/build.mjs --check    빌드 결과가 www/index.html과 같은지만 확인(다르면 exit 1)
//   node build/build.mjs --src D --out F --no-version   (테스트용)
//
// src/index.html 템플릿 지시어 (한 줄 전체를 차지):
//   <!--@ path -->                파일 내용을 그대로 넣음. path가 /로 끝나면 폴더 안 파일을 이름순으로 이어 붙임(하위 폴더 포함)
//   <!--@modules dir id-prefix -->  폴더 안 파일마다 <script type="text/ggm-module" id="<id-prefix><이름>"> 블록 생성
//                                  (파일명 앞 숫자- 와 .js 는 id에서 뺌: 020-catalog.js → ggm-combat-catalog)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const src = resolve(arg('--src', join(ROOT, 'src'))), outFile = resolve(arg('--out', join(ROOT, 'www/index.html')));
  const html = build(src), sha = createHash('sha256').update(html).digest('hex');
  if (process.argv.includes('--check')) {
    const same = existsSync(outFile) && readFileSync(outFile, 'utf8') === html;
    console.log(same ? `OK: ${outFile}와 같아요 (sha256 ${sha})` : `다름: ${outFile}을(를) 다시 빌드해야 해요`);
    process.exit(same ? 0 : 1);
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
