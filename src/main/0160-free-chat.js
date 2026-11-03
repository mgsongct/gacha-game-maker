/* ===== 갠톡 (자유 채팅) ===== */
let FCBUSY=false;
const EYE_TAG=/\b(eyes?|eyelash(es)?|pupils?|heterochromia|eyeliner|tsurime|tareme|sanpaku|jitome)\b/i;
function avatarObj(){ const p=P(); if(!p.avatar||typeof p.avatar!=='object') p.avatar={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:'',img:null}; return p.avatar; }
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
  if($('#pf_look')) p.look=$('#pf_look').value.trim().slice(0,400); if($('#pf_bio')) p.bio=$('#pf_bio').value.trim().slice(0,1500); if($('#pf_hide')) p.hideEyes=$('#pf_hide').checked;if($('#pf_nai'))naiBlocksSave(avatarObj(),'prompt','pf_nai'); mark('prog'); }
function readHero(){ if(!$('#ng_h_name')) return null; return {name:$('#ng_h_name').value.trim().slice(0,12),call:$('#ng_h_call')?$('#ng_h_call').value.trim().slice(0,12):'',gender:$('#ng_h_gender').value.trim().slice(0,40),look:$('#ng_h_look').value.trim().slice(0,400),hide:$('#ng_h_hide').checked}; }
const genderCode=g=>/^(남|남성|남자|male|man)$/i.test(g||'')?'m':/^(여|여성|여자|female|woman)$/i.test(g||'')?'f':'';
async function heroTags(hr){ const r=await aiJSON(`플레이어 캐릭터의 외모 설명을 NovelAI 영어 태그로 바꿔라.\n성별·성 정체성: ${hr.gender||'정하지 않음'}\n외모: ${hr.look}\n규칙: 설명에 맞는 인원 태그(1boy, 1girl, 1other 중 하나)와 solo로 시작한다. 성인이다. 머리, ${hr.hide?'':'눈, '}체형, 옷, 장신구 같은 외모 태그만 쓴다. 자세·구도·배경·화풍 태그는 쓰지 않는다.\nJSON만 출력: {"tags":"..."}`,null,'quick');
  let tags=String((r&&r.tags)||'').trim(); if(!tags) return '';
  if(hr.hide) tags=joinTags(tagList(tags).filter(t=>!EYE_TAG.test(tagKey(t))).join(', '),'hair over eyes, bangs covering eyes, long bangs');
  return tags; }
function refreshPlayerForm(){ const w=$('#pfWrap'); if(w){const sheet=w.closest('.sheet')||$('#view'),position=uiScrollCapture(sheet);w.innerHTML=playerFormHTML();uiScrollRestore(sheet,position);} }
async function playerDraw(btn){ readPlayerForm(); const p=P(); if(!p.look&&!p.avatar?.prompt){ toast('외모나 NAI 프롬프트를 먼저 적어 주세요'); return; } if(!imgReady()){ toast(imgNeed()); return; }
  const lab=btn.textContent; btn.disabled=true; btn.textContent='태그 만드는 중…';
  try{ const tags=p.avatar?.prompt||await heroTags({gender:p.genderTxt,look:p.look,hide:p.hideEyes}); if(!tags){ toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; }
    btn.textContent='그리는 중…'; const o=avatarObj(); o.prompt=tags;
    const b=await naiDraw('char',tags,{candidateEligible:true,originalSrc:imgSrcRaw(o)||'',frame:'cowboy shot',pose:'looking at viewer'}); await storeImage(o,b,''); mark('prog'); toast('프로필 그림을 만들었어요'); refreshPlayerForm();
  }catch(e){ toast(naiErr(e)); } finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent=lab; } } }
function FC(){ const p=P(); if(!p.fchat||typeof p.fchat!=='object') p.fchat={}; return p.fchat; }
function fcOf(cid){ const f=FC(); return f[cid]||(f[cid]={log:[],sum:'',sumTo:0,at:0}); }
function openFree(cid){ openRoom(cid); }
function fcProgress(){ const st=(typeof mainStages==='function'?mainStages():[]).filter(s=>P().cleared[s.id]); return st.length?st.map(s=>s.code+' '+s.title).join(', '):'아직 이야기를 시작하지 않았다'; }
async function fcSend(opt){
  opt=opt||{}; if(FCBUSY||!PH||!PH.fc) return; const cid=PH.fc, c=charById(cid), inp=$('#fcIn'); if(!c||!inp) return; if(!opt.img&&PH.pendImg) opt.img=PH.pendImg; const text=inp.value.trim(); if(!text&&!opt.img) return; if(!opt.img&&PH.lastSend&&PH.lastSend.t===text&&Date.now()-PH.lastSend.at<2500){ inp.value=''; return; } PH.lastSend={t:text,at:Date.now()}; if(opt.img){ PH.pendImg=null; phPendRender(); inp.placeholder='메시지 보내기'; }
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
  const f=fcOf(cid), token=PH.token, alive=()=>PH&&PH.token===token&&$('#phChat'); inp.value=''; inp.style.height=''; [0,60,200].forEach(ms=>setTimeout(()=>{ const v=inp.value.trim(); if(v&&text.endsWith(v)&&v.length<=Math.max(2,text.length)) inp.value=''; },ms));
  if(PH.tid){ const th=threadById(PH.tid), s0=th&&P().inbox[PH.tid]; if(th&&s0&&!s0.done){ s0.done=true; s0.freed=true; s0.pos=parseScript(th.script).length; s0.at=Date.now(); if(own(c.id)) addAff(c,10); updateBadge(); } PH.tid=null; const pi=$('#phIn'); if(pi) pi.innerHTML=''; phMode('free'); const sw=$('.ph-sw'); if(sw) sw.hidden=true; }
  const me={w:'me',t:text,at:Date.now()}; if(opt.img) me.img=opt.img; f.log.push(me); f.at=me.at; if(alive()){ const ch=$('#phChat'); if(ch.children.length===1&&ch.querySelector('.sys')&&roomLog(cid).length===1) ch.innerHTML=''; ch.insertAdjacentHTML('beforeend',bubbleHTML(me,c)); phScroll(); } mark('prog');
  FCBUSY=true; const ty=document.createElement('div'); ty.className='msg'; ty.innerHTML=`<div class="av sm">${art(c)}</div><div class="bub typing"><i></i><i></i><i></i></div>`; if(alive()){ $('#phChat').appendChild(ty); phScroll(); }
  try{
    const o=own(c.id), lv=affLv(o), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0)).map(x=>x.text).filter(Boolean);
    const pool=typeof affLinePool==='function'?affLinePool(c).slice(0,8):(c.lines||[]).slice(0,6);
    const recent=roomLog(cid).slice(-24).map(l=>l.w==='me'?(l.img?`(${playerName()}이(가) 사진을 보냄${l.t?': '+l.t:''})`:`${playerName()}: ${l.t}`):l.w==='c'?`${c.name}: ${l.t}`:l.w==='p'?`(${c.name}이(가) 사진을 보냄)`:`(${l.t})`).join('\n');
    const r=await aiJSON(`${RULES}
${ctx()}

너는 지금 「${c.name}」이다. ${T('talk')} 메신저로 ${playerName()}(${T('player')})와(과) 1:1 개인 채팅을 하고 있다.
${c.name}: 소속 ${c.faction||'무소속'}, ${ROLE[c.role]||''}. 프로필: ${c.profile||''}
말투 예시: ${pool.map(x=>'"'+x+'"').join(' / ')}
호감도 Lv.${lv} (1~10). 호감도에 맞는 거리감으로 대한다(낮으면 조금 서먹하게, 높으면 편하고 다정하게).
${files.length?'이 캐릭터가 이미 털어놓은 비밀: '+files.join(' / '):''}
플레이어가 지금까지 겪은 이야기: ${fcProgress()}
${(()=>{ const m=G.chapters.filter(x=>x.kind==='main'&&x.summary).slice(-2); return m.length?'최근 메인 스토리 요약: '+m.map(x=>x.title+' — '+x.summary).join(' / '):''; })()}${relCtx(recent+'\n'+text,[baseChar(c).id,REL_ME],30)}
${f.sum?'예전 대화 요약: '+f.sum:''}
최근 대화:
${recent}

${opt.img?`방금 ${playerName()}이(가) 사진을 보냈다(첨부한 이미지). 사진 속 내용을 보고 ${c.name}답게 반응한다. 사진이 보이지 않으면 내용을 지어내지 말고 무슨 사진인지 물어본다.\n`:''}${fcPhotoOn()?`사진: 대화 흐름상 자연스러울 때만(셀카를 부탁받았거나, 지금 있는 곳이나 물건을 보여 줄 때) 가끔 사진 1장을 보낼 수 있다. 보낼 때는 "photo"에 사진 장면을 영어 Danbooru 태그로 쓴다(예: "selfie, cafe, holding cup, smile, indoors"). 대부분의 답장에는 사진을 보내지 않는다.\n`:''}규칙: 실제 메신저처럼 짧은 말풍선 1~3개로 답한다. 너는 ${c.name}의 말만 쓴다. ${playerName()}의 대사, 생각, 행동을 절대 대신 쓰지 않는다. 지문, 괄호 속 행동 묘사, 이름표 없이 대사만 쓴다. ${c.name}의 말투와 성격을 지킨다. 플레이어가 아직 보지 못한 메인 플롯의 비밀이나 반전은 말하지 않고 모르는 척하거나 얼버무린다. 대화가 부적절한 방향으로 가면 캐릭터답게 화제를 돌린다. 가끔 먼저 질문을 던지거나 최근 사건을 언급해도 좋다.
JSON만 출력: {"replies":["말풍선1","말풍선2"],"aff":0~2 정수(대화가 즐겁거나 의미 있었으면 1~2)${fcPhotoOn()?',"photo":"사진을 보낼 때만, 장면 태그. 안 보내면 빈 문자열"':''}}`,null,'default',opt.img?await chatImgB64(opt.img):undefined);
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
  try{ const r=await aiJSON(`${c.name}와(과) ${playerName()}의 메신저 대화를 다음 대화에서 참고할 수 있게 요약하라. 약속, 서로 알게 된 사실, 감정 변화, 별명, 농담을 중심으로 6문장 이내.
${f.sum?'기존 요약: '+f.sum+'\n':''}새 대화:
${part.map(l=>(l.w==='me'?playerName():l.w==='c'?c.name:'')+': '+l.t).join('\n')}
JSON만 출력: {"summary":"요약"}`,null,'quick'); if(r&&r.summary){ f.sum=String(r.summary).slice(0,1200); f.sumTo=end; mark('prog'); } }catch(e){ quietErr(e,'0160-free-chat.js:87'); }
}
document.addEventListener('keydown',e=>{ if(e.target&&e.target.id==='fcIn'&&e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(e.isComposing||e.keyCode===229) return; fcSend(); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='fcIn'){ const t=e.target; t.style.height='auto'; t.style.height=Math.min(120,t.scrollHeight)+'px'; } });
// 휴대폰 키보드·주소창 때문에 입력칸이 가려지지 않게, 보이는 화면 높이에 맞춰요
(function(){ const vv=window.visualViewport; if(!vv) return; const fit=()=>{ const ph=document.getElementById('phone'); if(!ph||ph.hidden) return; ph.style.top=vv.offsetTop+'px'; ph.style.height=vv.height+'px'; ph.style.bottom='auto'; const c=document.getElementById('phChat'); if(c&&document.activeElement&&document.activeElement.id==='fcIn') c.scrollTop=c.scrollHeight; };
  vv.addEventListener('resize',fit); vv.addEventListener('scroll',fit); new MutationObserver(fit).observe(document.getElementById('phone'),{attributes:true,attributeFilter:['hidden']}); })();
function phScroll(){const ch=$('#phChat'); if(ch){ ch.scrollTop=ch.scrollHeight; if(ch.querySelector('[data-chatimg]')) hydrateChatImgs(); }}
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

