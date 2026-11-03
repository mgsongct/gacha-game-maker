/* 원정(파견) 엔진 — 순수 함수(DOM·G 없음). 문서: docs/research/expedition.md
   모드: combat(지역 원정, 기존 파견) · idol(방송 출연) · streamer(플랫폼 콘텐츠) · business(파트 배치 경영)
   공통: 컨디션(일하면 줄고 쉬면 회복, 낮으면 성과↓) · 인지도 등급(idol·streamer: 낮으면 주는 일만, 높으면 골라서·보수↑) */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),H=3600e3;
const DEFAULTS={mode:'combat',
 cond:{regen:6,rest:18,drain:4,low:30,min:20},                    // 시간당 회복·휴식 회복·경영 근무 소모, 성과가 떨어지는 선, 일을 못 하는 선
 tiers:[{name:'신인',fame:0,offers:1,choice:false,mul:1},{name:'라이징',fame:150,offers:2,choice:false,mul:1.3},{name:'인기',fame:600,offers:3,choice:true,mul:1.8},{name:'스타',fame:1800,offers:4,choice:true,mul:2.6},{name:'톱',fame:4500,offers:6,choice:true,mul:4}],
 burnout:3,                                                      // 쉬지 않고 연속 출연하면 컨디션 소모 1.5배(톱일수록 휴식기가 필요)
 idol:{fameName:'인지도',places:[
  {id:'local',name:'지역 방송',kind:'방송국',hours:2,pay:2000,fame:20,cond:15,minTier:0},
  {id:'sign',name:'팬 사인회',kind:'행사',hours:2,pay:1500,fame:30,cond:10,minTier:0},
  {id:'ad',name:'광고 촬영',kind:'스폰서',hours:4,pay:6000,fame:15,cond:20,minTier:0},
  {id:'music',name:'음악 방송',kind:'방송국',hours:3,pay:3500,fame:45,cond:25,minTier:1},
  {id:'variety',name:'예능 고정',kind:'방송국',hours:4,pay:5000,fame:60,cond:30,minTier:2},
  {id:'drama',name:'드라마 출연',kind:'방송국',hours:8,pay:12000,fame:110,cond:40,minTier:3},
  {id:'concert',name:'단독 콘서트',kind:'행사',hours:6,pay:20000,fame:160,cond:50,minTier:3}]},
 streamer:{fameName:'구독자',platforms:[
  {id:'vod',name:'영상 플랫폼',kind:'vod',hours:6,pay:600,subs:25,cond:20,tail:7,lib:.4},
  {id:'live',name:'라이브 방송',kind:'live',hours:2,pay:900,subs:45,cond:30,var:.6},
  {id:'short',name:'숏폼',kind:'short',hours:1,pay:150,subs:15,cond:8,viral:.08}]},
 business:{repName:'평판',base:500,repMax:1000,target:.6,cap:24,parts:[
  {id:'floor',name:'매장',stat:'spd',slots:2,weight:1},{id:'kitchen',name:'주방',stat:'atk',slots:2,weight:1},
  {id:'promo',name:'홍보',stat:'hp',slots:1,weight:.8},{id:'office',name:'관리',stat:'def',slots:1,weight:.8}]}};
const MODES=['combat','idol','streamer','business'];
function config(c){const d=JSON.parse(JSON.stringify(DEFAULTS)),o=c&&typeof c==='object'?c:{},r=Object.assign(d,o);
 r.cond=Object.assign({},DEFAULTS.cond,o.cond||{});for(const m of ['idol','streamer','business'])r[m]=Object.assign(JSON.parse(JSON.stringify(DEFAULTS[m])),o[m]||{});
 if(!Array.isArray(r.tiers)||!r.tiers.length)r.tiers=JSON.parse(JSON.stringify(DEFAULTS.tiers));if(!MODES.includes(r.mode))r.mode='combat';return r;}
function tierOf(fame,c){const t=config(c).tiers;let i=0;t.forEach((x,k)=>{if((+fame||0)>=x.fame)i=k;});return Object.assign({i,next:t[i+1]||null},t[i]);}
// 컨디션: s={v,at,rest:until} → 지금 값. 쉬는 중이면 rest 속도, 아니면 regen 속도로 회복(일하는 중 회복 없음은 호출하는 쪽에서 at을 미뤄서 처리)
function condNow(s,now,c){const k=config(c).cond;s=s||{v:100,at:now};const at=s.at??now,h=Math.max(0,(now-at)/H);
 const restH=s.rest?Math.max(0,(Math.min(now,s.rest)-at)/H):0;return clamp((+s.v||0)+restH*k.rest+Math.max(0,h-restH)*k.regen,0,100);}
const condFactor=(v,c)=>{const k=config(c).cond;return v>=k.low?1:clamp(.4+.6*v/k.low,.4,1);};
function rngInt(rng,a,b){return a+Math.floor(rng()*(b-a+1));}
/* idol: 등급이 낮으면 방송국·스폰서가 주는 1건(배정)만, 높으면 여러 건 중 고르고 거절도 자유. 보수 = pay × 등급 배율 × (0.9~1.1) */
function idolOffers(fame,c,rng=Math.random){const cfg=config(c),t=tierOf(fame,cfg),pool=cfg.idol.places.filter(p=>(p.minTier||0)<=t.i),out=[],used=new Set();
 for(let n=0;n<t.offers&&used.size<pool.length;n++){let p;do p=pool[Math.floor(rng()*pool.length)];while(used.has(p.id));used.add(p.id);
  out.push({id:p.id,name:p.name,kind:p.kind,hours:p.hours,cond:p.cond,fame:p.fame,pay:Math.round(p.pay*t.mul*(0.9+rng()*0.2)/10)*10,assigned:!t.choice});}
 return {tier:t,offers:out,choice:t.choice};}
function idolResult(job,condV,streak,c){const cfg=config(c),f=condFactor(condV,cfg),burn=streak>=cfg.burnout?1.5:1;
 return {gold:Math.round(job.pay*f),fame:Math.round(job.fame*f),cond:Math.round(job.cond*burn)};}
/* streamer: 플랫폼을 골라 콘텐츠 제작. vod=길게 만들고 라이브러리에 남아 오래 수익 · live=즉시 후원(변동 큼)·구독자↑ · short=짧고 가끔 터짐 */
function streamResult(pf,subs,condV,c,rng=Math.random){const cfg=config(c),f=condFactor(condV,cfg),s=+subs||0;let gold,gain,lib=0,viral=false;
 if(pf.kind==='live'){gold=pf.pay*(1+s/400)*(1+(rng()*2-1)*(pf.var||0));gain=pf.subs*(1+s/3000);}
 else if(pf.kind==='short'){viral=rng()<(pf.viral||0);gold=pf.pay*(1+s/1000);gain=pf.subs*(viral?8:1);}
 else{gold=pf.pay*(1+s/800);gain=pf.subs*(1+s/2000);lib=Math.round(pf.pay*(1+s/500)*(pf.lib||.4));}
 return {gold:Math.round(gold*f),fame:Math.round(gain*f),cond:pf.cond,lib,viral};}
// 영상 라이브러리 수익: 영상마다 시간당 base×5%가 tail일 반감기로 줄어들며 들어와요. from~to 구간 합
function libIncome(lib,from,to,c){const tail=config(c).streamer.platforms.find(p=>p.kind==='vod')?.tail||7;let sum=0;
 for(const v of lib||[])for(let t=Math.max(from,v.at);t<to;t+=H){const dt=Math.min(H,to-t)/H,age=(t-v.at)/864e5;sum+=v.base*.05*Math.pow(.5,age/tail)*dt;}return Math.round(sum);}
/* business: 파트마다 배치 인원의 담당 능력치 적합도로 실적을 내고, 수익은 파트별이 아니라 "전체 실적 × 누적 평판"으로 한 번에 나와요 */
const REF={hp:1000,atk:150,def:60,spd:100};
function bizPerformance(assign,chars,conds,c){const cfg=config(c),B=cfg.business,parts=B.parts.map(p=>{const ids=(assign&&assign[p.id])||[];
  const fit=Math.min(1.5,ids.reduce((a,id)=>{const ch=chars[id];if(!ch)return a;return a+(+ch[p.stat]||0)/(REF[p.stat]||100)*condFactor(conds[id]??100,cfg);},0)/Math.max(1,p.slots));
  return {id:p.id,name:p.name,fit,filled:ids.length,slots:p.slots};});
 const W=B.parts.reduce((a,p)=>a+(+p.weight||1),0),perf=B.parts.reduce((a,p,i)=>a+(+p.weight||1)*parts[i].fit,0)/Math.max(1e-9,W);
 return {perf,parts};}
// h시간 영업: 수익/시간 = base × (0.2 + 실적) × (1 + 평판/repMax), 평판은 실적이 목표보다 높으면 오르고 낮으면 내려요
function bizSettle(perf,rep,hours,c){const B=config(c).business,h=Math.min(B.cap,Math.max(0,hours));
 const gold=Math.round(B.base*(0.2+perf)*(1+clamp(rep,0,B.repMax)/B.repMax)*h),nrep=clamp((+rep||0)+(perf-B.target)*25*h,0,B.repMax);return {gold,rep:nrep,hours:h};}
// 새 게임 세계관 단계의 원정 방식과 이름(expedition, expeditionNames{fame, jobs[]}) → G.meta.expedition. 수치는 기본값 그대로, 이름만 바꿈
const NAME_SLOT={idol:['places','fameName'],streamer:['platforms','fameName'],business:['parts','repName']}; // 방식 → [이름을 바꿀 목록, 인기 수치 이름 키]
function namesApply(mode,n){const k=NAME_SLOT[mode];if(!k||!n||typeof n!=='object')return null;const D=DEFAULTS[mode],J=(Array.isArray(n.jobs)?n.jobs:[]).map(x=>String(x||'').trim().slice(0,16)),fame=String(n.fame||'').trim().slice(0,10);
 if(!fame&&!J.some(Boolean))return null;return {[k[1]]:fame||D[k[1]],[k[0]]:D[k[0]].map((x,i)=>Object.assign({},x,J[i]?{name:J[i]}:{}))};}
function fromWorld(a){if(!a||!MODES.includes(a.expedition))return null;const ex={mode:a.expedition},ov=namesApply(a.expedition,a.expeditionNames);if(ov)ex[a.expedition]=ov;return ex;}
const api={DEFAULTS,MODES,config,namesApply,fromWorld,tierOf,condNow,condFactor,idolOffers,idolResult,streamResult,libIncome,bizPerformance,bizSettle,rngInt};
root.GGMExpedition=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
