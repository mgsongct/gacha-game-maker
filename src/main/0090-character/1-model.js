/* ===== 0090-character — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0090-character/0065-inherit.js에서 옮김 */
/* 이격(c.alt = 원본 id)은 원본과 다른 항목만 c.over에 저장해요(git 패치처럼). 원본을 고치면 이격에서 안 바꾼 항목은 같이 바뀌어요.
   - 상속 항목: inheritKeys(). 이름·그림·외모 프롬프트·에피소드·전용 무기는 이격 자기 것(상속 안 함)
   - 능력치(hp/atk/def/spd)는 절대값이 아니라 원본 대비 가중치(over.statMul)로 저장 → 원본 능력치가 오르면 같이 올라요
   - 저장할 때는 상속 항목을 빼고(inheritStore), 불러올 때·원본을 고칠 때 다시 채워요(inheritApply)
   이 파일은 0070-save.js의 fix()가 불러올 때 쓰므로, 최상위 const 없이 함수 선언만 둬요(호이스팅) */
function inheritKeys(){ return ['faction','elem','role','pos','persona','pfields','rarity','skill','skills','skillPlan','profile','intro','lines','touch','affLines','lvLines','dupLines','files','age','voiceId','voiceName','naiStyle']; }
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
function inheritOnMark(id){ // mark('c:'+id) 때: 이격을 고쳤으면 수정치 다시 계산, 원본을 고쳤으면 이격들에 반영
  if(INHERIT_SYNC||typeof G==='undefined'||!G) return; const c=G.chars.find(x=>x.id===id); if(!c) return;
  if(c.alt){ const b=G.chars.find(x=>x.id===c.alt); if(b&&!b.alt) c.over=inheritDiff(c,b); return; }
  const alts=G.chars.filter(x=>x.alt===c.id); if(!alts.length) return;
  INHERIT_SYNC=true; try{ for(const a of alts){ if(!a.over) a.over=inheritDiff(a,c); inheritApply(a,c); dirty.add('c:'+a.id); } } finally{ INHERIT_SYNC=false; } }
function inheritReset(c,k){ // 수정치 하나(또는 전부)를 버리고 원본을 따르게
  const b=c&&c.alt&&G.chars.find(x=>x.id===c.alt); if(!b) return; if(k==='*') c.over={}; else if(k&&c.over){ if(inheritStats().includes(k)&&c.over.statMul){ delete c.over.statMul[k]; if(!Object.keys(c.over.statMul).length) delete c.over.statMul; } else delete c.over[k]; }
  inheritApply(c,b); INHERIT_SYNC=true; try{ mark('c:'+c.id); } finally{ INHERIT_SYNC=false; } }
function inheritLabel(k){ return ({faction:'소속',elem:'속성',role:'역할',pos:'포지션',persona:'개성',pfields:'프로필 항목',rarity:'희귀도',skill:'스킬(구형)',skills:'스킬',skillPlan:'스킬 설계 의도',profile:'프로필',intro:'첫 대사',lines:'대사',touch:'터치 대사',affLines:'호감도 대사',lvLines:'레벨 대사',dupLines:'돌파 대사',files:'기밀 파일',age:'나이',voiceId:'목소리',voiceName:'목소리 이름',naiStyle:'그림체',hp:'체력',atk:'공격',def:'방어',spd:'속도'})[k]||k; }
/* src/main/0090-character/0090-growth.js에서 옮김 */
function own(id){return P().owned[id];}
function rewardText(r){const p=[];if(r.gems)p.push(`◆${nf(r.gems)} ${T('currency')}`);if(r.gold)p.push(`${T('gold')} ${nf(r.gold)}`);if(r.exp)p.push(`${T('expMat')} ${nf(r.exp)}`);if(r.wmat)p.push(`${T('wMat')} ${nf(r.wmat)}`);if(r.core)p.push(`${T('core')} ${nf(r.core)}`);if(r.gearMat)p.push(`${T('gearMat')} ${nf(r.gearMat)}`);if(r.transcMat)p.push(`${T('transcMat')} ${nf(r.transcMat)}`);['res1','res2','res3','res4'].forEach(k=>{if(r[k])p.push(`${T(k)} ${nf(r[k])}`);});if(r.token)p.push(`${r.tokenName||'토큰'} ${nf(r.token)}`);if(r.gift)p.push(`선물 ${r.gift}개`);return p.join(', ');}
/* 획득량 배율(설정 → 게임): 전투·소탕·파견·일일 보급으로 '버는' 보상에만 곱해요(상점 구매는 그대로) */
function rateR(r){ const s=P().settings, o=Object.assign({},r), m=(k,x)=>{ if(typeof o[k]==='number') o[k]=Math.max(0,Math.round(o[k]*x/100)); };
  m('gold',s.goldRate||100); m('gems',s.gemRate||100); ['exp','wmat','core','gearMat','transcMat'].forEach(k=>m(k,s.expRate||100)); return o; }
function stamOn(){ return P().settings.stamina!==false; }
/* 행동력 회복 규칙: 마지막 회복 뒤 STAM_MS마다 1씩 cap까지, 가득 차 있으면 시각만 지금으로 — 진행 칸 stam의 정의(0070 PROG_SLOTS)가 부름 */
function stamRegen(s,cap){ const now=Date.now(); if(s.v>=cap){ s.at=now; return s; } const n=Math.floor((now-s.at)/STAM_MS); if(n>0){ s.v=Math.min(cap,s.v+n); s.at=s.v>=cap?now:s.at+n*STAM_MS; } return s; }
function stamCost(kind){ return kind==='main'||kind==='event'?10:kind==='farm'?8:0; }
function stamUse(n){ if(!stamOn()||!n) return true; const s=progSlot('stam'); if(s.v<n){ openStam(n); return false; } s.v-=n; mark('prog'); updStam(); return true; }
function giveReward(r,evId){const p=P();if(r.gift)addGifts(r.gift);if(r.gems)p.gems+=r.gems;if(r.gold)p.gold+=r.gold;['exp','wmat','core','gearMat','transcMat'].forEach(k=>{if(r[k])p.mat[k]=(p.mat[k]||0)+r[k];});['res1','res2','res3','res4'].forEach(k=>{if(r[k]){const c=progSlot('cres');c[k]=(c[k]||0)+r[k];}});if(r.token&&evId)p.tokens[evId]=(p.tokens[evId]||0)+r.token;mark('prog');}
function bump(k,n){const d=progSlot('dm');d.cnt[k]=(d.cnt[k]||0)+(n||1);mark('prog');}
function passReward(l){return l%10===0?{gems:1000}:l%5===0?{core:10}:l%3===0?{wmat:15}:l%2===0?{exp:30}:{gold:8000};}
function passClaimable(){const n=passLv();let k=0;for(let l=1;l<=n;l++)if(!P().pass.got.includes(l))k++;return k+MISSIONS.filter(m=>(progRead('dm').cnt[m.k]||0)>=m.goal&&!progRead('dm').got[m.k]).length;}
/* 강화·돌파 전에 드는 재료와 결과를 보여 주고 확인받아요 */
function upPlan(c,k){ const o=own(c.id), p=P(); if(!o) return null;
  if(k==='enh'||k==='enhmax'){ const o2={...o}; let e=p.mat.exp,g=p.gold,ue=0,ug=0;
    while(o2.lv<levelCap(o)){ const need=Math.ceil((GGMCombat.levelExperience(o2.lv)-o2.exp)/100), gold=need*100; if(e<need||g<gold){ if(!ue){ ue=need; ug=gold; } break; } e-=need; g-=gold; ue+=need; ug+=gold; gainExp(o2,need*100); if(k==='enh') break; }
    const capped=o.lv>=levelCap(o);
    return {title:k==='enh'?T('enhance'):T('enhance')+' MAX',from:'Lv.'+o.lv,to:'Lv.'+o2.lv,ok:!capped&&o2.lv>o.lv,note:capped?`레벨 상한이에요. ${o.lv>=70?'초월 승급':'승급'}하면 상한이 올라가요`:'',
      cost:[[T('expMat'),ue,p.mat.exp],[T('gold'),ug,p.gold]]}; }
  if(k==='lb'){ const cost=GGMCombat.limitBreakCost(o.dup), cap0=levelCap(o), cap1=(()=>{ const x={...o,dup:o.dup+1}; return levelCap(x); })(), f=(c.files||[]).find(x=>x.dup===o.dup+1);
    return {title:'승급',from:o.dup+'단계',to:Math.min(5,o.dup+1)+'단계',ok:o.dup<5&&p.mat.core>=cost,note:o.dup>=5?'최대 '+T('limit')+'예요':`레벨 상한 ${cap0} → ${cap1}${f?' · '+T('files')+' 공개':''}${o.dup===4?' · '+T('limit')+' CG 공개':''}`,cost:o.dup>=5?[]:[[T('core'),cost,p.mat.core]]}; }
  if(k==='transc'){ const n=Math.min(5,Math.max(0,o.transc||0)),cap=levelCap(o),cost=GGMCombat.limitBreakCost(n);return {title:'초월 승급',from:'상한 '+cap,to:'상한 '+Math.min(120,cap+10),ok:o.lv>=70&&n<5&&cap<120&&(p.mat.transcMat||0)>=cost,note:o.lv<70?'먼저 캐릭터를 70레벨까지 강화해 주세요.':cap>=120?'최대 레벨은 120이에요.':'단계마다 상한이 10 올라가요. 레벨은 경험치로 별도 강화해요.',cost:cap>=120?[]:[[T('transcMat'),cost,p.mat.transcMat||0]]}; }
  if(k==='wup'){ const {materials:wm,gold}=GGMCombat.equipmentUpgradeCost(o.wlv);
    return {title:(c.weapon.name||T('weapon'))+' 강화',from:o.wlv?o.wlv+'단계':'잠김',to:Math.min(5,o.wlv+1)+'단계',ok:o.wlv<5&&p.mat.wmat>=wm&&p.gold>=gold,note:o.wlv>=5?'최대 단계예요':'',cost:o.wlv>=5?[]:[[T('wMat'),wm,p.mat.wmat],[T('gold'),gold,p.gold]]}; }
  return null; }
function seenText(){ const p=P(), k=Object.keys(p.cleared||{}).length+'|'+Object.keys(p.owned||{}).length+'|'+(p.seenOpening?1:0); if(k===SEEN_K) return SEEN_T;
  const L=[p.seenOpening&&G.opening?String(G.opening.prologue||''):'']; G.chapters.forEach(ch=>ch.stages.forEach(s=>{ if(p.cleared[s.id]) L.push(s.pre||'',s.post||''); }));
  G.chars.forEach(c=>{ if(p.owned[c.id]) L.push(c.name); }); SEEN_K=k; SEEN_T=L.join('\n'); return SEEN_T; }
function spoilFree(c,arr){ arr=arr||[]; if(!arr.length) return arr; const seen=seenText(), self=c&&c.name;
  const unseen=[...G.chars,...(G.npcs||[])].map(x=>x.name).filter(n=>n&&n.length>=2&&n!==self&&!seen.includes(n)); if(!unseen.length) return arr;
  return arr.filter(l=>!unseen.some(n=>String(l).includes(n))); }
function affLinePool(c){ return spoilFree(c,affLinePool0(c)); }
function pickTouchLine(pool,current=''){
  const lines=(Array.isArray(pool)?pool:[]).filter(l=>typeof l==='string'&&sub(l).trim());
  const different=lines.filter(l=>sub(l)!==String(current??''));
  // All generated/skin lines can resolve to the same text. Never retry until
  // different: use a bounded selection, keeping original lines for speech.
  return rand(different.length?different:lines)||'…';
}
function affLinePool0(c){const o=own(c.id),lv=affLv(o),k=skinOf(c);let pool=k&&(k.lines||[]).length?[...k.lines,...k.lines,...c.lines]:[...c.lines];Object.entries(c.affLines||{}).forEach(([k,v])=>{if(lv>=+k)pool.push(...(v||[]));});if(typeof memoOn==='function'&&memoOn(c))pool.push(...c.memorial.lines,...c.memorial.lines);return pool;} // 메모리얼 로비를 켜면 메모리얼 대사가 자주 나와요
function affLv(o){return Math.min(10,Math.floor((o?.aff||0)/GGMCombat.AFFINITY.step)+1);}
function affFull(o){return !!o&&(o.aff||0)>=AFF_MAX;}
function stats(c){v2ApplyRoleSpeed(c);const o=own(c.id)||{lv:1,dup:0,wlv:0};const m=(1+0.06*(o.lv-1))*(1+0.08*o.dup)*(RMUL[c.rarity]||1);return {hp:Math.round(c.hp*m*(1+0.03*(o.wlv||0))),atk:Math.round(c.atk*m*(1+0.06*(o.wlv||0))),def:Math.round(c.def*m),spd:c.spd};}
function gainExp(o,x){o.exp+=x;while(o.lv<levelCap(o)&&o.exp>=GGMCombat.levelExperience(o.lv)){o.exp-=GGMCombat.levelExperience(o.lv);o.lv++;}if(o.lv>=levelCap(o))o.exp=Math.min(o.exp,GGMCombat.levelExperience(o.lv)-1);}
function stageCode(id){const m=mainStages().find(s=>s.id===id);if(m)return m.code;let ei=0;for(const ch of G.chapters){if(ch.kind==='main')continue;ei++;const si=ch.stages.findIndex(s=>s.id===id);if(si>=0)return `EV${ei}-${si+1}`;}return '?';}
/* src/main/0090-character/0130-gift.js에서 옮김 */
function addGifts(n){ const inv=progSlot('gifts'), got=[]; for(let i=0;i<n;i++){ const w=GIFTS.map(g=>g[3]>=50?1:g[3]>=30?3:5), tot=w.reduce((a,b)=>a+b,0); let x=Math.random()*tot, k=0; while((x-=w[k])>0) k++; const id=GIFTS[k][0]; inv[id]=(inv[id]||0)+1; got.push(id); } mark('prog'); return got; }
function giftLikes(c){ const h=hashN(c.id+'likes'); const a=h%GIFTS.length, b=(Math.floor(h/7)+3)%GIFTS.length; return new Set([GIFTS[a][0],GIFTS[b===a?(b+1)%GIFTS.length:b][0]]); }
/* src/main/0090-character/0200-skin-shop.js에서 옮김 */
function skinShopList(){ return G.chars.flatMap(c=>(c.skins||[]).filter(k=>k.shop).map(k=>({c,k}))).sort((a,b)=>(b.k.at||0)-(a.k.at||0)); }
function skinPeriodKey(){ const L=P().live, se=L.on.season&&L.season; return se&&se.start?'season:'+se.start:cycKey('rotate'); }
/* src/main/0090-character/0270-skin-proposal.js에서 옮김 */
async function skinLinesAI(c,k,rep){ const r=await aiJSON(skinLinesAIPrompt({c,k}),rep,'quick');
  if(r&&Array.isArray(r.lines)){ k.lines=r.lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,8); if(r.intro) k.intro=String(r.intro).slice(0,120); mark('c:'+c.id); return k.lines.length; } return 0; }
/* src/main/0090-character/0455-persona.js에서 옮김 */
function PERSONA_CFG(){ const d={tpl:PROFILE_TPLS.basic,affLv:[2,4,6,8],memoLv:8}; return Object.assign(d,G.meta.persona||{}); }
function personaClean(p){ p=p&&typeof p==='object'?p:{}; const o={}; for(const [k,,t] of PERSONA_FIELDS){ const v=t==='list'?pStrs(p[k]):String(p[k]||'').trim().slice(0,80); if(t==='list'?v.length:v) o[k]=v; } return o; }
function pfieldsClean(f){ const o={}; Object.entries(f&&typeof f==='object'?f:{}).slice(0,16).forEach(([k,v])=>{ k=String(k).trim().slice(0,16); v=String(v||'').trim().slice(0,80); if(k&&v) o[k]=v; }); return o; }
/* 개성 검수: 점수(0~100)와 고칠 점. 빠진 항목·흔한 성격·다른 캐릭터와 겹침·대사에 말투가 안 드러남·호감도 콘텐츠 */
function personaReview(c){ const p=c.persona||{}, issues=[], add=(w,k,msg)=>issues.push({w,k,msg});
  const core=[['traits',12],['ending',10],['gap',10],['flaw',8],['want',6],['catch',6],['self',5],['quirk',5],['likes',4],['fear',4],['dislikes',2],['hobby',2],['motif',2],['call',2]];
  core.forEach(([k,w])=>{ const v=p[k]; if(!(Array.isArray(v)?v.length:v)) add(w,k,`${(PERSONA_FIELDS.find(f=>f[0]===k)||[])[1]} 없음`); });
  if((p.traits||[]).length&&p.traits.every(t=>PERSONA_GENERIC.test(t.replace(/\s/g,'')))) add(8,'traits','성격 키워드가 흔해요(예: 밝음·친절). 구체적인 습관이나 반전 매력과 짝지으세요');
  const others=G.chars.filter(x=>x!==c&&!x.alt&&x.persona);
  others.forEach(x=>{ const q=x.persona; if(p.ending&&q.ending&&p.ending===q.ending&&(p.self||'')===(q.self||'')) add(8,'ending',`말투(1인칭·어미)가 ${x.name}와(과) 같아요`);
    const A=new Set(p.traits||[]), B=new Set(q.traits||[]); if(A.size&&B.size){ const inter=[...A].filter(t=>B.has(t)).length; if(inter/Math.min(A.size,B.size)>=.67) add(6,'traits',`성격이 ${x.name}와(과) 많이 겹쳐요`); }
    if(p.catch&&q.catch&&p.catch===q.catch) add(5,'catch',`대표 대사가 ${x.name}와(과) 같아요`); });
  const toks=[...String(p.ending||'').split(/[,/·]/),p.quirk,p.catch].map(s=>String(s||'').replace(/[~…."'「」]/g,'').trim()).filter(s=>s.length>=1), lines=(c.lines||[]).concat(Object.values(c.affLines||{}).flat());
  if(toks.length&&lines.length>=3&&!lines.some(l=>toks.some(t=>String(l).includes(t)))) add(8,'lines','대사에 말투(어미·말버릇·대표 대사)가 드러나지 않아요');
  if((c.lines||[]).length<4) add(4,'lines','평소 대사가 적어요(4개 이상 권장)');
  if(!affThreads(c).length) add(6,'afftalk','호감도에 따라 열리는 인연 톡이 없어요');
  if(!c.memorial||!c.memorial.script) add(4,'memorial','메모리얼이 없어요');
  if(!(c.episodes||[]).length) add(3,'episode','인연 스토리(에피소드)가 없어요');
  const score=Math.max(0,Math.round(100-issues.reduce((a,x)=>a+x.w,0)));
  return {score,issues,grade:score>=85?'S':score>=70?'A':score>=55?'B':score>=40?'C':'D'}; }
/* AI: 개성 채우기·다듬기(mode fill|improve), 대사도 말투에 맞게 다시 쓰기(lines) */
async function personaAI(c,mode='fill',opt={}){
  const cfg=PERSONA_CFG(), others=G.chars.filter(x=>x!==c&&!x.alt&&x.persona).slice(0,12).map(x=>`${x.name}: ${personaBrief(x)}`).join(' / ');
  const r=await aiJSON(personaAIPrompt({c,mode,others,opt,cfg}),uiProg(opt.btn),'default');
  if(!r||!r.persona) return false;
  c.persona=Object.assign({},mode==='fill'?personaClean(r.persona):{},mode==='fill'?personaClean(c.persona):{},mode==='improve'?personaClean(r.persona):{});
  c.pfields=Object.assign({},pfieldsClean(r.pfields),mode==='fill'?pfieldsClean(c.pfields):{});
  if(opt.lines){ const L=strs(r.lines); if(L.length>=3) c.lines=L.slice(0,12); if(r.affLines&&typeof r.affLines==='object'){ const a={...(c.affLines||{})}; Object.entries(r.affLines).forEach(([k,v])=>{ const n=parseInt(k,10); if(n>=1&&n<=10&&strs(v).length) a[n]=strs(v).slice(0,4); }); c.affLines=a; } }
  mark('c:'+c.id); return true; }
async function personaAIReview(c,rep){ const r=await aiJSON(personaAIReviewPrompt({c}),rep,'quick'); if(!r) return null; c.personaAIReview={at:Date.now(),score:Math.max(0,Math.min(100,+r.score||0)),strengths:strs(r.strengths).slice(0,4),weaknesses:strs(r.weaknesses).slice(0,4),suggestions:strs(r.suggestions).slice(0,5)}; mark('c:'+c.id); return c.personaAIReview; }
/* 메모리얼: 호감도 memoLv에서 열리는 특별 장면 + 메모리얼 로비 대사 */
async function memorialGen(c,rep){ const cfg=PERSONA_CFG(); const r=await aiJSON(memorialGenPrompt({c,cfg}),rep,'default'); if(!r||!r.script) return false;
  c.memorial={lv:+cfg.memoLv||8,title:String(r.title||'메모리얼').slice(0,30),script:String(r.script),lines:strs(r.lines).slice(0,6)}; mark('c:'+c.id); return true; }
function memoOpen(c){ const o=own(c.id); return !!(c.memorial&&c.memorial.script&&o&&affLv(o)>=(+c.memorial.lv||8)); }
function memoOn(c){ return !!((P().memoOn||{})[c.id]&&memoOpen(c)); }
