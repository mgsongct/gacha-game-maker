/* ===== 갠톡 (자유 채팅) ===== */
let FCBUSY=false;
const EYE_TAG=/\b(eyes?|eyelash(es)?|pupils?|heterochromia|eyeliner|tsurime|tareme|sanpaku|jitome)\b/i;

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
function readPlayerForm(){ const p=P(); if($('#pf_name')) p.player=$('#pf_name').value.trim().slice(0,12);
  if($('#pf_call')){ const cv=$('#pf_call').value.trim().slice(0,12); if(cv&&cv!==T('player')){ G.meta.terms.player=cv; mark('meta'); } }
  if($('#pf_gender')){ const g=$('#pf_gender').value.trim().slice(0,40); p.genderTxt=g; p.gender=/^(남|남성|남자|male|man)$/i.test(g)?'m':/^(여|여성|여자|female|woman)$/i.test(g)?'f':''; }
  if($('#pf_gsel')){ p.gender=$('#pf_gsel').value; p.genderTxt=''; }
  if($('#pf_look')) p.look=$('#pf_look').value.trim().slice(0,400); if($('#pf_bio')) p.bio=$('#pf_bio').value.trim().slice(0,1500); if($('#pf_hide')) p.hideEyes=$('#pf_hide').checked;if($('#pf_nai'))naiBlocksSave(progSlot('avatar'),'prompt','pf_nai'); mark('prog'); }
const genderCode=g=>/^(남|남성|남자|male|man)$/i.test(g||'')?'m':/^(여|여성|여자|female|woman)$/i.test(g||'')?'f':'';
async function heroTags(hr){ const r=await aiJSON(heroTagsPrompt({hr}),null,'quick');
  let tags=String((r&&r.tags)||'').trim(); if(!tags) return '';
  if(hr.hide) tags=joinTags(tagList(tags).filter(t=>!EYE_TAG.test(tagKey(t))).join(', '),'hair over eyes, bangs covering eyes, long bangs');
  return tags; }
function refreshPlayerForm(){ const w=$('#pfWrap'); if(w){const sheet=w.closest('.sheet')||$('#view'),position=uiScrollCapture(sheet);w.innerHTML=playerFormHTML();uiScrollRestore(sheet,position);} }
async function playerDraw(btn){ readPlayerForm(); const p=P(); if(!p.look&&!p.avatar?.prompt){ toast('외모나 NAI 프롬프트를 먼저 적어 주세요'); return; } if(!imgReady()){ toast(imgNeed()); return; }
  const lab=btn.textContent; btn.disabled=true; btn.textContent='태그 만드는 중…';
  try{ const tags=p.avatar?.prompt||await heroTags({gender:p.genderTxt,look:p.look,hide:p.hideEyes}); if(!tags){ toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; }
    btn.textContent='그리는 중…'; const o=progSlot('avatar'); o.prompt=tags;
    const b=await naiDraw('char',tags,{candidateEligible:true,originalSrc:imgSrcRaw(o)||'',frame:'cowboy shot',pose:'looking at viewer'}); await storeImage(o,b,''); mark('prog'); toast('프로필 그림을 만들었어요'); refreshPlayerForm();
  }catch(e){ toast(naiErr(e)); } finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent=lab; } } }

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
  try{ const r=await aiJSON(fcSummarizePrompt({c,f,part}),null,'quick'); if(r&&r.summary){ f.sum=String(r.summary).slice(0,1200); f.sumTo=end; mark('prog'); } }catch(e){ quietErr(e,'0160-free-chat.js:87'); }
}
document.addEventListener('keydown',e=>{ if(e.target&&e.target.id==='fcIn'&&e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(e.isComposing||e.keyCode===229) return; fcSend(); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='fcIn'){ const t=e.target; t.style.height='auto'; t.style.height=Math.min(120,t.scrollHeight)+'px'; } });
// 휴대폰 키보드·주소창 때문에 입력칸이 가려지지 않게, 보이는 화면 높이에 맞춰요
(function(){ const vv=window.visualViewport; if(!vv) return; const fit=()=>{ const ph=document.getElementById('phone'); if(!ph||ph.hidden) return; ph.style.top=vv.offsetTop+'px'; ph.style.height=vv.height+'px'; ph.style.bottom='auto'; const el=document.getElementById('phChat'); if(el&&document.activeElement&&document.activeElement.id==='fcIn') el.scrollTop=el.scrollHeight; };
  vv.addEventListener('resize',fit); vv.addEventListener('scroll',fit); new MutationObserver(fit).observe(document.getElementById('phone'),{attributes:true,attributeFilter:['hidden']}); })();
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

