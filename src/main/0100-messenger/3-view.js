/* ===== 0100-messenger — View(HTML·DOM을 만듦) ===== */
/* src/main/0100-messenger/0100-messenger.js에서 옮김 */
function updateBadge(){const el=document.querySelector('.lb-ico[data-act="phone"]'); if(!el) return; const n=unread(); let e=el.querySelector('em'); if(!n){ if(e) e.remove(); return; } if(!e){ e=document.createElement('em'); el.appendChild(e); } e.textContent=n;} // 로비 대화 아이콘 배지(예전 #phBadge는 화면에 없음)
function notify(t,more){
  const c=threadChar(t); const first=parseScript(t.script).find(l=>l.type==='say'&&!isMe(l.who));
  const el=$('#notif');
  el.innerHTML=`<button class="nt" data-act="openthread" data-id="${t.id}"><div class="av">${art(c)}</div><div class="nt-t"><small>${esc(T('talk'))}${more>0?`, 외 ${more}건`:''}</small><b>${esc(c.name)}</b><span>${esc(sub(first?first.text:t.title))}</span></div></button>`;
  sfx('알림'); try{navigator.vibrate&&navigator.vibrate([60,40,60]);}catch(e){}
  clearTimeout(el._t); el._t=setTimeout(()=>{const b=el.querySelector('.nt'); if(b){b.classList.add('out');setTimeout(()=>{el.innerHTML='';},300);}},5000);
}
function openPhone(tid){ $('#notif').innerHTML=''; $('#phone').hidden=false; if(tid&&P().inbox[tid]) openThread(tid); else phoneList(); }
function closePhone(){ PH=null; $('#phone').hidden=true; $('#phone').innerHTML=''; render(); }
function phoneList(){
  PH=null; const rooms=phRooms();
  $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phclose" aria-label="닫기">✕</button><b>${esc(T('talk'))}</b><button data-act="phnew" aria-label="대화 추가">＋</button></div><div class="ph-list">${
    rooms.length?rooms.map(x=>{ const l=x.last; return `<button class="ph-row" data-act="openfc" data-id="${esc(x.c.id)}"><div class="av">${art(x.c)}</div><div class="t"><b>${esc(x.c.name)}</b><span>${esc(l?(l.w==='k'?'스티커를 보냈어요':l.w==='p'?'사진을 보냈어요':(l.w==='me'?'나: ':'')+(l.t||(l.img?'사진':''))):(x.title||'대화를 시작해 보세요'))}</span></div>${x.unread?'<i class="dot"></i>':''}</button>`; }).join('')
    :`<p class="muted" style="text-align:center;padding:40px 16px">아직 대화가 없어요. ${esc(T('crew'))}과(와) 친해지거나 ${esc(T('ops'))}을(를) 진행하면 연락이 와요.<br><br><button class="btn sm" data-act="phnew">＋ 대화 추가</button></p>`}</div></div>`;
}
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
function phPendRender(){ const w=$('#phPend'); if(!w) return; const k=PH&&PH.pendImg; w.hidden=!k; w.innerHTML=k?`<img src="${esc(chatImgCache[k]||'')}" alt="보낼 사진"><span>이 사진을 보낼게요</span><button class="btn sm ghost" data-act="phpendx" aria-label="사진 빼기">✕</button>`:''; }
/* 대화방 화면(View) */
function roomShow(c,it){ $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="${PH.sel?'phselend':'phback'}" aria-label="뒤로">‹</button><b>${PH.sel?'지울 메시지를 누르세요':esc(c.name)}</b>${PH.sel?`<button class="ph-done" data-act="phselend">완료</button>`:`<button data-act="phmenu" data-id="${esc(c.id)}" aria-label="메뉴">⋯</button>`}</div>
    <div class="ph-chat ${PH.sel?'selmode':''}" id="phChat">${it.length?it.map((x,i)=>PH.sel?`<div class="phsel" data-act="phdel" data-i="${i}">${bubbleHTML(x.l,c)}</div>`:bubbleHTML(x.l,c)).join(''):`<div class="sys empty">${esc(c.name)}와(과)의 대화방이에요. 오른쪽 위 ⋯ → 대화 추가로 새 대화를 받거나, 아래에서 바로 말을 걸어 보세요.</div>`}</div>
    <div class="ph-in" id="phIn" hidden></div>
    <div class="ph-pend" id="phPend" hidden></div><div class="ph-in fcin" id="phFree" ${PH.sel?'hidden':''}><button class="btn sm ghost ph-sw" data-act="phmode" data-v="pick" hidden aria-label="선택지 보기">선택지</button><button class="btn sm ghost ph-cam" data-act="fcphoto" aria-label="사진 보내기" ${SAMPLE?'':'disabled'}>📷</button><textarea id="fcIn" rows="1" maxlength="400" placeholder="${SAMPLE?'메시지 보내기':'글 AI를 등록하면 직접 말을 걸 수 있어요'}" ${SAMPLE?'':'disabled'}></textarea><button class="btn sm" data-act="fcsend" ${SAMPLE?'':'disabled'}>전송</button></div></div>`;
}
/* 메신저 화면 조각(View): 대화방 열림 · 입력 중 표시(지우는 함수를 돌려줌) · 말풍선 · 빈 방 안내 지우기 · 입력 칸(비우기·사진 안내·초점) · 자유 입력으로 · 선택지·내 말 단추 · 아래 칸 비우기 */
function phOpen(){ return !!$('#phChat'); }
function phTyping(c){ const ty=document.createElement('div'); ty.className='msg'; ty.innerHTML=`<div class="av sm">${art(c)}</div><div class="bub typing"><i></i><i></i><i></i></div>`; const ch=$('#phChat'); if(ch){ ch.appendChild(ty); phScroll(); } return ()=>ty.remove(); }
function phBubble(m,c){ const ch=$('#phChat'); if(!ch) return; ch.insertAdjacentHTML('beforeend',bubbleHTML(m,c)); phScroll(); }
function phEmptyClear(cid){ const el=$('#phChat'); if(el&&el.children.length===1&&el.querySelector('.sys')&&roomLog(cid).length===1) el.innerHTML=''; }
function fcInputClear(inp,text){ inp.value=''; inp.style.height=''; [0,60,200].forEach(ms=>setTimeout(()=>{ const v=inp.value.trim(); if(v&&text.endsWith(v)&&v.length<=Math.max(2,text.length)) inp.value=''; },ms)); } /* 휴대폰 키보드가 늦게 되돌려 넣는 글도 지움 */
function fcInputPhotoHint(on=true){ const i=$('#fcIn'); if(!i) return; i.placeholder=on?'사진과 함께 보낼 말 (비워도 돼요)':'메시지 보내기'; if(on) i.focus({preventScroll:true}); }
function fcInputFocus(ms){ setTimeout(()=>{ const i=$('#fcIn'); if(i&&!IS_NATIVE&&!i.disabled) i.focus({preventScroll:true}); },ms); }
function phFreeShow(){ phInClear(); phMode('free'); const sw=$('.ph-sw'); if(sw) sw.hidden=true; }
function phInClear(){ const pi=$('#phIn'); if(pi) pi.innerHTML=''; }
function phChoicesShow(t,opts){ $('#phIn').innerHTML=opts.map((o,i)=>`<button type="button" class="btn ghost block" data-act="phpick" data-tid="${esc(t.id)}" data-n="${i+1}">${esc(sub(o))}</button>`).join('')+PH_FREE_SW; phMode('pick'); }
function phSayShow(t,text){ $('#phIn').innerHTML=`<button type="button" class="btn ghost block" data-act="phsay" data-tid="${esc(t.id)}">▶ ${esc(sub(text))}</button>`+PH_FREE_SW; phMode('pick'); }
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
async function fcSend(opt){
  opt=opt||{}; if(FCBUSY||!PH||!PH.fc) return; const cid=PH.fc, c=charById(cid), inp=$('#fcIn'); if(!c||!inp) return; if(!opt.img&&PH.pendImg) opt.img=PH.pendImg; const text=inp.value.trim(); if(!text&&!opt.img) return; if(!opt.img&&PH.lastSend&&PH.lastSend.t===text&&Date.now()-PH.lastSend.at<2500){ inp.value=''; return; } PH.lastSend={t:text,at:Date.now()}; if(opt.img){ PH.pendImg=null; phPendRender(); fcInputPhotoHint(false); }
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
  const f=fcOf(cid), token=PH.token, alive=()=>PH&&PH.token===token&&phOpen(); fcInputClear(inp,text);
  if(PH.tid){ if(threadFree(c,PH.tid)) updateBadge(); PH.tid=null; phFreeShow(); }
  const me={w:'me',t:text,at:Date.now()}; if(opt.img) me.img=opt.img; fcLogAdd(f,me); if(alive()){ phEmptyClear(cid); phBubble(me,c); }
  FCBUSY=true; let tyOff=alive()?phTyping(c):()=>{};
  try{
    const o=own(c.id), lv=affLv(o), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0)).map(x=>x.text).filter(Boolean);
    const pool=typeof affLinePool==='function'?affLinePool(c).slice(0,8):(c.lines||[]).slice(0,6);
    const recent=fcSendRecentText({cid,c});
    const r=await aiJSON(fcSendPrompt({c,pool,lv,files,recent,text,f,opt}),null,'default',opt.img?await chatImgB64(opt.img):undefined);
    tyOff(); const pn=playerName(), reps=(r&&Array.isArray(r.replies)?r.replies:r&&r.reply?[r.reply]:[]).map(x=>String(x||'').trim()).map(x=>x.replace(new RegExp('^'+c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[:：]\\s*'),'')).filter(x=>x&&!new RegExp('^(나|'+pn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'|'+T('player')+')\\s*[:：]').test(x)).slice(0,4);
    if(!reps.length){ if(r) toast('답장을 받지 못했어요. 다시 보내 주세요'); return; }
    for(let i=0;i<reps.length;i++){
      if(i){ const off2=alive()?phTyping(c):()=>{}; await wait(Math.min(1600,400+reps[i].length*30)); off2(); }
      const m={w:'c',t:reps[i],at:Date.now()}; fcLogAdd(f,m,!alive()); if(alive()) phBubble(m,c);
    }
    const ptags=fcPhotoOn()&&r&&typeof r.photo==='string'?r.photo.trim():''; if(ptags) fcNpcPhoto(c,f,ptags,alive);
    fcAfterReply(c,o,f,r); if(f.log.length-(f.sumTo||0)>70) fcSummarize(cid);
  }finally{ FCBUSY=false; tyOff(); }
}
function phScroll(){const el=$('#phChat'); if(el){ el.scrollTop=el.scrollHeight; if(el.querySelector('[data-chatimg]')) hydrateChatImgs(); }}
/* src/main/0100-messenger/0160-player-profile.js에서 옮김 */
function playerFormHTML(){ const p=P(), ai=!!SAMPLE, av=p.avatar&&imgSrc(p.avatar);
  return `<div class="g2"><div><label class="f" for="pf_call">호칭 <span class="muted" style="font-size:.75rem">(평소에 불리는 말)</span></label><input class="in" id="pf_call" maxlength="12" value="${esc(T('player'))}" placeholder="예: 지휘관"></div><div><label class="f" for="pf_name">이름 <span class="muted" style="font-size:.75rem">(필요할 때만)</span></label><input class="in" id="pf_name" maxlength="12" value="${esc(p.player||'')}" placeholder="비우면 호칭으로만 불려요"></div></div>
  ${ai?`<label class="f" for="pf_gender">당신의 성별은? (직접 쓰기)</label><input class="in" id="pf_gender" maxlength="40" value="${esc(p.genderTxt!=null?p.genderTxt:(({m:'남성',f:'여성'})[p.gender]||''))}" placeholder="예: 남성, 여성, 논바이너리… 비우면 정하지 않아요">
  <label class="f" for="pf_look">외모 (직접 쓰기)</label><textarea class="in" id="pf_look" maxlength="400" placeholder="예: 검은 단발, 회색 후드티, 키가 크고 마른 편, 왼쪽 귀에 피어싱">${esc(p.look||'')}</textarea>
  <label class="f" for="pf_bio">설정 (성격·과거·직업·능력 등, 직접 쓰기)</label><textarea class="in" id="pf_bio" maxlength="1500" placeholder="예: 전직 기사단 정보원. 말수가 적고 단 걸 좋아한다. 잃어버린 기억을 찾고 있다.">${esc(p.bio||'')}</textarea>
  <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="pf_hide" ${p.hideEyes?'checked':''}><span>앞머리로 눈 가리기 <span class="muted" style="font-size:.8rem">(미연시 주인공처럼 눈이 보이지 않게 그려요)</span></span></label>
`
  :`<label class="f" for="pf_gsel">성별</label><select class="in" id="pf_gsel">${opt([['m','남성'],['f','여성']],p.gender==='f'?'f':'m')}</select><p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI를 등록하면 성별과 외모를 직접 쓰고 프로필 그림도 만들 수 있어요.</p>`}
  <label class="f" for="pf_nai">프로필 그림 NAI 프롬프트 (비우면 외모 설명으로 자동 구성)</label><textarea class="in" id="pf_nai">${esc(p.avatar?.prompt||'')}</textarea>
  <div class="pf-av">${av?`<img src="${esc(av)}" alt="프로필">`:'<span>프로필 그림 없음</span>'}<div class="col">${imgReady()&&ai?`<button class="btn sm" data-act="pfdraw">${av?'다시 그리기':'외모로 프로필 그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="avatar">올리기</button>${av?'<button class="btn sm ghost" data-act="avdel">지우기</button>':''}</div></div>${imgReady()||!ai?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">그림 AI를 등록하면 외모로 프로필 그림을 만들 수 있어요.</p>'}`; }
function refreshPlayerForm(){ const w=$('#pfWrap'); if(w){const sheet=w.closest('.sheet')||$('#view'),position=uiScrollCapture(sheet);w.innerHTML=playerFormHTML();uiScrollRestore(sheet,position);} }
