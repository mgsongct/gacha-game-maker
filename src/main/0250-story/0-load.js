/* ===== 0250-story — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0250-story-factory.js에서 ── */
/* ===== 스토리 공장: 구성 → 스테이지마다 집필 → 마무리(요약·관계·톡) ===== */
let SDEL=null;
// 프롬프트가 없는 자료(대본에서 찾은 소품 등)는 그리기 전에 AI로 한꺼번에 영어 프롬프트를 써요
let LIBP_JOB=null;
/* 새 대원 만들기: 능력치(희귀도·역할 — SYS_BASE)·이벤트 적 기본 능력치·AI 답 정리(cleanChar)·미뤄 둔 스킬 설계 이어 하기 */
// 새 대원 능력치는 희귀도·역할로 시스템이 정해요(밸런스가 들쭉날쭉하지 않게)
const SYS_BASE=GGMCombat.CHARACTER_BASE_STATS;
const SYS_SK={dmg:[1.9,2.3,2.8],aoe:[1.0,1.3,1.6],heal:[1.0,1.3,1.6],shield:[1.1,1.5,1.8],buff:[1.0,1.2,1.4]};
// 새 게임 생성 중에 미뤄 둔 스킬 설계를 게임을 연 뒤 이어서 해요(예전엔 생성 중 백그라운드 작업이 저장·새로고침에 끊겨 임시 스킬로 굳었음)
let SKILL_RESUME=false;
/* src/main/0530-story-memory.js에서 옮김 */

/* ── 0465-story-plan.js에서 ── */
/* ===== 시나리오 설계 (사전 설계 → 장마다 빌드) ===== */

document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='planopen') openPlan();
  else if(a==='plansave'){ planRead(); mark('world'); toast('시나리오 설계를 저장했어요'); openPlan(); }
  else if(a==='planadd'){ planRead(); const p=gameSlot('world.plan'), k=el.dataset.k, n=G.chapters.filter(ch=>ch.kind==='main').length; p[k].push(k==='acts'?{name:'',upto:n+4,goal:''}:k==='twists'?{id:'t'+uid().slice(0,4),truth:'',reveal:n+3,who:'',clues:[]}:k==='branches'?{id:'b'+uid().slice(0,4),at:n+1,question:'',options:[]}:{name:'',start:'',change:'',end:''}); openPlan(); }
  else if(a==='plandel'){ planRead(); gameSlot('world.plan')[el.dataset.k].splice(+el.dataset.i,1); mark('world'); openPlan(); }
  else if(a==='planai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } planRead(); if(await planAI(el.dataset.k,uiProg(el),($('#pl_ins')||{}).value||'')){ toast('시나리오를 설계했어요'); openPlan(); } } });

/* ── 0530-story-memory.js에서 ── */
/* STORY_MEMORY_MODULE */
/* Author-facing story memory. Original scripts are never replaced by memory edits. */
var SM_LIMITS={plot:100000,summary:6000,older:600,recent:2,previous:6000,scene:6000,relations:12000,codex:10000,chunk:10000};
var SM_JOB=null;
addEventListener('ggm-ai',smRecord);
document.addEventListener('click',async e=>{const el=e.target.closest('[data-sm]');if(!el)return;const action=el.dataset.sm,id=el.dataset.id,origin=G,pid=PJ().active;try{
 if(action==='open')openStoryMemory();
 if(action==='chapter')openStoryMemoryEditor(id);
 if(action==='request'){const r=smState().latestRequest;smTextView('최근 스토리 요청',r?`${new Date(r.at).toLocaleString()} · ${r.label} · ${r.characters}자\n상태: ${r.status}\n\n${r.prompt}`:'이 버전에서 아직 스토리를 요청하지 않았습니다.');}
 if(action==='memo')smTextView('이어쓰기 기억 미리보기',storyMemo()+smNotes(false));
 if(action==='inspect')smTextView('저장된 관계·도감',JSON.stringify({relations:G.rels||[],codex:G.world.codex||[],codexNotes:G.world.codexNotes||{}},null,2));
 if(action==='notes-save'){const value=document.getElementById('sm-notes').value;if(value.length>8000){toast('8,000자를 초과했습니다. 내용을 보존한 채 저장을 중단합니다.');return;}gameSlot('meta.storyMemory').notes=value;mark('meta');await flush();toast('확정 규칙을 저장했어요');}
 if(action==='rebuild')await smRebuild(id);
 if(action==='stop'){SM_JOB?.controller.abort();window.navBack();}
 if(action==='save'){const ch=G.chapters.find(x=>x.id===id);if(!ch)return;const text=document.getElementById('sm-text').value,brief=document.getElementById('sm-brief').value,unresolved=document.getElementById('sm-unresolved').value,locked=document.getElementById('sm-locked').checked;if(!text.trim()||text.length>6000||brief.length>600||unresolved.length>1200){toast('기억 내용을 입력하고 각 항목의 글자 범위를 확인해 주세요. 초과 내용은 자르지 않았습니다.');return;}ch.memoryPrevious=JSON.parse(JSON.stringify({memory:ch.memory||null,summary:ch.summary||''}));ch.memory={version:1,text,brief,unresolved,locked,source:'author',at:Date.now(),fingerprint:smFingerprint(ch)};ch.summary=text;mark('ch:'+ch.id);await flush();toast('기억을 저장했어요. 이후 생성부터 반영됩니다.');}
 if(action==='undo'){const ch=G.chapters.find(x=>x.id===id);if(!ch?.memoryPrevious)return;const before=ch.memoryPrevious;if(!await appConfirm('이 장의 이전 기억으로 되돌릴까요? 대본은 바뀌지 않습니다.'))return;if(G!==origin||PJ().active!==pid||!G.chapters.includes(ch)||ch.memoryPrevious!==before)return;const now={memory:ch.memory||null,summary:ch.summary||''};ch.memory=before.memory;ch.summary=before.summary;ch.memoryPrevious=JSON.parse(JSON.stringify(now));mark('ch:'+ch.id);await flush();openStoryMemoryEditor(id);}
 }catch(err){toast(err.message||String(err));}});


document.addEventListener('input',e=>{if(e.target.id==='ng_story'){const count=document.getElementById('story-char-count');if(count)count.textContent=e.target.value.length.toLocaleString()+' / 100,000자'+(e.target.value.length>100000?' · 초과했습니다. 저장 전에 줄여 주세요.':e.target.value.length>50000?' · 긴 원문입니다. AI 사용량과 응답 시간을 확인해 주세요.':'');}});

/* /STORY_MEMORY_MODULE */
