/* ===== 0360-sync — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0360-sync/010-common.js에서 옮김 */
function SY(){ try{ return JSON.parse(appStorage.getItem(SYKEY))||{}; }catch(e){ return {}; } }
function saveSY(o){ appStorage.setItem(SYKEY,JSON.stringify(o)); }
function syIdx(){ try{ return JSON.parse(appStorage.getItem(SYIDX))||{}; }catch(e){ return {}; } }
function saveSyIdx(o){ try{ appStorage.setItem(SYIDX,JSON.stringify(o)); }catch(e){} }
function bytesToB64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
async function shaHex(buf){ if(!(window.crypto&&crypto.subtle)) return sha256js(new Uint8Array(buf)); const h=await crypto.subtle.digest('SHA-256',buf); return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
// http 주소(같은 와이파이의 PC 서버 등)에서는 브라우저가 crypto.subtle을 막아요 → 직접 계산
function sha256js(m){ const K=[],H=[]; let n=2; const fr=x=>(x-Math.floor(x))*4294967296|0; for(let c=0;c<64;n++){ let p=1; for(let d=2;d*d<=n;d++) if(n%d===0){ p=0; break; } if(p){ if(c<8) H[c]=fr(Math.pow(n,1/2)); K[c++]=fr(Math.pow(n,1/3)); } }
  const l=m.length, nb=((l+9+63)>>6)<<6, b=new Uint8Array(nb); b.set(m); b[l]=0x80; const dv=new DataView(b.buffer); dv.setUint32(nb-8,Math.floor(l/536870912)); dv.setUint32(nb-4,(l<<3)>>>0);
  const w=new Int32Array(64), r=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<nb;o+=64){ for(let i=0;i<16;i++) w[i]=dv.getInt32(o+i*4); for(let i=16;i<64;i++){ const a=w[i-15], c=w[i-2]; w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(c,17)^r(c,19)^(c>>>10)))|0; }
    let [A,B2,C,D,E,F,G2,Hh]=H; for(let i=0;i<64;i++){ const t1=(Hh+(r(E,6)^r(E,11)^r(E,25))+((E&F)^(~E&G2))+K[i]+w[i])|0, t2=((r(A,2)^r(A,13)^r(A,22))+((A&B2)^(A&C)^(B2&C)))|0; Hh=G2; G2=F; F=E; E=(D+t1)|0; D=C; C=B2; B2=A; A=(t1+t2)|0; }
    [A,B2,C,D,E,F,G2,Hh].forEach((v,i)=>{ H[i]=(H[i]+v)|0; }); }
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join(''); }
// 게임 목록(starfall-projects)은 한 번도 저장 안 됐을 수 있어요(샘플 게임만 쓴 기기). 받는 쪽은 목록이 꼭 있어야 해서 기본 목록을 채워 보내요
function syLsValue(k){ const v=appStorage.getItem(k); return v==null&&k===PJKEY?JSON.stringify(PJ()):v; }
function syLsKeys(withKeys){ const pj=PJ(), sec=Object.entries(STORE_POLICY.secret).filter(([,f])=>withKeys||f).map(([k])=>k); return [PJKEY,...pj.list.map(x=>pjKey(x.id)),...STORE_POLICY.sync,...sec]; }
function syStrip(k,v,withKeys){ const f=STORE_POLICY.secret[k]; if(withKeys||v==null||!f) return v; try{ const o=JSON.parse(v); f.forEach(x=>{ delete o[x]; }); return JSON.stringify(o); }catch(e){} return v; }
/* 받을 때: 빠진 비밀(GitHub로 받은 설정)과 이 기기 값(keep)은 이 기기 것을 지켜요 */
function syMerge(k,v){ if(v==null) return v; const f=[...(STORE_POLICY.secret[k]||[]),...(STORE_POLICY.keep[k]||[])]; if(!f.length) return v; try{ const cur=JSON.parse(appStorage.getItem(k)||'{}'), o=JSON.parse(v); f.forEach(x=>{ if((!o[x]||(STORE_POLICY.keep[k]||[]).includes(x))&&cur[x]) o[x]=cur[x]; }); return JSON.stringify(o); }catch(e){} return v; }
function syErr(e){let message=e?.status===404?'저장소·브랜치를 찾지 못했습니다. 이름과 토큰 권한을 확인해 주세요.':e?.status===401||e?.status===403?'토큰 또는 저장소 쓰기 권한을 확인해 주세요.':AIERR[e?.code]||e?.message||'다시 시도해 주세요';if(e?.status)message=`HTTP ${e.status} · `+message;if(e?.endpoint)message+=' · 단계: '+e.endpoint;if(e?.details)message+=' · '+e.details;return ghSafeMessage(message).slice(0,1000);}
/* src/main/0360-sync/020-pc-server.js에서 옮김 */
async function pcApi(path,opt){ const pc=PCS(); if(!pc) throw {code:'network',message:'PC 서버가 연결돼 있지 않아요'}; opt=opt||{};
  const r=await http(pc.base+path,{method:opt.method||'GET',headers:Object.assign({'X-GGM-Key':pc.key},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body,binary:!!opt.binary,timeout:opt.timeout||120000});
  if(r.status===404&&opt.ok404) return null; if(r.status===401) throw {code:'bad_key',message:'PC 서버 키가 맞지 않아요. QR을 다시 찍어 주세요'}; if(r.status>=400) throw errOf(r);
  if(opt.binary) return r; try{return r.text?JSON.parse(r.text):{};}catch(e){throw Error('PC 서버 응답을 읽지 못했습니다');} }
/* src/main/0360-sync/030-github.js에서 옮김 */
function syReady(){ const o=SY(); return !!(o.repo&&o.token); }
async function syRemote(o){ // -> {head,tree,paths,state}
  const ref=await ghEnsureBranch(o);
  const head=ref.object.sha, commit=await gh(o,'/git/commits/'+head), tree=await gh(o,'/git/trees/'+commit.tree.sha+'?recursive=1');
  const paths={}; (tree.tree||[]).forEach(x=>{ if(x.type==='blob') paths[x.path]=x.sha; });
  let state=null; if(paths['sync/state.json']){ const r=await gh(o,'/git/blobs/'+paths['sync/state.json'],{binary:true}); try{ let j=JSON.parse(r.bytes?new TextDecoder().decode(r.bytes):(r.text||'')); if(j&&j.encoding==='base64'&&j.content) j=JSON.parse(new TextDecoder().decode(b64ToBytes(j.content.replace(/\s/g,'')))); state=j; }catch(e){throw Error('GitHub의 기존 진행 정보를 해석하지 못했습니다. 덮어쓰지 않고 중단합니다.');} }
  return {head,treeSha:commit.tree.sha,paths,state};
}
/* src/main/0360-sync/0335-github-api.js에서 옮김 */
function ghH(o,extra){ return Object.assign({Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+String(o.token||'').trim()},extra||{}); }
async function gh(o,path,opt){ opt=opt||{}; const tries=opt.tries||0; let r; try{ r=await http('https://api.github.com/repos/'+o.repo.trim()+path,{method:opt.method||'GET',headers:ghH(o,Object.assign(opt.body?{'Content-Type':'application/json'}:{},opt.binary?{Accept:'application/vnd.github.raw+json'}:{})),body:opt.body,binary:!!opt.binary,timeout:opt.timeout||120000}); }catch(e){ if(tries<4){ await wait(2000*Math.pow(2,tries)); return gh(o,path,Object.assign({},opt,{tries:tries+1})); } throw e; }
  if(r.status>=500&&r.status<600&&tries<4){ await wait(2000*Math.pow(2,tries)); return gh(o,path,Object.assign({},opt,{tries:tries+1})); }
  if(r.status===403||r.status===429){ const t=r.text||''; if(/secondary rate|abuse|rate limit/i.test(t)&&!opt.retried){ await wait(61000); return gh(o,path,Object.assign({},opt,{retried:true})); } }
  if(r.status>=400&&!opt.okStatus?.includes(r.status)) throw ghRequestError(r,path,opt.method||'GET');
  if(opt.binary) return r; try{return r.text?JSON.parse(r.text):{};}catch(e){throw Error('PC 서버 응답을 읽지 못했습니다');} }
function ghSafeMessage(value){let text=String(value||'');for(const token of [SY().token,PUB().token])if(typeof token==='string'&&token.length>=8)text=text.split(token).join('[토큰 숨김]');return text.replace(/(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]+/g,'[토큰 숨김]').replace(/Bearer\s+[^\s,;]+/gi,'Bearer [숨김]');}
function ghRequestError(response,path,method){const error=Object.assign(errOf(response),{status:response.status,endpoint:method+' '+String(path).split('?')[0]});try{const data=JSON.parse(response.text||'{}');error.details=(Array.isArray(data.errors)?data.errors:[]).map(x=>typeof x==='string'?x:[x.resource,x.field,x.code,x.message].filter(Boolean).join(' / ')).join('; ').slice(0,500);}catch(_){}return error;}
function ghSHA(value,label){if(typeof value!=='string'||!/^[a-f0-9]{40}$/i.test(value))throw Error(label+' 응답의 커밋·파일 번호가 올바르지 않습니다');return value;}
function ghRefPath(o){return '/git/ref/heads/'+encodeURIComponent(String(o.branch||'main').trim());}
async function ghEnsureBranch(o){
 const path=ghRefPath(o);let ref=await gh(o,path,{okStatus:[404,409]});if(ref?.object?.sha){ghSHA(ref.object.sha,'브랜치');return ref;}
 const repo=await gh(o,''),defaultBranch=repo.default_branch||'main';let initial=await gh(o,ghRefPath({branch:defaultBranch}),{okStatus:[404,409]});
 if(!initial?.object?.sha){
  // Only initialize an empty repository. Never overwrite an existing README to repair a missing branch.
  try{await gh(o,'/contents/README.md',{method:'PUT',body:{message:'Initialize Maker data repository',content:bytesToB64(new TextEncoder().encode('# 가챠 게임 메이커 자료 저장소\n'))}});}catch(e){if(e.status!==409&&e.status!==422)throw e;initial=await gh(o,ghRefPath({branch:defaultBranch}),{okStatus:[404,409]});if(!initial?.object?.sha)throw e;}
  initial=await gh(o,ghRefPath({branch:defaultBranch}));
 }
 ghSHA(initial?.object?.sha,'기본 브랜치');if(String(o.branch||'main').trim()===defaultBranch)return initial;
 try{ref=await gh(o,'/git/refs',{method:'POST',body:{ref:'refs/heads/'+String(o.branch||'main').trim(),sha:initial.object.sha}});}catch(e){if(e.status!==409&&e.status!==422)throw e;ref=await gh(o,path,{okStatus:[404,409]});if(!ref?.object?.sha)throw e;}
 ghSHA(ref?.object?.sha,'새 브랜치');return ref;
}
async function ghCommitFiles(o,base,entries,message){
 let head=ghSHA(base.head,'이전 커밋'),treeSHA=ghSHA(base.treeSha,'이전 파일 목록');
 for(let attempt=0;attempt<5;attempt++){
  const tree=await gh(o,'/git/trees',{method:'POST',body:{base_tree:treeSHA,tree:entries}});ghSHA(tree?.sha,'파일 목록');
  const commit=await gh(o,'/git/commits',{method:'POST',body:{message,tree:tree.sha,parents:[head]}});ghSHA(commit?.sha,'새 커밋');
  try{
   const result=await gh(o,'/git/refs/heads/'+encodeURIComponent(String(o.branch||'main').trim()),{method:'PATCH',body:{sha:commit.sha,force:false}});
   if(result?.object?.sha!==commit.sha){const verified=await gh(o,ghRefPath(o));if(verified?.object?.sha!==commit.sha)throw Error('GitHub의 브랜치 반영을 확인하지 못했습니다. 성공으로 처리하지 않습니다.');}
   return {head:commit.sha,treeSha:tree.sha};
  }catch(e){
   if((e.status!==409&&e.status!==422)||attempt===4)throw e;
   const latest=await gh(o,ghRefPath(o));const next=ghSHA(latest?.object?.sha,'최신 브랜치');if(next===commit.sha)return {head:commit.sha,treeSha:tree.sha};
   if(next===head||!(e.status===409||/fast.?forward|conflict|reference update failed/i.test(e.message||'')))throw e;
   head=next;const current=await gh(o,'/git/commits/'+head);treeSHA=ghSHA(current?.tree?.sha,'최신 파일 목록');await wait(400+attempt*600);
  }
 }
 throw Error('GitHub 반영에 실패했습니다. 잠시 후 다시 시도해 주세요.');
}
async function ghCreateBlob(o,blob,label){if(blob.size>100*1048576)throw Error(label+': 파일 하나가 GitHub 전송 한도 100MiB를 넘습니다. 해당 자료를 줄여 주세요. 전체 게임의 합계 용량 제한은 아닙니다.');const result=await gh(o,'/git/blobs',{method:'POST',body:{content:bytesToB64(new Uint8Array(await blob.arrayBuffer())),encoding:'base64'},timeout:300000});ghSHA(result?.sha,label);return result;}
async function ghUploadPool(items,task){let next=0,failure=null;await Promise.all(Array.from({length:Math.min(3,items.length)},async()=>{while(!failure&&next<items.length){const item=items[next++];try{await task(item);}catch(e){failure=failure||e;}}}));if(failure)throw failure;}
/* src/main/0360-sync/040-boot.js에서 옮김 */
// 켤 때 자동 받기는 3분에 두 번까지만(저장이 안 써져서 받기→다시 시작이 끝없이 되풀이되지 않게)
function bootPullOk(){ try{ const now=Date.now(), a=JSON.parse(sessionStorage.getItem('ggm-bootpull')||'[]').filter(x=>now-x<180000); if(a.length>=2) return false; a.push(now); sessionStorage.setItem('ggm-bootpull',JSON.stringify(a)); }catch(e){} return true; }
// Remote game records and staged media become visible together, only after validation succeeds.
async function lsApply(ls,prefix){
 if(!ls||typeof ls!=='object'||Array.isArray(ls))throw Error('받은 저장 목록이 올바르지 않습니다');
 const pj=JSON.parse(ls[PJKEY]||'null');
 if(!pj||!Array.isArray(pj.list)||typeof pj.active!=='string'||!pj.list.some(x=>x&&x.id===pj.active))throw Error('받은 게임 목록을 확인하지 못했습니다');
 const records={},prefs={},allowed=new Set([...STORE_POLICY.sync,...Object.keys(STORE_POLICY.secret)]); /* 받는 설정 = 저장 정책의 동기화·비밀 갈래 */
 for(const[k,raw]of Object.entries(ls)){if(!GGMStorage.managed(k)&&!allowed.has(k))continue;if(typeof raw!=='string')throw Error('받은 저장 항목 형식이 올바르지 않습니다');const v=syMerge(k,raw);if(v==null)continue;if(GGMStorage.managed(k)){if(k!==PJKEY&&!Array.isArray(JSON.parse(v)?.chars))throw Error('받은 게임 자료를 확인하지 못했습니다');records[k]=v;}else prefs[k]=v;}
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
/* src/main/0360-sync/0400-publish-subscribe.js에서 옮김 */
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
// 그림 받기: 내용 해시가 같은 그림은 다시 받지 않아요
async function subPullImages(base,game,ns,had,st,prefix){
 const imap=game.images||{},objs=imgObjsOf(game);let n=0,lastHash=null,lastBytes=null;const tot=objs.filter(x=>imap[x.id]).length;
 for(const x of objs){const h=imap[x.id];if(!h){x.img=null;continue;}n++;if(had?.[x.id]===h&&await idbGet(ns+x.id)){x.img={idb:true};continue;}
  st&&st(`그림 받는 중 ${n}/${tot}`);const bytes=lastHash===h?lastBytes:await subGet(base,'b/'+h,true);if(!bytes?.length)throw Error('그림 자료가 비어 있습니다: '+x.id);lastHash=h;lastBytes=bytes;
  const blob=new Blob([bytes],{type:bytes[0]===0x89?'image/png':bytes[0]===0xFF?'image/jpeg':'image/webp'});
  if(prefix)await appStorage.stage(prefix+x.id,{key:x.id,blob});else await idbPut(ns+x.id,blob);x.img={idb:true};
 }return imap;
}
/* src/main/0360-sync/050-single-device.js에서 옮김 */
/* 이 기기 id(저장소 ggm-devid): 불러올 때 한 번 만들어 두고(devIdEnsure) 읽기는 그 값 */
function devIdEnsure(){ try{ if(!appStorage.getItem('ggm-devid')) appStorage.setItem('ggm-devid','d'+uid()+uid()); }catch(e){ quietErr(e,'devIdEnsure'); } }
function devId(){ try{ return appStorage.getItem('ggm-devid')||'d0'; }catch(e){ return 'd0'; } }
function LKMODE(){ const pc=PCS(); if(pc&&pc.lock!==false) return 'pc'; const o=SY(); if(syReady()&&o.lock!==false) return 'gh'; return null; }
function lkAway(l){ if(!l||!l.id||l.away) return true; const now=l.now||Date.now(); return LKMODE()==='pc'?now-(l.seen||0)>45000:now-(l.at||0)>6*3600e3; }
async function lkGet(){ const m=LKMODE();
  if(m==='pc') return await pcApi('/api/lease');
  if(m==='gh'){ const o=SY(); const r=await gh(o,'/contents/sync/lease.json?ref='+encodeURIComponent(o.branch||'main')+'&t='+Date.now(),{okStatus:[404]}); if(!r||!r.content) return {id:'',away:true,_sha:null,now:Date.now()};
    let j={}; try{ j=JSON.parse(new TextDecoder().decode(b64ToBytes(String(r.content).replace(/\s/g,'')))); }catch(e){} j._sha=r.sha; j.now=Date.now(); return j; }
  return null; }
async function lkSave(onlyChanged){ const m=LKMODE(); if(m==='pc'){ const pc=PCS(); if(!onlyChanged||(G.prog.savedAt||0)>(pc.localAt||0)+1000){if(await pcPush(true)!==true)throw Error('PC 저장에 실패하여 기기를 넘기지 않았습니다');} }
  else if(m==='gh'){ const o=SY(); if(!onlyChanged||(G.prog.savedAt||0)>(o.localAt||0)+1000){if(await syPush(true)!==true)throw Error('클라우드 저장에 실패하여 기기를 넘기지 않았습니다');} } }
function lkLoop(){ clearInterval(LK.t); const m=LKMODE(); if(!m) return; LK.t=setInterval(lkTick,m==='pc'?12000:45000); }
/* src/main/0360-sync/060-storage-and-sharing.js에서 옮김 */
// 리롤 초안: 게임의 초안(없으면 지금 세계관으로 새로)에 실제 캐릭터·NPC 이름을 넣어요(그림이 같은 이름에 짝지어지게). 초안에 적어 둔 외모·말투는 이어받아요
function rerollDraft(g,title){ const w=g.world||{}, pr=g.prog||{};
  const d=g.meta&&g.meta.draft?clone(g.meta.draft):{mode:'detail',gtitle:title,kw:String(w.name||title),tone:(g.meta&&g.meta.tone)||'',world:[w.summary,w.lore].filter(Boolean).join('\n\n'),setting:(w.factions||[]).map(f=>f.name+': '+(f.desc||'')).join('\n'),story:'',stages:4,len:'normal',
    hero:{name:pr.player||'',call:(g.meta&&g.meta.terms&&g.meta.terms.player)||'',gender:pr.genderTxt||'',look:pr.look||'',bio:pr.bio||'',hide:!!pr.hideEyes},chars:[]};
  const old=Array.isArray(d.chars)?d.chars:[], pick=n=>old.find(x=>x&&nameEq(x.name,n))||{};
  d.chars=[...(g.chars||[]).filter(c=>!c.alt).map(c=>{ const o=pick(c.name); return {name:c.name,kind:'crew',rank:c.rarity,role:o.role||((c.faction||'')+(c.faction?' · ':'')+(ROLE[c.role]||'')),profile:c.profile||o.profile||'',speech:o.speech||(c.lines||[]).slice(0,2).join(' / '),look:o.look||'',tags:c.naiPrompt||o.tags||''}; }),
    ...(g.npcs||[]).map(n=>{ const o=pick(n.name); return {name:n.name,kind:'npc',role:n.role||o.role||'',profile:n.profile||o.profile||'',speech:n.speech||o.speech||'',look:n.look||o.look||'',tags:n.naiPrompt||o.tags||''}; })];
  return d; }
