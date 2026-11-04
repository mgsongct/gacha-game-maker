/* ===== messenger — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Messenger {
  static ultimateSceneTags(c){const type=v2Kit(c).ultimate.effects?.[0]?.type;return ['heal','regen','support'].includes(type)?'healing magic, gentle light':['shield','reduction','block','invincible'].includes(type)?'protective barrier, radiant aura':'attacking, special effects';}

  static phRooms(){ const m={};
    Object.entries(P().inbox).forEach(([id,s])=>{ const t=threadById(id), c=threadChar(t); if(!c) return; const r=m[c.id]||(m[c.id]={c,at:0,unread:false}); r.at=Math.max(r.at,s.at||0); if(!s.done){ r.unread=true; r.title=r.title||t.title; } });
    Object.entries(Core.progRead('fchat')).forEach(([cid,f])=>{ const c=charById(cid); if(!c||!f.log.length) return; const r=m[cid]||(m[cid]={c,at:0,unread:false}); r.at=Math.max(r.at,f.at||0); if(f.unread) r.unread=true; });
    return Object.values(m).map(r=>Object.assign(r,{last:Messenger.roomLog(r.c.id).filter(l=>l.w!=='s').at(-1)})).sort((a,b)=>b.at-a.at); }

  static roomThreads(cid){ return Object.entries(P().inbox).map(([id,s])=>({t:threadById(id),s})).filter(x=>{ const c=threadChar(x.t); return c&&c.id===cid; }).sort((a,b)=>(a.s.t0||a.s.at||0)-(b.s.t0||b.s.at||0)); }

  static roomItems(cid){ const out=[];
    Messenger.roomThreads(cid).forEach(({s})=>{ const n=s.log.length, base=s.t0||s.at||0; s.log.forEach((l,i)=>{ if(l.w==='s'&&l.t==='대화가 끝났어요') return; out.push({l,arr:s.log,k:l.at||(s.t0?base+i:base-(n-i))}); }); });
    const f=Core.progRead('fchat')[cid]; if(f) f.log.forEach((l,i)=>out.push({l,arr:f.log,k:l.at||i,fc:true}));
    return out.sort((a,b)=>a.k-b.k); }

  static roomLog(cid){ return Messenger.roomItems(cid).map(x=>x.l); }

  static roomDel(cid,items){ const f=Core.progSlot('fchat')[cid]; items.forEach(x=>{ const i=x.arr.indexOf(x.l); if(i<0) return; x.arr.splice(i,1); if(x.fc&&f&&i<(f.sumTo||0)) f.sumTo--; }); if(f&&!f.log.length){ f.sum=''; f.sumTo=0; } Core.mark('prog'); }

  static roomLastBlock(cid){ const it=Messenger.roomItems(cid); if(!it.length) return []; let i=it.length-1; while(i>0&&(it[i].k-it[i-1].k)<30*60e3&&it[i].k>1e12&&it[i-1].k>1e12) i--; return it.slice(i); }

  static openThread(tid){ const t=threadById(tid), c=threadChar(t); if(!t||!c||!P().inbox[tid]) return; MessengerCtl.openRoom(c.id); }

    /* 대화방을 읽음(Model) */
static fcRead(f){ f.unread=0; Core.mark('prog'); }

  static fcOf(cid){ const f=Core.progSlot('fchat'); return f[cid]||(f[cid]={log:[],sum:'',sumTo:0,at:0}); }

  static openFree(cid){ MessengerCtl.openRoom(cid); }

  static fcAfterReply(c,o,f,r){ if(f.log.length>400) { const cut=f.log.length-400; f.log.splice(0,cut); f.sumTo=Math.max(0,(f.sumTo||0)-cut); }
    const p=P(), d=today(); if(!p.fcAff||p.fcAff.d!==d) p.fcAff={d,n:0}; const add=Math.max(0,Math.min(2,Math.round(+((r&&r.aff)||0)))); if(add&&o&&p.fcAff.n<20){ const a=Math.min(add,20-p.fcAff.n); p.fcAff.n+=a; CoreCtl.addAff(c,a); }
    Core.mark('prog'); }

  static threadFree(c,tid){ const th=threadById(tid), s0=th&&P().inbox[tid]; if(!th||!s0||s0.done) return false; s0.done=true; s0.freed=true; s0.pos=System.parseScript(th.script).length; s0.at=Date.now(); if(Characters.own(c.id)) CoreCtl.addAff(c,10); return true; }

  static fcPhotoOn(){ return P().fcPhoto!==false&&Core.imgReady(); }

  static async handleMessengerAction(a,t,id,p,e){
    switch(a){
  case 'phone': e.stopPropagation(); MessengerView.openPhone(); break;
  case 'openthread': MessengerView.notifClear(); MessengerView.openPhone(id); break;
  case 'phclose': CoreView.closePhone(); break;
  case 'phback': MessengerView.phoneList(); break;
  case 'openfc': Messenger.openFree(id); break;
  case 'fcsend': Core.fcSend(); break;
  case 'fcphoto': if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } if(FCBUSY){ CoreView.toast('답장을 기다리는 중이에요'); break; } $('#chatfile').click(); break;
  case 'fcphototog': { const p=P(); p.fcPhoto=p.fcPhoto===false; Core.mark('prog'); MessengerView.phMenuClose(); CoreView.toast(p.fcPhoto?'캐릭터가 가끔 사진을 보내요 (그림 AI 사용)':'캐릭터가 사진을 보내지 않아요'); break; }
  case 'chatimg': MessengerView.chatImgView(t.dataset.k); break;
  case 'phpendx': if(PH){ PH.pendImg=null; CoreView.phPendRender(); const i=$('#fcIn'); if(i) i.placeholder='메시지 보내기'; } break;
  case 'chatimgsave': { e.stopPropagation(); const u=chatImgCache[t.dataset.k]; if(u) Core.saveImgUrl(u,'chat-photo'); break; }
  case 'phpick': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s){ if(PH.fc) MessengerCtl.openRoom(PH.fc); break; }
        const c=threadChar(th), lines=System.parseScript(th.script); let L=lines[s.pos];
        if(!L||L.type!=='choice'){ let j=s.pos; while(j>0&&!(lines[j]&&lines[j].type==='choice')) j--; if(lines[j]&&lines[j].type==='choice'&&!s.log.some(x=>x.w==='me'&&x.pi===j)){ s.pos=j; L=lines[j]; } else { MessengerCtl.openRoom(c.id); break; } }
        const el=+t.dataset.n; s.pick=el; s.lastPick=L.opts[el-1]||''; const en={w:'me',t:sub(L.opts[el-1]||''),at:Date.now(),pi:s.pos}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid;
        CoreView.phSentShow(en,c); Core.mark('prog'); CoreCtl.phPlay(th,c,s,PH.token); break; }
  case 'phmenu': MessengerView.phMenu(id); break;
  case 'phmenuclose': { if(t.classList.contains('ph-menu')&&e.target!==t) break; MessengerView.phMenuClose(); break; }
  case 'phadd': MessengerView.phAddView(id,PH&&PH.fc?'room':'list'); break;
  case 'phaddback': { const a=PH&&PH.add, fr=PH&&PH.from; if(a&&fr==='room') MessengerCtl.openRoom(a); else CharactersView.phNewList(); break; }
  case 'phaddai': { const c=charById(id); if(!c) break; const hint=$('#pa_hint').value.trim();
        const r=await Core.aiJSON(Core.phaddaiPrompt({c,hint}),CoreView.uiProg(t));
        if(r&&$('#pa_script')){ if(r.title) $('#pa_title').value=String(r.title); if(r.script) $('#pa_script').value=nl(r.script); CoreView.toast('대화를 채웠어요. 고칠 곳이 있으면 고치고 받기를 누르세요'); } break; }
  case 'phaddsend': { const c=charById(id); if(!c) break; const sc=$('#pa_script').value.trim(); if(!sc){ CoreView.toast(SAMPLE?'대화를 쓰거나 AI로 대화 쓰기를 눌러 주세요':'대화를 써 주세요'); break; }
        const now=Date.now(), th={id:uid(),charId:c.id,title:$('#pa_title').value.trim()||'메시지',trigger:{type:'start'},needOwn:!!Characters.own(c.id),script:sc,added:true};
        G.threads.push(th); Core.mark('t:'+th.id); p.inbox[th.id]={at:now,t0:now,pos:0,pick:0,done:false,log:[]}; Core.mark('prog'); MessengerView.updateBadge(); MessengerCtl.openRoom(c.id); break; }
  case 'phsel': MessengerCtl.openRoom(id,{sel:true}); break;
  case 'phselend': { const cid=PH&&PH.fc; if(cid) MessengerCtl.openRoom(cid); else MessengerView.phoneList(); break; }
  case 'phdel': { const cid=PH&&PH.fc; if(!cid) break; const x=Messenger.roomItems(cid)[+t.dataset.i]; if(!x) break; Messenger.roomDel(cid,[x]); MessengerView.phKeep(()=>MessengerCtl.openRoom(cid,{sel:true})); CoreView.toast('메시지를 지웠어요'); break; }
  case 'phdelblock': { const b=Messenger.roomLastBlock(id); if(!b.length) break; if(!(await appConfirm(`최근 대화 ${b.length}개 메시지를 지울까요?\n(호감도는 그대로예요)`))) break; Messenger.roomDel(id,b); MessengerCtl.openRoom(id); CoreView.toast('이번 대화를 지웠어요'); break; }
  case 'phdelall': { const c=charById(id); if(!c) break; if(!(await appConfirm(`${c.name}와(과)의 대화방을 모두 지울까요?\n(이야기로 받은 대화도 기록만 지워지고, 호감도는 그대로예요)`))) break;
        Messenger.roomThreads(id).forEach(({s})=>{ s.log.length=0; }); delete Core.progSlot('fchat')[id]; Core.mark('prog'); MessengerCtl.openRoom(id); CoreView.toast('대화방을 비웠어요'); break; }
  case 'phmode': MessengerView.phMode(t.dataset.v); break;
  case 'phsay': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s) break; const c=threadChar(th), L=System.parseScript(th.script)[s.pos]; if(!L||L.type!=='say'||!isMe(L.who)) { MessengerCtl.openRoom(c.id); break; }
        const en={w:'me',t:sub(L.text),at:Date.now()}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid; CoreView.phSentShow(en,c); Core.mark('prog'); CoreCtl.phPlay(th,c,s,PH.token); break; }
  case 'phnew': CharactersView.phNewList(); break;
  case 'fclear': squadSel=[]; CoreView.refreshForm(); break;
    }
  }

  static dailyTalks(){ return DailyTalksGen.run(); }

  static addThreads(arr,ch,needOwn){ const set=NewGame.storySayNorms(ch); let n=0;
    (Array.isArray(arr)?arr:[]).forEach(x=>{ const c=x&&Characters.findSpeaker(String(x.char||'')); if(!c||!x.script) return; const sc=nl(x.script); if(NewGame.threadDup(sc,set)) return;
      const st=ch.stages[Math.min(ch.stages.length,Math.max(1,+x.afterStage||1))-1]; const th={id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:{type:'clear',value:st.id},needOwn:!!needOwn,script:sc}; G.threads.push(th); Core.mark('t:'+th.id); n++; });
    return n; }
}

class MessengerView {
    /* 화면: 캐릭터 정보 탭 · 개성 편집 · 일괄 검수 */
static personaHTML(c){ if(!c||c.npc) return ''; const p=c.persona||{}, rv=Characters.personaReview(c), at=affThreads(c), o=Characters.own(c.id), lv=o?Core.affLv(o):0, chip=v=>`<span class="chip" style="font-size:.78rem">${esc(v)}</span>`, f=c.pfields||{}, ai=c.personaAIReview;
    return `<h3 class="sec">개성 <span class="badge">${rv.grade} ${rv.score}</span></h3>
  ${Object.keys(f).length?`<div class="g2" style="font-size:.85rem">${Object.entries(f).map(([k,v])=>`<div><span class="muted">${esc(k)}</span> ${esc(v)}</div>`).join('')}</div>`:''}
  ${(p.traits||[]).length?`<div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0">${p.traits.map(chip).join('')}</div>`:''}
  <div style="font-size:.85rem;line-height:1.6">${[['말투',[p.self&&'1인칭 '+p.self,p.ending&&'어미 '+p.ending,p.quirk&&'말버릇 '+p.quirk,p.call&&'부르는 말 '+p.call].filter(Boolean).join(' · ')],['대표 대사',p.catch&&`「${p.catch}」`],['반전 매력',p.gap],['약점',p.flaw],['원하는 것',p.want],['두려운 것',p.fear],['좋아함',(p.likes||[]).join(', ')],['싫어함',(p.dislikes||[]).join(', ')],['취미',p.hobby],['상징',p.motif]].filter(([,v])=>v).map(([k,v])=>`<div><span class="muted">${k}</span> ${esc(v)}</div>`).join('')||'<p class="muted">아직 개성 시트가 없어요.</p>'}</div>
  ${rv.issues.length?`<details style="margin:6px 0"><summary class="muted" style="font-size:.82rem">검수: 고칠 점 ${rv.issues.length}개</summary><ul style="margin:4px 0;padding-left:18px;font-size:.82rem">${rv.issues.map(x=>`<li>${esc(x.msg)}</li>`).join('')}</ul></details>`:''}
  ${ai?`<details style="margin:6px 0"><summary class="muted" style="font-size:.82rem">AI 평가 ${ai.score}점</summary><div style="font-size:.82rem"><b>장점</b> ${ai.strengths.map(esc).join(' / ')}<br><b>약점</b> ${ai.weaknesses.map(esc).join(' / ')}<br><b>제안</b> ${ai.suggestions.map(esc).join(' / ')}</div></details>`:''}
  <div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0"><button class="btn sm ghost" data-act="psedit" data-id="${c.id}">개성 편집</button><button class="btn sm ghost" data-act="psai" data-id="${c.id}" data-k="fill">AI로 채우기</button><button class="btn sm ghost" data-act="psai" data-id="${c.id}" data-k="improve">AI로 다듬기(+대사)</button><button class="btn sm ghost" data-act="psreview" data-id="${c.id}">AI 매력 평가</button></div>
  <h3 class="sec">인연 톡 · 메모리얼</h3>
  <p class="muted" style="font-size:.82rem;margin:0 0 6px">호감도 ${Characters.PERSONA_CFG().affLv.join('·')}에서 ${esc(System.T('talk'))}이 오고, ${c.memorial?`호감도 ${c.memorial.lv}에서 메모리얼이 열려요`:'메모리얼을 만들면 높은 호감도에서 열려요'}. 지금 호감도 Lv.${lv||'-'}</p>
  <div style="font-size:.85rem">${at.length?at.sort((a,b)=>a.trigger.value-b.trigger.value).map(t=>`<div>Lv.${t.trigger.value} 「${esc(t.title)}」 ${P().inbox[t.id]?'<span class="muted">받음</span>':'<span class="muted">잠김</span>'}</div>`).join(''):'<p class="muted" style="margin:0">아직 인연 톡이 없어요.</p>'}
  ${c.memorial?`<div style="margin-top:4px">✦ 메모리얼 「${esc(c.memorial.title)}」 ${Core.memoOpen(c)?'<span class="badge">열림</span>':`<span class="muted">호감도 ${c.memorial.lv}에서 열림</span>`}</div>`:''}</div>
  <div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0"><button class="btn sm ghost" data-act="pstalk" data-id="${c.id}">AI로 인연 톡 만들기</button><button class="btn sm ghost" data-act="psmemo" data-id="${c.id}">${c.memorial?'메모리얼 다시 만들기':'AI로 메모리얼 만들기'}</button>${c.memorial&&(Core.memoOpen(c)||!System.playMode())?`<button class="btn sm ghost" data-act="psmemoplay" data-id="${c.id}">메모리얼 보기</button>`:''}${Core.memoOpen(c)?`<button class="btn sm${System.memoOn(c)?'':' ghost'}" data-act="psmemolobby" data-id="${c.id}">메모리얼 로비 ${System.memoOn(c)?'끄기':'켜기'}</button>`:''}</div>`; }

  static updateBadge(){const el=document.querySelector('.lb-ico[data-act="phone"]'); if(!el) return; const n=Characters.unread(); let e=el.querySelector('em'); if(!n){ if(e) e.remove(); return; } if(!e){ e=document.createElement('em'); el.appendChild(e); } e.textContent=n;} // 로비 대화 아이콘 배지(예전 #phBadge는 화면에 없음)

  static openPhone(tid){ $('#notif').innerHTML=''; $('#phone').hidden=false; if(tid&&P().inbox[tid]) Messenger.openThread(tid); else MessengerView.phoneList(); }

  static phoneList(){
    PH=null; const rooms=Messenger.phRooms();
    $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phclose" aria-label="닫기">✕</button><b>${esc(System.T('talk'))}</b><button data-act="phnew" aria-label="대화 추가">＋</button></div><div class="ph-list">${
      rooms.length?rooms.map(x=>{ const l=x.last; return `<button class="ph-row" data-act="openfc" data-id="${esc(x.c.id)}"><div class="av">${CoreView.art(x.c)}</div><div class="t"><b>${esc(x.c.name)}</b><span>${esc(l?(l.w==='k'?'스티커를 보냈어요':l.w==='p'?'사진을 보냈어요':(l.w==='me'?'나: ':'')+(l.t||(l.img?'사진':''))):(x.title||'대화를 시작해 보세요'))}</span></div>${x.unread?'<i class="dot"></i>':''}</button>`; }).join('')
      :`<p class="muted" style="text-align:center;padding:40px 16px">아직 대화가 없어요. ${esc(System.T('crew'))}과(와) 친해지거나 ${esc(System.T('ops'))}을(를) 진행하면 연락이 와요.<br><br><button class="btn sm" data-act="phnew">＋ 대화 추가</button></p>`}</div></div>`;
  }

  static phAddView(cid,from){ const c=charById(cid); if(!c) return; PH={add:cid,from:from||'list'};
    $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phaddback" aria-label="뒤로">‹</button><b>대화 추가 · ${esc(c.name)}</b><span style="width:30px"></span></div>
    <div class="ph-add">
      <label class="f" for="pa_hint">어떤 대화를 받고 싶어요? (AI용, 비워도 돼요)</label><input class="in" id="pa_hint" placeholder="예: 비 오는 밤에 우산 없다고 데리러 와 달라는 대화">
      <div class="row" style="margin:8px 0 4px"><button class="btn sm" data-act="phaddai" data-id="${esc(cid)}" ${SAMPLE?'':'disabled'}>AI로 대화 쓰기</button>${SAMPLE?'':'<span class="muted" style="font-size:.78rem">글 AI를 등록하면 쓸 수 있어요</span>'}</div>
      <label class="f" for="pa_title">제목</label><input class="in" id="pa_title" placeholder="대화방 미리보기 문구">
      <label class="f" for="pa_script">대화 (직접 써도 돼요)</label><textarea class="in tall" id="pa_script" placeholder="${esc(c.name)}: 메시지&#10;선택: 답장1 | 답장2&#10;1) ${esc(c.name)}: 1번을 골랐을 때 반응&#10;2) ${esc(c.name)}: 2번을 골랐을 때 반응&#10;[사진: 소품이름]"></textarea>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="phaddsend" data-id="${esc(cid)}">대화 받기</button><button class="btn ghost" data-act="openfc" data-id="${esc(cid)}">대본 없이 바로 말 걸기</button></div>
    </div></div>`; }

  static chatImgView(k){ const u=chatImgCache[k], ph=$('.phone'); if(!u||!ph) return; const old=$('.ph-menu'); if(old) old.remove();
    ph.insertAdjacentHTML('beforeend',`<div class="ph-menu ph-view" data-act="phmenuclose"><img src="${esc(u)}" alt="사진"><div class="row"><button class="btn sm" data-act="chatimgsave" data-k="${esc(k)}">저장</button><button class="btn sm ghost" data-act="phmenuclose">닫기</button></div></div>`); }

  static phEmptyClear(cid){ const el=$('#phChat'); if(el&&el.children.length===1&&el.querySelector('.sys')&&Messenger.roomLog(cid).length===1) el.innerHTML=''; }

  static fcInputFocus(ms){ setTimeout(()=>{ const i=$('#fcIn'); if(i&&!IS_NATIVE&&!i.disabled) i.focus({preventScroll:true}); },ms); }

  static phFreeShow(){ MessengerView.phInClear(); MessengerView.phMode('free'); const sw=$('.ph-sw'); if(sw) sw.hidden=true; }

  static phInClear(){ const pi=$('#phIn'); if(pi) pi.innerHTML=''; }

  static phChoicesShow(t,opts){ $('#phIn').innerHTML=opts.map((o,i)=>`<button type="button" class="btn ghost block" data-act="phpick" data-tid="${esc(t.id)}" data-n="${i+1}">${esc(sub(o))}</button>`).join('')+PH_FREE_SW; MessengerView.phMode('pick'); }

  static phSayShow(t,text){ $('#phIn').innerHTML=`<button type="button" class="btn ghost block" data-act="phsay" data-tid="${esc(t.id)}">▶ ${esc(sub(text))}</button>`+PH_FREE_SW; MessengerView.phMode('pick'); }

    /* 메신저 부분 갱신(View): 알림 비우기 · 메뉴 닫기 · 내가 보낸 말 붙이기 · 다시 그려도 대화 스크롤 유지 */
static notifClear(){ $('#notif').innerHTML=''; }

  static phMenuClose(){ $('.ph-menu')?.remove(); }

  static phKeep(open){ const st=$('#phChat').scrollTop; open(); $('#phChat').scrollTop=st; }

  static phMenu(cid){ const c=charById(cid); if(!c) return; const old=$('.ph-menu'); if(old){ old.remove(); return; }
    const n=Messenger.roomItems(cid).length, nb=Messenger.roomLastBlock(cid).length;
    $('.phone').insertAdjacentHTML('beforeend',`<div class="ph-menu" data-act="phmenuclose"><div class="ph-sheet">
    <b class="ph-mt">${esc(c.name)}</b>
    <button data-act="phadd" data-id="${esc(cid)}">＋ 대화 추가</button>
    <button data-act="phsel" data-id="${esc(cid)}" ${n?'':'disabled'}>메시지 골라 지우기</button>
    <button data-act="phdelblock" data-id="${esc(cid)}" ${nb?'':'disabled'}>이번 대화 지우기 <small>최근 ${nb}개</small></button>
    <button data-act="phdelall" data-id="${esc(cid)}" class="danger" ${n?'':'disabled'}>대화방 전체 지우기 <small>${n}개</small></button>
    ${Core.imgReady()?`<button data-act="fcphototog">캐릭터가 사진 보내기 <small>${P().fcPhoto!==false?'켜짐 · 그림 AI 사용':'꺼짐'}</small></button>`:''}
    <button data-act="char" data-id="${esc(cid)}">${esc(System.T('crew'))} 정보</button>
    <button data-act="phmenuclose" class="ph-cancel">닫기</button></div></div>`); }

  static phMode(m){ if(!PH) return; PH.mode=m; const a=$('#phIn'), el=$('#phFree'); if(!a||!el) return; const hasPick=!!a.querySelector('[data-act=phpick],[data-act=phsay]');
    if(m==='pick'&&hasPick){ a.hidden=false; el.hidden=true; } else { a.hidden=true; el.hidden=false; const sw=el.querySelector('.ph-sw'); if(sw) sw.hidden=!hasPick; } CoreView.phScroll(); }

  static characterDetailPreviewTargets(root){
   const locked=new Set([...root.querySelectorAll('[data-cs=look] .locked img')].map(img=>img.src));
   for(const img of root.querySelectorAll('[data-cs="look"] img')){
    if(img.closest('.locked')||locked.has(img.src))continue;
    img.dataset.characterPreview='true';img.tabIndex=0;img.setAttribute('role','button');
    img.setAttribute('aria-label',(img.alt||'캐릭터 이미지')+' 크게 보기');
   }
  }

    /* 캐릭터 창(View): 장비·스킬 · 스토리 · 외형 · 정보 탭 */
static charSheetShow(id){
    const c=charById(id); if(!c) return; MBACK=null; const o=Characters.own(c.id),st=Core.stats(c);
    const eps=[...c.episodes].sort((a,b)=>a.lv-b.lv), ths=G.threads.filter(t=>t.charId===c.id), cap=o?levelCap(o):20;
    const old=$('#modal .sheet.cs-sheet'), keep=old&&old.dataset.cid===id?old.scrollTop:0;
    const list=Characters.crewOrder(), i=list.findIndex(x=>x.id===id), prev=list[(i-1+list.length)%list.length], next=list[(i+1)%list.length];
    const lbs=Art.imgSrcRaw(c.lbcg), cgOpen=!!(o&&o.dup>=5), skinSel=o&&o.skin, ill=c.illust?Art.imgSrcRaw(c.illust):null, wearing=Characters.skinOf(c), sec=(k,h)=>`<section data-cs="${k}" ${CS_TAB===k?'':'hidden'}>${h}</section>`;
    const equip=`${RulesView.rulesCharHTML(c)}
    ${v2EquipmentCard(c,o)}
    ${v2SkillSummary(c)}
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="wnai" data-id="${c.id}">NAI로 ${System.T('weapon')} 그리기</button><button class="btn sm ghost" data-act="v2icons" data-id="${c.id}">스킬 이미지 생성</button></div>`;
    const story=`
    <h3 class="sec">개인 스토리</h3>
    ${eps.length?eps.map(e=>{const lk=Story.epLock(c,e,o),seen=o&&(o.seen||[]).includes(e.id);return `<div class="ep ${lk?'lock':''}"><span class="badge">Lv.${e.lv}</span><span class="t"><b>${esc(e.title)}</b><span class="muted">${lk?lk+' 필요':(seen?'감상 완료':'NEW')}</span></span>${!lk?`<button class="btn sm" data-act="playep" data-id="${c.id}" data-ep="${e.id}">보기</button>`:''}<button class="btn sm ghost" data-act="epedit" data-id="${c.id}" data-ep="${e.id}">편집</button></div>`;}).join(''):'<p class="muted">아직 없어요.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="epedit" data-id="${c.id}" data-ep="">스토리 추가</button></div>
    <h3 class="sec">${System.T('talk')}</h3>
    ${ths.length?ths.map(t=>{const s=P().inbox[t.id];return `<div class="ep"><span class="t"><b>${esc(t.title)}</b><span class="muted">${Core.trigDesc(t)} · ${s?(s.done?'읽음':'도착'):'미도착'}</span></span>${s?`<button class="btn sm" data-act="openthread" data-id="${t.id}">열기</button>`:''}<button class="btn sm ghost" data-act="thedit" data-id="${c.id}" data-th="${t.id}">편집</button></div>`;}).join(''):'<p class="muted">아직 없어요.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="thedit" data-id="${c.id}" data-th="">${System.T('talk')} 추가</button></div>
    <h3 class="sec">관계</h3>
    ${(()=>{ const ref=baseChar(c).id, rs=Core.relOf(ref); return rs.length?rs.slice(0,6).map(r=>`<div class="ep"><span class="t"><b>${esc(Core.relName(Core.relOther(r,ref),true))} <span class="muted">· ${esc(r.kind||'')}</span></b><span class="muted">${esc(r.note||'')}</span></span></div>`).join('')+(rs.length>6?`<p class="muted" style="font-size:.78rem">외 ${rs.length-6}개</p>`:''):'<p class="muted">아직 관계 기록이 없어요. 스토리를 만들면 함께 쌓여요.</p>'; })()}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="relopen" data-r="${esc(baseChar(c).id)}">🕸 관계도 보기</button></div>`;
    const outfit=(c.skins||[]).length?`<div class="outfit"><b>의상</b><div class="chips">${o?`<button class="chip ${!skinSel?'on':''}" data-act="skinuse" data-id="${c.id}" data-s="">기본</button>`:''}${(c.skins||[]).map(k=>`<button class="chip ${skinSel===k.id?'on':''}" data-act="skinuse" data-id="${c.id}" data-s="${k.id}" ${o?'':'disabled'}>${skinHave(k)?'':'🔒 '}${esc(k.name)}${Core.skinDisplayReady(c,k)?'':Core.skinPreviewSrc(c,k)?' (상반신 필요)':' (미생성)'}</button>`).join('')}</div>${wearing&&!Core.skinDisplayReady(c,wearing)&&c.useStanding===false?`<p class="muted">선택한 스킨의 상반신이 없어 기본 상반신을 표시하고 있어요. <button class="btn sm ghost" data-act="skinuse" data-id="${c.id}" data-s="${wearing.id}">스킨 상반신 생성</button></p>`:''}</div>`:'';
    const look=(wearing?`${v2StandingHeader(c)}${outfit}<p class="muted" style="margin:4px 0 8px;font-size:.8rem">「${esc(wearing.name)}」을(를) 입고 있어요. 여기서 고치면 이 ${esc(System.T('skin'))}에 저장돼요. 기본 모습은 '기본'을 고른 뒤 고쳐요.</p>${CoreView.skinCard(c,wearing)}
    <div class="row" style="margin:10px 0"><button class="btn sm ghost" data-act="skin-open" data-id="${c.id}">새 ${System.T('skin')} 만들기</button></div>`:`${outfit}
    <div class="row" style="margin:0 0 4px"><button class="btn sm ghost" data-act="imglib" data-id="${c.id}">🖼 그림 모아 보기</button></div>
    ${v2StandingHeader(c)}
    <p class="muted" style="margin:0 0 6px">배경 없는 전신 그림이에요. ${System.T('crew')} 목록과 ${System.T('talk')}에서는 위쪽(상반신, 얼굴)만 잘라서 보여 줘요.</p>
    <div class="ill-box standing-box">${Art.imgSrcRaw(c)?`<img src="${esc(Art.imgSrcRaw(c))}" alt="${esc(c.name)} 스탠딩">`:'<span>스탠딩 이미지가 아직 없어요</span>'}</div>
    <div class="row"><button class="btn sm" data-act="naigen" data-k="char" data-id="${c.id}">NAI로 스탠딩</button><button class="btn sm ghost" data-act="upload" data-k="char" data-id="${c.id}">이미지 올리기</button>${Art.imgSrcRaw(c)?`<button class="btn sm ghost" data-act="cutopen" data-k="char" data-id="${c.id}">배경 지우기</button>`+XBTN('char',c.id,'','지우기'):''}</div>
    <h3 class="sec">상반신 (스토리·프로필)</h3>
    <p class="muted" style="margin:0 0 6px">배경 없는 상반신 그림이에요. 있으면 스토리와 ${System.T('crew')} 프로필에서 전신을 잘라 쓰는 대신 이 그림을 써요. 표정 그림이 있는 장면에서는 표정이 먼저예요.</p>
    <div class="ill-box up-box">${c.upper&&Characters.imgSrc(c.upper)?`<img src="${esc(Characters.imgSrc(c.upper))}" alt="">`:'<span>아직 없어요 · 없으면 전신 위쪽을 잘라서 보여 줘요</span>'}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="upgen" data-id="${c.id}">NAI로 상반신</button><button class="btn sm ghost" data-act="upload" data-k="upper" data-id="${c.id}">올리기</button>${c.upper&&Characters.imgSrc(c.upper)?`<button class="btn sm ghost" data-act="updel" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">로비 레이어 (배경 + 캐릭터 따로)</h3>
    <p class="muted" style="margin:0 0 6px;font-size:.8rem">배경과 투명 캐릭터를 따로 그려 겹쳐요. 로비에서 배경은 그대로, 캐릭터만 숨 쉬듯 움직여요. 배경이 없으면 로비 배경을, 포즈가 없으면 상반신 그림을 써요. 상반신도 없으면 스탠딩 사용 설정에 따라 표시해요. 일러스트로 자동 전환하지 않아요.</p>
    <div class="lbl-pair"><div class="lbl-prev">${(()=>{ /* 포즈 → 상반신 순서로 로비와 동일하게 표시 */ const bgI=c.lbbg&&Characters.imgSrc(c.lbbg),bg=bgI?`<img class="lbl-bg" src="${esc(bgI)}" alt="">`:`<div class="lbl-bg" style="${ArtView.bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div>`,ps=!(Characters.skinOf(c)&&Characters.imgSrc(Characters.skinOf(c)))&&c.pose&&Characters.imgSrc(c.pose);return bg+(ps?`<img class="lbl-ch" src="${esc(ps)}" alt="">`:CharactersView.lobbyCharacterArt(c,'lbl-ch')); })()}</div>
      <div class="lbl-side"><span class="muted">배경 ${c.lbbg&&Characters.imgSrc(c.lbbg)?'✓':'—'} · 포즈 ${c.pose&&Characters.imgSrc(c.pose)?'✓':'—'}</span>
      <label class="f" for="lbbg_scene">배경 장면 태그</label><input class="in" id="lbbg_scene" value="${esc((c.lbbg&&c.lbbg.prompt)||'')}" placeholder="${esc((c.illust&&c.illust.prompt)||'cozy room, window, soft light')}"></div></div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="posegen" data-id="${c.id}" data-w="both">NAI로 배경 + 포즈</button><button class="btn sm ghost" data-act="posegen" data-id="${c.id}" data-w="bg">배경만</button><button class="btn sm ghost" data-act="posegen" data-id="${c.id}" data-w="pose">포즈만</button></div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="upload" data-k="lbbg" data-id="${c.id}">배경 올리기</button><button class="btn sm ghost" data-act="upload" data-k="pose" data-id="${c.id}">포즈 올리기</button>${(c.pose&&Characters.imgSrc(c.pose))?`<button class="btn sm ghost" data-act="posedel" data-id="${c.id}">포즈 지우기</button>`:''}${c.lbbg&&Characters.imgSrc(c.lbbg)?`<button class="btn sm ghost" data-act="lbbgdel" data-id="${c.id}">배경 지우기</button>`:''}</div>
    <h3 class="sec">일러스트 (로비·타이틀·픽업)</h3>
    <p class="muted" style="margin:0 0 6px">배경까지 그려진 세로 한 장 그림이에요. 타이틀과 ${System.T('gacha')} 픽업 화면에 쓰이며, 로비에서는 표시 방식을 ‘일러스트 표시’로 골랐을 때 사용해요.</p>
    <div class="ill-box">${ill?`<img src="${esc(ill)}" alt="">`:'<span>아직 없어요</span>'}</div>
    <label class="f" for="il_scene">장면·배경 태그 (선택)</label><input class="in" id="il_scene" value="${esc(c.illust.prompt||'')}" placeholder="night, city lights, rooftop, wind, from below">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="ilgen" data-k="illust" data-id="${c.id}">NAI로 일러스트</button><button class="btn sm ghost" data-act="upload" data-k="illust" data-id="${c.id}">올리기</button>${ill?`<button class="btn sm ghost" data-act="ildel" data-k="illust" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">최대 ${esc(System.T('limit'))} CG</h3>
    <p class="muted" style="margin:0 0 6px">${esc(System.T('limit'))} 5단계를 달성하면 공개되는 특별 일러스트예요. 미리 만들어 두면 달성하는 순간 연출과 함께 열려요. 공개 후에는 로비에도 쓸 수 있어요.</p>
    <div class="ill-box ${cgOpen?'':'locked'}">${lbs?`<img src="${esc(lbs)}" alt="">`:'<span>아직 없어요</span>'}${cgOpen?'':`<div class="lockcap">🔒 ${esc(System.T('limit'))} 5단계에서 공개<small>${o?o.dup:0} / 5</small></div>`}</div>
    <label class="f" for="lb_scene">장면 태그 (선택)</label><input class="in" id="lb_scene" value="${esc(c.lbcg.prompt||'')}" placeholder="night sky, shooting stars, reaching out, smile, wind">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="ilgen" data-k="lbcg" data-id="${c.id}">NAI로 ${esc(System.T('limit'))} CG</button><button class="btn sm ghost" data-act="upload" data-k="lbcg" data-id="${c.id}">올리기</button>${lbs?`<button class="btn sm ghost" data-act="ildel" data-k="lbcg" data-id="${c.id}">지우기</button>`:''}</div>
    ${lbs&&cgOpen?`<label class="f" style="margin-top:8px"><input type="checkbox" data-act="cguse" data-id="${c.id}" ${o.useCg?'checked':''}> 로비와 타이틀에 이 CG 쓰기</label>`:''}
    <h3 class="sec">기술 컷인 (스킬 쓸 때 크게)</h3>
    <p class="muted" style="margin:0 0 6px">「${esc(v2Kit(c).ultimate.name)}」 궁극기를 쓸 때 화면을 가로지르며 크게 나오는 그림이에요. 없으면 스탠딩을 크게 써요.</p>
    <div class="ill-box scg-box">${Art.imgSrcRaw(Core.scgOf(c))?`<img src="${esc(Art.imgSrcRaw(Core.scgOf(c)))}" alt="">`:'<span>아직 없어요 · 없으면 스탠딩으로 나와요</span>'}</div>
    <label class="f" for="sc_scene">장면 요청 (선택 · 생성 시 AI가 궁극기에 맞게 구성)</label><input class="in" id="sc_scene" value="${esc(Core.scgOf(c).prompt||'')}" placeholder="${esc(Messenger.ultimateSceneTags(c))}, motion lines">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="scggen" data-id="${c.id}">NAI로 기술 컷인</button><button class="btn sm ghost" data-act="upload" data-k="scg" data-id="${c.id}">올리기</button><button class="btn sm ghost" data-act="scgtest" data-id="${c.id}">미리 보기</button>${Characters.imgSrc(Core.scgOf(c))?`<button class="btn sm ghost" data-act="scgdel" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">표정과 ${System.T('skin')}</h3>
    <div class="facegrid">${c.faces.map(f=>`<button class="fc" data-act="faceview" data-id="${c.id}" data-f="${f.id}">${Characters.imgSrc(f)?`<img src="${esc(Characters.imgSrc(f))}" alt="">`:''}<span>${esc(f.name)}</span></button>`).join('')}</div>
    <div class="row" style="margin:8px 0"><button class="btn sm ghost" data-act="faces-open" data-id="${c.id}">표정 만들기</button><button class="btn sm ghost" data-act="audopen" data-id="${c.id}">점검·변환</button><button class="btn sm ghost" data-act="skin-open" data-id="${c.id}">${System.T('skin')} 만들기</button>${c.alt?'':`<button class="btn sm ghost" data-act="altnew" data-id="${c.id}">이격 만들기</button>`}</div>
    ${c.alt&&charById(c.alt)?`<p class="muted" style="margin:4px 0">이격: <button class="linkb" data-act="char" data-id="${c.alt}">${esc(charById(c.alt).name)}</button>의 다른 모습이에요.</p>${CharactersView.inheritHTML(c)}`:altsOf(c).length?`<p class="muted" style="margin:4px 0">이격: ${altsOf(c).map(x=>`<button class="linkb" data-act="char" data-id="${x.id}">${esc(x.name)}</button>${Characters.own(x.id)?'':' (미보유)'}`).join(' · ')}</p>`:''}
    ${Core.charImgList(c).length?`<h3 class="sec">그림 저장 <span class="muted" style="font-size:.75rem">${Core.charImgList(c).length}장 · 묶음을 눌러 펼쳐요</span></h3><p class="muted" style="margin:0 0 6px;font-size:.8rem">${IS_NATIVE?'Documents/가챠게임메이커/그림 폴더에 저장돼요.':'휴대폰은 공유하기로 사진 앱에, PC는 다운로드 폴더에 저장돼요.'}</p>${(()=>{ const L=Core.charImgList(c), gs=[...new Set(L.map(x=>x[2]))]; return gs.map(g=>{ const it=L.filter(x=>x[2]===g); return `<details class="isv"><summary>${esc(g)} <span class="muted">${it.length}장</span></summary><div class="isv-grid">${it.map(([o,l])=>`<button class="isv-it" data-act="imgsave" data-id="${c.id}" data-o="${esc(o.id)}"><img src="${esc(Art.imgSrcRaw(o))}" alt="" loading="lazy"><span>⬇ ${esc(l)}</span></button>`).join('')}</div></details>`; }).join(''); })()}`:''}`);
    const info=`${MessengerView.personaHTML(c)}
    <div class="row" style="margin-top:4px">${o&&P().sec!==c.id?`<button class="btn sm" data-act="setsec" data-id="${c.id}">로비에 세우기</button>`:''}${o?`<button class="btn sm ghost" data-act="gift" data-id="${c.id}">🎁 선물하기</button>`:''}<button class="btn sm ghost" data-act="charedit" data-id="${c.id}">✏️ 이름·대사 편집</button><button class="btn sm ghost" data-act="puexist" data-id="${c.id}">★ 픽업 배너</button></div>
    <p style="margin:12px 2px 4px">${esc(c.profile)}</p>
    ${(c.files||[]).length?`<h3 class="sec">${System.T('files')}</h3>${c.files.map(f=>o&&o.dup>=f.dup?`<div class="file"><i>FILE ${f.dup}</i>${esc(f.text)}</div>`:`<div class="file lock"><i>FILE ${f.dup}</i>${System.T('limit')} ${f.dup}단계에서 공개</div>`).join('')}`:''}
    <h3 class="sec">목소리</h3>
    <div class="ep"><span class="t"><b>${c.voiceId?esc(c.voiceName||'지정됨'):'없음'}</b><span class="muted">${c.voiceId?esc(c.voiceId):'Fish Audio에서 어울리는 목소리를 찾아요'}</span></span>${c.voiceId?`<button class="btn sm ghost" data-act="vtest" data-id="${c.id}">▶</button>`:''}<button class="btn sm" data-act="voice" data-id="${c.id}">${c.voiceId?'바꾸기':'찾기'}</button></div>
    <h3 class="sec">NAI 프롬프트</h3><div class="code-box">${esc(c.naiPrompt||'설정 편집에서 AI로 만들 수 있어요.')}</div>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="copy" data-text="${esc(c.naiPrompt||'')}">프롬프트 복사</button><button class="btn sm" data-act="charedit" data-id="${c.id}">설정 편집</button></div>`;
    CoreView.openModal(`<div class="cs" style="--ec:${ECOL[c.elem]||'var(--rose)'}">
    <div class="cs-hero">
      <div class="cs-bg" style="${ArtView.bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div><div class="cs-stripe"></div>
      <div class="cs-art ${P().csFull?'':'up'}" data-act="cspoke" data-id="${c.id}">${CoreView.characterDetailArt(c,!P().csFull)}</div><div class="cs-say" id="csSay" hidden></div>${Art.imgSrcRaw(Characters.skinOf(c)||c)?`<button class="cs-frame" data-act="csframe">${P().csFull?'상반신':'전신'}</button>`:''}
      <div class="cs-top"><button class="cs-back" data-act="close" aria-label="닫기">‹ <b>${esc(System.T('crew'))}</b></button><span class="cs-cap">${esc(System.T('crew')).toUpperCase()} INFORMATION</span></div>
      ${SAMPLE&&!System.playMode()?`<button class="cs-nav ai ${list.length>1?'':'solo'}" data-act="charregen" data-id="${c.id}" title="AI로 다시 만들기">✦ 재생성</button>`:''}${list.length>1?`<button class="cs-nav l" data-act="char" data-id="${prev.id}" aria-label="이전">‹</button><button class="cs-nav r" data-act="char" data-id="${next.id}" aria-label="다음">›</button>`:''}
      <div class="cs-panel">
        <div class="cs-rr"><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span><span class="cs-role">${ROLE_EN[c.role]}</span><span class="cs-rar r${c.rarity}">${RL[c.rarity]}</span></div>
        <div class="cs-plate"><span class="lv">LV.<b>${o?o.lv:1}</b>/${cap}</span><b class="nm">${esc(c.name)}</b></div>
        <div class="cs-sub"><span>${o?`<span class="st">${'★'.repeat(o.dup)}${'☆'.repeat(5-o.dup)}</span>`:'미보유'}${c.limited?' · 한정':''}</span>${o?`<span class="aff">♥ 호감도 ${Core.affLv(o)}</span>`:''}</div>
        <div class="cs-pow"><i>POWER</i><b>${nf(charPower(c))}</b></div>
        <div class="cs-stat"><h4>STATUS</h4><div class="sg"><div><span>HP</span><b>${nf(st.hp)}</b></div><div><span>ATK</span><b>${nf(st.atk)}</b></div><div><span>DEF</span><b>${nf(st.def)}</b></div><div><span>SPD</span><b>${st.spd}</b></div></div></div>
        ${o?`<div class="cs-bar"><i style="width:${o.lv>=cap?100:o.exp/(GGMCombat.levelExperience(o.lv))*100}%"></i></div>
        <div class="cs-acts3"><button class="btn" data-act="enh" data-id="${c.id}">LV+ ${esc(System.T('enhance'))}</button><button class="btn max" data-act="enhmax" data-id="${c.id}">MAX</button><button class="btn lbk" data-act="lb" data-id="${c.id}">${o.lv>=70?'초월 승급':'승급'}</button></div>
`:`<p class="cs-mats" style="text-align:left">아직 보유하지 않았어요. ${esc(System.T('gacha'))}에서 만날 수 있어요.</p>`}
        <div class="cs-squad"><span>SQUAD</span><b>${esc(c.faction||'무소속')}</b></div>
      </div>
    </div>
    <div class="cs-tabs">${[['equip','장비·스킬'],['story','스토리'],['look','외형'],['info','정보']].map(([k,l])=>`<button class="${CS_TAB===k?'on':''}" data-act="cstab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="cs-body">${sec('equip',equip)}${sec('story',story)}${sec('look',look)}${sec('info',info)}</div>
  </div>`,false,'cs-sheet');
    MessengerView.characterDetailPreviewTargets($('#modal'));
    const el=$('#modal .sheet'); if(el){ el.dataset.cid=id; if(old)el.scrollTop=keep; }
  }
}

class MessengerCtl {
  static checkTriggers(silent){
    if(!P().seenOpening) return;
    const fresh=[];
    for(const t of G.threads){ if(P().inbox[t.id]) continue; if(Story.trigOk(t)){P().inbox[t.id]={at:Date.now()+fresh.length,pos:0,pick:0,done:false,log:[]};fresh.push(t);} }
    if(fresh.length){ Core.mark('prog'); if(!silent) CoreView.notify(fresh[0],fresh.length-1); MessengerView.updateBadge(); }
  }

  static openRoom(cid,opt){
    const c=charById(cid); if(!c) return; const f=Messenger.fcOf(cid); const token={}; opt=opt||{};
    const act=Messenger.roomThreads(cid).find(x=>!x.s.done&&x.t);
    PH={fc:cid,tid:act?act.t.id:null,token,mode:'free',sel:!!opt.sel};
    CoreView.roomShow(c,Messenger.roomItems(cid)); if(!PH.sel) CoreView.phScroll(); Messenger.fcRead(f);
    if(PH.sel) return;
    if(act){ act.s.t0=act.s.t0||Date.now(); CoreCtl.phPlay(act.t,c,act.s,token); }
    else MessengerView.fcInputFocus(50);
  }
}

/* ===== Messenger의 AI 생성 흐름(Generator 하위 — docs/redesign.md 3절) ===== */
/* 오늘의 톡(보유 캐릭터 1~2명) — 답이 없어도 끝난 오래된 오늘의 톡은 정리 */
class DailyTalksGen extends Generator {
  static fail = 0;
  static context(o){ const owned=[...new Set(G.chars.filter(c=>Characters.own(c.id)).map(c=>baseChar(c)))];
    const picks=[...owned].sort(()=>Math.random()-.5).slice(0,Math.random()<0.5?1:2), evs=G.events.filter(ev=>ev.active!==false).map(e=>e.title).join(', ');
    const wd=['일','월','화','수','목','금','토'][new Date().getDay()];
    return {...o,owned,picks,evs,wd}; }
  static ready({owned}){ return owned.length>0; }
  static prompt({picks,wd,evs}){ return LiveOps.dailyTalksPrompt({picks,wd,evs}); }
  static apply(r){ let n=0; (r&&Array.isArray(r.threads)?r.threads:[]).forEach(x=>{const c=Characters.findSpeaker(String(x.char||''));if(!c||!x.script)return;const th={id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:{type:'start'},needOwn:true,script:nl(x.script),daily:true};G.threads.push(th);Core.mark('t:'+th.id);n++;}); DailyTalksGen.prune(); return n; }
  static none(){ DailyTalksGen.prune(); return 0; }
  static prune(){ const old=G.threads.filter(t=>t.daily&&P().inbox[t.id]&&P().inbox[t.id].done); if(old.length>40){ old.slice(0,old.length-40).forEach(t=>{G.threads=G.threads.filter(x=>x!==t);Core.mark('t:'+t.id);}); } }
}
/* 자유 대화 요약(오래된 대화를 줄여 둠) */
class ChatSummaryGen extends Generator {
  static tier = 'quick';
  static fail = undefined;
  static context(o){ const c=charById(o.cid), f=Messenger.fcOf(o.cid); const end=f.log.length-24, part=f.log.slice(f.sumTo||0,end); return {...o,c,f,end,part}; }
  static ready({part}){ return part.length>=20; }
  static prompt({c,f,part}){ return Player.fcSummarizePrompt({c,f,part}); }
  static parse(r){ return r.summary?r:null; }
  static apply(r,{f,end}){ f.sum=String(r.summary).slice(0,1200); f.sumTo=end; Core.mark('prog'); }
}
