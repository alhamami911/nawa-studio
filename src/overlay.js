// طبقة الإنتاج داخل الصفحة: مؤشر، إطار مضيء، بطاقات.
// الصفحة تُعرض بزوم ثابت (window.__Z) لرفع دقة التسجيل، والإحداثيات القادمة بالبكسل الفعلي تُقسم عليه.
(() => {
  if (window.__P) return;
  const Z = window.__Z || 1;
  const C = { primary: "#c34d04", glow: "#ff8a1f", ink: "#342616" };
  const root = () => document.documentElement;
  const mk = (id, css, html = "") => { let e = document.getElementById(id); if (!e) { e = document.createElement("div"); e.id = id; e.style.cssText = css; e.innerHTML = html; root().appendChild(e); } return e; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const P = window.__P = {};
  let last = { x: innerWidth * 0.7, y: innerHeight * 0.4 };
  try { const s = JSON.parse(sessionStorage.getItem("__cur") || "null"); if (s) last = s; } catch {}
  P.cursor = (x, y, ms = 800) => {
    const c = mk("__cur", "position:fixed;left:0;top:0;width:38px;height:38px;z-index:2147483646;pointer-events:none;will-change:transform;filter:drop-shadow(0 3px 5px rgba(0,0,0,.45))",
      `<svg viewBox="0 0 24 24" width="38" height="38"><path d="M3 2l7 19 3-8 8-3z" fill="${C.glow}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
    c.style.transition = `transform ${ms}ms cubic-bezier(.45,.05,.2,1)`;
    c.style.transform = `translate(${x / Z}px,${y / Z}px)`;
    last = { x, y }; try { sessionStorage.setItem("__cur", JSON.stringify(last)); } catch {}
    return sleep(ms);
  };
  P.initCursor = () => { P.cursor(last.x, last.y, 0); };
  P.ripple = async () => {
    const r = mk("__rip" + Date.now(), `position:fixed;left:${last.x / Z - 24}px;top:${last.y / Z - 24}px;width:48px;height:48px;border-radius:50%;border:4px solid ${C.glow};z-index:2147483645;pointer-events:none;transition:all .55s ease-out;opacity:.95`);
    requestAnimationFrame(() => { r.style.transform = "scale(2.4)"; r.style.opacity = "0"; });
    setTimeout(() => r.remove(), 700); await sleep(250);
  };
  P.ring = (rect, pad = 10) => {
    const r = mk("__ring", `position:fixed;z-index:2147483640;pointer-events:none;border:3px solid ${C.glow};border-radius:16px;box-shadow:0 0 0 9999px rgba(20,14,8,.20),0 0 24px 4px rgba(255,138,31,.65);transition:all .5s ease,opacity .35s;opacity:0;animation:__pulse 1.8s ease-in-out infinite`);
    if (!document.getElementById("__st")) { const st = document.createElement("style"); st.id = "__st"; st.textContent = "@keyframes __pulse{0%,100%{box-shadow:0 0 0 9999px rgba(20,14,8,.18),0 0 16px 2px rgba(255,138,31,.55)}50%{box-shadow:0 0 0 9999px rgba(20,14,8,.18),0 0 34px 9px rgba(255,138,31,.9)}}"; root().appendChild(st); }
    if (!rect) { r.style.opacity = "0"; return; }
    const set = () => { r.style.left = rect.x / Z - pad + "px"; r.style.top = rect.y / Z - pad + "px"; r.style.width = rect.w / Z + pad * 2 + "px"; r.style.height = rect.h / Z + pad * 2 + "px"; };
    if (r.style.opacity !== "1") { const tr = r.style.transition; r.style.transition = "none"; set(); void r.offsetWidth; r.style.transition = tr; }
    set(); r.style.opacity = "1";
  };
  // ستارة انتقال ناعمة بين الصفحات (تبقى عبر إعادة التحميل بفضل sessionStorage)
  const veilEl = () => mk("__veil", "position:fixed;inset:0;z-index:2147483641;pointer-events:none;background:linear-gradient(180deg,#fff7ef,#f9f8fc);transition:opacity .45s ease;opacity:0");
  P.veil = (on) => { const v = veilEl(); requestAnimationFrame(() => { v.style.opacity = on ? "1" : "0"; }); try { sessionStorage.setItem("__veil", on ? "1" : "0"); } catch {} return sleep(480); };
  try { if (sessionStorage.getItem("__veil") === "1") { const v = veilEl(); v.style.transition = "none"; v.style.opacity = "1"; void v.offsetWidth; v.style.transition = ""; addEventListener("load", () => setTimeout(() => P.veil(false), 500)); } } catch {}
  P.card = (html, show) => {
    const c = mk("__card", `position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;direction:rtl;background:radial-gradient(1200px 700px at 70% 20%,#ffe7d1 0%,#fff4ea 45%,#f9f8fc 100%);font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;color:${C.ink};transition:opacity .7s;opacity:0`);
    if (html != null) c.innerHTML = html;
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.opacity = show ? "1" : "0"; }));
    c.style.pointerEvents = show ? "auto" : "none";
  };
})();
