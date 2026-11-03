/* ===== 도감 (로어북) ===== */
const CX_CATS=[['all','전체'],['world','세계'],['faction','세력'],['person','인물'],['place','장소'],['item','물건'],['term','용어'],['history','역사'],['enemy','적']];
const CX_LABEL=Object.fromEntries(CX_CATS);
let CXCAT='all';
function cxStore(){ if(!Array.isArray(G.world.codex)) G.world.codex=[]; return G.world.codex; }
function cxNotes(){ if(!G.world.codexNotes||typeof G.world.codexNotes!=='object') G.world.codexNotes={}; return G.world.codexNotes; }
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
function cxSeenSet(){ const p=P(); if(!p.cxSeen||typeof p.cxSeen!=='object') p.cxSeen={}; return p.cxSeen; }
let CXMEMO=null;
function cxNewFast(){ const p=P(), sig=[Object.keys(p.cleared).length,Object.keys(p.owned).length,cxStore().length,G.lib.length,G.chapters.length,Object.keys(cxSeenSet()).length,Object.keys(p.cxBadge||{}).length].join('|'); if(CXMEMO&&CXMEMO.sig===sig) return CXMEMO.n; cxNew(); const s=cxSeenSet(), bd=p.cxBadge||{}; const n=cxEntries().filter(e=>e.open&&!s[e.key]&&!bd[e.key]).length; CXMEMO={sig,n}; return n; }
function cxNew(list){ const p=P(); if(!p.cxSeen||typeof p.cxSeen!=='object'){ p.cxSeen={}; (list||cxEntries()).forEach(e=>{ if(e.open&&!e.stored) p.cxSeen[e.key]=1; }); mark('prog'); } const s=cxSeenSet(); return (list||cxEntries()).filter(e=>e.open&&!s[e.key]).length; }
function cxCard(e){ const isNew=e.open&&!cxSeenSet()[e.key];
  const pic=e.open?(e.char?art(e.char,'cx-ch'):e.img?`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}" loading="lazy">`:`<span class="cx-glyph">${esc((e.title||'?').slice(0,1))}</span>`):'<span class="cx-glyph">?</span>';
  const snip=e.open?String(e.body||(e.notes[0]&&e.notes[0].text)||'아직 기록이 없어요').replace(/\n+/g,' ').slice(0,70):cxLockText(e.unlock);
  return `<button class="cx-card ${e.open?'':'lock'} c-${esc(e.cat)}" data-act="cxview" data-k="${esc(e.key)}"><span class="cx-pic">${pic}</span><span class="cx-tx"><i>${esc(CX_LABEL[e.cat]||'')}</i><b>${e.open?esc(e.title):'???'}</b><span>${esc(snip)}</span></span>${isNew?'<em>NEW</em>':''}</button>`; }
function codexHTML(){
  const all=cxEntries(), cat=CXCAT, list=all.filter(e=>cat==='all'||e.cat===cat), un=all.filter(e=>e.open).length; cxNew(all); { const p=P(), s=cxSeenSet(); p.cxBadge=p.cxBadge||{}; let ch=false; all.forEach(e=>{ if(e.open&&!s[e.key]&&!p.cxBadge[e.key]){ p.cxBadge[e.key]=1; ch=true; } }); if(ch){ CXMEMO=null; mark('prog'); } }
  const cnt=k=>k==='all'?all.length:all.filter(e=>e.cat===k).length;
  return `${pageHead('도감','LORE BOOK','lobby')}
  <div class="cx-head"><div class="cx-meter"><b>${un}</b><span>/ ${all.length} 기록 해금</span></div><div class="cx-bar"><i style="width:${all.length?un/all.length*100:0}%"></i></div>
    <div class="cx-acts">${SAMPLE?`<button class="btn sm" data-act="cxdisc">✦ AI로 로어북 채우기</button>`:''}<button class="btn sm ghost" data-act="cxadd">＋ 직접 쓰기</button><button class="btn sm ghost" data-act="relopen" data-r="me">🕸 인물 관계도</button>${all.some(e=>e.open&&!cxSeenSet()[e.key])?'<button class="btn sm ghost" data-act="cxreadall">NEW 모두 지우기</button>':''}</div></div>
  <div class="cx-cats">${CX_CATS.filter(([k])=>cnt(k)).map(([k,l])=>`<button class="${k===cat?'on':''}" data-act="cxcat" data-v="${k}">${l}<em>${cnt(k)}</em></button>`).join('')}</div>
  ${!cxStore().length&&SAMPLE?`<div class="panel cx-hint"><b>세계를 더 깊게</b><p class="muted" style="margin:4px 0 0">AI가 세계관과 메인 플롯을 바탕으로 장소, 용어, 역사, 숨은 인물 같은 기록을 써요. 비밀이 담긴 기록은 해당 스테이지를 깨야 열려요.</p></div>`:''}
  <div class="cx-list">${list.map(cxCard).join('')||'<p class="muted">항목이 없어요</p>'}</div>`;
}
function openCx(key){
  const e=cxEntries().find(x=>x.key===key); if(!e) return;
  if(!e.open){ toast(cxLockText(e.unlock)||'아직 잠겨 있어요'); return; }
  cxSeenSet()[key]=1; CXMEMO=null; mark('prog'); document.querySelectorAll('.cx-card[data-k]').forEach(el=>{ if(el.dataset.k===key){ const em=el.querySelector('em'); if(em) em.remove(); } });
  const para=t=>String(t||'').split(/\n{2,}/).map(x=>`<p>${esc(x).replace(/\n/g,'<br>')}</p>`).join('');
  openModal(`<div class="cx-view c-${esc(e.cat)}">
    ${e.img||e.char?`<div class="cx-hero">${e.char?art(e.char,'cx-ch'):`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}">`}</div>`:''}
    <div class="cx-vh"><i>${esc(CX_LABEL[e.cat]||'')}</i><h2>${esc(e.title)}</h2><span class="muted">${esc(e.sub||'')}</span></div>
    <div class="cx-body">${e.body?para(e.body):'<p class="muted">아직 기록이 없어요. 아래 \'더 알아보기\'를 누르면 AI가 지금까지 밝혀진 범위 안에서 써 줘요.</p>'}
      ${e.notes.map(n=>`<div class="cx-note"><small>${esc(n.at||'')}</small>${para(n.text)}</div>`).join('')}</div>
    ${SAMPLE?`<button class="btn block" data-act="cxdeep" data-k="${esc(key)}" style="margin-top:14px">✦ 더 알아보기</button>`:''}
    <div class="cx-sub">${e.char&&own(e.char.id)?`<button class="btn sm ghost" data-act="char" data-id="${esc(e.char.id)}">${esc(T('crew'))} 정보</button>`:''}${e.stored?`<button class="btn sm ghost" data-act="cxedit" data-id="${esc(e.stored.id)}">편집</button>`:''}<button class="btn sm ghost" data-act="cxnote" data-k="${esc(key)}">메모 추가</button><button class="btn sm ghost" data-act="close">닫기</button></div>
  </div>`);
}
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
function cxProgressText(){ const st=mainStages(), done=st.filter(s=>P().cleared[s.id]); return done.length?`플레이어가 지금까지 깬 스테이지: ${done.map(s=>s.code+' '+s.title).join(', ')}`:'플레이어는 아직 스토리를 시작하지 않았다'; }
async function cxDiscover(t){
  const st=mainStages(), have=cxEntries().map(e=>e.title);
  const r=await aiJSON(`${RULES}\n${ctx()}\n\n이 게임의 도감(로어북)에 실을 새 기록 6개를 써라. 세계관을 더 깊게 만드는 내용으로: 장소, 용어(기술·제도·현상), 역사적 사건, 아직 등장하지 않은 주요 인물(NPC), 세력의 이면, 물건 등을 고루 섞는다.
이미 있는 항목과 제목이 겹치지 않게: ${have.join(', ')}
스테이지 목록: ${st.map(s=>s.code+' '+s.title).join(', ')||'없음'}
${cxProgressText()}
규칙: 메인 플롯의 비밀이나 반전에 닿는 기록은 "after"에 그 비밀이 드러나는 스테이지 코드를 넣는다. "start" 기록에는 비밀을 쓰지 않는다. 기록은 게임 속 문서처럼 3인칭 백과사전 말투로 4~6문장. 대원 이름은 기존 이름을 그대로 쓴다.
JSON만 출력: {"entries":[{"cat":"place|term|history|person|faction|item","title":"짧은 제목","body":"내용","after":"start 또는 1-3 같은 스테이지 코드"}]}`,t);
  if(!r||!Array.isArray(r.entries)) return 0;
  let n=0; r.entries.slice(0,8).forEach(x=>{ if(!x||!x.title||!x.body) return; const cat=CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term'; const sid=codeToStage(x.after);
    cxStore().push({id:'cx'+uid(),cat,title:String(x.title).slice(0,40),body:String(x.body),unlock:sid?{type:'clear',value:sid}:{type:'start'},src:'ai',at:Date.now()}); n++; });
  mark('world'); return n;
}
async function cxDeepen(key,t){
  const e=cxEntries().find(x=>x.key===key); if(!e) return false;
  const r=await aiJSON(`${RULES}\n${ctx()}\n\n도감 항목 「${e.title}」(${CX_LABEL[e.cat]||''})에 새 기록을 한 단락 덧붙여라.
지금 기록: ${String(e.body||'').slice(0,800)}
이미 덧붙인 기록: ${e.notes.map(n=>n.text).join(' / ').slice(0,800)||'없음'}
${cxProgressText()}
규칙: 플레이어가 아직 깨지 않은 스테이지에서 밝혀질 비밀이나 반전은 쓰지 않는다. 대신 아직 풀리지 않은 의문을 암시하는 건 좋다. 앞의 기록과 겹치지 않는 새 사실, 일화, 소문, 문서 인용 중 하나로 4~6문장. 게임 속 문서 말투.
JSON만 출력: {"text":"덧붙일 내용"}`,t);
  if(!r||!r.text) return false;
  const N=cxNotes(); (N[key]=N[key]||[]).push({text:String(r.text),at:mainStages().filter(s=>P().cleared[s.id]).map(s=>s.code).pop()||'시작 전'}); mark('world'); return true;
}
function cxFromChapter(r,ch){ if(!r||!Array.isArray(r.codex)) return; const last=ch.stages[ch.stages.length-1];
  r.codex.slice(0,3).forEach(x=>{ if(!x||!x.title||!x.body) return; cxStore().push({id:'cx'+uid(),cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:String(x.title).slice(0,40),body:String(x.body),unlock:last?{type:'clear',value:last.id}:{type:'start'},src:'ai',at:Date.now()}); }); mark('world'); }
