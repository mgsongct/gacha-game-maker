/* ===== liveops — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class LiveOps {
    /* src/main/0020-ai-connect.js */
static naiBlocksSeparatePrompt({text}){ return '기존 NovelAI 영어 태그를 세 칸으로 분류하세요. 태그를 추가·삭제·번역·변형하지 마세요. 가중치 묶음도 그대로 보존하세요. appearance: 인원·머리·눈·체형·피부·종족. outfit: 옷·신발·착용 장식. other: 표정·자세·배경·효과·소품·무기 등 나머지. 원문: '+text+'\nJSON만 출력: {"appearance":"","outfit":"","other":""}'; }

    /* src/main/0135-schedule.js */
static spotsAIPrompt(){ return `${RULES}\n${World.ctx()}\n\n이 세계관에서 ${System.T('crew')}와 플레이어가 함께 시간을 보낼 장소 5~7곳을 정하라(전투 장소가 아닌 일상·휴식·취미 장소 위주, 세계관에 맞게). 기존 배경 이름: ${G.lib.filter(l=>l.kind==='bg').map(l=>l.name).join(', ')||'없음'} (맞는 게 있으면 bg에 그 이름, 없으면 빈칸). tags는 그 장소와 어울리는 취미·좋아하는 것 키워드 2~4개(한국어).\nJSON만 출력: {"spots":[{"name":"","desc":"한 문장","bg":"","tags":[""]}]}`; }

  static spotTalkAIPrompt({c,S}){ return `${Core.pf('SPOT_TALK',{RULES,ctx:World.ctx(false,c.name),SCRIPT_FMT,crew:System.T('crew'),name:c.name,name2:S.map(s=>`${s.name}(${s.desc||''}${s.bg?' · 배경 '+s.bg:''})`).join(' / ')})}\nJSON만 출력: {"scenes":[{"spot":"장소 이름","script":""}]}`; }

    /* src/main/0200-skin-shop.js */
static skinAutoPrompt({c,skinBase,evs}){ return `${RULES}\n세계관: ${G.world.summary}\n캐릭터: ${c.name} / ${String(c.profile||'').slice(0,300)}\n변하지 않는 외형(재작성하지 말 것): ${skinBase.appearance}\n기본 의상(새 의상에 복사하지 말 것): ${skinBase.outfit}\n이미 있는 ${System.T('skin')}: ${(c.skins||[]).map(k=>k.name).join(', ')||'없음'}\n새 의상을 기획하세요. 현재 ${new Date().getMonth()+1}월${evs?', 이벤트: '+evs:''}. 세계관·성격·계절에 어울리게. outfit에는 새 옷·신발·착용 장식만, other에는 표정·자세·소품만 영어 태그로 쓰세요. 머리·눈·피부·체형·종족은 변경하지 마세요.\nJSON만 출력: {"name":"의상 이름","desc":"소개 한 줄","line":"대사 한 줄","outfit":"영어 의상 태그","other":"영어 표정·자세·소품 태그"}`; }

    /* src/main/0280-live-ops.js */
static dailyTalksPrompt({picks,wd,evs}){ return `${Core.pf('DAILY_TALKS',{RULES,ctx:World.ctx(),storyMemo:Story.storyMemo(),relCtx:Core.relCtx(picks.map(c=>c.name).join(' '),picks.map(c=>c.id),30),THREAD_FMT,talk:System.T('talk'),threads:G.threads.filter(t=>picks.some(c=>c.id===t.charId)).slice(-4).map(t=>t.title).join(', ')||'없음',dayKey:LiveOps.dayKey(),wd,player:System.T('player'),name:picks.map(c=>`${c.name}(호감도 Lv.${Core.affLv(Characters.own(c.id))}, 말투: ${c.lines.slice(0,2).join(' / ')})`).join('; '),evs:evs||'없음'})}\nJSON만 출력: {"threads":[{"char":"이름","title":"미리보기 제목","script":"대화"}]}`; }

    /* src/main/0535-content-audit.js */
static auditAIFillPrompt({c,cur,instruction,fields,schema}){ return `${RULES}\n${World.ctx()}\n\n${System.T('crew')} 「${c.name}」(${ROLE[c.role]||''}, ${c.faction||'무소속'}). 프로필: ${String(c.profile||'').slice(0,400)}\n지금 값:\n${cur}\n\n${instruction?Core.pf('AUDIT_CONVERT',{instruction}):Core.pf('AUDIT_FILL')}${fields.includes('naiPrompt')?' '+NAI_CHAR:''}\nJSON만 출력: ${schema}`; }

    /* src/main/0465-story-plan.js */
  // 장 n(1부터)을 쓸 때 넘기는 설계 정보. 아직 밝히지 않을 반전은 "작가 전용"으로만 알려 줘요
static planCtx(n){ if(!Story.planHas()) return ''; const p=Story.PLAN(), act=Core.planActOf(n), F=P().flags||{}, L=[];
    L.push(`\n【시나리오 설계 — 작가 전용, 대사로 그대로 말하지 않는다】${p.logline?' 로그라인: '+p.logline+'.':''}${p.theme?' 주제: '+p.theme+'.':''}${p.ending?' 목표 결말: '+p.ending+'.':''}`);
    if(act) L.push(`지금은 「${act.name}」(~${act.upto}장): ${act.goal}`);
    const now=p.twists.filter(t=>+t.reveal===n), later=p.twists.filter(t=>+t.reveal>n), clues=p.twists.flatMap(t=>(t.clues||[]).filter(c=>+c.ch===n).map(c=>({t,c})));
    if(clues.length) L.push(Core.pf('PLAN_CLUES',{list:clues.map(({c})=>c.hint).join(' / ')}));
    if(now.length) L.push(Core.pf('PLAN_REVEAL',{list:now.map(t=>`${t.truth}${t.who?' (관련: '+t.who+')':''}`).join(' / ')}));
    if(later.length) L.push('아직 밝히지 말 진실(이번 장에서는 숨기고 어긋나지 않게만): '+later.map(t=>t.truth).join(' / '));
    const done=p.branches.filter(b=>F[b.id]&&+b.at<n); if(done.length) L.push('플레이어가 고른 분기(이후 이야기에 반영): '+done.map(b=>{ const o=(b.options||[])[F[b.id].n-1]||{}; return `${b.question} → 「${o.label||F[b.id].label}」${o.result?': '+o.result:''}`; }).join(' / '));
    const here=p.branches.filter(b=>+b.at===n); if(here.length) L.push(Core.pf('PLAN_BRANCH_HERE')+here.map(b=>`id=${b.id} 질문 「${b.question}」 보기 ${(b.options||[]).map(o=>o.label).join(' | ')}`).join(' / '));
    const arcs=p.arcs.filter(a=>a.name); if(arcs.length) L.push('캐릭터 아크(이번 장에서 조금씩 진행): '+arcs.map(a=>`${a.name}: ${a.start} → ${a.change} → ${a.end}`).join(' / '));
    if(p.notes) L.push('설계 메모: '+p.notes);
    return L.join('\n')+'\n'; }

  static naiBlocksJoin(p){return NAI_BLOCK_KEYS.map(k=>String(p?.[k]||'').trim()).filter(Boolean).join(', ');}

  static naiBlocksStore(o,key,parts){
   const p=Core.naiBlocksUpgrade(parts);for(const k of NAI_BLOCK_KEYS)p[k]=p[k].trim();
   const previous=o.naiBlocks?.[key],original=previous?.original??String(o[key]||LiveOps.naiBlocksJoin(p));
   o[key]=LiveOps.naiBlocksJoin(p);o.naiBlocks={...o.naiBlocks,[key]:{...p,combined:o[key],original}};return o[key];
  }

  static naiBlocksValidateSplit(text,r){
   const normalize=s=>Core.tagList(s).map(t=>t.trim()).sort().join('\n');
   if(!r||['appearance','outfit','other'].some(k=>typeof r[k]!=='string')||(r.style!=null&&typeof r.style!=='string')||normalize(text)!==normalize(LiveOps.naiBlocksJoin(r)))throw Error('AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요.');
   return Core.naiBlocksUpgrade(r);
  }

  static async naiBlocksSeparate(text,rep){
   const r=await Core.aiJSON(LiveOps.naiBlocksSeparatePrompt({text}),rep||null,'quick');
   return LiveOps.naiBlocksValidateSplit(text,r);
  }

  static regenSlot(slot){return Object.prototype.hasOwnProperty.call(GGMCombat.SLOTS,slot)?slot:'active';}

  static regenSkillLabel(c,slot){const s=v2Kit(c)[LiveOps.regenSlot(slot)];return s.name+' — '+v2SkillText(s,LiveOps.regenSlot(slot));}

  static regenFields(slot='active'){slot=LiveOps.regenSlot(slot);return [
   ['name','이름·소속',c=>c.name+' / '+(c.faction||'무소속')],['profile','프로필·비밀',c=>String(c.profile||'')],['look','외모 태그 (디자인)',c=>String(c.naiPrompt||'')],
   ['skill',GGMCombat.SLOTS[slot]+' 스킬',c=>LiveOps.regenSkillLabel(c,slot)],['weapon',System.T('weapon'),c=>c.weapon?c.weapon.name+(c.weapon.desc?' — '+c.weapon.desc:''):''],['lines','대사·반응',c=>(c.lines||[]).slice(0,3).join(' / ')]];}

  static skinPeriodKey(){ const L=P().live, se=L.on.season&&L.season; return se&&se.start?'season:'+se.start:LiveOps.cycKey('rotate'); }

  static async skinAuto(notes,period){
    const game=G,project=Core.PJ().active;
    const L=P().live, rec=L.skinRecent||(L.skinRecent=[]), pu=G.banners.filter(bn=>bn.active!==false&&bn.type==='pickup').flatMap(b=>b.pickup||[]);
    const shopN=c=>(c.skins||[]).filter(k=>k.shop).length, base=G.chars.filter(c=>c.naiPrompt&&!c.alt); if(!base.length) return null;
    // 상점 의상이 가장 적은 캐릭터 중에서(같으면 픽업·보유 우선), 최근에 나온 캐릭터는 다른 후보가 있으면 빼요
    const minN=Math.min(...base.map(shopN)); let cand=base.filter(c=>shopN(c)===minN&&!rec.includes(c.id)); if(!cand.length) cand=base.filter(c=>!rec.includes(c.id)); if(!cand.length){ L.skinRecent=[]; cand=base; }
    const pri=cand.filter(c=>pu.includes(c.id)), mine=cand.filter(c=>Characters.own(c.id)); cand=pri.length?pri:mine.length?mine:cand;
    const c=rand(cand), evs=G.events.filter(ev=>ev.active!==false&&Acquire.gateOpen(ev)).map(e=>e.title).join(', ');
    const originalPrompt=c.naiPrompt,skinBase=await Core.naiSkinBase(c);
    if(G!==game||Core.PJ().active!==project||charById(c.id)!==c||c.naiPrompt!==originalPrompt)throw Error('캐릭터나 게임이 바뀌어 스킨 생성을 중단했어요');
    const r=await Core.aiJSON(LiveOps.skinAutoPrompt({c,skinBase,evs}),null,'quick');
    if(G!==game||Core.PJ().active!==project||charById(c.id)!==c||c.naiPrompt!==originalPrompt)throw Error('캐릭터나 게임이 바뀌어 스킨 생성을 중단했어요');
    if(!r)return null;
    const parts=Core.naiSkinParts(skinBase,r),k={id:'k'+uid(),name:String(r.name||'새 '+System.T('skin')).slice(0,16),desc:String(r.desc||'').slice(0,80),line:String(r.line||'').slice(0,80),prompt:'',img:null,shop:true,price:SKIN_PRICE,at:Date.now(),period:period||''};
    LiveOps.naiBlocksStore(k,'prompt',parts);
    c.skins=c.skins||[]; c.skins.push(k); rec.unshift(c.id); L.skinRecent=rec.slice(0,Math.max(1,Math.min(6,G.chars.filter(x=>x.naiPrompt&&!x.alt).length-1))); Core.mark('c:'+c.id,'prog');
    if(Core.imgReady()){ try{ LiveOpsView.liveBar(`${c.name} 「${k.name}」 그리는 중…`); const target=Economy.skinPrimaryPart(c,k),x=target===k?'stand':'upper',b=await CoreCtl.skinPartDraw(c,k,x);if(G!==game||Core.PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await Art.storeImage(target,b,''); Core.mark('c:'+c.id); }catch(e){CoreView.toast(Core.naiErr(e,'스킨 이미지 생성 실패'));} }
    if(notes) notes.push(`${System.T('skin')} 신상품: ${c.name} 「${k.name}」 (캐시 상점 패키지)`);
    return {c,k};
  }

  static spots(){ return Array.isArray(G.meta.spots)?G.meta.spots:[]; }

  static spotsAuto(){ const L=[]; G.lib.filter(l=>l.kind==='bg'&&l.name).slice(0,7).forEach(l=>L.push({id:uid(),name:l.name,desc:'',bg:l.name,tags:[]}));
    if(!L.length) ['광장','카페','훈련장','도서관'].forEach(n=>L.push({id:uid(),name:n,desc:'',bg:'',tags:[n]})); G.meta.spots=L; Core.mark('meta'); return L.length; }

  static spotFav(c,s){ const p=c.persona||{}, likes=[...(p.likes||[]),p.hobby||''].join(' '); return !!likes&&[s.name,...(s.tags||[])].some(t=>t&&(likes.includes(t)||t.split(/\s+/).some(w=>w.length>1&&likes.includes(w)))); }

  static spotWho(s){ const owned=G.chars.filter(c=>Characters.own(c.id)&&!c.alt&&!c.monster), h=Core.hashN(today()+s.id); if(!owned.length) return [];
    const fav=owned.filter(c=>LiveOps.spotFav(c,s)), rest=owned.filter(c=>!fav.includes(c)), out=[]; if(fav.length) out.push(fav[h%fav.length]);
    const pool=[...rest,...fav.filter(c=>!out.includes(c))]; for(let i=0;out.length<2&&pool.length;i++) out.push(pool.splice((h>>(i+2))%pool.length,1)[0]); return out; }

  static spotTemplate(c,s){ const p=c.persona||{}, L=(c.lines||[]).filter(Boolean), r=i=>L.length?L[(Core.hashN(s.id+c.id)+i)%L.length]:'…', n=c.name;
    return [`[배경: ${s.bg||s.name}]`,`${s.name}에서 ${n}을(를) 만났다.`,`${n}: ${p.catch||r(0)}`,'선택: 같이 둘러볼래? | 여기서 뭐 하고 있었어?',
      `1) ${n}: ${(p.likes||[])[0]?`좋아. ${p.likes[0]} 얘기라도 하면서 걸을까.`:r(1)}`,`2) ${n}: ${p.hobby?`${p.hobby}… 그런 거. 비밀이야.`:r(2)}`,`${n}: ${r(3)}`].join('\n'); }

  static async spotsAI(rep){ const r=await Core.aiJSON(LiveOps.spotsAIPrompt(),rep,'complex');
    const L=(r&&Array.isArray(r.spots)?r.spots:[]).slice(0,8).map(x=>({id:uid(),name:String(x.name||'').trim().slice(0,20),desc:String(x.desc||'').slice(0,120),bg:String(x.bg||'').trim(),tags:(Array.isArray(x.tags)?x.tags:[]).map(String).slice(0,4)})).filter(x=>x.name);
    if(!L.length) return false; const old=LiveOps.spots(); L.forEach(s=>{ const o=old.find(x=>x.name===s.name); if(o) s.id=o.id; }); G.meta.spots=L; Core.mark('meta'); return true; }

  static async spotTalkAI(c,rep){ const S=LiveOps.spots(); if(!S.length) return false;
    const r=await Core.aiJSON(LiveOps.spotTalkAIPrompt({c,S}),rep,'complex');
    let n=0; (r&&Array.isArray(r.scenes)?r.scenes:[]).forEach(x=>{ const s=S.find(y=>y.name===String(x.spot||'').trim()), t=nl(x.script); if(s&&t){ c.spotTalk=c.spotTalk||{}; c.spotTalk[s.id]=t; n++; } }); if(n) Core.mark('c:'+c.id); return n>0; }

  static dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

  static cycDays(k){ const c=(P().live&&P().live.cyc)||{}, v=+c[k]; return LIVE_CYC[k][1].some(x=>x[0]===v)?v:LIVE_CYC[k][0]; }

  static cycLabel(k){ return (LIVE_CYC[k][1].find(x=>x[0]===LiveOps.cycDays(k))||[0,''])[1]; }

  static cycKey(k){ const d=LiveOps.cycDays(k); if(d===1) return LiveOps.dayKey(); const day=Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5); return k+':'+d+':'+Math.floor(day/d); }

  static seasonDays(){ return LiveOps.cycDays('season'); }

  static seasonKey(){ return String(Math.floor(Date.now()/(LiveOps.seasonDays()*864e5))); }

  static seasonNow(){ const L=P().live, s=L.season; return L.on.season&&s&&Date.now()<(s.until||0)?s:null; }

  static seasonMeta(t){ return SEASONS.find(x=>x[0]===t)||SEASONS[0]; }

  static seasonNext(){ const L=P().live, en=SEASONS.filter(x=>L.seasons[x[0]]!==false).map(x=>x[0]); if(!en.length) return null; const cur=L.season&&L.season.type, i=en.indexOf(cur); return en[(i+1)%en.length]; }

    /* 공지를 봄(Model — 화면에 들어가기 전) */
static noticeSeen(){ P().live.seen=Date.now(); Core.mark('prog'); }

    /* 규칙(AUDIT_RULES)마다 "감지 → 고치기"를 정의해요. 종류: missing(빠짐·잘못됨) · upgrade(구버전 생성물, 새 기능으로 바꿀 수 있음)
     고치는 방법: auto(규칙 변환, AI 없이) · ai(빠진 항목만 AI로 채움) · image(그림 생성) · open(기존 편집 화면 열기)
     생성 버전: 새로 만드는 캐릭터에 genVer가 찍혀요(cleanChar0). genVer가 없거나 낮으면 구버전 생성물이에요.
     지정 변환: 고른 캐릭터·항목을 지시문대로 AI가 바꿔요. 마지막 일괄 작업은 되돌릴 수 있어요. 문서: docs/research/content-audit.md */
static auditGenVer(){ return 8; } // 8: 세력 깊이·몬스터 도감·첫 등장 // 7: 사거리(근접·원거리·지원)·출격 경로 // 6: 연출(감정 아이콘·동작·화면 효과) // 5: 전장 규칙·별 조건·일정 장면 // 4: 개성 시트·인연 톡·메모리얼 // 생성 규칙이 바뀌면 올려요(2: 상징 컬러·아이템, 3: 바리에이션·상속 시대)

  static auditVer(){ return Math.max(...AUDIT_RULES.map(r=>r.since)); } // 점검 판: 9 = 프로필 항목·포지션 보완, 10 = 세력 장별 태도 보완(생성 규칙은 그대로라 auditGenVer는 8)

  static auditTargets(scope){ if(scope==='char') return G.chars; if(scope==='lib') return G.lib; if(scope==='game') return [G.meta]; if(scope==='stage') return G.chapters.filter(ch=>ch.kind==='main'||ch.kind==='event').flatMap(ch=>ch.stages||[]); return []; }

  static auditName(r,o){ if(r.scope==='game') return G.meta.title||'게임'; if(r.scope==='stage'){ const ch=G.chapters.find(c=>(c.stages||[]).includes(o)); return `${ch?ch.title+' · ':''}${o.title||o.id}`; } return o.name||o.id; }

  static auditScan(only){ const out=[]; for(const r of AUDIT_RULES){ const items=LiveOps.auditTargets(r.scope).filter(o=>(!only||only(o,r))&&(()=>{ try{ return r.test(o); }catch(e){ return false; } })()); if(items.length) out.push({rule:r,items}); } return out; }

  static auditMarkObj(o){ if(o===G.meta){ Core.mark('meta','world'); return; } if(G.chars.includes(o)) Core.mark('c:'+o.id); else if(G.lib.includes(o)) Core.mark('l:'+o.id); else { const ch=G.chapters.find(c=>(c.stages||[]).includes(o)); if(ch) Core.mark('ch:'+ch.id); } }

  static async auditAIFill(c,fields,instruction){ // 빠진 항목 채우기(instruction 없음) 또는 지정 변환(instruction 있음)
    const schema='{'+fields.map(f=>AUDIT_FIELDS[f][1]).join(',')+'}', cur=fields.map(f=>`${AUDIT_FIELDS[f][0]}: ${JSON.stringify(c[f]??'')}`).join('\n');
    const r=await Core.aiJSON(LiveOps.auditAIFillPrompt({c,cur,instruction,fields,schema}),null,'default');
    if(!r) return false;
    for(const f of fields){ const v=r[f]; if(v==null) continue;
      if(f==='touch'&&typeof v==='object') c.touch={head:auditStrs(v.head).slice(0,8),body:auditStrs(v.body).slice(0,8),pet:auditStrs(v.pet).slice(0,8)};
      else if(f==='affLines'&&typeof v==='object'){ const o={}; Object.entries(v).forEach(([k,x])=>{ const n=parseInt(k,10); if(n>=1&&n<=10) o[n]=auditStrs(x).slice(0,4); }); c.affLines=o; }
      else if(['lines','lvLines','dupLines'].includes(f)) c[f]=auditStrs(v).slice(0,12);
      else if(f==='naiPrompt') c.naiPrompt=Core.stripAge(Core.tagList(String(v)).filter(t=>!MINOR_TAGS.test(Core.tagKey(t))).join(', '));
      else c[f]=String(v).trim(); }
    Core.mark('c:'+c.id); return true; }

  static schedVisit(sid,cid){ const sc=Core.progRead('sched'), s=LiveOps.spots().find(x=>x.id===sid), c=charById(cid); if(!s||!c||!Characters.own(c.id)) return; if(sc.left<=0){ CoreView.toast('오늘 일정을 다 썼어요. 내일 다시 와요'); return; } if(sc.done.includes(sid)){ CoreView.toast('오늘 이미 다녀온 장소예요'); return; }
    const fav=LiveOps.spotFav(c,s); SystemView.playStory(`${s.name} · ${c.name}`,(c.spotTalk&&c.spotTalk[s.id])||LiveOps.spotTemplate(c,s),()=>{ const k=Core.progSlot('sched'); k.left--; k.done.push(sid); CoreCtl.addAff(c,fav?30:20); const r=Characters.rateR({gold:800}); Economy.giveReward(r); Core.mark('prog'); CoreView.toast(`${c.name} 호감도 +${fav?30:20}${fav?' (좋아하는 장소)':''} · ${Core.rewardText(r)}`); Challenge.render(); }); }

  static prepAsk(){ if(System.playMode()) return; try{ Story.scanScriptAssets(); }catch(e){} const p=P(); if(p.prepNever||p.prepAsked===today()||PREPJOB||!Core.imgReady()||!$('#modal').hidden||!$('#ov').hidden) return; if(!Art.drawTodo().length) return; p.prepAsked=today(); Core.mark('prog'); CharactersView.openPrep(true); }

    /* 배너가 닫힐 때 남은 모집 포인트는 1포인트당 ◆ COST/10으로 바꿔 우편으로 보내요(포인트가 말없이 사라지지 않게) */
static sparkSettle(b){ const p=P(), n=(p.spark||{})[b.id]||0; if(!n) return 0; const gems=n*Math.round(COST/10); p.spark[b.id]=0;
    Economy.sendMail({from:'운영팀',title:`「${b.name}」 모집 포인트 정산`,body:`배너가 끝나 남은 모집 포인트 ${n}점을 ${System.T('currency')} ${nf(gems)}개로 바꿔 드려요.`,reward:{gems}}); return gems; }

  static bpRead(){ P().prepAsked=today(); if($('#bp_tags')){ G.meta.artTags=$('#bp_tags').value.trim(); Core.mark('meta'); }
    const cats=bootCats().map(x=>x[0]).filter(k=>{const el=document.querySelector(`[data-bpc="${k}"]`);return el&&el.checked;}); BP.cats=new Set(cats); P().bootPrep=1; Core.mark('prog'); return cats; }

  static bondNote(cs,notes){ if(cs&&cs.length) notes.push(`새 인연: ${cs.map(c=>c.name+'('+RL[c.rarity]+')').join(', ')} — 스토리에서 만나면 상시 ${System.T('gacha')}에 합류해요`); }

  static storyFlag(id,n,label){ const p=P(); p.flags=p.flags||{}; p.flags[id]={n,label:String(label||'').slice(0,40),at:Date.now()}; Core.mark('prog'); CoreView.toast(`선택이 기록됐어요 — 이후 이야기에 반영돼요`); }

    /* 새 게임 공통 마무리: 건조/영입을 켰으면 시작 자원 지급, 지금 점검 규칙 판으로 표시(새 게임은 구버전 생성물이 아님) */
static ngFinish(ng,draft){ if(draft&&draft.con) Acquire.conStartNew(ng); ng.meta.auditSeen=LiveOps.auditVer(); }

    /* ---- 업데이트 확인·안내·적용(앱·웹·APK), 업데이트 설정 ---- */
  /* UPDATE_GUIDANCE_MODULE */
  /* APK requirements are declared by releases, never guessed from arbitrary code differences. */
static updateHTMLMinimum(html){
   const text=String(html||'');const declared=(text.match(/var REQUIRED_APK='([^']+)'/)||[])[1];
   if(declared)return declared;
   // Compatibility with 2026.10.21.6, published before the explicit marker existed.
   const legacy=(text.match(/versionCompare\(window\.__SHELL__,'([^']+)'\)/)||[])[1];
   if(legacy)return legacy;
   if(text.includes('text/ggm-main')&&text.includes('ggm-durable-storage'))return '2026.10.21.4';
   return '';
  }

  static updateMinimum(man,html){
   const versions=[man?.apk?.minShell,LiveOps.updateHTMLMinimum(html),man?.build===APP_BUILD?window.__REQUIRED_APK__:''].filter(Boolean).map(String);
   if(versions.some(v=>!/^\d+(?:\.\d+){1,5}$/.test(v)))throw Error('최소 APK 버전 정보가 잘못되었습니다. 배포 정보를 확인해 주세요.');
   return versions.sort(Core.verCmp).at(-1)||'';
  }

  static updateCheckRecord(man,repo,branch,result,html){const o=Core.LV();o.lastCheck={at:Date.now(),running:APP_BUILD,installed:window.__SHELL__||APP_BUILD,remote:String(man.build||''),minimum:LiveOps.updateMinimum(man,html),repo,branch,result};LiveOps.saveLV(o);}

  static updateCurrentMessage(remote){return Core.verCmp(remote,APP_BUILD)<0?'현재 실행 '+APP_BUILD+' · 확인한 배포본 '+remote+'입니다. 업데이트 저장소와 브랜치를 확인해 주세요.':'이미 최신 버전이에요 ('+APP_BUILD+')';}

  static updateReleaseURL(man){const url=String(man?.apk?.url||'');const match=url.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/releases(?:\/|$)/i);return 'https://github.com/'+(match?match[1]:RELEASE_REPO)+'/releases/latest';}

  static saveLV(o){appStorage.setItem(LVKEY,JSON.stringify(o));}

  static async checkNoticeWeb(){
    const o=Core.LV(); let man=null; try{ const r=await fetch(`https://raw.githubusercontent.com/${Core.updRepo(o)}/main/version.json?t=${Date.now()}`); if(r.ok) man=await r.json(); }catch(e){ Core.quietErr(e,'0420-app-update.js:137'); } if(!man) return;
    if(man.feedback){ o.feedback=String(man.feedback); LiveOps.saveLV(o); }
    if(man.notice&&man.notice.id&&man.notice.title&&o.noticeSeen!==String(man.notice.id)){ o.noticeSeen=String(man.notice.id); LiveOps.saveLV(o); const nb=String(man.notice.body||''); Economy.sendMail({kind:'notice',from:'운영팀',title:String(man.notice.title).slice(0,60),body:nb,days:30}); const L=P().live; L.notices=L.notices.filter(x=>!x.dev); L.notices.unshift({dev:true,at:Date.now(),title:String(man.notice.title).slice(0,60),lines:nb.split('\n').map(x=>x.trim()).filter(Boolean)}); Core.mark('prog'); if(tab==='lobby') Challenge.render(); }
  }
}

class LiveOpsView {
  static openRegen(cid){
   if(System.playMode())return;const c=charById(cid);if(!c)return;if(!SAMPLE){CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');return;}
   Core.regenCancel();v2EnsureEquipment(c);
   CoreView.openModal(`${head('AI로 다시 만들기',`<span class="muted">${esc(c.name)}</span>`)}<p class="muted">바꿀 항목만 고르세요. 결과를 확인하고 적용하기 전까지 기존 캐릭터는 유지돼요.</p>
   ${LiveOps.regenFields().map(([k,lab,cur])=>`<div class="rg-row"><label><input type="checkbox" data-rgsel="${k}"><b>${k==='skill'?'스킬 (한 슬롯)':esc(lab)}</b><span class="muted">${esc(String(cur(c)).slice(0,80))||'—'}</span></label>${k==='skill'?`<select class="in" id="rg_skill_slot" hidden>${Object.entries(GGMCombat.SLOTS).map(([key,label])=>`<option value="${key}" ${key==='active'?'selected':''}>${label}</option>`).join('')}</select>`:''}<input class="in" data-rgreqi="${k}" placeholder="이 항목 요구사항" hidden></div>`).join('')}
   <label class="f" for="rg_all">전체 요구사항</label><textarea class="in" id="rg_all" style="min-height:52px" placeholder="선택한 항목에 함께 반영할 컨셉"></textarea><div class="row"><button class="btn" data-act="regengo" data-id="${c.id}">✦ 다시 만들기</button><button class="btn ghost" data-act="regencancel" data-id="${c.id}">취소</button></div>`);
   document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>ch.addEventListener('change',()=>{const row=ch.closest('.rg-row');row.querySelectorAll('input.in,select').forEach(el=>el.hidden=!ch.checked);}));
  }

  static openAudit(focus){ AUDIT_FOCUS=focus||null; if(!focus){ G.meta.auditSeen=LiveOps.auditVer(); Core.mark('meta'); }
    const only=focus?(o=>o.id===focus):null, res=LiveOps.auditScan(only), old=G.chars.filter(c=>!c.alt&&(+c.genVer||0)<LiveOps.auditGenVer()&&!DEFAULT_CHARS.some(d=>d.id===c.id)).length, kinds={missing:'빠짐',upgrade:'구버전·업그레이드'}, how={auto:'자동 변환',ai:'AI로 채우기','ai-stage':'AI로 쓰기','ai-rules':'AI로 설명 채우기','ai-persona':'AI로 개성 채우기·다듬기','ai-afftalk':'AI로 인연 톡 만들기','ai-memo':'AI로 메모리얼 만들기','skills-remaster':'세대 맞추기(AS)',weapon:'AI로 고치기',skills:'다시 맞추기',image:'그림 그리기',open:'다시 만들기 열기'};
    const chars=focus?G.chars.filter(c=>c.id===focus):G.chars;
    CoreView.openModal(LiveOpsView.auditHTML(focus,old,res,kinds,how,chars)); }

  static schedHTML(){ const sc=Core.progRead('sched'), S=LiveOps.spots();
    return `${pageHead('일정','SCHEDULE','lobby')}<p class="muted">하루 ${SCHED_N}번, 장소에 나와 있는 ${System.T('crew')}을(를) 만나요. 좋아하는 장소에서 만나면 호감도를 더 많이 얻어요. 오늘 남은 일정 <b>${sc.left}/${SCHED_N}</b></p>
    ${S.length?`<div class="sc-spots">${S.map(s=>{ const done=sc.done.includes(s.id), who=LiveOps.spotWho(s); return `<div class="sc-spot" style="${ArtView.bgStyle(s.bg||s.name)}"><b>${esc(s.name)}</b>${s.desc?`<div class="muted" style="font-size:.75rem">${esc(s.desc)}</div>`:''}
      <div class="sc-who">${done?'<span class="badge">다녀옴</span>':who.length?who.map(c=>`<button class="btn sm" data-act="scvisit" data-s="${s.id}" data-c="${c.id}" ${sc.left?'':'disabled'}>${esc(c.name)}${LiveOps.spotFav(c,s)?' ♥':''}</button>`).join(''):'<span class="muted">아무도 없어요</span>'}</div></div>`; }).join('')}</div>`:`<p>아직 장소가 없어요.</p><button class="btn" data-act="scauto">자료실 배경으로 장소 만들기</button>`}
    ${System.playMode()?'':`<div class="row" style="margin-top:10px;gap:6px"><button class="btn sm ghost" data-act="scai">AI로 장소 다시 정하기</button><button class="btn sm ghost" data-act="sctalkall">AI로 장면 만들기(장면 없는 ${System.T('crew')})</button></div>`}`; }

  static liveBar(msg){let el=document.getElementById('livebar');if(!msg){if(el)el.remove();return;}if(!el){el=document.createElement('div');el.id='livebar';document.body.appendChild(el);}el.textContent=msg;}

  static openSeasonInfo(){ const L=P().live, s=LiveOps.seasonNow(), nx=LiveOps.seasonNext();
    CoreView.openModal(`${head('시즌',`<span class="muted">${LiveOps.seasonDays()}일마다 운영 테마가 바뀌어요</span>`)}
      ${s?`<div class="season-now s-${esc(s.type)}"><em>${LiveOps.seasonMeta(s.type)[3]}</em><div><b>지금: ${esc(LiveOps.seasonMeta(s.type)[1])}</b><span>${esc(LiveOps.seasonMeta(s.type)[2])} · ${new Date(s.until-1).toLocaleDateString('ko-KR')}까지</span></div></div>`:'<p class="muted">아직 시즌이 시작되지 않았어요.</p>'}
      ${nx?`<p class="muted" style="margin:10px 0 4px">다음 시즌: <b>${esc(LiveOps.seasonMeta(nx)[1])}</b></p>`:''}
      <h3 class="sec">로테이션에 넣을 시즌</h3><div class="chips">${SEASONS.map(x=>`<button class="chip ${L.seasons[x[0]]!==false?'on':''}" data-act="seasontog" data-k="${x[0]}">${x[3]} ${esc(x[1])}</button>`).join('')}</div>
      <p class="muted" style="font-size:.8rem;margin-top:8px">스토리·이벤트·캐릭터 시즌은 글 AI로 새 콘텐츠를 만들어요. 육성·복각 시즌은 AI 없이도 돌아가요.</p>
      <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="seasonskip">지금 다음 시즌으로 넘기기</button><button class="btn sm" data-act="close">닫기</button></div>`); }

  static openNotice(i){
    const n=P().live.notices[i]; if(!n) return;
    CoreView.openModal(`${head(esc(n.title),'<span class="muted">UPDATE NOTICE</span>')}<ul class="notice">${n.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-to="notice">공지 전체 보기</button></div>`);
  }

  static noticeHTML(){
    const L=P().live, todo=Art.drawTodo();
    return `${pageHead('공지','NOTICE','lobby')}
    ${L.notices.length?L.notices.map((n,i)=>`<div class="panel"><h3>${esc(n.title)}</h3><ul class="notice">${n.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`).join(''):'<div class="panel"><p class="muted">아직 공지가 없어요. 설정의 라이브 운영을 켜 두면 날짜에 맞춰 새 콘텐츠가 생겨요.</p></div>'}
    <div class="panel"><h3>NAI로 그릴 것 ${todo.length}개</h3><p class="muted" style="margin:0 0 10px">${todo.slice(0,12).map(x=>esc(x.label)).join(', ')}${todo.length>12?' 외':''}</p>${todo.length?'<button class="btn" data-act="prepopen">그림 준비실 열기</button>':''}</div>`;
  }

    /* 콘텐츠 점검·업그레이드 창 내용(View) */
static auditHTML(focus,old,res,kinds,how,chars){ return `${head(focus?`${charById(focus)?.name||''} 점검`:'콘텐츠 점검·업그레이드',`<span class="muted">생성 규칙 v${LiveOps.auditGenVer()} · ${focus?'':`구버전 생성물 ${old}명`}</span>`)}
      <p class="muted" style="font-size:.82rem;margin:0 0 8px">생성 기능이 좋아졌거나 예전에 만든 콘텐츠에 빠진 게 있으면 여기에서 찾아 고쳐요. 고치기 전 상태는 마지막 작업 한 번까지 되돌릴 수 있어요.</p>
      ${AUDIT_UNDO?`<div class="panel" style="padding:8px 10px"><span class="muted">마지막 작업: ${esc(AUDIT_UNDO.label)} (${AUDIT_UNDO.items.length}개)</span> <button class="btn sm ghost" data-act="audundo">되돌리기</button></div>`:''}
      ${res.length?res.map(({rule:r,items},gi)=>`<details class="panel" style="margin:6px 0" ${gi<3?'open':''}><summary><span class="badge">${kinds[r.kind]}</span> <b>${esc(r.label)}</b> <span class="muted">${items.length}개</span></summary>
        <div style="max-height:160px;overflow:auto;margin:6px 0;font-size:.85rem">${items.map((o,i)=>`<label style="display:flex;gap:6px"><input type="checkbox" data-aud="${r.id}" data-i="${i}" checked>${esc(LiveOps.auditName(r,o))}${r.scope==='char'&&(+o.genVer||0)<LiveOps.auditGenVer()?' <span class="muted">(구버전)</span>':''}</label>`).join('')}</div>
        <button class="btn sm" data-act="audfix" data-rule="${r.id}">선택 항목 ${how[r.fix.mode]}</button></details>`).join(''):'<p>👍 찾은 문제가 없어요.</p>'}
      <details class="panel" style="margin-top:10px" ${focus?'open':''}><summary><b>지정 변환 (AI)</b> <span class="muted">고른 ${esc(System.T('crew'))}의 항목을 지시대로 바꿔요</span></summary>
        <label class="f">대상</label><div style="max-height:120px;overflow:auto;font-size:.85rem">${chars.map(c=>`<label style="display:inline-flex;gap:4px;margin:2px 8px 2px 0"><input type="checkbox" data-audc="${c.id}" ${focus?'checked':''}>${esc(c.name)}</label>`).join('')}</div>
        <label class="f">항목</label><div class="row" style="flex-wrap:wrap">${Object.entries(AUDIT_FIELDS).map(([k,[l]])=>`<label style="display:inline-flex;gap:4px"><input type="checkbox" data-audf="${k}">${esc(l)}</label>`).join('')}</div>
        <label class="f" for="aud_ins">지시</label><textarea class="in" id="aud_ins" rows="2" placeholder="예: 대사를 모두 반말로 / 프로필에 출신지와 좋아하는 음식 추가 / 외모 태그를 겨울 분위기로"></textarea>
        <div class="row" style="margin-top:6px"><button class="btn sm" data-act="audconv">지정 변환 시작</button></div></details>
      <div class="row" style="margin-top:12px">${AUDIT_JOB?'<button class="btn ghost" data-act="audstop">작업 멈추기</button>':''}<button class="btn ghost" data-act="close">닫기</button></div>`; }

  static auditPanel(){ const n=LiveOps.auditScan().reduce((a,x)=>a+x.items.length,0), fresh=(+G.meta.auditSeen||0)<LiveOps.auditVer();
    return `<div class="panel pm-hide"><h3>콘텐츠 점검·업그레이드 ${fresh?'<span class="badge">생성 기능 향상</span>':''}</h3><p class="muted" style="margin:0 0 10px">${n?`고칠 수 있는 항목 ${n}개. `:''}빠진 대사·그림·태그, 구버전 생성물을 찾아 자동·AI로 고치거나, 고른 캐릭터를 지시대로 바꿔요.</p><button class="btn sm" data-act="audopen">점검 열기</button></div>`; }

  static liveFillNotes(notes,fill){ if(notes.length) notes.push(...fill); else if(fill.length) CoreView.toast(fill[0]); }

  static async checkUpdate(manual){
    UPD=null;const o=Core.LV(), repo=Core.updRepo(o), branch=(o.branch||'main').trim();
    if(o.token) return CoreView.checkUpdatePrivate(manual);
    let raw=`https://raw.githubusercontent.com/${repo}/${branch}/`;
    let man=null;
    const getMan=async base=>{ try{ const r=await System.http(base+'version.json?t='+Date.now(),{timeout:20000}); if(r.status<400) return JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):'')); }catch(e){} return null; };
    man=await getMan(raw);
    o.checked=Date.now(); LiveOps.saveLV(o);
    if(!man||!man.build){ if(o.repo) return CoreView.checkUpdatePrivate(manual); if(manual) CoreView.toast('업데이트 정보를 받지 못했어요. 인터넷을 확인해 주세요'); return; }
    if(man.feedback){ o.feedback=String(man.feedback); LiveOps.saveLV(o); }
    if(man.notice&&man.notice.id&&man.notice.title&&o.noticeSeen!==String(man.notice.id)){ o.noticeSeen=String(man.notice.id); LiveOps.saveLV(o); const nb=String(man.notice.body||''); Economy.sendMail({kind:'notice',from:'운영팀',title:String(man.notice.title).slice(0,60),body:nb,days:30}); const L=P().live; L.notices=L.notices.filter(x=>!x.dev); L.notices.unshift({dev:true,at:Date.now(),title:String(man.notice.title).slice(0,60),lines:nb.split('\n').map(x=>x.trim()).filter(Boolean)}); L.notices=L.notices.slice(0,30); Core.mark('prog'); Challenge.render(); CoreView.toast('새 공지가 도착했어요'); }
    if(LiveOpsView.updateAPKRequired(man,'',repo,branch))return;
    const newer=Core.verCmp(man.build,APP_BUILD)>0;
    if(!newer){LiveOps.updateCheckRecord(man,repo,branch,'최신 또는 배포본보다 새 버전');if(manual)CoreView.toast(LiveOps.updateCurrentMessage(man.build));return;}
    if(o.skip===man.build&&!manual) return;
    const isBad=!!o.badBuild&&o.badBuild===man.build; if(isBad&&!manual) return;
    const path=(man.html||o.path||'www/index.html').replace(/^\//,'');let html;
    try{html=await CoreView.updateDownloadHTML(raw,path,man);}catch(e){LiveOps.updateCheckRecord(man,repo,branch,'확인 실패: '+e.message);if(manual)CoreView.toast(e.message);return;}
    if(LiveOpsView.updateAPKRequired(man,html,repo,branch))return;
    LiveOps.updateCheckRecord(man,repo,branch,'웹 패치 가능',html);UPD={man,raw,path,html};
    if(isBad){ CoreView.openModal(LiveOpsView.updateBadHTML(man)); return; }
    if(o.mode==='silent'&&!manual) return LiveOpsView.applyUpdate(true);
    CoreView.openModal(LiveOpsView.updateFoundHTML(man));
  }

  static async applyUpdate(silent){
    const u=UPD;if(!u)return;let html;
    try{html=u.html||await CoreView.updateDownloadHTML(u.raw,u.path,u.man);}catch(e){CoreView.toast(e.message);return;}
    if(LiveOpsView.updateAPKRequired(u.man,html,Core.updRepo(Core.LV()),Core.LV().branch||'main')){UPD=null;return;}
    const build=(html.match(/var BUILT='([^']+)'/)||[])[1]||u.man.build; try{ appStorage.setItem('ggm-upd-notes',JSON.stringify(Array.isArray(u.man.notes)?u.man.notes:String(u.man.notes||'').split('|').map(x=>x.trim()).filter(Boolean))); }catch(e){}
    try{ await appStorage.saveLive(html); }catch(e){ CoreView.toast('업데이트 저장 실패: '+(e.message||'저장 공간을 확인해 주세요')); return; }
    const o=Core.LV(); Object.assign(o,{on:true,prevBuild:o.build||'',build,boots:0,failed:false,at:Date.now()}); if(o.badBuild===build) delete o.badBuild; LiveOps.saveLV(o); await Core.flush();
    if(silent){ CoreView.toast('새 버전을 받았어요. 다음 실행부터 적용돼요'); return; }
    CoreView.openModal(LiveOpsView.updateReadyHTML(build));
  }

  static updateAPKRequired(man,html,repo=updRepo(LV()),branch=LV().branch||'main'){
   let minimum;try{minimum=LiveOps.updateMinimum(man,html);}catch(e){UPD=null;CoreView.toast(e.message);return true;}const installed=window.__SHELL__||APP_BUILD;
   if(!minimum||Core.verCmp(installed,minimum)>=0)return false;
   UPD=null;LiveOps.updateCheckRecord(man,repo,branch,'새 APK 설치 필요',html);
   CoreView.openModal(`${head('새 APK 설치가 필요해요')}<p>이번 업데이트는 앱의 시작 방식·저장 기능 또는 안드로이드 기능과의 호환 조건이 바뀌어, 앱 안에서 받는 패치만으로는 적용할 수 없어요.</p><div class="panel"><p>현재 설치 APK: <b>${esc(installed)}</b><br>필요한 APK: <b>${esc(minimum)} 이상</b><br>업데이트 버전: <b>${esc(man.build)}</b></p></div><p><b>기존 앱을 삭제하지 말고 새 APK를 내려받아 덮어 설치해 주세요.</b> 같은 공식 앱과 서명으로 설치하면 기존 게임 데이터를 유지합니다. 앱 삭제·데이터 초기화는 하지 마세요.</p><p>GitHub 릴리즈 화면의 <b>Assets(첨부 파일)</b>에서 <b>gacha-game-maker.apk</b>를 내려받고, 다운로드한 APK 파일을 열어 설치해 주세요. Source code ZIP은 앱 설치 파일이 아닙니다.</p>${LiveOpsView.notesHTML(man)}<div class="row"><button class="btn" data-act="apkget" data-url="${esc(LiveOps.updateReleaseURL(man))}">GitHub 릴리즈 열기</button><button class="btn ghost" data-act="close">나중에</button></div>`);
   return true;
  }

    /* 새 업데이트 안내 창 내용(View) */
static updateFoundHTML(man){ return `${head('업데이트가 있어요',`<span class="muted">${esc(APP_BUILD)} → <b>${esc(man.build)}</b></span>`)}${LiveOpsView.notesHTML(man)}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="updget">받기</button><button class="btn ghost" data-act="updskip">이번 버전 건너뛰기</button><button class="btn ghost" data-act="close">나중에</button></div>`; }

    /* 전에 문제가 있던 버전 안내 창 내용(View) */
static updateBadHTML(man){ return `${head('이 버전은 전에 문제가 있었어요',`<span class="muted">${esc(man.build)}</span>`)}<p>이 버전은 이 기기에서 제대로 실행되지 않아서 설치 버전으로 돌아왔었어요. 새 버전이 나오면 자동으로 다시 알려 드려요.</p><div class="row" style="margin-top:12px"><button class="btn ghost" data-act="updget">그래도 받기</button><button class="btn" data-act="close">닫기</button></div>`; }

    /* 업데이트를 받은 뒤 창 내용(View) */
static updateReadyHTML(build){ return `${head('업데이트를 받았어요')}<p>버전 <b>${esc(build)}</b>. 다시 시작하면 적용돼요. 문제가 생기면 설정 → 앱 업데이트에서 이전 버전으로 되돌릴 수 있어요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="reload">지금 다시 시작</button><button class="btn ghost" data-act="close">나중에</button></div>`; }

    /* 웹 업데이트 안내 창 내용(View) */
static updateWebFoundHTML(man,srvOld){ return `${head('업데이트가 있어요',`<span class="muted">${esc(APP_BUILD)} → <b>${esc(man.build)}</b></span>`)}${LiveOpsView.notesHTML(man)}
        ${srvOld?'<p class="muted" style="font-size:.82rem">PC 서버 프로그램(ggm-server.py)도 바뀌었어요. Releases의 gacha-game-maker-pc.zip을 새로 받아 덮어쓰면 좋아요.</p>':''}
        <div class="row" style="margin-top:12px"><button class="btn" data-act="webupdgo">지금 업데이트</button><button class="btn ghost" data-act="webupdskip">이번 버전 건너뛰기</button><button class="btn ghost" data-act="close">나중에</button></div>`; }

  static notesHTML(man){const n=Array.isArray(man.notes)?man.notes:String(man.notes||'').split('|').map(x=>x.trim()).filter(Boolean);return n.length?`<div class="panel" style="margin:8px 0"><h3>바뀐 점</h3><ul style="margin:0;padding-left:18px">${n.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';}
}

class LiveOpsCtl {
  static async skinFacesRun(c,k,b){ const cm=Core.naiCfg().model||NAI_DEF.model, O={m:'inpaint',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1}; let n=0;
    for(const ko of FACE_BASIC){ if(SKJOB&&SKJOB.stop) break; LiveOpsView.liveBar(`${System.T('skin')} 「${k.name}」 표정 ${ko} (${b==='up'?'상반신':'전신'}) 그리는 중…`);
      let f=k.faces.find(q=>q.name===ko); if(!f){ f={id:'f'+uid(),name:ko,img:null}; k.faces.push(f); }
      try{ await Core.faceDrawOne(c,k,f,ko,b,O); n++; }catch(e){ CoreView.toast(Core.naiErr(e)); break; } await wait(600); }
    return n; }

  static async auditFix(rule,items){
    if(AUDIT_JOB){ CoreView.toast('점검 작업이 진행 중이에요'); return; } const m=rule.fix.mode;
    if(m==='open'){ const c=items[0]; if(rule.fix.stamp) items.forEach(x=>{ x.genVer=LiveOps.auditGenVer(); LiveOps.auditMarkObj(x); }); CoreView.closeModal(); if(c&&typeof LiveOpsView.openRegen==='function') LiveOpsView.openRegen(c.id); if(items.length>1) CoreView.toast(`${items.length}명을 지금 버전으로 표시했어요. 다시 만들 부분은 캐릭터마다 「다시 만들기」에서 골라요`); return; }
    if(m==='image'){ if(!Core.imgReady()){ CoreView.toast('그림 AI(NovelAI 또는 ComfyUI)를 먼저 설정해 주세요'); return; } const set=new Set(items); CoreView.closeModal(); CoreCtl.runPrep(rule.scope==='lib'?['bg','prop','cg','enemy']:auditImgCats,it=>set.has(it.c)||set.has(it.o)); return; }
    if((m==='ai'||m==='ai-stage'||m==='weapon'||m==='ai-rules'||m==='ai-persona'||m==='ai-afftalk'||m==='ai-memo'||m==='ai-run')&&!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
    Core.auditSnap(items,rule.label); const job=AUDIT_JOB={stop:false,done:0,total:items.length}; let ok=0;
    try{ for(const o of items){ if(job.stop) break; SystemView.syBar(`점검: ${rule.label} ${job.done+1}/${job.total}`);
        try{ if(await Core.auditFixOne(rule,o)) ok++; }catch(e){ console.warn('audit',rule.id,e); }
        job.done++; } }
    finally{ AUDIT_JOB=null; SystemView.syBar(''); }
    Core.mark('prog'); CoreView.toast(`${rule.label}: ${ok}/${items.length}개 고쳤어요${AUDIT_UNDO?' (되돌리기 가능)':''}`); if(!$('#modal').hidden) LiveOpsView.openAudit(AUDIT_FOCUS); else Challenge.render(); }

  static async auditConvert(chars,fields,instruction){
    if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(!chars.length||!fields.length||!instruction.trim()){ CoreView.toast('대상·항목·지시를 모두 정해 주세요'); return; } if(AUDIT_JOB) return;
    Core.auditSnap(chars,'지정 변환: '+instruction.slice(0,20)); const job=AUDIT_JOB={stop:false}; let ok=0;
    try{ for(const [i,c] of chars.entries()){ if(job.stop) break; SystemView.syBar(`지정 변환 ${i+1}/${chars.length}: ${c.name}`); try{ if(await LiveOps.auditAIFill(c,fields,instruction)) ok++; }catch(e){ Core.quietErr(e,'0535-content-audit.js:94'); } } }
    finally{ AUDIT_JOB=null; SystemView.syBar(''); } CoreView.toast(`지정 변환: ${ok}/${chars.length}명 바꿨어요 (되돌리기 가능)`); LiveOpsView.openAudit(AUDIT_FOCUS); }

  static async liveFill(notes){ if(System.subLocked()) return 0; const done={}, add=id=>{ done[id]=(done[id]||0)+1; }, group=id=>LiveOps.auditScan().find(g=>g.rule.id===id);
    for(const id of LIVE_FILL_AUTO){ const g=group(id); if(!g) continue; for(const o of g.items) if(await Core.auditFixOne(g.rule,o)) add(id); }
    let n=0; if(SAMPLE) for(const id of LIVE_FILL_AI){ if(n>=LIVE_FILL_MAX) break; const g=group(id); if(!g) continue;
      for(const o of LIVE_FILL_OWNED.has(id)?g.items.filter(c=>Characters.own(c.id)):g.items){ if(n>=LIVE_FILL_MAX) break; LiveOpsView.liveBar(`${LIVE_FILL_NAME[id]}을(를) 채우는 중…`); n++; if(await Core.auditFixOne(g.rule,o)) add(id); } }
    const ids=Object.keys(done); if(ids.length){ Core.mark('prog'); notes.push('비어 있던 콘텐츠를 채웠어요: '+ids.map(id=>`${LIVE_FILL_NAME[id]} ${done[id]}`).join(', ')+' (콘텐츠 점검·각 화면에서 고칠 수 있어요)'); }
    return ids.length; }

    // liveTick에서 부르는 세 곳: 정기 실행의 채우기 단계, 첫 실행(주기 기준만 잡고 돌아갈 때 — 채우기는 주기와 상관없어서 이때도), 알림 합치기
static async liveFillStep(on,notes){ if(!on.fill) return; LiveOpsView.liveBar('비어 있는 콘텐츠를 채우는 중…'); await LiveOpsCtl.liveFill(notes); }

  static async liveFillRun(on){ if(!on.fill||LIVE_RUN) return; LIVE_RUN=true; LiveOpsView.liveBar('비어 있는 콘텐츠를 채우는 중…'); const notes=[];
    try{ await LiveOpsCtl.liveFill(notes); }catch(e){ Core.quietErr(e,'liveFillRun'); } finally{ LIVE_RUN=false; LiveOpsView.liveBar(null); } if(notes.length) CoreView.toast(notes[0]); }
}
