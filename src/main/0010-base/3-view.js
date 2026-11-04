/* ===== 0010-base — View(HTML·DOM을 만듦) ===== */
/* src/main/0010-base/0010-rules.js에서 옮김 */
function applyMeta(){
  const m=G.meta; ELEMS=m.elems.map(e=>e.n);
  Object.keys(ECOL).forEach(k=>delete ECOL[k]); Object.keys(BEATS).forEach(k=>delete BEATS[k]);
  m.elems.forEach((e,i)=>{ECOL[e.n]=e.c;BEATS[e.n]=m.elems[(i+1)%m.elems.length].n;});
  Object.assign(ROLE,m.roles); if(typeof rulesApply==='function') rulesApply(); // 게임 규칙(상성·능력치) 반영 (0185-game-rules.js)
  document.documentElement.dataset.skin=m.theme||'tactical';
  document.documentElement.style.setProperty('--acc',m.accent||'#ffb400');
  document.title=m.title;
  const el=document.querySelector('.brand'); if(el){ el.innerHTML=`<b class="brand-t">${esc(m.title)}</b><i>${esc(m.sub)}</i>`; fitBrand(); }
}
/* src/main/0010-base/0060-util.js에서 옮김 */
function toast(m){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
/* 버튼 처리 중 표시(View): 잠그고 글자를 주면 바꿈 — 돌려준 함수로 되돌림(버튼이 화면에 남아 있을 때만). 액션 처리기(Controller)가 처리 앞뒤로 부름 */
function busy(t,label){ const lb=t.textContent; t.disabled=true; if(label!=null) t.textContent=label; return ()=>{ if(t.isConnected){ t.disabled=false; if(label!=null) t.textContent=lb; } }; }
/* 고르기 칩 켜짐 표시(View) · 켜짐/꺼짐 스위치 뒤집기(aria-checked — 새 값을 돌려줌) */
function chipOn(el,on){ el.classList.toggle('on',!!on); }
function chipIsOn(el){ return el.classList.contains('on'); }
function switchFlip(el){ const on=el.getAttribute('aria-checked')!=='true'; el.setAttribute('aria-checked',String(on)); return on; }
/* 진행 알림(View가 만들어 작업(Model)에 넘김 — 작업은 단추·칸 요소를 직접 만지지 않음, CLAUDE.md §0-2): 만들 때 단추를 잠그고, rep(글)로 진행 글(to 칸, 없으면 단추 글자),
   rep.lock()으로 다시 잠금, rep.end()로 단추를 되돌림(단추 글자를 바꿨으면 원래 글자로). 단추가 없으면 null — 작업은 rep&&rep(…) */
function uiProg(el,to){ if(!el) return null; const lb=el.textContent, rep=m=>{ say(to||el,m); }; rep.lock=()=>{ el.disabled=true; }; rep.end=()=>{ if(el.isConnected){ el.disabled=false; if(!to) el.textContent=lb; } }; rep.lock(); return rep; }
/* 화면 한 칸에 글 표시(View — 선택자나 요소, 있을 때만) */
function say(el,msg){ const x=typeof el==='string'?$(el):el; if(x) x.textContent=msg; return x; }
function ripple(x,y,big){const r=document.createElement('div');r.className='ripple'+(big?' big':'');r.style.left=x+'px';r.style.top=y+'px';r.innerHTML='<i></i><i></i><i></i>';document.body.appendChild(r);setTimeout(()=>r.remove(),1000);}
function hearts(x,y,n){for(let i=0;i<n;i++){const h=document.createElement('div');h.className='hrt';h.textContent='♥';h.style.left=(x-8)+'px';h.style.top=(y-10)+'px';h.style.setProperty('--dx',(Math.random()*70-35).toFixed(0)+'px');h.style.animationDelay=(i*0.08)+'s';document.body.appendChild(h);setTimeout(()=>h.remove(),1300);}}
function faceSwap(c,el,name,ms){ const im=el&&(el.tagName==='IMG'?el:el.querySelector('img.art')); if(!im||!name) return; const f=facePool(c).find(x=>x.name===name); if(!f) return; const up=im.classList.contains('upimg'), src=up?(f.up&&imgSrc(f.up)):imgSrc(f); if(!src) return; /* 상반신 그림에는 상반신판 표정만 */ if(!im._orig) im._orig=im.src; im.src=src; clearTimeout(im._ft); im._ft=setTimeout(()=>{ if(im.isConnected){ im.src=im._orig; im._orig=null; } },ms||2600); }
function petTick(P0){ const {kind,el,c,x,y}=P0, o=own(c.id), lv=o?affLv(o):1, im=kind==='poke'?document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'):el.querySelector('.art');
  if(im){ im.classList.remove('r-pet'); void im.offsetWidth; im.classList.add('r-pet'); }
  hearts(x,y,lv>=5?3:1+(P0.n%2));
  if(P0.n===1){ const f=im&&(im.classList.contains('lobby-ill')||im.classList.contains('lobby-pose'))?'':pickFace(c,lv>=4?['미소','수줍음','부끄럼','웃음','평온']:['당황','수줍음','부끄럼','놀람','평온']); if(f&&im&&im.tagName==='IMG') faceSwap(c,im,f,3200);
    const l=petLine(c,o), box=kind==='poke'?$('#bubble'):kind==='cspoke'?$('#csSay'):$('#evsLine');
    if(l&&box){ box.textContent=sub(l); box.hidden=false; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); if(kind==='cspoke'){ clearTimeout(window._csT); window._csT=setTimeout(()=>{if(box.isConnected)box.hidden=true;},3200); } if(kind==='evspoke') EVS_LINE=l; if(voiceOf(c)&&SND().voiceLobby) speak(c,l); }
  }
}
function charReact(el,lv,zone){ if(!el) return; const k=zone==='body'?(lv>=6?'shy':'flinch'):lv>=7?'hop':lv>=4?'nod':'flinch'; ['r-hop','r-nod','r-flinch','r-shy'].forEach(c=>el.classList.remove(c)); void el.offsetWidth; el.classList.add('r-'+k); clearTimeout(el._rt); el._rt=setTimeout(()=>el.classList.remove('r-'+k),950); }
function shootHTML(n){let s='';for(let i=0;i<n;i++)s+=`<i class="shoot" style="top:${Math.round(Math.random()*45)}%;left:${50+Math.round(Math.random()*60)}%;animation-delay:${(i*0.9+Math.random()).toFixed(1)}s"></i>`;return s;}
/* src/main/0010-base/0180-ui-scroll.js에서 옮김 */
/* 로비 캐릭터를 눌렀을 때 반응(View): 말풍선 · 감정 연출 · 표정 그림 잠깐 바꾸기 · 물결·하트 · 몸짓 — 호감도·미션 반영은 처리기(Controller)가 먼저 */
function lobbyPokeShow(t,e,c,l,zone,face){
  const el=$('#bubble'); if(el){ el.textContent=sub(l); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } lobbyEmote(t,l,zone);
  const st=t.querySelector('.lb-stage')||t; const old=st.querySelector('.lobby-art:not(.lobby-pose)'); if(old){ /* 레이어 그림(포즈)은 표정 그림이 없어서 그대로 둬요. 바꾸면 스탠딩으로 고정돼 버렸어요 */ const tmp=document.createElement('div'); tmp.innerHTML=P().lobbyMode==='stand'?art(c,'lobby-art react',{face}):lobbyCharacterArt(c,'lobby-art react',face); old.replaceWith(tmp.firstElementChild); clearTimeout(window._faceT); window._faceT=setTimeout(()=>{const cur=document.querySelector('.lobby-art'); if(cur&&tab==='lobby'){const t2=document.createElement('div');t2.innerHTML=P().lobbyMode==='stand'?art(c,'lobby-art'):lobbyCharacterArt(c);cur.replaceWith(t2.firstElementChild);}},3500); }
  const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, lv=affLv(own(c.id)); ripple(x,y,lv>=7); if(lv>=5&&zone!=='body') hearts(x,y,Math.min(5,lv-3)); setTimeout(()=>charReact(document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'),lv,zone),10); }
/* 이벤트 화면 진행자를 눌렀을 때 반응(View): 물결 · 몸짓 · 표정 · 대사 칸 */
function evsPokeShow(t,c,l,zone,lv,x,y){ ripple(x,y,lv>=7); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv)); const pe=$('#evsLine'); if(pe){ pe.textContent=sub(l); pe.classList.remove('pop'); void pe.offsetWidth; pe.classList.add('pop'); } }
