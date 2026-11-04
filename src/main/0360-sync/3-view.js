/* ===== 0360-sync — View(HTML·DOM을 만듦) ===== */
/* src/main/0360-sync/010-common.js에서 옮김 */
function syDevice(){ const o=SY(); return o.device||(IS_NATIVE?'안드로이드 폰':IS_IOS?'아이폰':document.body.classList.contains('desk')?'PC':'브라우저'); }
function syBar(t){ let el=$('#syBar'); if(!t){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='syBar'; el.className='prepchip'; document.body.appendChild(el); } el.innerHTML=`<b>☁ ${esc(t)}</b>`; }
/* src/main/0360-sync/020-pc-server.js에서 옮김 */
/* PC 저장 덮어쓰기 확인 창 내용(View) */
function pcConflictHTML(other,S0){ return `${head(other?'PC에 더 새 진행이 있어요':'PC의 저장을 덮어쓸까요?')}<p>${other?`<b>${esc(S0.device||'다른 기기')}</b> · ${esc(new Date(S0.at).toLocaleString())}에 저장한 진행이 PC에 있어요. 이 기기의 게임으로 올리면 그 진행을 덮어써요.`:'이 기기의 게임은 아직 시작하지 않은 샘플 게임이에요. 올리면 PC에 저장된 게임을 덮어써요.'}</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpullgo">PC의 게임 받기</button><button class="btn ghost" data-act="pcpushf">그래도 올리기</button></div>`; }
// Download to staging; failed or incomplete transfers never replace live images or game records.
async function syncStageMedia(S,load,prefix){
 if(!S||!S.ls||typeof S.ls!=='object'||!S.bin||typeof S.bin!=='object')throw Error('받은 동기화 데이터 형식이 올바르지 않습니다');
 const idx=syIdx(),todo=[];for(const[k,h]of Object.entries(S.bin)){if(!/^[a-f0-9]{64}$/i.test(h))throw Error('자료 해시 정보가 올바르지 않습니다');if(idx[k]?.hash!==h||!(await idbGet(k)))todo.push([k,h]);}
 let n=0;await ghUploadPool(todo,async([k,h])=>{const bytes=await load(k,h);if(!bytes)throw Error('자료를 받지 못했습니다: '+k);if(await shaHex(bytes)!==h)throw Error('받은 자료의 해시가 다릅니다: '+k);const blob=new Blob([bytes],{type:S.types?.[k]||''});await appStorage.stage(prefix+k,{key:k,global:true,blob});idx[k]={hash:h,size:blob.size};syBar(`자료 받는 중 ${++n}/${todo.length}`);});return idx;
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
function openPcSet(lost){ const pc=PCS();
  openModal(`${head('PC 서버',`<span class="muted">내 컴퓨터를 저장소·AI 중계로 쓰기</span>`)}
    ${lost?`<div class="panel" style="border-color:var(--gold);margin-bottom:10px"><b>PC 서버에 다시 연결해 주세요</b><p class="muted" style="margin:6px 0 0">이 주소는 PC 서버인데 연결 키가 없어서 이 기기의 빈 게임으로 열렸어요. PC 화면의 QR을 다시 찍거나, QR 주소(끝에 ?pc=… 가 붙은 주소)를 아래에 붙여 넣으면 PC에 저장된 게임을 받아 와요.${IS_IOS?' 아이폰은 홈 화면 앱과 Safari의 저장 공간이 따로라서, 홈 화면 아이콘으로 열면 이렇게 될 수 있어요.':''}</p></div>`:''}
    <p class="muted">PC에서 <b>PC서버-시작.bat</b>을 켜면 QR이 떠요. 휴대폰으로 찍으면 연결되고, 게임이 PC에 저장돼요. 내 PC의 ComfyUI·Ollama 주소(127.0.0.1)도 그대로 쓸 수 있어요.</p>
    <label class="f" for="pc_link">PC 서버 주소 (QR 주소를 붙여 넣기)</label><input class="in" id="pc_link" value="${pc?esc(pc.base+'/?pc='+pc.key):''}" placeholder="https://xxxx.trycloudflare.com/?pc=...">
    <label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pc_auto" ${!pc||pc.auto!==false?'checked':''}><span>자동으로 PC에 저장 (저장할 때마다 몇 초 안에 · PC의 data/게임/종류.json)</span></label>
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
/* src/main/0360-sync/030-github.js에서 옮김 */
/* 올리기·받기·시작할 때 확인·설정 화면 */
/* 다른 기기에 더 새 데이터가 있을 때 창 내용(View) */
function syConflictHTML(R){ return `${head('다른 기기에 더 새 데이터가 있어요')}<p><b>${esc(R.state.device||'다른 기기')}</b>에서 ${esc(new Date(R.state.at).toLocaleString())}에 올린 데이터가 있어요. 그대로 올리면 그 데이터를 덮어써요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">그 데이터 받기</button><button class="btn ghost" data-act="sypushf">그래도 올리기</button></div>`; }
async function syCheckOnStart(){
  const o=SY(); if(!syReady()||o.auto===false) return; if(window.__BOOTSYNC){ setTimeout(syCheckOnStart,1500); return; }
  try{ const R=await syRemote(o); const S=R.state; if(!S||S.at<=(o.last||0)||S.device===syDevice()) return;
    const localChanged=(G.prog.savedAt||0)>(o.localAt||0)+5000&&o.last;
    const show=()=>{ if(!$('#modal').hidden||!$('#ov').hidden) return setTimeout(show,2500);
      openModal(`${head('다른 기기의 새 데이터가 있어요')}<p><b>${esc(S.device||'다른 기기')}</b> · ${esc(new Date(S.at).toLocaleString())}</p>${localChanged?'<p style="color:var(--rose)">이 기기에도 아직 올리지 않은 진행이 있어요. 받으면 이 기기의 진행은 덮어써져요.</p>':''}<div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">받기</button><button class="btn ghost" data-act="close">나중에</button></div>`); };
    show(); }catch(e){ quietErr(e,'syCheckOnStart'); }
}
function openSync(){
  const o=SY();
  openModal(`${head('PC·폰 연동',`<span class="muted">내 GitHub 비공개 저장소에 게임을 올리고 받아요</span>`)}
    <ol class="a2hs"><li><button class="linkb" data-act="sylink" data-url="https://github.com/new?name=ggm-save&visibility=private">GitHub에서 비공개 저장소 만들기</button> (이름 예: ggm-save, <b>Private</b>)</li>
    <li><button class="linkb" data-act="sylink" data-url="https://github.com/settings/personal-access-tokens/new">토큰 만들기</button> → Repository access: <b>Only select repositories</b>에서 그 저장소만 → Permissions의 <b>Contents: Read and write</b> → 만들기</li>
    <li>아래에 <b>아이디/저장소이름</b>과 토큰을 넣고, 다른 기기에도 똑같이 넣어요.</li></ol>
    <label class="f" for="sy_repo">저장소</label><input class="in" id="sy_repo" value="${esc(o.repo||'')}" placeholder="내아이디/ggm-save">
    <label class="f" for="sy_tok">토큰</label><input class="in" id="sy_tok" type="password" autocomplete="off" value="${esc(o.token||'')}" placeholder="github_pat_...">
    <label class="f" for="sy_dev">이 기기 이름</label><input class="in" id="sy_dev" value="${esc(syDevice())}">
    <label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="sy_auto" ${o.auto!==false?'checked':''}><span>켤 때 다른 기기의 새 데이터가 있으면 알려 주기</span></label>
    <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="sy_up" ${o.autoUp?'checked':''}><span>앱을 나갈 때 자동으로 올리기</span></label>
    <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="sy_lock" ${o.lock!==false?'checked':''}><span>한 번에 한 기기만 (다른 기기에서 하면 여기는 멈추고, 나갈 때 자동으로 올려요)</span></label>
    <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="sy_keys" ${o.keys?'checked':''}><span>AI·그림·목소리 키도 같이 옮기기 <span class="muted" style="font-size:.8rem">(비공개 저장소일 때만 켜세요)</span></span></label>
    <p class="muted" style="margin:8px 0 0;font-size:.82rem">게임 진행, 만든 게임들, 그림·음악·목소리가 올라가요. 그림은 바뀐 것만 올려서 두 번째부터는 빨라요. 토큰은 이 기기에만 저장돼요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="sysave">저장하고 연결 확인</button></div>
    ${syReady()?`<div class="row" style="margin-top:8px"><button class="btn sm" data-act="sypush">지금 올리기</button><button class="btn sm ghost" data-act="sypull">받기</button><button class="btn sm ghost" data-act="syoff">연동 해제</button></div>`:''}`);
}
/* GitHub 연결 확인 뒤 창(View): 다른 기기가 올린 데이터가 있으면 받기/올리기를 고르고, 없으면 지금 올릴지 물음 */
function openSyLinked(st){ if(st) openModal(`${head('연결됐어요')}<p>클라우드에 <b>${esc(st.device)}</b>에서 ${esc(new Date(st.at).toLocaleString())}에 올린 데이터가 있어요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">그 데이터 받기</button><button class="btn ghost" data-act="sypushf">이 기기 데이터 올리기</button></div>`);
  else openModal(`${head('연결됐어요')}<p>이 기기의 게임을 클라우드에 올려 둘까요? 그다음 다른 기기에서 같은 저장소로 연결하고 '받기'를 누르면 돼요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypush">지금 올리기</button><button class="btn ghost" data-act="close">나중에</button></div>`); }
/* src/main/0360-sync/040-boot.js에서 옮김 */
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
function openPullFail(mode,why){ const pc=mode==='pc';
  openModal(`${head(pc?'PC의 게임을 받지 못했어요':'클라우드 게임을 받지 못했어요')}
    <p>${why==='loop'?'받아 온 게임으로 다시 시작했는데도 계속 다시 받으려고 해서 멈췄어요.':esc(PULLERR||'연결이 끊겼거나 시간이 오래 걸렸어요.')}</p>
    ${PULLERR_QUOTA||why==='loop'?'<p class="muted">이 기기(브라우저)의 저장 공간이 모자라면 받은 게임이 저장되지 않아요. 아이폰 Safari는 저장 공간이 작아요. 안 쓰는 게임을 PC에서 지우거나(설정 → 게임 목록), 사진·음성을 줄인 뒤 다시 받아 보세요.</p>':''}
    <p class="muted">${pc?'PC에 저장된 게임은 그대로 있어요. 이 기기에서 새로 시작한 게임은 PC에 자동으로 덮어쓰지 않아요.':'클라우드에 올린 데이터는 그대로 있어요.'}</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="${pc?'pcpullgo':'sypull'}">다시 받기</button>${pc?'<button class="btn ghost" data-act="pchist">PC 백업</button>':''}<button class="btn ghost" data-act="close">이 기기로 계속</button></div>`); }
/* src/main/0360-sync/0400-publish-subscribe.js에서 옮김 */
/* 게임 게시 완료 창 내용(View) */
function pubDoneHTML(ver,o,dir,need){ return `${head('게시했어요',`<span class="muted">「${esc(G.meta.title)}」 v${ver}</span>`)}
      <p style="margin:0 0 6px">이 주소를 받은 사람은 설정 → 게임 → 🔗 게임 구독에 넣으면 이 게임을 받고, 다음 게시부터 자동으로 업데이트를 받아요.</p>
      <textarea class="in" id="pub_addr" readonly style="min-height:56px">${esc(subAddr(o.repo,o.branch,dir))}</textarea>
      <p class="muted" style="font-size:.78rem;margin:4px 0 0">새 그림 ${need.length}장을 올렸어요. GitHub가 파일을 퍼뜨리는 데 몇 분 걸릴 수 있어요. 저장소는 꼭 공개(Public)로 두세요.</p>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="pubcopy">주소 복사</button><button class="btn ghost" data-act="close">닫기</button></div>`; }
function openPub(){ const P0=PUB(), M=G.meta.pub||{}, dir=M.slug?'games/'+M.slug:'';
  openModal(`${head('🌐 게임 게시',`<span class="muted">다른 사람이 구독하고 업데이트를 받아요</span>`)}
    <p class="muted" style="margin:0 0 8px;font-size:.82rem">내 GitHub <b>공개</b> 저장소에 이 게임을 올려요. 진행 상황·API 키·음성은 올라가지 않아요. 새 장·이벤트를 만든 뒤 다시 게시하면 구독한 사람에게 업데이트가 가요(그 사람의 진행·보유 캐릭터는 그대로).</p>
    ${M.ver?`<div class="optbox" style="font-size:.82rem;margin:0 0 8px">지금 게시: v${M.ver} · ${M.at?new Date(M.at).toLocaleString():''}<br><span style="word-break:break-all">${esc(subAddr(M.repo||P0.repo||'',M.branch||P0.branch||'main',dir))}</span> <button class="linkb" type="button" data-act="pubcopy2" data-v="${esc(subAddr(M.repo||P0.repo||'',M.branch||P0.branch||'main',dir))}">복사</button></div>`:''}
    <label class="f" for="pb_repo">저장소 (주인/이름)</label><input class="in" id="pb_repo" placeholder="예: myname/my-gacha-games" value="${esc(P0.repo||'')}">
    <div class="g2"><div><label class="f" for="pb_branch">브랜치</label><input class="in" id="pb_branch" value="${esc(P0.branch||'main')}"></div><div><label class="f" for="pb_tok">토큰</label><input class="in" id="pb_tok" type="password" autocomplete="off" value="${esc(P0.token||'')}" placeholder="github_pat_…"></div></div>
    <p class="muted" style="margin:4px 0 0;font-size:.76rem">GitHub → Settings → Developer settings → Fine-grained tokens → 이 저장소만 · Contents: Read and write. 토큰은 이 기기에만 저장돼요(게임·공유 팩에 안 들어가요).</p>
    <label class="f" for="pb_notes">이번 업데이트 내용 (구독자에게 보여요)</label><textarea class="in" id="pb_notes" placeholder="예: 3장 「그늘 아래의 안내소」 추가, 여름 이벤트 개최"></textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="pubgo">${M.ver?'업데이트 게시 (v'+(M.ver+1)+')':'처음 게시하기'}</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
// 받는 쪽
function openSubAdd(){ openModal(`${head('🔗 게임 구독','<span class="muted">다른 사람이 게시한 게임을 받아요</span>')}
    <label class="f" for="sb_addr">게임 주소</label><textarea class="in" id="sb_addr" style="min-height:60px" placeholder="GGMSUB:주인/저장소/main/games/…"></textarea>
    <p class="muted" style="font-size:.78rem;margin:4px 0 0">새 게임으로 추가돼요(지금 게임은 그대로). 만든 사람이 업데이트하면 켤 때 알려 주고, 받으면 콘텐츠만 바뀌어요. 내 진행·보유 캐릭터·재화는 그대로예요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="subgo">구독하기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
async function subCheck(manual){ const S=G.meta.subscr; if(!S||!S.base) { if(manual) toast('구독한 게임이 아니에요'); return null; }
  try{ const man=JSON.parse(await subGet(S.base,'manifest.json')); SUBCHK=man;
    if(!(man.ver>(S.ver||0))){ if(manual) toast(`최신이에요 (v${S.ver||0})`); return null; }
    if(!manual&&S.skip===man.ver) return man;
    openModal(`${head(`「${esc(man.title||S.title)}」 업데이트`,`<span class="muted">v${S.ver||0} → v${man.ver}</span>`)}
      ${man.notes?`<div class="mbody">${esc(man.notes).replace(/\n/g,'<br>')}</div>`:'<p class="muted">만든 사람이 새 버전을 올렸어요.</p>'}
      <p class="muted" style="font-size:.78rem">받으면 세계관·캐릭터·스토리·이벤트·그림이 새 버전으로 바뀌어요. 내 진행·보유 캐릭터·재화·호감도는 그대로예요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="subapply">지금 받기</button><button class="btn ghost" data-act="subskip" data-v="${man.ver}">나중에</button></div>`);
    return man; }
  catch(e){ if(manual) toast('업데이트 확인 실패. '+((e&&e.message)||'')); return null; } }
/* src/main/0360-sync/050-single-device.js에서 옮김 */
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
