/* ===== 0300-world — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0300-world/0300-codex.js에서 옮김 */
/* 도감 기록 보기(Controller): 잠겼으면 알림, 열렸으면 본 것으로 하고 카드의 새 표시를 지운 뒤 창 */
function openCx(key){
  const e=cxEntries().find(x=>x.key===key); if(!e) return;
  if(!e.open){ toast(cxLockText(e.unlock)||'아직 잠겨 있어요'); return; }
  cxMarkSeen(key); cxCardSeenShow(key); openModal(cxViewHTML(e,key));
}
/* src/main/0300-world/0445-factions.js에서 옮김 */
function fwRead(){ const F=factionSync(), lines=v=>String(v||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(x=>x[0]);
  document.querySelectorAll('#modal [data-fw]').forEach(el=>{ const k=el.dataset.fw.split('.'), v=el.type==='checkbox'?el.checked:el.value;
    if(k[0]==='cast'){ G.meta.cast=Object.assign({},G.meta.cast,{[k[1]]:v}); return; }
    if(k[0]==='m'){ const l=G.lib.find(x=>x.id===k[1]); if(l){ l[k[2]]=String(v).trim(); mark('l:'+l.id); } return; }
    if(k[0]==='c'){ const c=charById(k[1]); if(c&&(c.debut||'')!==v){ if(v) c.debut=v; else delete c.debut; mark('c:'+c.id); } return; }
    const f=F[+k[1]]; if(!f) return;
    if(k[2]==='rel'){ f.rel={}; lines(v).forEach(([a,b])=>{ if(a&&a!==f.name) f.rel[a]=b||''; }); }
    else if(k[2]==='stance'){ f.stance=lines(v).map(([ch,s,why])=>({ch:Math.max(1,+ch||1),s:FSTANCE[s]?s:'neutral',why:why||''})); }
    else if(k[2]==='name'){ const n=String(v).trim(); if(n&&n!==f.name){ const old=f.name; G.chars.forEach(c=>{ if(c.faction===old){ c.faction=n; mark('c:'+c.id); } }); F.forEach(o=>{ if(o.rel[old]!=null){ o.rel[n]=o.rel[old]; delete o.rel[old]; } }); f.name=n; } }
    else f[k[2]]=String(v).trim(); }); mark('world','meta'); }
/* src/main/0300-world/0450-relations-memory.js에서 옮김 */
async function relSeedAI(rep){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return 0; }
  const r=await aiJSON(relSeedAIPrompt(),rep,'default');
  const n=r?relApply(r.relations,'정리'):0; return n; }
