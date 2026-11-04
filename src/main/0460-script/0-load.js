/* ===== 0460-script — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0460-script-engine.js에서 ── */
/* =========================================================
   대본 엔진
   ========================================================= */
// 한 줄에 붙어 나온 [소품 끝]·[배경: …] 같은 지시를 따로 떼어 내요(예: "문장. [소품 끝]")
const TAG_RE=/\[(?:(?:소품|음악|톡|CG|cg)\s*끝|(?:배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：][^\]\n]+)\]/g;
let S=null;

/* ── 0462-direction.js에서 ── */
/* ===== 연출 엔진: 감정 아이콘 · 캐릭터 동작 · 화면 효과 · 두 사람 무대 ===== */
/* 대본 문법(SCRIPT_FMT의 DIRECTION_GUIDE 조각):
     이름[표정|하트|점프]: 대사      — 대괄호 안을 | 로 나눠 표정·감정·동작을 함께(순서 상관없음)
     [연출: 이름 하트 점프]          — 대사 없이 감정·동작만
     [효과: 붉은섬광] [효과: 비] [효과: 비 끝] [효과: 회상] [효과: 회상 끝] …
     톡(메신저)·대본의 [스티커: 하트] — 감정 아이콘을 스티커로
   감정 아이콘은 기본 SVG를 쓰고, 자료실에 같은 이름의 '감정' 그림(kind 'emote')이 있으면 그걸 써요(공유 보관함으로 게임끼리 재사용).
   P().vnDirect: 'auto'(대본 + 대사로 자동 감정, 기본) | 'script'(대본에 쓴 것만) | 'off' · P().vnStage: 'duo'(최근 두 사람, 기본) | 'single'
   문서: docs/research/direction.md */
const EMO_SVG=(body,vb)=>`<svg viewBox="${vb||'0 0 40 40'}" aria-hidden="true">${body}</svg>`, EMO_ST='stroke="#1a1020" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const EMOTES={
 하트:{c:'#ff5c8a',svg:EMO_SVG(`<path d="M20 34 6 20a8 8 0 0 1 14-10 8 8 0 0 1 14 10z" fill="#ff5c8a" ${EMO_ST}/>`),a:'pop',k:/좋아해|사랑|두근|설레|고마워|기뻐|♥|❤/},
 땀:{c:'#7cc8ff',svg:EMO_SVG(`<path d="M22 4c6 10 10 15 10 21a10 10 0 0 1-20 0c0-6 4-11 10-21z" fill="#a9dcff" ${EMO_ST}/>`),a:'drip',k:/(^|\s)(어,|어어|저기…|아하하|하하…)|당황|곤란|미안…|^\.\.\.|^…/},
 화남:{c:'#ff4b4b',svg:EMO_SVG(`<g fill="none" stroke="#ff3b3b" stroke-width="4.5" stroke-linecap="round"><path d="M8 15q7 0 7-7"/><path d="M25 8q0 7 7 7"/><path d="M32 25q-7 0-7 7"/><path d="M15 32q0-7-7-7"/></g>`),a:'throb',k:/화나|짜증|뭐야!|용서 못|열받|시끄러|그만해!/},
 놀람:{c:'#ffd23f',svg:EMO_SVG(`<path d="M15 3h10l-2 22h-6z" fill="#ffd23f" ${EMO_ST}/><circle cx="20" cy="32" r="4" fill="#ffd23f" ${EMO_ST}/>`),a:'pop',k:/[!！][?？]|[?？][!！]|뭐라고|설마|깜짝|에엣|헉/},
 의문:{c:'#9bd0ff',svg:EMO_SVG(`<path d="M12 13a8 8 0 1 1 12 7c-3 2-4 3-4 7" fill="none" stroke="#1a1020" stroke-width="7" stroke-linecap="round"/><path d="M12 13a8 8 0 1 1 12 7c-3 2-4 3-4 7" fill="none" stroke="#9bd0ff" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="35" r="3.5" fill="#9bd0ff" ${EMO_ST}/>`),a:'tilt',k:/글쎄|왜\?|그게 무슨|음\?|응\?/},
 침묵:{c:'#ffffff',svg:EMO_SVG(`<g fill="#fff" ${EMO_ST}><circle cx="9" cy="24" r="4"/><circle cx="20" cy="24" r="4"/><circle cx="31" cy="24" r="4"/></g>`),a:'fade',k:/^(…|\.\.\.)+$/},
 음표:{c:'#c49bff',svg:EMO_SVG(`<path d="M16 30V8l16-4v20" fill="none" stroke="#1a1020" stroke-width="6"/><path d="M16 30V8l16-4v20" fill="none" stroke="#c49bff" stroke-width="3"/><circle cx="12" cy="30" r="5" fill="#c49bff" ${EMO_ST}/><circle cx="28" cy="26" r="5" fill="#c49bff" ${EMO_ST}/>`),a:'bob',k:/[♪~]$|후후|에헤헤|흥흥|랄라|ㅎㅎ|ㅋㅋ/},
 번뜩:{c:'#fff27a',svg:EMO_SVG(`<g stroke="#fff27a" stroke-width="4" stroke-linecap="round"><path d="M20 3v8M20 29v8M3 20h8M29 20h8M8 8l5 5M27 27l5 5M32 8l-5 5M13 27l-5 5"/></g>`),a:'pop',k:/그렇구나!|알았다|좋은 생각|번뜩|맞아!/},
 눈물:{c:'#7cc8ff',svg:EMO_SVG(`<g fill="#a9dcff" ${EMO_ST}><path d="M12 8c4 7 6 10 6 14a6 6 0 0 1-12 0c0-4 2-7 6-14z"/><path d="M28 14c4 7 6 10 6 14a6 6 0 0 1-12 0c0-4 2-7 6-14z"/></g>`),a:'drip',k:/흑|훌쩍|울지|눈물|슬퍼/},
 홍조:{c:'#ff8fb0',svg:EMO_SVG(`<g stroke="#ff6f9a" stroke-width="3.5" stroke-linecap="round"><path d="M6 26l5-8M13 26l5-8M20 26l5-8M27 26l5-8"/></g>`),a:'fade',k:/부끄|창피|그, 그런|바보…|딱히/},
 졸림:{c:'#b8c4ff',svg:`<svg viewBox="0 0 40 40" aria-hidden="true"><text x="6" y="30" font-size="22" font-weight="900" fill="#b8c4ff" stroke="#1a1020" stroke-width="1.5">Z</text><text x="22" y="18" font-size="14" font-weight="900" fill="#b8c4ff" stroke="#1a1020" stroke-width="1">z</text></svg>`,a:'bob',k:/졸려|하암|피곤/},
 반짝:{c:'#fff3a8',svg:EMO_SVG(`<path d="M20 2l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#fff3a8" ${EMO_ST}/>`),a:'pop',k:/반짝|멋지|대단해|최고/},
 한숨:{c:'#e6e6e6',svg:EMO_SVG(`<path d="M8 26a7 7 0 0 1 6-11 9 9 0 0 1 17 3 6 6 0 0 1-1 12H12a5 5 0 0 1-4-4z" fill="#eee" ${EMO_ST}/>`),a:'fade',k:/하아…|휴우|에휴|한숨/}};
const EMO_ALIAS={'♥':'하트','💦':'땀','💢':'화남','!':'놀람','?':'의문','…':'침묵','♪':'음표','💡':'번뜩','😢':'눈물','😳':'홍조','💤':'졸림','✨':'반짝','당황':'땀','분노':'화남','놀라움':'놀람','물음표':'의문','기쁨':'음표','슬픔':'눈물','부끄러움':'홍조'};
const MOTIONS={점프:'m-jump',뛰어오름:'m-jump',흔들:'m-shake',도리도리:'m-shake',떨림:'m-tremble',끄덕:'m-nod',갸웃:'m-tilt',다가옴:'m-near',물러남:'m-far',퇴장:'m-exit',등장:'m-enter',쓰러짐:'m-fall'};
const SCREEN_FX={흔들림:'shake',강한흔들림:'shake2',플래시:'w',섬광:'w',붉은섬광:'r',암전:'b',페이드:'f',집중선:'lines',비:'rain',눈:'snow',벚꽃:'petal',회상:'memory',비네트:'vignette'};
const FX_KEEP=['lines','rain','snow','petal','memory','vignette']; // 끝을 쓸 때까지 남는 효과

/* ── 0470-title-opening.js에서 ── */
/* =========================================================
   타이틀과 오프닝
   ========================================================= */
// 타이틀 로고 모양: 게임 정의에서 고르고, 자동이면 화면 테마에 맞춰요
const LOGO_STYLES=[['auto','자동 (화면 테마에 맞춤)'],['stroke','가로획 명조 · 먹빛'],['star','별빛 그라데이션 · 첨탑'],['orbitline','궤도선 · 행성 외곽선'],['stencil','거친 스텐실 질감'],['regal','기품 · 명조 금빛'],['sharp','전술 · 각진 금속'],['orbit','SF · 네온'],['heavy','묵직한 장식체'],['cute','귀여운 · 파스텔']];
/* 타이틀 줄 나누기: 띄어쓰기에서만 나누고(글자 중간에서 끊지 않음), 두 줄 길이를 비슷하게. 긴 한 단어는 줄이지 않고 글자를 작게 */
const tlLen=x=>[...String(x)].reduce((n,ch)=>n+(/[가-힣ㄱ-ㅎ一-鿿]/.test(ch)?1:/\s/.test(ch)?0.35:0.62),0);
const tlSpan=x=>`<span class="tl" style="--tl:${Math.max(2.2,tlLen(x)*1.06).toFixed(2)}">${esc(x)}</span>`;
let OP=null;
