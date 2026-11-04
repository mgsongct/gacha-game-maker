/* ===== 에셋 관리: 공유 보관함 · 사용처 · 중복 합치기 · 감정 아이콘 그림 ===== */
/* 게임마다 따로 있던 자료실(G.lib)을 게임끼리 재사용하게 해요.
   - 공유 보관함: 'ggm-shared-assets'(목록) + IDB 'shared::<id>'(그림·소리). 어느 게임에서 넣든 모든 게임에서 가져와요
   - 자동 재사용: 새 장 생성(addLib)·대본에서 찾은 자료(scanScriptAssets)가 그림 없이 생기면, 보관함에 같은 종류·이름이 있을 때 그대로 가져옴(shAdopt)
   - 사용처: 대본(스토리·톡·에피소드·메모리얼·일정)에서 이름을 세어 안 쓰는 자료를 보여 줌. 같은 프롬프트·이름 중복은 별칭(alias)으로 합침(그림 1장 공유)
   - 감정 아이콘(0462)의 그림을 직접 올려 바꿈(kind 'emote') · 문서 docs/research/direction.md */
const SH_KEY='ggm-shared-assets', SH_KINDS={bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'아이콘',emote:'감정 아이콘',bgm:'음악',sfx:'효과음'};
const shAudio=k=>k==='bgm'||k==='sfx';
function shList(){ try{ const a=JSON.parse(appStorage.getItem(SH_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function shSave(a){ try{ appStorage.setItem(SH_KEY,JSON.stringify(a)); }catch(e){} }
const shCache={};
async function shSrc(x){ if(shCache[x.id]) return shCache[x.id]; try{ const b=await idbGet('shared::'+x.id); if(b) return shCache[x.id]=URL.createObjectURL(b); }catch(e){} return null; }
function libTarget(l){ return l&&l.alias&&G.lib.find(x=>x.id===l.alias)||l; }
async function libBlob(l){ const o=libTarget(l); return idbGetNS(shAudio(o.kind)?'a_'+o.id:o.id); }
async function shPut(l){ const b=await libBlob(l); if(!b) return false; const L=shList(), old=L.find(x=>x.kind===l.kind&&x.name===l.name), id=old?old.id:'s'+uid();
  await idbPut('shared::'+id,b); if(shCache[id]){ URL.revokeObjectURL(shCache[id]); delete shCache[id]; }
  const it={id,kind:l.kind,name:l.name,prompt:String(libTarget(l).prompt||''),from:G.meta.title,at:Date.now()}; shSave(old?L.map(x=>x===old?it:x):[it,...L]); return true; }
async function shTake(x,into){ const b=await idbGet('shared::'+x.id).catch(()=>null); if(!b) return null; let l=into||G.lib.find(y=>y.kind===x.kind&&y.name===x.name);
  if(!l){ l={id:'l'+uid(),kind:x.kind,name:x.name,prompt:x.prompt||'',img:null}; G.lib.push(l); } delete l.alias; if(!l.prompt&&x.prompt) l.prompt=x.prompt;
  if(shAudio(x.kind)) await storeAudio(l,b); else await storeImage(l,b); l.shared=x.id; mark('l:'+l.id); return l; }
function shAdopt(l){ if(!l||l.img||l.audio||l.alias) return; const x=shList().find(y=>y.kind===l.kind&&y.name===l.name); if(x) shTake(x,l).catch(()=>{}); }
// 대본에 나오는 자료 이름 세기
function libUsage(){ const n={}, add=k=>{ if(k) n[k]=(n[k]||0)+1; }, scan=t=>{ if(!t) return; try{ parseScript(t).forEach(L=>{ if(L.type==='cmd') add(L.arg); else if(L.type==='place') add(L.text); }); }catch(e){} };
  G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>{ scan(s.pre); scan(s.post); })); (G.threads||[]).forEach(t=>scan(t.script)); G.chars.forEach(c=>{ (c.episodes||[]).forEach(e=>scan(e.script)); if(c.memorial) scan(c.memorial.script); Object.values(c.spotTalk||{}).forEach(scan); });
  scan(G.opening&&G.opening.prologue); spots().forEach(s=>add(s.bg)); add(P().titleBg); add(P().lobbyBg); G.lib.filter(l=>l.kind==='cg').forEach(l=>add(l.name)); return n; }
function libDupes(){ const out=[], seen={}; G.lib.filter(l=>['bg','prop','enemy','icon'].includes(l.kind)&&!l.alias).forEach(l=>{ const k=l.kind+'|'+(String(l.prompt||'').trim().toLowerCase()||'#'+l.name.replace(/\s+/g,'')); if(seen[k]) out.push({keep:seen[k],dup:l}); else seen[k]=l; }); return out; }
function libMerge(list){ auditSnap(list.map(x=>x.dup),'자료 합치기'); list.forEach(({keep,dup})=>{ dup.alias=keep.id; dup.img=null; mark('l:'+dup.id); }); return list.length; }

let AM_TAB='shared';
async function openAssets(tab){ if(tab) AM_TAB=tab; const tabs=[['shared','공유 보관함'],['game','이 게임 자료'],['emote','감정 아이콘']]; let body='';
  if(AM_TAB==='shared'){ const L=shList(); const srcs=await Promise.all(L.map(x=>shAudio(x.kind)?null:shSrc(x)));
    body=`<p class="muted" style="font-size:.82rem">모든 게임이 함께 쓰는 자료예요. 이 게임 자료에서 '보관함에 넣기'로 넣고, 여기서 '가져오기'로 지금 게임에 넣어요. 새 장을 만들 때 같은 이름의 배경·소품이 생기면 자동으로 가져와요.</p>
    ${L.length?L.map((x,i)=>`<div class="ep">${srcs[i]?`<img src="${esc(srcs[i])}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px">`:`<span style="width:48px;text-align:center">${shAudio(x.kind)?'♪':'—'}</span>`}<span class="t"><b>${esc(x.name)}</b><span class="muted">${esc(SH_KINDS[x.kind]||x.kind)} · ${esc(x.from||'')}${G.lib.some(l=>l.kind===x.kind&&l.name===x.name&&(l.img||l.audio))?' · 이 게임에 있음':''}</span></span><button class="btn sm" data-act="amtake" data-id="${x.id}">가져오기</button><button class="btn sm ghost" data-act="amshdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted">아직 비어 있어요</p>'}`; }
  else if(AM_TAB==='game'){ const U=libUsage(), D=libDupes(), L=G.lib.filter(l=>SH_KINDS[l.kind]), unused=L.filter(l=>['bg','prop'].includes(l.kind)&&!U[l.name]&&!l.alias);
    body=`<p class="muted" style="font-size:.82rem">자료 ${L.length}개 · 대본에서 안 쓰는 배경·소품 ${unused.length}개 · 중복 ${D.length}개</p>
    ${D.length?`<div class="panel" style="padding:8px"><b>중복</b> (같은 프롬프트·이름): ${D.map(x=>`${esc(x.dup.name)} → ${esc(x.keep.name)}`).join(', ')}<div class="row" style="margin-top:6px"><button class="btn sm" data-act="ammerge">그림 1장으로 합치기 (${D.length})</button>${AUDIT_UNDO?`<button class="btn sm ghost" data-act="amundo">되돌리기</button>`:''}</div></div>`:''}
    <div class="row" style="gap:6px;margin:6px 0"><button class="btn sm ghost" data-act="amadopt">보관함에서 같은 이름 자료 채우기</button></div>
    ${L.map(l=>{ const s=shAudio(l.kind)?null:imgSrc(l); return `<div class="ep">${s?`<img src="${esc(s)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px">`:`<span style="width:48px;text-align:center">${shAudio(l.kind)?(l.audio?'♪':'—'):'—'}</span>`}<span class="t"><b>${esc(l.name)}</b><span class="muted">${esc(SH_KINDS[l.kind])} · 대본 ${U[l.name]||0}번${l.alias?' · 별칭':''}${l.shared?' · 보관함':''}</span></span>${(s||l.audio)&&!l.alias?`<button class="btn sm ghost" data-act="amput" data-id="${l.id}">보관함에 넣기</button>`:''}</div>`; }).join('')}`; }
  else { body=`<p class="muted" style="font-size:.82rem">대본의 [표정|하트] · [연출: 이름 땀] · [스티커: 화남]에 쓰는 감정 아이콘이에요. 그림을 올리면 기본 아이콘 대신 써요(공유 보관함에 넣으면 다른 게임에서도).</p>
    <div style="display:flex;flex-wrap:wrap;gap:10px">${Object.keys(EMOTES).map(k=>{ const l=G.lib.find(x=>x.kind==='emote'&&x.name===k); return `<div style="width:92px;text-align:center"><div style="height:60px">${emoteHTML(k,true).replace('class="emo big','class="emo big still')}</div><b style="font-size:.8rem">${esc(k)}</b><label class="btn sm ghost" style="display:block;margin-top:4px">그림<input type="file" accept="image/*" hidden data-amemo="${esc(k)}"></label>${l?`<button class="btn sm ghost" data-act="amemodel" data-id="${l.id}" style="margin-top:2px">기본으로</button>`:''}</div>`; }).join('')}</div>`; }
  openModal(`${head('에셋 관리','<span class="muted">공유·재사용</span>')}<div class="row" style="gap:4px;margin-bottom:8px">${tabs.map(([k,l])=>`<button class="btn sm ${AM_TAB===k?'':'ghost'}" data-act="amtab" data-k="${k}">${l}</button>`).join('')}</div>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
function assetPanel(){ const sh=shList().length, d=libDupes().length; return `<div class="panel pm-hide"><h3>에셋 관리 ${d?`<span class="badge">중복 ${d}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">공유 보관함 ${sh}개 · 게임끼리 배경·소품·음악·감정 아이콘을 재사용하고, 중복 자료를 합치고, 안 쓰는 자료를 찾아요.</p><button class="btn sm" data-act="amopen">에셋 관리</button></div>`; }
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, id=el.dataset.id;
  if(a==='amopen') openAssets();
  else if(a==='amtab') openAssets(el.dataset.k);
  else if(a==='amput'){ const l=G.lib.find(x=>x.id===id); if(l&&await shPut(l)) toast(`「${l.name}」을(를) 공유 보관함에 넣었어요`); else toast('넣을 그림·소리가 없어요'); openAssets(); }
  else if(a==='amtake'){ const x=shList().find(y=>y.id===id); const l=x&&await shTake(x); toast(l?`「${l.name}」을(를) 가져왔어요`:'가져오지 못했어요'); openAssets(); }
  else if(a==='amshdel'){ if(!(await appConfirm('공유 보관함에서 지울까요? 이미 가져온 게임의 자료는 그대로예요.'))) return; shSave(shList().filter(x=>x.id!==id)); try{ await idbDel('shared::'+id); }catch(_){} openAssets(); }
  else if(a==='ammerge'){ const n=libMerge(libDupes()); toast(`${n}개를 합쳤어요(그림 1장을 같이 써요)`); openAssets(); }
  else if(a==='amundo'){ auditUndo(); G.lib.forEach(l=>mark('l:'+l.id)); openAssets(); }
  else if(a==='amadopt'){ let n=0; for(const l of G.lib.filter(l=>!l.img&&!l.audio&&!l.alias)){ const x=shList().find(y=>y.kind===l.kind&&y.name===l.name); if(x&&await shTake(x,l)) n++; } toast(n?`${n}개를 보관함에서 채웠어요`:'채울 자료가 없어요'); openAssets(); }
  else if(a==='amemodel'){ G.lib=G.lib.filter(x=>x.id!==id); mark('l:'+id); openAssets(); } });
document.addEventListener('change',async e=>{ const k=e.target.dataset&&e.target.dataset.amemo, f=e.target.files&&e.target.files[0]; if(!k||!f) return;
  let l=G.lib.find(x=>x.kind==='emote'&&x.name===k); if(!l){ l={id:'l'+uid(),kind:'emote',name:k,prompt:'',img:null}; G.lib.push(l); } await storeImage(l,f); mark('l:'+l.id); toast(`「${k}」 아이콘을 바꿨어요`); openAssets('emote'); });
