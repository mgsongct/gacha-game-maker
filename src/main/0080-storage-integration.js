/* STORAGE_INTEGRATION_MODULE */
/* These hooks run in the main script's global lexical environment. */
function storageWarning(message){let el=document.getElementById('save-warning');if(!el){el=document.createElement('div');el.id='save-warning';el.setAttribute('role','alert');el.style.cssText='position:fixed;top:env(safe-area-inset-top,0px);left:8px;right:8px;z-index:2147483646;background:var(--panel,#fff);color:var(--ink,#222);border:2px solid var(--rose,#d92f5a);padding:12px;border-radius:12px';el.innerHTML='<b>저장 실패</b><p></p><button class="btn sm" type="button">저장 다시 시도</button>';el.querySelector('b').textContent='저장 실패 · 앱을 종료하지 마세요';el.querySelector('button').onclick=async()=>{try{await flush();if(!appStorage.failed)el.remove();}catch(e){}};document.body.appendChild(el);}el.querySelector('p').textContent=message+(/다른 메이커 화면/.test(message)?' 이 화면의 미저장 변경은 진행 백업으로 따로 보관해 주세요.':' 현재 변경 내용은 아직 저장되지 않았습니다. 저장 공간을 확보하고 다시 시도하거나 진행 백업을 내보내 주세요.');}
addEventListener('ggm-storage-error',e=>storageWarning(e.detail.message));
async function reloadGame(url){try{if(!window.__NOFLUSH)await flush();await appStorage.drain();if(url)location.href=url;else location.reload();}catch(e){storageWarning(e.message||'저장하지 못했습니다');}}
// Capturing guard also covers enhancement buttons installed by combat modules.
document.addEventListener('click',e=>{if(!appStorage.failed&&!document.getElementById('save-warning'))return;const a=e.target.closest('[data-act]')?.dataset.act;if(/^(pull|upgo|cheat|cheat2|skbbuy|cashpkg|v2train|v2training|v2gearunlock)/.test(a||'')){e.preventDefault();e.stopImmediatePropagation();storageWarning('저장을 먼저 복구한 뒤 뽑기·강화를 진행해 주세요.');}},true);

// Begin persistence immediately after synchronous button actions, rather than waiting for app exit.
document.addEventListener('click',()=>{queueMicrotask(()=>{if(dirty.size&&!window.__NOFLUSH)flush().catch(()=>{});});});


// One project transition at a time; validate the target BEFORE changing the active registry.
let projectSwitchBusy=false;
async function switchProject(id){
 if(projectSwitchBusy)return false;if(NEW_GAME_SOURCE||PCJOB||SYJOB||BACKUP_BUSY){toast('진행 중인 생성·저장 작업이 끝난 뒤 전환해 주세요');return false;}projectSwitchBusy=true;
 try{if(window.__NOFLUSH)throw Error('데이터 적용 중입니다. 다시 시작한 뒤 전환해 주세요.');await flush();await appStorage.assertCurrent(PJKEY);const pj=PJ();if(!pj.list.some(x=>x.id===id))throw Error('게임 목록에서 대상을 찾지 못했습니다');const raw=appStorage.getItem(pjKey(id));if(!raw||!Array.isArray(JSON.parse(raw)?.chars))throw Error('선택한 게임의 저장 데이터를 읽지 못했습니다. 현재 게임을 유지합니다.');await appStorage.assertCurrent(pjKey(id));pj.active=id;await appStorage.commitRecords({[PJKEY]:JSON.stringify(pj)});try{sessionStorage.setItem('ggm-picked','1');}catch(e){}await reloadGame();return true;
 }catch(e){storageWarning(e.message||'게임을 전환하지 못했습니다');projectSwitchBusy=false;return false;}
}
/* /STORAGE_INTEGRATION_MODULE */

function writeKey(k,game=G){
  const ref=id=>DB.doc(BASE+'/'+id);
  const put=(pre,arr,id,doc)=>{const o=arr.find(x=>x.id===id);return o?ref(doc).set(clone(o)):ref(doc).delete();};
  if(k==='meta') return ref('meta').set({ver:VER});
  if(k==='world') return ref('world').set(clone(game.world));
  if(k==='opening') return ref('opening').set(clone(game.opening));
  if(k==='prog') return ref('progress').set(clone(game.prog));
  if(k.startsWith('c:')){const id=k.slice(2);return put('c',game.chars,id,'c_'+id);}
  if(k.startsWith('ch:')){const id=k.slice(3);return put('ch',game.chapters,id,'ch_'+id);}
  if(k.startsWith('l:')){const id=k.slice(2);return put('l',game.lib,id,'l_'+id);}
  if(k.startsWith('t:')){const id=k.slice(2);return put('t',game.threads,id,'t_'+id);}
}
function replaceAll(ng){
  const olds=[...G.chars.map(c=>'c:'+c.id),...G.chapters.map(ch=>'ch:'+ch.id),...G.lib.map(l=>'l:'+l.id),...G.threads.map(t=>'t:'+t.id)];
  G=fix(ng); delete G.__curveNew; mark(...olds); markAll(); loadIdbImages(); render();
}

/* 이미지 */
const imgCache={};
const IMGNS=PJ().active==='main'?'':PJ().active+'::';
async function idbGetNS(k){ let b=null; try{b=await idbGet(IMGNS+k);}catch(e){} if(!b&&IMGNS){ try{b=await idbGet(k);}catch(e){} } return b; }
function idbOpen(){return appStorage.open();}
async function idbPut(k,v){await appStorage.mediaWrite(k,v,LKEY);try{const ix=JSON.parse(appStorage.getItem('ggm-sync-idx')||'{}');if(ix[k]){delete ix[k];appStorage.setItem('ggm-sync-idx',JSON.stringify(ix));}}catch(e){}}
async function idbKeys(){const d=await idbOpen();return new Promise((res,rej)=>{const q=d.transaction('img').objectStore('img').getAllKeys();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
async function idbDel(k){return appStorage.mediaWrite(k,null,LKEY);}
async function voiceStats(){let n=0,b=0;try{for(const k of await idbKeys()){if(String(k).startsWith('v_')){n++;const x=await idbGet(k);b+=x&&x.size||0;}}}catch(e){}return {n,mb:(b/1048576).toFixed(1)};}
async function idbGet(k){const d=await idbOpen();return new Promise((res,rej)=>{const t=d.transaction('img');const q=t.objectStore('img').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
// 표정의 상반신판(f.up)·스킨 표정·NPC까지 모두 넣어야 다시 켰을 때·백업·연동에서 빠지지 않아요
function imgObjsOf(g){const a=[...(g.chars||[]),...(g.lib||[])];if(g.meta&&g.meta.shop&&g.meta.shop.self)a.push(g.meta.shop.self);const fz=fs=>(fs||[]).forEach(f=>{if(!f)return;a.push(f);if(f.up)a.push(f.up);});if(g.prog&&g.prog.avatar&&g.prog.avatar.id)a.push(g.prog.avatar);(g.npcs||[]).forEach(n=>{a.push(n);if(n.upper)a.push(n.upper);fz(n.faces);});(g.chars||[]).forEach(c=>{fz(c.faces);a.push(...(c.skins||[]));(c.skins||[]).forEach(k=>{if(!k)return;fz(k.faces);['upper','illust','lbcg'].forEach(x=>{if(k[x])a.push(k[x]);});});Object.values(c.skillIcons||{}).forEach(o=>{if(o&&o.id)a.push(o);});if(c.weapon)a.push(c.weapon);if(c.illust)a.push(c.illust);if(c.upper)a.push(c.upper);if(c.pose)a.push(c.pose);if(c.lbbg)a.push(c.lbbg);if(c.lbcg)a.push(c.lbcg);if(c.scg)a.push(c.scg);Object.values(c.cards||{}).forEach(o=>{if(o&&o.id)a.push(o);});});return a.filter(o=>o&&o.id);}
function allImgObjs(){return imgObjsOf(G);}
async function loadIdbImages(){
  let ch=false;
  for(const o of allImgObjs()){ if(o.img&&o.img.idb&&!imgCache[o.id]){ try{const b=await idbGetNS(o.id); if(b){imgCache[o.id]=URL.createObjectURL(b);ch=true;}}catch(e){} } }
  if(ch){ render(); if(document.querySelector('#ov .title')) showTitle(); }
}
function imgSrc(o){
 if(o&&typeof G!=='undefined'&&G){const owner=(G.chars||[]).find(c=>c===o||(c.skins||[]).includes(o));if(owner){if(o!==owner)return skinPreviewSrc(owner,o);if(owner.useStanding===false)return owner.upper&&imgSrcRaw(owner.upper)||null;}}
 return imgSrcRaw(o);
}
function imgSrcRaw(o){ if(o&&!o.img&&o.alias&&typeof G!=='undefined'&&G&&G.lib){ const t=G.lib.find(l=>l.id===o.alias); return t&&t!==o&&!t.alias?imgSrc(t):null; } if(!o||!o.img) return null; if(o.img.asset) return null; if(o.img.idb) return imgCache[o.id]||null; return null; }
const SKP={upper:'상반신',illust:'일러스트',lbcg:'돌파 CG'};
let NOSKIN=0; // 계약(가챠) 화면·연출은 스킨 없이 기본 모습으로
const noSkin=f=>function(){ NOSKIN++; try{ return f.apply(this,arguments); }finally{ NOSKIN--; } };
function skinOf(c){ if(NOSKIN) return null; const o=c&&P().owned[c.id]; return o&&o.skin?(c.skins||[]).find(x=>x.id===o.skin)||null:null; }
function skinPart(k,x){ if(!k[x]||typeof k[x]!=='object') k[x]={id:'k'+x.slice(0,2)+'_'+k.id,kind:x==='upper'?'upper':x,name:k.name+' '+SKP[x],prompt:'',img:null}; return k[x]; }
// A skin preview can only use images owned by that skin; never borrow the base outfit.
function skinPreviewSrc(c,k){if(!k)return null;const stand=imgSrcRaw(k),upper=k.upper&&imgSrcRaw(k.upper);return c.useStanding===false?upper||stand:stand||upper;}
function skinDisplayReady(c,k){return !!(k&&(c.useStanding===false?k.upper&&imgSrcRaw(k.upper):skinPreviewSrc(c,k)));}
function skinPrimaryPart(c,k){return c.useStanding===false?skinPart(k,'upper'):k;}
function skinPartSrc(c,x){ const k=skinOf(c); return k&&k[x]?imgSrc(k[x]):null; }
function lbcgSrc(c){return skinOf(c)?skinPartSrc(c,'lbcg'):c&&c.lbcg?imgSrc(c.lbcg):null;}
function charSrc(c,face){
  if(c.useStanding===false){const sk=skinOf(c);if(face){const f=((sk?.upper&&imgSrc(sk.upper)?sk.faces:c.faces)||[]).find(x=>x.name===face);if(f?.up&&imgSrc(f.up))return imgSrc(f.up);}return sk?.upper&&imgSrc(sk.upper)||c.upper&&imgSrc(c.upper)||null;}
  const sk=skinOf(c);
  if(sk&&skinPreviewSrc(c,sk)){ if(face){ const f=(sk.faces||[]).find(x=>x.name===face); if(f&&imgSrc(f)) return imgSrc(f); } return skinPreviewSrc(c,sk); }
  if(face){ const f=(c.faces||[]).find(x=>x.name===face); if(f&&imgSrc(f)) return imgSrc(f); }
  return imgSrc(c)||(()=>{ const en=G.lib.find(l=>l.kind==='enemy'&&l.name===c.name); return en?imgSrc(en):null; })();
}
function art(c,cls='',opt){
  if(c.useStanding===false){const src=charSrc(c,opt?.face);return src?`<img class="art upimg ${cls}" src="${esc(src)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`:`<div class="art ph ${cls}"><small>상반신 미등록</small></div>`;}
  if(opt&&opt.upper&&opt.face){ const fo=skinFaces(c).find(x=>x.name===opt.face), fu=fo&&fo.up&&imgSrc(fo.up); if(fu) return `<img class="art upimg ${cls}" src="${esc(fu)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`; }
  if(opt&&opt.upper){ const sk=skinOf(c), hasFace=false, us=c.upper&&imgSrc(c.upper); // 상반신판 표정이 없으면 기본 상반신 그대로
    const sku=sk&&sk.upper&&imgSrc(sk.upper); if(sku&&!hasFace) return `<img class="art upimg ${cls}" src="${esc(sku)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
    if(us&&!hasFace&&!(sk&&imgSrc(sk))) return `<img class="art upimg ${cls}" src="${esc(us)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`; }
  const s=charSrc(c,opt&&opt.face);
  if(s) return `<img class="art ${cls}" src="${esc(s)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
  return `<div class="art ph ${cls}" style="--ec:${ECOL[c.elem]||'var(--rose)'}"><span>${esc((c.name||'?').slice(0,1))}</span><small>스탠딩 미등록</small></div>`;
}
function battleCharacterArt(c){
 const name=c.name||'이름 없음',markup=art(c);
 return markup.includes('<img ')?markup.replace('<img ',`<img data-battle-name="${esc(name)}" `):`<div class="art v2-art-name" role="img" aria-label="${esc(name)} · 일러스트 없음">${esc(name)}</div>`;
}
document.addEventListener('error',event=>{const img=event.target;if(!img?.matches?.('.au-art img[data-battle-name]'))return;const label=document.createElement('div');label.className='art v2-art-name';label.setAttribute('role','img');label.setAttribute('aria-label',img.dataset.battleName+' · 일러스트 없음');label.textContent=img.dataset.battleName;img.replaceWith(label);},true);
function enemyLib(name){return G.lib.find(l=>l.kind==='enemy'&&l.name===name);}
function enemyArt(e,cls){const l=enemyLib(e.name), ch=G.chars.find(c=>c.name===e.name), s=(ch&&imgSrc(ch))||(l&&imgSrc(l)); return s?`<img class="en-img ${cls||''}" src="${esc(s)}" alt="${esc(e.name)}" draggable="false">`:`<div class="shape"><i></i></div>`;}
function libArt(name){
  const it=G.lib.find(l=>l.name===name);
  const s=it&&imgSrc(it);
  if(s) return `<img class="art" src="${esc(s)}" alt="${esc(name)}">`;
  if(it&&it.kind==='bg') return `<div class="art" style="${bgStyle(name)}"></div>`;
  return `<div class="art ph" style="--ec:var(--brass)"><small>${esc(name)}</small><small>이미지 미등록</small></div>`;
}
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const procCache={};
function procBg(name){
  if(procCache[name]) return procCache[name];
  let h=hash(name)||1; const R=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return (h%10000)/10000;};
  const hue=hash(name+'h')%360;
  let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">';
  for(let i=0;i<40;i++) svg+=`<circle cx="${Math.round(R()*400)}" cy="${Math.round(R()*150)}" r="${(R()*1.2+.3).toFixed(1)}" fill="#fff" opacity="${(R()*.6+.2).toFixed(2)}"/>`;
  let x=0; while(x<400){const w=14+R()*30,hg=70+R()*120; svg+=`<rect x="${Math.round(x)}" y="${Math.round(300-hg)}" width="${Math.round(w)}" height="${Math.round(hg)}" fill="hsl(${hue},35%,15%)"/>`; x+=w+2;}
  x=0; while(x<400){const w=20+R()*40,hg=30+R()*90; svg+=`<rect x="${Math.round(x)}" y="${Math.round(300-hg)}" width="${Math.round(w)}" height="${Math.round(hg)}" fill="#0a0712"/>`;
    for(let k=0;k<4;k++) if(R()<.6) svg+=`<rect x="${Math.round(x+3+R()*(w-8))}" y="${Math.round(300-hg+6+R()*(hg-14))}" width="3" height="4" fill="hsl(${(hue+40)%360},90%,70%)" opacity=".8"/>`; x+=w+3;}
  svg+='</svg>';
  return procCache[name]=`url('data:image/svg+xml,${encodeURIComponent(svg)}'),linear-gradient(180deg,hsl(${hue},45%,14%),hsl(${(hue+35)%360},50%,30%) 75%,hsl(${(hue+60)%360},45%,20%))`;
}
function bgStyle(name){
  const it=G.lib.find(l=>l.kind==='bg'&&l.name===name); const s=it&&imgSrc(it);
  if(s) return `background-image:url('${s}');background-size:cover;background-position:center`;
  return `background-image:${procBg(name||'밤')};background-size:cover;background-position:center bottom`;
}
async function shrink(file,max){
  try{
    const bmp=await createImageBitmap(file); const s=Math.min(1,max/Math.max(bmp.width,bmp.height));
    const cv=document.createElement('canvas'); cv.width=Math.round(bmp.width*s); cv.height=Math.round(bmp.height*s);
    cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
    const b=await new Promise(r=>cv.toBlob(r,'image/webp',0.92)); return b||file;
  }catch(e){return file;}
}
async function storeImage(o,blob,prefix){
  if(ASSETS){ const r=await ASSETS.upload(blob); o.img={asset:r.id}; }
  else { await idbPut(IMGNS+o.id,blob); if(imgCache[o.id]) URL.revokeObjectURL(imgCache[o.id]); imgCache[o.id]=URL.createObjectURL(blob); o.img={idb:true}; }
  if(o.redraw)delete o.redraw;if(blob&&blob.__seed!=null)o.seed=blob.__seed;else if(blob)delete o.seed;
  mark(prefix+o.id);
}
// 그림만 지워요(항목은 남겨요): 기기 저장소의 그림과 화면용 주소까지 정리해요
async function imgClear(o){ if(!o) return;if(appStorage.durable||window.indexedDB||o.img?.idb)await idbDel(IMGNS+o.id);o.img=null; delete o.seed; if(imgCache[o.id]){ try{ URL.revokeObjectURL(imgCache[o.id]); }catch(e){} delete imgCache[o.id]; } }
const XBTN=(k,id,extra,label)=>`<button class="btn sm ghost" data-act="imgx" data-k="${k}" data-id="${esc(id||'')}"${extra||''}>${label||'그림 지우기'}</button>`;
let uploadFor=null, uploadAudioFor=null;
// 표정을 넣을 대상: 기본 모습이거나, 표정 창에서 고른 스킨
let FACET={cid:'',sid:''};
function faceTgt(c){ const k=FACET.cid===c.id&&FACET.sid&&(c.skins||[]).find(x=>x.id===FACET.sid); if(k){ k.faces=k.faces||[]; return k; } return c; }
async function addFaceFile(c,name,file,b){ const F=faceTgt(c); let fc=F.faces.find(q=>q.name===name); if(!fc){ fc={id:'f'+uid(),name,img:null}; F.faces.push(fc); } const bl=await shrink(file,1800); if(b==='up'){ fc.up=fc.up||{id:'fu'+fc.id,name:name+' 상반신',img:null}; await storeImage(fc.up,bl,''); } else await storeImage(fc,bl,''); mark('c:'+c.id); }
document.addEventListener('DOMContentLoaded',()=>{});
(function(){ const i=document.createElement('input'); i.type='file'; i.id='filesm'; i.accept='image/*'; i.multiple=true; i.hidden=true; document.body.appendChild(i);
  i.addEventListener('change',async e=>{ const fs=[...e.target.files]; e.target.value=''; if(!fs.length||!uploadFor||uploadFor.kind!=='faces') return; const c=charById(uploadFor.id); if(!c) return; let n=0;
    for(const f of fs){ const nm=f.name.replace(/\.[^.]+$/,'').trim().slice(0,12); if(!nm) continue; try{ await addFaceFile(c,nm,f); n++; }catch(err){ quietErr(err,'0080-storage-integration.js:148'); } }
    openFaces(c.id); toast(`표정 ${n}개를 넣었어요`); }); })();
document.getElementById('afile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; const l=libById(uploadAudioFor); if(!f||!l) return;
  try{ await storeAudio(l,f); toast(`「${l.name}」 음악을 등록했어요`); bgm(l.name,true); openLibItem(l.id); }catch(err){ toast('음악 파일을 저장하지 못했어요'); }
});
$('#file').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f||!uploadFor) return;
  if(uploadFor.kind==='avatar'){ try{ await storeImage(avatarObj(),await shrink(f,1200),''); mark('prog'); refreshPlayerForm(); toast('프로필 그림을 등록했어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='skinpart'){ const c=charById(uploadFor.id), k=c&&(c.skins||[]).find(x=>x.id===uploadFor.s); if(!k) return; const x=uploadFor.x; toast('그림을 등록하는 중이에요');
    try{ let ub=await shrink(f,2200); if(x==='stand'||x==='upper'){ try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:158'); } } await storeImage(x==='stand'?k:skinPart(k,x),ub,''); mark('c:'+c.id); render(); skinRefresh(c.id); toast(`${k.name} ${x==='stand'?'스탠딩':SKP[x]}을(를) 등록했어요`); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='pthumb'){ try{ const d=await thumbData(f), id=uploadFor.id, up=userPacks(), mine=up.find(x=>x.id===id); if(mine){ mine.thumb=d; saveUserPacks(up); } else { const m=pthumbs(); m[id]=d; appStorage.setItem(PTHUMB,JSON.stringify(m)); } if($('#modal .ep [data-act="packuse"]')) openModal(packHTML()); toast('썸네일을 넣었어요'); }catch(err){ toast('썸네일을 넣지 못했어요'); } return; }
  if(uploadFor.kind==='shk'){ try{ let ub=await shrink(f,2200); try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:160'); } const o=shkSelf(); await storeImage(o,ub,''); G.meta.shop.charId='__self'; mark('meta'); SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(imgSrc(o))}" alt="">`; if($('#sk_char')) $('#sk_char').value='__self'; render(); toast('상점 주인 그림을 올렸어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='npc'||uploadFor.kind==='npcup'){ const n=(G.npcs||[]).find(x=>x.id===uploadFor.id); if(!n) return; const up=uploadFor.kind==='npcup';
    try{ let ub=await shrink(f,2200); try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:162'); } if(up&&!n.upper) n.upper={id:'up_'+n.id,kind:'upper',name:n.name+' 상반신',prompt:'',img:null}; await storeImage(up?n.upper:n,ub,up?'':'c:'); mark('meta'); npcRefresh(n.id); toast(`${n.name} ${up?'상반신':'스탠딩'}을(를) 올렸어요`); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='scimg'){ /* 스토리 편집: 올린 그림을 CG로 저장하고 대본의 커서 자리에 [CG: 이름] … [CG 끝]을 넣어요 */
    const ta=$('#'+uploadFor.ta); if(!ta) return; toast('그림을 넣는 중이에요');
    try{ let k=G.lib.filter(l=>l.kind==='cg'&&/^삽화 \d+$/.test(l.name)).length+1; while(G.lib.some(l=>l.name==='삽화 '+k)) k++;
      const l={id:'l'+uid(),kind:'cg',name:'삽화 '+k,prompt:'',cast:[],img:null}; await storeImage(l,await shrink(f,2200),'l:'); G.lib.push(l); mark('l:'+l.id);
      const pos=Math.min(uploadFor.pos==null?ta.value.length:uploadFor.pos,ta.value.length), v=ta.value, pre=v.slice(0,pos), post=v.slice(pos);
      const ins=(pre&&!pre.endsWith('\n')?'\n':'')+`[CG: ${l.name}]\n…\n[CG 끝]`+(post&&!post.startsWith('\n')?'\n':'');
      ta.value=pre+ins+post; ta.focus({preventScroll:true}); try{ ta.setSelectionRange(pos+ins.length,pos+ins.length); }catch(e){} toast(`「${l.name}」을(를) 넣었어요. 저장을 눌러야 반영돼요`); }
    catch(err){ toast('이미지를 넣지 못했어요'); } return; }
  if(uploadFor.kind==='face'){ const c=charById(uploadFor.id); if(!c) return; try{ await addFaceFile(c,uploadFor.name,f,uploadFor.b); openFaces(c.id); toast(`표정 「${uploadFor.name}」${uploadFor.b==='up'?' 상반신':''}을(를) 넣었어요`); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='weapon'){ const c=charById(uploadFor.id); if(!c||!c.weapon) return; toast('그림을 등록하는 중이에요'); try{ let ub=await shrink(f,2000); try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:172'); } await storeImage(c.weapon,ub,''); mark('c:'+c.id); render(); openChar(c.id); toast(T('weapon')+' 이미지를 등록했어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  if(ILK(uploadFor.kind)||uploadFor.kind==='upper'||uploadFor.kind==='pose'||uploadFor.kind==='lbbg'||uploadFor.kind==='scg'){ const c=charById(uploadFor.id); if(!c) return; if(uploadFor.kind==='scg') scgOf(c); toast('그림을 등록하는 중이에요'); try{ let ub=await shrink(f,2200); if(uploadFor.kind==='pose'){ try{ const ai=await alphaInfo(ub); if(ai.border<0.5) ub=await cutoutWhite(ub); }catch(e){ quietErr(e,'0080-storage-integration.js:173'); } } await storeImage(c[uploadFor.kind],ub,''); mark('c:'+c.id); render(); openChar(c.id); toast(uploadFor.kind==='upper'?'상반신을 등록했어요':'일러스트를 등록했어요'); }catch(err){ toast('이미지를 올리지 못했어요'); } return; }
  const o=uploadFor.kind==='char'?charById(uploadFor.id):libById(uploadFor.id); if(!o) return;
  toast('이미지를 등록하는 중이에요');
  const blob=await shrink(f,uploadFor.kind==='char'?1800:2000);
  try{
    await storeImage(o,blob,uploadFor.kind==='char'?'c:':'l:'); render();
    if(uploadFor.kind==='char') openChar(o.id); else openLibItem(o.id);
    toast(`${o.name} 이미지를 등록했어요`);
  }catch(err){ toast('이미지를 올리지 못했어요. 더 작은 파일로 다시 시도해 주세요.'); }
});

