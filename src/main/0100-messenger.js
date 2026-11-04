/* =========================================================
   메신저: 등대톡
   ========================================================= */
const threadById=id=>G.threads.find(t=>t.id===id);
const threadChar=t=>t&&charById(t.charId);
function trigOk(t){
  const c=threadChar(t); if(!c||c.monster) return false;
  if(t.needOwn!==false&&!own(c.id)) return false;
  const g=t.trigger||{type:'start'};
  if(g.type==='start') return true;
  if(g.type==='aff') return !!own(c.id)&&affLv(own(c.id))>=(+g.value||1);
  if(g.type==='clear') return !!P().cleared[g.value];
  return false;
}
function checkTriggers(silent){
  if(!P().seenOpening) return;
  const fresh=[];
  for(const t of G.threads){ if(P().inbox[t.id]) continue; if(trigOk(t)){P().inbox[t.id]={at:Date.now()+fresh.length,pos:0,pick:0,done:false,log:[]};fresh.push(t);} }
  if(fresh.length){ mark('prog'); if(!silent) notify(fresh[0],fresh.length-1); updateBadge(); }
}
function unread(){return Object.entries(P().inbox).filter(([id,s])=>!s.done&&threadChar(threadById(id))).length;}
function updateBadge(){const el=document.querySelector('.lb-ico[data-act="phone"]'); if(!el) return; const n=unread(); let e=el.querySelector('em'); if(!n){ if(e) e.remove(); return; } if(!e){ e=document.createElement('em'); el.appendChild(e); } e.textContent=n;} // 로비 대화 아이콘 배지(예전 #phBadge는 화면에 없음)
function notify(t,more){
  const c=threadChar(t); const first=parseScript(t.script).find(l=>l.type==='say'&&!isMe(l.who));
  const el=$('#notif');
  el.innerHTML=`<button class="nt" data-act="openthread" data-id="${t.id}"><div class="av">${art(c)}</div><div class="nt-t"><small>${esc(T('talk'))}${more>0?`, 외 ${more}건`:''}</small><b>${esc(c.name)}</b><span>${esc(sub(first?first.text:t.title))}</span></div></button>`;
  sfx('알림'); try{navigator.vibrate&&navigator.vibrate([60,40,60]);}catch(e){}
  clearTimeout(el._t); el._t=setTimeout(()=>{const b=el.querySelector('.nt'); if(b){b.classList.add('out');setTimeout(()=>{el.innerHTML='';},300);}},5000);
}
let PH=null;
function openPhone(tid){ $('#notif').innerHTML=''; $('#phone').hidden=false; if(tid&&P().inbox[tid]) openThread(tid); else phoneList(); }
function closePhone(){ PH=null; $('#phone').hidden=true; $('#phone').innerHTML=''; render(); }
function phoneList(){
  PH=null; const rooms=phRooms();
  $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phclose" aria-label="닫기">✕</button><b>${esc(T('talk'))}</b><button data-act="phnew" aria-label="대화 추가">＋</button></div><div class="ph-list">${
    rooms.length?rooms.map(x=>{ const l=x.last; return `<button class="ph-row" data-act="openfc" data-id="${esc(x.c.id)}"><div class="av">${art(x.c)}</div><div class="t"><b>${esc(x.c.name)}</b><span>${esc(l?(l.w==='k'?'스티커를 보냈어요':l.w==='p'?'사진을 보냈어요':(l.w==='me'?'나: ':'')+(l.t||(l.img?'사진':''))):(x.title||'대화를 시작해 보세요'))}</span></div>${x.unread?'<i class="dot"></i>':''}</button>`; }).join('')
    :`<p class="muted" style="text-align:center;padding:40px 16px">아직 대화가 없어요. ${esc(T('crew'))}과(와) 친해지거나 ${esc(T('ops'))}을(를) 진행하면 연락이 와요.<br><br><button class="btn sm" data-act="phnew">＋ 대화 추가</button></p>`}</div></div>`;
}
function phRooms(){ const m={};
  Object.entries(P().inbox).forEach(([id,s])=>{ const t=threadById(id), c=threadChar(t); if(!c) return; const r=m[c.id]||(m[c.id]={c,at:0,unread:false}); r.at=Math.max(r.at,s.at||0); if(!s.done){ r.unread=true; r.title=r.title||t.title; } });
  Object.entries(progSlot('fchat')).forEach(([cid,f])=>{ const c=charById(cid); if(!c||!f.log.length) return; const r=m[cid]||(m[cid]={c,at:0,unread:false}); r.at=Math.max(r.at,f.at||0); if(f.unread) r.unread=true; });
  return Object.values(m).map(r=>Object.assign(r,{last:roomLog(r.c.id).filter(l=>l.w!=='s').at(-1)})).sort((a,b)=>b.at-a.at); }
function roomThreads(cid){ return Object.entries(P().inbox).map(([id,s])=>({t:threadById(id),s})).filter(x=>{ const c=threadChar(x.t); return c&&c.id===cid; }).sort((a,b)=>(a.s.t0||a.s.at||0)-(b.s.t0||b.s.at||0)); }
function roomItems(cid){ const out=[];
  roomThreads(cid).forEach(({s})=>{ const n=s.log.length, base=s.t0||s.at||0; s.log.forEach((l,i)=>{ if(l.w==='s'&&l.t==='대화가 끝났어요') return; out.push({l,arr:s.log,k:l.at||(s.t0?base+i:base-(n-i))}); }); });
  const f=progSlot('fchat')[cid]; if(f) f.log.forEach((l,i)=>out.push({l,arr:f.log,k:l.at||i,fc:true}));
  return out.sort((a,b)=>a.k-b.k); }
function roomLog(cid){ return roomItems(cid).map(x=>x.l); }
function roomDel(cid,items){ const f=progSlot('fchat')[cid]; items.forEach(x=>{ const i=x.arr.indexOf(x.l); if(i<0) return; x.arr.splice(i,1); if(x.fc&&f&&i<(f.sumTo||0)) f.sumTo--; }); if(f&&!f.log.length){ f.sum=''; f.sumTo=0; } mark('prog'); }
function roomLastBlock(cid){ const it=roomItems(cid); if(!it.length) return []; let i=it.length-1; while(i>0&&(it[i].k-it[i-1].k)<30*60e3&&it[i].k>1e12&&it[i-1].k>1e12) i--; return it.slice(i); }
function phNewList(){ PH=null; const list=[...new Set(G.chars.map(c=>baseChar(c)))].sort((a,b)=>(own(b.id)?1:0)-(own(a.id)?1:0)); // 새로 추가한(아직 안 뽑은) 인물도 보여요
  $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phback" aria-label="뒤로">‹</button><b>대화 추가</b><span style="width:30px"></span></div><div class="ph-list">${
    list.length?`<p class="muted" style="margin:10px 14px;font-size:.82rem">누구에게서 새 대화를 받을까요? AI가 선택지가 있는 대화를 써 주거나, 직접 쓸 수 있어요.</p>${list.map(c=>`<button class="ph-row" data-act="phadd" data-id="${esc(c.id)}"><div class="av">${art(c)}</div><div class="t"><b>${esc(c.name)}</b><span>${esc(c.faction||'')} · ${own(c.id)?'호감도 Lv.'+affLv(own(c.id)):'아직 만나지 않음'}</span></div><span class="fc-go">추가</span></button>`).join('')}`
    :`<p class="muted" style="text-align:center;padding:40px 16px">아직 ${esc(T('crew'))}이(가) 없어요.</p>`}</div></div>`; }
function phAddView(cid,from){ const c=charById(cid); if(!c) return; PH={add:cid,from:from||'list'};
  $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phaddback" aria-label="뒤로">‹</button><b>대화 추가 · ${esc(c.name)}</b><span style="width:30px"></span></div>
    <div class="ph-add">
      <label class="f" for="pa_hint">어떤 대화를 받고 싶어요? (AI용, 비워도 돼요)</label><input class="in" id="pa_hint" placeholder="예: 비 오는 밤에 우산 없다고 데리러 와 달라는 대화">
      <div class="row" style="margin:8px 0 4px"><button class="btn sm" data-act="phaddai" data-id="${esc(cid)}" ${SAMPLE?'':'disabled'}>AI로 대화 쓰기</button>${SAMPLE?'':'<span class="muted" style="font-size:.78rem">글 AI를 등록하면 쓸 수 있어요</span>'}</div>
      <label class="f" for="pa_title">제목</label><input class="in" id="pa_title" placeholder="대화방 미리보기 문구">
      <label class="f" for="pa_script">대화 (직접 써도 돼요)</label><textarea class="in tall" id="pa_script" placeholder="${esc(c.name)}: 메시지&#10;선택: 답장1 | 답장2&#10;1) ${esc(c.name)}: 1번을 골랐을 때 반응&#10;2) ${esc(c.name)}: 2번을 골랐을 때 반응&#10;[사진: 소품이름]"></textarea>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="phaddsend" data-id="${esc(cid)}">대화 받기</button><button class="btn ghost" data-act="openfc" data-id="${esc(cid)}">대본 없이 바로 말 걸기</button></div>
    </div></div>`; }
const chatImgCache={};
function chatImgHTML(k){ const u=chatImgCache[k]; return u?`<img class="art" src="${esc(u)}" alt="사진" data-act="chatimg" data-k="${esc(k)}" draggable="false">`:`<div class="art ph" data-chatimg="${esc(k)}"><small>사진 불러오는 중</small></div>`; }
async function hydrateChatImgs(){ let ch=false;
  for(const el of [...document.querySelectorAll('[data-chatimg]')]){ const k=el.dataset.chatimg; if(!chatImgCache[k]){ try{ const b=await idbGetNS(k); if(b) chatImgCache[k]=URL.createObjectURL(b); }catch(e){} }
    if(!el.isConnected) continue; el.outerHTML=chatImgCache[k]?chatImgHTML(k):`<div class="art ph"><small>사진이 이 기기에 없어요</small></div>`; ch=true; }
  if(ch){ const c=$('#phChat'); if(c) c.scrollTop=c.scrollHeight; } }
function bubbleHTML(l,c){
  if(l.w==='s') return `<div class="sys">${esc(l.t)}</div>`;
  if(l.w==='me') return `<div class="msg me">${l.img?`<div class="bub photo">${chatImgHTML(l.img)}</div>`:''}${l.t||!l.img?`<div class="bub">${esc(l.t)}</div>`:''}</div>`;
  const inner=l.w==='k'?`<div class="bub sticker">${emoteHTML(l.t,true)}</div>`:l.w==='p'?`<div class="bub photo">${l.img?chatImgHTML(l.img):libArt(l.t)}</div>`:`<div class="bub">${esc(l.t)}</div>`;
  return `<div class="msg"><div class="av sm">${art(c)}</div>${inner}</div>`;
}
function chatImgView(k){ const u=chatImgCache[k], ph=$('.phone'); if(!u||!ph) return; const old=$('.ph-menu'); if(old) old.remove();
  ph.insertAdjacentHTML('beforeend',`<div class="ph-menu ph-view" data-act="phmenuclose"><img src="${esc(u)}" alt="사진"><div class="row"><button class="btn sm" data-act="chatimgsave" data-k="${esc(k)}">저장</button><button class="btn sm ghost" data-act="phmenuclose">닫기</button></div></div>`); }
async function chatImgB64(k){ try{ const b=await idbGetNS(k); if(!b) return undefined; const s=await shrink(b,1024); const bmp=await createImageBitmap(s), cv=document.createElement('canvas'); cv.width=bmp.width; cv.height=bmp.height; cv.getContext('2d').drawImage(bmp,0,0); const u=cv.toDataURL('image/jpeg',0.85); return [{mime:'image/jpeg',data:u.split(',')[1]}]; }catch(e){ return undefined; } }
async function chatPhotoPick(f){ if(!f||!PH||!PH.fc) return; try{ const b=await shrink(f,1280), k='chat_'+uid(); await idbPut(IMGNS+k,b); chatImgCache[k]=URL.createObjectURL(b); PH.pendImg=k; phPendRender(); const i=$('#fcIn'); if(i){ i.placeholder='사진과 함께 보낼 말 (비워도 돼요)'; i.focus({preventScroll:true}); } }catch(e){ toast('사진을 불러오지 못했어요'); } }
function phPendRender(){ const w=$('#phPend'); if(!w) return; const k=PH&&PH.pendImg; w.hidden=!k; w.innerHTML=k?`<img src="${esc(chatImgCache[k]||'')}" alt="보낼 사진"><span>이 사진을 보낼게요</span><button class="btn sm ghost" data-act="phpendx" aria-label="사진 빼기">✕</button>`:''; }
(function(){ const i=document.createElement('input'); i.type='file'; i.id='chatfile'; i.accept='image/*'; i.hidden=true; document.body.appendChild(i);
  i.addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; chatPhotoPick(f); }); })();
function openThread(tid){ const t=threadById(tid), c=threadChar(t); if(!t||!c||!P().inbox[tid]) return; openRoom(c.id); }
function openRoom(cid,opt){
  const c=charById(cid); if(!c) return; const f=fcOf(cid); const token={}; opt=opt||{};
  const act=roomThreads(cid).find(x=>!x.s.done&&x.t);
  PH={fc:cid,tid:act?act.t.id:null,token,mode:'free',sel:!!opt.sel};
  const it=roomItems(cid);
  $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="${PH.sel?'phselend':'phback'}" aria-label="뒤로">‹</button><b>${PH.sel?'지울 메시지를 누르세요':esc(c.name)}</b>${PH.sel?`<button class="ph-done" data-act="phselend">완료</button>`:`<button data-act="phmenu" data-id="${esc(c.id)}" aria-label="메뉴">⋯</button>`}</div>
    <div class="ph-chat ${PH.sel?'selmode':''}" id="phChat">${it.length?it.map((x,i)=>PH.sel?`<div class="phsel" data-act="phdel" data-i="${i}">${bubbleHTML(x.l,c)}</div>`:bubbleHTML(x.l,c)).join(''):`<div class="sys empty">${esc(c.name)}와(과)의 대화방이에요. 오른쪽 위 ⋯ → 대화 추가로 새 대화를 받거나, 아래에서 바로 말을 걸어 보세요.</div>`}</div>
    <div class="ph-in" id="phIn" hidden></div>
    <div class="ph-pend" id="phPend" hidden></div><div class="ph-in fcin" id="phFree" ${PH.sel?'hidden':''}><button class="btn sm ghost ph-sw" data-act="phmode" data-v="pick" hidden aria-label="선택지 보기">선택지</button><button class="btn sm ghost ph-cam" data-act="fcphoto" aria-label="사진 보내기" ${SAMPLE?'':'disabled'}>📷</button><textarea id="fcIn" rows="1" maxlength="400" placeholder="${SAMPLE?'메시지 보내기':'글 AI를 등록하면 직접 말을 걸 수 있어요'}" ${SAMPLE?'':'disabled'}></textarea><button class="btn sm" data-act="fcsend" ${SAMPLE?'':'disabled'}>전송</button></div></div>`;
  if(!PH.sel) phScroll(); f.unread=0; mark('prog');
  if(PH.sel) return;
  if(act){ act.s.t0=act.s.t0||Date.now(); phPlay(act.t,c,act.s,token); }
  else setTimeout(()=>{ const i=$('#fcIn'); if(i&&!IS_NATIVE&&!i.disabled) i.focus({preventScroll:true}); },50);
}
/* 메신저 부분 갱신(View): 알림 비우기 · 메뉴 닫기 · 내가 보낸 말 붙이기 · 다시 그려도 대화 스크롤 유지 */
function notifClear(){ $('#notif').innerHTML=''; }
function phMenuClose(){ $('.ph-menu')?.remove(); }
function phSentShow(en,c){ $('#phIn').innerHTML=''; phMode('free'); $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(en,c)); phScroll(); }
function phKeep(open){ const st=$('#phChat').scrollTop; open(); $('#phChat').scrollTop=st; }
function phMenu(cid){ const c=charById(cid); if(!c) return; const old=$('.ph-menu'); if(old){ old.remove(); return; }
  const n=roomItems(cid).length, nb=roomLastBlock(cid).length;
  $('.phone').insertAdjacentHTML('beforeend',`<div class="ph-menu" data-act="phmenuclose"><div class="ph-sheet">
    <b class="ph-mt">${esc(c.name)}</b>
    <button data-act="phadd" data-id="${esc(cid)}">＋ 대화 추가</button>
    <button data-act="phsel" data-id="${esc(cid)}" ${n?'':'disabled'}>메시지 골라 지우기</button>
    <button data-act="phdelblock" data-id="${esc(cid)}" ${nb?'':'disabled'}>이번 대화 지우기 <small>최근 ${nb}개</small></button>
    <button data-act="phdelall" data-id="${esc(cid)}" class="danger" ${n?'':'disabled'}>대화방 전체 지우기 <small>${n}개</small></button>
    ${imgReady()?`<button data-act="fcphototog">캐릭터가 사진 보내기 <small>${P().fcPhoto!==false?'켜짐 · 그림 AI 사용':'꺼짐'}</small></button>`:''}
    <button data-act="char" data-id="${esc(cid)}">${esc(T('crew'))} 정보</button>
    <button data-act="phmenuclose" class="ph-cancel">닫기</button></div></div>`); }
function phMode(m){ if(!PH) return; PH.mode=m; const a=$('#phIn'), el=$('#phFree'); if(!a||!el) return; const hasPick=!!a.querySelector('[data-act=phpick],[data-act=phsay]');
  if(m==='pick'&&hasPick){ a.hidden=false; el.hidden=true; } else { a.hidden=true; el.hidden=false; const sw=el.querySelector('.ph-sw'); if(sw) sw.hidden=!hasPick; } phScroll(); }
let FCBUSY=false;
function fcOf(cid){ const f=progSlot('fchat'); return f[cid]||(f[cid]={log:[],sum:'',sumTo:0,at:0}); }
function openFree(cid){ openRoom(cid); }
async function fcSend(opt){
  opt=opt||{}; if(FCBUSY||!PH||!PH.fc) return; const cid=PH.fc, c=charById(cid), inp=$('#fcIn'); if(!c||!inp) return; if(!opt.img&&PH.pendImg) opt.img=PH.pendImg; const text=inp.value.trim(); if(!text&&!opt.img) return; if(!opt.img&&PH.lastSend&&PH.lastSend.t===text&&Date.now()-PH.lastSend.at<2500){ inp.value=''; return; } PH.lastSend={t:text,at:Date.now()}; if(opt.img){ PH.pendImg=null; phPendRender(); inp.placeholder='메시지 보내기'; }
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
  const f=fcOf(cid), token=PH.token, alive=()=>PH&&PH.token===token&&$('#phChat'); inp.value=''; inp.style.height=''; [0,60,200].forEach(ms=>setTimeout(()=>{ const v=inp.value.trim(); if(v&&text.endsWith(v)&&v.length<=Math.max(2,text.length)) inp.value=''; },ms));
  if(PH.tid){ const th=threadById(PH.tid), s0=th&&P().inbox[PH.tid]; if(th&&s0&&!s0.done){ s0.done=true; s0.freed=true; s0.pos=parseScript(th.script).length; s0.at=Date.now(); if(own(c.id)) addAff(c,10); updateBadge(); } PH.tid=null; const pi=$('#phIn'); if(pi) pi.innerHTML=''; phMode('free'); const sw=$('.ph-sw'); if(sw) sw.hidden=true; }
  const me={w:'me',t:text,at:Date.now()}; if(opt.img) me.img=opt.img; f.log.push(me); f.at=me.at; if(alive()){ const el=$('#phChat'); if(el.children.length===1&&el.querySelector('.sys')&&roomLog(cid).length===1) el.innerHTML=''; el.insertAdjacentHTML('beforeend',bubbleHTML(me,c)); phScroll(); } mark('prog');
  FCBUSY=true; const ty=document.createElement('div'); ty.className='msg'; ty.innerHTML=`<div class="av sm">${art(c)}</div><div class="bub typing"><i></i><i></i><i></i></div>`; if(alive()){ $('#phChat').appendChild(ty); phScroll(); }
  try{
    const o=own(c.id), lv=affLv(o), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0)).map(x=>x.text).filter(Boolean);
    const pool=typeof affLinePool==='function'?affLinePool(c).slice(0,8):(c.lines||[]).slice(0,6);
    const recent=fcSendRecentText({cid,c});
    const r=await aiJSON(fcSendPrompt({c,pool,lv,files,recent,text,f,opt}),null,'default',opt.img?await chatImgB64(opt.img):undefined);
    ty.remove(); const pn=playerName(), reps=(r&&Array.isArray(r.replies)?r.replies:r&&r.reply?[r.reply]:[]).map(x=>String(x||'').trim()).map(x=>x.replace(new RegExp('^'+c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[:：]\\s*'),'')).filter(x=>x&&!new RegExp('^(나|'+pn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'|'+T('player')+')\\s*[:：]').test(x)).slice(0,4);
    if(!reps.length){ if(r) toast('답장을 받지 못했어요. 다시 보내 주세요'); return; }
    for(let i=0;i<reps.length;i++){
      if(i){ const t2=document.createElement('div'); t2.className='msg'; t2.innerHTML=ty.innerHTML; if(alive()){ $('#phChat').appendChild(t2); phScroll(); } await wait(Math.min(1600,400+reps[i].length*30)); t2.remove(); }
      const m={w:'c',t:reps[i],at:Date.now()}; f.log.push(m); f.at=m.at; if(alive()){ $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(m,c)); phScroll(); } else f.unread=(f.unread||0)+1;
    }
    const ptags=fcPhotoOn()&&r&&typeof r.photo==='string'?r.photo.trim():''; if(ptags) fcNpcPhoto(c,f,ptags,alive,ty);
    if(f.log.length>400) { const cut=f.log.length-400; f.log.splice(0,cut); f.sumTo=Math.max(0,(f.sumTo||0)-cut); }
    const p=P(), d=today(); if(!p.fcAff||p.fcAff.d!==d) p.fcAff={d,n:0}; const add=Math.max(0,Math.min(2,Math.round(+((r&&r.aff)||0)))); if(add&&o&&p.fcAff.n<20){ const a=Math.min(add,20-p.fcAff.n); p.fcAff.n+=a; addAff(c,a); }
    mark('prog'); if(f.log.length-(f.sumTo||0)>70) fcSummarize(cid);
  }finally{ FCBUSY=false; ty.remove(); }
}
function fcPhotoOn(){ return P().fcPhoto!==false&&imgReady(); }
async function fcNpcPhoto(c,f,tags,alive,ty){
  const t2=document.createElement('div'); t2.className='msg'; t2.innerHTML=`<div class="av sm">${art(c)}</div><div class="bub typing"><i></i><i></i><i></i></div>`; if(alive()){ $('#phChat').appendChild(t2); phScroll(); }
  try{ const b=await naiDraw('illust',joinTags(c.naiPrompt,tags),{styleId:c.naiStyle,frame:'cowboy shot',pose:''}), k='chat_'+uid(); await idbPut(IMGNS+k,b); chatImgCache[k]=URL.createObjectURL(b);
    const m={w:'p',t:'',img:k,at:Date.now()}; f.log.push(m); f.at=m.at; mark('prog'); if(alive()){ t2.remove(); $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(m,c)); phScroll(); } else f.unread=(f.unread||0)+1;
  }catch(e){ }finally{ t2.remove(); } }
async function fcSummarize(cid){
  const c=charById(cid), f=fcOf(cid); const end=f.log.length-24, part=f.log.slice(f.sumTo||0,end); if(part.length<20) return;
  try{ const r=await aiJSON(fcSummarizePrompt({c,f,part}),null,'quick'); if(r&&r.summary){ f.sum=String(r.summary).slice(0,1200); f.sumTo=end; mark('prog'); } }catch(e){ quietErr(e,'0100-messenger.js:151'); }
}
function phScroll(){const el=$('#phChat'); if(el){ el.scrollTop=el.scrollHeight; if(el.querySelector('[data-chatimg]')) hydrateChatImgs(); }}
async function phPlay(t,c,s,token){
  const lines=parseScript(t.script);
  const alive=()=>PH&&PH.token===token&&$('#phChat');
  while(s.pos<lines.length){
    if(!alive()) return;
    const L=lines[s.pos];
    if(L.cond&&L.cond!==s.pick){s.pos++;continue;}
    if(L.type==='choice'){ $('#phIn').innerHTML=L.opts.map((o,i)=>`<button type="button" class="btn ghost block" data-act="phpick" data-tid="${esc(t.id)}" data-n="${i+1}">${esc(sub(o))}</button>`).join('')+`<button class="linkb ph-sw2" data-act="phmode" data-v="free">⌨ 직접 입력으로 전환</button>`; phMode('pick'); return; }
    let entry=null;
    if(L.type==='say'){
      if(isMe(L.who)&&s.lastPick){ const nz=x=>sub(String(x||'')).replace(/[\s.,!?~…'"「」]/g,''), a=nz(L.text), b=nz(s.lastPick); if(a===b||(a.length>3&&b.length>3&&(a.includes(b)||b.includes(a)))){ s.pos++; s.lastPick=''; continue; } } // 고른 선택지를 대본이 한 번 더 말하면 건너뛰기
      if(isMe(L.who)){ $('#phIn').innerHTML=`<button type="button" class="btn ghost block" data-act="phsay" data-tid="${esc(t.id)}">▶ ${esc(sub(L.text))}</button><button class="linkb ph-sw2" data-act="phmode" data-v="free">⌨ 직접 입력으로 전환</button>`; phMode('pick'); return; }
      else{
        const ty=document.createElement('div'); ty.className='msg'; ty.innerHTML=`<div class="av sm">${art(c)}</div><div class="bub typing"><i></i><i></i><i></i></div>`;
        $('#phChat').appendChild(ty); phScroll();
        await wait(Math.min(1800,500+L.text.length*35)); ty.remove(); if(!alive()) return;
        entry={w:'c',t:sub(L.text)};
      }
    } else if(L.type==='cmd'&&L.cmd==='스티커'&&emoKey(L.arg)){ await wait(600); if(!alive()) return; entry={w:'k',t:emoKey(L.arg)}; } // 스티커(0462)
    else if(L.type==='cmd'&&['사진','소품','배경'].includes(L.cmd)){ await wait(800); if(!alive()) return; entry={w:'p',t:L.arg}; }
    else if(L.type==='nar'||L.type==='place'){ entry={w:'s',t:sub(L.text)}; }
    if(!alive()) return;
    s.pos++; if(entry) s.lastPick='';
    if(entry){ entry.at=Date.now(); s.log.push(entry); s.at=entry.at; $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(entry,c)); phScroll(); mark('prog'); }
  }
  if(!s.done){
    s.done=true; s.at=Date.now();
    mark('prog'); if(own(c.id)) addAff(c,10); updateBadge(); checkTriggers();
    if(alive()){ $('#phIn').innerHTML=''; const nx=roomThreads(c.id).find(x=>!x.s.done&&x.t); if(nx){ PH.tid=nx.t.id; nx.s.t0=nx.s.t0||Date.now(); phMode('free'); phPlay(nx.t,c,nx.s,token); } else { PH.tid=null; phMode('free'); } }
  }
}
