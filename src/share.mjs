// npm run share: starts the dashboard and a Cloudflare quick tunnel, then prints a public https://*.trycloudflare.com URL.
// Requires cloudflared and DASHBOARD_PASSWORD in .env (without it the server rejects remote requests unless DASHBOARD_PUBLIC=1).
import { spawn, spawnSync } from "node:child_process";

try { process.loadEnvFile(); } catch {}
if (!process.env.DASHBOARD_PASSWORD && process.env.DASHBOARD_PUBLIC !== "1") {
  console.error("Set DASHBOARD_PASSWORD in .env before sharing (or DASHBOARD_PUBLIC=1 for a read-only public view)."); process.exit(1);
}
if ((process.env.DASHBOARD_PASSWORD ?? "").length < 10) console.warn("Warning: password is shorter than 10 characters, so remote control stays disabled (viewing still works).");
if (spawnSync("cloudflared", ["--version"], { shell: true }).status !== 0) {
  console.error("cloudflared is not installed. On Windows: winget install Cloudflare.cloudflared, then reopen the terminal."); process.exit(1);
}
const port = process.env.DASHBOARD_PORT ?? "4174";
const dash = spawn(process.execPath, ["src/dashboard.mjs"], { stdio: "inherit" });
const tun = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`], { shell: true });
let shown = false;
const onData = d => {
  const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(d));
  if (m && !shown) { shown = true; console.log(`\nPublic URL: ${m[0]}\nSign in with DASHBOARD_PASSWORD. Remote visitors are read-only unless the password is 10+ characters.\nPress Ctrl+C to stop.\n`); }
};
tun.stdout.on("data", onData); tun.stderr.on("data", onData);
const stop = () => { dash.kill(); tun.kill(); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
tun.on("close", () => { dash.kill(); process.exit(1); });
