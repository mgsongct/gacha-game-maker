/* ===== 0250-story — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0250-story/0250-story-factory.js에서 옮김 */
function nameTaken(n){ n=String(n||'').trim(); return G.chars.some(c=>c.name===n)||(G.npcs||[]).some(c=>c.name===n); }
function mkNpc(d){ const o=npcNew(String(d.name||'').trim().slice(0,20)); return Object.assign(o,{role:String(d.role||'').slice(0,40),profile:String(d.profile||'').slice(0,600),speech:String(d.speech||'').slice(0,120),look:String(d.look||''),naiPrompt:stripAge(String(d.naiPrompt||''))}); }
function addNpcs(arr){ const out=[]; (Array.isArray(arr)?arr:[]).slice(0,3).forEach(d=>{ if(!d||!String(d.name||'').trim()||nameTaken(d.name)) return; if(isMonsterLike(d)){ monsterFromGen(d); return; } const n=mkNpc(d); G.npcs=G.npcs||[]; G.npcs.push(n); out.push(n); }); if(out.length) mark('meta'); return out; }
function addLib(kind,arr){ let n=0; (Array.isArray(arr)?arr:[]).forEach(b=>{ if(b&&b.name&&!G.lib.some(l=>l.name===String(b.name))){ const l={id:'l'+uid(),kind,name:String(b.name),prompt:String(b.prompt||''),img:null}; G.lib.push(l); mark('l:'+l.id); shAdopt(l); n++; } }); return n; }
// 새 대원: 그 장에서 처음 만나는 '인연'. 데뷔 스테이지를 깨면 상시 계약에 합류해요
function addNewChars(arr,max,stages,opt){ opt=opt||{}; const out=[]; let list=Array.isArray(arr)?arr:(arr&&typeof arr==='object'?[arr]:[]);
  list.slice(0,max).forEach((x,i)=>{ if(!x||!String(x.name||'').trim()||nameTaken(x.name)) return; if(isMonsterLike(x)){ monsterFromGen(x); return; } /* 몬스터는 캐릭터로 만들지 않고 적으로(0445) */ const c=sysStats(cleanChar(x)); if(!c.name) return; c.ord=G.chars.length;
    const st=stages[Math.min(stages.length,Math.max(1,+x.debutStage||1))-1]; if(st) c.debut=st.id; c.bond=String(opt.src||''); c.limited=false;
    if(opt.giftFirst&&!out.length){ c.rarity=Math.min(2,c.rarity||1); sysStats(c); } // 이벤트 배포: 끝까지 깨면 무료 합류(R·SR)
    else if(opt.ch&&c.rarity<3) (opt.ch.recruits=opt.ch.recruits||[]).push(c.id); // R·SR 인연은 장을 끝까지 깨면 무료 합류
    G.chars.push(c); mark('c:'+c.id); out.push(c); }); return out; }
function bondNote(cs,notes){ if(cs&&cs.length) notes.push(`새 인연: ${cs.map(c=>c.name+'('+RL[c.rarity]+')').join(', ')} — 스토리에서 만나면 상시 ${T('gacha')}에 합류해요`); }
// 스토리를 지우면 그 스토리에서 생긴 톡·도감·CG·관계 기록·인연 대원도 골라서 같이 지워요
function relSrcOf(ch){ if(!ch) return []; if(ch.kind==='event') return ['외전 「'+ch.title+'」',ch.title]; const k=G.chapters.filter(c=>c.kind==='main').indexOf(ch); return [(k+1)+'장',ch.title]; }
function storyLinks(ids,ch,ev){ ids=new Set(ids); const stg=[]; G.chapters.forEach(c=>(c.stages||[]).forEach(st=>{ if(ids.has(st.id)) stg.push(st); }));
  const threads=G.threads.filter(t=>t.trigger&&t.trigger.type==='clear'&&ids.has(t.trigger.value));
  const codex=cxStore().filter(x=>x.unlock&&x.unlock.type==='clear'&&ids.has(x.unlock.value));
  const names=kind=>{ const n=new Set(); stg.forEach(st=>parseScript((st.pre||'')+'\n'+(st.post||'')).forEach(L=>{ if(L.type==='cmd'&&kind.includes(L.cmd)&&L.arg&&L.arg!=='끝') n.add(L.arg); })); return n; };
  let other=''; G.chapters.forEach(c=>(c.stages||[]).forEach(st=>{ if(!ids.has(st.id)) other+='\n'+(st.pre||'')+'\n'+(st.post||''); })); G.threads.forEach(t=>{ if(!threads.includes(t)) other+='\n'+(t.script||''); }); G.chars.forEach(c=>(c.episodes||[]).forEach(e=>other+='\n'+(e.script||''))); other+='\n'+((G.opening&&G.opening.prologue)||'');
  const usedElse=n=>other.includes(n);
  const cgN=names(['CG','cg']), prN=names(['소품','사진']);
  const libs=G.lib.filter(l=>(l.kind==='cg'&&cgN.has(l.name)&&!usedElse(l.name))||(l.kind==='prop'&&l.auto&&prN.has(l.name)&&!usedElse(l.name)));
  const recruit=new Set([...((ch&&ch.recruits)||[]),...(ev&&ev.gift?[ev.gift]:[])]);
  const chars=G.chars.filter(c=>!own(c.id)&&((c.debut&&ids.has(c.debut))||recruit.has(c.id)));
  const src=relSrcOf(ch), titles=stg.map(st=>'「'+st.title+'」'), oldSys=r=>r.sys&&!r.stage&&(src.some(x=>String(r.note||'').startsWith(x+':'))||titles.some(x=>String(r.note||'').includes(x))),
    born=r=>((r.stage&&ids.has(r.stage))||(r.src&&src.includes(r.src))||oldSys(r)||((r.hist||[]).length&&(r.hist||[]).every(h=>src.includes(h.src))&&!r.src))&&!(r.hist||[]).some(h=>h.src&&!src.includes(h.src)), rels=RELS().filter(r=>born(r)||(r.hist||[]).some(h=>src.includes(h.src)));
  return {threads,codex,libs,chars,rels,src,ids:[...ids],born}; }
function storyPurge(L,pick){ const P0=P();
  if(pick.threads){ const tid=new Set(L.threads.map(t=>t.id)); G.threads=G.threads.filter(t=>!tid.has(t.id)); tid.forEach(id=>{ delete P0.inbox[id]; mark('t:'+id); }); }
  if(pick.codex){ const xs=new Set(L.codex); cxKeep(x=>!xs.has(x)); mark('world'); }
  if(pick.libs){ const ls=new Set(L.libs); G.lib=G.lib.filter(l=>!ls.has(l)); L.libs.forEach(l=>mark('l:'+l.id)); }
  if(pick.chars){ const cs=new Set(L.chars.map(c=>c.id)); G.chars=G.chars.filter(c=>!cs.has(c.id)); G.banners.forEach(bn=>{ bn.pickup=(bn.pickup||[]).filter(x=>!cs.has(x)); if(bn.pool&&bn.pool.ids) bn.pool.ids=bn.pool.ids.filter(x=>!cs.has(x)); }); G.chapters.forEach(ch=>{ if(ch.recruits) ch.recruits=ch.recruits.filter(x=>!cs.has(x)); }); G.threads=G.threads.filter(t=>!cs.has(t.charId)); cs.forEach(id=>mark('c:'+id)); mark('meta'); }
  relPurgeStory(L,pick); mark('prog'); }
function stageById(id){ for(const ch of G.chapters){ const s=(ch.stages||[]).find(x=>x.id===id); if(s) return s; } return null; }
function debutOk(c){ return !c.debut||!!P().cleared[c.debut]||!stageById(c.debut); }
function buildStages(arr,o){ const list=(Array.isArray(arr)?arr:[]).slice(0,o.max), n=list.length;
  return list.map((s,i)=>{ s=s||{}; const md=i<n-1||storyCfg().finale!=='battle'?modeClean(s):null; /* 전투 중심이면 마지막(보스) 스테이지는 전투 */ const story=!md&&s.battle===false&&i<n-1;
    const st={id:uid(),title:String(s.title||(story?'이야기':o.title||'작전')),reward:o.reward(i),pre:nl(s.pre),post:story?'':nl(s.post),beats:strs(s.beats).slice(0,14).map(x=>x.slice(0,300)),
      enemies:story?[]:(Array.isArray(s.enemies)?s.enemies:[]).slice(0,5).map(e=>({name:String(e.name||'적'),elem:ELEMS.includes(e.elem)?e.elem:o.elem,hp:num(e.hp,100,99999,o.hp),atk:num(e.atk,10,999,o.atk),def:num(e.def,0,500,o.def),spd:num(e.spd,50,160,95),boss:!!e.boss}))};
    if(md){ Object.assign(st,md); st.enemies=[]; if(!st.beats.length) delete st.beats; return st; } // 회담·콘테스트(0488)
    if(story){ st.story=true; if(s.post) st.pre=[st.pre,nl(s.post)].filter(Boolean).join('\n'); }
    else if(!st.enemies.length) st.enemies=[{name:o.foe||'적',elem:o.elem,hp:o.hp,atk:o.atk,def:o.def,spd:95,boss:false}];
    if(!st.beats.length) delete st.beats; if(!story){ const f=ruleClean(FIELDS,s.field); stageAutoRules(st,i,n); if(f) st.field=f; const rt=routeClean(s.route); if(rt) st.route=rt; } return st; }); } // 전장 규칙: AI가 고른 것 우선, 없으면 자동(0485)
async function aiJSONRetry(prompt,tier,tries){ for(let i=0;i<(tries||2);i++){ const r=await aiJSON(prompt,null,tier); if(r) return r; await wait(1500); } return null; }
async function writeStages(ch,o){ const n=ch.stages.length, outline=writeStagesOutlineText({ch});
  for(let i=0;i<n;i++){ const s=ch.stages[i]; o.step(`집필 중 ${i+1}/${n} · ${s.title}`);
    const prev=i?ch.stages[i-1]:null, prevTail=prev?String(prev.post||prev.pre||'').split('\n').slice(-80).join('\n').slice(-6000):String(o.prevTail||'');
    const r=await aiJSONRetry(writeStagesPrompt({o,s,ch,outline,i,prevTail,n}),'complex');
    if(r&&(r.pre||r.post)){ const pre=nl(r.pre), post=nl(r.post); if(s.story){ s.pre=[pre,post].filter(Boolean).join('\n')||s.pre; s.post=''; } else { s.pre=pre||s.pre; s.post=post||s.post; } }
    if(!s.pre) s.pre=(s.beats||[]).join('\n'); }
  mark('ch:'+ch.id); }
function normTalk(t){ return String(t||'').replace(/[\s.,!?~…ㅋㅎㅠㅜ"'“”‘’\-—()]/g,'').toLowerCase(); }
function storySayNorms(ch){ const set=new Set(); (ch.stages||[]).forEach(s=>parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type==='say'){ const x=normTalk(L.text); if(x.length>=4) set.add(x); } })); return set; }
function storyTalkLines(ch){ const out=[]; (ch.stages||[]).forEach(s=>{ let on=false; parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type==='cmd'&&L.cmd==='톡') on=true; else if(L.type==='cmd'&&L.cmd==='톡끝') on=false; else if(on&&L.type==='say') out.push(L.who+': '+L.text); }); }); return out; }
// 톡이 본편 [톡] 장면을 그대로 되풀이하면(말풍선 30% 이상 같으면) 버려요
function threadDup(script,set){ const ls=parseScript(script).filter(L=>L.type==='say').map(L=>normTalk(L.text)).filter(x=>x.length>=4); if(!ls.length||!set.size) return false; const arr=[...set]; let d=0;
  ls.forEach(x=>{ if(set.has(x)||arr.some(y=>(y.length>=8&&x.includes(y))||(x.length>=8&&y.includes(x)))) d++; }); return d/ls.length>=0.3; }
function addThreads(arr,ch,needOwn){ const set=storySayNorms(ch); let n=0;
  (Array.isArray(arr)?arr:[]).forEach(x=>{ const c=x&&findSpeaker(String(x.char||'')); if(!c||!x.script) return; const sc=nl(x.script); if(threadDup(sc,set)) return;
    const st=ch.stages[Math.min(ch.stages.length,Math.max(1,+x.afterStage||1))-1]; const th={id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:{type:'clear',value:st.id},needOwn:!!needOwn,script:sc}; G.threads.push(th); mark('t:'+th.id); n++; });
  return n; }
// 대본에 나왔는데 자료실에 없는 소품·사진·배경은 자료실에 넣어서 그림 준비에 잡히게 해요
function scanScriptAssets(){ const want=new Map(); const scan=t=>{ if(!t) return; parseScript(t).forEach(L=>{ if(L.type!=='cmd') return; if((L.cmd==='소품'||L.cmd==='사진')&&L.arg&&L.arg!=='끝') want.set(L.arg,want.get(L.arg)||'prop'); else if(L.cmd==='배경'&&L.arg) want.set(L.arg,'bg'); }); };
  G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>{ scan(s.pre); scan(s.post); })); G.threads.forEach(t=>scan(t.script)); G.chars.forEach(c=>(c.episodes||[]).forEach(e=>scan(e.script))); scan(G.opening&&G.opening.prologue);
  let n=0; want.forEach((kind,name)=>{ if(G.lib.some(l=>l.name===name)) return; if(kind==='bg'&&G.lib.some(l=>l.kind==='bg'&&(l.name.includes(name)||name.includes(l.name)))) return; const l={id:'l'+uid(),kind,name:String(name).slice(0,40),prompt:'',img:null,auto:true}; G.lib.push(l); mark('l:'+l.id); shAdopt(l); n++; }); return n; }
function ensureLibPrompts(){ if(LIBP_JOB) return LIBP_JOB; const need=G.lib.filter(l=>(['prop','bg'].includes(l.kind)||(l.kind==='enemy'&&!l.alias&&!l.charId))&&!l.prompt); if(!need.length) return Promise.resolve();
  LIBP_JOB=(async()=>{ try{ let r=null; if(SAMPLE){ try{ r=await SAMPLE.json(ensureLibPromptsPrompt({need}),{modelTier:'quick',cache:false}); }catch(e){ quietErr(e,'0250-story-factory.js:97'); } }
      need.forEach(l=>{ const x=(r&&Array.isArray(r.items)?r.items:[]).find(y=>y&&y.name===l.name); l.prompt=String((x&&x.prompt)||({bg:'no humans, scenery, ',enemy:'no humans, monster, '})[l.kind]||'no humans, object focus, simple background, ')+(x&&x.prompt?'':l.name); mark('l:'+l.id); }); }
    finally{ LIBP_JOB=null; } })(); return LIBP_JOB; }
// 이벤트의 로어 범위를 바꿔요: 이 이벤트가 남긴 관계 기록을 지우고, 새 범위로 대본에서 다시 정리해요
function evLoreSet(ev,nl){ const ch=G.chapters.find(c=>c.id===ev.chapterId); nl=loreOf({lore:nl});
  if(ch){ storyPurge(storyLinks(ch.stages.map(s=>s.id),ch,ev),{rels:1}); }
  ev.lore=nl||undefined; ev.gen=Object.assign({},ev.gen||{},{lore:nl});
  if(ch){ ch.lore=nl||undefined; delete ch.relScan; relFromScripts(ch,'외전 「'+ch.title+'」'); mark('ch:'+ch.id); } mark('prog'); }
function sysStats(c){ const r=[1,2,3].includes(+c.rarity)?+c.rarity:1,i=r-1,B=SYS_BASE[c.role]||SYS_BASE.atk;
  Object.assign(c,GGMCombat.generateBaseStats(c),{baseStatsVersion:1});
  const k=B.sk.includes(c.skill.kind)?c.skill.kind:B.sk[0]; c.skill.kind=k; c.skill.power=SYS_SK[k][i]; c.skill.cd=k==='dmg'?(r===1?2:3):k==='buff'&&r>1?4:3; return c; }
// 적 기본 능력치를 만든 뒤 v2BalanceChapter에서 실제 전투 시뮬레이션으로 조정
function sysEventFoes(ch){ (ch.stages||[]).forEach((s,i)=>(s.enemies||[]).forEach(e=>{ if(e.manual) return; const m=(1+0.08*i)*(e.boss?4.5:1); e.hp=Math.round(1100*m*(0.92+Math.random()*0.16)); e.atk=Math.round(85*(e.boss?1.3:1)*(1+0.05*i)); e.def=Math.round(42*(1+0.05*i)); e.spd=e.spd||95; })); }
async function skillResume(){ if(SKILL_RESUME||!SAMPLE) return; const L=G.chars.filter(c=>c.skillPending); if(!L.length) return; SKILL_RESUME=true; const g0=G;
  try{ for(const c of L){ if(G!==g0) break; try{ c.skillGenerationWarning='스킬을 설계하는 중…'; const kit=await v2GenerateSkills(c,'',m=>{c.skillGenerationWarning=m;}); if(G!==g0) break; c.skills=kit; delete c.skillPending; delete c.skillGenerationWarning; await v2QueueCharacter(c); mark('c:'+c.id); }
    catch(e){ if(G!==g0) break; c.skillGenerationWarning='스킬 설계를 마치지 못했어요: '+String(e&&(e.message||e.code)||e).slice(0,80)+' — 스킬 편집기에서 다시 만들 수 있어요'; mark('c:'+c.id); } } }finally{ SKILL_RESUME=false; } }
function cleanChar0(o){
  o=o||{}; const sk=o.skill||{}, tc=o.touch||{}, w=o.weapon||{}, id=uid(), aff={},tank=o.role==='def'?GGMCombat.generateBaseStats(o):null;
  Object.entries(o.affLines||{}).forEach(([k,v])=>{const n=parseInt(k,10);if(n>=1&&n<=10)aff[n]=strs(v);});
  return {id,genVer:auditGenVer(),ord:G.chars.length,name:String(o.name||'').slice(0,20),age:24,faction:String(o.faction||''),limited:!!o.limited,
    useStanding:o.useStanding===true,rarity:[1,2,3].includes(+o.rarity)?+o.rarity:1,role:ROLE[o.role]?o.role:'atk',elem:ELEMS.includes(o.elem)?o.elem:ELEMS[0],
    baseStatsVersion:1,hp:tank?tank.hp:num(o.hp,600,2000,1000),atk:num(o.atk,60,200,110),def:tank?tank.def:num(o.def,20,120,50),spd:num(o.spd,70,130,100),
    skill:{name:String(sk.name||'스킬').slice(0,20),kind:KIND[sk.kind]?sk.kind:'dmg',power:num(sk.power,0.5,3.2,1.6),cd:num(Math.round(sk.cd),2,5,3),desc:String(sk.desc||'')},
    profile:String(o.profile||''),intro:String(o.intro||''),lines:strs(o.lines).slice(0,12),affLines:aff,lvLines:strs(o.lvLines).slice(0,4),dupLines:strs(o.dupLines).slice(0,3),
    touch:{head:strs(tc.head).slice(0,8),body:strs(tc.body).slice(0,8),pet:strs(tc.pet).slice(0,8)},
    files:(Array.isArray(o.files)?o.files:[]).map(f=>({dup:num(parseInt(f.dup,10),1,5,1),text:String(f.text||'')})).filter(f=>f.text).slice(0,5),
    weapon:{id:'w_'+id,name:String(w.name||''),desc:String(w.desc||''),prompt:String(w.prompt||''),img:null},
    naiPrompt:allyTags(String(o.naiPrompt||'')),img:null,episodes:[],faces:[],skins:[],illust:{id:'il_'+id,kind:'illust',name:String(o.name||'')+' 일러스트',prompt:'',img:null},upper:{id:'up_'+id,kind:'upper',name:String(o.name||'')+' 상반신',prompt:'',img:null},pose:{id:'po_'+id,kind:'pose',name:String(o.name||'')+' 로비 포즈',prompt:'',img:null},lbbg:{id:'lg_'+id,kind:'lbbg',name:String(o.name||'')+' 로비 배경',prompt:'',img:null},lbcg:{id:'lb_'+id,kind:'lbcg',name:String(o.name||'')+' 돌파 CG',prompt:'',img:null}};
}
function smPrevious(ch){const s=ch?.stages?.at(-1);return String(s?.post||s?.pre||'').slice(-SM_LIMITS.previous);}
/* src/main/0250-story/0465-story-plan.js에서 옮김 */
/* 그때그때 즉흥으로 쓰지 않고, 큰 틀(로그라인·주제·결말·막 구성)·숨겨진 반전(진실·공개 장·복선)·분기(선택 → 이후 장에 반영)·캐릭터 아크를
   먼저 설계해 두고, 장을 쓸 때 그 장에 필요한 것만(막 목표·심을 복선·지금 밝힐 반전·아직 숨길 것·분기 결과) AI에 넘겨요.
   G.world.plan = {logline,theme,ending,acts[{name,upto,goal}],twists[{id,truth,reveal,clues[{ch,hint}],who}],branches[{id,at,question,options[{label,result}]}],arcs[{name,start,change,end}],notes}
   분기: 대본에 "[분기: id]" 다음 줄의 선택지를 고르면 P().flags[id]=번호(1부터) → 다음 장을 쓸 때 반영. 문서: docs/research/story-design.md */
function PLAN(){ return gameRead('world.plan'); } // 읽기 — 바꿀 때는 gameSlot('world.plan')
function planHas(){ const p=G.world.plan; return !!(p&&(p.logline||(p.acts||[]).length||(p.twists||[]).length)); }
function planActOf(n){ return PLAN().acts.find(a=>n<=(+a.upto||999))||PLAN().acts.at(-1)||null; }
// 점검: 복선 없이 밝히는 반전, 공개 장 뒤에 있는 복선, 공개 장이 지났는데 대본에 없는 반전, 분기가 대본에 없음
function planCheck(){ const p=PLAN(), main=G.chapters.filter(ch=>ch.kind==='main'), n=main.length, txt=i=>{ const ch=main[i-1]; return ch?(ch.stages||[]).map(s=>(s.pre||'')+'\n'+(s.post||'')).join('\n'):''; }, out=[];
  if(!p.logline) out.push('로그라인이 없어요'); if(!p.acts.length) out.push('막 구성이 없어요');
  p.twists.forEach(t=>{ const cl=(t.clues||[]).filter(c=>c.hint); if(!cl.length) out.push(`반전 「${t.truth.slice(0,20)}」에 복선이 없어요`); else if(cl.every(c=>+c.ch>=+t.reveal)) out.push(`반전 「${t.truth.slice(0,20)}」의 복선이 모두 공개 장(${t.reveal}장) 이후예요`);
    if(+t.reveal&&+t.reveal<=n&&!t.done) out.push(`${t.reveal}장이 이미 있는데 반전 「${t.truth.slice(0,20)}」 공개를 확인하지 않았어요(대본 확인 후 '공개됨' 표시)`); });
  p.branches.forEach(b=>{ if(+b.at<=n&&!txt(+b.at).includes('[분기: '+b.id+']')&&!txt(+b.at).includes('[분기:'+b.id+']')) out.push(`${b.at}장 대본에 분기 「${b.question.slice(0,20)}」([분기: ${b.id}])가 없어요`); if((b.options||[]).length<2) out.push(`분기 「${b.question.slice(0,20)}」의 보기가 2개 미만이에요`); });
  const last=p.acts.length?+p.acts.at(-1).upto:0; if(last&&n>last) out.push(`지금 ${n}장으로 설계한 막(~${last}장)을 넘었어요 — 다음 막을 설계해 주세요`);
  return out; }
async function planAI(mode,rep,instruction){ const p=PLAN(), n=G.chapters.filter(ch=>ch.kind==='main').length;
  const r=await aiJSON(planAIPrompt({mode,p,n,instruction}),rep,'complex');
  if(!r) return false; const old=gameSlot('world.plan'), clean=planClean(r);
  if(mode==='extend'){ old.acts.push(...clean.acts.filter(a=>+a.upto>(+(old.acts.at(-1)||{}).upto||0))); old.twists.push(...clean.twists.filter(t=>!old.twists.some(x=>x.id===t.id))); old.branches.push(...clean.branches.filter(b=>!old.branches.some(x=>x.id===b.id))); clean.arcs.forEach(a=>{ if(!old.arcs.some(x=>x.name===a.name)) old.arcs.push(a); }); }
  else G.world.plan=Object.assign(old,clean,{notes:old.notes||''});
  mark('world'); return true; }
function planClean(r){ const S=(v,n)=>String(v||'').trim().slice(0,n||200), N=v=>Math.max(1,Math.min(99,Math.round(+v||1)));
  return {logline:S(r.logline,160),theme:S(r.theme,80),ending:S(r.ending,200),acts:(r.acts||[]).slice(0,8).map(a=>({name:S(a.name,30),upto:N(a.upto),goal:S(a.goal)})).filter(a=>a.name),
   twists:(r.twists||[]).slice(0,8).map((t,i)=>({id:S(t.id,12).replace(/[^\w-]/g,'')||'t'+(i+1),truth:S(t.truth),reveal:N(t.reveal),who:S(t.who,40),clues:(t.clues||[]).slice(0,5).map(c=>({ch:N(c.ch),hint:S(c.hint,120)})).filter(c=>c.hint)})).filter(t=>t.truth),
   branches:(r.branches||[]).slice(0,6).map((b,i)=>({id:S(b.id,12).replace(/[^\w-]/g,'')||'b'+(i+1),at:N(b.at),question:S(b.question,120),options:(b.options||[]).slice(0,4).map(o=>({label:S(o.label,30),result:S(o.result,160)})).filter(o=>o.label)})).filter(b=>b.question),
   arcs:(r.arcs||[]).slice(0,8).map(a=>({name:S(a.name,20),start:S(a.start,80),change:S(a.change,80),end:S(a.end,80)})).filter(a=>a.name)}; }
/* 시나리오는 게임이 구동될 때 AI가 처리(자동이 기본): 장을 쓰기 전에 설계가 없으면 처음부터, 설계된 막이 이번 장 앞에서 끝났으면 다음 막을 이어서 설계.
   사용자는 설정 → 시나리오 설계에서 직접 고치거나 AI에 추가 지시할 수 있어요. 구독 게임·글 AI 없음이면 하지 않음 */
async function planEnsure(n){ if(!SAMPLE||subLocked()) return false; const last=+((PLAN().acts.at(-1)||{}).upto||0);
  if(!planHas()) return planAI('new',null);
  if(last&&last<n) return planAI('extend',null);
  return false; }
/* src/main/0250-story/0530-story-memory.js에서 옮김 */
function smState(){return gameRead('meta.storyMemory');} // 읽기 — 바꿀 때는 gameSlot('meta.storyMemory')
function smFingerprint(ch){return hash(JSON.stringify((ch.stages||[]).map(s=>[s.title,s.pre,s.post]))).toString(36);}
function smChunks(ch){const chunks=[];for(const [i,s]of (ch.stages||[]).entries()){const body='[스테이지 '+(i+1)+' '+s.title+']\n'+(s.pre||'')+'\n'+(s.post||'');for(let p=0;p<body.length;p+=SM_LIMITS.chunk)chunks.push(body.slice(p,p+SM_LIMITS.chunk));}return chunks;}
async function smExtract(ch,{signal,onProgress=()=>{}}={}){const origin=G,pid=PJ().active,fp=smFingerprint(ch),parts=smChunks(ch);if(!parts.length)throw Error('정리할 대본이 없습니다.');const check=()=>{if(signal?.aborted)throw Error('중단했습니다. 기존 기억은 유지됩니다.');if(G!==origin||PJ().active!==pid||!G.chapters.includes(ch)||smFingerprint(ch)!==fp)throw Error('게임 또는 대본이 바뀌어 결과를 적용하지 않습니다.');};
 const request=async(prompt)=>{check();if(!SAMPLE)throw Error('글 AI를 먼저 연결해 주세요.');const result=await SAMPLE.json(prompt,{modelTier:'default',signal});check();if(!result||typeof result.text!=='string'||!result.text.trim()||result.text.length>6000)throw Error('기억 응답이 비었거나 6,000자를 초과했습니다. 다시 정리해 주세요.');return result;};
 let records=[];for(let i=0;i<parts.length;i++){onProgress('대본 읽는 중 '+(i+1)+'/'+parts.length);const r=await request(smExtractPrompt({i,parts}));records.push(r.text);}
 while(records.join('\n').length>24000){const next=[];let group=[],size=0;const batches=[];for(const r of records){if(size+r.length>12000&&group.length){batches.push(group);group=[];size=0;}group.push(r);size+=r.length;}if(group.length)batches.push(group);onProgress('전체 대본 기록을 합치는 중');for(const batch of batches){const r=await request(pf('SM_EXTRACT_MERGE')+batch.join('\n\n'));next.push(r.text);}if(next.join('\n').length>=records.join('\n').length)throw Error('중간 기록을 충분히 정리하지 못했습니다. 기존 기억은 유지됩니다.');records=next;}
 onProgress('사건·관계·인지·복선을 정리하는 중');const r=await request(smExtractPrompt2({ch,records}));if(String(r.brief||'').length>600||String(r.unresolved||'').length>1200)throw Error('짧은 기억 또는 미회수 기록이 범위를 초과했습니다.');return {version:1,text:r.text,brief:String(r.brief||''),unresolved:String(r.unresolved||''),fingerprint:fp,at:Date.now(),source:'ai',locked:false};}
/* 최근 스토리 요청 기록: AI 연결이 알리는 요청 단계(창 이벤트 ggm-ai — start·ok·fail)를 듣고 스토리 참조 요청만 기록(요청 준비 → 응답 수신·실패). AI 연결은 스토리 기억을 모름 */
function smRecord({detail:d}){const prompt=String(d.prompt);if(!prompt.includes('【스토리 참조:'))return;if(d.phase==='start'){const label=(prompt.match(/【스토리 참조:([^】]+)】/)||[])[1]||'스토리';gameSlot('meta.storyMemory').latestRequest={at:Date.now(),label,tier:d.tier,characters:prompt.length,prompt,status:'요청 준비'};mark('meta');return;}
 if(!smState().latestRequest)return;gameSlot('meta.storyMemory').latestRequest.status=d.phase==='ok'?'응답 수신':'실패: '+d.error;mark('meta');}
