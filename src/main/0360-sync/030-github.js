/* ===== PC·폰 연동 (내 GitHub 비공개 저장소) ===== */
function syReady(){ const o=SY(); return !!(o.repo&&o.token); }

async function syRemote(o){ // -> {head,tree,paths,state}
  const ref=await ghEnsureBranch(o);
  const head=ref.object.sha, commit=await gh(o,'/git/commits/'+head), tree=await gh(o,'/git/trees/'+commit.tree.sha+'?recursive=1');
  const paths={}; (tree.tree||[]).forEach(x=>{ if(x.type==='blob') paths[x.path]=x.sha; });
  let state=null; if(paths['sync/state.json']){ const r=await gh(o,'/git/blobs/'+paths['sync/state.json'],{binary:true}); try{ let j=JSON.parse(r.bytes?new TextDecoder().decode(r.bytes):(r.text||'')); if(j&&j.encoding==='base64'&&j.content) j=JSON.parse(new TextDecoder().decode(b64ToBytes(j.content.replace(/\s/g,'')))); state=j; }catch(e){throw Error('GitHub의 기존 진행 정보를 해석하지 못했습니다. 덮어쓰지 않고 중단합니다.');} }
  return {head,treeSha:commit.tree.sha,paths,state};
}
/* 올리기·받기·시작할 때 확인·설정 화면 */
async function syPush(force){
  const o=SY(); if(!syReady()){ openSync(); return; } if(SYJOB){ toast('동기화 중이에요'); return; }
  SYJOB='push'; try{
    syBar('클라우드 확인 중…'); await flush();
    const R=await syRemote(o);
    if(!force&&R.state&&R.state.at>(o.last||0)&&R.state.device!==syDevice()){ syBar(''); SYJOB=null;
      openModal(`${head('다른 기기에 더 새 데이터가 있어요')}<p><b>${esc(R.state.device||'다른 기기')}</b>에서 ${esc(new Date(R.state.at).toLocaleString())}에 올린 데이터가 있어요. 그대로 올리면 그 데이터를 덮어써요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">그 데이터 받기</button><button class="btn ghost" data-act="sypushf">그래도 올리기</button></div>`); return; }
    const idx=syIdx(), keys=await idbKeys(), bin={}, types={};
    let i=0; for(const k of keys){ i++; if(i%10===0) syBar(`그림 확인 ${i}/${keys.length}`);
      const b=await idbGet(k); if(!b||!(b instanceof Blob)) continue; types[k]=b.type||'';
      const ent=idx[k]; if(ent&&ent.size===b.size&&ent.hash){ bin[k]=ent.hash; continue; }
      const h=await shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; bin[k]=h; }
    saveSyIdx(idx);
    const need=[...new Set(Object.values(bin))].filter(h=>!R.paths['sync/b/'+h]); let entries=[];
    const byHash={}; Object.entries(bin).forEach(([k,h])=>{ byHash[h]=byHash[h]||k; });
    const br=o.branch||'main'; let hd=R.head, baseTree=R.treeSha, committing=null, done=0, nextAt=0;
    const pace=async()=>{ const now=Date.now(), t=Math.max(now,nextAt); nextAt=t+850; if(t>now) await wait(t-now); };
    const commitPart=async(part,msg)=>{const committed=await ghCommitFiles({...o,branch:br},{head:hd,treeSha:baseTree},part,msg);hd=committed.head;baseTree=committed.treeSha;};
    const flushPart=async()=>{ if(committing) return committing; if(!entries.length) return; const part=entries; entries=[]; committing=commitPart(part,`sync 그림 ${done}/${need.length}`).catch(e=>{ entries=part.concat(entries); throw e; }).finally(()=>{ committing=null; }); return committing; };
    await ghUploadPool(need,async h=>{const b=await idbGet(byHash[h]);if(!b)throw Error('올릴 자료 파일을 찾지 못했습니다');await pace();const r=await ghCreateBlob(o,b,`자료 ${done+1}/${need.length}`);entries.push({path:'sync/b/'+h,mode:'100644',type:'blob',sha:r.sha});done++;syBar(`자료 올리는 중 ${done}/${need.length}`);if(entries.length>=40)await flushPart();});if(committing)await committing;
    const withKeys=!!o.keys; let ls={}; syLsKeys(withKeys).forEach(k=>{ const v=syLsValue(k); if(v!=null) ls[k]=syStrip(k,v,withKeys); }); ls=lsHoldMerge(ls,R.state&&R.state.ls);
    const state={v:1,at:Date.now(),device:syDevice(),devId:devId(),build:APP_BUILD,ls,bin,types};
    syBar('게임 진행 저장하는 중…');
    const sb=await ghCreateBlob(o,new Blob([JSON.stringify(state)]),'진행 정보');
    entries.push({path:'sync/state.json',mode:'100644',type:'blob',sha:sb.sha});
    await commitPart(entries,`sync ${state.device} ${new Date(state.at).toISOString()}`); entries=[];
    const o2=SY(); o2.last=state.at; o2.lastDir='up'; o2.localAt=G.prog.savedAt||Date.now(); saveSY(o2);
    toast(`클라우드에 올렸어요${need.length?' · 새 파일 '+need.length+'개':''}`); return true;
  }catch(e){ toast('올리기 실패. '+syErr(e)+' 중간까지 올린 그림은 저장돼 있어서, 다시 누르면 이어서 올려요.'); }
  finally{ SYJOB=null; syBar(''); if(tab==='studio') render(); }
}
async function syPull(){
 const o=SY();if(!syReady()){openSync();return false;}if(SYJOB){toast('동기화 중이에요');return false;}
 SYJOB='pull';PULLERR='';PULLERR_QUOTA=false;const prefix='sync-gh-'+uid()+'::',source=G,project=PJ().active,previous=window.__NOFLUSH;let committed=false;
 try{syBar('클라우드 확인 중…');await flush();const R=await syRemote(o);if(!R.state)throw Error('클라우드에 아직 올린 데이터가 없어요');const S=R.state;
  const idx=await syncStageMedia(S,async(k,h)=>{const sha=R.paths['sync/b/'+h];if(!sha)throw Error('클라우드 자료가 빠져 있습니다: '+k);const r=await gh(o,'/git/blobs/'+sha,{binary:true});if(r.bytes)return r.bytes;if(r.text){const b=JSON.parse(r.text);if(b.content)return b64ToBytes(b.content.replace(/\s/g,''));}throw Error('자료 응답이 비어 있습니다: '+k);},prefix);
  if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 받기를 취소했습니다');await flush();window.__NOFLUSH=true;clearTimeout(flushT);
  const w=await lsApply(S.ls,prefix);committed=true;dirty.clear();saveSyIdx(idx);
  const o2=SY();o2.last=S.at;o2.lastDir='down';o2.localAt=w.at;saveSY(o2);toast('클라우드의 데이터를 받았어요. 다시 시작할게요');setTimeout(()=>reloadGame(),900);return true;
 }catch(e){PULLERR_QUOTA=e?.name==='QuotaExceededError';PULLERR='받기 실패. '+syErr(e);toast(PULLERR);if(committed){setTimeout(()=>reloadGame(),900);return true;}return false;}
 finally{if(!committed)window.__NOFLUSH=previous;await appStorage.discard(prefix).catch(()=>{});SYJOB=null;syBar('');}
}
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
// 앱을 내릴 때(화면이 숨겨질 때) 자동 올리기를 켰고 마지막 올린 뒤 바뀐 게 있으면 올려요(한 기기만 플레이 모드가 아닐 때)
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&!LKMODE()){ const o=SY(); if(syReady()&&o.autoUp&&!SYJOB&&(G.prog.savedAt||0)>(o.localAt||0)+5000) syPush(false); } });
