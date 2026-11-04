/* UI_SCROLL_MODULE */
/* Keep local actions at their current position; navigation owns intentional resets. */
var UI_PAGE_SCROLL_ROUTE=null,UI_PAGE_SCROLL_GAME=null;
function uiScrollPath(root,node){
 if(node===root)return [];
 const path=[];for(let el=node;el&&el!==root;el=el.parentElement){if(!el.parentElement)return null;path.unshift([...el.parentElement.children].indexOf(el));}
 return path;
}
function uiScrollResolve(root,entry){
 if(!root)return null;
 let node=entry.id?[root,...root.querySelectorAll('[id]')].find(el=>el.id===entry.id):null;
 if(!node){node=root;for(const i of entry.path||[]){node=node?.children[i];if(!node)return null;}}
 return node?.tagName===entry.tag?node:null;
}
function uiScrollCapture(root){
 if(!root)return null;
 const nodes=[root,...root.querySelectorAll('*')],rows=[],details=[];
 for(const node of nodes){if(node!==root&&!node.scrollTop&&!node.scrollLeft&&node.tagName!=='DETAILS')continue;const entry={id:node.id||'',path:uiScrollPath(root,node),tag:node.tagName};
  if(node===root||node.scrollTop||node.scrollLeft)rows.push({...entry,top:node.scrollTop,left:node.scrollLeft});
  if(node.tagName==='DETAILS')details.push({...entry,open:node.open});
 }
 return {rows,details};
}
function uiScrollRestore(root,state){
 if(!root||!state)return;
 for(const entry of state.details||[]){const node=uiScrollResolve(root,entry);if(node)node.open=entry.open;}
 for(const entry of state.rows||[]){const node=uiScrollResolve(root,entry);if(node){node.style.overflowAnchor='none';node.scrollTop=entry.top;node.scrollLeft=entry.left;}}
}
function uiPageScrollKey(){return JSON.stringify([PJ().active,tab,tab==='studio'?STTAB:'',tab==='evd'?P().curEvent:'',tab==='ops'?OPS_CH:'']);}
function uiSelectText(field){if(!field)return;const root=field.closest('.sheet')||document.getElementById('view'),state=uiScrollCapture(root);field.focus({preventScroll:true});try{field.setSelectionRange(0,field.value.length);}catch(e){field.select();}uiScrollRestore(root,state);}

/* /UI_SCROLL_MODULE */
/* 그리기 전 처리(Controller — CLAUDE.md §0-2 화면은 상태를 바꾸지 않음): 진행 칸의 하루/주 새로 만들기·형식 맞춤(progTick), 탐사를 야영지 저장 없이 떠나면 끝냄 표시, 로비에서 우편·캐시 처리 → 그리기(renderView) */
function render(){ progTick();
  // 심연 탐사는 야영지에서 저장해야만 나갔다 올 수 있어요. 다른 길로 나가면 탐사가 끝나요.
  if(PREVTAB==='abyss'&&tab!=='abyss'){ const r=progSlot('rogue').run; if(r&&!r.saved) r.left=true; }
  (SCREEN_ENTER[tab]||[]).forEach(f=>f()); PREVTAB=tab;
  renderView(); }
/* 화면에 들어가기 전 처리(Controller — 그리기 전): 화면마다 그 기능이 상태를 맞춤 — 그리기(…HTML)는 상태를 바꾸지 않음 */
const SCREEN_ENTER={lobby:[mailTick,cashTick],abyss:[rogueTick],challenge:[rogueTick],notice:[noticeSeen],codex:[cxBadgeSync]};
/* 그리기(View): 지금 탭 화면·머리 재화·탭 표시 */
function renderView(){ const scrollKey=uiPageScrollKey(),viewBefore=$('#view'),viewState=UI_PAGE_SCROLL_ROUTE===scrollKey&&UI_PAGE_SCROLL_GAME===G?uiScrollCapture(viewBefore):null; setTimeout(()=>{ try{ fitLobby(); }catch(e){} },0); document.body.classList.toggle('play',playMode()); if(playMode()&&PLAY_HIDE_ST.includes(STTAB)) STTAB='';
  updStam(); $('#gems').textContent=nf(P().gems); try{ $('#ic_gold').innerHTML=rIco('gold'); $('#ic_gems').innerHTML=rIco('gems'); }catch(e){} $('#gold').textContent=nf(P().gold);
  $('#tb_ops').textContent=T('ops'); $('#tb_gacha').textContent=T('gacha'); $('#tb_crew').textContent=T('crew');
  const navTab={evshop:'lobby',abyss:'lobby',challenge:'lobby',codex:'lobby',notice:'lobby',event:'lobby',evd:'lobby',farm:'lobby',disp:'lobby',sched:'lobby',construct:'contract',pass:'lobby',shop:'lobby',cash:'lobby'}[tab]||tab;
  if(tab!=='lobby') document.body.classList.remove('lb-hidden');
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===navTab?'true':'false'));
  const F={sched:schedHTML,evshop:evShopHTML,abyss:abyssHTML,challenge:challengeHTML,codex:codexHTML,shop:shopHTML,cash:cashHTML,lobby:lobbyHTML,ops:opsHTML,contract:()=>conEntryHTML()+contractHTML(),construct:constructHTML,crew:crewHTML,studio:studioHTML,event:eventsHTML,evd:eventDetailHTML,notice:noticeHTML,farm:farmHTML,disp:dispPageHTML,pass:passHTML};
  $('#view').innerHTML=(F[tab]||lobbyHTML)();
  document.body.classList.toggle('on-lobby',tab==='lobby'); document.body.classList.toggle('abyss-full',tab==='abyss');
  if(typeof applyDesk==='function') applyDesk();
  if(viewState)uiScrollRestore($('#view'),viewState);else $('#view').scrollTop=0;UI_PAGE_SCROLL_ROUTE=scrollKey;UI_PAGE_SCROLL_GAME=G;
}
const pageHead=(ko,en,back)=>`<div class="phead">${back?`<button class="back" data-act="go" data-to="${back}" aria-label="뒤로">‹</button>`:''}<div><i>${en}</i><h2>${esc(ko)}</h2></div></div>`;
function nextStage(){ const main=G.chapters.filter(ch=>ch.kind==='main'); for(const [ci,ch] of main.entries()) for(const [si,s] of ch.stages.entries()) if(!P().cleared[s.id]) return {ch,s,code:(ci+1)+'-'+(si+1)}; return null; }
const ICO={
  raid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14.5 3 21 9.5 11 19.5 4.5 13z"/><path d="M4.5 13 3 21l8-1.5M16 8l-6 6"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z"/></svg>',
  talk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg>',
  event:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>',
  notice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10v4h4l6 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/></svg>',
  disp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13 13l-4.5 2.5L11 11z"/></svg>',
  farm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/></svg>',
  shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9 6 4h12l2 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/></svg>',
  gem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>'};
/* 캐릭터의 기술 컷인 그림 칸 c.scg: 새 값 · 쓰기(맞춰 저장하고 돌려줌 — 그릴 때·올릴 때·불러오기) · 읽기(없으면 새 값을 보여 주기만) */
function scgNew(c){ return {id:'sc_'+c.id,kind:'scg',name:c.name+' 기술 컷인',prompt:'',img:null}; }
function scgSlot(c){ if(!c) return null; if(!c.scg||typeof c.scg!=='object') c.scg=scgNew(c); c.scg.id=c.scg.id||'sc_'+c.id; c.scg.kind='scg'; return c.scg; }
function scgFixAll(g){ (g.chars||[]).forEach(c=>{ if(c.scg) scgSlot(c); }); } // 불러오기(fix): 있는 칸의 id·종류만 맞춤
function scgOf(c){ if(!c) return null; return c.scg&&typeof c.scg==='object'?c.scg:scgNew(c); } // 읽기 — 고칠 때는 scgSlot
function chMapLib(ch){return G.lib.find(l=>l.kind==='map'&&l.ch===ch.id);}
/* 장 작전 지도(자료실 map): 새 값(장마다 id 하나 — 목록에서 미리 보여 줄 때도 같은 열쇠) · 쓰기(없으면 넣고 돌려줌 — 지도 편집·그림 등록) */
function chMapNew(ch){return {id:'m_'+ch.id,kind:'map',ch:ch.id,name:ch.title+' 지도',prompt:'ruined city at night, glowing roads, rivers of light, crater, scattered buildings',img:null};}
function ensureChMap(ch){let l=chMapLib(ch); if(!l){ l=chMapNew(ch); G.lib.push(l); mark('l:'+l.id); } return l;}
// 작전: 장 카드를 가로로 넘겨 고르고, 누르면 그 장의 지도로 들어가요
let OPS_CH=null;
function chCover(ch){ const ml=chMapLib(ch), ms=ml&&imgSrc(ml); if(ms) return `background-image:url('${esc(ms)}');background-size:cover;background-position:center`;
  const pl=parseScript((ch.stages[0]||{}).pre||'').find(l=>l.type==='place'); return bgStyle(pl?pl.text:ch.title); }
function opsListHTML(){ const main=G.chapters.filter(ch=>ch.kind==='main'); let prevDone=true, curIdx=-1;
  const cards=main.map((ch,ci)=>{ const n=ch.stages.length, done=ch.stages.filter(s=>P().cleared[s.id]).length, open=prevDone, full=n&&done===n; prevDone=full; if(open&&!full&&curIdx<0) curIdx=ci;
    return `<button class="chc ${open?'':'lock'} ${full?'clear':''} ${open&&!full?'cur':''}" data-act="${open?'opsch':'locked'}" data-ch="${ch.id}"><div class="chc-art" style="${chCover(ch)}"></div><div class="chc-no"><i>CHAPTER</i><b>${String(ci+1).padStart(2,'0')}</b></div>${full?'<em class="chc-st">CLEAR</em>':open?'<em class="chc-st now">진행 중</em>':'<em class="chc-st">🔒 잠김</em>'}
      <div class="chc-t"><b>${esc(ch.title)}</b><p>${open?esc(chLogline(ch)||'이야기가 기다리고 있어요.'):'앞 장을 모두 끝내면 열려요.'}</p><div class="chc-bar"><i style="width:${n?done/n*100:0}%"></i></div><span>${done} / ${n}</span></div></button>`; }).join('');
  const nxt=`<button class="chc next" data-act="${SAMPLE?'aichapter-open':'nextneedai'}"><div class="chc-art"></div><div class="chc-no"><i>CHAPTER</i><b>${String(main.length+1).padStart(2,'0')}</b></div><em class="chc-st">다음 이야기</em><div class="chc-t"><b>＋ 다음 장 만들기</b><p>${SAMPLE?'AI가 지금까지의 이야기와 보유한 '+esc(T('crew'))+'을(를) 반영해 다음 장을 써요.':'글 AI를 등록하면 다음 장을 만들 수 있어요.'}</p></div></button>`;
  if(curIdx>=0) setTimeout(()=>{ const el=document.querySelectorAll('.chc')[curIdx]; if(el&&el.parentNode) el.parentNode.scrollLeft=Math.max(0,el.offsetLeft-24); },30);
  return `${pageHead(T('ops'),'MAIN STORY')}<div class="chc-row">${cards}${nxt}</div><p class="muted" style="margin:6px 2px;font-size:.75rem">← 옆으로 넘겨서 장을 고르세요 →</p><button class="linkb" data-act="rebal" style="margin-top:6px">적 스탯 자동조정 · 새 스킬 기준</button>`; }
function opsHTML(){ if(!OPS_CH||!G.chapters.some(ch=>ch.id===OPS_CH)) return opsListHTML();
  let prev=true,out=`<div class="phead"><button class="back" data-act="opsback" aria-label="장 목록">‹</button><div><i>MAIN STORY</i><h2>${esc(T('ops'))}</h2></div></div>`;
  const XS=[28,68,38,74,26,60,44,72];
  G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>{ if(ch.id!==OPS_CH){ prev=ch.stages.every(s=>P().cleared[s.id]); return; }
    const ml=chMapLib(ch), ms=ml&&imgSrc(ml), n=ch.stages.length, RH=104, Hh=n*RH+40;
    const pts=ch.stages.map((s,i)=>({x:XS[i%XS.length],y:56+i*RH}));
    let d=''; pts.forEach((p,i)=>{ if(!i){d+=`M${p.x} ${p.y}`;return;} const q=pts[i-1]; d+=` C${q.x} ${q.y+RH/2} ${p.x} ${p.y-RH/2} ${p.x} ${p.y}`; });
    const done=ch.stages.filter(s=>P().cleared[s.id]).length;
    let firstOpen=true;
    const nodes=ch.stages.map((s,si)=>{const cl=!!P().cleared[s.id],open=prev; prev=cl; const cur=open&&!cl&&firstOpen; if(cur) firstOpen=false;
      const boss=!s.story&&(s.enemies.some(en=>en.boss)||si===n-1), p=pts[si];
      return `<button class="onode ${cl?'clear':''} ${open?'':'lock'} ${cur?'cur':''} ${boss?'boss':''} ${s.story?'story':''} ${s.mode?'m-'+s.mode:''}" style="left:${p.x}%;top:${p.y}px" data-act="${open?'stage':'locked'}" data-ch="${ch.id}" data-st="${s.id}"><span class="dia"><span>${cl?'✓':open?(modeIcon(s)||(boss?'★':s.story?'📖':'')):'🔒'}</span></span><span class="ont"><i>${ci+1}-${si+1}</i><b>${esc(s.title)}</b>${P().stars&&P().stars[s.id]?`<small class="ost">${'★'.repeat(P().stars[s.id])}${'☆'.repeat(3-P().stars[s.id])}</small>`:''}<em>${s.enemies.slice(0,4).map(e=>`<u style="--ec:${ECOL[e.elem]}"></u>`).join('')}</em></span></button>`;}).join('');
    out+=`<section class="omap">
      <div class="omap-h"><div><i>CHAPTER ${ci+1}</i><h3>${esc(ch.title)}</h3></div><span>${done}/${n}</span><button class="btn sm ghost" data-act="mapedit" data-ch="${ch.id}">지도</button><button class="btn sm ghost" data-act="chedit" data-ch="${ch.id}">편집</button></div>
      <div class="omap-b" style="height:${Hh}px;${ms?`background-image:url('${esc(ms)}');background-size:cover;background-position:center`:bgStyle(ch.title)}">
        <div class="omap-grid"></div>
        <svg class="omap-path" viewBox="0 0 100 ${Hh}" preserveAspectRatio="none"><path d="${d}" class="bg"/><path d="${d}" class="fg" style="stroke-dasharray:${Math.max(0,done-0.5)*RH*1.3} 99999"/></svg>
        ${nodes}
      </div></section>`;
  });
  return out+`<div class="row" style="margin:10px 0"><button class="btn ghost block" data-act="opsback">‹ 장 목록으로</button></div><div class="panel" hidden><h3>다음 이야기</h3><p class="muted" style="margin:0 0 10px">AI가 메인 플롯과 지금까지의 진행, 보유한 ${T('crew')}을(를) 반영해서 다음 장을 써요. 필요한 배경, 음악, ${T('talk')}도 함께 만들어요.</p><button class="btn block" data-act="aichapter-open">AI로 다음 장 만들기</button><button class="linkb" data-act="rebal" style="margin-top:10px">적 스탯 자동조정 · 새 스킬 기준</button></div>`;
}
const contractHTML=noSkin(contractHTML0);
function crewHTML(){
  const busy=busyIds(), list=[...G.chars].sort((a,b)=>(own(b.id)?1:0)-(own(a.id)?1:0)||b.rarity-a.rarity||(a.ord||0)-(b.ord||0));
  return `${pageHead(T('crew'),'UNITS')}<div class="chap"><span class="muted">${G.chars.filter(c=>own(c.id)).length} / ${G.chars.length}</span><div class="row"><button class="btn sm ghost" data-act="addchar-open">＋ ${esc(T('crew'))} 추가</button><button class="btn sm" data-act="newpu">✦ 신규 픽업 만들기</button><button class="btn sm ghost" data-act="castfaces">😊 표정 한꺼번에 만들기</button></div></div>
  <div class="grid">${list.map(c=>{const o=own(c.id);return `<button class="cc r${c.rarity} ${o?'':'off'}" data-act="char" data-id="${c.id}">${art(c)}<span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${o&&o.dup?`<span class="dup">${'★'.repeat(o.dup)}</span>`:''}${busy.has(c.id)?'<span class="busy">파견 중</span>':''}<span class="lbl"><i>${RL[c.rarity]} · ${ROLE_EN[c.role]}</i><b>${esc(c.name)}</b>${o?`Lv.${o.lv}`:'미보유'}</span></button>`;}).join('')}</div>`;
}
// 이벤트 교환소: 픽업 캐릭터가 맞이하는 상점
let EVS_LINE='', EVS_FOR='';
function evHost(ev){ const bn=G.banners.find(x=>x.id===ev.bannerId); const ids=[...((bn&&bn.pickup)||[]),...(ev.shop||[]).filter(i=>i.type==='char').map(i=>i.ref)]; return ids.map(charById).find(Boolean)||null; }
function evShopHTML(){
  const ev=G.events.find(e=>e.id===P().curEvent); if(!ev){ tab='event'; return eventsHTML(); }
  const tok=P().tokens[ev.id]||0, buy=P().shopBuy[ev.id]||{}, host=evHost(ev);
  if(EVS_FOR!==ev.id){ EVS_FOR=ev.id; const pool=host?[...(host.lines||[]),...(host.dupLines||[])].filter(Boolean):[]; EVS_LINE=pool.length?rand(pool):`어서 와요! 「${ev.title}」 기념 교환소예요. ${ev.token}(으)로 마음에 드는 걸 골라 가요.`; }
  const sil='<div class="sil"><svg viewBox="0 0 100 120" fill="currentColor"><circle cx="50" cy="34" r="20"/><path d="M14 120c2-34 16-52 36-52s34 18 36 52z"/></svg></div>';
  return `${pageHead(ev.title+' 교환소','EVENT EXCHANGE','evd')}
  <div class="evs-wrap"><div class="evs-host"><div class="evs-hbg" style="${bgStyle(ev.bg||'회색구 골목')}"></div><div class="evs-hart" ${host?`data-act="evspoke" data-id="${host.id}"`:''}>${host?art(host,'',{upper:true}):sil}</div>
    <div class="evs-talk"><b>${esc(host?host.name:'교환소')}</b><p id="evsLine">${esc(sub(EVS_LINE))}</p></div></div>
  <div class="evs-shelf"><div class="wallet"><span>🎟 ${esc(ev.token)} <b>${nf(tok)}</b></span></div>
  <div class="shop-grid evs-grid">${(ev.shop||[]).map(it=>{ const left=it.limit-(buy[it.id]||0), c=it.type==='char'?charById(it.ref):null, out=left<=0, poor=tok<it.price;
    const name=c?`${c.name} ${own(c.id)?T('limit')+' +1':'획득'}`:rewardText({[it.type]:it.amt});
    return `<div class="si ${out?'soldout':''} ${c?'char':''}">${c?'<span class="tag">한정</span>':''}<span class="ri">${c?`<i class="evs-c">${art(c)}</i>`:rIcon({[it.type]:1})}</span><b>${esc(name)}</b><small>${esc(ev.token)} ${nf(it.price)} · 남은 ${Math.max(0,left)}/${it.limit}</small><button class="btn ${c?'':'ghost'}" data-act="evbuy" data-id="${it.id}" ${out||poor?'disabled':''}>${out?'매진':poor?'부족':'교환'}</button></div>`; }).join('')||'<p class="muted">상품이 없어요.</p>'}</div></div></div>`;
}
function bgOptions(cur,label='자동'){return `<option value="">${label}</option>`+G.lib.filter(l=>l.kind==='bg').map(l=>`<option ${l.name===cur?'selected':''}>${esc(l.name)}</option>`).join('');}
const OAI_PRESETS=[
 ['GitHub Copilot','https://api.githubcopilot.com','gpt-4.1','키 칸에 GitHub Copilot 토큰을 넣어요. 모델은 gpt-4.1, gpt-4o, claude-sonnet-4 등 Copilot에 있는 이름을 써요. 비공식 방식이라 막힐 수 있어요. 웹 버전에서 안 되면 중계 서버를 최신 코드로 바꿔 주세요.'],
 ['LLM Gateway','https://api.llmgateway.io/v1','','llmgateway.io에서 API 키를 만들어요. 모델 이름은 llmgateway.io 모델 목록의 ID를 그대로 써요. 웹 버전에서 안 되면 중계 서버를 최신 코드로 바꿔 주세요(허용 목록에 들어 있어요).'],
 ['OpenRouter','https://openrouter.ai/api/v1','','openrouter.ai → Keys에서 키를 만들어요. 모델 이름은 openrouter.ai/models의 ID(예: deepseek/deepseek-chat-v3.1)를 그대로 써요.'],
 ['Ollama 클라우드','https://ollama.com/v1','gpt-oss:120b','ollama.com 로그인 → Settings → Keys에서 API 키를 만들어요. 모델은 ollama.com/search?c=cloud 에 있는 클라우드 모델 이름(예: gpt-oss:120b, qwen3-coder:480b)을 써요. 이름 끝의 -cloud는 빼요. 무료 플랜은 사용량 한도가 있어요.'],
 ['내 PC Ollama','http://192.168.0.10:11434/v1','','PC에서 OLLAMA_HOST=0.0.0.0 으로 Ollama를 켜고, PC의 IP로 주소를 바꿔요(폰과 같은 와이파이). 키는 아무 글자나 넣으면 돼요. 모델은 ollama list에 나온 이름 그대로.'],
 ['LM Studio','http://192.168.0.10:1234/v1','','LM Studio → Developer → Start Server, "Serve on Local Network"를 켜고 PC의 IP로 주소를 바꿔요. 키는 아무 글자나 넣으면 돼요.'],
 ['DeepSeek','https://api.deepseek.com/v1','deepseek-chat','platform.deepseek.com → API keys에서 만들어요.']];
const MODEL_SUGG={copilot:['gpt-4.1','gpt-4o','claude-sonnet-4','claude-3.7-sonnet','gemini-2.5-pro','o4-mini'],anthropic:['claude-opus-5-5','claude-sonnet-5-5','claude-haiku-4-5-20251001'],gemini:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'],vertex_google:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'],vertex_anthropic:[],openai:[]};

 const NLASTSEED={};
let VS={cid:null,results:[],picks:{},lang:'ko',q:''};
function voiceRow(m){
  const pk=VS.picks[m._id], smp=(m.samples||[]).find(x=>/^https?:/.test(x.audio||''));
  const meta=[(m.languages||[]).join('/'),(m.tags||[]).slice(0,4).join(', '),'사용 '+nf(m.task_count||0)].filter(Boolean).join(' · ');
  return `<div class="ep"><span class="t"><b>${pk!==undefined?'<span class="badge r3c">추천</span> ':''}${esc(m.title)}</b><span class="muted">${esc(meta)}</span>${pk?`<span class="muted" style="display:block;white-space:normal">${esc(pk)}</span>`:''}</span>${smp?`<button class="btn sm ghost" data-act="vsplay" data-u="${esc(smp.audio)}" aria-label="샘플 듣기">▶</button>`:''}<button class="btn sm ghost" data-act="vstry" data-id="${m._id}">대사</button><button class="btn sm" data-act="vspick" data-id="${m._id}">선택</button></div>`;
}
function renderVoice(msg){
  const c=charById(VS.cid);
  openModal(`${head(`${esc(c.name)} 목소리`,`<span class="muted">현재: ${c.voiceId?esc(c.voiceName||c.voiceId):'없음'}</span>`)}
    <label class="f" for="vs_q">검색어 (음성 제목)</label><input class="in" id="vs_q" value="${esc(VS.q)}" placeholder="예: 누나, お姉さん, calm female">
    <div class="g2"><div><label class="f" for="vs_lang">언어</label><select class="in" id="vs_lang">${opt([['ko','한국어'],['ja','일본어'],['en','영어'],['','전체']],VS.lang)}</select></div>
    <div style="display:flex;align-items:flex-end;gap:6px"><button class="btn sm" data-act="vsearch">검색</button><button class="btn sm ghost" data-act="vsai">AI 추천</button></div></div>
    <label class="f" for="vs_id">또는 보이스 ID나 fish.audio 주소를 직접 입력</label><div class="row"><input class="in" id="vs_id" style="flex:3" placeholder="https://fish.audio/m/..."><button class="btn sm ghost" data-act="vsetid">적용</button></div>
    ${msg?`<p class="muted">${esc(msg)}</p>`:''}
    <div style="margin-top:8px">${VS.results.map(voiceRow).join('')}</div>
    ${c.voiceId?`<div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="vclear" data-id="${c.id}">목소리 해제</button></div>`:''}`);
}
let STTAB='',STROOTSCROLL=0;
function settingsNavigate(next){if(next&&!STTAB)STROOTSCROLL=$('#view').scrollTop;STTAB=next||'';render();$('#view').scrollTop=STTAB?0:STROOTSCROLL;}
function settingsBack(){if(tab!=='studio'||!STTAB)return false;settingsNavigate('');return true;}
function studioHTML(){
  const s=P().settings,w=G.world,nb=G.lib.filter(l=>l.kind==='bg'),np=G.lib.filter(l=>l.kind==='prop'),nx=G.lib.filter(l=>l.kind==='sfx');
  const done=a=>a.filter(l=>l.img||l.audio).length, pj=PJ();
  const ST=[['practice','연습장','🎯','허수아비로 파티·스킬 시험'],['game','게임','🎮',G.meta.title],['player',T('player'),'🙋',P().player||T('player')],['view','화면·연출','🖼','타이틀·로비·컷인'],['sound','소리','🔊',(SND().fishKey?'목소리 ✓':'')+(SND().elKey?' 배경음 ✓':'')||'설정 안 함'],['lib','자료실','🗂','배경·소품·적'],['text','글 AI','✍',AIP().list.length?AIP().list.length+'개 연결':'없음'],['img','그림 AI','🎨',imgProvider()==='comfy'?'ComfyUI':(naiCfg().key?'NovelAI ✓':'없음')],['live','시즌 운영','📅',v2CurrentGeneration()+'세대 · '+(P().live.on.season?'시즌 켜짐':'꺼짐')],['conn','연동','🔗',PCS()?'PC 서버':syReady()?'GitHub':'없음'],['data','데이터','💾','백업·초기화'],['info','앱 정보','ℹ','업데이트·공유·피드백']].filter(x=>!playMode()||!PLAY_HIDE_ST.includes(x[0]));
  const SEC={
  practice:`<div class="panel"><h3>연습장</h3><p class="muted">허수아비를 세워놓고 스킬을 시험할 수 있어요. 파티 구성과 공격 방식·이펙트를 확인하세요. 허수아비는 반격하지 않고 체력이 무제한이며, 행동력 소모와 보상은 없습니다.</p><button class="btn" data-act="v2practice">연습장 열기</button></div>`,
  game:`<div class="panel"><h3>플레이 모드 ${playMode()?'<span class="badge">켜짐</span>':''}</h3>${subLocked()?`<p class="muted" style="margin:0 0 10px">구독한 게임이라 <b>플레이 전용</b>이에요. 스토리·이벤트·캐릭터는 만든 사람이 업데이트하고, 이 기기에서는 시즌·새 이벤트 같은 자체 업데이트도 하지 않아요. AI 키 없이 그대로 즐기면 돼요. 직접 고치고 이어서 만들고 싶으면 아래 '구독 끊기'를 하세요.</p>`:`<p class="muted" style="margin:0 0 10px">켜면 새 캐릭터·스토리 만들기, 편집, 그림 다시 그리기, 글·그림 AI 설정 같은 메뉴를 숨기고 게임만 해요. 이미 연결해 둔 AI는 그대로 써요(${T('talk')}·라이브 운영 등). 언제든 여기서 다시 끌 수 있어요.</p>`}<div class="row">${subLocked()?'':`<button class="btn sm ${playMode()?'ghost':''}" data-act="playmode">${playMode()?'플레이 모드 끄기':'플레이 모드 켜기'}</button>`}${playMode()?`<button class="btn sm ghost" data-act="pj-open">게임 목록 (${pj.list.length})</button>`:''}</div></div>
  ${conSettingsPanel()}
  ${exSettingsPanel()}
  ${auditPanel()}
  ${rulesPanel()}
  ${battleSysPanel()}
  ${balancePanel()}
  ${personaPanel()}
  ${factionPanel()}
  ${planPanel()}
  ${assetPanel()}
  ${promptPanel()}
  <div class="panel pm-hide"><h3>게임</h3><p class="muted" style="margin:0 0 10px">지금 게임: <b>${esc(G.meta.title)}</b>. 세계관, 용어, 속성, 화면 테마를 바꾸거나, AI로 완전히 다른 가챠 게임을 새로 만들 수 있어요. 게임은 여러 개 만들어 두고 오갈 수 있어요.</p>
    <div class="row"><button class="btn sm" data-act="meta-open">게임 정의 편집</button><button class="btn sm" data-act="draft-open">AI로 새 게임 만들기</button><button class="btn sm ghost" data-act="pj-open">게임 목록 (${pj.list.length})</button></div></div>
  <div class="panel"><h3>게시·구독</h3><p class="muted" style="margin:0 0 10px">${G.meta.subscr?`구독 중인 게임이에요 · v${G.meta.subscr.ver||0}${G.meta.subscr.at?' · '+esc(new Date(G.meta.subscr.at).toLocaleDateString())+' 받음':''}. 만든 사람이 업데이트하면 켤 때 알려 줘요.`:G.meta.pub&&G.meta.pub.ver?`게시 중 · v${G.meta.pub.ver}. 새 장·이벤트를 만든 뒤 다시 게시하면 구독한 사람에게 업데이트가 가요.`:'내 게임을 GitHub 공개 저장소에 올려 다른 사람이 구독하게 하거나, 다른 사람이 게시한 게임을 주소로 받아요.'}</p>
    <div class="row">${G.meta.subscr?`<button class="btn sm" data-act="subcheck">업데이트 확인</button><button class="btn sm ghost" data-act="subcopy">구독 주소 복사</button><button class="btn sm ghost" data-act="subleave">구독 끊기</button>`:`<button class="btn sm" data-act="pubopen">🌐 게임 게시</button>`}<button class="btn sm ghost" data-act="subadd">🔗 게임 구독</button></div></div>
  <div class="panel pm-hide"><h3>스토리 기억 관리</h3><p class="muted">장별 기억·관계·도감과 최근 스토리 요청을 확인합니다. 비밀 설정이 포함되는 작가용 메뉴입니다.</p><button class="btn sm" data-sm="open">스토리 기억 관리</button></div>
  <div class="panel pm-hide"><h3>세계관: ${esc(w.name)}</h3><p style="margin:0 0 10px">${esc(w.summary)}</p><button class="btn sm ghost" data-act="world-open">세계관과 메인 플롯 편집</button></div>
  <div class="panel pm-hide"><h3>${T('gacha')} 규칙</h3>
    <div class="slider"><label for="r_ssr"><span>SSR 확률</span><b id="v_ssr">${s.ssr}%</b></label><input id="r_ssr" type="range" min="1" max="60" value="${s.ssr}" data-set="ssr"></div>
    <div class="slider"><label for="r_sr"><span>SR 확률</span><b id="v_sr">${s.sr}%</b></label><input id="r_sr" type="range" min="0" max="80" value="${s.sr}" data-set="sr"></div>
    <div class="slider"><label for="r_pity"><span>천장</span><b id="v_pity">${s.pity}회</b></label><input id="r_pity" type="range" min="5" max="150" value="${s.pity}" data-set="pity"></div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" data-act="stamtog" ${s.stamina!==false?'checked':''}><span><b>행동력 사용</b> <span class="muted" style="font-size:.8rem">(메인·이벤트 10, 재료 던전 8 · 5분마다 1 회복 · 최대 ${STAM_MAX})</span></span></label>
    <h3 class="sec" style="margin-top:12px">획득량 배율 <span class="muted" style="font-size:.75rem">전투·소탕·파견·일일 보급 보상에 곱해요</span></h3>
    ${[['expRate','경험치 (캐릭터 경험치·재료)'],['goldRate',T('gold')],['gemRate',T('currency')]].map(([k,l])=>`<div class="slider"><label for="r_${k}"><span>${esc(l)}</span><b id="v_${k}">${s[k]||100}%</b></label><input id="r_${k}" type="range" min="50" max="500" step="10" value="${s[k]||100}" data-set="${k}"></div>`).join('')}</div>
  <div class="panel"><h3>AI 창작실</h3><div class="row"><button class="btn sm" data-act="newpu">신규 픽업</button><button class="btn sm" data-act="aichapter-open">다음 장</button><button class="btn sm" data-act="aievent-open">새 이벤트</button></div></div>`,
  player:`<div class="panel"><h3>${esc(T('player'))}</h3><p class="muted" style="margin:0 0 4px;font-size:.8rem">이름은 스토리·${esc(T('talk'))} 속 {${esc(T('player'))}} 자리에, 성별과 외모는 AI가 쓰는 대사·호칭에 반영돼요.</p><div id="pfWrap">${playerFormHTML()}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="pfsave">저장</button></div></div>`,
  view:`<div class="panel"><h3>연출</h3>
    <div class="g2"><div><label class="f">타이틀 ${T('crew')}</label><select class="in" data-pset="titleChar"><option value="">자동</option>${G.chars.map(c=>`<option value="${c.id}" ${P().titleChar===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div><label class="f">타이틀 배경</label><select class="in" data-pset="titleBg">${bgOptions(P().titleBg)}</select></div></div>
    <div class="g2"><div><label class="f">로비 표시 (타이틀은 일러스트 우선)</label><select class="in" data-pset="lobbyMode">${opt([['auto','자동 (포즈 → 상반신 → 스탠딩)'],['illust','일러스트 표시'],['layer','항상 배경 + 캐릭터 따로 (캐릭터만 움직임)'],['stand','항상 스탠딩 + 배경']],P().lobbyMode||'auto')}</select></div><div><label class="f">로비 캐릭터 크기</label><select class="in" data-pset="lbSize">${opt([['fit','위 배너에 안 가리게 (기본)'],['big','크게 (머리가 가려질 수 있어요)'],['small','작게']],P().lbSize||'fit')}</select></div></div>
    <div class="g2"><div><label class="f">대본 연출 (감정 아이콘·동작·화면 효과)</label><select class="in" data-pset="vnDirect">${opt([['auto','대본 + 대사에 맞춰 자동 감정 (기본)'],['script','대본에 쓴 것만'],['off','끄기']],P().vnDirect||'auto')}</select></div><div><label class="f">대화 무대</label><select class="in" data-pset="vnStage">${opt([['duo','최근 두 사람 (기본)'],['single','말하는 사람만']],P().vnStage||'duo')}</select></div></div>
    <label class="f">전투 애니메이션</label><select class="in" data-pset="battleMotion">${opt([['full','일반 — 타격 동작·투사체·스피드라인'],['reduced','간소화 — 이동과 스피드라인 생략'],['system','기기의 동작 줄이기 설정에 맞춤']],P().battleMotion||'full')}</select>
    <p class="muted" style="font-size:.8rem;margin:5px 0 12px">일반 모드는 기기의 애니메이션 배율과 별도로 전투 연출을 재생해요. 움직임을 줄이고 싶으면 간소화를 선택하세요.</p>
    <label class="f">기술 컷인 (전투에서 스킬 쓸 때)</label><select class="in" data-pset="skillCut">${opt([['auto','직접 쓴 스킬과 컷인 그림이 있는 '+T('crew')+'는 크게'],['big','항상 크게 (없으면 스탠딩)'],['small','작은 띠만'],['off','끄기']],P().skillCut||'auto')}</select>
    <div class="g2"><div><label class="f">로비 배경</label><select class="in" data-pset="lobbyBg">${bgOptions(P().lobbyBg)}</select></div>
    <div><label class="f">기본 ${T('gacha')} 배경</label><select class="in" data-pset="gachaBg">${bgOptions(P().gachaBg,'기본')}</select></div></div>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="title">타이틀 보기</button><button class="btn sm ghost" data-act="opening-edit">오프닝 편집</button><button class="btn sm ghost" data-act="opening-play">오프닝 다시 보기</button></div></div>
  ${IS_NATIVE?'':`<div class="panel"><h3>아이폰·웹 연결</h3><p class="muted" style="margin:0 0 10px">웹 버전은 열 때마다 최신이에요. 일부 AI 서비스는 브라우저에서 직접 부르는 걸 막아서(CORS), 막히면 중계 서버를 거쳐요. ${webProxy()?'지금 중계 서버: <b>'+esc(webProxy())+'</b>':'중계 서버 없음'}</p>
    <label class="f" for="orient_sel">화면 방향 (휴대폰)</label><select class="in" id="orient_sel">${opt([['auto','기기 회전 따라'],['portrait','세로로 고정'],['landscape','가로로 고정']],orientPref())}</select>
    <p class="muted" style="margin:4px 0 8px;font-size:.78rem">세로로 고정하면 휴대폰을 눕혀도 세로 화면으로 해요. 앱은 새 APK부터 고정돼요(지금 앱이 지원하지 않으면 알려 드려요).</p>
    <label class="f" for="desk_mode">PC 화면 (넓은 화면에서)</label><select class="in" id="desk_mode">${opt([['wide','가로로 넓게 (PC 게임처럼, 추천 · 휴대폰은 가로로 돌려서)'],['auto','가운데 세로로 (휴대폰처럼) + 옆 안내'],['off','끄기 (창 전체를 씀)']],deskMode())}</select>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="pxopen">중계 서버 설정</button>${IS_IOS&&!IS_STANDALONE?'<button class="btn sm ghost" data-act="a2hs">홈 화면에 추가하는 법</button>':''}</div></div>`}`,
  sound:`<div class="panel"><h3>소리</h3><p class="muted" style="margin:0 0 10px">${SND().fishKey?'Fish Audio 연결됨':'Fish Audio 미연결'} · ${SND().elKey?'ElevenLabs 연결됨':'ElevenLabs 미연결'}</p>
    <div class="row"><button class="btn sm" data-act="sndopen">소리 설정</button><button class="btn sm ghost" data-act="lib" data-k="bgm">배경음 ${done(G.lib.filter(l=>l.kind==='bgm'))}/${G.lib.filter(l=>l.kind==='bgm').length}</button><button class="btn sm ghost" data-act="lib" data-k="sfx">효과음 ${done(nx)}/${nx.length}</button><button class="btn sm ghost" data-act="bgmall">🎵 배경음 한꺼번에 작곡</button></div></div>`,
  lib:`<div class="panel"><h3>자료실</h3><p class="muted" style="margin:0 0 10px">스토리와 ${T('talk')}에 쓰이는 배경과 소품이에요. 이미지가 없으면 자동 생성된 풍경이 쓰여요.</p>
    <div class="row"><button class="btn sm" data-act="lib" data-k="bg">배경 ${done(nb)}/${nb.length}</button><button class="btn sm" data-act="lib" data-k="prop">소품 ${done(np)}/${np.length}</button><button class="btn sm" data-act="lib" data-k="enemy">적 ${done(G.lib.filter(l=>l.kind==='enemy'))}/${G.lib.filter(l=>l.kind==='enemy').length}</button><button class="btn sm" data-act="lib" data-k="cg">CG ${done(G.lib.filter(l=>l.kind==='cg'))}/${G.lib.filter(l=>l.kind==='cg').length}</button><button class="btn sm" data-act="lib" data-k="icon">재화 아이콘 ${done(G.lib.filter(l=>l.kind==='icon'))}/${G.lib.filter(l=>l.kind==='icon').length}</button><button class="btn sm" data-act="lib" data-k="map">작전 지도 ${done(G.lib.filter(l=>l.kind==='map'))}/${G.lib.filter(l=>l.kind==='map').length}</button><button class="btn sm" data-act="npcopen">NPC ${(G.npcs||[]).filter(x=>imgSrc(x)).length}/${(G.npcs||[]).length}</button></div></div>`,
  text:`<div class="panel"><h3>글 AI</h3>${aiProfilesHTML()}
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="apnew">AI 추가</button><button class="btn sm ghost" data-act="apfb">실패하면 다음 AI로 ${AIP().fallback?'켜짐':'꺼짐'}</button><button class="btn sm ghost" data-act="ailog">🔍 AI 기록</button><button class="btn sm ghost" data-act="llmopen">생성 지침${(()=>{ const L=llmEff(); return L.top||L.mid||L.bot?' ✓':''; })()}</button></div></div>`,
  img:`<div class="panel"><h3>그림 AI</h3><p class="muted" style="margin:0 0 8px">${imgProvider()==='comfy'?'ComfyUI '+(imgReady()?'연결 설정됨':'설정 미완료'):'NovelAI '+(naiCfg().key?'토큰 등록됨':'미등록')}</p><div class="row"><button class="btn sm ghost" data-act="naiopen">그림 AI 설정</button><button class="btn sm ghost" data-act="packopen">그림체 프리셋</button><button class="btn sm ghost" data-act="dsopen">🎨 캐릭터 디자인 통일${G.meta.design&&(G.meta.design.all||Object.values(G.meta.design.fac||{}).some(Boolean))?' ✓':''}</button><button class="btn sm" data-act="prepopen">그림 준비실 (${drawTodo().length})</button><button class="btn sm ghost" data-act="setupopen">처음 설정 다시</button></div></div>`,
  live:`${v2SeasonGenerationHTML()}<div class="panel"><h3>시즌 운영</h3><p class="muted" style="margin:0 0 10px">앱을 켤 때 날짜를 보고 새 콘텐츠를 자동으로 만들어요. 켠 항목만큼 글 AI 요금이 들어요.</p>
    <div class="chips">${(P().live.on.season?[['season',cycLabel('season')+' 시즌 로테이션'],['talk',cycLabel('talk')+(cycDays('talk')>1?'마다':'')+' 새 '+T('talk')],['pass','매달 '+T('pass')+' 초기화'],['skin','시즌마다 새 '+T('skin')+' 상점'],['fill','빈 콘텐츠 자동 채움']]:[['season',cycLabel('season')+' 시즌 로테이션'],['talk',cycLabel('talk')+(cycDays('talk')>1?'마다':'')+' 새 '+T('talk')],['event',cycLabel('event')+'마다 새 이벤트'],['rerun','이벤트 복각'],['rotate',cycLabel('rotate')+'마다 확률 업 교체'],['pass','매달 '+T('pass')+' 초기화'],['chapter',cycLabel('chapter')+'마다 메인 다음 장'],['skin',cycLabel('rotate')+'마다 새 '+T('skin')+' 상점'],['fill','빈 콘텐츠 자동 채움']]).map(([k,l])=>`<button class="chip ${P().live.on[k]?'on':''}" data-act="livetog" data-k="${k}">${esc(l)}</button>`).join('')}</div>
    <h4 class="sec" style="margin-top:12px">운영 주기</h4>
    <div class="g2">${(P().live.on.season?['season','talk']:['talk','event','chapter','rotate']).map(k=>`<div><label class="f" for="cyc_${k}">${({season:'시즌 길이',event:'새 이벤트',chapter:'메인 다음 장',talk:'새 '+esc(T('talk')),rotate:'확률 업 교체 · 새 '+esc(T('skin'))})[k]}</label><select class="in" id="cyc_${k}" data-cyc="${k}">${opt(LIVE_CYC[k][1].map(([d,l])=>[d,d===1?l:l+'마다']),cycDays(k))}</select></div>`).join('')}</div>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">주기를 바꾸면 그때부터 새로 세요. 짧을수록 글 AI 사용량이 늘어요.</p>
    ${P().live.on.season?`<p class="muted" style="margin:8px 0 0;font-size:.82rem">스토리 → 이벤트 → 캐릭터 → 복각 → 육성 시즌이 ${esc(cycLabel('season'))}마다 돌아가요. ${seasonNow()?'지금: '+esc(seasonMeta(seasonNow().type)[1])+' · ':''}<button class="linkb" data-act="seasoninfo">시즌 설정</button></p>`:''}
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="liverun">지금 업데이트 실행</button><button class="btn sm ghost" data-act="go" data-to="notice">공지 보기</button></div></div>`,
  conn:`<div class="panel"><h3>PC 서버</h3><p class="muted" style="margin:0 0 10px">${PCS()?`연결됨 · ${esc(PCS().base.replace(/^https?:\/\//,''))}${PCS().last?' · 마지막 저장 '+esc(new Date(PCS().last).toLocaleString()):''}`:'내 컴퓨터를 켜 두고 QR로 휴대폰에서 접속해요. 게임이 PC에 저장되고, PC의 ComfyUI·Ollama도 휴대폰에서 써요.'}</p>
    <div class="row">${PCS()?'<button class="btn sm" data-act="pcpush">PC에 저장</button><button class="btn sm ghost" data-act="pcpull">PC에서 받기</button>':''}<button class="btn sm ${PCS()?'ghost':''}" data-act="pcopen">${PCS()?'설정':'PC 서버 연결'}</button></div></div>
  <div class="panel"><h3>PC·폰 연동</h3><p class="muted" style="margin:0 0 10px">${syReady()?`저장소 <b>${esc(SY().repo)}</b> · 이 기기: ${esc(syDevice())}${SY().last?' · 마지막 '+(SY().lastDir==='down'?'받기':'올리기')+' '+esc(new Date(SY().last).toLocaleString()):''}`:'내 GitHub 비공개 저장소를 거쳐 폰과 PC(웹 버전)가 같은 게임을 이어서 할 수 있어요.'}</p>
    <div class="row">${syReady()?'<button class="btn sm" data-act="sypush">올리기</button><button class="btn sm ghost" data-act="sypull">받기</button>':''}<button class="btn sm ${syReady()?'ghost':''}" data-act="syopen">${syReady()?'설정':'연동 설정'}</button></div></div>`,
  data:`${backupBlocks()}<div class="panel"><h3>기타 데이터 관리</h3><p class="muted">백업은 위의 세 종류 중에서 선택하세요. 리세마라와 앱 초기화는 데이터를 지우는 기능입니다.</p><div class="row"><button class="btn sm ghost" data-act="backup">이전 텍스트 백업</button><button class="btn sm ghost" data-act="importfile">공유 팩 불러오기</button><button class="btn sm ghost" data-act="reroll0">이 게임 리세마라</button><button class="btn sm ghost" data-act="cachewipe" style="color:var(--rose)">앱 초기화</button></div></div>`,
  info:`<div class="panel"><h3>Special Thanks</h3><p class="muted" style="margin:0 0 6px;font-size:.82rem">그림체 프리셋을 나눠 주신 분들</p>${STYLE_PRESETS.filter(x=>x.by).map(x=>`<div class="ep"><span class="t"><b>${esc(x.by)}</b><span class="muted">그림체 「${esc(x.name)}」</span></span></div>`).join('')}</div>
${IS_NATIVE?`<div class="panel"><h3>앱 업데이트</h3><p class="muted" style="margin:0 0 10px">지금 버전: ${esc(window.__LIVE__?'온라인 업데이트 '+window.__LIVE__:'설치 버전 '+APP_BUILD)}. 새 버전이 나오면 앱이 GitHub에서 받아 와요. API 키는 이 기기에만 저장되고 어디로도 보내지 않아요(각 AI 회사 서버로 직접 요청할 때만 써요).</p>
    <div class="row"><button class="btn sm" data-act="upd-open">업데이트 설정</button><button class="btn sm ghost" data-act="updcheck">지금 확인</button></div></div>`:`<div class="panel"><h3>업데이트</h3><p class="muted" style="margin:0 0 10px">지금 버전: ${esc(APP_BUILD)}${onPcServer()?' · PC 서버로 실행 중':''}. 새 버전이 나오면 켤 때와 30분마다 확인해서 알려 드려요. 받기를 누르면 바로 새 버전으로 다시 열려요.</p>
    <div class="row"><button class="btn sm ghost" data-act="webupdcheck">지금 확인</button></div></div>`}
  <div class="panel"><h3>공유와 피드백</h3><p class="muted" style="margin:0 0 10px">공유팩은 .ggmpack 파일로 저장하며, 기존 JSON 공유팩도 불러올 수 있어요. 공유 팩에는 API 키, 업데이트 토큰, 진행 상황, 음성이 들어가지 않아요.</p>
    <div class="row"><button class="btn sm" data-act="shareopen">공유 팩 만들기</button><button class="btn sm ghost" data-act="importfile">공유 팩 불러오기</button><button class="btn sm ghost" data-act="fbopen">피드백 보내기</button><button class="btn sm ghost" data-act="guidecopy">친구용 안내문</button></div></div>
  <div class="panel official"><h3>공식 배포처</h3><p class="muted" style="margin:0 0 8px">이 앱은 아래 두 곳에서만 배포해요. <b style="color:var(--ink)">다른 곳에서 받은 APK나 파일은 쓰지 마세요.</b> 개조된 파일은 넣어 둔 API 키를 빼돌릴 수 있어요.</p>
    <div class="row"><button class="btn sm ghost" data-act="sylink" data-url="https://github.com/jjhk0803/gacha-game-maker/releases">안드로이드 APK (GitHub)</button><button class="btn sm ghost" data-act="sylink" data-url="https://jjhk0803.github.io/gacha-game-maker/">아이폰·PC 웹</button></div>
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">© jjhk0803 · 이용 조건 CC BY-NC-ND 4.0 — 개인 사용과 원본 그대로 무료 공유는 자유, 수정본 재배포·판매는 금지. 내가 만든 게임 내용(세계관·캐릭터·그림)은 만든 사람의 것이에요. <button class="linkb" data-act="sylink" data-url="https://github.com/jjhk0803/gacha-game-maker/blob/main/LICENSE.md">자세히</button></p></div>`};
  if(!STTAB||!SEC[STTAB]) return `${pageHead('설정','SYSTEM')}<div class="st-grid">${ST.map(([k,l,ic,sub2])=>`<button class="st-tile" data-act="sttab" data-k="${k}"><i>${ic}</i><b>${esc(l)}</b><span>${esc(sub2||'')}</span></button>`).join('')}</div>`;
  const cur=ST.find(x=>x[0]===STTAB);
  return `<div class="st-head"><button class="x" data-act="sttab" data-k="" aria-label="설정으로">‹</button><b>${cur[2]} ${esc(cur[1])}</b></div>${SEC[STTAB]}`;
}
/* 화면 맨 위로(View) — 탭·화면을 옮긴 뒤 */
function viewTop(){ $('#view').scrollTop=0; }
/* 로비 메뉴 숨기기/보이기(View — 화면 감상) */
function lobbyMenuHidden(){ return document.body.classList.contains('lb-hidden'); }
function lobbyMenu(show){ document.body.classList.toggle('lb-hidden',!show); }
function lobbyBubbleText(){ const el=$('#bubble'); return el?el.textContent:undefined; }
