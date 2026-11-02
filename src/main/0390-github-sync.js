/* ===== PC·폰 연동 (내 GitHub 비공개 저장소) ===== */
const SYKEY='ggm-sync', SYIDX='ggm-sync-idx';
function SY(){ try{ return JSON.parse(appStorage.getItem(SYKEY))||{}; }catch(e){ return {}; } }
function saveSY(o){ appStorage.setItem(SYKEY,JSON.stringify(o)); }
function syIdx(){ try{ return JSON.parse(appStorage.getItem(SYIDX))||{}; }catch(e){ return {}; } }
function saveSyIdx(o){ try{ appStorage.setItem(SYIDX,JSON.stringify(o)); }catch(e){} }
function syDevice(){ const o=SY(); return o.device||(IS_NATIVE?'안드로이드 폰':IS_IOS?'아이폰':document.body.classList.contains('desk')?'PC':'브라우저'); }
function syReady(){ const o=SY(); return !!(o.repo&&o.token); }
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

function syLsKeys(withKeys){ const pj=PJ(); const keys=[PJKEY,SETUP_KEY,...pj.list.map(x=>pjKey(x.id))]; keys.push(NKEY,SKEY); if(withKeys) keys.push(PKEY); return keys; }
function syStrip(k,v,withKeys){ if(withKeys||v==null) return v; try{ if(k===NKEY){ const o=JSON.parse(v); delete o.key; return JSON.stringify(o); } if(k===SKEY){ const o=JSON.parse(v); delete o.fishKey; delete o.elKey; return JSON.stringify(o); } }catch(e){} return v; }
function syMerge(k,v){ if(v==null) return v; try{ if(k===NKEY){ const cur=JSON.parse(appStorage.getItem(NKEY)||'{}'), o=JSON.parse(v); if(!o.key&&cur.key) o.key=cur.key; return JSON.stringify(o); } if(k===SKEY){ const cur=JSON.parse(appStorage.getItem(SKEY)||'{}'), o=JSON.parse(v); ['fishKey','elKey'].forEach(x=>{ if(!o[x]&&cur[x]) o[x]=cur[x]; }); return JSON.stringify(o); } }catch(e){} return v; }
let SYJOB=null;
function syBar(t){ let el=$('#syBar'); if(!t){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='syBar'; el.className='prepchip'; document.body.appendChild(el); } el.innerHTML=`<b>☁ ${esc(t)}</b>`; }
async function syRemote(o){ // -> {head,tree,paths,state}
  const ref=await ghEnsureBranch(o);
  const head=ref.object.sha, commit=await gh(o,'/git/commits/'+head), tree=await gh(o,'/git/trees/'+commit.tree.sha+'?recursive=1');
  const paths={}; (tree.tree||[]).forEach(x=>{ if(x.type==='blob') paths[x.path]=x.sha; });
  let state=null; if(paths['sync/state.json']){ const r=await gh(o,'/git/blobs/'+paths['sync/state.json'],{binary:true}); try{ let j=JSON.parse(r.bytes?new TextDecoder().decode(r.bytes):(r.text||'')); if(j&&j.encoding==='base64'&&j.content) j=JSON.parse(new TextDecoder().decode(b64ToBytes(j.content.replace(/\s/g,'')))); state=j; }catch(e){throw Error('GitHub의 기존 진행 정보를 해석하지 못했습니다. 덮어쓰지 않고 중단합니다.');} }
  return {head,treeSha:commit.tree.sha,paths,state};
}
