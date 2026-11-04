async function handleStorageAndSharingAction(a,t,id,p,e){
  switch(a){
case 'syopen': openSync(); break;
case 'sylink': openUrl(t.dataset.url); break;
case 'sypush': closeModal(); syPush(false); break;
case 'sypushf': closeModal(); syPush(true); break;
case 'sypull': { const o=SY(); if(o.last&&(G.prog.savedAt||0)>(o.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 올리지 않은 진행이 있어요. 받으면 이 기기의 진행은 덮어써져요. 받을까요?'))) break; closeModal(); syPull(); break; }
case 'sysave': { const repo=$('#sy_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/+$/,''), token=$('#sy_tok').value.trim();
      if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token){ toast('저장소(아이디/이름)와 토큰을 넣어 주세요'); break; }
      const o=Object.assign(SY(),{repo,token,device:$('#sy_dev').value.trim()||syDevice(),auto:$('#sy_auto').checked,autoUp:$('#sy_up').checked,keys:$('#sy_keys').checked,lock:$('#sy_lock').checked}); saveSY(o);
      const done=busy(t,'확인 중…');
      try{ const info=await gh(o,''); if(!info.private){ toast('이 저장소는 공개예요. 비공개(Private)로 바꾼 뒤 다시 저장해 주세요'); o.token=''; saveSY(o); done(); break; }
        if(info.permissions&&info.permissions.push===false){ toast('이 토큰은 저장소에 쓸 권한이 없어요 (Contents: Read and write)'); done(); break; }
        const R=await syRemote(o); closeModal(); render(); if(LKMODE()==='gh') setTimeout(()=>{ lkOp('claim').then(()=>{ LK.claimed=true; lkLoop(); }).catch(()=>{}); },500);
        openSyLinked(R.state&&R.state.device!==o.device?R.state:null);
      }catch(err){ toast('연결 실패. '+syErr(err)); done(); } break; }
case 'bkgo': { const o={share:t.dataset.share==='1',img:t.dataset.img==='1',audio:t.dataset.aud==='1',gate:t.dataset.gate!=='0',dest:$('#bk_dest').value,voice:$('#bk_voice')?$('#bk_voice').checked:false}; closeModal(); exportGo(o); break; }
case 'pickgame': { if($('#pk_last')&&$('#pk_last').checked) try{ appStorage.setItem('ggm-start','last'); }catch(e){} try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(id===pj.active){ showStart(); break; } await switchProject(id); break; }
case 'pcopen': openPcSet(); break;
case 'syoff': { if(!(await appConfirm('PC·폰 연동을 해제할까요?\n이 기기의 게임은 그대로 남고, GitHub 저장소의 데이터도 지워지지 않아요. 이 기기에 저장된 토큰만 지워요.'))) break; try{ if(LKMODE()==='gh'&&LK.claimed) await lkSave(true), await lkOp('free'); }catch(e){ quietErr(e,'0510-actions/060-storage-and-sharing.js:21'); } clearInterval(LK.t); LK.claimed=false; lkUnlock(); try{ appStorage.removeItem(SYKEY); }catch(e){} closeModal(); render(); toast('연동을 해제했어요'); break; }
case 'pcsave': { if($('#pc_pxoff')){ try{ appStorage.setItem('ggm-proxy-off',$('#pc_pxoff').checked?'1':'0'); }catch(e){} } const o=parsePcLink($('#pc_link').value); if(!o){ toast('주소에 ?pc=키가 들어 있어야 해요'); break; } o.auto=$('#pc_auto').checked; o.lock=$('#pc_lock').checked; const done=busy(t);
      try{ const r=await http(o.base+'/api/hello',{headers:{'X-GGM-Key':o.key},timeout:15000}); const j=JSON.parse(r.text||'{}'); if(!j.app) throw 0; if(!j.auth){ toast('키가 맞지 않아요. QR 주소를 다시 붙여 넣어 주세요'); done(); break; }
        const old=PCS(); setPCS(Object.assign({},old&&old.key===o.key?old:{},o)); closeModal(); render(); toast(`PC 서버(${j.host||'PC'})에 연결했어요`); window.__PC_NEW=1; pcStart(); if(LKMODE()==='pc') setTimeout(lkActivate,1500); }
      catch(err){ toast('PC 서버에 연결하지 못했어요. PC에서 서버 창이 켜져 있는지 확인해 주세요'); done(); } break; }
case 'pcoff': { if(!(await appConfirm('PC 서버 연결을 해제할까요?\n이 기기의 게임은 그대로 남고, PC에 저장된 데이터도 지워지지 않아요.'))) break; try{ if(LKMODE()==='pc'&&LK.claimed) await lkSave(true), await lkOp('free'); }catch(e){ quietErr(e,'0510-actions/060-storage-and-sharing.js:26'); } clearInterval(LK.t); LK.claimed=false; lkUnlock(); setPCS(null); closeModal(); render(); toast('PC 서버 연결을 해제했어요'); break; }
case 'pcpush': closeModal(); pcPush(false); break;
case 'pcpushf': closeModal(); pcPush(false,true); break;
case 'pcpullgo': closeModal(); pcPull(); break;
case 'pchist': openPcHist(); break;
case 'pchistgo': { if(!(await appConfirm('이 백업으로 되돌릴까요?\n이 기기의 게임이 그 시점으로 바뀌고, PC에도 다시 저장돼요. (지금 PC에 있는 저장도 백업 목록에 남아요)'))) break; const done=busy(t);
    try{ const h=await pcApi('/api/store/history/'+encodeURIComponent(id)), cur=await pcApi('/api/store/state',{ok404:true}); if(!h||!h.ls) throw {message:'백업을 읽지 못했어요'}; closeModal(); await pcPull({state:h,restore:true,cur:cur&&cur.at}); }catch(e){ toast('백업을 받지 못했어요. '+syErr(e)); done(); } break; }
case 'pcpull': { const pc=PCS(); if(pc&&pc.last&&(G.prog.savedAt||0)>(pc.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 PC에 저장하지 않은 진행이 있어요. 받으면 덮어써져요. 받을까요?'))) break; closeModal(); pcPull(); break; }
case 'resetth': delete p.inbox[t.dataset.th]; mark('prog'); checkTriggers(); toast('조건을 만족하면 다시 도착해요'); break;
case 'importfile': $('#bkfile').click(); break;
case 'pj-open': openProjects(); break;
case 'pjswitch': await switchProject(id); break;
case 'pjdel': { if(!(await appConfirm('이 게임을 삭제할까요? 되돌릴 수 없어요.'))) break; const pj=PJ(); if(id===pj.active){toast('현재 플레이 중인 게임은 삭제할 수 없어요');break;} await flush();await appStorage.assertCurrent(PJKEY);pj.list=pj.list.filter(x=>x.id!==id); appStorage.setItem(PJKEY,JSON.stringify(pj)); appStorage.removeItem(pjKey(id));await appStorage.drain(); openProjects(); break; }
case 'pjblank': { await flush(); const id2='g'+uid(), d=defaults(); d.meta.title=G.meta.title+' (사본)'; appStorage.setItem(pjKey(id2),JSON.stringify(d)); const pj=PJ(); pj.list.push({id:id2,title:d.meta.title}); pj.active=id2; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; }
case 'pubopen': openPub(); break;
case 'pubgo': { const P0=PUB(); P0.repo=$('#pb_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''); P0.branch=$('#pb_branch').value.trim()||'main'; P0.token=$('#pb_tok').value.trim(); savePUB(P0); await pubUpload($('#pb_notes').value.trim(),t); break; }
case 'pubcopy': case 'pubcopy2': { const v=t.dataset.v||($('#pub_addr')&&$('#pub_addr').value)||''; try{ await navigator.clipboard.writeText(v); toast('주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
case 'subadd': openSubAdd(); break;
case 'subgo': await subscribe($('#sb_addr').value,t); break;
case 'subcheck': await subCheck(true); break;
case 'subapply': await subApply(t); break;
case 'subskip': { if(G.meta.subscr){ G.meta.subscr.skip=+t.dataset.v||0; mark('meta'); } closeModal(); toast('설정 → 게임 → 업데이트 확인에서 언제든 받을 수 있어요'); break; }
case 'subcopy': { const b=G.meta.subscr&&G.meta.subscr.base, m=b&&b.match(/raw\.githubusercontent\.com\/([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)\/$/), v=m?subAddr(m[1],m[2],m[3]):b; try{ await navigator.clipboard.writeText(v); toast('구독 주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
case 'subleave': { if(!(await appConfirm('구독을 끊을까요? 지금 게임은 그대로 남고, 앞으로 업데이트를 받지 않아요. 이 게임을 내 게임처럼 직접 고치고 만들 수 있어요.'))) break; delete G.meta.subscr; mark('meta'); const pj=PJ(), row=pj.list.find(x=>x.id===pj.active); if(row){ delete row.sub; appStorage.setItem(PJKEY,JSON.stringify(pj)); } render(); toast('구독을 끊었어요'); break; }
case 'pjreroll': { const g=id===PJ().active?G:(()=>{ try{ return JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){ return null; } })(); if(!g){ toast('게임을 읽지 못했어요'); break; }
      const title=(g.meta&&g.meta.title)||'게임', d=rerollDraft(g,title);
      d.mode='detail'; d.reuse={pj:id,title}; try{ if(typeof SW!=='undefined'&&SW&&$('#sw_card,.setup')){ swRead(); swSave(); } }catch(e){} appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,title+' 리롤');
      toast(`「${title}」의 캐릭터·NPC·배경 그림을 이름이 같은 인물에 그대로 써요. 세계관·인물 설정을 고친 뒤 만들기를 누르세요`); break; }
case 'pjdraftx': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } openDraftExport((g.meta.title||'게임')+' 초안',d,null); break; }
case 'backup': openBackup(); break;
case 'importbk': try{const g=JSON.parse($('#bk_in').value);if(!g||!Array.isArray(g.chars))throw 0;replaceAll(g);closeModal();toast('데이터를 가져왔어요');}catch(err){toast('올바른 백업 데이터가 아니에요');} break;
  }
}
// 리롤 초안: 게임의 초안(없으면 지금 세계관으로 새로)에 실제 캐릭터·NPC 이름을 넣어요(그림이 같은 이름에 짝지어지게). 초안에 적어 둔 외모·말투는 이어받아요
function rerollDraft(g,title){ const w=g.world||{}, pr=g.prog||{};
  const d=g.meta&&g.meta.draft?clone(g.meta.draft):{mode:'detail',gtitle:title,kw:String(w.name||title),tone:(g.meta&&g.meta.tone)||'',world:[w.summary,w.lore].filter(Boolean).join('\n\n'),setting:(w.factions||[]).map(f=>f.name+': '+(f.desc||'')).join('\n'),story:'',stages:4,len:'normal',
    hero:{name:pr.player||'',call:(g.meta&&g.meta.terms&&g.meta.terms.player)||'',gender:pr.genderTxt||'',look:pr.look||'',bio:pr.bio||'',hide:!!pr.hideEyes},chars:[]};
  const old=Array.isArray(d.chars)?d.chars:[], pick=n=>old.find(x=>x&&nameEq(x.name,n))||{};
  d.chars=[...(g.chars||[]).filter(c=>!c.alt).map(c=>{ const o=pick(c.name); return {name:c.name,kind:'crew',rank:c.rarity,role:o.role||((c.faction||'')+(c.faction?' · ':'')+(ROLE[c.role]||'')),profile:c.profile||o.profile||'',speech:o.speech||(c.lines||[]).slice(0,2).join(' / '),look:o.look||'',tags:c.naiPrompt||o.tags||''}; }),
    ...(g.npcs||[]).map(n=>{ const o=pick(n.name); return {name:n.name,kind:'npc',role:n.role||o.role||'',profile:n.profile||o.profile||'',speech:n.speech||o.speech||'',look:n.look||o.look||'',tags:n.naiPrompt||o.tags||''}; })];
  return d; }
