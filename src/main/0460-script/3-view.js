/* ===== 0460-script — View(HTML·DOM을 만듦) ===== */
/* src/main/0460-script/0460-script-engine.js에서 옮김 */
function playStory(title,script,done){
  const ls=parseScript(script); if(!ls.length){done&&done();return;}
  S={title,lines:ls,i:0,done,cur:null,log:[],typing:false,full:'',timer:null,autoT:null,auto:false,choice:null,pick:0};
  { const sd=SND(); if(sd.voiceLang==='ja'&&sd.fishKey&&sd.voiceStory) jaBatch(ls.filter(L=>L.type==='say'&&!isMe(L.who)&&voiceOf(findSpeaker(L.who))).map(L=>L.text).slice(2)); } // 처음 두 줄은 바로 한 줄씩 옮겨서 기다리지 않게
  $('#ov').innerHTML=`<div class="vn" id="vn" data-act="vnnext"><div class="vn-bg" id="vnBg"></div><div class="vn-cg" id="vnCG" hidden></div><div class="vn-char dim ${P().settings.vnFull?'':'up'}" id="vnChar"></div><div class="vn-prop" id="vnProp" hidden></div><div class="vn-flash" id="vnFlash"></div><div class="vn-phone" id="vnPhone" hidden><div class="vp-top" id="vnPhName"></div><div class="vp-body" id="vnPhBody"></div></div>
    <div class="vn-top"><span class="ttl">${esc(title)}</span><button data-act="vnauto" id="vnAuto">자동</button><button data-act="vnlog">로그</button><button data-act="vnskip">건너뛰기</button></div>
    <div class="vn-place" id="vnPlace"></div>
    <div class="vn-box"><div class="vn-in"><div class="vn-name" id="vnName"></div><div class="vn-text" id="vnText"></div><div class="vn-choices" id="vnCh"></div></div><span class="vn-next" id="vnNext" hidden>▼</span></div></div>`;
  $('#ov').hidden=false;
  const fb=ls.find(l=>(l.type==='cmd'&&l.cmd==='배경')||l.type==='place'); setVnBg(fb?(fb.arg||fb.text):'');
  vnStep();
}
function setVnBg(name){const el=$('#vnBg');if(!el)return;el.setAttribute('style',name?bgStyle(name):'background:linear-gradient(180deg,#1b1530,#2b1a33 60%,#120e1c)');el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');}
function vnStep(){
  if(!S) return;
  if(S.typing){vnFinish();return;}
  if(S.choice) return;
  clearTimeout(S.autoT);
  while(S.i<S.lines.length){
    const L=S.lines[S.i++];
    if(L.cond&&L.cond!==S.pick) continue;
    // 고른 선택지를 대본이 플레이어 대사로 한 번 더 말하면 건너뛰어요('재미있겠는데' → '재미있겠는데.' 두 번 나오던 문제)
    if(L.type==='say'&&S.lastPick&&isMe(L.who)){ const nz=x=>sub(String(x||'')).replace(/[\s.,!?~…'"「」]/g,''), a=nz(L.text), b=nz(S.lastPick); S.lastPick=''; if(a===b||(a.length>3&&b.length>3&&(a.includes(b)||b.includes(a)))) continue; }
    else if(L.type==='say'||L.type==='nar') S.lastPick='';
    if(L.type==='cmd'){vnCmd(L);continue;}
    if(L.type==='place'){setVnBg(L.text);$('#vnPlace').textContent=L.text;S.log.push(L);continue;}
    if(L.type==='choice'){S.choice=L;$('#vnCh').innerHTML=L.opts.map((o,k)=>`<button data-act="vnpick" data-n="${k+1}">${esc(sub(o))}</button>`).join('');$('#vnNext').hidden=true;return;}
    vnShow(L); return;
  }
  vnEnd();
}
function vnCmd(L){
  const a=L.arg;
  if(L.cmd==='분기'){ S.branch=a; return; } // 다음 선택지를 시나리오 분기로 기록(0465-story-plan.js)
  if(vnDirectCmd(L)) return; // 연출·스티커·화면 효과(0462)
  if(L.cmd==='배경') setVnBg(a);
  else if(L.cmd==='음악') bgm(a);
  else if(L.cmd==='CG'||L.cmd==='cg'){ const g=$('#vnCG'); g.innerHTML=libArt(a)+'<button class="vn-cgx" data-act="vncgview" type="button">⤢ 크게 보기</button>'; g.hidden=false; g.classList.remove('in'); void g.offsetWidth; g.classList.add('in'); $('#vn').classList.add('cgon'); }
  else if(L.cmd==='CG끝'){ const g=$('#vnCG'); g.hidden=true; g.innerHTML=''; $('#vn').classList.remove('cgon'); }
  else if(L.cmd==='효과음') sfx(a);
  else if(L.cmd==='톡'){ S.phone=a; const ph=$('#vnPhone'); ph.hidden=false; $('#vnPhName').textContent=a; $('#vnPhBody').innerHTML=''; }
  else if(L.cmd==='톡끝'){ S.phone=null; $('#vnPhone').hidden=true; }
  else if(L.cmd==='음악끝') bgm(null);
  else if(L.cmd==='소품'||L.cmd==='사진'){const el=$('#vnProp');if(a==='끝')el.hidden=true;else{el.innerHTML=libArt(a);el.hidden=false;}}
  else if(L.cmd==='소품끝') $('#vnProp').hidden=true;
  else if(L.cmd==='효과'){const v=$('#vn'),f=$('#vnFlash');
    if(/흔들/.test(a)){v.classList.remove('shake');void v.offsetWidth;v.classList.add('shake');}
    if(/플래시|섬광/.test(a)){f.className='vn-flash';void f.offsetWidth;f.className='vn-flash w';}
    if(/암전/.test(a)){f.className='vn-flash';void f.offsetWidth;f.className='vn-flash b';}}
}
function vnShow(L){
  S.log.push(L); const el=$('#vnChar');
  if(S.phone&&L.type==='say'){
    const me=isMe(L.who), c=me?null:vnSpeaker(L.who), body=$('#vnPhBody');
    body.insertAdjacentHTML('beforeend',`<div class="msg ${me?'me':''}">${me?'':`<div class="av sm">${c?art(c):''}</div>`}<div class="bub">${esc(sub(L.text))}</div></div>`); body.scrollTop=body.scrollHeight;
    if(c&&c.voiceId&&SND().voiceStory) speak(c,L.text); else stopVoice(); sfx('알림');
    $('#vnName').textContent=''; $('#vnText').textContent=''; S.full=L.text; S.typing=false; $('#vnNext').hidden=false; vnPrefetch(); vnAutoNext(); return;
  }
  if(L.type==='say'){
    const me=isMe(L.who), c=me?null:vnSpeaker(L.who), fz=c?(L.face||textFace(c,L.text)):'', key=c?c.id+'|'+fz:'';
    if(c){ const fresh=!(S.stage||[]).some(x=>x.c===c); vnDirectSay(L,c,fz); if(fresh){ const sl=el.querySelector('.vn-slot.speak'); if(sl){ sl.classList.remove('enter'); void sl.offsetWidth; sl.classList.add('enter'); } } } // 무대·연출(0462)
    el.classList.toggle('dim',!c);
    $('#vnName').textContent=me?playerName():L.who; $('#vnText').classList.remove('nar');
    if(c&&c.voiceId&&SND().voiceStory) speak(c,L.text); else stopVoice();
  } else { stopVoice(); el.classList.add('dim'); $('#vnName').textContent=''; $('#vnText').classList.add('nar'); }
  vnPrefetch();
  vnType(sub(L.text));
}
function vnType(t){S.full=t;S.typing=true;let k=0;const el=$('#vnText');el.textContent='';$('#vnNext').hidden=true;clearInterval(S.timer);const tid=S.timer=setInterval(()=>{if(!el.isConnected||!S||S.timer!==tid){clearInterval(tid);return;}k+=2;el.textContent=t.slice(0,k);if(k>=t.length)vnFinish();},28);}
function vnFinish(){if(!S)return;clearInterval(S.timer);S.typing=false;const tx=$('#vnText'),nx=$('#vnNext');if(tx)tx.textContent=S.full;if(nx)nx.hidden=false;vnAutoNext();}
// 넘기기: 대본을 끝내되, 앞에 시나리오 분기([분기: id] 다음 선택지)가 있으면 그 선택지에서 멈춤 — 분기 기록이 빠지지 않게(0465). 분기 선택지가 떠 있으면 고를 때까지 기다림
function vnSkip(){ if(!S) return; if(S.choice&&S.branch) return; const k=S.lines.findIndex((L,i)=>i>=S.i&&L.type==='cmd'&&L.cmd==='분기'); if(S.choice||k<0){ vnEnd(); return; } if(S.typing) vnFinish(); S.i=k; vnStep(); }
function vnEnd(){if(!S)return;clearInterval(S.timer);clearTimeout(S.autoT);stopVoice();const d=S.done;S=null;closeOv();d&&d();}
function closeOv(){$('#ov').hidden=true;$('#ov').innerHTML='';sceneBgm();}
/* 대본 선택지 지우기 · 대화 기록 창(View) */
function vnChoiceClear(){ $('#vnCh').innerHTML=''; }
function openVnLog(){ openModal(`${head('대화 기록')}${S.log.map(L=>`<p style="margin:6px 0">${L.type==='say'?`<b>${esc(isMe(L.who)?playerName():L.who)}</b> ${esc(sub(L.text))}`:L.type==='place'?`<span class="muted">[${esc(L.text)}]</span>`:`<i class="muted">${esc(sub(L.text))}</i>`}</p>`).join('')}`); }
/* src/main/0460-script/0462-direction.js에서 옮김 */
function emoteHTML(name,big){ const k=emoKey(name); if(!k) return ''; const l=typeof G!=='undefined'&&G&&G.lib.find(x=>x.kind==='emote'&&x.name===k), s=l&&imgSrc(l);
  return `<i class="emo ${big?'big':''} e-${EMOTES[k].a}" data-emo="${esc(k)}">${s?`<img src="${esc(s)}" alt="${esc(k)}">`:EMOTES[k].svg}</i>`; }
// 무대: 최근 두 사람을 좌우로, 말하는 사람은 밝게
function vnStage(c,face){ const ch=$('#vnChar'); if(!ch) return null; S.stage=S.stage||[]; let e=S.stage.find(x=>x.c===c);
  if(!e){ e={c,face:null}; S.stage.push(e); const duo=P().vnStage!=='single'; while(S.stage.length>(duo?2:1)) S.stage.shift(); ch.innerHTML=S.stage.map(x=>`<div class="vn-slot" data-cid="${esc(x.c.id)}"></div>`).join(''); S.stage.forEach(x=>x.face=null); ch.classList.toggle('duo',S.stage.length>1); }
  S.stage.forEach(x=>{ const el=ch.querySelector(`.vn-slot[data-cid="${CSS.escape(x.c.id)}"]`); if(!el) return; if(x.c===c&&x.face!==face){ x.face=face; el.innerHTML=art(c,'',{face,upper:true}); } if(x.face===null){ x.face=''; el.innerHTML=art(x.c,'',{upper:true}); } el.classList.toggle('speak',x.c===c); });
  return ch.querySelector(`.vn-slot[data-cid="${CSS.escape(c.id)}"]`); }
function slotOf(name){ const c=vnSpeaker(name); return c?vnStage(c,(S.stage||[]).find(x=>x.c===c)?.face||''):null; }
function vnEmote(slot,emo){ if(!slot||!emo||dirMode()==='off') return; slot.querySelectorAll('.emo').forEach(x=>x.remove()); slot.insertAdjacentHTML('beforeend',emoteHTML(emo)); const i=slot.lastElementChild; setTimeout(()=>i&&i.remove(),1800); if(EMOTES[emo]&&/하트|놀람|화남/.test(emo)) try{ sfx(emo==='하트'?'확인':'타격'); }catch(e){} }
function vnMotion(slot,m){ if(!slot||!m||dirMode()==='off') return; const cls=MOTIONS[m]; if(!cls) return; Object.values(MOTIONS).forEach(x=>slot.classList.remove(x)); void slot.offsetWidth; slot.classList.add(cls); if(cls!=='m-exit'&&cls!=='m-near'&&cls!=='m-far') setTimeout(()=>slot.classList.remove(cls),900);
  if(cls==='m-exit') setTimeout(()=>{ S&&S.stage&&(S.stage=S.stage.filter(x=>x.c.id!==slot.dataset.cid)); slot.remove(); },600); }
function vnScreen(arg){ const v=$('#vn'), el=$('#vnFlash'); if(!v) return; const end=/끝$/.test(arg), key=String(arg).replace(/\s*끝$/,'').replace(/\s+/g,''), k=SCREEN_FX[key]; if(!k) return false;
  if(FX_KEEP.includes(k)){ v.classList.toggle('fx-'+k,!end); return true; }
  if(k==='shake'||k==='shake2'){ v.classList.remove('shake','shake2'); void v.offsetWidth; v.classList.add(k); }
  else { el.className='vn-flash'; void el.offsetWidth; el.className='vn-flash '+k; } return true; }
// 대본 엔진(0460)이 부르는 곳
function vnDirectSay(L,c,fz){ const d=L.dir||{}, slot=vnStage(c,fz); if(dirMode()==='off') return; vnMotion(slot,d.motion); vnEmote(slot,d.emo||(dirMode()==='auto'&&!d.face&&!d.motion?autoEmote(L.text):'')); }
function vnDirectCmd(L){ if(L.cmd==='연출'){ const [who,...rest]=String(L.arg).split(/\s+/), slot=slotOf(who), d=dirSplit(rest.join('|')); vnMotion(slot,d.motion); vnEmote(slot,d.emo); return true; }
  if(L.cmd==='스티커'){ if(S.phone){ const body=$('#vnPhBody'); body&&body.insertAdjacentHTML('beforeend',`<div class="msg"><div class="bub sticker">${emoteHTML(L.arg,true)}</div></div>`); } else vnEmote(S.stage&&S.stage.length?$('#vnChar .vn-slot.speak'):null,emoKey(L.arg)); return true; }
  if(L.cmd==='효과') return vnScreen(L.arg); return false; }
// 로비 터치 반응
function lobbyEmote(el,line,zone){ if(dirMode()==='off'||!el) return; const k=autoEmote(line)||(zone==='head'?'하트':''); if(!k) return; const r=el.getBoundingClientRect(), d=document.createElement('div'); d.className='lb-emo'; d.style.cssText=`left:${r.left+r.width*.6}px;top:${r.top+r.height*.12}px`; d.innerHTML=emoteHTML(k); document.body.appendChild(d); setTimeout(()=>d.remove(),1600); }
/* src/main/0460-script/0470-title-opening.js에서 옮김 */
function logoHTML(st){ const t=String(G.meta.title||''), w=t.split(/\s+/).filter(Boolean), sub=String(G.meta.sub||'');
  let kr=titleLines(t).map(tlSpan).join('');
  if(st==='orbitline'&&w.length>1) kr=`<small>${esc(w[0])}</small>${tlSpan(w.slice(1).join(' '))}`;
  if(st==='stroke') kr=tlSpan(w.join(' '));
  const en=!sub?'':st==='star'?`<div class="t-en">${sub.split(/\s+/).map(esc).join('<br>')}</div>`:st==='stroke'?`<div class="t-en"><span>-&nbsp;&nbsp;${esc(sub)}&nbsp;&nbsp;-</span></div>`:`<div class="t-en"><span>${esc(sub)}</span></div>`;
  return `<div class="t-logo ls-${st}">${st==='star'?'<i class="t-spire"></i>':''}${st==='orbitline'?'<i class="t-planet"></i>':''}<div class="t-kr">${kr}${st==='orbitline'||st==='stroke'?'<i class="t-line"></i>':''}</div>${en}</div>`; }
function showTitle(logo){
  const c=charById(P().titleChar)||charById(P().sec)||G.chars.find(x=>x.rarity===3&&(charIllust(x)||imgSrc(x)))||G.chars.find(x=>x.rarity===3)||G.chars[0];
  const oc=c&&own(c.id), ill=c&&P().lobbyMode!=='stand'&&((oc&&oc.useCg&&oc.dup>=5&&lbcgSrc(c))||charIllust(c));
  $('#ov').innerHTML=`<div class="title" data-act="titletap">${ill?`<div class="t-bg t-ill"><img src="${esc(ill)}" alt="" draggable="false"></div>`:`<div class="t-bg" style="${bgStyle(P().titleBg||'낙성 분화구')}"></div>${c?`<div class="t-char">${art(c)}</div>`:''}`}<div class="t-shade"></div>${shootHTML(7)}
    ${logoHTML(logoStyle(logo))}
    <button class="t-snd" id="tsnd" data-act="titlesnd" aria-label="${titleSndLabel(SND().bgmOn)}">${SND().bgmOn?'🔊':'🔇'}</button>
    <div class="t-touch">화면을 터치하세요</div><div class="t-ver">GACHA GAME MAKER · ${esc(APP_BUILD)}</div></div>`;
  $('#ov').hidden=false; bgm(sceneOf().title);
}
function playOpening(){
  OP={lines:(G.opening.lines||[]).filter(Boolean),i:-1,t:null};
  $('#ov').innerHTML=`<div class="op" data-act="opnext">${shootHTML(4)}<div class="op-txt" id="opTxt"></div><button class="skipb" data-act="opskip">건너뛰기</button></div>`;
  $('#ov').hidden=false; opNext();
}
function opNext(){
  if(!OP) return; clearTimeout(OP.t); OP.i++;
  if(OP.i>=OP.lines.length){opEnd();return;}
  const el=$('#opTxt'), last=OP.i===OP.lines.length-1, i=OP.i;
  el.classList.remove('show');
  setTimeout(()=>{ if(!OP||OP.i!==i) return; el.textContent=sub(OP.lines[i]); el.classList.toggle('big',last); el.classList.add('show'); OP.t=setTimeout(opNext,last?3600:2800); },500);
}
function opEnd(){
  if(!OP) return; clearTimeout(OP.t); OP=null;
  if(!P().seenOpening&&P().nameAsked){ playStory('프롤로그',G.opening.prologue,afterPrologue); return; }
  if(!P().seenOpening){
    openModal(`<h2>${esc(T('player'))}의 이름</h2><p class="muted">${esc(T('crew'))}들은 평소에 「${esc(T('player'))}」(이)라고 부르고, 이름은 필요할 때 불러요. 나중에 설정에서 바꿀 수 있어요.</p><label class="f" for="nm_call">호칭</label><input class="in" id="nm_call" maxlength="12" value="${esc(T('player'))}"><label class="f" for="nm_in">이름</label><input class="in" id="nm_in" maxlength="12" placeholder="비우면 호칭으로만 불려요" value="${esc(P().player)}"><div class="row" style="margin-top:14px"><button class="btn" data-act="setname">임명장에 서명하기</button></div>`,true);
    setTimeout(()=>$('#nm_in')&&$('#nm_in').focus({preventScroll:true}),100);
  } else playStory('프롤로그',G.opening.prologue,()=>render());
}
function titleSndShow(on){ const el=$('#tsnd'); if(el){ el.textContent=on?'🔊':'🔇'; el.setAttribute('aria-label',titleSndLabel(on)); } }
/* 로고 미리 보기(View): 설정 창 위에 고른 로고로 타이틀을 띄우고, 누르면 설정으로 돌아감 */
function logoPreview(style){ showTitle(style); const t=$('.title'); if(t){ t.dataset.act='logoprevclose'; const tt=t.querySelector('.t-touch'); if(tt) tt.textContent='눌러서 설정으로 돌아가기'; } $('#modal').hidden=true; }
function logoPreviewClose(){ closeOv(); if($('#modal').innerHTML) $('#modal').hidden=false; }
