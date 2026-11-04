/* ===== 0360-sync — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0360-sync/020-pc-server.js에서 옮김 */
async function pcPush(silent,force){
  if(PCJOB||!PCS()) return; PCJOB=true; try{
    if(!silent) syBar('PC에 저장하는 중…'); await flush();
    const S0=await pcApi('/api/store/state',{ok404:true}), pc0=PCS(), other=!!(S0&&S0.at>(pc0.last||0)+1000&&(S0.devId?S0.devId!==devId():S0.device!==syDevice()));
    if(S0&&!force&&(other||freshGame())){
      if(silent){ if(!PCWARNED){ PCWARNED=true; toast(other?'PC에 다른 기기의 더 새 진행이 있어서 자동 저장을 멈췄어요. 설정 → PC 서버에서 받기를 눌러 주세요':'이 기기의 게임이 아직 시작 전이라 PC의 저장을 덮어쓰지 않았어요'); } return; }
      PCJOB=false; syBar('');
      openModal(pcConflictHTML(other,S0)); return; }
    const have=new Set(((await pcApi('/api/store/list'))||{}).blobs||[]), idx=syIdx(), keys=await idbKeys(), bin={}, types={};
    for(const k of keys){ const b=await idbGet(k); if(!b||!(b instanceof Blob)) continue; types[k]=b.type||''; const ent=idx[k]; let h;
      if(ent&&ent.size===b.size&&ent.hash) h=ent.hash; else { h=await shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; } bin[k]=h;
      if(!have.has(h)){ const ack=await pcApi('/api/store/blob/'+h,{method:'POST',body:{content:bytesToB64(new Uint8Array(await b.arrayBuffer()))}});if(ack?.ok!==true)throw Error('PC 자료 저장 완료를 확인하지 못했습니다');have.add(h); } }
    saveSyIdx(idx);
    let ls={}; syLsKeys(true).forEach(k=>{ const v=syLsValue(k); if(v!=null) ls[k]=v; }); ls=lsHoldMerge(ls,S0&&S0.ls);
    const state={v:1,at:Date.now(),baseAt:S0?.at||0,device:syDevice(),devId:devId(),build:APP_BUILD,ls,bin,types};
    const ack=await pcApi('/api/store/state',{method:'POST',body:state});if(ack?.ok!==true)throw Error('PC 진행 저장 완료를 확인하지 못했습니다');
    const o=PCS(); o.last=state.at; o.localAt=G.prog.savedAt||Date.now(); delete o.restored; setPCS(o); PCWARNED=false; if(!silent) toast('PC에 저장했어요'); return true;
  }catch(e){ if(!silent) toast('PC 저장 실패. '+syErr(e)); } finally{ PCJOB=false; syBar(''); }
}
async function pcPull(src){
 if(PCJOB||!PCS())return false;PCJOB=true;PULLERR='';PULLERR_QUOTA=false;
 const prefix='sync-pc-'+uid()+'::',source=G,project=PJ().active,previous=window.__NOFLUSH;let committed=false;
 try{syBar('PC에서 받는 중…');await flush();const S=src&&src.state||await pcApi('/api/store/state',{ok404:true});if(!S)throw Error('PC에 아직 저장된 게임이 없어요');
  const idx=await syncStageMedia(S,async(k,h)=>{let error;for(let t=0;t<3;t++){try{const r=await pcApi('/api/store/blob/'+h,{binary:true,timeout:60000});if(r?.bytes)return r.bytes;throw Error('빈 자료 응답');}catch(e){error=e;if(e?.code==='bad_key')throw e;if(t<2)await wait(1500*(t+1));}}throw error;},prefix);
  if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 받기를 취소했습니다');await flush();window.__NOFLUSH=true;clearTimeout(flushT);
  const w=await lsApply(S.ls,prefix);committed=true;dirty.clear();saveSyIdx(idx);
  const o=PCS();o.last=src&&src.restore?src.cur||Date.now():S.at;o.localAt=src&&src.restore?0:w.at;if(src&&src.restore)o.restored=1;setPCS(o);
  toast('PC의 게임을 받았어요. 다시 시작할게요');setTimeout(()=>reloadGame(),800);return true;
 }catch(e){PULLERR_QUOTA=e?.name==='QuotaExceededError';PULLERR='PC에서 받기 실패. '+syErr(e);toast(PULLERR);if(committed){setTimeout(()=>reloadGame(),800);return true;}return false;}
 finally{if(!committed)window.__NOFLUSH=previous;await appStorage.discard(prefix).catch(()=>{});PCJOB=false;syBar('');}
}
/* src/main/0360-sync/030-github.js에서 옮김 */
async function syPush(force){
  const o=SY(); if(!syReady()){ openSync(); return; } if(SYJOB){ toast('동기화 중이에요'); return; }
  SYJOB='push'; try{
    syBar('클라우드 확인 중…'); await flush();
    const R=await syRemote(o);
    if(!force&&R.state&&R.state.at>(o.last||0)&&R.state.device!==syDevice()){ syBar(''); SYJOB=null;
      openModal(syConflictHTML(R)); return; }
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
/* src/main/0360-sync/0400-publish-subscribe.js에서 옮김 */
async function pubUpload(notes,btn){ const P0=PUB(); if(!P0.token||!/^[\w.-]+\/[\w.-]+$/.test(String(P0.repo||'').trim())){ toast('토큰과 저장소(주인/이름)를 넣어 주세요'); return; } if(PUBJOB){ toast('이미 게시하는 중이에요'); return; }
  const o={token:P0.token,repo:P0.repo.trim(),branch:P0.branch||'main'}, M=pubMeta(), dir='games/'+M.slug, done=btn?busy(btn):()=>{}; PUBJOB=true;
  const st=m=>{ syBar(m); if(btn&&btn.isConnected) say(btn,m); };
  try{ st('저장소 확인 중…'); await flush();
    const ref=await ghEnsureBranch(o);
    let hd=ref.object.sha; const cm0=await gh(o,'/git/commits/'+hd), tree0=await gh(o,'/git/trees/'+cm0.tree.sha+'?recursive=1'), have=new Set((tree0.tree||[]).filter(x=>x.type==='blob').map(x=>x.path));
    const game=pubContent(), objs=imgObjsOf(game).filter(x=>x.img), imap={}, byHash={}, idx=syIdx(); let i=0;
    for(const x of objs){ i++; if(i%10===0) st(`그림 확인 ${i}/${objs.length}`); const b=await idbGetNS(x.id); if(!b){ x.img=null; continue; } const k=IMGNS+x.id, e=idx[k]; let h=e&&e.size===b.size&&e.hash; if(!h){ h=await shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; } imap[x.id]=h; byHash[h]=byHash[h]||b; x.img={idb:true}; }
    saveSyIdx(idx); game.images=imap;
    const need=Object.keys(byHash).filter(h=>!have.has(dir+'/b/'+h)), entries=[]; let done=0, nextAt=0, qi=0;
    const pace=async()=>{ const now=Date.now(), t=Math.max(now,nextAt); nextAt=t+850; if(t>now) await wait(t-now); };
    await ghUploadPool(need,async h=>{await pace();const r=await ghCreateBlob(o,byHash[h],`그림 ${done+1}/${need.length}`);entries.push({path:dir+'/b/'+h,mode:'100644',type:'blob',sha:r.sha});done++;st(`그림 올리는 중 ${done}/${need.length}`);});
    const ver=M.ver+1, man={app:'gacha-game-maker',kind:'pub',v:1,title:G.meta.title,sub:G.meta.sub||'',ver,at:Date.now(),build:APP_BUILD,notes:String(notes||'').slice(0,2000),images:Object.keys(imap).length,chapters:game.chapters.filter(ch=>ch.kind==='main').length,events:(game.events||[]).length,chars:(game.chars||[]).length};
    game.meta.pub={slug:M.slug,ver}; st('게임 올리는 중…');
    const gb=await ghCreateBlob(o,new Blob([JSON.stringify(game)]),'게임 정보');
    const mb=await ghCreateBlob(o,new Blob([JSON.stringify(man,null,1)]),'게시 정보');
    entries.push({path:dir+'/game.json',mode:'100644',type:'blob',sha:gb.sha},{path:dir+'/manifest.json',mode:'100644',type:'blob',sha:mb.sha});
    await ghCommitFiles(o,{head:hd,treeSha:cm0.tree.sha},entries,`${G.meta.title} v${ver}`);
    M.ver=ver; M.at=man.at; M.repo=o.repo; M.branch=o.branch; mark('meta');
    openModal(pubDoneHTML(ver,o,dir,need)); }
  catch(e){ toast('게시 실패. '+syErr(e)); }
  finally{ PUBJOB=null; syBar(''); done(); } }
async function subscribe(addr,rep){const base=subParse(addr);if(!base){toast('게임 구독 주소를 읽지 못했습니다');return;}
 const prefix='subscribe-'+uid()+'::',source=G,project=PJ().active,st=m=>{syBar(m);if(rep)rep(m);};
 try{st('게임 정보 받는 중…');const man=JSON.parse(await subGet(base,'manifest.json'));if(man?.kind!=='pub')throw Error('게임 구독 주소가 아닙니다');
  const dup=PJ().list.find(x=>x.sub===base);if(dup&&!(await appConfirm(`「${man.title}」은(는) 이미 구독 중이에요. 하나 더 추가할까요?`)))return;
  const game=JSON.parse(await subGet(base,'game.json'));if(!Array.isArray(game?.chars))throw Error('캐릭터 자료가 올바르지 않습니다');const id2='g'+uid(),ns=id2+'::';const imap=await subPullImages(base,game,ns,null,st,prefix);delete game.images;
  game.meta=game.meta||{};game.meta.subscr={base,ver:man.ver,title:man.title,at:Date.now(),imgs:imap,notes:man.notes||''};delete game.meta.pub;
  const pr=clone(DEFAULT_PROG);pr.live.on=Object.assign({},pr.live.on,{season:false,event:false,chapter:false,rerun:false,rotate:false,skin:false,talk:false});game.prog=pr;
  if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 구독 적용을 취소했습니다');await flush();const pj=PJ();pj.list.push({id:id2,title:man.title||'구독 게임',sub:base});pj.active=id2;
  await appStorage.commitImport(prefix,pjKey(id2),JSON.stringify(game),ns,{[PJKEY]:JSON.stringify(pj)});toast('구독 게임을 저장했어요. 다시 시작할게요');setTimeout(()=>reloadGame(),900);
 }catch(e){toast('구독 실패. '+(e.message||e));}
 finally{await appStorage.discard(prefix).catch(()=>{});syBar('');if(rep)rep.end();}
}
async function subApply(rep){const S=G.meta.subscr;if(!S)return;const prefix='sub-update-'+uid()+'::',source=G,project=PJ().active,st=m=>{syBar(m);if(rep)rep(m);};
 try{st('새 버전 받는 중…');const man=SUBCHK?.ver?SUBCHK:JSON.parse(await subGet(S.base,'manifest.json'));const game=JSON.parse(await subGet(S.base,'game.json'));if(!Array.isArray(game?.chars))throw Error('캐릭터 자료가 올바르지 않습니다');
  const imap=await subPullImages(S.base,game,IMGNS,S.imgs||{},st,prefix);delete game.images;if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 업데이트를 취소했습니다');await flush();
  game.prog=clone(source.prog);game.meta=game.meta||{};game.meta.subscr=Object.assign({},S,{ver:man.ver,at:Date.now(),imgs:imap,notes:man.notes||'',skip:0});delete game.meta.pub;
  const mine=RELS().filter(r=>!(game.rels||[]).some(x=>(x.a===r.a&&x.b===r.b)||(x.a===r.b&&x.b===r.a)));game.rels=[...(game.rels||[]),...clone(mine)];const next=fix(game),pj=PJ(),row=pj.list.find(x=>x.id===pj.active);if(row){row.title=next.meta.title||row.title;row.sub=S.base;}
  await appStorage.commitImport(prefix,LKEY,JSON.stringify(next),IMGNS,{[PJKEY]:JSON.stringify(pj)});
  const oldKeys=[...source.chars.map(c=>'c:'+c.id),...source.chapters.map(ch=>'ch:'+ch.id),...source.lib.map(l=>'l:'+l.id),...source.threads.map(x=>'t:'+x.id)];G=next;dirty.clear();clearTimeout(flushT);for(const id of Object.keys(imgCache)){try{URL.revokeObjectURL(imgCache[id]);}catch(e){}delete imgCache[id];}mark(...oldKeys);markAll();await flush();applyMeta();await loadIdbImages();closeModal();sendMail({from:next.meta.title||'만든 사람',title:`v${man.ver} 업데이트를 받았어요`,body:man.notes||'새 버전으로 바뀌었어요.',days:14});toast(`v${man.ver}(으)로 업데이트했어요`);render();checkTriggers&&checkTriggers();
 }catch(e){toast('업데이트 실패. '+(e.message||e)+' 다시 시도해 주세요');}
 finally{await appStorage.discard(prefix).catch(()=>{});syBar('');if(rep)rep.end();}
}
/* src/main/0360-sync/050-single-device.js에서 옮김 */
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
async function lkNewer(){const m=LKMODE();
 if(m==='pc'){const pc=PCS(),S=await pcApi('/api/store/state',{ok404:true});return !!(S&&S.at>(pc.last||0)&&(S.devId?S.devId!==devId():S.device!==syDevice()));}
 if(m==='gh'){const o=SY(),R=await syRemote(o),S=R.state;return !!(S&&S.at>(o.last||0)&&(S.devId?S.devId!==devId():S.device!==syDevice()));}return false;
}
async function lkPullIfNewer(){try{if(!(await lkNewer()))return false;toast('다른 기기에서 하던 게임을 받아 올게요');const ok=LKMODE()==='pc'?await pcPull():await syPull();if(!ok)throw Error(PULLERR||'최신 진행을 받지 못했습니다');return true;}catch(e){const failure=Error(e.message||'최신 진행을 확인하지 못했습니다');failure.code='pull_failed';throw failure;}}
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
/* src/main/0360-sync/060-storage-and-sharing.js에서 옮김 */
async function handleStorageAndSharingAction(a,t,id,p,e){
  switch(a){
case 'syopen': openSync(); break;
case 'sylink': openUrl(t.dataset.url); break;
case 'sypush': closeModal(); syPush(false); break;
case 'sypushf': closeModal(); syPush(true); break;
case 'sypull': { const o=SY(); if(o.last&&(G.prog.savedAt||0)>(o.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 올리지 않은 진행이 있어요. 받으면 이 기기의 진행은 덮어써져요. 받을까요?'))) break; closeModal(); syPull(); break; }
case 'sysave': { const repo=$('#sy_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/+$/,''), token=$('#sy_tok').value.trim();
      if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token){ toast('저장소(아이디/이름)와 토큰을 넣어 주세요'); break; }
      const o=Object.assign(SY(),{repo,token,device:$('#sy_dev').value.trim()||syDevice(),auto:$('#sy_auto').checked,autoUp:$('#sy_up').checked,keys:$('#sy_keys').checked,lock:$('#sy_lock').checked}); saveSY(o);
      const done=busy(t,'확인 중…');
      try{ const info=await gh(o,''); if(!info.private){ toast('이 저장소는 공개예요. 비공개(Private)로 바꾼 뒤 다시 저장해 주세요'); o.token=''; saveSY(o); done(); break; }
        if(info.permissions&&info.permissions.push===false){ toast('이 토큰은 저장소에 쓸 권한이 없어요 (Contents: Read and write)'); done(); break; }
        const R=await syRemote(o); closeModal(); render(); if(LKMODE()==='gh') setTimeout(()=>{ lkOp('claim').then(()=>{ LK.claimed=true; lkLoop(); }).catch(()=>{}); },500);
        openSyLinked(R.state&&R.state.device!==o.device?R.state:null);
      }catch(err){ toast('연결 실패. '+syErr(err)); done(); } break; }
case 'bkgo': { const o={share:t.dataset.share==='1',img:t.dataset.img==='1',audio:t.dataset.aud==='1',gate:t.dataset.gate!=='0',dest:$('#bk_dest').value,voice:$('#bk_voice')?$('#bk_voice').checked:false}; closeModal(); exportGo(o); break; }
case 'pickgame': { if($('#pk_last')&&$('#pk_last').checked) try{ appStorage.setItem('ggm-start','last'); }catch(e){} try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(id===pj.active){ showStart(); break; } await switchProject(id); break; }
case 'saveretry': try{ await flush(); if(!appStorage.failed) storageWarningClear(); }catch(err){ quietErr(err,'0510-actions/060-storage-and-sharing.js:19'); } break;
case 'pcopen': openPcSet(); break;
case 'syoff': { if(!(await appConfirm('PC·폰 연동을 해제할까요?\n이 기기의 게임은 그대로 남고, GitHub 저장소의 데이터도 지워지지 않아요. 이 기기에 저장된 토큰만 지워요.'))) break; try{ if(LKMODE()==='gh'&&LK.claimed) await lkSave(true), await lkOp('free'); }catch(e){ quietErr(e,'0510-actions/060-storage-and-sharing.js:21'); } clearInterval(LK.t); LK.claimed=false; lkUnlock(); try{ appStorage.removeItem(SYKEY); }catch(e){} closeModal(); render(); toast('연동을 해제했어요'); break; }
case 'pcsave': { if($('#pc_pxoff')){ try{ appStorage.setItem('ggm-proxy-off',$('#pc_pxoff').checked?'1':'0'); }catch(e){} } const o=parsePcLink($('#pc_link').value); if(!o){ toast('주소에 ?pc=키가 들어 있어야 해요'); break; } o.auto=$('#pc_auto').checked; o.lock=$('#pc_lock').checked; const done=busy(t);
      try{ const r=await http(o.base+'/api/hello',{headers:{'X-GGM-Key':o.key},timeout:15000}); const j=JSON.parse(r.text||'{}'); if(!j.app) throw 0; if(!j.auth){ toast('키가 맞지 않아요. QR 주소를 다시 붙여 넣어 주세요'); done(); break; }
        const old=PCS(); setPCS(Object.assign({},old&&old.key===o.key?old:{},o)); closeModal(); render(); toast(`PC 서버(${j.host||'PC'})에 연결했어요`); window.__PC_NEW=1; pcStart(); if(LKMODE()==='pc') setTimeout(lkActivate,1500); }
      catch(err){ toast('PC 서버에 연결하지 못했어요. PC에서 서버 창이 켜져 있는지 확인해 주세요'); done(); } break; }
case 'pcoff': { if(!(await appConfirm('PC 서버 연결을 해제할까요?\n이 기기의 게임은 그대로 남고, PC에 저장된 데이터도 지워지지 않아요.'))) break; try{ if(LKMODE()==='pc'&&LK.claimed) await lkSave(true), await lkOp('free'); }catch(e){ quietErr(e,'0510-actions/060-storage-and-sharing.js:26'); } clearInterval(LK.t); LK.claimed=false; lkUnlock(); setPCS(null); closeModal(); render(); toast('PC 서버 연결을 해제했어요'); break; }
case 'pcpush': closeModal(); pcPush(false); break;
case 'pcpushf': closeModal(); pcPush(false,true); break;
case 'pcpullgo': closeModal(); pcPull(); break;
case 'pchist': openPcHist(); break;
case 'pchistgo': { if(!(await appConfirm('이 백업으로 되돌릴까요?\n이 기기의 게임이 그 시점으로 바뀌고, PC에도 다시 저장돼요. (지금 PC에 있는 저장도 백업 목록에 남아요)'))) break; const done=busy(t);
    try{ const h=await pcApi('/api/store/history/'+encodeURIComponent(id)), cur=await pcApi('/api/store/state',{ok404:true}); if(!h||!h.ls) throw {message:'백업을 읽지 못했어요'}; closeModal(); await pcPull({state:h,restore:true,cur:cur&&cur.at}); }catch(e){ toast('백업을 받지 못했어요. '+syErr(e)); done(); } break; }
case 'pcpull': { const pc=PCS(); if(pc&&pc.last&&(G.prog.savedAt||0)>(pc.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 PC에 저장하지 않은 진행이 있어요. 받으면 덮어써져요. 받을까요?'))) break; closeModal(); pcPull(); break; }
case 'resetth': delete p.inbox[t.dataset.th]; mark('prog'); checkTriggers(); toast('조건을 만족하면 다시 도착해요'); break;
case 'importfile': $('#bkfile').click(); break;
case 'pj-open': openProjects(); break;
case 'pjswitch': await switchProject(id); break;
case 'pjdel': { if(!(await appConfirm('이 게임을 삭제할까요? 되돌릴 수 없어요.'))) break; const pj=PJ(); if(id===pj.active){toast('현재 플레이 중인 게임은 삭제할 수 없어요');break;} await flush();await appStorage.assertCurrent(PJKEY);pj.list=pj.list.filter(x=>x.id!==id); appStorage.setItem(PJKEY,JSON.stringify(pj)); appStorage.removeItem(pjKey(id));await appStorage.drain(); openProjects(); break; }
case 'pjblank': { await flush(); const id2='g'+uid(), d=defaults(); d.meta.title=G.meta.title+' (사본)'; appStorage.setItem(pjKey(id2),JSON.stringify(d)); const pj=PJ(); pj.list.push({id:id2,title:d.meta.title}); pj.active=id2; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; }
case 'pubopen': openPub(); break;
case 'pubgo': { const P0=PUB(); P0.repo=$('#pb_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''); P0.branch=$('#pb_branch').value.trim()||'main'; P0.token=$('#pb_tok').value.trim(); savePUB(P0); await pubUpload($('#pb_notes').value.trim(),t); break; }
case 'pubcopy': case 'pubcopy2': { const v=t.dataset.v||($('#pub_addr')&&$('#pub_addr').value)||''; try{ await navigator.clipboard.writeText(v); toast('주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
case 'subadd': openSubAdd(); break;
case 'subgo': await subscribe($('#sb_addr').value,uiProg(t)); break;
case 'subcheck': await subCheck(true); break;
case 'subapply': await subApply(uiProg(t)); break;
case 'subskip': { if(G.meta.subscr){ G.meta.subscr.skip=+t.dataset.v||0; mark('meta'); } closeModal(); toast('설정 → 게임 → 업데이트 확인에서 언제든 받을 수 있어요'); break; }
case 'subcopy': { const b=G.meta.subscr&&G.meta.subscr.base, m=b&&b.match(/raw\.githubusercontent\.com\/([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)\/$/), v=m?subAddr(m[1],m[2],m[3]):b; try{ await navigator.clipboard.writeText(v); toast('구독 주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
case 'subleave': { if(!(await appConfirm('구독을 끊을까요? 지금 게임은 그대로 남고, 앞으로 업데이트를 받지 않아요. 이 게임을 내 게임처럼 직접 고치고 만들 수 있어요.'))) break; delete G.meta.subscr; mark('meta'); const pj=PJ(), row=pj.list.find(x=>x.id===pj.active); if(row){ delete row.sub; appStorage.setItem(PJKEY,JSON.stringify(pj)); } render(); toast('구독을 끊었어요'); break; }
case 'pjreroll': { const g=id===PJ().active?G:(()=>{ try{ return JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){ return null; } })(); if(!g){ toast('게임을 읽지 못했어요'); break; }
      const title=(g.meta&&g.meta.title)||'게임', d=rerollDraft(g,title);
      d.mode='detail'; d.reuse={pj:id,title}; try{ if(typeof SW!=='undefined'&&SW&&$('#sw_card,.setup')){ swRead(); swSave(); } }catch(e){} appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,title+' 리롤');
      toast(`「${title}」의 캐릭터·NPC·배경 그림을 이름이 같은 인물에 그대로 써요. 세계관·인물 설정을 고친 뒤 만들기를 누르세요`); break; }
case 'pjdraftx': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } openDraftExport((g.meta.title||'게임')+' 초안',d,null); break; }
case 'backup': openBackup(); break;
case 'importbk': try{const g=JSON.parse($('#bk_in').value);if(!g||!Array.isArray(g.chars))throw 0;replaceAll(g);closeModal();toast('데이터를 가져왔어요');}catch(err){toast('올바른 백업 데이터가 아니에요');} break;
  }
}
