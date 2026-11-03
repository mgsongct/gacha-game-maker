가챠 게임 메이커 중계 서버 — Vercel 판

아이폰·PC 웹 버전에서 일부 AI 서비스가 브라우저 직접 호출(CORS)을 막을 때 거쳐 가는 서버예요.
Cloudflare Workers 판(../worker.js)과 똑같이 동작하니 둘 중 편한 곳에 하나만 만들면 돼요.

만드는 법
1. 이 vercel 폴더(api/proxy.js, vercel.json, package.json)를 내 GitHub 저장소에 올려요.
2. vercel.com → Add New → Project → 그 저장소를 고르고 Deploy.
   (폴더 안에 넣었다면 Root Directory를 그 폴더로 지정)
3. 프로젝트 Settings → Environment Variables에 ALLOW_ORIGIN = 내 웹 주소(예: https://내아이디.github.io)를 넣고 다시 배포.
   이 포크의 웹(https://mgsongct.github.io)으로만 쓸 거면 넣지 않아도 돼요.
4. 앱 설정 → 화면·연출 → 중계 서버 설정에 https://내프로젝트.vercel.app 을 넣어요.

참고
- 무료(Hobby) 요금제에서 요청 하나는 최대 300초까지 기다려요. 아주 긴 생성은 중간에 끊길 수 있어요.
- 이 서버는 내 API 키를 저장하지 않고 그대로 전달만 해요.
