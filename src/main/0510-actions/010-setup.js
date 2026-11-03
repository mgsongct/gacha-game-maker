/* =========================================================
   이벤트
   ========================================================= */
async function handleSetupAction(a,t,id,p,e){
  switch(a){
case 'gateyes': $('.gate')?.remove(); showTitle(); break;
case 'gateno': $('.gate').innerHTML='<div class="mark">19</div><p>만 19세 이상만 이용할 수 있어요.</p>'; break;
case 'titletap': if(!p.seenOpening&&!p.nameAsked){ p.nameAsked=true; mark('prog'); }
    if(!p.seenOpening) playOpening(); else {closeOv(); render(); checkTriggers(); setTimeout(()=>liveTick(false),1200); setTimeout(prepAsk,2600);} break;
case 'swnext': swRead(); if(SW.step===1) swAddAI(); SW.step=Math.min(5,SW.step+1); renderSetup(); break;
case 'swaddai': swRead(); if(!swAddAI()){toast('키와 모델 정보를 확인해 주세요');break;} APD={id:'',type:APD.type,pub:APD.pub||'google',name:'',region:'global',base:APD.base||'https://openrouter.ai/api/v1'}; SW.ok.ai=false; renderSetup(); toast('추가했어요. 하나 더 넣거나 다음으로 가세요'); break;
case 'swprev': swRead(); SW.step=Math.max(0,SW.step-1); renderSetup(); break;
case 'swlink': openUrl(t.dataset.url); break;
case 'swskipall': appStorage.setItem(SETUP_KEY,'1'); if(PJ().active!=='main'){ await flush(); const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } SW=null; showStart(); break;
case 'swgenre': { const k=$('#ng_kw'); if(k){ k.value=t.dataset.v+(k.value.trim()?'. '+k.value.trim():'. '); k.focus({preventScroll:true}); } break; }
case 'swgo1': swRead(); SW.step=1; renderSetup(); break;
case 'swpjgo': case 'swpjnew': { swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); const pj=PJ(), pid=id;
      if(a==='swpjnew'){ if(!(await appConfirm('이 게임의 진행(보유 '+T('crew')+'·재화·클리어 기록)을 지우고 처음부터 시작할까요? 만들어 둔 세계관·'+T('crew')+'·스토리·그림은 그대로예요.'))) break;
        await flush(); window.__NOFLUSH=1; let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(pid))||'null'); }catch(e){} if(!g){ window.__NOFLUSH=0; toast('게임을 읽지 못했어요'); break; }
        const o=g.prog||{}, keep={}; ['player','genderTxt','gender','look','bio','hideEyes','avatar','nameAsked','settings','scene','lobbyMode','csFull'].forEach(k=>{ if(o[k]!==undefined) keep[k]=o[k]; });
        g.prog=Object.assign(clone(DEFAULT_PROG),keep,{seenOpening:false,castDone:0,bootPrep:0}); appStorage.setItem(pjKey(pid),JSON.stringify(g)); }
      else await flush();
      try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} pj.active=pid; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; }
case 'swsub': { const a=($('#sw_sub')||{}).value; if(!String(a||'').trim()){ toast('구독 주소를 붙여 넣어 주세요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} await subscribe(String(a).trim(),t); break; }
case 'swdone': swRead(); swSave(); if(PJ().active!=='main'){ appStorage.setItem(SETUP_KEY,'1'); await flush(); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } { const hr=readHero(); if(hr){ const pp=P(); pp.player=hr.name; if(hr.call&&hr.call!==T('player')){ G.meta.terms.player=hr.call; mark('meta'); } pp.genderTxt=hr.gender; pp.gender=genderCode(hr.gender); pp.look=hr.look; pp.hideEyes=hr.hide; pp.nameAsked=true; mark('prog'); } } { const v=$('#ng_style')?$('#ng_style').value.trim():''; if(v){ G.meta.artTags=v; mark('meta'); } } appStorage.setItem(SETUP_KEY,'1'); SW=null; render(); showStart(); toast('설정을 저장했어요'); break;
case 'swstytest': { swRead(); swSave(); if(!imgReady()){ toast(imgNeed()); break; } const r0=$('#sw_sres'); t.disabled=true; if(r0) r0.textContent='그리는 중… 20초쯤 걸려요';
      try{ const b=await naiDraw('char','1girl, solo, long hair, smile, jacket, hand on hip',{styleId:swStyleId()}); if(SW.stPrev) URL.revokeObjectURL(SW.stPrev); SW.stPrev=URL.createObjectURL(b); renderSetup(); }
      catch(err){ toast(naiErr(err,'시험 그리기 실패')); if(r0) r0.textContent=''; t.disabled=false; } break; }
case 'swtestai': { swRead(); const pr=swProfile(), r0=$('#sw_res'); if(!apValid(pr)){toast('키를 넣어 주세요');break;} t.disabled=true; if(r0) r0.textContent='확인 중…';
      try{ const r=await aiOne(Object.assign(pr,{id:'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); SW.ok.ai=!!(r&&r.ok); if(r0) r0.textContent=SW.ok.ai?'✓ 연결됨':'응답은 왔지만 형식이 달라요'; }
      catch(err){ if(r0) r0.textContent='✗ '+aiErrText(err); } finally{ t.disabled=false; } break; }
case 'swtestnai': { swRead(); const r0=$('#sw_res'); if(!SW.nai){toast('토큰을 넣어 주세요');break;} t.disabled=true; if(r0) r0.textContent='확인 중…';
      try{ const r=await http(naiBase(naiCfg())+'/user/subscription',{headers:NAI_HDR(SW.nai),timeout:20000}); const j=okJSON(r); SW.ok.nai=true; if(r0) r0.textContent=`✓ 연결됨 · ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'}`; }
      catch(err){ if(r0) r0.textContent='✗ '+naiErr(err,'연결 실패'); } finally{ t.disabled=false; } break; }
case 'title': showTitle(); break;
case 'swpreset': { swRead(); const p=allPresets().find(x=>x.id===t.dataset.v); if(!p) break; SW.preset=p.id; presetToCfg(p.id); SW.cst=Object.assign(SW.cst||{},{tags:presetQualityParts(p).tags,neg:p.neg||''}); renderSetup(); toast(`「${p.name}」 그림체를 골랐어요`); break; }
case 'sweep': { if(!stamUse(stamCost('farm')*(+t.dataset.n||1))) break; const n=+t.dataset.n||1, r0=rateR(farmReward(t.dataset.k,+t.dataset.lv)), r={}; for(let i=0;i<n;i++){ giveReward(r0); bump('battle'); } Object.entries(r0).forEach(([k,v])=>r[k]=v*n); sfx('확인'); toast(`소탕 ${n>1?n+'회 ':''}완료: `+rewardText(r)); render(); break; }
case 'swdraft': swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); openDraft(); break;
case 'swpjdraft': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,(g.meta.title||'')+' 초안'); break; }
case 'titlesnd': { const s=SND(); s.bgmOn=!s.bgmOn; try{ appStorage.setItem(SKEY,JSON.stringify(s)); }catch(err){} if(s.bgmOn){ BGM.name=null; bgm(sceneOf().title); } else bgm(null); const b=$('#tsnd'); if(b){ b.textContent=s.bgmOn?'🔊':'🔇'; b.setAttribute('aria-label',s.bgmOn?'배경음 끄기':'배경음 켜기'); } toast(s.bgmOn?'배경음을 켰어요':'배경음을 껐어요'); break; }
  }
}

