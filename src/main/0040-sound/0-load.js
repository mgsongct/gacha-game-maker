/* ===== 0040-sound — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0040-sound.js에서 ── */
/* =========================================================
   소리: 배경음(ElevenLabs Music 또는 파일), 음성(Fish Audio)
   ========================================================= */
const SKEY='starfall-sound';
// ElevenLabs 주소: 설정에 적으면 그 주소(중계 서버 등), 비우면 공식 주소
const EL_DEF='https://api.elevenlabs.io';
const SND_DEF={sfxOn:true,sfxVol:0.6,fishKey:'',fishModel:'s2.1-pro',elKey:'',elBase:'',elModel:'music_v1',elLen:90,bgmVol:0.5,voiceVol:1,bgmOn:true,voiceStory:true,voiceLobby:true,
  scene:{title:'타이틀',lobby:'로비',battle:'전투',boss:'보스전',gacha:'계약'}};
const audioCache={};
const BGM={el:new Audio(),name:null,want:null,fadeT:null,blocked:false};
BGM.el.loop=true;
document.addEventListener('click',()=>{ if(BGM.blocked){ BGM.blocked=false; const n=BGM.want; BGM.name=null; bgm(n); } },true);
const sfxLast={};
document.addEventListener('click',e=>{ if(e.target.closest('.btn,.tile,.tab,.chip,.bsel button')) sfx('버튼'); },true);
const VOICE=new Audio(); let voiceTok=0, voiceErr=false;
const cleanTTS=t=>String(t||'').replace(/\([^)]*\)/g,'').replace(/[「」『』]/g,'').trim();
/* 일본어 목소리: 대사를 글 AI로 일본어로 옮겨 읽어요. 옮긴 글은 저장해 두고 다시 써요 */
const JAKEY='ggm-voice-ja', JAWAIT={};
const jaKey=t=>hash(t).toString(36)+'_'+t.length;
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
