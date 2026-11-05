// يصوّر كل صفحات منصة نوى (بدون الصفحات التي فيها بيانات أشخاص حقيقيين) إلى assets/screens/
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
process.loadEnvFile(); const env = process.env;
const BASE = new URL(env.NAWA_BASE_URL).origin;
const out = "assets/screens"; mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
const shots = [];
const slug = s => s.replace(/^\/|\/$/g, "").replace(/[\/?=&]/g, "-") || "home";
async function shot(path, name, { full = true, note = "" } = {}) {
  try {
    await p.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await p.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
    await p.waitForTimeout(1800);
    const title = await p.title(); const h1 = await p.locator("h1").first().innerText().catch(() => "");
    const sub = path.includes("/admin") ? "admin" : path.split("?")[0].split("/").filter(Boolean).length > 2 && /^\/ar\/(tools|lessons)\//.test(path) ? "app" : "public";
    mkdirSync(`${out}/${sub}`, { recursive: true });
    const file = `${out}/${sub}/${name}.png`;
    await p.screenshot({ path: file, fullPage: full });
    shots.push({ path, file, title, h1: h1.replace(/\s+/g, " ").slice(0, 70), note }); console.log("ok", name);
  } catch (e) { console.log("FAIL", path, e.message.slice(0, 80)); shots.push({ path, file: "", title: "فشل", h1: "", note: e.message.slice(0, 80) }); }
}
// صفحة الدخول (قبل تسجيل الدخول)
await shot("/login", "00-login", { full: false });
await p.fill("input[name=email]", env.NAWA_USER); await p.fill("input[name=password]", env.NAWA_PASSWORD);
await p.click("button[type=submit]"); await p.waitForURL(/\/ar|admin/, { timeout: 20000 });

const pub = ["/ar/", "/ar/lessons", "/ar/lessons?instrument=theory", "/ar/library", "/ar/tools", "/ar/subscription", "/ar/subscription?contact=1", "/ar/instruments", "/ar/oud", "/ar/qanun", "/ar/violin", "/ar/cello", "/ar/piano", "/ar/about", "/ar/contact", "/ar/contact?topic=teacher", "/ar/privacy", "/ar/terms"];
let i = 1;
for (const path of pub) await shot(path, `${String(i++).padStart(2, "0")}-${slug(path)}`);

// صفحات الأدوات والدروس: نكتشف روابطها الداخلية
await p.goto(BASE + "/ar/tools", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2000);
const toolLinks = await p.$$eval("a", els => Array.from(new Set(els.map(e => e.getAttribute("href")).filter(h => h && /^\/ar\/(tools|tuner|metronome|simulator|fingerboard)[^?#]*/.test(h)))));
for (const path of toolLinks.filter(h => h !== "/ar/tools").slice(0, 6)) await shot(path, `${String(i++).padStart(2, "0")}-${slug(path)}`);
await p.goto(BASE + "/ar/lessons", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2000);
const lessonLinks = await p.$$eval("a", els => Array.from(new Set(els.map(e => e.getAttribute("href")).filter(h => h && /^\/ar\/(lessons|learn|course)\/[^?#]+/.test(h)))));
for (const path of lessonLinks.slice(0, 3)) await shot(path, `${String(i++).padStart(2, "0")}-${slug(path)}`, { note: "صفحة درس/مسار" });

// لوحة الإدارة: صفحات بلا بيانات أشخاص (لا طلاب ولا معلمين ولا مدفوعات ولا بريد)
const admin = ["/ar/admin", "/ar/admin/lessons", "/ar/admin/songs", "/ar/admin/settings", "/ar/admin/content", "/ar/admin/instrument-sounds", "/ar/admin/mobile-app"];
for (const path of admin) await shot(path, `${String(i++).padStart(2, "0")}-${slug(path)}`, { note: "لوحة الإدارة" });
await b.close();

const md = `# لقطات منصة نوى\n\nآخر تحديث: ${new Date().toISOString().slice(0, 10)} · الدقة 1920×1080 · صفحات كاملة\n\n**مستثناة عمدًا (بيانات أشخاص حقيقيين):** الطلاب، المعلمون، المشتركون، المدارس، العملاء المحتملون، المدفوعات، الفواتير، البريد، سجل النشاط، الزيارات، صفحة الحساب.\n\n| # | المسار | العنوان | الملف | ملاحظة |\n|---|---|---|---|---|\n` + shots.map((s, k) => `| ${k + 1} | \`${s.path}\` | ${s.h1 || s.title} | ${s.file ? `[${s.file.split("/").pop()}](${s.file.slice(out.length + 1)})` : "—"} | ${s.note} |`).join("\n") + "\n";
writeFileSync(`${out}/INDEX.md`, md);
console.log("done", shots.filter(s => s.file).length, "screenshots");
