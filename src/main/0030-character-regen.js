/* CHARACTER_REGEN_MODULE */
// Partial regeneration stages a draft; only a confirmed, still-current draft can mutate saved data.
let REGEN=null,REGEN_JOB=null,IMGLIB=null;
const unFaceless=s=>String(s||'').replace(/(^|\s*,\s*)(1other\s*,\s*)?faceless\b/gi,(m,pre)=>pre||'').replace(/^[\s,]+/,'').trim();
function charCGs(c){return G.lib.filter(l=>l.kind==='cg'&&(l.cast||[]).some(x=>x.id===c.id));}
function weaponRenameOk(o,n){o=String(o||'').trim();n=String(n||'').trim();return o.length>=3&&n&&o!==n&&!G.chars.some(x=>x.name===o)&&!(G.npcs||[]).some(x=>x.name===o);}
function regenSlot(slot){return Object.prototype.hasOwnProperty.call(GGMCombat.SLOTS,slot)?slot:'active';}
function regenSkillLabel(c,slot){const s=v2Ensure(c)[regenSlot(slot)];return s.name+' — '+v2SkillText(s,regenSlot(slot));}
function regenFields(slot='active'){slot=regenSlot(slot);return [
 ['name','이름·소속',c=>c.name+' / '+(c.faction||'무소속')],['profile','프로필·비밀',c=>String(c.profile||'')],['look','외모 태그 (디자인)',c=>String(c.naiPrompt||'')],
 ['skill',GGMCombat.SLOTS[slot]+' 스킬',c=>regenSkillLabel(c,slot)],['weapon',T('weapon'),c=>c.weapon?c.weapon.name+(c.weapon.desc?' — '+c.weapon.desc:''):''],['lines','대사·반응',c=>(c.lines||[]).slice(0,3).join(' / ')]];}
function regenSourceSnapshot(c){return JSON.stringify(['name','faction','profile','intro','files','naiPrompt','naiBlocks','skill','skills','skillConcept','generation','skillTuning','skillRevisions','weapon','img','upper','illust','lbcg','pose','lbbg','scg','faces','lines','affLines','lvLines','dupLines','touch'].map(k=>[k,c[k]]));}
function regenSourceCurrent(state){return PJ().active===state.project&&charById(state.cid)===state.target&&regenSourceSnapshot(state.target)===state.snapshot;}
function regenAssertCurrent(state){if(!regenSourceCurrent(state))throw new Error('작업 중 캐릭터나 게임이 바뀌었어요. 이전 결과를 덮어쓰지 않았어요. 다시 생성해 주세요.');}
function regenCancelJob(){const job=REGEN_JOB;REGEN_JOB=null;if(job){job.controller.abort();clearInterval(job.timer);}}
function regenCancel(){if(REGEN?.committing)return false;regenCancelJob();REGEN?.controller?.abort();REGEN=null;return true;}
function openRegen(cid){
 if(playMode())return;const c=charById(cid);if(!c)return;if(!SAMPLE){toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');return;}
 regenCancel();v2EnsureEquipment(c);
 openModal(`${head('AI로 다시 만들기',`<span class="muted">${esc(c.name)}</span>`)}<p class="muted">바꿀 항목만 고르세요. 결과를 확인하고 적용하기 전까지 기존 캐릭터는 유지돼요.</p>
 ${regenFields().map(([k,lab,cur])=>`<div class="rg-row"><label><input type="checkbox" data-rgsel="${k}"><b>${k==='skill'?'스킬 (한 슬롯)':esc(lab)}</b><span class="muted">${esc(String(cur(c)).slice(0,80))||'—'}</span></label>${k==='skill'?`<select class="in" id="rg_skill_slot" hidden>${Object.entries(GGMCombat.SLOTS).map(([key,label])=>`<option value="${key}" ${key==='active'?'selected':''}>${label}</option>`).join('')}</select>`:''}<input class="in" data-rgreqi="${k}" placeholder="이 항목 요구사항" hidden></div>`).join('')}
 <label class="f" for="rg_all">전체 요구사항</label><textarea class="in" id="rg_all" style="min-height:52px" placeholder="선택한 항목에 함께 반영할 컨셉"></textarea><div class="row"><button class="btn" data-act="regengo" data-id="${c.id}">✦ 다시 만들기</button><button class="btn ghost" data-act="regencancel" data-id="${c.id}">취소</button></div>`);
 document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>ch.addEventListener('change',()=>{const row=ch.closest('.rg-row');row.querySelectorAll('input.in,select').forEach(el=>el.hidden=!ch.checked);}));
}
function regenSchema(c,sel){const schema={};if(sel.name){schema.name='캐릭터 이름';schema.faction='소속';}if(sel.profile){schema.profile='프로필';schema.intro='첫 인사';schema.files=[{dup:1,text:'비밀 기록'}];}if(sel.look)schema.naiPrompt='NovelAI 영어 외형 태그';if(sel.weapon)schema.weapon={name:'무기 이름',desc:'무기 설명',prompt:'no humans, object focus, weapon, simple background, white background'};if(sel.lines){schema.lines=['로비 대사'];schema.affLines={'4':['호감도 대사']};schema.lvLines=['강화 대사'];schema.dupLines=['돌파 대사'];schema.touch={head:['머리 터치'],body:['몸 터치'],pet:['쓰다듬기']};}return schema;}
function regenWeaponPrompt(prompt){return joinTags('no humans, object focus',tagList(prompt).filter(t=>!(/\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(tagKey(t)))).join(', '),'simple background, white background');}
function regenParseCharacter(c,response,sel){
 const raw=response&&(Array.isArray(response.chars)?response.chars[0]:Array.isArray(response)?response[0]:response);if(!raw||typeof raw!=='object')throw new Error('캐릭터 응답이 객체가 아니에요.');const nc=clone(c);
 const text=(v,label,max=6000)=>{if(typeof v!=='string'||!v.trim())throw new Error(label+' 항목이 비어 있어요.');return v.trim().slice(0,max);};
 if(sel.name){nc.name=text(raw.name,'이름',20);if(typeof raw.faction!=='string')throw new Error('소속을 문자열로 작성해 주세요.');nc.faction=raw.faction.trim().slice(0,100);}
 if(sel.profile){nc.profile=text(raw.profile,'프로필');if(typeof raw.intro==='string')nc.intro=raw.intro.trim().slice(0,1000);if(Array.isArray(raw.files))nc.files=raw.files.filter(x=>x&&typeof x.text==='string'&&x.text.trim()).slice(0,5).map(x=>({dup:num(+x.dup,1,5,1),text:x.text.trim().slice(0,4000)}));}
 if(sel.look){nc.naiPrompt=allyTags(unFaceless(text(raw.naiPrompt,'외모 태그',4000)));const gender=tagList(c.naiPrompt).find(x=>/^(1girl|1boy|1other)$/i.test(tagKey(x)));if(gender&&!tagList(nc.naiPrompt).some(x=>/^(1girl|1boy|1other)$/i.test(tagKey(x))))nc.naiPrompt=joinTags(gender,nc.naiPrompt);}
 if(sel.weapon){if(!raw.weapon||typeof raw.weapon!=='object')throw new Error('무기 항목이 없어요.');nc.weapon={...clone(c.weapon||{}),name:text(raw.weapon.name,'무기 이름',100),desc:text(raw.weapon.desc,'무기 설명',2000),prompt:regenWeaponPrompt(text(raw.weapon.prompt,'무기 프롬프트',4000))};}
 if(sel.lines){if(!Array.isArray(raw.lines)||!raw.lines.some(x=>typeof x==='string'&&x.trim()))throw new Error('로비 대사가 없어요.');nc.lines=strs(raw.lines).slice(0,12);for(const key of ['lvLines','dupLines'])if(Array.isArray(raw[key]))nc[key]=strs(raw[key]).slice(0,4);if(raw.affLines&&typeof raw.affLines==='object'){nc.affLines={};for(const [key,value] of Object.entries(raw.affLines)){const lv=+key;if(Number.isInteger(lv)&&lv>=1&&lv<=10&&Array.isArray(value))nc.affLines[lv]=strs(value).slice(0,8);}}if(raw.touch&&typeof raw.touch==='object'){nc.touch={...nc.touch};for(const key of ['head','body','pet'])if(Array.isArray(raw.touch[key]))nc.touch[key]=strs(raw.touch[key]).slice(0,8);}}
 return nc;
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
    const response=await v2SkillRequest(SAMPLE,`${RULES}\n${NAI_CHAR}\n다음 참고 데이터의 선택한 항목만 다시 작성하세요. 선택하지 않은 항목, 스탯, 스킬, 장비 고유 효과는 출력하지 마세요. 세계관: ${G.world.summary}. 참고 ${JSON.stringify(context)}. ${last?'이전 실패: '+last:''} JSON만 출력: ${JSON.stringify(regenSchema(c,sel))}`,job.controller.signal);
    state.nc=regenParseCharacter(c,response,sel);last=null;break;
   }catch(e){v2CheckCancelled(job.controller.signal);last=v2FailureText(e);regenProgress(job,{kind:'failure',text:`설정 생성 ${attempt}회 실패: ${last}`});if(['bad_key','no_ai','quota','low_credit','not_granted','payment_required','refused','insufficient_quota','model_not_found','sa_bad'].includes(e?.code)||attempt===3)throw e;}}
  }
  regenAssertCurrent(state);
  if(sel.skill){const concept=[global,reqs.skill].filter(Boolean).join('\n'),nc=state.nc;nc.skillConcept=concept||c.skillConcept||'';nc.generation=GGMCombat.generation(c);const base=clone(v2Ensure(c));
   const result=await v2GenerateSelected(nc,slot,concept,base,{signal:job.controller.signal,onEvent:e=>regenProgress(job,e)});v2CheckCancelled(job.controller.signal);
   nc.skills={...base,[slot]:clone(result.kit[slot])};state.report=clone(result.report);state.fallback=!!result.fallback;
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
async function regenApply(){const R=REGEN;if(!R||R.busy)return;const c=charById(R.cid);if(!c)return;try{regenAssertCurrent(R);regenReadPreview(R);}catch(e){toast(e.message);return;}R.busy=true;R.controller=new AbortController();
 const status=t=>{const el=document.getElementById('regen-apply-status');if(el)el.textContent=t;};document.querySelectorAll('[data-act=regenapply],[data-act=regenretry],[data-act=regenedit]').forEach(b=>b.disabled=true);
 try{const nc=R.nc,S=R.sel;let report=R.report;
  if(S.skill){status('선택한 스킬의 최종 유효성과 성능을 확인하는 중…');const errors=GGMCombat.validate(nc.skills);if(errors.length)throw new Error(errors.join(' '));const result=await v2Job('inspectSkill',[v2CharacterInput(nc),{...v2Options(),referenceSlot:R.slot}],{signal:R.controller.signal});v2CheckCancelled(R.controller.signal);if(REGEN!==R)return;if(result.report.status==='strong')throw new Error('세대 기준보다 강해졌어요. 다시 생성하거나 스킬 편집기에서 조정해 주세요.');report=result.report;}
  regenAssertCurrent(R);if(REGEN!==R)return;R.committing=true;const old=c.name,oldWeapon=c.weapon,base=clone(v2Ensure(c)),cleanup=[];
  if(S.name){c.name=nc.name;if(c.name!==old)renameEverywhere(old,c.name);c.faction=nc.faction;const F=G.world.factions=G.world.factions||[];if(c.faction&&!F.some(x=>x.name===c.faction)){F.push({name:c.faction,desc:c.name+'의 소속'});mark('world');}}
  if(S.profile)for(const k of ['profile','intro','files'])if(nc[k]!==undefined)c[k]=clone(nc[k]);
  if(S.look&&nc.naiPrompt!==c.naiPrompt){c.naiPrompt=stripMinor(stripAge(nc.naiPrompt));if(nc.naiBlocks?.naiPrompt)c.naiBlocks={...c.naiBlocks,naiPrompt:clone(nc.naiBlocks.naiPrompt)};for(const o of [c,c.upper,c.illust,c.lbcg,c.pose,c.lbbg,c.scg,...(c.faces||[]),...(c.faces||[]).map(f=>f.up)])if(o&&o.img)cleanup.push(imgClear(o));delete c.faceMask;charCGs(c).forEach(l=>{if(l.img){l.redraw=true;mark('l:'+l.id);}});}
  if(S.weapon){if(oldWeapon?.img)cleanup.push(imgClear(oldWeapon));c.weapon={...oldWeapon,name:nc.weapon.name,desc:nc.weapon.desc,prompt:nc.weapon.prompt,id:'w_'+c.id,img:null};delete c.weapon.seed;const ow=oldWeapon?.name||'',nw=nc.weapon.name;if(weaponRenameOk(ow,nw))renameEverywhere(ow,nw);}
  if(S.skill){c.skills={...base,[R.slot]:clone(nc.skills[R.slot])};c.skillConcept=nc.skillConcept||c.skillConcept||'';c.skillTuning='manual';v2EquipmentSkillSaved(c,R.slot,base[R.slot],c.skills[R.slot],true);c.skillDesignLog=clone(R.history);if(R.fallback)c.skillGenerationWarning='검사한 복구 초안을 사용 중입니다.';else delete c.skillGenerationWarning;delete c.skillGenerationNotice;c.skillBalance={...report,fingerprint:v2Fingerprint(c)};}
  if(S.lines)for(const k of ['lines','affLines','lvLines','dupLines','touch'])if(nc[k]!==undefined)c[k]=clone(nc[k]);
  v2SyncEquipment(c);mark('c:'+c.id);await Promise.allSettled(cleanup);if(REGEN!==R||PJ().active!==R.project)return;REGEN=null;closeModal();render();openChar(c.id);toast('선택한 항목을 적용했어요. 강화 단계는 유지돼요.');
 }catch(e){if(REGEN===R){status(e.name==='AbortError'?'적용을 중단했어요.':e.message);toast(e.message);}}
 finally{R.busy=false;R.committing=false;if(REGEN===R)document.querySelectorAll('[data-act=regenapply],[data-act=regenretry],[data-act=regenedit]').forEach(b=>b.disabled=false);}
}
// One inventory feeds both the gallery and image download list, including skin faces and skill icons.
function charImgItems(c){if(!c)return [];const L=[],add=(k,label,o,group='기본')=>{if(o)L.push({k,label,o,group});};
 for(const [k,label,o] of [['stand','스탠딩',c],['upper','상반신',c.upper],['illust','일러스트',c.illust],['lbcg',T('limit')+' CG',c.lbcg],['scg','기술 컷인',c.scg],['pose','로비 포즈',c.pose],['lbbg','로비 배경',c.lbbg],['weapon',T('weapon'),c.weapon]])add(k,label,o);
 for(const [slot,label] of Object.entries(GGMCombat.SLOTS))add('skill:'+slot,label+' 아이콘',c.skillIcons?.[slot],'스킬 아이콘');
 for(const f of c.faces||[]){add('face:'+f.id,'표정 '+f.name,f,'표정');add('faceup:'+f.id,'표정 '+f.name+' (상반신)',f.up,'표정');}
 for(const k of c.skins||[]){const group=T('skin')+' · '+k.name;add('skin:'+k.id,k.name+' 스탠딩',k,group);for(const part of ['upper','illust','lbcg'])add('skin'+part+':'+k.id,k.name+' '+(SKP[part]||part),k[part],group);for(const f of k.faces||[]){add('skinface:'+f.id,k.name+' · '+f.name,f,group);add('skinfaceup:'+f.id,k.name+' · '+f.name+' (상반신)',f.up,group);}}
 for(const o of Object.values(c.cards||{}))add('card:'+o.id,o.name||'카드',o,'카드');return L;
}
function openImgLib(cid){const c=charById(cid);if(!c)return;if(!IMGLIB||IMGLIB.cid!==cid)IMGLIB={cid,sel:[]};const items=charImgItems(c),has=items.filter(x=>imgSrcRaw(x.o)),cmp=IMGLIB.sel.length===2?IMGLIB.sel.map(i=>items[i]).filter(x=>x&&imgSrcRaw(x.o)):[];
 openModal(`${head(`${esc(c.name)} · 그림 모아 보기`,`<span class="muted">${has.length}/${items.length}장</span>`)}<p class="muted">누르면 크게 보고, 두 장을 고르면 나란히 비교해요.</p>${cmp.length===2?`<div class="imglib-cmp">${cmp.map(x=>`<div><img src="${esc(imgSrcRaw(x.o))}" alt=""><small>${esc(x.label)}</small></div>`).join('')}</div>`:''}<div class="row">${IMGLIB.sel.length?'<button class="btn sm ghost" data-act="ilbclear">선택 풀기</button>':''}</div><div class="imglib-grid">${items.map((x,i)=>{const src=imgSrcRaw(x.o);return `<div class="imglib-it ${src?'':'empty'} ${IMGLIB.sel.includes(i)?'on':''}" ${src?`data-act="ilbtap" data-i="${i}"`:''}>${src?`<img src="${esc(src)}" alt="">`:'<span>없음</span>'}<b>${esc(x.label)}</b>${src?`<button class="del pm-hide" data-act="ilbdel" data-i="${i}" data-image-id="${esc(x.o.id)}" aria-label="지우기">✕</button>`:''}</div>`;}).join('')}</div>`);
}
function ultimateSceneTags(c){const type=v2Ensure(c).ultimate.effects?.[0]?.type;return ['heal','regen','support'].includes(type)?'healing magic, gentle light':['shield','reduction','block','invincible'].includes(type)?'protective barrier, radiant aura':'attacking, special effects';}
function ultimateSceneSnapshot(c){return JSON.stringify([v2Ensure(c).ultimate,c.name,c.faction,c.profile,c.naiPrompt,c.weapon?.name,c.weapon?.desc,c.weapon?.prompt,c.scg]);}
async function requestUltimateScene(c,instructions='',signal){
 if(!SAMPLE)throw new Error('기술 컷인 장면을 구성하려면 설정 → 글 AI를 먼저 등록해 주세요.');
 const s=v2Ensure(c).ultimate,context={name:c.name,profile:c.profile,appearance:c.naiPrompt,weapon:{name:c.weapon?.name,description:c.weapon?.desc,prompt:c.weapon?.prompt},ultimate:{name:s.name,description:v2SkillText(s,'ultimate'),effects:s.effects,fx:s.fx}};
 const response=await v2SkillRequest(SAMPLE,`${RULES}\n현재 캐릭터의 궁극기 컷인 장면을 NovelAI 영어 태그 10~16개로 작성하세요. 궁극기의 실제 효과와 캐릭터 컨셉을 표현하고 설정에 있는 무기만 사용하세요. 치유·보호 궁극기에 공격 동작을 강요하지 마세요. 외모·화풍·노출 태그는 쓰지 마세요. 세계관: ${G.world.summary}. 참고 자료 ${JSON.stringify(context)}. 사용자의 장면 요청(실제 궁극기 효과를 우선): ${instructions}. JSON만 출력: {"tags":"장면 태그"}`,signal);
 if(typeof response?.tags!=='string'||!response.tags.trim())throw new Error('AI가 기술 컷인 장면을 비워서 반환했어요. 다시 뽑기를 눌러 주세요.');
 return response.tags.trim().slice(0,2000);
}
// One scene per candidate round; no character data is saved before image registration.
function generateUltimateCutin(c){
 const o=scgOf(c),project=PJ().active,snapshot=ultimateSceneSnapshot(c),input=document.getElementById('sc_scene'),draft=input?.value;
 const valid=()=>PJ().active===project&&charById(c.id)===c&&ultimateSceneSnapshot(c)===snapshot&&(!input||(input.isConnected&&input.value===draft));
 const check=()=>{if(!valid())throw new Error('캐릭터나 궁극기 설정이 바뀌었어요. 창을 다시 열어 생성해 주세요.');};
 return imageCandidates(async(cfg,index,signal)=>{
  check();v2CheckCancelled(signal);let refs=[];if(autoRefOn('scg'))refs=await standRefs([c]);check();v2CheckCancelled(signal);
  return naiDrawItem0({k:'scg',o:{...o,prompt:cfg.prompt},c},{candidateEligible:false,refs,seed:cfg.seed});
 },{promptBlocks:true,prompt:draft??o.prompt??'',originalSrc:imgSrcRaw(o)||'',prepare:async(cfg,progress,signal)=>{
  check();if(cfg.sceneReady)return;progress('궁극기·캐릭터 컨셉을 바탕으로 컷인 장면 구성 중');
  cfg.sceneTags=await requestUltimateScene(c,cfg.prompt,signal);check();cfg.prompt=cfg.sceneTags;cfg.sceneReady=true;
 }}).then(blob=>{check();return blob;});
}

function illustrationScenePreparation(c,kind,custom){
 const project=PJ().active,target=c[kind],snapshot=JSON.stringify([c.profile,c.naiPrompt,c.faction,target,G.world.summary]);
 const check=()=>{if(PJ().active!==project||charById(c.id)!==c||JSON.stringify([c.profile,c.naiPrompt,c.faction,c[kind],G.world.summary])!==snapshot)throw new Error('캐릭터나 이미지 설정이 바뀌었어요. 창을 다시 열어 생성해 주세요.');};
 const prepare=async(cfg,progress,signal)=>{
  check();if(cfg.sceneReady)return;if(!SAMPLE)throw new Error('설정 → 글 AI를 먼저 등록해 주세요.');
  progress(kind==='lbcg'?'캐릭터·세계관을 바탕으로 최대 돌파 CG 장면 구성 중':'캐릭터·세계관을 바탕으로 일러스트 장면 구성 중');
  const purpose=kind==='lbcg'?`${T('limit')}를 끝까지 해서 플레이어와 가장 가까워진 순간을 담은 특별 일러스트. 감정이 터지는 한 장면, 드라마틱한 빛과 배경`:'로비와 타이틀·픽업 화면에 쓸 대표 일러스트. 캐릭터의 개성과 세계관이 드러나는 배경';
  const response=await v2SkillRequest(SAMPLE,`${RULES}\n세계관: ${G.world.summary}\n캐릭터: ${c.name} (${c.faction||''}, ${ROLE[c.role]}) 프로필: ${c.profile}\n외모 태그(반복하지 말 것): ${c.naiPrompt}\n${purpose}의 장면을 NovelAI 영어 태그 10~16개로 써라. 장소, 시간, 날씨, 빛, 표정, 동작, 소품만 포함한다. 외모·화풍·구도·품질 태그는 쓰지 않는다. 노출이나 성적인 태그는 쓰지 않는다. 사용자의 요청과 준비 프롬프트: ${cfg.prompt}. JSON만 출력: {"tags":"태그, 태그"}`,signal);
  check();if(typeof response?.tags!=='string'||!response.tags.trim())throw new Error('AI가 장면을 비워서 반환했어요. 다시 뽑기를 눌러 주세요.');
  cfg.sceneTags=response.tags.trim().slice(0,2000);
  cfg.prompt=composeNai(kind,joinTags(c.naiPrompt,designTags(c),cfg.sceneTags),{pose:custom.scenePose??'',frame:custom.sceneFrame||target.naiFrame,styleId:custom.sceneStyle||target.naiStyle||c.naiStyle}).input;
  cfg.sceneReady=true;
 };
 prepare.check=check;return prepare;
}

/* /CHARACTER_REGEN_MODULE */
function designFacs(){ const n=f=>G.chars.filter(c=>c.faction===f&&!c.collab).length; return [...new Set([...((G.world&&G.world.factions)||[]).map(f=>f.name),...G.chars.map(c=>c.faction)].filter(Boolean))].sort((a,b)=>n(b)-n(a)); }
function openDesign(){ const d=G.meta.design||{}, facs=designFacs();
  openModal(`${head('캐릭터 디자인 통일','<span class="muted">이 게임의 가챠 캐릭터 그림에 붙는 태그</span>')}
    <p class="muted" style="margin:0 0 8px">스탠딩·상반신·일러스트·돌파 CG·스토리 CG·기술 컷인을 그릴 때 캐릭터 외형 프롬프트 뒤에 붙여요. 제복·상징 색·소재·문장(엠블럼)처럼 다 같이 공유할 디자인을 영어 태그로 적어요. 머리·눈·체형은 캐릭터마다 다르니 넣지 않는 게 좋아요. 바꾼 뒤 새로 그리는 그림부터 적용돼요.</p>
    <label class="f" for="ds_all">공통 (모든 가챠 캐릭터)</label><textarea class="in" id="ds_all" style="min-height:60px" placeholder="예: academy uniform, white and navy color scheme, gold trim, school crest">${esc(d.all||'')}</textarea>
    ${facs.length?`<h3 class="sec">세력별</h3>${facs.map((f,i)=>`<label class="f" for="ds_f${i}">${esc(f)} <span class="muted">· ${G.chars.filter(c=>c.faction===f&&!c.collab).length}명</span></label><textarea class="in" id="ds_f${i}" data-fac="${esc(f)}" style="min-height:50px" placeholder="예: crimson cape, silver rose emblem">${esc(((d.fac||{})[f])||'')}</textarea>`).join('')}`:'<p class="muted">세력이 정해진 캐릭터가 없어서 공통 태그만 쓸 수 있어요.</p>'}
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">스킨(의상)·NPC·다른 세계에서 온 콜라보 캐릭터에는 붙지 않아요. 캐릭터 한 명만 빼려면 그 캐릭터 편집에서 '공통 디자인 태그 쓰지 않기'를 켜요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="dssave">저장</button>${SAMPLE?'<button class="btn ghost" data-act="dsai">✦ AI로 제안 받기</button>':''}</div>`); }
function designRead(){ const fac={}; document.querySelectorAll('#modal [data-fac]').forEach(e=>{ const v=stripMinor(stripAge(e.value.trim())); if(v) fac[e.dataset.fac]=v; }); return {all:stripMinor(stripAge(($('#ds_all')||{}).value?$('#ds_all').value.trim():'')),fac}; }
async function designAI(btn){ const facs=designFacs(), w=G.world||{};
  const r=await aiJSON(`가챠 게임 캐릭터 그림의 디자인 통일성을 위한 NovelAI 영어 태그를 제안하라.
세계관: ${String(w.summary||'').slice(0,600)}
세력: ${(w.factions||[]).map(f=>f.name+'('+String(f.desc||'').slice(0,80)+')').join(', ')||'없음'}
세력별 캐릭터 외형 예시:\n${facs.map(f=>'- '+f+': '+G.chars.filter(c=>c.faction===f).slice(0,3).map(c=>String(c.naiPrompt||'').slice(0,120)).join(' / ')).join('\n')}
규칙: all에는 모든 캐릭터가 공유할 디자인 요소(복장 계열, 공통 상징, 색 조합, 소재) 3~6개, 세력마다 그 세력만의 디자인 요소(제복·상징 색·문장·장식) 3~6개. 머리·눈·체형·나이·표정·구도·배경 태그는 쓰지 않는다. 노출이 많은 의상 태그는 쓰지 않는다. 태그는 쉼표로 구분.
JSON만 출력: {"all":"","factions":[{"name":"세력 이름 그대로","tags":""}]}`,btn,'quick');
  if(!r||typeof r!=='object') return; if(r.all&&$('#ds_all')) $('#ds_all').value=stripMinor(String(r.all));
  (Array.isArray(r.factions)?r.factions:[]).forEach(x=>{ const el=[...document.querySelectorAll('#modal [data-fac]')].find(e=>e.dataset.fac===String(x&&x.name||'').trim()); if(el&&x.tags) el.value=stripMinor(String(x.tags)); });
  toast('제안을 채웠어요. 고친 뒤 저장을 눌러 주세요'); }
// 무기 프롬프트 검사: 사람 태그가 섞였거나 '물건 사진'으로 시작하지 않으면 정리가 필요해요 (PR #3 LTXY12님 아이디어)
function wpBad(p){ const s=String(p||'').trim(); if(!s) return false; return /\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(s)||!/^(no humans|object focus)/i.test(s); }
async function weaponPromptAI(list,btn,world){ const w=world||G.world; const v=list.map(x=>`- ${T('crew')} "${x.c.name}"(${x.c.faction||'무소속'})의 ${T('weapon')} "${x.name||'?'}"${x.desc?' — '+x.desc:''}${x.cur?'\n  지금 프롬프트: '+String(x.cur).slice(0,220):''}`).join('\n');
  const r=await aiJSON(`세계관: ${w.name} — ${String(w.summary||'').slice(0,500)}\n아래 ${T('weapon')}의 NovelAI 프롬프트를 쓴다. ${T('weapon')} 물건만 단독으로 찍은 사진용 태그: "no humans, object focus"로 시작하고 형태·재질·색·디테일을 쓰고 "simple background, white background"으로 끝낸다. 사람·캐릭터 태그(1girl, 1boy, 1other, solo, holding, face 따위)는 절대 쓰지 않는다. 지금 프롬프트가 잘못됐으면 실제 형태(whip, sword, staff, rifle 따위)를 살려 세계관과 캐릭터 설정에 맞게 완성한다.\n${v}\nJSON만 출력: {"weapons":[{"name":"캐릭터 이름","prompt":"no humans, object focus, ..."}]}`,btn||null,'quick');
  const out=list.map(()=>''); (r&&Array.isArray(r.weapons)?r.weapons:[]).forEach(x=>{ const i=list.findIndex(y=>y.c.name===String(x&&x.name||'').trim()), p=String((x&&x.prompt)||'').trim(); const k=i>=0?i:(list.length===1?0:-1); if(k>=0&&p&&!wpBad(p)) out[k]=p; }); return out; }
async function fixWeaponPrompts(chars,world){ try{ const bad=(chars||[]).filter(c=>c&&c.weapon&&wpBad(c.weapon.prompt)); if(!bad.length) return 0; const out=await weaponPromptAI(bad.map(c=>({c,name:c.weapon.name,desc:c.weapon.desc,cur:c.weapon.prompt})),null,world); let n=0; bad.forEach((c,i)=>{ if(out[i]){ c.weapon.prompt=out[i]; try{ mark('c:'+c.id); }catch(e){} n++; } }); return n; }catch(e){ return 0; } }
function allyTags(s){ const L=tagList(s), en=L.some(t=>/^faceless$/i.test(tagKey(t))); return en?L.filter(t=>!/^(faceless|1other|no humans)$/i.test(tagKey(t))).join(', '):String(s||''); }
function charCaption(c,act){return joinTags(tagList(c.naiPrompt).filter(t=>{const k=tagKey(t);return !COMPO_TAGS.test(k)&&!FRAME_TAGS.test(k)&&!/^(1girl|1boy|solo|\d+girls|\d+boys|mature female|adult woman)$/.test(k);}).join(', '),designTags(c),act);}
function composeCG(l,opt){
  opt=opt||{}; const c=naiCfg(), st=naiStyle(c,opt.styleId||l.naiStyle), cast=cgCast(l), n=cast.length;
  // 인원 태그는 각 인물 프롬프트의 1girl/1boy를 세어 만들어요(남성·혼성 게임에서 1girl로 고정되던 문제)
  const sx=cast.map(x=>{ const k=tagList(x.c.naiPrompt).map(tagKey); return k.includes('1boy')?'b':k.includes('1other')?'o':'g'; }), ng=sx.filter(x=>x==='g').length, nb=sx.filter(x=>x==='b').length, no=sx.filter(x=>x==='o').length;
  const count=n?[ng?(ng===1?'1girl':ng+'girls'):'',nb?(nb===1?'1boy':nb+'boys'):'',no?(no===1?'1other':no+'others'):'',n===1?'solo':''].filter(Boolean).join(', '):'no humans';
  return {input:joinTags(st.tags,c.prefix,count,l.prompt,c.parts.cg.suffix),neg:joinTags(c.neg,st.neg,c.parts.cg.neg,n?'child, loli':''),
    chars:cast.map(x=>({name:x.c.name,id:x.c.id,prompt:charCaption(x.c,x.act),uc:'',pos:x.pos}))};
}
function naiDraw(kind,base,opt){
  opt=opt||{};
  if(kind==='cg'){ const p=composeCG(opt.item||{},opt); return naiGenerate(p.input,'cg',Object.assign({},opt,{neg:p.neg,chars:p.chars})); }
  const k=kind==='weapon'?'prop':kind, p=composeNai(k,base,opt); return naiGenerate(p.input,k,Object.assign({},opt,{neg:p.neg}));
}
const SKILL_TAGS={dmg:'attacking, slashing, weapon swing',aoe:'casting spell, magic circle, explosion, energy wave',heal:'casting spell, healing light, sparkles',shield:'magic barrier, shield, defensive stance',buff:'raising hand, aura, cheering, light rays'};
// 스탠딩 레퍼런스: 설정에서 켜면 일러스트·CG(+스킬 컷인·상반신)를 그릴 때 그 캐릭터의 스탠딩을 캐릭터 레퍼런스로 넣어 얼굴·머리를 맞춰요(V4.5로 그려요)
function autoRefOn(k){ const m=naiCfg().autoRef; if(imgProvider()==='comfy'||!m||m==='off') return false; return ['illust','lbcg','cg'].includes(k)||(m==='all'&&['scg','upper'].includes(k)); }
async function standRefs(cs){ const rf=naiCfg().ref||NAI_DEF.ref, out=[]; for(const c of cs){ const src=c&&imgSrc(c); if(!src) continue; try{ out.push({image:await refImage(src),type:rf.type||'character',strength:rf.strength!=null?rf.strength:1,fidelity:rf.fidelity!=null?rf.fidelity:1}); }catch(e){ quietErr(e,'0030-character-regen.js:195'); } if(out.length>=4) break; } return out; }
async function naiDrawItem(it){
  const candidateEligible=imageCandidateEligible(it.k,it.o,it.c,it.generationMode||'automatic'),originalSrc=imgSrcRaw(it.o)||'';
  if(autoRefOn(it.k)){ const cs=it.k==='cg'?cgCast(it.o).map(x=>x.c):[it.c], refs=await standRefs(cs); if(refs.length) return naiDrawItem0(it,{refs,candidateEligible,originalSrc}); }
  return naiDrawItem0(it,{candidateEligible,originalSrc});
}
function naiDrawItem0(it,X){
  const draw=(kind,base,opt={})=>naiDraw(kind,base,{...opt,candidateEligible:X.candidateEligible,originalSrc:X.originalSrc});
  if((it.k==='prop'||it.k==='bg'||(it.k==='enemy'&&!it.o.alias))&&!it.o.prompt) return ensureLibPrompts().then(()=>draw(it.k,it.o.prompt));
  if(it.k==='upper'){ const c=it.c; return draw('char',joinTags(c.naiPrompt,designTags(c),it.o.prompt),Object.assign({frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle},X)); }
  if(it.k==='lbbg'){ const c=it.c; return draw('bg',it.o.prompt||(c.illust&&c.illust.prompt)||'cozy room interior, window, soft light',{}); }
  if(it.k==='pose'){ const c=it.c; return draw('char',joinTags(c.naiPrompt,designTags(c),it.o.prompt),{frame:'cowboy shot',pose:it.o.prompt?'':'dynamic pose, looking at viewer, smile, hand up, white background, simple background',styleId:c.naiStyle}); }
  if(it.k==='scg'){ const c=it.c; return draw('illust',joinTags(c.naiPrompt,designTags(c),it.o.prompt),Object.assign({pose:it.o.prompt?'special effects, motion lines':ultimateSceneTags(c)+', special effects',styleId:c.naiStyle,frame:'upper body'},X)); }
  if(it.k==='illust'||it.k==='lbcg'){ const c=it.c; return draw(it.k,joinTags(c.naiPrompt,designTags(c),it.o.prompt),Object.assign({pose:it.o.naiPose!=null?it.o.naiPose:undefined,styleId:c.naiStyle,frame:it.o.naiFrame},X)); }
  if(it.k==='cg') return draw('cg',null,Object.assign({item:it.o,styleId:it.o.naiStyle},X));
  if(it.k==='char') return draw('char',joinTags(it.o.naiPrompt,designTags(it.o)),{pose:it.o.naiPose||undefined,styleId:it.o.naiStyle,frame:it.o.naiFrame});
  return draw(it.k==='weapon'?'weapon':it.k,it.o.prompt);
}
const NAI_HDR=tok=>({Authorization:'Bearer '+String(tok||'').trim(),'Content-Type':'application/json'});
function naiErr(e,label){
  if(e&&/update to the image URL|refresh NovelAI/i.test(e.message||'')) return 'NovelAI 옛 서버 주소로 요청했어요. 설정의 그림 AI에서 생성 주소를 '+NAI_ENDPOINT+' 로 바꿔 주세요.';
  if(!IS_NATIVE&&e&&e.code==='network'&&e.message) return (label?label+'. ':'')+e.message;
  if(imgProvider()==='comfy'&&e&&e.code==='network') return 'ComfyUI 서버에 연결하지 못했어요. PC에서 --listen 옵션으로 켰는지, 같은 와이파이인지, 주소(http://PC주소:8188)를 확인해 주세요.';
  const m={comfy_nourl:'설정의 그림 AI에서 ComfyUI 주소를 넣어 주세요.',comfy_wf:'ComfyUI 워크플로 문제: '+((e&&e.message)||''),comfy_err:'ComfyUI 오류: '+((e&&e.message)||''),comfy_timeout:'ComfyUI가 시간 안에 그림을 끝내지 못했어요. 설정에서 대기 시간을 늘려 보세요.',nai_locked:'NovelAI에서 다른 생성이 진행 중이에요. 잠시 뒤 다시 시도해 주세요.',nai_empty:'NovelAI 응답에 이미지가 없어요.',bad_key:'NovelAI 토큰이 올바르지 않아요. 설정의 그림 AI에서 확인해 주세요.',low_credit:'Anlas가 부족하거나 구독이 필요해요.',rate_limited:'NovelAI가 바빠요. 다른 생성이 끝난 뒤 다시 시도해 주세요.',network:'인터넷 연결을 확인해 주세요. 웹 버전에서는 그림 AI가 안 될 수 있어요.',nai_zip:'NovelAI 응답을 풀지 못했어요.',nai_nokey:'설정의 그림 AI에 NovelAI 토큰을 넣어 주세요.'};
  return m[e&&e.code]||((label||'그림 생성 실패')+'. '+((e&&e.message)||''));
}
function loadImg(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src;});}
async function imgB64(src,W,H,bg){
  const im=await loadImg(src), cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  x.fillStyle=bg; x.fillRect(0,0,W,H); const s=Math.min(W/im.width,H/im.height), w=im.width*s, h=im.height*s;
  x.drawImage(im,(W-w)/2,(H-h)/2,w,h); return cv.toDataURL('image/png').split(',')[1];
}
async function naiEmotion(src,emo,extra,level){
  const c=naiCfg(); if(!c.key) throw {code:'nai_nokey'};
  const image=await imgB64(src,832,1216,'#ffffff');
  const r=await http(naiBase(c)+'/ai/augment-image',{method:'POST',headers:NAI_HDR(c.key),body:{req_type:'emotion',width:832,height:1216,image,prompt:`${emo};;${extra||''}`,defry:level||0},binary:true,timeout:180000});
  if(r.status>=400||!r.bytes) throw errOf(r);
  let blob=new Blob([await unzipFirst(r.bytes)],{type:'image/png'});
  if(c.cutout) blob=await cutoutWhite(blob);
  return blob;
}
function imgType(u8){if(!u8||u8.length<12)return '';if(u8[0]===0x89&&u8[1]===0x50)return 'image/png';if(u8[0]===0xFF&&u8[1]===0xD8)return 'image/jpeg';if(u8[0]===0x52&&u8[1]===0x49&&u8[8]===0x57&&u8[9]===0x45)return 'image/webp';return '';}
async function naiDecode(u8,ct){
  const t=String(ct||'').split(';')[0].trim().toLowerCase();
  if(/^image\/(png|jpe?g|webp)$/.test(t)) return {bytes:u8,type:t==='image/jpg'?'image/jpeg':t};
  const ty=imgType(u8); if(ty) return {bytes:u8,type:ty};
  const inner=await unzipFirst(u8); return {bytes:inner,type:imgType(inner)||'image/png'};
}
async function refImage(src){
  const im=await loadImg(src), w=im.naturalWidth||im.width, h=im.naturalHeight||im.height, r=w&&h?w/h:2/3;
  const [W,H]=[[1024,1536],[1536,1024],[1472,1472]].sort((a,b)=>Math.abs(r-a[0]/a[1])-Math.abs(r-b[0]/b[1]))[0];
  return imgB64(src,W,H,'#000000');
}
function retryAfterMs(h){const v=String((h||{})['retry-after']||'').trim();if(!v)return 0;const n=Number(v);if(isFinite(n))return Math.max(0,n*1000);const d=Date.parse(v);return isFinite(d)?Math.max(0,d-Date.now()):0;}
async function unzipFirst(u8){
  if(imgType(u8)) return u8;
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  let e=u8.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
  if(e<0) throw {code:'nai_zip'};
  const cd=dv.getUint32(e+16,true); if(dv.getUint32(cd,true)!==0x02014b50) throw {code:'nai_zip'};
  const method=dv.getUint16(cd+10,true), csize=dv.getUint32(cd+20,true), lho=dv.getUint32(cd+42,true);
  const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true), data=u8.subarray(st,st+csize);
  if(method===0) return data;
  if(method===8&&typeof DecompressionStream!=='undefined'){ const out=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); return new Uint8Array(out); }
  throw {code:'nai_zip'};
}
async function unzipAll(u8){
  if(imgType(u8)) return [u8];
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  let e=u8.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
  if(e<0) throw {code:'nai_zip'};
  const n=dv.getUint16(e+10,true); let cd=dv.getUint32(e+16,true); const out=[];
  for(let k=0;k<n;k++){
    if(dv.getUint32(cd,true)!==0x02014b50) break;
    const method=dv.getUint16(cd+10,true), csize=dv.getUint32(cd+20,true), lho=dv.getUint32(cd+42,true), next=cd+46+dv.getUint16(cd+28,true)+dv.getUint16(cd+30,true)+dv.getUint16(cd+32,true);
    const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true), data=u8.subarray(st,st+csize);
    if(method===0) out.push(data);
    else if(method===8&&typeof DecompressionStream!=='undefined') out.push(new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()));
    cd=next;
  }
  if(!out.length) throw {code:'nai_zip'};
  return out;
}
/* border: share of border pixels that are transparent, solid: share of all pixels that are mostly opaque */
async function alphaInfo(blob){
  try{ const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0); const d=x.getImageData(0,0,W,H).data; let n=0,t=0,s=0,m=0;
    for(let i=0;i<W;i+=3){n+=2; if(d[i*4+3]<24)t++; if(d[((H-1)*W+i)*4+3]<24)t++;} for(let j=0;j<H;j+=3){n+=2; if(d[(j*W)*4+3]<24)t++; if(d[(j*W+W-1)*4+3]<24)t++;}
    for(let p=3;p<d.length;p+=64){m++; if(d[p]>128)s++;}
    return {border:n?t/n:0,solid:m?s/m:1}; }catch(e){ return {border:0,solid:1}; }
}
async function alphaBorder(blob){
  try{ const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0); const d=x.getImageData(0,0,W,H).data; let n=0,t=0;
    const at=(px,py)=>{n++; if(d[(py*W+px)*4+3]<24) t++;};
    for(let i=0;i<W;i+=3){at(i,0);at(i,H-1);} for(let j=0;j<H;j+=3){at(0,j);at(W-1,j);}
    return n?t/n:0; }catch(e){ return 0; }
}
async function naiBgRemove(src){
  const c=naiCfg(); if(!c.key) throw {code:'nai_nokey'};
  const im=await loadImg(src), iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height, r=iw&&ih?iw/ih:2/3;
  let W,H; if(iw%64===0&&ih%64===0&&iw*ih<=1024*1536){W=iw;H=ih;} else [W,H]=[[832,1216],[1216,832],[1024,1024],[896,1152],[1152,896]].sort((a,b)=>Math.abs(r-a[0]/a[1])-Math.abs(r-b[0]/b[1]))[0];
  const image=await imgB64(src,W,H,'#ffffff');
  const res=await http(naiBase(c)+'/ai/augment-image',{method:'POST',headers:NAI_HDR(c.key),body:{req_type:'bg-removal',width:W,height:H,image},binary:true,timeout:180000});
  if(res.status>=400||!res.bytes) throw errOf(res);
  const files=await unzipAll(res.bytes); let best=null,bs=-1;
  for(const f of files){ const b=new Blob([f],{type:imgType(f)||'image/png'}); const s=await alphaBorder(b); if(s>bs){bs=s;best=b;} }
  if(!best||bs<0.3) throw {code:'nai_empty',message:'투명 배경 결과를 찾지 못했어요'};
  return best;
}
/* eyedropper on raw pixels: remove the colour under (px,py). mode 'wand' = connected area only, 'all' = that colour everywhere */
function eraseColorData(id,W,H,px,py,o){
  o=Object.assign({tol:24,soft:14,mode:'wand'},o||{}); const d=id.data, N=W*H;
  px=Math.max(0,Math.min(W-1,Math.round(px))); py=Math.max(0,Math.min(H-1,Math.round(py)));
  let r=0,g=0,b=0,n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){const X=px+dx,Y=py+dy; if(X<0||Y<0||X>=W||Y>=H) continue; const i=(Y*W+X)*4; if(d[i+3]<40) continue; r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
  if(!n) return {removed:0,color:null};
  r/=n; g/=n; b/=n;
  const T=o.tol, S=Math.max(1,o.soft), lim=T+S;
  const dist=p=>{const i=p*4; if(d[i+3]<8) return 999; const a=d[i]-r,c=d[i+1]-g,e=d[i+2]-b; return Math.sqrt(a*a+c*c+e*e);};
  const kill=new Uint8Array(N); let removed=0;
  if(o.mode==='all'){ for(let p=0;p<N;p++) if(dist(p)<=T){kill[p]=1;removed++;} }
  else{ const q=new Int32Array(N); let qh=0,qt=0; const s0=py*W+px;
    if(dist(s0)<=T){ kill[s0]=1; q[qt++]=s0; removed++; }
    while(qh<qt){const p=q[qh++],X=p%W; const nb=[X>0?p-1:-1,X<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];
      for(const m of nb){ if(m>=0&&!kill[m]&&dist(m)<=T){kill[m]=1;removed++;q[qt++]=m;} } } }
  if(!removed) return {removed:0,color:[r,g,b]};
  const band=new Uint8Array(N);
  for(let pass=1;pass<=2;pass++) for(let p=0;p<N;p++){ if(kill[p]||band[p]) continue; const X=p%W, prev=pass===1?(m=>kill[m]):(m=>band[m]===1);
    if((X>0&&prev(p-1))||(X<W-1&&prev(p+1))||(p>=W&&prev(p-W))||(p<N-W&&prev(p+W))) band[p]=pass; }
  for(let p=0,i=0;p<N;p++,i+=4){
    if(kill[p]){d[i+3]=0;continue;}
    if(band[p]){ const dd=dist(p); if(dd>=lim) continue; let a=(dd-T)/S; a=Math.max(0.1,Math.min(1,a)); const k=1/a;
      d[i]=Math.max(0,Math.min(255,Math.round((d[i]-(1-a)*r)*k))); d[i+1]=Math.max(0,Math.min(255,Math.round((d[i+1]-(1-a)*g)*k))); d[i+2]=Math.max(0,Math.min(255,Math.round((d[i+2]-(1-a)*b)*k)));
      d[i+3]=Math.round(d[i+3]*a); }
  }
  return {removed,color:[r,g,b]};
}
/* ---- cut tool canvas helpers ---- */
const CUT_ZOOMS=[1,2,3,5,8];
function cutCtx(){const j=CUTJOB;return j&&j.cv?j.cv.getContext('2d',{willReadFrequently:true}):null;}
function cutPush(){const j=CUTJOB,x=cutCtx(); if(!x) return; j.undo.push(x.getImageData(0,0,j.W,j.H)); if(j.undo.length>10) j.undo.shift(); const u=$('#ct_undo'); if(u) u.disabled=false; j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;}
async function cutLoadBlob(b,push){
  const j=CUTJOB, x=cutCtx(); if(!x) return; if(push!==false) cutPush();
  const bmp=await createImageBitmap(b); x.clearRect(0,0,j.W,j.H); x.drawImage(bmp,0,0,j.W,j.H); cutDrawLoupe(); j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;
}
function cutBlob(){const j=CUTJOB;return new Promise(r=>j.cv.toBlob(b=>r(b),'image/png'));}
function cutMap(){const j=CUTJOB, R=j.cv.getBoundingClientRect(), s=Math.min(R.width/j.W,R.height/j.H); return {s,ox:R.left+(R.width-j.W*s)/2,oy:R.top+(R.height-j.H*s)/2};}
function cutMode(){const m=$('#ct_pmode');return m?m.value:'wand';}
function cutBrush(){const b=$('#ct_brush');return b?+b.value:10;}
function cutPlaceCursor(){
  const j=CUTJOB, cur=$('#cutCur'), view=$('#cutPrev'); if(!j||!cur||!view||j.cx<0) return;
  const m=cutMap(), V=view.getBoundingClientRect(), X=m.ox+j.cx*m.s, Y=m.oy+j.cy*m.s;
  const brush=['brush','restore'].includes(cutMode()), size=brush?Math.max(10,cutBrush()*2*m.s):26;
  cur.hidden=false; cur.classList.toggle('brush',brush); cur.classList.toggle('restore',cutMode()==='restore');
  cur.style.width=cur.style.height=size+'px'; cur.style.left=(X-V.left+view.scrollLeft-size/2)+'px'; cur.style.top=(Y-V.top+view.scrollTop-size/2)+'px';
}
function cutDrawLoupe(){
  const j=CUTJOB, L=$('#cutLoupe'); if(!j||!L||j.cx<0) return; L.hidden=false;
  const g=L.getContext('2d'), Z=L.width, span=Math.max(9,Math.round(Z/(j.zoom>=5?3:6)));
  g.imageSmoothingEnabled=false; for(let y=0;y<Z;y+=10) for(let x=0;x<Z;x+=10){ g.fillStyle=((x+y)/10)%2?'#3a3550':'#2c2541'; g.fillRect(x,y,10,10); }
  g.drawImage(j.cv,j.cx-span/2,j.cy-span/2,span,span,0,0,Z,Z);
  const k=Z/span; g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=1; g.beginPath(); g.moveTo(Z/2,0); g.lineTo(Z/2,Z/2-k); g.moveTo(Z/2,Z/2+k); g.lineTo(Z/2,Z); g.moveTo(0,Z/2); g.lineTo(Z/2-k,Z/2); g.moveTo(Z/2+k,Z/2); g.lineTo(Z,Z/2); g.stroke();
  g.strokeStyle='#ff3d7f'; g.strokeRect(Z/2-k/2,Z/2-k/2,k,k);
  if(['brush','restore'].includes(cutMode())){ g.strokeStyle='rgba(255,211,90,.9)'; g.beginPath(); g.arc(Z/2,Z/2,cutBrush()*k,0,Math.PI*2); g.stroke(); }
  const view=$('#cutPrev'); if(view){ const V=view.getBoundingClientRect(), m=cutMap(), X=m.ox+j.cx*m.s-V.left, Y=m.oy+j.cy*m.s-V.top; L.classList.toggle('right',X<V.width/2&&Y<Z+20); }
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
const CUT_DEF={tol:30,soft:26,holes:false,despeck:true,shadow:true};
function cutCfg(){const c=naiCfg();return Object.assign({},CUT_DEF,c.cut||{});}
async function cutoutWhite(blob,o){
  try{
    o=Object.assign(cutCfg(),o||{});
    const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, N=W*H;
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0);
    const id=x.getImageData(0,0,W,H), d=id.data;
    // 1. background colour = median of the border ring (works for white, off-white and light grey)
    const ring=[]; const R=Math.max(2,Math.round(Math.min(W,H)*0.01));
    for(let y=0;y<H;y+=2) for(let k=0;k<R;k++){ring.push((y*W+k)*4,(y*W+W-1-k)*4);}
    for(let xx=0;xx<W;xx+=2) for(let k=0;k<R;k++){ring.push((k*W+xx)*4,((H-1-k)*W+xx)*4);}
    const med=ch=>{const a=ring.map(i=>d[i+ch]).sort((p,q)=>p-q);return a[a.length>>1];};
    const br=med(0),bgc=med(1),bb=med(2);
    // distance from background colour (perceptual-ish)
    const dist=new Uint8Array(N);
    for(let p=0,i=0;p<N;p++,i+=4){const dr=d[i]-br,dg=d[i+1]-bgc,db=d[i+2]-bb;dist[p]=Math.min(255,Math.round(Math.sqrt(dr*dr+dg*dg+db*db)));}
    const T=o.tol, S=Math.max(1,o.soft);
    // 2. flood fill background reachable from the border (4-neighbour)
    const bgm=new Uint8Array(N), q=new Int32Array(N); let qh=0,qt=0;
    const push=p=>{if(!bgm[p]&&dist[p]<=T){bgm[p]=1;q[qt++]=p;}};
    for(let i=0;i<W;i++){push(i);push((H-1)*W+i);} for(let j=0;j<H;j++){push(j*W);push(j*W+W-1);}
    while(qh<qt){const p=q[qh++],px=p%W;if(px>0)push(p-1);if(px<W-1)push(p+1);if(p>=W)push(p-W);if(p<N-W)push(p+W);}
    if(qt<N*0.08) return blob;
    // 2b. soft grey shadows on the floor that touch the background (low chroma, slightly darker than bg)
    if(o.shadow){
      const bl=br*0.3+bgc*0.59+bb*0.11; qh=0; let qt2=0;
      const y0=Math.floor(H*0.7)*W;
      const sh=p=>{if(p<y0)return false;const i=p*4,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]),l=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;return mx-mn<=24&&l<=bl+4&&l>=bl-95;};
      for(let p=0;p<N;p++) if(bgm[p]){const px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!bgm[n]&&sh(n)){bgm[n]=1;q[qt2++]=n;}}}
      while(qh<qt2){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!bgm[n]&&sh(n)){bgm[n]=1;q[qt2++]=n;}}}
    }
    // 3. enclosed holes (between arms, under hair) that match the background closely
    if(o.holes){
      const lab=new Uint8Array(N), minHole=Math.max(60,N*0.0006), Th=Math.max(6,Math.round(T*0.55));
      for(let s0=0;s0<N;s0++){ if(bgm[s0]||lab[s0]||dist[s0]>Th) continue;
        qh=0;qt=0;q[qt++]=s0;lab[s0]=1;
        while(qh<qt){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!lab[n]&&!bgm[n]&&dist[n]<=Th){lab[n]=1;q[qt++]=n;}}}
        if(qt>=minHole){ let m=0,m2=0; for(let k=0;k<qt;k++){const i=q[k]*4,l=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;m+=l;m2+=l*l;} m/=qt; const sd=Math.sqrt(Math.max(0,m2/qt-m*m)); if(sd<=2.2) for(let k=0;k<qt;k++) bgm[q[k]]=1; }
      }
    }
    // 4. remove small floating specks of foreground
    if(o.despeck){
      const lab=new Uint8Array(N), minObj=Math.max(40,N*0.0015);
      for(let s0=0;s0<N;s0++){ if(bgm[s0]||lab[s0]) continue;
        qh=0;qt=0;q[qt++]=s0;lab[s0]=1;
        while(qh<qt){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!lab[n]&&!bgm[n]){lab[n]=1;q[qt++]=n;}}}
        if(qt<minObj) for(let k=0;k<qt;k++) bgm[q[k]]=1;
      }
    }
    // 5. alpha: background transparent, soft matte on the boundary band, colour decontamination
    const near=new Uint8Array(N); // distance (in px, up to 3) from the background region
    for(let p=0;p<N;p++) if(bgm[p]) near[p]=1;
    for(let pass=2;pass<=3;pass++){ for(let p=0;p<N;p++){ if(near[p]) continue; const px=p%W;
      if((px>0&&near[p-1]===pass-1)||(px<W-1&&near[p+1]===pass-1)||(p>=W&&near[p-W]===pass-1)||(p<N-W&&near[p+W]===pass-1)) near[p]=pass; } }
    for(let p=0,i=0;p<N;p++,i+=4){
      if(bgm[p]){d[i+3]=0;continue;}
      if(near[p]>=2&&near[p]<=3){
        let a=(dist[p]-T)/S; a=a<=0?0.08:a>=1?1:a; if(near[p]===2) a=Math.min(a,0.92);
        d[i+3]=Math.round(255*a);
        if(a<1){const k=1/a; d[i]=Math.max(0,Math.min(255,Math.round((d[i]-(1-a)*br)*k))); d[i+1]=Math.max(0,Math.min(255,Math.round((d[i+1]-(1-a)*bgc)*k))); d[i+2]=Math.max(0,Math.min(255,Math.round((d[i+2]-(1-a)*bb)*k)));}
      }
    }
    x.putImageData(id,0,0);
    return await new Promise(r=>cv.toBlob(b=>r(b||blob),'image/png'));
  }catch(e){ return blob; }
}

/* ---- ComfyUI (local / remote server) ---- */
function imgProvider(){return naiCfg().provider==='comfy'?'comfy':'nai';}
function comfyCfg(){return Object.assign({url:'',wf:'',timeoutSec:300,qtags:'masterpiece, best quality, amazing quality',neg:'lowres, bad anatomy, worst quality, low quality, watermark, text'},naiCfg().comfy||{});}
function imgReady(){return imgProvider()==='comfy'?!!(comfyCfg().url&&comfyCfg().wf):!!naiCfg().key;}
function imgNeed(){return imgProvider()==='comfy'?'설정의 그림 AI에서 ComfyUI 주소와 워크플로를 넣어 주세요':'설정의 그림 AI에 NovelAI 토큰을 넣어 주세요';}
function sdTags(s){return String(s||'').replace(/(-?\d+(?:\.\d+)?)::\s*([^:]+?)\s*::/g,(m,w,t)=>`(${t}:${(+w).toFixed(2)})`);}
function comfyBind(wf,v){
  const tt=id=>String((wf[id]._meta&&wf[id]._meta.title)||'').trim().toLowerCase();
  const by=t=>Object.keys(wf).filter(id=>tt(id)==='[ggm:'+t+']'||tt(id)==='[assetmaid:'+t+']');
  let P=by('positive'), N=by('negative'), S=by('size'), SD=[...by('seed'),...by('seed-progress')]; const O=by('output');
  const ks=Object.keys(wf).find(id=>/KSampler|SamplerCustom/i.test(wf[id].class_type||''));
  if(ks){ const k=wf[ks].inputs||{};
    if(!P.length&&Array.isArray(k.positive)) P=[String(k.positive[0])];
    if(!N.length&&Array.isArray(k.negative)) N=[String(k.negative[0])];
    if(!S.length&&Array.isArray(k.latent_image)) S=[String(k.latent_image[0])];
    if(!SD.length) SD=[ks]; }
  if(!P.length) throw {code:'comfy_wf',message:'프롬프트를 넣을 노드를 찾지 못했어요. 프롬프트 노드 제목을 [GGM:positive]로 바꿔 주세요.'};
  const setT=(id,val)=>{const inp=(wf[id]||{}).inputs; if(!inp) return; const k=['text','value','string','prompt','text_g'].find(k=>k in inp&&!Array.isArray(inp[k]))||['text','value'].find(k=>k in inp)||'text'; inp[k]=val; if('text_l' in inp&&!Array.isArray(inp.text_l)) inp.text_l=val;};
  P.forEach(id=>setT(id,v.pos)); N.forEach(id=>setT(id,v.neg));
  S.forEach(id=>{const inp=(wf[id]||{}).inputs||{}; if('width' in inp) inp.width=v.w; if('height' in inp) inp.height=v.h;});
  SD.forEach(id=>{const inp=(wf[id]||{}).inputs||{}; const k=['seed','noise_seed','value'].find(k=>k in inp&&!Array.isArray(inp[k])); if(k) inp[k]=v.seed;});
  return O[0]||null;
}
async function comfyGenerate(prompt,kind,opts){
  opts=opts||{}; const cc=comfyCfg(), c=naiCfg(); if(!cc.url) throw {code:'comfy_nourl'};
  let wf; try{ wf=JSON.parse(cc.wf); }catch(e){ throw {code:'comfy_wf',message:'워크플로 JSON을 읽지 못했어요'}; }
  if(!wf||Array.isArray(wf.nodes)) throw {code:'comfy_wf',message:'ComfyUI에서 "Export (API)"로 저장한 워크플로를 넣어 주세요'};
  const [w,h]=opts.size||naiSize(kind,c);
  const seed=opts.seed!=null&&String(opts.seed).trim()!==''?(Math.floor(+opts.seed)>>>0):Math.floor(Math.random()*4294967295); opts.usedSeed=seed; opts.usedModel='ComfyUI';
  const pos=sdTags(joinTags(prompt,cc.qtags)), neg=sdTags(joinTags(opts.neg!=null?opts.neg:c.neg,cc.neg));
  const outNode=comfyBind(wf,{pos,neg,w,h,seed}), base=cc.url.trim().replace(/\/+$/,'');
  const r=await http(base+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:{prompt:wf,client_id:'ggm'+uid()},timeout:30000});
  let j; try{ j=JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):'')); }catch(e){ j={}; }
  if(r.status>=400||!j.prompt_id) throw {code:'comfy_err',message:String((j.error&&(j.error.message||j.error))||JSON.stringify(j.node_errors||j)).slice(0,240)};
  const pid=j.prompt_id, t0=Date.now(); let out=null, n=0;
  while(Date.now()-t0<num(cc.timeoutSec,30,1200,300)*1000){
    await wait(1500); n++; if(opts.onRetry&&n%4===0) opts.onRetry(Math.round((Date.now()-t0)/1000),0,'ComfyUI 생성 중');
    let hj; try{ hj=okJSON(await http(base+'/history/'+pid,{timeout:20000})); }catch(e){ continue; }
    const it=hj&&hj[pid]; if(!it) continue;
    if(it.status&&it.status.status_str==='error') throw {code:'comfy_err',message:'워크플로 실행 중 오류가 났어요'};
    const imgs=[]; Object.entries(it.outputs||{}).forEach(([nid,o])=>(o.images||[]).forEach(im=>imgs.push(Object.assign({nid},im))));
    out=imgs.find(x=>outNode&&x.nid===outNode)||imgs.find(x=>x.type==='output')||imgs[0]; if(out) break;
  }
  if(!out) throw {code:'comfy_timeout'};
  const vr=await http(`${base}/view?filename=${encodeURIComponent(out.filename)}&subfolder=${encodeURIComponent(out.subfolder||'')}&type=${encodeURIComponent(out.type||'output')}`,{binary:true,timeout:90000});
  if(vr.status>=400||!vr.bytes) throw {code:'comfy_err',message:'결과 이미지를 받지 못했어요'};
  let blob=new Blob([vr.bytes],{type:imgType(vr.bytes)||'image/png'});
  if(['char','enemy','icon'].includes(kind)&&c.cutout&&!opts.noCut){ const ai=await alphaInfo(blob); if(ai.border<0.5) blob=await cutoutWhite(blob); }
  return blob;
}
let NAI_TP_OFF=false;
/* 등장인물은 모두 성인이에요: 미성년으로 읽히는 태그는 그림 요청에서 빼요(직접 적은 태그·AI가 쓴 태그 모두) */
const MINOR_TAGS=/^(loli|lolicon|shota|shotacon|child|children|kid|kids|toddler|baby|infant|young child|young girl|young boy|little girl|little boy|preteen|pre-teen|underage|minor|teen|teens|teenage|teenager|aged down|elementary school student|middle school student|elementary schooler|middle schooler|kindergartener)$/i;
const stripMinor=s=>tagList(s).filter(t=>!MINOR_TAGS.test(tagKey(t))).join(', ');
async function naiGenerate(prompt,kind,opts){
  opts=opts||{}; prompt=stripMinor(prompt); if(Array.isArray(opts.chars)) opts.chars=opts.chars.map(x=>x&&typeof x.prompt==='string'?Object.assign({},x,{prompt:stripMinor(x.prompt)}):x); if(imgProvider()==='comfy') return comfyGenerate(prompt,kind,opts);
  try{ const b=await naiGenerate0(prompt,kind,opts); if(opts.usedTp&&opts.emptyAlpha) throw {code:'nai_empty',message:'투명 결과가 비어 있어요'}; try{ b.__seed=opts.usedSeed; }catch(_){} return b; }
  catch(e){
    if(!opts.usedTp||opts.noTp||(e&&['nai_nokey','bad_key','low_credit','nai_locked','rate_limited','network'].includes(e.code))) throw e;
    const why=naiErr(e,'투명 생성 실패');
    opts.onRetry&&opts.onRetry(1,2,'투명 배경 실패, 흰 배경으로');
    opts.noTp=true; opts.emptyAlpha=false; const b2=await naiGenerate0(prompt,kind,opts);
    NAI_TP_OFF=true; try{appStorage.setItem('starfall-nai-tperr',why+' @'+new Date().toLocaleString());}catch(_){}
    toast('투명 배경 생성이 안 돼서 흰 배경으로 그렸어요. 앱을 다시 켜기 전까지는 흰 배경으로 그려요'); return b2;
  }
}
async function naiGenerate0(prompt,kind,opts){
  const c=naiCfg(); if(!c.key) throw {code:'nai_nokey'};
  const refs=(opts.refs||[]).filter(r=>r&&r.image);
  let model=String(opts.model||c.model||NAI_DEF.model).trim(); if(refs.length&&!isV45(model)) model=isV45(c.refModel)?c.refModel:'nai-diffusion-4-5-full';
  if(opts.inpaint&&opts.inpaint.image&&!/-inpainting$/.test(model)) model+='-inpainting';
  opts.usedModel=model;
  const [w,h]=opts.size||naiSize(kind,c);
  const tp=!!c.transparent&&!NAI_TP_OFF&&!opts.noTp&&/^nai-diffusion-5/.test(model)&&!refs.length&&!(opts.img2img&&opts.img2img.image)&&!opts.inpaint&&['char','enemy','prop','icon'].includes(kind);
  opts.usedTp=tp;
  const BGTAG=/^(simple background|white background|grey background|gray background|gradient background|plain background|transparent background)$/i;
  const ql=''; // Quality is already part of the composed style prompt.
  let input=ql?joinTags(prompt,ql):String(prompt||''), neg=opts.neg!=null?opts.neg:(c.neg||'');
  if(['char','enemy'].includes(kind)) neg=joinTags(neg,'drop shadow, cast shadow');
  if(tp){ input=joinTags(tagList(prompt).filter(t=>!BGTAG.test(tagKey(t))).join(', '),'transparent background',ql); neg=tagList(neg).filter(t=>!/^(gradient background|simple background)$/i.test(tagKey(t))).join(', '); }
  const rnd=()=>{try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch(e){return Math.floor(Math.random()*4294967295);}};
  const seed=opts.seed!=null&&String(opts.seed).trim()!==''?(Math.floor(+opts.seed)>>>0):rnd(); opts.usedSeed=seed;
  const P={params_version:3,width:w,height:h,scale:num(c.scale,0,10,6),sampler:c.sampler||'k_euler_ancestral',steps:Math.round(num(c.steps,1,50,28)),n_samples:1,ucPreset:0,qualityToggle:false,
    noise_schedule:c.noise||'karras',cfg_rescale:num(c.cfgRescale,0,1,0),negative_prompt:neg,seed,extra_noise_seed:rnd(),dynamic_thresholding:false,controlnet_strength:1,legacy:false,
    add_original_image:false,prefer_brownian:true,deliberate_euler_ancestral_bug:false,reference_image_multiple:[],reference_information_extracted_multiple:[],reference_strength_multiple:[],use_coords:false};
  const chars=(opts.chars||[]).filter(x=>x&&(x.prompt||x.uc));
  if(isV4p(model)){
    const coords=chars.length>1&&chars.some(x=>CG_POS[x.pos]);
    const cen=x=>[coords&&CG_POS[x.pos]?CG_POS[x.pos]:{x:.5,y:.5}];
    P.v4_prompt={caption:{base_caption:input,char_captions:chars.map(x=>({char_caption:x.prompt||'',centers:cen(x)}))},use_coords:coords,use_order:true};
    P.v4_negative_prompt={caption:{base_caption:neg,char_captions:chars.map(x=>({char_caption:x.uc||'',centers:cen(x)}))},legacy_uc:false};
    P.use_coords=coords;
    if(isV45(model)&&c.varietyBoostV45!==false) P.skip_cfg_above_sigma=59.04722600415217;
  }
  if(refs.length){
    P.director_reference_images=refs.map(r=>r.image);
    P.director_reference_strength_values=refs.map(r=>num(r.strength,0,1,.6));
    P.director_reference_secondary_strength_values=refs.map(r=>num(1-num(r.fidelity,0,1,1),0,1,0));
    P.director_reference_descriptions=refs.map(r=>({caption:{base_caption:['character','style','character&style'].includes(r.type)?r.type:'character',char_captions:[]},legacy_uc:false}));
    P.director_reference_information_extracted=refs.map(()=>1);
    P.controlnet_strength=1; P.inpaintImg2ImgStrength=1; P.normalize_reference_strength_multiple=true; delete P.skip_cfg_above_sigma;
  }
  if(tp){ P.params_version=4; P.straight_alpha=true; P.tag_hint_transparent_background=true; }
  let action='generate';
  if(opts.inpaint&&opts.inpaint.image){ action='infill'; const st=num(opts.inpaint.strength,0.3,1,1); P.image=opts.inpaint.image; P.mask=opts.inpaint.mask; P.add_original_image=!!opts.inpaint.addOrig; P.strength=st; P.noise=0; P.inpaintImg2ImgStrength=st; P.img2img={strength:st,begin_from_sigma:null,noise:0,extra_noise_seed:seed,color_correct:true}; if(P.sampler==='ddim') P.sampler='k_euler_ancestral'; }
  else if(opts.img2img&&opts.img2img.image){ action='img2img'; P.image=opts.img2img.image; P.strength=num(opts.img2img.strength,.4,1,.6); P.noise=num(opts.img2img.noise,0,1,0); }
  const body={input,model,action,parameters:P}, url=String(c.endpoint||NAI_ENDPOINT).trim(), tries=Math.round(num(c.retries,1,5,3)), tmo=Math.round(num(c.timeoutSec,30,300,120))*1000;
  let last;
  for(let a=1;a<=tries;a++){
    let r;
    try{ r=await http(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+String(c.key).trim()},body,binary:true,timeout:tmo}); }
    catch(e){ last=e; if(a<tries){ opts.onRetry&&opts.onRetry(a,tries,'네트워크 오류'); await wait(1000*a); continue; } throw e; }
    if(r.status<400&&r.bytes&&r.bytes.length){
      const img=await naiDecode(r.bytes,(r.headers||{})['content-type']);
      let blob=new Blob([img.bytes],{type:img.type});
      let clear=false; if(tp){ const ai=await alphaInfo(blob); if(ai.solid<0.02){ opts.emptyAlpha=true; return blob; } clear=ai.border>0.5; } opts.gotAlpha=clear;
      if((kind==='char'||kind==='enemy'||kind==='icon')&&c.cutout&&!opts.noCut&&!clear) blob=await cutoutWhite(blob);
      return blob;
    }
    const txt=r.text||'', locked=/Concurrent generation is locked/i.test(txt);
    last=locked?{code:'nai_locked',message:''}:(r.status<400?{code:'nai_empty'}:errOf(r));
    const retry=locked||[408,425,429].includes(r.status)||r.status>=500;
    if(!retry||a>=tries) throw last;
    opts.onRetry&&opts.onRetry(a,tries,locked?'다른 생성 진행 중':'HTTP '+r.status);
    await wait(Math.min(20000,Math.max(retryAfterMs(r.headers),1500*a)));
  }
  throw last;
}
