#!/usr/bin/env node
// 생성된 게임을 새 플레이어로 화면에서 플레이하며 캡처(412×860, 그림 AI 없음 기준):
//   로비 → 계약 → 첫 10연(연출 중·후) → 대원 → 캐릭터 시트 → 작전 → 1장 첫 스테이지 대본 → 전투(3배속) → 메신저
//   node tools/play/shots.mjs <게임 폴더> [game.json]  → <게임 폴더>/shots/NN-이름.png · shots/play.json(화면 글·오류)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { withPage } from './lib/page.mjs';

const dir = resolve(process.argv[2] || ''), file = process.argv[3] || 'game.json';
if (!process.argv[2] || !existsSync(join(dir, file))) { console.log('사용법: node tools/play/shots.mjs <게임 폴더> [game.json]'); process.exit(2); }
const game = readFileSync(join(dir, file), 'utf8'), outDir = join(dir, 'shots'); mkdirSync(outDir, { recursive: true });
const { out, errors } = await withPage(async page => {
  const log = {}, shot = name => page.screenshot({ path: join(outDir, name + '.png') }), text = sel => page.evaluate(s => (document.querySelector(s)?.innerText || '').replace(/\s+/g, ' ').slice(0, 400), sel);
  await page.evaluate(game => { closeModal(); closeOv(); G = fix(JSON.parse(game)); applyMeta(); P().owned = {}; P().squad = []; P().firstTen = true; P().seenOpening = true; P().gems = Math.max(P().gems, 3000); window.reloadGame = () => {}; tab = 'lobby'; render(); }, game);
  await page.waitForTimeout(500); await shot('01-lobby'); log.lobby = await text('#view');
  await page.evaluate(() => { tab = 'contract'; render(); }); await page.waitForTimeout(400); await shot('02-contract'); log.contract = await text('#view');
  await page.evaluate(() => pull(10)); await page.waitForTimeout(1500);
  for (let i = 0; i < 30; i++) { if (!(await page.evaluate(() => !document.getElementById('ov').hidden))) break; if (i === 4) await shot('03-gacha'); await page.mouse.click(206, 700); await page.waitForTimeout(350); }
  await shot('04-after-gacha'); log.owned = await page.evaluate(() => Object.keys(P().owned).map(id => charById(id)?.name));
  await page.evaluate(() => { closeOv(); tab = 'crew'; render(); }); await page.waitForTimeout(400); await shot('05-crew');
  await page.evaluate(() => openChar(P().squad[0] || G.chars[0].id)); await page.waitForTimeout(500); await shot('06-char'); log.char = await text('#modal');
  await page.evaluate(() => { closeModal(); tab = 'ops'; render(); }); await page.waitForTimeout(400); await shot('07-ops'); log.ops = await text('#view');
  await page.evaluate(() => { const ch = G.chapters.find(c => c.kind === 'main'), s = ch.stages[0]; playStory(s.title, s.pre || '', () => {}); });
  await page.waitForTimeout(800); await shot('08-story');
  for (let i = 0; i < 5; i++) { await page.mouse.click(206, 650); await page.waitForTimeout(450); } await shot('09-story-later'); log.story = await text('#ov');
  await page.evaluate(() => { try { vnEnd(); } catch (e) {} closeOv(); const ch = G.chapters.find(c => c.kind === 'main'), s = ch.stages.find(x => (x.enemies || []).length && !x.mode) || ch.stages[0]; P().settings.bspeed = 3; startBattle(ch.id, s.id); });
  await page.waitForTimeout(3500); await shot('10-battle'); await page.waitForTimeout(15000); await shot('11-battle-later'); log.battle = await text('#ov');
  await page.evaluate(() => { closeOv(); try { openPhone(); } catch (e) {} }); await page.waitForTimeout(600); await shot('12-phone');
  // 특수 스테이지(콘테스트·회담)가 있으면 열어서 첫 화면과 선택 몇 번 뒤를 캡처
  const mode = await page.evaluate(() => { try { closePhone && closePhone(); } catch (e) {} closeOv(); closeModal(); for (const ch of G.chapters) for (const s of ch.stages || []) if (s.mode === 'contest' || s.mode === 'debate') { startBattle(ch.id, s.id); return s.mode + ':' + s.title; } return ''; });
  if (mode) { await page.waitForTimeout(1200); await shot('13-mode'); log.mode = mode + ' | ' + await text('#ov') + ' | ' + await text('#modal');
    for (let i = 0; i < 4; i++) { const b = await page.$('#ov button:not([disabled]), #modal button:not([disabled])'); if (!b) break; await b.click().catch(() => {}); await page.waitForTimeout(700); } await shot('14-mode-later'); log.modeLater = await text('#ov') + ' | ' + await text('#modal'); }
  return log;
}, { tag: 'shots', viewport: { width: 412, height: 860 } });
writeFileSync(join(outDir, 'play.json'), JSON.stringify({ log: out, errors }, null, 1));
console.log(`캡처: ${outDir} (페이지 오류 ${errors.length})`);
