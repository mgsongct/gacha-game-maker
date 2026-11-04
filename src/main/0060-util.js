/* =========================================================
   유틸
   ========================================================= */
const $=s=>document.querySelector(s);
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=()=>Math.random().toString(36).slice(2,10);
const rand=a=>a[Math.floor(Math.random()*a.length)];
const nf=n=>Math.round(n).toLocaleString('ko-KR');
const num=(v,a,b,d)=>{v=Number(v);if(!isFinite(v))v=d;return Math.min(b,Math.max(a,v));};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>new Date().toDateString();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const charById=id=>G.chars.find(c=>c.id===id);
const libById=id=>G.lib.find(l=>l.id===id);
const playerName=()=>P().player||T('player');
const sub=t=>{ const n=playerName(); let s=String(t??''); if(s.indexOf('{')<0) return s; new Set(['관리관','플레이어','주인공','이름','player',T('player'),DEFAULT_META.terms.player]).forEach(k=>{ if(k) s=s.split('{'+k+'}').join(n); }); return s; };
const isMe=w=>w==='나'||w==='관리관'||w===T('player')||(!!P().player&&w===P().player&&!G.chars.some(c=>c.name===w));
// 조용히 넘어가는 오류 기록: 비동기 작업(AI·그림·스킬 생성 등)이 실패해도 흐름은 이어 가되, 원인을 잃지 않게 남겨요(프롬프트 스튜디오 → AI 기록)
const QUIET=[];
function quietErr(e,where){ QUIET.unshift({at:Date.now(),where:String(where||''),msg:String(e&&e.message||e||'오류').slice(0,200)}); if(QUIET.length>60) QUIET.length=60; try{ console.debug('[quiet]',where,e); }catch(_){ /* 콘솔이 없어도 괜찮음 */ } }
function toast(m){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function ripple(x,y,big){const r=document.createElement('div');r.className='ripple'+(big?' big':'');r.style.left=x+'px';r.style.top=y+'px';r.innerHTML='<i></i><i></i><i></i>';document.body.appendChild(r);setTimeout(()=>r.remove(),1000);}
function hearts(x,y,n){for(let i=0;i<n;i++){const h=document.createElement('div');h.className='hrt';h.textContent='♥';h.style.left=(x-8)+'px';h.style.top=(y-10)+'px';h.style.setProperty('--dx',(Math.random()*70-35).toFixed(0)+'px');h.style.animationDelay=(i*0.08)+'s';document.body.appendChild(h);setTimeout(()=>h.remove(),1300);}}
// 만든 표정을 쓰는 곳: 터치 반응, 스토리 대사(표정 지정이 없을 때 대사로 짐작)
// 스킨을 입었고 스킨 스탠딩이 있으면 그 스킨의 표정만 써요(없으면 표정 없이 스킨 모습 그대로)
function skinFaces(c){ const k=skinOf(c); return ((k&&(imgSrc(k)||(c.useStanding===false&&k.upper&&imgSrc(k.upper))))?k.faces:c.faces)||[]; }
function facePool(c){ return skinFaces(c).filter(f=>imgSrc(f)||(f.up&&imgSrc(f.up))); }
function pickFace(c,names){ const fs=facePool(c), hit=names.map(n=>fs.find(f=>f.name===n)).filter(Boolean); return hit.length?rand(hit).name:''; }
function touchFace(c,zone,lv){ return zone==='head'?pickFace(c,lv>=5?['미소','웃음','수줍음','부끄럼']:['당황','놀람','평온']):zone==='body'?pickFace(c,lv>=6?['부끄럼','당황','수줍음']:['화남','놀람','당황','짜증']):pickFace(c,['미소','평온','웃음']); }
const TEXT_FACE=[[/(\?!|!\?|헉|깜짝|에엣|뭐라고|말도 안 돼|설마)/,['놀람','당황']],[/(짜증|용서 못|그만해|닥쳐|이 녀석|흥[!.]|화났|건방)/,['화남','짜증']],[/(ㅠ|흑|흐윽|미안해|슬퍼|눈물|그리워|보고 싶)/,['울먹','슬픔']],[/(([가-힣]), \2|그게 아니라|부, 부끄|어, 어떡)/,['당황','부끄럼']],[/(후후|하하|헤헤|에헤|고마워|다행|기뻐|좋아!)/,['웃음','미소']],[/(…|\.\.\.)$/,['생각','평온']]];
function textFace(c,text){ const t=String(text||''); if(!facePool(c).length) return ''; for(const [re,names] of TEXT_FACE) if(re.test(t)){ const f=pickFace(c,names); if(f) return f; } return ''; }
function faceSwap(c,el,name,ms){ const im=el&&(el.tagName==='IMG'?el:el.querySelector('img.art')); if(!im||!name) return; const f=facePool(c).find(x=>x.name===name); if(!f) return; const up=im.classList.contains('upimg'), src=up?(f.up&&imgSrc(f.up)):imgSrc(f); if(!src) return; /* 상반신 그림에는 상반신판 표정만 */ if(!im._orig) im._orig=im.src; im.src=src; clearTimeout(im._ft); im._ft=setTimeout(()=>{ if(im.isConnected){ im.src=im._orig; im._orig=null; } },ms||2600); }
/* 꾹 눌러(0.35초) 좌우로 문지르면 쓰다듬기 — 로비·캐릭터 화면·이벤트 상점 */
const PET={on:0,swallow:0};
function petLine(c,o){ const lv=o?affLv(o):1, pool=spoilFree(c,o?[...((c.touch&&c.touch.pet)||[]),...(lv>=4?((c.touch&&c.touch.head)||[]):[]),...(lv>=5?affLinePool(c):[])]:c.lines); return rand(pool.length?pool:spoilFree(c,((c.touch&&c.touch.head)||[]).concat(c.lines||[])))||''; }
function petTick(P0){ const {kind,el,c,x,y}=P0, o=own(c.id), lv=o?affLv(o):1, im=kind==='poke'?document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'):el.querySelector('.art');
  if(im){ im.classList.remove('r-pet'); void im.offsetWidth; im.classList.add('r-pet'); }
  hearts(x,y,lv>=5?3:1+(P0.n%2));
  if(P0.n===1){ const f=im&&(im.classList.contains('lobby-ill')||im.classList.contains('lobby-pose'))?'':pickFace(c,lv>=4?['미소','수줍음','부끄럼','웃음','평온']:['당황','수줍음','부끄럼','놀람','평온']); if(f&&im&&im.tagName==='IMG') faceSwap(c,im,f,3200);
    const l=petLine(c,o), box=kind==='poke'?$('#bubble'):kind==='cspoke'?$('#csSay'):$('#evsLine');
    if(l&&box){ box.textContent=sub(l); box.hidden=false; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); if(kind==='cspoke'){ clearTimeout(window._csT); window._csT=setTimeout(()=>{if(box.isConnected)box.hidden=true;},3200); } if(kind==='evspoke') EVS_LINE=l; if(voiceOf(c)&&SND().voiceLobby) speak(c,l); }
    if(o){ const now=Date.now(); if(now-(o.petAt||0)>8000){ o.petAt=now; addAff(c,3); bump('touch'); mark('prog'); } } }
}
document.addEventListener('pointerdown',e=>{ if(e.button>0) return; const el=e.target.closest&&e.target.closest('[data-act=poke],[data-act=cspoke],[data-act=evspoke]'); if(!el) return;
  const kind=el.dataset.act, c=charById(kind==='poke'?P().sec:el.dataset.id); if(!c) return;
  const S0={kind,el,c,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,dir:0,last:e.clientX,turns:0,n:0,id:e.pointerId,hand:null,ring:null};
  const end=()=>{ clearTimeout(tm); removeEventListener('pointermove',mv); removeEventListener('pointerup',up); removeEventListener('pointercancel',up); if(S0.hand){ S0.hand.remove(); S0.ring&&S0.ring.remove(); PET.on=0; PET.swallow=Date.now(); } };
  const tm=setTimeout(()=>{ PET.on=1; try{ el.setPointerCapture&&el.setPointerCapture(e.pointerId); }catch(_){} S0.hand=document.createElement('div'); S0.hand.className='pet-hand'; S0.hand.textContent='🖐'; S0.hand.style.left=S0.x+'px'; S0.hand.style.top=S0.y+'px'; S0.ring=document.createElement('div'); S0.ring.className='pet-ring'; S0.ring.style.left=S0.x+'px'; S0.ring.style.top=S0.y+'px'; document.body.append(S0.ring,S0.hand); if(navigator.vibrate) try{ navigator.vibrate(12); }catch(_){} },350);
  const mv=ev=>{ if(ev.pointerId!==S0.id) return; S0.x=ev.clientX; S0.y=ev.clientY;
    if(!S0.hand){ if(Math.hypot(ev.clientX-S0.x0,ev.clientY-S0.y0)>12) end(); return; }
    ev.preventDefault(); S0.hand.style.left=S0.x+'px'; S0.hand.style.top=S0.y+'px'; S0.ring&&(S0.ring.style.left=S0.x+'px',S0.ring.style.top=S0.y+'px');
    const dx=ev.clientX-S0.last; if(Math.abs(dx)<14) return; const d=dx>0?1:-1; S0.last=ev.clientX;
    if(d!==S0.dir){ if(S0.dir) S0.turns++; S0.dir=d; S0.hand.style.transform=`translate(-50%,-70%) rotate(${d*14}deg)`; if(S0.turns&&S0.turns%2===0){ S0.n++; petTick(S0); } } };
  const up=ev=>{ if(ev.pointerId===S0.id) end(); };
  addEventListener('pointermove',mv,{passive:false}); addEventListener('pointerup',up); addEventListener('pointercancel',up); },true);
document.addEventListener('click',e=>{ if(PET.swallow&&Date.now()-PET.swallow<400){ PET.swallow=0; e.stopPropagation(); e.preventDefault(); } },true);
document.addEventListener('contextmenu',e=>{ if(PET.on||(e.target.closest&&e.target.closest('[data-act=poke],[data-act=cspoke],[data-act=evspoke]'))) e.preventDefault(); },true);
function charReact(el,lv,zone){ if(!el) return; const k=zone==='body'?(lv>=6?'shy':'flinch'):lv>=7?'hop':lv>=4?'nod':'flinch'; ['r-hop','r-nod','r-flinch','r-shy'].forEach(c=>el.classList.remove(c)); void el.offsetWidth; el.classList.add('r-'+k); clearTimeout(el._rt); el._rt=setTimeout(()=>el.classList.remove('r-'+k),950); }
function shootHTML(n){let s='';for(let i=0;i<n;i++)s+=`<i class="shoot" style="top:${Math.round(Math.random()*45)}%;left:${50+Math.round(Math.random()*60)}%;animation-delay:${(i*0.9+Math.random()).toFixed(1)}s"></i>`;return s;}
/* 글 도우미: AI 답의 대본 줄 정리(nl·unComma)·문자열 목록(strs) */
const nl=s=>unComma(Array.isArray(s)?s.map(x=>typeof x==='string'?x:x&&typeof x==='object'?(x.name||x.speaker?`${x.name||x.speaker}: ${x.text||x.line||''}`:String(x.text||x.line||'')):String(x)).join('\n'):String(s||'').replace(/\\n/g,'\n'));
// AI가 대본 줄을 쉼표로 이어 붙여 보낸 경우("[음악: 일상],A: 안녕!,B: 뭐 해") 줄로 되돌려요
function unComma(t){ t=String(t||''); const re=/,\s*(?=\[[^\]\n]{1,30}\]|[^\s,:\[\]\n"'][^,:\n\[\]]{0,15}(?:\[[^\]\n]{1,12}\])?:\s)/g;
  return t.split('\n').map(l=>{ const m=l.match(re); return m&&m.length>=2&&/^\s*(\[|[^,:\n]{1,16}(\[[^\]]*\])?:)/.test(l)?l.replace(re,'\n'):l; }).join('\n'); }
const strs=a=>(Array.isArray(a)?a:[]).map(String).filter(Boolean);
