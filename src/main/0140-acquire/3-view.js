/* ===== 0140-acquire — View(HTML·DOM을 만듦) ===== */
/* src/main/0140-acquire/0140-pickup-new.js에서 옮김 */
function openNewPickup(pre){ pre=pre||{};
  openModal(`${head('신규 픽업 만들기',`<span class="muted">새 ${esc(T('crew'))}을(를) 구상하면 픽업 배너로 올라와요. ${esc(T('gacha'))}으로 데려와요.</span>`)}
    <div class="panel" style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px"><span class="muted" style="font-size:.85rem">이미 있는 ${esc(T('crew'))}의 확률을 올리고 싶다면</span><button class="btn sm" data-act="puexist">기존 ${esc(T('crew'))} 픽업</button></div>
    <label class="f" for="pu_kind">종류</label><select class="in" id="pu_kind" onchange="document.getElementById('pu_colw').hidden=this.value!=='collab';document.getElementById('pu_altw').hidden=this.value!=='alt'">${opt([['orig','오리지널 신규 '+T('crew')],['alt','이격 (기존 '+T('crew')+'의 다른 모습)'],['collab','콜라보 (다른 작품 캐릭터가 이 세계에 등장)']],pre.kind||'orig')}</select>
    <div id="pu_altw" ${pre.kind==='alt'?'':'hidden'}><label class="f" for="pu_base">누구의 이격인가요?</label><select class="in" id="pu_base">${G.chars.filter(c=>!c.alt).map(c=>`<option value="${c.id}" ${pre.base===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
      <label class="f" for="pu_canon">스토리 속 위치</label><select class="in" id="pu_canon">${opt([['side','외전 (메인 스토리에 영향 없음 · 예: 갑자기 몸이 바뀐 황당한 소동, 수영복 휴가)'],['canon','정사 (메인 스토리로 이어짐 · 예: 과거를 극복하고 각성한 모습)']],pre.canon?'canon':'side')}</select>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">외전 이격은 이벤트 스토리에만 나오고, 메인 스토리에서는 원래 모습으로 나와요. 정사 이격은 그 뒤 메인 스토리에서 이 모습으로 나와요. 같은 사람의 다른 모습(수영복, 정장, 각성, 과거 등)이에요. 별도의 ${esc(T('crew'))}로 뽑을 수 있고, 속성·역할·스킬이 달라요. 아래 칸에 테마를 적어 주세요.</p></div>
    <div id="pu_colw" hidden><div class="g2"><div><label class="f" for="pu_src">작품 이름</label><input class="in" id="pu_src" placeholder="예: 작품 이름"></div><div><label class="f" for="pu_who">캐릭터 이름 (비우면 AI가 고르기)</label><input class="in" id="pu_who" placeholder="예: 캐릭터 이름"></div></div>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">원작의 성인 캐릭터만 나와요. 원작에서 미성년자·학생인 캐릭터는 만들지 않아요. 개인 감상용으로만 써 주세요.</p></div>
    <label class="f" for="pu_c">어떤 ${esc(T('crew'))}인가요? (설정, 성격, 외모, 무기 등 자유롭게) <span class="muted" style="font-size:.78rem">콜라보는 비워도 돼요</span></label><textarea class="in" id="pu_c" style="min-height:110px" placeholder="예: 몰락한 기사단의 마지막 단장. 말수가 적고 단 것을 좋아한다. 은발, 검은 갑옷, 대검."></textarea>
    <div class="g2"><div><label class="f" for="pu_r">희귀도</label><select class="in" id="pu_r">${opt([['3','SSR'],['2','SR'],['1','R'],['ai','AI가 정하기']],'3')}</select></div><div><label class="f" for="pu_lim">배너</label><select class="in" id="pu_lim">${opt([['pickup','픽업 (상시 풀에도 들어감)'],['limited','한정 (이 배너에서만)']],'pickup')}</select></div></div>
    <div class="g2"><div><label class="f" for="pu_ex">함께 픽업</label><select class="in" id="pu_ex" onchange="const n=+this.value;document.querySelectorAll('.pu-exr').forEach((r,i)=>r.hidden=i>=n);document.getElementById('pu_splitw').hidden=!n">${opt([['0','없음 (1명)'],['1','+1명 (2명 픽업)'],['2','+2명 (3명 픽업)']],'0')}</select></div>
      <div id="pu_splitw" hidden><label class="f" for="pu_split">배너 나누기</label><select class="in" id="pu_split">${opt([['same','한 배너에 함께 (예: SSR + SR 2명)'],['split','각자 배너 (예: SSR 1차 · SSR 2차 픽업)']],'same')}</select></div></div>
    ${[1,2].map(i=>`<div class="pu-exr g2" hidden><div><label class="f" for="pu_exr${i}">함께 ${i} 희귀도</label><select class="in" id="pu_exr${i}">${opt([['2','SR'],['3','SSR'],['1','R']],'2')}</select></div><div><label class="f" for="pu_exc${i}">함께 ${i} 설정 (비우면 AI가 어울리게)</label><input class="in" id="pu_exc${i}" placeholder="예: 주인공의 부관, 쌍검을 쓰는 쾌활한 사람"></div></div>`).join('')}
    ${SAMPLE?`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pu_story" checked><span>픽업 스토리도 같이 만들기 <span class="muted" style="font-size:.8rem">(이 ${esc(T('crew'))}이(가) 주인공인 짧은 이벤트 3화 · 몇 분 걸려요)</span></span></label>`:''}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="newpu-ai" ${SAMPLE?'':'disabled'}>AI로 구상해서 올리기</button><button class="btn ghost" data-act="newpu-hand">직접 설정 입력</button></div>
    ${SAMPLE?'':'<p class="muted">AI로 구상하려면 설정 → 글 AI를 먼저 등록해 주세요.</p>'}`);
}
/* src/main/0140-acquire/0150-pickup-existing.js에서 옮김 */
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
/* 캐릭터만 추가(픽업 배너 없이): 상시 뽑기에 넣거나 바로 내 ${'캐릭터'}로 */
function openAddChar(){ openModal(`${head(T('crew')+' 추가',`<span class="muted">픽업 배너 없이 캐릭터만 만들어요</span>`)}
    <label class="f" for="ac_c">어떤 ${esc(T('crew'))}인가요?</label><textarea class="in" id="ac_c" placeholder="예: 과묵한 정비공, 은발 단발, 렌치를 무기로 씀"></textarea>
    <div class="g2"><div><label class="f" for="ac_r">등급</label><select class="in" id="ac_r">${opt([['1','R'],['2','SR'],['3','SSR'],['ai','AI가 정하기']],'2')}</select></div>
    <div><label class="f" for="ac_how">얻는 방법</label><select class="in" id="ac_how">${opt([['std','상시 뽑기에 추가'],['own','바로 내 '+T('crew')+'로']],'std')}</select></div></div>
    <div class="row" style="margin-top:12px">${SAMPLE?`<button class="btn" data-act="addchar-ai">AI로 만들기</button>`:''}<button class="btn ghost" data-act="addchar-hand">직접 만들기</button></div>`); }
/* src/main/0140-acquire/0180-ui-scroll.js에서 옮김 */
function contractHTML0(){
  const s=P().settings, bs=G.banners.filter(bnOpen), bn=curBanner();
  if(!bn) return pageHead(T('gacha'),'RECRUIT')+`<div class="panel"><p>열린 배너가 없어요.</p><button class="btn" data-act="bnew">배너 만들기</button></div>`;
  const pity=pityGet(bn), left=s.pity-pity, pool=bannerPool(bn);
  const ups=(bn.pickup||[]).map(charById).filter(Boolean), show=(ups.length?ups:pool.filter(c=>c.rarity===3)).slice(0,4);
  const hero=show[0], hill=hero&&P().lobbyMode!=='stand'&&charIllust(hero);
  const rOf=r=>r===3?s.ssr:r===2?s.sr:Math.max(0,100-s.ssr-s.sr);
  const BIG={std:'STAN<br>DARD',pickup:'PICK<span>✦</span>UP',pool:'SQUAD<br>UP',event:'EVENT<br>LIMITED'};
  const KR={std:'상시 모집',pickup:'신규 '+T('crew')+' 등장!',pool:'소속 모집',event:'기간 한정!'};
  const rows=[3,2,1].map(r=>{const n=pool.filter(c=>c.rarity===r).length;return `<tr><td><span class="badge r${r}c">${RL[r]}</span> ${n}명</td><td style="text-align:right">${rOf(r)}%</td></tr>`;}).join('');
  return `<div class="bsel" style="margin-top:6px">${bs.map(x=>`<button class="${x.id===bn.id?'on':''}" data-act="bsel" data-id="${x.id}">${esc(x.name)}${x.until&&x.until>Date.now()?` <small class="b-dd">D-${Math.max(0,Math.ceil((x.until-Date.now())/864e5))}</small>`:''}</button>`).join('')}<button data-act="newpu" title="신규 픽업 만들기">✦ 신규</button><button data-act="puexist" title="기존 ${esc(T('crew'))} 픽업">★ 픽업</button><button data-act="bnew" title="배너 직접 만들기">＋</button></div>
  ${(bn.storyFail||(bn.type==='pickup'&&(bn.newAt||bn.pin)))&&!bn.eventId&&!PUBUSY.has(bn.id)&&(bn.pickup||[])[0]&&SAMPLE?`<div class="panel" style="margin:6px 0;display:flex;gap:8px;align-items:center;justify-content:space-between"><span class="muted" style="font-size:.85rem">${bn.storyFail?'이 배너의 픽업 스토리를 만들다 멈췄어요.':'이 배너에는 아직 픽업 스토리가 없어요.'}</span><button class="btn sm" data-act="pustoryretry" data-id="${esc(bn.pickup[0])}" data-b="${esc(bn.id)}">${bn.storyFail?'이어서 만들기':'픽업 스토리 만들기'}</button></div>`:''}
  <section class="pk-hero ${esc(bn.type||'')} ${window.__BSLIDE||''}" data-swipe="banner">${bs.length>1?`<button class="pk-nav l" data-act="bswipe" data-d="-1" aria-label="이전 배너">‹</button><button class="pk-nav r" data-act="bswipe" data-d="1" aria-label="다음 배너">›</button><div class="pk-dots">${bs.map(x=>`<i class="${x.id===bn.id?'on':''}"></i>`).join('')}</div>`:''}
    <div class="pk-bg" style="${bn.bg?bgStyle(bn.bg):bgStyle(P().gachaBg||'낙성 분화구')}"></div>
    ${hero&&(hill||imgSrc(hero))?`<div class="pk-ghost">${hill?`<img src="${esc(hill)}" alt="">`:art(hero)}</div>`:''}
    <div class="pk-diag"></div>
    <div class="pk-art ${hill?'ill':''}">${hill?`<img src="${esc(hill)}" alt="${esc(hero.name)}" draggable="false">`:hero?art(hero):''}</div>
    ${show.length>1?`<div class="pk-subs">${show.slice(1).map(c=>`<button class="s" data-act="char" data-id="${c.id}" aria-label="${esc(c.name)}">${art(c)}</button>`).join('')}</div>`:''}
    <div class="pk-title">
      <div class="pk-logo">${esc(G.meta.title)}<small>${esc(G.meta.sub)}</small></div>
      <h1 class="pk-big">${BIG[bn.type]||'PICK<span>✦</span>UP'}</h1>
      <div class="pk-rec">RECRUITMENT</div>
      <div class="pk-kr">${esc(bn.name||KR[bn.type]||'')}</div>
      ${bn.desc?`<p>${esc(bn.desc)}</p>`:''}
    </div>
    ${hero?`<button class="pk-name" data-act="char" data-id="${hero.id}"><span class="cs-rar r${hero.rarity}">${RL[hero.rarity]}</span><b>${esc(hero.name)}</b><i>${esc((hero.faction||ROLE_EN[hero.role]||'').toUpperCase())}</i></button>`:''}
  </section>
  <div class="panel pk-pity"><div style="display:flex;justify-content:space-between"><span>SSR 확정까지</span><b>${left}회</b></div><div class="bar" style="margin-top:6px"><i style="width:${pity/s.pity*100}%"></i></div>
    ${pity>=Math.floor(s.pity*0.75)?`<p class="soft">🔥 확률 상승 중 · 지금 SSR ${softRate(s,pity+1).toFixed(1)}%</p>`:`<p class="muted" style="margin:6px 0 0;font-size:.75rem">${Math.floor(s.pity*0.75)}회부터 SSR 확률이 점점 올라가요</p>`}
    ${ups.length&&guarGet(bn)?`<p class="soft gold">★ 다음 SSR은 확률 업 ${esc(T('crew'))} 확정</p>`:''}${pityKey(bn)==='pickup'?`<p class="muted" style="margin:4px 0 0;font-size:.72rem">천장·확정은 다음 픽업 배너로 이어져요</p>`:''}
    <div class="sparkrow"><span>모집 포인트</span><div class="bar"><i style="width:${Math.min(100,((P().spark||{})[bn.id]||0)/SPARK*100)}%"></i></div><b>${(P().spark||{})[bn.id]||0}/${SPARK}</b><button class="btn sm ${((P().spark||{})[bn.id]||0)>=SPARK?'':'ghost'}" data-act="sparkopen" data-id="${bn.id}">교환</button></div>${P().firstTen?'<p class="muted" style="margin:8px 0 0">첫 10회는 SSR 1명 확정</p>':''}${ups.length?`<p class="muted" style="margin:8px 0 0">확률 업: ${ups.map(c=>esc(c.name)).join(', ')} · 같은 등급이 나오면 ${bn.rate}% 확률</p>`:''}</div>
  <div class="pullrow"><button class="btn ghost" data-act="pull" data-n="1">1회<small>◆ ${COST}</small></button><button class="btn" data-act="pull" data-n="10">10회<small>◆ ${nf(COST*10)}${pool.some(c=>c.rarity>=2)?' · SR 이상 1명 보장':''}</small></button></div>
  <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="go" data-to="cash">◆ ${esc(T('currency'))} 충전</button></div>

  <div class="panel"><h3>확률 정보</h3><table style="width:100%;font-size:.9rem">${rows}</table>
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">· ${Math.floor(s.pity*0.75)}회부터 SSR 확률이 조금씩 올라가고 ${s.pity}회째에 확정이에요.${ups.length?`<br>· SSR이 확률 업 ${esc(T('crew'))}이(가) 아니었으면 다음 SSR은 확률 업 확정이에요.`:''}<br>· 1회마다 모집 포인트 1, ${SPARK}포인트로 원하는 ${esc(T('crew'))} 교환.</p>
    <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="bedit" data-id="${bn.id}">배너 편집</button><button class="btn sm ghost" data-act="ghist">${esc(T('gacha'))} 기록</button></div></div>`;
}
/* src/main/0140-acquire/0500-gacha.js에서 옮김 */
function sealSVG(){
  let ticks=''; for(let i=0;i<36;i++){const a=i*10*Math.PI/180;ticks+=`<line x1="${(Math.cos(a)*86).toFixed(1)}" y1="${(Math.sin(a)*86).toFixed(1)}" x2="${(Math.cos(a)*(i%3?90:94)).toFixed(1)}" y2="${(Math.sin(a)*(i%3?90:94)).toFixed(1)}"/>`;}
  return `<svg viewBox="-100 -100 200 200" aria-hidden="true"><g fill="none" stroke="#e9b949" stroke-opacity=".85"><circle r="95" stroke-width="1.4"/><circle r="82" stroke-width=".7" stroke-dasharray="2 4"/>${ticks}<circle r="58" stroke-width="1.2"/><path d="M0,-80 L18,-25 L76,-25 L29,9 L47,64 L0,30 L-47,64 L-29,9 L-76,-25 L-18,-25Z" stroke-width="1"/><circle r="24" stroke-width="2"/><circle r="12" stroke-width=".8"/></g></svg>`;
}
function openSpark(bid){
  const b=G.banners.find(bn=>bn.id===bid)||curBanner(); if(!b) return; const p=P(), pts=(p.spark||{})[b.id]||0;
  const ups=(b.pickup||[]).map(charById).filter(c=>c&&castOk(c)), list=ups.length?ups:bannerPool(b).filter(c=>c.rarity===3&&castOk(c)); // 모집 포인트 교환도 잠긴 캐릭터는 빼요
  openModal(`${head('모집 포인트 교환',`<span class="muted">${esc(b.name)} · ${pts}/${SPARK}</span>`)}
    <p class="muted" style="margin:0 0 10px">이 배너에서 1회 뽑을 때마다 1포인트가 쌓여요. ${SPARK}포인트로 원하는 ${esc(T('crew'))}을(를) 바로 데려올 수 있어요. 이미 있으면 ${esc(T('limit'))} +1이 돼요.</p>
    <div class="spk">${list.map(c=>`<button class="spk-c r${c.rarity}" data-act="sparkgo" data-id="${c.id}" data-b="${b.id}" ${pts>=SPARK?'':'disabled'}><div class="sa">${art(c)}</div><b>${esc(c.name)}</b><span>${own(c.id)?T('limit')+' '+own(c.id).dup+'/5':'미보유'}</span></button>`).join('')||'<p class="muted">교환할 수 있는 '+esc(T('crew'))+'이(가) 없어요.</p>'}</div>`);
}
function openHistory(){
  const h=(P().hist2||[]); const cnt=[3,2,1].map(r=>h.filter(x=>(charById(x.id)||{}).rarity===r).length);
  openModal(`${head(T('gacha')+' 기록',`<span class="muted">최근 ${h.length}회 · SSR ${cnt[0]} · SR ${cnt[1]} · R ${cnt[2]}</span>`)}
    <div class="ghist">${h.map(x=>{const c=charById(x.id); if(!c) return ''; const d=new Date(x.at); return `<div class="gh r${c.rarity}"><span class="badge r${c.rarity}c">${RL[c.rarity]}</span><b>${esc(c.name)}${x.n?'<em>NEW</em>':''}</b><span class="muted">${esc(x.b||'')}</span><small>${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</small></div>`;}).join('')||'<p class="muted">아직 기록이 없어요.</p>'}</div>`);
}
function playGacha0(res){
  const top=Math.max(...res.map(x=>x.c.rarity)), fake=top===3&&Math.random()<0.5;
  GC={res,timers:[],open:new Set(),skip:false,cutCb:null,auto:false};
  const cb=curBanner(), bgn=(cb&&cb.bg)||P().gachaBg;
  const bg=bgn?bgStyle(bgn):'background:radial-gradient(circle at 50% 40%,#3a1d3f,#05030b 70%)';
  $('#ov').innerHTML=`<div class="gc" id="gc"><div class="gc-sky" style="${bg}"></div>${shootHTML(6)}
    <div class="gc-seal" id="gcSeal">${sealSVG()}</div>
    <div class="gc-streak" id="gcStreak" style="--sc:${fake?RCOL[2]:RCOL[top]}"><i class="tail"></i><i class="core"></i></div>
    <div class="gc-flash" id="gcFlash"></div>
    <button class="skipb" data-act="gcskip">건너뛰기</button>
    <div class="gc-stage" id="gcStage" hidden><div class="pgrid n${res.length}">${res.map((x,i)=>`<button class="pc r${x.c.rarity}" data-act="flip" data-i="${i}" style="--d:${i*60}ms" aria-label="카드 열기"><div class="pin"><div class="pb">◆</div><div class="pf">${x.isNew?'<span class="tag">NEW</span>':`<span class="tag d">+${x.refund}</span>`}${art(x.c)}<div class="lbl"><span class="badge r${x.c.rarity}c" style="background:rgba(0,0,0,.45)">${RL[x.c.rarity]}</span><br>${esc(x.c.name)}</div></div></div></button>`).join('')}</div>
    <div class="row" style="width:100%;max-width:400px"><button class="btn ghost" data-act="flipall">모두 열기</button><button class="btn" data-act="closepull">확인</button></div></div></div>`;
  $('#ov').hidden=false; bgm(sceneOf().gacha);
  const T=(ms,f)=>GC.timers.push(setTimeout(f,ms));
  sfx('계약진'); T(700,()=>{$('#gcStreak').classList.add('fall');sfx('낙하');});
  if(fake) T(1350,()=>{$('#gcStreak').style.setProperty('--sc',RCOL[3]);$('#gcSeal').classList.add('gold');try{navigator.vibrate&&navigator.vibrate(120);}catch(e){}});
  T(1720,()=>{sfx('섬광');const el=$('#gcFlash');el.style.setProperty('--fc',top===3?'#fff3c4':RCOL[top]);el.classList.add('on');$('#gcSeal').classList.add('go');$('#gcStreak').style.opacity=0;});
  T(1950,()=>{$('#gcStage').hidden=false;$('.gc .skipb').hidden=true;if(res.length===1)T(600,()=>revealCard(0));});
}
function revealCard0(i,cb){
  const el=document.querySelectorAll('.pc')[i]; if(!el||GC.open.has(i)){cb&&cb();return;}
  el.classList.add('open'); GC.open.add(i); sfx('카드');
  const x=GC.res[i];
  if(x.c.rarity===3&&!GC.skip) GC.timers.push(setTimeout(()=>showCut(x.c,cb),500)); else cb&&cb();
}
function showCut0(c,cb){
  GC.cutCb=cb; const d=document.createElement('div'); d.className='cut'; d.dataset.act='cutclose'; d.style.setProperty('--rc',RCOL[c.rarity]);
  d.innerHTML=`<div class="cut-burst"></div><div class="cut-band"></div><div class="cut-art">${art(c)}</div><div class="cut-txt"><div class="cut-r">★★★ ${RL[c.rarity]}</div><div class="cut-name">${esc(c.name)}</div><div class="cut-sub">${c.elem}속성 ${ROLE[c.role]} · ${esc(c.skill.name)}</div>${c.intro?`<div class="cut-line">「${esc(sub(c.intro))}」</div>`:''}</div>`;
  $('#gc').appendChild(d); sfx('SSR'); if(c.voiceId&&c.intro) speak(c,c.intro); try{navigator.vibrate&&navigator.vibrate([80,60,160]);}catch(e){}
}
/* 가챠 연출 건너뛰기(View): 봉인·줄기 연출을 끝내고 카드를 모두 엶 */
function gachaSkipShow(t){ $('#gcSeal').classList.add('go'); $('#gcStreak').style.opacity=0; $('#gcStage').hidden=false; t.hidden=true; document.querySelectorAll('.pc').forEach((c,i)=>{c.classList.add('open');GC.open.add(i);}); }
/* 가챠 컷인 닫기(View) */
function gachaCutHide(el){ el.remove(); }
/* src/main/0140-acquire/0505-construct.js에서 옮김 */
function conResBar(){ const r=progRead('cres'); return `<div class="row" style="gap:6px;flex-wrap:wrap">${CON_RES.map(k=>`<span class="chip">${conResIcon(k)} ${esc(T(k))} <b>${nf(r[k])}</b></span>`).join('')}<span class="chip">${conGem()} <b>${nf(P().gems)}</b></span></div>`; }
function conVariantChoices(input){ return VARIANTS().filter(t=>t.on!==false&&GGMConstruct.matches(t.recipe,input)).map(tpl=>({tpl,bases:conTargets(tpl).filter(b=>{ const v=conVariantOf(b,tpl); return !(v&&own(v.id)); })})); }
function conReadInput(){ const B=progRead('cbuild'), d=B.input||conDefaultInput(); return CON_RES.map((k,i)=>{ const el=$('#con_'+i); return el?+el.value:d[i]; }); }
/* 바리에이션 설계 중 창 내용(View) */
function conDecodeHTML(res){ return `<div class="decode"><div class="dc-ring"></div><div class="dc-ring b"></div><b>${esc(res.base.name)}의 「${esc(res.tpl.name)}」 설계 중…</b><span>새로운 모습을 디자인하고 있어요</span></div>`; }
function conInfoHTML(input){
  const cfg=CON(), t=GGMConstruct.table(input,cfg,conPool()), i=t.info, B=progRead('cbuild'), vs=conVariantChoices(i.input).filter(v=>v.bases.length), pct=v=>(Math.round(v*10)/10)+'%', sg=t.rows.length?null:GGMConstruct.suggest(input,cfg,conPool());
  return `<p style="margin:0 0 6px">총 <b>${nf(i.total)}</b> · 희귀도 캡: SR ${i.open[2]?`<b>개방 ${pct(i.rarity[2])}</b>`:`잠김 <span class="muted">(총 ${nf(cfg.sr.open)}↑)</span>`} · SSR ${i.open[3]?`<b>개방 ${pct(i.rarity[3])}</b>`:`잠김 <span class="muted">(총 ${nf(cfg.ssr.open)}↑)</span>`}</p>
    <div style="font-size:.85rem;margin:0 0 6px">${i.groups.map(g=>`<div style="display:flex;justify-content:space-between;gap:8px;${g.open?'':'opacity:.55'}"><span>${g.open?'🔓':'🔒'} <b>${esc(g.name)}</b> <span class="muted">${esc(conNeedText(g.need))}</span></span><b>${g.open?pct(g.p):'—'}</b></div>`).join('')}</div>
    ${sg&&sg.changed?`<p style="margin:4px 0 6px;color:#ffb347">⚠ ${esc(conEmptyWhy(sg.why))}. <button class="btn sm" data-act="conpreset" data-v="${esc(sg.input.join(','))}">나올 수 있게 맞추기 (${esc(sg.input.join(' / '))})</button></p>`:''}
    ${t.rows.length?`<details><summary class="muted" style="font-size:.82rem">이번 투입의 확률 테이블 (${t.rows.length}명)</summary><div style="font-size:.8rem;columns:2;margin-top:4px">${t.rows.map(r=>{ const c=charById(r.id); return c?`<div>${RL[c.rarity]} ${esc(c.name)} <b>${pct(r.p)}</b></div>`:''; }).join('')}</div></details>`:`<p class="muted" style="margin:0">열린 분류에 나올 ${esc(T('crew'))}이(가) 없어요. 다른 분류를 열어 보세요.</p>`}
    ${i.recipes.length?`<p style="margin:6px 0 0">특수 레시피: ${i.recipes.map(x=>B.found[x.id]?`<b>${esc(x.name)}</b>`:'<b>??? (미발견)</b>').join(', ')}</p>`:''}
    ${vs.length?`<p style="margin:4px 0 0">✦ 바리에이션 기회: ${vs.map(v=>`${esc(v.tpl.name)} ${pct(+v.tpl.chance||0)} (${v.bases.length}명)`).join(', ')}</p>`:''}`; }
function conEntryHTML(){ if(!conOn()) return ''; return `<div class="panel" style="margin-bottom:10px;display:flex;gap:10px;align-items:center;justify-content:space-between"><div><b>${esc(T('construct'))}</b><div class="muted" style="font-size:.8rem">${CON_RES.map(k=>esc(T(k))).join('·')}을(를) 넣어 ${esc(T('crew'))}·바리에이션 영입</div></div><button class="btn sm" data-act="go" data-to="construct">열기</button></div>`; }
function constructHTML(){
  if(!conOn()) return pageHead(T('construct'),'CONSTRUCT','contract')+`<div class="panel"><p>설정 → 게임에서 ${esc(T('construct'))}을(를) 켜 주세요.</p></div>`;
  const cfg=CON(), B=progRead('cbuild'), input=GGMConstruct.normalize(B.input||conDefaultInput(),cfg), found=(cfg.recipes||[]).filter(x=>B.found[x.id]), vfound=VARIANTS().filter(t=>B.found['v:'+t.id]);
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
function conVariantRow(t,i){ const c=t.cond||{}, st=(c.stats||[])[0]||{}, n=conTargets(t);
  return `<details class="panel" data-vi="${i}" style="margin:8px 0"><summary><b>${esc(t.name)}</b> <span class="muted">· ${t.on===false?'꺼짐':'켜짐'} · ${+t.chance||0}% · 적용 ${n.length}명</span></summary>
  <label style="display:flex;gap:8px;margin:8px 0"><input type="checkbox" data-vf="on" ${t.on!==false?'checked':''}> 사용</label>
  <div class="g2"><div><label class="f">이름(기본형)</label><input class="in" data-vf="name" value="${esc(t.name)}"></div><div><label class="f">확률 % (레시피가 맞고 대상이 있을 때)</label><input class="in" type="number" data-vf="chance" min="0" max="100" value="${+t.chance||0}"></div></div>
  <label class="f">의상 기본형 태그 (NovelAI 영어 태그)</label><input class="in" data-vf="prompt" value="${esc(t.prompt||'')}">
  <label class="f">디자인 추가 지시 (AI용, 선택)</label><input class="in" data-vf="brief" value="${esc(t.brief||'')}">
  <label class="f">레시피: 최소 투입 (${CON_RES.map(k=>esc(T(k))).join(' / ')})</label><input class="in" data-vf="recipe" value="${esc((t.recipe&&t.recipe.min||[]).join(','))}">
  <label class="f">등급</label><select class="in" data-vf="rarity">${[['same','원래 캐릭터와 같게'],['1','R'],['2','SR'],['3','SSR']].map(([v,l])=>`<option value="${v}" ${String(t.rarity||'same')===v?'selected':''}>${l}</option>`).join('')}</select>
  <h4 style="margin:10px 0 4px">적용 조건 <span class="muted" style="font-size:.8rem">(비우면 조건 없음 · 보유한 ${esc(T('crew'))} 중 맞는 캐릭터에 자동 적용)</span></h4>
  <div class="g2"><div><label class="f">소속(쉼표)</label><input class="in" data-vf="factions" value="${esc((c.factions||[]).join(','))}" placeholder="${esc(factions().map(f=>f.name).join(','))}"></div>
  <div><label class="f">역할</label><div class="row">${Object.keys(ROLE).map(r=>`<label style="display:flex;gap:4px"><input type="checkbox" data-vrole="${r}" ${(c.roles||[]).includes(r)?'checked':''}>${esc(ROLE[r])}</label>`).join('')}</div></div>
  <div><label class="f">속성(쉼표)</label><input class="in" data-vf="elems" value="${esc((c.elems||[]).join(','))}" placeholder="${esc(ELEMS.join(','))}"></div>
  <div><label class="f">능력치</label><div class="row"><select class="in" data-vf="stk"><option value="">없음</option>${CON_STATS.map(([k,l])=>`<option value="${k}" ${st.k===k?'selected':''}>${l}</option>`).join('')}</select><select class="in" data-vf="stop">${['>=','<=','>','<'].map(o=>`<option ${st.op===o?'selected':''}>${o}</option>`).join('')}</select><input class="in" type="number" data-vf="stv" value="${st.v!=null?+st.v:''}" style="width:80px"></div></div>
  <div><label class="f">최소 레벨 · ${esc(T('limit'))} · 호감도</label><div class="row"><input class="in" type="number" data-vf="lv" value="${c.lv||''}" placeholder="Lv"><input class="in" type="number" data-vf="dup" value="${c.dup||''}" placeholder="${esc(T('limit'))}"><input class="in" type="number" data-vf="aff" value="${c.aff||''}" placeholder="호감도"></div></div>
  <div><label class="f">업적: 클리어한 스테이지 id(쉼표)</label><input class="in" data-vf="cleared" value="${esc((c.cleared||[]).join(','))}" placeholder="s11,s12"></div></div>
  <p class="muted" style="margin:8px 0 0;font-size:.8rem">지금 적용 대상: ${n.map(b=>esc(b.name)).join(', ')||'없음'}${n[0]?`<br>예시 이미지 프롬프트(${esc(n[0].name)}): <code style="overflow-wrap:anywhere">${esc(GGMConstruct.variantPrompt(n[0],t))}</code>`:''}</p>
  <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="convdel" data-i="${i}">이 바리에이션 삭제</button></div></details>`; }
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
