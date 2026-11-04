/* ===== 0030-image — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 010-engine.js에서 ── */
/* CHARACTER_REGEN_MODULE */
// Partial regeneration stages a draft; only a confirmed, still-current draft can mutate saved data.
let REGEN=null,REGEN_JOB=null,IMGLIB=null;
const unFaceless=s=>String(s||'').replace(/(^|\s*,\s*)(1other\s*,\s*)?faceless\b/gi,(m,pre)=>pre||'').replace(/^[\s,]+/,'').trim();


const SKILL_TAGS={dmg:'attacking, slashing, weapon swing',aoe:'casting spell, magic circle, explosion, energy wave',heal:'casting spell, healing light, sparkles',shield:'magic barrier, shield, defensive stance',buff:'raising hand, aura, cheering, light rays'};
const NAI_HDR=tok=>({Authorization:'Bearer '+String(tok||'').trim(),'Content-Type':'application/json'});
/* ---- cut tool canvas helpers ---- */
const CUT_ZOOMS=[1,2,3,5,8];
const CUT_DEF={tol:30,soft:26,holes:false,despeck:true,shadow:true};

let NAI_TP_OFF=false;
/* 등장인물은 모두 성인이에요: 미성년으로 읽히는 태그는 그림 요청에서 빼요(직접 적은 태그·AI가 쓴 태그 모두) */
const MINOR_TAGS=/^(loli|lolicon|shota|shotacon|child|children|kid|kids|toddler|baby|infant|young child|young girl|young boy|little girl|little boy|preteen|pre-teen|underage|minor|teen|teens|teenage|teenager|aged down|elementary school student|middle school student|elementary schooler|middle schooler|kindergartener)$/i;
const stripMinor=s=>tagList(s).filter(t=>!MINOR_TAGS.test(tagKey(t))).join(', ');
/* src/main/0180-ui-scroll.js에서 옮김 */
/* 화풍 프리셋 편집 */
let CUTJOB=null;
let NPREP=null;
let NAIBATCH=null;
/* src/main/0260-new-game/010-draft.js에서 옮김 */
let FACESEL=new Set();
let FACEOPT=null;

/* ── 020-candidates.js에서 ── */
let IMAGE_CANDIDATES=null;
(function(){
 imageScrollGuard();
 const generate=naiGenerate,emotion=naiEmotion,inpaint=focusedInpaint;
 naiGenerate=function(prompt,kind,opts={}){if(!opts.candidateEligible||opts.candidateBypass)return generate(prompt,kind,opts);return imageCandidates(async cfg=>{const op={...opts,neg:cfg.neg,seed:cfg.seed};const blob=await generate(cfg.prompt,kind,op);Object.assign(opts,{usedSeed:op.usedSeed,usedModel:op.usedModel,usedTp:op.usedTp});return blob;},{prompt,promptBlocks:['char','illust','lbcg','enemy'].includes(kind),promptParts:opts.promptParts,neg:opts.neg,seed:opts.seed,originalSrc:opts.originalSrc,prepare:opts.prepareCandidates});};
 naiEmotion=function(src,emo,extra,level,eligible=false,originalSrc=''){if(!eligible)return emotion(src,emo,extra,level);return imageCandidates(cfg=>emotion(src,emo,cfg.prompt,level),{prompt:extra||'',originalSrc});};
 // Selection must compare the final full-size composition, never the cropped face.
 focusedInpaint=function(src,mask,draw,settings={}){if(!settings.candidateEligible)return inpaint(src,mask,(...args)=>draw(...args,settings));return imageCandidates(cfg=>inpaint(src,mask,(...args)=>draw(...args,cfg)),settings);};
 const thumbnails='#image-candidate-dialog img, .naiprev.done img, #v2-icon-dialog .ill-box img, .skp-img img, .cs-sheet [data-character-preview]';
 document.addEventListener('click',e=>{const img=e.target.closest?.(thumbnails);if(!img)return;e.preventDefault();e.stopImmediatePropagation();imagePreviewThumbnail(img);},true);
 document.addEventListener('keydown',e=>{if(document.getElementById('generated-image-preview')&&['Escape','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')imagePreviewClose();else document.getElementById('generated-image-preview')._move(e.key==='ArrowLeft'?-1:1);return;}const img=e.target.closest?.(thumbnails);if(img&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();imagePreviewThumbnail(img);return;}if(e.key==='Escape'&&IMAGE_CANDIDATES){e.preventDefault();e.stopImmediatePropagation();imageCandidateBack();}},true);
})();

/* /IMAGE_CANDIDATES_MODULE */

/* ── 0310-art-after-ai.js에서 ── */
/* ===== AI가 새로 만든 것 그림 ===== */
let ART_ASK=null;
const ART_ORDER=['char','upper','pose','lbbg','illust','scg','bg','enemy','icon','map','cg','prop','weapon'];

/* ── 0330-casting.js에서 ── */
/* ===== 캐스팅: 새 게임 오프닝 전에 캐릭터마다 전신·상반신을 그려 보여 주고, 마음에 들 때까지 다시 뽑고 확정해요 ===== */
let CAST=null;
/* NPC 관리: 이름·외모·그림 프롬프트를 고치고 스탠딩·상반신을 다시 그려요 */
const NPCBUSY=new Set();
const castById=id=>charById(id)||(G.npcs||[]).find(n=>n.id===id);
/* 표정 한꺼번에: 고른 캐릭터마다 얼굴 범위를 차례로 칠하고(이미 칠했으면 건너뜀), 고른 표정을 모두 인페인팅으로 줄 세워 그려요 */
let CFSEL=null;
document.addEventListener('click',e=>{ const im=e.target.closest&&e.target.closest('.cast-im img,.cast-fc img,.fc-it img,.fc-two img,.sk-slot img,.sk-face img,.skp-img img,.skinpkg .wthumb img'); if(im) imgViewer(im.src); });
setInterval(()=>{ if(CAST&&$('#castGrid')&&$('#modal').hidden&&!CAST.busy) castRefresh(); },4000);

/* ── 0565-asset-library.js에서 ── */
/* ===== 에셋 관리: 공유 보관함 · 사용처 · 중복 합치기 · 감정 아이콘 그림 ===== */
/* 게임마다 따로 있던 자료실(G.lib)을 게임끼리 재사용하게 해요.
   - 공유 보관함: 'ggm-shared-assets'(목록) + IDB 'shared::<id>'(그림·소리). 어느 게임에서 넣든 모든 게임에서 가져와요
   - 자동 재사용: 새 장 생성(addLib)·대본에서 찾은 자료(scanScriptAssets)가 그림 없이 생기면, 보관함에 같은 종류·이름이 있을 때 그대로 가져옴(shAdopt)
   - 사용처: 대본(스토리·톡·에피소드·메모리얼·일정)에서 이름을 세어 안 쓰는 자료를 보여 줌. 같은 프롬프트·이름 중복은 별칭(alias)으로 합침(그림 1장 공유)
   - 감정 아이콘(0462)의 그림을 직접 올려 바꿈(kind 'emote') · 문서 docs/research/direction.md */
const SH_KEY='ggm-shared-assets', SH_KINDS={bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'아이콘',emote:'감정 아이콘',bgm:'음악',sfx:'효과음'};
const shAudio=k=>k==='bgm'||k==='sfx';
const shCache={};

let AM_TAB='shared';
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, id=el.dataset.id;
  if(a==='amopen') openAssets();
  else if(a==='amtab') openAssets(el.dataset.k);
  else if(a==='amput'){ const l=G.lib.find(x=>x.id===id); if(l&&await shPut(l)) toast(`「${l.name}」을(를) 공유 보관함에 넣었어요`); else toast('넣을 그림·소리가 없어요'); openAssets(); }
  else if(a==='amtake'){ const x=shList().find(y=>y.id===id); const l=x&&await shTake(x); toast(l?`「${l.name}」을(를) 가져왔어요`:'가져오지 못했어요'); openAssets(); }
  else if(a==='amshdel'){ if(!(await appConfirm('공유 보관함에서 지울까요? 이미 가져온 게임의 자료는 그대로예요.'))) return; shSave(shList().filter(x=>x.id!==id)); try{ await idbDel('shared::'+id); }catch(_){} openAssets(); }
  else if(a==='ammerge'){ const n=libMerge(libDupes()); toast(`${n}개를 합쳤어요(그림 1장을 같이 써요)`); openAssets(); }
  else if(a==='amundo'){ auditUndo(); G.lib.forEach(l=>mark('l:'+l.id)); openAssets(); }
  else if(a==='amadopt'){ let n=0; for(const l of G.lib.filter(l=>!l.img&&!l.audio&&!l.alias)){ const x=shList().find(y=>y.kind===l.kind&&y.name===l.name); if(x&&await shTake(x,l)) n++; } toast(n?`${n}개를 보관함에서 채웠어요`:'채울 자료가 없어요'); openAssets(); }
  else if(a==='amemodel'){ G.lib=G.lib.filter(x=>x.id!==id); mark('l:'+id); openAssets(); } });
document.addEventListener('change',async e=>{ const k=e.target.dataset&&e.target.dataset.amemo, f=e.target.files&&e.target.files[0]; if(!k||!f) return;
  let l=G.lib.find(x=>x.kind==='emote'&&x.name===k); if(!l){ l={id:'l'+uid(),kind:'emote',name:k,prompt:'',img:null}; G.lib.push(l); } await storeImage(l,f); mark('l:'+l.id); toast(`「${k}」 아이콘을 바꿨어요`); openAssets('emote'); });
