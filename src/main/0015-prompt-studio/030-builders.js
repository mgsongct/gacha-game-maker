/* ===== 프롬프트 스튜디오: 조립 함수 — 여러 요청이 같이 쓰는 프롬프트 글(AI 컨텍스트·답 형식 견본·그림 태그 표·태그 조립) ===== */
/* src/main/0020-ai-connect.js */
function llmWrap(pr){ const L=llmEff(); let s=String(pr);
  { const isTag=TAG_REQ.test(s), pl=plInject(isTag); if(pl){ let i=s.lastIndexOf('JSON만 출력'); if(i<0) i=s.length; s=s.slice(0,i)+pl+s.slice(i); } } // 프롬프트 스튜디오(0025) 교훈·그림 가이드
  if(L.tag&&TAG_REQ.test(s)){ let i=s.lastIndexOf('JSON만 출력'); if(i<0) i=s.length; s=s.slice(0,i)+pf('USER_TAG_GUIDE_HEAD')+'\n'+L.tag.trim()+'\n'+s.slice(i); }
  if(!L.top&&!L.mid&&!L.bot) return s;
  if(L.mid){ let i=s.lastIndexOf('JSON만 출력'); if(i<0){ const j=s.lastIndexOf('\n'); i=j>0?j+1:s.length; } s=s.slice(0,i)+'[제작자 지침]\n'+L.mid.trim()+'\n'+s.slice(i); }
  return (L.top?'[제작자 지침]\n'+L.top.trim()+'\n\n':'')+s+(L.bot?'\n\n[제작자 지침]\n'+L.bot.trim():''); }
function playerCast(){ const p=P(), g=p.gender==='m'?'1boy':p.gender==='f'?'1girl':'1other', tags=String((p.avatar&&p.avatar.prompt)||'').trim(); return {id:'__player',name:T('player'),naiPrompt:joinTags(tags||g,p.hideEyes?'hair over eyes, covered eyes':'')}; }
const NAI_POSES=[['정면 서기','straight-on, standing, looking at viewer, arms at sides'],['손 허리','standing, hand on own hip, looking at viewer'],['팔짱','standing, crossed arms, looking at viewer'],['무기 들기','standing, holding weapon, looking at viewer'],['손 흔들기','standing, waving, smile, looking at viewer'],['브이','standing, v, looking at viewer'],['뒤돌아보기','standing, looking back, from behind'],['한쪽 무릎','kneeling, on one knee, looking at viewer'],['앉기','sitting, looking at viewer'],['역동적','dynamic pose, action pose, looking at viewer'],['수줍게','standing, hands together, looking away, blush']];
function composeNai(kind,base,opt){
  opt=opt||{}; const c=naiCfg(), part=c.parts[kind]||c.parts.prop, st=naiStyle(c,opt.styleId);
  if(IMG_NOHUMAN[kind]){ const g=imgGuard(kind,base); if(g.removed.length){ base=g.out; plHit('img-person-'+kind,g.removed.join(', ')); } } // 그림 가드(0025): 배경·소품에 사람 태그가 섞이면 빼요
  let body=tagList(base), suffix=part.suffix, frame='';
  if(kind==='char'||ILK(kind)){ body=body.filter(t=>!COMPO_TAGS.test(tagKey(t))); frame=opt.frame||(ILK(kind)?'cowboy shot':'full body'); suffix=tagList(suffix).filter(t=>!FRAME_TAGS.test(tagKey(t))).join(', '); }
  const pose=kind==='char'?(opt.pose!=null?opt.pose:NAI_FRONT):ILK(kind)?(opt.pose!=null?opt.pose:'looking at viewer'):kind==='enemy'?'straight-on':'';
  let fneg='';
  if(kind==='char'&&/^full body$/i.test(String(frame).trim())){ frame='1.3::full body::, standing'; fneg='feet out of frame, cowboy shot, upper body, portrait, close-up, cropped legs'; }
  // 스탠딩은 눈높이 정면으로: 하이앵글·로우앵글·원근 왜곡을 막아요
  if(kind==='char'){ frame=joinTags(frame,'eye level, straight-on'); fneg=joinTags(fneg,'from above, from below, high angle, low angle, dutch angle, fisheye, foreshortening, perspective, wide angle'); }
  const human=kind==='char'||ILK(kind);
  // 사람인데 엘프 귀가 나오지 않게: 프롬프트에 뾰족한 귀 종족 태그가 없으면 뾰족한 귀를 막아요
  const pointy=/\b(elf|elves|elven|half-elf|pointy ears|elf ears|fairy|pixie|demon|devil|succubus|vampire|monster girl|goblin|orc)\b/i.test(String(base||''));
  if((human||kind==='cg')&&!pointy) fneg=joinTags(fneg,'pointy ears, elf');
  return {input:joinTags(st.tags,c.prefix,body.join(', '),pose,frame,suffix), neg:joinTags(c.neg,st.neg,part.neg,fneg,human?'child, loli':'')};
}
const NAI_FRONT='straight-on, standing, looking at viewer, arms at sides';
/* src/main/0030-character-regen.js */
function regenSchema(c,sel){const schema={};if(sel.name){schema.name='캐릭터 이름';schema.faction='소속';}if(sel.profile){schema.profile='프로필';schema.intro='첫 인사';schema.files=[{dup:1,text:'비밀 기록'}];}if(sel.look)schema.naiPrompt='NovelAI 영어 외형 태그';if(sel.weapon)schema.weapon={name:'무기 이름',desc:'무기 설명',prompt:'no humans, object focus, weapon, simple background, white background'};if(sel.lines){schema.lines=['로비 대사'];schema.affLines={'4':['호감도 대사']};schema.lvLines=['강화 대사'];schema.dupLines=['돌파 대사'];schema.touch={head:['머리 터치'],body:['몸 터치'],pet:['쓰다듬기']};}return schema;}
function composeCG(l,opt){
  opt=opt||{}; const c=naiCfg(), st=naiStyle(c,opt.styleId||l.naiStyle), cast=cgCast(l), n=cast.length;
  // 인원 태그는 각 인물 프롬프트의 1girl/1boy를 세어 만들어요(남성·혼성 게임에서 1girl로 고정되던 문제)
  const sx=cast.map(x=>{ const k=tagList(x.c.naiPrompt).map(tagKey); return k.includes('1boy')?'b':k.includes('1other')?'o':'g'; }), ng=sx.filter(x=>x==='g').length, nb=sx.filter(x=>x==='b').length, no=sx.filter(x=>x==='o').length;
  const count=n?[ng?(ng===1?'1girl':ng+'girls'):'',nb?(nb===1?'1boy':nb+'boys'):'',no?(no===1?'1other':no+'others'):'',n===1?'solo':''].filter(Boolean).join(', '):'no humans';
  return {input:joinTags(st.tags,c.prefix,count,l.prompt,c.parts.cg.suffix),neg:joinTags(c.neg,st.neg,c.parts.cg.neg,n?'child, loli':''),
    chars:cast.map(x=>({name:x.c.name,id:x.c.id,prompt:charCaption(x.c,x.act),uc:'',pos:x.pos}))};
}
/* src/main/0010-rules.js */
function genderText(){ const t=String(P().genderTxt||'').trim(), lk=String(P().look||'').trim(), bio=String(P().bio||'').trim(), L=(lk?`플레이어(${T('player')})의 외모: ${lk}. `:'')+(bio?pf('PLAYER_BIO',{player:T('player'),bio}):'');
  if(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t)) return pf('PLAYER_GENDER_TEXT',{player:T('player'),gender:t})+L;
  return genderText0()+L; }
/* src/main/0440-ai-context.js */
function ctx(side,focus){ // side: 외전·이벤트용. 메인 플롯·비밀·진행 상황을 빼요(이벤트가 메인 떡밥을 끌어오지 않게)
  const w=G.world, sd=[], wS=dedupText(w.summary,sd).text, wL=dedupText(w.lore,sd).text, wP=side?'':dedupText(w.plot||'',sd).text, bib=G.meta.bible?dedupText(side?String(G.meta.bible).split('\n').filter(l=>!/^\s*비밀/.test(l)).join('\n'):String(G.meta.bible),sd).text:''; // 세계관 요약·상세·플롯·작가 설정에 겹치는 문장은 한 번만 보내요
  const prog=G.chapters.filter(ch=>ch.kind==='main').map(ch=>ch.title+': '+ch.stages.map(s=>s.title+(P().cleared[s.id]?'(완료)':'')).join(', ')).join(' / ');
  return `게임 "${G.meta.title}". ${w.source?pf('CTX_SOURCE',{source:w.source}):''}세계관 "${w.name}": ${wS}\n${wL?'상세 설정: '+wL+'\n':''}${side?'':`메인 플롯(작가용 비밀 설정 포함): ${wP||w.plot||'미정'}\n${storyCfg().plot?pf('CTX_PLAYER_PLOT',{plot:storyCfg().plot}):''}`}${bib?(side?'작가 설정(세계관 참고용):\n'+bib.slice(0,8000):pf('CTX_BIBLE',{bible:bib.slice(0,12000)}))+'\n':''}${factionCtx()}${side?'':`메인 스토리 진행: ${prog}\n`}${T('crew')}: ${G.chars.filter(c=>!(c.alt&&!c.altCanon)&&!c.monster).map(c=>`${c.name}(${c.alt&&charById(c.alt)?pf('CTX_ALT_CANON',{name:charById(c.alt).name}):''}${RL[c.rarity]}, ${c.faction||'무소속'}, ${c.elem}속성 ${ROLE[c.role]}, ${smProfile(c,focus)}${personaBrief(c)?' 개성: '+personaBrief(c)+'.':''} 말투 예: "${smVoice(c,focus)}"${c.faces.length?' 표정: '+c.faces.map(f=>f.name).join('/'):''})`).join('; ')}${G.chars.some(c=>c.alt&&!c.altCanon)?pf('CTX_ALT_SIDE',{list:G.chars.filter(c=>c.alt&&!c.altCanon).map(c=>c.name+'='+((charById(c.alt)||{}).name||'')+'의 외전 모습').join(', ')}):''}${(G.npcs||[]).length?pf('CTX_NPCS',{crew:T('crew')})+G.npcs.map(npc=>`${npc.name}(${npc.role||'조연'}, ${String(npc.profile||'').slice(0,focus&&smFocused(npc,focus)?1000:200)}${npc.speech?' 말투: '+String(npc.speech).slice(0,60):''})`).join('; '):''}\n배경 목록: ${G.lib.filter(l=>l.kind==='bg').map(l=>l.name).join(', ')||'(아직 없음)'}${(()=>{ const L=shList().filter(x=>x.kind==='bg'&&!G.lib.some(l=>l.kind==='bg'&&l.name===x.name)).slice(0,20).map(x=>x.name); return L.length?'\n공유 보관함 배경(이 이름을 쓰면 그림을 바로 재사용): '+L.join(', '):''; })()}\n소품 목록: ${G.lib.filter(l=>l.kind==='prop').map(l=>l.name).join(', ')}\n음악 목록: ${G.lib.filter(l=>l.kind==='bgm').map(l=>l.name).join(', ')}\n효과음 목록: ${G.lib.filter(l=>l.kind==='sfx').map(l=>l.name).join(', ')}\nCG 목록: ${G.lib.filter(l=>l.kind==='cg').map(l=>l.name).join(', ')||'없음'}`+smNotes(side)+smCodex(focus,side);
}
/* src/main/0445-factions.js */
// AI 컨텍스트
function factionCtx(){ const F=factions(), now=mainNow(), L=[];
  F.forEach(f=>{ const st=stanceAt(f,now), nxt=(f.stance||[]).filter(x=>+x.ch>now).sort((a,b)=>a.ch-b.ch)[0], mem=G.chars.filter(c=>c.faction===f.name&&!c.monster).map(c=>c.name);
    L.push(`- ${f.name} [${FKIND[f.kind]} · 지금 플레이어와 ${FSTANCE[st]}${nxt?` · ${nxt.ch}장부터 ${FSTANCE[nxt.s]} 예정(${nxt.why||''}, 아직 드러내지 않음)`:''}]: ${f.desc||''}${f.goal?' 목적: '+f.goal+'.':''}${f.leader?' 지도자: '+f.leader+'.':''}${f.base?' 거점: '+f.base+'.':''}${f.ideology?' 이념: '+f.ideology+'.':''}${f.kind==='monster'?`${f.origin?' 정체: '+f.origin+'.':''}${f.nature?' 습성: '+f.nature+'.':''}${f.weakness?' 약점: '+f.weakness+'.':''}`:''}${Object.keys(f.rel).length?' 다른 세력과: '+Object.entries(f.rel).map(([k,v])=>k+' '+v).join(', ')+'.':''}${mem.length?' 소속 '+T('crew')+': '+mem.join(', ')+(st==='hostile'?' (지금은 적으로 나올 수 있음)':''):''}`); });
  const M=monsterNames().filter(l=>l.desc||enemyFaction(l)); const crew=G.chars.filter(c=>!c.monster&&!c.npc&&!c.alt), unmet=crew.filter(c=>own(c.id)&&!metInStory(c)), lock=crew.filter(c=>!own(c.id)&&((c.debut&&!debutOk(c))||c.debutLater));
  return `\n세력(설정을 지키고, 관계 변화는 정해진 장에서만):\n${L.join('\n')||'없음'}\n${M.length?pf('CTX_BESTIARY')+M.map(l=>`${l.name}${enemyFaction(l)?'('+enemyFaction(l)+')':''}: ${[l.desc,l.nature,l.weak&&'약점 '+l.weak].filter(Boolean).join(' / ')}`).join('; ')+'\n':''}${unmet.length?pf('CTX_UNMET',{crew:T('crew'),names:unmet.map(c=>c.name).join(', ')}):''}${castLockCtx(lock)}`; }
// 아직 등장하지 않은 대원(실행 중 장·이벤트·톡의 AI 컨텍스트): 명단은 여기서, 지시문은 프롬프트 스튜디오의 CAST_LOCK_RULE
// "나중 등장" 대원은 정해진 장면이 없어 새 장을 쓸 때 흐름에 맞으면 첫 등장(debutResolve가 첫 등장 스테이지를 정해 잠금이 풀림)
function castLockCtx(lock){ if(!lock.length) return ''; const N=L=>L.map(c=>c.name).join(', '), fixed=lock.filter(c=>c.debut), later=lock.filter(c=>!c.debut);
  return `아직 만나지 않은 ${T('crew')} — ${fixed.length?`첫 등장 장면이 정해짐: ${N(fixed)}`:''}${fixed.length&&later.length?' / ':''}${later.length?`정해진 장면 없음: ${N(later)}`:''}\n${CAST_LOCK_RULE}\n`; }
const BESTIARY_SCHEMA='"bestiary":[{"name":"이 이야기에 새로 나온 적 이름 그대로(사람·캐릭터인 적 제외)","faction":"속한 적대·괴물 세력 이름","desc":"정체 한 문장","nature":"습성","weak":"약점"}]';
const FACTION_SCHEMA='[{"name":"","kind":"playable|hostile|neutral|monster","desc":"","goal":"","leader":"","base":"","ideology":"","secret":"","origin":"","nature":"","weakness":"","rel":{},"stance":[]}]';
// 오프닝·1장의 등장 계획 명단(지시문은 프롬프트 스튜디오의 CAST_PLAN_RULE — 프롤로그 = 처음부터 동료와의 첫 만남, 원안의 "첫 동료들과의 강렬한 만남")
function castPlanData(L){ const N=X=>X.map(c=>c.name).join(', '), st=L.filter(c=>!c.__deb&&!c.debutLater), d=L.filter(c=>c.__deb), lt=L.filter(c=>c.debutLater);
  return `등장 계획 — 처음부터 함께하는 동료: ${N(st)||'없음'}${d.length?' / 1장에서 처음 만나는 인물: '+d.map(c=>`${c.name}(${c.__deb}번째 스테이지)`).join(', '):''}${lt.length?' / 나중 등장: '+N(lt):''}\n${CAST_PLAN_RULE}`; }
/* src/main/0455-persona.js */
function personaBrief(c){ const p=c&&c.persona; if(!p) return ''; const a=[p.traits&&p.traits.length?'성격 '+p.traits.join('·'):'',p.self?'1인칭 '+p.self:'',p.call?'플레이어를 "'+p.call+'"(이)라 부름':'',p.ending?'어미 '+p.ending:'',p.quirk?'말버릇 '+p.quirk:'',p.gap?'반전 매력: '+p.gap:'',p.flaw?'약점: '+p.flaw:'']; return a.filter(Boolean).join(', '); }
/* src/main/0530-story-memory.js */
function smCodex(text,side){if(!text)return '';const query=String(text),words=[...new Set(query.match(/[가-힣A-Za-z0-9_]{2,}/g)||[])];const notes=G.world.codexNotes||{};
 const list=(G.world.codex||[]).filter(x=>!side||cxUnlocked(x.unlock)).map(x=>({x,score:(query.includes(x.title)?100:0)+words.reduce((n,w)=>n+(String(x.title+' '+x.body).includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);let used=0,out=[];
 for(const {x}of list.slice(0,20)){const body=String(x.body||'')+(notes['x:'+x.id]||[]).map(n=>'\n추가 기록: '+n.text).join('');const row='['+x.title+']\n'+body;if(used+row.length>SM_LIMITS.codex)continue;used+=row.length;out.push(row);}return out.length?'\n이번 장과 관련된 도감 기록(출처: 도감, 작가 확정 규칙과 충돌하면 규칙 우선):\n'+out.join('\n\n')+'\n':'';}
function storyMemo(){const all=G.chapters.filter(ch=>ch.kind==='main'),recent=all.slice(-SM_LIMITS.recent),older=all.slice(0,-SM_LIMITS.recent);let budget=0;const old=[];
 for(const ch of [...older].reverse()){const text=String(ch.memory?.brief||ch.summary||sysDigest(ch)).slice(0,SM_LIMITS.older),row=ch.title+': '+text;if(budget+row.length>12000)continue;budget+=row.length;old.unshift(row);}
 const rows=[...old,...recent.map(ch=>ch.title+':\n'+String(ch.memory?.text||ch.summary||sysDigest(ch)).slice(0,SM_LIMITS.summary))];
 const unresolved=older.filter(ch=>ch.memory?.unresolved).map(ch=>ch.title+': '+ch.memory.unresolved);let total=0;const carry=unresolved.filter(x=>{total+=x.length;return total<=8000;});
 const ev=G.chapters.filter(ch=>ch.kind==='event'&&ch.summary&&!loreOf(ch)).slice(-3).map(c=>c.title+': '+String(c.summary).slice(0,1000));
 return rows.length||ev.length?pf('SM_MEMO')+rows.join('\n\n')+(carry.length?'\n오래된 장의 미회수 사항:\n'+carry.join('\n'):'')+(ev.length?'\n최근 정사 외전:\n'+ev.join('\n'):'')+'\n':'';}
/* src/main/0160-free-chat.js */
function fcProgress(){ const st=(typeof mainStages==='function'?mainStages():[]).filter(s=>P().cleared[s.id]); return st.length?st.map(s=>s.code+' '+s.title).join(', '):'아직 이야기를 시작하지 않았다'; }
/* src/main/0450-relations-memory.js */
// 로어북: text에 이름이 나온 인물(+extra)의 관계를 골라요. 바로 닿은 관계 먼저, 남으면 한 다리 건너(마인드맵처럼)
function relCtx(text,extra,max){ const altOut=x=>{ const c=charById(x); return !!(c&&c.alt)&&!(extra||[]).includes(x); }, R=RELS().filter(r=>!altOut(r.a)&&!altOut(r.b)); max=Math.min(max||40,60); text=String(text||''); // 이격 전용 기록은 그 이격이 나올 때만 넣어요
  const hit=new Set((extra||[]).filter(Boolean)); relKeys().forEach(([ref,ks])=>{ if(ks.some(k=>k&&text.includes(k))) hit.add(ref); });
  if(!R.length){ return hit.size?pf('REL_NONE'):''; }
  const core=R.filter(r=>(hit.has(r.a)||r.a===REL_ME)&&(hit.has(r.b)||r.b===REL_ME)&&(hit.has(r.a)||hit.has(r.b)));
  const ring=R.filter(r=>!core.includes(r)&&(hit.has(r.a)||hit.has(r.b)));
  const pri=r=>r.sys?1:0, rows=[...core.sort((x,y)=>pri(x)-pri(y)),...ring.sort((x,y)=>pri(x)-pri(y))].slice(0,max); if(!rows.length&&!hit.size) return '';
  const meKnown=new Set(relOf(REL_ME).map(r=>relOther(r,REL_ME))), stranger=[...hit].filter(x=>x!==REL_ME&&relObj(x)&&!meKnown.has(x)&&!relOf(x).length);
  return pf('REL_CTX',{rows:smRelationRows(rows)||'(이번 인물들의 기록 없음)'})+(stranger.length?pf('REL_STRANGER',{names:stranger.map(x=>relName(x)).join(', ')}):''); }
const REL_SCHEMA=()=>`"relations":[{"a":"인물 이름","b":"인물 이름(플레이어는 ${T('player')})","kind":"관계 2~8자(예: 첫 만남, 동료, 라이벌, 스승과 제자, 짝사랑, 적대, 은인)","note":"지금 두 사람의 관계 1~2문장","event":"이번에 둘 사이에 있었던 일 한 줄"}]`;
function charSchema(slim){return `{"skills":${JSON.stringify(GGMCombat.promptExample({role:"atk"}))},"name":"짧은 이름","faction":"소속 세력","rarity":1~3 정수(3=SSR),"pos":"${POSITIONS().map(p=>p.name).join('|')}","range":"melee(근접)|ranged(원거리)|support(지원) — 무기·전투 방식에 맞게","persona":{"traits":["서로 다른 축의 성격 3개"],"self":"1인칭","call":"플레이어를 부르는 말","ending":"말끝·어미","quirk":"말버릇","catch":"이 캐릭터만 할 대표 대사","gap":"겉과 다른 반전 매력","flaw":"결점","want":"원하는 것","fear":"두려워하는 것","likes":[""],"dislikes":[""],"hobby":"","motif":"상징"},"pfields":{${PERSONA_CFG().tpl.map(k=>`"${k}":""`).join(',')}},"role":"atk|def|sup(포지션의 기본형)","elem":"${ELEMS.join('|')}",${slim?'':'"hp":800~3000(방어형은2280~2820),"atk":80~180,"def":35~160(방어형은122~151),"spd":80~125,'}"skill":{"name":"","kind":"dmg|aoe|heal|shield|buff",${slim?'':'"power":0.8~3.0,"cd":2~4,'}"desc":"한 줄"},"profile":"2~3문장","intro":"${T('gacha')} 연출 첫마디","lines":["로비 인사 대사 8개${CHAR_LINES_RULE}"],"affLines":{"4":["호감도 4부터 나오는 대사"],"7":["호감도 7부터"]},"lvLines":["${T('enhance')} 시 대사 2개"],"dupLines":["${T('limit')} 시 대사 1개"],"touch":{"head":["머리 터치 반응 4개"],"body":["몸 터치 시 당황하거나 놀리는 반응 4개"],"pet":["머리를 쓰다듬어 줄 때 반응 4개"]},"files":[{"dup":1,"text":"${T('limit')} 1단계에 공개되는 비밀 설정"},{"dup":3,"text":"3단계 비밀 설정, 메인 플롯과 연결"}],"weapon":{"name":"${T('weapon')} 이름","desc":"한 줄","prompt":"NovelAI 영어 태그, no humans, object focus로 시작해 simple background, white background로 끝"},"naiPrompt":"..."}`;}
// 요약이 없는 장의 기본 기억: 등장 인물과 스테이지 흐름
function sysDigest(ch){ const cast=new Set(); (ch.stages||[]).forEach(s=>stageCast(s,false).forEach(x=>cast.add(relName(x)))); return `${chLogline(ch)?chLogline(ch)+' ':''}등장: ${[...cast].slice(0,10).join(', ')||'없음'}. 흐름: ${ch.stages.map(s=>s.title).join(' → ')}`; }
/* src/main/0185-game-rules.js */
const POS_SCHEMA='"positions":[{"name":"포지션 이름(2~4자)","base":"atk|def|sup","range":"melee|ranged|support","desc":"기능 한 줄","t":{"hp":0,"atk":0,"def":0,"spd":0,"dmg":0,"taken":0,"heal":0,"crit":0,"sp":0,"threat":0}}]';
// 새 게임 세계관 단계의 반응 스키마 — 값의 뜻은 종류마다 다름(REACT_TYPES)
const REACT_SCHEMA='"reactions":[{"a":"속성","b":"다른 속성","name":"반응 이름","type":"amp|burst|stun|vuln","value":"amp는 피해 배율 1.2~2, burst는 공격력×값 0.5~2, stun은 기절 초 0.5~2, vuln은 받는 피해 +% 10~40"}]';
/* src/main/0488-stage-modes.js */
function stageWhat(s){ return s.story?' — 전투 없는 이야기 스테이지':STAGE_KIND[s.mode]?` — ${STAGE_KIND[s.mode]}. ${STAGE_WRITE_RULE}`:' — 전투 전(pre)과 전투 후(post)'; }
// 장의 마지막(클라이맥스) 스테이지 형식 — 세계관 단계가 장르에 맞게 고름(G.meta.story.finale). 지시문은 프롬프트 스튜디오의 FINALE_RULE, 값은 여기서
const FINALE_SCHEMA='"finale":"battle|contest|debate"';
/* src/main/0465-story-plan.js */
// 장 n(1부터)을 쓸 때 넘기는 설계 정보. 아직 밝히지 않을 반전은 "작가 전용"으로만 알려 줘요
function planCtx(n){ if(!planHas()) return ''; const p=PLAN(), act=planActOf(n), F=P().flags||{}, L=[];
  L.push(`\n【시나리오 설계 — 작가 전용, 대사로 그대로 말하지 않는다】${p.logline?' 로그라인: '+p.logline+'.':''}${p.theme?' 주제: '+p.theme+'.':''}${p.ending?' 목표 결말: '+p.ending+'.':''}`);
  if(act) L.push(`지금은 「${act.name}」(~${act.upto}장): ${act.goal}`);
  const now=p.twists.filter(t=>+t.reveal===n), later=p.twists.filter(t=>+t.reveal>n), clues=p.twists.flatMap(t=>(t.clues||[]).filter(c=>+c.ch===n).map(c=>({t,c})));
  if(clues.length) L.push(pf('PLAN_CLUES',{list:clues.map(({c})=>c.hint).join(' / ')}));
  if(now.length) L.push(pf('PLAN_REVEAL',{list:now.map(t=>`${t.truth}${t.who?' (관련: '+t.who+')':''}`).join(' / ')}));
  if(later.length) L.push('아직 밝히지 말 진실(이번 장에서는 숨기고 어긋나지 않게만): '+later.map(t=>t.truth).join(' / '));
  const done=p.branches.filter(b=>F[b.id]&&+b.at<n); if(done.length) L.push('플레이어가 고른 분기(이후 이야기에 반영): '+done.map(b=>{ const o=(b.options||[])[F[b.id].n-1]||{}; return `${b.question} → 「${o.label||F[b.id].label}」${o.result?': '+o.result:''}`; }).join(' / '));
  const here=p.branches.filter(b=>+b.at===n); if(here.length) L.push(pf('PLAN_BRANCH_HERE')+here.map(b=>`id=${b.id} 질문 「${b.question}」 보기 ${(b.options||[]).map(o=>o.label).join(' | ')}`).join(' / '));
  const arcs=p.arcs.filter(a=>a.name); if(arcs.length) L.push('캐릭터 아크(이번 장에서 조금씩 진행): '+arcs.map(a=>`${a.name}: ${a.start} → ${a.change} → ${a.end}`).join(' / '));
  if(p.notes) L.push('설계 메모: '+p.notes);
  return L.join('\n')+'\n'; }
/* src/main/0250-story-factory.js */
function newcRule(n,ev){ return n?pf('NEWC_RULE',{crew:T('crew'),n:n,cast:''/* 출연 성별 규칙은 RULES(rulesText)에 이미 — 두 번 넣지 않음 */,rarity:ev?pf('NEWC_RARITY_EVENT',{crew:T('crew')}):pf('NEWC_RARITY_MAIN'),player:T('player'),schema:charSchema(true),nai:NAI_CHAR}):'newCharacters는 빈 배열.'; }
function stageSchema(deep){ return `[{"title":"","battle":true,${deep?'"beats":["장면 5~9개. 장면마다 장소, 나오는 인물, 일어나는 일, 감정·관계 변화, 드러나는 정보를 한 문장으로"]':'"pre":"","post":""'},"enemies":[{"name":"","elem":"${ELEMS.join('|')}","boss":false,"look":"새 적이면 NovelAI 영어 외형 태그(괴물은 no humans로 시작)"}],"field":{"k":"이야기에 맞는 전장 규칙(선택): ${Object.keys(FIELDS).join('|')}","a":"resonance·suppress는 속성, role은 ${Object.keys(ROLE).join('|')}, home은 소속 이름, timed는 초"},${modeSchema()},${ROUTE_SCHEMA}}]`; }
const NPC_SCHEMA='"newNpcs":[{"name":"","role":"한 단어","profile":"1~2문장","speech":"말투 한 줄","naiPrompt":"NovelAI 영어 외형 태그. 1girl, solo 또는 1boy, solo로 시작"}]';
/* src/main/0487-formation-sortie.js */
// 생성기가 쓰는 경로 지점 이름 스키마·정리(1장(새 게임)과 2장 이후가 같이 씀)
const ROUTE_SCHEMA='"route":{"n1":"첫 교전 지점 이름","fork":"갈림길 상황 한 줄","a":"정면 길(강한 적) 이름","b":"우회 길(보급) 이름","boss":"최종 지점 이름"}';
/* src/main/0505-construct.js */
// 새 게임 세계관 단계의 바리에이션 결과 정리(엔진 GGMConstruct.variantsFrom + id). 지시문은 프롬프트 스튜디오의 VARIANT_RULE
// 새 게임 세계관 단계 스키마: 건조 메뉴·자원 이름(terms), 바리에이션 기본형
const CON_TERMS_SCHEMA='"construct":"자원을 넣어 새 동료를 데려오는 메뉴 이름(2~4자)","res1":"그 메뉴에 넣는 자원 1(2~4자, 세계관 고유)","res2":"자원 2","res3":"자원 3","res4":"자원 4(귀한 것 — 특별 의상·바리에이션의 열쇠)"';
const VARIANT_SCHEMA='"variants":[{"name":"바리에이션 기본형 이름(2~6자)","prompt":"그 의상의 영어 이미지 태그(쉼표로)","brief":"디자인 지시 한 줄","cond":{"roles":["atk|def|sup 중 어울리는 역할만"],"factions":["어울리는 소속만"],"elems":["어울리는 속성만"]}}]';
/* src/main/0275-expedition.js */
// 새 게임 세계관 단계의 원정 스키마(지시문은 프롬프트 스튜디오의 EXPEDITION_RULE, 이름을 적용하는 계산은 원정 엔진 GGMExpedition.fromWorld — 수치는 기본값, 이름만)
const EXPEDITION_SCHEMA='"expedition":"'+GGMExpedition.MODES.join('|')+'","expeditionNames":{"fame":"","jobs":[""]}';
/* src/main/0260-new-game-draft.js */
function drText(d){ d=d||DR2; const L=[];
  if(d.world.trim()) L.push('[세계관]\n'+d.world.trim());
  if(d.setting.trim()) L.push('[설정: 세력·용어·규칙·비밀]\n'+d.setting.trim());
  if(d.story.trim()) L.push('[스토리 개요]\n'+d.story.trim());
  const cs=d.chars.filter(c=>String(c.name||'').trim()||String(c.profile||'').trim());
  if(cs.length) L.push('[인물]\n'+cs.map((c,i)=>`${i+1}. ${c.name||'(이름 미정)'}${c.role?' — '+c.role:''} (구분: ${c.kind==='npc'?'NPC':(d.crewTerm||'동료')+(c.rank?', 등급 '+RL[c.rank]:'')})\n   성격·과거·관계: ${c.profile||'(비어 있음)'}\n   말투: ${c.speech||'(비어 있음)'}\n   외모: ${c.look||'(비어 있음)'}`).join('\n'));
  const hr=d.hero; if(hr.name||hr.call||hr.gender||hr.look||hr.bio) L.push(`[주인공]\n호칭: ${hr.call||'(AI가 정함)'}\n이름: ${hr.name||'(호칭으로만 부름)'}\n성별·성 정체성: ${hr.gender||'정하지 않음'}\n외모: ${hr.look||'(비어 있음)'}\n설정: ${hr.bio||'(비어 있음)'}`);
  return L.join('\n\n'); }
// 초안의 다른 칸을 함께 보여 줘서 서로 맞춰 다듬어요(skip: 'world'|'setting'|'story'|'c:번호')
function drCtx(skip){ const d=DR2, L=[];
  const th=drTheme(d).map(x=>x.startsWith('2차 창작')?x+pf('DR_SOURCE'):x);
  if(th.length) L.push('[테마]\n'+th.join('\n'));
  if(skip!=='world'&&d.world.trim()) L.push('[세계관]\n'+d.world.trim().slice(0,6000));
  if(skip!=='setting'&&d.setting.trim()) L.push('[설정: 세력·용어·규칙·비밀]\n'+d.setting.trim().slice(0,4000));
  if(skip!=='story'&&d.story.trim()) L.push('[스토리 개요]\n'+d.story.trim().slice(0,3000));
  const cs=d.chars.map((c,i)=>[c,i]).filter(([c,i])=>skip!=='c:'+i&&(String(c.name||'').trim()||String(c.profile||'').trim()));
  if(cs.length) L.push('[다른 인물]\n'+cs.map(([c])=>`- ${c.name||'(이름 미정)'}${c.role?' — '+c.role:''}: ${String(c.profile||'').slice(0,300)}${c.speech?' / 말투: '+c.speech:''}${c.look?' / 외모: '+c.look:''}`).join('\n'));
  const hr=d.hero; if(skip!=='hero'&&(hr.name||hr.call||hr.gender||hr.look||hr.bio)) L.push(`[주인공(플레이어)]\n호칭: ${hr.call||'(미정)'} / 이름: ${hr.name||'(미정)'} / 성별: ${hr.gender||'정하지 않음'}${hr.look?' / 외모: '+hr.look:''}${hr.bio?'\n설정: '+hr.bio:''}`);
  return L.length?pf('DR_OTHER')+L.join('\n\n')+'\n':''; }
function drTheme(d){ return [d.gtitle&&'게임 이름: '+d.gtitle,d.kw&&'장르·키워드: '+d.kw,d.tone&&!dupTxt(d.kw,d.tone)&&'분위기: '+d.tone,d.fan&&d.src&&'2차 창작 원작: '+d.src].filter(Boolean); }
/* src/main/0300-codex.js */
function cxProgressText(){ const st=mainStages(), done=st.filter(s=>P().cleared[s.id]); return done.length?`플레이어가 지금까지 깬 스테이지: ${done.map(s=>s.code+' '+s.title).join(', ')}`:'플레이어는 아직 스토리를 시작하지 않았다'; }
/* src/modules/combat/060-generation.js */
function v2PalettePrompt(){
 return pf('SKILL_PALETTE',{v2ElemNames:v2ElemNames(),fxColors:JSON.stringify(GGMCombat.FX_COLORS)});
}
function v2DesignContext(c,concept,base){
 const C=GGMCombat;
 return {character:{name:c.name,role:C.aiRole(c),profile:c.profile,appearance:c.naiPrompt,appearanceTags:c.naiPrompt||'',appearanceDescription:c.appearance||'',intro:c.intro||'',weapon:c.weapon?{name:c.weapon.name,description:c.weapon.desc}:null,specialty:C.isHealer(c)?'치유·보호를 담당하는 힐러':'현재 역할',concept:concept.trim()||'현재 캐릭터 설정에 맞게 결정'},generation:C.generation(c),effectLimits:C.aiLimits(c),powerBudgets:C.GENERATIONS[C.generation(c)],savedSkills:Object.fromEntries(Object.entries(C.SLOTS).map(([slot])=>[slot,{name:base[slot].name,effects:base[slot].effects.map(e=>e.type)}]))};
}
function v2SlotPrompt(c,slot,concept,base,feedback){
 const C=GGMCombat,menu=v2DesignMenu(c,slot),recipe=Object.keys(menu)[0];
 return `${pf('SKILL_SLOT_DESIGN',{slots:C.SLOTS[slot],fxTypes:JSON.stringify(C.FX_TYPES),v2ElemNames:v2ElemNames(),v2PalettePrompt:v2PalettePrompt(),menu:JSON.stringify(menu),v2DesignContext:JSON.stringify(v2DesignContext(c,concept,base)),feedback:feedback?'직전 실패를 수정하세요: '+feedback:''})}JSON만 출력: {"plan":{"theme":"컨셉","role":"주역할","nameReason":"이름과 능력이 캐릭터 모티프에 맞는 이유"},"skill":{"name":"컨셉에 맞는 이름","recipe":"${recipe}","extras":[],"fx":"컨셉에 맞는 지원 이펙트 이름","paletteDesign":{"theme":"시각 테마","primary":{},"secondary":{},"accent":{}},"power":100,"trigger":"${c.role==='def'?'on_hit':'after_basic'}","triggerEvery":4,"target":"${slot==='ultimate'&&c.role==='sup'&&C.generation(c)>=2?'allies':'enemy'}"}}`;
}
/* src/main/0050-default-content.js */
const FACE_TAGS={calm:'calm, relaxed, closed mouth, soft eyes',smile:'gentle smile, closed mouth, happy',teary:'teary eyes, trembling lips, about to cry, sad',happy:'smile, happy',laughing:'laughing, open mouth, closed eyes',playful:'smile, playful, one eye closed',sad:'sad, frown, teary eyes',angry:'angry, frown, clenched teeth',surprised:'surprised, open mouth, wide-eyed',embarrassed:'embarrassed, blush, wavy mouth',shy:'shy, blush, looking away',smug:'smug, smirk, half-closed eyes',worried:'worried, frown, sweat',determined:'determined, serious, v-shaped eyebrows',thinking:'thinking, hand on own chin',nervous:'nervous, sweatdrop, awkward smile',irritated:'annoyed, frown, pout',tired:'tired, half-closed eyes, sigh',love:'heart-shaped pupils, blush, smile',neutral:'expressionless, closed mouth',hurt:'pain, wince, teary eyes'};
/* 불러올 때 계산하던 견본(기능 데이터 CHARM·PROFILE_TPLS를 씀)은 쓸 때 만드는 함수로 — 스튜디오가 기능 파일보다 먼저 돌아서 */
/* src/main/0488-stage-modes.js */
function modeSchema(){ return `"mode":"battle|debate|contest","debate":{"opponent":"상대 이름","goal":"이 회담의 목표","evidence":[{"id":"e1","name":"","desc":""}],"rounds":[{"claim":"상대 주장 요약","lines":[{"text":"상대의 말","press":"추궁하면 나오는 대답","weak":"모순을 밝히는 증거 id 또는 빈칸","persuade":{"who":"","text":""}}]}],"win":"","lose":""},"contest":{"title":"","judges":[{"name":"","likes":"${Object.keys(CHARM).join('|')}"}],"rounds":3,"rivals":[{"name":"","power":1}]}`; }
function finaleRule(){ return `이 게임의 finale: ${storyCfg().finale}. ${FINALE_RULE}`; }
/* src/main/0455-persona.js */
function profileTplSchema(){ return '"profileTemplate":"'+Object.keys(PROFILE_TPLS).join('|')+'"'; } // 새 게임 세계관 단계 스키마
/* src/main/0020-ai-connect.js · 0030-character-regen.js — 그림 설정 기본값 중 프롬프트 태그(설정 창에서 바꾸는 기본값: 종류별 덧붙임·제외 태그, 기본 제외 태그, ComfyUI 품질·제외 태그, 투명 배경 태그) */
const NAI_PARTS_DEF={char:{suffix:'simple background, white background',neg:'gradient background, cast shadow, drop shadow, floor'},enemy:{suffix:'full body, simple background, white background',neg:'text, gradient background, cast shadow, drop shadow, floor'},bg:{suffix:'no humans, scenery, detailed background',neg:'people, character, text'},prop:{suffix:'no humans, object focus, simple background, white background',neg:'people, character, text'},cg:{suffix:'detailed background, cinematic lighting',neg:'text, speech bubble, multiple views'},illust:{suffix:'detailed background, depth of field, cinematic lighting',neg:'simple background, white background, transparent background, multiple views, text'},lbcg:{suffix:'detailed background, cinematic lighting, dramatic angle, light particles, depth of field, masterpiece illustration',neg:'simple background, white background, transparent background, multiple views, text'},map:{suffix:'no humans, scenery, map, from above, top-down view, detailed, game map',neg:'people, character, text, watermark, frame'},icon:{suffix:'no humans, game item icon, single object, object focus, centered, simple background, white background',neg:'text, people, character, frame, border, multiple views'}};
const NAI_NEG_DEF='lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
const COMFY_TAGS_DEF={qtags:'masterpiece, best quality, amazing quality',neg:'lowres, bad anatomy, worst quality, low quality, watermark, text'};
const TP_BG_TAG='transparent background';
// 그림체 프리셋. 불러오면 설정 창의 칸이 채워지고, 저장을 눌러야 적용돼요.
// 숫자로 끝나는 태그(fungi542 등)는 ' ::'처럼 띄어 써야 NovelAI가 가중치로 착각하지 않아요.
const STYLE_PRESETS=[{id:'glossy',name:'닭장 그림체',by:'토스뱅킹',desc:'광택 있는 피부·의상, 진한 명암, 높은 밀도. V4.5·V5 권장',
  tags:'0.5::freng::, 0.3::artist:ramanda::, 0.3::modare::, 0.8::ie (raarami)::, 0.3::yoneyama mai::, 0.3::mochizuki kei::, 0.3::fungi542 ::, 0.2::re0n::, 0.5::blue gk::, 0.8::artist:mx2j::, artist:thirty 8ight, 0.4::fantongjun::, 0.2::aoi nagisa (metalder)::, 1.2::taesi::, year 2025, -1::multiple views::, -1::flat color::, -1::monochrome::, -3::simple illustration::, 1.2::best quality, amazing quality, very aesthetic, highres, absurdres, no text, masterpiece, ultra-detailed::, ultra complexity, high complexity',
  qtags:'',
  neg:'logo, cartoon, flat color, spot color, watermark, too many watermarks, blank page, text-only page, reference, username, signature, artist:xinzoruo, artist:milkpanda, artist collaboration, variant set, large variant set, 4koma, 2koma, toon (style), oekaki, chibi, turnaround, film grain, dithering, halftone, screentones, dated, old, 1990s (style), mutation, deformed, distorted, disfigured, artistic error, distorted anatomy, anatomical structure error, asymmetrical face, unnatural hair, bad eyes, cloudy eyes, blank eyes, bad proportions, bad limb, bad hands, extra hands, bad hand structure, extra digits, fewer digits, bad legs, extra legs, amputee, distorted composition, bad perspective, multiple views, negative space, animation error, chromatic aberration, disorganized colors, scan artifacts, jpeg artifacts, vertical lines, vertical banding, worst quality, bad quality, lowres, blurry, upscaled, fewer details, unfinished, incomplete, amateur, cheesy, unsatisfactory, inadequate, deficient, subpar, poor, displeasing, very displeasing, bad illustration, bad portrait, limited palette, bad anatomy, monochrome, official style',
  steps:23,scale:4.8,sampler:'k_euler_ancestral',cfgRescale:0.18},
  {id:'thickline',name:'쫀득 그림체',by:'톡마햄',desc:'굵은 선화, 점 코, 높은 밀도와 배경 묘사. V4.5·V5 권장',
  tags:'0.7::artist:rusellunt::, 0.55::artist:rehu_(astd5787)::, 0.55::artist:kakure_eria::, 0.55::artist:reagan_long::, 0.55::artist:hitobashira_(1746164306)::, 0.55::artist:ebora::, 0.6::artist:xipa::, 0.6::artist:sparrowl::, year 2025, year 2026, newest, -3::artist collaboration::, -2::simple illustration::, -2::monochrome, green theme, yellow theme::, -2::watercolor (medium), painterly, no lineart::, -2::official style, official art::, -2::flat color::, -1::dark areolae::, -1::breasts apart::, 1.5::high complexity::, masterpiece, best quality, very aesthetic, absurdres, expert shading, high detail, thick lineart, dot nose, detailed background',
  qtags:'',
  neg:'negative space, blank page, text, logo, watermark, too many watermarks, reference, signature, artist name, subtitles, captions, dated, chibi, artistic error, scan artifacts, jpeg artifacts, aliasing, film grain, heavy film grain, dithering, chromatic aberration, digital dissolve, halftone, screentone, artist:xinzoruo, artist:milkpanda, artist:kurukurumagical, artist collaboration, one-hour drawing challenge, 4koma, 2koma, mutated, mutation, deformed, distorted, disfigured, bad anatomy, unnatural hair, bad face, mob face, cloned face, distorted face, poorly drawn face, ugly, bad eyes, empty eyes, extra eyes, lazy eye, asymmetrical eyes, cross-eyed, bad proportions, wrong body proportions, unrealistic proportions, distorted body, long neck, wrong head size, bad limbs, missing limbs, extra limbs, amputee, bad arm, bad hands, malformed hands, poorly drawn hands, bad hand structure, extra digits, fewer digits, extra fingers, fused fingers, bad leg, extra leg, distorted composition, bad perspective, multiple views, disorganized colors, unrealistic colors, unfinished, incomplete, displeasing, very displeasing, unsatisfactory, inadequate, deficient, subpar, poor, blurry, lowres, duplicate, worst quality, bad quality, messy details, fewer details, bad portrait, bad illustration, awkward, bad posture, horse penis, ear blush, red ears, heart-shaped pupils',
  steps:28,scale:5,sampler:'k_euler_ancestral',cfgRescale:0.4}];
/* src/main/0010-rules.js에서 옮김 */
function genderText0(){ const g=P().gender; return pf(g==='m'?'PLAYER_MALE':g==='f'?'PLAYER_FEMALE':'PLAYER_GENDER_OPEN',{player:T('player')}); }
function callText(){ const n=String(P().player||'').trim(), t=T('player'); return pf(n&&n!==t?'CALL_NAME':'CALL_TERM',{crew:T('crew'),call:t,name:n}); }
function castRule(k){ k=k==null?((typeof G!=='undefined'&&G&&G.meta&&G.meta.castSex)||''):k; return k==='f'?pf('CAST_SEX_F'):k==='m'?pf('CAST_SEX_M'):k==='mix'?pf('CAST_SEX_MIX'):''; }
function rulesText(){const tone=String((G.meta&&G.meta.tone)||'').trim();return genderText()+callText()+castRule()+pf('COMMON_RULES',{tone:tone?pf('TONE_RULE',{tone}):'',player:T('player'),currency:T('currency'),gacha:T('gacha'),ops:T('ops'),abyss:T('abyss'),crew:T('crew'),talk:T('talk'),elems:ELEMS.join(', ')+(elemLine()?` (${elemLine()})`:'')});}
// 이미 만든 이벤트 소재를 알려 줘서 같은 얘기를 또 하지 않게 해요
function evPastHint(skip){ const L=(G.events||[]).filter(e=>e&&e.id!==skip).slice(-12).map(e=>`${e.title}${e.desc?'('+String(e.desc).slice(0,40)+')':''}`); return L.length?pf('EV_PAST',{list:L.join(' / ')}):''; }
/* src/main/0250-story-factory.js에서 옮김 */
function npcRule(noNew){ const ns=G.npcs||[]; return `${ns.length?pf('NPC_RULE',{npcs:ns.map(n=>n.name).join(', ')}):''}`+(noNew?'':pf('NPC_NEW_RULE',{crew:T('crew')})); }
function talkOnlyRule(n){ const k=storyCfg().talkOnly; if(!k||n<3) return pf('TALK_ALL_BATTLE'); const m=k>=3?Math.floor(n/2):Math.min(k,n-2); return pf('TALK_ONLY_RULE',{m,finale:''}).trim(); } // 장 마지막 형식(finaleRule)은 장·이벤트 요청이 한 번만 넣음
/* src/main/0290-season-rotation.js에서 옮김 */
function enemyReuseHint(){ const L=[...new Set(G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId&&(l.prompt||l.img)).map(l=>l.name))].slice(-40); return L.length?pf('ENEMY_REUSE',{L:L.join(', ')}):''; }
/* src/main/0530-story-memory.js에서 옮김 */
function smNotes(side){if(side)return '';const notes=String(smState().notes||'');return notes?pf('SM_NOTES')+notes+'\n':'';}
