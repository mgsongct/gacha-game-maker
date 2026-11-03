/* ===== 건조/영입 (자원 4종 투입식) ===== */
/* 엔진: modules/app/020-construct.js (GGMConstruct). 여기서는 게임 상태·화면·AI 연결만.
   설정: G.meta.construct(바꾼 값만 저장) · G.meta.variants(바리에이션 공통 설정) · 진행: P().cres(자원) · P().cbuild(기록·발견한 레시피) */
const CON_RES=GGMConstruct.RES;
// 특수 레시피(소속·특정 캐릭터 확률 업). 분류 확률은 groups가 정해서 기본은 비워 둬요. 예: {id:'rc_x',name:'새벽 설계',min:[400,400,400,600],effect:{type:'faction',value:'새벽등대',up:3},hint:'부품을 넉넉히'}
const CON_RECIPES=[];
function conMeta(){ const m=G.meta; if(!m.construct||typeof m.construct!=='object') m.construct={on:false}; if(!Array.isArray(m.construct.recipes)) m.construct.recipes=clone(CON_RECIPES); return m.construct; }
function CON(){ const c=GGMConstruct.config(conMeta()); c.groups.forEach(g=>{ const d=GGMConstruct.DEFAULTS.groups.find(x=>x.id===g.id); if(d&&g.name===d.name&&g.match&&ROLE[g.match.role]) g.name=ROLE[g.match.role]; }); return c; } /* 기본 분류 이름(지원·공격·방어)은 이 게임의 역할 이름으로 보여요 */
/* 새 게임을 건조/영입이 켜진 채로 시작: 시작 자원 지급(설정에서 켤 때와 같은 양) */
function conStartNew(ng){ ng.meta.construct=Object.assign({},ng.meta.construct||{},{on:true}); const s=GGMConstruct.config(ng.meta.construct).start; ng.prog.cres=Object.fromEntries(CON_RES.map(k=>[k,s])); ng.prog.cbuild={n:0,found:{},log:[],input:null,started:Date.now()}; }
function conOn(){ return !!(G.meta.construct&&G.meta.construct.on); }
function VARIANTS(){ if(!Array.isArray(G.meta.variants)) G.meta.variants=clone(GGMConstruct.VARIANT_DEFAULTS); return G.meta.variants; }
function CRES(){ const p=P(); if(!p.cres||typeof p.cres!=='object') p.cres={}; CON_RES.forEach(k=>{ if(!(p.cres[k]>=0)) p.cres[k]=0; }); return p.cres; }
function CBUILD(){ const p=P(); if(!p.cbuild||typeof p.cbuild!=='object') p.cbuild={n:0,found:{},log:[],input:null}; return p.cbuild; }
const conGem=()=>`<span style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${rIco('gems')}</span>`;
const conResIcon=k=>`<i class="ricon-t" style="font-style:normal">${['⛽','✴','⬢','⚙'][CON_RES.indexOf(k)]}</i>`;
function conResBar(){ const r=CRES(); return `<div class="row" style="gap:6px;flex-wrap:wrap">${CON_RES.map(k=>`<span class="chip">${conResIcon(k)} ${esc(T(k))} <b>${nf(r[k])}</b></span>`).join('')}<span class="chip">${conGem()} <b>${nf(P().gems)}</b></span></div>`; }

/* 원정(파견) 보상: 시간·인원에 비례해서 건조 자원 2종 */
function conDispReward(hours,need){ const pts=Math.pow(hours,0.85)*(1+0.35*(need-1)), ks=[...CON_RES].sort(()=>Math.random()-.5).slice(0,2), r={}; ks.forEach(k=>{ r[k]=Math.max(10,Math.round(pts*60/10)*10); }); return r; }

/* 바리에이션 후보: 레시피가 맞고, 조건에 맞는 보유 캐릭터 중 아직 그 바리에이션이 없는 캐릭터 */
function conVariantOf(b,tpl){ return G.chars.find(c=>c.alt===b.id&&c.cvar===tpl.id); }
function conTargets(tpl){ return G.chars.filter(c=>!c.alt&&!c.cvar&&own(c.id)&&GGMConstruct.condMatch(tpl.cond,c,{own:own(c.id),affLv:affLv(own(c.id)),cleared:P().cleared})); }
function conVariantChoices(input){ return VARIANTS().filter(t=>t.on!==false&&GGMConstruct.matches(t.recipe,input)).map(tpl=>({tpl,bases:conTargets(tpl).filter(b=>{ const v=conVariantOf(b,tpl); return !(v&&own(v.id)); })})); }
function conPool(){ return G.chars.filter(c=>!c.limited&&!c.cvar&&!c.alt&&castOk(c)).map(c=>({id:c.id,rarity:c.rarity,role:c.role,faction:c.faction,elem:c.elem})); }

async function conMakeVariant(b,tpl){
  const rr=tpl.rarity==='same'||!tpl.rarity?String(b.rarity):String(tpl.rarity); let c=null;
  if(SAMPLE){ try{ c=await aiAltChar(b,`${tpl.name}. ${GGMConstruct.designBrief(b,tpl)}`,rr,null); }catch(e){ c=null; } }
  if(!c){ // AI가 없거나 실패: 원래 캐릭터를 바탕으로 규칙대로 만들어요(이름·외모 태그 + 기본형 의상 태그 + 상징 컬러·아이템)
    const o=clone(b); delete o.id; o.name=`${b.name}(${tpl.name})`; o.naiPrompt=GGMConstruct.variantPrompt(b,tpl); o.rarity=+rr;
    o.profile=`${b.profile||''}\n[${tpl.name}] ${b.name}의 ${tpl.name} 모습.`.trim(); c=cleanChar(o); G.chars.push(c); }
  c.alt=b.id; c.cvar=tpl.id; c.altCanon=false; c.rarity=+rr||b.rarity; c.faction=b.faction||c.faction; if(b.age) c.age=b.age; if(b.voiceId) c.voiceId=b.voiceId; if(b.naiStyle) c.naiStyle=b.naiStyle;
  const want=String(tpl.prompt||'').split(',')[0].trim(); if(want&&!String(c.naiPrompt||'').includes(want)) c.naiPrompt=GGMConstruct.variantPrompt(Object.assign({},b,{naiPrompt:c.naiPrompt||b.naiPrompt}),tpl);
  mark('c:'+c.id); return c; }

let CONJOB=false;
function conReadInput(){ const cfg=CON(); return CON_RES.map((k,i)=>{ const el=$('#con_'+i); return el?+el.value:(CBUILD().input||[])[i]||cfg.min; }); }
async function conBuild(){
  if(CONJOB||NEW_GAME_SOURCE) return; if(appStorage.failed||document.getElementById('save-warning')){ storageWarning('저장을 먼저 복구해 주세요.'); return; }
  const cfg=CON(), input=GGMConstruct.normalize(conReadInput(),cfg), r=CRES(), lack=CON_RES.filter((k,i)=>r[k]<input[i]);
  if(lack.length){ toast(`${lack.map(k=>T(k)).join('·')}이(가) 모자라요`); return; }
  const variants=conVariantChoices(input), res=GGMConstruct.roll(input,cfg,conPool(),variants);
  if(res.kind==='none'){ toast(`${T('construct')}로 나올 ${T('crew')}이(가) 없어요`); return; }
  CONJOB=true;
  try{
    CON_RES.forEach((k,i)=>{ r[k]-=input[i]; }); const B=CBUILD(); B.n++; B.input=input;
    res.info.recipes.forEach(x=>{ if(!B.found[x.id]) { B.found[x.id]=Date.now(); toast(`새 레시피 발견: ${x.name}`); } });
    res.info.groups.filter(g=>g.open&&!B.found['g:'+g.id]).forEach(g=>{ B.found['g:'+g.id]=Date.now(); });
    let c;
    if(res.kind==='variant'){ const key='v:'+res.tpl.id; if(!B.found[key]) B.found[key]=Date.now();
      c=conVariantOf(res.base,res.tpl);
      if(!c){ openModal(`<div class="decode"><div class="dc-ring"></div><div class="dc-ring b"></div><b>${esc(res.base.name)}의 「${esc(res.tpl.name)}」 설계 중…</b><span>새로운 모습을 디자인하고 있어요</span></div>`,true);
        try{ c=await conMakeVariant(res.base,res.tpl); }finally{ closeModal(); } } }
    else c=charById(res.id);
    const got=grantOwned(c,T('construct')); B.log.unshift({id:c.id,at:Date.now(),input,v:res.kind==='variant'?res.tpl.id:''}); B.log=B.log.slice(0,30);
    bump('pull',1); mark('prog'); try{ await flush(); }catch(e){ render(); return; }
    render(); playGacha([got]);
    if(res.kind==='variant'&&imgReady()&&!imgSrc(c)) setTimeout(()=>runPrep(['char'],it=>it.c&&it.c.id===c.id),1500);
  } finally{ CONJOB=false; }
}
function conBuy(k){ const cfg=CON(), p=P(); if(p.gems<cfg.buy.gems){ toast(`${T('currency')}이(가) 모자라요`); return; } pay({gems:cfg.buy.gems}); CRES()[k]+=cfg.buy.amt; mark('prog'); render(); }

function conNeedText(n){ const out=[]; (n.min||[]).forEach((v,i)=>{ if(v>GGMConstruct.DEFAULTS.min&&v>CON().min) out.push(`${T(CON_RES[i])} ${nf(v)}↑`); }); (n.max||[]).forEach((v,i)=>{ if(v!=null) out.push(`${T(CON_RES[i])} ${nf(v)}↓`); }); if(n.total) out.push(`총 ${nf(n.total)}↑`); Object.entries(n.share||{}).forEach(([i,[lo,hi]])=>out.push(`${T(CON_RES[i])} 비율 ${Math.round((lo||0)*100)}~${Math.round((hi==null?1:hi)*100)}%`)); return out.join(' · ')||'조건 없음'; }
function conInfoHTML(input){
  const cfg=CON(), t=GGMConstruct.table(input,cfg,conPool()), i=t.info, B=CBUILD(), vs=conVariantChoices(i.input).filter(v=>v.bases.length), pct=v=>(Math.round(v*10)/10)+'%';
  return `<p style="margin:0 0 6px">총 <b>${nf(i.total)}</b> · 희귀도 캡: SR ${i.open[2]?`<b>개방 ${pct(i.rarity[2])}</b>`:`잠김 <span class="muted">(총 ${nf(cfg.sr.open)}↑)</span>`} · SSR ${i.open[3]?`<b>개방 ${pct(i.rarity[3])}</b>`:`잠김 <span class="muted">(총 ${nf(cfg.ssr.open)}↑)</span>`}</p>
    <div style="font-size:.85rem;margin:0 0 6px">${i.groups.map(g=>`<div style="display:flex;justify-content:space-between;gap:8px;${g.open?'':'opacity:.55'}"><span>${g.open?'🔓':'🔒'} <b>${esc(g.name)}</b> <span class="muted">${esc(conNeedText(g.need))}</span></span><b>${g.open?pct(g.p):'—'}</b></div>`).join('')}</div>
    ${t.rows.length?`<details><summary class="muted" style="font-size:.82rem">이번 투입의 확률 테이블 (${t.rows.length}명)</summary><div style="font-size:.8rem;columns:2;margin-top:4px">${t.rows.map(r=>{ const c=charById(r.id); return c?`<div>${RL[c.rarity]} ${esc(c.name)} <b>${pct(r.p)}</b></div>`:''; }).join('')}</div></details>`:`<p class="muted" style="margin:0">열린 분류에 나올 ${esc(T('crew'))}이(가) 없어요. 다른 분류를 열어 보세요.</p>`}
    ${i.recipes.length?`<p style="margin:6px 0 0">특수 레시피: ${i.recipes.map(x=>B.found[x.id]?`<b>${esc(x.name)}</b>`:'<b>??? (미발견)</b>').join(', ')}</p>`:''}
    ${vs.length?`<p style="margin:4px 0 0">✦ 바리에이션 기회: ${vs.map(v=>`${esc(v.tpl.name)} ${pct(+v.tpl.chance||0)} (${v.bases.length}명)`).join(', ')}</p>`:''}`; }
function conEntryHTML(){ if(!conOn()) return ''; return `<div class="panel" style="margin-bottom:10px;display:flex;gap:10px;align-items:center;justify-content:space-between"><div><b>${esc(T('construct'))}</b><div class="muted" style="font-size:.8rem">${CON_RES.map(k=>esc(T(k))).join('·')}을(를) 넣어 ${esc(T('crew'))}·바리에이션 영입</div></div><button class="btn sm" data-act="go" data-to="construct">열기</button></div>`; }
function constructHTML(){
  if(!conOn()) return pageHead(T('construct'),'CONSTRUCT','contract')+`<div class="panel"><p>설정 → 게임에서 ${esc(T('construct'))}을(를) 켜 주세요.</p></div>`;
  const cfg=CON(), B=CBUILD(), input=GGMConstruct.normalize(B.input||[cfg.min,cfg.min,cfg.min,cfg.min],cfg), found=(cfg.recipes||[]).filter(x=>B.found[x.id]), vfound=VARIANTS().filter(t=>B.found['v:'+t.id]);
  const presets=[['최소',[cfg.min,cfg.min,cfg.min,cfg.min]],['균형',[300,300,300,300]],['고급',[999,999,999,999]],...cfg.groups.filter(g=>B.found['g:'+g.id]).map(g=>[g.name+' 개방',(g.min||[]).map((v,i)=>Math.max(v,cfg.min))]),...found.map(x=>[x.name,x.min]),...vfound.map(t=>['✦'+t.name,t.recipe.min])];
  return `${pageHead(T('construct'),'CONSTRUCT','contract')}${conResBar()}
  <div class="panel" style="margin-top:10px"><h3>자원 투입 <span class="muted" style="font-size:.8rem">(${cfg.min}~${cfg.max})</span></h3>
    ${CON_RES.map((k,i)=>`<label class="f" for="con_${i}">${conResIcon(k)} ${esc(T(k))}</label><div class="row" style="gap:8px;align-items:center"><input type="range" id="con_r${i}" data-con="${i}" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${input[i]}" style="flex:1"><input class="in" type="number" id="con_${i}" data-con="${i}" min="${cfg.min}" max="${cfg.max}" value="${input[i]}" style="width:90px"></div>`).join('')}
    <div class="row" style="margin-top:8px;flex-wrap:wrap">${presets.map(([n,v])=>`<button class="btn sm ghost" data-act="conpreset" data-v="${esc(v.join(','))}">${esc(n)}</button>`).join('')}</div>
    <div id="conInfo" class="panel" style="margin-top:10px">${conInfoHTML(input)}</div>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="conbuild">${esc(T('construct'))} 시작</button></div></div>
  <div class="panel"><h3>자원 보급 <span class="muted" style="font-size:.8rem">${conGem()}${nf(cfg.buy.gems)} → +${nf(cfg.buy.amt)}</span></h3><div class="row" style="flex-wrap:wrap">${CON_RES.map(k=>`<button class="btn sm ghost" data-act="conbuy" data-k="${k}">${conResIcon(k)} ${esc(T(k))} +${nf(cfg.buy.amt)}</button>`).join('')}</div><p class="muted" style="margin:8px 0 0;font-size:.8rem">${esc(T('dispatch'))}을(를) 보내면 건조 자원을 모아 와요.</p></div>
  <div class="panel"><h3>레시피 노트</h3>${found.length||vfound.length?`<ul style="margin:0;padding-left:18px">${found.map(x=>`<li><b>${esc(x.name)}</b> — ${x.min.join(' / ')} 이상</li>`).join('')}${vfound.map(t=>`<li>✦ <b>${esc(t.name)}</b> — ${t.recipe.min.join(' / ')} 이상 · ${esc(t.prompt)}</li>`).join('')}</ul>`:`<p class="muted" style="margin:0">아직 발견한 레시피가 없어요. 자원 비율을 바꿔 보세요.${(cfg.recipes||[]).length?' 힌트: '+cfg.recipes.map(x=>esc(x.hint||'')).filter(Boolean).join(' / '):''}</p>`}</div>
  <div class="panel"><h3>최근 기록</h3>${B.log.length?B.log.slice(0,10).map(l=>{ const c=charById(l.id); return c?`<div class="muted" style="font-size:.85rem">${esc(new Date(l.at).toLocaleString())} · ${l.input.join('/')} → <b>${esc(c.name)}</b> ${RL[c.rarity]}${l.v?' ✦':''}</div>`:''; }).join(''):'<p class="muted" style="margin:0">아직 없어요.</p>'}</div>`; }

/* 설정: 게임 탭의 패널 + 상세 설정 창 */
function conSettingsPanel(){ const on=conOn(), V=VARIANTS();
  return `<div class="panel pm-hide"><h3>${esc(T('construct'))} (자원 투입식) ${on?'<span class="badge">켜짐</span>':''}</h3><p class="muted" style="margin:0 0 10px">${CON_RES.map(k=>esc(T(k))).join('·')} 4종을 넣어 ${esc(T('crew'))}을(를) 영입해요. 투입량으로 등급이 열리고, 비율로 역할 확률이 기울고, 레시피로 ${esc(T('gacha'))}에서 얻은 ${esc(T('crew'))}의 바리에이션(${V.filter(t=>t.on!==false).map(t=>esc(t.name)).join('·')||'없음'})이 열려요. 자원은 ${esc(T('currency'))}으로 사거나 ${esc(T('dispatch'))}으로 모아요.</p>
    <div class="row"><button class="btn sm" data-act="contoggle">${on?'끄기':'켜기'}</button><button class="btn sm ghost" data-act="conset">상세 설정 · 바리에이션</button>${on?'<button class="btn sm ghost" data-act="go" data-to="construct">열기</button>':''}</div></div>`; }
const CON_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']];
function conVariantRow(t,i){ const c=t.cond||{}, st=(c.stats||[])[0]||{}, n=conTargets(t);
  return `<details class="panel" data-vi="${i}" style="margin:8px 0"><summary><b>${esc(t.name)}</b> <span class="muted">· ${t.on===false?'꺼짐':'켜짐'} · ${+t.chance||0}% · 적용 ${n.length}명</span></summary>
  <label style="display:flex;gap:8px;margin:8px 0"><input type="checkbox" data-vf="on" ${t.on!==false?'checked':''}> 사용</label>
  <div class="g2"><div><label class="f">이름(기본형)</label><input class="in" data-vf="name" value="${esc(t.name)}"></div><div><label class="f">확률 % (레시피가 맞고 대상이 있을 때)</label><input class="in" type="number" data-vf="chance" min="0" max="100" value="${+t.chance||0}"></div></div>
  <label class="f">의상 기본형 태그 (NovelAI 영어 태그)</label><input class="in" data-vf="prompt" value="${esc(t.prompt||'')}">
  <label class="f">디자인 추가 지시 (AI용, 선택)</label><input class="in" data-vf="brief" value="${esc(t.brief||'')}">
  <label class="f">레시피: 최소 투입 (${CON_RES.map(k=>esc(T(k))).join(' / ')})</label><input class="in" data-vf="recipe" value="${esc((t.recipe&&t.recipe.min||[]).join(','))}">
  <label class="f">등급</label><select class="in" data-vf="rarity">${[['same','원래 캐릭터와 같게'],['1','R'],['2','SR'],['3','SSR']].map(([v,l])=>`<option value="${v}" ${String(t.rarity||'same')===v?'selected':''}>${l}</option>`).join('')}</select>
  <h4 style="margin:10px 0 4px">적용 조건 <span class="muted" style="font-size:.8rem">(비우면 조건 없음 · 보유한 ${esc(T('crew'))} 중 맞는 캐릭터에 자동 적용)</span></h4>
  <div class="g2"><div><label class="f">소속(쉼표)</label><input class="in" data-vf="factions" value="${esc((c.factions||[]).join(','))}" placeholder="${esc((G.world.factions||[]).map(f=>f.name).join(','))}"></div>
  <div><label class="f">역할</label><div class="row">${Object.keys(ROLE).map(r=>`<label style="display:flex;gap:4px"><input type="checkbox" data-vrole="${r}" ${(c.roles||[]).includes(r)?'checked':''}>${esc(ROLE[r])}</label>`).join('')}</div></div>
  <div><label class="f">속성(쉼표)</label><input class="in" data-vf="elems" value="${esc((c.elems||[]).join(','))}" placeholder="${esc(ELEMS.join(','))}"></div>
  <div><label class="f">능력치</label><div class="row"><select class="in" data-vf="stk"><option value="">없음</option>${CON_STATS.map(([k,l])=>`<option value="${k}" ${st.k===k?'selected':''}>${l}</option>`).join('')}</select><select class="in" data-vf="stop">${['>=','<=','>','<'].map(o=>`<option ${st.op===o?'selected':''}>${o}</option>`).join('')}</select><input class="in" type="number" data-vf="stv" value="${st.v!=null?+st.v:''}" style="width:80px"></div></div>
  <div><label class="f">최소 레벨 · ${esc(T('limit'))} · 호감도</label><div class="row"><input class="in" type="number" data-vf="lv" value="${c.lv||''}" placeholder="Lv"><input class="in" type="number" data-vf="dup" value="${c.dup||''}" placeholder="${esc(T('limit'))}"><input class="in" type="number" data-vf="aff" value="${c.aff||''}" placeholder="호감도"></div></div>
  <div><label class="f">업적: 클리어한 스테이지 id(쉼표)</label><input class="in" data-vf="cleared" value="${esc((c.cleared||[]).join(','))}" placeholder="s11,s12"></div></div>
  <p class="muted" style="margin:8px 0 0;font-size:.8rem">지금 적용 대상: ${n.map(b=>esc(b.name)).join(', ')||'없음'}${n[0]?`<br>예시 이미지 프롬프트(${esc(n[0].name)}): <code style="overflow-wrap:anywhere">${esc(GGMConstruct.variantPrompt(n[0],t))}</code>`:''}</p>
  <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="convdel" data-i="${i}">이 바리에이션 삭제</button></div></details>`; }
let CONV=null; // 설정 창에서 고치는 중인 바리에이션(저장 전에는 게임에 반영 안 됨)
function openConSet(){ CONV=clone(VARIANTS()); const m=conMeta(), cfg=CON(), adv={min:cfg.min,max:cfg.max,step:cfg.step,start:cfg.start,sr:cfg.sr,ssr:cfg.ssr,groups:cfg.groups,recipes:cfg.recipes};
  openModal(`${head(T('construct')+' 설정')}
    <label style="display:flex;gap:8px"><input type="checkbox" id="con_on" ${m.on?'checked':''}> <b>${esc(T('construct'))} 사용</b></label>
    <p class="muted" style="font-size:.8rem;margin:4px 0 10px">자원 이름과 메뉴 이름은 게임 정의 편집 → 용어에서 바꿔요. 켜면 ${esc(T('gacha'))}에서 바리에이션이 빠지고 ${esc(T('construct'))}으로만 열려요.</p>
    <div class="g2"><div><label class="f" for="con_bg">구매 가격 (${esc(T('currency'))})</label><input class="in" type="number" id="con_bg" min="1" value="${cfg.buy.gems}"></div><div><label class="f" for="con_ba">구매량</label><input class="in" type="number" id="con_ba" min="1" value="${cfg.buy.amt}"></div></div>
    <h3 class="sec" style="margin-top:14px">바리에이션 (공통 설정)</h3><p class="muted" style="font-size:.8rem;margin:0">기본형을 정하고 적용 조건을 걸면, 조건에 맞는 캐릭터마다 그 캐릭터의 특징·상징 컬러·상징 아이템(무기)을 반영해 디자인돼요.</p>
    <div id="con_vars">${CONV.map(conVariantRow).join('')}</div><button class="btn sm ghost" data-act="convadd">+ 바리에이션 추가</button>
    <details style="margin-top:12px"><summary>고급 설정 (확률 테이블 JSON)</summary><p class="muted" style="font-size:.8rem">sr/ssr.open: 희귀도 캡이 열리는 총 투입량 · base/grow: 확률(%) · groups: 분류 [{id,name,match:{role|faction|elem},min:[4],max:[4],total,share:{자원번호:[최소비율,최대비율]},weight:{base,res:[4]},maxRarity}] · recipes: 특수 레시피 [{id,name,min:[4],effect:{type:role|faction|char,value,up}}]</p><textarea class="in" id="con_adv" rows="10" style="font-family:monospace;font-size:.78rem">${esc(JSON.stringify(adv,null,1))}</textarea></details>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="consave">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }
function conReadVariants(){ return [...document.querySelectorAll('#con_vars [data-vi]')].map(d=>{ const f=k=>d.querySelector(`[data-vf="${k}"]`), v=k=>String(f(k)?.value||'').trim(), list=k=>v(k).split(',').map(s=>s.trim()).filter(Boolean), old=(CONV||[])[+d.dataset.vi]||{};
  const nums=v('recipe').split(',').map(x=>Math.max(0,+x||0)); while(nums.length<4) nums.push(0);
  const cond={factions:list('factions'),roles:[...d.querySelectorAll('[data-vrole]:checked')].map(x=>x.dataset.vrole),elems:list('elems'),stats:v('stk')?[{k:v('stk'),op:v('stop')||'>=',v:+v('stv')||0}]:[],lv:+v('lv')||0,dup:+v('dup')||0,aff:+v('aff')||0,cleared:list('cleared')};
  return {id:old.id||'v_'+uid(),name:v('name')||'바리에이션',prompt:v('prompt'),brief:v('brief'),chance:Math.min(100,Math.max(0,+v('chance')||0)),recipe:{min:nums.slice(0,4)},rarity:v('rarity')||'same',on:!!f('on')?.checked,cond}; }); }
async function conSave(){ let adv; try{ adv=JSON.parse($('#con_adv').value); }catch(e){ toast('고급 설정 JSON을 확인해 주세요: '+e.message); return; }
  const m=conMeta(), wasOn=m.on; Object.assign(m,adv,{on:$('#con_on').checked,buy:{gems:Math.max(1,+$('#con_bg').value||60),amt:Math.max(1,+$('#con_ba').value||300)}});
  G.meta.variants=conReadVariants();
  if(m.on&&!wasOn&&!CBUILD().started){ CBUILD().started=Date.now(); const r=CRES(), s=CON().start; CON_RES.forEach(k=>{ r[k]+=s; }); toast(`${T('construct')}을(를) 켰어요. 시작 자원 ${nf(s)}씩 드려요`); }
  mark('meta','prog'); closeModal(); render(); }

document.addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  if(a==='conbuild') conBuild();
  else if(a==='conbuy') conBuy(b.dataset.k);
  else if(a==='conpreset'){ const v=b.dataset.v.split(',').map(Number); v.forEach((x,i)=>{ const n=$('#con_'+i), r=$('#con_r'+i); if(n) n.value=x; if(r) r.value=x; }); const info=$('#conInfo'); if(info) info.innerHTML=conInfoHTML(GGMConstruct.normalize(v,CON())); CBUILD().input=GGMConstruct.normalize(v,CON()); }
  else if(a==='contoggle'){ if(conOn()){ conMeta().on=false; mark('meta'); render(); } else openConSet(); }
  else if(a==='conset') openConSet();
  else if(a==='consave') conSave();
  else if(a==='convadd'){ CONV=[...conReadVariants(),{id:'v_'+uid(),name:'새 바리에이션',prompt:'',brief:'',chance:30,recipe:{min:[200,200,200,400]},rarity:'same',on:true,cond:{}}]; $('#con_vars').innerHTML=CONV.map(conVariantRow).join(''); }
  else if(a==='convdel'){ CONV=conReadVariants(); CONV.splice(+b.dataset.i,1); $('#con_vars').innerHTML=CONV.map(conVariantRow).join(''); } });
document.addEventListener('input',e=>{ const i=e.target.dataset&&e.target.dataset.con; if(i==null) return; const v=e.target.value; const n=$('#con_'+i), r=$('#con_r'+i); if(n&&n!==e.target) n.value=v; if(r&&r!==e.target) r.value=v;
  const input=GGMConstruct.normalize(conReadInput(),CON()), info=$('#conInfo'); if(info) info.innerHTML=conInfoHTML(input); CBUILD().input=input; });
