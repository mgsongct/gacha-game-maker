/* ===== 도감 (로어북) ===== */
const CX_CATS=[['all','전체'],['world','세계'],['faction','세력'],['person','인물'],['place','장소'],['item','물건'],['term','용어'],['history','역사'],['enemy','적']];
const CX_LABEL=Object.fromEntries(CX_CATS);
let CXCAT='all';
function cxStore(){ return gameRead('world.codex'); } // 읽기 — 바꿀 때는 아래 기록 함수(cxPut·cxKeep·cxUpsert)
/* 도감 기록 바꾸기(Model — 도감 칸 G.world.codex는 이 모듈만 씀): 넣기 · 조건에 맞는 것만 남기기 · 제목으로 고치거나 넣기 */
function cxPut(x){ gameSlot('world.codex').push(x); return x; }
function cxKeep(keep){ G.world.codex=cxStore().filter(keep); }
function cxUpsert(title,body,cat){ const x=gameSlot('world.codex').find(e=>e.title===title); if(x){ x.body=body; return x; } return cxPut({cat:cat||'term',title,body}); }
function cxNotes(){ return gameRead('world.codexNotes'); } // 읽기 — 바꿀 때는 cxNoteAdd
function cxNoteAdd(key,text,at){ const N=gameSlot('world.codexNotes'); (N[key]=N[key]||[]).push({text,at}); mark('world'); }
function libSrc(kind,name){ const l=G.lib.find(x=>x.kind===kind&&x.name===name); return l?imgSrc(l):null; }
function mainStages(){ const a=[]; G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>ch.stages.forEach((s,si)=>a.push({id:s.id,code:(ci+1)+'-'+(si+1),title:s.title,ch}))); return a; }
function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function cxMention(seen,name){ name=String(name||'').trim(); if(!name) return false; if(new RegExp('\\[(배경|소품)\\s*[:：]\\s*'+escRe(name)+'\\s*\\]').test(seen)) return true; if(name===P().lobbyBg||name===P().titleBg) return true; return name.length>=3&&seen.includes(name); }
function cxSeenText(){ const p=P(); let t=(G.opening&&G.opening.lines||[]).join('\n')+'\n'+(p.lobbyBg||'')+'\n'+(p.titleBg||'');
  G.chapters.forEach(ch=>ch.stages.forEach(s=>{ if(p.cleared[s.id]) t+='\n'+(s.pre||'')+'\n'+(s.post||''); })); return t; }
function cxUnlocked(u){ if(!u||u.type==='start') return true; if(u.type==='clear') return !!P().cleared[u.value]||!G.chapters.some(ch=>ch.stages.some(s=>s.id===u.value)); if(u.type==='own') return !!own(u.value); if(u.type==='seen') return !!u.ok; return true; }
function cxLockText(u){ if(!u) return ''; if(u.type==='clear') return stageCode(u.value)+' 클리어 시 공개'; if(u.type==='own') return '합류하면 공개'; if(u.type==='seen') return '스토리에 등장하면 공개'; return ''; }
function cxEntries(){
  const out=[], w=G.world, seen=cxSeenText();
  out.push({key:'w:main',cat:'world',title:w.name||G.meta.title,sub:'세계관',body:[w.summary,w.lore].filter(Boolean).join('\n\n'),unlock:{type:'start'},img:libSrc('bg',P().titleBg)});
  (w.factions||[]).forEach(f=>{ const mem=G.chars.filter(c=>c.faction===f.name); out.push({key:'f:'+f.name,cat:'faction',title:f.name,sub:'세력',body:(f.desc||'')+(mem.length?'\n\n알려진 소속: '+mem.map(c=>own(c.id)?c.name:'???').join(', '):''),unlock:{type:'start'}}); });
  G.chars.forEach(c=>{ const o=own(c.id), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0));
    out.push({key:'c:'+c.id,cat:'person',title:c.name,sub:[c.faction,RL[c.rarity],ROLE[c.role]].filter(Boolean).join(' · '),body:[c.profile,...files.map(x=>'【'+T('files')+' '+(x.dup||'')+'】 '+(x.text||''))].filter(Boolean).join('\n\n')+((c.files||[]).length>files.length?`\n\n(${T('limit')}하면 ${T('files')}가 더 공개돼요)`:''),unlock:{type:'own',value:c.id},char:c}); });
  G.lib.filter(l=>l.kind==='bg').forEach(l=>out.push({key:'p:'+l.name,cat:'place',title:l.name,sub:'장소',body:'',unlock:{type:'seen',ok:cxMention(seen,l.name)},img:imgSrc(l)}));
  G.lib.filter(l=>l.kind==='prop').forEach(l=>out.push({key:'i:'+l.name,cat:'item',title:l.name,sub:'물건',body:'',unlock:{type:'seen',ok:cxMention(seen,l.name)},img:imgSrc(l),contain:true}));
  const ens={}; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ const x=ens[e.name]||(ens[e.name]={e,codes:[],first:s.id,clear:false}); x.codes.push(stageCode(s.id)); if(P().cleared[s.id]) x.clear=true; })));
  Object.values(ens).forEach(x=>{ const e=x.e; out.push({key:'e:'+e.name,cat:'enemy',title:e.name,sub:`${e.elem} 속성${e.boss?' · 보스':''}`,body:`출현: ${[...new Set(x.codes)].join(', ')}`,unlock:x.clear?{type:'start'}:{type:'clear',value:x.first},img:(enemyLib(e.name)&&imgSrc(enemyLib(e.name)))||null,contain:true}); });
  G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>{ const done=ch.stages.filter(s=>P().cleared[s.id]);
    out.push({key:'h:'+ch.id,cat:'history',title:ch.title,sub:`CHAPTER ${ci+1} · ${done.length}/${ch.stages.length}`,body:ch.stages.map((s,si)=>(P().cleared[s.id]?'✓ ':'· ')+`${ci+1}-${si+1} `+(P().cleared[s.id]?s.title:'???')).join('\n'),unlock:ch.stages[0]?{type:'clear',value:ch.stages[0].id}:{type:'start'}}); });
  cxStore().forEach(x=>out.push({key:'x:'+x.id,cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:x.title,sub:(CX_LABEL[x.cat]||'기록')+(x.src==='ai'?' · AI 기록':''),body:x.body,unlock:x.unlock||{type:'start'},stored:x,img:libSrc('bg',x.title)||libSrc('prop',x.title)}));
  const N=cxNotes(); out.forEach(e=>{ e.notes=(N[e.key]||[]); e.open=cxUnlocked(e.unlock); });
  return out;
}

let CXMEMO=null;
function cxNewFast(){ const p=P(), sig=[Object.keys(p.cleared).length,Object.keys(p.owned).length,cxStore().length,G.lib.length,G.chapters.length,Object.keys(progRead('cxSeen')).length,Object.keys(p.cxBadge||{}).length].join('|'); if(CXMEMO&&CXMEMO.sig===sig) return CXMEMO.n; const s=progRead('cxSeen'), bd=p.cxBadge||{}; const n=cxEntries().filter(e=>e.open&&!s[e.key]&&!bd[e.key]).length; CXMEMO={sig,n}; return n; }
/* 도감 본 기록 칸 처음 만들기: 그때 열려 있는 기록(직접 적은 것 빼고)은 본 것으로 — 진행 칸 cxSeen의 정의(0070 PROG_SLOTS) */
function cxSeenNew(){ const s={}; cxEntries().forEach(e=>{ if(e.open&&!e.stored) s[e.key]=1; }); return s; }
/* 도감 새 기록 표시(Model — 도감 화면에 들어가기 전): 새로 열린 기록에 표시 */
function cxBadgeSync(){ const p=P(), s=progSlot('cxSeen'); p.cxBadge=p.cxBadge||{}; let ch=false; cxEntries().forEach(e=>{ if(e.open&&!s[e.key]&&!p.cxBadge[e.key]){ p.cxBadge[e.key]=1; ch=true; } }); if(ch){ CXMEMO=null; mark('prog'); } }
function cxCard(e){ const isNew=e.open&&!progRead('cxSeen')[e.key];
  const pic=e.open?(e.char?art(e.char,'cx-ch'):e.img?`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}" loading="lazy">`:`<span class="cx-glyph">${esc((e.title||'?').slice(0,1))}</span>`):'<span class="cx-glyph">?</span>';
  const snip=e.open?String(e.body||(e.notes[0]&&e.notes[0].text)||'아직 기록이 없어요').replace(/\n+/g,' ').slice(0,70):cxLockText(e.unlock);
  return `<button class="cx-card ${e.open?'':'lock'} c-${esc(e.cat)}" data-act="cxview" data-k="${esc(e.key)}"><span class="cx-pic">${pic}</span><span class="cx-tx"><i>${esc(CX_LABEL[e.cat]||'')}</i><b>${e.open?esc(e.title):'???'}</b><span>${esc(snip)}</span></span>${isNew?'<em>NEW</em>':''}</button>`; }
function codexHTML(){
  const all=cxEntries(), cat=CXCAT, list=all.filter(e=>cat==='all'||e.cat===cat), un=all.filter(e=>e.open).length;
  const cnt=k=>k==='all'?all.length:all.filter(e=>e.cat===k).length;
  return `${pageHead('도감','LORE BOOK','lobby')}
  <div class="cx-head"><div class="cx-meter"><b>${un}</b><span>/ ${all.length} 기록 해금</span></div><div class="cx-bar"><i style="width:${all.length?un/all.length*100:0}%"></i></div>
    <div class="cx-acts">${SAMPLE?`<button class="btn sm" data-act="cxdisc">✦ AI로 로어북 채우기</button>`:''}<button class="btn sm ghost" data-act="cxadd">＋ 직접 쓰기</button><button class="btn sm ghost" data-act="relopen" data-r="me">🕸 인물 관계도</button>${all.some(e=>e.open&&!progRead('cxSeen')[e.key])?'<button class="btn sm ghost" data-act="cxreadall">NEW 모두 지우기</button>':''}</div></div>
  <div class="cx-cats">${CX_CATS.filter(([k])=>cnt(k)).map(([k,l])=>`<button class="${k===cat?'on':''}" data-act="cxcat" data-v="${k}">${l}<em>${cnt(k)}</em></button>`).join('')}</div>
  ${!cxStore().length&&SAMPLE?`<div class="panel cx-hint"><b>세계를 더 깊게</b><p class="muted" style="margin:4px 0 0">AI가 세계관과 메인 플롯을 바탕으로 장소, 용어, 역사, 숨은 인물 같은 기록을 써요. 비밀이 담긴 기록은 해당 스테이지를 깨야 열려요.</p></div>`:''}
  <div class="cx-list">${list.map(cxCard).join('')||'<p class="muted">항목이 없어요</p>'}</div>`;
}
/* 도감 기록 보기(Controller): 잠겼으면 알림, 열렸으면 본 것으로 하고 카드의 새 표시를 지운 뒤 창 */
function openCx(key){
  const e=cxEntries().find(x=>x.key===key); if(!e) return;
  if(!e.open){ toast(cxLockText(e.unlock)||'아직 잠겨 있어요'); return; }
  cxMarkSeen(key); cxCardSeenShow(key); openModal(cxViewHTML(e,key));
}
/* 도감 기록을 봄(Model) */
function cxMarkSeen(key){ progSlot('cxSeen')[key]=1; CXMEMO=null; mark('prog'); }
/* 도감 카드의 새 표시 지우기 · 기록 보기 창 내용(View) */
function cxCardSeenShow(key){ document.querySelectorAll('.cx-card[data-k]').forEach(el=>{ if(el.dataset.k===key){ const em=el.querySelector('em'); if(em) em.remove(); } }); }
function cxViewHTML(e,key){ const para=t=>String(t||'').split(/\n{2,}/).map(x=>`<p>${esc(x).replace(/\n/g,'<br>')}</p>`).join('');
  return `<div class="cx-view c-${esc(e.cat)}">
    ${e.img||e.char?`<div class="cx-hero">${e.char?art(e.char,'cx-ch'):`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}">`}</div>`:''}
    <div class="cx-vh"><i>${esc(CX_LABEL[e.cat]||'')}</i><h2>${esc(e.title)}</h2><span class="muted">${esc(e.sub||'')}</span></div>
    <div class="cx-body">${e.body?para(e.body):'<p class="muted">아직 기록이 없어요. 아래 \'더 알아보기\'를 누르면 AI가 지금까지 밝혀진 범위 안에서 써 줘요.</p>'}
      ${e.notes.map(n=>`<div class="cx-note"><small>${esc(n.at||'')}</small>${para(n.text)}</div>`).join('')}</div>
    ${SAMPLE?`<button class="btn block" data-act="cxdeep" data-k="${esc(key)}" style="margin-top:14px">✦ 더 알아보기</button>`:''}
    <div class="cx-sub">${e.char&&own(e.char.id)?`<button class="btn sm ghost" data-act="char" data-id="${esc(e.char.id)}">${esc(T('crew'))} 정보</button>`:''}${e.stored?`<button class="btn sm ghost" data-act="cxedit" data-id="${esc(e.stored.id)}">편집</button>`:''}<button class="btn sm ghost" data-act="cxnote" data-k="${esc(key)}">메모 추가</button><button class="btn sm ghost" data-act="close">닫기</button></div>
  </div>`; }
function openCxEdit(id){
  const x=id?cxStore().find(q=>q.id===id):{id:'',cat:'term',title:'',body:'',unlock:{type:'start'}}; if(!x) return;
  const st=mainStages();
  openModal(`${head(id?'기록 편집':'기록 쓰기')}
    <div class="g2"><div><label class="f" for="cx_cat">분류</label><select class="in" id="cx_cat">${opt(CX_CATS.filter(c=>c[0]!=='all'&&c[0]!=='enemy'),x.cat)}</select></div>
    <div><label class="f" for="cx_un">공개 시점</label><select class="in" id="cx_un">${opt([['start','처음부터'],...st.map(s=>[s.id,s.code+' 클리어 후'])],x.unlock&&x.unlock.type==='clear'?x.unlock.value:'start')}</select></div></div>
    <label class="f" for="cx_t">제목</label><input class="in" id="cx_t" value="${esc(x.title)}">
    <label class="f" for="cx_b">내용</label><textarea class="in" id="cx_b" style="min-height:180px">${esc(x.body)}</textarea>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="cxsave" data-id="${esc(x.id)}">저장</button>${id?`<button class="btn ghost" data-act="cxdel" data-id="${esc(x.id)}">삭제</button>`:''}</div>`);
}
function codeToStage(code){ code=String(code||'').trim(); if(!code||/^start|처음/i.test(code)) return null; const m=mainStages().find(s=>s.code===code); return m?m.id:null; }
async function cxDiscover(t){
  const st=mainStages(), have=cxEntries().map(e=>e.title);
  const r=await aiJSON(cxDiscoverPrompt({have,st}),t);
  if(!r||!Array.isArray(r.entries)) return 0;
  let n=0; r.entries.slice(0,8).forEach(x=>{ if(!x||!x.title||!x.body) return; const cat=CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term'; const sid=codeToStage(x.after);
    cxPut({id:'cx'+uid(),cat,title:String(x.title).slice(0,40),body:String(x.body),unlock:sid?{type:'clear',value:sid}:{type:'start'},src:'ai',at:Date.now()}); n++; });
  mark('world'); return n;
}
async function cxDeepen(key,t){
  const e=cxEntries().find(x=>x.key===key); if(!e) return false;
  const r=await aiJSON(cxDeepenPrompt({e}),t);
  if(!r||!r.text) return false;
  cxNoteAdd(key,String(r.text),mainStages().filter(s=>P().cleared[s.id]).map(s=>s.code).pop()||'시작 전'); return true;
}
function cxFromChapter(r,ch){ if(!r||!Array.isArray(r.codex)) return; const last=ch.stages[ch.stages.length-1];
  r.codex.slice(0,3).forEach(x=>{ if(!x||!x.title||!x.body) return; cxPut({id:'cx'+uid(),cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:String(x.title).slice(0,40),body:String(x.body),unlock:last?{type:'clear',value:last.id}:{type:'start'},src:'ai',at:Date.now()}); }); mark('world'); }
