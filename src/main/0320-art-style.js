/* ===== 그림체 (직접 입력) ===== */
const STYLE_EX='예: anime coloring, cel shading, vibrant colors  /  watercolor (medium), soft colors  /  1.2::artist:이름 ::';
function naiSaved(){let sv={};try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){}return sv;}
function setMyStyle(tags,neg){const sv=naiSaved();sv.styles=[{id:'my_style',name:'내 그림체',tags:String(tags||'').trim(),neg:String(neg||'').trim()}];sv.styleId='my_style';appStorage.setItem(NKEY,JSON.stringify(sv));}
function myStyle(){return naiCfg().styles[0];}
const BOOT_CATS=[['char','스탠딩 (전신)',true],['upper','상반신 (스토리·프로필)',true],['illust','일러스트 (타이틀·로비·픽업)',true],['bg','배경',true],['icon','재화 아이콘',true],['prop','소품 (스토리에 나오는 물건)',true],['weapon','전용 무기',true],['enemy','적',false],['map','작전 지도',false],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let BP=null;
const bootCats=()=>BOOT_CATS;
function bootPrepNeeded(){ const p=P(); return !playMode()&&!p.seenOpening&&!p.bootPrep&&imgReady()&&drawTodo(bootCats().map(x=>x[0])).length>0; }
