/* =========================================================
   이벤트
   ========================================================= */
async function handleSetupAction(a,t,id,p,e){
  switch(a){
case 'titletap': if(!p.seenOpening&&!p.nameAsked){ p.nameAsked=true; mark('prog'); }
    if(!p.seenOpening) playOpening(); else {closeOv(); render(); checkTriggers(); setTimeout(()=>liveTick(false),1200); setTimeout(prepAsk,2600);} break;
case 'swnext': swRead(); if(SW.step===1) swAddAI(); SW.step=Math.min(5,SW.step+1); renderSetup(); break;
case 'swaddai': swRead(); if(!swAddAI()){toast('키와 모델 정보를 확인해 주세요');break;} APD={id:'',type:APD.type,pub:APD.pub||'google',name:'',region:'global',base:APD.base||'https://openrouter.ai/api/v1'}; SW.ok.ai=false; renderSetup(); toast('추가했어요. 하나 더 넣거나 다음으로 가세요'); break;
case 'swprev': swRead(); SW.step=Math.max(0,SW.step-1); renderSetup(); break;
case 'swlink': openUrl(t.dataset.url); break;
case 'swskipall': appStorage.setItem(SETUP_KEY,'1'); if(PJ().active!=='main'){ await flush(); const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } SW=null; showStart(); break;
case 'swgo1': swRead(); SW.step=1; renderSetup(); break;
case 'swsub': { const a=($('#sw_sub')||{}).value; if(!String(a||'').trim()){ toast('구독 주소를 붙여 넣어 주세요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} await subscribe(String(a).trim(),t); break; }
case 'swdone': swRead(); swSave(); if(PJ().active!=='main'){ appStorage.setItem(SETUP_KEY,'1'); await flush(); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } { const v=$('#ng_style')?$('#ng_style').value.trim():''; if(v){ G.meta.artTags=v; mark('meta'); } } appStorage.setItem(SETUP_KEY,'1'); SW=null; render(); showStart(); toast('설정을 저장했어요'); break;
case 'swstytest': { swRead(); swSave(); if(!imgReady()){ toast(imgNeed()); break; } const r0=$('#sw_sres'), done=busy(t); say(r0,'그리는 중… 20초쯤 걸려요');
      try{ const el=await naiDraw('char','1girl, solo, long hair, smile, jacket, hand on hip',{styleId:swStyleId()}); if(SW.stPrev) URL.revokeObjectURL(SW.stPrev); SW.stPrev=URL.createObjectURL(el); renderSetup(); }
      catch(err){ toast(naiErr(err,'시험 그리기 실패')); say(r0,''); done(); } break; }
case 'swtestai': { swRead(); const pr=swProfile(), r0=$('#sw_res'); if(!apValid(pr)){toast('키를 넣어 주세요');break;} const done=busy(t); say(r0,'확인 중…');
      try{ const r=await aiOne(Object.assign(pr,{id:'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); SW.ok.ai=!!(r&&r.ok); say(r0,SW.ok.ai?'✓ 연결됨':'응답은 왔지만 형식이 달라요'); }
      catch(err){ say(r0,'✗ '+aiErrText(err)); } finally{ done(); } break; }
case 'swtestnai': { swRead(); const r0=$('#sw_res'); if(!SW.nai){toast('토큰을 넣어 주세요');break;} const done=busy(t); say(r0,'확인 중…');
      try{ const r=await http(naiBase(naiCfg())+'/user/subscription',{headers:NAI_HDR(SW.nai),timeout:20000}); const j=okJSON(r); SW.ok.nai=true; say(r0,`✓ 연결됨 · ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'}`); }
      catch(err){ say(r0,'✗ '+naiErr(err,'연결 실패')); } finally{ done(); } break; }
case 'title': showTitle(); break;
case 'swpreset': { swRead(); const p=allPresets().find(x=>x.id===t.dataset.v); if(!p) break; SW.preset=p.id; presetToCfg(p.id); SW.cst=Object.assign(SW.cst||{},{tags:presetQualityParts(p).tags,neg:p.neg||''}); renderSetup(); toast(`「${p.name}」 그림체를 골랐어요`); break; }
case 'sweep': { if(!stamUse(stamCost('farm')*(+t.dataset.n||1))) break; const n=+t.dataset.n||1, r0=rateR(farmReward(t.dataset.k,+t.dataset.lv)), r={}; for(let i=0;i<n;i++){ giveReward(r0); bump('battle'); } Object.entries(r0).forEach(([k,v])=>r[k]=v*n); sfx('확인'); toast(`소탕 ${n>1?n+'회 ':''}완료: `+rewardText(r)); render(); break; }
case 'swdraft': swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); openDraft(); break;
case 'swpjdraft': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,(g.meta.title||'')+' 초안'); break; }
case 'titlesnd': { const s=SND(); s.bgmOn=!s.bgmOn; try{ appStorage.setItem(SKEY,JSON.stringify(s)); }catch(err){} if(s.bgmOn){ BGM.name=null; bgm(sceneOf().title); } else bgm(null); titleSndShow(s.bgmOn); toast(s.bgmOn?'배경음을 켰어요':'배경음을 껐어요'); break; }
  }
}

