// لوحة إنتاج نوى: npm run dashboard  ثم افتح http://127.0.0.1:4174
// خادم محلي بلا مكتبات (على نفس فكرة لوحة JAWAB Studio). الحالة من ملفات المشروع نفسها: data/series.json وsrc/episodes وout وwork.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { PAGE } from "./dashboard-page.mjs";

try { process.loadEnvFile(); } catch {}
const PORT = Number(process.env.DASHBOARD_PORT ?? 4174);
const HOST = "127.0.0.1"; // هذا الجهاز فقط
const ROOTS = ["out", "assets", "work/jobs"].map(d => resolve(d) + sep);
const MIME = { ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".png": "image/png", ".ico": "image/x-icon", ".srt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8", ".log": "text/plain; charset=utf-8", ".json": "application/json" };
const VOICES = ["ar-SA-HamedNeural", "ar-EG-SalmaNeural", "ar-SA-ZariyahNeural"];
mkdirSync("work/jobs", { recursive: true });

// ---- الدخول عن بعد (Cloudflare Tunnel وغيره): الطلب القادم عبر وسيط يتطلب كلمة مرور DASHBOARD_PASSWORD دائمًا.
// الأنفاق تصل إلى الخادم من 127.0.0.1، لذلك نعرّف الوسيط من ترويسات cf-connecting-ip وx-forwarded-for وHost وليس من العنوان.
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? "";
const PUBLIC = process.env.DASHBOARD_PUBLIC === "1"; // عرض عام للجميع بلا كلمة مرور: قراءة فقط، دون لقطات الإدارة ولا السجلات ولا أي تحكم
const ADMIN_USER = process.env.DASHBOARD_ADMIN_USER ?? "admin";
// التحكم عن بعد لا يُفتح بكلمة مرور ضعيفة (أقل من 10 أحرف) إلا بتصريح صريح DASHBOARD_ALLOW_WEAK=1
const REMOTE_CONTROL = process.env.DASHBOARD_ALLOW_WEAK === "1" || (process.env.DASHBOARD_PASSWORD ?? "").length >= 10; // السماح بتشغيل الإنتاج من بعيد (افتراضيًا: عرض فقط)
const sessions = new Map(), fails = new Map();
const dg = x => createHash("sha256").update(x).digest();
const same = (a, b) => timingSafeEqual(dg(a), dg(b));
const isRemote = req => !!(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.headers["cf-ray"]) || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host ?? "");
const sess = req => { const t = /(?:^|;\s*)nsess=([a-f0-9]{64})/.exec(req.headers.cookie ?? "")?.[1]; const e = t && sessions.get(t); return !!e && e > Date.now(); };
const LOGIN = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>استوديو نوى</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f9f8fc;font-family:Segoe UI,Tahoma,sans-serif;color:#342616"><form id=f style="background:#fff;border:1px solid #ecd9c8;border-radius:16px;padding:28px;width:min(340px,92vw);display:flex;flex-direction:column;gap:12px"><h2 style="margin:0;color:#c34d04">استوديو نوى</h2><input id=u placeholder="المستخدم" value="admin" style="font:inherit;padding:10px 12px;border:1px solid #ecd9c8;border-radius:10px"><input id=p type=password placeholder="كلمة المرور" autofocus style="font:inherit;padding:10px 12px;border:1px solid #ecd9c8;border-radius:10px"><button style="font:inherit;background:#c34d04;color:#fff;border:0;border-radius:10px;padding:10px;cursor:pointer">دخول</button><div id=m style="color:#d62f2f;font-size:13px;min-height:16px"></div></form><script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch("/api/login",{method:"POST",headers:{"content-type":"application/json","x-tutorial":"1"},body:JSON.stringify({user:u.value,password:p.value})});if(r.ok)location.href="/";else m.textContent=(await r.json()).error||"خطأ"}</script></body></html>`;

// ---- المهام: مهمة إنتاج واحدة في كل مرة، وسجلها في work/jobs
let job = null;
const history = [];
function start(ep, { remix, voice }) {
  if (job && job.status === "Running") throw new Error("هناك مهمة قيد التنفيذ");
  if (!/^\d\d-[a-z0-9-]+$/.test(ep) || !existsSync(`src/episodes/${ep}.mjs`)) throw new Error("حلقة غير معروفة");
  if (voice && !VOICES.includes(voice)) throw new Error("صوت غير مسموح");
  const args = ["src/produce.mjs", ep, ...(voice ? [`--voice=${voice}`] : []), ...(remix ? ["--remix"] : [])];
  const id = Date.now().toString(36), log = `work/jobs/${id}.log`;
  const out = createWriteStream(log);
  const p = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  job = { id, ep, remix: !!remix, voice: voice ?? VOICES[0], status: "Running", startedAt: Date.now(), log };
  const mine = job;
  p.stdout.pipe(out, { end: false }); p.stderr.pipe(out, { end: false });
  p.on("close", code => { out.end(); Object.assign(mine, { status: code === 0 ? "Completed" : "Failed", code, endedAt: Date.now() }); history.unshift({ ...mine }); history.length = Math.min(history.length, 15); });
  return `بدأ الإنتاج: ${ep}${remix ? " (إعادة مونتاج)" : ""}`;
}
const tail = (file, n = 40) => { try { return readFileSync(file, "utf8").split(/\r?\n/).slice(-n).join("\n"); } catch { return ""; } };

// ---- الحالة
async function episodeFiles() {
  const res = {};
  for (const f of readdirSync("src/episodes").filter(x => x.endsWith(".mjs"))) {
    const id = f.replace(/\.mjs$/, "");
    try {
      const full = resolve("src/episodes", f);
      const m = await import(pathToFileURL(full).href + "?t=" + statSync(full).mtimeMs);
      const mp4 = `out/nawa-${id}.mp4`, srt = `out/nawa-${id}.srt`, meta = `work/${id}/meta.json`;
      let total; try { total = JSON.parse(readFileSync(meta, "utf8")).total; } catch {}
      res[id] = {
        id, title: m.meta?.title, goals: m.meta?.goals ?? [],
        steps: m.steps.map(s => ({ id: s.id, card: s.card, speech: s.speech })),
        video: existsSync(mp4) ? { path: mp4, mb: +(statSync(mp4).size / 1e6).toFixed(1), at: statSync(mp4).mtimeMs, sec: total && Math.round(total) } : undefined,
        srt: existsSync(srt) ? srt : undefined, canRemix: existsSync(meta),
      };
    } catch (e) { res[id] = { id, error: e.message }; }
  }
  return res;
}
function shots() {
  const res = {};
  for (const d of ["public", "app", "admin"]) {
    const dir = `assets/screens/${d}`;
    res[d] = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith(".png")).sort().map(f => `${dir}/${f}`) : [];
  }
  return res;
}
async function state() {
  const series = JSON.parse(readFileSync("data/series.json", "utf8"));
  const eps = await episodeFiles();
  for (const s of series) for (const e of s.episodes) {
    const f = e.ep && eps[e.ep];
    e.status = f?.video ? "Completed" : f ? "Scripted" : "Planned";
  }
  const all = series.flatMap(s => s.episodes);
  const env = existsSync(".env") ? readFileSync(".env", "utf8") : "";
  return {
    series, episodes: eps, voices: VOICES, shots: shots(),
    counts: { total: all.length, done: all.filter(e => e.status === "Completed").length, scripted: all.filter(e => e.status === "Scripted").length },
    job: job && { ...job, tail: tail(job.log) }, history,
    brand: { logo: "assets/brand/logo.png", music: existsSync("assets/music/nawa-ambient.mp3") ? "assets/music/nawa-ambient.mp3" : null, colors: { "الأساسي": "#c34d04", "التوهّج": "#ff8a1f", "النص": "#342616", "الخلفية": "#f9f8fc" } },
    env: { site: /^NAWA_PASSWORD=\S/m.test(env), eleven: /^ELEVENLABS_API_KEY=\S/m.test(env) },
  };
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, body, type = "application/json; charset=utf-8") => { res.writeHead(code, { "content-type": type, "cache-control": "no-store" }); res.end(body); };
  try {
    const remote = isRemote(req);
    if (remote) {
      if (url.pathname === "/login" && PASSWORD) return send(200, LOGIN, "text/html; charset=utf-8");
      if (!PASSWORD && !PUBLIC) return send(503, "الوصول عن بعد مغلق: ضع DASHBOARD_PASSWORD في .env", "text/plain; charset=utf-8");
      const ip = String(req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? req.socket.remoteAddress).split(",")[0].trim();
      if (url.pathname === "/api/login" && req.method === "POST") {
        if (!PASSWORD) return send(404, "{}");
        if (req.headers["x-tutorial"] !== "1") return send(403, "{}");
        const f = fails.get(ip);
        if (f && f.n >= 5 && f.until > Date.now()) return send(429, JSON.stringify({ error: "محاولات كثيرة، حاول بعد قليل" }));
        let body = ""; req.on("data", d => { body += d; if (body.length > 2000) req.destroy(); });
        req.on("end", () => {
          let pw = "", us = ""; try { const j = JSON.parse(body); pw = String(j.password ?? ""); us = String(j.user ?? ""); } catch {}
          const okU = same(us, ADMIN_USER), okP = same(pw, PASSWORD);
          if (okU && okP) {
            fails.delete(ip); const t = randomBytes(32).toString("hex"); sessions.set(t, Date.now() + 12 * 3600_000);
            res.writeHead(200, { "content-type": "application/json", "set-cookie": "nsess=" + t + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200" + (req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "") });
            return void res.end("{}");
          }
          const n = (fails.get(ip)?.n ?? 0) + 1; fails.set(ip, { n, until: Date.now() + 600_000 });
          send(401, JSON.stringify({ error: "كلمة المرور خاطئة" }));
        });
        return;
      }
      if (!PUBLIC && !sess(req)) return url.pathname === "/" ? send(401, LOGIN, "text/html; charset=utf-8") : send(401, JSON.stringify({ error: "login required" }));
    }
    const control = !remote || (REMOTE_CONTROL && sess(req));
    if (url.pathname === "/") return send(200, PAGE, "text/html; charset=utf-8");
    if (url.pathname === "/api/state") { const st = await state(); if (remote) { st.shots.admin = []; st.history = []; st.env = { site: true, eleven: false }; } return send(200, JSON.stringify({ ...st, control, remote, job: remote ? st.job && { ...st.job, tail: "" } : st.job })); }
    if (url.pathname === "/api/cmd" && req.method === "POST") {
      if (!control) return send(403, JSON.stringify({ ok: false, message: "التشغيل عن بعد مغلق (DASHBOARD_REMOTE_CONTROL=1 لفتحه)" }));
      if (req.headers["x-tutorial"] !== "1" || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) return send(403, '{"error":"forbidden"}');
      let body = ""; req.on("data", d => { body += d; if (body.length > 5000) req.destroy(); });
      req.on("end", () => {
        try {
          const c = JSON.parse(body);
          if (c.cmd !== "produce") throw new Error("أمر غير معروف");
          send(200, JSON.stringify({ ok: true, message: start(c.ep, c) }));
        } catch (e) { send(400, JSON.stringify({ ok: false, message: e.message })); }
      });
      return;
    }
    if (url.pathname.startsWith("/media/")) {
      const file = resolve(decodeURIComponent(url.pathname.slice(7)));
      if (remote && (file.includes(sep + "admin" + sep) || file.includes(sep + "jobs" + sep))) return send(404, "not found", "text/plain");
      if (!ROOTS.some(r => file.startsWith(r)) || !existsSync(file) || !statSync(file).isFile()) return send(404, "not found", "text/plain");
      const size = statSync(file).size, type = MIME[extname(file)] ?? "application/octet-stream";
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
      if (m) {
        const a = m[1] ? Number(m[1]) : 0, b = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
        res.writeHead(206, { "content-type": type, "content-range": `bytes ${a}-${b}/${size}`, "accept-ranges": "bytes", "content-length": b - a + 1 });
        return void createReadStream(file, { start: a, end: b }).pipe(res);
      }
      res.writeHead(200, { "content-type": type, "content-length": size, "accept-ranges": "bytes" });
      return void createReadStream(file).pipe(res);
    }
    send(404, "not found", "text/plain");
  } catch (e) { send(500, JSON.stringify({ error: e.message })); }
}).listen(PORT, HOST, () => console.log(`Nawa dashboard: http://127.0.0.1:${PORT}`));
