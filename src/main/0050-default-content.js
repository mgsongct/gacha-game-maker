/* =========================================================
   기본 콘텐츠
   ========================================================= */
const DEFAULT_WORLD = {
  name:'에덴포트',
  summary:'20년 전, 하늘에서 떨어진 별의 파편이 항구도시 에덴포트를 삼켰다. 파편을 몸에 받아들인 여성들, 성흔자는 괴물이 된 빛 \'잔광\'과 싸우며 도시를 지탱한다. 당신은 작은 계약사무소 \'새벽등대\'의 관리관이다.',
  lore:'낙성의 밤 이후 에덴포트는 둘로 갈라졌다. 기업이 지배하는 상층 구역과, 잔광이 출몰하는 회색구. 별의 파편인 성핵은 사람에게 힘을 주지만 오래 쓰면 정신을 갉아먹는다. 성흔자는 계약사무소에 소속되어 의뢰를 받고 싸우며, 관리관은 그들의 계약과 성흔 안정도를 관리한다. 거대 기업 헬릭스 컨소시엄은 성핵을 독점하려 하고, 회색구 시민회는 사무소들에 의지해 하루하루를 버틴다. 새벽등대는 그 사이에서 살아남은, 가난하지만 시끄러운 사무소다.',
  plot:'1부의 축: 헬릭스는 분화구 아래 잠든 "첫 번째 별"을 깨워 성핵을 무한히 생산하려 한다. 계획의 책임자는 세라의 옛 상관 바넷 소장. 관리관은 낙성의 밤의 유일한 생존자로, 기억은 없지만 성핵과 공명하는 체질이라 곁에 있는 성흔자의 폭주를 가라앉힌다. 헬릭스가 관리관을 노리는 이유이자, 대원들이 관리관에게 끌리는 이유. 이브는 이 사실을 처음부터 알고 있었다.',
  factions:[
    {name:'새벽등대',kind:'playable',desc:'회색구의 작은 계약사무소. 관리관과 대원들의 집. 성핵 사건을 맡는 몇 안 되는 독립 계약사로, 의뢰비보다 사람을 먼저 챙긴다는 평판 때문에 늘 적자다.',goal:'회색구 주민을 잔광에게서 지키고, 낙성의 진실을 밝힌다',leader:'관리관(플레이어)',base:'회색구 폐역 위 등대 건물',ideology:'계약은 지키되, 사람을 버리는 계약은 받지 않는다',secret:'창립자는 헬릭스의 전직 연구원이었다',rel:{'헬릭스 컨소시엄':'긴장 — 의뢰를 받지만 믿지 않는다','회색구 시민회':'동맹 — 주요 의뢰인','잔광':'적대'},stance:[]},
    {name:'헬릭스 컨소시엄',kind:'hostile',desc:'성핵 연구와 거래를 독점하려는 거대 기업. 겉으로는 도시 재건의 후원자지만, 잔광 발생 구역을 실험장으로 쓴다는 소문이 끊이지 않는다.',goal:'성핵 기술 독점과 낙성 지구 재개발',leader:'이사회(얼굴을 드러내지 않음)',base:'중앙구 헬릭스 타워',ideology:'효율과 계약, 손실은 숫자로만 센다',secret:'잔광 일부는 헬릭스 실험에서 새어 나왔다',rel:{'새벽등대':'이용 — 쓰고 버릴 하청','회색구 시민회':'적대 — 재개발 반대','잔광':'연구 대상'},stance:[{ch:1,s:'neutral',why:'표면상 의뢰인'}]},
    {name:'잔광',kind:'monster',desc:'성핵에 잠식되어 빛의 괴물이 된 존재들. 사람·동물·기계를 가리지 않고 빛에 먹히면 형체가 일그러진다.',origin:'낙성의 밤 쏟아진 성핵 파편이 생물에 스며들어 생긴 변이체',nature:'빛과 소리에 몰려들고, 밤이 깊을수록 무리 지어 움직인다. 잠식이 깊을수록 말을 잃는다',weakness:'성핵 핵(코어)을 부수면 흩어진다. 홍 속성 열에 약하다',goal:'없음(본능)',base:'폐선로·낙성 분화구',rel:{'새벽등대':'적대','헬릭스 컨소시엄':'포획 대상'},stance:[]},
    {name:'회색구 시민회',kind:'neutral',desc:'버려진 구역 주민들의 자치 조직이자 주요 의뢰인. 배급과 순찰을 스스로 꾸리며, 바깥 기업을 믿지 않는다.',goal:'회색구를 재개발에서 지키고 주민을 먹여 살린다',leader:'시민회 의장',base:'회색구 시장 골목',ideology:'우리 구역은 우리가 지킨다',rel:{'새벽등대':'동맹','헬릭스 컨소시엄':'적대','회색구 연합':'후원'},stance:[]},
    {name:'회색구 연합',kind:'playable',desc:'시민회가 꾸린 자경단 겸 구조대. 정식 계약사가 아니라 장비는 낡았지만 회색구 골목을 누구보다 잘 안다.',goal:'잔광 출몰 구역의 주민 구조와 순찰',leader:'연합 대장(시민회 의장의 조카)',base:'회색구 소방서 터',ideology:'먼저 달려가고, 나중에 따진다',rel:{'새벽등대':'협력 — 현장에서 손발을 맞춤','회색구 시민회':'소속','헬릭스 컨소시엄':'적대'},stance:[]}
  ]
};

const LI=(id,kind,name,prompt)=>({id,kind,name,prompt,img:null});
const DEFAULT_LIB_IMG = [
 LI('bg_office','bg','새벽등대 사무소','no humans, scenery, small detective office interior, night, rain on window, neon light from outside, cluttered desk, old leather sofa, coffee machine, warm desk lamp, cyberpunk harbor city, anime background, highly detailed'),
 LI('bg_alley','bg','회색구 골목','no humans, scenery, narrow back alley, night, heavy rain, puddles reflecting neon signs, korean signboards, ruined buildings, anime background, cinematic lighting'),
 LI('bg_roof','bg','사무소 옥상','no humans, scenery, rooftop at dawn, wet floor after rain, railing, water tank, distant skyline with red crater glow, anime background'),
 LI('bg_rail','bg','폐선로','no humans, scenery, abandoned railway, rusted train cars, overgrown tracks, eerie floating light particles, dusk, anime background'),
 LI('bg_helix','bg','헬릭스 물류창고','no humans, scenery, high-tech corporate warehouse interior, stacked containers with helix logo, cold blue lights, red alarm lights, anime background'),
 LI('bg_crater','bg','낙성 분화구','no humans, scenery, giant crater in ruined city, glowing red star fragment in center, night sky, pillars of light, apocalyptic, epic, anime background'),
 LI('bg_med','bg','의무실','no humans, scenery, small infirmary, white curtain, medical bed, shelves of medicine, wine bottle on desk, soft lamp, night, anime background'),
 LI('bg_port','bg','옛 항구','no humans, scenery, old harbor pier, rusted cranes, calm sea, sunset, seagulls, anime background'),
 LI('bg_casino','bg','카지노 뒷골목','no humans, scenery, back alley behind casino, red neon, playing card posters, cigarette smoke, night, anime background'),
 LI('bg_garage','bg','정비실','no humans, scenery, cluttered mechanic workshop, drones on workbench, tools on wall, warm work light, anime background'),
 LI('bg_stall','bg','포장마차','no humans, scenery, korean street food tent at night, orange tarp, steaming noodles, plastic stools, rain outside, anime background'),
 LI('bg_odelle','bg','오델의 집','no humans, scenery, tidy small apartment entrance, cat bowl, neatly arranged shoes, warm light, anime background'),
 LI('bg_room','bg','관리관 숙소','no humans, scenery, small bedroom at night, phone glowing on bed, city lights through window, anime background'),
 LI('pr_ace','prop','하트 에이스','no humans, still life, ace of hearts playing card, slightly worn, object focus, simple background, white background'),
 LI('pr_box','prop','헬릭스 상자','no humans, object focus, metal cargo case with glowing blue helix logo, sci-fi, simple background, white background'),
 LI('pr_tracker','prop','성핵 추적 장치','no humans, object focus, small sci-fi tracking device with red glowing core, simple background, white background'),
 LI('pr_mungchi','prop','뭉치','no humans, object focus, small cute round repair drone with one camera eye, patched paint, simple background, white background'),
 LI('pr_letter','prop','임명장','no humans, object focus, old paper appointment certificate with red wax seal, simple background, white background')
];

const DEFAULT_BGM = [
 LI('bgm_title','bgm','타이틀','Epic orchestral anime game title theme, melancholic solo piano intro building to soaring strings and soft choir, starry night, mysterious and grand, 90 bpm, instrumental, seamless loop'),
 LI('bgm_lobby','bgm','로비','Relaxed lo-fi jazz hip hop for a small detective office at night, gentle rain ambience, warm electric piano, brushed drums, upright bass, cozy anime game lobby, 80 bpm, instrumental, seamless loop'),
 LI('bgm_daily','bgm','일상','Lighthearted slice-of-life anime BGM, playful pizzicato strings, glockenspiel, ukulele, bouncy and comedic, 110 bpm, instrumental, seamless loop'),
 LI('bgm_tense','bgm','긴장','Tense suspense underscore for an investigation in a rainy cyberpunk city, low synth drones, ticking percussion, distant metallic hits, 90 bpm, instrumental, seamless loop'),
 LI('bgm_battle','bgm','전투','High-energy anime game battle music, driving electric guitar riffs, synth bass, orchestral hits, fast drums, heroic and urgent, 160 bpm, instrumental, seamless loop'),
 LI('bgm_boss','bgm','보스전','Epic boss battle theme, dark latin choir, heavy orchestral percussion, distorted guitars, apocalyptic red star rising, intense and desperate, 150 bpm, instrumental, seamless loop'),
 LI('bgm_gacha','bgm','계약','Magical summoning fanfare, shimmering harp glissandos, celesta, rising strings, anticipation and wonder, bright and sparkling, instrumental, seamless loop'),
 LI('bgm_sad','bgm','감성','Emotional anime piano ballad, gentle strings, bittersweet and intimate, late night confession, 70 bpm, instrumental, seamless loop'),
 LI('bgm_flirt','bgm','설렘','Romantic sultry lounge jazz, slow tenor saxophone, soft piano, muted trumpet, late night bar, flirty and teasing mood, 75 bpm, instrumental, seamless loop')
];
const DEFAULT_LIB=[...DEFAULT_LIB_IMG,...DEFAULT_BGM];
// 샘플 적 도감(정체·습성·약점) — 샘플 게임에서만(0070 syncEnemies)
const ENEMY_INFO={
 '잔광 하운드':{faction:'잔광',desc:'성핵 파편에 잠식된 들개 무리가 빛의 짐승이 된 것',nature:'소리를 쫓아 무리로 사냥한다',weak:'코어를 노린 집중 공격, 홍 속성'},
 '잔광 파수꾼':{faction:'잔광',desc:'무너진 건물 잔해가 성핵에 엉겨 붙어 생긴 거인',nature:'한 구역을 떠나지 않고 다가오는 것을 부순다',weak:'가슴의 코어, 느린 움직임'},
 '헬릭스 경비병':{faction:'헬릭스 컨소시엄',desc:'헬릭스가 고용한 무장 경비 인력(사람)',nature:'명령대로만 움직이고 퇴각이 빠르다',weak:'지휘관을 먼저 쓰러뜨리면 흩어진다'},
 '헬릭스 감시드론':{faction:'헬릭스 컨소시엄',desc:'헬릭스의 무인 감시 기체',nature:'발견한 대상을 표시해 경비병을 부른다',weak:'로터, 청 속성 전류'},
 '적색 잔광체':{faction:'잔광',desc:'낙성 분화구 깊은 곳에서 깨어난 거대 잔광',nature:'주변의 잔광을 끌어당겨 몸을 키운다',weak:'흩어진 코어를 하나씩 부숴야 한다'},
 '떠도는 등불':{faction:'잔광',desc:'축제 등불에 스며든 작은 잔광',nature:'사람의 그리움에 이끌려 떠돈다',weak:'빛을 가리면 약해진다'},
 '등불 잔광':{faction:'잔광',desc:'등불 잔광이 모여 불꽃 형체가 된 것',nature:'무리 지어 맴돌며 불씨를 퍼뜨린다',weak:'녹 속성 바람'},
 '거대 등불 잔광':{faction:'잔광',desc:'축제의 밤에 모인 등불 잔광이 하나로 뭉친 괴물',nature:'축제의 소원 등불을 삼켜 커진다',weak:'입 안의 코어'}};
const ENEMY_LOOKS={
 '잔광 하운드':'no humans, monster, wolf made of glowing green light, translucent crystalline body, sharp light shards on back, snarling, glowing eyes, creature focus',
 '잔광 파수꾼':'no humans, monster, tall humanoid golem of red light and rubble, glowing core in chest, cracked stone armor, menacing, creature focus',
 '헬릭스 경비병':'1other, faceless, armored corporate soldier, full-face helmet with blue visor, black tactical armor with helix emblem, holding rifle, menacing',
 '헬릭스 감시드론':'no humans, flying surveillance drone, mechanical, single red camera eye, rotors, sleek black and blue chassis, sci-fi',
 '적색 잔광체':'no humans, giant monster, colossal creature made of burning red light, many glowing eyes, star fragment in chest, crystalline spikes, apocalyptic, boss',
 '떠도는 등불':'no humans, floating paper lantern monster, glowing face on lantern, wisps of colored light, eerie, cute but creepy',
 '등불 잔광':'no humans, monster, lantern spirit, swirling colored light, ghostly flames, floating',
 '거대 등불 잔광':'no humans, giant lantern monster, huge glowing paper lantern with fanged mouth, flames and light tendrils, festival, boss',
 '훈련 표적':'no humans, training target dummy, mechanical, holographic target rings, sci-fi',
 '강화 표적':'no humans, armored training robot, holographic shield, sci-fi',
 '훈련 교관':'no humans, large combat training mech, holographic weapons, sci-fi, boss'
};
const C=(o)=>o;
const EXTRA2={
 sera:{faction:'새벽등대',weapon:{name:'적색 조준경 「레드 레인」',desc:'세라가 헬릭스 시절부터 써 온 저격총을 지아가 개조했다.',prompt:'no humans, object focus, long sniper rifle with red scope, black and crimson, sci-fi, simple background, white background'},
   lvLines:['조준이 한결 가벼워졌어.','…고마워. 말로 하니까 어색하네.'],dupLines:['헬릭스에서 배운 건 버릴게. 여기서 다시 배우지.'],affLines:{5:['오늘 커피는 내가 탔어. 진하게.'],8:['네 옆이면 숨을 쉬는 법이 생각나.']},
   files:[{dup:1,text:'헬릭스 특수부대 「적색 소대」 출신. 소대는 3년 전 작전 중 전원 실종 처리되었다.'},{dup:3,text:'실종 처리된 작전의 지휘관은 바넷 소장. 세라는 유일한 귀환자다.'}]},
 eve:{faction:'새벽등대',weapon:{name:'청람 주사기 「블루 노트」',desc:'성흔 안정제를 정밀 투여하는 의료용 장비.',prompt:'no humans, object focus, elegant sci-fi medical injector, glowing blue liquid, silver, simple background, white background'},
   lvLines:['어머, 실력 늘었네요? 나 말고 당신이.','보답은… 나중에 받을게요.'],dupLines:['당신 곁이면 성흔이 조용해요. 이제 이유를 알 것 같아.'],affLines:{5:['오늘은 진료 말고 그냥 얘기해요.'],8:['당신이 다치면, 나 의사 안 할 거예요.']},
   files:[{dup:1,text:'전직 군의관. 낙성의 밤 구조대의 일원이었다.'},{dup:3,text:'분화구 한가운데서 생존자를 처음 발견한 사람이 이브였다. 그 생존자의 이름은 기록에서 지워졌다.'}]},
 kaya:{faction:'새벽등대',weapon:{name:'항만 방패 「앵커」',desc:'부두의 닻을 녹여 만든 거대한 방패.',prompt:'no humans, object focus, huge heavy metal tower shield shaped like an anchor, scratched green paint, simple background, white background'},
   lvLines:['더 무거운 거 들어도 되겠는데?','헤헤, 근육이 기뻐하고 있어!'],dupLines:['앞은 내가 맡는다. 이번엔 끝까지.'],affLines:{5:['고기 먹으러 가자! 이번엔 진짜 내가 다 쏜다!']}},
 luna:{faction:'회색구 연합',weapon:{name:'쌍권총 「바이너리」',desc:'해킹 모듈이 내장된 쌍권총. 쏠 때마다 로그가 남는다.',prompt:'no humans, object focus, pair of futuristic pistols with blue circuit glow, simple background, white background'},
   lvLines:['업데이트 완료~ 패치노트는 생략!','오, 이 정도면 헬릭스 방화벽도 뚫겠다.'],dupLines:['이제 도망 안 쳐. 여기가 내 서버니까.'],affLines:{5:['관리관 폰 배경화면, 내 사진으로 바꿔 놨어. 농담… 반쯤.']}},
 miho:{faction:'회색구 연합',weapon:{name:'칩 슈터 「올인」',desc:'카지노 칩을 탄환처럼 쏘아내는 기묘한 장치.',prompt:'no humans, object focus, ornate red and black handheld launcher shooting casino chips, simple background, white background'},
   lvLines:['판돈이 올라가네요. 좋아요.','이 패라면 지지 않아요.'],dupLines:['당신한테 건 판돈, 아직 한 번도 안 잃었어요.'],affLines:{5:['오늘은 블러핑 안 할게요. 진짜로.']}},
 hanna:{faction:'새벽등대',weapon:{name:'돌격소총 「퍼스트 스텝」',desc:'첫 월급으로 산 소총. 아직 흠집 하나 없다.',prompt:'no humans, object focus, compact assault rifle, olive green, brand new, simple background, white background'},
   lvLines:['강해졌어요! 세라 선배한테 보여드려야지!','감사합니다, 관리관님!'],dupLines:['신입 딱지, 오늘부로 떼겠습니다!']},
 odelle:{faction:'새벽등대',weapon:{name:'진압 방패 「원칙」',desc:'경비대 시절 지급품. 규정에 따라 정비 상태가 완벽하다.',prompt:'no humans, object focus, transparent riot shield with navy frame and police emblem, simple background, white background'},
   lvLines:['규정상 강화는 승인합니다.','…나쁘지 않군요.'],dupLines:['예외 조항을 하나 더 추가하겠습니다. 당신입니다.']},
 jia:{faction:'새벽등대',weapon:{name:'수리 드론 「뭉치 Mk.2」',desc:'뭉치의 동생. 아직 이름에 불만이 많다.',prompt:'no humans, object focus, small round repair drone with two arms and one camera eye, simple background, white background'},
   lvLines:['…성능 12% 향상. 뭉치도 좋아해요.','고쳐 줘서 고마워요. 이번엔 내가.'],dupLines:['당신은 고장 나도 내가 고칠 거예요.']}
};
const DEFAULT_BANNERS=[
 {id:'std',name:'상시 계약',type:'std',desc:'모든 대원과 언제든 계약할 수 있어요.',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''},
 {id:'b_sera',name:'적색 일섬',type:'pickup',desc:'SSR 세라 확률 상승.',pool:{mode:'all',factions:[],ids:[]},pickup:['sera'],rate:50,active:true,bg:'낙성 분화구'},
 {id:'b_dawn',name:'새벽등대 정기 모집',type:'pool',desc:'새벽등대 소속 대원만 등장해요.',pool:{mode:'faction',factions:['새벽등대'],ids:[]},pickup:[],rate:50,active:true,bg:'새벽등대 사무소'},
 {id:'b_ev1',name:'잔광 축제의 밤',type:'event',desc:'이벤트 한정 계약. 미호, 루나 확률 상승.',pool:{mode:'all',factions:[],ids:[]},pickup:['miho','luna'],rate:60,active:true,bg:'카지노 뒷골목',eventId:'ev1'}
];
const DEFAULT_EVENTS=[{id:'ev1',title:'잔광 축제의 밤',desc:'회색구에 1년에 한 번 열리는 등불 축제. 그런데 등불 속에 잔광이 섞여 있다.',token:'축제 쿠폰',active:true,chapterId:'evc1',bannerId:'b_ev1',bg:'카지노 뒷골목',bgm:'일상',shop:[]}];
const DEFAULT_EVENT_CHAPTER={id:'evc1',kind:'event',eventId:'ev1',ord:100,title:'잔광 축제의 밤',stages:[
 {id:'e11',title:'등불 아래',reward:60,enemies:[{name:'떠도는 등불',elem:'홍',hp:900,atk:75,def:30,spd:95,boss:false},{name:'떠도는 등불',elem:'청',hp:900,atk:75,def:30,spd:95,boss:false}],
  pre:`[음악: 일상]
[카지노 뒷골목]
골목마다 종이 등불이 매달려 있다. 회색구 사람들이 1년 중 유일하게 웃는 날.
미호[웃음]: 관리관님, 축제는 처음이죠? 오늘은 제가 안내할게요.
루나: 나도! 나도 안내할래! 사격 게임 경품 다 털어 줄게!
미호: 루나, 그건 안내가 아니라 영업 방해예요.
그때, 등불 하나가 이상한 빛으로 떨린다.
[효과: 흔들림]
루나: …어? 저 등불, 잔광 반응인데?`,
  post:`미호: 등불에 성핵 조각이 섞여 있었어요. 누군가 일부러 넣은 거예요.
루나: 축제 망치려는 놈이 있다 이거지. 찾아내자.
[톡: 루나]
루나: 관리관 이거 봐
루나: 등불 납품 업체 목록 털었어
나: 털었다고?
루나: 열람했어 ㅋㅋ
[톡 끝]`},
 {id:'e12',title:'경품 사격장',reward:80,enemies:[{name:'등불 잔광',elem:'녹',hp:1100,atk:85,def:35,spd:100,boss:false},{name:'등불 잔광',elem:'홍',hp:1100,atk:85,def:35,spd:100,boss:false},{name:'등불 잔광',elem:'청',hp:1100,atk:85,def:35,spd:100,boss:false}],
  pre:`[카지노 뒷골목]
루나: 납품 업체가 이 사격장 주인이야. 근데 가게가 텅 비었어.
미호: 경품 선반 뒤에서 빛이 새어 나와요.
선택: 정면으로 들어간다 | 미호에게 맡긴다
1) 루나: 역시 관리관! 시원시원해!
2) 미호[의기양양]: 맡겨 주세요. 이런 가게 뒷문은 다 똑같거든요.
[효과: 플래시]
경품 인형들이 일제히 빛을 뿜으며 일어선다.`,
  post:`루나: 사격장 주인은 도망쳤고, 남은 건 이 장부.
미호: 수취인이… 헬릭스 하청이네요.
미호[걱정]: 축제를 이용해서 성핵을 회색구 전체에 뿌리려던 거예요.`},
 {id:'e13',title:'불꽃이 지기 전에',reward:120,enemies:[{name:'거대 등불 잔광',elem:'홍',hp:4800,atk:115,def:55,spd:90,boss:true},{name:'떠도는 등불',elem:'녹',hp:1000,atk:80,def:30,spd:95,boss:false}],
  pre:`[음악: 긴장]
[회색구 골목]
축제의 마지막 순서, 대형 등불이 하늘로 오르려는 순간.
[효과: 흔들림]
등불이 터지며 거대한 잔광이 모습을 드러낸다.
루나: 저거 터지면 회색구 전체에 성핵 가루가 비처럼 내려!
미호[결의]: 관리관님, 이번 판은 전부 걸게요.`,
  post:`[음악: 감성]
잔광이 흩어지고, 그 자리에 작은 불꽃놀이가 터진다.
루나[웃음]: …예쁘다. 원래 이렇게 끝나야 했는데.
미호: 끝났잖아요, 이렇게. 당신 덕분에.
미호[부끄럼]: …내년에도 같이 와요. 이건 내기 아니에요.`}]};
const DEFAULT_DISP=[
 {id:'d1',name:'회색구 순찰',desc:'시민회 요청으로 골목을 돈다.',hours:1,need:2,reward:{gold:3000,exp:5}},
 {id:'d2',name:'물자 호송',desc:'상층 구역에서 의약품을 받아 온다.',hours:2,need:2,reward:{gold:5000,wmat:4}},
 {id:'d3',name:'잔광 잔해 수거',desc:'전투가 끝난 구역의 성핵 조각을 회수한다.',hours:4,need:3,reward:{exp:20,core:2}},
 {id:'d4',name:'헬릭스 동향 정찰',desc:'상층 구역 물류 이동을 몰래 기록한다.',hours:8,need:3,reward:{gold:15000,wmat:10}},
 {id:'d5',name:'항만 야간 경비',desc:'밤새 옛 항구를 지킨다.',hours:12,need:4,reward:{gold:20000,exp:30,core:4}},
 {id:'d6',name:'카지노 정보 수집',desc:'딜러들 사이의 소문을 모은다.',hours:0.5,need:1,reward:{gold:1500}}
];
const DEFAULT_SFX=[
 ['sfx_btn','버튼','Short crisp futuristic UI click, clean digital tick',0.5],
 ['sfx_ok','확인','Positive UI confirm chime, two-tone digital blip',0.7],
 ['sfx_seal','계약진','Magical summoning circle activating, rising shimmering hum with crystalline resonance',2.5],
 ['sfx_fall','낙하','Shooting star whoosh falling from the sky with sparkling tail',1.5],
 ['sfx_flash','섬광','Bright magical flash impact with shimmering burst',1.2],
 ['sfx_ssr','SSR','Triumphant golden reveal sting, sparkling chimes and orchestral hit',3],
 ['sfx_card','카드','Quick card flip swish',0.5],
 ['sfx_hit','타격','Short punchy gunshot impact, anime battle hit',0.5],
 ['sfx_skill','스킬','Powerful energy skill release, charged blast with whoosh',1.5],
 ['sfx_win','승리','Short victory fanfare jingle, brass and strings, anime game',3.5],
 ['sfx_lose','패배','Short defeat jingle, low descending synth tones',2.5],
 ['sfx_up','강화','Power-up level up sound, rising sparkly arpeggio',1.5],
 ['sfx_noti','알림','Smartphone message notification ping, soft two-note chime',0.8]
].map(([id,name,prompt,dur])=>({id,kind:'sfx',name,prompt,dur,img:null}));
const FACE_TAGS={calm:'calm, relaxed, closed mouth, soft eyes',smile:'gentle smile, closed mouth, happy',teary:'teary eyes, trembling lips, about to cry, sad',happy:'smile, happy',laughing:'laughing, open mouth, closed eyes',playful:'smile, playful, one eye closed',sad:'sad, frown, teary eyes',angry:'angry, frown, clenched teeth',surprised:'surprised, open mouth, wide-eyed',embarrassed:'embarrassed, blush, wavy mouth',shy:'shy, blush, looking away',smug:'smug, smirk, half-closed eyes',worried:'worried, frown, sweat',determined:'determined, serious, v-shaped eyebrows',thinking:'thinking, hand on own chin',nervous:'nervous, sweatdrop, awkward smile',irritated:'annoyed, frown, pout',tired:'tired, half-closed eyes, sigh',love:'heart-shaped pupils, blush, smile',neutral:'expressionless, closed mouth',hurt:'pain, wince, teary eyes'};
const FACE_BASIC=['평온','미소','슬픔','화남','놀람','당황'];
const FACE_PRESETS=[['평온','calm'],['미소','smile'],['울먹','teary'],['웃음','happy'],['폭소','laughing'],['윙크','playful'],['슬픔','sad'],['화남','angry'],['놀람','surprised'],['부끄럼','embarrassed'],['수줍음','shy'],['의기양양','smug'],['걱정','worried'],['결의','determined'],['생각','thinking'],['당황','nervous'],['짜증','irritated'],['피곤','tired'],['반함','love'],['무표정','neutral'],['아픔','hurt']];
const DEFAULT_CHARS = [
 C({id:'sera',persona:{"traits": ["말수 적은 프로", "동료를 몰래 챙김", "과거를 숨김"], "self": "나", "call": "관리관", "ending": "~해. / ~야. (짧은 반말)", "quirk": "\"…보고는 짧게.\"", "catch": "표적이 보이면 끝난 거야.", "gap": "무뚝뚝하지만 관리관의 커피 취향은 한 번도 틀린 적이 없다", "flaw": "도움을 청하지 못한다", "want": "다시는 동료를 잃지 않는 것", "fear": "혼자 살아 돌아오는 것", "likes": ["진한 커피", "새벽 옥상"], "dislikes": ["긴 보고", "변명"], "hobby": "총기 손질", "motif": "붉은 조준경"},ord:0,name:'세라',age:27,rarity:3,role:'atk',elem:'홍',hp:1100,atk:170,def:45,spd:100,
  skill:{name:'적색 일섬',kind:'dmg',power:2.8,cd:3,desc:'체력이 가장 낮은 적 하나에게 큰 피해'},
  profile:'헬릭스 특수부대 출신 저격수. 회사를 떠난 이유는 말하지 않는다. 무뚝뚝하지만 관리관의 커피 취향은 정확히 기억한다.',
  intro:'계약? 좋아. 대신 내 사선 앞엔 서지 마.',
  lines:['보고는 짧게. 커피는 진하게.','표적이 보이면 끝난 거야.','…오늘은 일찍 퇴근해. 명령이야.'],
  touch:{head:['…쓰다듬지 마. 애 취급하는 거야?','머리는 저격수의 생명이야. 망가지면 책임져.'],body:['……지금 어딜 만지는 거지. 조준경 너머로 다 보여.','관리관. 세 번째는 경고 없이 쏜다.']},
  naiPrompt:'1girl, solo, tall, long crimson hair, sharp amber eyes, black tactical bodysuit, long dark coat, holding sniper rifle, cool expression, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'새벽 세 시의 옥상',script:`[사무소 옥상]
비가 그친 새벽. 난간에 기댄 세라의 담배 불빛이 깜빡인다.
세라: 아직 안 잤어?
관리관: 너야말로.
세라: 저격수는 원래 잠이 얕아. 헬릭스에 있을 때 버릇이야.
세라: 거기선 이유를 묻는 사람이 없었어. 쏘라면 쐈지.
선택: 여기선 물어볼 거야 | 담배는 몸에 안 좋아
1) 세라: …그래서 여기가 마음에 들어. 귀찮지만.
2) 세라: 잔소리는 이브 하나로 충분해. …한 대만 더 피우고 끊을게. 진짜로.
그녀는 처음으로 웃었다. 아주 짧게.`}]}),
 C({id:'eve',persona:{"traits": ["느긋한 살림꾼", "장난스러운 어른", "냉철한 군의관"], "self": "나", "call": "관리관", "ending": "~요. / ~려나? (느긋한 존댓말)", "quirk": "\"어머.\"", "catch": "아픈 데 생기면… 아니, 안 생겨도 와요.", "gap": "느긋하게 웃다가도 수술대 앞에서는 한 치의 망설임도 없다", "flaw": "자기 몸은 잘 돌보지 않는다", "want": "모두가 무사히 돌아오는 밤", "fear": "손쓸 수 없는 환자", "likes": ["와인", "관리관 놀리기"], "dislikes": ["무리하는 사람"], "hobby": "허브 화분 가꾸기", "motif": "청진기와 와인잔"},ord:1,name:'이브',age:29,rarity:3,role:'sup',elem:'청',hp:1300,atk:120,def:60,spd:95,
  skill:{name:'청람의 숨결',kind:'heal',power:1.6,cd:3,desc:'아군 전체의 체력을 회복'},
  profile:'새벽등대의 의무관이자 실질적인 살림꾼. 느긋한 말투 뒤에 전직 군의관의 냉철함이 숨어 있다. 와인과 관리관 놀리기를 좋아한다.',
  intro:'의무관 이브예요. 아픈 데 생기면… 아니, 안 생겨도 와요.',
  lines:['어머, 또 다쳐서 왔네? 이리 와 봐요.','진료비는… 오늘 저녁 한 잔이면 되려나.','무리하지 마요. 당신이 쓰러지면 다들 곤란하니까.'],
  touch:{head:['어머, 나 쓰다듬어 주는 거예요? 보답은 뭘로 할까~','머리 말고 다른 데가 아픈데. 농담이에요.'],body:['진찰은 제가 하는 쪽인데… 오늘은 역할 바꿔요?','후후, 손이 차갑네요. 따뜻하게 해 줄까요?']},
  naiPrompt:'1girl, solo, wavy long silver-blue hair, half-closed blue eyes, gentle smile, white coat over dark turtleneck, medical bag, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'진료 기록 외',script:`[의무실]
관리관: 이브, 아까 그 상처는 괜찮아?
이브: 내 걱정? 귀엽네요, {관리관}.
이브는 소독약을 내려놓고 의자를 돌려 마주 앉는다. 다리를 꼬는 동작이 쓸데없이 느리다.
이브: 군에 있을 땐 아무도 의무관한테 괜찮냐고 안 물었어요.
이브: 그래서 가끔은… 이렇게 물어봐 주는 사람이 필요했나 봐.
선택: 그럼 매일 물어볼게 | 지금 어디 보고 있었는지 묻지 마
1) 이브: 그 말, 기록해 둘게요. 진료 기록 말고, 내 기록에.
2) 이브: 어머~ 안 물어봤는데 자백하네요? 귀엽다, 진짜.`}]}),
 C({id:'kaya',persona:{"traits": ["힘 자랑하는 맏언니", "고기 애호가", "동료 바보"], "self": "나", "call": "관리관 / 너", "ending": "~다! / ~자! (시원한 반말)", "quirk": "\"앞은 맡겨!\"", "catch": "앞은 내가 맡는다!", "gap": "동료가 다치면 누구보다 먼저 울먹인다", "flaw": "앞뒤 안 보고 뛰어든다", "want": "모두가 배불리 먹는 식탁", "fear": "뒤에서 동료가 쓰러지는 소리", "likes": ["고기", "항구 노을"], "dislikes": ["동료가 다치는 것", "채소"], "hobby": "팔씨름", "motif": "거대한 방패"},ord:2,name:'카야',age:24,rarity:2,role:'def',elem:'녹',hp:1600,atk:95,def:95,spd:85,
  skill:{name:'강철 방벽',kind:'shield',power:1.5,cd:3,desc:'아군 전체에 보호막'},
  profile:'거대한 방패를 휘두르는 전직 항만 노동자. 힘자랑과 고기를 좋아하고, 동료가 다치는 걸 가장 싫어한다.',
  intro:'카야다! 앞은 맡겨! 고기는 네가 사고!',
  lines:['뒤에 있어! 앞은 내가 맡는다!','관리관, 오늘 고기 먹으러 가자. 내가 쏠게… 반만.','방패가 무겁냐고? 너보단 가벼워. 농담이야.'],
  touch:{head:['헤헤, 더 해도 돼!','머리 쓰다듬는 거 좋아. 엄마 생각나.'],body:['어, 어딜! 근육 만져보고 싶으면 말로 해!','…너 의외로 대담하다?']},
  naiPrompt:'1girl, solo, athletic, short messy green hair, confident grin, tank top, cargo pants, huge metal shield, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'옛 부두',script:`[옛 항구]
카야: 여기가 내가 일하던 부두야. 낙성 전엔 배가 엄청 많았대.
관리관: 지금은 조용하네.
카야: 응. 그래서 내가 시끄럽게 사는 거야. 누군가는 떠들어야지.
카야는 바다에 돌을 던진다. 생각보다 멀리 날아간다.
카야: 봤지? 방패 말고도 잘하는 거 많다니까.`}]}),
 C({id:'luna',persona:{"traits": ["말 빠른 장난꾸러기", "천재 해커", "외로움 많음"], "self": "나", "call": "관리관~", "ending": "~지롱 / ~거든? (빠른 반말)", "quirk": "\"농담… 반쯤.\"", "catch": "관리관 폰 이미 해킹했어. 농담… 반쯤.", "gap": "장난 뒤에 혼자 남는 게 무서워 늘 누군가에게 말을 건다", "flaw": "진지한 얘기를 장난으로 피한다", "want": "쫓기지 않고 쉴 수 있는 집", "fear": "연락이 끊기는 것", "likes": ["에너지 드링크", "보안 뚫기"], "dislikes": ["지루함", "기다리기"], "hobby": "게임 스피드런", "motif": "쌍권총과 노트북"},ord:3,name:'루나',age:22,rarity:2,role:'atk',elem:'청',hp:950,atk:140,def:40,spd:120,
  skill:{name:'체인 버스트',kind:'aoe',power:1.3,cd:3,desc:'적 전체에 연속 사격'},
  profile:'쌍권총과 해킹을 동시에 다루는 프리랜서. 말이 빠르고 장난이 많다. 헬릭스 서버를 털다 쫓기던 중 새벽등대에 굴러들어왔다.',
  intro:'루나 등장~ 관리관 폰 이미 해킹했어. 농담… 반쯤.',
  lines:['관리관~ 오늘 해킹한 거 보여줄까? 아, 불법이라 안 되나.','탕탕! 끝! 보너스는 계좌로~','심심해. 놀아줘. 명령이야. 아니, 부탁이야.'],
  touch:{head:['쓰다듬기 +1! 호감도 해킹 성공~','더더! 아 아니, 그만! …아니 계속.'],body:['꺄! 변태 관리관! 이거 녹화해서 이브 언니한테 보낸다!','흐응~ 이런 취향이었어? 메모해 둘게.']},
  naiPrompt:'1girl, solo, long blue hair, mischievous smile, cropped hoodie, shorts, thigh holsters, dual pistols, headset, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'새벽 두 시의 메시지',script:`[관리관 숙소]
메시지 알림이 울린다. 발신자는 루나.
루나: 자?
루나: 안 자지? 읽음 표시 떴거든.
관리관: 무슨 일이야.
루나: 그냥. 서버 털 때보다 이게 더 떨려서.
루나: …아냐, 잊어. 내일 커피 사.
화면 너머로 그녀가 웃는 것 같았다.`}]}),
 C({id:'miho',persona:{"traits": ["여유로운 승부사", "사람을 읽는 눈", "마음을 숨김"], "self": "저", "call": "당신", "ending": "~죠. / ~거든요. (나긋한 존댓말)", "quirk": "\"한 판 걸어볼래요?\"", "catch": "패는 숨기는 게 예의예요. 마음도요.", "gap": "확률도 사람도 안 믿는다면서 관리관에게만은 전부를 건다", "flaw": "진심을 농담처럼 말해 버린다", "want": "질 걱정 없는 승부 한 번", "fear": "누군가를 믿었다가 잃는 것", "likes": ["카드 섞는 소리", "달콤한 칵테일"], "dislikes": ["속임수 쓰는 사람"], "hobby": "동전 마술", "motif": "뒤집힌 카드"},ord:4,name:'미호',age:26,rarity:2,role:'sup',elem:'홍',hp:1000,atk:115,def:50,spd:110,
  skill:{name:'올인',kind:'buff',power:1.2,cd:4,desc:'아군 전체 공격력 상승'},
  profile:'회색구 카지노의 딜러였던 도박사. 확률은 믿지 않고 사람을 믿는다고 말하지만, 실은 둘 다 믿지 않는다.',
  intro:'판돈이 큰 계약이네요. 좋아요, 걸어보죠.',
  lines:['한 판 걸어볼래요? 판돈은… 당신.','운 좋은 사람 곁에 있으면 나도 운이 좋아지거든요.','패는 숨기는 게 예의예요. 마음도요.'],
  touch:{head:['어머, 행운의 부적 대신이에요?','머리 만지면 운이 옮는대요. 제 운 다 가져가면 곤란한데.'],body:['손버릇이 나쁘네요. 칩으로 계산할게요.','후후, 그 패… 블러핑 아니죠?']},
  naiPrompt:'1girl, solo, long black hair with red streak, fox-like eyes, sly smile, red qipao-style dress, black gloves, playing cards, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'하트 에이스',script:`[카지노 뒷골목]
미호: 여기서 처음 딜러를 했어요. 손님들이 다 거짓말쟁이였죠.
관리관: 너는?
미호: 나는 제일 큰 거짓말쟁이였고요.
미호는 카드 한 장을 뒤집어 관리관의 손에 쥐여 준다.
[소품: 하트 에이스]
미호: 이건 속임수 아니에요. …이번만은.
[소품 끝]`}]}),
 C({id:'hanna',persona:{"traits": ["근성의 신입", "선배 동경", "과하게 성실함"], "self": "저", "call": "관리관님", "ending": "~습니다! (군기 든 존댓말)", "quirk": "\"확인했습니다!\"", "catch": "언젠가 세라 선배처럼 될 거예요.", "gap": "완벽해 보이려 밤새 연습하다 아침에 졸아 버린다", "flaw": "실수를 혼자 끌어안는다", "want": "선배들에게 인정받는 것", "fear": "짐이 되는 것", "likes": ["보고서 체크리스트", "선배들 무용담"], "dislikes": ["대충 하는 것"], "hobby": "훈련 일지 쓰기", "motif": "새 군화"},ord:5,name:'한나',age:25,rarity:1,role:'atk',elem:'녹',hp:1000,atk:120,def:50,spd:105,
  skill:{name:'돌격',kind:'dmg',power:1.9,cd:2,desc:'체력이 가장 낮은 적 하나에게 피해'},
  profile:'새벽등대에 가장 최근 들어온 신입 용병. 성실함과 근성은 사무소 최고. 선배들을 동경한다.',
  intro:'신입 한나, 오늘부터 잘 부탁드립니다!',
  lines:['신입 한나, 출격 준비 완료입니다!','관리관님, 보고서 세 번 검토했습니다!','언젠가 세라 선배처럼 될 거예요.'],
  touch:{head:['헤, 헤헤… 칭찬이에요?','선배들한테 자랑할래요!'],body:['과, 관리관님?! 이, 이것도 훈련인가요?!','저, 저는 괜찮은데… 아니 안 괜찮아요!']},
  naiPrompt:'1girl, solo, brown ponytail, earnest expression, green military jacket, combat boots, assault rifle, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'첫 월급',script:`[포장마차]
한나: 관리관님! 첫 월급 받았어요! 오늘은 제가 살게요!
관리관: 괜찮아?
한나: 네! 누군가한테 한턱내는 게 꿈이었거든요.
한나: …사실 고향에 보낼 돈 빼면 국수 두 그릇이 한계지만요.
두 사람은 김이 나는 국수를 앞에 두고 웃었다.`}]}),
 C({id:'odelle',persona:{"traits": ["원칙주의자", "과묵한 보호자", "은근한 다정함"], "self": "저", "call": "관리관", "ending": "~입니다. (딱딱한 존댓말)", "quirk": "\"규정에 따라.\"", "catch": "규칙은 지키라고 있는 겁니다, 관리관.", "gap": "규칙에 엄격하면서 고양이 앞에서는 목소리가 반 옥타브 올라간다", "flaw": "융통성이 없다", "want": "모두가 제시간에 퇴근하는 사무소", "fear": "규칙이 사람을 지키지 못하는 순간", "likes": ["고양이", "정시 퇴근"], "dislikes": ["연장 근무", "무단 행동"], "hobby": "고양이 사진 정리", "motif": "경비대 배지"},ord:6,name:'오델',age:31,rarity:1,role:'def',elem:'청',hp:1500,atk:85,def:85,spd:80,
  skill:{name:'경비대 진형',kind:'shield',power:1.1,cd:3,desc:'아군 전체에 보호막'},
  profile:'은퇴한 시 경비대장. 원칙주의자이며 사무소의 규칙을 혼자 지킨다. 의외로 고양이를 키운다.',
  intro:'오델 크레인. 규정에 따라 계약에 응합니다.',
  lines:['규칙은 지키라고 있는 겁니다, 관리관.','퇴근 시간입니다. 연장 근무는 승인하지 않겠습니다.','…고양이 사진이요? 보고 싶으시다면야.'],
  touch:{head:['…근무 중입니다. 짧게 하세요.','고양이한테 하는 것처럼 하시는군요. 나쁘진 않습니다.'],body:['관리관. 그건 사내 규정 14조 위반입니다.','……보고서는 쓰지 않겠습니다. 이번만.']},
  naiPrompt:'1girl, solo, short navy hair, stern face, glasses, police-style uniform, long coat, riot shield, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'규칙 제0조',script:`[오델의 집]
오델: 서류를 놓고 가셨기에… 들어오시죠. 잠깐이면 됩니다.
작은 고양이가 관리관의 발목에 몸을 비빈다.
오델: 이름은 규칙입니다. 제 인생의 유일한 예외라서요.
관리관: 그럼 나는?
오델: …그건 아직 검토 중입니다.`}]}),
 C({id:'jia',persona:{"traits": ["과묵한 정비사", "기계에 이름 붙임", "은근히 세심함"], "self": "저", "call": "관리관", "ending": "…~요. (짧고 조용한 존댓말)", "quirk": "\"…고쳐 놨어요.\"", "catch": "고장 나면 가져와요. 사람도요.", "gap": "말은 없지만 관리관의 총 조준경이 1도 틀어진 것까지 알아챈다", "flaw": "사람보다 기계가 편하다", "want": "모두가 고장 나지 않는 것", "fear": "고칠 수 없는 고장", "likes": ["기름 냄새", "드론 뭉치"], "dislikes": ["시끄러운 곳"], "hobby": "고물 수집", "motif": "렌치와 드론"},ord:7,name:'지아',age:23,rarity:1,role:'sup',elem:'녹',hp:950,atk:100,def:45,spd:115,
  skill:{name:'수리 드론',kind:'heal',power:1.0,cd:3,desc:'아군 전체의 체력을 회복'},
  profile:'드론과 장비를 고치는 정비사. 말수가 적고 기계에게 이름을 붙인다. 손이 늘 기름투성이다.',
  intro:'…지아. 고장 난 거 있으면 가져와요.',
  lines:['…이 드론 이름은 뭉치예요.','고장 나면 가져와요. 사람도요.','관리관 총, 조준경이 1도 틀어졌어요. 고쳐 놨어요.'],
  touch:{head:['…따뜻해요. 계속해요.','기름 묻어요. 괜찮아요?'],body:['…거긴 정비 대상 아니에요.','뭉치, 녹화 끄고 저쪽 보고 있어.']},
  naiPrompt:'1girl, solo, messy short black hair, goggles on head, mechanic jumpsuit tied at waist, tank top, wrench, small drone, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'뭉치의 생일',script:`[정비실]
지아: …관리관. 잠깐 와 봐요.
작업대 위에 작은 케이크와 낡은 드론 한 대가 놓여 있다.
[소품: 뭉치]
지아: 뭉치가 오늘로 다섯 살이에요. 내가 처음 만든 드론.
지아: 아무한테도 말 안 했는데… 당신한텐 말하고 싶었어요.
[소품 끝]
드론의 불빛이 두 번 깜빡였다. 축하한다는 뜻이래.`}]})
];

const E=(name,elem,hp,atk,def,spd,boss)=>({name,elem,hp,atk,def,spd,boss:!!boss});
const DEFAULT_CHAPTERS = [{id:'c1',ord:0,title:'1장 낙성의 도시',stages:[
 {id:'s11',title:'첫 계약',reward:300,enemies:[E('잔광 하운드','녹',700,70,25,95),E('잔광 하운드','녹',700,70,25,95)],
  pre:`[새벽등대 사무소]
프롤로그 다음 날 아침. 사무소에는 커피 냄새와 서류 더미가 가득하다.
이브: 좋은 아침이에요, {관리관}. 잘 잤어요? …소파에서?
세라: 숙소 열쇠 안 줬잖아, 이브.
이브: 어머. 일부러 그런 건 아니에요. 아마도.
이브: 자, 첫 의뢰예요. 회색구 3번가에 잔광 하운드 두 마리. 시민회 의뢰고, 보수는… 짜요.
선택: 바로 출동하자 | 보수가 얼마나 짠데?
1) 세라: 의욕은 합격.
2) 이브: 우리 사무소 한 달 커피값 정도요. 그러니까 꼭 받아 와야 해요.
세라: 편성은 네가 해. 하운드는 녹 속성이야. 홍으로 치면 빨리 끝나.
[회색구 골목]
[효과: 흔들림]
빗속에서 녹색 빛을 흘리는 짐승 두 마리가 이빨을 드러낸다.`,
  post:`[회색구 골목]
하운드의 빛이 꺼지고, 골목에 다시 어둠이 내린다.
세라: …나쁘지 않은 지휘였어.
[새벽등대 사무소]
이브: 어머, 세라가 칭찬을 다 하네. 오늘은 축하해야겠어요.
이브: 그리고 {관리관}. 아까 대원들 성흔 수치 봤어요? 전투 중인데도 안정적이었어요.
이브: 보통은 싸울수록 흔들리는데. …당신, 정말 특이한 사람이네요.
세라: 이브.
이브: 네네, 나중에요. 오늘은 와인이나 마셔요.`},
 {id:'s12',title:'폐선로',reward:400,enemies:[E('잔광 하운드','녹',800,75,30,95),E('잔광 하운드','청',800,75,30,95),E('잔광 파수꾼','홍',1100,80,40,85)],
  pre:`[폐선로]
낙성 이후 멈춘 열차들이 녹슨 채 늘어서 있다.
카야: 으, 이런 데는 꼭 뭐가 숨어 있더라.
루나: 신호 잡혔어! 선로 끝에 잔광 반응 셋! 그리고… 이상한 전파 하나.
선택: 이상한 전파? | 일단 잔광부터
1) 루나: 군용 암호야. 민간 거 아냐. 끝나고 뜯어볼게.
2) 루나: 오케이~ 지휘관님 말씀대로!
카야: 관리관, 내 뒤에 있어. 오늘 방패 새로 칠했거든. 긁히면 네가 다시 칠해 줘.
루나: 카야 언니 뒤에 서면 안전하긴 한데 시야가 0이야. 엉덩이밖에 안 보여.
카야: 루나!!
[효과: 흔들림]
녹슨 객차 지붕 위로 빛의 파수꾼이 몸을 일으킨다.`,
  post:`[폐선로]
루나: 전파 출처 찾았다! 저 객차 안!
[소품: 헬릭스 상자]
카야: 이거… 헬릭스 로고잖아?
루나: 안에 든 건 성핵 샘플이야. 그것도 잔광으로 변하기 직전의 것.
[소품 끝]
선택: 헬릭스가 잔광을 키우고 있다? | 일단 사무소로 가져가자
1) 루나: 그렇게밖에 안 보이지? 기업이 괴물 농장이라니, 영화 같네.
2) 카야: 내가 들게! …무거워. 루나 너도 들어.
세라: (무전) …헬릭스. 하필 또.`},
 {id:'s13',title:'헬릭스의 그림자',reward:500,enemies:[E('헬릭스 경비병','청',1200,90,55,90),E('헬릭스 경비병','청',1200,90,55,90),E('헬릭스 감시드론','녹',700,100,30,120)],
  pre:`[헬릭스 물류창고]
상자의 출고 기록을 따라 도착한 곳은 헬릭스의 하청 물류창고.
미호: 문 앞 경비병들, 표정 보니 패가 안 좋네요.
오델: 정면 돌파는 규정 위반입니다만.
미호: 그럼 뒷문? 열쇠 있는데요. 경비 반장이 카드빚이 좀 있어서.
오델: ……그것도 규정 위반입니다.
선택: 정면으로 간다 | 뒷문으로 간다
1) 오델: 승인합니다. 원칙적으로.
2) 미호: 현명하시네요. 그런데 어쩌죠, 들켰어요.
[효과: 플래시]
경보가 울리고 붉은 조명이 창고를 뒤덮는다.`,
  post:`[헬릭스 물류창고]
지아: …이 드론, 분해해 봤어요.
[소품: 성핵 추적 장치]
지아: 성핵 추적 장치예요. 잔광이 아니라, 성흔자를 찾는 거.
이브: (통신) 누군가 성흔자를 찾고 있다는 뜻이네요.
세라: 아니면 사냥하고 있거나.
[소품 끝]
세라: …이 드론 형번, 내가 있던 부대 거야. 바넷 소장의 부대.
선택: 바넷이 누구야? | 괜찮아?
1) 세라: 내 옛 상관. 그리고 내가 회사를 떠난 이유.
2) 세라: …괜찮아. 지금은 아니어도, 괜찮아질 거야.`},
 {id:'s14',title:'붉은 잔광',reward:800,enemies:[E('적색 잔광체','홍',5200,125,60,85,true),E('잔광 하운드','녹',800,75,30,95)],
  pre:`[낙성 분화구]
[효과: 흔들림]
하늘이 붉게 물든다. 분화구 중심에서 거대한 빛의 형체가 몸을 일으킨다.
한나: 저, 저게 뭐예요…!
???: 오랜만이군, 세라 바이스.
분화구 가장자리, 헬릭스의 검은 제복을 입은 남자가 서 있다.
바넷: 그리고 그쪽이 새 관리관인가. 낙성의 밤의 유일한 생존자.
바넷: 성핵과 공명하는 체질. 회사가 20년 동안 찾던 물건이지.
세라: 이 사람한테 손대면 너부터 쏜다.
바넷: 그럼 이것부터 처리해 보도록.
[효과: 플래시]
붉은 잔광체가 포효한다.
관리관: 전원, 전투 준비.`,
  post:`[낙성 분화구]
거대한 잔광이 무너지며 별가루처럼 흩어진다.
바넷의 모습은 이미 사라지고 없다.
이브: 다들 무사해요? …다행이다.
세라: {관리관}. 아까 그 말, 들었지.
선택: 내가 생존자라는 거? | 나는 기억이 없어
1) 세라: 응. 그리고 헬릭스는 널 원해.
2) 세라: 기억이 없어도 상관없어. 이제 네 곁엔 우리가 있으니까.
[새벽등대 사무소]
[효과: 암전]
그날 밤, 사무소의 불은 늦게까지 꺼지지 않았다.
1장 끝. 설정 탭의 AI 창작실에서 다음 장을 이어 쓸 수 있습니다.`}
]}];

const TH=(id,charId,title,trigger,needOwn,script)=>({id,charId,title,trigger,needOwn,script});
const DEFAULT_THREADS = [
 TH('t_eve1','eve','첫 출동 수고했어요',{type:'clear',value:'s11'},false,`이브: 첫 출동 수고했어요, 관리관님
이브: 다친 데 없죠? 있으면 의무실로 오세요. 진찰해 줄게요
선택: 멀쩡해 | 사실 좀 아파
1) 이브: 아쉽네~ 핑계 하나 날아갔다
2) 이브: 어디가요? 사진 보내 봐요
2) 이브: …농담이에요. 직접 와요. 문 잠가 둘게요 🩺
이브: 그리고 세라가 칭찬했어요. 그 애가 칭찬하는 거 1년에 한 번 볼까 말까예요
이브: 오늘 밤 사무소에서 와인 한 잔 해요. 둘이서만 🍷`),
 TH('t_luna1','luna','모르는 번호',{type:'start'},true,`루나: 안녕~ 새 관리관 맞지?
루나: 번호 어떻게 알았냐고? 비밀~
선택: 해킹했지 | 누구세요
1) 루나: 들켰다 ㅋㅋ 근데 이 정도는 인사야
2) 루나: 섭섭하네~ 방금 계약한 루나잖아!
루나: 아 그리고 관리관 폰 갤러리 봤어
루나: 취향… 의외로 건전하네? 실망~
나: 그걸 왜 봐
루나: 보안 점검이지 ㅋㅋㅋ
[사진: 뭉치]
루나: 지아가 보여주래. 얘 이름 뭉치래`),
 TH('t_sera1','sera','커피',{type:'aff',value:2},true,`세라: 사무소 커피머신 고장 났어
세라: 지아가 고치는 중
선택: 내가 사 갈게 | 참아
1) 세라: …진하게. 시럽 빼고.
1) 세라: 그리고 고마워. 이건 못 들은 걸로 해.
2) 세라: 넌 오늘 회색구 순찰 혼자 가라.
2) 세라: 농담이야. 반쯤.`),
 TH('t_kaya1','kaya','고기!!!',{type:'clear',value:'s12'},true,`카야: 관리관!!! 고기!!!
카야: 아니 그게 아니라 오늘 작전 끝났으니까 고기
선택: 가자 | 다음에
1) 카야: 역시 내 관리관! 3인분… 아니 6인분 예약한다
2) 카야: …… (방패 내려놓는 소리)
2) 카야: 알았어… 다음에 꼭이다? 약속!`),
 TH('t_miho1','miho','VIP룸 초대권',{type:'clear',value:'s13'},true,`미호: 관리관님, 오늘 밤 시간 있어요?
미호: 카지노 VIP룸 초대권이 생겼거든요
미호: 드레스 코드는… 제가 골라 드릴게요. 치수는 대충 알아요
선택: 좋아 | 치수를 왜 알아
1) 미호: 후후, 판돈은 이미 걸렸어요. 당신으로.
2) 미호: 딜러는 손님 몸가짐부터 보거든요. 직업병이에요 ♠
미호: 아, 이건 비밀이에요. 루나한테 들키면 해킹당하니까`)
];

const DEFAULT_OPENING = {
  lines:['별은 소원을 들어주지 않았다.','다만, 떨어졌을 뿐이다.','20년 후. 항구도시 에덴포트.','빛을 몸에 품은 여자들이 있다.','그녀들과 계약하는 자를, 사람들은 관리관이라 부른다.','낙성계약'],
  prologue:`[배경: 낙성 분화구]
[효과: 암전]
20년 전, 별이 떨어진 밤.
도시는 불타고, 하늘은 하얗게 찢어졌다.
그날 밤, 분화구 한가운데서 살아남은 사람은 단 한 명이었다.
[효과: 플래시]
[회색구 골목]
그리고 지금.
빗속을 걷는 {관리관}의 손에는 낡은 임명장 한 장이 들려 있다.
[소품: 임명장]
계약사무소 새벽등대 관리관으로 임명함.
[소품 끝]
[효과: 흔들림]
골목 끝에서 굉음이 울린다. 빛으로 된 짐승이 벽을 부수고 튀어나온다.
???: 엎드려!
[효과: 플래시]
붉은 섬광. 짐승의 머리가 꿰뚫린다.
세라: …민간인이 이 시간에 회색구를 걷다니. 죽고 싶어?
관리관: 새벽등대를 찾고 있어. 오늘부터 관리관이야.
세라: ……하. 그 사무소, 관리관이 또 바뀌는 거야?
선택: 잘 부탁해 | 구해줘서 고마워
1) 세라: 부탁은 살아남은 다음에 해.
2) 세라: 고마우면 커피나 사. 진하게.
[새벽등대 사무소]
이브: 어서 와요, 새 관리관님. 세라가 사람을 데려오다니, 별일이네.
이브: 몸 좀 봐요. 다친 데는… 없네. 아깝다, 진찰할 핑계였는데.
세라: 이브. 일 얘기.
이브: 네네~ 관리관님, 우리 사무소엔 지금 대원이 거의 없어요. 계약금도 바닥이고요.
이브: 그래서 첫 업무예요. 성흔자들과 계약을 맺어 주세요.
이브: 걱정 마요. 당신 곁에선… 이상하게 성흔이 조용해지거든요.
세라: …그 얘긴 나중에.
그날 밤, 새벽등대의 불이 다시 켜졌다.`
};

const DEFAULT_PROG = {gems:3600,pity:0,total:0,owned:{},cleared:{},squad:[],sec:null,daily:'',
  settings:{ssr:4,sr:18,pity:150,rv:2,expRate:100,goldRate:100,gemRate:100,stamina:true},firstTen:true,adult:true,show19:true,history:[],savedAt:0,
  gold:20000,mat:{exp:40,wmat:20,core:10,gearMat:0,transcMat:0},pities:{},tokens:{},disp:{},dm:{date:'',cnt:{},got:{}},pass:{xp:0,got:[]},farmClear:{},shopBuy:{},curBanner:'',curEvent:'',live:{on:{talk:true,event:true,rerun:true,rotate:true,pass:true,chapter:false,season:true,skin:true},last:{},notices:[],seen:0,recentPU:[],seasons:{story:true,event:true,char:true,rerun:true,train:true},skillGeneration:1,season:null},
  player:'',gender:'',inbox:{},seenOpening:false,lobbyBg:'',titleBg:'',titleChar:'',gachaBg:''};

