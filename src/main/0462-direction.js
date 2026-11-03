/* ===== 연출 엔진: 감정 아이콘 · 캐릭터 동작 · 화면 효과 · 두 사람 무대 ===== */
/* 대본 문법(SCRIPT_FMT의 DIRECTION_GUIDE 조각):
     이름[표정|하트|점프]: 대사      — 대괄호 안을 | 로 나눠 표정·감정·동작을 함께(순서 상관없음)
     [연출: 이름 하트 점프]          — 대사 없이 감정·동작만
     [효과: 붉은섬광] [효과: 비] [효과: 비 끝] [효과: 회상] [효과: 회상 끝] …
     톡(메신저)·대본의 [스티커: 하트] — 감정 아이콘을 스티커로
   감정 아이콘은 기본 SVG를 쓰고, 자료실에 같은 이름의 '감정' 그림(kind 'emote')이 있으면 그걸 써요(공유 보관함으로 게임끼리 재사용).
   P().vnDirect: 'auto'(대본 + 대사로 자동 감정, 기본) | 'script'(대본에 쓴 것만) | 'off' · P().vnStage: 'duo'(최근 두 사람, 기본) | 'single'
   문서: docs/research/direction.md */
const EMO_SVG=(body,vb)=>`<svg viewBox="${vb||'0 0 40 40'}" aria-hidden="true">${body}</svg>`, EMO_ST='stroke="#1a1020" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const EMOTES={
 하트:{c:'#ff5c8a',svg:EMO_SVG(`<path d="M20 34 6 20a8 8 0 0 1 14-10 8 8 0 0 1 14 10z" fill="#ff5c8a" ${EMO_ST}/>`),a:'pop',k:/좋아해|사랑|두근|설레|고마워|기뻐|♥|❤/},
 땀:{c:'#7cc8ff',svg:EMO_SVG(`<path d="M22 4c6 10 10 15 10 21a10 10 0 0 1-20 0c0-6 4-11 10-21z" fill="#a9dcff" ${EMO_ST}/>`),a:'drip',k:/(^|\s)(어,|어어|저기…|아하하|하하…)|당황|곤란|미안…|^\.\.\.|^…/},
 화남:{c:'#ff4b4b',svg:EMO_SVG(`<g fill="none" stroke="#ff3b3b" stroke-width="4.5" stroke-linecap="round"><path d="M8 15q7 0 7-7"/><path d="M25 8q0 7 7 7"/><path d="M32 25q-7 0-7 7"/><path d="M15 32q0-7-7-7"/></g>`),a:'throb',k:/화나|짜증|뭐야!|용서 못|열받|시끄러|그만해!/},
 놀람:{c:'#ffd23f',svg:EMO_SVG(`<path d="M15 3h10l-2 22h-6z" fill="#ffd23f" ${EMO_ST}/><circle cx="20" cy="32" r="4" fill="#ffd23f" ${EMO_ST}/>`),a:'pop',k:/[!！][?？]|[?？][!！]|뭐라고|설마|깜짝|에엣|헉/},
 의문:{c:'#9bd0ff',svg:EMO_SVG(`<path d="M12 13a8 8 0 1 1 12 7c-3 2-4 3-4 7" fill="none" stroke="#1a1020" stroke-width="7" stroke-linecap="round"/><path d="M12 13a8 8 0 1 1 12 7c-3 2-4 3-4 7" fill="none" stroke="#9bd0ff" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="35" r="3.5" fill="#9bd0ff" ${EMO_ST}/>`),a:'tilt',k:/글쎄|왜\?|그게 무슨|음\?|응\?/},
 침묵:{c:'#ffffff',svg:EMO_SVG(`<g fill="#fff" ${EMO_ST}><circle cx="9" cy="24" r="4"/><circle cx="20" cy="24" r="4"/><circle cx="31" cy="24" r="4"/></g>`),a:'fade',k:/^(…|\.\.\.)+$/},
 음표:{c:'#c49bff',svg:EMO_SVG(`<path d="M16 30V8l16-4v20" fill="none" stroke="#1a1020" stroke-width="6"/><path d="M16 30V8l16-4v20" fill="none" stroke="#c49bff" stroke-width="3"/><circle cx="12" cy="30" r="5" fill="#c49bff" ${EMO_ST}/><circle cx="28" cy="26" r="5" fill="#c49bff" ${EMO_ST}/>`),a:'bob',k:/[♪~]$|후후|에헤헤|흥흥|랄라|ㅎㅎ|ㅋㅋ/},
 번뜩:{c:'#fff27a',svg:EMO_SVG(`<g stroke="#fff27a" stroke-width="4" stroke-linecap="round"><path d="M20 3v8M20 29v8M3 20h8M29 20h8M8 8l5 5M27 27l5 5M32 8l-5 5M13 27l-5 5"/></g>`),a:'pop',k:/그렇구나!|알았다|좋은 생각|번뜩|맞아!/},
 눈물:{c:'#7cc8ff',svg:EMO_SVG(`<g fill="#a9dcff" ${EMO_ST}><path d="M12 8c4 7 6 10 6 14a6 6 0 0 1-12 0c0-4 2-7 6-14z"/><path d="M28 14c4 7 6 10 6 14a6 6 0 0 1-12 0c0-4 2-7 6-14z"/></g>`),a:'drip',k:/흑|훌쩍|울지|눈물|슬퍼/},
 홍조:{c:'#ff8fb0',svg:EMO_SVG(`<g stroke="#ff6f9a" stroke-width="3.5" stroke-linecap="round"><path d="M6 26l5-8M13 26l5-8M20 26l5-8M27 26l5-8"/></g>`),a:'fade',k:/부끄|창피|그, 그런|바보…|딱히/},
 졸림:{c:'#b8c4ff',svg:`<svg viewBox="0 0 40 40" aria-hidden="true"><text x="6" y="30" font-size="22" font-weight="900" fill="#b8c4ff" stroke="#1a1020" stroke-width="1.5">Z</text><text x="22" y="18" font-size="14" font-weight="900" fill="#b8c4ff" stroke="#1a1020" stroke-width="1">z</text></svg>`,a:'bob',k:/졸려|하암|피곤/},
 반짝:{c:'#fff3a8',svg:EMO_SVG(`<path d="M20 2l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#fff3a8" ${EMO_ST}/>`),a:'pop',k:/반짝|멋지|대단해|최고/},
 한숨:{c:'#e6e6e6',svg:EMO_SVG(`<path d="M8 26a7 7 0 0 1 6-11 9 9 0 0 1 17 3 6 6 0 0 1-1 12H12a5 5 0 0 1-4-4z" fill="#eee" ${EMO_ST}/>`),a:'fade',k:/하아…|휴우|에휴|한숨/}};
const EMO_ALIAS={'♥':'하트','💦':'땀','💢':'화남','!':'놀람','?':'의문','…':'침묵','♪':'음표','💡':'번뜩','😢':'눈물','😳':'홍조','💤':'졸림','✨':'반짝','당황':'땀','분노':'화남','놀라움':'놀람','물음표':'의문','기쁨':'음표','슬픔':'눈물','부끄러움':'홍조'};
const MOTIONS={점프:'m-jump',뛰어오름:'m-jump',흔들:'m-shake',도리도리:'m-shake',떨림:'m-tremble',끄덕:'m-nod',갸웃:'m-tilt',다가옴:'m-near',물러남:'m-far',퇴장:'m-exit',등장:'m-enter',쓰러짐:'m-fall'};
const SCREEN_FX={흔들림:'shake',강한흔들림:'shake2',플래시:'w',섬광:'w',붉은섬광:'r',암전:'b',페이드:'f',집중선:'lines',비:'rain',눈:'snow',벚꽃:'petal',회상:'memory',비네트:'vignette'};
const FX_KEEP=['lines','rain','snow','petal','memory','vignette']; // 끝을 쓸 때까지 남는 효과
function emoKey(t){ t=String(t||'').trim(); return EMOTES[t]?t:EMO_ALIAS[t]||''; }
function emoteHTML(name,big){ const k=emoKey(name); if(!k) return ''; const l=typeof G!=='undefined'&&G&&G.lib.find(x=>x.kind==='emote'&&x.name===k), s=l&&imgSrc(l);
  return `<i class="emo ${big?'big':''} e-${EMOTES[k].a}" data-emo="${esc(k)}">${s?`<img src="${esc(s)}" alt="${esc(k)}">`:EMOTES[k].svg}</i>`; }
// "미소|하트|점프" → {face,emo,motion}
function dirSplit(s){ const o={face:'',emo:'',motion:''}; String(s||'').split(/[|,·/]/).map(x=>x.trim()).forEach((t,i)=>{ if(!t) return; if(i===0&&FACE_BASIC.includes(t)) o.face=t; /* 첫 칸(빈 칸 포함 위치 — [|놀람]은 표정 없음+감정)이 기본 표정 이름이면 표정(화남·놀람·슬픔·당황은 감정 이름과 겹침) — 기존 이름[표정] 문법 유지 */ else if(!o.emo&&emoKey(t)) o.emo=emoKey(t); else if(!o.motion&&MOTIONS[t]) o.motion=t; else if(!o.face) o.face=t; }); return o; }
function autoEmote(text){ const t=String(text||'').trim(); for(const [k,d] of Object.entries(EMOTES)) if(d.k&&d.k.test(t)) return k; return ''; }
function dirMode(){ const m=P().vnDirect; return m==='script'||m==='off'?m:'auto'; }
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

/* AI 연출 입히기: 대사·나레이션은 그대로 두고 표정|감정|동작 태그와 [효과]만 더해요. 바뀐 글이 있으면 버려요 */
function dirStrip(t){ return parseScript(t).filter(L=>L.type==='say'||L.type==='nar'||L.type==='choice').map(L=>L.type==='choice'?L.opts.join('|'):(L.who||'')+':'+L.text).join('\n'); }
function dirCount(t){ return parseScript(t).filter(L=>(L.type==='say'&&L.dir&&(L.dir.emo||L.dir.motion))||(L.type==='cmd'&&(L.cmd==='연출'||(L.cmd==='효과'&&!/흔들림|플래시|암전/.test(L.arg))))).length; }
async function directScript(text,btn){ const src=String(text||''); if(!src.trim()) return null;
  const r=await aiJSON(`${RULES}\n${DIRECTION_GUIDE}\n\n아래 대본에 연출만 더하라. 대사·나레이션·선택지 글자는 한 글자도 바꾸지 않고, 줄을 지우거나 순서를 바꾸지 않는다. 더할 수 있는 것: 이름 뒤 [표정|감정|동작], 줄 사이 [연출: 이름 감정 동작], [효과: …]. 감정이 크게 움직이는 줄에만(전체 줄의 20~35%) 넣고, 같은 감정을 연달아 쓰지 않는다.\n\n대본:\n${src}\n\nJSON만 출력: {"script":"연출을 더한 대본 전체"}`,btn,'complex');
  const out=r&&nl(r.script); if(!out) return null; if(dirStrip(out)!==dirStrip(src)) return null; return out; }
async function directStage(s){ let ok=false; for(const k of ['pre','post']){ if(!s[k]) continue; const o=await directScript(s[k]); if(o){ s[k]=o; ok=true; } } if(ok){ s.dirV=1; auditMarkObj(s); } return ok; }
pfDef('DIRECTION_GUIDE','연출 문법(감정 아이콘·동작·화면 효과)',()=>`연출: 이름 뒤 대괄호에 표정·감정·동작을 |로 함께 쓸 수 있다(예: "세라[미소|하트|점프]: 정말?"). 감정 아이콘: ${Object.keys(EMOTES).join('·')}. 동작: 점프·흔들·떨림·끄덕·갸웃·다가옴·물러남·퇴장·쓰러짐. 대사 없이 [연출: 이름 감정 동작]. 화면 효과: [효과: 흔들림|강한흔들림|플래시|붉은섬광|암전|페이드|집중선|비|눈|벚꽃|회상|비네트] (집중선·비·눈·벚꽃·회상·비네트는 [효과: 비 끝]처럼 끝을 쓴다). 메신저에서는 [스티커: 감정 아이콘 이름]. 감정이 크게 움직이는 순간에만 쓰고 남발하지 않는다.`);
