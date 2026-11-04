/* ===== 0070-store — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0070-save.js에서 ── */
/* =========================================================
   저장
   ========================================================= */
/* 진행(G.prog — data/<게임id>/prog.json) 정의 한곳(CLAUDE.md §0-2 상태 정의는 한곳): 새 게임의 처음 진행 · 칸마다 없을 때 만들기·형식 검사·하루/주 새로 만들기·형식 맞춤·지금 값 계산
   쓰는 쪽(Model·Controller)은 progSlot(칸) — 정의대로 맞춰 저장하고 돌려줌. 그리는 쪽(View)은 progRead(칸) — 저장하지 않음(없거나 날이 바뀌었으면 새로 만든 값을 저장하지 않고 돌려주고, 행동력은 지금 회복분까지 계산한 복사본)
   하루/주 새로 만들기·형식 맞춤을 저장하는 것은 Controller 지점(progTick — 그리기 전·주기 타이머). 기능 규칙(행동력 회복 stamRegen·레이드 단계 raidNew·파견 의뢰 채우기 dispBoardFill·원정 expedFill·건조 자원 cresFill)은 기능 모듈에 두고 여기서 부름
   make(옛 값) 처음 값 · ok 형식 검사(기본: 객체) · stale 참이면 새로 만듦 · fill 형식 맞춤(예전 형식 바꾸기·빠진 하위 칸·하루치 준비) · now 지금 값 계산 · tick 그리기 전에 늘 있게(하루/주 단위 기능 — 함수면 그 조건일 때) */
const DEFAULT_PROG = {gems:3600,pity:0,total:0,owned:{},cleared:{},squad:[],sec:null,daily:'',
  settings:{ssr:4,sr:18,pity:150,rv:2,expRate:100,goldRate:100,gemRate:100,stamina:true},firstTen:true,adult:true,show19:true,history:[],savedAt:0,
  gold:20000,mat:{exp:40,wmat:20,core:10,gearMat:0,transcMat:0},pities:{},tokens:{},disp:{},dm:{date:'',cnt:{},got:{}},pass:{xp:0,got:[]},farmClear:{},shopBuy:{},curBanner:'',curEvent:'',live:{on:{talk:true,event:true,rerun:true,rotate:true,pass:true,chapter:false,season:true,skin:true,fill:true},last:{},notices:[],seen:0,recentPU:[],seasons:{story:true,event:true,char:true,rerun:true,train:true},skillGeneration:1,season:null},
  player:'',gender:'',inbox:{},seenOpening:false,lobbyBg:'',titleBg:'',titleChar:'',gachaBg:''};
const P=()=>G.prog;
const progObj=v=>!!v&&typeof v==='object';
const PROG_SLOTS={
  stam:{make:()=>({v:STAM_MAX,at:Date.now()}), fill:(s,p)=>{ if(p.staminaCapVersion!==2){ stamRegen(s,120); p.staminaCapVersion=2; } }, now:s=>stamRegen(s,STAM_MAX)}, // 행동력 — 상한 120 시절 값은 그 상한으로 회복을 끝낸 뒤 새 상한으로
  dm:{make:()=>({date:today(),cnt:{login:1},got:{}}), stale:v=>v.date!==today(), tick:true}, // 일일 임무 — 날이 바뀌면 새로
  raid:{make:raidNew, stale:r=>r.wk!==weekKey(), fill:raidFill, tick:true}, // 주간 레이드 — 주가 바뀌면 지난주 결과로 단계를 정해 새로
  rogue:{make:()=>({run:null,best:0,day:'',n:0}), fill:r=>{ const x=r.run; if(x&&x.v===3){ x.v=2; x.c3=1; } }}, // 탐사 — 예전 3판 형식은 2판으로
  tower:{make:()=>({})}, gifts:{make:()=>({})}, fchat:{make:()=>({})}, cxSeen:{make:cxSeenNew,tick:true}, // 탑 · 선물 보관함 · 자유 대화 · 도감에서 본 항목
  sched:{make:()=>({day:today(),left:SCHED_N,done:[]}), stale:v=>v.day!==today(), tick:true}, // 오늘의 일정 — 날이 바뀌면 새로
  avatar:{make:()=>({id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:'',img:null}),tick:true}, // 프로필 그림
  shop:{make:()=>({day:today(),buy:{}}), stale:v=>v.day!==today(), tick:true}, // 상점 일일 구매 — 날이 바뀌면 새로
  mail:{make:()=>[], ok:Array.isArray}, // 우편함
  dboard:{make:()=>({day:'',list:[],rr:0}), ok:b=>progObj(b)&&Array.isArray(b.list), fill:dispBoardFill, tick:true}, // 파견 게시판 — 날마다 의뢰 채우기
  exped:{make:()=>({}), fill:expedFill, tick:expedOn}, // 원정 — 방송 출연 등 원정 모드면 늘 두고 오늘의 출연 제안을 그리기 전에 만듦
  cres:{make:()=>({}), fill:cresFill}, // 건조/영입 자원
  cbuild:{make:()=>({n:0,found:{},log:[],input:null})} // 건조/영입 기록
};
/* ===== 게임 칸 정의(G.meta·G.world·G의 설정·기록 칸 — 기본값·형식): 진행 칸(PROG_SLOTS)과 같은 꼴 — 정의 한곳(CLAUDE.md §0-2 상태·데이터)
   읽기 gameRead(칸) = 상태 그대로(없으면 기본값을 돌려주기만 — 화면·조회는 이것), 쓰기 gameSlot(칸) = 맞춰 저장하고 돌려줌(바꾸는 쪽), 불러오기(fix)가 모든 칸을 맞춰 둠 ===== */
const GAME_SLOTS={
  'meta.expedition':{make:()=>({mode:'combat'})}, // 원정 모드(0275)
  'meta.rules':{make:()=>({})}, // 게임 규칙(0185)
  'meta.balance':{make:()=>({})}, // 밸런스 설정(0187 — 바꾼 값만)
  'meta.storyMemory':{make:()=>({version:1,notes:''})}, // 스토리 기억(0530)
  'rels':{make:()=>[],ok:Array.isArray}, // 인연(0450)
  'world.codex':{make:()=>[],ok:Array.isArray}, // 도감 기록(0300)
  'world.codexNotes':{make:()=>({})}, // 도감 항목별 메모(0300)
  'world.factions':{make:()=>[],ok:Array.isArray}, // 세력(0445 — 읽기 factions가 캐릭터 소속까지 맞춘 모양을 보여 주고, 고칠 때 factionSync가 저장)
  'world.plan':{make:()=>({acts:[],twists:[],branches:[],arcs:[]}),ok:p=>progObj(p)&&['acts','twists','branches','arcs'].every(k=>Array.isArray(p[k]))} // 시나리오 설계(0465)
};
const gameAt=(path,g)=>{ const ks=path.split('.'), last=ks.pop(); let o=g; for(const k of ks) o=o[k]; return [o,last]; };
const PJKEY='starfall-projects';
const LKEY=pjKey(PJ().active);
/* 적 그림 재탕: 보스가 아닌 새 적은 기존 적 그림을 같이 써요(이름만 달라요). 적 종류가 ENEMY_KEEP개를 넘으면 외형이 와도 재탕해요 */
const ENEMY_KEEP=10;
const HEXC=/^#[0-9a-f]{3,8}$/i;
let G; {const r=appStorage.getItem(LKEY);G=fix(r?JSON.parse(r):defaults());}
let DB=null,BASE=null,SAMPLE=null,ASSETS=null;
// Draft builders temporarily use G; persistence must keep the real game.
let NEW_GAME_SOURCE=null;
const dirty=new Set(); let flushT=null,saveRevision=0,saveTail=Promise.resolve();
addEventListener('pagehide',flushNow);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNow();},true);

/* ── 0080-storage-integration.js에서 ── */
addEventListener('ggm-storage-error',e=>storageWarning(e.detail.message));
addEventListener('ggm-saved',storageWarningClear);
// Capturing guard also covers enhancement buttons installed by combat modules.
document.addEventListener('click',e=>{if(!appStorage.failed&&!document.getElementById('save-warning'))return;const a=e.target.closest('[data-act]')?.dataset.act;if(/^(pull|upgo|cheat|cheat2|skbbuy|cashpkg|v2train|v2training|v2gearunlock)/.test(a||'')){e.preventDefault();e.stopImmediatePropagation();storageWarning('저장을 먼저 복구한 뒤 뽑기·강화를 진행해 주세요.');}},true);

// Begin persistence immediately after synchronous button actions, rather than waiting for app exit.
document.addEventListener('click',()=>{queueMicrotask(()=>{if(dirty.size&&!window.__NOFLUSH)flush().catch(()=>{});});});


// One project transition at a time; validate the target BEFORE changing the active registry.
let projectSwitchBusy=false;
/* /STORAGE_INTEGRATION_MODULE */


/* 이미지 */
const imgCache={};
const IMGNS=PJ().active==='main'?'':PJ().active+'::';
const SKP={upper:'상반신',illust:'일러스트',lbcg:'돌파 CG'};
let NOSKIN=0; // 계약(가챠) 화면·연출은 스킨 없이 기본 모습으로
const noSkin=f=>function(){ NOSKIN++; try{ return f.apply(this,arguments); }finally{ NOSKIN--; } };
document.addEventListener('error',event=>{const img=event.target;if(!img?.matches?.('.au-art img[data-battle-name]'))return;const label=document.createElement('div');label.className='art v2-art-name';label.setAttribute('role','img');label.setAttribute('aria-label',img.dataset.battleName+' · 일러스트 없음');label.textContent=img.dataset.battleName;img.replaceWith(label);},true);
const procCache={};
const XBTN=(k,id,extra,label)=>`<button class="btn sm ghost" data-act="imgx" data-k="${k}" data-id="${esc(id||'')}"${extra||''}>${label||'그림 지우기'}</button>`;
let uploadFor=null, uploadAudioFor=null;
// 표정을 넣을 대상: 기본 모습이거나, 표정 창에서 고른 스킨
let FACET={cid:'',sid:''};
document.addEventListener('DOMContentLoaded',()=>{});
(function(){ const i=document.createElement('input'); i.type='file'; i.id='filesm'; i.accept='image/*'; i.multiple=true; i.hidden=true; document.body.appendChild(i);
  i.addEventListener('change',async e=>{ const fs=[...e.target.files]; e.target.value=''; if(!fs.length||!uploadFor||uploadFor.kind!=='faces') return; const c=charById(uploadFor.id); if(!c) return; let n=0;
    for(const f of fs){ const nm=f.name.replace(/\.[^.]+$/,'').trim().slice(0,12); if(!nm) continue; try{ await addFaceFile(c,nm,f); n++; }catch(err){ quietErr(err,'0080-storage-integration.js:148'); } }
    openFaces(c.id); toast(`표정 ${n}개를 넣었어요`); }); })();
document.getElementById('afile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; const l=libById(uploadAudioFor); if(!f||!l) return;
  try{ await storeAudio(l,f); toast(`「${l.name}」 음악을 등록했어요`); bgm(l.name,true); openLibItem(l.id); }catch(err){ toast('음악 파일을 저장하지 못했어요'); }
});
$('#file').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f||!uploadFor) return;
  if(uploadFor.kind==='avatar'){ try{ await storeImage(progSlot('avatar'),await shrink(f,1200),''); mark('prog'); refreshPlayerForm(); toast('프로필 그림을 등록했어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='skinpart'){ const c=charById(uploadFor.id), k=c&&(c.skins||[]).find(x=>x.id===uploadFor.s); if(!k) return; const x=uploadFor.x; toast('그림을 등록하는 중이에요');
    try{ let ub=await shrink(f,2200); if(x==='stand'||x==='upper'){ try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:158'); } } await storeImage(x==='stand'?k:skinPart(k,x),ub,''); mark('c:'+c.id); render(); skinRefresh(c.id); toast(`${k.name} ${x==='stand'?'스탠딩':SKP[x]}을(를) 등록했어요`); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='pthumb'){ try{ const d=await thumbData(f), id=uploadFor.id, up=userPacks(), mine=up.find(x=>x.id===id); if(mine){ mine.thumb=d; saveUserPacks(up); } else { const m=pthumbs(); m[id]=d; appStorage.setItem(PTHUMB,JSON.stringify(m)); } if($('#modal .ep [data-act="packuse"]')) openModal(packHTML()); toast('썸네일을 넣었어요'); }catch(err){ toast('썸네일을 넣지 못했어요'); } return; }
  if(uploadFor.kind==='shk'){ try{ let ub=await shrink(f,2200); try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:160'); } const o=shkSelf(); await storeImage(o,ub,''); G.meta.shop.charId='__self'; mark('meta'); SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(imgSrc(o))}" alt="">`; if($('#sk_char')) $('#sk_char').value='__self'; render(); toast('상점 주인 그림을 올렸어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='npc'||uploadFor.kind==='npcup'){ const n=(G.npcs||[]).find(x=>x.id===uploadFor.id); if(!n) return; const up=uploadFor.kind==='npcup';
    try{ let ub=await shrink(f,2200); try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:162'); } if(up&&!n.upper) n.upper={id:'up_'+n.id,kind:'upper',name:n.name+' 상반신',prompt:'',img:null}; await storeImage(up?n.upper:n,ub,up?'':'c:'); mark('meta'); npcRefresh(n.id); toast(`${n.name} ${up?'상반신':'스탠딩'}을(를) 올렸어요`); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='scimg'){ /* 스토리 편집: 올린 그림을 CG로 저장하고 대본의 커서 자리에 [CG: 이름] … [CG 끝]을 넣어요 */
    const ta=$('#'+uploadFor.ta); if(!ta) return; toast('그림을 넣는 중이에요');
    try{ let k=G.lib.filter(l=>l.kind==='cg'&&/^삽화 \d+$/.test(l.name)).length+1; while(G.lib.some(l=>l.name==='삽화 '+k)) k++;
      const l={id:'l'+uid(),kind:'cg',name:'삽화 '+k,prompt:'',cast:[],img:null}; await storeImage(l,await shrink(f,2200),'l:'); G.lib.push(l); mark('l:'+l.id);
      const pos=Math.min(uploadFor.pos==null?ta.value.length:uploadFor.pos,ta.value.length), v=ta.value, pre=v.slice(0,pos), post=v.slice(pos);
      const ins=(pre&&!pre.endsWith('\n')?'\n':'')+`[CG: ${l.name}]\n…\n[CG 끝]`+(post&&!post.startsWith('\n')?'\n':'');
      ta.value=pre+ins+post; ta.focus({preventScroll:true}); try{ ta.setSelectionRange(pos+ins.length,pos+ins.length); }catch(e){} toast(`「${l.name}」을(를) 넣었어요. 저장을 눌러야 반영돼요`); }
    catch(err){ toast('이미지를 넣지 못했어요'); } return; }
  if(uploadFor.kind==='face'){ const c=charById(uploadFor.id); if(!c) return; try{ await addFaceFile(c,uploadFor.name,f,uploadFor.b); openFaces(c.id); toast(`표정 「${uploadFor.name}」${uploadFor.b==='up'?' 상반신':''}을(를) 넣었어요`); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='weapon'){ const c=charById(uploadFor.id); if(!c||!c.weapon) return; toast('그림을 등록하는 중이에요'); try{ let ub=await shrink(f,2000); try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:172'); } await storeImage(c.weapon,ub,''); mark('c:'+c.id); render(); openChar(c.id); toast(T('weapon')+' 이미지를 등록했어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(ILK(uploadFor.kind)||uploadFor.kind==='upper'||uploadFor.kind==='pose'||uploadFor.kind==='lbbg'||uploadFor.kind==='scg'){ const c=charById(uploadFor.id); if(!c) return; if(uploadFor.kind==='scg') scgSlot(c); toast('그림을 등록하는 중이에요'); try{ let ub=await shrink(f,2200); if(uploadFor.kind==='pose'){ try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:173'); } } await storeImage(c[uploadFor.kind],ub,''); mark('c:'+c.id); render(); openChar(c.id); toast(uploadFor.kind==='upper'?'상반신을 등록했어요':'일러스트를 등록했어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  const o=uploadFor.kind==='char'?charById(uploadFor.id):libById(uploadFor.id); if(!o) return;
  toast('이미지를 등록하는 중이에요');
  const blob=await shrink(f,uploadFor.kind==='char'?1800:2000);
  try{
    await storeImage(o,blob,uploadFor.kind==='char'?'c:':'l:'); render();
    if(uploadFor.kind==='char') openChar(o.id); else openLibItem(o.id);
    toast(`${o.name} 이미지를 등록했어요`);
  }catch(err){ toast('이미지를 올리지 못했어요. 더 작은 파일로 다시 시도해 주세요.'); }
});

/* ── 0520-backup-storage.js에서 ── */
/* BACKUP_STORAGE_MODULE */
/* Three explicit backup scopes; new archives are streamed JSON records, not one giant JSON string. */
var BACKUP_TYPES={progress:{name:'진행 백업',desc:'보유 캐릭터·레벨·스킬·장비·재화·스토리 진행과 게임 설정을 저장합니다. 이미지·음성 파일과 API 키는 포함하지 않습니다. 같은 기기의 기존 자료와 함께 이어하기에 적합합니다.'},assets:{name:'자료 백업',desc:'현재 게임에 등록된 이미지·음성 파일만 저장합니다. 캐릭터 보유·성장·재화·스토리 진행은 포함하지 않습니다. 같은 게임에 자료를 복원할 때 사용하며 진행 상태는 바꾸지 않습니다.'},full:{name:'전체 백업',desc:'진행 백업과 자료 백업을 함께 저장합니다. 다른 기기로 게임을 옮기거나 모든 내용을 보관할 때 사용합니다. API 키와 앱 전체 설정은 포함하지 않습니다.'}};
var BACKUP_IMPORT_KIND='full',BACKUP_BUSY=false;
async function* backupLines(file){const decoder=new TextDecoder();let carry='';for(let p=0;p<file.size;p+=262144){carry+=decoder.decode(await file.slice(p,p+262144).arrayBuffer(),{stream:true});let n;while((n=carry.indexOf('\n'))>=0){const line=carry.slice(0,n);carry=carry.slice(n+1);if(line.trim())yield JSON.parse(line);}if(carry.length>134217728)throw Error('백업 항목이 너무 큽니다');}carry+=decoder.decode();if(carry.trim())yield JSON.parse(carry);}
// Incremental legacy JSON reader: retain one game object or one media string, never the entire GB archive.
async function* legacyBackupEntries(file){
 const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='',position=0,offset=0,yieldAt=0;
 async function fill(){
  if(position>0){buffer=buffer.slice(position);position=0;}if(offset>=file.size)return false;
  const end=Math.min(file.size,offset+262144);buffer+=decoder.decode(await file.slice(offset,end).arrayBuffer(),{stream:end<file.size});offset=end;
  if(offset-yieldAt>=1048576){yieldAt=offset;backupTransferStatus(`이전 JSON 읽는 중 · ${(offset/1048576).toFixed(1)} / ${(file.size/1048576).toFixed(1)} MiB`);await new Promise(resolve=>setTimeout(resolve,0));}return true;
 }
 async function peek(){while(position>=buffer.length){if(!await fill())return '';}return buffer[position];}
 async function ws(){while(true){while(position<buffer.length&&/\s/.test(buffer[position]))position++;if(position<buffer.length||!await fill())return;}}
 async function expect(c){await ws();if(await peek()!==c)throw Error('손상되었거나 끝이 잘린 JSON 파일입니다');position++;}
 async function value(){
  await ws();if(!await peek())throw Error('JSON 파일이 중간에 끝났습니다');
  const pieces=[];let size=0,depth=0,string=false,escape=false,started=false,done=false;
  while(!done){const start=position;
   while(position<buffer.length){const c=buffer[position];if(!string&&depth===0&&started&&/[},\]\s]/.test(c)){done=true;break;}position++;started=true;
    if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"'){string=false;if(depth===0){done=true;break;}}}
    else if(c==='"')string=true;else if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(depth===0){done=true;break;}}
   }
   size+=position-start;if(size>134217728)throw Error('JSON의 단일 항목이 너무 큽니다. 이미지를 더 작게 만든 공유팩을 사용해 주세요.');pieces.push(buffer.slice(start,position));
   if(!done&&position>=buffer.length&&!await fill()){if(string||depth!==0)throw Error('JSON 파일이 중간에 끝났습니다. 원본 파일을 다시 전송해 주세요.');done=true;}
  }
  return JSON.parse(pieces.join(''));
 }
 const keys=new Set();await expect('{');await ws();if(await peek()==='}'){position++;return;}
 while(true){const key=await value();if(typeof key!=='string'||keys.has(key))throw Error('중복되거나 올바르지 않은 JSON 항목입니다');keys.add(key);await expect(':');
  if(['images','audios','voices'].includes(key)){await expect('{');await ws();if(await peek()!=='}'){const ids=new Set();while(true){const id=await value();if(typeof id!=='string'||ids.has(id))throw Error('중복되거나 올바르지 않은 자료 ID입니다');ids.add(id);await expect(':');yield {group:key,key:id,value:await value()};await ws();if(await peek()!==',')break;position++;}}await expect('}');}
  else yield {group:'root',key,value:await value()};await ws();const c=await peek();if(c==='}'){position++;break;}await expect(',');
 }
 await ws();if(await peek())throw Error('JSON 끝에 잘못된 데이터가 있습니다');
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const kind=el.dataset.kind;if(el.dataset.act==='backup-save')openBackupChoice(kind);if(el.dataset.act==='backup-load'){BACKUP_IMPORT_KIND=kind;document.getElementById('durable-backup-file').click();}if(el.dataset.act==='backup-start'){const dest=document.getElementById('backup-dest').value,voices=!!document.getElementById('backup-voices')?.checked;closeModal();backupExport(kind,dest,voices);}});
document.getElementById('durable-backup-file').addEventListener('change',e=>{const f=e.target.files[0],kind=BACKUP_IMPORT_KIND;e.target.value='';if(f)backupImport(f,kind);});

/* ── 0525-data-folder.js에서 ── */
/* DATA_FOLDER_MODULE
   게임 하나 = data/<게임id>/ 폴더, 종류별 JSON (meta.json, world.json, chars.json, chapters.json …).
   PC 서버(pc/ggm-server.py)가 영구 저장소로 쓰는 배치와 같아요. 여기서는 그 배치로 내보내기·가져오기(.zip)를 해요.
   zip 안: data/index.json · data/<id>/<종류>.json · data/<id>/media.json · data/<id>/media/<자료 키> */
const DATA_TYPES=['meta','world','chars','npcs','rels','chapters','lib','threads','opening','banners','events','dispatches','prog'];

/* zip: 압축 없이 저장(stored) · UTF-8 이름. 읽기는 stored와 deflate(브라우저 DecompressionStream) 둘 다.
   ponytail: zip64 없음 → 파일 하나·전체 4GB, 항목 65535개까지 */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();

const jsonBytes=o=>new TextEncoder().encode(JSON.stringify(o,null,1));

document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;
 if(el.dataset.act==='data-save')dataExport();
 if(el.dataset.act==='data-load'){const i=document.createElement('input');i.type='file';i.accept='.zip,application/zip';i.onchange=()=>{if(i.files[0])dataImport(i.files[0]);};i.click();}});
/* /DATA_FOLDER_MODULE */
