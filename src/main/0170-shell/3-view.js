/* ===== 0170-shell — View(HTML·DOM을 만듦) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
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
function uiSelectText(field){if(!field)return;const root=field.closest('.sheet')||document.getElementById('view'),state=uiScrollCapture(root);field.focus({preventScroll:true});try{field.setSelectionRange(0,field.value.length);}catch(e){field.select();}uiScrollRestore(root,state);}
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
function crewHTML(){
  const busy=busyIds(), list=[...G.chars].sort((a,b)=>(own(b.id)?1:0)-(own(a.id)?1:0)||b.rarity-a.rarity||(a.ord||0)-(b.ord||0));
  return `${pageHead(T('crew'),'UNITS')}<div class="chap"><span class="muted">${G.chars.filter(c=>own(c.id)).length} / ${G.chars.length}</span><div class="row"><button class="btn sm ghost" data-act="addchar-open">＋ ${esc(T('crew'))} 추가</button><button class="btn sm" data-act="newpu">✦ 신규 픽업 만들기</button><button class="btn sm ghost" data-act="castfaces">😊 표정 한꺼번에 만들기</button></div></div>
  <div class="grid">${list.map(c=>{const o=own(c.id);return `<button class="cc r${c.rarity} ${o?'':'off'}" data-act="char" data-id="${c.id}">${art(c)}<span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${o&&o.dup?`<span class="dup">${'★'.repeat(o.dup)}</span>`:''}${busy.has(c.id)?'<span class="busy">파견 중</span>':''}<span class="lbl"><i>${RL[c.rarity]} · ${ROLE_EN[c.role]}</i><b>${esc(c.name)}</b>${o?`Lv.${o.lv}`:'미보유'}</span></button>`;}).join('')}</div>`;
}
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
/* src/main/0170-shell/0210-setup.js에서 옮김 */
function showSetup(){ const s=SND(); APD={id:'',type:'gemini',pub:'google',name:'',region:'global',base:'https://openrouter.ai/api/v1'}; SW={step:0,ai:{type:'gemini',key:''},img:imgProvider(),cf:Object.assign({},comfyCfg()),nai:naiCfg().key||'',fish:s.fishKey||'',el:s.elKey||'',ok:{},hasAI:AIP().list.some(apValid),cst:{tags:myStyle().tags||'',neg:myStyle().neg||''},stPrev:''}; renderSetup(); $('#ov').hidden=false; }
function swRead(){ const v=id=>{const el=$('#'+id);return el?el.value.trim():null;};
  if($('#ap_type')){ readAp(); SW.ai.type=APD.type; SW.ai.key=APD.key||APD.sa||APD.vkey||''; }
  if(v('sw_img')!=null) SW.img=v('sw_img'); if(v('sw_cfurl')!=null) SW.cf.url=v('sw_cfurl'); if($('#sw_cfwf')) SW.cf.wf=$('#sw_cfwf').value.trim();
  if(v('sw_nai')!=null) SW.nai=v('sw_nai'); if(v('sw_fish')!=null) SW.fish=v('sw_fish'); if(v('sw_el')!=null) SW.el=v('sw_el');
  if($('#sw_auto')) SW.autoArt=$('#sw_auto').value; if($('#sw_stags')) SW.cst.tags=$('#sw_stags').value.trim(); if(v('sw_sneg')!=null) SW.cst.neg=v('sw_sneg'); }
function renderSetup(){
  const oldSetup=$('#ov .setup'),setupPosition=oldSetup?.dataset.step===String(SW.step)?uiScrollCapture($('#ov')):null;
  const st=SW.step, dots=[0,1,2,3,4,5].map(i=>`<i class="${i<=st?'on':''}"></i>`).join(''), a=SW.ai, help=SETUP_HELP[a.type];
  const card=[
    `<div class="sw-logo sw-splash"><i>GACHA GAME MAKER</i><b>가챠 게임 메이커</b><span>내가 정한 세계관으로 만드는 나만의 가챠 게임</span></div>
     ${IS_IOS&&!IS_STANDALONE?'<p style="margin:8px 0 0;font-size:.82rem">📱 Safari 공유(⬆︎) → <b>홈 화면에 추가</b> 후 아이콘으로 열면 저장이 안전해요.</p>':''}
     <div class="sw-btns"><button class="btn" data-act="swnext">시작하기</button><button class="btn ghost" data-act="swskipall">샘플 게임으로</button></div>`,
    `<h2>글 AI</h2><p class="muted">세계관·캐릭터·스토리를 써요. 키는 이 기기에만 저장돼요.</p>
     ${AIP().list.length?`<div class="sw-added">${AIP().list.map(p=>`<span>✓ ${esc(p.name||AITYPE[p.type])}${p.model?' · '+esc(p.model):''}</span>`).join('')}</div>`:''}
     ${apForm(APD)}
     ${SETUP_HELP[APD.type]?`<p class="muted" style="margin:2px 0 0"><button class="linkb" data-act="swlink" data-url="${SETUP_HELP[APD.type][1]}">키 받으러 가기</button></p>`:''}
     <div class="sw-test"><button class="btn sm ghost" data-act="swtestai">연결 확인</button><button class="btn sm ghost" data-act="swaddai">이 AI 추가하고 하나 더</button><span id="sw_res">${SW.ok.ai?'✓ 연결됨':''}</span></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
    `<h2>그림 AI</h2><p class="muted">스탠딩, 일러스트, 배경, 적, 아이콘을 그려요.</p>
     <label class="f" for="sw_img">종류</label><select class="in" id="sw_img">${opt([['nai','NovelAI (구독 필요, 투명 배경·레퍼런스·표정 변환)'],['comfy','ComfyUI (내 PC·서버의 워크플로)']],SW.img)}</select>
     ${SW.img==='comfy'?`<label class="f" for="sw_cfurl">ComfyUI 주소</label><input class="in" id="sw_cfurl" value="${esc(SW.cf.url||'')}" placeholder="http://192.168.0.10:8188">
     <p class="muted" style="margin:4px 0 0">PC에서 ComfyUI를 --listen 옵션으로 켜고, 폰과 같은 와이파이에서 PC의 IP를 넣어요.</p>
     <label class="f" for="sw_cfwf">워크플로 (Export (API) JSON)</label><textarea class="in" id="sw_cfwf" style="min-height:80px">${esc(SW.cf.wf||'')}</textarea>
     <div class="sw-test"><button class="btn sm ghost" data-act="cfload">JSON 파일 불러오기</button><button class="btn sm ghost" data-act="cftest">연결 확인</button><span id="sw_res"></span></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`:`
     <label class="f" for="sw_nai">영구 API 토큰</label><input class="in" id="sw_nai" type="password" autocomplete="off" value="${esc(SW.nai)}" placeholder="pst-...">
     <p class="muted" style="margin:6px 0 0">novelai.net 로그인 → 설정(톱니) → Account → Get Persistent API Token <button class="linkb" data-act="swlink" data-url="https://novelai.net/image">NovelAI 열기</button></p>
     <div class="sw-test"><button class="btn sm ghost" data-act="swtestnai">연결 확인</button><span id="sw_res">${SW.ok.nai?'✓ 연결됨':''}</span></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`}`,
    `<h2>그림체 (선택)</h2><p class="muted">프리셋을 고르거나 직접 적어요. 비워 두면 기본 그림체예요.</p>
     <div class="chips" style="margin:6px 0">${allPresets().map(p=>`<button class="chip ${SW.preset===p.id?'on':''}" data-act="swpreset" data-v="${p.id}">${pthumbHTML(p.id,'chip')}${esc(p.name)}</button>`).join('')}</div>
     ${imgReady()||(SW.img==='comfy'?SW.cf.url:SW.nai)?'':'<p style="color:var(--rose);font-size:.85rem">그림 AI를 안 넣었으면 건너뛰어도 돼요.</p>'}
     <label class="f" for="sw_stags">그림체 태그 (쉼표로 구분)</label><textarea class="in" id="sw_stags" style="min-height:90px" placeholder="${esc(STYLE_EX)}">${esc(SW.cst.tags||'')}</textarea>
     <label class="f" for="sw_sneg">빼고 싶은 것 (선택)</label><input class="in" id="sw_sneg" value="${esc(SW.cst.neg||'')}" placeholder="예: 3d, realistic">
     <label class="f" for="sw_auto">AI가 새 스테이지·이벤트·캐릭터를 만들면</label><select class="in" id="sw_auto">${opt([['ask','그릴지 물어보기'],['auto','자동으로 그리기'],['off','그리지 않기']],SW.autoArt||naiCfg().autoArt||'ask')}</select>
     <div class="sw-test"><button class="btn sm ghost" data-act="swstytest">시험 그리기</button><span id="sw_sres"></span></div>
     ${SW.stPrev?`<div class="sty-prev"><img src="${SW.stPrev}" alt="시험 그림"></div>`:''}
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
    `<h2>목소리·배경음 (선택)</h2>
     <label class="f" for="sw_fish">Fish Audio API 키 (목소리)</label><input class="in" id="sw_fish" type="password" autocomplete="off" value="${esc(SW.fish)}">
     <label class="f" for="sw_el">ElevenLabs API 키 (배경음·효과음)</label><input class="in" id="sw_el" type="password" autocomplete="off" value="${esc(SW.el)}">
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
    `<h2>어떤 게임을 만들까요?</h2>
     <ul class="sw-sum"><li class="${a.key||SW.hasAI?'on':''}">${a.key||SW.hasAI?'✓':'–'} 글 AI ${a.key?esc(AITYPE[a.type]):SW.hasAI?'등록됨':'없음'}</li><li class="${SW.img==='comfy'?(SW.cf.url?'on':''):(SW.nai?'on':'')}">${(SW.img==='comfy'?SW.cf.url:SW.nai)?'✓':'–'} 그림 AI ${SW.img==='comfy'?'ComfyUI':'NovelAI'}${(SW.img==='comfy'?SW.cf.url:SW.nai)?'':' 없음'}</li><li class="${SW.fish?'on':''}">${SW.fish?'✓':'–'} 목소리</li><li class="${SW.el?'on':''}">${SW.el?'✓':'–'} 배경음</li></ul>
     <div class="sw-opt ${a.key||SW.hasAI?'':'off'}"><b>✦ AI로 새 게임 만들기</b><span>한 줄만 적거나, 세계관을 직접 적어요.</span>
       ${a.key||SW.hasAI?`<button class="btn block" data-act="swdraft" style="margin-top:10px">새 게임 초안 열기</button>`:`<span class="muted">글 AI 키를 넣으면 쓸 수 있어요. <button class="linkb" data-act="swgo1">키 넣으러 가기</button></span>`}</div>
     <div class="sw-opt"><b>🔗 구독 주소로 받기</b><span>다른 사람이 게시한 게임을 받아서 플레이해요. AI 키가 없어도 돼요.</span><input class="in" id="sw_sub" placeholder="GGMSUB:주인/저장소/브랜치/games/…" autocomplete="off" style="margin-top:8px"><button class="btn ghost block" data-act="swsub" style="margin-top:8px">구독하고 시작</button></div>
     <div class="sw-opt"><b>☆ 샘플 게임 「낙성계약」</b><span>바로 해 볼 수 있는 기본 게임이에요.</span><button class="btn ghost block" data-act="swdone" style="margin-top:10px">샘플로 시작</button></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button></div>`][st];
  $('#ov').innerHTML=`<div class="setup" data-step="${st}"><div class="sw-bg" style="${bgStyle(P().titleBg||'낙성 분화구')}"></div><div class="sw-card"><div class="sw-dots">${dots}</div>${card}</div></div>`;
  if(setupPosition)uiScrollRestore($('#ov'),setupPosition);
}
/* src/main/0170-shell/0230-modal.js에서 옮김 */
function openModal(html,lock,cls){const m=$('#modal');m.innerHTML=`<div class="sheet ${cls||''}" role="dialog">${html}</div>`;m.hidden=false;m.dataset.lock=lock?'1':'';m.querySelector('.sheet').scrollTop=0;}
function closeModal(){if(typeof regenCancel==='function'&&!regenCancel())return;v2CancelEditorGeneration();if(typeof v2CloseGearEditor==='function')v2CloseGearEditor();const m=$('#modal');m.hidden=true;m.innerHTML='';m.dataset.lock='';NAIJOB=null;}
// 상단바 게임 이름: 한 줄로, 넘치면 글자를 줄여요(최소 0.7배, 그래도 넘치면 …)
function fitBrand(){ const el=document.querySelector('.brand .brand-t'); if(!el) return; el.style.fontSize=''; let f=1; for(let i=0;i<8&&el.scrollWidth>el.clientWidth+1&&f>0.7;i++){ f-=0.05; el.style.fontSize=f+'em'; } }
function opt(list,cur){return list.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('');}
// 가로로 긴 그림은 세로 화면에서 돌려서 크게 보여 줘요(버튼으로 되돌리기)
function wideFit(d){ const im=d.querySelector('img'); if(!im) return; const go=()=>{ const wide=im.naturalWidth>im.naturalHeight*1.15; if(!wide) return; const b=document.createElement('button'); b.className='lb-rot'; b.type='button'; b.textContent='⟳ 가로로 보기'; b.addEventListener('click',e=>{ e.stopPropagation(); d.classList.toggle('rot'); b.textContent=d.classList.contains('rot')?'⟲ 세로로 보기':'⟳ 가로로 보기'; }); d.appendChild(b);
      // 휴대폰을 돌리면 그에 맞춰요: 세로로 들고 있을 때만 가로 그림을 눕혀 크게, 가로로 돌리면 바로 원래대로. 직접 누르면 그 선택을 따라요
      let manual=false; b.addEventListener('click',()=>{ manual=true; },true); const fit=()=>{ if(!d.isConnected){ removeEventListener('resize',fit); return; } if(manual) return; const port=innerHeight>innerWidth*1.1&&orientPref()!=='landscape'; d.classList.toggle('rot',port); b.textContent=port?'⟲ 세로로 보기':'⟳ 가로로 보기'; }; addEventListener('resize',fit); fit(); }; if(im.complete&&im.naturalWidth) go(); else im.addEventListener('load',go,{once:true}); }
function imgViewer(src){ if(!src) return; const d=document.createElement('div'); d.className='lbrev view'; d.innerHTML=`<img src="${esc(src)}" alt="">`; wideFit(d); d.addEventListener('click',e=>{ if(e.target.closest('.lb-rot')) return; d.remove(); }); document.body.appendChild(d); }
function lbReveal(c,view){
  const s=view?imgSrc(c[view]):imgSrc(c.lbcg); if(!s) return;
  const d=document.createElement('div'); d.className='lbrev'+(view?' view':'');
  d.innerHTML=view?`<img src="${esc(s)}" alt="">`:`<div class="rays"></div><img src="${esc(s)}" alt=""><div class="flash"></div><div class="lbt"><i>MAX ${esc(T('limit'))}</i><b>${esc(c.name)}</b><span>특별 일러스트가 공개됐어요 · 화면을 누르면 닫혀요</span></div>`;
  wideFit(d); d.addEventListener('click',e=>{ if(e.target.closest('.lb-rot')) return; d.remove(); }); document.body.appendChild(d); if(!view){ sfx('SSR'); if(c.voiceId&&SND().voiceLobby){ const l=rand(c.dupLines.length?c.dupLines:c.lines); if(l) speak(c,l); } }
}
async function shareText(title,text){
  try{ if(CAP&&CAP.Share){ await CAP.Share.share({title,text,dialogTitle:title}); return; } if(navigator.share){ await navigator.share({title,text}); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(text); toast('복사했어요. 카톡 등에 붙여 넣으세요'); }catch(e){ openModal(`${head(title)}<textarea class="in" style="min-height:240px">${esc(text)}</textarea><p class="muted">길게 눌러 복사하세요.</p>`); }
}
function openShare(){
  const ni=allImgObjs().filter(o=>o.img).length, na=G.lib.filter(l=>l.audio).length;
  openModal(`${head('공유 팩 만들기')}
    <p>지금 게임(<b>${esc(G.meta.title)}</b>)의 세계관, ${esc(T('crew'))}, 스토리, 배너, 이벤트를 .ggmpack 파일 하나로 묶어요. 큰 그림도 조금씩 나누어 저장해요. 받은 사람은 설정 → 데이터 → 공유 팩 불러오기에서 <b>새 게임으로 추가</b>할 수 있어요.</p>
    <div class="optbox"><label class="f"><input type="checkbox" id="sh_img" checked> 그림 넣기 (${ni}장, 파일이 커져요)</label>
    <label class="f"><input type="checkbox" id="sh_aud"> 배경음·효과음 넣기 (${na}개)</label></div>
    <label class="f"><input type="checkbox" id="sh_gate" checked> 픽업·${esc(T('event'))}을 스토리 진행에 맞춰 차례로 열기 <span class="muted" style="font-size:.78rem">(${G.events.length}개 ${esc(T('event'))} · ${G.banners.filter(bn=>bn.id!=='std'&&!bn.eventId).length}개 픽업. 끄면 처음부터 모두 열려요)</span></label>
    <p class="muted">그림체: ${String(G.meta.artTags||'').trim()?'게임 정의의 그림체가 들어가요.':'게임 정의에 그림체가 비어 있어서, 지금 설정의 기본 그림체를 넣어 보내요.'} 받은 사람이 새 그림을 그릴 때 이 그림체를 써요.</p>
    <p class="muted">들어가지 않는 것: API 키, NovelAI 토큰, 업데이트 토큰, 내 진행 상황(보유 ${esc(T('crew'))}, 재화), 플레이어 이름, 캐릭터 음성과 목소리 ID.</p>
    <p class="muted">작가 이름 태그로 그린 그림이나 실제 성우를 닮은 목소리는 아는 사람끼리만 돌려 보고, 공개 커뮤니티에 올리지 마세요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="sharego">만들어서 보내기</button></div>`);
}
/* 창을 다시 그려도 스크롤 자리 유지(View) */
function modalKeep(open){ const sh=$('#modal .sheet'), y=sh?sh.scrollTop:0; open(); const sh2=$('#modal .sheet'); if(sh2) sh2.scrollTop=y; }
function fbStarsShow(){ document.querySelectorAll('#fbStars .chip').forEach(b=>chipOn(b,+b.dataset.n===FB_STAR)); }
function openFeedback(){
  FB_STAR=0;
  openModal(`${head('피드백 보내기')}
    <p class="muted" style="margin:0 0 8px">써서 보내기를 누르면 카톡 같은 앱으로 보낼 수 있어요. 버전과 기기 정보가 자동으로 붙어요(키나 개인 정보는 안 붙어요).</p>
    <label class="f">전체 점수</label><div class="chips" id="fbStars">${[1,2,3,4,5].map(n=>`<button class="chip" data-act="fbstar" data-n="${n}">${'★'.repeat(n)}</button>`).join('')}</div>
    <label class="f" for="fb_name">이름 (선택)</label><input class="in" id="fb_name" maxlength="20">
    <label class="f" for="fb_good">재미있던 점</label><textarea class="in" id="fb_good"></textarea>
    <label class="f" for="fb_bad">불편했던 점, 버그 (어느 화면에서 무엇을 했을 때)</label><textarea class="in" id="fb_bad"></textarea>
    <label class="f" for="fb_want">있었으면 하는 것</label><textarea class="in" id="fb_want"></textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="fbsend">복사·공유하기</button><button class="btn ghost" data-act="fbissue">GitHub 이슈로</button>${LV().feedback?'<button class="btn ghost" data-act="fbpost">게시글 열기</button>':''}</div>
    <p class="muted" style="margin:6px 0 0">복사해서 배포 게시글 댓글에 붙여 넣거나, GitHub 계정이 있으면 이슈로 남길 수 있어요.</p>`);
}
function feedbackText(){
  const v=id=>($('#'+id)&&$('#'+id).value.trim())||'-', p=P();
  const ua=(navigator.userAgent.match(/Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_]+/)||['알 수 없음'])[0];
  return `[${G.meta.title} 피드백]\n점수: ${FB_STAR?'★'.repeat(FB_STAR)+'☆'.repeat(5-FB_STAR):'-'}\n보낸 사람: ${v('fb_name')}\n\n■ 재미있던 점\n${v('fb_good')}\n\n■ 불편했던 점, 버그\n${v('fb_bad')}\n\n■ 있었으면 하는 것\n${v('fb_want')}\n\n— 버전 ${window.__LIVE__||APP_BUILD} · ${ua} · 화면 ${innerWidth}×${innerHeight} · ${T('crew')} ${Object.keys(p.owned).length}/${G.chars.length} · 클리어 ${Object.keys(p.cleared||{}).length}`;
}
/* 캐릭터 창 부분 갱신(View): 탭 · 전신/상반신 · 누르기 반응(물결·하트·몸짓·표정·말풍선 — 보였으면 true) */
function csTabShow(){ document.querySelectorAll('.cs-tabs button').forEach(b=>chipOn(b,b.dataset.k===CS_TAB)); document.querySelectorAll('[data-cs]').forEach(s=>s.hidden=s.dataset.cs!==CS_TAB); }
function csFrameShow(t,full){ const a2=$('.cs-art'); if(a2){ a2.classList.toggle('up',!full); const cc=charById(a2.dataset.id); if(cc) a2.innerHTML=characterDetailArt(cc,!full); } t.textContent=full?'상반신':'전신'; }
function csSayText(){ const sy=$('#csSay'); return sy?sy.textContent:undefined; }
function csPokeShow(t,c,l,owned,lv,zone,x,y){ ripple(x,y,lv>=7); if(owned&&lv>=5&&zone==='head') hearts(x,y,Math.min(5,lv-3)); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv));
  const sy=$('#csSay'); if(!l||!sy) return false; sy.textContent=sub(l); sy.hidden=false; sy.classList.remove('pop'); void sy.offsetWidth; sy.classList.add('pop'); clearTimeout(window._csT); window._csT=setTimeout(()=>{if(sy.isConnected)sy.hidden=true;},3200); return true; }
// Detail is an original-art viewer, independent of the gameplay standing preference.
function characterDetailArt(c,upper=false){
 const sk=skinOf(c),pick=o=>o&&(upper?imgSrcRaw(o.upper)||imgSrcRaw(o):imgSrcRaw(o)||imgSrcRaw(o.upper));
 const src=pick(sk)||pick(c),up=!!src&&(src===imgSrcRaw(sk?.upper)||src===imgSrcRaw(c.upper));
 return src?`<img class="art ${up?'upimg':''}" src="${esc(src)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`:`<div class="art ph"><small>이미지 미등록</small></div>`;
}
function characterDetailPreviewTargets(root){
 const locked=new Set([...root.querySelectorAll('[data-cs=look] .locked img')].map(img=>img.src));
 for(const img of root.querySelectorAll('[data-cs="look"] img')){
  if(img.closest('.locked')||locked.has(img.src))continue;
  img.dataset.characterPreview='true';img.tabIndex=0;img.setAttribute('role','button');
  img.setAttribute('aria-label',(img.alt||'캐릭터 이미지')+' 크게 보기');
 }
}
/* 캐릭터 창(View): 장비·스킬 · 스토리 · 외형 · 정보 탭 */
function charSheetShow(id){
  const c=charById(id); if(!c) return; MBACK=null; const o=own(c.id),st=stats(c);
  const eps=[...c.episodes].sort((a,b)=>a.lv-b.lv), ths=G.threads.filter(t=>t.charId===c.id), cap=o?levelCap(o):20;
  const old=$('#modal .sheet.cs-sheet'), keep=old&&old.dataset.cid===id?old.scrollTop:0;
  const list=crewOrder(), i=list.findIndex(x=>x.id===id), prev=list[(i-1+list.length)%list.length], next=list[(i+1)%list.length];
  const lbs=imgSrcRaw(c.lbcg), cgOpen=!!(o&&o.dup>=5), skinSel=o&&o.skin, ill=c.illust?imgSrcRaw(c.illust):null, wearing=skinOf(c), sec=(k,h)=>`<section data-cs="${k}" ${CS_TAB===k?'':'hidden'}>${h}</section>`;
  const equip=`${rulesCharHTML(c)}
    ${v2EquipmentCard(c,o)}
    ${v2SkillSummary(c)}
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="wnai" data-id="${c.id}">NAI로 ${T('weapon')} 그리기</button><button class="btn sm ghost" data-act="v2icons" data-id="${c.id}">스킬 이미지 생성</button></div>`;
  const story=`
    <h3 class="sec">개인 스토리</h3>
    ${eps.length?eps.map(e=>{const lk=epLock(c,e,o),seen=o&&(o.seen||[]).includes(e.id);return `<div class="ep ${lk?'lock':''}"><span class="badge">Lv.${e.lv}</span><span class="t"><b>${esc(e.title)}</b><span class="muted">${lk?lk+' 필요':(seen?'감상 완료':'NEW')}</span></span>${!lk?`<button class="btn sm" data-act="playep" data-id="${c.id}" data-ep="${e.id}">보기</button>`:''}<button class="btn sm ghost" data-act="epedit" data-id="${c.id}" data-ep="${e.id}">편집</button></div>`;}).join(''):'<p class="muted">아직 없어요.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="epedit" data-id="${c.id}" data-ep="">스토리 추가</button></div>
    <h3 class="sec">${T('talk')}</h3>
    ${ths.length?ths.map(t=>{const s=P().inbox[t.id];return `<div class="ep"><span class="t"><b>${esc(t.title)}</b><span class="muted">${trigDesc(t)} · ${s?(s.done?'읽음':'도착'):'미도착'}</span></span>${s?`<button class="btn sm" data-act="openthread" data-id="${t.id}">열기</button>`:''}<button class="btn sm ghost" data-act="thedit" data-id="${c.id}" data-th="${t.id}">편집</button></div>`;}).join(''):'<p class="muted">아직 없어요.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="thedit" data-id="${c.id}" data-th="">${T('talk')} 추가</button></div>
    <h3 class="sec">관계</h3>
    ${(()=>{ const ref=baseChar(c).id, rs=relOf(ref); return rs.length?rs.slice(0,6).map(r=>`<div class="ep"><span class="t"><b>${esc(relName(relOther(r,ref),true))} <span class="muted">· ${esc(r.kind||'')}</span></b><span class="muted">${esc(r.note||'')}</span></span></div>`).join('')+(rs.length>6?`<p class="muted" style="font-size:.78rem">외 ${rs.length-6}개</p>`:''):'<p class="muted">아직 관계 기록이 없어요. 스토리를 만들면 함께 쌓여요.</p>'; })()}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="relopen" data-r="${esc(baseChar(c).id)}">🕸 관계도 보기</button></div>`;
  const outfit=(c.skins||[]).length?`<div class="outfit"><b>의상</b><div class="chips">${o?`<button class="chip ${!skinSel?'on':''}" data-act="skinuse" data-id="${c.id}" data-s="">기본</button>`:''}${(c.skins||[]).map(k=>`<button class="chip ${skinSel===k.id?'on':''}" data-act="skinuse" data-id="${c.id}" data-s="${k.id}" ${o?'':'disabled'}>${skinHave(k)?'':'🔒 '}${esc(k.name)}${skinDisplayReady(c,k)?'':skinPreviewSrc(c,k)?' (상반신 필요)':' (미생성)'}</button>`).join('')}</div>${wearing&&!skinDisplayReady(c,wearing)&&c.useStanding===false?`<p class="muted">선택한 스킨의 상반신이 없어 기본 상반신을 표시하고 있어요. <button class="btn sm ghost" data-act="skinuse" data-id="${c.id}" data-s="${wearing.id}">스킨 상반신 생성</button></p>`:''}</div>`:'';
  const look=(wearing?`${v2StandingHeader(c)}${outfit}<p class="muted" style="margin:4px 0 8px;font-size:.8rem">「${esc(wearing.name)}」을(를) 입고 있어요. 여기서 고치면 이 ${esc(T('skin'))}에 저장돼요. 기본 모습은 '기본'을 고른 뒤 고쳐요.</p>${skinCard(c,wearing)}
    <div class="row" style="margin:10px 0"><button class="btn sm ghost" data-act="skin-open" data-id="${c.id}">새 ${T('skin')} 만들기</button></div>`:`${outfit}
    <div class="row" style="margin:0 0 4px"><button class="btn sm ghost" data-act="imglib" data-id="${c.id}">🖼 그림 모아 보기</button></div>
    ${v2StandingHeader(c)}
    <p class="muted" style="margin:0 0 6px">배경 없는 전신 그림이에요. ${T('crew')} 목록과 ${T('talk')}에서는 위쪽(상반신, 얼굴)만 잘라서 보여 줘요.</p>
    <div class="ill-box standing-box">${imgSrcRaw(c)?`<img src="${esc(imgSrcRaw(c))}" alt="${esc(c.name)} 스탠딩">`:'<span>스탠딩 이미지가 아직 없어요</span>'}</div>
    <div class="row"><button class="btn sm" data-act="naigen" data-k="char" data-id="${c.id}">NAI로 스탠딩</button><button class="btn sm ghost" data-act="upload" data-k="char" data-id="${c.id}">이미지 올리기</button>${imgSrcRaw(c)?`<button class="btn sm ghost" data-act="cutopen" data-k="char" data-id="${c.id}">배경 지우기</button>`+XBTN('char',c.id,'','지우기'):''}</div>
    <h3 class="sec">상반신 (스토리·프로필)</h3>
    <p class="muted" style="margin:0 0 6px">배경 없는 상반신 그림이에요. 있으면 스토리와 ${T('crew')} 프로필에서 전신을 잘라 쓰는 대신 이 그림을 써요. 표정 그림이 있는 장면에서는 표정이 먼저예요.</p>
    <div class="ill-box up-box">${c.upper&&imgSrc(c.upper)?`<img src="${esc(imgSrc(c.upper))}" alt="">`:'<span>아직 없어요 · 없으면 전신 위쪽을 잘라서 보여 줘요</span>'}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="upgen" data-id="${c.id}">NAI로 상반신</button><button class="btn sm ghost" data-act="upload" data-k="upper" data-id="${c.id}">올리기</button>${c.upper&&imgSrc(c.upper)?`<button class="btn sm ghost" data-act="updel" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">로비 레이어 (배경 + 캐릭터 따로)</h3>
    <p class="muted" style="margin:0 0 6px;font-size:.8rem">배경과 투명 캐릭터를 따로 그려 겹쳐요. 로비에서 배경은 그대로, 캐릭터만 숨 쉬듯 움직여요. 배경이 없으면 로비 배경을, 포즈가 없으면 상반신 그림을 써요. 상반신도 없으면 스탠딩 사용 설정에 따라 표시해요. 일러스트로 자동 전환하지 않아요.</p>
    <div class="lbl-pair"><div class="lbl-prev">${(()=>{ /* 포즈 → 상반신 순서로 로비와 동일하게 표시 */ const bgI=c.lbbg&&imgSrc(c.lbbg),bg=bgI?`<img class="lbl-bg" src="${esc(bgI)}" alt="">`:`<div class="lbl-bg" style="${bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div>`,ps=!(skinOf(c)&&imgSrc(skinOf(c)))&&c.pose&&imgSrc(c.pose);return bg+(ps?`<img class="lbl-ch" src="${esc(ps)}" alt="">`:lobbyCharacterArt(c,'lbl-ch')); })()}</div>
      <div class="lbl-side"><span class="muted">배경 ${c.lbbg&&imgSrc(c.lbbg)?'✓':'—'} · 포즈 ${c.pose&&imgSrc(c.pose)?'✓':'—'}</span>
      <label class="f" for="lbbg_scene">배경 장면 태그</label><input class="in" id="lbbg_scene" value="${esc((c.lbbg&&c.lbbg.prompt)||'')}" placeholder="${esc((c.illust&&c.illust.prompt)||'cozy room, window, soft light')}"></div></div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="posegen" data-id="${c.id}" data-w="both">NAI로 배경 + 포즈</button><button class="btn sm ghost" data-act="posegen" data-id="${c.id}" data-w="bg">배경만</button><button class="btn sm ghost" data-act="posegen" data-id="${c.id}" data-w="pose">포즈만</button></div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="upload" data-k="lbbg" data-id="${c.id}">배경 올리기</button><button class="btn sm ghost" data-act="upload" data-k="pose" data-id="${c.id}">포즈 올리기</button>${(c.pose&&imgSrc(c.pose))?`<button class="btn sm ghost" data-act="posedel" data-id="${c.id}">포즈 지우기</button>`:''}${c.lbbg&&imgSrc(c.lbbg)?`<button class="btn sm ghost" data-act="lbbgdel" data-id="${c.id}">배경 지우기</button>`:''}</div>
    <h3 class="sec">일러스트 (로비·타이틀·픽업)</h3>
    <p class="muted" style="margin:0 0 6px">배경까지 그려진 세로 한 장 그림이에요. 타이틀과 ${T('gacha')} 픽업 화면에 쓰이며, 로비에서는 표시 방식을 ‘일러스트 표시’로 골랐을 때 사용해요.</p>
    <div class="ill-box">${ill?`<img src="${esc(ill)}" alt="">`:'<span>아직 없어요</span>'}</div>
    <label class="f" for="il_scene">장면·배경 태그 (선택)</label><input class="in" id="il_scene" value="${esc(c.illust.prompt||'')}" placeholder="night, city lights, rooftop, wind, from below">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="ilgen" data-k="illust" data-id="${c.id}">NAI로 일러스트</button><button class="btn sm ghost" data-act="upload" data-k="illust" data-id="${c.id}">올리기</button>${ill?`<button class="btn sm ghost" data-act="ildel" data-k="illust" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">최대 ${esc(T('limit'))} CG</h3>
    <p class="muted" style="margin:0 0 6px">${esc(T('limit'))} 5단계를 달성하면 공개되는 특별 일러스트예요. 미리 만들어 두면 달성하는 순간 연출과 함께 열려요. 공개 후에는 로비에도 쓸 수 있어요.</p>
    <div class="ill-box ${cgOpen?'':'locked'}">${lbs?`<img src="${esc(lbs)}" alt="">`:'<span>아직 없어요</span>'}${cgOpen?'':`<div class="lockcap">🔒 ${esc(T('limit'))} 5단계에서 공개<small>${o?o.dup:0} / 5</small></div>`}</div>
    <label class="f" for="lb_scene">장면 태그 (선택)</label><input class="in" id="lb_scene" value="${esc(c.lbcg.prompt||'')}" placeholder="night sky, shooting stars, reaching out, smile, wind">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="ilgen" data-k="lbcg" data-id="${c.id}">NAI로 ${esc(T('limit'))} CG</button><button class="btn sm ghost" data-act="upload" data-k="lbcg" data-id="${c.id}">올리기</button>${lbs?`<button class="btn sm ghost" data-act="ildel" data-k="lbcg" data-id="${c.id}">지우기</button>`:''}</div>
    ${lbs&&cgOpen?`<label class="f" style="margin-top:8px"><input type="checkbox" data-act="cguse" data-id="${c.id}" ${o.useCg?'checked':''}> 로비와 타이틀에 이 CG 쓰기</label>`:''}
    <h3 class="sec">기술 컷인 (스킬 쓸 때 크게)</h3>
    <p class="muted" style="margin:0 0 6px">「${esc(v2Kit(c).ultimate.name)}」 궁극기를 쓸 때 화면을 가로지르며 크게 나오는 그림이에요. 없으면 스탠딩을 크게 써요.</p>
    <div class="ill-box scg-box">${imgSrcRaw(scgOf(c))?`<img src="${esc(imgSrcRaw(scgOf(c)))}" alt="">`:'<span>아직 없어요 · 없으면 스탠딩으로 나와요</span>'}</div>
    <label class="f" for="sc_scene">장면 요청 (선택 · 생성 시 AI가 궁극기에 맞게 구성)</label><input class="in" id="sc_scene" value="${esc(scgOf(c).prompt||'')}" placeholder="${esc(ultimateSceneTags(c))}, motion lines">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="scggen" data-id="${c.id}">NAI로 기술 컷인</button><button class="btn sm ghost" data-act="upload" data-k="scg" data-id="${c.id}">올리기</button><button class="btn sm ghost" data-act="scgtest" data-id="${c.id}">미리 보기</button>${imgSrc(scgOf(c))?`<button class="btn sm ghost" data-act="scgdel" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">표정과 ${T('skin')}</h3>
    <div class="facegrid">${c.faces.map(f=>`<button class="fc" data-act="faceview" data-id="${c.id}" data-f="${f.id}">${imgSrc(f)?`<img src="${esc(imgSrc(f))}" alt="">`:''}<span>${esc(f.name)}</span></button>`).join('')}</div>
    <div class="row" style="margin:8px 0"><button class="btn sm ghost" data-act="faces-open" data-id="${c.id}">표정 만들기</button><button class="btn sm ghost" data-act="audopen" data-id="${c.id}">점검·변환</button><button class="btn sm ghost" data-act="skin-open" data-id="${c.id}">${T('skin')} 만들기</button>${c.alt?'':`<button class="btn sm ghost" data-act="altnew" data-id="${c.id}">이격 만들기</button>`}</div>
    ${c.alt&&charById(c.alt)?`<p class="muted" style="margin:4px 0">이격: <button class="linkb" data-act="char" data-id="${c.alt}">${esc(charById(c.alt).name)}</button>의 다른 모습이에요.</p>${inheritHTML(c)}`:altsOf(c).length?`<p class="muted" style="margin:4px 0">이격: ${altsOf(c).map(x=>`<button class="linkb" data-act="char" data-id="${x.id}">${esc(x.name)}</button>${own(x.id)?'':' (미보유)'}`).join(' · ')}</p>`:''}
    ${charImgList(c).length?`<h3 class="sec">그림 저장 <span class="muted" style="font-size:.75rem">${charImgList(c).length}장 · 묶음을 눌러 펼쳐요</span></h3><p class="muted" style="margin:0 0 6px;font-size:.8rem">${IS_NATIVE?'Documents/가챠게임메이커/그림 폴더에 저장돼요.':'휴대폰은 공유하기로 사진 앱에, PC는 다운로드 폴더에 저장돼요.'}</p>${(()=>{ const L=charImgList(c), gs=[...new Set(L.map(x=>x[2]))]; return gs.map(g=>{ const it=L.filter(x=>x[2]===g); return `<details class="isv"><summary>${esc(g)} <span class="muted">${it.length}장</span></summary><div class="isv-grid">${it.map(([o,l])=>`<button class="isv-it" data-act="imgsave" data-id="${c.id}" data-o="${esc(o.id)}"><img src="${esc(imgSrcRaw(o))}" alt="" loading="lazy"><span>⬇ ${esc(l)}</span></button>`).join('')}</div></details>`; }).join(''); })()}`:''}`);
  const info=`${personaHTML(c)}
    <div class="row" style="margin-top:4px">${o&&P().sec!==c.id?`<button class="btn sm" data-act="setsec" data-id="${c.id}">로비에 세우기</button>`:''}${o?`<button class="btn sm ghost" data-act="gift" data-id="${c.id}">🎁 선물하기</button>`:''}<button class="btn sm ghost" data-act="charedit" data-id="${c.id}">✏️ 이름·대사 편집</button><button class="btn sm ghost" data-act="puexist" data-id="${c.id}">★ 픽업 배너</button></div>
    <p style="margin:12px 2px 4px">${esc(c.profile)}</p>
    ${(c.files||[]).length?`<h3 class="sec">${T('files')}</h3>${c.files.map(f=>o&&o.dup>=f.dup?`<div class="file"><i>FILE ${f.dup}</i>${esc(f.text)}</div>`:`<div class="file lock"><i>FILE ${f.dup}</i>${T('limit')} ${f.dup}단계에서 공개</div>`).join('')}`:''}
    <h3 class="sec">목소리</h3>
    <div class="ep"><span class="t"><b>${c.voiceId?esc(c.voiceName||'지정됨'):'없음'}</b><span class="muted">${c.voiceId?esc(c.voiceId):'Fish Audio에서 어울리는 목소리를 찾아요'}</span></span>${c.voiceId?`<button class="btn sm ghost" data-act="vtest" data-id="${c.id}">▶</button>`:''}<button class="btn sm" data-act="voice" data-id="${c.id}">${c.voiceId?'바꾸기':'찾기'}</button></div>
    <h3 class="sec">NAI 프롬프트</h3><div class="code-box">${esc(c.naiPrompt||'설정 편집에서 AI로 만들 수 있어요.')}</div>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="copy" data-text="${esc(c.naiPrompt||'')}">프롬프트 복사</button><button class="btn sm" data-act="charedit" data-id="${c.id}">설정 편집</button></div>`;
  openModal(`<div class="cs" style="--ec:${ECOL[c.elem]||'var(--rose)'}">
    <div class="cs-hero">
      <div class="cs-bg" style="${bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div><div class="cs-stripe"></div>
      <div class="cs-art ${P().csFull?'':'up'}" data-act="cspoke" data-id="${c.id}">${characterDetailArt(c,!P().csFull)}</div><div class="cs-say" id="csSay" hidden></div>${imgSrcRaw(skinOf(c)||c)?`<button class="cs-frame" data-act="csframe">${P().csFull?'상반신':'전신'}</button>`:''}
      <div class="cs-top"><button class="cs-back" data-act="close" aria-label="닫기">‹ <b>${esc(T('crew'))}</b></button><span class="cs-cap">${esc(T('crew')).toUpperCase()} INFORMATION</span></div>
      ${SAMPLE&&!playMode()?`<button class="cs-nav ai ${list.length>1?'':'solo'}" data-act="charregen" data-id="${c.id}" title="AI로 다시 만들기">✦ 재생성</button>`:''}${list.length>1?`<button class="cs-nav l" data-act="char" data-id="${prev.id}" aria-label="이전">‹</button><button class="cs-nav r" data-act="char" data-id="${next.id}" aria-label="다음">›</button>`:''}
      <div class="cs-panel">
        <div class="cs-rr"><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span><span class="cs-role">${ROLE_EN[c.role]}</span><span class="cs-rar r${c.rarity}">${RL[c.rarity]}</span></div>
        <div class="cs-plate"><span class="lv">LV.<b>${o?o.lv:1}</b>/${cap}</span><b class="nm">${esc(c.name)}</b></div>
        <div class="cs-sub"><span>${o?`<span class="st">${'★'.repeat(o.dup)}${'☆'.repeat(5-o.dup)}</span>`:'미보유'}${c.limited?' · 한정':''}</span>${o?`<span class="aff">♥ 호감도 ${affLv(o)}</span>`:''}</div>
        <div class="cs-pow"><i>POWER</i><b>${nf(charPower(c))}</b></div>
        <div class="cs-stat"><h4>STATUS</h4><div class="sg"><div><span>HP</span><b>${nf(st.hp)}</b></div><div><span>ATK</span><b>${nf(st.atk)}</b></div><div><span>DEF</span><b>${nf(st.def)}</b></div><div><span>SPD</span><b>${st.spd}</b></div></div></div>
        ${o?`<div class="cs-bar"><i style="width:${o.lv>=cap?100:o.exp/(GGMCombat.levelExperience(o.lv))*100}%"></i></div>
        <div class="cs-acts3"><button class="btn" data-act="enh" data-id="${c.id}">LV+ ${esc(T('enhance'))}</button><button class="btn max" data-act="enhmax" data-id="${c.id}">MAX</button><button class="btn lbk" data-act="lb" data-id="${c.id}">${o.lv>=70?'초월 승급':'승급'}</button></div>
`:`<p class="cs-mats" style="text-align:left">아직 보유하지 않았어요. ${esc(T('gacha'))}에서 만날 수 있어요.</p>`}
        <div class="cs-squad"><span>SQUAD</span><b>${esc(c.faction||'무소속')}</b></div>
      </div>
    </div>
    <div class="cs-tabs">${[['equip','장비·스킬'],['story','스토리'],['look','외형'],['info','정보']].map(([k,l])=>`<button class="${CS_TAB===k?'on':''}" data-act="cstab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="cs-body">${sec('equip',equip)}${sec('story',story)}${sec('look',look)}${sec('info',info)}</div>
  </div>`,false,'cs-sheet');
  characterDetailPreviewTargets($('#modal'));
  const el=$('#modal .sheet'); if(el){ el.dataset.cid=id; if(old)el.scrollTop=keep; }
}
function openCharEdit(id){
  const c=id?charById(id):cleanChar({name:''});
  const kv=o=>Object.entries(o||{}).flatMap(([k,v])=>(v||[]).map(x=>`${k}: ${x}`)).join('\n');
  openModal(`${head(id?'설정 편집':'새 '+T('crew'))}
    <div class="g2"><div><label class="f" for="f_name">이름</label><input class="in" id="f_name" value="${esc(c.name)}" maxlength="20"></div>
    <div><label class="f" for="f_fac">소속</label><input class="in" id="f_fac" value="${esc(c.faction)}" list="faclist"><datalist id="faclist">${[...new Set(G.chars.map(x=>x.faction).filter(Boolean))].map(f=>`<option value="${esc(f)}">`).join('')}</datalist></div></div>
    <div class="g2"><div><label class="f" for="f_rar">등급</label><select class="in" id="f_rar">${opt([[3,'SSR'],[2,'SR'],[1,'R']],c.rarity)}</select></div>
    <div><label class="f" for="f_pos">포지션 <span class="muted" style="font-size:.75rem">(전투 기본형)</span></label><select class="in" id="f_pos">${opt(POSITIONS().map(p=>[p.id,`${p.name} (${ROLE[p.base]}형)`]),posOf(c).id)}</select></div></div>
    <div class="g2"><div><label class="f" for="f_elem">속성</label><select class="in" id="f_elem">${opt(ELEMS.map(elem=>[elem,elem]),c.elem)}</select></div>
    <div><label class="f" for="f_lim">한정 여부</label><select class="in" id="f_lim">${opt([['0','상시'],['1','한정 (이벤트 배너에서만)']],c.limited?'1':'0')}</select></div></div>
    <div class="g4"><div><label class="f" for="f_hp">기본 체력</label><input class="in" id="f_hp" type="number" value="${c.hp}"></div><div><label class="f" for="f_atk">공격</label><input class="in" id="f_atk" type="number" value="${c.atk}"></div><div><label class="f" for="f_def">기본 방어력</label><input class="in" id="f_def" type="number" value="${c.def}"></div><div><label class="f" for="f_spd">속도</label><input class="in" id="f_spd" type="number" value="${c.spd}"></div></div>
    <p class="muted">아래는 심연탐사 호환용 스킬입니다. 일반 전투 스킬은 캐릭터 상세의 「일반 전투 스킬 편집 · AI 생성」에서 설정하세요.</p>
    <div class="g2"><div><label class="f" for="f_sk">심연탐사 스킬 이름</label><input class="in" id="f_sk" value="${esc(c.skill.name)}"></div><div><label class="f" for="f_kind">스킬 효과</label><select class="in" id="f_kind">${opt(Object.entries(KIND),c.skill.kind)}</select></div></div>
    <div class="g2"><div><label class="f" for="f_pow">위력 배율</label><input class="in" id="f_pow" type="number" step="0.1" value="${c.skill.power}"></div><div><label class="f" for="f_cd">쿨타임(턴)</label><input class="in" id="f_cd" type="number" value="${c.skill.cd}"></div></div>
    <label class="f" for="f_skd">스킬 설명</label><input class="in" id="f_skd" value="${esc(c.skill.desc)}">
    <label class="f" for="f_prof">프로필</label><textarea class="in" id="f_prof">${esc(c.profile)}</textarea>
    <label class="f" for="f_files">${T('files')} (한 줄에 하나, "${T('limit')}단계: 내용")</label><textarea class="in" id="f_files">${esc(c.files.map(f=>f.dup+': '+f.text).join('\n'))}</textarea>
    <label class="f" for="f_intro">${T('gacha')} 연출 대사</label><input class="in" id="f_intro" value="${esc(c.intro)}">
    <label class="f" for="f_lines">로비 대사 (한 줄에 하나)</label><textarea class="in" id="f_lines">${esc(c.lines.join('\n'))}</textarea>
    <label class="f" for="f_aff">호감도별 대사 ("레벨: 대사", 그 레벨부터 로비에 섞여 나와요)</label><textarea class="in" id="f_aff">${esc(kv(c.affLines))}</textarea>
    <div class="g2"><div><label class="f" for="f_lv">${T('enhance')} 대사</label><textarea class="in" id="f_lv">${esc(c.lvLines.join('\n'))}</textarea></div><div><label class="f" for="f_dup">${T('limit')} 대사</label><textarea class="in" id="f_dup">${esc(c.dupLines.join('\n'))}</textarea></div></div>
    <div class="g2"><div><label class="f" for="f_head">머리 터치 반응</label><textarea class="in" id="f_head">${esc(c.touch.head.join('\n'))}</textarea></div><div><label class="f" for="f_body">몸 터치 반응</label><textarea class="in" id="f_body">${esc(c.touch.body.join('\n'))}</textarea></div></div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="ailines">AI로 대사 채우기</button><button class="btn sm ghost" data-act="ailinesmore">AI로 대사 늘리기 (지금 대사에 더해요)</button></div>
    <div class="g2"><div><label class="f" for="f_wn">${T('weapon')} 이름</label><input class="in" id="f_wn" value="${esc(c.weapon.name)}"></div><div><label class="f" for="f_wd">${T('weapon')} 설명</label><input class="in" id="f_wd" value="${esc(c.weapon.desc)}"></div></div>
    <label class="f" for="f_wp">${T('weapon')} NAI 프롬프트</label><textarea class="in" id="f_wp" data-owner="${c.id}">${esc(c.weapon.prompt)}</textarea>
    ${id?`<div class="row" style="margin-top:6px">${SAMPLE?`<button class="btn sm ghost" data-act="wai" data-id="${c.id}">AI로 ${T('weapon')} 프롬프트 쓰기</button>`:''}<button class="btn sm ghost" data-act="wnai" data-id="${c.id}">NAI로 ${T('weapon')} 그리기</button></div>`:''}
    <label class="f" for="f_nai">NAI 스탠딩 프롬프트</label><textarea class="in" id="f_nai" data-owner="${c.id}">${esc(c.naiPrompt)}</textarea>
    <label class="f" style="margin-top:6px"><input type="checkbox" id="f_nodesign" ${c.noDesign?'checked':''}> 공통 디자인 태그 쓰지 않기 <span class="muted" style="font-size:.78rem">(설정 → 그림 AI → 캐릭터 디자인 통일)</span></label>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="ainai">AI로 NAI 프롬프트 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="savechar" data-id="${id||''}">저장</button>${id?`<button class="btn ghost" data-act="delchar" data-id="${c.id}">삭제</button>`:''}</div>`);
}
function stageOptions(cur){const o=[['','조건 없음']];G.chapters.forEach((ch)=>ch.stages.forEach((s)=>o.push([s.id,`${ch.kind==='event'?'[이벤트] ':''}${stageCode(s.id)} ${s.title}`])));return opt(o,cur||'');}
function openEpEdit(cid,eid){
  const c=charById(cid); const e=eid?c.episodes.find(x=>x.id===eid):{id:'',lv:[2,4,6,8,10].find(l=>!c.episodes.some(x=>x.lv===l))||10,dup:0,after:'',title:'',script:''};
  openModal(`${head(`${esc(c.name)} 개인 스토리`)}
    <div class="g2"><div><label class="f" for="ep_lv">호감도 조건</label><select class="in" id="ep_lv">${opt([1,2,3,4,5,6,7,8,9,10].map(n=>[n,'Lv.'+n]),e.lv)}</select></div>
    <div><label class="f" for="ep_dup">${T('limit')} 조건</label><select class="in" id="ep_dup">${opt([0,1,2,3,4,5].map(n=>[n,n?n+'단계':'없음']),e.dup||0)}</select></div></div>
    <label class="f" for="ep_after">메인 스토리 조건 (이 스테이지를 깨야 열림)</label><select class="in" id="ep_after">${stageOptions(e.after)}</select>
    <label class="f" for="ep_title">제목</label><input class="in" id="ep_title" value="${esc(e.title)}">
    <label class="f" for="ep_script">대본</label><textarea class="in tall" id="ep_script">${esc(e.script)}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="ep_script">🖼 이미지 넣기</button>
    <p class="muted" style="margin:4px 0 0">이름: 대사 / 이름[표정]: 대사 / [배경: 이름] / [소품: 이름] / [음악: 이름] / [효과음: 이름] / [톡: 이름] ~ [톡 끝] / 선택: A | B 와 1) 2) 분기</p>
    <label class="f" for="ep_hint">AI에게 바라는 내용 (선택)</label><input class="in" id="ep_hint" placeholder="예: 메인 2장 사건 직후, 둘만 남은 옥상">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiep" data-id="${cid}">AI로 대본 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="saveep" data-id="${cid}" data-ep="${e.id}">저장</button>${eid?`<button class="btn ghost" data-act="delep" data-id="${cid}" data-ep="${e.id}">삭제</button>`:''}</div>`);
}
function trigOptions(cur){
  const v=cur?(cur.type==='start'?'start':cur.type+':'+cur.value):'start';
  const o=[['start','계약 직후']];
  for(let i=1;i<=10;i++) o.push(['aff:'+i,`호감도 Lv.${i} 달성`]);
  G.chapters.forEach((ch,ci)=>ch.stages.forEach((s,si)=>o.push(['clear:'+s.id,`${ci+1}-${si+1} ${s.title} 클리어`])));
  return opt(o,v);
}
function openThEdit(cid,tid){
  const c=charById(cid); const t=tid?threadById(tid):{id:'',title:'',trigger:{type:'aff',value:3},needOwn:true,script:''};
  openModal(`${head(`${esc(c.name)} ${esc(T('talk'))}`)}
    <label class="f" for="th_title">제목</label><input class="in" id="th_title" value="${esc(t.title)}">
    <label class="f" for="th_trig">도착 조건</label><select class="in" id="th_trig">${trigOptions(t.trigger)}</select>
    <label class="f" for="th_own">계약 필요 여부</label><select class="in" id="th_own">${opt([['1','계약한 경우에만'],['0','계약 전에도 도착']],t.needOwn===false?'0':'1')}</select>
    <label class="f" for="th_script">대화</label><textarea class="in tall" id="th_script" placeholder="${esc(c.name)}: 메시지&#10;선택: 답장1 | 답장2&#10;1) ${esc(c.name)}: 1번 답장에 대한 반응&#10;[사진: 소품이름]">${esc(t.script)}</textarea>
    <label class="f" for="th_hint">AI에게 바라는 내용 (선택)</label><input class="in" id="th_hint" placeholder="예: 새벽에 잠이 안 온다며 셀카를 보낼지 고민하는 대화">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aithread" data-id="${cid}">AI로 대화 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="saveth" data-id="${cid}" data-th="${t.id}">저장</button>${tid?`<button class="btn ghost" data-act="resetth" data-th="${t.id}">다시 받기</button><button class="btn ghost" data-act="delth" data-id="${cid}" data-th="${t.id}">삭제</button>`:''}</div>`);
}
/* src/main/0170-shell/0370-game-picker.js에서 옮김 */
function showPicker(){
  const pj=PJ();
  $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card"><div class="sw-logo"><i>GACHA GAME MAKER</i><b>어떤 게임을 할까요?</b></div>
    <div class="pk-list">${pj.list.map(x=>`<button class="pk-g ${x.id===pj.active?'on':''}" data-act="pickgame" data-id="${esc(x.id)}"><b>${esc(x.title)}</b><span>${x.id===pj.active?'마지막으로 한 게임':''}</span></button>`).join('')}</div>
    <label style="display:flex;gap:8px;margin-top:12px;font-size:.85rem"><input type="checkbox" id="pk_last"><span>다음부터 묻지 않고 마지막 게임으로 시작</span></label></div></div>`;
  $('#ov').hidden=false;
}
function showStart(){ try{ if(startMode()==='pick'&&PJ().list.length>1&&!sessionStorage.getItem('ggm-picked')){ showPicker(); return; } }catch(e){} if(castNeeded()) showCast(); else if(bootPrepNeeded()) showBootPrep(); else showTitle(); }
function showBootPrep(){
  const all=drawTodo(bootCats().map(x=>x[0])), cnt=k=>all.filter(x=>x.cat===k).length, c=naiCfg();
  if(!BP) BP={cats:new Set(bootCats().filter(x=>x[2]).map(x=>x[0]))};
  $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card">
    <div class="sw-logo"><i>BEFORE THE OPENING</i><b>${esc(G.meta.title)}</b></div>
    <p>오프닝 전에 그림부터 준비할까요? 미리 그려 두면 타이틀, 오프닝, 로비가 처음부터 그림으로 채워져요.</p>
    <label class="f" for="bp_tags">이 게임의 그림체 태그 (비우면 기본 그림체)</label><textarea class="in" id="bp_tags" style="min-height:60px" placeholder="${esc(c.styles[0].tags||STYLE_EX)}">${esc(G.meta.artTags||'')}</textarea>
    <div class="prepcats" style="margin-top:10px">${bootCats().map(([k,l])=>cnt(k)?`<label class="pc"><input type="checkbox" data-bpc="${k}" ${BP.cats.has(k)?'checked':''}><b>${esc(l)}</b><span>${cnt(k)}장</span></label>`:'').join('')}</div>
    <p class="muted" style="margin:8px 0 0">한 장에 10~30초쯤 걸려요.${imgProvider()==='nai'?' Opus 구독이면 기본 크기는 Anlas가 들지 않아요.':''} 그리는 도중에도 언제든 시작할 수 있어요.</p>
    <div class="sw-btns bp-btns"><button class="btn" data-act="bpgo">그리고 시작</button><button class="btn ghost" data-act="bpbg">게임하면서 그리기</button></div>
    <button class="linkb" data-act="bpskip" style="margin-top:10px">그림 없이 시작</button>
  </div></div>`;
  $('#ov').hidden=false;
}
function bootPrepRun(cats){
  $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card">
    <div class="sw-logo"><i>DRAWING</i><b>그림 준비 중</b></div>
    <div class="bp-prev" id="bp_prev"><span>첫 그림을 그리는 중…</span></div>
    <div class="bp-bar"><i id="bp_bar"></i></div><p class="muted" id="bp_lb" style="margin:6px 0 0">준비 중</p>
    <div class="sw-btns"><button class="btn ghost" data-act="bpleave">나머지는 게임하면서 그리기</button></div></div></div>`;
  const upd=(it,j,ph)=>{ const pv=$('#bp_prev'); if(!pv) return; $('#bp_bar').style.width=(j.total?j.done/j.total*100:0)+'%';
    $('#bp_lb').textContent=`${j.done}/${j.total} · ${ph==='done'?'완성: ':'그리는 중: '}${it.label}`;
    if(ph==='done'){ const s=imgSrc(it.o); if(s) pv.innerHTML=`<img src="${esc(s)}" alt="">`; } };
  runPrep(cats,null,{fg:true,order:bootCats().map(x=>x[0]),step:upd,done:()=>{ if($('#bp_prev')) setTimeout(showTitle,700); }});
}
/* src/main/0170-shell/0410-desktop.js에서 옮김 */
function applyDesk(){ const W=window.innerWidth, H=window.innerHeight, land=W>H*1.15, wantW=deskMode()==='wide', small=Math.min(W,H)<600;
  // 휴대폰도 'PC 화면: 가로로 넓게'를 직접 고르면 가로로 돌렸을 때 PC 화면으로 보여요
  let picked=''; try{ picked=appStorage.getItem('ggm-desk')||''; }catch(e){}
  const on=deskMode()!=='off'&&(W>=900||(picked==='wide'&&land&&W>=600)); document.body.classList.toggle('desk',on); document.body.classList.toggle('wide',on&&wantW&&land);
  let rh=$('#rotHint'); const needRot=picked==='wide'&&small&&!land&&orientPref()!=='portrait';
  if(needRot&&!rh){ rh=document.createElement('div'); rh.id='rotHint'; rh.innerHTML='📱↻ PC 화면으로 보려면 휴대폰을 가로로 돌려 주세요 <button type="button" onclick="this.parentNode.remove()">닫기</button>'; document.body.appendChild(rh); } else if(!needRot&&rh) rh.remove();
  let side=$('#deskSide'); if(!on){ if(side) side.remove(); return; }
  if(!side){ side=document.createElement('aside'); side.id='deskSide'; document.body.appendChild(side); }
  side.innerHTML=`<div class="ds-logo"><i>GACHA GAME MAKER</i><b>${esc(G.meta.title)}</b><span>${esc(G.meta.sub||'')}</span></div>
    <div class="ds-keys"><h4>키보드</h4><p><kbd>1</kbd>~<kbd>5</kbd> 아래 메뉴</p><p><kbd>Space</kbd> <kbd>Enter</kbd> 대사 넘기기</p><p><kbd>Esc</kbd> 창 닫기</p><p><kbd>A</kbd> 스토리 자동 진행</p></div>
    <p class="ds-foot">설정 → 아이폰·웹 연결에서 PC 화면을 끌 수 있어요.</p>`;
  try{ const l=G.lib.find(x=>x.kind==='bg'&&x.name===P().lobbyBg), s=l&&imgSrc(l); document.body.style.setProperty('--deskbg',s?`url('${s}')`:'none'); }catch(e){}
}
/* 홈 화면에 추가 안내 창 내용(View) */
function a2hsHTML(){ return `${head('홈 화면에 추가해 주세요',`<span class="muted">아이폰은 앱처럼 쓰려면 이 단계가 필요해요</span>`)}
    <ol class="a2hs"><li>Safari 아래쪽(또는 위쪽)의 <b>공유 버튼</b> <span class="kbd">⬆︎</span>을 눌러요.</li><li>목록을 내려서 <b>홈 화면에 추가</b>를 눌러요.</li><li>오른쪽 위 <b>추가</b>를 누르면 홈 화면에 '가챠 메이커' 아이콘이 생겨요.</li><li>앞으로는 그 아이콘으로 열어요. 전체 화면으로 열리고, 저장한 게임도 안전하게 남아요.</li></ol>
    <p class="muted">Safari 탭에서 그냥 쓰면 오래 안 열었을 때 아이폰이 저장 데이터를 지울 수 있어요. 가끔 설정 → 백업으로 내보내 두면 더 안전해요.</p>
    ${pcOrigin()?'<p class="muted"><b>PC 서버로 접속 중이에요.</b> 게임은 PC에 저장되니 홈 화면에 추가하지 않아도 돼요. 바깥 주소(trycloudflare)는 PC 서버를 켤 때마다 바뀌어서, 홈 화면 아이콘은 다음에 안 열릴 수 있어요. 그럴 땐 PC의 QR을 다시 찍으면 PC에 저장된 게임이 그대로 이어져요.</p>':''}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="close">알겠어요</button></div>`; }
function openProxySet(){
  openModal(`${head('중계 서버 (아이폰·웹)')}
    <p class="muted">브라우저는 보안 규칙(CORS) 때문에 일부 AI 서비스에 직접 연결하지 못해요. 그럴 때만 중계 서버를 거쳐요. 직접 연결이 되는 서비스는 그대로 직접 연결해요.</p>
    <label class="f" for="px_url">중계 서버 주소</label><input class="in" id="px_url" value="${esc(webProxy())}" placeholder="https://내-이름.workers.dev">
    <p class="muted" style="margin:6px 0 0">Cloudflare Workers나 Vercel에 무료로 직접 만들 수 있어요. 만드는 법은 배포 페이지 README의 '아이폰' 항목과 proxy 폴더에 있어요(Vercel은 proxy/vercel). 중계 서버를 거치는 요청에는 API 키가 함께 지나가니, 내가 만든 서버나 믿을 수 있는 서버만 넣어 주세요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="pxsave">저장</button><button class="btn ghost" data-act="pxtest">연결 확인</button></div>`); }
