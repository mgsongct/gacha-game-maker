/* ===== 시작할 때 게임 고르기 ===== */
function startMode(){ try{ return appStorage.getItem('ggm-start')||'last'; }catch(e){ return 'last'; } }
function showPicker(){
  const pj=PJ();
  $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card"><div class="sw-logo"><i>GACHA GAME MAKER</i><b>어떤 게임을 할까요?</b></div>
    <div class="pk-list">${pj.list.map(x=>`<button class="pk-g ${x.id===pj.active?'on':''}" data-act="pickgame" data-id="${esc(x.id)}"><b>${esc(x.title)}</b><span>${x.id===pj.active?'마지막으로 한 게임':''}</span></button>`).join('')}</div>
    <label style="display:flex;gap:8px;margin-top:12px;font-size:.85rem"><input type="checkbox" id="pk_last"><span>다음부터 묻지 않고 마지막 게임으로 시작</span></label></div></div>`;
  $('#ov').hidden=false;
}
function showStart(){ try{ if(startMode()==='pick'&&PJ().list.length>1&&!sessionStorage.getItem('ggm-picked')){ showPicker(); return; } }catch(e){} if(castNeeded()) showCast(); else if(bootPrepNeeded()) showBootPrep(); else showTitle(); }
function showBootPrep(){
  const all=drawTodo(bootCats().map(x=>x[0])), cnt=k=>all.filter(x=>x.cat===k).length, c=naiCfg();
  if(!BP) BP={cats:new Set(bootCats().filter(x=>x[2]).map(x=>x[0]))};
  $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card">
    <div class="sw-logo"><i>BEFORE THE OPENING</i><b>${esc(G.meta.title)}</b></div>
    <p>오프닝 전에 그림부터 준비할까요? 미리 그려 두면 타이틀, 오프닝, 로비가 처음부터 그림으로 채워져요.</p>
    <label class="f" for="bp_tags">이 게임의 그림체 태그 (비우면 기본 그림체)</label><textarea class="in" id="bp_tags" style="min-height:60px" placeholder="${esc(c.styles[0].tags||STYLE_EX)}">${esc(G.meta.artTags||'')}</textarea>
    <div class="prepcats" style="margin-top:10px">${bootCats().map(([k,l])=>cnt(k)?`<label class="pc"><input type="checkbox" data-bpc="${k}" ${BP.cats.has(k)?'checked':''}><b>${esc(l)}</b><span>${cnt(k)}장</span></label>`:'').join('')}</div>
    <p class="muted" style="margin:8px 0 0">한 장에 10~30초쯤 걸려요.${imgProvider()==='nai'?' Opus 구독이면 기본 크기는 Anlas가 들지 않아요.':''} 그리는 도중에도 언제든 시작할 수 있어요.</p>
    <div class="sw-btns bp-btns"><button class="btn" data-act="bpgo">그리고 시작</button><button class="btn ghost" data-act="bpbg">게임하면서 그리기</button></div>
    <button class="linkb" data-act="bpskip" style="margin-top:10px">그림 없이 시작</button>
  </div></div>`;
  $('#ov').hidden=false;
}
function bpRead(){ P().prepAsked=today(); if($('#bp_tags')){ G.meta.artTags=$('#bp_tags').value.trim(); mark('meta'); }
  const cats=bootCats().map(x=>x[0]).filter(k=>{const el=document.querySelector(`[data-bpc="${k}"]`);return el&&el.checked;}); BP.cats=new Set(cats); P().bootPrep=1; mark('prog'); return cats; }
function bootPrepRun(cats){
  $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card">
    <div class="sw-logo"><i>DRAWING</i><b>그림 준비 중</b></div>
    <div class="bp-prev" id="bp_prev"><span>첫 그림을 그리는 중…</span></div>
    <div class="bp-bar"><i id="bp_bar"></i></div><p class="muted" id="bp_lb" style="margin:6px 0 0">준비 중</p>
    <div class="sw-btns"><button class="btn ghost" data-act="bpleave">나머지는 게임하면서 그리기</button></div></div></div>`;
  const upd=(it,j,ph)=>{ const pv=$('#bp_prev'); if(!pv) return; $('#bp_bar').style.width=(j.total?j.done/j.total*100:0)+'%';
    $('#bp_lb').textContent=`${j.done}/${j.total} · ${ph==='done'?'완성: ':'그리는 중: '}${it.label}`;
    if(ph==='done'){ const s=imgSrc(it.o); if(s) pv.innerHTML=`<img src="${esc(s)}" alt="">`; } };
  runPrep(cats,null,{fg:true,order:bootCats().map(x=>x[0]),step:upd,done:()=>{ if($('#bp_prev')) setTimeout(showTitle,700); }});
}
/* 시작 준비(첫 실행 때 그림 미리 그리기): 그릴 종류·필요한지 */
const BOOT_CATS=[['char','스탠딩 (전신)',true],['upper','상반신 (스토리·프로필)',true],['illust','일러스트 (타이틀·로비·픽업)',true],['bg','배경',true],['icon','재화 아이콘',true],['prop','소품 (스토리에 나오는 물건)',true],['weapon','전용 무기',true],['enemy','적',false],['map','작전 지도',false],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let BP=null;
const bootCats=()=>BOOT_CATS;
function bootPrepNeeded(){ const p=P(); return !playMode()&&!p.seenOpening&&!p.bootPrep&&imgReady()&&drawTodo(bootCats().map(x=>x[0])).length>0; }
