/* CHARACTER_REGEN_MODULE */
// Partial regeneration stages a draft; only a confirmed, still-current draft can mutate saved data.
let REGEN=null,REGEN_JOB=null,IMGLIB=null;
const unFaceless=s=>String(s||'').replace(/(^|\s*,\s*)(1other\s*,\s*)?faceless\b/gi,(m,pre)=>pre||'').replace(/^[\s,]+/,'').trim();
function charCGs(c){return G.lib.filter(l=>l.kind==='cg'&&(l.cast||[]).some(x=>x.id===c.id));}
function weaponRenameOk(o,n){o=String(o||'').trim();n=String(n||'').trim();return o.length>=3&&n&&o!==n&&!G.chars.some(c=>c.name===o)&&!(G.npcs||[]).some(x=>x.name===o);}
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
    const response=await v2SkillRequest(SAMPLE,regenRunPrompt({context,last,c,sel}),job.controller.signal);
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
 const response=await v2SkillRequest(SAMPLE,requestUltimateScenePrompt({context,instructions}),signal);
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
  const purpose=illustrationScenePreparationPurposeText({kind});
  const response=await v2SkillRequest(SAMPLE,illustrationScenePreparationPrompt({c,purpose,cfg}),signal);
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
  const r=await aiJSON(designAIPrompt({w,facs}),btn,'quick');
  if(!r||typeof r!=='object') return; if(r.all&&$('#ds_all')) $('#ds_all').value=stripMinor(String(r.all));
  (Array.isArray(r.factions)?r.factions:[]).forEach(x=>{ const el=[...document.querySelectorAll('#modal [data-fac]')].find(e=>e.dataset.fac===String(x&&x.name||'').trim()); if(el&&x.tags) el.value=stripMinor(String(x.tags)); });
  toast('제안을 채웠어요. 고친 뒤 저장을 눌러 주세요'); }
// 무기 프롬프트 검사: 사람 태그가 섞였거나 '물건 사진'으로 시작하지 않으면 정리가 필요해요 (PR #3 LTXY12님 아이디어)
function wpBad(p){ const s=String(p||'').trim(); if(!s) return false; return /\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(s)||!/^(no humans|object focus)/i.test(s); }
async function weaponPromptAI(list,btn,world){ const w=world||G.world; const v=weaponPromptAIVText({list});
  const r=await aiJSON(weaponPromptAIPrompt({w,v}),btn||null,'quick');
  const out=list.map(()=>''); (r&&Array.isArray(r.weapons)?r.weapons:[]).forEach(x=>{ const i=list.findIndex(y=>y.c.name===String(x&&x.name||'').trim()), p=String((x&&x.prompt)||'').trim(); const k=i>=0?i:(list.length===1?0:-1); if(k>=0&&p&&!wpBad(p)) out[k]=p; }); return out; }
async function fixWeaponPrompts(chars,world){ try{ const bad=(chars||[]).filter(c=>c&&c.weapon&&wpBad(c.weapon.prompt)); if(!bad.length) return 0; const out=await weaponPromptAI(bad.map(c=>({c,name:c.weapon.name,desc:c.weapon.desc,cur:c.weapon.prompt})),null,world); let n=0; bad.forEach((c,i)=>{ if(out[i]){ c.weapon.prompt=out[i]; try{ mark('c:'+c.id); }catch(e){} n++; } }); return n; }catch(e){ return 0; } }
function allyTags(s){ const L=tagList(s), en=L.some(t=>/^faceless$/i.test(tagKey(t))); return en?L.filter(t=>!/^(faceless|1other|no humans)$/i.test(tagKey(t))).join(', '):String(s||''); }
function charCaption(c,act){return joinTags(tagList(c.naiPrompt).filter(t=>{const k=tagKey(t);return !COMPO_TAGS.test(k)&&!FRAME_TAGS.test(k)&&!/^(1girl|1boy|solo|\d+girls|\d+boys|mature female|adult woman)$/.test(k);}).join(', '),designTags(c),act);}
function naiDraw(kind,base,opt){
  opt=opt||{};
  if(kind==='cg'){ const p=composeCG(opt.item||{},opt); return naiGenerate(p.input,'cg',Object.assign({},opt,{neg:p.neg,chars:p.chars})); }
  const k=kind==='weapon'?'prop':kind, p=composeNai(k,base,opt); return naiGenerate(p.input,k,Object.assign({},opt,{neg:p.neg}));
}
const SKILL_TAGS={dmg:'attacking, slashing, weapon swing',aoe:'casting spell, magic circle, explosion, energy wave',heal:'casting spell, healing light, sparkles',shield:'magic barrier, shield, defensive stance',buff:'raising hand, aura, cheering, light rays'};
// 스탠딩 레퍼런스: 설정에서 켜면 일러스트·CG(+스킬 컷인·상반신)를 그릴 때 그 캐릭터의 스탠딩을 캐릭터 레퍼런스로 넣어 얼굴·머리를 맞춰요(V4.5로 그려요)
function autoRefOn(k){ const m=naiCfg().autoRef; if(imgProvider()==='comfy'||!m||m==='off') return false; return ['illust','lbcg','cg'].includes(k)||(m==='all'&&['scg','upper'].includes(k)); }
async function standRefs(cs){ const rf=naiCfg().ref||NAI_DEF.ref, out=[]; for(const c of cs){ const src=c&&imgSrc(c); if(!src) continue; try{ out.push({image:await refImage(src),type:rf.type||'character',strength:rf.strength!=null?rf.strength:1,fidelity:rf.fidelity!=null?rf.fidelity:1}); }catch(e){ quietErr(e,'0030-image/010-engine.js:181'); } if(out.length>=4) break; } return out; }
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
function cutPush(){const j=CUTJOB,x=cutCtx(); if(!x) return; j.undo.push(x.getImageData(0,0,j.W,j.H)); if(j.undo.length>10) j.undo.shift(); const el=$('#ct_undo'); if(el) el.disabled=false; j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;}
async function cutLoadBlob(b,push){
  const j=CUTJOB, x=cutCtx(); if(!x) return; if(push!==false) cutPush();
  const bmp=await createImageBitmap(b); x.clearRect(0,0,j.W,j.H); x.drawImage(bmp,0,0,j.W,j.H); cutDrawLoupe(); j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;
}
function cutBlob(){const j=CUTJOB;return new Promise(r=>j.cv.toBlob(b=>r(b),'image/png'));}
function cutMap(){const j=CUTJOB, R=j.cv.getBoundingClientRect(), s=Math.min(R.width/j.W,R.height/j.H); return {s,ox:R.left+(R.width-j.W*s)/2,oy:R.top+(R.height-j.H*s)/2};}
function cutMode(){const m=$('#ct_pmode');return m?m.value:'wand';}
function cutBrush(){const el=$('#ct_brush');return el?+el.value:10;}
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
function comfyCfg(){return Object.assign({url:'',wf:'',timeoutSec:300,qtags:COMFY_TAGS_DEF.qtags,neg:COMFY_TAGS_DEF.neg},naiCfg().comfy||{});}
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
  opts=opts||{}; prompt=stripMinor(prompt); if(Array.isArray(opts.chars)) opts.chars=opts.chars.map(c=>c&&typeof c.prompt==='string'?Object.assign({},c,{prompt:stripMinor(c.prompt)}):c); if(imgProvider()==='comfy') return comfyGenerate(prompt,kind,opts);
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
  if(tp){ input=joinTags(tagList(prompt).filter(t=>!BGTAG.test(tagKey(t))).join(', '),TP_BG_TAG,ql); neg=tagList(neg).filter(t=>!/^(gradient background|simple background)$/i.test(tagKey(t))).join(', '); }
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
/* src/main/0180-ui-scroll.js에서 옮김 */
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
function naiTarget(kind,id){if(ILK(kind)){const c=charById(id);return c&&c[kind];}if(kind==='weapon'){const c=charById(id);return c&&c.weapon;}return kind==='char'?charById(id):libById(id);}
/* 화풍 프리셋 편집 */
let CUTJOB=null;
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
let NPREP=null;
function reNaiPrep(){
  if(!NPREP) return; const o=naiTarget(NPREP.kind,NPREP.id); if(!o) return;
  const st=$('#np_style').value;
  if(NPREP.k==='cg'){ const p=composeCG(o,{styleId:st}); $('#np_in').value=p.input; $('#np_neg').value=p.neg; return; }
  const p=composeNai(NPREP.k,NPREP.base,{pose:$('#np_pose')?$('#np_pose').value:'',styleId:st,frame:$('#np_frame')?$('#np_frame').value:''}); $('#np_in').value=p.input; $('#np_neg').value=p.neg;
}
async function openNaiGen(kind,id,custom){
  const o=naiTarget(kind,id); if(!o) return;
  const c=naiCfg(), k=kind==='char'?'char':kind==='weapon'?'prop':o.kind, job={kind,id,custom,originalSrc:imgSrcRaw(o)||''}; NAIJOB=job;
  openModal(`${head('그리는 중',`<span class="muted">${esc(o.name)}</span>`)}<div class="naiprev ${k}"><div class="spin"></div></div><p class="muted" id="nai_stat" style="text-align:center">보통 10~30초 걸려요. 창을 닫으면 결과를 버려요.</p>`);
  try{
    const op={originalSrc:job.originalSrc,promptParts:custom.promptParts,candidateEligible:custom.candidateEligible===true||imageCandidateEligible(kind==='lib'?o.kind:kind,o,charById(id)),neg:custom.neg,seed:custom.seed,model:custom.model,size:custom.size,chars:custom.chars,onRetry:(a,n,why)=>{const el=$('#nai_stat');if(el&&NAIJOB===job)el.textContent=`${why} · 다시 시도 ${a}/${n-1}…`;}};
    if(custom.ref){
      const rf={type:custom.ref.type,strength:custom.ref.strength,fidelity:custom.ref.fidelity};
      if(k==='char'&&imgSrc(o)) op.refs=[Object.assign({image:await refImage(imgSrc(o))},rf)];
      if(ILK(k)){ const ow=charById(id); if(ow&&imgSrc(ow)) op.refs=[Object.assign({image:await refImage(imgSrc(ow))},rf)]; }
      if(k==='cg'){ op.refs=[]; for(const x of cgCast(o)) if(imgSrc(x.c)) op.refs.push(Object.assign({image:await refImage(imgSrc(x.c))},rf)); }
    }
    if(custom.i2i&&imgSrc(o)){ const [w,h]=custom.size||naiSize(k,c); op.img2img={image:await imgB64(imgSrc(o),w,h,'#ffffff'),strength:custom.i2i.strength,noise:custom.i2i.noise}; op.noCut=false; }
    const scenePrep=['illust','lbcg'].includes(kind)&&!custom.sceneReady?illustrationScenePreparation(charById(id),kind,custom):null;
    if(scenePrep)op.prepareCandidates=scenePrep;
    const blob=await naiGenerate(custom.input,k,op);
    scenePrep?.check();
    if(blob.__candidateConfig){custom.promptParts=blob.__candidateConfig.promptParts;custom.input=blob.__candidateConfig.prompt;custom.neg=blob.__candidateConfig.neg??custom.neg;custom.sceneTags=blob.__candidateConfig.sceneTags;custom.sceneReady=!!blob.__candidateConfig.sceneReady;}
    if(NAIJOB!==job) return;
    job.blob=blob; job.seed=op.usedSeed; NLASTSEED[id]=''; if(blob.__candidateRegistered){await registerNaiJob();return;} const url=URL.createObjectURL(blob);
    openModal(`${head('생성 결과',`<span class="muted">${esc(o.name)} · ${esc(op.usedModel)} · 시드 ${op.usedSeed}${op.usedTp?' · 투명 배경':''}</span>`)}<div class="naiprev ${k} done"><img src="${url}" alt="${esc(o.name)}" data-original-src="${esc(job.originalSrc)}"></div>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="naiuse">이걸로 등록</button><button class="btn ghost" data-act="naiagain">다시 뽑기</button><button class="btn ghost" data-act="naiedit">설정 고치기</button></div>`);
    NAIJOB=job;
  }catch(e){ if(NAIJOB!==job) return; if(e?.code==='image_cancelled'){window.navBack();return;} NAIJOB=null; closeModal(); toast(naiErr(e)); }
}
async function registerNaiJob(){ const j=NAIJOB; if(!j||!j.blob) return; NAIJOB=null; const o=naiTarget(j.kind,j.id); if(!o) return;
      if(j.kind==='weapon'){ await storeImage(o,j.blob,''); mark('c:'+j.id); render(); openChar(j.id); toast(T('weapon')+' 이미지를 등록했어요'); return; }
      if(ILK(j.kind)){ await storeImage(o,j.blob,''); if(j.custom.sceneTags)o.prompt=j.custom.sceneTags; mark('c:'+j.id); render(); openChar(j.id); toast(j.kind==='lbcg'?T('limit')+' CG를 등록했어요':'일러스트를 등록했어요'); return; }
      await storeImage(o,j.blob,j.kind==='char'?'c:':'l:'); render(); if(j.kind==='char') openChar(o.id); else openLibItem(o.id); toast(`${o.name} 이미지를 등록했어요`);
      if(j.kind==='char'&&o.upper&&!imgSrc(o.upper)&&o.naiPrompt&&imgReady()){ artRun(new Set([artKey({k:'upper',o:o.upper,c:o})])); setTimeout(()=>toast(`${o.name} 상반신도 이어서 그려요`),1200); } return;
}
let NAIBATCH=null;
async function naiBatch(kind){
  const items=G.lib.filter(l=>l.kind===kind&&!l.img&&((l.prompt||'').trim()||(kind==='cg'&&cgCast(l).length)));
  if(!items.length){toast('그릴 미등록 항목이 없어요');return;}
  if(!imgReady()){toast(imgNeed());return;}
  if(NAIBATCH){toast('이미 일괄 생성 중이에요');return;}
  const job={stop:false}; NAIBATCH=job; let done=0;
  openModal(`${head('일괄 생성')}<p id="nbStat">0 / ${items.length}</p><p class="muted">한 장씩 그려서 자동으로 등록해요. 창을 닫아도 계속 진행돼요.</p><div class="row"><button class="btn ghost" data-act="naistop">중지</button></div>`);
  for(const l of items){
    if(job.stop) break; const el=$('#nbStat'); if(el) el.textContent=`${done} / ${items.length} · ${l.name} 그리는 중`;
    try{ const b=await naiDrawItem({k:kind,o:l}); await storeImage(l,b,'l:'); done++; await wait(600); }catch(e){ toast(naiErr(e)); break; }
  }
  NAIBATCH=null; render(); if($('#nbStat')) openLib(kind); toast(`${done}개를 그려서 등록했어요`);
}
/* src/main/0260-new-game/010-draft.js에서 옮김 */
let FACESEL=new Set();
// 얼굴 범위 칠하기: 그림 위에 칠한 곳만 다시 그려요(인페인팅). 흰색=다시 그릴 곳
function fitDims(iw,ih){ const A=832*1216, r=iw/ih; let w=Math.sqrt(A*r), h=w/r; w=Math.max(512,Math.round(w/64)*64); h=Math.max(512,Math.round(h/64)*64); return [w,h]; }
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
// 얼굴 집중 인페인팅: 칠한 곳 주변만 잘라 크게 키워 다시 그리고, 줄여서 원본에 부드럽게 섞어요(원본의 투명 배경·흰 옷은 그대로)
async function focusedInpaint(src,maskUrl,draw){ const o=await loadImg(src), W=o.naturalWidth||o.width, H=o.naturalHeight||o.height, cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const M=cv(W,H), mx=M.getContext('2d'); mx.fillStyle='#000'; mx.fillRect(0,0,W,H); mx.drawImage(await loadImg(maskUrl),0,0,W,H);
  const md=mx.getImageData(0,0,W,H).data; let bx0=W,by0=H,bx1=0,by1=0; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(md[(y*W+x)*4]>127){ if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y; }
  if(bx1<bx0) throw {code:'mask_empty',message:'얼굴 범위가 비어 있어요'};
  const pad=Math.max(48,Math.round(0.45*Math.max(bx1-bx0,by1-by0))), x0=Math.max(0,Math.floor((bx0-pad)/8)*8), y0=Math.max(0,Math.floor((by0-pad)/8)*8), x1=Math.min(W,Math.ceil((bx1+pad)/8)*8), y1=Math.min(H,Math.ceil((by1+pad)/8)*8), cw=x1-x0, ch=y1-y0;
  const sc=Math.min(4,Math.sqrt(1048576/(cw*ch))), tw=Math.max(256,Math.floor(cw*sc/64)*64), th=Math.max(256,Math.floor(ch*sc/64)*64);
  const I=cv(tw,th), ix=I.getContext('2d'); ix.fillStyle='#fff'; ix.fillRect(0,0,tw,th); ix.drawImage(o,x0,y0,cw,ch,0,0,tw,th);
  const K=cv(tw,th), kx=K.getContext('2d'); kx.imageSmoothingEnabled=false; kx.drawImage(M,x0,y0,cw,ch,0,0,tw,th);
  const kd=kx.getImageData(0,0,tw,th), BW=Math.ceil(tw/8), on=new Uint8Array(BW*Math.ceil(th/8)); for(let y=0;y<th;y++) for(let x=0;x<tw;x++) if(kd.data[(y*tw+x)*4]>127) on[(y>>3)*BW+(x>>3)]=1;
  for(let y=0;y<th;y++) for(let x=0;x<tw;x++){ const i=(y*tw+x)*4, v=on[(y>>3)*BW+(x>>3)]?255:0; kd.data[i]=kd.data[i+1]=kd.data[i+2]=v; kd.data[i+3]=255; } kx.putImageData(kd,0,0);
  const res=await draw(I.toDataURL('image/png').split(',')[1],K.toDataURL('image/png').split(',')[1],tw,th), ru=URL.createObjectURL(res);
  try{ const r=await loadImg(ru), f=cw/tw;
    // 칠한 곳을 조금 넓히고(팽창) 가장자리를 흐려서 이음매가 안 보이게
    const D=cv(W,H), dx=D.getContext('2d'); dx.filter=`blur(${Math.max(2,Math.round(16*f))}px)`; dx.drawImage(M,0,0); dx.filter='none'; const dd=dx.getImageData(0,0,W,H); for(let i=0;i<dd.data.length;i+=4){ const v=dd.data[i]>8?255:0; dd.data[i]=dd.data[i+1]=dd.data[i+2]=v; dd.data[i+3]=255; } dx.putImageData(dd,0,0);
    const Fm=cv(W,H), fx=Fm.getContext('2d'); fx.fillStyle='#000'; fx.fillRect(0,0,W,H); fx.save(); fx.beginPath(); fx.rect(x0,y0,cw,ch); fx.clip(); fx.filter=`blur(${Math.max(2,Math.round(10*f))}px)`; fx.drawImage(D,0,0); fx.restore();
    const A=cv(W,H), ax=A.getContext('2d'); ax.drawImage(o,0,0,W,H); const B=cv(W,H), bx=B.getContext('2d'); bx.drawImage(r,0,0,tw,th,x0,y0,cw,ch);
    const ad=ax.getImageData(0,0,W,H), bd=bx.getImageData(0,0,W,H).data, fd=fx.getImageData(0,0,W,H).data;
    for(let i=0;i<ad.data.length;i+=4){ const k=fd[i]/255; if(k<=0.002) continue; ad.data[i]=ad.data[i]*(1-k)+bd[i]*k; ad.data[i+1]=ad.data[i+1]*(1-k)+bd[i+1]*k; ad.data[i+2]=ad.data[i+2]*(1-k)+bd[i+2]*k; }
    ax.putImageData(ad,0,0); return await new Promise(res2=>A.toBlob(res2,'image/png')); }
  finally{ URL.revokeObjectURL(ru); } }
// 인페인팅 결과에서 칠한 얼굴 부분만 원본에 부드럽게 붙여요(원본의 투명 배경·흰 옷은 그대로)
/* 표정 한 장 그리기 (b: 'full'|'up') — 표정 창과 새 게임 자동 표정이 같이 써요 */
async function faceDrawOne(c,F,f,ko,b,O,x,generationMode='automatic'){const game=G,project=PJ().active;x=x||''; const en=(FACE_PRESETS.find(p=>p[0]===ko)||[])[1]||'happy', ft=FACE_TAGS[en]||en, ew=[1.7,1.5,1.35,1.2][O.lv]||1.5, i2s=[0.72,0.64,0.56,0.48][O.lv]||0.6, emph=faceDrawOneEmphText({ew,ft});
  const basePr=F===c?c.naiPrompt:(F.prompt||c.naiPrompt), upO=faceUpperObj(c,F), srcO=b==='up'?upO:F, src=imgSrcRaw(srcO), frame=b==='up'?'cowboy shot':c.naiFrame, candidateEligible=imageCandidateEligible('face',b==='up'?f.up:f,c,generationMode),originalSrc=imgSrcRaw(b==='up'?f.up:f)||''; let blob;
  const refs=O.ref?[{image:await refImage(imgSrcRaw(F)||upO&&imgSrcRaw(upO)),type:'character',strength:1,fidelity:1}]:undefined;
  if(O.m==='inpaint') blob=await focusedInpaint(src,F.faceMask[b],(img,msk,tw,th,candidate)=>{ const pz=faceDrawOnePzText({candidate,basePr,emph,x,c}); return naiGenerate(pz.input,'char',{candidateBypass:true,seed:candidate.seed,neg:joinTags(pz.neg,'blurry, deformed face'),model:O.model,refs,size:[tw,th],noCut:true,noTp:true,inpaint:{image:img,mask:msk,strength:1,addOrig:false}}); },{candidateEligible,originalSrc,prompt:joinTags(basePr,emph,x)});
  else if(O.m==='raw') blob=await naiDraw('char',joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,seed:srcO.seed!=null?srcO.seed:undefined});
  else if(O.m==='emo') blob=await naiEmotion(src,en,x,O.lv,candidateEligible,originalSrc);
  else { const im=await loadImg(src), [w,h]=fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height); blob=await naiDraw('char',joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,refs,size:[w,h],seed:srcO.seed!=null?srcO.seed:undefined,img2img:{image:await imgB64(src,w,h,'#ffffff'),strength:i2s,noise:0.05}}); }
  if(G!==game||PJ().active!==project)throw Error('게임이 바뀌어 표정 생성을 중단했습니다');
  if(b==='up'){ f.up=f.up||{id:'fu'+f.id,name:ko+' 상반신',img:null}; await storeImage(f.up,blob,''); } else await storeImage(f,blob,'');
  mark('c:'+c.id); }
function faceUpperObj(c,F){ return F===c?(c.upper&&imgSrc(c.upper)?c.upper:null):(F.upper&&imgSrc(F.upper)?F.upper:null); }
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
let FACEOPT=null;
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
function skinRefresh(id){ if($('#modal .sheet.cs-sheet')) openChar(id); else if($('#sk_name')) openSkin(id); else render(); }
function skinCard(c,k){
  const slot=(x,l,o)=>`<div class="sk-slot ${x==='illust'||x==='lbcg'?'wide':''}">${o&&imgSrcRaw(o)?`<img src="${esc(imgSrcRaw(o))}" alt="">`:'<span>없음</span>'}<b>${l}</b><div class="sk-acts"><button class="btn sm" data-act="skpartgen" data-id="${c.id}" data-s="${k.id}" data-x="${x}">그리기</button><button class="btn sm ghost" data-act="skpartup" data-id="${c.id}" data-s="${k.id}" data-x="${x}">올리기</button>${o&&o.img?XBTN('skinpart',c.id,` data-s="${k.id}" data-x="${x}"`,'✕'):''}</div></div>`;
  return `<div class="sk-card"><div class="sk-h"><b>${esc(k.name)}</b><span><button class="btn sm" data-act="skpartall" data-id="${c.id}" data-s="${k.id}">빈 칸 모두 그리기</button> <button class="btn sm ghost" data-act="skindel" data-id="${c.id}" data-s="${k.id}">삭제</button></span></div>
    <details><summary>의상 프롬프트 편집</summary><textarea class="in" id="skin_prompt_${k.id}" data-skin-prompt="${k.id}" data-owner="${c.id}">${esc(k.prompt||'')}</textarea><button class="btn sm" data-act="skinpromptsave" data-id="${c.id}" data-s="${k.id}">프롬프트 저장</button><p class="muted">저장한 내용은 이후 새로 그리는 그림에 적용돼요. 기존 그림은 유지돼요.</p></details><div class="sk-grid">${slot('stand','스탠딩',k)}${slot('upper','상반신',k.upper)}${slot('illust','일러스트',k.illust)}${slot('lbcg',T('limit')+' CG',k.lbcg)}</div>
    <label class="f" for="skscene_${k.id}">일러스트·${T('limit')} CG 장면 태그 (선택)</label><input class="in" id="skscene_${k.id}" value="${esc(k.scene||'')}" placeholder="예: beach, sunset, waves, smile">
    <div class="sk-extra"><b>표정</b> ${(k.faces||[]).filter(f=>imgSrc(f)).map(f=>`<span class="sk-face"><img src="${esc(imgSrc(f))}" alt=""><i>${esc(f.name)}</i></span>`).join('')||'<span class="muted">없음 · 없으면 이 '+esc(T('skin'))+' 스탠딩을 써요</span>'}<button class="btn sm ghost" data-act="faces-open" data-id="${c.id}" data-s="${k.id}">표정 만들기</button></div>
    <div class="sk-extra"><b>대사</b> <span class="muted">${(k.lines||[]).length?esc((k.lines||[]).slice(0,2).join(' / '))+((k.lines||[]).length>2?' …':''):'없음 · 없으면 기본 대사를 써요'}</span><button class="btn sm ghost" data-act="skinlines" data-id="${c.id}" data-s="${k.id}">${(k.lines||[]).length?'대사 다시 쓰기':'AI로 대사 쓰기'}</button></div>
    <div class="sk-extra"><b>목소리</b> <span class="muted">${k.voiceId?esc(k.voiceName||'지정됨'):'기본 목소리'}</span><button class="btn sm ghost" data-act="voice" data-id="${c.id}" data-s="${k.id}">${k.voiceId?'바꾸기':'이 '+esc(T('skin'))+' 목소리 고르기'}</button>${k.voiceId?`<button class="btn sm ghost" data-act="skvclear" data-id="${c.id}" data-s="${k.id}">기본으로</button>`:''}</div></div>`; }
function skinPartDraw(c,k,x,generationMode='automatic'){ const inp=$('#skscene_'+k.id); if(inp){k.scene=inp.value.trim();naiBlocksSave(k,'scene',inp);} const scene=k.scene||'',candidateEligible=imageCandidateEligible('char',x==='stand'?k:skinPart(k,x),c,generationMode),originalSrc=imgSrcRaw(x==='stand'?k:skinPart(k,x))||'';
  if(x==='stand') return naiDraw('char',k.prompt,{candidateEligible,originalSrc,styleId:c.naiStyle,frame:c.naiFrame});
  if(x==='upper') return naiDraw('char',k.prompt,{candidateEligible,originalSrc,frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle});
  return naiDraw(x,joinTags(k.prompt,scene||(x==='lbcg'?(c.lbcg&&c.lbcg.prompt)||'dramatic lighting, sparkles, smile, wind':(c.illust&&c.illust.prompt)||'')),{candidateEligible,originalSrc,styleId:c.naiStyle}); }
async function skinPartGen(c,k,xs,btn,generationMode='manual'){ if(!imgReady()){ toast(imgNeed()); return; } if(!k.prompt){ toast('이 '+T('skin')+'은 프롬프트가 없어서 그릴 수 없어요. 올리기를 써 주세요'); return; }
  const game=G,project=PJ().active,label=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='그리는 중…';}let n=0;
  for(const x of xs){ try{ const b=await skinPartDraw(c,k,x,generationMode);if(G!==game||PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await storeImage(x==='stand'?k:skinPart(k,x),b,''); n++; mark('c:'+c.id); }catch(e){ toast(naiErr(e)); break; } }
  if(btn?.isConnected){btn.disabled=false;btn.textContent=label;}if(n)toast(`${k.name}: ${n}장 완성`);skinRefresh(c.id);render(); }
