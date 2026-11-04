/* ===== 0135-live — View(HTML·DOM을 만듦) ===== */
/* src/main/0135-live/0135-schedule.js에서 옮김 */
function schedHTML(){ const sc=progRead('sched'), S=spots();
  return `${pageHead('일정','SCHEDULE','lobby')}<p class="muted">하루 ${SCHED_N}번, 장소에 나와 있는 ${T('crew')}을(를) 만나요. 좋아하는 장소에서 만나면 호감도를 더 많이 얻어요. 오늘 남은 일정 <b>${sc.left}/${SCHED_N}</b></p>
  ${S.length?`<div class="sc-spots">${S.map(s=>{ const done=sc.done.includes(s.id), who=spotWho(s); return `<div class="sc-spot" style="${bgStyle(s.bg||s.name)}"><b>${esc(s.name)}</b>${s.desc?`<div class="muted" style="font-size:.75rem">${esc(s.desc)}</div>`:''}
    <div class="sc-who">${done?'<span class="badge">다녀옴</span>':who.length?who.map(c=>`<button class="btn sm" data-act="scvisit" data-s="${s.id}" data-c="${c.id}" ${sc.left?'':'disabled'}>${esc(c.name)}${spotFav(c,s)?' ♥':''}</button>`).join(''):'<span class="muted">아무도 없어요</span>'}</div></div>`; }).join('')}</div>`:`<p>아직 장소가 없어요.</p><button class="btn" data-act="scauto">자료실 배경으로 장소 만들기</button>`}
  ${playMode()?'':`<div class="row" style="margin-top:10px;gap:6px"><button class="btn sm ghost" data-act="scai">AI로 장소 다시 정하기</button><button class="btn sm ghost" data-act="sctalkall">AI로 장면 만들기(장면 없는 ${T('crew')})</button></div>`}`; }
/* src/main/0135-live/0280-live-ops.js에서 옮김 */
function bgJobsDraw(){ let el=document.getElementById('bgjobs'); if(!BGJOBS.length){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='bgjobs'; document.body.appendChild(el); }
  const now=Date.now(); el.innerHTML=BGJOBS.map(j=>{ const s=Math.floor((now-j.at)/1000), pct=j.total?Math.round(100*j.step/j.total):0; return `<div class="bgj"><span>${esc(j.label)}${j.sub?' · '+esc(j.sub):''}</span><em>${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</em><i class="${j.total?'':'ind'}" style="--w:${Math.max(8,pct)}%"></i></div>`; }).join(''); }
function liveBar(msg){let el=document.getElementById('livebar');if(!msg){if(el)el.remove();return;}if(!el){el=document.createElement('div');el.id='livebar';document.body.appendChild(el);}el.textContent=msg;}
/* src/main/0135-live/0290-season-rotation.js에서 옮김 */
function seasonChip(){ const s=seasonNow(); if(!s) return ''; const m=seasonMeta(s.type), d=Math.max(0,Math.ceil((s.until-Date.now())/864e5)); return `<button class="lb-season s-${esc(s.type)}" data-act="seasoninfo"><i>${m[3]}</i><b>${esc(m[1])}</b><span>D-${d}</span></button>`; }
function openSeasonInfo(){ const L=P().live, s=seasonNow(), nx=seasonNext();
  openModal(`${head('시즌',`<span class="muted">${seasonDays()}일마다 운영 테마가 바뀌어요</span>`)}
    ${s?`<div class="season-now s-${esc(s.type)}"><em>${seasonMeta(s.type)[3]}</em><div><b>지금: ${esc(seasonMeta(s.type)[1])}</b><span>${esc(seasonMeta(s.type)[2])} · ${new Date(s.until-1).toLocaleDateString('ko-KR')}까지</span></div></div>`:'<p class="muted">아직 시즌이 시작되지 않았어요.</p>'}
    ${nx?`<p class="muted" style="margin:10px 0 4px">다음 시즌: <b>${esc(seasonMeta(nx)[1])}</b></p>`:''}
    <h3 class="sec">로테이션에 넣을 시즌</h3><div class="chips">${SEASONS.map(x=>`<button class="chip ${L.seasons[x[0]]!==false?'on':''}" data-act="seasontog" data-k="${x[0]}">${x[3]} ${esc(x[1])}</button>`).join('')}</div>
    <p class="muted" style="font-size:.8rem;margin-top:8px">스토리·이벤트·캐릭터 시즌은 글 AI로 새 콘텐츠를 만들어요. 육성·복각 시즌은 AI 없이도 돌아가요.</p>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="seasonskip">지금 다음 시즌으로 넘기기</button><button class="btn sm" data-act="close">닫기</button></div>`); }
function openNotice(i){
  const n=P().live.notices[i]; if(!n) return;
  openModal(`${head(esc(n.title),'<span class="muted">UPDATE NOTICE</span>')}<ul class="notice">${n.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-to="notice">공지 전체 보기</button></div>`);
}
function openPrep(ask){
  try{ scanScriptAssets(); }catch(e){} const all=drawTodo(), cnt=k=>all.filter(x=>x.cat===k).length;
  if(!all.length){ if(!ask) toast('미리 그릴 그림이 없어요. 다 준비돼 있어요'); return; }
  const c=naiCfg();
  openModal(`${head(ask?'그림을 미리 준비할까요?':'그림 준비실','<span class="muted">NovelAI로 비어 있는 그림을 차례로 그려요</span>')}
    ${imgReady()?'':`<p style="color:var(--rose)">${imgNeed()}</p>`}
    <p class="muted" style="margin:0 0 8px">게임을 하는 동안 뒤에서 한 장씩 그려서 바로 적용해요. 위쪽 진행 표시에서 언제든 멈출 수 있어요. Opus 구독이면 기본 크기 생성은 Anlas가 들지 않아요.</p>
    <div class="prepcats">${PREP_CATS().map(([k,l,d])=>cnt(k)?`<label class="pc"><input type="checkbox" data-pc="${k}" ${d?'checked':''}><b>${esc(l)}</b><span>${cnt(k)}장</span></label>`:'').join('')}</div>
    <div class="row" style="margin-top:14px"> ${SAMPLE&&G.chars.some(c=>c.weapon&&wpBad(c.weapon.prompt))?`<button class="btn ghost" data-act="wfixall">${T('weapon')} 프롬프트 정리 (${G.chars.filter(c=>c.weapon&&wpBad(c.weapon.prompt)).length})</button>`:''}<button class="btn" data-act="prepgo" ${imgReady()?'':'disabled'}>준비 시작</button><button class="btn ghost" data-act="close">${ask?'나중에':'닫기'}</button>${ask?'<button class="btn ghost" data-act="prepnever">다시 묻지 않기</button>':''}</div>`);
}
function prepChip(){
  let el=$('#prepChip'); const j=PREPJOB;
  if(!j||j.fg){ if(el) el.remove(); return; }
  if(!el){ el=document.createElement('div'); el.id='prepChip'; el.className='prepchip'; document.body.appendChild(el); }
  el.innerHTML=`<span class="pg"><i style="width:${j.total?j.done/j.total*100:0}%"></i></span><b>그림 준비 ${j.done}/${j.total}</b><span class="lb">${esc(j.label||'')}</span><button data-act="prepstop" aria-label="멈추기">${j.stop?'멈추는 중':'■'}</button>`;
}
function noticeHTML(){
  const L=P().live, todo=drawTodo();
  return `${pageHead('공지','NOTICE','lobby')}
  ${L.notices.length?L.notices.map((n,i)=>`<div class="panel"><h3>${esc(n.title)}</h3><ul class="notice">${n.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`).join(''):'<div class="panel"><p class="muted">아직 공지가 없어요. 설정의 라이브 운영을 켜 두면 날짜에 맞춰 새 콘텐츠가 생겨요.</p></div>'}
  <div class="panel"><h3>NAI로 그릴 것 ${todo.length}개</h3><p class="muted" style="margin:0 0 10px">${todo.slice(0,12).map(x=>esc(x.label)).join(', ')}${todo.length>12?' 외':''}</p>${todo.length?'<button class="btn" data-act="prepopen">그림 준비실 열기</button>':''}</div>`;
}
/* src/main/0135-live/0535-content-audit.js에서 옮김 */
/* 콘텐츠 점검·업그레이드 창 내용(View) */
function auditHTML(focus,old,res,kinds,how,chars){ return `${head(focus?`${charById(focus)?.name||''} 점검`:'콘텐츠 점검·업그레이드',`<span class="muted">생성 규칙 v${auditGenVer()} · ${focus?'':`구버전 생성물 ${old}명`}</span>`)}
    <p class="muted" style="font-size:.82rem;margin:0 0 8px">생성 기능이 좋아졌거나 예전에 만든 콘텐츠에 빠진 게 있으면 여기에서 찾아 고쳐요. 고치기 전 상태는 마지막 작업 한 번까지 되돌릴 수 있어요.</p>
    ${AUDIT_UNDO?`<div class="panel" style="padding:8px 10px"><span class="muted">마지막 작업: ${esc(AUDIT_UNDO.label)} (${AUDIT_UNDO.items.length}개)</span> <button class="btn sm ghost" data-act="audundo">되돌리기</button></div>`:''}
    ${res.length?res.map(({rule:r,items},gi)=>`<details class="panel" style="margin:6px 0" ${gi<3?'open':''}><summary><span class="badge">${kinds[r.kind]}</span> <b>${esc(r.label)}</b> <span class="muted">${items.length}개</span></summary>
      <div style="max-height:160px;overflow:auto;margin:6px 0;font-size:.85rem">${items.map((o,i)=>`<label style="display:flex;gap:6px"><input type="checkbox" data-aud="${r.id}" data-i="${i}" checked>${esc(auditName(r,o))}${r.scope==='char'&&(+o.genVer||0)<auditGenVer()?' <span class="muted">(구버전)</span>':''}</label>`).join('')}</div>
      <button class="btn sm" data-act="audfix" data-rule="${r.id}">선택 항목 ${how[r.fix.mode]}</button></details>`).join(''):'<p>👍 찾은 문제가 없어요.</p>'}
    <details class="panel" style="margin-top:10px" ${focus?'open':''}><summary><b>지정 변환 (AI)</b> <span class="muted">고른 ${esc(T('crew'))}의 항목을 지시대로 바꿔요</span></summary>
      <label class="f">대상</label><div style="max-height:120px;overflow:auto;font-size:.85rem">${chars.map(c=>`<label style="display:inline-flex;gap:4px;margin:2px 8px 2px 0"><input type="checkbox" data-audc="${c.id}" ${focus?'checked':''}>${esc(c.name)}</label>`).join('')}</div>
      <label class="f">항목</label><div class="row" style="flex-wrap:wrap">${Object.entries(AUDIT_FIELDS).map(([k,[l]])=>`<label style="display:inline-flex;gap:4px"><input type="checkbox" data-audf="${k}">${esc(l)}</label>`).join('')}</div>
      <label class="f" for="aud_ins">지시</label><textarea class="in" id="aud_ins" rows="2" placeholder="예: 대사를 모두 반말로 / 프로필에 출신지와 좋아하는 음식 추가 / 외모 태그를 겨울 분위기로"></textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm" data-act="audconv">지정 변환 시작</button></div></details>
    <div class="row" style="margin-top:12px">${AUDIT_JOB?'<button class="btn ghost" data-act="audstop">작업 멈추기</button>':''}<button class="btn ghost" data-act="close">닫기</button></div>`; }
function auditPanel(){ const n=auditScan().reduce((a,x)=>a+x.items.length,0), fresh=(+G.meta.auditSeen||0)<auditVer();
  return `<div class="panel pm-hide"><h3>콘텐츠 점검·업그레이드 ${fresh?'<span class="badge">생성 기능 향상</span>':''}</h3><p class="muted" style="margin:0 0 10px">${n?`고칠 수 있는 항목 ${n}개. `:''}빠진 대사·그림·태그, 구버전 생성물을 찾아 자동·AI로 고치거나, 고른 캐릭터를 지시대로 바꿔요.</p><button class="btn sm" data-act="audopen">점검 열기</button></div>`; }
function auditNotice(){ try{ if((+G.meta.auditSeen||0)>=auditVer()||!P().seenOpening) return; const n=auditScan().reduce((a,x)=>a+x.items.length,0); if(n) toast(`생성 기능이 좋아졌어요. 설정 → 게임 → 콘텐츠 점검에서 ${n}개를 업그레이드할 수 있어요`); }catch(e){} }
/* src/main/0135-live/0537-live-fill.js에서 옮김 */
function liveFillNotes(notes,fill){ if(notes.length) notes.push(...fill); else if(fill.length) toast(fill[0]); } // 채운 것만으로는 업데이트 보급 우편을 보내지 않음
