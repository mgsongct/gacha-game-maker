/* ===== 켤 때 자동으로 최신 게임 받기 ===== */
async function bootSync(){ const pc=PCS(), so=SY(); const mode=pc?'pc':(syReady()&&so.auto!==false?'gh':null); if(!mode) return false;
  window.__BOOTSYNC=true; let pulled=false, skip=false;
  const ov=document.createElement('div'); ov.id='bootsync'; ov.innerHTML=`<div class="bs-box"><div class="dl-spin"></div><b>${mode==='pc'?'PC':'클라우드'}에서 최신 게임을 확인하는 중…</b><button class="linkb" id="bsSkip">건너뛰고 이 기기 게임으로 시작</button></div>`; document.body.appendChild(ov);
  ov.querySelector('#bsSkip').onclick=()=>{ skip=true; };
  try{ const TO=Symbol('to'); const S=await Promise.race([mode==='pc'?pcApi('/api/store/state',{ok404:true,timeout:9000}):syRemote(so).then(R=>R.state), new Promise(r=>{ const iv=setInterval(()=>{ if(skip){ clearInterval(iv); r(TO); } },200); setTimeout(()=>{ clearInterval(iv); r(TO); },mode==='pc'?10000:15000); })]);
    if(S===TO) return false;
    const cfg=mode==='pc'?PCS():SY(), mine=!!(S&&S.devId&&S.devId===devId()), unpushed=(G.prog.savedAt||0)>(cfg.localAt||0)+5000&&!!cfg.last;
    if(S&&S.at>(cfg.last||0)&&!mine){
      if(unpushed) return false; // 이 기기에도 안 올린 진행이 있으면 물어봐요(아래 확인 창)
      if(!bootPullOk()){ setTimeout(()=>openPullFail(mode,'loop'),800); return false; } // 받기→다시 시작이 되풀이되면 멈추고 알려요
      ov.querySelector('b').textContent=`${S.device||'다른 기기'}의 게임을 받아 오는 중…`;
      pulled=await (mode==='pc'?pcPull():syPull());
      if(pulled){ setTimeout(()=>{ const el=$('#bootsync'); if(el){ el.remove(); reloadGame(); } },6000); return true; }
      setTimeout(()=>openPullFail(mode),800); return false; }
    if(!S&&mode==='pc'&&P().seenOpening) setTimeout(()=>pcPush(true),3000);
  }catch(e){ setTimeout(()=>toast(mode==='pc'?'PC 서버에 연결하지 못해서 이 기기의 게임으로 시작해요':'클라우드를 확인하지 못해서 이 기기의 게임으로 시작해요'),1500); }
  finally{ if(!pulled){ ov.remove(); window.__BOOTSYNC=false; } }
  return false; }

// 켤 때 자동 받기는 3분에 두 번까지만(저장이 안 써져서 받기→다시 시작이 끝없이 되풀이되지 않게)
function bootPullOk(){ try{ const now=Date.now(), a=JSON.parse(sessionStorage.getItem('ggm-bootpull')||'[]').filter(x=>now-x<180000); if(a.length>=2) return false; a.push(now); sessionStorage.setItem('ggm-bootpull',JSON.stringify(a)); }catch(e){} return true; }
let PULLERR='';
function openPullFail(mode,why){ const pc=mode==='pc';
  openModal(`${head(pc?'PC의 게임을 받지 못했어요':'클라우드 게임을 받지 못했어요')}
    <p>${why==='loop'?'받아 온 게임으로 다시 시작했는데도 계속 다시 받으려고 해서 멈췄어요.':esc(PULLERR||'연결이 끊겼거나 시간이 오래 걸렸어요.')}</p>
    ${PULLERR_QUOTA||why==='loop'?'<p class="muted">이 기기(브라우저)의 저장 공간이 모자라면 받은 게임이 저장되지 않아요. 아이폰 Safari는 저장 공간이 작아요. 안 쓰는 게임을 PC에서 지우거나(설정 → 게임 목록), 사진·음성을 줄인 뒤 다시 받아 보세요.</p>':''}
    <p class="muted">${pc?'PC에 저장된 게임은 그대로 있어요. 이 기기에서 새로 시작한 게임은 PC에 자동으로 덮어쓰지 않아요.':'클라우드에 올린 데이터는 그대로 있어요.'}</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="${pc?'pcpullgo':'sypull'}">다시 받기</button>${pc?'<button class="btn ghost" data-act="pchist">PC 백업</button>':''}<button class="btn ghost" data-act="close">이 기기로 계속</button></div>`); }
let PULLERR_QUOTA=false;
// Remote game records and staged media become visible together, only after validation succeeds.
async function lsApply(ls,mapv,prefix){
 if(!ls||typeof ls!=='object'||Array.isArray(ls))throw Error('받은 저장 목록이 올바르지 않습니다');
 const pj=JSON.parse(ls[PJKEY]||'null');
 if(!pj||!Array.isArray(pj.list)||typeof pj.active!=='string'||!pj.list.some(x=>x&&x.id===pj.active))throw Error('받은 게임 목록을 확인하지 못했습니다');
 const records={},prefs={},allowed=new Set([SETUP_KEY,NKEY,SKEY,PKEY]);
 for(const[k,raw]of Object.entries(ls)){if(!GGMStorage.managed(k)&&!allowed.has(k))continue;if(typeof raw!=='string')throw Error('받은 저장 항목 형식이 올바르지 않습니다');const v=mapv?mapv(k,raw):raw;if(v==null)continue;if(GGMStorage.managed(k)){if(k!==PJKEY&&!Array.isArray(JSON.parse(v)?.chars))throw Error('받은 게임 자료를 확인하지 못했습니다');records[k]=v;}else prefs[k]=v;}
 const active=records[pjKey(pj.active)];if(!active)throw Error('선택한 게임의 저장 데이터가 빠져 있습니다');
 const old={};try{for(const[k,v]of Object.entries(prefs)){old[k]=appStorage.getItem(k);appStorage.setItem(k,v);}await appStorage.commitRecords(records,prefix||null);}
 catch(e){for(const[k,v]of Object.entries(old))try{v===null?appStorage.removeItem(k):appStorage.setItem(k,v);}catch(ignore){}throw e;}
 try{appStorage.removeItem('ggm-sync-hold');}catch(e){}return {ok:true,hold:[],at:JSON.parse(active).prog?.savedAt||0};
}
// 올릴 때: 이 기기에 안 들어가 잠시 빼 둔 게임은 PC에 있던 것을 그대로 넣어요(빠진 채로 올려서 PC의 게임이 사라지지 않게)
function lsHoldMerge(ls,rls){ let hold=[]; try{ hold=JSON.parse(appStorage.getItem('ggm-sync-hold')||'[]'); }catch(e){} if(!hold.length||!rls) return ls;
  let pj=null, rpj=null; try{ pj=JSON.parse(ls[PJKEY]||'null'); rpj=JSON.parse(rls[PJKEY]||'null'); }catch(e){} if(!pj) return ls;
  hold.forEach(id=>{ const k=pjKey(id); if(rls[k]==null||pj.list.some(x=>x.id===id)) return; ls[k]=rls[k]; pj.list.push((rpj&&(rpj.list||[]).find(x=>x.id===id))||{id,title:'게임'}); });
  ls[PJKEY]=JSON.stringify(pj); return ls; }
// 아직 손대지 않은 샘플 게임이면(새 기기·지워진 저장소) PC의 저장을 자동으로 덮지 않아요
function freshGame(){ return G.meta.title===DEFAULT_META.title&&!G.meta.draft&&!P().seenOpening&&PJ().list.length<=1; }
let PCWARNED=false;

