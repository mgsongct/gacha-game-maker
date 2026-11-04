/* ===== 성장 곡선 (2026.10.07.17) ===== */
// 10장까지는 직선, 그 뒤로는 레벨 상한이 오르는 만큼만 (조금 덜) 강해져요
function enemyTarget(k,i,boss){ const CK=9; let base; if(k<=CK) base=645*(1+0.55*k); else { const L=70+5*(k-CK); base=645*(1+0.55*CK)*((1+0.06*(L-1))/(1+0.06*69))*Math.pow(0.99,k-CK); } return base*(1+0.08*i)*(boss?1.8:1); }
function capExtra(){ try{ return 5*Math.max(0,Math.floor(progK())-9); }catch(e){ return 0; } }
function fitEnemy(e,target){ if(!e||e.manual) return e; e.hp=+e.hp||800; e.atk=+e.atk||70; e.def=+e.def||0; e.spd=+e.spd||90; const p=e.hp/5+e.atk*3+e.def*2; const want=Math.max(50,target-e.spd); if(p<=0) return e; const f=want/p;
  e.hp=Math.max(100,Math.round(e.hp*f)); e.atk=Math.max(10,Math.round(e.atk*f)); e.def=Math.max(0,Math.round(e.def*f)); return e; }
function rebalanceChapter(ch,k){ (ch.stages||[]).forEach((s,i)=>{ const last=i===ch.stages.length-1; (s.enemies||[]).forEach(e=>fitEnemy(e,enemyTarget(k,i,e.boss||(last&&s.enemies.length===1)))); }); }

function effPower(ids,enemies){ const fb=factionBonus(ids), n=Math.max(1,enemies.length);
  return ids.map(charById).filter(Boolean).reduce((a,c)=>{ const m=matchup(c,enemies); return a+Math.round(charPower(c)*(1+(fb[c.faction]||0)/100)*(1+0.25*(m.good-m.bad)/n)); },0); }
function matchup(c,enemies){let good=0,bad=0;enemies.forEach(en=>{if(BEATS[c.elem]===en.elem)good++;else if(BEATS[en.elem]===c.elem)bad++;});return {good,bad};}
let FORM=null;
async function openFormation(stage,ctx,startAct){
  try{await v2PrepareStage(stage,ctx);}catch(e){toast(e.message);return;}
  FORM=FORM&&FORM.key===(stage.id||stage.title)?FORM:{key:stage.id||stage.title,stage,ctx,startAct,filter:'all',sort:'power'};
  FORM.stage=stage; FORM.ctx=ctx; FORM.startAct=startAct;
  const busy=busyIds(), owned=G.chars.filter(c=>own(c.id)&&(!ctx.allow||ctx.allow(c)));
  if(!squadSel) squadSel=P().squad.filter(id=>own(id)&&charById(id)&&!busy.has(id)&&(!ctx.allow||ctx.allow(charById(id)))).slice(0,4);
  const en=stage.enemies, need=stagePower(stage), tp0=teamPower(squadSel), tp=effPower(squadSel,en), ratio=need?tp/need:1, fb=factionBonus(squadSel);
  const elemCount={}; en.forEach(e=>{elemCount[e.elem]=(elemCount[e.elem]||0)+1;});
  let list=owned.filter(c=>FORM.filter==='all'||c.elem===FORM.filter||c.role===FORM.filter);
  list.sort((a,b)=>FORM.sort==='lv'?own(b.id).lv-own(a.id).lv:FORM.sort==='match'?(matchup(b,en).good-matchup(b,en).bad)-(matchup(a,en).good-matchup(a,en).bad)||charPower(b)-charPower(a):charPower(b)-charPower(a));
  const slot=i=>{const c=charById(squadSel[i]); if(!c) return `<button class="fslot empty" data-act="fsl" data-i="${i}"><span>+</span><i>${i<2?'전열':'후열'}</i></button>`;
    const m=matchup(c,en), o=own(c.id), rw=rowWarn(c,i,squadSel.length);
    return `<button class="fslot r${c.rarity} ${rw?'rowbad':''}" title="${esc(rw)}" data-act="fpick" data-id="${c.id}" style="--ec:${ECOL[c.elem]}"><div class="fs-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${formOn()?`<em class="rgi" title="${RANGE[charRange(c)]}">${RANGE_ICO[charRange(c)]}</em>`:''}${rw?`<em class="rww">${esc(rw)}</em>`:''}${m.good>m.bad?'<em class="adv">유리</em>':m.bad>m.good?'<em class="dis">불리</em>':''}<div class="fs-t"><b>${esc(c.name)}</b><span>Lv.${o.lv} · ${esc(ROLE[c.role])}</span><span class="pw">${nf(charPower(c))}</span></div></button>`;};
  const head2=FORM.ctx.kind==='tower'?`<span class="muted">첫 돌파 보상: ${rewardText(towerReward(FORM.ctx.floor))}</span>`:FORM.ctx.kind==='raid'?`<span class="muted">이번 주 누적 피해로 보상을 받아요 · 오늘 ${raidTriesLeft()}/3</span>`:FORM.ctx.kind==='rogue'?`<span class="muted">이 4명으로 끝까지 가요. 체력은 이어져요.</span>`:FORM.ctx.kind==='farm'?`<span class="muted">보상: ${rewardText(farmReward(stage.farm.key,stage.farm.lv))}</span>`:FORM.ctx.kind==='event'?`<span class="muted">이벤트 스테이지</span>`:`<span class="muted">보상 ◆${nf(stage.reward)}${P().cleared[stage.id]?'':' (첫 클리어 2배)'}</span>`;
  openModal(`${head(esc(FORM.ctx.code?FORM.ctx.code+' ':'')+esc(stage.title),head2)}
    <div class="fenemy">${en.map(e=>`<div class="fe ${e.boss?'boss':''}" style="--ec:${ECOL[e.elem]}"><div class="fe-art">${enemyArt(e)}</div><span class="el" style="--ec:${ECOL[e.elem]}">${esc(e.elem)}</span><b>${esc(e.name)}</b><span>${e.boss?'BOSS · ':''}${nf(e.hp)}</span></div>`).join('')}</div>
    ${stage.enemies.length&&!stage.story?rulesHTML(stage):''}
    ${en.filter(e=>e.boss).map(e=>`<p class="boss-pat"><b>보스 패턴</b> ${esc(e.name)}: ${esc(bossPatText(e,FORM.ctx.kind==='raid'))}</p>`).join('')}
    <p class="muted" style="margin:6px 0 0">적 속성: ${Object.entries(elemCount).map(([k,v])=>`${esc(k)}×${v}`).join(' ')} → ${Object.keys(elemCount).map(k=>{const w=ELEMS.find(elem=>BEATS[elem]===k);return w?`<b style="color:${ECOL[w]}">${esc(w)}</b> 유리`:'';}).filter(Boolean).join(', ')}</p>
    <div class="fpower"><div><i>편성 능력치 <small style="opacity:.7">상성 반영</small></i><b class="${ratio>=1?'ok':ratio>=0.8?'warn':'bad'}">${nf(tp)}</b>${tp!==tp0?`<small class="muted" style="display:block;font-size:.7rem">기본 ${nf(tp0)}</small>`:''}</div><div><i>적 능력치 (참고)</i><b>${nf(need)}</b></div><div class="fbar"><span style="width:${Math.min(100,ratio*100)}%" class="${ratio>=1?'ok':ratio>=0.8?'warn':'bad'}"></span></div></div>
    <div class="frow"><i>전열</i><i>후열</i></div><div class="fslots">${[0,1,2,3].map(slot).join('')}</div>
    <p class="muted" style="margin:4px 0 0">${formOn()?esc(formHelp()):'전열은 적의 공격을 두 배로 더 받아요. 방어형은 어디에 있든 공격을 끌어요.'}</p>
    ${Object.keys(fb).length?`<p class="fbonus">${Object.entries(fb).map(([f,v])=>`${esc(f)} 소속 보너스 공격 +${v}%`).join(' · ')}</p>`:`<p class="muted" style="margin:6px 0 0">같은 소속 2명 이상이면 공격 보너스 (2명 5%, 3명 10%, 4명 15%)</p>`}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="fauto">자동 편성</button><button class="btn sm ghost" data-act="fclear">비우기</button>${[0,1,2].map(i=>{const pr=(P().presets||[])[i];return `<button class="btn sm ghost" data-act="fpre" data-i="${i}">${pr&&pr.length?'편성 '+(i+1):'빈 '+(i+1)}</button>`;}).join('')}<button class="btn sm ghost" data-act="fsave">현재 편성 저장</button></div>
    <div class="ftools"><div class="chips">${[['all','전체'],...ELEMS.map(elem=>[elem,elem]),...Object.entries(ROLE)].map(([v,l])=>`<button class="chip ${FORM.filter===v?'on':''}" data-act="ffil" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>
      <select class="in" id="fsort" style="max-width:120px">${opt([['power','전투력순'],['lv','레벨순'],['match','상성순']],FORM.sort)}</select></div>
    <div class="froster">${list.map(c=>{const on=squadSel.includes(c.id),b=busy.has(c.id),m=matchup(c,en);return `<button class="fr r${c.rarity} ${on?'on':''} ${b?'busy':''}" data-act="fpick" data-id="${c.id}" ${b?'disabled':''} style="--ec:${ECOL[c.elem]}"><div class="fr-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${b?'<em class="busy">파견</em>':m.good>m.bad?'<em class="adv">유리</em>':m.bad>m.good?'<em class="dis">불리</em>':''}${on?`<em class="num">${squadSel.indexOf(c.id)+1}</em>`:''}<b>${esc(c.name)}</b><span>Lv.${own(c.id).lv} · ${nf(charPower(c))}</span></button>`;}).join('')||'<p class="muted">보유한 '+T('crew')+'이(가) 없어요.</p>'}</div>
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="${startAct}" ${FORM.ctx.extra||''} ${squadSel.length?'':'disabled'}>출격 (${squadSel.length}/4)</button></div>
    ${FORM.ctx.storyBtns||''}`,false,'','formation:'+FORM.key+':'+FORM.ctx.kind);
}
function refreshForm(){ if(FORM) openFormation(FORM.stage,FORM.ctx,FORM.startAct); }
function autoSquad(stage){
  const busy=busyIds(), en=stage.enemies, pool=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)&&(!(FORM&&FORM.ctx&&FORM.ctx.allow)||FORM.ctx.allow(c)));
  const score=c=>{const m=matchup(c,en);return charPower(c)*(1+0.25*m.good-0.2*m.bad);};
  pool.sort((a,b)=>score(b)-score(a));
  const pick=[]; const need=['def','sup'];
  need.forEach(r=>{const c=pool.find(x=>x.role===r&&!pick.includes(x.id)); if(c&&score(c)>=score(pool[Math.min(pool.length-1,5)])*0.7) pick.push(c.id);});
  pool.forEach(c=>{if(pick.length<4&&!pick.includes(c.id))pick.push(c.id);});
  const order={def:0,atk:1,sup:2}; return pick.slice(0,4).sort((a,b)=>order[charById(a).role]-order[charById(b).role]);
}
function openStage(chId,stId){
  const ch=G.chapters.find(x=>x.id===chId),s=ch.stages.find(x=>x.id===stId), cl=!!P().cleared[s.id];
  const code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id);
  const storyBtns=`<div class="row" style="margin-top:8px">${s.pre?`<button class="btn sm ghost" data-act="story" data-ch="${chId}" data-st="${stId}" data-k="pre">전투 전 이야기</button>`:''}${cl&&s.post?`<button class="btn sm ghost" data-act="story" data-ch="${chId}" data-st="${stId}" data-k="post">전투 후 이야기</button>`:''}<button class="btn sm ghost" data-act="chedit" data-ch="${chId}">적·스토리 편집</button></div>`;
  openFormation(s,{kind:ch.kind||'main',ch,code,extra:`data-ch="${chId}" data-st="${stId}"`,storyBtns},'sortie');
}
let chDraft=null;
let WTERMS=null;
function openChEdit(){
  const ch=chDraft;
  openModal(`${head('챕터 편집')}
    <label class="f" for="ch_title">챕터 제목</label><input class="in" id="ch_title" value="${esc(ch.title)}">
    ${ch.stages.map((s,j)=>`<div class="stage-edit">
      <div class="g2"><div><label class="f">스테이지 ${j+1} 제목</label><input class="in" id="st_t_${j}" value="${esc(s.title)}"></div><div><label class="f">보상 성석</label><input class="in" type="number" id="st_r_${j}" value="${s.reward}"></div></div>
      <label class="f" style="margin-top:6px"><input type="checkbox" id="st_s_${j}" ${s.story?'checked':''}> 전투 없음 (이야기만 보는 스테이지 · 전투 전 대본만 써요)</label>
      <label class="f">적 (한 줄에 하나: 이름, 속성, 체력, 공격, 방어, 속도, 보스면 끝에 보스)</label><textarea class="in" id="st_e_${j}">${esc(s.enemies.map(en=>[en.name,en.elem,en.hp,en.atk,en.def,en.spd].join(', ')+(en.boss?', 보스':'')).join('\n'))}</textarea>
      <label class="f">전투 전 대본</label><textarea class="in tall" id="st_pre_${j}">${esc(s.pre||'')}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="st_pre_${j}">🖼 이미지 넣기</button>
      <label class="f">전투 후 대본</label><textarea class="in" id="st_post_${j}" style="min-height:160px">${esc(s.post||'')}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="st_post_${j}">🖼 이미지 넣기</button>
      <div class="row" style="margin-top:8px">${SAMPLE?`<button class="btn sm ghost" data-act="stdetail" data-j="${j}">✦ AI로 디테일 보강</button>`:''}<button class="btn sm ghost" data-act="delstage" data-j="${j}">이 스테이지 삭제</button></div></div>`).join('')}
    <div class="row"><button class="btn sm ghost" data-act="addstage">스테이지 추가</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="savech">저장</button><button class="btn ghost" data-act="delch">챕터 삭제</button></div>`);
}
function parseEnemies(t){
  return lines(t).map(l=>{const p=l.split(/[,，]/).map(x=>x.trim());
    return {name:p[0]||'적',elem:ELEMS.includes(p[1])?p[1]:'홍',hp:num(p[2],1,999999,800),atk:num(p[3],1,9999,70),def:num(p[4],0,9999,30),spd:num(p[5],30,300,90),boss:/보스|boss/i.test(p[6]||'')};}).slice(0,6);
}
function readChForm(){
  chDraft.title=$('#ch_title').value.trim()||chDraft.title;
  chDraft.stages.forEach((s,j)=>{s.title=$('#st_t_'+j).value.trim()||s.title;s.reward=num($('#st_r_'+j).value,0,99999,300);
    const en=parseEnemies($('#st_e_'+j).value), old=s.enemies||[]; en.forEach((e,i)=>{ const o=old[i]; e.manual=o&&o.name===e.name&&o.elem===e.elem&&o.hp===e.hp&&o.atk===e.atk&&o.def===e.def&&o.spd===e.spd?!!o.manual:true; if(o&&o.look&&!e.look) e.look=o.look;if(o&&o.pattern)e.pattern=o.pattern;if(o&&o.skills)e.skills=o.skills; }); if(JSON.stringify(en)!==JSON.stringify(old))delete s.combatBalance;s.enemies=en.length?en:s.enemies; s.pre=$('#st_pre_'+j).value; s.post=$('#st_post_'+j).value;
    const sto=$('#st_s_'+j); if(sto){ if(sto.checked){ s.story=true; } else { delete s.story; if(!s.enemies.length) s.enemies=[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}]; } } });
}
function openWorld(){
  const w=G.world;
  openModal(`${head('세계관')}
    <label class="f" for="w_name">이름</label><input class="in" id="w_name" value="${esc(w.name)}">
    <label class="f" for="w_sum">요약</label><textarea class="in" id="w_sum">${esc(w.summary)}</textarea>
    <label class="f" for="w_lore">상세 설정</label><textarea class="in tall" id="w_lore">${esc(w.lore)}</textarea>
    <label class="f" for="w_plot">메인 플롯 (비밀 설정, 복선, 장기 전개. AI가 다음 장을 쓸 때 참고해요)</label><textarea class="in tall" id="w_plot">${esc(w.plot||'')}</textarea>
    <label class="f" for="w_fac">세력 (한 줄에 하나: 이름: 설명)</label><textarea class="in" id="w_fac">${esc(w.factions.map(f=>f.name+': '+f.desc).join('\n'))}</textarea>
    <label class="f" for="w_kw">AI로 새로 짜기: 키워드</label><input class="in" id="w_kw" placeholder="예: 사이버펑크 해상도시, 기업 전쟁, 인공 천사">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiworld">AI로 세계관 쓰기</button></div>
    <p class="muted">AI 결과는 입력칸에만 채워져요. 저장을 눌러야 반영돼요.</p>
    <div class="optbox" id="w_terms" hidden><label class="f"><input type="checkbox" id="w_tchk" checked> 용어도 세계관에 맞게 바꾸기</label><span class="muted" style="font-size:.8rem"></span></div>
    <p class="muted" style="margin:8px 0 0">지금 용어: ${esc(T('player'))} · ${esc(T('crew'))} · ${esc(T('talk'))} · ${esc(T('currency'))} · ${esc(T('gacha'))} · ${esc(T('abyss'))} <button class="linkb" data-act="meta-open">용어 직접 바꾸기</button></p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="saveworld">저장</button></div>`);
}
function openOpeningEdit(){
  openModal(`${head('오프닝')}
    <label class="f" for="op_lines">오프닝 영상 문구 (한 줄에 한 장면, 마지막 줄은 크게 표시)</label><textarea class="in" id="op_lines" style="min-height:160px">${esc(G.opening.lines.join('\n'))}</textarea>
    <label class="f" for="op_pro">프롤로그 대본</label><textarea class="in tall" id="op_pro">${esc(G.opening.prologue)}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="op_pro">🖼 이미지 넣기</button>
    <label class="f" for="op_hint">AI에게 바라는 방향 (선택)</label><input class="in" id="op_hint" placeholder="예: 더 어둡고 미스터리하게">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiopening">AI로 오프닝 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="saveopening">저장</button></div>`);
}
function openLib(kind){
  if(kind==='sfx'){
    const items=G.lib.filter(l=>l.kind==='sfx');
    openModal(`${head('효과음',`<span class="muted">${items.filter(l=>l.audio).length}/${items.length}개 등록됨</span>`)}
      ${items.map(l=>`<div class="ep"><span class="t"><b>${esc(l.name)}</b><span class="muted">${l.audio?'등록됨':'미등록'} · ${esc(l.prompt).slice(0,60)}</span></span>${l.audio?`<button class="btn sm ghost" data-act="sfxplay" data-id="${l.id}">▶</button>`:''}<button class="btn sm ghost" data-act="sfxgen" data-id="${l.id}">AI 생성</button><button class="btn sm ghost" data-act="aupload" data-id="${l.id}">파일</button></div>`).join('')}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="sfxall">미등록 전부 AI로 만들기</button></div>
      <p class="muted">ElevenLabs 효과음 생성으로 만들어요. 대본에서는 [효과음: 이름]으로 불러요.</p>`);
    return;
  }
  if(kind==='bgm'){
    const items=G.lib.filter(l=>l.kind==='bgm');
    openModal(`${head('배경음',`<span class="muted">${items.filter(l=>l.audio).length}/${items.length}곡 등록됨</span>`)}
      ${items.map(l=>`<div class="ep"><span class="t"><b>${esc(l.name)}</b><span class="muted">${l.audio?'등록됨':'미등록'}${BGM.name===l.name&&!BGM.el.paused?' · 재생 중':''}</span></span>${l.audio?`<button class="btn sm ghost" data-act="bgmplay" data-id="${l.id}" aria-label="재생">▶</button>`:''}<button class="btn sm ghost" data-act="libitem" data-id="${l.id}">편집</button></div>`).join('')}
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="bgmstop">정지</button><button class="btn" data-act="libnew" data-k="bgm">곡 추가</button><button class="btn" data-act="bgmall">🎵 한꺼번에 작곡</button></div>
      <p class="muted">Suno, Udio 같은 곳에서 만든 곡도 편집 → 파일 올리기로 넣을 수 있어요.</p>`);
    return;
  }
  const items=G.lib.filter(l=>l.kind===kind);
  openModal(`${head(({bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]||kind,`<span class="muted">${items.filter(l=>l.img).length}/${items.length}개 등록됨</span>`)}
    <div class="lgrid" style="margin-top:10px">${items.map(l=>`<button class="lt ${kind}" data-act="libitem" data-id="${l.id}">${imgSrc(l)?`<img class="art" src="${esc(imgSrc(l))}" alt="">`:(kind==='bg'?`<div class="bgfill" style="${bgStyle(l.name)}"></div>`:`<div class="art ph" style="--ec:var(--brass)"><small>미등록</small></div>`)}<span class="lbl">${esc(l.name)}${l.img?'':' · 미등록'}</span></button>`).join('')}</div>
    <div class="row" style="margin-top:12px">${kind==='enemy'?`<button class="btn ghost" data-act="ailooks">빈 외형 AI로 채우기</button><button class="btn ghost" data-act="ailooksall">외형 전부 세계관에 맞게 다시 쓰기</button>`:''}<button class="btn ghost" data-act="naibatch" data-k="${kind}">미등록 전부 NAI로 그리기</button><button class="btn" data-act="libnew" data-k="${kind}">${({bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]} 추가</button></div>`);
}
function openLibItem(id,kind){
  if((id&&libById(id)&&libById(id).kind==='cg')||(!id&&kind==='cg')){
    const l=id?libById(id):{id:'',kind:'cg',name:'',prompt:'',cast:[]}; const cast=l.cast||[];
    openModal(`${head(id?esc(l.name):'새 CG',`<span class="muted">이벤트 CG · 대본에서 [CG: 이름]</span>`)}
      ${id?`<div style="aspect-ratio:16/10;margin:10px 0;position:relative;overflow:hidden;background:var(--panel2)">${imgSrc(l)?`<img style="width:100%;height:100%;object-fit:cover" src="${esc(imgSrc(l))}" alt="">`:'<div class="art ph" style="--ec:var(--brass);height:100%"><small>이미지 미등록</small></div>'}</div>`:''}
      <label class="f" for="li_name">이름</label><input class="in" id="li_name" value="${esc(l.name)}">
      <label class="f" for="li_prompt">장면 프롬프트 (영어, 인물 외모 제외: 장소, 구도, 행동, 분위기)</label><textarea class="in" id="li_prompt" placeholder="rooftop, night, rain, two women sharing an umbrella, from side, cinematic">${esc(l.prompt)}</textarea>
      <h3 class="sec">등장 ${T('crew')} (최대 4명)</h3>
      ${[0,1,2,3].map(i=>{const x=cast[i]||{};return `<div class="g4 cgslot"><div style="grid-column:span 2"><label class="f">${i+1}번</label><select class="in" id="cg_c${i}"><option value="">없음</option>${G.chars.map(c=>`<option value="${c.id}" ${x.id===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div><label class="f">위치</label><select class="in" id="cg_p${i}">${opt(CG_POS_LABEL,x.pos||'auto')}</select></div><div><label class="f">행동 태그</label><input class="in" id="cg_a${i}" value="${esc(x.act||'')}" placeholder="smile, waving"></div></div>`;}).join('')}
      <p class="muted">각 ${T('crew')}의 외모는 그 ${T('crew')}의 NAI 프롬프트에서 가져와서 캐릭터별 프롬프트로 따로 넣어요(V4 이상).</p>
      <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 축제 마지막 밤, 불꽃놀이를 올려다보는 미호와 루나">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="cg">AI로 장면 프롬프트 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="cg">저장</button>${id?`<button class="btn ghost" data-act="naigen" data-k="lib" data-id="${l.id}">NAI로 그리기</button><button class="btn ghost" data-act="upload" data-k="lib" data-id="${l.id}">이미지 올리기</button>${(kind==='enemy'||kind==='prop'||kind==='icon')&&imgSrc(l)?`<button class="btn ghost" data-act="cutopen" data-k="lib" data-id="${l.id}">배경 지우기</button>`:''}${l.img?XBTN('lib',l.id):''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
    return;
  }
  if((id&&libById(id)&&libById(id).kind==='bgm')||(!id&&kind==='bgm')){
    const l=id?libById(id):{id:'',kind:'bgm',name:'',prompt:''};
    openModal(`${head(id?esc(l.name):'새 배경음',`<span class="muted">배경음 · ${l.audio?'등록됨':'미등록'}</span>`)}
      <label class="f" for="li_name">이름 (대본에서 [음악: 이름]으로 불러요)</label><input class="in" id="li_name" value="${esc(l.name)}">
      <label class="f" for="li_prompt">음악 프롬프트 (영어)</label><textarea class="in" id="li_prompt">${esc(l.prompt)}</textarea>
      <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 비 오는 밤 둘만 남은 사무소, 쓸쓸하지만 따뜻하게">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="bgm">AI로 프롬프트 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="bgm">저장</button>${id?`<button class="btn ghost" data-act="elcompose" data-id="${l.id}">AI로 작곡</button><button class="btn ghost" data-act="aupload" data-id="${l.id}">파일 올리기</button>${l.audio?`<button class="btn ghost" data-act="bgmplay" data-id="${l.id}">재생</button>`:''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
    return;
  }
  const l=id?libById(id):{id:'',kind,name:'',prompt:''}; kind=l.kind;
  const KN=({bg:'배경',prop:'소품',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]||kind;
  openModal(`${head(id?esc(l.name):'새 '+KN,`<span class="muted">${KN}${kind==='enemy'?' · 스테이지의 적 이름과 같으면 전투에 나와요':''}</span>`)}${l.alias&&!l.img?`<p class="muted" style="margin:0 0 8px;font-size:.8rem">지금은 「${esc((G.lib.find(x=>x.id===l.alias)||{}).name||'')}」의 그림을 같이 써요. 프롬프트를 적고 저장하면 이 적만 따로 그려요.</p>`:''}
    ${id?`<div style="border-radius:12px;overflow:hidden;aspect-ratio:${kind==='bg'?'16/10':'1'};margin:10px 0;position:relative">${imgSrc(l)?`<img class="art" style="width:100%;height:100%;object-fit:cover" src="${esc(imgSrc(l))}" alt="">`:(kind==='bg'?`<div style="${bgStyle(l.name)};position:absolute;inset:0"></div>`:`<div class="art ph" style="--ec:var(--brass);height:100%"><small>이미지 미등록</small></div>`)}</div>`:''}
    <label class="f" for="li_name">이름 (대본에서 이 이름으로 불러요)</label><input class="in" id="li_name" value="${esc(l.name)}">
    <label class="f" for="li_prompt">NAI 프롬프트</label><textarea class="in" id="li_prompt">${esc(l.prompt)}</textarea>
    <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 비 오는 밤 네온이 비치는 편의점 앞">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="${kind}">AI로 프롬프트 쓰기</button><button class="btn sm ghost" data-act="copyfield" data-f="li_prompt">복사</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="${kind}">저장</button>${id?`<button class="btn ghost" data-act="naigen" data-k="lib" data-id="${l.id}">NAI로 그리기</button><button class="btn ghost" data-act="upload" data-k="lib" data-id="${l.id}">이미지 올리기</button>${(kind==='enemy'||kind==='prop'||kind==='icon')&&imgSrc(l)?`<button class="btn ghost" data-act="cutopen" data-k="lib" data-id="${l.id}">배경 지우기</button>`:''}${l.img?XBTN('lib',l.id):''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
}
function openBanner(id){
  const b=BD=id?clone(G.banners.find(bn=>bn.id===id)):{id:'',name:'새 배너',type:'pickup',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''};
  const facs=[...new Set(G.chars.map(c=>c.faction).filter(Boolean))];
  openModal(`${head(id?'배너 편집':'배너 만들기')}
    <label class="f" for="bn_name">이름</label><input class="in" id="bn_name" value="${esc(b.name)}">
    <label class="f" for="bn_desc">설명</label><input class="in" id="bn_desc" value="${esc(b.desc)}">
    <div class="g2"><div><label class="f" for="bn_type">종류</label><select class="in" id="bn_type">${opt([['std','상시'],['pickup','확률 업'],['pool','소속 한정'],['event','이벤트']],b.type)}</select></div>
    <div><label class="f" for="bn_bg">배경</label><select class="in" id="bn_bg">${bgOptions(b.bg,'기본')}</select></div></div>
    <div class="g2"><div><label class="f" for="bn_mode">등장 대상</label><select class="in" id="bn_mode">${opt([['all','전체'],['faction','소속으로 고르기'],['list','직접 고르기']],b.pool.mode)}</select></div>
    <div><label class="f" for="bn_rate">확률 업 비중 (%)</label><input class="in" id="bn_rate" type="number" value="${b.rate}"></div></div>
    ${b.pool.mode==='faction'?`<label class="f">소속</label><div class="chips">${facs.map(f=>`<button class="chip ${b.pool.factions.includes(f)?'on':''}" data-act="bnfac" data-v="${esc(f)}">${esc(f)}</button>`).join('')||'<span class="muted">소속이 정해진 '+T('crew')+'이(가) 없어요</span>'}</div>`:''}
    ${b.pool.mode==='list'?`<label class="f">등장 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pool.ids.includes(c.id)?'on':''}" data-act="bnid" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:''}
    <label class="f">확률 업 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pickup.includes(c.id)?'on':''}" data-act="bnup" data-v="${c.id}">${RL[c.rarity]} ${esc(c.name)}</button>`).join('')}</div>
    <label class="f" for="bn_act">상태</label><select class="in" id="bn_act">${opt([['1','열림'],['0','닫힘']],b.active!==false?'1':'0')}</select>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="bnsave">저장</button>${id&&id!=='std'?'<button class="btn ghost" data-act="bndel">삭제</button>':''}</div>`);
}
let BD=null;
function openBannerFrom(b){ const real=G.banners; const bak=BD; BD=b; const orig=G.banners.find(bn=>bn.id===b.id); const saved=JSON.stringify(b);
  // render from draft
  const facs=[...new Set(G.chars.map(c=>c.faction).filter(Boolean))];
  openModal(`${head(b.id?'배너 편집':'배너 만들기')}
    <label class="f" for="bn_name">이름</label><input class="in" id="bn_name" value="${esc(b.name)}">
    <label class="f" for="bn_desc">설명</label><input class="in" id="bn_desc" value="${esc(b.desc)}">
    <div class="g2"><div><label class="f" for="bn_type">종류</label><select class="in" id="bn_type">${opt([['std','상시'],['pickup','확률 업'],['pool','소속 한정'],['event','이벤트']],b.type)}</select></div>
    <div><label class="f" for="bn_bg">배경</label><select class="in" id="bn_bg">${bgOptions(b.bg,'기본')}</select></div></div>
    <div class="g2"><div><label class="f" for="bn_mode">등장 대상</label><select class="in" id="bn_mode">${opt([['all','전체'],['faction','소속으로 고르기'],['list','직접 고르기']],b.pool.mode)}</select></div>
    <div><label class="f" for="bn_rate">확률 업 비중 (%)</label><input class="in" id="bn_rate" type="number" value="${b.rate}"></div></div>
    ${b.pool.mode==='faction'?`<label class="f">소속</label><div class="chips">${facs.map(f=>`<button class="chip ${b.pool.factions.includes(f)?'on':''}" data-act="bnfac" data-v="${esc(f)}">${esc(f)}</button>`).join('')}</div>`:''}
    ${b.pool.mode==='list'?`<label class="f">등장 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pool.ids.includes(c.id)?'on':''}" data-act="bnid" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:''}
    <label class="f">확률 업 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pickup.includes(c.id)?'on':''}" data-act="bnup" data-v="${c.id}">${RL[c.rarity]} ${esc(c.name)}</button>`).join('')}</div>
    <label class="f" for="bn_act">상태</label><select class="in" id="bn_act">${opt([['1','열림'],['0','닫힘']],b.active!==false?'1':'0')}</select>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="bnsave">저장</button>${b.id&&b.id!=='std'?'<button class="btn ghost" data-act="bndel">삭제</button>':''}</div>`);
}
function openFarmSquad(st){ openFormation(st,{kind:'farm',extra:`data-k="${st.farm.key}" data-lv="${st.farm.lv}"`},'farmstart'); }
async function aiChapterGen(dir,n,cast,t){ const snap=artSnap(); const r=await aiChapterGen0(dir,n,cast,t); if(r) artAfterAI(snap,'새 이야기 「'+r.ch.title+'」'); return r; }
/* 세계관 편집 창에 AI가 낸 값 채우기(View) — 용어 바꾸기 제안(WTERMS)은 처리기가 먼저 담음 */
function worldFormFill(r){ $('#w_name').value=r.name||''; $('#w_sum').value=r.summary||''; $('#w_lore').value=r.lore||''; $('#w_plot').value=r.plot||''; $('#w_fac').value=(r.factions||[]).map(f=>f.name+': '+f.desc).join('\n'); const tb=$('#w_terms'); if(tb&&WTERMS){ tb.hidden=false; tb.querySelector('span').textContent=Object.entries(WTERMS).filter(([k,v])=>v&&TERM_LABEL[k]).map(([k,v])=>TERM_LABEL[k]+': '+v).join(' · '); } }
/* 대열에 넣은 대원 반응(View): 몸짓 · 한마디 말풍선 — 고른 한마디를 돌려줌(목소리는 처리기가) */
function formJoinShow(c){ const slot=document.querySelector(`.fslot[data-id="${c.id}"]`); if(!slot) return ''; charReact(slot.querySelector('.fs-art'),7,'head'); const pool=(c.dupLines.length?c.dupLines:[]).concat(c.lines); const l=rand(pool); if(l){ const b=document.createElement('div'); b.className='fsay'; b.textContent=sub(l); slot.appendChild(b); setTimeout(()=>b.remove(),2600); } return l; }
