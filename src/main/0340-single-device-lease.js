/* ===== 한 번에 한 기기만 플레이 (다른 기기는 멈춤) ===== */
function devId(){ let v=''; try{ v=appStorage.getItem('ggm-devid')||''; if(!v){ v='d'+uid()+uid(); appStorage.setItem('ggm-devid',v); } }catch(e){ v=v||'d0'; } return v; }
function LKMODE(){ const pc=PCS(); if(pc&&pc.lock!==false) return 'pc'; const o=SY(); if(syReady()&&o.lock!==false) return 'gh'; return null; }
const LK={locked:false,t:null,busy:false,claimed:false};
function lkAway(l){ if(!l||!l.id||l.away) return true; const now=l.now||Date.now(); return LKMODE()==='pc'?now-(l.seen||0)>45000:now-(l.at||0)>6*3600e3; }
async function lkGet(){ const m=LKMODE();
  if(m==='pc') return await pcApi('/api/lease');
  if(m==='gh'){ const o=SY(); const r=await gh(o,'/contents/sync/lease.json?ref='+encodeURIComponent(o.branch||'main')+'&t='+Date.now(),{okStatus:[404]}); if(!r||!r.content) return {id:'',away:true,_sha:null,now:Date.now()};
    let j={}; try{ j=JSON.parse(new TextDecoder().decode(b64ToBytes(String(r.content).replace(/\s/g,'')))); }catch(e){} j._sha=r.sha; j.now=Date.now(); return j; }
  return null; }
async function lkOp(op){ const m=LKMODE(), me=devId(), nm=syDevice();
  if(m==='pc') return await pcApi('/api/lease',{method:'POST',body:{op,id:me,name:nm}});
  if(m!=='gh') return null; if(op==='beat') return lkGet(); const o=SY();
  for(let i=0;i<3;i++){ const cur=await lkGet(), now=Date.now(); let nx={id:cur.id||'',name:cur.name||'',at:cur.at||0,away:!!cur.away,want:cur.want||null};
    if(op==='claim') nx={id:me,name:nm,at:now,away:false,want:null};
    else if(op==='want') nx.want={id:me,name:nm,at:now};
    else if(op==='give'){ if(cur.id!==me||!cur.want) return cur; nx={id:cur.want.id,name:cur.want.name,at:now,away:false,want:null}; }
    else if(op==='away'){ if(cur.id!==me) return cur; nx.away=true; }
    else if(op==='free'){ if(cur.id!==me) return cur; nx={id:'',name:'',at:now,away:true,want:null}; }
    const body={message:'play '+op+' · '+nm,content:bytesToB64(new TextEncoder().encode(JSON.stringify(nx)))}; if(cur._sha) body.sha=cur._sha; if(o.branch) body.branch=o.branch;
    const r=await gh(o,'/contents/sync/lease.json',{method:'PUT',body,okStatus:[409,422]}); if(r&&r.content) return Object.assign(nx,{now}); await wait(800); }
  return null; }
async function lkSave(onlyChanged){ const m=LKMODE(); if(m==='pc'){ const pc=PCS(); if(!onlyChanged||(G.prog.savedAt||0)>(pc.localAt||0)+1000){if(await pcPush(true)!==true)throw Error('PC 저장에 실패하여 기기를 넘기지 않았습니다');} }
  else if(m==='gh'){ const o=SY(); if(!onlyChanged||(G.prog.savedAt||0)>(o.localAt||0)+1000){if(await syPush(true)!==true)throw Error('클라우드 저장에 실패하여 기기를 넘기지 않았습니다');} } }
async function lkNewer(){const m=LKMODE();
 if(m==='pc'){const pc=PCS(),S=await pcApi('/api/store/state',{ok404:true});return !!(S&&S.at>(pc.last||0)&&(S.devId?S.devId!==devId():S.device!==syDevice()));}
 if(m==='gh'){const o=SY(),R=await syRemote(o),S=R.state;return !!(S&&S.at>(o.last||0)&&(S.devId?S.devId!==devId():S.device!==syDevice()));}return false;
}
async function lkPullIfNewer(){try{if(!(await lkNewer()))return false;toast('다른 기기에서 하던 게임을 받아 올게요');const ok=LKMODE()==='pc'?await pcPull():await syPull();if(!ok)throw Error(PULLERR||'최신 진행을 받지 못했습니다');return true;}catch(e){const failure=Error(e.message||'최신 진행을 확인하지 못했습니다');failure.code='pull_failed';throw failure;}}
function lkLoop(){ clearInterval(LK.t); const m=LKMODE(); if(!m) return; LK.t=setInterval(lkTick,m==='pc'?12000:45000); }
async function lkTick(){ if(!LKMODE()){ clearInterval(LK.t); return; } if(document.visibilityState!=='visible'||LK.locked||LK.busy) return;
  LK.busy=true; try{ const l=await lkOp('beat'); if(!l) return; const me=devId();
    if(l.id&&l.id!==me){ lkLock(l,'taken'); return; }
    if(l.want&&l.want.id!==me&&((l.now||Date.now())-(l.want.at||0))<180000){ lkLock({name:l.want.name},'giving'); await lkSave(false); await lkOp('give'); lkLock({name:l.want.name},'gave'); }
  }catch(e){if(LK.locked)lkLock({name:'다른 기기'},'savefailed');toast(e.message||'기기 전환을 완료하지 못했습니다');} finally{ LK.busy=false; } }
async function lkActivate(){ if(window.__BOOTSYNC){ setTimeout(lkActivate,1500); return; } if(!LKMODE()||LK.busy) return; LK.busy=true; let pulled=false; try{
    const l=await lkGet(), me=devId();
    if(!l||!l.id||l.id===me||lkAway(l)){ const other=l&&l.id&&l.id!==me; await lkOp('claim'); LK.claimed=true; lkUnlock(); lkLoop(); if(other||LK.wasLocked){ LK.wasLocked=false; pulled=await lkPullIfNewer(); } }
    else lkLock(l,'other');
  }catch(e){if(e.code==='pull_failed'){lkLock({name:'다른 기기'},'pullfailed');toast(e.message);} /* 최초 연결 확인 실패는 로컬 게임을 유지해요 */ } finally{ if(!pulled) LK.busy=false; } }
function lkLock(l,why){ LK.locked=true; LK.wasLocked=true; clearInterval(LK.t); try{ if(B&&!B.over) clearInterval(B.timer); }catch(e){} try{ stopVoice(); }catch(e){}
  const nm=esc((l&&l.name)||'다른 기기');
  const msg={pullfailed:['최신 진행을 받지 못했어요','다른 기기의 저장을 확인하거나 받지 못해 이어하기를 잠시 멈췄어요. 연결을 확인하고 다시 시도해 주세요. 기존 진행을 덮어쓰지 않았어요.'],savefailed:['진행을 넘기지 못했어요','최신 진행을 저장하지 못해 다른 기기로 넘기지 않았어요. 연결과 저장 공간을 확인한 뒤 다시 시도해 주세요.'],other:[`${nm}에서 하는 중이에요`,'다른 기기에서 플레이하고 있어서 여기는 멈춰 뒀어요. 진행이 섞이지 않게 한 번에 한 기기만 움직여요.'],
    taken:[`${nm}에서 이어서 하고 있어요`,'그쪽으로 넘어갔어요. 여기서 다시 하려면 아래 버튼을 눌러요.'],
    giving:[`${nm}(으)로 넘겨주는 중…`,'지금까지의 진행을 저장하고 있어요. 잠깐만 기다려 주세요.'],
    gave:[`${nm}(으)로 넘겨줬어요`,'진행을 저장하고 넘겨줬어요. 여기서 다시 하려면 아래 버튼을 눌러요.']}[why]||['멈춤',''];
  let d=$('#devlock'); if(!d){ d=document.createElement('div'); d.id='devlock'; document.body.appendChild(d); }
  d.innerHTML=`<div class="dl-box"><div class="dl-ico">⏸</div><b>${msg[0]}</b><p>${msg[1]}</p>${why==='giving'?'<div class="dl-spin"></div>':`<button class="btn" data-act="lktake">여기서 이어하기</button><small>누르면 ${nm}의 진행을 저장받아 이어서 해요.</small>`}</div>`; }
function lkUnlock(){ LK.locked=false; const d=$('#devlock'); if(d) d.remove(); try{ if(B&&!B.over&&B.timer) bRun(); }catch(e){} }
async function lkTake(btn){ if(LK.busy) return; LK.busy=true; const box=$('#devlock .dl-box'); const pcm=LKMODE()==='pc', me=devId(); let ok=false, pulled=false;
  const say=(t,s)=>{ if(box) box.innerHTML=`<div class="dl-ico">↻</div><b>${t}</b><p>${s||''}</p><div class="dl-spin"></div>`; };
  try{ let l=await lkGet();
    if(l&&l.id&&l.id!==me&&!lkAway(l)){ await lkOp('want'); const until=Date.now()+(pcm?25000:75000);
      while(Date.now()<until){ say('넘겨받는 중…',`${esc(l.name||'다른 기기')}에서 저장을 마치면 바로 이어져요. (${Math.ceil((until-Date.now())/1000)}초)`); await wait(pcm?2000:6000); const x=await lkGet(); if(x.id===me){ ok=true; break; } if(lkAway(x)) break; } }
    if(!ok) await lkOp('claim');
    LK.claimed=true; LK.wasLocked=false; say('최신 진행을 확인하는 중…'); pulled=await lkPullIfNewer(); if(!pulled){ lkUnlock(); lkLoop(); toast('여기서 이어서 해요'); }
  }catch(e){ if(box) box.insertAdjacentHTML('beforeend','<p style="color:var(--rose)">연결에 실패했어요. 잠시 뒤 다시 눌러 주세요.</p><button class="btn" data-act="lktake">다시 시도</button>'); }
  finally{ if(!pulled) LK.busy=false; } }
document.addEventListener('visibilitychange',async()=>{ if(!LKMODE()) return;
  if(document.visibilityState==='hidden'){ if(LK.claimed&&!LK.locked){ clearInterval(LK.t); try{ await lkSave(true); await lkOp('away'); }catch(e){} } }
  else setTimeout(lkActivate,600); });
document.addEventListener('keydown',e=>{ if(LK.locked){ e.stopImmediatePropagation(); if(e.key!=='Tab') e.preventDefault(); } },true);

