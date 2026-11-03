/* ===== 스토리 공장: 구성 → 스테이지마다 집필 → 마무리(요약·관계·톡) ===== */
// 진행 표시: 버튼이 있으면 버튼 글자, 뒤에서 만드는 중이면 그 작업 칩, 아니면 위쪽 막대
function genStep(t,key,label){ return m=>{ if(t){ if(t.isConnected) t.textContent=m; return; } const j=typeof BGJOBS!=='undefined'&&BGJOBS.find(x=>x.key===key); if(j){ j.sub=m; bgJobsDraw(); } else liveBar(label+' · '+m); }; }
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
  if(pick.codex){ const xs=new Set(L.codex); G.world.codex=cxStore().filter(x=>!xs.has(x)); mark('world'); }
  if(pick.libs){ const ls=new Set(L.libs); G.lib=G.lib.filter(l=>!ls.has(l)); L.libs.forEach(l=>mark('l:'+l.id)); }
  if(pick.rels){ const gone=new Set(L.rels.filter(L.born).map(r=>r.id)); G.rels=RELS().filter(r=>!gone.has(r.id)); RELS().forEach(r=>{ if(r.hist) r.hist=r.hist.filter(h=>!L.src.includes(h.src)); }); mark('meta'); }
  if(pick.chars){ const cs=new Set(L.chars.map(c=>c.id)); G.chars=G.chars.filter(c=>!cs.has(c.id)); G.banners.forEach(bn=>{ bn.pickup=(bn.pickup||[]).filter(x=>!cs.has(x)); if(bn.pool&&bn.pool.ids) bn.pool.ids=bn.pool.ids.filter(x=>!cs.has(x)); }); G.chapters.forEach(ch=>{ if(ch.recruits) ch.recruits=ch.recruits.filter(x=>!cs.has(x)); }); G.threads=G.threads.filter(t=>!cs.has(t.charId)); G.rels=RELS().filter(r=>!cs.has(r.a)&&!cs.has(r.b)); cs.forEach(id=>mark('c:'+id)); mark('meta'); }
  relGC(); mark('prog'); }
// 관계 청소: 없어진 인물·스테이지에서 생긴 자동 기록, 내용이 다 지워진 빈 기록을 지워요
function relGC(){ const ok=x=>x===REL_ME||x.startsWith('x:')||!!relObj(x); let fixd=0;
  RELS().forEach(r=>{ [['a','an'],['b','bn']].forEach(([k,n])=>{ if(ok(r[k])||!r[n]) return; const c=findSpeaker(r[n])||npcBy(r[n]); if(c){ r[k]=baseChar(c).id||c.id; fixd++; } }); if(!r.an||!r.bn) relNames(r); });
  if(fixd){ const seen=new Map(); G.rels=RELS().filter(r=>{ if(r.a===r.b) return false; const k=[r.a,r.b].sort().join('|'); if(seen.has(k)){ const o=seen.get(k); o.hist=[...(o.hist||[]),...(r.hist||[])].slice(-12); return false; } seen.set(k,r); return true; }); mark('meta'); }
  const n0=RELS().length;
  G.rels=RELS().filter(r=>ok(r.a)&&ok(r.b)&&!(r.stage&&!stageById(r.stage))&&!(!r.sys&&!r.note&&!(r.hist||[]).length&&r.src)); if(RELS().length!==n0) mark('meta'); return n0-RELS().length; }
let SDEL=null;
function openStoryDel(o){ // o: {title, ids, ch, ev, run:()=>void(실제 스토리 삭제)}
  const L=storyLinks(o.ids,o.ch,o.ev); SDEL={o,L};
  const row=(k,label,n,on,hint)=>n?`<label class="pc"><input type="checkbox" data-sd="${k}" ${on?'checked':''}><b>${esc(label)}</b><span>${n}개</span>${hint?`<small class="muted" style="display:block;font-size:.72rem">${esc(hint)}</small>`:''}</label>`:'';
  const rows=row('threads',T('talk')+' (이 스토리를 깨면 오는 대화)',L.threads.length,1)+row('codex','도감 기록',L.codex.length,1)+row('libs','CG·소품 (이 스토리에만 나오는 것)',L.libs.length,1)+row('rels','관계 기록 (이 스토리에서 생긴 것)',L.rels.length,1)+row('chars','이 스토리에서 만난 인연 '+T('crew'),L.chars.length,0,'아직 보유하지 않은 '+T('crew')+'만 · '+L.chars.map(c=>c.name).join(', '));
  openModal(`${head('스토리 삭제',`<span class="muted">${esc(o.title)}</span>`)}
    <p style="margin:0 0 8px">이 스토리를 지울까요?${rows?' 함께 지울 것을 골라 주세요.':''}</p>
    ${rows?`<div class="prepcats">${rows}</div>`:'<p class="muted">함께 지울 톡·도감·CG가 없어요.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="sdelgo" style="background:var(--rose)">삭제</button><button class="btn ghost" data-act="sdelno">취소</button></div>`); }
function stageById(id){ for(const ch of G.chapters){ const s=(ch.stages||[]).find(x=>x.id===id); if(s) return s; } return null; }
function debutOk(c){ return !c.debut||!!P().cleared[c.debut]||!stageById(c.debut); }
function newBonds(s){ const cs=G.chars.filter(c=>c.debut===s.id); if(!cs.length) return; cs.forEach(c=>{ if(!relPair(REL_ME,c.id)) relApply([{a:T('player'),b:c.name,kind:'첫 만남',note:`「${s.title}」에서 처음 만났다.`}],''); });
  setTimeout(()=>toast(`새 인연: ${cs.map(c=>`${c.name}(${RL[c.rarity]})`).join(', ')} · 이제 상시 ${T('gacha')}에서 만날 수 있어요`),600); }
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
// 프롬프트가 없는 자료(대본에서 찾은 소품 등)는 그리기 전에 AI로 한꺼번에 영어 프롬프트를 써요
let LIBP_JOB=null;
function ensureLibPrompts(){ if(LIBP_JOB) return LIBP_JOB; const need=G.lib.filter(l=>(['prop','bg'].includes(l.kind)||(l.kind==='enemy'&&!l.alias&&!l.charId))&&!l.prompt); if(!need.length) return Promise.resolve();
  LIBP_JOB=(async()=>{ try{ let r=null; if(SAMPLE){ try{ r=await SAMPLE.json(ensureLibPromptsPrompt({need}),{modelTier:'quick',cache:false}); }catch(e){ quietErr(e,'0250-story-factory.js:97'); } }
      need.forEach(l=>{ const x=(r&&Array.isArray(r.items)?r.items:[]).find(y=>y&&y.name===l.name); l.prompt=String((x&&x.prompt)||({bg:'no humans, scenery, ',enemy:'no humans, monster, '})[l.kind]||'no humans, object focus, simple background, ')+(x&&x.prompt?'':l.name); mark('l:'+l.id); }); }
    finally{ LIBP_JOB=null; } })(); return LIBP_JOB; }
// 파견 보상은 시간·인원에 비례(예전엔 순서대로 고정 표에서 붙어 0.5시간·1명짜리가 가장 큰 보상을 받기도 했음)
async function aiChapterGen0(dir,n,cast,t){
  const k=G.chapters.filter(c=>c.kind==='main').length,hl=Math.round(800*(1+.6*k)),hh=Math.round(1400*(1+.6*k)),al=Math.round(75*(1+.25*k)),ah=Math.round(105*(1+.25*k)),dl=30+15*k,dh=60+15*k;
  const SC=storyCfg(), deep=SC.depth!=='fast', LS=lenSpec(), main=G.chapters.filter(c=>c.kind==='main'), lastPost=smPrevious(main.at(-1));
  const lbl=t?t.textContent:''; if(t) t.disabled=true; const step=genStep(t,'chapter','메인 스토리 '+(k+1)+'장'); step('시나리오 설계를 확인하는 중…'); await planEnsure(k+1); /* 시나리오 설계 자동(0465) */
  try{
    memCatchUp();
    const castRefs=cast.map(relRef).filter(Boolean), memo=storyMemo(), rel=relCtx([dir,cast.join(' '),lastPost.slice(-6000)].join('\n'),castRefs,50);
    step(deep?'장 구성을 짜는 중…':'대본을 쓰는 중…');
    const r=await aiJSON(aiChapterGen0Prompt({dir,cast,memo,rel,k,deep,lastPost,SC,n,LS}),null,'complex');
    if(!(r&&Array.isArray(r.stages)&&r.stages.length)){ if(r&&t) toast('AI 응답에 스테이지가 없어요. 다시 시도해 주세요.'); return null; }
    const ch={id:uid(),ord:k,kind:'main',title:String(r.title||`${k+1}장`),logline:String(r.logline||'').slice(0,120),stages:buildStages(r.stages,{max:12,reward:i=>300+150*k+100*i,elem:ELEMS[0],hp:hl,atk:al,def:dl,foe:'적'})};
    await v2BalanceChapter(ch,k);
    // 새 인물·자료를 먼저 넣어야 집필할 때 AI가 알아요
    const newc=addNewChars(r.newCharacters,SC.newc,ch.stages,{src:ch.title,ch}), npcs=addNpcs(r.newNpcs); stanceApply(r.stance,k+1); bestiaryApply(r.bestiary); debutResolve(ch); // 세력 관계 변화·적 도감·나중 등장 캐릭터(0445)
    let nb=addLib('bg',r.backgrounds)+addLib('bgm',r.music)+addLib('prop',r.props)+addCGs(r.cgs), nt=0;
    G.chapters.push(ch); mark('ch:'+ch.id); syncEnemies(G,lookMap(r.stages)); try{ cxFromChapter(r,ch); }catch(e){}
    if(deep){ await writeStages(ch,{head:`메인 스토리 ${k+1}장. 방향: "${dir}".${newc.length?' 이 장에서 처음 만나는 신규 '+T('crew')+': '+newc.map(c=>c.name+'('+String(c.profile).slice(0,60)+')').join(', ')+'.':''}`,LS,step,memo,castRefs,castText:dir+' '+cast.join(' ')+' '+newc.map(c=>c.name).join(' '),prevTail:lastPost.split('\n').slice(-80).join('\n').slice(-6000),plan:planCtx(k+1)}); debutResolve(ch);
      step('요약·관계·'+T('talk')+'를 정리하는 중…'); const w=await storyWrapUp(ch,'1~2'); if(w){ ch.summary=String(w.summary||'').slice(0,6000); relApply(w.relations,`${k+1}장`); nt=addThreads(w.threads,ch,true); } }
    else { const memoryResult=await storyWrapUp(ch,'1~2',{followups:false});ch.summary=String(memoryResult?.summary||r.summary||'').slice(0,6000); relApply(r.relations,`${k+1}장`); nt=addThreads(r.threads,ch,true); }
    relFromScripts(ch,`${k+1}장`); mark('ch:'+ch.id); nb+=scanScriptAssets();
    try{ await autoNpcs([ch]); }catch(e){ quietErr(e,'0250-story-factory.js:120'); }
    return {ch,nb,nt,newc,nc:newc,npcs};
  } finally { if(t){ t.disabled=false; if(t.isConnected&&lbl) t.textContent=lbl; } }
}
async function aiEvent(t){
  const dir=$('#ae_d').value.trim(); if(!dir){toast('이벤트 내용을 적어 주세요');return;}
  const n=+$('#ae_n').value, mk=$('#ae_new').value==='1', cast=[...document.querySelectorAll('.chip.on')].map(b=>charById(b.dataset.id)?.name).filter(Boolean), len=$('#ae_len')?$('#ae_len').value:'', lore=$('#ae_lore')?$('#ae_lore').value:'';
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } closeModal();
  bgJob('event','이벤트 만드는 중',async()=>{ const res=await aiEventGen(dir,n,mk,cast,null,len,lore); if(!res) return null; P().curEvent=res.ev.id;
    return {title:`이벤트 「${res.ev.title}」가 열렸어요`,body:`${T('event')} 화면에서 바로 플레이할 수 있어요.${res.nc?`\n이벤트를 끝까지 깨면 ${RL[res.nc.rarity]} ${res.nc.name}이(가) 배포 ${T('crew')}로 무료 합류해요.`:''}${res.ncs&&res.ncs.length>1?`\n새 인연: ${res.ncs.slice(1).map(c=>RL[c.rarity]+' '+c.name).join(', ')} — 이야기에서 만나면 상시 ${T('gacha')}에 합류해요.`:''}\n새 자료 ${res.nb}개가 추가됐어요.`}; });
}
async function aiEventGen(dir,n,mk,cast,t,len,lore){ const snap=artSnap(); const r=await aiEventGen0(dir,n,mk,cast,t,len,lore); if(r) artAfterAI(snap,'새 이벤트 「'+((r.ev&&r.ev.title)||'')+'」'); return r; }
async function aiEventGen0(dir,n,mk,cast,t,len,lore){ len=STORY_LEN[len]?len:storyCfg().len; const LS=STORY_LEN[len][1]; const LORE=loreOf({lore}), LALT=LORE&&LORE!=='if'?charById(LORE):null;
  const loreHint=aiEventGen0LoreHintText({LORE,LALT});
  if(!dir){ const mon=new Date().getMonth()+1; dir=`${mon}월의 계절감과 기념일을 살린 기간 한정 이벤트를 자유롭게 기획한다. 지난 이벤트(${G.events.map(e=>e.title).join(', ')||'없음'})와 겹치지 않게.`; }
  const SC=storyCfg(), deep=SC.depth!=='fast', ncN=mk?Math.max(1,SC.newc):0;
  const lbl=t?t.textContent:''; if(t) t.disabled=true; const step=genStep(t,'event','이벤트');
  try{
  memCatchUp(); const castRefs=[...cast.map(relRef).filter(Boolean),...(LALT?[LALT.id]:[])], memo='', rel=relCtx([dir,cast.join(' ')].join('\n'),castRefs,40);
  step(deep?'이벤트 구성을 짜는 중…':'이벤트를 쓰는 중…');
  const r=await aiJSON(aiEventGen0Prompt({rel,deep,dir,cast,loreHint,n,LS,ncN}),null,'complex');
  if(!r||!Array.isArray(r.stages)||!r.stages.length){ if(r&&t) toast('AI 응답에 스테이지가 없어요'); return null; }
  const evId='ev'+uid(), chId='evc'+uid(), bId='b'+uid(), ttl=String(r.title||'이벤트');
  const ch={id:chId,kind:'event',eventId:evId,ord:200,title:ttl,lore:LORE||undefined,logline:String(r.desc||'').slice(0,120),stages:buildStages(r.stages,{max:6,reward:i=>60+30*i,elem:ELEMS[0],hp:1000,atk:80,def:40,foe:'적',title:'스테이지'})};
  const ncs=addNewChars(r.newCharacters&&r.newCharacters.length?r.newCharacters:r.newCharacter,ncN,ch.stages,{src:'외전 「'+ttl+'」',giftFirst:true}), nc=ncs[0]||null, npcs=addNpcs(r.newNpcs); bestiaryApply(r.bestiary);
  sysEventFoes(ch); await v2BalanceChapter(ch,Math.max(0,G.chapters.filter(c=>c.kind==='main').length-1)); G.chapters.push(ch); mark('ch:'+chId); syncEnemies(G,lookMap(r.stages));
  const ups=[...strs(r.pickup).map(nm=>findSpeaker(nm)).filter(Boolean).map(c=>c.id)]; if(nc) ups.unshift(nc.id);
  G.banners.push({id:bId,name:String(r.bannerName||r.title||'이벤트 배너'),type:'event',desc:String(r.desc||''),pool:{mode:'all',factions:[],ids:[]},pickup:[...new Set(ups)].slice(0,3),rate:60,active:true,bg:String(r.bg||''),eventId:evId});
  const ev={id:evId,lore:LORE||undefined,gift:nc?nc.id:'',gate:mainCleared(),gen:{dir:String(dir||'').slice(0,4000),n,len,lore:LORE},title:ttl,desc:String(r.desc||''),token:String(r.token||'이벤트 토큰'),active:true,chapterId:chId,bannerId:bId,bg:String(r.bg||''),bgm:String(r.bgm||''),shop:[]};
  ev.shop=defaultShop(ev); G.events.push(ev);
  let nb=addCGs(r.cgs)+addLib('bg',r.backgrounds)+addLib('bgm',r.music)+addLib('prop',r.props);
  const src='외전 「'+ttl+'」';
  if(deep){ await writeStages(ch,{head:`기간 한정 이벤트 「${ttl}」: ${String(r.desc||'')}. 기획: "${dir}".${ncs.length?' 이 이벤트에서 처음 만나는 신규 '+T('crew')+': '+ncs.map(c=>c.name+'('+RL[c.rarity]+', '+String(c.profile).slice(0,60)+')').join(', ')+'.':''}`,LS,step,memo,side:true,castRefs,castText:dir+' '+cast.join(' ')+' '+ncs.map(c=>c.name).join(' ')});
    step('요약·관계·'+T('talk')+'를 정리하는 중…'); const w=await storyWrapUp(ch,'1~2'); if(w){ ch.summary=String(w.summary||'').slice(0,6000); relApply(w.relations,src,false,LORE); addThreads(w.threads,ch,false); } }
  else { const memoryResult=await storyWrapUp(ch,'1~2',{followups:false});ch.summary=String(memoryResult?.summary||r.summary||'').slice(0,6000); relApply(r.relations,src,false,LORE); addThreads(r.threads,ch,false); }
  relFromScripts(ch,src); mark('ch:'+chId); nb+=scanScriptAssets();
  try{ await autoNpcs([ch]); }catch(e){ quietErr(e,'0250-story-factory.js:156'); }
  mark('prog'); return {ev,nc,ncs,nb,npcs};
  } finally { if(t){ t.disabled=false; if(t.isConnected&&lbl) t.textContent=lbl; } }
}
function readBanner(){const b=BD;b.name=$('#bn_name').value.trim()||b.name;b.desc=$('#bn_desc').value.trim();b.type=$('#bn_type').value;b.bg=$('#bn_bg').value;b.pool.mode=$('#bn_mode').value;b.rate=num($('#bn_rate').value,0,100,50);b.active=$('#bn_act').value==='1';return b;}
// 이벤트의 로어 범위를 바꿔요: 이 이벤트가 남긴 관계 기록을 지우고, 새 범위로 대본에서 다시 정리해요
function evLoreSet(ev,nl){ const ch=G.chapters.find(c=>c.id===ev.chapterId); nl=loreOf({lore:nl});
  if(ch){ storyPurge(storyLinks(ch.stages.map(s=>s.id),ch,ev),{rels:1}); }
  ev.lore=nl||undefined; ev.gen=Object.assign({},ev.gen||{},{lore:nl});
  if(ch){ ch.lore=nl||undefined; delete ch.relScan; relFromScripts(ch,'외전 「'+ch.title+'」'); mark('ch:'+ch.id); } mark('prog'); }
function openEvEdit(id){
  const ev=G.events.find(e=>e.id===id);
  openModal(`${head('이벤트 편집')}
    <label class="f" for="ev_t">제목</label><input class="in" id="ev_t" value="${esc(ev.title)}">
    <label class="f" for="ev_d">설명</label><textarea class="in" id="ev_d">${esc(ev.desc)}</textarea>
    <div class="g2"><div><label class="f" for="ev_tok">이벤트 재화 이름</label><input class="in" id="ev_tok" value="${esc(ev.token)}"></div><div><label class="f" for="ev_bg">배경</label><select class="in" id="ev_bg">${bgOptions(ev.bg,'기본')}</select></div></div>
    <label class="f" for="ev_shop">교환소 (한 줄에 하나: 종류, 수량, 가격, 횟수 / 종류는 gems·gold·exp·wmat·core·char:대원ID)</label>
    <textarea class="in" id="ev_shop">${esc((ev.shop||[]).map(i=>[(i.type==='char'?'char:'+i.ref:i.type),i.amt,i.price,i.limit].join(', ')).join('\n'))}</textarea>
    <label class="f" for="ev_act">상태</label><select class="in" id="ev_act">${opt([['1','진행 중'],['0','종료']],ev.active!==false?'1':'0')}</select>
    <label class="f" for="ev_lore">이야기 종류 (로어북)</label><select class="in" id="ev_lore">${opt(loreOpts(),loreOf(ev))}</select>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">바꾸면 이 이벤트가 남긴 관계 기록을 지우고 새 범위로 다시 정리해요. IF 스토리로 바꾸면 관계도·스토리 기억에서 빠져요.</p>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="evsave" data-id="${ev.id}">저장</button><button class="btn ghost" data-act="evdel" data-id="${ev.id}">삭제</button></div>`);
}
function openMeta(){
  const m=G.meta;
  openModal(`${head('게임 정의',`<span class="muted">이름, 용어, 속성, 테마를 바꾸면 화면 전체와 AI가 쓰는 글에 반영돼요</span>`)}
    <div class="g2"><div><label class="f" for="mt_title">게임 이름</label><input class="in" id="mt_title" value="${esc(m.title)}"></div><div><label class="f" for="mt_sub">영문 부제</label><input class="in" id="mt_sub" value="${esc(m.sub)}"></div></div>
    <label class="f" for="mt_art">이 게임 그림체 태그 (비우면 설정의 기본 그림체)</label><textarea class="in" id="mt_art" style="min-height:60px" placeholder="${esc(naiCfg().styles[0].tags||STYLE_EX)}">${esc(m.artTags||'')}</textarea>
    <label class="f" for="mt_artn">이 게임 그림체 네거티브 (선택)</label><input class="in" id="mt_artn" value="${esc(m.artNeg||'')}">
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="artcopy">⇩ 지금 기본 그림체 가져오기</button><button class="btn sm ghost" data-act="artclear">비우기 (기본 그림체 따라가기)</button></div>
    <div class="g2"><div><label class="f" for="mt_theme">화면 테마</label><select class="in" id="mt_theme">${opt([['tactical','택티컬'],['fantasy','판타지'],['neon','네온 사이버'],['pastel','파스텔 (밝은 화면)'],['noir','모노 누아르']],m.theme)}</select></div><div><label class="f" for="mt_acc">강조 색</label><input class="in" id="mt_acc" type="color" value="${esc(m.accent)}" style="height:42px;padding:4px"></div></div>
    <h3 class="sec">용어</h3><div class="g2">${Object.keys(DEFAULT_META.terms).map(k=>`<div><label class="f" for="mt_t_${k}">${TERM_LABEL[k]||k}</label><input class="in" id="mt_t_${k}" value="${esc(T(k))}" ${k==='abyss'?'maxlength="12"':''}></div>`).join('')}</div>
    <h3 class="sec">속성 (첫째가 둘째에, 둘째가 셋째에, 셋째가 첫째에 강해요)</h3>
    ${m.elems.map((e,i)=>`<div class="g2"><div><label class="f">속성 ${i+1}</label><input class="in" id="mt_e${i}" value="${esc(e.n)}" maxlength="4"></div><div><label class="f">색</label><input class="in" id="mt_c${i}" type="color" value="${esc(e.c)}" style="height:42px;padding:4px"></div></div>`).join('')}
    <h3 class="sec">역할 이름</h3><div class="g4">${['atk','def','sup'].map(k=>`<div><label class="f">${{atk:'공격형',def:'방어형',sup:'지원형'}[k]}</label><input class="in" id="mt_r_${k}" value="${esc(m.roles[k])}"></div>`).join('')}</div>
    <label class="f" for="mt_logo">타이틀 로고 모양</label><div class="row"><select class="in" id="mt_logo" style="flex:1">${opt(LOGO_STYLES,m.logoStyle||'auto')}</select><button class="btn sm ghost" type="button" data-act="logoprev">미리 보기</button></div>
    <h3 class="sec">스토리</h3><label class="f" for="mt_tone">분위기 (AI가 쓰는 글의 톤, 비우면 정하지 않음)</label><input class="in" id="mt_tone" value="${esc(m.tone||'')}" placeholder="예: 진지하고 비장하게 / 가볍고 유쾌하게">
    <label class="f" for="mt_cast">등장인물 성별 <span class="muted" style="font-size:.75rem">(앞으로 새로 만드는 ${esc(T('crew'))}·인물에 적용)</span></label><select class="in" id="mt_cast">${opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],m.castSex||'')}</select>${storyFormHTML(G.meta.story||{})}
    <h3 class="sec">재료 던전 이름</h3><div class="g2">${m.farms.map((f,i)=>`<div><label class="f">${{exp:'경험치',gold:'일반 재화',wmat:'스킬 강화 재료',core:'승급(Lv1~70) 재료'}[f.key]||f.key}</label><input class="in" id="mt_f${i}" value="${esc(f.name)}"></div>`).join('')}</div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="metasave">저장</button></div>`);
}
function openProjects(){
  const pj=PJ();
  openModal(`${head('게임 목록')}
    ${pj.list.map(x=>`<div class="ep"><span class="t"><b>${esc(x.title)}</b><span class="muted">${x.id===pj.active?'지금 플레이 중':''}${x.sub?' · 🔗 구독':''}</span></span><button class="btn sm ghost" data-act="swpjdraft" data-id="${x.id}">초안으로 새로</button><button class="btn sm ghost" data-act="pjdraftx" data-id="${x.id}">초안 내보내기</button><button class="btn sm ghost" data-act="pjreroll" data-id="${x.id}">🎲 그림 유지 리롤</button>${x.id===pj.active?'':`<button class="btn sm" data-act="pjswitch" data-id="${x.id}">전환</button><button class="btn sm ghost" data-act="pjdel" data-id="${x.id}">삭제</button>`}</div>`).join('')}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="draft-open">AI로 새 게임 만들기 (초안)</button><button class="btn ghost" data-act="pjblank">기본 게임 복사본 만들기</button></div>
    <label class="f" for="pj_start">앱을 켤 때</label><select class="in" id="pj_start" onchange="try{appStorage.setItem('ggm-start',this.value)}catch(e){}">${opt([['last','마지막으로 한 게임 바로 시작'],['pick','게임 목록에서 골라서 시작']],startMode())}</select>
    <p class="muted">게임마다 진행 상황, ${T('crew')}, 스토리가 따로 저장돼요. 이미지와 소리는 기기 안에 같이 보관돼요.</p>`);
}
/* 새 대원 만들기: 능력치(희귀도·역할 — SYS_BASE)·이벤트 적 기본 능력치·AI 답 정리(cleanChar)·미뤄 둔 스킬 설계 이어 하기 */
// 새 대원 능력치는 희귀도·역할로 시스템이 정해요(밸런스가 들쭉날쭉하지 않게)
const SYS_BASE=GGMCombat.CHARACTER_BASE_STATS;
const SYS_SK={dmg:[1.9,2.3,2.8],aoe:[1.0,1.3,1.6],heal:[1.0,1.3,1.6],shield:[1.1,1.5,1.8],buff:[1.0,1.2,1.4]};
function sysStats(c){ const r=[1,2,3].includes(+c.rarity)?+c.rarity:1,i=r-1,B=SYS_BASE[c.role]||SYS_BASE.atk;
  Object.assign(c,GGMCombat.generateBaseStats(c),{baseStatsVersion:1});
  const k=B.sk.includes(c.skill.kind)?c.skill.kind:B.sk[0]; c.skill.kind=k; c.skill.power=SYS_SK[k][i]; c.skill.cd=k==='dmg'?(r===1?2:3):k==='buff'&&r>1?4:3; return c; }
// 적 기본 능력치를 만든 뒤 v2BalanceChapter에서 실제 전투 시뮬레이션으로 조정
function sysEventFoes(ch){ (ch.stages||[]).forEach((s,i)=>(s.enemies||[]).forEach(e=>{ if(e.manual) return; const m=(1+0.08*i)*(e.boss?4.5:1); e.hp=Math.round(1100*m*(0.92+Math.random()*0.16)); e.atk=Math.round(85*(e.boss?1.3:1)*(1+0.05*i)); e.def=Math.round(42*(1+0.05*i)); e.spd=e.spd||95; })); }
function cleanChar(o){ const c=cleanChar0(o);posAssign(c,o&&o.pos);c.persona=personaClean(o&&o.persona);c.range=RANGE[o&&o.range]?o.range:'';c.pfields=pfieldsClean(o&&o.pfields);v2ApplyRoleSpeed(c);c.generation=v2CurrentGeneration();balanceOnCreate(c); let provided=null;try{if(o?.skills)provided=v2PrepareGenerated(o.skills,c);}catch(e){}c.skills=provided||GGMCombat.generationDefaults(c); if(o?.skills&&!provided)c.skillGenerationWarning='AI 스킬이 규칙에 맞지 않아 기본 스킬로 대체했어요. 스킬 편집기에서 다시 생성할 수 있어요.'; setTimeout(async()=>{try{if(!provided){if(typeof NEW_GAME_SOURCE!=='undefined'&&NEW_GAME_SOURCE&&G!==NEW_GAME_SOURCE){ c.skillPending=true; c.skillGenerationWarning='새 게임을 연 뒤 스킬을 설계해요'; return; } /* 새 게임 생성 중: 저장·새로고침에 끊기지 않게 게임을 연 뒤 skillResume()이 이어서 */ if(SAMPLE){c.skillGenerationWarning='스킬을 구성하고 내부 검사하는 중…';const kit=await v2GenerateSkills(c,'',msg=>{c.skillGenerationWarning=msg;});c.skills=kit;delete c.skillGenerationWarning;}}await v2QueueCharacter(c);}catch(e){c.skillGenerationWarning=String(e.message||e);}if(G.chars.includes(c)){mark('c:'+c.id);if(document.querySelector('.cs-sheet')?.dataset.cid===c.id)openChar(c.id);}},0); try{ const en=(G.lib||[]).find(l=>l.kind==='enemy'&&l.name===c.name); if(en&&/^\s*(1girl|1boy|1other)/i.test(en.prompt||'')){ c.naiPrompt=en.prompt; c.fromEnemy=en.id; } }catch(e){} naiBlocksRemember(c);return c; }
// 새 게임 생성 중에 미뤄 둔 스킬 설계를 게임을 연 뒤 이어서 해요(예전엔 생성 중 백그라운드 작업이 저장·새로고침에 끊겨 임시 스킬로 굳었음)
let SKILL_RESUME=false;
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
