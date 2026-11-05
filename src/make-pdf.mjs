// يحوّل docs/series-plan.html إلى PDF
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(pathToFileURL(resolve("docs/series-plan.html")).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
await p.pdf({ path: "docs/nawa-series-plan.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
await b.close(); console.log("ok");
