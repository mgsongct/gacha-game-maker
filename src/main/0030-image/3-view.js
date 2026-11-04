/* ===== 0030-image — View(HTML·DOM을 만듦) ===== */
/* src/main/0030-image/010-engine.js에서 옮김 */
function openRegen(cid){
 if(playMode())return;const c=charById(cid);if(!c)return;if(!SAMPLE){toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');return;}
 regenCancel();v2EnsureEquipment(c);
 openModal(`${head('AI로 다시 만들기',`<span class="muted">${esc(c.name)}</span>`)}<p class="muted">바꿀 항목만 고르세요. 결과를 확인하고 적용하기 전까지 기존 캐릭터는 유지돼요.</p>
 ${regenFields().map(([k,lab,cur])=>`<div class="rg-row"><label><input type="checkbox" data-rgsel="${k}"><b>${k==='skill'?'스킬 (한 슬롯)':esc(lab)}</b><span class="muted">${esc(String(cur(c)).slice(0,80))||'—'}</span></label>${k==='skill'?`<select class="in" id="rg_skill_slot" hidden>${Object.entries(GGMCombat.SLOTS).map(([key,label])=>`<option value="${key}" ${key==='active'?'selected':''}>${label}</option>`).join('')}</select>`:''}<input class="in" data-rgreqi="${k}" placeholder="이 항목 요구사항" hidden></div>`).join('')}
 <label class="f" for="rg_all">전체 요구사항</label><textarea class="in" id="rg_all" style="min-height:52px" placeholder="선택한 항목에 함께 반영할 컨셉"></textarea><div class="row"><button class="btn" data-act="regengo" data-id="${c.id}">✦ 다시 만들기</button><button class="btn ghost" data-act="regencancel" data-id="${c.id}">취소</button></div>`);
 document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>ch.addEventListener('change',()=>{const row=ch.closest('.rg-row');row.querySelectorAll('input.in,select').forEach(el=>el.hidden=!ch.checked);}));
}
function regenProgress(job,event){if(REGEN_JOB!==job)return;job.status=event.text||String(event);if(event.kind&&event.kind!=='phase')job.history.push(event);const log=document.getElementById('regen-job-log');if(log){log.hidden=!job.history.length;log.innerHTML=v2GenerationHistoryHTML(job.history);}}
async function regenRun(c,sel,reqs={},global='',slot='active'){
 if(playMode()||!c||charById(c.id)!==c)return;sel=Object.fromEntries(regenFields().map(([k])=>[k,!!sel[k]]));if(!Object.values(sel).some(Boolean)){toast('바꿀 항목을 하나 이상 골라 주세요');return;}if(!SAMPLE){toast('글 AI를 먼저 등록해 주세요');return;}
 regenCancel();v2CancelEditorGeneration();v2CloseGearEditor();v2EnsureEquipment(c);slot=regenSlot(slot);
 const state={cid:c.id,target:c,project:PJ().active,snapshot:regenSourceSnapshot(c),sel,reqs:clone(reqs||{}),global:String(global||''),slot,nc:clone(c),history:[],fallback:false};
 const job={...state,controller:new AbortController(),status:'선택한 항목과 캐릭터 설정 확인',history:[]};REGEN_JOB=job;
 openModal(head('다시 만드는 중')+'<p id="regen-job-status" role="status" aria-live="polite"></p><details id="regen-job-log" hidden></details><button class="btn ghost" data-act="regencancel">작업 중단</button>',true);
 let dots=0;const tick=()=>{const el=document.getElementById('regen-job-status');if(REGEN_JOB===job&&el)el.textContent=job.status+'.'.repeat(dots++%3+1);};tick();job.timer=setInterval(tick,400);
 try{
  const nonSkill=Object.keys(sel).some(k=>k!=='skill'&&sel[k]);
  if(nonSkill){let last;for(let attempt=1;attempt<=3;attempt++){v2CheckCancelled(job.controller.signal);regenProgress(job,{kind:'phase',text:`캐릭터 설정 응답 대기 · ${attempt}/3`});try{
    const context={character:{name:c.name,faction:c.faction,profile:c.profile,appearance:c.naiPrompt,weapon:{name:c.weapon?.name,description:c.weapon?.desc},lines:c.lines},selected:Object.keys(sel).filter(k=>k!=='skill'&&sel[k]),requests:reqs,concept:global};
    const response=await v2SkillRequest(SAMPLE,regenRunPrompt({context,last,c,sel}),job.controller.signal);
    state.nc=regenParseCharacter(c,response,sel);last=null;break;
   }catch(e){v2CheckCancelled(job.controller.signal);last=v2FailureText(e);regenProgress(job,{kind:'failure',text:`설정 생성 ${attempt}회 실패: ${last}`});if(['bad_key','no_ai','quota','low_credit','not_granted','payment_required','refused','insufficient_quota','model_not_found','sa_bad'].includes(e?.code)||attempt===3)throw e;}}
  }
  regenAssertCurrent(state);
  if(sel.skill){const concept=[global,reqs.skill].filter(Boolean).join('\n'),nc=state.nc;nc.skillConcept=concept||c.skillConcept||'';nc.generation=GGMCombat.generation(c);const base=clone(v2Ensure(c));
   const result=await v2GenerateSelected(nc,slot,concept,base,{signal:job.controller.signal,onEvent:e=>regenProgress(job,e)});v2CheckCancelled(job.controller.signal);
   nc.skills={...base,[slot]:clone(result.kit[slot])};nc.skillPlan={...(c.skillPlan||{}),[slot]:v2SkillPlanText(result.plan)};state.report=clone(result.report);state.fallback=!!result.fallback;
  }
  v2CheckCancelled(job.controller.signal);regenAssertCurrent(state);if(REGEN_JOB!==job)return;state.history=clone(job.history);clearInterval(job.timer);REGEN_JOB=null;closeModal();REGEN=state;regenPreview();
 }catch(e){if(REGEN_JOB===job){job.status=e.name==='AbortError'?'작업을 중단했어요. 기존 캐릭터는 유지돼요.':v2FailureText(e);job.history.push({kind:'failure',text:job.status});const el=document.getElementById('regen-job-status');if(el)el.textContent=job.status;regenProgress(job,{kind:'phase',text:job.status});const b=document.querySelector('[data-act=regencancel]');if(b)b.textContent='닫기';}}
 finally{clearInterval(job.timer);}
}
function regenReadPreview(R){const read=id=>document.getElementById(id)?.value.trim();if(!R.edit)return;const nc=R.nc;
 if(R.sel.name){const name=read('rg_e_name');if(!name)throw new Error('이름을 입력해 주세요.');nc.name=name.slice(0,20);nc.faction=(read('rg_e_faction')||'').slice(0,100);}
 if(R.sel.profile){const value=read('rg_e_profile');if(!value)throw new Error('프로필을 입력해 주세요.');nc.profile=value.slice(0,6000);}
 if(R.sel.look){const value=read('rg_e_look');if(!value)throw new Error('외모 태그를 입력해 주세요.');nc.naiPrompt=allyTags(value);naiBlocksSave(nc,'naiPrompt','rg_e_look');}
 if(R.sel.skill){const name=read('rg_e_skill');if(!name)throw new Error('스킬 이름을 입력해 주세요.');nc.skills[R.slot].name=name.slice(0,40);}
 if(R.sel.weapon){const name=read('rg_e_wname'),prompt=read('rg_e_wprompt');if(!name||!prompt)throw new Error('무기 이름과 프롬프트를 입력해 주세요.');nc.weapon={...nc.weapon,name:name.slice(0,100),prompt:regenWeaponPrompt(prompt.slice(0,4000))};R.weaponEdited=true;}
}
function regenPreview(){const R=REGEN,c=R&&charById(R.cid);if(!R||!c)return;const nc=R.nc,F=regenFields(R.slot),chg=F.filter(([k])=>R.sel[k]);
 const fld=(lab,inner)=>'<label class="f">'+esc(lab)+'</label>'+inner;
 if(R.edit){openModal(head('결과 고치기')+
  (R.sel.name?fld('이름',`<input class="in" id="rg_e_name" value="${esc(nc.name)}">`)+fld('소속',`<input class="in" id="rg_e_faction" value="${esc(nc.faction||'')}">`):'')+
  (R.sel.profile?fld('프로필',`<textarea class="in" id="rg_e_profile">${esc(nc.profile)}</textarea>`):'')+
  (R.sel.look?fld('외모 태그',`<textarea class="in" id="rg_e_look">${esc(nc.naiPrompt)}</textarea>`):'')+
  (R.sel.skill?fld(GGMCombat.SLOTS[R.slot]+' 이름',`<input class="in" id="rg_e_skill" value="${esc(nc.skills[R.slot].name)}">`):'')+
  (R.sel.weapon?fld(T('weapon')+' 이름',`<input class="in" id="rg_e_wname" value="${esc(nc.weapon.name)}">`)+fld(T('weapon')+' 프롬프트',`<textarea class="in" id="rg_e_wprompt">${esc(nc.weapon.prompt)}</textarea>`):'')+
  '<div class="row"><button class="btn" data-act="regenapply">고친 대로 적용</button><button class="btn ghost" data-act="regenedit">결과로 돌아가기</button><button class="btn ghost" data-act="regencancel">취소</button></div>');return;}
 openModal(head('다시 만든 결과','<span class="muted">적용 전까지 기존 캐릭터 유지</span>')+chg.map(([key,label,cur])=>`<div class="rg-cmp"><div class="rg-lab">${esc(label)}</div><div class="rg-a"><small>지금</small><div>${esc(String(cur(c)||'—').slice(0,1500))}</div></div><div class="rg-b"><small>새로</small><div>${esc(String(cur(nc)||'—').slice(0,1500))}</div></div></div>`).join('')+
  (R.sel.skill?`<p class="muted">${esc(GGMCombat.SLOTS[R.slot])} 하나만 바뀝니다. 다른 두 스킬과 강화·전문화 단계는 유지돼요.${R.fallback?' AI 응답 대신 검사한 복구 초안이에요. 내용을 확인해 주세요.':''}</p>`:'')+
  (R.sel.look?'<p class="muted">외모가 바뀌면 기본 캐릭터 그림과 표정은 다시 그려야 해요. 스킨과 스킬 아이콘은 보관됩니다. 관련 스토리 CG는 그림 준비실에 다시 그릴 그림으로 표시해요.</p>':'')+
  (R.sel.weapon?'<p class="muted">무기 그림은 다시 그려야 해요. 장비 강화와 고유 효과는 보존하며, 연계 스킬도 바뀌었다면 고유 효과를 다시 구성해야 해요.</p>':'')+
  (R.sel.profile||R.sel.lines?'<p class="muted">이미 작성한 이야기·관계는 유지하며 새 설정은 이후 생성에 반영해요.</p>':'')+
  (R.history.length?'<details>'+v2GenerationHistoryHTML(R.history)+'</details>':'')+
  '<p id="regen-apply-status" role="status" aria-live="polite"></p><div class="row"><button class="btn" data-act="regenapply">이대로 적용</button><button class="btn ghost" data-act="regenedit">✎ 고치기</button><button class="btn ghost" data-act="regenretry">다시 만들기</button><button class="btn ghost" data-act="regencancel">취소</button></div>');
}
/* 다시 만들기 창의 적용·다시 시도·고치기 단추 잠금(View) */
function regenButtonsLock(on){ document.querySelectorAll('[data-act=regenapply],[data-act=regenretry],[data-act=regenedit]').forEach(b=>b.disabled=on); }
function openImgLib(cid){const c=charById(cid);if(!c)return;if(!IMGLIB||IMGLIB.cid!==cid)IMGLIB={cid,sel:[]};const items=charImgItems(c),has=items.filter(x=>imgSrcRaw(x.o)),cmp=IMGLIB.sel.length===2?IMGLIB.sel.map(i=>items[i]).filter(x=>x&&imgSrcRaw(x.o)):[];
 openModal(`${head(`${esc(c.name)} · 그림 모아 보기`,`<span class="muted">${has.length}/${items.length}장</span>`)}<p class="muted">누르면 크게 보고, 두 장을 고르면 나란히 비교해요.</p>${cmp.length===2?`<div class="imglib-cmp">${cmp.map(x=>`<div><img src="${esc(imgSrcRaw(x.o))}" alt=""><small>${esc(x.label)}</small></div>`).join('')}</div>`:''}<div class="row">${IMGLIB.sel.length?'<button class="btn sm ghost" data-act="ilbclear">선택 풀기</button>':''}</div><div class="imglib-grid">${items.map((x,i)=>{const src=imgSrcRaw(x.o);return `<div class="imglib-it ${src?'':'empty'} ${IMGLIB.sel.includes(i)?'on':''}" ${src?`data-act="ilbtap" data-i="${i}"`:''}>${src?`<img src="${esc(src)}" alt="">`:'<span>없음</span>'}<b>${esc(x.label)}</b>${src?`<button class="del pm-hide" data-act="ilbdel" data-i="${i}" data-image-id="${esc(x.o.id)}" aria-label="지우기">✕</button>`:''}</div>`;}).join('')}</div>`);
}
function openDesign(){ const d=G.meta.design||{}, facs=designFacs();
  openModal(`${head('캐릭터 디자인 통일','<span class="muted">이 게임의 가챠 캐릭터 그림에 붙는 태그</span>')}
    <p class="muted" style="margin:0 0 8px">스탠딩·상반신·일러스트·돌파 CG·스토리 CG·기술 컷인을 그릴 때 캐릭터 외형 프롬프트 뒤에 붙여요. 제복·상징 색·소재·문장(엠블럼)처럼 다 같이 공유할 디자인을 영어 태그로 적어요. 머리·눈·체형은 캐릭터마다 다르니 넣지 않는 게 좋아요. 바꾼 뒤 새로 그리는 그림부터 적용돼요.</p>
    <label class="f" for="ds_all">공통 (모든 가챠 캐릭터)</label><textarea class="in" id="ds_all" style="min-height:60px" placeholder="예: academy uniform, white and navy color scheme, gold trim, school crest">${esc(d.all||'')}</textarea>
    ${facs.length?`<h3 class="sec">세력별</h3>${facs.map((f,i)=>`<label class="f" for="ds_f${i}">${esc(f)} <span class="muted">· ${G.chars.filter(c=>c.faction===f&&!c.collab).length}명</span></label><textarea class="in" id="ds_f${i}" data-fac="${esc(f)}" style="min-height:50px" placeholder="예: crimson cape, silver rose emblem">${esc(((d.fac||{})[f])||'')}</textarea>`).join('')}`:'<p class="muted">세력이 정해진 캐릭터가 없어서 공통 태그만 쓸 수 있어요.</p>'}
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">스킨(의상)·NPC·다른 세계에서 온 콜라보 캐릭터에는 붙지 않아요. 캐릭터 한 명만 빼려면 그 캐릭터 편집에서 '공통 디자인 태그 쓰지 않기'를 켜요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="dssave">저장</button>${SAMPLE?'<button class="btn ghost" data-act="dsai">✦ AI로 제안 받기</button>':''}</div>`); }
function designRead(){ const fac={}; document.querySelectorAll('#modal [data-fac]').forEach(e=>{ const v=stripMinor(stripAge(e.value.trim())); if(v) fac[e.dataset.fac]=v; }); return {all:stripMinor(stripAge(($('#ds_all')||{}).value?$('#ds_all').value.trim():'')),fac}; }
async function designAI(rep){ const facs=designFacs(), w=G.world||{};
  const r=await aiJSON(designAIPrompt({w,facs}),rep,'quick');
  if(!r||typeof r!=='object') return; if(r.all&&$('#ds_all')) $('#ds_all').value=stripMinor(String(r.all));
  (Array.isArray(r.factions)?r.factions:[]).forEach(x=>{ const el=[...document.querySelectorAll('#modal [data-fac]')].find(e=>e.dataset.fac===String(x&&x.name||'').trim()); if(el&&x.tags) el.value=stripMinor(String(x.tags)); });
  toast('제안을 채웠어요. 고친 뒤 저장을 눌러 주세요'); }
function cutPush(){const j=CUTJOB,x=cutCtx(); if(!x) return; j.undo.push(x.getImageData(0,0,j.W,j.H)); if(j.undo.length>10) j.undo.shift(); const el=$('#ct_undo'); if(el) el.disabled=false; j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;}
async function cutLoadBlob(b,push){
  const j=CUTJOB, x=cutCtx(); if(!x) return; if(push!==false) cutPush();
  const bmp=await createImageBitmap(b); x.clearRect(0,0,j.W,j.H); x.drawImage(bmp,0,0,j.W,j.H); cutDrawLoupe(); j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;
}
function cutMap(){const j=CUTJOB, R=j.cv.getBoundingClientRect(), s=Math.min(R.width/j.W,R.height/j.H); return {s,ox:R.left+(R.width-j.W*s)/2,oy:R.top+(R.height-j.H*s)/2};}
function cutMode(){const m=$('#ct_pmode');return m?m.value:'wand';}
function cutBrush(){const el=$('#ct_brush');return el?+el.value:10;}
/* 배경 지우기 편집기(View): 확대 단계 표시(커서 자리를 화면 가운데로) · 되돌리기 단추 */
function cutZoomShow(t,j){ const view=$('#cutPrev'), z=j.zoom, fx=j.cx>=0?j.cx/j.W:.5, fy=j.cy>=0?j.cy/j.H:.5; view.classList.toggle('zoom',z>1); j.cv.style.width=z>1?(z*100)+'%':''; t.textContent='확대 ×'+z; chipOn(t,z>1);
  requestAnimationFrame(()=>{ if(z>1){ view.scrollLeft=j.cv.offsetWidth*fx-view.clientWidth/2; view.scrollTop=j.cv.offsetHeight*fy-view.clientHeight/2; } cutPlaceCursor(); cutDrawLoupe(); }); }
function cutUndoShow(j){ $('#ct_undo').disabled=!j.undo.length; cutDrawLoupe(); }
function cutPlaceCursor(){
  const j=CUTJOB, el=$('#cutCur'), view=$('#cutPrev'); if(!j||!el||!view||j.cx<0) return;
  const m=cutMap(), V=view.getBoundingClientRect(), X=m.ox+j.cx*m.s, Y=m.oy+j.cy*m.s;
  const brush=['brush','restore'].includes(cutMode()), size=brush?Math.max(10,cutBrush()*2*m.s):26;
  el.hidden=false; el.classList.toggle('brush',brush); el.classList.toggle('restore',cutMode()==='restore');
  el.style.width=el.style.height=size+'px'; el.style.left=(X-V.left+view.scrollLeft-size/2)+'px'; el.style.top=(Y-V.top+view.scrollTop-size/2)+'px';
}
function cutDrawLoupe(){
  const j=CUTJOB, el=$('#cutLoupe'); if(!j||!el||j.cx<0) return; el.hidden=false;
  const g=el.getContext('2d'), Z=el.width, span=Math.max(9,Math.round(Z/(j.zoom>=5?3:6)));
  g.imageSmoothingEnabled=false; for(let y=0;y<Z;y+=10) for(let x=0;x<Z;x+=10){ g.fillStyle=((x+y)/10)%2?'#3a3550':'#2c2541'; g.fillRect(x,y,10,10); }
  g.drawImage(j.cv,j.cx-span/2,j.cy-span/2,span,span,0,0,Z,Z);
  const k=Z/span; g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=1; g.beginPath(); g.moveTo(Z/2,0); g.lineTo(Z/2,Z/2-k); g.moveTo(Z/2,Z/2+k); g.lineTo(Z/2,Z); g.moveTo(0,Z/2); g.lineTo(Z/2-k,Z/2); g.moveTo(Z/2+k,Z/2); g.lineTo(Z,Z/2); g.stroke();
  g.strokeStyle='#ff3d7f'; g.strokeRect(Z/2-k/2,Z/2-k/2,k,k);
  if(['brush','restore'].includes(cutMode())){ g.strokeStyle='rgba(255,211,90,.9)'; g.beginPath(); g.arc(Z/2,Z/2,cutBrush()*k,0,Math.PI*2); g.stroke(); }
  const view=$('#cutPrev'); if(view){ const V=view.getBoundingClientRect(), m=cutMap(), X=m.ox+j.cx*m.s-V.left, Y=m.oy+j.cy*m.s-V.top; el.classList.toggle('right',X<V.width/2&&Y<Z+20); }
  const px=cutCtx().getImageData(Math.max(0,Math.min(j.W-1,Math.round(j.cx))),Math.max(0,Math.min(j.H-1,Math.round(j.cy))),1,1).data; const sw=$('#ct_sw'); if(sw) sw.style.background=px[3]<10?'transparent':`rgb(${px[0]},${px[1]},${px[2]})`;
}
function cutAimAt(clientX,clientY){
  const j=CUTJOB, m=cutMap(); j.cx=Math.max(0,Math.min(j.W-1,(clientX-m.ox)/m.s)); j.cy=Math.max(0,Math.min(j.H-1,(clientY-m.oy)/m.s));
  cutPlaceCursor(); cutDrawLoupe();
  if(j.zoom>1){ const view=$('#cutPrev'), V=view.getBoundingClientRect(), X=m.ox+j.cx*m.s, Y=m.oy+j.cy*m.s, e=40, st=14;
    if(X<V.left+e) view.scrollLeft-=st; else if(X>V.right-e) view.scrollLeft+=st; if(Y<V.top+e) view.scrollTop-=st; else if(Y>V.bottom-e) view.scrollTop+=st; }
}
function cutStamp(x0,y0,x1,y1){
  const j=CUTJOB, g=cutCtx(), r=cutBrush(), mode=cutMode(), dist=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.ceil(dist/Math.max(1,r/3)));
  for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, y=y0+(y1-y0)*i/n;
    if(mode==='brush'){ g.save(); g.globalCompositeOperation='destination-out'; const gr=g.createRadialGradient(x,y,r*0.55,x,y,r); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.restore(); }
    else { g.save(); g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.clip(); g.clearRect(x-r-1,y-r-1,2*r+2,2*r+2); g.drawImage(j.orig,0,0,j.W,j.H); g.restore(); }
  }
}
function cutEraseHere(){
  const j=CUTJOB; if(!j||j.cx<0){toast('먼저 그림을 눌러 커서를 놓으세요');return;}
  const mode=cutMode(); if(['brush','restore'].includes(mode)){ cutPush(); cutStamp(j.cx,j.cy,j.cx,j.cy); cutDrawLoupe(); return; }
  const g=cutCtx(), id=g.getImageData(0,0,j.W,j.H), before=g.getImageData(0,0,j.W,j.H);
  const r=eraseColorData(id,j.W,j.H,j.cx,j.cy,{tol:+$('#ct_ptol').value,soft:Math.round(+$('#ct_soft').value*0.6),mode});
  const hint=$('#ct_hint');
  if(!r.color){ if(hint) hint.textContent='이미 투명한 곳이에요'; return; }
  if(hint) hint.innerHTML=`<span class="cutsw" style="background:rgb(${r.color.map(Math.round).join(',')})"></span>${r.removed?`${r.removed.toLocaleString()}픽셀 지웠어요`:'이 색과 닮은 픽셀이 없어요. 범위를 높여 보세요'}`;
  if(r.removed){ j.undo.push(before); if(j.undo.length>10) j.undo.shift(); g.putImageData(id,0,0); j.changed=true; $('#ct_undo').disabled=false; $('#ct_save').disabled=false; cutDrawLoupe(); }
}
function cutBind(){
  const j=CUTJOB, cv=j.cv;
  cv.addEventListener('pointerdown',e=>{ e.preventDefault(); try{cv.setPointerCapture(e.pointerId);}catch(_){}
    const touch=e.pointerType!=='mouse'; j.drag={touch,off:touch?64:0,sx:e.clientX,sy:e.clientY,moved:false};
    cutAimAt(e.clientX,e.clientY-j.drag.off);
    if(['brush','restore'].includes(cutMode())){ cutPush(); j.drag.lx=j.cx; j.drag.ly=j.cy; j.drag.paint=true; if(!touch){ cutStamp(j.cx,j.cy,j.cx,j.cy); cutDrawLoupe(); } } });
  cv.addEventListener('pointermove',e=>{ const d=j.drag; if(!d) return; if(Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>4) d.moved=true;
    cutAimAt(e.clientX,e.clientY-d.off);
    if(d.paint&&(d.moved||!d.touch)){ cutStamp(d.lx,d.ly,j.cx,j.cy); d.lx=j.cx; d.ly=j.cy; cutDrawLoupe(); } });
  const up=()=>{ const d=j.drag; if(!d) return; j.drag=null;
    if(d.paint){ if(!d.moved&&d.touch){ cutStamp(j.cx,j.cy,j.cx,j.cy); } cutDrawLoupe(); return; }
    if($('#ct_quick')&&$('#ct_quick').checked) cutEraseHere(); };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',()=>{j.drag=null;});
}
function openNaiSet(){
  const c=naiCfg(), sz=k=>{const v=(c.sizes||{})[k];const list=NAI_SIZES.map(x=>[x[0]+'x'+x[1],x[2]]);if(v&&!list.some(x=>x[0]===v))list.unshift([v,v]);return opt(list,v);};
  openModal(`${head('그림 AI')}
    <label class="f" for="nai_auto">AI가 새 스테이지·이벤트·${T('crew')}를 만들면</label><select class="in" id="nai_auto">${opt([['ask','그릴지 물어보기'],['auto','자동으로 그리기'],['off','그리지 않기']],c.autoArt||'ask')}</select>
    <label class="f" for="nai_prov">그림 AI 종류</label><select class="in" id="nai_prov">${opt([['nai','NovelAI'],['comfy','ComfyUI (내 PC나 서버)']],c.provider||'nai')}</select>
    <div class="optbox" id="comfyBox" ${c.provider==='comfy'?'':'hidden'}>
      <label class="f" for="cf_url">ComfyUI 주소</label><input class="in" id="cf_url" value="${esc(comfyCfg().url)}" placeholder="http://192.168.0.10:8188">
      ${!IS_NATIVE&&location.protocol==='https:'?'<p style="color:var(--rose);margin:4px 0 0;font-size:.82rem">아이폰·웹 버전에서는 https 주소만 연결돼요. PC의 ComfyUI를 Cloudflare Tunnel 같은 걸로 https 주소로 열고, --enable-cors-header 옵션도 켜 주세요.</p>':''}
      <p class="muted" style="margin:4px 0 0">PC에서 ComfyUI를 <code>--listen</code> 옵션으로 켜고, 폰과 같은 와이파이에서 PC의 IP 주소를 넣어요. 밖에서 쓰려면 Cloudflare Tunnel 같은 https 주소도 돼요.</p>
      <label class="f" for="cf_wf">워크플로 (API 형식 JSON)</label><textarea class="in" id="cf_wf" style="min-height:90px" placeholder='ComfyUI 메뉴 → Workflow → Export (API)로 저장한 파일 내용'>${esc(comfyCfg().wf)}</textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cfload">JSON 파일 불러오기</button><button class="btn sm ghost" data-act="cftest">연결 확인</button></div>
      <p class="muted" style="margin:4px 0 0">KSampler에 연결된 프롬프트·크기·시드 노드를 자동으로 찾아요. 직접 지정하려면 노드 제목을 <code>[GGM:positive]</code> <code>[GGM:negative]</code> <code>[GGM:size]</code> <code>[GGM:seed]</code> <code>[GGM:output]</code>으로 바꾸세요. 에셋 메이드의 <code>[AssetMaid:…]</code> 제목도 그대로 알아들어요.</p>
      <div class="g2"><div><label class="f" for="cf_q">항상 붙일 품질 태그</label><input class="in" id="cf_q" value="${esc(comfyCfg().qtags)}"></div><div><label class="f" for="cf_n">항상 붙일 네거티브</label><input class="in" id="cf_n" value="${esc(comfyCfg().neg)}"></div></div>
      <label class="f" for="cf_t">최대 대기 (초)</label><input class="in" id="cf_t" type="number" value="${comfyCfg().timeoutSec}">
    </div>
    <div id="naiBox" ${c.provider==='comfy'?'hidden':''}>
    <label class="f" for="nai_key">영구 API 토큰</label><input class="in" id="nai_key" type="password" autocomplete="off" value="${esc(c.key)}" placeholder="pst-...">
    <p class="muted" style="margin:4px 0 0">novelai.net 로그인 → 왼쪽 위 톱니(설정) → Account → Get Persistent API Token</p>
    <label class="f" for="nai_ep">생성 주소 (엔드포인트)</label><input class="in" id="nai_ep" value="${esc(c.endpoint)}" placeholder="${NAI_ENDPOINT}">
    <p class="muted" style="margin:4px 0 0">보통은 그대로 두세요. 중계 서버를 쓸 때만 바꿔요. 표정 변환도 같은 서버로 보내요.</p>
    <datalist id="naimodels">${NAI_MODELS.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</datalist>
    <div class="g2"><div><label class="f" for="nai_model">기본 모델</label><input class="in" id="nai_model" list="naimodels" value="${esc(c.model)}"></div><div><label class="f" for="nai_rmodel">레퍼런스용 모델 (V4.5)</label><input class="in" id="nai_rmodel" list="naimodels" value="${esc(c.refModel)}"></div></div>
    <div class="optbox"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><label class="f" for="nai_variety" style="margin:0">Variety Boost (V4.5 전용)</label><button type="button" id="nai_variety" class="v2-switch" role="switch" aria-label="V4.5 Variety Boost" aria-checked="${c.varietyBoostV45!==false}" data-act="naivariety"><span></span></button></div><p class="muted" style="margin:6px 0 0">V4.5 생성 옵션을 켜거나 꺼요. 기본은 켜기이며 품질 태그와 별개예요. V5·다른 모델과 캐릭터 레퍼런스를 쓰는 생성에는 적용하지 않아요. 아래 저장을 눌러 적용해 주세요.</p></div>
    <div class="g2"><div><label class="f" for="nai_sampler">샘플러</label><select class="in" id="nai_sampler">${opt([['k_euler_ancestral','Euler Ancestral'],['k_euler','Euler'],['k_dpmpp_2s_ancestral','DPM++ 2S Ancestral'],['k_dpmpp_2m_sde','DPM++ 2M SDE'],['k_dpmpp_2m','DPM++ 2M'],['k_dpmpp_sde','DPM++ SDE']],c.sampler)}</select></div>
    <div><label class="f" for="nai_noise">노이즈 스케줄</label><select class="in" id="nai_noise">${opt([['karras','karras'],['exponential','exponential'],['polyexponential','polyexponential']],c.noise)}</select></div></div>
    <div class="g4"><div><label class="f" for="nai_steps">스텝</label><input class="in" id="nai_steps" type="number" value="${c.steps}"></div><div><label class="f" for="nai_scale">프롬프트 강도</label><input class="in" id="nai_scale" type="number" step="0.1" value="${c.scale}"></div><div><label class="f" for="nai_cfgr">CFG 리스케일</label><input class="in" id="nai_cfgr" type="number" step="0.05" value="${c.cfgRescale}"></div><div><label class="f" for="nai_retry">재시도</label><input class="in" id="nai_retry" type="number" value="${c.retries}"></div></div>
    </div>
    <h3 class="sec">기본 크기</h3>
    <div class="g2"><div><label class="f" for="nai_sz_char">스탠딩</label><select class="in" id="nai_sz_char">${sz('char')}</select></div><div><label class="f" for="nai_sz_bg">배경</label><select class="in" id="nai_sz_bg">${sz('bg')}</select></div></div>
    <div class="g2"><div><label class="f" for="nai_sz_prop">소품·무기</label><select class="in" id="nai_sz_prop">${sz('prop')}</select></div><div><label class="f" for="nai_sz_cg">CG</label><select class="in" id="nai_sz_cg">${sz('cg')}</select></div></div>
    <div class="g2"><div><label class="f" for="nai_sz_enemy">적</label><select class="in" id="nai_sz_enemy">${sz('enemy')}</select></div><div><label class="f" for="nai_sz_illust">일러스트</label><select class="in" id="nai_sz_illust">${sz('illust')}</select></div></div>
    <h3 class="sec">캐릭터 레퍼런스 기본값</h3>
    <div class="g4"><div style="grid-column:span 2"><label class="f" for="nai_rt">종류</label><select class="in" id="nai_rt">${opt([['character','캐릭터'],['character&style','캐릭터+화풍'],['style','화풍만']],c.ref.type)}</select></div><div><label class="f" for="nai_rs">강도</label><input class="in" id="nai_rs" type="number" step="0.1" value="${c.ref.strength}"></div><div><label class="f" for="nai_rf">충실도</label><input class="in" id="nai_rf" type="number" step="0.1" value="${c.ref.fidelity}"></div></div>
    <label class="f" for="nai_aref">스탠딩을 레퍼런스로 자동 사용</label><select class="in" id="nai_aref">${opt([['off','끄기'],['illust','일러스트·로비 CG·스토리 CG'],['all','일러스트·CG + 기술 컷인·상반신']],c.autoRef||'off')}</select>
    <p class="muted" style="margin:4px 0 0">켜면 그림 준비실·바로 그리기에서 그 캐릭터(CG는 등장 ${T('crew')})의 스탠딩을 캐릭터 레퍼런스로 넣어서 얼굴·머리·옷이 스탠딩과 맞게 나와요. 스탠딩이 없는 캐릭터는 그냥 그려요. 레퍼런스는 V4.5 전용이라 위의 레퍼런스용 모델로 그리고, Anlas가 더 들 수 있어요.</p>
    <h3 class="sec">그림체 프리셋</h3>
    ${allPresets().map(s=>`<div class="ep">${pthumbHTML(s.id)}<span class="t"><b>✦ ${esc(s.name)}</b><span class="muted">${esc(s.desc||'')}${s.by?' · 프리셋 제공: '+esc(s.by):''}</span></span><button class="btn sm" data-act="naipreset" data-v="${s.id}">불러오기</button></div>`).join('')}<div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="packopen">내 프리셋 저장·공유</button></div>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">불러오면 그림체·네거티브·생성 설정이 채워져요. 기본·개인 프리셋 모두 품질 태그를 상단 그림체 태그에 포함해요. 저장을 눌러야 적용되고, 저장하지 않고 닫으면 그대로예요.</p>
    <h3 class="sec">프롬프트 조립</h3>
    <p class="muted" style="margin:0">화풍 → 공통 앞 → 각자의 프롬프트 → 자세·구도(스탠딩) → 종류별 뒤. 겹치는 태그는 한 번만 들어가요. CG는 장면 프롬프트에 인물별 프롬프트를 따로 붙여요.</p>
    <label class="f" for="nai_stags">그림체 태그 (모든 그림 맨 앞에 붙어요. 게임 정의에서 게임마다 따로 정할 수도 있어요)</label><textarea class="in" id="nai_stags" placeholder="${esc(STYLE_EX)}">${esc(c.styles[0].tags)}</textarea>
    <label class="f" for="nai_sneg">그림체 네거티브 (선택)</label><input class="in" id="nai_sneg" value="${esc(c.styles[0].neg||'')}" placeholder="예: 3d, realistic">
    <label class="f" for="nai_prefix">공통 앞 프롬프트 (모든 그림)</label><input class="in" id="nai_prefix" value="${esc(c.prefix)}">
    <label class="f" for="nai_poses">자세 프리셋 (한 줄에 하나: 이름 | 태그)</label><textarea class="in" id="nai_poses">${esc(c.poses.map(x=>x.n+' | '+x.t).join('\n'))}</textarea>
    <div class="optbox" style="margin-top:10px;font-size:.8rem"><b>종류별 추가 태그</b> <span class="muted">아래 '뒤' 칸은 AI를 거치지 않고 그 종류 그림에 항상 붙어요. AI가 태그를 쓸 때 따를 지침(의상을 자세히, 일러스트 조명·구도 등)은</span> <button class="linkb" type="button" data-act="llmopen">글 AI 지침 → 그림 태그 지침</button></div>
    ${['char','illust','lbcg','enemy','bg','prop','cg'].map(k=>`<div class="g2"><div><label class="f" for="nai_p_${k}">${({char:'스탠딩',illust:'일러스트',lbcg:'돌파 CG',enemy:'적',bg:'배경',prop:'소품·무기',cg:'CG'})[k]} 뒤</label><input class="in" id="nai_p_${k}" value="${esc(c.parts[k].suffix)}"></div><div><label class="f" for="nai_n_${k}">네거티브 추가</label><input class="in" id="nai_n_${k}" value="${esc(c.parts[k].neg)}"></div></div>`).join('')}
    <label class="f" for="nai_neg">공통 네거티브</label><textarea class="in" id="nai_neg">${esc(c.neg)}</textarea>
    <label class="f" for="nai_cut">스탠딩·적 배경 자동 제거 (세부 조절은 각 이미지의 '배경 지우기'에서)</label><select class="in" id="nai_cut">${opt([['1','켜기'],['0','끄기']],c.cutout?'1':'0')}</select>
    <label class="f" for="nai_tp">V5 투명 배경으로 생성 (스탠딩·적·프랍. 흰 배경을 지울 필요가 없어져요. 레퍼런스를 쓰면 V4.5라서 꺼져요)</label><select class="in" id="nai_tp">${opt([['1','켜기'],['0','끄기']],c.transparent?'1':'0')}</select>${appStorage.getItem('starfall-nai-tperr')?`<p class="muted" style="margin:4px 0 0">최근 투명 생성 실패: ${esc(appStorage.getItem('starfall-nai-tperr'))}</p>`:''}
    <p class="muted" style="margin-top:8px">Opus 구독이면 1024×1024 이하 넓이, 28스텝 이하, 1장 생성에 Anlas가 들지 않아요. 레퍼런스와 img2img는 추가로 들 수 있어요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="naisave">저장</button><button class="btn ghost" data-act="naitest">연결 확인</button></div>`);
}
function readNai(){
  const old=naiCfg(), v=id=>$('#'+id).value.trim();
  const styles=old.styles;
  const poses=lines($('#nai_poses').value).map(l=>{const p=l.split('|');return {n:(p[0]||'').trim(),t:p.slice(1).join('|').trim()};}).filter(x=>x.n&&x.t);
  const parts={}; ['char','illust','lbcg','enemy','bg','prop','cg'].forEach(k=>{parts[k]={suffix:v('nai_p_'+k),neg:v('nai_n_'+k)};});
  return {key:v('nai_key'),endpoint:v('nai_ep')||NAI_ENDPOINT,model:v('nai_model')||NAI_DEF.model,refModel:v('nai_rmodel')||NAI_DEF.refModel,sampler:$('#nai_sampler').value,noise:$('#nai_noise').value,
    steps:num(v('nai_steps'),1,50,28),scale:num(v('nai_scale'),0,10,6),cfgRescale:num(v('nai_cfgr'),0,1,0),retries:num(v('nai_retry'),1,5,3),timeoutSec:old.timeoutSec,
    provider:$('#nai_prov').value,comfy:{url:v('cf_url'),wf:$('#cf_wf').value.trim(),qtags:v('cf_q'),neg:v('cf_n'),timeoutSec:num(v('cf_t'),30,1200,300)},varietyBoostV45:$('#nai_variety').getAttribute('aria-checked')==='true',quality:false,qtags:'',legacyQualityTags:$('#nai_stags').dataset.presetApplied?'':old.legacyQualityTags||'',cutout:$('#nai_cut').value==='1',transparent:$('#nai_tp').value==='1',prefix:v('nai_prefix'),neg:v('nai_neg'),autoArt:$('#nai_auto').value,
    sizes:{char:$('#nai_sz_char').value,bg:$('#nai_sz_bg').value,prop:$('#nai_sz_prop').value,cg:$('#nai_sz_cg').value,enemy:$('#nai_sz_enemy').value,illust:$('#nai_sz_illust').value},cut:Object.assign({},old.cut),
    ref:{type:$('#nai_rt').value,strength:num(v('nai_rs'),0,1,1),fidelity:num(v('nai_rf'),0,1,1)},autoRef:$('#nai_aref')?$('#nai_aref').value:(old.autoRef||'off'),
    styles:[{id:'my_style',name:'내 그림체',tags:v('nai_stags'),neg:v('nai_sneg')}],styleId:'my_style',poses:poses.length?poses:NAI_DEF.poses,parts};
}
function openCut(kind,id){
  const o=naiTarget(kind,id); const src=o&&imgSrc(o); if(!src){toast('먼저 이미지를 등록해 주세요');return;}
  const c=cutCfg(); CUTJOB={kind,id,src,undo:[],zoom:1,cx:-1,cy:-1,opt:null,changed:false};
  openModal(`${head('배경 지우기',`<span class="muted">${esc(o.name)}</span>`)}
    <div class="cutbox"><div class="cutview" id="cutPrev"><canvas id="cutCv"></canvas><div class="cut-cur" id="cutCur" hidden></div></div><canvas class="cut-loupe" id="cutLoupe" width="150" height="150" hidden></canvas></div>
    <div class="cuttools">
      <select class="in" id="ct_pmode"><option value="wand">스포이드: 이어진 영역</option><option value="all">스포이드: 같은 색 전부</option><option value="brush">지우개 브러시</option><option value="restore">복원 브러시</option></select>
      <button class="btn ghost" data-act="cutzoom" id="ct_zoom">확대 ×1</button><button class="btn ghost" data-act="cutundo" id="ct_undo" disabled>되돌리기</button>
    </div>
    <div class="cutpad">
      <div class="pad"><button class="btn ghost" data-act="cutnudge" data-dx="0" data-dy="-1" aria-label="위">▲</button><button class="btn ghost" data-act="cutnudge" data-dx="-1" data-dy="0" aria-label="왼쪽">◀</button><button class="btn ghost" data-act="cutnudge" data-dx="1" data-dy="0" aria-label="오른쪽">▶</button><button class="btn ghost" data-act="cutnudge" data-dx="0" data-dy="1" aria-label="아래">▼</button></div>
      <button class="btn cutgo" data-act="cuthere"><span class="cutsw" id="ct_sw"></span>커서 위치 지우기</button>
    </div>
    <div class="slider" id="ct_pt"><label for="ct_ptol"><span>스포이드 범위</span><b id="ct_ptolv">24</b></label><input id="ct_ptol" type="range" min="2" max="80" value="24"></div>
    <div class="slider" id="ct_bs" hidden><label for="ct_brush"><span>브러시 크기</span><b id="ct_brushv">10</b></label><input id="ct_brush" type="range" min="2" max="60" value="10"></div>
    <label class="f"><input type="checkbox" id="ct_quick"> 손을 떼면 바로 지우기 (스포이드)</label>
    <p class="muted cutpick-hint" id="ct_hint">그림을 누른 채 움직이면 손가락 위쪽에 커서가 생겨요. 왼쪽 위 돋보기로 확인하고 화살표로 한 칸씩 맞춘 뒤 '커서 위치 지우기'를 누르세요. 브러시는 문지르는 대로 지우고, 복원 브러시는 원본으로 되돌려요.</p>
    <details class="cutauto"><summary>자동으로 흰 배경 한 번에 지우기</summary>
      <div class="slider"><label for="ct_tol"><span>배경 허용 범위</span><b id="ct_tolv">${c.tol}</b></label><input id="ct_tol" type="range" min="6" max="90" value="${c.tol}"></div>
      <div class="slider"><label for="ct_soft"><span>가장자리 부드럽게</span><b id="ct_softv">${c.soft}</b></label><input id="ct_soft" type="range" min="4" max="70" value="${c.soft}"></div>
      <div class="row"><label class="f"><input type="checkbox" id="ct_shadow" ${c.shadow?'checked':''}> 발밑 그림자 지우기</label></div>
      <div class="row"><label class="f"><input type="checkbox" id="ct_holes" ${c.holes?'checked':''}> 막힌 배경도 지우기 (흰 옷이 지워지면 끄세요)</label></div>
      <div class="row"><label class="f"><input type="checkbox" id="ct_spk" ${c.despeck?'checked':''}> 떠 있는 작은 점 지우기</label></div>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cutrun">자동 지우기 (원본 기준)</button></div>
      <label class="f"><input type="checkbox" id="ct_def" checked> 이 설정을 자동 배경 제거 기본값으로</label>
    </details>
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="cutnai">NovelAI로 배경 제거 (Anlas 소모)</button></div>
    <div class="cutsave"><button class="btn block" data-act="cutsave" disabled id="ct_save">이걸로 저장</button></div>`);
  (async()=>{ try{ const im=await loadImg(src), j=CUTJOB; if(!j||!$('#cutCv')) return; j.W=im.naturalWidth||im.width; j.H=im.naturalHeight||im.height;
      j.cv=$('#cutCv'); j.cv.width=j.W; j.cv.height=j.H; j.cv.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0);
      j.orig=document.createElement('canvas'); j.orig.width=j.W; j.orig.height=j.H; j.orig.getContext('2d').drawImage(im,0,0); cutBind(); }catch(e){ toast('이미지를 불러오지 못했어요'); } })();
}
function openNaiPrep(kind,id){
  const o=naiTarget(kind,id); if(!o) return;
  const c=naiCfg(), k=kind==='char'?'char':kind==='weapon'?'prop':o.kind;
  if(!imgReady()){toast(imgNeed());return;}
  const owner=ILK(k)?charById(id):null;
  const base=(k==='char'?joinTags(o.naiPrompt,designTags(o)):ILK(k)?joinTags(owner.naiPrompt,designTags(owner),o.prompt):o.prompt)||'';
  if(k==='cg'){ if(!String(o.prompt||'').trim()&&!cgCast(o).length){toast('장면 프롬프트나 등장 '+T('crew')+'을(를) 채워 주세요');return;} }
  else if(!String(base).trim()){toast('먼저 NAI 프롬프트를 채워 주세요');return;}
  const styleId=naiStyle(c,o.naiStyle).id;
  const pose=k==='char'?(o.naiPose||NAI_FRONT):ILK(k)?(o.naiPose!=null?o.naiPose:'looking at viewer'):'', frame=k==='char'?(o.naiFrame||'full body'):ILK(k)?(o.naiFrame||'cowboy shot'):'';
  const p=k==='cg'?composeCG(o,{styleId}):composeNai(k,base,{pose,styleId,frame});
  const [w,h]=naiSize(k,c), sz=w+'x'+h, hasImg=!!imgSrc(o);
  const canRef=(k==='char'&&hasImg)||(ILK(k)&&!!imgSrc(owner))||(k==='cg'&&cgCast(o).some(x=>imgSrc(x.c)));
  NPREP={kind,id,k,base};
  const sizes=[...NAI_SIZES.map(x=>[x[0]+'x'+x[1],x[2]])]; if(!sizes.some(x=>x[0]===sz)) sizes.unshift([sz,sz]);
  openModal(`${head('그리기 전 확인',`<span class="muted">${esc(o.name)}</span>`)}
    <input type="hidden" id="np_style" value="${esc(styleId)}"><div class="g2"><div><label class="f">그림체</label><p class="muted" style="margin:6px 0 0;font-size:.78rem;word-break:break-all">${esc(String(naiStyle(c).tags||'').slice(0,80)||'태그 없음 (모델 기본)')}</p></div>
    <div><label class="f" for="np_model">모델</label><select class="in" id="np_model">${opt([...NAI_MODELS,...(NAI_MODELS.some(m=>m[0]===c.model)?[]:[[c.model,c.model]])],c.model)}</select></div></div>
    <div class="g2"><div><label class="f" for="np_size">크기</label><select class="in" id="np_size">${opt(sizes,sz)}</select></div>
    ${k==='char'||ILK(k)?`<div><label class="f" for="np_frame">구도</label><select class="in" id="np_frame">${opt(NAI_FRAMES,frame)}</select></div>`:'<div></div>'}</div>
    ${k==='char'||ILK(k)?`<div class="g2"><div><label class="f" for="np_posesel">자세</label><select class="in" id="np_posesel">${c.poses.map(x=>`<option value="${esc(x.t)}" ${x.t===pose?'selected':''}>${esc(x.n)}</option>`).join('')}<option value="__custom" ${c.poses.some(x=>x.t===pose)?'':'selected'}>직접 입력</option></select></div><div><label class="f" for="np_pose">자세 태그</label><input class="in" id="np_pose" value="${esc(pose)}"></div></div>`:''}
    ${imgProvider()==='comfy'?'<p class="muted" style="margin:8px 0 0">ComfyUI로 그려요. 모델·샘플러는 워크플로를 따르고, 레퍼런스와 img2img는 NovelAI 전용이라 쓰지 않아요.</p>':''}
    <label class="f" for="np_in">${k==='cg'?'장면 프롬프트 (전체)':'최종 프롬프트'} (직접 고쳐도 돼요)</label><textarea class="in" id="np_in" style="min-height:120px">${esc(p.input)}</textarea>
    ${k==='cg'&&p.chars.length?`<h3 class="sec">캐릭터별 프롬프트</h3>${p.chars.map((x,i)=>`<div class="cgrow"><div class="g2"><div><label class="f">${esc(x.name)}</label><select class="in" id="np_cp${i}">${opt(CG_POS_LABEL,x.pos)}</select></div><div></div></div><textarea class="in" id="np_cc${i}" data-cid="${x.id}">${esc(x.prompt)}</textarea></div>`).join('')}<p class="muted" style="margin:4px 0 0">위치는 2명 이상일 때 적용돼요. 하나라도 자동이 아니면 좌표를 써요.</p>`:''}
    <label class="f" for="np_neg">네거티브</label><textarea class="in" id="np_neg">${esc(p.neg)}</textarea>
    ${canRef?`<div class="optbox"><label class="f"><input type="checkbox" id="np_ref" ${k!=='char'&&autoRefOn(k)?'checked':''}> ${k==='cg'?'등장 '+T('crew')+' 스탠딩을 캐릭터 레퍼런스로':'지금 스탠딩을 캐릭터 레퍼런스로 (얼굴과 머리 유지)'}</label>
      <div class="g4"><div><label class="f" for="np_rtype">종류</label><select class="in" id="np_rtype">${opt([['character','캐릭터'],['character&style','캐릭터+화풍'],['style','화풍만']],c.ref.type)}</select></div><div><label class="f" for="np_rstr">강도</label><select class="in" id="np_rstr">${opt([[1,'1.0'],[0.8,'0.8'],[0.6,'0.6'],[0.4,'0.4']],c.ref.strength)}</select></div><div><label class="f" for="np_rfid">충실도</label><select class="in" id="np_rfid">${opt([[1,'1.0'],[0.8,'0.8'],[0.6,'0.6'],[0.4,'0.4']],c.ref.fidelity)}</select></div><div></div></div>
      <p class="muted" style="margin:4px 0 0">캐릭터 레퍼런스는 V4.5에서만 돼서 이번 생성은 ${esc(isV45(c.refModel)?c.refModel:'nai-diffusion-4-5-full')}로 그려요. Anlas가 더 들 수 있어요.</p></div>`:''}
    ${hasImg?`<div class="optbox"><label class="f"><input type="checkbox" id="np_i2i"> 지금 이미지를 바탕으로 다시 그리기 (img2img)</label>
      <div class="g2"><div><label class="f" for="np_istr">변화량</label><select class="in" id="np_istr">${opt([[0.4,'0.4 조금'],[0.55,'0.55'],[0.7,'0.7'],[0.85,'0.85'],[1,'1.0 많이']],0.55)}</select></div><div><label class="f" for="np_inoise">노이즈</label><select class="in" id="np_inoise">${opt([[0,'0'],[0.1,'0.1'],[0.2,'0.2']],0)}</select></div></div></div>`:''}
    <div class="g2"><div><label class="f" for="np_seed">시드 (비우면 랜덤)</label><input class="in" id="np_seed" type="number" value="${esc(NLASTSEED[id]||'')}" placeholder="랜덤"></div><div></div></div>
    ${k==='char'||k==='cg'||ILK(k)?`<label class="f"><input type="checkbox" id="np_keep" checked> 다음에 이 이미지를 그릴 때도 화풍${k==='cg'?'·위치':'·자세·구도'} 유지</label>`:''}
    <p class="muted" style="margin:6px 0 0">가중치는 <code>1.3::태그::</code>(강하게), <code>0.7::태그::</code>(약하게), 작가 태그는 <code>artist:이름</code>으로 써요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="naigo">그리기</button></div>`);
}
function reNaiPrep(){
  if(!NPREP) return; const o=naiTarget(NPREP.kind,NPREP.id); if(!o) return;
  const st=$('#np_style').value;
  if(NPREP.k==='cg'){ const p=composeCG(o,{styleId:st}); $('#np_in').value=p.input; $('#np_neg').value=p.neg; return; }
  const p=composeNai(NPREP.k,NPREP.base,{pose:$('#np_pose')?$('#np_pose').value:'',styleId:st,frame:$('#np_frame')?$('#np_frame').value:''}); $('#np_in').value=p.input; $('#np_neg').value=p.neg;
}
/* 그림 생성 결과 창 내용(View) */
function naiResultHTML(o,op,k,url,job){ return `${head('생성 결과',`<span class="muted">${esc(o.name)} · ${esc(op.usedModel)} · 시드 ${op.usedSeed}${op.usedTp?' · 투명 배경':''}</span>`)}<div class="naiprev ${k} done"><img src="${url}" alt="${esc(o.name)}" data-original-src="${esc(job.originalSrc)}"></div>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="naiuse">이걸로 등록</button><button class="btn ghost" data-act="naiagain">다시 뽑기</button><button class="btn ghost" data-act="naiedit">설정 고치기</button></div>`; }
/* 그리는 중 창 내용(View) */
function naiDrawingHTML(o,k){ return `${head('그리는 중',`<span class="muted">${esc(o.name)}</span>`)}<div class="naiprev ${k}"><div class="spin"></div></div><p class="muted" id="nai_stat" style="text-align:center">보통 10~30초 걸려요. 창을 닫으면 결과를 버려요.</p>`; }
/* 일괄 생성 진행 창 내용(View) */
function naiBatchHTML(items){ return `${head('일괄 생성')}<p id="nbStat">0 / ${items.length}</p><p class="muted">한 장씩 그려서 자동으로 등록해요. 창을 닫아도 계속 진행돼요.</p><div class="row"><button class="btn ghost" data-act="naistop">중지</button></div>`; }
async function openMaskPainter(src,prev,cb,po){ po=po||{}; const im=await loadImg(src), [W,H]=fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height);
  const mk=document.createElement('canvas'); mk.width=W; mk.height=H; const mx=mk.getContext('2d'); mx.fillStyle='#000'; mx.fillRect(0,0,W,H);
  if(prev){ try{ const pm=await loadImg(prev); mx.drawImage(pm,0,0,W,H); }catch(e){ quietErr(e,'0030-image/010-engine.js:774'); } }
  const d=document.createElement('div'); d.className='mpaint';
  d.innerHTML=`<div class="mp-bar"><b>${esc(po.title||'얼굴 범위 칠하기')}</b><button type="button" data-m="brush" class="on">✎ 칠하기</button><button type="button" data-m="erase">⌫ 지우개</button><label>크기 <input type="range" min="8" max="120" value="40"></label><button type="button" data-m="auto">얼굴 자동</button><button type="button" data-m="clear">비우기</button><span class="mp-sp"></span><button type="button" data-m="cancel">취소</button><button type="button" data-m="save" class="ok">저장</button></div>
    <div class="mp-stage"><canvas></canvas></div><p class="mp-tip">바꾸고 싶은 얼굴 부분(눈·눈썹·입)을 빨갛게 칠해 주세요. 머리카락·옷은 칠하지 않는 게 좋아요. 한 번 저장하면 모든 표정에 같이 써요.</p>`;
  document.body.appendChild(d);
  const cv=d.querySelector('canvas'), x=cv.getContext('2d'), stage=d.querySelector('.mp-stage');
  const fit=()=>{ const sw=stage.clientWidth-16, sh=stage.clientHeight-16, s=Math.min(sw/W,sh/H); cv.width=Math.round(W*s); cv.height=Math.round(H*s); draw(); };
  const tint=document.createElement('canvas'); tint.width=W; tint.height=H; const tx=tint.getContext('2d');
  const draw=()=>{ x.clearRect(0,0,cv.width,cv.height); x.fillStyle='#ddd'; x.fillRect(0,0,cv.width,cv.height); x.drawImage(im,0,0,cv.width,cv.height);
    tx.clearRect(0,0,W,H); tx.drawImage(mk,0,0); tx.globalCompositeOperation='source-in'; tx.fillStyle='rgba(255,40,80,1)'; tx.fillRect(0,0,W,H); tx.globalCompositeOperation='source-over';
    const id=mx.getImageData(0,0,W,H).data, t=tx.getImageData(0,0,W,H); for(let i=0;i<id.length;i+=4){ t.data[i+3]=id[i]>127?140:0; } tx.putImageData(t,0,0); x.drawImage(tint,0,0,cv.width,cv.height); };
  let mode='brush', size=40, down=false, last=null;
  const pt=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]; };
  const stroke=(a,b)=>{ mx.strokeStyle=mode==='erase'?'#000':'#fff'; mx.lineWidth=size*W/cv.width; mx.lineCap='round'; mx.beginPath(); mx.moveTo(a[0],a[1]); mx.lineTo(b[0],b[1]); mx.stroke(); };
  cv.addEventListener('pointerdown',e=>{ down=true; cv.setPointerCapture(e.pointerId); last=pt(e); stroke(last,last); draw(); });
  cv.addEventListener('pointermove',e=>{ if(!down) return; const p=pt(e); stroke(last,p); last=p; draw(); });
  cv.addEventListener('pointerup',()=>{ down=false; }); cv.addEventListener('pointercancel',()=>{ down=false; });
  d.querySelector('input[type=range]').addEventListener('input',e=>{ size=+e.target.value; });
  d.querySelector('.mp-bar').addEventListener('click',e=>{ const el=e.target.closest('button'); if(!el) return; const m=el.dataset.m;
    if(m==='brush'||m==='erase'){ mode=m; d.querySelectorAll('[data-m=brush],[data-m=erase]').forEach(q=>q.classList.toggle('on',q===el)); }
    else if(m==='clear'){ mx.fillStyle='#000'; mx.fillRect(0,0,W,H); draw(); }
    else if(m==='auto'){ const tall=H/W>1.25; mx.fillStyle='#fff'; mx.beginPath(); mx.ellipse(W*0.5,H*(tall?0.12:0.24),W*(tall?0.1:0.16),H*(tall?0.055:0.11),0,0,Math.PI*2); mx.fill(); draw(); toast('얼굴 위치를 대충 칠했어요. 맞지 않으면 고쳐 주세요'); }
    else if(m==='cancel'){ d.remove(); if(po.onCancel) po.onCancel(); }
    else if(m==='save'){ const id=mx.getImageData(0,0,W,H).data; let n=0; for(let i=0;i<id.length;i+=4) if(id[i]>127) n++; if(!n){ toast('얼굴 부분을 먼저 칠해 주세요'); return; } d.remove(); cb(mk.toDataURL('image/png')); } });
  addEventListener('resize',fit,{once:false}); setTimeout(fit,30); }
/* 표정 하나 크게 보기 창 · 표정 칩 다시 표시(View) */
function openFaceView(c,f){ openModal(`${head(esc(c.name)+' · '+esc(f.name))}<div class="naiprev char done">${imgSrc(f)?`<img src="${esc(imgSrc(f))}" alt="">`:''}</div><div class="row" style="margin-top:12px"><button class="btn ghost" data-act="facedel" data-id="${c.id}" data-f="${f.id}">삭제</button><button class="btn" data-act="char" data-id="${c.id}">돌아가기</button></div>`); }
function faceChipsShow(){ document.querySelectorAll('[data-act=facesel]').forEach(b=>chipOn(b,FACESEL.has(b.dataset.v))); }
function openFaces(id,sid){
  const c=charById(id); if(!c) return; if($('#ov').hidden) MBACK=()=>openChar(id); if(sid!==undefined) FACET={cid:id,sid:sid||''}; else if(FACET.cid!==id) FACET={cid:id,sid:''};
  const F=faceTgt(c), names=[...new Set([...FACE_BASIC,...F.faces.map(f=>f.name)])], up=faceUpperObj(c,F), mk=F.faceMask||{}, cm=naiCfg().model||NAI_DEF.model;
  FACEOPT=FACEOPT||{m:'inpaint',body:'both',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1};
  const thumb=(o,l)=>`<span>${o&&imgSrcRaw(o)?`<img src="${esc(imgSrcRaw(o))}" alt="">`:'<i class="fc-empty">없음</i>'}${l}</span>`;
  openModal(`${head(`${esc(c.name)} 표정`,`<span class="muted">${F===c?'기본 모습':esc(T('skin'))+' 「'+esc(F.name)+'」'}</span>`)}
    ${(c.skins||[]).length?`<div class="chips" style="margin:0 0 8px"><button class="chip ${F===c?'on':''}" data-act="facetgt" data-id="${esc(id)}" data-s="">기본</button>${c.skins.map(k=>`<button class="chip ${F===k?'on':''}" data-act="facetgt" data-id="${esc(id)}" data-s="${k.id}">${esc(T('skin'))}: ${esc(k.name)}</button>`).join('')}</div>`:''}
    <div class="fc-grid">${names.map(nm=>{ const f=F.faces.find(x=>x.name===nm); return `<div class="fc-it"><div class="fc-two">${thumb(f,'전신')}${thumb(f&&f.up,'상반신')}</div><b>${esc(nm)}</b><div class="row"><button class="btn sm ghost" data-act="faceup" data-id="${esc(id)}" data-v="${esc(nm)}">전신 ${f&&imgSrc(f)?'바꾸기':'넣기'}</button><button class="btn sm ghost" data-act="faceup" data-id="${esc(id)}" data-v="${esc(nm)}" data-b="up">상반신 ${f&&f.up&&imgSrc(f.up)?'바꾸기':'넣기'}</button>${f?`<button class="btn sm ghost" data-act="facedel" data-id="${esc(id)}" data-v="${esc(nm)}">✕</button>`:''}</div></div>`; }).join('')}</div>
    <div class="row" style="margin-top:8px"><input class="in" id="fc_new" placeholder="새 표정 이름 (예: 삐짐)" style="flex:1"><button class="btn sm" data-act="faceupnew" data-id="${esc(id)}">이 이름으로 넣기</button><button class="btn sm ghost" data-act="faceupmany" data-id="${esc(id)}">여러 장 넣기</button></div>
    <h4 class="sec">NovelAI로 만들기</h4>
    ${imgSrcRaw(F)?'':`<p class="muted">먼저 ${F===c?'기본':'이 '+esc(T('skin'))+'의'} 스탠딩이 있어야 해요.</p>`}
    <div class="row" style="margin:0 0 6px"><button class="btn sm ghost" data-act="facebasic">기본 6종 고르기 (${FACE_BASIC.join('·')})</button></div>
    <div class="chips">${FACE_PRESETS.map(([ko])=>`<button class="chip ${FACESEL.has(ko)?'on':''}" data-act="facesel" data-v="${ko}" data-id="${id}">${ko}${F.faces.some(f=>f.name===ko&&imgSrc(f))?' ✓':''}</button>`).join('')}</div>
    <div class="g2"><div><label class="f" for="fc_m">만드는 방법</label><select class="in" id="fc_m">${opt([['inpaint','얼굴만 다시 그리기 (인페인팅 · 추천)'],['raw','감정을 넣어 새로 그리기 (V5 전용, 같은 시드)'],['i2i','스탠딩을 바탕으로 다시 그리기 (img2img)'],['emo','NAI 표정 변환 (변화가 약할 수 있음)']],FACEOPT.m)}</select></div>
      <div><label class="f" for="fc_body">그릴 그림</label><select class="in" id="fc_body">${opt([['both','전신 + 상반신'],['full','전신만'],['up','상반신만']],FACEOPT.body)}</select></div></div>
    <div class="g2"><div><label class="f" for="fc_model">그림 모델</label><select class="in" id="fc_model">${opt(NAI_MODELS.filter(m=>/^nai-diffusion-(5|4-5)/.test(m[0])),FACEOPT.model)}</select></div>
      <div><label class="f" for="fc_lv">변화 강도</label><select class="in" id="fc_lv">${opt([[0,'강하게'],[1,'조금 강하게'],[2,'보통'],[3,'약하게']],FACEOPT.lv)}</select></div></div>
    <label class="f" style="margin-top:6px"><input type="checkbox" id="fc_ref" ${FACEOPT.ref?'checked':''}> 캐릭터 레퍼런스도 함께 (얼굴을 더 똑같이 · V4.5로 그려져요)</label>
    <div class="optbox" style="margin-top:6px"><b style="font-size:.85rem">얼굴 범위 (인페인팅용)</b> <span class="muted" style="font-size:.76rem">한 번 칠해 두면 모든 표정에 같이 써요</span>
      <div class="row" style="margin-top:6px"><button class="btn sm ${mk.full?'':'ghost'}" data-act="facemask" data-id="${esc(id)}" data-b="full" ${imgSrcRaw(F)?'':'disabled'}>${mk.full?'✓ ':''}전신에 칠하기</button><button class="btn sm ${mk.up?'':'ghost'}" data-act="facemask" data-id="${esc(id)}" data-b="up" ${up?'':'disabled'}>${mk.up?'✓ ':''}상반신에 칠하기</button>${up?'':'<span class="muted" style="font-size:.74rem">상반신 그림이 없어요</span>'}</div></div>
    <label class="f" for="fc_x">추가 프롬프트 (선택)</label><input class="in" id="fc_x" placeholder="예: blush, teary eyes">
    <p class="muted" id="fc_stat"></p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="facego" data-id="${id}">선택한 표정 만들기</button></div>`);
}
function faceOptRead(){ if(!$('#fc_m')) return; FACEOPT={m:$('#fc_m').value,body:$('#fc_body').value,model:$('#fc_model').value,ref:$('#fc_ref').checked,lv:+$('#fc_lv').value}; }
function openSkin(id){
  const c=charById(id); MBACK=()=>openChar(id);
  openModal(`${head(`${esc(c.name)} ${T('skin')} 만들기`)}
    <p class="muted">기본은 설정의 모델(V5 Full 권장)로 투명 배경 스탠딩을 그려요. 얼굴을 원본과 더 똑같이 맞추고 싶으면 아래에서 캐릭터 레퍼런스를 켜세요(V4.5로 그려지고 흰 배경을 지워요).</p>
    <label class="f" for="sk_name">${T('skin')} 이름</label><input class="in" id="sk_name" placeholder="예: 축제 유카타">
    <label class="f" for="sk_idea">의상 아이디어</label><input class="in" id="sk_idea" placeholder="예: 남색 유카타, 머리에 꽃장식, 손에 종이 등불">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiskin" data-id="${id}">AI로 프롬프트 쓰기</button></div>
    <label class="f" for="sk_prompt">NAI 프롬프트</label><textarea class="in" id="sk_prompt" placeholder="1girl, solo, ..." data-nai-blocks="${esc(JSON.stringify({...naiBlocksOf(c),outfit:'',combined:naiBlocksJoin({...naiBlocksOf(c),outfit:''})}))}">${esc(naiBlocksJoin({...naiBlocksOf(c),outfit:''}))}</textarea>
    <label class="f" for="sk_pose">자세</label><select class="in" id="sk_pose">${naiCfg().poses.map(p=>`<option value="${esc(p.t)}" ${p.t===(c.naiPose||NAI_FRONT)?'selected':''}>${esc(p.n)}</option>`).join('')}</select>
    <div class="optbox"><label class="f"><input type="checkbox" id="sk_ref" ${imgSrc(c)?'':'disabled'}> 지금 스탠딩을 캐릭터 레퍼런스로 (선택)</label>
    <div class="g2"><div><label class="f" for="sk_fid">충실도</label><select class="in" id="sk_fid">${opt([[1,'1.0 (원본에 가깝게)'],[0.8,'0.8'],[0.6,'0.6']],1)}</select></div><div></div></div>
    <div class="g2"><div><label class="f" for="sk_str">레퍼런스 강도</label><select class="in" id="sk_str">${opt([[1,'강하게 (얼굴 유지)'],[0.8,'보통'],[0.6,'약하게']],1)}</select></div><div><label class="f" for="sk_style">그림체도 따라가기</label><select class="in" id="sk_style">${opt([['1','예'],['0','아니요']],'1')}</select></div></div></div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="skingo" data-id="${id}">그리기</button></div>
    ${(c.skins||[]).length?`<h3 class="sec">만든 ${T('skin')}</h3><p class="muted" style="margin:0 0 6px;font-size:.8rem">${T('skin')}마다 스탠딩·상반신·일러스트·돌파 CG를 따로 둘 수 있어요. ${T('skin')}을 입히면 있는 그림은 ${T('skin')} 것을, 로비 일러스트·돌파 CG가 없으면 스킨의 상반신이나 스탠딩을 써요. 스탠딩 사용이 꺼져 있으면 이 스킨의 상반신이 필요해요.</p>${c.skins.map(k=>skinCard(c,k)).join('')}`:''}`);
}
function skinCard(c,k){
  const slot=(x,l,o)=>`<div class="sk-slot ${x==='illust'||x==='lbcg'?'wide':''}">${o&&imgSrcRaw(o)?`<img src="${esc(imgSrcRaw(o))}" alt="">`:'<span>없음</span>'}<b>${l}</b><div class="sk-acts"><button class="btn sm" data-act="skpartgen" data-id="${c.id}" data-s="${k.id}" data-x="${x}">그리기</button><button class="btn sm ghost" data-act="skpartup" data-id="${c.id}" data-s="${k.id}" data-x="${x}">올리기</button>${o&&o.img?XBTN('skinpart',c.id,` data-s="${k.id}" data-x="${x}"`,'✕'):''}</div></div>`;
  return `<div class="sk-card"><div class="sk-h"><b>${esc(k.name)}</b><span><button class="btn sm" data-act="skpartall" data-id="${c.id}" data-s="${k.id}">빈 칸 모두 그리기</button> <button class="btn sm ghost" data-act="skindel" data-id="${c.id}" data-s="${k.id}">삭제</button></span></div>
    <details><summary>의상 프롬프트 편집</summary><textarea class="in" id="skin_prompt_${k.id}" data-skin-prompt="${k.id}" data-owner="${c.id}">${esc(k.prompt||'')}</textarea><button class="btn sm" data-act="skinpromptsave" data-id="${c.id}" data-s="${k.id}">프롬프트 저장</button><p class="muted">저장한 내용은 이후 새로 그리는 그림에 적용돼요. 기존 그림은 유지돼요.</p></details><div class="sk-grid">${slot('stand','스탠딩',k)}${slot('upper','상반신',k.upper)}${slot('illust','일러스트',k.illust)}${slot('lbcg',T('limit')+' CG',k.lbcg)}</div>
    <label class="f" for="skscene_${k.id}">일러스트·${T('limit')} CG 장면 태그 (선택)</label><input class="in" id="skscene_${k.id}" value="${esc(k.scene||'')}" placeholder="예: beach, sunset, waves, smile">
    <div class="sk-extra"><b>표정</b> ${(k.faces||[]).filter(f=>imgSrc(f)).map(f=>`<span class="sk-face"><img src="${esc(imgSrc(f))}" alt=""><i>${esc(f.name)}</i></span>`).join('')||'<span class="muted">없음 · 없으면 이 '+esc(T('skin'))+' 스탠딩을 써요</span>'}<button class="btn sm ghost" data-act="faces-open" data-id="${c.id}" data-s="${k.id}">표정 만들기</button></div>
    <div class="sk-extra"><b>대사</b> <span class="muted">${(k.lines||[]).length?esc((k.lines||[]).slice(0,2).join(' / '))+((k.lines||[]).length>2?' …':''):'없음 · 없으면 기본 대사를 써요'}</span><button class="btn sm ghost" data-act="skinlines" data-id="${c.id}" data-s="${k.id}">${(k.lines||[]).length?'대사 다시 쓰기':'AI로 대사 쓰기'}</button></div>
    <div class="sk-extra"><b>목소리</b> <span class="muted">${k.voiceId?esc(k.voiceName||'지정됨'):'기본 목소리'}</span><button class="btn sm ghost" data-act="voice" data-id="${c.id}" data-s="${k.id}">${k.voiceId?'바꾸기':'이 '+esc(T('skin'))+' 목소리 고르기'}</button>${k.voiceId?`<button class="btn sm ghost" data-act="skvclear" data-id="${c.id}" data-s="${k.id}">기본으로</button>`:''}</div></div>`; }
/* src/main/0030-image/020-candidates.js에서 옮김 */
/* IMAGE_CANDIDATES_MODULE */
/* Generated-image gallery. Images are borrowed; no draft or selection is changed here. */
function imagePreviewClose(){const view=document.getElementById('generated-image-preview');if(!view)return false;view._cleanup?.();const focus=view._returnFocus;view.remove();if(focus?.isConnected)focus.focus({preventScroll:true});return true;}
function imagePreviewOpen(src,alt,options={}){
 if(!src)return;const old=document.getElementById('generated-image-preview'),focus=old?old._returnFocus:document.activeElement;imagePreviewClose();
 const items=options.items?.length?options.items.map(x=>typeof x==='string'?{url:x}:x):[{url:src,alt}],original=options.originalSrc||'';
 let index=Math.max(0,Math.min(items.length-1,Number.isInteger(options.index)?options.index:items.findIndex(x=>x.url===src))),comparing=false,flashTimer;
 const view=document.createElement('div');view.id='generated-image-preview';view.tabIndex=-1;view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','생성 이미지 크게 보기');view._returnFocus=focus;
 view.style.cssText='position:fixed;inset:0;z-index:26000;background:#000;display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px);touch-action:none;overscroll-behavior:contain;user-select:none';
 view.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;flex:none"><span data-preview-counter role="status" aria-live="polite" style="color:white;padding:8px"></span><button type="button" class="btn sm ghost" data-preview-action="compare" ${original?'':'disabled'} title="${original?'누르는 동안 기존에 등록된 이미지를 표시합니다':'기존에 등록된 이미지가 없습니다'}" style="flex:none;touch-action:none;transform:translate(-12px,8px)">기존 이미지 보기</button></div><div data-preview-stage style="position:relative;flex:1;min-height:0;width:100%;overflow:hidden"><img data-preview-image draggable="false" style="display:block;width:100%;height:100%;object-fit:contain;pointer-events:none"><span data-preview-label hidden style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#000b;color:white;padding:4px 12px;pointer-events:none">기존 이미지</span><button type="button" data-preview-action="previous" aria-label="이전 이미지" style="position:absolute;left:0;top:0;bottom:0;width:50%;background:transparent;border:0;padding:0"></button><button type="button" data-preview-action="next" aria-label="다음 이미지" style="position:absolute;right:0;top:0;bottom:0;width:50%;background:transparent;border:0;padding:0"></button></div><div style="display:flex;justify-content:flex-end;align-items:center;min-height:60px;flex:none"><button type="button" class="btn sm" data-preview-action="close" style="flex:none;transform:translate(-12px,-8px)">닫기</button></div>`;
 const img=view.querySelector('[data-preview-image]'),counter=view.querySelector('[data-preview-counter]'),label=view.querySelector('[data-preview-label]'),compare=view.querySelector('[data-preview-action=compare]'),stage=view.querySelector('[data-preview-stage]');
 function paint(){img.src=comparing?original:items[index].url;img.alt=comparing?'기존에 등록된 이미지':items[index].alt||alt||'생성된 이미지';counter.textContent=(index+1)+'/'+items.length;label.hidden=!comparing;view.dataset.index=String(index);view.dataset.comparing=String(comparing);compare.setAttribute('aria-pressed',String(comparing));}
 function hold(e){if(!original)return;e?.preventDefault();comparing=true;paint();if(e?.pointerId!=null)try{compare.setPointerCapture(e.pointerId);}catch(_){} }
 function release(){if(!comparing)return;comparing=false;paint();}
 function flash(side){stage.querySelector('[data-preview-edge]')?.remove();clearTimeout(flashTimer);const edge=document.createElement('div');edge.dataset.previewEdge=side;edge.style.cssText='position:absolute;top:0;bottom:0;width:33%;pointer-events:none;opacity:.3;'+side+':0;background:linear-gradient(to '+(side==='left'?'right':'left')+',rgba(255,255,255,1) 0%,rgba(255,255,255,.45) 45%,rgba(255,255,255,0) 100%)';stage.append(edge);if(edge.animate)edge.animate([{opacity:0},{opacity:.35,offset:.25},{opacity:0}],{duration:300,fill:'forwards'});flashTimer=setTimeout(()=>edge.remove(),320);}
 function move(delta){if(comparing)return;const next=index+delta;if(next<0||next>=items.length){flash(delta<0?'left':'right');return;}index=next;paint();}
 view._move=move;view._cleanup=()=>{clearTimeout(flashTimer);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};
 for(const event of ['pointerdown','touchstart'])compare.addEventListener(event,hold,{passive:false});
 for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave','touchend','touchcancel'])compare.addEventListener(event,release);
 compare.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')hold(e);});compare.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')release();});compare.addEventListener('contextmenu',e=>e.preventDefault());compare.addEventListener('blur',release);window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
 view.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const action=e.target.closest('[data-preview-action]')?.dataset.previewAction;if(action==='close')imagePreviewClose();else if(action==='previous')move(-1);else if(action==='next')move(1);});
 view.addEventListener('wheel',e=>e.preventDefault(),{passive:false});view.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});paint();document.body.append(view);view.focus({preventScroll:true});
}
function imagePreviewThumbnail(img){
 if(img.closest('#image-candidate-dialog')&&IMAGE_CANDIDATES){const d=IMAGE_CANDIDATES,index=[...document.querySelectorAll('.image-candidate-grid img')].indexOf(img);imagePreviewOpen(img.currentSrc||img.src,img.alt,{items:d.items.map((x,i)=>({url:x.url,alt:'후보 '+(i+1)})),index,originalSrc:d.config.originalSrc});return;}
 imagePreviewOpen(img.currentSrc||img.src,img.alt,{originalSrc:img.dataset.originalSrc||''});
}
function imageCandidateBack(){if(imagePreviewClose())return true;if(!IMAGE_CANDIDATES)return false;IMAGE_CANDIDATES.back();return true;}
function imageCandidates(generate,initial={}){
 if(IMAGE_CANDIDATES)return Promise.reject(Object.assign(new Error('열려 있는 이미지 선택창을 먼저 마쳐 주세요.'),{code:'image_busy'}));
 return new Promise((resolve,reject)=>{
  const project=typeof PJ==='function'?PJ().active:null,root=document.createElement('div');root.id='image-candidate-dialog';
  root.style.cssText='position:fixed;inset:0;z-index:25000;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto';
  const d={root,phase:'count',count:1,selected:-1,items:[],busy:false,stopped:false,closed:false,round:0,config:{...initial},positions:{},error:''};IMAGE_CANDIDATES=d;
  let pulse=0;const controller=()=>new AbortController();
  function paintStatus(){const el=root.querySelector('#image-candidate-status');if(!el)return;el.textContent=d.busy?(d.stopped?'중단 중 · 현재 요청이 끝나면 중단합니다':(d.progress||`${d.items.length+1}/${d.count}장 이미지 생성 중`)+'.'.repeat(pulse%3+1)):`${d.items.length}/${d.count}장 생성 완료${d.stopped?' · 중단됨':''}`;}
  const timer=setInterval(()=>{if(!valid()){d.cancel();return;}pulse++;paintStatus();},450);
  const valid=()=>!d.closed&&IMAGE_CANDIDATES===d&&(typeof PJ!=='function'||PJ().active===project);
  const release=()=>{imagePreviewClose();for(const x of d.items)URL.revokeObjectURL(x.url);d.items=[];d.selected=-1;};
  const finish=(blob)=>{if(!valid()){d.cancel();return;}d.closed=true;d.round++;clearInterval(timer);d.controller?.abort();release();root.remove();IMAGE_CANDIDATES=null;if(blob)resolve(blob);else reject(imageCandidateAbort());};
  d.cancel=()=>{if(d.closed)return;d.closed=true;d.round++;clearInterval(timer);d.controller?.abort();release();root.remove();if(IMAGE_CANDIDATES===d)IMAGE_CANDIDATES=null;reject(imageCandidateAbort());};
  d.back=()=>{if(d.phase==='settings'){d.phase='results';render();return;}d.cancel();};
  function render(){
   if(!valid()){d.cancel();return;}
   const previous=root.querySelector('.sheet'),outerScroll=root.scrollTop;if(previous)d.positions[previous.dataset.phase]=previous.scrollTop;const selected=d.items[d.selected],disabled=d.busy||!selected;
   root.innerHTML=`<section class="sheet" data-phase="${d.phase}" role="dialog" aria-modal="true" aria-labelledby="image-candidate-title" style="width:100%;max-width:1000px;max-height:92dvh;overflow:auto"><div class="row" style="justify-content:space-between"><h2 id="image-candidate-title">${d.phase==='count'?'몇 장을 그릴까요?':d.phase==='settings'?'생성 설정 고치기':'생성 결과 선택'}</h2><button class="btn ghost sm" data-candidate="close" aria-label="${d.phase==='settings'?'결과로 돌아가기':'이미지 생성 취소'}" style="flex:0 0 32px;width:32px;height:32px;min-width:32px;min-height:32px;padding:0;font-size:22px;line-height:1;align-self:flex-start">×</button></div>${d.phase==='count'?`<p class="muted">2장·4장은 한 장씩 순서대로 생성한 뒤 하나를 골라 등록합니다.</p><div class="row">${[1,2,4].map(n=>`<button class="btn" data-candidate="count" data-count="${n}" style="flex:1">${n}장</button>`).join('')}</div>`:d.phase==='settings'?`${initial.prompt!==undefined?`<label class="f">프롬프트<textarea class="in" data-candidate-field="prompt" style="min-height:120px">${esc(d.config.prompt||'')}</textarea></label>`:''}${initial.neg!==undefined?`<label class="f">네거티브<textarea class="in" data-candidate-field="neg">${esc(d.config.neg||'')}</textarea></label>`:''}<label class="f">생성 장수<select class="in" data-candidate-field="count">${[1,2,4].map(n=>`<option value="${n}" ${d.count===n?'selected':''}>${n}장</option>`).join('')}</select></label><p class="muted">기존 그림 AI·크기·레퍼런스 설정은 유지합니다. 다시 생성하면 이전 후보는 폐기됩니다.</p><div class="row"><button class="btn" data-candidate="apply-settings">이 설정으로 다시 뽑기</button><button class="btn ghost" data-candidate="results">결과로 돌아가기</button></div>`:`<p role="status" aria-live="polite" id="image-candidate-status">${d.busy?`${d.items.length+1}/${d.count}장 생성 중${d.stopped?' · 현재 요청이 끝나면 중단합니다':'<span class="image-candidate-dots">…</span>'}`:`${d.items.length}/${d.count}장 생성 완료${d.stopped?' · 중단됨':''}`}</p>${d.error?`<p role="alert" style="color:#ffb4b4">${esc(d.error)}</p>`:''}<div class="image-candidate-grid" style="display:grid;grid-template-columns:repeat(${Math.min(d.count,2)},minmax(0,1fr));gap:10px;align-items:start">${Array.from({length:d.count},(_,i)=>{const x=d.items[i],on=d.selected===i;return `<div style="min-width:0;padding:4px;border:2px solid ${on?'#fff':'transparent'};border-radius:12px;${on?'background:color-mix(in srgb,var(--accent,#7b6bff) 22%,transparent)':''}"><div class="image-candidate-frame" style="background:#0003;border-radius:8px;overflow:hidden">${x?`<img src="${esc(x.url)}" alt="후보 ${i+1}" role="button" tabindex="0" aria-label="후보 ${i+1} 크게 보기" style="display:block;width:100%;height:auto;object-fit:contain;cursor:zoom-in">`:`<span class="muted" style="display:block;padding:32px 8px;text-align:center">${i+1}번</span>`}</div><button class="btn ${on?'':'ghost'}" data-candidate="select" data-index="${i}" aria-pressed="${on}" ${!x||d.busy?'disabled':''} style="width:100%;margin-top:8px;white-space:normal;${on?'outline:2px solid white;outline-offset:1px':''}">${on?'✓ 선택됨':'선택'}</button></div>`;}).join('')}</div><div class="image-candidate-actions"><button class="btn" data-candidate="register" ${disabled?'disabled':''} style="${disabled?'opacity:.35;cursor:default':''}">이걸로 등록</button><button class="btn ghost" data-candidate="again" ${d.busy?'disabled':''}>다시 뽑기</button><button class="btn ghost" data-candidate="settings" ${d.busy?'disabled':''}>설정 고치기</button>${d.busy?`<button class="btn ghost" data-candidate="stop" ${d.stopped?'disabled':''}>생성 중단</button>`:'<button class="btn ghost" data-candidate="discard">폐기후 닫기</button>'}</div><p class="muted">${d.count>1?'이미지 아래의 선택 버튼을 누른 뒤 등록해 주세요. ':''}등록 전에는 기존 이미지가 바뀌지 않습니다.</p>`}</section>`;
   paintStatus();const sheet=root.querySelector('.sheet');sheet.style.overflowAnchor='none';sheet.scrollTop=d.positions[d.phase]||0;root.scrollTop=outerScroll;
  }
  async function run(){
   release();d.error='';d.progress='';d.stopped=false;d.busy=true;d.phase='results';d.controller=controller();const round=++d.round;render();
   const prepared={...d.config};
   if(initial.prepare){try{await initial.prepare(prepared,message=>{if(valid()&&round===d.round){d.progress=message;paintStatus();}},d.controller.signal);}catch(e){if(!valid()||round!==d.round)return;if(!d.stopped)d.error='장면 구성 실패: '+naiErr(e);d.busy=false;render();return;}if(!valid()||round!==d.round)return;if(d.stopped){d.busy=false;render();return;}}
   Object.assign(d.config,prepared);d.progress='';paintStatus();
   for(let i=0;i<d.count;i++){
    if(!valid()||round!==d.round||d.stopped)break;
    const config={...prepared};if(i>0||round>1)config.seed='';
    try{paintStatus();const blob=await generate(config,i,d.controller.signal);if(!valid()||round!==d.round)return;if(d.stopped)break;d.items.push({blob,url:URL.createObjectURL(blob),config:{...config}});}
    catch(e){if(!valid()||round!==d.round)return;d.error=`${i+1}번째 이미지 생성 실패: ${naiErr(e)}${d.items.length?' · 완료된 후보는 선택해 등록할 수 있어요.':''}`;break;}
    if(i+1<d.count)render();
   }
   if(!valid()||round!==d.round)return;d.busy=false;if(d.count===1&&d.items.length){d.selected=0;if(initial.prepare){d.items[0].blob.__candidateConfig=d.items[0].config;finish(d.items[0].blob);return;}}render();
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-candidate]');if(!b||b.disabled||!valid())return;const a=b.dataset.candidate;
   if(a==='close'){d.back();return;}
   if(a==='count'){d.count=Number(b.dataset.count);if(d.count===1&&!initial.prepare){d.closed=true;clearInterval(timer);root.remove();IMAGE_CANDIDATES=null;Promise.resolve().then(()=>generate({...d.config},0)).then(resolve,reject);}else run();return;}
   if(a==='stop'){d.stopped=true;d.controller?.abort();render();return;}
   if(d.busy)return;
   if(a==='discard'){d.cancel();return;}
   if(a==='select'){const i=Number(b.dataset.index);if(d.items[i]){d.selected=i;for(const [j,card]of [...root.querySelector('.image-candidate-grid').children].entries()){const on=j===i,b=card.querySelector('[data-candidate=select]');card.style.borderColor=on?'#fff':'transparent';card.style.background=on?'color-mix(in srgb,var(--accent,#7b6bff) 22%,transparent)':'';b.className='btn'+(on?'':' ghost');b.textContent=on?'✓ 선택됨':'선택';b.setAttribute('aria-pressed',String(on));b.style.outline=on?'2px solid white':'';b.style.outlineOffset=on?'1px':'';}const register=root.querySelector('[data-candidate=register]');register.disabled=false;register.style.opacity='';register.style.cursor='';}return;}
   if(a==='register'){const x=d.items[d.selected];if(!x)return;try{x.blob.__candidateRegistered=true;x.blob.__candidateConfig=x.config;}catch(_){}finish(x.blob);return;}
   if(a==='again'){run();return;}
   if(a==='settings'){d.phase='settings';render();return;}
   if(a==='results'){d.phase='results';render();return;}
   if(a==='apply-settings'){for(const el of root.querySelectorAll('[data-candidate-field]')){const k=el.dataset.candidateField;if(k==='count')d.count=Number(el.value);else d.config[k]=el.value;}d.config.promptParts=naiBlocksFieldParts(root.querySelector('[data-candidate-field=prompt]'));run();}
  });
  const style=document.getElementById('image-candidate-style');if(!style){const s=document.createElement('style');s.id='image-candidate-style';s.textContent='@keyframes imageCandidateDots{0%,100%{opacity:.3}50%{opacity:1}}.image-candidate-dots{display:inline-block;animation:imageCandidateDots .9s infinite}#image-candidate-dialog button:disabled{pointer-events:none}.image-candidate-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.image-candidate-actions>.btn.ghost:not(:disabled){background:#443952;color:#fff;border:1px solid #a293b5;opacity:1;box-shadow:inset 0 1px 0 #ffffff18}.image-candidate-actions>.btn.ghost:not(:disabled):hover{background:#574969;border-color:#d9cbea}.image-candidate-actions>.btn.ghost:not(:disabled):active{background:#65547a}.image-candidate-actions>.btn:disabled{opacity:.35}.image-candidate-actions>.btn{width:100%;min-width:0;padding-inline:10px;min-height:44px;white-space:normal;word-break:keep-all;overflow-wrap:normal}@media(min-width:640px){.image-candidate-actions{grid-template-columns:repeat(4,minmax(0,1fr))}}';document.head.append(s);}
  document.body.append(root);render();
 });
}
// Lock only the page/sheets below the top image dialog; keep its own scroll usable.
function imageScrollGuard(){
 const locks=new Map();let savedPage=null,touch=null;
 const top=()=>document.getElementById('app-confirm-dialog')||document.getElementById('generated-image-preview')||document.getElementById('image-candidate-dialog')||document.getElementById('v2-icon-dialog')||(()=>{const m=document.getElementById('modal');return m&&!m.hidden&&m.querySelector('.naiprev,#np_in,#cutCv,.skp-img,.preset-code-sheet')?m:null;})();
 function sync(){if(typeof document==='undefined'||!document?.body)return;const root=top(),targets=root?[document.documentElement,document.body,...document.querySelectorAll('#app main,#modal>.sheet,#v2-icon-dialog>.sheet,#image-candidate-dialog>.sheet')].filter(el=>!root.contains(el)):[];
  for(const [el,old]of locks)if(!targets.includes(el)){for(const [k,v,priority]of old.styles){if(v)el.style.setProperty(k,v,priority);else el.style.removeProperty(k);}el.scrollTop=old.y;el.scrollLeft=old.x;locks.delete(el);}
  if(root&&!savedPage){savedPage={x:window.scrollX,y:window.scrollY,styles:['position','top','left','width'].map(k=>[k,document.body.style.getPropertyValue(k),document.body.style.getPropertyPriority(k)])};document.body.style.position='fixed';document.body.style.top=-savedPage.y+'px';document.body.style.left=-savedPage.x+'px';document.body.style.width='100%';}
  for(const el of targets)if(!locks.has(el)){locks.set(el,{styles:['overflow','overscroll-behavior'].map(k=>[k,el.style.getPropertyValue(k),el.style.getPropertyPriority(k)]),x:el.scrollLeft,y:el.scrollTop});el.style.setProperty('overflow','hidden');el.style.setProperty('overscroll-behavior','none');}
  if(!root&&savedPage){const old=savedPage;savedPage=null;for(const [k,v,p]of old.styles){if(v)document.body.style.setProperty(k,v,p);else document.body.style.removeProperty(k);}window.scrollTo(old.x,old.y);}
 }
 function consumes(target,root,dy,dx){for(let el=target?.nodeType===1?target:target?.parentElement;el&&root.contains(el);el=el.parentElement){const css=getComputedStyle(el);if(/auto|scroll/.test(css.overflowY||css.overflow)&&el.scrollHeight>el.clientHeight+1&&(dy<0?el.scrollTop>0:dy>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1))return true;if(!dy&&/auto|scroll/.test(css.overflowX||css.overflow)&&el.scrollWidth>el.clientWidth+1&&(dx<0?el.scrollLeft>0:dx>0&&el.scrollLeft+el.clientWidth<el.scrollWidth-1))return true;}return false;}
 document.addEventListener('wheel',e=>{const root=top();if(root&&(!root.contains(e.target)||!consumes(e.target,root,e.deltaY,e.deltaX)))e.preventDefault();},{capture:true,passive:false});
 document.addEventListener('touchstart',e=>{const t=e.touches[0];touch=t?{x:t.clientX,y:t.clientY}:null;},{capture:true,passive:true});
 document.addEventListener('touchmove',e=>{const root=top(),t=e.touches[0];if(!root||!t||!touch)return;const dx=touch.x-t.clientX,dy=touch.y-t.clientY;touch={x:t.clientX,y:t.clientY};if(!root.contains(e.target)||!consumes(e.target,root,dy,dx))e.preventDefault();},{capture:true,passive:false});
 new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});sync();
}
/* src/main/0030-image/0310-art-after-ai.js에서 옮김 */
function artAfterAI(snap,label){
  if(!imgReady()) return;
  const mode=naiCfg().autoArt||'ask'; if(mode==='off') return;
  const fresh=drawTodo().filter(x=>typeof snap==='function'?snap(x):!snap.has(artKey(x))); if(!fresh.length) return;
  const keys=new Set(fresh.map(artKey));
  if(mode==='auto'){ artRun(keys); toast(`새 그림 ${fresh.length}장을 뒤에서 그려요`); return; }
  let tries=0; const show=()=>{ if((!$('#modal').hidden||!$('#ov').hidden)&&tries++<200) return setTimeout(show,3000); if(!$('#modal').hidden) return;
    ART_ASK=keys; const cnt={}; fresh.forEach(x=>{const n=({upper:'상반신',char:'스탠딩',illust:'일러스트',bg:'배경',enemy:'적',icon:'아이콘',map:'지도',cg:'CG',prop:'소품',weapon:T('weapon')})[x.cat]||x.cat; cnt[n]=(cnt[n]||0)+1;});
    openModal(`${head('새 그림을 그릴까요?',`<span class="muted">${esc(label||'AI가 새로 만든 것')}</span>`)}
      <p style="margin:0 0 8px">새로 생긴 그림 <b>${fresh.length}장</b> · ${Object.entries(cnt).map(([k,v])=>esc(k)+' '+v).join(', ')}</p>
      <p class="muted" style="margin:0 0 12px">게임을 하는 동안 뒤에서 한 장씩 그려요. 위쪽 진행 표시에서 언제든 멈출 수 있어요.</p>
      <div class="row"><button class="btn" data-act="artgo">그리기</button><button class="btn ghost" data-act="close">나중에</button></div>
      <button class="linkb" data-act="artalways" style="margin-top:10px">앞으로는 묻지 않고 자동으로 그리기</button>`); };
  setTimeout(show,600);
}
/* src/main/0030-image/0330-casting.js에서 옮김 */
function npcCardHTML(n){ const st=imgSrc(n), up=n.upper&&imgSrc(n.upper), busy=NPCBUSY.has(n.id);
  return `<div class="npc-card" id="npc_${n.id}"><div class="npc-imgs"><div>${st?`<img src="${esc(st)}" alt="">`:'<span>스탠딩 없음</span>'}<i>스탠딩</i></div><div>${up?`<img src="${esc(up)}" alt="">`:'<span>상반신 없음</span>'}<i>상반신</i></div></div>
    <div class="npc-f"><div class="g2"><div><label class="f">이름</label><input class="in" data-nf="name" value="${esc(n.name)}" maxlength="20"></div><div><label class="f">역할</label><input class="in" data-nf="role" value="${esc(n.role||'')}" placeholder="예: 정보상"></div></div>
    <label class="f">설정 <span class="muted" style="font-size:.76rem">(성격·과거·누구와 어떤 사이인지, 짧게 · 스토리를 쓸 때 AI가 참고해요)</span></label><textarea class="in" data-nf="profile" style="min-height:56px" maxlength="600" placeholder="예: 항구 뒷골목의 정보상. 돈만 밝히는 척하지만 카야에게는 빚이 있어서 공짜로 정보를 준다.">${esc(n.profile||'')}</textarea>
    <label class="f">말투</label><input class="in" data-nf="speech" value="${esc(n.speech||'')}" maxlength="80" placeholder="예: 느긋한 반말, '~라구'를 붙임">
    <label class="f">외모 (한국어 메모)</label><input class="in" data-nf="look" value="${esc(n.look||'')}" placeholder="예: 은발 단발, 검은 정장, 안경">
    <label class="f">외형 프롬프트 (그림 AI 영어 태그)</label><textarea class="in" data-nf="naiPrompt" style="min-height:70px" placeholder="1girl, solo, short silver hair, glasses, black suit">${esc(n.naiPrompt||'')}</textarea>
    <div class="row" style="margin-top:6px"><button class="btn sm" data-act="npcsave" data-id="${n.id}">저장</button>${SAMPLE?`<button class="btn sm ghost" data-act="npctags" data-id="${n.id}">✦ 외모로 태그 쓰기</button>`:''}</div>
    <div class="row" style="margin-top:6px">${imgReady()?`<button class="btn sm" data-act="npcdraw" data-k="char" data-id="${n.id}" ${busy?'disabled':''}>${busy?'그리는 중…':st?'스탠딩 다시 그리기':'스탠딩 그리기'}</button><button class="btn sm ghost" data-act="npcdraw" data-k="upper" data-id="${n.id}" ${busy?'disabled':''}>${up?'상반신 다시 그리기':'상반신 그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="npc" data-id="${n.id}">스탠딩 올리기</button><button class="btn sm ghost" data-act="upload" data-k="npcup" data-id="${n.id}">상반신 올리기</button>${n.img?XBTN('npc',n.id,'','스탠딩 지우기'):''}${n.upper&&n.upper.img?XBTN('npcup',n.id,'','상반신 지우기'):''}<button class="btn sm ghost" data-act="npcdel" data-id="${n.id}">삭제</button></div></div></div>`; }
function openNpcs(){ const L=G.npcs||[]; openModal(`${head('NPC',`<span class="muted">${L.length}명 · 스토리 조연</span>`)}
    <p class="muted" style="margin:0 0 10px;font-size:.82rem">외형 프롬프트를 고치고 '저장'한 뒤 다시 그리면 새 모습으로 바뀌어요. 스토리 대본에 같은 이름으로 나오면 그 그림이 떠요.</p>
    ${L.map(npcCardHTML).join('')||'<p class="muted">아직 NPC가 없어요.</p>'}
    <div class="row" style="margin-top:10px"><input class="in" id="npc_new" placeholder="새 NPC 이름" maxlength="20" style="flex:1"><button class="btn sm" data-act="npcadd">추가</button></div>
    ${SAMPLE?`<button class="btn sm ghost block" style="margin-top:8px" data-act="npcscan">✦ 스토리에 자주 나온 인물을 NPC로 추가 (그림 프롬프트까지)</button>`:''}`); }
function npcRefresh(id){ const n=(G.npcs||[]).find(x=>x.id===id), el=document.getElementById('npc_'+id); if(n&&el){ const t=document.createElement('div'); t.innerHTML=npcCardHTML(n); el.replaceWith(t.firstElementChild); } }
function castCardHTML(c){ const q=CAST&&CAST.busy, bz=k=>q&&q.c===c.id&&q.k===k, wq=k=>CAST&&CAST.q.some(x=>x.c===c.id&&x.k===k), fs=imgSrc(c), us=c.upper&&imgSrc(c.upper), nf=(c.faces||[]).filter(f=>imgSrc(f)).length;
  const box=(k,src,lbl)=>`<div class="cast-im ${k}">${src?`<img src="${esc(src)}" alt="${esc(c.name)} ${lbl}">`:''}${bz(k)?'<span class="cast-st">그리는 중…</span>':wq(k)?'<span class="cast-st">순서 기다리는 중</span>':src?'':'<span class="cast-st">아직 없음</span>'}<b>${lbl}</b></div>`;
  return `<div class="cast-card" data-cid="${c.id}"><div class="cast-hd">${c.npc?'<span class="cast-npc">NPC</span>':`<span class="cs-rar r${c.rarity}">${RL[c.rarity]}</span>`}<b>${esc(c.name)}</b><i>${esc(c.faction||'')}</i></div>
    <div class="cast-ims">${box('full',fs,'전신')}${box('up',us,'상반신')}</div>
    ${nf?`<div class="cast-fc">${(c.faces||[]).filter(f=>imgSrc(f)).map(f=>`<span title="${esc(f.name)}"><img src="${esc((f.up&&imgSrc(f.up))||imgSrc(f))}" data-full="${esc(imgSrc(f))}" alt="${esc(f.name)}"><i>${esc(f.name)}</i></span>`).join('')}</div>`:''}
    <div class="cast-btns"><button class="btn sm ghost" data-act="castre" data-id="${c.id}" data-k="full">⟳ 전신</button><button class="btn sm ghost" data-act="castre" data-id="${c.id}" data-k="up">⟳ 상반신</button><button class="btn sm ghost" data-act="castface" data-id="${c.id}" ${fs&&!c.npc?'':'disabled'}>😊 표정${nf?' '+nf:''}</button></div></div>`; }
function showCast(){ if(!CAST) CAST={q:[],busy:null};
  const cs=castChars(); cs.forEach(c=>{ if(!imgSrc(c)&&!CAST.q.some(x=>x.c===c.id&&x.k==='full')&&!(CAST.busy&&CAST.busy.c===c.id&&CAST.busy.k==='full')) CAST.q.push({c:c.id,k:'full'}); if(c.upper&&!imgSrc(c.upper)&&!CAST.q.some(x=>x.c===c.id&&x.k==='up')&&!(CAST.busy&&CAST.busy.c===c.id&&CAST.busy.k==='up')) CAST.q.push({c:c.id,k:'up'}); });
  $('#ov').innerHTML=`<div class="setup cast-wrap"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card cast-sheet">
    <div class="sw-logo"><i>CASTING</i><b>${esc(G.meta.title)}</b></div>
    <p class="muted" style="margin:0 0 6px;font-size:.85rem">⟳ 다시 뽑기 · 😊 표정 · 그림을 누르면 크게</p>
    <div class="row" style="margin:0 0 6px"><button class="btn sm" data-act="castfaces">😊 표정 한꺼번에 만들기 (인페인팅)</button></div>
    <p class="muted" id="castStat" style="margin:0 0 10px;font-size:.8rem"></p>
    <div class="cast-grid" id="castGrid">${cs.map(castCardHTML).join('')}</div>
    <div class="sw-btns" style="margin-top:12px"><button class="btn" data-act="castok">이 모습으로 시작</button><button class="btn ghost" data-act="castskip">나중에 정하기</button></div>
  </div></div>`; $('#ov').hidden=false; castStat(); castRun(); }
function openCastFaces(){ const cs=castChars().filter(c=>!c.npc&&imgSrc(c)); if(!cs.length){ toast('먼저 전신을 그려 주세요'); return; } if(!CFSEL) CFSEL={faces:new Set(FACE_BASIC.filter(x=>x!=='평온')),chars:new Set(cs.map(c=>c.id)),body:'both'};
  const names=[...new Set([...FACE_BASIC,...FACE_PRESETS.map(p=>p[0])])];
  openModal(`${head('표정 한꺼번에 만들기','<span class="muted">얼굴만 다시 그리기(인페인팅)</span>')}
    <p class="muted" style="margin:0 0 8px">캐릭터마다 얼굴 범위를 한 번씩 칠하면(이미 칠했으면 건너뜀), 고른 표정을 모두 차례로 그려요. 얼굴 범위는 한 번 칠하면 모든 표정에 같이 써요.</p>
    <label class="f">표정</label><div class="chips">${names.map(n=>`<button class="chip ${CFSEL.faces.has(n)?'on':''}" data-act="cfsel" data-k="f" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <label class="f">캐릭터</label><div class="chips">${cs.map(c=>{ const nf=(c.faces||[]).filter(f=>imgSrc(f)).length; return `<button class="chip ${CFSEL.chars.has(c.id)?'on':''}" data-act="cfsel" data-k="c" data-v="${c.id}">${esc(c.name)}${nf?' · '+nf:''}</button>`; }).join('')}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cfall" data-k="c" data-v="1">캐릭터 모두 고르기</button><button class="btn sm ghost" data-act="cfall" data-k="c" data-v="0">모두 빼기</button></div>
    <label class="f" style="margin-top:8px"><input type="checkbox" id="cf_skip" ${CFSEL.skip!==false?'checked':''}> 이미 그린 표정은 건너뛰기</label>
    <label class="f" for="cf_body">그릴 그림</label><select class="in" id="cf_body">${opt([['both','전신 + 상반신'],['full','전신만'],['up','상반신만']],CFSEL.body)}</select>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="cfgo">얼굴 범위 칠하고 시작</button></div>`); }
function castFacesGo(){ CFSEL.body=$('#cf_body')?$('#cf_body').value:'both'; CFSEL.skip=$('#cf_skip')?$('#cf_skip').checked:true; if(!CAST) CAST={q:[],busy:null}; /* 게임 중(유닛 탭)에도 같은 줄로 그려요 */ const faces=[...CFSEL.faces], cs=castChars().filter(c=>CFSEL.chars.has(c.id)&&!c.npc&&imgSrc(c));
  if(!faces.length||!cs.length){ toast('표정과 캐릭터를 하나 이상 골라 주세요'); return; } closeModal();
  const jobs=[]; cs.forEach(c=>{ (CFSEL.body==='both'?['full','up']:[CFSEL.body]).forEach(b=>{ const o=b==='up'?c.upper:c; if(o&&imgSrc(o)) jobs.push({c,b,o}); }); });
  let i=0; const next=()=>{ while(i<jobs.length&&(jobs[i].c.faceMask||{})[jobs[i].b]) i++;
    if(i>=jobs.length){ let n=0; jobs.forEach(j=>{ if(!(j.c.faceMask||{})[j.b]) return; faces.forEach(name=>{ const have=(j.c.faces||[]).find(q=>q.name===name), done=have&&(j.b==='up'?have.up&&imgSrc(have.up):imgSrc(have)); if(CFSEL.skip&&done) return; if(!CAST.q.some(x=>x.c===j.c.id&&x.k==='face'&&x.name===name&&x.b===j.b)){ CAST.q.push({c:j.c.id,k:'face',name,b:j.b}); n++; } }); }); castRefresh(); toast(n?`표정 ${n}장을 차례로 그려요`:'그릴 표정이 없어요'); castRun(); return; }
    const j=jobs[i], tot=jobs.filter(x=>!(x.c.faceMask||{})[x.b]).length;
    openMaskPainter(imgSrc(j.o),null,url=>{ j.c.faceMask=Object.assign({},j.c.faceMask||{},{[j.b]:url}); mark('c:'+j.c.id); i++; next(); },{title:`${j.c.name} · ${j.b==='up'?'상반신':'전신'} 얼굴 범위 (남은 ${tot})`,onCancel:()=>{ for(let k=jobs.length-1;k>=i;k--) if(jobs[k].c===j.c) jobs.splice(k,1); next(); }}); };
  next(); }
function castStat(){ const el=$('#castStat'); if(!CAST) return; if(!el){ const n=CAST.q.length+(CAST.busy?1:0); if(n) liveBar(`😊 표정 그리는 중… 남은 ${n}장${CAST.busy&&CAST.busy.k==='face'?' · '+((castById(CAST.busy.c)||{}).name||'')+' '+CAST.busy.name:''} · 그동안 플레이해도 돼요`); else if(CAST.wasIngame){ liveBar(null); CAST.wasIngame=false; toast('표정을 모두 그렸어요'); } if(n) CAST.wasIngame=true; return; } const n=CAST.q.length+(CAST.busy?1:0); el.textContent=n?`그릴 그림 ${n}장 남음${CAST.busy&&CAST.busy.k==='face'?' · '+(castById(CAST.busy.c)||{}).name+' 표정 '+CAST.busy.name:''} · 한 장에 10~30초`:'모두 그렸어요. 마음에 들면 「이 모습으로 시작」'; }
function castRefresh(id){ const g=$('#castGrid'); if(!g){ castStat(); return; } const one=c=>{ const el=g.querySelector(`[data-cid="${c.id}"]`); if(el) el.outerHTML=castCardHTML(c); }; if(id){ const c=castById(id); if(c) one(c); } else castChars().forEach(one); castStat(); }
/* 캐스팅 창 캐릭터 칩 모두 켜기/끄기(View) */
function castCharChipsShow(on){ document.querySelectorAll('#modal [data-act="cfsel"][data-k="c"]').forEach(b=>chipOn(b,on)); }
/* src/main/0030-image/0565-asset-library.js에서 옮김 */
async function openAssets(tab){ if(tab) AM_TAB=tab; const tabs=[['shared','공유 보관함'],['game','이 게임 자료'],['emote','감정 아이콘']]; let body='';
  if(AM_TAB==='shared'){ const L=shList(); const srcs=await Promise.all(L.map(x=>shAudio(x.kind)?null:shSrc(x)));
    body=`<p class="muted" style="font-size:.82rem">모든 게임이 함께 쓰는 자료예요. 이 게임 자료에서 '보관함에 넣기'로 넣고, 여기서 '가져오기'로 지금 게임에 넣어요. 새 장을 만들 때 같은 이름의 배경·소품이 생기면 자동으로 가져와요.</p>
    ${L.length?L.map((x,i)=>`<div class="ep">${srcs[i]?`<img src="${esc(srcs[i])}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px">`:`<span style="width:48px;text-align:center">${shAudio(x.kind)?'♪':'—'}</span>`}<span class="t"><b>${esc(x.name)}</b><span class="muted">${esc(SH_KINDS[x.kind]||x.kind)} · ${esc(x.from||'')}${G.lib.some(l=>l.kind===x.kind&&l.name===x.name&&(l.img||l.audio))?' · 이 게임에 있음':''}</span></span><button class="btn sm" data-act="amtake" data-id="${x.id}">가져오기</button><button class="btn sm ghost" data-act="amshdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted">아직 비어 있어요</p>'}`; }
  else if(AM_TAB==='game'){ const U=libUsage(), D=libDupes(), L=G.lib.filter(l=>SH_KINDS[l.kind]), unused=L.filter(l=>['bg','prop'].includes(l.kind)&&!U[l.name]&&!l.alias);
    body=`<p class="muted" style="font-size:.82rem">자료 ${L.length}개 · 대본에서 안 쓰는 배경·소품 ${unused.length}개 · 중복 ${D.length}개</p>
    ${D.length?`<div class="panel" style="padding:8px"><b>중복</b> (같은 프롬프트·이름): ${D.map(x=>`${esc(x.dup.name)} → ${esc(x.keep.name)}`).join(', ')}<div class="row" style="margin-top:6px"><button class="btn sm" data-act="ammerge">그림 1장으로 합치기 (${D.length})</button>${AUDIT_UNDO?`<button class="btn sm ghost" data-act="amundo">되돌리기</button>`:''}</div></div>`:''}
    <div class="row" style="gap:6px;margin:6px 0"><button class="btn sm ghost" data-act="amadopt">보관함에서 같은 이름 자료 채우기</button></div>
    ${L.map(l=>{ const s=shAudio(l.kind)?null:imgSrc(l); return `<div class="ep">${s?`<img src="${esc(s)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px">`:`<span style="width:48px;text-align:center">${shAudio(l.kind)?(l.audio?'♪':'—'):'—'}</span>`}<span class="t"><b>${esc(l.name)}</b><span class="muted">${esc(SH_KINDS[l.kind])} · 대본 ${U[l.name]||0}번${l.alias?' · 별칭':''}${l.shared?' · 보관함':''}</span></span>${(s||l.audio)&&!l.alias?`<button class="btn sm ghost" data-act="amput" data-id="${l.id}">보관함에 넣기</button>`:''}</div>`; }).join('')}`; }
  else { body=`<p class="muted" style="font-size:.82rem">대본의 [표정|하트] · [연출: 이름 땀] · [스티커: 화남]에 쓰는 감정 아이콘이에요. 그림을 올리면 기본 아이콘 대신 써요(공유 보관함에 넣으면 다른 게임에서도).</p>
    <div style="display:flex;flex-wrap:wrap;gap:10px">${Object.keys(EMOTES).map(k=>{ const l=G.lib.find(x=>x.kind==='emote'&&x.name===k); return `<div style="width:92px;text-align:center"><div style="height:60px">${emoteHTML(k,true).replace('class="emo big','class="emo big still')}</div><b style="font-size:.8rem">${esc(k)}</b><label class="btn sm ghost" style="display:block;margin-top:4px">그림<input type="file" accept="image/*" hidden data-amemo="${esc(k)}"></label>${l?`<button class="btn sm ghost" data-act="amemodel" data-id="${l.id}" style="margin-top:2px">기본으로</button>`:''}</div>`; }).join('')}</div>`; }
  openModal(`${head('에셋 관리','<span class="muted">공유·재사용</span>')}<div class="row" style="gap:4px;margin-bottom:8px">${tabs.map(([k,l])=>`<button class="btn sm ${AM_TAB===k?'':'ghost'}" data-act="amtab" data-k="${k}">${l}</button>`).join('')}</div>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
function assetPanel(){ const sh=shList().length, d=libDupes().length; return `<div class="panel pm-hide"><h3>에셋 관리 ${d?`<span class="badge">중복 ${d}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">공유 보관함 ${sh}개 · 게임끼리 배경·소품·음악·감정 아이콘을 재사용하고, 중복 자료를 합치고, 안 쓰는 자료를 찾아요.</p><button class="btn sm" data-act="amopen">에셋 관리</button></div>`; }
/* src/main/0030-image/100-images-and-assets.js에서 옮김 */
// 그림 지우기(imgx) 대상: 종류(k)별로 지울 그림 객체·이름·지운 뒤 다시 그릴 화면
function imgTarget(k,id,t){ const re=f=>()=>{ render(); f&&f(); };
  if(k==='char'){ const o=charById(id); return {o,what:o&&o.name+' 스탠딩',after:re(()=>openChar(id))}; }
  if(k==='weapon'){ const c=charById(id); return {o:c&&c.weapon,what:c&&(c.weapon.name||T('weapon'))+' 그림',after:re(()=>openChar(id))}; }
  if(k==='lib'){ const o=libById(id); return {o,what:o&&'「'+o.name+'」 그림',after:re(()=>openLibItem(id))}; }
  if(k==='npc'||k==='npcup'){ const n=(G.npcs||[]).find(x=>x.id===id); return {o:n&&(k==='npc'?n:n.upper),what:n&&n.name+(k==='npc'?' 스탠딩':' 상반신'),after:()=>npcRefresh(id)}; }
  if(k==='shk') return {o:G.meta.shop&&G.meta.shop.self,what:'상점 주인 그림',after:()=>{ SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML='<span>그림 없음</span>'; render(); }};
  if(k==='skinpart'){ const c=charById(id), sk=c&&(c.skins||[]).find(x=>x.id===t.dataset.s), x=t.dataset.x; return {o:sk&&(x==='stand'?sk:skinPart(sk,x)),what:sk&&sk.name+' '+(x==='stand'?'스탠딩':(SKP[x]||'')),after:re(()=>skinRefresh(id))}; }
  return {o:null,what:'그림',after:()=>render()}; }
