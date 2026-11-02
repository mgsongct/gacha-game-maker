/* ===== PC 서버 (내 컴퓨터에 저장 · 휴대폰으로 접속) ===== */
async function pcApi(path,opt){ const pc=PCS(); if(!pc) throw {code:'network',message:'PC 서버가 연결돼 있지 않아요'}; opt=opt||{};
  const r=await http(pc.base+path,{method:opt.method||'GET',headers:Object.assign({'X-GGM-Key':pc.key},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body,binary:!!opt.binary,timeout:opt.timeout||120000});
  if(r.status===404&&opt.ok404) return null; if(r.status===401) throw {code:'bad_key',message:'PC 서버 키가 맞지 않아요. QR을 다시 찍어 주세요'}; if(r.status>=400) throw errOf(r);
  if(opt.binary) return r; try{return r.text?JSON.parse(r.text):{};}catch(e){throw Error('PC 서버 응답을 읽지 못했습니다');} }
let PCJOB=false;
async function pcPush(silent,force){
  if(PCJOB||!PCS()) return; PCJOB=true; try{
    if(!silent) syBar('PC에 저장하는 중…'); await flush();
    const S0=await pcApi('/api/store/state',{ok404:true}), pc0=PCS(), other=!!(S0&&S0.at>(pc0.last||0)+1000&&(S0.devId?S0.devId!==devId():S0.device!==syDevice()));
    if(S0&&!force&&(other||freshGame())){
      if(silent){ if(!PCWARNED){ PCWARNED=true; toast(other?'PC에 다른 기기의 더 새 진행이 있어서 자동 저장을 멈췄어요. 설정 → PC 서버에서 받기를 눌러 주세요':'이 기기의 게임이 아직 시작 전이라 PC의 저장을 덮어쓰지 않았어요'); } return; }
      PCJOB=false; syBar('');
      openModal(`${head(other?'PC에 더 새 진행이 있어요':'PC의 저장을 덮어쓸까요?')}<p>${other?`<b>${esc(S0.device||'다른 기기')}</b> · ${esc(new Date(S0.at).toLocaleString())}에 저장한 진행이 PC에 있어요. 이 기기의 게임으로 올리면 그 진행을 덮어써요.`:'이 기기의 게임은 아직 시작하지 않은 샘플 게임이에요. 올리면 PC에 저장된 게임을 덮어써요.'}</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpullgo">PC의 게임 받기</button><button class="btn ghost" data-act="pcpushf">그래도 올리기</button></div>`); return; }
    const have=new Set(((await pcApi('/api/store/list'))||{}).blobs||[]), idx=syIdx(), keys=await idbKeys(), bin={}, types={};
    for(const k of keys){ const b=await idbGet(k); if(!b||!(b instanceof Blob)) continue; types[k]=b.type||''; const ent=idx[k]; let h;
      if(ent&&ent.size===b.size&&ent.hash) h=ent.hash; else { h=await shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; } bin[k]=h;
      if(!have.has(h)){ const ack=await pcApi('/api/store/blob/'+h,{method:'POST',body:{content:bytesToB64(new Uint8Array(await b.arrayBuffer()))}});if(ack?.ok!==true)throw Error('PC 자료 저장 완료를 확인하지 못했습니다');have.add(h); } }
    saveSyIdx(idx);
    let ls={}; syLsKeys(true).forEach(k=>{ const v=appStorage.getItem(k); if(v!=null) ls[k]=v; }); ls=lsHoldMerge(ls,S0&&S0.ls);
    const state={v:1,at:Date.now(),baseAt:S0?.at||0,device:syDevice(),devId:devId(),build:APP_BUILD,ls,bin,types};
    const ack=await pcApi('/api/store/state',{method:'POST',body:state});if(ack?.ok!==true)throw Error('PC 진행 저장 완료를 확인하지 못했습니다');
    const o=PCS(); o.last=state.at; o.localAt=G.prog.savedAt||Date.now(); delete o.restored; setPCS(o); PCWARNED=false; if(!silent) toast('PC에 저장했어요'); return true;
  }catch(e){ if(!silent) toast('PC 저장 실패. '+syErr(e)); } finally{ PCJOB=false; syBar(''); }
}
// Download to staging; failed or incomplete transfers never replace live images or game records.
async function syncStageMedia(S,load,prefix){
 if(!S||!S.ls||typeof S.ls!=='object'||!S.bin||typeof S.bin!=='object')throw Error('받은 동기화 데이터 형식이 올바르지 않습니다');
 const idx=syIdx(),todo=[];for(const[k,h]of Object.entries(S.bin)){if(!/^[a-f0-9]{64}$/i.test(h))throw Error('자료 해시 정보가 올바르지 않습니다');if(idx[k]?.hash!==h||!(await idbGet(k)))todo.push([k,h]);}
 let n=0;await ghUploadPool(todo,async([k,h])=>{const bytes=await load(k,h);if(!bytes)throw Error('자료를 받지 못했습니다: '+k);if(await shaHex(bytes)!==h)throw Error('받은 자료의 해시가 다릅니다: '+k);const blob=new Blob([bytes],{type:S.types?.[k]||''});await appStorage.stage(prefix+k,{key:k,global:true,blob});idx[k]={hash:h,size:blob.size};syBar(`자료 받는 중 ${++n}/${todo.length}`);});return idx;
}
async function pcPull(src){
 if(PCJOB||!PCS())return false;PCJOB=true;PULLERR='';PULLERR_QUOTA=false;
 const prefix='sync-pc-'+uid()+'::',source=G,project=PJ().active,previous=window.__NOFLUSH;let committed=false;
 try{syBar('PC에서 받는 중…');await flush();const S=src&&src.state||await pcApi('/api/store/state',{ok404:true});if(!S)throw Error('PC에 아직 저장된 게임이 없어요');
  const idx=await syncStageMedia(S,async(k,h)=>{let error;for(let t=0;t<3;t++){try{const r=await pcApi('/api/store/blob/'+h,{binary:true,timeout:60000});if(r?.bytes)return r.bytes;throw Error('빈 자료 응답');}catch(e){error=e;if(e?.code==='bad_key')throw e;if(t<2)await wait(1500*(t+1));}}throw error;},prefix);
  if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 받기를 취소했습니다');await flush();window.__NOFLUSH=true;clearTimeout(flushT);
  const w=await lsApply(S.ls,null,prefix);committed=true;dirty.clear();saveSyIdx(idx);
  const o=PCS();o.last=src&&src.restore?src.cur||Date.now():S.at;o.localAt=src&&src.restore?0:w.at;if(src&&src.restore)o.restored=1;setPCS(o);
  toast('PC의 게임을 받았어요. 다시 시작할게요');setTimeout(()=>reloadGame(),800);return true;
 }catch(e){PULLERR_QUOTA=e?.name==='QuotaExceededError';PULLERR='PC에서 받기 실패. '+syErr(e);toast(PULLERR);if(committed){setTimeout(()=>reloadGame(),800);return true;}return false;}
 finally{if(!committed)window.__NOFLUSH=previous;await appStorage.discard(prefix).catch(()=>{});PCJOB=false;syBar('');}
}
async function pcStart(){
  const pc=PCS(); if(!pc) return; if(window.__BOOTSYNC){ setTimeout(pcStart,1500); return; }
  try{ const S=await pcApi('/api/store/state',{ok404:true});
    if(window.__PC_NEW&&!S){ openModal(`${head('PC 서버에 연결됐어요')}<p>이제 게임 진행과 그림이 PC(ggm-data 폴더)에 저장돼요. 이 기기의 게임을 PC로 올려 둘까요?</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpush">PC에 저장</button><button class="btn ghost" data-act="close">나중에</button></div>`); return; }
    if(pc.restored&&S){ pcPush(true,true); return; } // 백업에서 되살린 게임은 PC에도 바로 다시 저장
    const other=S&&(S.devId?S.devId!==devId():S.device!==syDevice());
    if(S&&S.at>(pc.last||0)&&other&&freshGame()&&!LK.locked&&!$('#modal').querySelector('[data-act=pcpullgo]')){ if(!bootPullOk()) return; toast('PC에 저장된 게임을 받아 올게요'); pcPull(); return; }
    if(S&&S.at>(pc.last||0)&&other){ const show=()=>{ if(!$('#modal').hidden||!$('#ov').hidden&&!$('#ov').querySelector('.title')) return setTimeout(show,2500);
        openModal(`${head('PC에 더 새 게임이 있어요')}<p><b>${esc(S.device||'다른 기기')}</b> · ${esc(new Date(S.at).toLocaleString())}</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpull">받기</button><button class="btn ghost" data-act="close">나중에</button></div>`); }; show(); }
  }catch(e){ toast('PC 서버에 연결하지 못했어요. PC에서 서버 창이 켜져 있는지 확인해 주세요'); }
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&!LKMODE()){ const pc=PCS(); if(pc&&pc.auto!==false&&(G.prog.savedAt||0)>(pc.localAt||0)+3000) pcPush(true); } });
setInterval(()=>{ const pc=PCS(); if(pc&&pc.auto!==false&&!PCJOB&&!LK.locked&&(G.prog.savedAt||0)>(pc.localAt||0)+3000) pcPush(true); },2*60000);
function openPcSet(lost){ const pc=PCS();
  openModal(`${head('PC 서버',`<span class="muted">내 컴퓨터를 저장소·AI 중계로 쓰기</span>`)}
    ${lost?`<div class="panel" style="border-color:var(--gold);margin-bottom:10px"><b>PC 서버에 다시 연결해 주세요</b><p class="muted" style="margin:6px 0 0">이 주소는 PC 서버인데 연결 키가 없어서 이 기기의 빈 게임으로 열렸어요. PC 화면의 QR을 다시 찍거나, QR 주소(끝에 ?pc=… 가 붙은 주소)를 아래에 붙여 넣으면 PC에 저장된 게임을 받아 와요.${IS_IOS?' 아이폰은 홈 화면 앱과 Safari의 저장 공간이 따로라서, 홈 화면 아이콘으로 열면 이렇게 될 수 있어요.':''}</p></div>`:''}
    <p class="muted">PC에서 <b>PC서버-시작.bat</b>을 켜면 QR이 떠요. 휴대폰으로 찍으면 연결되고, 게임이 PC에 저장돼요. 내 PC의 ComfyUI·Ollama 주소(127.0.0.1)도 그대로 쓸 수 있어요.</p>
    <label class="f" for="pc_link">PC 서버 주소 (QR 주소를 붙여 넣기)</label><input class="in" id="pc_link" value="${pc?esc(pc.base+'/?pc='+pc.key):''}" placeholder="https://xxxx.trycloudflare.com/?pc=...">
    <label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pc_auto" ${!pc||pc.auto!==false?'checked':''}><span>자동으로 PC에 저장 (앱을 나갈 때, 5분마다)</span></label>
    <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="pc_lock" ${!pc||pc.lock!==false?'checked':''}><span>한 번에 한 기기만 (다른 기기에서 하면 여기는 멈추고, 넘겨받을 때 진행을 이어받아요)</span></label>
    <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="pc_pxoff" ${proxyOff()?'checked':''}><span>AI 요청은 PC를 거치지 않고 직접 보내기 <span class="muted" style="font-size:.78rem">(PC와 같은 기기에서 쓸 때 더 빨라요. 휴대폰에서 PC의 로컬 AI를 쓰거나 웹에서 막히는 서비스가 있으면 끄세요)</span></span></label>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="pcsave">연결</button>${pc?'<button class="btn ghost" data-act="pcoff">연결 해제</button>':''}</div>
    ${pc?`<div class="row" style="margin-top:8px"><button class="btn sm" data-act="pcpush">지금 PC에 저장</button><button class="btn sm ghost" data-act="pcpull">PC에서 받기</button></div>`:''}
    ${pc?`<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="pchist">PC 백업에서 되살리기</button></div>`:''}
    <p class="muted" style="margin-top:10px;font-size:.8rem">PC 서버 프로그램은 공개 저장소의 gacha-game-maker-pc.zip에 있어요(Python 필요). 바깥 주소(trycloudflare)는 PC 서버를 켤 때마다 바뀌어요. 바뀌면 QR을 다시 찍으면 되고, 게임은 PC에 있으니 그대로 이어져요.</p>`); }
// PC 서버의 ggm-data/history에 남은 저장 백업(최근 20번 + 크게 줄어들기 전 저장)에서 되살리기
async function openPcHist(){ let L=null; try{ L=await pcApi('/api/store/history',{ok404:true,timeout:20000}); }catch(e){ toast('PC 서버에 연결하지 못했어요. '+syErr(e)); return; }
  if(!L||!Array.isArray(L.items)){ openModal(`${head('PC 백업')}<p>지금 켜 둔 PC 서버 프로그램이 예전 버전이라 백업 목록을 볼 수 없어요.</p><p class="muted">Releases의 gacha-game-maker-pc.zip을 새로 받아 덮어쓴 뒤 다시 켜 주세요(ggm-data 폴더는 그대로 두면 돼요). 그 전까지는 PC의 ggm-data/history 폴더에 있는 state-날짜.json을 state.json으로 바꿔 넣으면 그 시점으로 돌아가요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="close">닫기</button></div>`); return; }
  const kb=n=>n>1048576?(n/1048576).toFixed(1)+'MB':Math.max(1,Math.round(n/1024))+'KB';
  openModal(`${head('PC 백업에서 되살리기',`<span class="muted">PC에 저장할 때마다 남겨 둔 기록이에요</span>`)}
    <p class="muted" style="margin:0 0 8px">게임이 초기화됐거나 진행이 사라졌다면, 사라지기 전 시간의 백업을 고르세요. 용량이 크게 줄어든 저장 바로 앞의 백업은 따로 오래 남겨 둬요(★).</p>
    <div class="mlist">${L.items.length?L.items.map(x=>`<div class="mrow" style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><div style="min-width:0"><b>${x.keep?'★ ':''}${esc(new Date(x.at||0).toLocaleString())}</b><div class="muted" style="font-size:.8rem">${esc(x.device||'')} · ${esc((x.games||[]).join(', ')||'게임')} · ${kb(x.size||0)}</div></div><button class="btn sm" data-act="pchistgo" data-id="${esc(x.name)}">되살리기</button></div>`).join(''):'<p class="muted">아직 백업이 없어요.</p>'}</div>`); }
