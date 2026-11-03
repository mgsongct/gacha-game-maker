// 가챠 게임 메이커 — 아이폰·웹 버전용 중계 서버 (Vercel)
// 브라우저가 직접 부르지 못하는 AI 서비스만 이 서버를 거쳐요. Cloudflare Workers 판(worker.js)과 똑같이 동작해요.
// 환경 변수 ALLOW_ORIGIN에 내 웹 주소(예: https://내아이디.github.io)를 넣으면 다른 사이트는 이 서버를 못 써요.
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'https://mgsongct.github.io';
const ALLOW_HOSTS = [
  'api.anthropic.com', 'generativelanguage.googleapis.com', 'aiplatform.googleapis.com', 'oauth2.googleapis.com',
  'api.openai.com', 'openrouter.ai', 'ollama.com', 'api.deepseek.com', 'api.llmgateway.io', 'image.novelai.net', 'api.fish.audio', 'api.elevenlabs.io',
  'raw.githubusercontent.com', 'api.github.com', 'github.com', 'api.githubcopilot.com', 'api.individual.githubcopilot.com',
];
function cors(req) {
  return {
    'access-control-allow-origin': ALLOW_ORIGIN,
    'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': req.headers.get('access-control-request-headers') || '*',
    'access-control-expose-headers': '*',
    'access-control-max-age': '86400',
    'vary': 'origin',
  };
}
async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
  const origin = req.headers.get('origin') || '';
  if (origin && origin !== ALLOW_ORIGIN) return new Response('origin not allowed', { status: 403 });
  let target;
  try { target = new URL(new URL(req.url).searchParams.get('u')); } catch (e) { return new Response('bad url', { status: 400, headers: cors(req) }); }
  const ok = target.protocol === 'https:' && (ALLOW_HOSTS.includes(target.hostname) || target.hostname.endsWith('-aiplatform.googleapis.com'));
  if (!ok) return new Response('host not allowed', { status: 403, headers: cors(req) });
  const h = new Headers(req.headers);
  ['origin', 'referer', 'host', 'cookie', 'connection', 'content-length', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip', 'forwarded']
    .concat([...h.keys()].filter(k => k.startsWith('x-vercel-')))
    .forEach(k => h.delete(k));
  const r = await fetch(target, { method: req.method, headers: h, body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(), redirect: 'follow' });
  const out = new Headers(r.headers);
  ['content-encoding', 'content-length', 'transfer-encoding', 'connection'].forEach(k => out.delete(k));
  Object.entries(cors(req)).forEach(([k, v]) => out.set(k, v));
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: out });
}
export const GET = handle, HEAD = handle, POST = handle, PUT = handle, PATCH = handle, DELETE = handle, OPTIONS = handle;
