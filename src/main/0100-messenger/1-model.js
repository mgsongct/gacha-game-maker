/* ===== 0100-messenger — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0100-messenger/0100-messenger.js에서 옮김 */
function trigOk(t){
  const c=threadChar(t); if(!c||c.monster) return false;
  if(t.needOwn!==false&&!own(c.id)) return false;
  const g=t.trigger||{type:'start'};
  if(g.type==='start') return true;
  if(g.type==='aff') return !!own(c.id)&&affLv(own(c.id))>=(+g.value||1);
  if(g.type==='clear') return !!P().cleared[g.value];
  return false;
}
function unread(){return Object.entries(P().inbox).filter(([id,s])=>!s.done&&threadChar(threadById(id))).length;}
function phRooms(){ const m={};
  Object.entries(P().inbox).forEach(([id,s])=>{ const t=threadById(id), c=threadChar(t); if(!c) return; const r=m[c.id]||(m[c.id]={c,at:0,unread:false}); r.at=Math.max(r.at,s.at||0); if(!s.done){ r.unread=true; r.title=r.title||t.title; } });
  Object.entries(progRead('fchat')).forEach(([cid,f])=>{ const c=charById(cid); if(!c||!f.log.length) return; const r=m[cid]||(m[cid]={c,at:0,unread:false}); r.at=Math.max(r.at,f.at||0); if(f.unread) r.unread=true; });
  return Object.values(m).map(r=>Object.assign(r,{last:roomLog(r.c.id).filter(l=>l.w!=='s').at(-1)})).sort((a,b)=>b.at-a.at); }
function roomThreads(cid){ return Object.entries(P().inbox).map(([id,s])=>({t:threadById(id),s})).filter(x=>{ const c=threadChar(x.t); return c&&c.id===cid; }).sort((a,b)=>(a.s.t0||a.s.at||0)-(b.s.t0||b.s.at||0)); }
function roomItems(cid){ const out=[];
  roomThreads(cid).forEach(({s})=>{ const n=s.log.length, base=s.t0||s.at||0; s.log.forEach((l,i)=>{ if(l.w==='s'&&l.t==='대화가 끝났어요') return; out.push({l,arr:s.log,k:l.at||(s.t0?base+i:base-(n-i))}); }); });
  const f=progRead('fchat')[cid]; if(f) f.log.forEach((l,i)=>out.push({l,arr:f.log,k:l.at||i,fc:true}));
  return out.sort((a,b)=>a.k-b.k); }
function roomLog(cid){ return roomItems(cid).map(x=>x.l); }
function roomDel(cid,items){ const f=progSlot('fchat')[cid]; items.forEach(x=>{ const i=x.arr.indexOf(x.l); if(i<0) return; x.arr.splice(i,1); if(x.fc&&f&&i<(f.sumTo||0)) f.sumTo--; }); if(f&&!f.log.length){ f.sum=''; f.sumTo=0; } mark('prog'); }
function roomLastBlock(cid){ const it=roomItems(cid); if(!it.length) return []; let i=it.length-1; while(i>0&&(it[i].k-it[i-1].k)<30*60e3&&it[i].k>1e12&&it[i-1].k>1e12) i--; return it.slice(i); }
async function chatImgB64(k){ try{ const b=await idbGetNS(k); if(!b) return undefined; const s=await shrink(b,1024); const bmp=await createImageBitmap(s), cv=document.createElement('canvas'); cv.width=bmp.width; cv.height=bmp.height; cv.getContext('2d').drawImage(bmp,0,0); const u=cv.toDataURL('image/jpeg',0.85); return [{mime:'image/jpeg',data:u.split(',')[1]}]; }catch(e){ return undefined; } }
/* 대화 사진 저장(Model): 그림 저장소에 넣고 열쇠를 돌려줌 */
async function chatImgStore(b){ const k='chat_'+uid(); await idbPut(IMGNS+k,b); chatImgCache[k]=URL.createObjectURL(b); return k; }
function openThread(tid){ const t=threadById(tid), c=threadChar(t); if(!t||!c||!P().inbox[tid]) return; openRoom(c.id); }
/* 대화방을 읽음(Model) */
function fcRead(f){ f.unread=0; mark('prog'); }
/* 스레드 기록(Model): 말 하나 더하기 · 끝냄(인연 +10) */
function thrLogAdd(s,entry){ entry.at=Date.now(); s.log.push(entry); s.at=entry.at; mark('prog'); }
function thrDone(c,s){ s.done=true; s.at=Date.now(); mark('prog'); if(own(c.id)) addAff(c,10); }
function fcOf(cid){ const f=progSlot('fchat'); return f[cid]||(f[cid]={log:[],sum:'',sumTo:0,at:0}); }
function openFree(cid){ openRoom(cid); }
/* 갠톡 기록(Model): 말 하나 더하기(대화방을 안 보고 있으면 안 읽음) · 답장 뒤 정리(기록 400개까지, 하루 호감도 20까지) · 스레드를 자유 대화로 넘김(끝으로 하고 인연 +10 — 넘겼으면 true) */
function fcLogAdd(f,m,unread){ f.log.push(m); f.at=m.at; if(unread) f.unread=(f.unread||0)+1; mark('prog'); }
function fcAfterReply(c,o,f,r){ if(f.log.length>400) { const cut=f.log.length-400; f.log.splice(0,cut); f.sumTo=Math.max(0,(f.sumTo||0)-cut); }
  const p=P(), d=today(); if(!p.fcAff||p.fcAff.d!==d) p.fcAff={d,n:0}; const add=Math.max(0,Math.min(2,Math.round(+((r&&r.aff)||0)))); if(add&&o&&p.fcAff.n<20){ const a=Math.min(add,20-p.fcAff.n); p.fcAff.n+=a; addAff(c,a); }
  mark('prog'); }
function threadFree(c,tid){ const th=threadById(tid), s0=th&&P().inbox[tid]; if(!th||!s0||s0.done) return false; s0.done=true; s0.freed=true; s0.pos=parseScript(th.script).length; s0.at=Date.now(); if(own(c.id)) addAff(c,10); return true; }
function fcPhotoOn(){ return P().fcPhoto!==false&&imgReady(); }
async function fcSummarize(cid){
  const c=charById(cid), f=fcOf(cid); const end=f.log.length-24, part=f.log.slice(f.sumTo||0,end); if(part.length<20) return;
  try{ const r=await aiJSON(fcSummarizePrompt({c,f,part}),null,'quick'); if(r&&r.summary){ f.sum=String(r.summary).slice(0,1200); f.sumTo=end; mark('prog'); } }catch(e){ quietErr(e,'0100-messenger.js:151'); }
}
/* src/main/0100-messenger/0160-player-profile.js에서 옮김 */
async function heroTags(hr){ const r=await aiJSON(heroTagsPrompt({hr}),null,'quick');
  let tags=String((r&&r.tags)||'').trim(); if(!tags) return '';
  if(hr.hide) tags=joinTags(tagList(tags).filter(t=>!EYE_TAG.test(tagKey(t))).join(', '),'hair over eyes, bangs covering eyes, long bangs');
  return tags; }
