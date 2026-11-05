// يجلب الهوية البصرية من موقع المنصة: الشعار، الأيقونات، الألوان، الخط
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
const base = "https://nawamusic.com";
const out = "assets/brand"; mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ ignoreHTTPSErrors: true });
await p.goto(base + "/ar/", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const abs = u => u ? new URL(u, location.href).href : null;
  const imgs = [...document.querySelectorAll("header img, nav img")].map(i => ({ src: abs(i.currentSrc || i.src), alt: i.alt, w: i.naturalWidth }));
  const links = [...document.querySelectorAll("link[rel*=icon],link[rel=manifest]")].map(l => ({ rel: l.rel, href: abs(l.href), sizes: l.sizes?.value }));
  const og = abs(document.querySelector("meta[property='og:image']")?.content);
  const theme = document.querySelector("meta[name=theme-color]")?.content;
  const root = getComputedStyle(document.documentElement);
  const vars = {}; for (const n of ["--primary","--background","--foreground","--accent","--secondary","--muted","--border","--ring"]) vars[n] = root.getPropertyValue(n).trim();
  const btn = [...document.querySelectorAll("button,a")].map(e => getComputedStyle(e).backgroundColor).filter(c => c && c !== "rgba(0, 0, 0, 0)");
  return { imgs, links, og, theme, vars, font: getComputedStyle(document.body).fontFamily, bodyBg: getComputedStyle(document.body).backgroundColor, btn: [...new Set(btn)].slice(0, 8) };
});
console.log(JSON.stringify(info, null, 1));
writeFileSync(out + "/brand-raw.json", JSON.stringify(info, null, 1));
const grab = async (url, name) => { try { const r = await p.request.get(url, { ignoreHTTPSErrors: true }); if (r.ok()) { writeFileSync(`${out}/${name}`, await r.body()); console.log("saved", name, r.headers()["content-type"]); } } catch (e) { console.log("fail", name, e.message); } };
for (const [i, im] of info.imgs.entries()) if (im.src && !im.src.startsWith("data:")) await grab(im.src, `header-img-${i}${/\.(svg|png|webp|jpg)/.exec(im.src)?.[0] ?? ""}`);
if (info.og) await grab(info.og, "og-image" + (/\.(png|jpg|webp)/.exec(info.og)?.[0] ?? ".png"));
for (const [i, l] of info.links.entries()) if (/icon/.test(l.rel)) await grab(l.href, `icon-${i}${/\.(svg|png|ico)/.exec(l.href)?.[0] ?? ""}`);
await b.close();
