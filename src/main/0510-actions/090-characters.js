async function handleCharactersAction(a,t,id,p,e){
  switch(a){
case 'csframe': { const p2=P(); p2.csFull=!p2.csFull; mark('prog'); csFrameShow(t,p2.csFull); break; }
case 'cspoke': { const c=charById(id); if(!c) break; const o=own(c.id), lv=o?affLv(o):1, x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, r=t.getBoundingClientRect(), zone=(y-r.top)/r.height<0.3?'head':'body';
      const pool=spoilFree(c,o?(zone==='head'&&c.touch?.head?.length?c.touch.head:zone==='body'&&c.touch?.body?.length?c.touch.body:affLinePool(c)):c.lines), l=pickTouchLine(pool,csSayText());
      if(csPokeShow(t,c,l,!!o,lv,zone,x,y)&&c.voiceId&&SND().voiceLobby) speak(c,l);
      if(o){ addAff(c,1); mark('prog'); } break; }
case 'cstab': CS_TAB=t.dataset.k; csTabShow(); break;
case 'upgen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;} const done=busy(t,'그리는 중…');
      try{ const b=await naiDrawItem({k:'upper',o:c.upper,c,generationMode:'manual'}); await storeImage(c.upper,b,''); mark('c:'+c.id); toast('상반신을 그렸어요'); openChar(c.id); }catch(err){ toast(naiErr(err,'상반신 실패')); done(); } break; }
case 'gift': openGift(id); break;
case 'giftgive': { const c=charById(id), g=giftById(t.dataset.v), inv=progSlot('gifts'); if(!c||!g||!(inv[g[0]]>0)) break; if(affFull(own(c.id))){ toast(`${c.name}의 호감도가 이미 가득 찼어요. 선물은 아껴 두세요`); break; } inv[g[0]]--; const like=giftLikes(c).has(g[0]), val=g[3]*(like?2:1);
      p.giftSeen=p.giftSeen||{}; (p.giftSeen[c.id]=p.giftSeen[c.id]||{})[g[0]]=like?2:1; addAff(c,val); mark('prog'); sfx(like?'SSR':'확인');
      const line=like?rand((c.affLines&&Object.values(c.affLines).flat().length?Object.values(c.affLines).flat():c.lines)):rand(c.lines); if(line) linePop(c,line,like?'웃음':'');
      if(like) hearts(innerWidth/2,innerHeight/2,4); toast(`${g[1]} → ${c.name} 호감도 +${val}${like?' (정말 좋아해요!)':''}`); openGift(id); break; }
case 'ainai': { const r=await aiJSON(ainaiPrompt({fName:$('#f_name').value,fFac:$('#f_fac'),fElem:$('#f_elem').value,fPos:$('#f_pos').value,fProf:$('#f_prof').value}),t,'quick');
      if(r&&r.naiPrompt&&$('#f_nai')) $('#f_nai').value=allyTags(String(r.naiPrompt)); break; }
case 'ailines': { const r=await aiJSON(ailinesPrompt({fName:$('#f_name').value,fFac:$('#f_fac').value,fProf:$('#f_prof').value}),t);
      if(r&&$('#f_lines')){ $('#f_lines').value=strs(r.lines).join('\n'); $('#f_aff').value=Object.entries(r.affLines||{}).flatMap(([k,v])=>strs(v).map(x=>k+': '+x)).join('\n'); $('#f_lv').value=strs(r.lvLines).join('\n'); $('#f_dup').value=strs(r.dupLines).join('\n'); $('#f_head').value=strs(r.head).join('\n'); $('#f_body').value=strs(r.body).join('\n'); if(r.intro)$('#f_intro').value=String(r.intro); toast('대사를 채웠어요. 확인 후 저장하세요.'); } break; }
case 'ailinesmore': { const cur=k=>lines($('#'+k).value), L0=cur('f_lines'), H0=cur('f_head'), B0=cur('f_body');
      const r=await aiJSON(ailinesmorePrompt({L0,H0,B0,fName:$('#f_name').value,fFac:$('#f_fac').value,fProf:$('#f_prof').value}),t,'quick');
      if(r&&$('#f_lines')){ const add=(k,a,old)=>{ const nw=strs(a).filter(x=>!old.includes(x)); $('#'+k).value=[...old,...nw].join('\n'); return nw.length; }; const n=add('f_lines',r.lines,L0)+add('f_head',r.head,H0)+add('f_body',r.body,B0); toast(`대사 ${n}개를 더했어요. 확인 후 저장하세요.`); } break; }
case 'upsave': { const o=LV(), md=$('#up_mode').value; Object.assign(o,{repo:$('#up_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''),branch:$('#up_br').value.trim()||'main',path:$('#up_path').value.trim()||'www/index.html',token:$('#up_tok').value.trim(),auto:md!=='off',mode:md==='off'?'ask':md}); saveLV(o); closeModal(); if(o.auto) checkUpdate(true); else toast('업데이트 확인을 껐어요'); break; }
case 'upgo': {if(appStorage.failed||document.getElementById('save-warning'))break; const c=charById(id), k=t.dataset.k; if(!c) break; if(k==='enh') enhance(c); else if(k==='enhmax') enhance(c,true); else if(k==='lb') limitBreak(c); else if(k==='wup') weaponUp(c); else if(k==='transc') transcendUp(c); try{await flush();}catch(e){break;} openChar(id); render(); break; }
case 'wai': { const c=charById(id); if(!c) break; const ed=a==='wai';
      const nm=(ed&&$('#f_wn')&&$('#f_wn').value.trim())||String(c.weapon.name||''), ds=(ed&&$('#f_wd')&&$('#f_wd').value.trim())||String(c.weapon.desc||''), cur=(ed&&$('#f_wp')&&$('#f_wp').value.trim())||String(c.weapon.prompt||'');
      const p2=await weaponPromptAI([{c,name:nm,desc:ds,cur}],t); if(!p2[0]){ toast('쓰지 못했어요. AI 기록을 확인해 주세요'); break; }
      if(ed){ if($('#f_wp')) $('#f_wp').value=p2[0]; toast(T('weapon')+' 프롬프트를 썼어요. 저장을 눌러 주세요'); } else { c.weapon.prompt=p2[0]; mark('c:'+c.id); toast(T('weapon')+' 프롬프트를 썼어요'); } break; }
case 'wfixall': { const wb=G.chars.filter(c=>c.weapon&&wpBad(c.weapon.prompt)); if(!wb.length){ toast('정리할 '+T('weapon')+' 프롬프트가 없어요'); break; } const done=busy(t,'AI로 정리하는 중…');
      try{ const n=await fixWeaponPrompts(G.chars); toast(n>0?`${T('weapon')} 프롬프트 ${n}개를 ${T('weapon')}만 나오게 정리했어요`:'정리하지 못했어요. AI 기록을 확인해 주세요'); }finally{ done(); } openPrep(false); break; }
case 'regengo': { const c=charById(id); if(!c) break; const sel={}, reqs={}; document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>{ if(ch.checked) sel[ch.dataset.rgsel]=true; }); document.querySelectorAll('#modal [data-rgreqi]').forEach(i=>{ const v=i.value.trim(); if(v) reqs[i.dataset.rgreqi]=v; });
      if(!Object.keys(sel).length){ toast('바꿀 항목을 하나 이상 켜 주세요'); break; } await regenRun(c,sel,reqs,($('#rg_all')&&$('#rg_all').value.trim())||'',$('#rg_skill_slot')?.value||'active'); break; }
case 'regenapply': await regenApply(); break;
case 'regenretry': { const R=REGEN; if(!R) break; REGEN=null; const c=charById(R.cid); if(c) await regenRun(c,R.sel,R.reqs,R.global,R.slot); break; }
case 'regenedit': if(REGEN&&!REGEN.busy){try{regenReadPreview(REGEN);REGEN.edit=!REGEN.edit;regenPreview();}catch(e){toast(e.message);}} break;
case 'regencancel': { const cid=REGEN?.cid||REGEN_JOB?.cid||id;if(!regenCancel())break;closeModal();if(cid&&charById(cid))openChar(cid);break; }
case 'ailooksall': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId); if(!list.length){toast('적이 없어요');break;} if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
      if(!(await appConfirm(`적 ${list.length}종의 외형 프롬프트를 지금 세계관에 맞게 전부 다시 쓸까요? 지금 프롬프트는 덮어써요(그림은 그대로라 다시 그려야 바뀌어요).`))) break;
      const r=await aiJSON(ailooksallPrompt({list}),t);
      let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); mark('l:'+l.id); n++;}}); toast(`적 ${n}종의 외형을 세계관에 맞게 다시 썼어요. 다시 그리면 바뀌어요`); openLib('enemy'); break; }
case 'ailooks': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.prompt); if(!list.length){toast('외형이 빈 적이 없어요');break;}
      const r=await aiJSON(ailooksPrompt({list}),t);
      let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); mark('l:'+l.id); n++;}}); toast(`적 ${n}종의 외형을 채웠어요`); openLib('enemy'); break; }
  }
}

