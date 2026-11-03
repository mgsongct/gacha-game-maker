/* 건조/영입 엔진 — 순수 함수(DOM·G 없음). 문서: docs/research/construction.md
   완전 확률형(가챠)이 아니라, 투입한 자원으로 "확률 테이블"이 만들어져요:
   1) 분류(group)마다 개방 조건(자원별 최소·최대, 총량, 비율 범위)이 있고, 조건을 넘은 분류만 테이블에 들어가요(캡 해제)
   2) 열린 분류의 비중 = base + Σ(계수 × 투입량)  → 넣은 자원의 양·비율로 분류 확률이 정해져요
   3) 희귀도 캡: 총량이 기준을 넘어야 SR·SSR이 열리고, 열린 뒤 총량에 비례해 확률이 올라요(분류마다 최대 희귀도 제한 가능)
   4) 특수 레시피(최소 투입 조건)로 소속·캐릭터 확률 업, 바리에이션 템플릿 레시피로 바리에이션 개방 */
(function(root){'use strict';
const RES=['res1','res2','res3','res4'];
const DEFAULTS={on:false,min:30,max:999,step:10,start:600,
 // 희귀도 캡: 총 투입량 기준. SR은 sr.open 이상, SSR은 ssr.open 이상. 열린 뒤 총량이 늘수록 base → base+grow 까지 선형
 sr:{open:800,base:18,grow:22},ssr:{open:2000,base:3,grow:7},
 // 분류: match(역할·소속·속성) · 개방 조건 min/max(자원별)·total·share(자원 번호:[최소비율,최대비율]) · 비중 weight{base,res[4]} · maxRarity
 groups:[
  {id:'g_sup',name:'지원',match:{role:'sup'},min:[30,30,30,30],weight:{base:10,res:[.1,0,0,.02]}},
  {id:'g_atk',name:'공격',match:{role:'atk'},min:[30,100,30,30],weight:{base:10,res:[0,.1,0,.02]}},
  {id:'g_def',name:'방어',match:{role:'def'},min:[30,30,100,30],weight:{base:10,res:[0,0,.1,.02]}}],
 buy:{gems:60,amt:300},
 recipes:[]};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function config(c){const d=JSON.parse(JSON.stringify(DEFAULTS)),o=c&&typeof c==='object'?c:{};const r=Object.assign(d,o);
 r.sr=Object.assign({},DEFAULTS.sr,o.sr||{});r.ssr=Object.assign({},DEFAULTS.ssr,o.ssr||{});r.buy=Object.assign({},DEFAULTS.buy,o.buy||{});
 r.min=clamp(+r.min||30,1,99999);r.max=clamp(+r.max||999,r.min,99999);if(!Array.isArray(r.recipes))r.recipes=[];
 if(!Array.isArray(r.groups)||!r.groups.length)r.groups=JSON.parse(JSON.stringify(DEFAULTS.groups));return r;}
function normalize(input,cfg){return RES.map((k,i)=>clamp(Math.round(+((Array.isArray(input)?input[i]:input?.[k]))||0),cfg.min,cfg.max));}
function matches(rule,input){ // rule: {min:[a,b,c,d], max?:[...]} — 모든 자원이 min 이상(그리고 max 이하)
 if(!rule||!Array.isArray(rule.min))return false;return input.every((v,i)=>v>=(+rule.min[i]||0)&&(!Array.isArray(rule.max)||rule.max[i]==null||v<=+rule.max[i]));}
function groupOpen(g,r,total,share){ // 분류 개방 조건(캡 해제)
 if(!matches({min:g.min||[0,0,0,0],max:g.max},r))return false;if(g.total&&total<+g.total)return false;
 for(const[i,[lo,hi]]of Object.entries(g.share||{}))if(share[i]<(+lo||0)||share[i]>(hi==null?1:+hi))return false;return true;}
function rates(input,c){
 const cfg=config(c),r=normalize(input,cfg),total=r.reduce((a,b)=>a+b,0),share=r.map(v=>v/total),top=cfg.max*4;
 const lin=(t,o)=>total<t.open?0:t.base+t.grow*clamp((total-t.open)/Math.max(1,top-t.open),0,1);
 const ssr=lin(cfg.ssr),sr=Math.min(100-ssr,lin(cfg.sr));
 const groups=cfg.groups.map(g=>{const open=groupOpen(g,r,total,share),w=open?Math.max(0,(+g.weight?.base||0)+r.reduce((a,v,i)=>a+v*(+(g.weight?.res||[])[i]||0),0)):0;return {id:g.id,name:g.name,match:g.match||{},maxRarity:+g.maxRarity||3,open,w,need:{min:g.min,max:g.max,total:g.total,share:g.share}};});
 const W=groups.reduce((a,g)=>a+g.w,0);groups.forEach(g=>{g.p=W>0?g.w/W*100:0;});
 const recipes=cfg.recipes.filter(x=>x&&x.on!==false&&matches(x,r));
 return {input:r,total,share,rarity:{3:ssr,2:sr,1:100-ssr-sr},groups,recipes,open:{2:total>=cfg.sr.open,3:total>=cfg.ssr.open}};}
const inGroup=(p,m)=>(!m.role||p.role===m.role)&&(!m.faction||p.faction===m.faction)&&(!m.elem||p.elem===m.elem);
// 이번 투입의 최종 확률 테이블: 분류 확률 × (그 분류 안의 희귀도 확률, 최대 희귀도 제한 반영) → 캐릭터별 확률. 후보가 없는 칸은 같은 분류의 다른 희귀도로 옮겨요
function table(input,c,pool){
 const info=rates(input,c),rows=new Map(),add=(p,v)=>rows.set(p.id,(rows.get(p.id)||0)+v);
 const up=p=>info.recipes.reduce((m,rc)=>{const e=rc.effect||{};return m*((e.type==='faction'&&e.value===p.faction)||(e.type==='char'&&e.value===p.id)||(e.type==='role'&&e.value===p.role)?Math.max(1,+e.up||2):1);},1);
 for(const g of info.groups.filter(g=>g.p>0)){
  const mem=pool.filter(p=>inGroup(p,g.match)),rar=[3,2,1].filter(k=>k<=g.maxRarity&&(k===1||info.open[k])),pr={};let left=0;
  for(const k of rar)pr[k]=k===1?100-rar.filter(x=>x>1).reduce((a,x)=>a+info.rarity[x],0):info.rarity[k];
  const has=k=>mem.some(p=>p.rarity===k),avail=rar.filter(has);if(!avail.length)continue;
  for(const k of rar)if(!has(k)){left+=pr[k];pr[k]=0;}
  const sum=avail.reduce((a,k)=>a+pr[k],0);for(const k of avail){const share=sum>0?pr[k]/sum*(sum+left):(100/avail.length),m=mem.filter(p=>p.rarity===k),U=m.reduce((a,p)=>a+up(p),0);for(const p of m)add(p,g.p*share/100*up(p)/U);}}
 const S=[...rows.values()].reduce((a,b)=>a+b,0);
 return {info,rows:[...rows].map(([id,v])=>({id,p:S>0?v/S*100:0})).sort((a,b)=>b.p-a.p)};}
function weighted(items,weight,rng){const w=items.map(weight),s=w.reduce((a,b)=>a+b,0);if(!(s>0))return items[Math.floor(rng()*items.length)];let x=rng()*s;for(let i=0;i<items.length;i++){x-=w[i];if(x<0)return items[i];}return items[items.length-1];}
/* roll: pool = 건조로 나올 수 있는 캐릭터들 [{id,rarity,role,faction}], variants = 이번 투입으로 열린 바리에이션 후보 [{tpl, bases:[...]}] */
function roll(input,c,pool,variants,rng=Math.random){
 const t=table(input,c,pool),info=t.info;
 for(const v of variants||[])if(v.bases.length&&rng()*100<(+v.tpl.chance||0))return {kind:'variant',tpl:v.tpl,base:v.bases[Math.floor(rng()*v.bases.length)],info,table:t};
 if(!t.rows.length)return {kind:'none',info,table:t};
 const pick=weighted(t.rows,x=>x.p,rng),p=pool.find(x=>x.id===pick.id);
 return {kind:'char',id:pick.id,rarity:p.rarity,info,table:t};}
/* 바리에이션 적용 조건: 비어 있는 항목은 조건 없음. ctx = {own:{lv,dup,aff}, affLv:n, cleared:{stageId:true}} */
const OPS={'>=':(a,b)=>a>=b,'<=':(a,b)=>a<=b,'>':(a,b)=>a>b,'<':(a,b)=>a<b,'=':(a,b)=>a==b};
function condMatch(cond,ch,ctx){cond=cond||{};ctx=ctx||{};const o=ctx.own||{},has=a=>Array.isArray(a)&&a.length;
 if(has(cond.factions)&&!cond.factions.includes(ch.faction))return false;
 if(has(cond.roles)&&!cond.roles.includes(ch.role))return false;
 if(has(cond.elems)&&!cond.elems.includes(ch.elem))return false;
 if(has(cond.rarity)&&!cond.rarity.map(Number).includes(+ch.rarity))return false;
 for(const s of cond.stats||[]){if(!s||!s.k)continue;const f=OPS[s.op||'>='];if(!f||!f(+ch[s.k]||0,+s.v||0))return false;}
 if(cond.lv&&(+o.lv||0)<+cond.lv)return false;
 if(cond.dup&&(+o.dup||0)<+cond.dup)return false;
 if(cond.aff&&(+ctx.affLv||0)<+cond.aff)return false;
 if(has(cond.cleared)&&!cond.cleared.every(id=>ctx.cleared&&ctx.cleared[id]))return false;
 return true;}
/* 이미지 프롬프트: 원래 캐릭터의 외모 태그 + 기본형 의상 태그 + 상징 컬러·상징 아이템 */
const CLOTHES=/(dress|coat|jacket|shirt|blouse|skirt|pants|shorts|uniform|bodysuit|armor|armour|suit|robe|kimono|hoodie|sweater|vest|cape|cloak|gloves|boots|shoes|heels|stockings|thighhighs|pantyhose|leotard|swimsuit|bikini|outfit|clothes|clothing|attire|costume|apron|corset|tie|necktie|scarf|hat|cap|helmet|holding )/i;
const COMPO=/^(full body|standing|straight-on|simple background|white background|cowboy shot|upper body|portrait|looking at viewer|arms at sides)$/i;
const tags=s=>String(s||'').split(',').map(t=>t.trim()).filter(Boolean);
function symbolColor(ch){if(ch.symColor)return String(ch.symColor);const m=tags(ch.naiPrompt).map(t=>t.match(/^([a-z]+(?: [a-z]+)?) (hair|eyes)$/i)).find(Boolean);return m?m[1]:'';}
function symbolItem(ch){if(ch.symItem)return String(ch.symItem);const w=ch.weapon||{};return tags(w.prompt).filter(t=>!/^(no humans|object focus|simple background|white background|sci-fi|fantasy)$/i.test(t)).slice(0,2).join(', ');}
function variantPrompt(ch,tpl){
 const look=tags(ch.naiPrompt).filter(t=>!CLOTHES.test(t)&&!COMPO.test(t)),color=symbolColor(ch),item=symbolItem(ch);
 const extra=[color&&/^[\x20-\x7e]+$/.test(color)?`${color} color scheme outfit, ${color} accents`:'',item&&/^[\x20-\x7e]+$/.test(item)?`${item} motif accessory`:''].filter(Boolean);
 return [...look,...tags(tpl.prompt),...extra,'full body','standing','simple background','white background'].filter((t,i,a)=>a.indexOf(t)===i).join(', ');}
function designBrief(ch,tpl){const color=symbolColor(ch),item=symbolItem(ch);
 return `의상 기본형 「${tpl.name}」(${tpl.prompt||tpl.name}). ${ch.name}의 외모 특징은 그대로 두고, 상징 컬러${color?`(${color})`:''}와 상징 아이템${item?`(${item})`:''}·성격을 의상 디자인에 녹인다. naiPrompt에는 원래 외모 태그 + 이 의상의 영어 태그를 자세히 쓴다.${tpl.brief?' 추가 지시: '+tpl.brief:''}`;}
const VARIANT_DEFAULTS=[
 {id:'v_swim',name:'수영복',prompt:'swimsuit, beach, summer, sunlight',chance:35,recipe:{min:[400,100,100,400]}},
 {id:'v_school',name:'교복',prompt:'blazer, formal school-style uniform cosplay, adult',chance:35,recipe:{min:[100,400,100,400]}},
 {id:'v_armor',name:'갑옷',prompt:'fantasy plate armor, ornate armor, cape',chance:30,recipe:{min:[100,100,500,400]}},
 {id:'v_stage1',name:'공연의상1',prompt:'idol stage costume, frills, stage lights',chance:30,recipe:{min:[300,300,100,500]}},
 {id:'v_stage2',name:'공연의상2',prompt:'elegant evening gown, concert stage, spotlight',chance:30,recipe:{min:[500,100,300,500]}},
 {id:'v_stage3',name:'공연의상3',prompt:'rock band stage outfit, leather, electric guitar',chance:30,recipe:{min:[100,500,300,500]}}].map(v=>Object.assign({on:true,rarity:'same',brief:'',cond:{}},v));
const api={RES,DEFAULTS,VARIANT_DEFAULTS,config,normalize,matches,rates,table,roll,condMatch,variantPrompt,designBrief,symbolColor,symbolItem};
root.GGMConstruct=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
