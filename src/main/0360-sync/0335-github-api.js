/* ===== GitHub API 클라이언트(동기화·게시가 같이 씀): 요청·오류 문구·브랜치·커밋·blob 올리기 ===== */
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
