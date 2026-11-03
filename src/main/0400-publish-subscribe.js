/* ===== 게임 게시·구독 (구독형 업데이트) =====
   만든 사람: 내 GitHub 공개 저장소에 게임(콘텐츠 + 그림)을 올려요. 그림은 내용 해시로 저장해서 바뀐 것만 다시 올라가요.
   받는 사람: 주소로 구독하면 새 게임으로 추가되고, 켤 때 새 버전을 확인해 콘텐츠만 바꿔요(진행·보유·재화는 그대로). */
const PUBKEY='ggm-pub';
function PUB(){ try{ return JSON.parse(appStorage.getItem(PUBKEY))||{}; }catch(e){ return {}; } }
function savePUB(o){ try{ appStorage.setItem(PUBKEY,JSON.stringify(o)); }catch(e){} }
function pubMeta(){ G.meta.pub=G.meta.pub&&typeof G.meta.pub==='object'?G.meta.pub:{}; const m=G.meta.pub; if(!m.slug) m.slug=(String(G.meta.sub||G.meta.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'game')+'-'+uid().slice(0,6); m.ver=+m.ver||0; return m; }
function subBase(repo,branch,dir){ return `https://raw.githubusercontent.com/${repo}/${branch||'main'}/${dir}/`; }
function subAddr(repo,branch,dir){ return `GGMSUB:${repo}/${branch||'main'}/${dir}`; }
// 주소 읽기: GGMSUB:주인/저장소/브랜치/폴더, raw.githubusercontent.com/…/manifest.json, github.com/주인/저장소/tree/브랜치/폴더
function subParse(s){ s=String(s||'').trim().replace(/\s+/g,''); let m;
  if((m=s.match(/GGMSUB:([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)\/?$/))) return subBase(m[1],m[2],m[3]);
  if((m=s.match(/^https?:\/\/raw\.githubusercontent\.com\/([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)(?:\/manifest\.json)?\/?$/))) return subBase(m[1],m[2],m[3]);
  if((m=s.match(/^https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/tree\/([\w.-]+)\/(.+?)\/?$/))) return subBase(m[1],m[2],m[3]);
  return null; }
async function subGet(base,path,binary){ const r=await http(base+path+(binary?'':'?t='+Date.now()),{binary:!!binary,timeout:120000}); if(r.status>=400) throw Object.assign(new Error(r.status===404?'게임을 찾지 못했어요. 주소와 저장소가 공개인지 확인해 주세요':'받기 실패 ('+r.status+')'),{status:r.status}); return binary?r.bytes:r.text; }
// 게시할 콘텐츠: 공유 팩과 같은 기준(진행·키·음성·소리 파일 없음). 픽업·이벤트는 메인 진행에 맞춰 열려요
function pubContent(){ const game=JSON.parse(JSON.stringify(G)); delete game.prog; delete game.rels; (game.chars||[]).forEach(c=>{ delete c.voiceId; delete c.voiceName; }); (game.lib||[]).forEach(l=>{ if(l.audio) l.audio=null; });
  game.rels=JSON.parse(JSON.stringify(RELS()));
  const S=game.chapters.filter(ch=>ch.kind==='main').reduce((n,ch)=>n+ch.stages.length,0), spread=arr=>arr.forEach((x,k)=>{ x.gate=Math.min(S,x.gate>0?x.gate:Math.max(1,Math.round((k+1)*S/(arr.length+1)))); });
  spread(game.events||[]); spread((game.banners||[]).filter(b=>b.id!=='std'&&!b.eventId)); game.meta.gated=S>0;
  (game.banners||[]).forEach(b=>{ delete b.until; if(b.id!=='std'){ b.active=true; delete b.newAt; } }); (game.events||[]).forEach(e=>{ delete e.until; e.active=true; });
  if(!String(game.meta.artTags||'').trim()){ try{ const c=naiCfg(), b=c.styles.find(x=>x.id===c.styleId)||c.styles[0]; if(b&&String(b.tags||'').trim()){ game.meta.artTags=b.tags; game.meta.artNeg=b.neg||''; } }catch(e){} }
  delete game.meta.subscr; if(game.meta.pub) game.meta.pub={slug:game.meta.pub.slug,ver:game.meta.pub.ver};
  return game; }
let PUBJOB=null;
async function pubUpload(notes,btn){ const P0=PUB(); if(!P0.token||!/^[\w.-]+\/[\w.-]+$/.test(String(P0.repo||'').trim())){ toast('토큰과 저장소(주인/이름)를 넣어 주세요'); return; } if(PUBJOB){ toast('이미 게시하는 중이에요'); return; }
  const o={token:P0.token,repo:P0.repo.trim(),branch:P0.branch||'main'}, M=pubMeta(), dir='games/'+M.slug, lbl=btn&&btn.textContent; PUBJOB=true; if(btn) btn.disabled=true;
  const st=m=>{ syBar(m); if(btn&&btn.isConnected) btn.textContent=m; };
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
    openModal(`${head('게시했어요',`<span class="muted">「${esc(G.meta.title)}」 v${ver}</span>`)}
      <p style="margin:0 0 6px">이 주소를 받은 사람은 설정 → 게임 → 🔗 게임 구독에 넣으면 이 게임을 받고, 다음 게시부터 자동으로 업데이트를 받아요.</p>
      <textarea class="in" id="pub_addr" readonly style="min-height:56px">${esc(subAddr(o.repo,o.branch,dir))}</textarea>
      <p class="muted" style="font-size:.78rem;margin:4px 0 0">새 그림 ${need.length}장을 올렸어요. GitHub가 파일을 퍼뜨리는 데 몇 분 걸릴 수 있어요. 저장소는 꼭 공개(Public)로 두세요.</p>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="pubcopy">주소 복사</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
  catch(e){ toast('게시 실패. '+syErr(e)); }
  finally{ PUBJOB=null; syBar(''); if(btn&&btn.isConnected){ btn.disabled=false; if(lbl) btn.textContent=lbl; } } }
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
// 그림 받기: 내용 해시가 같은 그림은 다시 받지 않아요
async function subPullImages(base,game,ns,had,st,prefix){
 const imap=game.images||{},objs=imgObjsOf(game);let n=0,lastHash=null,lastBytes=null;const tot=objs.filter(x=>imap[x.id]).length;
 for(const x of objs){const h=imap[x.id];if(!h){x.img=null;continue;}n++;if(had?.[x.id]===h&&await idbGet(ns+x.id)){x.img={idb:true};continue;}
  st&&st(`그림 받는 중 ${n}/${tot}`);const bytes=lastHash===h?lastBytes:await subGet(base,'b/'+h,true);if(!bytes?.length)throw Error('그림 자료가 비어 있습니다: '+x.id);lastHash=h;lastBytes=bytes;
  const blob=new Blob([bytes],{type:bytes[0]===0x89?'image/png':bytes[0]===0xFF?'image/jpeg':'image/webp'});
  if(prefix)await appStorage.stage(prefix+x.id,{key:x.id,blob});else await idbPut(ns+x.id,blob);x.img={idb:true};
 }return imap;
}
async function subscribe(addr,btn){const base=subParse(addr);if(!base){toast('게임 구독 주소를 읽지 못했습니다');return;}
 const prefix='subscribe-'+uid()+'::',source=G,project=PJ().active,lbl=btn?.textContent,st=m=>{syBar(m);if(btn?.isConnected)btn.textContent=m;};if(btn)btn.disabled=true;
 try{st('게임 정보 받는 중…');const man=JSON.parse(await subGet(base,'manifest.json'));if(man?.kind!=='pub')throw Error('게임 구독 주소가 아닙니다');
  const dup=PJ().list.find(x=>x.sub===base);if(dup&&!(await appConfirm(`「${man.title}」은(는) 이미 구독 중이에요. 하나 더 추가할까요?`)))return;
  const game=JSON.parse(await subGet(base,'game.json'));if(!Array.isArray(game?.chars))throw Error('캐릭터 자료가 올바르지 않습니다');const id2='g'+uid(),ns=id2+'::';const imap=await subPullImages(base,game,ns,null,st,prefix);delete game.images;
  game.meta=game.meta||{};game.meta.subscr={base,ver:man.ver,title:man.title,at:Date.now(),imgs:imap,notes:man.notes||''};delete game.meta.pub;
  const pr=clone(DEFAULT_PROG);pr.live.on=Object.assign({},pr.live.on,{season:false,event:false,chapter:false,rerun:false,rotate:false,skin:false,talk:false});game.prog=pr;
  if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 구독 적용을 취소했습니다');await flush();const pj=PJ();pj.list.push({id:id2,title:man.title||'구독 게임',sub:base});pj.active=id2;
  await appStorage.commitImport(prefix,pjKey(id2),JSON.stringify(game),ns,{[PJKEY]:JSON.stringify(pj)});toast('구독 게임을 저장했어요. 다시 시작할게요');setTimeout(()=>reloadGame(),900);
 }catch(e){toast('구독 실패. '+(e.message||e));}
 finally{await appStorage.discard(prefix).catch(()=>{});syBar('');if(btn?.isConnected){btn.disabled=false;btn.textContent=lbl;}}
}
let SUBCHK=null;
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
async function subApply(btn){const S=G.meta.subscr;if(!S)return;const prefix='sub-update-'+uid()+'::',source=G,project=PJ().active,lbl=btn?.textContent,st=m=>{syBar(m);if(btn?.isConnected)btn.textContent=m;};if(btn)btn.disabled=true;
 try{st('새 버전 받는 중…');const man=SUBCHK?.ver?SUBCHK:JSON.parse(await subGet(S.base,'manifest.json'));const game=JSON.parse(await subGet(S.base,'game.json'));if(!Array.isArray(game?.chars))throw Error('캐릭터 자료가 올바르지 않습니다');
  const imap=await subPullImages(S.base,game,IMGNS,S.imgs||{},st,prefix);delete game.images;if(G!==source||PJ().active!==project)throw Error('작업 중 게임이 바뀌어 업데이트를 취소했습니다');await flush();
  game.prog=clone(source.prog);game.meta=game.meta||{};game.meta.subscr=Object.assign({},S,{ver:man.ver,at:Date.now(),imgs:imap,notes:man.notes||'',skip:0});delete game.meta.pub;
  const mine=RELS().filter(r=>!(game.rels||[]).some(x=>(x.a===r.a&&x.b===r.b)||(x.a===r.b&&x.b===r.a)));game.rels=[...(game.rels||[]),...clone(mine)];const next=fix(game),pj=PJ(),row=pj.list.find(x=>x.id===pj.active);if(row){row.title=next.meta.title||row.title;row.sub=S.base;}
  await appStorage.commitImport(prefix,LKEY,JSON.stringify(next),IMGNS,{[PJKEY]:JSON.stringify(pj)});
  const oldKeys=[...source.chars.map(c=>'c:'+c.id),...source.chapters.map(ch=>'ch:'+ch.id),...source.lib.map(l=>'l:'+l.id),...source.threads.map(x=>'t:'+x.id)];G=next;dirty.clear();clearTimeout(flushT);for(const id of Object.keys(imgCache)){try{URL.revokeObjectURL(imgCache[id]);}catch(e){}delete imgCache[id];}mark(...oldKeys);markAll();await flush();applyMeta();await loadIdbImages();closeModal();sendMail({from:next.meta.title||'만든 사람',title:`v${man.ver} 업데이트를 받았어요`,body:man.notes||'새 버전으로 바뀌었어요.',days:14});toast(`v${man.ver}(으)로 업데이트했어요`);render();checkTriggers&&checkTriggers();
 }catch(e){toast('업데이트 실패. '+(e.message||e)+' 다시 시도해 주세요');}
 finally{await appStorage.discard(prefix).catch(()=>{});syBar('');if(btn?.isConnected){btn.disabled=false;btn.textContent=lbl;}}
}
