// npm run share: يشغّل اللوحة ونفق Cloudflare ويطبع رابطًا عامًا (https://....trycloudflare.com) تفتحه من أي مكان.
// يتطلب: cloudflared مثبتًا، وDASHBOARD_PASSWORD في .env (بدونها يرفض الخادم أي طلب خارجي).
import { spawn, spawnSync } from "node:child_process";

try { process.loadEnvFile(); } catch {}
if (!process.env.DASHBOARD_PASSWORD && process.env.DASHBOARD_PUBLIC !== "1") {
  console.error("ضع DASHBOARD_PASSWORD في ملف .env قبل المشاركة (أو DASHBOARD_PUBLIC=1 للعرض العام)."); process.exit(1);
}
if ((process.env.DASHBOARD_PASSWORD ?? "").length < 10) console.warn("تنبيه: كلمة المرور أقصر من 10 أحرف، فلن يُفتح التحكم عن بعد (العرض يعمل).");
if (spawnSync("cloudflared", ["--version"], { shell: true }).status !== 0) {
  console.error("cloudflared غير مثبت. على ويندوز: winget install Cloudflare.cloudflared  ثم أعد فتح الطرفية."); process.exit(1);
}
const port = process.env.DASHBOARD_PORT ?? "4174";
const dash = spawn(process.execPath, ["src/dashboard.mjs"], { stdio: "inherit" });
const tun = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`], { shell: true });
let shown = false;
const onData = d => {
  const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(d));
  if (m && !shown) { shown = true; console.log(`\nالرابط العام: ${m[0]}\nالدخول بكلمة المرور (DASHBOARD_PASSWORD). ${process.env.DASHBOARD_REMOTE_CONTROL === "1" ? "التشغيل عن بعد: مفتوح" : "عرض فقط عن بعد (التشغيل من هذا الجهاز)"}\nCtrl+C للإيقاف.\n`); }
};
tun.stdout.on("data", onData); tun.stderr.on("data", onData);
const stop = () => { dash.kill(); tun.kill(); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
tun.on("close", () => { dash.kill(); process.exit(1); });
