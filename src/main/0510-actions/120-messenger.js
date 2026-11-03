async function handleMessengerAction(a,t,id,p,e){
  switch(a){
case 'phone': e.stopPropagation(); openPhone(); break;
case 'openthread': { const el=$('#notif'); el.innerHTML=''; openPhone(id); break; }
case 'phclose': closePhone(); break;
case 'phback': phoneList(); break;
case 'openfc': openFree(id); break;
case 'fcsend': fcSend(); break;
case 'fcphoto': if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } if(FCBUSY){ toast('답장을 기다리는 중이에요'); break; } $('#chatfile').click(); break;
case 'fcphototog': { const p=P(); p.fcPhoto=p.fcPhoto===false; mark('prog'); const m=$('.ph-menu'); if(m) m.remove(); toast(p.fcPhoto?'캐릭터가 가끔 사진을 보내요 (그림 AI 사용)':'캐릭터가 사진을 보내지 않아요'); break; }
case 'chatimg': chatImgView(t.dataset.k); break;
case 'phpendx': if(PH){ PH.pendImg=null; phPendRender(); const i=$('#fcIn'); if(i) i.placeholder='메시지 보내기'; } break;
case 'chatimgsave': { e.stopPropagation(); const u=chatImgCache[t.dataset.k]; if(u) saveImgUrl(u,'chat-photo'); break; }
case 'phpick': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s){ if(PH.fc) openRoom(PH.fc); break; }
      const c=threadChar(th), lines=parseScript(th.script); let L=lines[s.pos];
      if(!L||L.type!=='choice'){ let j=s.pos; while(j>0&&!(lines[j]&&lines[j].type==='choice')) j--; if(lines[j]&&lines[j].type==='choice'&&!s.log.some(x=>x.w==='me'&&x.pi===j)){ s.pos=j; L=lines[j]; } else { openRoom(c.id); break; } }
      const el=+t.dataset.n; s.pick=el; s.lastPick=L.opts[el-1]||''; const en={w:'me',t:sub(L.opts[el-1]||''),at:Date.now(),pi:s.pos}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid;
      $('#phIn').innerHTML=''; phMode('free'); $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(en,c)); phScroll(); mark('prog'); phPlay(th,c,s,PH.token); break; }
case 'phmenu': phMenu(id); break;
case 'phmenuclose': { if(t.classList.contains('ph-menu')&&e.target!==t) break; $('.ph-menu')?.remove(); break; }
case 'phadd': phAddView(id,PH&&PH.fc?'room':'list'); break;
case 'phaddback': { const a=PH&&PH.add, fr=PH&&PH.from; if(a&&fr==='room') openRoom(a); else phNewList(); break; }
case 'phaddai': { const c=charById(id); if(!c) break; const hint=$('#pa_hint').value.trim();
      const r=await aiJSON(`${pf('THREAD_REPLY',{RULES,ctx:ctx(),THREAD_FMT,crew:T('crew'),name:c.name,v:c.profile||'',v2:(c.lines||[]).join(' / '),own:own(c.id)?affLv(own(c.id)):1,fcProgress:fcProgress(),v3:hint?'요청: '+hint:'요청: 지금 이 캐릭터가 보낼 법한 일상적인 메신저 대화',roomLog:roomLog(c.id).slice(-10).map(l=>l.w==='me'?playerName()+': '+l.t:l.w==='c'?c.name+': '+l.t:'').filter(Boolean).join('\n'),player:T('player')})}\nJSON만 출력: {"title":"대화방 미리보기 제목","script":"대화"}`,t);
      if(r&&$('#pa_script')){ if(r.title) $('#pa_title').value=String(r.title); if(r.script) $('#pa_script').value=nl(r.script); toast('대화를 채웠어요. 고칠 곳이 있으면 고치고 받기를 누르세요'); } break; }
case 'phaddsend': { const c=charById(id); if(!c) break; const sc=$('#pa_script').value.trim(); if(!sc){ toast(SAMPLE?'대화를 쓰거나 AI로 대화 쓰기를 눌러 주세요':'대화를 써 주세요'); break; }
      const now=Date.now(), th={id:uid(),charId:c.id,title:$('#pa_title').value.trim()||'메시지',trigger:{type:'start'},needOwn:!!own(c.id),script:sc,added:true};
      G.threads.push(th); mark('t:'+th.id); p.inbox[th.id]={at:now,t0:now,pos:0,pick:0,done:false,log:[]}; mark('prog'); updateBadge(); openRoom(c.id); break; }
case 'phsel': openRoom(id,{sel:true}); break;
case 'phselend': { const cid=PH&&PH.fc; if(cid) openRoom(cid); else phoneList(); break; }
case 'phdel': { const cid=PH&&PH.fc; if(!cid) break; const x=roomItems(cid)[+t.dataset.i]; if(!x) break; roomDel(cid,[x]); const st=$('#phChat').scrollTop; openRoom(cid,{sel:true}); $('#phChat').scrollTop=st; toast('메시지를 지웠어요'); break; }
case 'phdelblock': { const b=roomLastBlock(id); if(!b.length) break; if(!(await appConfirm(`최근 대화 ${b.length}개 메시지를 지울까요?\n(호감도는 그대로예요)`))) break; roomDel(id,b); openRoom(id); toast('이번 대화를 지웠어요'); break; }
case 'phdelall': { const c=charById(id); if(!c) break; if(!(await appConfirm(`${c.name}와(과)의 대화방을 모두 지울까요?\n(이야기로 받은 대화도 기록만 지워지고, 호감도는 그대로예요)`))) break;
      roomThreads(id).forEach(({s})=>{ s.log.length=0; }); delete FC()[id]; mark('prog'); openRoom(id); toast('대화방을 비웠어요'); break; }
case 'phmode': phMode(t.dataset.v); break;
case 'phsay': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s) break; const c=threadChar(th), L=parseScript(th.script)[s.pos]; if(!L||L.type!=='say'||!isMe(L.who)) { openRoom(c.id); break; }
      const en={w:'me',t:sub(L.text),at:Date.now()}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid; $('#phIn').innerHTML=''; phMode('free'); $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(en,c)); phScroll(); mark('prog'); phPlay(th,c,s,PH.token); break; }
case 'phnew': phNewList(); break;
case 'fclear': squadSel=[]; refreshForm(); break;
  }
}


