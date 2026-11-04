/* ===== 포크 기능 내용 자동 채움(실행 중 AI) =====
   원안의 liveTick이 게임이 구동되는 동안 장·이벤트·톡을 AI로 만들듯, 포크 기능의 내용이 비어 있으면 구동 중에 자동으로 채워요.
   채우는 방법은 콘텐츠 점검(0535) 규칙의 고치기를 그대로 써요(auditFixOne). 자동이 기본이고, 사용자는 콘텐츠 점검·각 화면에서
   직접 고치거나 AI에 추가 지시할 수 있어요. 설정 → 라이브 운영의 "빈 콘텐츠 자동 채움"으로 끌 수 있어요(live.on.fill) */
const LIVE_FILL_AUTO=['g_spots','g_codex','c_symbol','c_pos','c_range','s_rules']; // 규칙으로 채움(일정 장소만 글 AI가 있으면 AI로 — auditAutoRun) — 빈 것은 매번
const LIVE_FILL_AI=['g_pos','w_stance','c_persona','c_pfields','c_afftalk','c_memorial','c_spot','s_direct']; // AI로 채움 — 한 번에 LIVE_FILL_MAX개까지
const LIVE_FILL_OWNED=new Set(['c_afftalk','c_memorial','c_spot']);              // 만날 수 있는(보유한) 대원부터
const LIVE_FILL_NAME={g_spots:'일정 장소',g_codex:'도감 규칙',c_symbol:'상징 컬러·아이템',c_pos:'포지션',c_range:'사거리',s_rules:'전장 규칙',g_pos:'포지션 설계',w_stance:'세력 관계 변화',c_persona:'개성 시트',c_pfields:'프로필 항목',c_afftalk:'인연 톡',c_memorial:'메모리얼',c_spot:'일정 장면',s_direct:'대본 연출'};
const LIVE_FILL_MAX=4;
async function liveFill(notes){ if(subLocked()) return 0; const done={}, add=id=>{ done[id]=(done[id]||0)+1; }, group=id=>auditScan().find(g=>g.rule.id===id);
  for(const id of LIVE_FILL_AUTO){ const g=group(id); if(!g) continue; for(const o of g.items) if(await auditFixOne(g.rule,o)) add(id); }
  let n=0; if(SAMPLE) for(const id of LIVE_FILL_AI){ if(n>=LIVE_FILL_MAX) break; const g=group(id); if(!g) continue;
    for(const o of LIVE_FILL_OWNED.has(id)?g.items.filter(c=>own(c.id)):g.items){ if(n>=LIVE_FILL_MAX) break; liveBar(`${LIVE_FILL_NAME[id]}을(를) 채우는 중…`); n++; if(await auditFixOne(g.rule,o)) add(id); } }
  const ids=Object.keys(done); if(ids.length){ mark('prog'); notes.push('비어 있던 콘텐츠를 채웠어요: '+ids.map(id=>`${LIVE_FILL_NAME[id]} ${done[id]}`).join(', ')+' (콘텐츠 점검·각 화면에서 고칠 수 있어요)'); }
  return ids.length; }
// liveTick에서 부르는 세 곳: 정기 실행의 채우기 단계, 첫 실행(주기 기준만 잡고 돌아갈 때 — 채우기는 주기와 상관없어서 이때도), 알림 합치기
async function liveFillStep(on,notes){ if(!on.fill) return; liveBar('비어 있는 콘텐츠를 채우는 중…'); await liveFill(notes); }
async function liveFillRun(on){ if(!on.fill||LIVE_RUN) return; LIVE_RUN=true; liveBar('비어 있는 콘텐츠를 채우는 중…'); const notes=[];
  try{ await liveFill(notes); }catch(e){ quietErr(e,'liveFillRun'); } finally{ LIVE_RUN=false; liveBar(null); } if(notes.length) toast(notes[0]); }
function liveFillNotes(notes,fill){ if(notes.length) notes.push(...fill); else if(fill.length) toast(fill[0]); } // 채운 것만으로는 업데이트 보급 우편을 보내지 않음
