#!/usr/bin/env node
// 단일 index.html → src/ 파트들로 나누기. 원본(upstream) 새 릴리스를 받아올 때 씀.
//   node build/split.mjs [입력 html=www/index.html] [출력 폴더=src]
// 출력 폴더를 통째로 다시 만들어요. src를 직접 고쳤다면 먼저 커밋해 두고 diff로 합치세요.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ggm-main 섹션 제목 → 파일 이름. 없는 제목은 part로 이름 붙어요(나중에 여기 추가).
const NAMES = {
  '규칙과 형식': 'rules', 'AI 연결': 'ai-connect', 'CHARACTER_REGEN_MODULE': 'character-regen', '소리': 'sound',
  '기본 콘텐츠': 'default-content', '유틸': 'util', '저장': 'save', 'STORAGE_INTEGRATION_MODULE': 'storage-integration',
  '성장': 'growth', '메신저': 'messenger', '도전': 'challenge-raid', '심연 탐사 v2': 'abyss', '선물': 'gift',
  '신규 픽업 만들기': 'pickup-new', '기존 대원 픽업': 'pickup-existing', '갠톡': 'free-chat', '렌더': 'render',
  'UI_SCROLL_MODULE': 'ui-scroll', '상점': 'shop', '자동 스킨 상점': 'skin-shop', '처음 실행 설정': 'setup',
  '우편함': 'mail', '모달': 'modal', '성장 곡선': 'growth-curve', '스토리 공장': 'story-factory',
  '새 게임 초안': 'new-game-draft', '스킨 제안': 'skin-proposal', '라이브 운영': 'live-ops',
  '시즌 로테이션': 'season-rotation', '도감': 'codex', 'AI가 새로 만든 것 그림': 'art-after-ai',
  '그림체': 'art-style', '캐스팅': 'casting', '한 번에 한 기기만 플레이': 'single-device-lease',
  '켤 때 자동으로 최신 게임 받기': 'boot-sync', 'PC 서버': 'pc-server', '시작할 때 게임 고르기': 'game-picker',
  '아이폰·웹': 'ios-web', 'PC·폰 연동': 'github-sync', '게임 게시·구독': 'publish-subscribe', 'PC 화면': 'desktop',
  '앱 업데이트': 'app-update', 'UPDATE_GUIDANCE_MODULE': 'update-guidance', 'AI': 'ai-context',
  '인물 관계도': 'relations-memory', '대본 엔진': 'script-engine', '타이틀과 오프닝': 'title-opening', '전투': 'battle',
  '보스 패턴': 'boss-patterns', '계약 연출': 'gacha', '이벤트': 'actions', 'BACKUP_STORAGE_MODULE': 'backup-storage',
  'STORY_MEMORY_MODULE': 'story-memory', '시작': 'start', '독립 앱 전용': 'standalone-app',
  'IMAGE_CANDIDATES_MODULE': 'image-candidates', 'MODAL_NAV_MODULE': 'modal-nav',
};
const nameOf = title => {
  const t = title.trim(), keys = Object.keys(NAMES).sort((a, b) => b.length - a.length);
  return NAMES[t] || NAMES[keys.find(k => t.startsWith(k + ':') || t.startsWith(k + ' ') || t.startsWith(k + '(') || t === k)] || 'part';
};
// 섹션 시작: 3줄 큰 제목(/* ====), 한 줄 제목(/* ===== X =====), 모듈 표식(/* X_MODULE */)
function sectionTitle(lines, i) {
  const l = lines[i];
  if (/^\/\* =+$/.test(l)) return lines[i + 1] || '';
  let m = l.match(/^\/\* ={3,} (.+?) ={3,}/); if (m) return m[1];
  m = l.match(/^\/\* ([A-Z_]+_MODULE) \*\//); return m ? m[1] : null;
}
const lines2text = b => b.length ? b.join('\n') + '\n' : '';
const pad = n => String(n).padStart(4, '0');

export function split(html, out) {
  if (html.includes('\r')) throw Error('CRLF 줄바꿈은 지원하지 않아요');
  const lines = html.split('\n'), tpl = [], put = (path, body) => {
    mkdirSync(dirname(join(out, path)), { recursive: true }); writeFileSync(join(out, path), body);
  };
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const block = start => { // start = 여는 태그 줄. 닫는 태그 앞까지 내용 반환
    const close = lines[start].startsWith('<style') ? '</style>' : '</script>';
    let end = start + 1; while (lines[end] !== close) { if (end >= lines.length) throw Error(`닫는 태그 없음: ${start + 1}줄`); end++; }
    return { body: lines.slice(start + 1, end), end };
  };
  let i = 0, run = null;
  const endRun = () => { if (run) { tpl.push(`<!--@modules modules/${run.dir}/ ggm-${run.dir}- -->`); run = null; } };
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^<script type="text\/ggm-module" id="ggm-([a-z0-9]+)-([a-z0-9-]+)">$/))) {
      const { body, end } = block(i), [, dir, name] = m;
      if (run && run.dir !== dir) endRun();
      run = run || { dir, n: 0 };
      put(`modules/${dir}/${pad(run.n += 10).slice(1)}-${name}.js`, lines2text(body));
      i = end + 1; continue;
    }
    endRun();
    if (l === '<style>') { const { body, end } = block(i); put('style/app.css', lines2text(body)); tpl.push(l, '<!--@ style/app.css -->', '</style>'); i = end + 1; continue; }
    if (l === '<script>') { const { body, end } = block(i); put('boot/head.js', lines2text(body)); tpl.push(l, '<!--@ boot/head.js -->', '</script>'); i = end + 1; continue; }
    if ((m = l.match(/^<script id="ggm-([a-z0-9-]+)">$/))) { const { body, end } = block(i), p = `boot/${m[1]}.js`; put(p, lines2text(body)); tpl.push(l, `<!--@ ${p} -->`, '</script>'); i = end + 1; continue; }
    if (l === '<script type="text/ggm-main" id="ggm-main">') {
      const { body, end } = block(i); let start = 0, n = 0, title = '';
      const flush = to => { if (to > start) put(`main/${pad(n += 10)}-${nameOf(title)}.js`, lines2text(body.slice(start, to))); start = to; };
      body.forEach((_, k) => { const t = sectionTitle(body, k); if (t !== null && k > 0) { flush(k); title = t; } else if (t !== null) title = t; });
      flush(body.length); tpl.push(l, '<!--@ main/ -->', '</script>'); i = end + 1; continue;
    }
    tpl.push(l); i++;
  }
  endRun();
  writeFileSync(join(out, 'index.html'), tpl.join('\n'));
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const input = resolve(process.argv[2] || join(ROOT, 'www/index.html')), out = resolve(process.argv[3] || join(ROOT, 'src'));
  split(readFileSync(input, 'utf8'), out);
  console.log(`나눔: ${input} → ${out}`);
}
