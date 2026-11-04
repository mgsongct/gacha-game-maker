/* ===== 0100-messenger — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0100-messenger/0100-messenger.js에서 옮김 */
function checkTriggers(silent){
  if(!P().seenOpening) return;
  const fresh=[];
  for(const t of G.threads){ if(P().inbox[t.id]) continue; if(trigOk(t)){P().inbox[t.id]={at:Date.now()+fresh.length,pos:0,pick:0,done:false,log:[]};fresh.push(t);} }
  if(fresh.length){ mark('prog'); if(!silent) notify(fresh[0],fresh.length-1); updateBadge(); }
}
/* 갠톡 사진 고르기(Controller): 줄여 저장(Model) → 보낼 사진 표시(View) */
async function chatPhotoPick(f){ if(!f||!PH||!PH.fc) return; try{ PH.pendImg=await chatImgStore(await shrink(f,1280)); phPendRender(); fcInputPhotoHint(); }catch(e){ toast('사진을 불러오지 못했어요'); } }
function openRoom(cid,opt){
  const c=charById(cid); if(!c) return; const f=fcOf(cid); const token={}; opt=opt||{};
  const act=roomThreads(cid).find(x=>!x.s.done&&x.t);
  PH={fc:cid,tid:act?act.t.id:null,token,mode:'free',sel:!!opt.sel};
  roomShow(c,roomItems(cid)); if(!PH.sel) phScroll(); fcRead(f);
  if(PH.sel) return;
  if(act){ act.s.t0=act.s.t0||Date.now(); phPlay(act.t,c,act.s,token); }
  else fcInputFocus(50);
}
/* 캐릭터가 사진을 보냄(Controller): 입력 중 표시 → 그림(서비스)·저장(Model) → 말풍선 */
async function fcNpcPhoto(c,f,tags,alive){
  const off=alive()?phTyping(c):()=>{};
  try{ const k=await chatImgStore(await naiDraw('illust',joinTags(c.naiPrompt,tags),{styleId:c.naiStyle,frame:'cowboy shot',pose:''}));
    const m={w:'p',t:'',img:k,at:Date.now()}; off(); fcLogAdd(f,m,!alive()); if(alive()) phBubble(m,c);
  }catch(e){ quietErr(e,'0100-messenger.js:175'); }finally{ off(); } }
async function phPlay(t,c,s,token){
  const lines=parseScript(t.script);
  const alive=()=>PH&&PH.token===token&&$('#phChat');
  while(s.pos<lines.length){
    if(!alive()) return;
    const L=lines[s.pos];
    if(L.cond&&L.cond!==s.pick){s.pos++;continue;}
    if(L.type==='choice'){ phChoicesShow(t,L.opts); return; }
    let entry=null;
    if(L.type==='say'){
      if(isMe(L.who)&&s.lastPick){ const nz=x=>sub(String(x||'')).replace(/[\s.,!?~…'"「」]/g,''), a=nz(L.text), b=nz(s.lastPick); if(a===b||(a.length>3&&b.length>3&&(a.includes(b)||b.includes(a)))){ s.pos++; s.lastPick=''; continue; } } // 고른 선택지를 대본이 한 번 더 말하면 건너뛰기
      if(isMe(L.who)){ phSayShow(t,L.text); return; }
      else{
        const off=phTyping(c); await wait(Math.min(1800,500+L.text.length*35)); off(); if(!alive()) return;
        entry={w:'c',t:sub(L.text)};
      }
    } else if(L.type==='cmd'&&L.cmd==='스티커'&&emoKey(L.arg)){ await wait(600); if(!alive()) return; entry={w:'k',t:emoKey(L.arg)}; } // 스티커(0462)
    else if(L.type==='cmd'&&['사진','소품','배경'].includes(L.cmd)){ await wait(800); if(!alive()) return; entry={w:'p',t:L.arg}; }
    else if(L.type==='nar'||L.type==='place'){ entry={w:'s',t:sub(L.text)}; }
    if(!alive()) return;
    s.pos++; if(entry) s.lastPick='';
    if(entry){ thrLogAdd(s,entry); phBubble(entry,c); }
  }
  if(!s.done){
    thrDone(c,s); updateBadge(); checkTriggers();
    if(alive()){ phInClear(); const nx=roomThreads(c.id).find(x=>!x.s.done&&x.t); if(nx){ PH.tid=nx.t.id; nx.s.t0=nx.s.t0||Date.now(); phMode('free'); phPlay(nx.t,c,nx.s,token); } else { PH.tid=null; phMode('free'); } }
  }
}
/* src/main/0100-messenger/0160-player-profile.js에서 옮김 */
function readPlayerForm(){ const p=P(); if($('#pf_name')) p.player=$('#pf_name').value.trim().slice(0,12);
  if($('#pf_call')){ const cv=$('#pf_call').value.trim().slice(0,12); if(cv&&cv!==T('player')){ G.meta.terms.player=cv; mark('meta'); } }
  if($('#pf_gender')){ const g=$('#pf_gender').value.trim().slice(0,40); p.genderTxt=g; p.gender=/^(남|남성|남자|male|man)$/i.test(g)?'m':/^(여|여성|여자|female|woman)$/i.test(g)?'f':''; }
  if($('#pf_gsel')){ p.gender=$('#pf_gsel').value; p.genderTxt=''; }
  if($('#pf_look')) p.look=$('#pf_look').value.trim().slice(0,400); if($('#pf_bio')) p.bio=$('#pf_bio').value.trim().slice(0,1500); if($('#pf_hide')) p.hideEyes=$('#pf_hide').checked;if($('#pf_nai'))naiBlocksSave(progSlot('avatar'),'prompt','pf_nai'); mark('prog'); }
async function playerDraw(rep){ readPlayerForm(); const p=P(); if(!p.look&&!p.avatar?.prompt){ toast('외모나 NAI 프롬프트를 먼저 적어 주세요'); return; } if(!imgReady()){ toast(imgNeed()); return; }
  if(rep) rep('태그 만드는 중…');
  try{ const tags=p.avatar?.prompt||await heroTags({gender:p.genderTxt,look:p.look,hide:p.hideEyes}); if(!tags){ toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; }
    if(rep) rep('그리는 중…'); const o=progSlot('avatar'); o.prompt=tags;
    const b=await naiDraw('char',tags,{candidateEligible:true,originalSrc:imgSrcRaw(o)||'',frame:'cowboy shot',pose:'looking at viewer'}); await storeImage(o,b,''); mark('prog'); toast('프로필 그림을 만들었어요'); refreshPlayerForm();
  }catch(e){ toast(naiErr(e)); } finally{ if(rep) rep.end(); } }
/* src/main/0100-messenger/120-messenger.js에서 옮김 */
async function handleMessengerAction(a,t,id,p,e){
  switch(a){
case 'phone': e.stopPropagation(); openPhone(); break;
case 'openthread': notifClear(); openPhone(id); break;
case 'phclose': closePhone(); break;
case 'phback': phoneList(); break;
case 'openfc': openFree(id); break;
case 'fcsend': fcSend(); break;
case 'fcphoto': if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } if(FCBUSY){ toast('답장을 기다리는 중이에요'); break; } $('#chatfile').click(); break;
case 'fcphototog': { const p=P(); p.fcPhoto=p.fcPhoto===false; mark('prog'); phMenuClose(); toast(p.fcPhoto?'캐릭터가 가끔 사진을 보내요 (그림 AI 사용)':'캐릭터가 사진을 보내지 않아요'); break; }
case 'chatimg': chatImgView(t.dataset.k); break;
case 'phpendx': if(PH){ PH.pendImg=null; phPendRender(); const i=$('#fcIn'); if(i) i.placeholder='메시지 보내기'; } break;
case 'chatimgsave': { e.stopPropagation(); const u=chatImgCache[t.dataset.k]; if(u) saveImgUrl(u,'chat-photo'); break; }
case 'phpick': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s){ if(PH.fc) openRoom(PH.fc); break; }
      const c=threadChar(th), lines=parseScript(th.script); let L=lines[s.pos];
      if(!L||L.type!=='choice'){ let j=s.pos; while(j>0&&!(lines[j]&&lines[j].type==='choice')) j--; if(lines[j]&&lines[j].type==='choice'&&!s.log.some(x=>x.w==='me'&&x.pi===j)){ s.pos=j; L=lines[j]; } else { openRoom(c.id); break; } }
      const el=+t.dataset.n; s.pick=el; s.lastPick=L.opts[el-1]||''; const en={w:'me',t:sub(L.opts[el-1]||''),at:Date.now(),pi:s.pos}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid;
      phSentShow(en,c); mark('prog'); phPlay(th,c,s,PH.token); break; }
case 'phmenu': phMenu(id); break;
case 'phmenuclose': { if(t.classList.contains('ph-menu')&&e.target!==t) break; phMenuClose(); break; }
case 'phadd': phAddView(id,PH&&PH.fc?'room':'list'); break;
case 'phaddback': { const a=PH&&PH.add, fr=PH&&PH.from; if(a&&fr==='room') openRoom(a); else phNewList(); break; }
case 'phaddai': { const c=charById(id); if(!c) break; const hint=$('#pa_hint').value.trim();
      const r=await aiJSON(phaddaiPrompt({c,hint}),uiProg(t));
      if(r&&$('#pa_script')){ if(r.title) $('#pa_title').value=String(r.title); if(r.script) $('#pa_script').value=nl(r.script); toast('대화를 채웠어요. 고칠 곳이 있으면 고치고 받기를 누르세요'); } break; }
case 'phaddsend': { const c=charById(id); if(!c) break; const sc=$('#pa_script').value.trim(); if(!sc){ toast(SAMPLE?'대화를 쓰거나 AI로 대화 쓰기를 눌러 주세요':'대화를 써 주세요'); break; }
      const now=Date.now(), th={id:uid(),charId:c.id,title:$('#pa_title').value.trim()||'메시지',trigger:{type:'start'},needOwn:!!own(c.id),script:sc,added:true};
      G.threads.push(th); mark('t:'+th.id); p.inbox[th.id]={at:now,t0:now,pos:0,pick:0,done:false,log:[]}; mark('prog'); updateBadge(); openRoom(c.id); break; }
case 'phsel': openRoom(id,{sel:true}); break;
case 'phselend': { const cid=PH&&PH.fc; if(cid) openRoom(cid); else phoneList(); break; }
case 'phdel': { const cid=PH&&PH.fc; if(!cid) break; const x=roomItems(cid)[+t.dataset.i]; if(!x) break; roomDel(cid,[x]); phKeep(()=>openRoom(cid,{sel:true})); toast('메시지를 지웠어요'); break; }
case 'phdelblock': { const b=roomLastBlock(id); if(!b.length) break; if(!(await appConfirm(`최근 대화 ${b.length}개 메시지를 지울까요?\n(호감도는 그대로예요)`))) break; roomDel(id,b); openRoom(id); toast('이번 대화를 지웠어요'); break; }
case 'phdelall': { const c=charById(id); if(!c) break; if(!(await appConfirm(`${c.name}와(과)의 대화방을 모두 지울까요?\n(이야기로 받은 대화도 기록만 지워지고, 호감도는 그대로예요)`))) break;
      roomThreads(id).forEach(({s})=>{ s.log.length=0; }); delete progSlot('fchat')[id]; mark('prog'); openRoom(id); toast('대화방을 비웠어요'); break; }
case 'phmode': phMode(t.dataset.v); break;
case 'phsay': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s) break; const c=threadChar(th), L=parseScript(th.script)[s.pos]; if(!L||L.type!=='say'||!isMe(L.who)) { openRoom(c.id); break; }
      const en={w:'me',t:sub(L.text),at:Date.now()}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid; phSentShow(en,c); mark('prog'); phPlay(th,c,s,PH.token); break; }
case 'phnew': phNewList(); break;
case 'fclear': squadSel=[]; refreshForm(); break;
  }
}
