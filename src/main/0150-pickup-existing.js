/* ===== 기존 대원 픽업: 이미 있는 대원을 골라 확률 업 배너를 열어요 ===== */
let PUX=null;
function puxNames(){ const cs=(PUX?PUX.ids:[]).map(charById).filter(Boolean); return !cs.length?'':cs.length===1?`${cs[0].name} 픽업`:`${cs[0].name} 외 ${cs.length-1}명 픽업`; }
function puxRead(){ if(!PUX||!$('#pux_days')) return; PUX.name=$('#pux_name').value; PUX.days=$('#pux_days').value; PUX.rate=$('#pux_rate').value; PUX.story=!!($('#pux_story')&&$('#pux_story').checked); }
function openPickExisting(pre){ if(pre||!PUX) PUX={ids:pre&&charById(pre)?[pre]:[],name:'',story:false}; const sn=seasonNow(), ids=PUX.ids, cs=G.chars.slice().sort((a,b)=>b.rarity-a.rarity);
  openModal(`${head(T('crew')+' 픽업',`<span class="muted">이미 있는 ${esc(T('crew'))}의 확률을 올린 배너를 열어요</span>`)}
    <label class="f">픽업할 ${esc(T('crew'))} <span class="muted" style="font-size:.78rem">(최대 3명 · 처음 고른 ${esc(T('crew'))}가 주인공)</span></label>
    <div class="chips">${cs.map(c=>{ const i=ids.indexOf(c.id); return `<button class="chip ${i>=0?'on':''}" data-act="puxpick" data-id="${c.id}">${i>=0?(i+1)+'. ':''}${RL[c.rarity]} ${esc(c.name)}${c.limited?' · 한정':''}</button>`; }).join('')}</div>
    <label class="f" for="pux_name">배너 이름 <span class="muted" style="font-size:.78rem">(비우면 자동)</span></label><input class="in" id="pux_name" value="${esc(PUX.name||'')}" placeholder="${esc(puxNames()||'예: 세라 픽업')}">
    <div class="g2"><div><label class="f" for="pux_days">기간</label><select class="in" id="pux_days">${opt([...(sn?[['season','이번 시즌 끝까지']]:[]),['7','7일'],['14','14일'],['0','계속 (직접 닫을 때까지)']],PUX.days||(sn?'season':'14'))}</select></div>
      <div><label class="f" for="pux_rate">픽업 확률</label><select class="in" id="pux_rate">${opt([['50','50% (기본)'],['70','70%'],['100','100% (그 등급이 나오면 무조건)']],PUX.rate||'50')}</select></div></div>
    ${SAMPLE?`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pux_story" ${PUX.story?'checked':''}><span>픽업 스토리도 같이 만들기 <span class="muted" style="font-size:.8rem">(주인공 ${esc(T('crew'))}의 짧은 이벤트 3화 · 몇 분 걸려요)</span></span></label>`:''}
    <p class="muted" style="font-size:.8rem;margin:8px 0 0">같은 ${esc(T('crew'))}의 지난 픽업 배너가 있으면 그 배너를 다시 열어요(복각). 한정 ${esc(T('crew'))}도 이 배너에서는 나와요. 기간이 끝나면 배너가 닫혀요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="puxgo" ${ids.length?'':'disabled'}>픽업 열기</button><button class="btn ghost" data-act="close">취소</button></div>`); }
function puxGo(){ puxRead(); const cs=PUX.ids.map(charById).filter(Boolean); if(!cs.length) return null; const c=cs[0], sn=seasonNow(), now=Date.now();
  const until=PUX.days==='season'&&sn?sn.until:+PUX.days>0?now+(+PUX.days)*864e5:0;
  const same=x=>x.type==='pickup'&&!x.eventId&&(x.pickup||[]).length===cs.length&&(x.pickup||[])[0]===c.id&&cs.every(y=>x.pickup.includes(y.id));
  let b=G.banners.find(x=>same(x)&&bnOpen(x)), rerun=false;
  if(!b){ b=G.banners.find(x=>same(x)&&!bnOpen(x)); rerun=!!b; }
  if(!b){ b={id:'b'+uid(),type:'pickup',pool:{mode:'all',factions:[],ids:[]},pickup:cs.map(x=>x.id),bg:''}; G.banners.push(b); }
  Object.assign(b,{name:String(PUX.name||'').trim()||(rerun?'복각: ':'')+puxNames(),desc:`${cs.map(x=>`${RL[x.rarity]} ${x.name}`).join(' · ')} 확률 업`,rate:+PUX.rate||50,active:true,pin:true,until,seasonal:PUX.days==='season'&&!!sn});
  delete b.newAt; delete b.storyFail; delete b.gate;
  if(!b.bg){ const bgs=G.lib.filter(l=>l.kind==='bg'); if(bgs.length) b.bg=rand(bgs).name; }
  P().curBanner=b.id; mark('prog'); return {b,c,rerun,story:!!(PUX.story&&SAMPLE&&!b.eventId)}; }
const PUBUSY=new Set();
async function puStoryBg(c,lim,bn){ // 배너는 이미 열렸고, 스토리는 뒤에서 써요
  const b=bn||G.banners.find(x=>x.type==='pickup'&&(x.pickup||[])[0]===c.id&&!x.eventId), ex=!!(b&&b.pin), mates=ex?(b.pickup||[]).slice(1).map(charById).filter(Boolean):[]; if(b&&PUBUSY.has(b.id)) return; if(b){ PUBUSY.add(b.id); b.storyFail=false; } liveBar(`${c.name}의 픽업 스토리를 쓰는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.`);
  const ab=c.alt&&charById(c.alt);
  try{ let res=null; for(let k=0;k<3&&!res;k++){ if(k){ liveBar(`${c.name}의 픽업 스토리 다시 시도 중… (${k}/2)`); await wait(2000); } res=await aiEventGen(ab?`이격 ${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.altCanon?'정사 이야기: 이 사건으로 '+ab.name+'이(가) 지금의 모습이 되고, 이 변화는 이후 메인 스토리에 이어진다.':'외전 이야기: 메인 스토리와 무관한 단발성 소동이고, 이야기가 끝나면 원래대로 돌아간다. 메인 플롯을 바꾸지 않는다.'} 익숙한 ${ab.name}이(가) 지금까지와 다른 모습(${c.name.replace(ab.name,'').replace(/[()]/g,'')||'새 모습'})으로 ${playerName()} 앞에 나타나는 이야기. 성격과 말투는 ${ab.name} 그대로지만, 이 모습이라서 생기는 설렘·웃음·사건을 보여 준다. 이 모습일 때의 대사 이름은 반드시 「${c.name}」로 쓴다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${T('crew')} 1~2명이 조연으로 나온다.`:c.collab?`「${c.collab}」 콜라보 이벤트. 다른 세계에서 온 「${c.name}」이(가) 이 세계에 떨어져 ${playerName()}와(과) 만나는 이야기. 서로의 세계 차이에서 오는 웃음과 긴장, 함께 싸우며 믿음을 쌓는 과정, 마지막은 돌아가기 전까지 동료로 함께하기로 하는 여운. 원작 설정과 말투를 지키고, 원작의 미성년자·학생 캐릭터는 등장시키지 않는다. 학교 배경은 쓰지 않는다. 프로필: ${String(c.profile||'').slice(0,300)}.`:ex?`${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. 이미 ${playerName()}와(과) 함께하는 ${c.name}이(가) 주인공이다. 지금까지의 관계와 스토리를 이어 가면서, 아직 보여 주지 않았던 면모나 사연이 드러나는 사건을 그린다. 처음 만나는 이야기로 쓰지 않는다. 프로필: ${String(c.profile||'').slice(0,300)}.${mates.length?` 함께 픽업된 ${mates.map(x=>x.name).join(', ')}도 비중 있게 나온다.`:` 기존 ${T('crew')} 1~2명이 조연으로 나온다.`} 마지막 장면은 ${c.name}와(과) ${playerName()}의 사이가 한층 가까워지는 여운으로 끝낸다.`:`신규 ${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.name}이(가) 주인공으로 처음 등장해 성격·매력·사연을 보여 주고 ${playerName()}와(과) 인연을 맺는다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${T('crew')} 1~2명이 조연으로 나온다. 마지막 장면은 ${c.name}이(가) 동료가 되고 싶어 하는 여운으로 끝낸다.`,3,false,[c.name,...mates.map(x=>x.name)],null,'',ab&&!c.altCanon?c.id:''); }
    if(res&&b){ const ev=res.ev, eb=G.banners.find(x=>x.id===ev.bannerId); if(eb&&eb!==b) G.banners=G.banners.filter(x=>x!==eb); ev.bannerId=b.id; ev.pickupFor=c.id; ev.keepBanner=true; b.eventId=ev.id; b.desc=ex?`${b.name} · 픽업 스토리 「${ev.title}」`:c.collab?`「${c.collab}」 콜라보! ${c.name} 등장 · 콜라보 스토리 「${ev.title}」`:ab?`이격! ${c.name} 등장 · 이격 스토리 「${ev.title}」`:`신규 ${RL[c.rarity]} ${c.name} 등장! 픽업 스토리 「${ev.title}」`; P().curBanner=b.id; mark('prog'); render(); toast(`${c.name} 픽업 스토리 「${ev.title}」가 이벤트에 열렸어요`); }
    else if(!res){ if(b) b.storyFail=true; mark('prog'); render(); toast('픽업 스토리를 만들지 못했어요. 배너 화면의 \'이어서 만들기\'로 다시 시도할 수 있어요'); } }
  finally{ if(b) PUBUSY.delete(b.id); liveBar(null); } }
/* 캐릭터만 추가(픽업 배너 없이): 상시 뽑기에 넣거나 바로 내 ${'캐릭터'}로 */
function openAddChar(){ openModal(`${head(T('crew')+' 추가',`<span class="muted">픽업 배너 없이 캐릭터만 만들어요</span>`)}
    <label class="f" for="ac_c">어떤 ${esc(T('crew'))}인가요?</label><textarea class="in" id="ac_c" placeholder="예: 과묵한 정비공, 은발 단발, 렌치를 무기로 씀"></textarea>
    <div class="g2"><div><label class="f" for="ac_r">등급</label><select class="in" id="ac_r">${opt([['1','R'],['2','SR'],['3','SSR'],['ai','AI가 정하기']],'2')}</select></div>
    <div><label class="f" for="ac_how">얻는 방법</label><select class="in" id="ac_how">${opt([['std','상시 뽑기에 추가'],['own','바로 내 '+T('crew')+'로']],'std')}</select></div></div>
    <div class="row" style="margin-top:12px">${SAMPLE?`<button class="btn" data-act="addchar-ai">AI로 만들기</button>`:''}<button class="btn ghost" data-act="addchar-hand">직접 만들기</button></div>`); }
function joinChar(c,why){ const p=P(); if(!c||p.owned[c.id]) return false; p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; if(p.squad.length<4) p.squad.push(c.id); mark('prog');
  sendMail({from:'운영팀',title:`${RL[c.rarity]} ${c.name} 합류`,body:`${why||'인연이 닿아'} ${c.name}이(가) 함께하게 됐어요. ${T('crew')} 화면에서 확인해 보세요.`,days:30}); setTimeout(()=>toast(`🤝 ${c.name}이(가) 합류했어요!`),1200); return true; }
/* 장·이벤트를 끝까지 깨면 그 이야기에서 만난 인물이 인연으로 합류해요 */
function recruitCheck(ch,s){ if(!ch||!s||ch.stages[ch.stages.length-1]!==s) return; (ch.recruits||[]).map(charById).filter(Boolean).forEach(c=>joinChar(c,`「${ch.title}」에서 만난 인연으로`)); const ev=ch.eventId&&G.events.find(e=>e.id===ch.eventId), gc=ev&&ev.gift&&charById(ev.gift); if(gc) joinChar(gc,`이벤트 「${ev.title}」 배포로`); }
function addPickupFor(c,lim){
  if(lim){ c.limited=true; mark('c:'+c.id); }
  const bb=c.alt&&charById(c.alt), sn=seasonNow(), b={id:'b'+uid(),name:c.collab?`콜라보: ${c.name}`:bb?`이격: ${c.name}`:`${c.name} 픽업`,type:'pickup',alt:!!bb,desc:c.collab?`「${c.collab}」 콜라보! ${RL[c.rarity]} ${c.name} 한정 등장`:bb?`이격! ${bb.name}의 새로운 모습, ${RL[c.rarity]} ${c.name} 등장`:`신규 ${RL[c.rarity]} ${c.name} 등장!`,collab:c.collab||'',pool:{mode:'all',factions:[],ids:[]},pickup:[c.id],rate:lim?70:50,active:true,bg:'',newAt:Date.now(),until:sn?sn.until:0,gate:mainCleared()};
  G.banners.push(b); P().curBanner=b.id; mark('prog'); return b;
}
