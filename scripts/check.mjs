// npm run check: syntax-check every source file (no execution, no network)
import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(mjs|js)$/.test(f) && files.push(p); } };
walk("src"); walk("scripts");
let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { bad++; console.error("FAIL", f, "\n" + r.stderr); }
}
console.log(files.length - bad + "/" + files.length + " files OK");
process.exit(bad ? 1 : 0);
