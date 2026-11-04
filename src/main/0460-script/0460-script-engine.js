/* =========================================================
   대본 엔진
   ========================================================= */
// 한 줄에 붙어 나온 [소품 끝]·[배경: …] 같은 지시를 따로 떼어 내요(예: "문장. [소품 끝]")
const TAG_RE=/\[(?:(?:소품|음악|톡|CG|cg)\s*끝|(?:배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：][^\]\n]+)\]/g;
function splitTags(l){ const m0=l.match(/^(\d\)\s*)?([\s\S]*)$/), pre=m0[1]||'', body=m0[2]; TAG_RE.lastIndex=0; if(!TAG_RE.test(body)){ TAG_RE.lastIndex=0; return [l]; } TAG_RE.lastIndex=0;
  if(/^[^:：\[\s][^:：]{0,20}[:：]\s*\[[^\]]+\]$/.test(body)||/^\[[^\]]+\]$/.test(body)) return [l];
  const out=[]; let last=0, mm; while((mm=TAG_RE.exec(body))){ const before=body.slice(last,mm.index).trim(); if(before) out.push(before); out.push(mm[0]); last=mm.index+mm[0].length; } const rest=body.slice(last).trim(); if(rest) out.push(rest); TAG_RE.lastIndex=0;
  const sp=out[0]&&!out[0].startsWith('[')&&out[0].match(/^([^:：\[\s][^:：]{0,20})[:：]/); // 대사 중간에 지시가 끼면 뒤 조각도 같은 사람의 대사로
  return out.map((x,i)=>pre+(sp&&i>0&&!x.startsWith('[')?sp[1].trim()+': '+x:x)); }
function parseScript(t){
  return unComma(t).split('\n').map(l=>l.trim()).filter(Boolean).flatMap(splitTags).map(raw=>{
    let l=raw,cond=0,m,o;
    // 선택지 갈래: "1) 대사", "1）", "(1) 대사", "[1] 대사", "1. 대사", "이름: 1) 대사" 모두 같은 뜻으로 읽어요
    if((m=l.match(/^[(\[（]?([1-9])\s*[)\]）.]\s*(.+)$/))&&!/^\d+\.\d/.test(l)){cond=+m[1];l=m[2];}
    else if((m=l.match(/^([^:：\s][^:：]{0,20}[:：])\s*[(\[（]?([1-9])\s*[)\]）]\s*(.+)$/))){cond=+m[2];l=m[1]+' '+m[3];}
    if(/^\[소품\s*끝\]$/.test(l)) o={type:'cmd',cmd:'소품끝',arg:''};
    else if(/^\[음악\s*끝\]$/.test(l)) o={type:'cmd',cmd:'음악끝',arg:''};
    else if(/^\[톡\s*끝\]$/.test(l)) o={type:'cmd',cmd:'톡끝',arg:''};
    else if(/^\[CG\s*끝\]$/i.test(l)) o={type:'cmd',cmd:'CG끝',arg:''};
    else if((m=l.match(/^\[(배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：]\s*(.+?)\]$/))) o={type:'cmd',cmd:m[1],arg:m[2].trim()};
    else if((m=l.match(/^\[(.+?)\]/))) o={type:'place',text:m[1].trim()};
    else if((m=l.match(/^선택\s*[:：]\s*(.+)$/))) o={type:'choice',opts:m[1].split('|').map(s=>s.trim()).filter(Boolean)};
    else if((m=l.match(/^([^:：\s][^:：\[]{0,20}(?:\s*\[[^\]:：]{1,40}\])?)[:：]\s*(.+)$/))){ let who=m[1].trim(),face='',dir=null; const fm=who.match(/^(.+?)\s*\[(.+?)\]$/); if(fm){who=fm[1].trim();dir=dirSplit(fm[2]);face=dir.face;} /* 연출(0462): [표정|감정|동작] */ const cm=m[2].trim().match(/^\[(배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：]\s*(.+?)\]$/); o=cm?{type:'cmd',cmd:cm[1],arg:cm[2].trim(),who}:{type:'say',who,face,text:m[2]}; if(dir&&!cm&&(dir.emo||dir.motion)) o.dir=dir; }
    else o={type:'nar',text:l};
    o.cond=cond; return o;
  });
}
function findSpeaker(n){return G.chars.find(c=>c.name===n||c.name.split(' ')[0]===n);}
function npcBy(n){return (G.npcs||[]).find(c=>c.name===n||c.name.split(' ')[0]===n);}
function vnSpeaker(n){ const c=findSpeaker(n); if(c) return c; const m=npcBy(n); return m&&imgSrc(m)?m:null; } // 그림 없는 NPC는 이름만(빈 스탠딩 안 띄움)
let S=null;
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
function vnPrefetch(){ if(!SND().voiceStory) return; let n=0; for(let k=S.i;k<S.lines.length&&n<2;k++){const L=S.lines[k]; if(L.type==='say'&&!isMe(L.who)){const c=findSpeaker(L.who); if(c&&c.voiceId){prefetchTTS(c,L.text);n++;}}} }
function vnType(t){S.full=t;S.typing=true;let k=0;const el=$('#vnText');el.textContent='';$('#vnNext').hidden=true;clearInterval(S.timer);const tid=S.timer=setInterval(()=>{if(!el.isConnected||!S||S.timer!==tid){clearInterval(tid);return;}k+=2;el.textContent=t.slice(0,k);if(k>=t.length)vnFinish();},28);}
function vnFinish(){if(!S)return;clearInterval(S.timer);S.typing=false;const tx=$('#vnText'),nx=$('#vnNext');if(tx)tx.textContent=S.full;if(nx)nx.hidden=false;vnAutoNext();}
function vnAutoNext(){if(!S||!S.auto||S.typing||S.choice)return;clearTimeout(S.autoT);const go=()=>{if(S&&S.auto&&!S.typing&&!S.choice)S.autoT=setTimeout(vnStep,600);};if(!VOICE.paused&&!VOICE.ended){VOICE.onended=go;}else S.autoT=setTimeout(vnStep,1000+S.full.length*40);}
// 넘기기: 대본을 끝내되, 앞에 시나리오 분기([분기: id] 다음 선택지)가 있으면 그 선택지에서 멈춤 — 분기 기록이 빠지지 않게(0465). 분기 선택지가 떠 있으면 고를 때까지 기다림
function vnSkip(){ if(!S) return; if(S.choice&&S.branch) return; const k=S.lines.findIndex((L,i)=>i>=S.i&&L.type==='cmd'&&L.cmd==='분기'); if(S.choice||k<0){ vnEnd(); return; } if(S.typing) vnFinish(); S.i=k; vnStep(); }
function vnEnd(){if(!S)return;clearInterval(S.timer);clearTimeout(S.autoT);stopVoice();const d=S.done;S=null;closeOv();d&&d();}
function closeOv(){$('#ov').hidden=true;$('#ov').innerHTML='';sceneBgm();}
/* 대본 선택지 지우기 · 대화 기록 창(View) */
function vnChoiceClear(){ $('#vnCh').innerHTML=''; }
function openVnLog(){ openModal(`${head('대화 기록')}${S.log.map(L=>`<p style="margin:6px 0">${L.type==='say'?`<b>${esc(isMe(L.who)?playerName():L.who)}</b> ${esc(sub(L.text))}`:L.type==='place'?`<span class="muted">[${esc(L.text)}]</span>`:`<i class="muted">${esc(sub(L.text))}</i>`}</p>`).join('')}`); }
