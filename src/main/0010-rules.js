/* =========================================================
   규칙과 형식
   ========================================================= */
/* 등장인물 성별 구성: f=여성만, m=남성만, mix=혼성, ''=AI가 정함. 아군·NPC를 만드는 모든 요청에 들어가요 */
const CAST_SEX={f:'여성만',m:'남성만',mix:'여성 + 남성 혼성'};
// 속성 상성 문장: 실제 상성표(rulesElemMat, 없으면 BEATS)에서 만들어요(예전엔 속성 3개를 가정해 4개 이상인 게임에 틀린 상성을 알렸음)
function elemLine(){ const m=G&&G.meta&&Array.isArray(G.meta.elems)&&G.meta.elems.length?rulesElemMat():null; return ELEMS.map(elem=>{ const s=m&&m[elem]?Object.keys(m[elem]).filter(t=>t!==elem&&m[elem][t]>1):(BEATS[elem]?[BEATS[elem]]:[]); return s.length?jo(elem,'은','는')+' '+s.join('·')+'에 강함':''; }).filter(Boolean).join(', '); }
// 받침에 맞는 조사: jo('열정','은','는') → '열정은', jo('캐스팅','으로','로') → '캐스팅으로'(ㄹ 받침이면 '로'). 한글이 아닌 끝 글자는 '을(를)'처럼 둘 다
function jo(w,a,b){ w=String(w??''); const c=w.charCodeAt(w.length-1)-0xAC00, j=c>=0&&c<=11171?c%28:-1; if(j<0) return w+(a==='으로'?'(으)로':a+'('+b+')'); return w+((j>0&&!(a==='으로'&&j===8))?a:b); }
Object.defineProperty(window,'RULES',{get:rulesText});
const ROLE = {atk:'공격',def:'방어',sup:'지원'};
const ROLE_EN={atk:'ASSAULT',def:'GUARD',sup:'SUPPORT'};
const KIND = {dmg:'단일 공격',aoe:'전체 공격',heal:'전체 회복',shield:'전체 보호막',buff:'전체 공격력 강화'};
let ELEMS = ['홍','녹','청'];
const ECOL = {'홍':'var(--e1)','녹':'var(--e2)','청':'var(--e3)'};
const BEATS = {'홍':'녹','녹':'청','청':'홍'};
const RL = {3:'SSR',2:'SR',1:'R'};
const RCOL = {1:'#6fb7ff',2:'#b48cff',3:'#ffd35a'};
const REFUND = {3:300,2:80,1:30};
const COST = 120;
const VER = 3;
const DEFAULT_META={materialTermNamesVersion:1,title:'낙성계약',sub:'STARFALL CONTRACT',theme:'tactical',accent:'#ffb400',
  terms:{player:'관리관',currency:'성석',gold:'크레딧',expMat:'전투 기록',wMat:'스킬 교본',core:'승급(Lv1~70) 재료',gearMat:'장비 강화 재료',transcMat:'초월승급(Lv71~120) 재료',gacha:'계약',ops:'작전',crew:'대원',talk:'등대톡',dispatch:'파견',farm:'훈련',pass:'시즌 패스',event:'이벤트',weapon:'전용 무기',files:'기밀 파일',skin:'스킨',enhance:'강화',limit:'돌파',abyss:'미지 탐사',construct:'영입',res1:'연료',res2:'탄약',res3:'합금',res4:'부품'},
  elems:[{n:'홍',c:'#ff5a5a'},{n:'녹',c:'#4fd18b'},{n:'청',c:'#4fa3ff'}],
  roles:{atk:'공격',def:'방어',sup:'지원'},
  farms:[{key:'exp',name:'전투 기록 회수'},{key:'gold',name:'크레딧 수급'},{key:'wmat',name:'스킬 교본 회수'},{key:'core',name:'성핵 코어 정제'}],
  shop:{name:'보급관',charId:'',hello:['어서 와요, {관리관}. 오늘은 뭐가 필요해요?','재고 넉넉해요. 천천히 골라요.','오늘 들어온 물건, 꽤 괜찮아요.'],buy:['좋은 선택이에요!','고마워요. 다음에 또 와요.','포장해 둘게요. 잘 쓰세요.'],poor:['음… 그건 조금 모자라요.','작전 한 번 다녀오면 살 수 있을 거예요.']}};
const TERM_LABEL={player:'플레이어 호칭',currency:'유료 재화',gold:'일반 재화',expMat:'경험치 재료',wMat:'스킬 강화 재료',core:'승급(Lv1~70) 재료',gearMat:'장비 강화 재료',transcMat:'초월승급(Lv71~120) 재료',gacha:'뽑기 이름',ops:'전투 메뉴',crew:'아군 호칭',talk:'메신저 앱',dispatch:'파견',farm:'재료 던전',pass:'패스',event:'이벤트',weapon:'전용 무기',files:'캐릭터 기록',skin:'스킨',enhance:'강화',limit:'돌파',abyss:'로그라이크 탐험',construct:'건조/영입 메뉴',res1:'건조 자원 1',res2:'건조 자원 2',res3:'건조 자원 3',res4:'건조 자원 4 (바리에이션)'};
// Names are metadata only; saved runs and reward identifiers remain unchanged.
function explorationName(value){return typeof value==='string'&&value.trim()?value.replace(/\s+/g,' ').trim().slice(0,12):'미지 탐사';}
// 용어는 AI·가져온 게임·직접 입력에서 와서 화면 템플릿 70여 곳에 그대로 들어가요. 태그가 될 < >는 빼고 " 는 ” 로 바꿔 돌려줘요(HTML 주입 방지, tools: esc() 없이 HTML에 넣는 글)
function T(k){const t=(typeof G!=='undefined'&&G&&G.meta&&G.meta.terms)||{};return String(t[k]||DEFAULT_META.terms[k]||k).replace(/[<>]/g,'').replace(/"/g,'”');}
function applyMeta(){
  const m=G.meta; ELEMS=m.elems.map(e=>e.n);
  Object.keys(ECOL).forEach(k=>delete ECOL[k]); Object.keys(BEATS).forEach(k=>delete BEATS[k]);
  m.elems.forEach((e,i)=>{ECOL[e.n]=e.c;BEATS[e.n]=m.elems[(i+1)%m.elems.length].n;});
  Object.assign(ROLE,m.roles); if(typeof rulesApply==='function') rulesApply(); // 게임 규칙(상성·능력치) 반영 (0185-game-rules.js)
  document.documentElement.dataset.skin=m.theme||'tactical';
  document.documentElement.style.setProperty('--acc',m.accent||'#ffb400');
  document.title=m.title;
  const el=document.querySelector('.brand'); if(el){ el.innerHTML=`<b class="brand-t">${esc(m.title)}</b><i>${esc(m.sub)}</i>`; fitBrand(); }
}

