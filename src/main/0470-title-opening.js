/* =========================================================
   타이틀과 오프닝
   ========================================================= */
// 타이틀 로고 모양: 게임 정의에서 고르고, 자동이면 화면 테마에 맞춰요
const LOGO_STYLES=[['auto','자동 (화면 테마에 맞춤)'],['stroke','가로획 명조 · 먹빛'],['star','별빛 그라데이션 · 첨탑'],['orbitline','궤도선 · 행성 외곽선'],['stencil','거친 스텐실 질감'],['regal','기품 · 명조 금빛'],['sharp','전술 · 각진 금속'],['orbit','SF · 네온'],['heavy','묵직한 장식체'],['cute','귀여운 · 파스텔']];
/* 타이틀 줄 나누기: 띄어쓰기에서만 나누고(글자 중간에서 끊지 않음), 두 줄 길이를 비슷하게. 긴 한 단어는 줄이지 않고 글자를 작게 */
const tlLen=x=>[...String(x)].reduce((n,ch)=>n+(/[가-힣ㄱ-ㅎ一-鿿]/.test(ch)?1:/\s/.test(ch)?0.35:0.62),0);
function titleLines(t){ const w=String(t||'').trim().split(/\s+/).filter(Boolean); if(w.length<2) return [w.join('')];
  let best=null; for(let k=1;k<w.length;k++){ const a=w.slice(0,k).join(' '), b=w.slice(k).join(' '), m=Math.max(tlLen(a),tlLen(b)); if(!best||m<best.m) best={m,l:[a,b]}; } return best.l; }
const tlSpan=x=>`<span class="tl" style="--tl:${Math.max(2.2,tlLen(x)*1.06).toFixed(2)}">${esc(x)}</span>`;
function logoHTML(st){ const t=String(G.meta.title||''), w=t.split(/\s+/).filter(Boolean), sub=String(G.meta.sub||'');
  let kr=titleLines(t).map(tlSpan).join('');
  if(st==='orbitline'&&w.length>1) kr=`<small>${esc(w[0])}</small>${tlSpan(w.slice(1).join(' '))}`;
  if(st==='stroke') kr=tlSpan(w.join(' '));
  const en=!sub?'':st==='star'?`<div class="t-en">${sub.split(/\s+/).map(esc).join('<br>')}</div>`:st==='stroke'?`<div class="t-en"><span>-&nbsp;&nbsp;${esc(sub)}&nbsp;&nbsp;-</span></div>`:`<div class="t-en"><span>${esc(sub)}</span></div>`;
  return `<div class="t-logo ls-${st}">${st==='star'?'<i class="t-spire"></i>':''}${st==='orbitline'?'<i class="t-planet"></i>':''}<div class="t-kr">${kr}${st==='orbitline'||st==='stroke'?'<i class="t-line"></i>':''}</div>${en}</div>`; }
function logoStyle(v0){ const v=v0||G.meta.logoStyle||'auto'; if(v!=='auto'&&LOGO_STYLES.some(x=>x[0]===v)) return v; return ({fantasy:'star',noir:'stroke',neon:'orbitline',pastel:'cute',tactical:'stencil'})[G.meta.theme]||'stencil'; }
function showTitle(logo){
  const c=charById(P().titleChar)||charById(P().sec)||G.chars.find(x=>x.rarity===3&&(charIllust(x)||imgSrc(x)))||G.chars.find(x=>x.rarity===3)||G.chars[0];
  const oc=c&&own(c.id), ill=c&&P().lobbyMode!=='stand'&&((oc&&oc.useCg&&oc.dup>=5&&lbcgSrc(c))||charIllust(c));
  $('#ov').innerHTML=`<div class="title" data-act="titletap">${ill?`<div class="t-bg t-ill"><img src="${esc(ill)}" alt="" draggable="false"></div>`:`<div class="t-bg" style="${bgStyle(P().titleBg||'낙성 분화구')}"></div>${c?`<div class="t-char">${art(c)}</div>`:''}`}<div class="t-shade"></div>${shootHTML(7)}
    ${logoHTML(logoStyle(logo))}
    <button class="t-snd" id="tsnd" data-act="titlesnd" aria-label="${titleSndLabel(SND().bgmOn)}">${SND().bgmOn?'🔊':'🔇'}</button>
    <div class="t-touch">화면을 터치하세요</div><div class="t-ver">GACHA GAME MAKER · ${esc(APP_BUILD)}</div></div>`;
  $('#ov').hidden=false; bgm(sceneOf().title);
}
let OP=null;
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
function afterPrologue(){ setTimeout(()=>{ if(typeof prepAsk==='function') prepAsk(); },4000);
  const first=!P().seenOpening; P().seenOpening=true; mark('prog'); tab=first?'contract':tab; render();
  if(first){ toast('첫 10회는 SSR 1명 확정이에요'); setTimeout(()=>checkTriggers(),1500); }
  setTimeout(()=>liveTick(false),2500);
  if(G.meta.subscr) setTimeout(()=>{ if($('#modal').hidden&&$('#ov').hidden) subCheck(false); },4500);
}
/* 타이틀 배경음 단추(View) — 켜짐/꺼짐 표시만 */
function titleSndLabel(on){ return on?'배경음 끄기':'배경음 켜기'; }
function titleSndShow(on){ const el=$('#tsnd'); if(el){ el.textContent=on?'🔊':'🔇'; el.setAttribute('aria-label',titleSndLabel(on)); } }
/* 로고 미리 보기(View): 설정 창 위에 고른 로고로 타이틀을 띄우고, 누르면 설정으로 돌아감 */
function logoPreview(style){ showTitle(style); const t=$('.title'); if(t){ t.dataset.act='logoprevclose'; const tt=t.querySelector('.t-touch'); if(tt) tt.textContent='눌러서 설정으로 돌아가기'; } $('#modal').hidden=true; }
function logoPreviewClose(){ closeOv(); if($('#modal').innerHTML) $('#modal').hidden=false; }
