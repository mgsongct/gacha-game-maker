/* ===== 캐릭터 상속 (이격·바리에이션 = 원본 + 수정치) ===== */
/* 이격(c.alt = 원본 id)은 원본과 다른 항목만 c.over에 저장해요(git 패치처럼). 원본을 고치면 이격에서 안 바꾼 항목은 같이 바뀌어요.
   - 상속 항목: inheritKeys(). 이름·그림·외모 프롬프트·에피소드·전용 무기는 이격 자기 것(상속 안 함)
   - 능력치(hp/atk/def/spd)는 절대값이 아니라 원본 대비 가중치(over.statMul)로 저장 → 원본 능력치가 오르면 같이 올라요
   - 저장할 때는 상속 항목을 빼고(inheritStore), 불러올 때·원본을 고칠 때 다시 채워요(inheritApply)
   이 파일은 0070-save.js의 fix()가 불러올 때 쓰므로, 최상위 const 없이 함수 선언만 둬요(호이스팅) */
function inheritKeys(){ return ['faction','elem','role','pos','persona','pfields','rarity','skill','skills','profile','intro','lines','touch','affLines','lvLines','dupLines','files','age','voiceId','voiceName','naiStyle']; }
function inheritStats(){ return ['hp','atk','def','spd']; }
function inheritSame(a,b){ return JSON.stringify(a)===JSON.stringify(b); }
function inheritDiff(c,b){ // 이격 c와 원본 b를 비교해서 다른 것만
  const o={}; for(const k of inheritKeys()) if(k in c&&!inheritSame(c[k],b[k])) o[k]=JSON.parse(JSON.stringify(c[k]??null));
  const m={}; for(const k of inheritStats()){ const x=+c[k], y=+b[k]; if(x&&y&&x!==y) m[k]=Math.round(x/y*10000)/10000; } if(Object.keys(m).length) o.statMul=m;
  return o; }
function inheritApply(c,b){ // 원본 + 수정치 → 이격 전체
  const o=c.over||{};
  for(const k of inheritKeys()) c[k]=JSON.parse(JSON.stringify(k in o?o[k]:(b[k]??null))); for(const k of inheritKeys()) if(c[k]===null&&!(k in o)&&!(k in b)) delete c[k];
  for(const k of inheritStats()) if(b[k]!=null) c[k]=Math.round(+b[k]*((o.statMul||{})[k]||1));
  if(!('skills' in o)&&b.skillBalance) c.skillBalance=JSON.parse(JSON.stringify(b.skillBalance)); // 스킬을 물려받으면 밸런스 검사 결과도 같이
  return c; }
function inheritAll(g){ // 불러올 때: 예전 이격(전체 복사본)은 지금 값 그대로 수정치를 만들어서 바뀌는 것이 없게
  const by=new Map((g.chars||[]).map(c=>[c.id,c])); let changed=false;
  for(const c of g.chars||[]){ const b=c.alt&&by.get(c.alt); if(!b||b.alt) continue;
    if(!c.over||typeof c.over!=='object'){ c.over=inheritDiff(c,b); changed=true; }
    inheritApply(c,b); }
  return changed; }
function inheritStore(c,ids){ // 저장용: 상속 항목은 빼고 수정치만. 원본이 게임에 없으면(지웠으면) 전체를 그대로 저장해요(물려받을 곳이 없으니까)
  if(!c||!c.alt||!c.over||(ids&&!ids.has(c.alt))) return c; const s={...c}; for(const k of [...inheritKeys(),...inheritStats(),'skillBalance']) if(!(k in c.over)||k==='skillBalance') delete s[k]; if(c.over.skills) s.skillBalance=c.skillBalance; return s; }
let INHERIT_SYNC=false;
function inheritOnMark(id){ // mark('c:'+id) 때: 이격을 고쳤으면 수정치 다시 계산, 원본을 고쳤으면 이격들에 반영
  if(INHERIT_SYNC||typeof G==='undefined'||!G) return; const c=G.chars.find(x=>x.id===id); if(!c) return;
  if(c.alt){ const b=G.chars.find(x=>x.id===c.alt); if(b&&!b.alt) c.over=inheritDiff(c,b); return; }
  const alts=G.chars.filter(x=>x.alt===c.id); if(!alts.length) return;
  INHERIT_SYNC=true; try{ for(const a of alts){ if(!a.over) a.over=inheritDiff(a,c); inheritApply(a,c); dirty.add('c:'+a.id); } } finally{ INHERIT_SYNC=false; } }
function inheritReset(c,k){ // 수정치 하나(또는 전부)를 버리고 원본을 따르게
  const b=c&&c.alt&&G.chars.find(x=>x.id===c.alt); if(!b) return; if(k==='*') c.over={}; else if(k&&c.over){ if(inheritStats().includes(k)&&c.over.statMul){ delete c.over.statMul[k]; if(!Object.keys(c.over.statMul).length) delete c.over.statMul; } else delete c.over[k]; }
  inheritApply(c,b); INHERIT_SYNC=true; try{ mark('c:'+c.id); } finally{ INHERIT_SYNC=false; } }
function inheritLabel(k){ return ({faction:'소속',elem:'속성',role:'역할',pos:'포지션',persona:'개성',pfields:'프로필 항목',rarity:'희귀도',skill:'스킬(구형)',skills:'스킬',profile:'프로필',intro:'첫 대사',lines:'대사',touch:'터치 대사',affLines:'호감도 대사',lvLines:'레벨 대사',dupLines:'돌파 대사',files:'기밀 파일',age:'나이',voiceId:'목소리',voiceName:'목소리 이름',naiStyle:'그림체',hp:'체력',atk:'공격',def:'방어',spd:'속도'})[k]||k; }
function inheritHTML(c){ // 캐릭터 화면의 상속 정보
  const b=c&&c.alt&&G.chars.find(x=>x.id===c.alt); if(!b||!c.over) return ''; const o=c.over, keys=Object.keys(o).filter(k=>k!=='statMul'), sm=o.statMul||{};
  const items=[...keys.map(k=>[k,inheritLabel(k)]),...Object.entries(sm).map(([k,v])=>[k,`${inheritLabel(k)} ×${v}`])];
  return `<div class="panel" style="margin:6px 0;padding:8px 10px"><p class="muted" style="margin:0 0 4px;font-size:.82rem">원본 「${esc(b.name)}」을(를) 물려받아요. 원본을 고치면 아래에 없는 항목은 같이 바뀌어요.</p>${items.length?`<div class="row" style="flex-wrap:wrap;gap:4px">${items.map(([k,l])=>`<button class="chip" data-act="inhreset" data-id="${c.id}" data-k="${k}" title="원본 값으로 되돌리기">${esc(l)} ✕</button>`).join('')}<button class="btn sm ghost" data-act="inhreset" data-id="${c.id}" data-k="*">모두 원본 따르기</button></div>`:'<p class="muted" style="margin:0;font-size:.82rem">바꾼 항목 없음 (모두 원본과 같아요)</p>'}</div>`; }
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act="inhreset"]'); if(!el) return; const c=charById(el.dataset.id); if(!c) return; inheritReset(c,el.dataset.k); toast(el.dataset.k==='*'?'모든 항목이 원본을 따라요':`${inheritLabel(el.dataset.k)}: 원본 값으로 되돌렸어요`); if(typeof render==='function') render(); if(typeof closeModal==='function'&&!$('#modal').hidden){ const id=c.id; closeModal(); if(typeof openChar==='function') openChar(id); } });
