// استوديو نوى: ينتج حلقة تعليمية كاملة (تسجيل + كاميرا زوم + صوت + موسيقى + هوية + ترجمة)
// الاستعمال: node src/produce.mjs 01-platform-tour [--voice=eleven|ar-SA-HamedNeural] [--voice-id=<id>] [--suffix=v2] [--remix]
// الفكرة: التسجيل بدقة 2560×1440 (زوم صفحة 1.333 فتبقى المقاسات كما في 1920×1080)،
// والزوم يُنفَّذ في المونتاج ككاميرا سلسة (منحنى تسارع) فيبقى حادًّا وغير متقطع.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const epId = process.argv.find(a => /^\d\d-/.test(a)) ?? "01-platform-tour";
const voice = (process.argv.find(a => a.startsWith("--voice=")) ?? "--voice=ar-SA-HamedNeural").split("=")[1];
const REMIX = process.argv.includes("--remix");
const rate = "-3%";
const VW = 2560, VH = 1440, ZF = 4 / 3, OW = 1920, OH = 1080, FPS = 30, MOVE = 1.0;
const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()]));
const BASE = new URL(env.NAWA_BASE_URL).origin;
const { meta, steps } = await import(pathToFileURL(`src/episodes/${epId}.mjs`).href);
const work = `work/${epId}`; mkdirSync(work + "/voice", { recursive: true }); mkdirSync(work + "/cap", { recursive: true }); mkdirSync("out", { recursive: true });
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // بعض الشبكات (DNS64) تعطي عنوان IPv6 لا يستجيب فيفشل Node دون curl
try { process.loadEnvFile(); } catch {}
const EL_KEY = process.env.ELEVENLABS_API_KEY, EL_VOICE = (process.argv.find(a => a.startsWith("--voice-id=")) ?? "").slice(11) || process.env.ELEVENLABS_VOICE_ID;
const SUFFIX = (process.argv.find(a => a.startsWith("--suffix=")) ?? "").slice(9); // مثال: --suffix=v2 يكتب out/nawa-<id>-v2.mp4
const wantEleven = !!(EL_KEY && EL_VOICE) && (!process.argv.some(a => a.startsWith("--voice=")) || process.argv.includes("--voice=eleven"));
async function elevenTTS(text, file) {
  const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(EL_VOICE) + "?output_format=mp3_44100_128", {
    method: "POST", headers: { "xi-api-key": EL_KEY, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.8 } }) });
  if (!r.ok) throw new Error("ElevenLabs " + r.status + " " + (await r.text()).slice(0, 200).split(EL_KEY).join("***"));
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}
const run = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28 }); if (r.status !== 0) throw new Error(cmd + " failed: " + (r.stderr || r.stdout).slice(0, 800)); return r.stdout; };
const dur = f => parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));
const q = t => Math.round(t * FPS) / FPS;
const newest = d => readdirSync(d).filter(f => f.endsWith(".webm")).map(f => [f, statSync(`${d}/${f}`).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];

// 1) الصوت: ElevenLabs إن وُجد المفتاح ومعرّف الصوت في .env (الافتراضي)، وإلا Edge TTS المجاني؛ مع ذاكرة مؤقتة
for (const s of steps) {
  let useEleven = wantEleven;
  const key = createHash("md5").update((useEleven ? "el:" + EL_VOICE : voice + rate) + s.speech).digest("hex").slice(0, 10);
  s.audio = `${work}/voice/${s.id}-${key}.mp3`;
  if (!existsSync(s.audio) && useEleven) {
    // لا تحويل صامت للصوت المجاني: خلط صوتين في فيديو واحد غير مقبول. نعيد المحاولة ثم نتوقف بخطأ واضح (استعمل --voice=ar-SA-HamedNeural لاختيار المجاني صراحةً)
    let err;
    for (let k = 0; k < 4; k++) { try { await elevenTTS(s.speech, s.audio); err = null; break; } catch (e) { err = e; await new Promise(r => setTimeout(r, 2500 * (k + 1))); } }
    if (err) throw new Error("ElevenLabs غير متاح (" + (err.cause?.code || err.message) + "). لم يُنتَج شيء. أعد المحاولة لاحقًا أو استعمل --voice=ar-SA-HamedNeural");
    console.log("tts(eleven)", s.id);
  }
  if (!existsSync(s.audio)) { run("python", ["-m", "edge_tts", "--voice", voice, `--rate=${rate}`, "--text", s.speech, "--write-media", s.audio]); console.log("tts", s.id); }
  s.dur = dur(s.audio);
}
console.log("narration total", steps.reduce((a, s) => a + s.dur, 0).toFixed(1), "s");

let webm, vtrim, total, timeline = [], cam = [];
if (REMIX) ({ webm, vtrim, total, timeline, cam } = JSON.parse(readFileSync(`${work}/meta.json`, "utf8")));
else {
  // 2) دخول خارج التسجيل (حتى لا تظهر بيانات الحساب)
  const browser = await chromium.launch();
  const c0 = await browser.newContext({ ignoreHTTPSErrors: true }); const p0 = await c0.newPage();
  await p0.goto(BASE + "/login", { waitUntil: "networkidle" });
  await p0.fill("input[name=email]", env.NAWA_USER); await p0.fill("input[name=password]", env.NAWA_PASSWORD);
  await p0.click("button[type=submit]"); await p0.waitForURL(/\/ar|admin/, { timeout: 20000 });
  const state = await c0.storageState(); await c0.close();

  // 3) التسجيل
  const rec = `${work}/rec`; mkdirSync(rec, { recursive: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, storageState: state, viewport: { width: VW, height: VH }, recordVideo: { dir: rec, size: { width: VW, height: VH } } });
  await ctx.addInitScript({ content: `window.__Z=${ZF};(()=>{const a=()=>{document.documentElement&&(document.documentElement.style.zoom="${ZF}")};a();document.addEventListener("readystatechange",a);document.addEventListener("DOMContentLoaded",a);new MutationObserver(a).observe(document,{childList:true});setInterval(a,500)})();` });
  await ctx.addInitScript({ path: "src/overlay.js" });
  const p = await ctx.newPage(); const tVideo0 = Date.now();
  const w = ms => p.waitForTimeout(ms);
  const logo = "data:image/png;base64," + readFileSync("assets/brand/logo.png").toString("base64");
  const cardHtml = {
    intro: `<div style="text-align:center;max-width:1300px"><img src="${logo}" style="width:520px;display:block;margin:0 auto"><div style="font-size:78px;font-weight:700;margin:40px 0 10px">${meta.title}</div><div style="font-size:30px;color:#c34d04;margin-bottom:30px">في هذه الحلقة</div><div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">${meta.goals.map(g => `<span style="background:#fff;border:1.5px solid #f0c9a8;border-radius:999px;padding:12px 28px;font-size:28px;font-weight:600">${g}</span>`).join("")}</div></div>`,
    outro: `<div style="text-align:center"><img src="${logo}" style="width:520px;display:block;margin:0 auto"><div style="font-size:72px;font-weight:700;margin:40px 0 12px">شكرًا لمتابعتكم</div><div style="font-size:32px;color:#c34d04">nawamusic.com</div></div>`,
  };
  const Q = (sel, o = {}) => { if (o.exact && sel.startsWith("text=") && !sel.startsWith('text="')) sel = `text="${sel.slice(5)}"`; return p.locator(sel).first(); };
  const rectOf = (loc, up = 0, contains) => loc.evaluate((e, [up, contains]) => { for (let i = 0; i < up && e.parentElement; i++) e = e.parentElement; if (contains) while (e.parentElement && !e.querySelector(contains)) e = e.parentElement; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, [up, contains]);
  let tBase = 0; const rel = () => (Date.now() - tBase) / 1000;
  let camNow = { z: 1, cx: VW / 2, cy: VH / 2 };
  const camTo = async (z, cx, cy) => {
    const hw = VW / z / 2, hh = VH / z / 2;
    const n = { z, cx: Math.min(Math.max(cx, hw), VW - hw), cy: Math.min(Math.max(cy, hh), VH - hh) };
    if (Math.abs(n.z - camNow.z) < 0.01 && Math.abs(n.cx - camNow.cx) < 4 && Math.abs(n.cy - camNow.cy) < 4) return;
    cam.push({ t: rel(), ...n }); camNow = n; await w(MOVE * 1000 + 100);
  };
  const h = {
    wait: ms => w(ms),
    async goto(path) { await h.cameraFull(); await p.evaluate(() => __P.veil(true)); await p.goto(BASE + path, { waitUntil: "domcontentloaded" }); await w(900); await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {}); await w(700); await p.evaluate(() => __P.initCursor()); await p.evaluate(() => __P.veil(false)); await w(300); },
    async unfocus() { await p.evaluate(() => __P.ring(null)); await w(250); },
    async cameraFull() { await p.evaluate(() => __P.ring(null)); await camTo(1, VW / 2, VH / 2); },
    async scroll(px) { await h.cameraFull(); const n = Math.ceil(Math.abs(px) / 40), d = Math.sign(px) * 55; for (let i = 0; i < n; i++) { await p.mouse.wheel(0, d); await w(30); } await w(700); },
    async _show(rect, zoom) {
      const s0 = zoom && zoom > 1 ? Math.min(zoom, VW * 0.8 / rect.w, VH * 0.45 / rect.h) : 1;
      const s = s0 >= 1.12 ? s0 : 1;
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
      await p.evaluate(() => __P.ring(null)); await w(380);
      const cursor = p.evaluate(([x, y]) => __P.cursor(x, y, 900), [cx, cy]);
      await camTo(s, s === 1 ? VW / 2 : cx, s === 1 ? VH / 2 : cy + (VH / s) * 0.09);
      await cursor; if (!(rect.w * rect.h > VW * VH * 0.55)) await p.evaluate(r => __P.ring(r), rect); await w(400);
    },
    async focus(sel, o = {}) {
      const loc = Q(sel, o); await loc.waitFor({ timeout: 15000 });
      let r = await rectOf(loc, o.up ?? 0, o.contains);
      if (r.y < 100 || r.y + r.h > VH - 170) {
        await h.cameraFull();
        await loc.evaluate(e => e.scrollIntoView({ block: "center", behavior: "smooth" })); await w(1100);
        r = await rectOf(loc, o.up ?? 0, o.contains);
      }
      await h._show(r, o.zoom);
    },
    async focusLinks(texts, o = {}) {
      const rs = []; for (const t of texts) rs.push(await rectOf(p.locator(`header a:has-text("${t}")`).first()));
      const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y)), x2 = Math.max(...rs.map(r => r.x + r.w)), y2 = Math.max(...rs.map(r => r.y + r.h));
      await h._show({ x, y, w: x2 - x, h: y2 - y }, o.zoom);
    },
    async click(sel) {
      await h.cameraFull();
      const loc = Q(sel); await loc.waitFor({ timeout: 15000 }); const r = await rectOf(loc);
      await p.evaluate(r => __P.cursor(r.x + r.w / 2, r.y + r.h / 2, 900), r);
      await p.evaluate(() => __P.ripple()); await p.evaluate(() => __P.veil(true)); await loc.click(); await p.waitForLoadState("domcontentloaded"); await w(900); await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {}); await w(600); await p.evaluate(() => __P.initCursor()); await p.evaluate(() => __P.veil(false)); await w(300);
    },
    async type(sel, text) { const loc = Q(sel); const r = await rectOf(loc); await p.evaluate(() => __P.ring(null)); await p.evaluate(r => __P.cursor(r.x + 80, r.y + r.h / 2, 700), r); await p.evaluate(() => __P.ripple()); await loc.click(); await loc.pressSequentially(text, { delay: 170 }); await w(900); },
    async clear(sel) { await Q(sel).fill(""); await w(500); },
  };

  await p.goto(BASE + "/ar/", { waitUntil: "domcontentloaded" }); await w(2500);
  await p.evaluate(([html]) => { __P.initCursor(); __P.card(html, true); }, [cardHtml.intro]);
  await w(900);
  tBase = Date.now();                        // لحظة ظهور البطاقة = زمن الصفر
  for (const [i, s] of steps.entries()) {
    console.log(`step ${i + 1}/${steps.length} ${s.id}`);
    if (s.card && i > 0) { await h.cameraFull(); await p.evaluate(([html]) => __P.card(html, true), [cardHtml[s.card]]); await w(900); }
    if (s.pre) await s.pre(h);
    const t = rel();
    timeline.push({ id: s.id, t, dur: s.dur, text: s.text ?? s.speech, audio: s.audio, card: !!s.card, n: i, T: steps.length - 2 });
    const post = s.post ? s.post(h) : Promise.resolve();
    await Promise.all([post, w(s.dur * 1000 + 450)]);
    if (s.card === "intro") { await p.evaluate(() => __P.card(null, false)); await w(900); }
  }
  await w(1500);
  const tEnd = rel();
  await ctx.close(); await browser.close();
  webm = newest(rec);
  vtrim = (tBase - tVideo0) / 1000 - 0.1;
  total = tEnd + 0.1;
  writeFileSync(`${work}/meta.json`, JSON.stringify({ webm, vtrim, total, timeline, cam }));
}

// 4) الشرح المكتوب: صور شفافة لكل جملة (لا تتأثر بحركة الكاميرا)
const chunks = [];
{
  const browser = await chromium.launch(); const pg = await browser.newPage({ viewport: { width: 1700, height: 400 } });
  await pg.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@600;700&display=swap"><body style="margin:0;background:transparent"></body>`);
  await pg.evaluate(() => document.fonts.load("600 34px 'IBM Plex Sans Arabic'")).catch(() => {}); await pg.waitForTimeout(800);
  for (const t of timeline) {
    if (t.card) continue;
    let parts = t.text.split(/(?<=[.؟!])\s+/).flatMap(s => s.length > 95 ? s.split(/(?<=،)\s+/) : [s]).filter(Boolean);
    const merged = []; for (const s of parts) { if (merged.length && merged[merged.length - 1].length < 28) merged[merged.length - 1] += " " + s; else merged.push(s); }
    const totalCh = merged.reduce((a, s) => a + s.length, 0); let acc = 0;
    for (const [k, s] of merged.entries()) {
      const start = t.t + 0.15 + (t.dur - 0.15) * acc / totalCh; acc += s.length;
      const end = k === merged.length - 1 ? t.t + t.dur + 0.5 : t.t + 0.15 + (t.dur - 0.15) * acc / totalCh;
      const file = `${work}/cap/${t.id}-${k}-${createHash("md5").update(s).digest("hex").slice(0, 6)}.png`;
      await pg.evaluate(([s, n, T]) => { document.body.innerHTML = `<div id="w" style="display:inline-block;padding:26px 40px 30px"><div id="c" style="display:block;position:relative;max-width:1560px;background:rgba(52,38,22,.95);color:#fff;border-radius:22px;padding:22px 40px 26px;font:600 36px/1.7 'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;direction:rtl;text-align:center;border:2px solid rgba(255,138,31,.6)"><span style="position:absolute;top:-18px;right:26px;background:#c34d04;border-radius:999px;font:700 18px 'IBM Plex Sans Arabic','Segoe UI';padding:4px 18px">${n} من ${T}</span>${s}</div></div>`; }, [s, t.n, t.T]);
      await pg.locator("#w").screenshot({ path: file, omitBackground: true });
      chunks.push({ file, start: q(start), end: q(end) });
    }
  }
  await browser.close();
}

// 5) المونتاج: كاميرا + شرح + صوت + موسيقى مع خفض تلقائي أثناء الكلام
const rec = `${work}/rec`;
if (REMIX) webm = newest(rec);
const vt = t => q(t + 0.1);                                    // زمن الفيديو بعد القص
const states = [{ t: 0, z: 1, cx: VW / 2, cy: VH / 2 }];
const segs = []; { let cur = states[0], tc = 0;
  const hold = (a, b) => { if (b - a >= 1 / FPS - 1e-6) segs.push({ kind: "hold", a, b, s: cur }); };
  for (const k of cam) {
    const kt = Math.max(vt(k.t), tc); const same = Math.abs(k.z - cur.z) < 0.01 && Math.abs(k.cx - cur.cx) < 4 && Math.abs(k.cy - cur.cy) < 4;
    if (same) continue;
    hold(tc, kt); segs.push({ kind: "move", a: kt, b: kt + MOVE, s: cur, e: k }); cur = k; tc = kt + MOVE;
  }
  hold(tc, q(total + 1));
}
const inputs = ["-ss", vtrim.toFixed(2), "-i", `${rec}/${webm}`];
timeline.forEach(t => inputs.push("-i", t.audio));
inputs.push("-stream_loop", "-1", "-i", "assets/music/nawa-ambient.mp3");
chunks.forEach(c => inputs.push("-loop", "1", "-framerate", String(FPS), "-t", (c.end - c.start + 0.1).toFixed(2), "-i", c.file));
const n = timeline.length, mi = n + 1, ci = n + 2;
const K = segs.length;
let fc = `[0:v]fps=${FPS},split=${K}${segs.map((_, i) => `[r${i}]`).join("")}`;
const num = x => x.toFixed(4);
segs.forEach((sg, i) => {
  const tr = `[r${i}]trim=start=${num(sg.a)}:end=${num(sg.b)},setpts=PTS-STARTPTS`;
  if (sg.kind === "hold") {
    const s = sg.s, cw = Math.round(VW / s.z / 2) * 2, chh = Math.round(VH / s.z / 2) * 2;
    const x = Math.round(Math.min(Math.max(s.cx - cw / 2, 0), VW - cw)), y = Math.round(Math.min(Math.max(s.cy - chh / 2, 0), VH - chh));
    fc += `;${tr},${s.z === 1 ? "" : `crop=${cw}:${chh}:${x}:${y},`}scale=${OW}:${OH}:flags=lanczos,setsar=1,format=yuv420p[s${i}]`;
  } else {
    const N = Math.round(MOVE * FPS), a = sg.s, b = sg.e;
    const p = `min(1,on/${N - 1})`, e = `(${p}*${p}*${p}*(${p}*(${p}*6-15)+10))`;
    const z = `(${num(a.z)}+(${num(b.z)}-${num(a.z)})*${e})`;
    const cx = `(${num(a.cx * 2)}+(${num(b.cx * 2)}-${num(a.cx * 2)})*${e})`, cy = `(${num(a.cy * 2)}+(${num(b.cy * 2)}-${num(a.cy * 2)})*${e})`;
    fc += `;${tr},scale=${VW * 2}:${VH * 2}:flags=bilinear,zoompan=z='${z}':x='min(max(${cx}-iw/${z}/2,0),iw-iw/${z})':y='min(max(${cy}-ih/${z}/2,0),ih-ih/${z})':d=1:s=${OW}x${OH}:fps=${FPS},setsar=1,format=yuv420p[s${i}]`;
  }
});
fc += `;${segs.map((_, i) => `[s${i}]`).join("")}concat=n=${K}:v=1:a=0[vc]`;
let last = "vc";
chunks.forEach((c, i) => {
  const d = c.end - c.start;
  fc += `;[${ci + i}:v]format=rgba,fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st=${(d - 0.25).toFixed(2)}:d=0.25:alpha=1,setpts=PTS+${c.start.toFixed(3)}/TB[cp${i}]`;
  fc += `;[${last}][cp${i}]overlay=x=(W-w)/2:y=H-h-22:enable='between(t,${c.start.toFixed(3)},${c.end.toFixed(3)})':eof_action=pass[ov${i}]`;
  last = `ov${i}`;
});
fc += `;[${last}]null[vfinal]`;
// تحسين الصوت: لا يغيّر التوقيت إطلاقًا. فلتر صدى/همس خفيف، قصّ الطنين، تنقية خفيفة، موازنة دفء ووضوح، تخفيف حدّة السين، ضغط لطيف، وتوحيد مستوى كل مقطع
const VOICE_FX = "highpass=f=75,afftdn=nr=6:nf=-50,equalizer=f=220:t=q:w=1:g=-1.5,equalizer=f=3200:t=q:w=1:g=1.5,deesser=i=0.3:m=0.5:f=0.5,acompressor=threshold=0.125:ratio=2.5:attack=15:release=160:makeup=1.5,loudnorm=I=-18:TP=-2:LRA=7,alimiter=limit=0.95";
fc += `;${timeline.map((t, i) => `[${i + 1}:a]${VOICE_FX},adelay=${Math.round((t.t + 0.1) * 1000)}|${Math.round((t.t + 0.1) * 1000)},apad[a${i}]`).join(";")}`;
fc += `;${timeline.map((_, i) => `[a${i}]`).join("")}amix=inputs=${n}:normalize=0:duration=longest,atrim=0:${total.toFixed(2)},asplit=2[vo1][vo2]`;
fc += `;[${mi}:a]volume=0.55,afade=t=in:d=2.5,afade=t=out:st=${(total - 3.5).toFixed(2)}:d=3.5,atrim=0:${total.toFixed(2)}[m]`;
fc += `;[m][vo2]sidechaincompress=threshold=0.015:ratio=12:attack=30:release=800[md]`;
fc += `;[vo1][md]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
writeFileSync(`${work}/filter.txt`, fc);
const outMp4 = `out/nawa-${epId}${SUFFIX ? "-" + SUFFIX : ""}.mp4`;
run("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-/filter_complex", `${work}/filter.txt`, "-map", "[vfinal]", "-map", "[aout]", "-t", total.toFixed(2),
  "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", String(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outMp4]);
// ترجمة SRT
const ts = x => { const ms = Math.round(x * 1000), pad = (v, l = 2) => String(v).padStart(l, "0"); return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`; };
writeFileSync(outMp4.replace(/.mp4$/, ".srt"), timeline.filter(t => !t.card).map((t, i) => `${i + 1}\n${ts(t.t + 0.1)} --> ${ts(t.t + 0.1 + t.dur)}\n${t.text}\n`).join("\n"));
console.log("done", outMp4, total.toFixed(1) + "s", `(${K} camera segments, ${chunks.length} captions)`);
