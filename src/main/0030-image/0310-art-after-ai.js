/* ===== AI가 새로 만든 것 그림 ===== */
let ART_ASK=null;
const ART_ORDER=['char','upper','pose','lbbg','illust','scg','bg','enemy','icon','map','cg','prop','weapon'];
function artKey(it){return it.k+':'+((it.o&&it.o.id)||'')+':'+((it.c&&it.c.id)||'');}
function artSnap(){try{return new Set(drawTodo().map(artKey));}catch(e){return new Set();}}
function artRun(keys){ const go=()=>{ if(PREPJOB) return setTimeout(go,5000); runPrep(null,x=>keys.has(artKey(x)),{order:ART_ORDER}); }; go(); }
function artAfterAI(snap,label){
  if(!imgReady()) return;
  const mode=naiCfg().autoArt||'ask'; if(mode==='off') return;
  const fresh=drawTodo().filter(x=>typeof snap==='function'?snap(x):!snap.has(artKey(x))); if(!fresh.length) return;
  const keys=new Set(fresh.map(artKey));
  if(mode==='auto'){ artRun(keys); toast(`새 그림 ${fresh.length}장을 뒤에서 그려요`); return; }
  let tries=0; const show=()=>{ if((!$('#modal').hidden||!$('#ov').hidden)&&tries++<200) return setTimeout(show,3000); if(!$('#modal').hidden) return;
    ART_ASK=keys; const cnt={}; fresh.forEach(x=>{const n=({upper:'상반신',char:'스탠딩',illust:'일러스트',bg:'배경',enemy:'적',icon:'아이콘',map:'지도',cg:'CG',prop:'소품',weapon:T('weapon')})[x.cat]||x.cat; cnt[n]=(cnt[n]||0)+1;});
    openModal(`${head('새 그림을 그릴까요?',`<span class="muted">${esc(label||'AI가 새로 만든 것')}</span>`)}
      <p style="margin:0 0 8px">새로 생긴 그림 <b>${fresh.length}장</b> · ${Object.entries(cnt).map(([k,v])=>esc(k)+' '+v).join(', ')}</p>
      <p class="muted" style="margin:0 0 12px">게임을 하는 동안 뒤에서 한 장씩 그려요. 위쪽 진행 표시에서 언제든 멈출 수 있어요.</p>
      <div class="row"><button class="btn" data-act="artgo">그리기</button><button class="btn ghost" data-act="close">나중에</button></div>
      <button class="linkb" data-act="artalways" style="margin-top:10px">앞으로는 묻지 않고 자동으로 그리기</button>`); };
  setTimeout(show,600);
}
