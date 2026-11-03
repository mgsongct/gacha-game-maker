async function handleCombatAndFormationAction(a,t,id,p,e){
  switch(a){
case 'raidgo': { if(!raidTriesLeft()){ toast('오늘 도전 횟수를 다 썼어요'); break; } const b=raidBoss(); squadSel=null; FORM=null; openFormation({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid'},'raidstart'); break; }
case 'raidstart': { P().squad=[...squadSel]; const r=RAID(); r.tries[today()]=(r.tries[today()]||0)+1; mark('prog'); closeModal(); const b=raidBoss(), hp0=Math.max(1,b.total-r.dmg);
      startStage({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid',total:b.total,hp0,prep:(al,en)=>{ en[0].maxhp=b.total; en[0].hp=hp0; }}); break; }
case 'rgnew': { RGMODE='card'; RF=null; openRgForm(); break; }
case 'rfslot': RF.sel=+t.dataset.i; openRgForm(); break;
case 'rffil': RF.filter=t.dataset.v; openRgForm(); break;
case 'rfauto': RF.s=rfAuto(); RF.sel=0; openRgForm(); break;
case 'rfclr': RF.s=[null,null,null,null]; RF.sel=0; openRgForm(); break;
case 'rfpick': { const k=RF.s.indexOf(id), i=RF.sel; if(k===i) RF.s[i]=null; else { if(k>=0) RF.s[k]=RF.s[i]; RF.s[i]=id; } if(!RF.s[0]) RF.sel=0; else { const e=RF.s.indexOf(null); RF.sel=e>=0?e:RF.sel; } openRgForm(); break; }
case 'rfgo': { const ids=rfIds(); if(!ids.length) break; RG().lastSquad=ids; P().squad=[...ids]; closeModal(); try{ rgStart(ids,'card'); }catch(err){ console.error(err); RG().run=null; mark('prog'); toast('탐사를 시작하지 못했어요: '+(err&&err.message||err)); render(); } RF=null; setTimeout(()=>{ const e=document.querySelector('.ch-card.rog'); if(e) e.scrollIntoView({block:'start',behavior:'smooth'}); },60); break; }
case 'rgnode': { const run=RG().run; if(!run) break; run.msg=''; rgNode(t.dataset.v); break; }
case 'rgskip': { const run=RG().run; if(!run) break; run.pick=null; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); run.msg='유물 대신 숨을 돌렸어요. 체력 10% 회복'; mark('prog'); render(); break; }
case 'rgrelic': { const run=RG().run; if(!run) break; run.relics.push(t.dataset.v); run.pick=null; run.msg=RELICS[t.dataset.v][0]+'을(를) 얻었어요'; mark('prog'); render(); break; }
case 'dgmove': dgMove(+t.dataset.v); break;
case 'dgdown': { const run=RG().run; if(run&&run.v===2&&run.map.cells[run.pos].t==='stairs') dgDescend(run); break; }
case 'rgcard': { const run=RG().run; if(!run||!run.cpick) break; const i=+t.dataset.i; if(i>=0&&run.cpick[i]){ run.deck.push(run.cpick[i]); run.msg=`「${cardName(run.cpick[i])}」 카드를 덱에 넣었어요`; } run.cpick=null; mark('prog'); render(); break; }
case 'rgrest': { const run=RG().run; if(!run) break; const v=t.dataset.v; run.rest=false;
      if(v==='heal'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); run.msg='모닥불 곁에서 푹 쉬었어요. 쓰러진 대원도 일어났어요.'; }
      else if(v==='upg') run.upg=true; else if(v==='rm') run.rm=true; else { run.relics.push('train'); run.msg='훈련으로 공격 +5%'; }
      mark('prog'); render(); break; }
case 'rgupg': { const run=RG().run; if(!run) break; const i=+t.dataset.i; run.upg=false; if(i<0) run.rest=true; else if(run.deck[i]){ run.deck[i].up=true; run.msg=`「${cardName(run.deck[i])}」(으)로 강화했어요`; } mark('prog'); render(); break; }
case 'rgrm': { const run=RG().run; if(!run) break; const i=+t.dataset.i; if(i>=0&&run.deck.length<=8){ toast('덱은 8장보다 적게 줄일 수 없어요'); break; } run.rm=false; if(i<0) run.rest=true; else if(run.deck[i]){ const cd=run.deck.splice(i,1)[0]; run.msg=`「${cardName(cd)}」 카드를 뺐어요`; } mark('prog'); render(); break; }
case 'rgdeck': { const run=RG().run; if(run&&run.deck) rgDeckModal(run.deck); break; }
case 'cbplay': cbPlay(+t.dataset.i); break;
case 'cbsel': if(CB&&!CB.busy&&!CB.over){ const i=+t.dataset.i; if(i>=0&&CB.sel===i){ const cd=CB.hand[i]; if(cd&&cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last)) cbPlay(i); } else { CB.sel=i; cbRender(); } } break;
case 'cbult': cbUlt(); break;
case 'cbend': cbEndTurn(); break;
case 'cbtgt': if(CB&&!CB.busy){ const e=CB.enemies[+t.dataset.i]; if(e&&e.hp>0){ CB.tgt=e.i; cbRender(); } } break;
case 'cbdeck': if(CB) rgDeckModal(CB.run.deck); break;
case 'cbquit': if(CB&&!CB.over&&(await appConfirm('후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))) cbEnd(false); break;
case 'rgsave': { const run=RG().run; if(!run||!run.rest) break; run.saved=Date.now(); delete run.left; run.wk=run.wk||weekKey(); run.msg='야영지에서 쉬다가 탐사를 이어가요.'; mark('prog'); tab='challenge'; render(); toast(`탐사를 저장했어요. 도전 → ${T('abyss')}에서 이어서 할 수 있어요`); break; }
case 'rgleave': { const run=RG().run; if(!run){ tab='challenge'; render(); break; } if(!(await appConfirm('지금 나가면 이번 탐사가 끝나요(지금까지 간 만큼 보상은 받아요).\n저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요. 나갈까요?'))) break; const html=rgFinish(false); tab='challenge'; render(); openModal(`<div class="result" style="position:static">${html.replace('data-act="bdone"','data-act="close"')}</div>`); break; }
case 'rgquit': { if(!(await appConfirm('탐사를 끝낼까요? 지금까지의 진척에 따라 보상을 받아요.'))) break; const html=rgFinish(false); openModal(`<div class="result" style="position:static">${html.replace('data-act="bdone"','data-act="close"')}</div>`); render(); break; }
case 'opskip': e.stopPropagation(); opEnd(); break;
case 'stage': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(s0&&s0.story){ openStoryStage(ch0,s0); break; } if(s0&&(s0.mode==='debate'||s0.mode==='contest')){ openModeStage(ch0,s0); break; } if(s0&&SORTIE()&&SORTIE().st===s0.id){ sortieMap('진행 중인 출격을 이어 가요'); break; } squadSel=null; FORM=null; openStage(t.dataset.ch,t.dataset.st); break; }
case 'sortie': { p.squad=[...squadSel]; mark('prog'); const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); closeModal();
      if(!p.cleared[s.id]&&s.pre) playStory(s.title,s.pre,()=>startBattle(ch.id,s.id)); else startBattle(ch.id,s.id); break; }
case 'bauto': B.auto=!B.auto; t.classList.toggle('on',B.auto); break;
case 'bspeed': if(B?.ctx.kind==='practice'){B.speed=B.speed>=3?1:B.speed+1;t.textContent=B.speed+'x';t.classList.toggle('on',B.speed>1);bRun();break;}B.speed=B.speed>=3?1:B.speed+1; P().settings.bspeed=B.speed; mark('prog'); t.textContent=B.speed+'x'; t.classList.toggle('on',B.speed>1); bRun(); break;
case 'bdone': { if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ const rg=B.ctx.kind==='rogue'; B=null; closeOv(); tab=rg&&RG().run?'abyss':'challenge'; render(); break; }
      const win=t.dataset.win==='1',first=t.dataset.first==='1',s=B.s; B=null; closeOv(); render();
      if(win&&first&&s.post) playStory(s.title,s.post,()=>{render();checkTriggers();}); else checkTriggers(); break; }
case 'opsch': OPS_CH=t.dataset.ch; render(); $('#view').scrollTop=0; break;
case 'opsback': OPS_CH=null; render(); break;
case 'fsq': refreshForm(); break;
case 'fpick': { const i=squadSel.indexOf(id), added=i<0; const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2;
      if(i>=0) squadSel.splice(i,1); else if(squadSel.length<4) squadSel.push(id); else {toast('최대 4명까지 편성할 수 있어요');break;}
      const sh=$('#modal .sheet'), st=sh?sh.scrollTop:0; refreshForm(); const sh2=$('#modal .sheet'); if(sh2) sh2.scrollTop=st; ripple(x,y,false);
      if(added){ const c=charById(id), slot=document.querySelector(`.fslot[data-id="${id}"]`); if(slot){ charReact(slot.querySelector('.fs-art'),7,'head'); const pool=(c.dupLines.length?c.dupLines:[]).concat(c.lines); const l=rand(pool); if(l){ const b=document.createElement('div'); b.className='fsay'; b.textContent=sub(l); slot.appendChild(b); setTimeout(()=>b.remove(),2600); if(c.voiceId&&SND().voiceLobby) speak(c,l); } } }
      break; }
case 'fsl': refreshForm(); break;
case 'fauto': squadSel=autoSquad(FORM.stage); refreshForm(); break;
case 'ffil': FORM.filter=t.dataset.v; refreshForm(); break;
case 'fsave': { const i=+(prompt('몇 번에 저장할까요? (1~3)','1')||0)-1; if(!(i>=0&&i<3)) break; P().presets=P().presets||[]; P().presets[i]=[...squadSel]; mark('prog'); toast(`편성 ${i+1}에 저장했어요`); refreshForm(); break; }
case 'fpre': { const pr=(P().presets||[])[+t.dataset.i]; if(!pr||!pr.length){toast('저장된 편성이 없어요');break;} const busy=busyIds(); squadSel=pr.filter(x=>own(x)&&charById(x)&&!busy.has(x)).slice(0,4); refreshForm(); break; }
case 'farmgo': { const st=farmStage(t.dataset.k,+t.dataset.lv); squadSel=null; FORM=null; openFarmSquad(st); break; }
case 'farmstart': { P().squad=[...squadSel]; mark('prog'); closeModal(); startStage(farmStage(t.dataset.k,+t.dataset.lv),{kind:'farm'}); break; }
  }
}

