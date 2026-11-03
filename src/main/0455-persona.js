/* ===== 캐릭터 개성·매력: 개성 시트 · 프로필 템플릿 · 개성 검수 · AI 생성/다듬기 · 인연 톡 · 메모리얼 ===== */
/* c.persona = {traits[],self,call,ending,quirk,catch,gap,flaw,want,fear,likes[],dislikes[],hobby,motif}  (말투·성격·매력 포인트)
   c.pfields = {라벨:값}  (게임마다 고르는 프로필 템플릿: 생일·신장·출신 …)
   c.memorial = {lv,title,script,lines[]}  (호감도 lv에서 열리는 메모리얼 장면 + 메모리얼 로비 대사)
   인연 톡 = G.threads의 trigger {type:'aff',value:n} (기존 메신저 그대로)
   설정: G.meta.persona = {tpl:[라벨…], affLv:[2,4,6,8], memoLv:8}. 문서: docs/research/character.md */
const PERSONA_FIELDS=[['traits','핵심 성격 (3개)','list'],['self','1인칭','text'],['call','플레이어를 부르는 말','text'],['ending','말끝·어미 (예: ~거든, ~해요)','text'],['quirk','말버릇','text'],['catch','대표 대사','text'],
  ['gap','반전 매력','text'],['flaw','결점·약점','text'],['want','원하는 것','text'],['fear','두려워하는 것','text'],['likes','좋아하는 것','list'],['dislikes','싫어하는 것','list'],['hobby','취미','text'],['motif','상징 (모티프)','text']];
const PROFILE_TPLS={basic:['생일','신장','출신','특기'],org:['소속','직책','생일','신장','출신','특기'],operator:['코드네임','출신','생일','신장','전투 경력','특기','임상 소견'],fantasy:['종족','출신','생일','신장','계약','특기'],idol:['소속사','데뷔','생일','신장','담당','팬덤 이름'],streamer:['활동명','플랫폼','데뷔','구독자 애칭','방송 장르','생일']};
const PROFILE_TPL_SCHEMA='"profileTemplate":"'+Object.keys(PROFILE_TPLS).join('|')+'"'; // 새 게임 세계관 단계 스키마
const PERSONA_GENERIC=/^(친절|상냥|착함|착한|밝음|밝은|명랑|쿨|쿨함|차가움|차가운|귀여움|귀여운|활발|활발함|성실|성실함|다정|다정함|조용|조용함|무뚝뚝|츤데레|냉정|냉정함|따뜻함|강함|용감|용감함|똑똑함|진지함)$/;
function PERSONA_CFG(){ const d={tpl:PROFILE_TPLS.basic,affLv:[2,4,6,8],memoLv:8}; return Object.assign(d,G.meta.persona||{}); }
const pStrs=v=>(Array.isArray(v)?v:String(v||'').split(/[,，·/]/)).map(x=>String(x||'').trim()).filter(Boolean).slice(0,8);
function personaClean(p){ p=p&&typeof p==='object'?p:{}; const o={}; for(const [k,,t] of PERSONA_FIELDS){ const v=t==='list'?pStrs(p[k]):String(p[k]||'').trim().slice(0,80); if(t==='list'?v.length:v) o[k]=v; } return o; }
function pfieldsClean(f){ const o={}; Object.entries(f&&typeof f==='object'?f:{}).slice(0,16).forEach(([k,v])=>{ k=String(k).trim().slice(0,16); v=String(v||'').trim().slice(0,80); if(k&&v) o[k]=v; }); return o; }
function personaBrief(c){ const p=c&&c.persona; if(!p) return ''; const a=[p.traits&&p.traits.length?'성격 '+p.traits.join('·'):'',p.self?'1인칭 '+p.self:'',p.call?'플레이어를 "'+p.call+'"(이)라 부름':'',p.ending?'어미 '+p.ending:'',p.quirk?'말버릇 '+p.quirk:'',p.gap?'반전 매력: '+p.gap:'',p.flaw?'약점: '+p.flaw:'']; return a.filter(Boolean).join(', '); }
const affThreads=c=>G.threads.filter(t=>t.charId===c.id&&t.trigger&&t.trigger.type==='aff');

/* 개성 검수: 점수(0~100)와 고칠 점. 빠진 항목·흔한 성격·다른 캐릭터와 겹침·대사에 말투가 안 드러남·호감도 콘텐츠 */
function personaReview(c){ const p=c.persona||{}, issues=[], add=(w,k,msg)=>issues.push({w,k,msg});
  const core=[['traits',12],['ending',10],['gap',10],['flaw',8],['want',6],['catch',6],['self',5],['quirk',5],['likes',4],['fear',4],['dislikes',2],['hobby',2],['motif',2],['call',2]];
  core.forEach(([k,w])=>{ const v=p[k]; if(!(Array.isArray(v)?v.length:v)) add(w,k,`${(PERSONA_FIELDS.find(f=>f[0]===k)||[])[1]} 없음`); });
  if((p.traits||[]).length&&p.traits.every(t=>PERSONA_GENERIC.test(t.replace(/\s/g,'')))) add(8,'traits','성격 키워드가 흔해요(예: 밝음·친절). 구체적인 습관이나 반전 매력과 짝지으세요');
  const others=G.chars.filter(x=>x!==c&&!x.alt&&x.persona);
  others.forEach(x=>{ const q=x.persona; if(p.ending&&q.ending&&p.ending===q.ending&&(p.self||'')===(q.self||'')) add(8,'ending',`말투(1인칭·어미)가 ${x.name}와(과) 같아요`);
    const A=new Set(p.traits||[]), B=new Set(q.traits||[]); if(A.size&&B.size){ const inter=[...A].filter(t=>B.has(t)).length; if(inter/Math.min(A.size,B.size)>=.67) add(6,'traits',`성격이 ${x.name}와(과) 많이 겹쳐요`); }
    if(p.catch&&q.catch&&p.catch===q.catch) add(5,'catch',`대표 대사가 ${x.name}와(과) 같아요`); });
  const toks=[...String(p.ending||'').split(/[,/·]/),p.quirk,p.catch].map(s=>String(s||'').replace(/[~…."'「」]/g,'').trim()).filter(s=>s.length>=1), lines=(c.lines||[]).concat(Object.values(c.affLines||{}).flat());
  if(toks.length&&lines.length>=3&&!lines.some(l=>toks.some(t=>String(l).includes(t)))) add(8,'lines','대사에 말투(어미·말버릇·대표 대사)가 드러나지 않아요');
  if((c.lines||[]).length<4) add(4,'lines','평소 대사가 적어요(4개 이상 권장)');
  if(!affThreads(c).length) add(6,'afftalk','호감도에 따라 열리는 인연 톡이 없어요');
  if(!c.memorial||!c.memorial.script) add(4,'memorial','메모리얼이 없어요');
  if(!(c.episodes||[]).length) add(3,'episode','인연 스토리(에피소드)가 없어요');
  const score=Math.max(0,Math.round(100-issues.reduce((a,x)=>a+x.w,0)));
  return {score,issues,grade:score>=85?'S':score>=70?'A':score>=55?'B':score>=40?'C':'D'}; }

/* AI: 개성 채우기·다듬기(mode fill|improve), 대사도 말투에 맞게 다시 쓰기(lines) */
async function personaAI(c,mode='fill',opt={}){
  const cfg=PERSONA_CFG(), others=G.chars.filter(x=>x!==c&&!x.alt&&x.persona).slice(0,12).map(x=>`${x.name}: ${personaBrief(x)}`).join(' / ');
  const r=await aiJSON(`${RULES}\n${ctx()}\n\n${T('crew')} 「${c.name}」(${RL[c.rarity]}, ${c.faction||'무소속'}, ${c.elem}, ${(posOf(c)||{}).name||ROLE[c.role]})의 개성 시트를 ${mode==='improve'?pf('PERSONA_IMPROVE'):pf('PERSONA_FILL')}.
프로필: ${String(c.profile||'').slice(0,500)}
지금 개성: ${JSON.stringify(c.persona||{})}
지금 대사: ${(c.lines||[]).slice(0,6).join(' / ')}
다른 ${T('crew')}(말투·성격이 겹치지 않게): ${others||'없음'}
${opt.instruction?'추가 지시: '+opt.instruction+'\n':''}규칙: 핵심 성격 3개는 서로 다른 축(겉모습·속마음·행동 습관). 반전 매력은 겉과 반대되는 의외의 면(약점이 드러나는 순간). 1인칭·어미·말버릇은 짧고 다른 캐릭터와 겹치지 않게. 대표 대사는 그 캐릭터만 할 법한 한 줄.
${opt.lines?'lines는 이 말투로 다시 쓴 평소 대사 5개. affLines는 호감도 3·5·8에서 나올 대사.':''}
JSON만 출력: {"persona":{"traits":["","",""],"self":"","call":"","ending":"","quirk":"","catch":"","gap":"","flaw":"","want":"","fear":"","likes":[""],"dislikes":[""],"hobby":"","motif":""},"pfields":{${cfg.tpl.map(k=>`"${k}":""`).join(',')}}${opt.lines?',"lines":["5개"],"affLines":{"3":[""],"5":[""],"8":[""]}':''}}`,opt.btn||null,'default');
  if(!r||!r.persona) return false;
  c.persona=Object.assign({},mode==='fill'?personaClean(r.persona):{},mode==='fill'?personaClean(c.persona):{},mode==='improve'?personaClean(r.persona):{});
  c.pfields=Object.assign({},pfieldsClean(r.pfields),mode==='fill'?pfieldsClean(c.pfields):{});
  if(opt.lines){ const L=strs(r.lines); if(L.length>=3) c.lines=L.slice(0,12); if(r.affLines&&typeof r.affLines==='object'){ const a={...(c.affLines||{})}; Object.entries(r.affLines).forEach(([k,v])=>{ const n=parseInt(k,10); if(n>=1&&n<=10&&strs(v).length) a[n]=strs(v).slice(0,4); }); c.affLines=a; } }
  mark('c:'+c.id); return true; }
async function personaAIReview(c,btn){ const r=await aiJSON(`${pf('PERSONA_REVIEW',{RULES,ctx:ctx(),crew:T('crew'),name:c.name,profile:String(c.profile||'').slice(0,500),persona:JSON.stringify(c.persona||{}),lines:(c.lines||[]).slice(0,8).join(' / ')})}JSON만 출력: {"score":0~100,"strengths":["2~3개"],"weaknesses":["2~3개"],"suggestions":["바로 고칠 수 있는 구체적인 제안 3개"]}`,btn,'quick'); if(!r) return null; c.personaAIReview={at:Date.now(),score:Math.max(0,Math.min(100,+r.score||0)),strengths:strs(r.strengths).slice(0,4),weaknesses:strs(r.weaknesses).slice(0,4),suggestions:strs(r.suggestions).slice(0,5)}; mark('c:'+c.id); return c.personaAIReview; }

/* 인연 톡: 호감도 단계마다 메신저 대화(모모톡처럼 관계가 깊어지는 흐름) */
async function talkAffGen(c,btn){ const cfg=PERSONA_CFG(), have=new Set(affThreads(c).map(t=>+t.trigger.value)), levels=cfg.affLv.filter(l=>!have.has(+l)); if(!levels.length){ toast('이미 모든 단계의 인연 톡이 있어요'); return 0; }
  const r=await aiJSON(`${pf('AFF_TALK',{RULES,ctx:ctx(),crew:T('crew'),name:c.name,talk:T('talk'),levels:levels.join(', '),personaBrief:personaBrief(c),profile:String(c.profile||'').slice(0,300),THREAD_FMT})}JSON만 출력: {"threads":[{"lv":${levels[0]},"title":"알림에 뜰 짧은 제목","script":"대화"}]}`,btn,'default');
  const L=(r&&Array.isArray(r.threads)?r.threads:[]).filter(x=>x&&x.script&&levels.includes(+x.lv)); let n=0;
  for(const x of L){ const th={id:uid(),charId:c.id,title:String(x.title||'메시지').slice(0,30),trigger:{type:'aff',value:+x.lv},needOwn:true,script:String(x.script)}; G.threads.push(th); mark('t:'+th.id); n++; }
  if(n) checkTriggers(true); return n; }
/* 메모리얼: 호감도 memoLv에서 열리는 특별 장면 + 메모리얼 로비 대사 */
async function memorialGen(c,btn){ const cfg=PERSONA_CFG(); const r=await aiJSON(`${pf('MEMORIAL',{RULES,ctx:ctx(),crew:T('crew'),name:c.name,memoLv:cfg.memoLv,personaBrief:personaBrief(c),profile:String(c.profile||'').slice(0,300),SCRIPT_FMT})}JSON만 출력: {"title":"메모리얼 제목","script":"대본","lines":["4개"]}`,btn,'default'); if(!r||!r.script) return false;
  c.memorial={lv:+cfg.memoLv||8,title:String(r.title||'메모리얼').slice(0,30),script:String(r.script),lines:strs(r.lines).slice(0,6)}; mark('c:'+c.id); return true; }
function memoOpen(c){ const o=own(c.id); return !!(c.memorial&&c.memorial.script&&o&&affLv(o)>=(+c.memorial.lv||8)); }
function memoOn(c){ return !!((P().memoOn||{})[c.id]&&memoOpen(c)); }
function memoCheck(c,before,after){ if(c&&c.memorial&&before<(+c.memorial.lv||8)&&after>=(+c.memorial.lv||8)) setTimeout(()=>toast(`✦ ${c.name}의 메모리얼 「${c.memorial.title}」이(가) 열렸어요`),1200); }

/* 화면: 캐릭터 정보 탭 · 개성 편집 · 일괄 검수 */
function personaHTML(c){ if(!c||c.npc) return ''; const p=c.persona||{}, rv=personaReview(c), at=affThreads(c), o=own(c.id), lv=o?affLv(o):0, chip=v=>`<span class="chip" style="font-size:.78rem">${esc(v)}</span>`, f=c.pfields||{}, ai=c.personaAIReview;
  return `<h3 class="sec">개성 <span class="badge">${rv.grade} ${rv.score}</span></h3>
  ${Object.keys(f).length?`<div class="g2" style="font-size:.85rem">${Object.entries(f).map(([k,v])=>`<div><span class="muted">${esc(k)}</span> ${esc(v)}</div>`).join('')}</div>`:''}
  ${(p.traits||[]).length?`<div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0">${p.traits.map(chip).join('')}</div>`:''}
  <div style="font-size:.85rem;line-height:1.6">${[['말투',[p.self&&'1인칭 '+p.self,p.ending&&'어미 '+p.ending,p.quirk&&'말버릇 '+p.quirk,p.call&&'부르는 말 '+p.call].filter(Boolean).join(' · ')],['대표 대사',p.catch&&`「${p.catch}」`],['반전 매력',p.gap],['약점',p.flaw],['원하는 것',p.want],['두려운 것',p.fear],['좋아함',(p.likes||[]).join(', ')],['싫어함',(p.dislikes||[]).join(', ')],['취미',p.hobby],['상징',p.motif]].filter(([,v])=>v).map(([k,v])=>`<div><span class="muted">${k}</span> ${esc(v)}</div>`).join('')||'<p class="muted">아직 개성 시트가 없어요.</p>'}</div>
  ${rv.issues.length?`<details style="margin:6px 0"><summary class="muted" style="font-size:.82rem">검수: 고칠 점 ${rv.issues.length}개</summary><ul style="margin:4px 0;padding-left:18px;font-size:.82rem">${rv.issues.map(x=>`<li>${esc(x.msg)}</li>`).join('')}</ul></details>`:''}
  ${ai?`<details style="margin:6px 0"><summary class="muted" style="font-size:.82rem">AI 평가 ${ai.score}점</summary><div style="font-size:.82rem"><b>장점</b> ${ai.strengths.map(esc).join(' / ')}<br><b>약점</b> ${ai.weaknesses.map(esc).join(' / ')}<br><b>제안</b> ${ai.suggestions.map(esc).join(' / ')}</div></details>`:''}
  <div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0"><button class="btn sm ghost" data-act="psedit" data-id="${c.id}">개성 편집</button><button class="btn sm ghost" data-act="psai" data-id="${c.id}" data-k="fill">AI로 채우기</button><button class="btn sm ghost" data-act="psai" data-id="${c.id}" data-k="improve">AI로 다듬기(+대사)</button><button class="btn sm ghost" data-act="psreview" data-id="${c.id}">AI 매력 평가</button></div>
  <h3 class="sec">인연 톡 · 메모리얼</h3>
  <p class="muted" style="font-size:.82rem;margin:0 0 6px">호감도 ${PERSONA_CFG().affLv.join('·')}에서 ${esc(T('talk'))}이 오고, ${c.memorial?`호감도 ${c.memorial.lv}에서 메모리얼이 열려요`:'메모리얼을 만들면 높은 호감도에서 열려요'}. 지금 호감도 Lv.${lv||'-'}</p>
  <div style="font-size:.85rem">${at.length?at.sort((a,b)=>a.trigger.value-b.trigger.value).map(t=>`<div>Lv.${t.trigger.value} 「${esc(t.title)}」 ${P().inbox[t.id]?'<span class="muted">받음</span>':'<span class="muted">잠김</span>'}</div>`).join(''):'<p class="muted" style="margin:0">아직 인연 톡이 없어요.</p>'}
  ${c.memorial?`<div style="margin-top:4px">✦ 메모리얼 「${esc(c.memorial.title)}」 ${memoOpen(c)?'<span class="badge">열림</span>':`<span class="muted">호감도 ${c.memorial.lv}에서 열림</span>`}</div>`:''}</div>
  <div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0"><button class="btn sm ghost" data-act="pstalk" data-id="${c.id}">AI로 인연 톡 만들기</button><button class="btn sm ghost" data-act="psmemo" data-id="${c.id}">${c.memorial?'메모리얼 다시 만들기':'AI로 메모리얼 만들기'}</button>${c.memorial&&(memoOpen(c)||!playMode())?`<button class="btn sm ghost" data-act="psmemoplay" data-id="${c.id}">메모리얼 보기</button>`:''}${memoOpen(c)?`<button class="btn sm${memoOn(c)?'':' ghost'}" data-act="psmemolobby" data-id="${c.id}">메모리얼 로비 ${memoOn(c)?'끄기':'켜기'}</button>`:''}</div>`; }
function openPersona(cid){ const c=charById(cid); if(!c) return; const p=c.persona||{}, cfg=PERSONA_CFG(), f=c.pfields||{}, keys=[...new Set([...cfg.tpl,...Object.keys(f)])];
  openModal(`${head(`${c.name} 개성 편집`)}<p class="muted" style="font-size:.8rem;margin:0 0 6px">목록 항목은 쉼표로 나눠요. 비운 칸은 지워져요.</p>
  ${PERSONA_FIELDS.map(([k,l,t])=>`<label class="f">${esc(l)}</label><input class="in" data-ps="${k}" value="${esc(t==='list'?(p[k]||[]).join(', '):p[k]||'')}">`).join('')}
  <h3 class="sec" style="margin-top:12px">프로필</h3><div class="g2">${keys.map(k=>`<div><label class="f">${esc(k)}</label><input class="in" data-pf="${esc(k)}" value="${esc(f[k]||'')}"></div>`).join('')}</div>
  <label class="f" style="margin-top:8px">추가 항목 (이름=값, 줄마다)</label><textarea class="in" id="ps_extra" rows="2" placeholder="별명=○○"></textarea>
  <div class="row" style="margin-top:12px"><button class="btn" data-act="pssave" data-id="${c.id}">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }
function personaSave(c){ const p={}; document.querySelectorAll('#modal [data-ps]').forEach(el=>{ p[el.dataset.ps]=el.value; }); c.persona=personaClean(p); const f={}; document.querySelectorAll('#modal [data-pf]').forEach(el=>{ f[el.dataset.pf]=el.value; });
  String(($('#ps_extra')||{}).value||'').split('\n').forEach(l=>{ const i=l.indexOf('='); if(i>0) f[l.slice(0,i).trim()]=l.slice(i+1).trim(); }); c.pfields=pfieldsClean(f); mark('c:'+c.id); }
function personaPanel(){ const L=G.chars.filter(c=>!c.alt).map(c=>({c,r:personaReview(c)})), avg=L.length?Math.round(L.reduce((a,x)=>a+x.r.score,0)/L.length):0, low=L.filter(x=>x.r.score<55).length;
  return `<div class="panel pm-hide"><h3>캐릭터 개성·매력 ${low?`<span class="badge">약함 ${low}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">개성 평균 ${avg}점. 개성 시트(성격·말투·반전 매력·결점…), 프로필 템플릿, 검수, 인연 톡·메모리얼을 관리해요.</p><button class="btn sm" data-act="psopen">개성 검수·설정</button></div>`; }
let PS_JOB=null;
function openPersonaAll(){ const cfg=PERSONA_CFG(), L=G.chars.filter(c=>!c.alt).map(c=>({c,r:personaReview(c)})).sort((a,b)=>a.r.score-b.r.score), cur=Object.entries(PROFILE_TPLS).find(([,v])=>v.join()===cfg.tpl.join());
  openModal(`${head('캐릭터 개성 검수·설정')}
  <h3 class="sec">프로필 템플릿</h3><select class="in" id="ps_tpl">${[['basic','기본 (생일·신장·출신·특기)'],['org','소속 조직 (소속·직책 …)'],['operator','작전 요원 (코드네임·전투 경력·임상 소견 …)'],['fantasy','판타지 (종족·계약 …)'],['idol','아이돌 (소속사·데뷔·담당·팬덤 …)'],['streamer','스트리머 (활동명·플랫폼·구독자 애칭 …)'],['custom','직접 입력']].map(([k,l])=>`<option value="${k}" ${(cur?cur[0]:'custom')===k?'selected':''}>${l}</option>`).join('')}</select>
  <label class="f">항목 (쉼표)</label><input class="in" id="ps_tplf" value="${esc(cfg.tpl.join(', '))}">
  <div class="g2"><div><label class="f">인연 톡 호감도 단계 (쉼표)</label><input class="in" id="ps_aff" value="${esc(cfg.affLv.join(', '))}"></div><div><label class="f">메모리얼 호감도</label><input class="in" type="number" id="ps_memo" min="1" max="10" value="${cfg.memoLv}"></div></div>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="pscfg">설정 저장</button></div>
  <h3 class="sec">검수 결과 <span class="muted" style="font-size:.8rem">(낮은 순)</span></h3>
  <div style="max-height:280px;overflow:auto;font-size:.82rem">${L.map(({c,r})=>`<label style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-psc="${c.id}" ${r.score<55?'checked':''}><b style="min-width:70px">${esc(c.name)}</b><span class="badge">${r.grade} ${r.score}</span><span class="muted">${esc(r.issues.slice(0,3).map(x=>x.msg).join(' · '))}${r.issues.length>3?' …':''}</span></label>`).join('')}</div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="psbatch" data-k="fill">선택: AI로 개성 채우기</button><button class="btn sm ghost" data-act="psbatch" data-k="improve">선택: AI로 다듬기(+대사)</button><button class="btn sm ghost" data-act="psbatch" data-k="talk">선택: 인연 톡 만들기</button><button class="btn sm ghost" data-act="psbatch" data-k="memo">선택: 메모리얼 만들기</button>${PS_JOB?'<button class="btn sm ghost" data-act="psstop">멈추기</button>':''}${typeof AUDIT_UNDO!=='undefined'&&AUDIT_UNDO?`<button class="btn sm ghost" data-act="psundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}</div>
  <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
async function personaBatch(kind){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const cs=[...document.querySelectorAll('[data-psc]:checked')].map(x=>charById(x.dataset.psc)).filter(Boolean); if(!cs.length){ toast('캐릭터를 골라 주세요'); return; }
  const label={fill:'개성 채우기',improve:'개성 다듬기',talk:'인연 톡',memo:'메모리얼'}[kind]; if(kind==='fill'||kind==='improve'||kind==='memo') auditSnap(cs,label); PS_JOB={stop:false}; let n=0;
  try{ for(const [i,c] of cs.entries()){ if(PS_JOB.stop) break; syBar(`${label} ${i+1}/${cs.length}: ${c.name}`); try{ const ok=kind==='talk'?await talkAffGen(c):kind==='memo'?await memorialGen(c):await personaAI(c,kind,{lines:kind==='improve'}); if(ok) n++; }catch(e){ quietErr(e,'0455-persona.js:114'); } } }
  finally{ PS_JOB=null; syBar(''); } toast(`${label}: ${n}/${cs.length}명`); openPersonaAll(); }
function personaCfgSave(){ const m=G.meta, k=$('#ps_tpl').value, f=k==='custom'||$('#ps_tplf').value.trim()!==(PROFILE_TPLS[k]||[]).join(', ')?pStrs($('#ps_tplf').value):PROFILE_TPLS[k]; m.persona=Object.assign(m.persona||{},{tpl:f.length?f:PROFILE_TPLS.basic,affLv:[...new Set(String($('#ps_aff').value).split(/[,\s]+/).map(Number).filter(n=>n>=1&&n<=10))].sort((a,b)=>a-b),memoLv:Math.max(1,Math.min(10,+$('#ps_memo').value||8))}); mark('meta'); }
const psReopen=c=>{ if(!$('#modal').hidden&&typeof openChar==='function'){ closeModal(); openChar(c.id); } else render(); };
document.addEventListener('change',e=>{ if(e.target.id==='ps_tpl'&&PROFILE_TPLS[e.target.value]) $('#ps_tplf').value=PROFILE_TPLS[e.target.value].join(', '); });
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, c=el.dataset.id&&charById(el.dataset.id);
  if(a==='psedit'&&c) openPersona(c.id);
  else if(a==='pssave'&&c){ personaSave(c); closeModal(); toast('개성을 저장했어요'); if(typeof openChar==='function') openChar(c.id); }
  else if(a==='psai'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } auditSnap([c],'개성 '+(el.dataset.k==='improve'?'다듬기':'채우기')); if(await personaAI(c,el.dataset.k,{lines:el.dataset.k==='improve',btn:el})){ toast('개성을 반영했어요 (점검 화면에서 되돌리기 가능)'); psReopen(c); } }
  else if(a==='psreview'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await personaAIReview(c,el)) psReopen(c); }
  else if(a==='pstalk'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const n=await talkAffGen(c,el); if(n){ toast(`인연 톡 ${n}개를 만들었어요`); psReopen(c); } }
  else if(a==='psmemo'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await memorialGen(c,el)){ toast('메모리얼을 만들었어요'); psReopen(c); } }
  else if(a==='psmemoplay'&&c&&c.memorial){ closeModal(); playStory(c.memorial.title,c.memorial.script); }
  else if(a==='psmemolobby'&&c){ const p=P(); p.memoOn=p.memoOn||{}; p.memoOn[c.id]=!p.memoOn[c.id]; mark('prog'); toast(p.memoOn[c.id]?'메모리얼 로비를 켰어요. 로비에서 메모리얼 대사가 나와요':'메모리얼 로비를 껐어요'); psReopen(c); }
  else if(a==='psopen') openPersonaAll();
  else if(a==='pscfg'){ personaCfgSave(); toast('개성 설정을 저장했어요'); openPersonaAll(); }
  else if(a==='psbatch') personaBatch(el.dataset.k);
  else if(a==='psstop'){ if(PS_JOB) PS_JOB.stop=true; }
  else if(a==='psundo'){ auditUndo(); openPersonaAll(); } });
