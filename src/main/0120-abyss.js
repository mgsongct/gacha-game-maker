/* ===== 심연 탐사 v2: 던전 탐험 + 카드 전투 ===== */
const DG_FLOORS=4, DG_W=5, DG_H=5;
const DG_ROOM={start:['◇','입구'],battle:['⚔','전투'],elite:['☠','정예'],treasure:['✦','보물'],rest:['⛺','야영지'],event:['?','사건'],stairs:['▼','다음 구역'],boss:['♛','보스'],empty:['','빈 방']};
function dgGen(floor){
  const W=DG_W,H=DG_H,N=W*H,start=(H-1)*W+Math.floor(W/2), inS=new Set([start]), links=new Set(), lk=(a,b)=>a<b?a+'-'+b:b+'-'+a;
  const nb=i=>{ const x=i%W,y=Math.floor(i/W),o=[]; if(x>0)o.push(i-1); if(x<W-1)o.push(i+1); if(y>0)o.push(i-W); if(y<H-1)o.push(i+W); return o; };
  const want=Math.min(N-3,11+floor); let guard=0;
  while(inS.size<want&&guard++<3000){ const a=[...inS][Math.floor(Math.random()*inS.size)], b=rand(nb(a)); if(inS.has(b)) continue; inS.add(b); links.add(lk(a,b)); }
  let extra=0; for(const a of inS){ for(const b of nb(a)){ if(extra<2&&inS.has(b)&&!links.has(lk(a,b))&&Math.random()<0.12){ links.add(lk(a,b)); extra++; } } }
  const dist={[start]:0}, q=[start]; while(q.length){ const a=q.shift(); nb(a).forEach(b=>{ if(links.has(lk(a,b))&&dist[b]==null){ dist[b]=dist[a]+1; q.push(b); } }); }
  const rooms=[...inS], far=rooms.reduce((m,i)=>dist[i]>dist[m]?i:m,start);
  const cells=Array.from({length:N},(_,i)=>inS.has(i)?{t:'empty',done:false,seen:false,vis:false}:null);
  cells[start]={t:'start',done:true,seen:true,vis:true}; cells[far].t=floor>=DG_FLOORS?'boss':'stairs';
  const rest=rooms.filter(i=>i!==start&&i!==far).sort(()=>Math.random()-.5);
  const bag=[]; if(floor>=2) bag.push('elite'); if(floor>=3) bag.push('elite'); bag.push('treasure','rest','event','event'); if(floor===1) bag.push('treasure');
  while(bag.length<rest.length) bag.push(Math.random()<0.62?'battle':'empty');
  const near=rest.filter(i=>dist[i]<=1); near.forEach(i=>{ cells[i].t='battle'; });
  let bi=0; rest.forEach(i=>{ if(dist[i]<=1) return; cells[i].t=bag[bi++]||'empty'; });
  if(!rest.some(i=>cells[i].t==='battle')&&rest.length) cells[rest[0]].t='battle';
  const map={w:W,h:H,cells,links:[...links],start,stairs:far}; dgReveal(map,start); return map; }
function dgLinked(map,a,b){ const k=a<b?a+'-'+b:b+'-'+a; return map.links.includes(k); }
function dgNb(map,i){ const W=map.w,x=i%W,y=Math.floor(i/W),o=[]; if(x>0)o.push(i-1); if(x<W-1)o.push(i+1); if(y>0)o.push(i-W); if(y<map.h-1)o.push(i+W); return o.filter(b=>map.cells[b]&&dgLinked(map,i,b)); }
function dgReveal(map,i){ const c=map.cells[i]; c.vis=true; c.seen=true; dgNb(map,i).forEach(b=>{ map.cells[b].seen=true; }); }
function dgPath(map,from,to){ const prev={[from]:-1}, q=[from]; while(q.length){ const a=q.shift(); if(a===to) break; dgNb(map,a).forEach(b=>{ if(prev[b]==null&&(map.cells[b].vis||b===to)){ prev[b]=a; q.push(b); } }); } if(prev[to]==null) return null; const p=[]; for(let x=to;x!==-1;x=prev[x]) p.unshift(x); return p; }
function rgEq(run,kind){ if(kind==='boss') return RG_FLOORS; return Math.min(RG_FLOORS,(run.floor-1)*3+1+Math.min(2,run.fw||0)); }
function rgScore(run){ return Math.min(RG_FLOORS,(run.floor-1)*3+Math.min(3,run.fw||0)); }

/* --- 도트 스프라이트: 스탠딩을 줄여서 도트로 --- */
const PIX={};
function pixSprite(c){ const src=charSrc(c); if(!src) return Promise.resolve(null); const key=c.id+'|'+src; if(PIX[key]) return PIX[key];
  PIX[key]=new Promise(res=>{ const im=new Image(); im.onload=()=>{ try{
      const sw=im.naturalWidth, sh=im.naturalHeight, W=22, H=Math.round(W*Math.min(2.2,sh/sw*0.92)); const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d',{willReadFrequently:true});
      x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; const cw=sw*0.86; x.drawImage(im,(sw-cw)/2,0,cw,sh*0.97,0,0,W,H);
      const d=x.getImageData(0,0,W,H), p=d.data, at=(i)=>[p[i],p[i+1],p[i+2],p[i+3]];
      const corner=[0,(W-1)*4,(H-1)*W*4,((H-1)*W+W-1)*4].map(at), whiteBg=corner.every(q=>q[3]>200&&q[0]>225&&q[1]>225&&q[2]>225);
      for(let i=0;i<p.length;i+=4){ const wh=p[i]>228&&p[i+1]>228&&p[i+2]>228; if(p[i+3]<110||(whiteBg&&wh)){ p[i+3]=0; continue; } p[i+3]=255; for(let k=0;k<3;k++) p[i+k]=Math.min(255,Math.round(p[i+k]/42)*42+8); }
      const solid=(X,Y)=>X>=0&&Y>=0&&X<W&&Y<H&&p[(Y*W+X)*4+3]>0, out=new Uint8ClampedArray(p);
      for(let Y=0;Y<H;Y++) for(let X=0;X<W;X++){ const i=(Y*W+X)*4; if(p[i+3]) continue; if(solid(X-1,Y)||solid(X+1,Y)||solid(X,Y-1)||solid(X,Y+1)){ out[i]=18;out[i+1]=14;out[i+2]=28;out[i+3]=255; } }
      const o=document.createElement('canvas'); o.width=W; o.height=H; o.getContext('2d').putImageData(new ImageData(out,W,H),0,0); res(o.toDataURL());
    }catch(e){ res(null); } }; im.onerror=()=>res(null); im.src=src; });
  return PIX[key]; }
function pixFill(){ document.querySelectorAll('img[data-pix]:not([src])').forEach(el=>{ const c=charById(el.dataset.pix); if(!c) return; pixSprite(c).then(u=>{ if(u){ el.src=u; el.parentNode&&el.parentNode.classList.add('has'); } }); }); }

/* --- 카드 --- */
// 리더 1명이 전장에 서고, 함께 고른 대원들은 카드가 되어 능력을 빌려줘요.
// 키워드: 연계(직전 카드도 공격이면 강해짐) · 낙인(쌓아 두면 처형으로 터뜨림) · 출혈(적 턴마다 피해) · 약화(적 공격 -30%)
//         보존(보호막 절반이 다음 턴으로) · 반격(이번 턴 맞으면 되받아침) · 소멸(한 번 쓰면 이번 전투에서 사라짐)
const CARD_DEF={
  strike:{n:'공격',c:1,t:'atk',tg:1,m:1.0,mu:1.4,d:v=>`적 1명에게 ${v} 피해`},
  guard:{n:'방어',c:1,t:'def',m:1,mu:1.45,d:v=>`보호막 ${v}`},
  skill:{n:'',c:2,cu:1,t:'sk',m:1,mu:1.3,d:v=>v},
  twin:{n:'연격',c:1,t:'atk',tg:1,m:0.6,mu:0.8,d:v=>`적 1명에게 ${v} 피해 ×2`},
  taunt:{n:'도발',c:1,t:'def',m:1.1,mu:1.6,d:v=>`보호막 ${v}`},
  tactic:{n:'전술 지원',c:0,t:'sup',m:2,mu:3,d:v=>`카드 ${v}장 뽑기`},
  heavy:{n:'강타',c:2,t:'atk',tg:1,m:2.2,mu:3.0,d:v=>`적 1명에게 ${v} 피해`},
  sweep:{n:'휩쓸기',c:1,t:'atk',m:0.7,mu:1.0,d:v=>`모든 적에게 ${v} 피해`},
  wall:{n:'철벽',c:2,t:'def',m:2.2,mu:3.0,d:v=>`보호막 ${v}`},
  aid:{n:'응급 처치',c:1,t:'sup',m:1.5,mu:2.2,d:v=>`리더 체력 ${v} 회복`},
  focus:{n:'집중',c:0,t:'sup',m:2,mu:3,x:1,d:v=>`카드 ${v}장 뽑기 · <b>소멸</b>`},
  expose:{n:'약점 포착',c:1,cu:0,t:'sup',tg:1,m:2,mu:3,d:v=>`적 1명이 ${v}턴 동안 받는 피해 +50%`},
  rally:{n:'사기 진작',c:1,t:'sup',m:0.15,mu:0.25,d:v=>`이번 전투 공격 +${Math.round(v*100)}%`},
  combo:{n:'협공',c:1,t:'atk',tg:1,m:0.35,mu:0.5,d:v=>`적 1명에게 ${v} 피해 × 이번 턴에 쓴 카드 수`},
  revive:{n:'재정비',c:2,t:'sup',m:0.3,mu:0.5,x:1,d:v=>`리더 체력 ${Math.round(v*100)}% 회복 · <b>소멸</b>`},
  surge:{n:'과부하',c:0,t:'sup',m:2,mu:3,x:1,d:v=>`에너지 +${v} · <b>소멸</b>`},
  // 기믹 카드
  slash:{n:'연속 베기',c:1,t:'atk',tg:1,m:0.8,mu:1.1,d:v=>`적 1명에게 ${v} 피해 · <b>연계</b>: 직전 카드가 공격이면 ×1.6`},
  brand:{n:'낙인',c:1,t:'atk',tg:1,m:0.45,mu:0.6,mk:2,mku:3,d:(v,cd)=>`적 1명에게 ${v} 피해 · <b>낙인</b> ${cd&&cd.up?3:2} 부여`},
  finisher:{n:'처형',c:2,cu:1,t:'atk',tg:1,m:0.6,mu:0.8,d:v=>`적 1명에게 ${v} 피해 + 그 적의 <b>낙인</b> 1개마다 같은 피해를 더해요 (낙인 소모)`},
  bleed:{n:'핏빛 자상',c:1,t:'atk',tg:1,m:0.4,mu:0.55,bl:3,blu:5,d:(v,cd)=>`적 1명에게 ${v} 피해 · <b>출혈</b> ${cd&&cd.up?5:3}`},
  bulwark:{n:'수호',c:1,t:'def',m:1.2,mu:1.7,d:v=>`보호막 ${v} · <b>보존</b>: 다음 턴까지 보호막 절반 유지`},
  counter:{n:'반격 태세',c:1,t:'def',m:0.9,mu:1.3,d:v=>`보호막 ${v} · <b>반격</b>: 이번 적 턴에 맞을 때마다 되받아쳐요`},
  weaken:{n:'무력화',c:1,cu:0,t:'sup',tg:1,m:2,mu:3,d:v=>`적 1명 <b>약화</b> ${v}턴 (적 공격 -30%)`},
  plan:{n:'작전 지시',c:0,t:'sup',m:1,mu:2,d:v=>`카드 ${v}장 뽑기 · 다음 카드 비용 -1`},
  echo:{n:'잔향',c:1,t:'sup',x:1,m:1,mu:1,d:()=>`이번 턴에 쓴 직전 카드를 손으로 한 장 복사해요 · <b>소멸</b>`},
  // 빌드 카드: 충전·소멸·보호막·출혈·0비용·낙인·필살
  charge:{n:'기 모으기',c:1,cu:0,t:'sup',m:2,mu:3,d:v=>`<b>충전</b> ${v} · 보호막 조금`},
  release:{n:'해방',c:2,t:'atk',m:0.5,mu:0.7,d:v=>`모든 적에게 ${v} 피해 × (1 + <b>충전</b>) · 충전을 모두 써요`},
  sacrifice:{n:'결의',c:0,t:'sup',m:2,mu:3,d:v=>`손의 맨 오른쪽 카드 1장을 <b>소멸</b>시키고 카드 ${v}장 뽑기`},
  burnout:{n:'연소',c:1,t:'atk',tg:1,m:2.0,mu:2.7,x:1,d:v=>`적 1명에게 ${v} 피해 · <b>소멸</b>`},
  shieldbash:{n:'방패 치기',c:1,t:'atk',tg:1,m:0.8,mu:1.2,d:v=>`지금 보호막의 ${Math.round(v*100)}%만큼 적 1명에게 피해 (보호막은 그대로)`},
  entrench:{n:'참호',c:2,cu:1,t:'def',m:1,mu:1,x:1,d:()=>`보호막을 2배로 · <b>소멸</b>`},
  hemorrhage:{n:'혈류 폭주',c:1,cu:0,t:'sup',tg:1,m:2,mu:2,d:()=>`적 1명의 <b>출혈</b>을 2배로`},
  flurry:{n:'난무',c:0,t:'atk',tg:1,m:0.4,mu:0.6,d:v=>`적 1명에게 ${v} 피해 · <b>연계</b>면 카드 1장 뽑기`},
  spread:{n:'낙인 전이',c:1,cu:0,t:'sup',tg:1,m:1,mu:1,d:()=>`대상의 <b>낙인</b>만큼 다른 모든 적에게도 낙인을 걸어요`},
  overdrive:{n:'과열',c:1,cu:0,t:'sup',m:2,mu:3,d:v=>`필살 게이지 +${v}`},
  rage:{n:'투지',c:1,cu:0,t:'sup',m:0.3,mu:0.45,x:1,d:v=>`이번 전투 동안 공격 카드를 쓸 때마다 보호막 ${v} · <b>소멸</b>`}
};
const KW={연계:'직전에 쓴 카드도 공격이면 더 강해져요.',낙인:'적에게 쌓여요. 처형 카드가 낙인 수만큼 피해를 더하고 낙인을 없애요.',출혈:'적의 턴이 올 때마다 출혈 수치만큼(×리더 공격 일부) 피해를 받고 1씩 줄어요.',약화:'약화된 적은 공격이 30% 약해져요.',보존:'다음 턴이 와도 보호막의 절반이 남아요.',반격:'이번 적 턴에 공격을 받을 때마다 공격한 적에게 피해를 돌려줘요.',소멸:'한 번 쓰면 이번 전투에서는 다시 나오지 않아요.',충전:'쌓아 두었다가 해방 카드로 한 번에 터뜨려요. 전투가 끝나면 사라져요.'};
const CARD_REWARD=['heavy','sweep','wall','aid','focus','expose','rally','combo','revive','surge','twin','slash','brand','finisher','bleed','bulwark','counter','weaken','plan','echo','charge','release','sacrifice','burnout','shieldbash','entrench','hemorrhage','flurry','spread','overdrive','rage'];
const ROLE_CARDS={atk:['slash','brand','finisher','bleed'],def:['bulwark','counter','wall','taunt'],sup:['plan','weaken','aid','expose']};
const SK_TXT={dmg:'적 1명에게 큰 피해',aoe:'모든 적에게 피해',heal:'리더 체력 회복',shield:'큰 보호막',buff:'이번 전투 공격 증가'};
const LEAD_AB={atk:['맹공','공격 카드를 3장 쓸 때마다 리더가 추가로 한 번 더 공격해요.'],def:['불굴','턴을 시작할 때 리더 최대 체력의 6%만큼 보호막을 얻어요.'],sup:['통찰','턴마다 카드를 1장 더 뽑아요.']};
const ULT_MAX=6;
function rgDeck(squad){ const d=[], L=squad[0], lc=charById(L); if(!lc) return d;
  for(let i=0;i<4;i++) d.push({k:'strike',o:L}); for(let i=0;i<4;i++) d.push({k:'guard',o:L});
  squad.slice(1).forEach(id=>{ const c=charById(id); if(!c) return; const pool=ROLE_CARDS[c.role]||ROLE_CARDS.atk, h=hashN(c.id), a=pool[h%pool.length], b=pool[(h+1+(h>>3)%(pool.length-1))%pool.length];
    d.push({k:a,o:id},{k:b===a?pool[(pool.indexOf(a)+1)%pool.length]:b,o:id},{k:'skill',o:id}); });
  return d; }
function cardName(cd){ const c=charById(cd.o), df=CARD_DEF[cd.k]||CARD_DEF.strike; return (cd.k==='skill'?(c?c.skill.name:'스킬'):df.n)+(cd.up?'+':''); }
function cardCost(cd){ const df=CARD_DEF[cd.k]||CARD_DEF.strike; let c=cd.up&&df.cu!=null?df.cu:df.c; if(CB&&!CB.over){ if(CB.disc1) c--; if(CB.firstFree&&!CB.played) c--; } return Math.max(0,c); }
function cardType(cd){ const df=CARD_DEF[cd.k]||CARD_DEF.strike; if(cd.k==='skill'){ const c=charById(cd.o), k=c&&c.skill.kind; return k==='dmg'||k==='aoe'?'atk':k==='shield'?'def':'sup'; } return df.t; }
function cardTxt(cd,u){ const df=CARD_DEF[cd.k]||CARD_DEF.strike, m=cd.up?df.mu:df.m, c=charById(cd.o);
  if(cd.k==='skill'){ const k=c.skill.kind, pw=c.skill.power*(cd.up?df.mu:1); if(!u) return SK_TXT[k]+` (×${(Math.round(pw*10)/10)})`; const v=cbSkillVal(u,c.skill,pw); return k==='dmg'?`적 1명에게 ${nf(v)} 피해`:k==='aoe'?`모든 적에게 ${nf(v)} 피해`:k==='heal'?`리더 체력 ${nf(v)} 회복`:k==='shield'?`보호막 ${nf(v)}`:`이번 전투 공격 +${Math.round(v*100)}%`; }
  if(!u){ const fx={rage:`최대 체력 ${Math.round(9*m)}%`,release:`공격력 ×${m}`,burnout:`공격력 ×${m}`,flurry:`공격력 ×${m}`,strike:`공격력 ×${m}`,guard:`최대 체력 ${Math.round(9*m)}%`,twin:`공격력 ×${m}`,taunt:`최대 체력 ${Math.round(9*m)}%`,heavy:`공격력 ×${m}`,sweep:`공격력 ×${m}`,wall:`최대 체력 ${Math.round(9*m)}%`,aid:`최대 체력 ${Math.round(12*m)}%`,combo:`공격력 ×${m}`,slash:`공격력 ×${m}`,brand:`공격력 ×${m}`,finisher:`공격력 ×${m}`,bleed:`공격력 ×${m}`,bulwark:`최대 체력 ${Math.round(9*m)}%`,counter:`최대 체력 ${Math.round(9*m)}%`}; return df.d(fx[cd.k]!=null?fx[cd.k]:m,cd); }
  if(cd.k==='shieldbash') return CB?`지금 보호막의 ${Math.round(m*100)}% → 적 1명에게 ${nf(Math.round(CB.block*m))} 피해`:df.d(m,cd);
  if(cd.k==='rage') return df.d(nf(cbBlk(CB?cbLead():u,m)),cd);
  if(cd.k==='release') return df.d(nf(cbAtkVal(u,m)),cd)+(CB&&CB.charge?` <b>(지금 ×${1+CB.charge})</b>`:'');
  if(df.t==='atk') return df.d(nf(cbAtkVal(u,m)),cd);
  if(['guard','taunt','wall','bulwark','counter'].includes(cd.k)) return df.d(nf(cbBlk(u,m)),cd);
  if(cd.k==='aid') return df.d(nf(Math.round(u.maxhp*0.12*m)),cd);
  return df.d(m,cd); }
const CARD_ILL={strike:'attacking, weapon swing, motion lines',guard:'defensive stance, guarding, barrier',twin:'double strike, afterimage, fast movement',taunt:'provoking, smirk, beckoning',tactic:'pointing forward, commanding',heavy:'powerful strike, overhead swing, impact',sweep:'spinning attack, wide slash, shockwave',wall:'shield wall, glowing barrier, braced stance',aid:'healing light, gentle smile, hands glowing',focus:'closed eyes, concentrating, aura',expose:'aiming, focused gaze, crosshair',rally:'raising fist, cheering, light rays',combo:'teamwork attack, leaping',revive:'kneeling, recovering, light',surge:'overload, crackling energy, aura burst',slash:'slashing, consecutive slashes, afterimage',brand:'glowing sigil, magic mark, pointing at viewer',finisher:'finishing blow, dramatic angle, impact frame',bleed:'red slash trail, swift cut',bulwark:'standing guard, protective barrier',counter:'counterattack stance, parry, sparks',weaken:'casting debuff, dark aura, hand raised',plan:'holographic map, commanding, pointing',echo:'mirror image, afterimage, glowing',charge:'charging energy, glowing aura, clenched fist',release:'energy explosion, shockwave, dramatic',sacrifice:'burning card, determined expression',burnout:'flaming strike, fire trail',shieldbash:'shield bash, charging forward, impact',entrench:'kneeling behind shield, fortified',hemorrhage:'red mist, blood magic, crimson aura',flurry:'rapid strikes, multiple afterimages',spread:'glowing sigils spreading, chain of marks',overdrive:'overheating, steam, glowing eyes',rage:'battle cry, fiery aura'};
function cardIllObj(cd){ const c=charById(cd.o); if(!c) return null; if(cd.k==='skill'&&c.scg&&imgSrc(c.scg)) return c.scg; return c.cards&&c.cards[cd.k]&&imgSrc(c.cards[cd.k])?c.cards[cd.k]:null; }
// 카드 그림: 카드 일러스트 → 상반신 → 전신(위쪽) → 없으면 그림 없이
function cardArtHTML(cd){ const c=charById(cd.o), o=cardIllObj(cd); if(o) return `<img class="art ill" src="${esc(imgSrc(o))}" alt="" draggable="false">`; if(!c) return '';
  const k=skinOf(c), up=(k&&k.upper&&imgSrc(k.upper))||(c.upper&&imgSrc(c.upper)); if(up) return `<img class="art up" src="${esc(up)}" alt="" draggable="false">`;
  const st=charSrc(c); return st?`<img class="art st" src="${esc(st)}" alt="" draggable="false">`:''; }
function cardHTML(cd,opt){ opt=opt||{}; const c=charById(cd.o), u=opt.u, ty=cardType(cd), df=CARD_DEF[cd.k]||CARD_DEF.strike;
  return `<button class="cd t-${ty} ${cd.up?'up':''} ${opt.cls||''}" ${opt.act?`data-act="${opt.act}" data-i="${opt.i}"`:''} ${opt.dis?'disabled':''} style="--ec:${c?ECOL[c.elem]:'var(--rose)'};${opt.sty||''}"><em class="cost">${cardCost(cd)}</em><div class="cd-art">${cardArtHTML(cd)}</div><div class="cd-tx"><b>${esc(cardName(cd))}</b><span>${cardTxt(cd,u)}</span><small>${esc(c?c.name:'')}${df.x?' · 소멸':''}</small></div></button>`; }
function cardOffer(run){ const pool=CARD_REWARD.slice(), out=[]; const sup=run.squad.slice(1).map(charById).filter(Boolean), all=run.squad.map(charById).filter(Boolean);
  while(out.length<3&&pool.length){ const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    const pref=['wall','taunt','bulwark','counter','entrench','shieldbash','rage'].includes(k)?'def':['aid','focus','rally','revive','surge','expose','weaken','plan','echo','charge','sacrifice','hemorrhage','spread','overdrive'].includes(k)?'sup':'atk', base=sup.length?sup:all, pc=base.filter(c=>c.role===pref);
    out.push({k,o:(rand(pc.length?pc:base)||{}).id,up:Math.random()<0.12+0.06*run.floor}); }
  return out; }
// 카드 일러스트: 대원마다, 카드 종류마다 한 장 (스킬 카드는 기술 컷인을 써요)
async function drawCardArts(deck,rep){ if(!imgReady()){ toast(imgNeed()); return; }
  const todo=[]; const seen=new Set(); deck.forEach(cd=>{ const c=charById(cd.o), key=cd.o+'|'+cd.k; if(!c||seen.has(key)||cardIllObj(cd)) return; seen.add(key); todo.push(cd); });
  if(!todo.length){ toast('모든 카드에 일러스트가 있어요'); return; }
  let n=0;
  for(const cd of todo){ const c=charById(cd.o); if(rep) rep(`그리는 중 ${n+1}/${todo.length}`);
    try{ const tags=cd.k==='skill'?(SKILL_TAGS[c.skill&&c.skill.kind]||'attacking')+', special effects, glowing':CARD_ILL[cd.k]||'dynamic pose';
      const b=await naiDraw('illust',joinTags(c.naiPrompt,tags),{styleId:c.naiStyle,frame:cd.k==='skill'?'upper body':'cowboy shot',pose:'dynamic pose, '+tags});
      if(cd.k==='skill'){ scgOf(c); await storeImage(c.scg,b,''); } else { c.cards=c.cards||{}; const o=c.cards[cd.k]||(c.cards[cd.k]={id:'cd_'+c.id+'_'+cd.k,kind:'illust',name:c.name+' '+cardName({k:cd.k,o:c.id}),prompt:tags,img:null}); await storeImage(o,b,''); }
      mark('c:'+c.id); n++; }
    catch(e){ toast(naiErr(e)); break; } }
  if(rep) rep.end(); if(n) toast(`카드 일러스트 ${n}장을 그렸어요`); const run=progSlot('rogue').run; if($('#modal .cd-row')&&run) rgDeckModal(run.deck); if(CB) cbRender(); }

/* --- 카드 전투 엔진 --- */
let CB=null;
function cbAtkVal(u,m,e){ if(!e&&CB){ const es=CB.enemies.filter(en=>en.hp>0); e=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0]; } let v=u.atk*(CB?CB.str:1)*m; if(e){ v*=BEATS[u.elem]===e.elem?1.5:BEATS[e.elem]===u.elem?0.75:1; if(e.vul>0) v*=1.5; } return Math.max(1,Math.round(v)); }
function cbBlk(u,m){ return Math.round(u.maxhp*0.09*m); }
function cbSkillVal(u,sk,pw){ const k=sk.kind; if(k==='dmg') return cbAtkVal(u,pw*1.3); if(k==='aoe') return cbAtkVal(u,pw*0.9); if(k==='heal') return Math.round(u.maxhp*0.14*pw); if(k==='shield') return Math.round(u.maxhp*0.12*pw); return Math.min(0.6,0.2*pw); }
function cbEnemyDmg(e,m,a){ let v=e.dmg*e.str*m; if(e.weak>0) v*=0.7; v*=BEATS[e.elem]===a.elem?1.5:BEATS[a.elem]===e.elem?0.75:1; const dr=Math.min(1.35,Math.max(0.65,Math.pow((CB?CB.defA:a.def)/Math.max(1,a.def),0.35))); return Math.max(1,Math.round(v*dr)); }
function cbShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function rgUnits(run,ids){ const m=id=>rgCount(id), fb=factionBonus(ids);
  return ids.map(charById).filter(Boolean).map((c,i)=>{ const st=stats(c), fr=run.hp[c.id]; const u={i,c,name:c.name,elem:c.elem,role:c.role,str:1};
    u.maxhp=Math.round(st.hp*(1+0.2*m('hp')+0.08*m('res'))); u.atk=Math.round(st.atk*(1+(fb[c.faction]||0)/100)*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(st.def*(1+0.25*m('def'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); return u; }); }
function cbLead(){ return CB.units[0]; }
function cbUnit(id){ return CB.units.find(u=>u.c.id===id)||CB.units[0]; }
function cbStart(kind){ const run=progRead('rogue').run; const en=rgEnemies({k:run.k,floor:rgEq(run,kind)},kind);
  const units=rgUnits(run,run.squad), L=units[0]; L.maxhp=Math.round(L.maxhp*2.2); const fr=run.hp[L.c.id]; L.hp=Math.round(L.maxhp*(fr==null?1:fr));
  const bs=run.squad.map(charById).filter(Boolean).map(stats), avg=k=>bs.reduce((s,x)=>s+x[k],0)/Math.max(1,bs.length);
  // 적의 세기는 리더를 기준으로 정해요(체력 = 리더 공격 몇 번, 공격 = 리더 최대 체력 몇 %). 층이 깊을수록 강해지고, 탐사대가 강하면 조금만 약해져요.
  const R=Math.min(2,Math.max(0.5,teamPower(run.squad)/Math.max(1,stagePower({enemies:en})))), q=Math.pow(R,-0.3), A=L.atk, HL=L.maxhp, tt=Math.max(0,Math.min(1,(rgEq(run,kind)-1)/(RG_FLOORS-1)));
  const many=en.length>=3?0.8:1;
  const HK={battle:[(5.5+4.5*tt)*many,(5.5+4.5*tt)*many],elite:[16+10*tt,5+2.5*tt],boss:[44,8]}[kind], PK={battle:[0.07+0.04*tt,0.07+0.04*tt],elite:[0.11+0.05*tt,0.06+0.03*tt],boss:[0.14,0.075]}[kind];
  const enemies=en.map((e,i)=>{ const main=i===0&&kind!=='battle'; return {i,name:e.name,elem:e.elem,boss:!!e.boss,maxhp:Math.round(A*(main?HK[0]:HK[1])*q*(0.92+Math.random()*0.16)),dmg:HL*(main?PK[0]:PK[1])*q,def:e.def,str:1,blk:0,vul:0,mark:0,bleed:0,weak:0,enr:false}; });
  enemies.forEach(e=>e.hp=e.maxhp); if(rgCount('opener')) enemies.forEach(e=>e.mark+=2*rgCount('opener'));
  CB={kind,run,units,allies:[L],enemies,defA:avg('def'),R,str:1,draw:cbShuffle(run.deck.map(x=>Object.assign({},x))),hand:[],disc:[],exh:[],energy:0,block:0,turn:0,tgt:0,taunt:-1,busy:false,over:false,log:[],ult:Math.min(ULT_MAX,2*rgCount('ultcharge')),sel:-1,atkN:0,phoenix:rgCount('phoenix')>0,last:null,charge:3*rgCount('capacitor'),rage:0};
  const title=`B${run.floor} · ${DG_ROOM[kind][1]}`, ab=LEAD_AB[L.role]||LEAD_AB.atk;
  $('#ov').innerHTML=`<div class="cb v3"><div class="bt-bg" style="${bgStyle(P().dgBg||'폐선로')}"></div><div class="cb-dim"></div>
    <div class="bt-top"><span class="ttl"><i>DUNGEON · CARD BATTLE</i>${esc(title)}</span><button data-act="cbdeck">덱</button><button data-act="cbquit">후퇴</button></div>
    <div class="cb-en" id="cbEn"></div><div class="cb-log" id="cbLog"></div>
    <div class="cb-lead" id="cbLead"><div class="cl-art">${art(L.c)}</div><div class="cl-info"><b>${esc(L.name)} <small>리더</small></b><span class="hpb"><i id="clHp"></i></span><span class="cl-n" id="clN"></span><span class="cl-ab" title="${esc(ab[1])}">◆ ${esc(ab[0])} · ${esc(ab[1])}</span><span class="cl-st" id="clSt"></span></div>
      <button class="cl-ult" id="cbUlt" data-act="cbult"><i id="cbUltG"></i><b>필살</b><small>${esc(L.c.skill.name)}</small></button></div>
    <div class="cb-bar"><div class="cb-orb" id="cbOrb"></div><div class="cb-blk" id="cbBlk"></div><span class="cb-pile" id="cbPile"></span><button class="btn sm" data-act="cbend" id="cbEndB">턴 종료</button></div>
    <div class="cb-detail" id="cbDet" hidden></div>
    <div class="cb-hand fan" id="cbHand"></div></div>`;
  $('#ov').hidden=false; sceneBgm(); cbIntents(); cbTurn(true); }
function cbAliveE(){ return CB.enemies.filter(en=>en.hp>0); }
function cbLog(t){ CB.log.push(t); CB.log=CB.log.slice(-3); const el=$('#cbLog'); if(el) el.innerHTML=CB.log.map(x=>`<p>${esc(x)}</p>`).join(''); }
function cbDraw(n){ for(let k=0;k<n;k++){ if(CB.hand.length>=10) break; if(!CB.draw.length){ if(!CB.disc.length) break; CB.draw=cbShuffle(CB.disc); CB.disc=[]; } CB.hand.push(CB.draw.pop()); } }
function cbTurn(first){ if(!CB||CB.over) return; const L=cbLead(); CB.turn++; CB.block=CB.retain?Math.floor(CB.block*0.5):0; CB.retain=false; CB.counter=0; CB.taunt=-1; CB.played=0; CB.disc1=false; CB.chainOK=false; CB.firstFree=rgCount('firstfree')>0; CB.last=null; CB.sel=-1;
  CB.energy=3+(first&&rgCount('burst')?1:0);
  if(L.role==='def'){ const b=Math.round(L.maxhp*0.06); CB.block+=b; }
  cbDraw(5+(L.role==='sup'?1:0)+(first?rgCount('spd'):0)); CB.busy=false; cbRender(); }
function cbIntents(){ CB.enemies.forEach(en=>{ if(en.hp<=0) return; const r=Math.random(); let it;
    if(en.boss){ it=r<0.25?{k:'aoe',m:0.75}:r<0.42?{k:'heavy',m:2.0}:r<0.75?{k:'atk',m:1.15}:r<0.88?{k:'multi',m:0.6,n:2}:{k:'def'}; if(CB.turn===0&&it.k==='heavy') it={k:'atk',m:1.15}; }
    else it=r<0.58?{k:'atk',m:1.0}:r<0.73?{k:'multi',m:0.55,n:2}:r<0.88?{k:'def'}:{k:'buff'};
    if(it.k==='aoe') it={k:'atk',m:1.3};
    en.intent=it; }); }
function cbIntentHTML(e){ const it=e.intent; if(!it) return ''; const L=cbLead(), dm=cbEnemyDmg(e,it.m||1,L);
  if(it.k==='atk'||it.k==='heavy') return `<span class="it it-atk ${it.k==='heavy'?'heavy':''}">⚔ ${nf(dm)}</span>`;
  if(it.k==='multi') return `<span class="it it-atk">⚔ ${nf(dm)}×${it.n}</span>`;
  if(it.k==='def') return `<span class="it it-def">🛡 방어</span>`;
  return `<span class="it it-buf">▲ 강화</span>`; }
function cbFanStyle(i,n,sel,si){ const o=i-(n-1)/2, sp=Math.min(54,250/Math.max(1,n-1)), r=o*Math.min(7,48/Math.max(1,n)), y=Math.abs(o)*Math.abs(o)*2.2;
  // 고른 카드는 그 자리에서 위로 올라오고, 양옆 카드는 살짝 비켜나요(화면 밖으로 나가지 않게)
  const half=(Math.min(innerWidth,620)/2)-62; let tx=o*sp; if(si!=null&&si>=0&&!sel) tx+=i<si?-16:16; if(sel) tx=Math.max(-half,Math.min(half,tx));
  return sel?`--tx:${tx}px;--ty:-58px;--r:0deg;z-index:30`:`--tx:${tx}px;--ty:${y}px;--r:${r}deg;z-index:${10+i}`; }
function cbRender(){ if(!CB) return; const es=cbAliveE(); if(!es.includes(CB.enemies[CB.tgt])) CB.tgt=(es[0]||{i:0}).i; const L=cbLead();
  $('#cbEn').innerHTML=CB.enemies.map(en=>`<button class="ce ${en.hp<=0?'dead':''} ${en.boss?'boss':''} ${CB.tgt===en.i&&en.hp>0?'tg':''}" id="ce${en.i}" data-act="cbtgt" data-i="${en.i}" style="--ec:${ECOL[en.elem]}">${en.hp>0?cbIntentHTML(en):''}<div class="ce-art">${enemyArt(en)}</div><b>${esc(en.name)}</b><span class="hpb"><i style="width:${Math.max(0,en.hp/en.maxhp*100)}%"></i></span><span class="ce-n">${nf(Math.max(0,en.hp))}${en.blk?` <em class="eb">🛡${nf(en.blk)}</em>`:''}${en.mark?` <em class="em">낙인 ${en.mark}</em>`:''}${en.bleed?` <em class="ebl">출혈 ${en.bleed}</em>`:''}${en.weak?` <em class="ew">약화 ${en.weak}</em>`:''}${en.vul?` <em class="ev">취약 ${en.vul}</em>`:''}${en.str>1?` <em class="es">공↑</em>`:''}</span></button>`).join('');
  $('#clHp').style.width=Math.max(0,L.hp/L.maxhp*100)+'%'; $('#clN').textContent=`${nf(Math.max(0,L.hp))} / ${nf(L.maxhp)}`; $('#cbLead').classList.toggle('down',L.hp<=0);
  $('#clSt').innerHTML=[CB.charge?`충전 ${CB.charge}`:'',CB.rage?'투지':'',CB.str>1?`공격 +${Math.round((CB.str-1)*100)}%`:'',CB.retain?'보존':'',CB.counter?'반격':'',CB.disc1?'다음 카드 -1':'',L.role==='atk'?`맹공 ${CB.atkN%3}/3`:''].filter(Boolean).map(x=>`<em>${x}</em>`).join('');
  const ub=$('#cbUlt'); ub.disabled=CB.busy||CB.ult<ULT_MAX; ub.classList.toggle('ready',CB.ult>=ULT_MAX); $('#cbUltG').style.height=(CB.ult/ULT_MAX*100)+'%';
  $('#cbOrb').innerHTML=`<b>${CB.energy}</b><small>/3</small>`; $('#cbBlk').innerHTML=`🛡 <b>${nf(CB.block)}</b>`; $('#cbBlk').classList.toggle('on',CB.block>0);
  $('#cbPile').textContent=`덱 ${CB.draw.length} · 버림 ${CB.disc.length}`;
  const n=CB.hand.length; if(CB.sel>=n) CB.sel=-1;
  $('#cbHand').innerHTML=CB.hand.map((cd,i)=>{ const u=cbUnit(cd.o), dis=CB.busy||cardCost(cd)>CB.energy||(cd.k==='echo'&&!CB.last); return cardHTML(cd,{u,act:'cbsel',i,dis:CB.busy,cls:(dis?'na ':'')+(CB.sel===i?'sel':''),sty:cbFanStyle(i,n,CB.sel===i,CB.sel)}); }).join('');
  const det=$('#cbDet'); if(CB.sel>=0&&CB.hand[CB.sel]){ const cd=CB.hand[CB.sel], u=cbUnit(cd.o), can=!CB.busy&&cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last), tx=cardTxt(cd,u), kws=Object.keys(KW).filter(k=>tx.includes(k)||((CARD_DEF[cd.k]||{}).x&&k==='소멸'));
    det.hidden=false; det.innerHTML=`<div class="cdd-h"><b>${esc(cardName(cd))}</b><span>비용 ${cardCost(cd)} · ${esc(u.c.name)}</span></div><p>${tx}</p>${kws.map(k=>`<p class="kw"><b>${k}</b> ${KW[k]}</p>`).join('')}<div class="row"><button class="btn sm" data-act="cbplay" data-i="${CB.sel}" ${can?'':'disabled'}>${can?'사용':cardCost(cd)>CB.energy?'에너지 부족':'쓸 수 없어요'}</button><button class="btn sm ghost" data-act="cbsel" data-i="-1">닫기</button></div>`; }
  else { det.hidden=true; det.innerHTML=''; }
  $('#cbEndB').disabled=CB.busy; }
function cbFx(id,txt,cls){ const el=document.getElementById(id); if(!el) return; const d=document.createElement('span'); d.className='dmg '+(cls||''); d.textContent=txt; el.appendChild(d); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(()=>d.remove(),800); }
function cbHitE(u,e,m,pops){ if(e.hp<=0) return 0; let d=cbAtkVal(u,m,e); const weak=BEATS[u.elem]===e.elem; if(e.blk){ const ab=Math.min(e.blk,d); e.blk-=ab; d-=ab; } e.hp=Math.max(0,e.hp-d); pops.push(['ce'+e.i,d?nf(d)+(weak?' 약점':''):'막음',weak?'weak':'']);
  if(e.hp<=0){ cbLog(`${e.name} 쓰러짐`); if(e.mark&&rgCount('markburst')){ const o=cbAliveE(); o.forEach(x=>{ x.mark+=e.mark; pops.push(['ce'+x.i,'낙인 +'+e.mark,'weak']); }); e.mark=0; } if(rgCount('vamp')){ const L=cbLead(), h=Math.round(L.maxhp*0.08*rgCount('vamp')); L.hp=Math.min(L.maxhp,L.hp+h); pops.push(['cbLead','+'+nf(h),'heal']); } }
  if(e.boss&&!e.enr&&e.hp>0&&e.hp<e.maxhp/2){ e.enr=true; e.str+=0.3; cbLog(`${e.name}이(가) 격노했어요! 공격 증가`); } return d; }
function cbOnExhaust(pops){ const n=rgCount('ashes'); if(!n||!CB) return; const L=cbLead(); cbAliveE().forEach(e=>cbHitE(L,e,0.35*n,pops)); cbLog('잿불이 튀어요'); }
function cbHealLead(v,pops){ const L=cbLead(); L.hp=Math.min(L.maxhp,L.hp+v); pops.push(['cbLead','+'+nf(v),'heal']); }
function cbPlay(i){ if(!CB||CB.busy||CB.over) return; const cd=CB.hand[i]; if(!cd) return; const u=cbUnit(cd.o), L=cbLead(); const cost=cardCost(cd); if(cost>CB.energy) return; if(cd.k==='echo'&&!CB.last) return;
  const df=CARD_DEF[cd.k]||CARD_DEF.strike, last1=CB.hand.length===1&&rgCount('lastcard')?2:1, m=(cd.up?df.mu:df.m)*last1, es=cbAliveE(), tg=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0], pops=[], ty=cardType(cd), chain=CB.last&&cardType(CB.last)==='atk';
  CB.energy-=cost; CB.hand.splice(i,1); CB.sel=-1; (df.x?CB.exh:CB.disc).push(cd); if(CB.disc1) CB.disc1=false; CB.played++; if(df.x) cbOnExhaust(pops);
  switch(cd.k){
    case 'strike': case 'heavy': if(tg) cbHitE(u,tg,m,pops); sfx('타격'); break;
    case 'slash': if(tg){ cbHitE(u,tg,m*(chain?1.6:1),pops); if(chain) cbLog('연계!'); } sfx('타격'); break;
    case 'twin': if(tg){ cbHitE(u,tg,m,pops); if(tg.hp>0) cbHitE(u,tg,m,pops); else { const t2=cbAliveE()[0]; if(t2) cbHitE(u,t2,m,pops); } } sfx('타격'); break;
    case 'combo': if(tg) cbHitE(u,tg,m*CB.played,pops); sfx('타격'); break;
    case 'sweep': es.forEach(e=>cbHitE(u,e,m,pops)); sfx('타격'); break;
    case 'brand': if(tg){ cbHitE(u,tg,m,pops); if(tg.hp>0){ const s=(cd.up?df.mku:df.mk)+rgCount('brandplus'); tg.mark+=s; pops.push(['ce'+tg.i,'낙인 +'+s,'weak']); } } sfx('타격'); break;
    case 'finisher': if(tg){ const st=tg.mark; tg.mark=0; cbHitE(u,tg,m*(1+st),pops); if(st) cbLog(`낙인 ${st}개를 터뜨렸어요!`); } sfx('타격'); break;
    case 'bleed': if(tg){ cbHitE(u,tg,m,pops); if(tg.hp>0){ const s=cd.up?df.blu:df.bl; tg.bleed+=s; pops.push(['ce'+tg.i,'출혈 +'+s,'weak']); } } sfx('타격'); break;
    case 'guard': case 'wall': case 'taunt': { const b=cbBlk(u,m); CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); sfx('확인'); break; }
    case 'bulwark': { const b=cbBlk(u,m); CB.block+=b; CB.retain=true; pops.push(['cbLead','🛡+'+nf(b)+' 보존','heal']); sfx('확인'); break; }
    case 'counter': { const b=cbBlk(u,m); CB.block+=b; CB.counter=Math.max(CB.counter,cbAtkVal(u,0.6)); pops.push(['cbLead','반격 태세','heal']); sfx('확인'); break; }
    case 'tactic': case 'focus': cbDraw(m); break;
    case 'plan': cbDraw(m); CB.disc1=true; break;
    case 'surge': CB.energy+=m; break;
    case 'aid': cbHealLead(Math.round(u.maxhp*0.12*m),pops); break;
    case 'revive': cbHealLead(Math.round(L.maxhp*m),pops); break;
    case 'expose': if(tg){ tg.vul+=m; pops.push(['ce'+tg.i,'취약','weak']); } break;
    case 'weaken': if(tg){ tg.weak+=m; pops.push(['ce'+tg.i,'약화','weak']); } break;
    case 'rally': CB.str+=m; pops.push(['cbLead','공격↑','heal']); break;
    case 'charge': { CB.charge=(CB.charge||0)+m; const b=cbBlk(u,0.5); CB.block+=b; pops.push(['cbLead','충전 '+CB.charge,'heal']); sfx('확인'); break; }
    case 'release': { const k=1+(CB.charge||0); es.forEach(e=>cbHitE(u,e,m*k,pops)); if(CB.charge) cbLog(`충전 ${CB.charge}을(를) 해방!`); CB.charge=0; sfx('타격'); break; }
    case 'sacrifice': { const j=CB.hand.length-1; if(j>=0){ const x=CB.hand.splice(j,1)[0]; CB.exh.push(x); cbLog(`「${cardName(x)}」 소멸`); cbOnExhaust(pops); } cbDraw(m); break; }
    case 'burnout': if(tg) cbHitE(u,tg,m,pops); sfx('타격'); break;
    case 'shieldbash': if(tg&&CB.block>0){ cbHitE(u,tg,CB.block*m/Math.max(1,u.atk*CB.str),pops); } else if(tg) pops.push(['ce'+tg.i,'보호막 없음','']); sfx('타격'); break;
    case 'entrench': { const b=CB.block; CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); sfx('확인'); break; }
    case 'hemorrhage': if(tg&&tg.bleed){ tg.bleed*=2; pops.push(['ce'+tg.i,'출혈 '+tg.bleed,'weak']); } break;
    case 'flurry': if(tg){ cbHitE(u,tg,m,pops); if(chain){ cbDraw(1); cbLog('연계! 카드 1장'); } } sfx('타격'); break;
    case 'spread': if(tg&&tg.mark){ es.forEach(e=>{ if(e!==tg){ e.mark+=tg.mark; pops.push(['ce'+e.i,'낙인 +'+tg.mark,'weak']); } }); } break;
    case 'overdrive': CB.ult=Math.min(ULT_MAX,CB.ult+m); pops.push(['cbLead','필살 +'+m,'heal']); break;
    case 'rage': CB.rage=(CB.rage||0)+cbBlk(L,m); pops.push(['cbLead','투지','heal']); break;
    case 'echo': if(CB.last){ CB.hand.push(Object.assign({},CB.last)); cbLog(`「${cardName(CB.last)}」을(를) 복사했어요`); } break;
    case 'skill': { const sk=u.c.skill, pw=sk.power*(cd.up?df.mu:1)*last1; skillCut(u.c,sk.name,!['off','small'].includes(P().skillCut||'auto'),$('.cb')); sfx('스킬'); cbLog(`${u.name}: ${sk.name}`); cbSkill(u,sk,pw,tg,es,pops); break; }
  }
  if(cd.k!=='echo') CB.last=cd;
  if((ty==='atk'||(cd.k==='skill'&&['dmg','aoe'].includes(u.c.skill.kind)))&&CB.rage){ CB.block+=CB.rage; pops.push(['cbLead','🛡+'+nf(CB.rage),'heal']); }
  if(ty==='atk'||(cd.k==='skill'&&['dmg','aoe'].includes(u.c.skill.kind))){ CB.atkN++; if(L.role==='atk'&&CB.atkN%3===0){ const t2=cbAliveE()[0]; if(t2){ cbHitE(L,t2,0.8,pops); cbLog(`${L.name}의 맹공!`); } } }
  CB.ult=Math.min(ULT_MAX,CB.ult+1);
  if(CB.played===4&&rgCount('chain4')){ CB.energy+=rgCount('chain4'); cbLog('연쇄 반응! 에너지 +1'); }
  if(CB.played===6&&rgCount('tempo')){ cbDraw(2*rgCount('tempo')); cbLog('리듬! 카드 2장'); }
  cbRender(); pops.forEach(p=>cbFx(...p)); if(!cbAliveE().length) setTimeout(()=>cbEnd(true),500); }
function cbSkill(u,sk,pw,tg,es,pops){
  if(sk.kind==='dmg'&&tg) cbHitE(u,tg,pw*1.3,pops);
  if(sk.kind==='aoe') es.forEach(e=>cbHitE(u,e,pw*0.9,pops));
  if(sk.kind==='heal') cbHealLead(cbSkillVal(u,sk,pw),pops);
  if(sk.kind==='shield'){ const b=cbSkillVal(u,sk,pw); CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); }
  if(sk.kind==='buff'){ CB.str+=cbSkillVal(u,sk,pw); pops.push(['cbLead','공격↑','heal']); } }
function cbUlt(){ if(!CB||CB.busy||CB.over||CB.ult<ULT_MAX) return; const L=cbLead(), sk=L.c.skill, es=cbAliveE(), tg=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0], pops=[];
  CB.ult=0; skillCut(L.c,sk.name,true,$('.cb')); sfx('스킬'); cbLog(`필살! ${L.name}: ${sk.name}`); if(rgCount('ultecho')){ CB.energy+=rgCount('ultecho'); cbDraw(2); }
  if(sk.kind==='dmg'||sk.kind==='aoe'){ es.forEach(e=>cbHitE(L,e,sk.power*(sk.kind==='dmg'&&e===tg?2.4:1.4),pops)); } else { cbSkill(L,sk,sk.power*2.2,tg,es,pops); if(tg) cbHitE(L,tg,1.2,pops); }
  const r=$('.cb'); if(r){ r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); }
  cbRender(); pops.forEach(p=>cbFx(...p)); if(!cbAliveE().length) setTimeout(()=>cbEnd(true),500); }
function cbEndTurn(){ if(!CB||CB.busy||CB.over) return; CB.busy=true; CB.sel=-1; CB.disc.push(...CB.hand); CB.hand=[]; cbRender();
  const acts=CB.enemies.filter(en=>en.hp>0); let k=0; const L=cbLead();
  const step=()=>{ if(!CB||CB.over) return; if(k>=acts.length){ CB.enemies.forEach(en=>{ if(en.vul>0) en.vul--; if(en.weak>0) en.weak--; }); if(L.hp<=0){ cbEnd(false); return; } cbIntents(); cbTurn(false); return; }
    const e=acts[k++]; if(e.hp<=0){ step(); return; } const pops=[];
    if(e.bleed>0){ const d=Math.max(1,Math.round(L.atk*0.12*e.bleed*(1+0.5*rgCount('deepcut')))); e.hp=Math.max(0,e.hp-d); pops.push(['ce'+e.i,nf(d)+' 출혈','weak']); e.bleed--; if(e.hp<=0){ cbLog(`${e.name}이(가) 출혈로 쓰러졌어요`); cbRender(); pops.forEach(p=>cbFx(...p)); if(!cbAliveE().length){ setTimeout(()=>cbEnd(true),500); return; } setTimeout(step,420); return; } }
    e.blk=0; const it=e.intent||{k:'atk',m:1};
    const hit=m=>{ if(L.hp<=0) return; let d=cbEnemyDmg(e,m,L), ab=0; if(CB.block){ ab=Math.min(CB.block,d); CB.block-=ab; d-=ab; } L.hp=Math.max(0,L.hp-d); pops.push(['cbLead',d?nf(d):'막음',d?'':'heal']);
      if(ab&&rgCount('thorns')){ const r=Math.round(ab*0.3*rgCount('thorns')); e.hp=Math.max(0,e.hp-r); pops.push(['ce'+e.i,nf(r)+' 가시','weak']); }
      if(CB.counter&&e.hp>0){ e.hp=Math.max(0,e.hp-CB.counter); pops.push(['ce'+e.i,nf(CB.counter)+' 반격','weak']); }
      if(L.hp<=0&&CB.phoenix){ CB.phoenix=false; L.hp=Math.round(L.maxhp*0.3); cbLog('불사의 깃털이 타올라 다시 일어났어요!'); } };
    if(it.k==='atk'||it.k==='heavy') hit(it.m);
    else if(it.k==='multi') for(let n=0;n<(it.n||2);n++) hit(it.m);
    else if(it.k==='def'){ e.blk=Math.round(e.maxhp*0.14); pops.push(['ce'+e.i,'🛡+'+nf(e.blk),'heal']); }
    else { e.str+=0.2; pops.push(['ce'+e.i,'공격↑','']); }
    if(it.k==='heavy'){ const r=$('.cb'); if(r){ r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); } }
    sfx('타격'); cbRender(); const ee=document.getElementById('ce'+e.i); if(ee){ ee.classList.remove('act'); void ee.offsetWidth; ee.classList.add('act'); } pops.forEach(p=>cbFx(...p));
    if(!cbAliveE().length){ setTimeout(()=>cbEnd(true),500); return; }
    if(L.hp<=0){ setTimeout(()=>cbEnd(false),500); return; } setTimeout(step,520); };
  setTimeout(step,250); }
function cbEnd(win){ if(!CB||CB.over) return; CB.over=true; CB.busy=true; cbRender(); const L=cbLead();
  B={ctx:{kind:'rogue',node:CB.kind},allies:[{c:L.c,hp:L.hp,maxhp:L.maxhp}],enemies:[],over:true,s:{}};
  bump('battle'); bResultShow(rogueEnd(win),'.cb'); CB=null; }

/* --- 던전 화면 --- */
function dgHTML(run){ const map=run.map, here=run.pos, W=map.w;
  const reach=new Set(); map.cells.forEach((c,i)=>{ if(c&&c.seen&&i!==here&&dgPath(map,here,i)) reach.add(i); });
  const cells=map.cells.map((c,i)=>{ if(!c) return `<div class="dg-c wall"></div>`; if(!c.seen) return `<div class="dg-c fog"></div>`;
    const r=i%W<W-1&&map.cells[i+1]&&dgLinked(map,i,i+1)&&(c.vis||map.cells[i+1].vis), b=map.cells[i+W]&&dgLinked(map,i,i+W)&&(c.vis||map.cells[i+W].vis);
    const t=c.done&&!['stairs','boss'].includes(c.t)?(c.t==='start'?'start':'empty'):c.t, ic=DG_ROOM[t][0];
    return `<button class="dg-c room ${c.vis?'vis':'scout'} r-${t} ${r?'dr':''} ${b?'db':''} ${i===here?'here':''} ${reach.has(i)?'go':''}" data-act="dgmove" data-v="${i}" ${reach.has(i)?'':'disabled'} title="${esc(DG_ROOM[t][1])}"><i>${ic}</i></button>`; }).join('');
  const lead=charById(run.squad.find(id=>run.hp[id]>0)||run.squad[0]);
  const hx=here%W, hy=Math.floor(here/W);
  return `<div class="dg-wrap"><div class="dg" id="dgMap" style="--w:${W};--h:${map.h}">${cells}<div class="dg-hero" id="dgHero" style="--x:${hx};--y:${hy}">${lead?`<img data-pix="${lead.id}" alt=""><span class="dg-fb">${esc(lead.name.slice(0,1))}</span>`:''}</div></div>
    <div class="dg-leg">${['battle','elite','treasure','rest','event',run.floor>=DG_FLOORS?'boss':'stairs'].map(k=>`<span><i class="r-${k}">${DG_ROOM[k][0]}</i>${DG_ROOM[k][1]}</span>`).join('')}</div></div>`; }
/* 던전 칸으로 이동(Controller): 이동 시작(Model) → 걸어가는 연출(View) → 도착(Model) → 그 칸의 일 */
function dgMove(to){ const run=progSlot('rogue').run; if(!run||run.busy) return; const path=dgPath(run.map,run.pos,to); if(!path) return; dgWalkStart(run); dgHeroWalk(path,run.map.w,()=>{ dgArrive(run,to); dgEnter(run); }); }
/* 이동 시작·도착(Model) */
function dgWalkStart(run){ run.busy=true; }
function dgArrive(run,to){ run.busy=false; run.pos=to; dgReveal(run.map,to); }
/* 주인공이 경로를 따라 걷는 연출(View) — 끝나면 done */
function dgHeroWalk(path,W,done){ const hero=$('#dgHero'); let k=1; const go=()=>{ if(k<path.length){ const i=path[k++]; if(hero){ hero.style.setProperty('--x',i%W); hero.style.setProperty('--y',Math.floor(i/W)); } sfx('확인'); setTimeout(go,170); return; } done(); }; go(); }
function dgEnter(run){ const c=run.map.cells[run.pos]; run.msg=''; if(c.done&&c.t!=='stairs'&&c.t!=='boss'){ mark('prog'); render(); return; }
  const t=c.t;
  if(t==='battle'||t==='elite'||t==='boss'){ mark('prog'); if(run.mode!=='auto') cbStart(t); else rgBattle(t); return; }
  if(t==='stairs'){ run.msg='아래로 이어지는 계단이에요.'; mark('prog'); render(); return; }
  c.done=true;
  if(t==='treasure'){ run.pick=rgPick3(run); run.msg='유물 상자를 찾았어요!'; }
  if(t==='rest'){ run.rest=true; run.msg='조용한 야영지예요. 무엇을 할까요?'; }
  if(t==='event'){ const x=Math.random();
    if(x<0.25){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.4); }); run.msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
    else if(x<0.5&&run.mode==='card'){ run.cpick=cardOffer(run); run.msg='쓰러진 탐사대의 전술 기록을 찾았어요. 카드 1장을 고를 수 있어요.'; }
    else if(x<0.7){ if(Math.random()<0.5){ run.pick=rgPick3(run); run.msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); run.msg='함정이었어요! 모두 체력 -20%.'; } }
    else if(x<0.85){ const m=run.map; m.cells.forEach((cc,i)=>{ if(cc) cc.seen=true; }); run.msg='낡은 지도를 주웠어요. 이 구역의 구조가 모두 드러났어요.'; }
    else { run.relics.push('train'); run.msg='잠깐의 실전 훈련. 공격 +5%.'; } }
  mark('prog'); render(); }
function dgDescend(run){ run.floor++; run.fw=0; run.map=dgGen(run.floor); run.pos=run.map.start; run.msg=`제${run.floor}구역에 진입했어요.${run.floor>=DG_FLOORS?' 이 구역 어딘가에 보스가 있어요.':''}`; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); mark('prog'); render(); }
// Translate only legacy system messages for display; never rewrite a saved run.
function rgMessage(run){
 const msg=String(run.msg||'');
 const legacy={'심연의 기운이 바뀌어 1층으로 돌아왔어요. 같은 탐사대로 처음부터 다시 내려가요.':'탐사 경로가 바뀌어 제1구역으로 돌아왔어요. 같은 탐사대로 처음부터 다시 시작해요.','낡은 지도를 주웠어요. 이 층의 구조가 모두 드러났어요.':'낡은 지도를 주웠어요. 이 구역의 구조가 모두 드러났어요.','야영지에서 쉬다가 다시 내려왔어요.':'야영지에서 쉬다가 탐사를 이어가요.'};
 if(Object.prototype.hasOwnProperty.call(legacy,msg))return legacy[msg];
 const m=msg.match(/^지하 (\d+)층에 내려왔어요\.( 이 층 어딘가에 보스가 있어요\.)?$/);
 return m?`제${m[1]}구역에 진입했어요.${m[2]?' 이 구역 어딘가에 보스가 있어요.':''}`:msg;
}
function rgRunHTML2(run){ const g=progRead('rogue'); const c=run.map.cells[run.pos];
  let body;
  let ov='';
  if(run.pick){ ov=`<div class="rg-ov"><div class="rg-ban">유물을 선택하십시오</div><div class="rg-picks rg-ovp">`+run.pick.filter(k=>RELICS[k]).map((k,j)=>{ const n=rgCount(k); return `<button class="rg-relic" style="animation-delay:${j*0.09}s" data-act="rgrelic" data-v="${k}"><b>${esc(RELICS[k][0])}${n?` <small>×${n+1}</small>`:''}</b><span>${esc(RELICS[k][1])}</span></button>`; }).join('')+`</div><button class="btn rg-skipb" data-act="rgskip">넘기기 <small>(체력 10% 회복)</small></button></div>`; }
  else if(run.cpick){ ov=`<div class="rg-ov"><div class="rg-ban">카드를 선택하십시오</div><div class="cd-row rg-ovc">${run.cpick.map((cd,i)=>cardHTML(cd,{act:'rgcard',i,sty:`animation-delay:${i*0.09}s`})).join('')}</div><button class="btn rg-skipb" data-act="rgcard" data-i="-1">넘기기</button></div>`; }
  if(run.upg){ const list=run.deck.map((cd,i)=>({cd,i})).filter(x=>!x.cd.up); body=`<h4 class="ch-sub">강화할 카드를 고르세요</h4><div class="cd-row wrap">${list.map(x=>cardHTML(x.cd,{act:'rgupg',i:x.i})).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgupg" data-i="-1">취소</button></div>`; }
  else if(run.rm){ body=`<h4 class="ch-sub">덱에서 뺄 카드를 고르세요</h4><div class="cd-row wrap">${run.deck.map((cd,i)=>cardHTML(cd,{act:'rgrm',i})).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgrm" data-i="-1">취소</button></div>`; }
  else if(run.rest){ body=`<h4 class="ch-sub">야영지</h4><div class="rg-nodes"><button class="rg-node n-rest" data-act="rgrest" data-v="heal"><em>⛺</em><b>휴식</b><span>체력 35% 회복 · 쓰러진 대원 부활</span></button>${run.mode==='card'?`<button class="rg-node n-treasure" data-act="rgrest" data-v="upg"><em>⚒</em><b>카드 강화</b><span>카드 1장을 + 로 강화</span></button><button class="rg-node n-event" data-act="rgrest" data-v="rm"><em>✂</em><b>정리</b><span>덱에서 카드 1장 빼기</span></button><button class="rg-node n-rest" data-act="rgsave"><em>💾</em><b>저장하고 나가기</b><span>여기서 멈추고 나중에 이어서 해요. 탐사 경로는 매주 월요일에 바뀌어서, 그 전에 돌아와야 해요</span></button>`:`<button class="rg-node n-treasure" data-act="rgrest" data-v="train"><em>⚒</em><b>훈련</b><span>공격 +5%</span></button>`}</div>`; }
  else { body=dgHTML(run)+((c.t==='stairs')?`<div class="row" style="margin-top:8px"><button class="btn" data-act="dgdown">▼ 제${run.floor+1}구역으로 이동</button></div>`:`<p class="muted dg-hint">밝은 방을 누르면 그곳으로 이동해요. 옆방은 미리 보여요.</p>`); }
  return `${ov}<section class="ch-card rog dgcard"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${DG_FLOORS}</i><h3>${esc(T('abyss'))}</h3>${run.msg?`<span class="rg-msg">${esc(rgMessage(run))}</span>`:''}</div>
    <div class="rg-sq">${run.squad.map((id,i)=>{ const c=charById(id), h=run.hp[id]==null?1:run.hp[id]; if(!c) return ''; if(run.mode!=='auto'&&i>0) return `<div class="rg-u card"><div class="rg-a">${art(c)}</div><b>${esc(c.name)}</b><span class="muted" style="font-size:.62rem">카드</span></div>`; return `<div class="rg-u ${h<=0?'down':''} ${run.mode!=='auto'?'lead':''}"><div class="rg-a">${art(c)}</div><b>${esc(c.name)}${run.mode!=='auto'?' · 리더':''}</b><span class="hpb"><i style="width:${Math.round(h*100)}%"></i></span></div>`; }).join('')}</div>
    ${run.mode!=='auto'&&charById(run.squad[0])?`<p class="muted" style="font-size:.75rem;margin:4px 0">◆ 리더 능력 「${esc((LEAD_AB[charById(run.squad[0]).role]||LEAD_AB.atk)[0])}」 ${esc((LEAD_AB[charById(run.squad[0]).role]||LEAD_AB.atk)[1])} · 필살: ${esc(charById(run.squad[0]).skill.name)}</p>`:''}
    ${run.relics.length?`<div class="rg-rel">${[...new Set(run.relics)].map(k=>`<span title="${esc(RELICS[k][1])}">${esc(RELICS[k][0])}${rgCount(k)>1?' ×'+rgCount(k):''}</span>`).join('')}</div>`:''}
    ${body}<div class="row" style="margin-top:10px">${run.mode==='card'?`<button class="btn sm ghost" data-act="rgdeck">덱 ${run.deck.length}장 보기</button>`:''}<button class="btn sm ghost" data-act="rgquit">탐사 끝내기</button></div></section>`; }
function rgDeckModal(deck){ const miss=new Set(deck.filter(cd=>!cardIllObj(cd)).map(cd=>cd.o+'|'+cd.k)).size;
  openModal(`${head('덱',`<span class="muted">${deck.length}장 · 매 턴 5장을 뽑고 에너지 3으로 써요</span>`)}${miss&&imgReady()?`<div class="row" style="margin:0 0 8px"><button class="btn sm" data-act="cdart">카드 일러스트 그리기 (${miss}장)</button><span class="muted" style="font-size:.75rem">대원·카드마다 한 장씩, 그림 AI 사용량이 들어요</span></div>`:''}<div class="cd-row wrap">${deck.map(cd=>cardHTML(cd,{})).join('')}</div>`); }

// 심연 탐사 전용 편성: 리더 1명이 앞에, 카드가 될 3명이 뒤에 붙는 ㅗ 모양
let RF=null;
function rfIds(){ return RF.s[0]?RF.s.filter(Boolean):[]; }
function rfAuto(){ const busy=busyIds(), pool=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)).sort((a,b)=>charPower(b)-charPower(a)); const out=[]; const L=pool.find(c=>c.role==='atk')||pool[0]; if(L) out.push(L.id);
  ['sup','def','atk'].forEach(r=>{ const c=pool.find(x=>x.role===r&&!out.includes(x.id)); if(c&&out.length<4) out.push(c.id); }); pool.forEach(c=>{ if(out.length<4&&!out.includes(c.id)) out.push(c.id); });
  return [0,1,2,3].map(i=>out[i]||null); }
function openRgForm(){ const busy=busyIds();
  if(!RF){ const prev=(progRead('rogue').lastSquad||P().squad||[]).filter(id=>own(id)&&charById(id)&&!busy.has(id)).slice(0,4); RF={s:prev.length?[0,1,2,3].map(i=>prev[i]||null):rfAuto(),sel:0,filter:'all'}; }
  const L=charById(RF.s[0]), ids=rfIds(), deck=ids.length?rgDeck(ids):[];
  const chip=cd=>`<span class="rf-cd t-${cardType(cd)}">${esc(cardName(cd))}</span>`;
  const lead=L?`<button class="rf-lead ${RF.sel===0?'sel':''}" data-act="rfslot" data-i="0" style="--ec:${ECOL[L.elem]}"><div class="rf-la">${art(L)}</div><div class="rf-lt"><i>LEADER · 직접 싸워요</i><b>${esc(L.name)}</b><span class="el" style="--ec:${ECOL[L.elem]}">${esc(L.elem)}</span> <small>${esc(ROLE[L.role])} · Lv.${own(L.id).lv}</small>
      <p><b>리더 능력 · ${esc((LEAD_AB[L.role]||LEAD_AB.atk)[0])}</b> ${esc((LEAD_AB[L.role]||LEAD_AB.atk)[1])}</p><p><b>필살기 · ${esc(L.skill.name)}</b> 게이지 ${ULT_MAX}칸이 차면 써요.</p><div class="rf-cds">${chip({k:'strike',o:L.id})}<em>×4</em>${chip({k:'guard',o:L.id})}<em>×4</em></div></div></button>`
    :`<button class="rf-lead empty ${RF.sel===0?'sel':''}" data-act="rfslot" data-i="0"><span>+</span><b>리더를 골라 주세요</b><small>아래 목록에서 ${esc(T('crew'))}을(를) 누르면 이 자리에 들어가요</small></button>`;
  const sup=i=>{ const c=charById(RF.s[i]); if(!c) return `<button class="rf-sup empty ${RF.sel===i?'sel':''}" data-act="rfslot" data-i="${i}"><span>+</span><small>카드 ${i}</small></button>`;
    const cds=L?rgDeck([L.id,c.id]).slice(8):[]; return `<button class="rf-sup ${RF.sel===i?'sel':''}" data-act="rfslot" data-i="${i}" style="--ec:${ECOL[c.elem]}"><div class="rf-sa">${art(c)}</div><b>${esc(c.name)}</b><small>${esc(ROLE[c.role])}</small><div class="rf-cds">${cds.map(chip).join('')}</div></button>`; };
  const list=G.chars.filter(c=>own(c.id)&&(RF.filter==='all'||c.role===RF.filter)).sort((a,b)=>charPower(b)-charPower(a));
  openModal(`${head(esc(T('abyss'))+' 편성','<span class="muted">리더 1명이 직접 싸우고, 뒤의 3명은 카드가 되어 덱에 들어가요</span>')}
    <div class="rf-tee">${lead}<div class="rf-stem"></div><div class="rf-sups">${[1,2,3].map(sup).join('')}</div></div>
    <p class="muted" style="margin:6px 0 0;font-size:.75rem">자리를 누른 뒤 아래에서 ${esc(T('crew'))}을(를) 고르세요. 이미 편성된 ${esc(T('crew'))}을(를) 고르면 자리가 바뀌어요.</p>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="rfauto">자동 편성</button><button class="btn sm ghost" data-act="rfclr">비우기</button>${deck.length&&imgReady()&&deck.some(cd=>!cardIllObj(cd))?'<button class="btn sm ghost" data-act="cdart">카드 일러스트 그리기</button>':''}</div>
    <div class="ftools" style="margin-top:10px"><div class="chips">${[['all','전체'],...Object.entries(ROLE)].map(([v,l])=>`<button class="chip ${RF.filter===v?'on':''}" data-act="rffil" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>
    <div class="froster">${list.map(c=>{ const k=RF.s.indexOf(c.id), b=busy.has(c.id); return `<button class="fr r${c.rarity} ${k>=0?'on':''} ${b?'busy':''}" data-act="rfpick" data-id="${c.id}" ${b?'disabled':''} style="--ec:${ECOL[c.elem]}"><div class="fr-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${b?'<em class="busy">파견</em>':k>=0?`<em class="num">${k?'카드':'리더'}</em>`:''}<b>${esc(c.name)}</b><span>${esc(ROLE[c.role])} · ${nf(charPower(c))}</span></button>`; }).join('')||'<p class="muted">보유한 '+T('crew')+'이(가) 없어요.</p>'}</div>
    ${deck.length?`<details class="rf-deck"><summary>시작 덱 ${deck.length}장 전체 보기</summary><div class="cd-row wrap">${deck.map(cd=>cardHTML(cd,{})).join('')}</div></details>`:''}
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="rfgo" ${L?'':'disabled'}>${L?`탐사 시작 (리더 ${esc(L.name)} · 카드 ${ids.length-1}명)`:'리더를 먼저 골라 주세요'}</button></div>`); }

// 심연 탐사 전용 화면(진행 중일 때 화면 전체를 써요)
/* 탐사 끝내기(Controller): 정산 뒤 결과 창 */
function rgAbandon(why){ const html=rgFinish(false); setTimeout(()=>openRgResult(html,'탐사가 끝났어요',why),0); }
/* 심연·도전 화면에 들어가기 전 처리(Controller — render가 그리기 전에 부름): 저장 없이 나간 탐사는 끝내고, 심연 화면은 탐사가 없으면 도전 화면으로·주가 바뀌면 같은 탐사대로 처음부터·저장 표시 지움, 예전 형식 탐사는 고를 유물이 비면 다시 뽑음 */
function rogueTick(){ if(tab!=='abyss'&&tab!=='challenge') return; const g=progSlot('rogue'), run=g.run;
  if(run&&run.v===2&&(run.left||(!RG_LIVE&&!run.saved))){ rgAbandon('야영지에서 저장하지 않고 나가서 탐사가 끝났어요. 저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요.'); if(tab==='abyss') tab='challenge'; return; }
  if(tab==='challenge'){ if(run&&run.v!==2&&run.pick&&!run.pick.filter(k=>RELICS[k]).length){ run.pick=rgPick3(run); mark('prog'); } return; }
  if(!run||run.v!==2){ tab='challenge'; return; }
  RG_LIVE=true; if(!run.wk){ run.wk=weekKey(); mark('prog'); }
  if(run.wk!==weekKey()){ const sq=run.squad.slice(), html=rgFinish(false); rgRunNew(sq,'card'); progSlot('rogue').run.msg='탐사 경로가 바뀌어 제1구역으로 돌아왔어요. 같은 탐사대로 처음부터 다시 시작해요.'; mark('prog'); setTimeout(()=>openRgResult(html,'탐사 경로가 바뀌었어요','지난주 탐사는 여기까지예요. 제1구역부터 다시 시작해요.'),0); }
  if(run.saved){ delete run.saved; mark('prog'); } }
function abyssHTML(){ const run=progRead('rogue').run; if(!run||run.v!==2) return challengeHTML();
  setTimeout(pixFill,30);
  return `<div class="phead"><button class="back" data-act="rgleave" aria-label="나가기">‹</button><div><i>EXPEDITION</i><h2>${esc(T('abyss'))}</h2></div></div>${rgRunHTML2(run)}`; }
function challengeHTML(){
  const r=progRead('raid'), b=raidBoss(), ratio=r.dmg/b.total, left=raidTriesLeft(), g=progRead('rogue'), run=g.run;
  const raid=`<section class="ch-card raid"><div class="ch-h"><i>WEEKLY RAID · Lv.${r.lv}</i><h3>${esc(b.name)}</h3><span>이번 주 함께 깎는 보스예요. 한 번에 ${Math.ceil(RAID_TICKS*GGMCombat.DT)}초 동안 싸우고, 준 피해가 쌓여요.</span></div>
    <div class="rd-hero ${r.killed?'dead':''}" style="--ec:${ECOL[b.elem]}"><div class="rd-bg" style="${b.bg?bgStyle(b.bg):bgStyle(P().lobbyBg||'')}"></div><div class="rd-glow"></div>
      <div class="rd-boss">${enemyArt(b,'rd-img')}</div><div class="rd-shade"></div>
      <div class="rd-tag"><span class="el" style="--ec:${ECOL[b.elem]}">${esc(b.elem)}</span><i>WEEKLY RAID BOSS</i></div>
      <div class="rd-name"><b>${esc(b.name)}</b><span>Lv.${r.lv} · 남은 체력 ${Math.max(0,100-Math.min(100,Math.floor(ratio*1000)/10))}%</span></div>
      <div class="rd-pats">${bossPats(b,true).map(k=>`<span title="${esc(BPATS[k][1])}">${esc(BPATS[k][0])}</span>`).join('')}<span title="체력 50% 이하에서 공격·속도 증가">광폭화</span></div>
      <div class="rd-hp"><i style="width:${Math.max(0,100-Math.min(100,ratio*100))}%"></i><span>${nf(Math.max(0,b.total-r.dmg))} / ${nf(b.total)}</span></div>
      ${r.killed?'<div class="rd-stamp">토벌 완료</div>':''}</div>
    <div class="rd-ms">${RAID_MS.map(([t,rw],i)=>`<span class="${r.got.includes(i)?'on':''}" title="${esc(rewardText(rw))}">${Math.round(t*100)}%</span>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="raidgo" ${left&&!r.killed?'':'disabled'}>${r.killed?'이번 주 토벌 완료':'도전 (오늘 '+left+'/3)'}</button></div>
    <p class="muted" style="margin:6px 0 0;font-size:.78rem">최고 피해 ${nf(r.best||0)} · 토벌하면 다음 주에 더 강한 보스가 나와요.</p></section>`;
  let rog;
  if(!run){ rog=`<section class="ch-card rog"><div class="ch-h"><i>EXPEDITION · ${DG_FLOORS} AREAS</i><h3>${esc(T('abyss'))}</h3><span>한 번 고른 4명으로 ${DG_FLOORS}개 구역을 탐사해요. 미지의 경로에서 전투·보물·야영지·사건을 만나고 다음 구역으로 이동해요. 마지막 구역에는 보스가 기다려요. 체력은 이어져요.</span></div>
      <p class="muted" style="margin:8px 0">최고 진척 ${g.best||0}/${RG_FLOORS} · 오늘 ${g.day===today()?g.n:0}번 (3번째부터 보상 25%)</p><div class="rg-mode one"><button class="rg-node n-treasure" data-act="rgnew" data-v="card"><em>🂠</em><b>탐사 시작</b><span>첫 번째로 고른 ${esc(T('crew'))}이(가) 리더로 싸우고, 나머지는 카드가 되어 능력을 빌려줘요.</span></button></div></section>`; }
  else if(run.v===2){ const L=charById(run.squad[0]), c=run.map.cells[run.pos]; rog=`<section class="ch-card rog dgcard"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${DG_FLOORS}</i><h3>${esc(T('abyss'))} 진행 중</h3><span>${L?`리더 ${esc(L.name)} · `:''}제${run.floor}구역${run.rest?' 야영지':''}${run.saved?' · 저장됨':''}${run.wk&&run.wk!==weekKey()?' · 탐사 경로가 바뀌었어요(제1구역부터 다시)':''}</span></div><div class="rg-mode one"><button class="rg-node n-treasure" data-act="go" data-to="abyss"><em>▶</em><b>이어서 탐사하기</b><span>화면 전체로 던전을 탐색해요</span></button></div></section>`; }
  else {
    const nodes=run.pick?`<h4 class="ch-sub">유물을 하나 고르세요</h4><div class="rg-picks">${run.pick.filter(k=>RELICS[k]).map(k=>{ const n=run.relics.filter(x=>x===k).length; return `<button class="rg-relic" data-act="rgrelic" data-v="${k}"><b>${esc(RELICS[k][0])}${n?` <small>×${n+1}</small>`:''}</b><span>${esc(RELICS[k][1])}${n?' · 겹쳐서 더 강해져요':''}</span></button>`; }).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgskip">고르지 않고 지나가기 (체력 10% 회복)</button></div>`
      :`<h4 class="ch-sub">${run.floor}구역 · 어디로 갈까요?</h4><div class="rg-nodes">${(run.opts||[]).map(k=>`<button class="rg-node n-${k}" data-act="rgnode" data-v="${k}"><em>${RG_NODE[k][0]}</em><b>${RG_NODE[k][1]}</b><span>${RG_NODE[k][2]}</span></button>`).join('')}</div>`;
    rog=`<section class="ch-card rog"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${RG_FLOORS}구역</i><h3>${esc(T('abyss'))}</h3>${run.msg?`<span class="rg-msg">${esc(rgMessage(run))}</span>`:''}</div>
      <div class="rg-sq">${run.squad.map(id=>{ const c=charById(id), h=run.hp[id]||0; return c?`<div class="rg-u ${h<=0?'down':''}"><div class="rg-a">${art(c)}</div><b>${esc(c.name)}</b><span class="hpb"><i style="width:${Math.round(h*100)}%"></i></span></div>`:''; }).join('')}</div>
      ${run.relics.length?`<div class="rg-rel">${[...new Set(run.relics)].map(k=>`<span title="${esc(RELICS[k][1])}">${esc(RELICS[k][0])}${rgCount(k)>1?' ×'+rgCount(k):''}</span>`).join('')}</div>`:''}
      ${nodes}<div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="rgquit">탐사 끝내기</button></div></section>`; }
  return `${pageHead('도전','CHALLENGE','lobby')}${raid}${towerHTML()}${rog}`;
}
/* 심연 탐사 런: 층·유물·노드 고르기·적·시작·전투·끝·보상(도전 레이드 파일에서 모음) */
const RG_FLOORS=12;

const RELICS={chain4:['연쇄 반응','한 턴에 카드를 4장째 쓰면 에너지 +1'],brandplus:['피의 낙인','낙인을 걸 때 1개 더'],phoenix:['불사의 깃털','전투마다 한 번, 쓰러질 때 체력 30%로 버텨요'],thorns:['가시 갑옷','보호막으로 막은 피해의 30%를 공격한 적에게 돌려줘요'],opener:['선제 낙인','전투 시작 때 모든 적에게 낙인 2'],lastcard:['마지막 한 장','손에 남은 마지막 카드는 위력 2배'],ultcharge:['필살 충전기','필살 게이지를 2칸 채운 채 전투 시작'],vamp:['흡혈 송곳니','적을 쓰러뜨릴 때마다 리더 체력 8% 회복'],ashes:['잿불','카드가 소멸할 때마다 모든 적에게 피해'],deepcut:['깊은 상처','출혈 피해 +50%'],tempo:['리듬','한 턴에 카드를 6장째 쓰면 카드 2장 뽑기'],markburst:['각인 전염','낙인이 남은 적이 쓰러지면 그 낙인이 다른 적 모두에게 옮겨 붙어요'],ultecho:['잔영','필살을 쓰면 에너지 +1, 카드 2장 뽑기'],capacitor:['축전기','전투 시작 때 충전 3'],firstfree:['첫 수','매 턴 첫 카드 비용 -1'],atk:['날카로운 칼날','공격 +15%'],def:['강화 장갑','방어 +25%'],hp:['생명의 결정','최대 체력 +20%'],spd:['가속 장치','속도 +10%'],burst:['오버드라이브','전투 시작 BURST +40%'],heal:['응급 키트','전투가 끝날 때마다 체력 15% 회복'],loot:['전리품 자석','탐사 보상 +30%'],res:['공명 코어','공격 +8% · 체력 +8%'],train:['실전 훈련','공격 +5% (겹쳐요)']};
const RG_NODE={battle:['⚔','전투','일반 적'],elite:['☠','정예','강한 적 · 이기면 유물'],rest:['⛺','휴식','체력 35% 회복, 쓰러진 대원 부활'],treasure:['✦','보물','유물 1개 고르기'],event:['?','사건','무슨 일이 생길지 몰라요'],boss:['♛','보스','마지막 전투']};
function rgCount(id){ const run=progRead('rogue').run; return run?run.relics.filter(x=>x===id).length:0; }
function rgOpts(run){ if(run.floor>=RG_FLOORS) return ['boss']; const w=[['battle',45],['elite',15],['rest',15],['treasure',10],['event',15]]; const out=[]; let guard=0;
  while(out.length<3&&guard++<40){ let x=Math.random()*100; const k=w.find(([_,p])=>(x-=p)<0)[0]; if(!out.includes(k)) out.push(k); } if(!out.includes('battle')&&!out.includes('elite')) out[0]='battle'; return out; }
const CRELICS=['chain4','brandplus','phoenix','thorns','opener','lastcard','ultcharge','vamp','firstfree','ashes','deepcut','tempo','markburst','ultecho','capacitor','atk','hp','loot'];
function rgPick3(run){ const take=(arr,n)=>{ const a=[...arr], o=[]; while(o.length<n&&a.length) o.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); return o; };
  if(run.c3){ const fresh=CRELICS.filter(k=>!run.relics.includes(k)||['atk','hp','loot'].includes(k)); return take(fresh.length>=3?fresh:CRELICS,3); }
  let out=take(Object.keys(RELICS).filter(k=>k!=='train'&&!run.relics.includes(k)),3);
  if(out.length<3) out.push('train');
  if(out.length<3) out=out.concat(take(Object.keys(RELICS).filter(k=>k!=='train'&&!out.includes(k)),3-out.length));
  return out; }
function rgEnemies(run,kind){ const pool=[]; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(!pool.some(x=>x.name===e.name)) pool.push(e); })));
  const pick=boss=>{ const c=pool.filter(e=>!!e.boss===boss); const src=(c.length?c:pool)[Math.floor(Math.random()*(c.length||pool.length||1))]||{name:'미확인 적',elem:ELEMS[0]}; return {name:src.name,elem:src.elem||ELEMS[0],hp:900,atk:85,def:35,spd:92,boss}; };
  const k=run.k+run.floor*0.12, i=run.floor*0.5; let en;
  if(kind==='boss'){ en=[pick(true),pick(false)]; fitEnemy(en[0],enemyTarget(k,i,true)*1.4); fitEnemy(en[1],enemyTarget(k,i,false)); }
  else if(kind==='elite'){ en=[pick(true),pick(false)]; fitEnemy(en[0],enemyTarget(k,i,true)*0.9); fitEnemy(en[1],enemyTarget(k,i,false)*0.9); }
  else { en=Array.from({length:2+(Math.random()<0.5?1:0)},()=>pick(false)); en.forEach(e=>fitEnemy(e,enemyTarget(k,i,false)*0.85)); }
  return en; }
let RGMODE='card';
/* 탐사 새로 만들기(Model) */
function rgRunNew(ids,mode){ const g=progSlot('rogue'); mode=mode||'card'; const map=dgGen(1); RG_LIVE=true; g.run={v:2,c3:1,wk:weekKey(),mode:'card',floor:1,fw:0,squad:ids,hp:Object.fromEntries(ids.map(id=>[id,1])),relics:[],deck:mode==='card'?rgDeck(ids):[],map,pos:map.start,pick:null,cpick:null,k:progK(),at:Date.now(),msg:mode==='card'?'카드 전투 탐사를 시작해요. 매 턴 에너지 3으로 카드를 써요. 적 머리 위의 표시가 다음 행동이에요.':'탐사를 시작해요.'}; mark('prog'); }
/* 탐사 시작(Controller): 새로 만들고 심연 화면으로 */
function rgStart(ids,mode){ rgRunNew(ids,mode); tab='abyss'; render(); }
function rgBattle(kind){ const run=progSlot('rogue').run; const en=rgEnemies(run.v===2?{k:run.k,floor:rgEq(run,kind)}:run,kind); const s={id:'rg_'+run.floor,title:`${T('abyss')} · ${run.floor}구역 · ${RG_NODE[kind][1]}`,enemies:en,pre:'',post:''};
  const m=id=>rgCount(id);
  startStage(s,{kind:'rogue',node:kind,squad:run.squad,burst0:m('burst')?40:0,prep:(al)=>{ al.forEach(u=>{ const fr=run.hp[u.c.id]; const hpM=1+0.2*m('hp')+0.08*m('res');
      u.maxhp=Math.round(u.maxhp*hpM); u.atk=Math.round(u.atk*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(u.def*(1+0.25*m('def'))); u.spd=Math.round(u.spd*(1+0.1*m('spd'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); }); }}); }
/* 탐사 전투 끝(Controller): 정산 → 보스 승리·패배면 탐사 끝, 아니면 효과음 → 결과 */
function rogueEnd(win){ const R=rogueSettle(win); if(R&&R.finish) return rgFinish(R.done); if(R) sfx('승리'); return rogueResultHTML(R); }
/* 탐사 전투 정산(Model): 체력 이어 가기(응급 키트 회복)·경험치, 이긴 칸 표시·유물/카드 고르기, 예전 형식은 다음 구역 */
function rogueSettle(win){ const g=progSlot('rogue'), run=g.run; if(!run) return null;
  const heal=0.15*rgCount('heal'); B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?Math.min(1,u.hp/u.maxhp+heal):0; const o=own(u.c.id); if(o&&win) gainExp(o,expR(40)); });
  const node=B.ctx.node; if(!win||node==='boss') return {finish:true,done:win&&node==='boss'};
  if(run.v===2){ const cell=run.map.cells[run.pos]; if(cell) cell.done=true; run.fw=(run.fw||0)+(node==='elite'?2:1); if(node==='elite') run.pick=rgPick3(run); if(run.mode==='card') run.cpick=cardOffer(run); run.msg=''; mark('prog'); return {v:2,node,card:run.mode==='card',heal}; }
  run.floor++; run.opts=rgOpts(run); if(node==='elite') run.pick=rgPick3(run); mark('prog'); return {v:1,node,floor:run.floor,heal}; }
/* 탐사 전투 결과(View) */
function rogueResultHTML(R){ if(!R) return '<button class="btn" data-act="bdone">계속</button>';
  if(R.v===2) return `<h2 class="disp" style="color:var(--rose);margin:0">전투 승리</h2><p>${R.node==='elite'?'정예를 쓰러뜨렸어요. 유물을 고를 수 있어요.<br>':''}${R.card?'새 카드를 하나 고를 수 있어요.':'계속 탐사해요.'}${R.heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`;
  return `<h2 class="disp" style="color:var(--rose);margin:0">${R.floor-1}구역 돌파</h2><p>${R.node==='elite'?'정예를 쓰러뜨렸어요. 유물을 하나 고를 수 있어요.':'다음 구역으로 가요.'}${R.heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`; }
function rgReward(f,done,prev,won){ prev=prev||0; const nf2=Math.max(0,f-prev); let r={gold:1200*f,exp:3*f,wmat:2*f,core:Math.floor(f/3)+(done?5:0),gift:Math.floor(f/4)+(done?2:0)}; const m=(1+0.3*rgCount('loot'))*(progRead('rogue').n>=2?0.25:1); Object.keys(r).forEach(k=>r[k]=Math.round(r[k]*m)); const gm=40*nf2+(done&&!won?500:0); if(gm) r.gems=gm; return r; }
/* 탐사 끝(Controller): 정산 → 효과음 → 결과 */
function rgFinish(done){ const R=rgFinishSettle(done); sfx(done?'SSR':'확인'); return rgFinishHTML(R); }
/* 탐사 끝 정산(Model): 진척에 따른 보상(오늘 3번째부터 25%·최고 기록 갱신 때만 재화), 기록, 탐사 비움 */
function rgFinishSettle(done){ const g=progSlot('rogue'), run=g.run, f=done?RG_FLOORS:run.v===2?rgScore(run):run.floor-1; if(g.day!==today()){ g.day=today(); g.n=0; } const r=rgReward(f,done,g.best||0,!!g.won); giveReward(r); g.n++; g.best=Math.max(g.best||0,f); if(done) g.won=true; g.run=null; mark('prog'); return {done,v:run.v,floor:run.floor,f,n:g.n,r}; }
/* 탐사 끝 결과(View) */
function rgFinishHTML(R){ return `<h2 class="disp" style="color:${R.done?'var(--rose)':'#ff5277'};margin:0">${esc(T('abyss'))} · ${R.done?'탐사 완료!':'탐사 종료'}</h2><p>${R.v===2?`제${R.floor}구역까지 탐사했어요 (진척 ${R.f}/${RG_FLOORS})`:R.f+'구역까지 갔어요'}.${R.n>2?' (오늘 3번째부터는 보상 25%)':''}<br>${rewardText(R.r)}${R.r.gems?'':`<br><small class="muted">${esc(T('currency'))}은(는) 최고 진척 기록을 갱신할 때만 받아요</small>`}</p><button class="btn" data-act="bdone">계속</button>`; }
function rgNode(kind){ const g=progSlot('rogue'), run=g.run; if(!run) return;
  if(kind==='battle'||kind==='elite'||kind==='boss'){ rgBattle(kind); return; }
  let msg='';
  if(kind==='rest'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); msg='모두 숨을 돌렸어요. 체력을 회복하고 쓰러진 대원이 일어났어요.'; }
  if(kind==='treasure'){ run.pick=rgPick3(run); msg='유물 상자를 찾았어요!'; }
  if(kind==='event'){ const x=Math.random();
    if(x<0.34){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.5); }); msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
    else if(x<0.67){ if(Math.random()<0.5){ run.pick=rgPick3(run); msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); msg='수상한 상자가 폭발했어요. 모두 체력 -20%.'; } }
    else { run.relics.push('train'); msg='잠깐의 실전 훈련. 공격 +5%.'; } }
  run.floor++; run.opts=rgOpts(run); run.msg=msg; mark('prog'); render(); }
/* 심연 탐사 화면 보조(View): 탐사 카드로 스크롤 · 탐사 결과 창 */
function abyssCardFocus(){ setTimeout(()=>{ const el=document.querySelector('.ch-card.rog'); if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); },60); }
function openRgResult(html,title,note){ openModal(`<div class="result" style="position:static">${title?`<p style="margin:0 0 6px"><b>${esc(title)}</b><br><span class="muted">${esc(note||'')}</span></p>`:''}${html.replace('data-act="bdone"','data-act="close"')}</div>`); }
