import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const runnerPath = path.join(process.cwd(), ".runtime", "server-speed-v71.runner.mjs");
const adminPath = path.join(process.cwd(), "admin.js");

let adminJs = await fs.readFile(adminPath, "utf8");
adminJs = adminJs.replace("const DASHBOARD_INSPECTION_LIMIT = 180;", "const DASHBOARD_INSPECTION_LIMIT = 50000;");
adminJs = adminJs.replace("const VEHICLE_HISTORY_LIMIT = 24;", "const VEHICLE_HISTORY_LIMIT = 500;");
adminJs = adminJs.replace(
  /function normalizePlate\(value\) \{[\s\S]*?\n\}/,
  `function normalizePlate(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}`
);
await fs.writeFile(adminPath, adminJs);

let runner = await fs.readFile(path.join(process.cwd(), "server-speed-v63.js"), "utf8");
runner = runner
  .replaceAll("server-speed-v63", "server-speed-v71")
  .replaceAll("admin-natural-v63", "admin-natural-v71")
  .replaceAll('"63"', '"71"');

runner = runner.replace(
  '  "frontend version"\n);',
  [
    '  "frontend version"',
    ");",
    "",
    "source = replaceRequired(",
    "  source,",
    '  "const limit = Math.min(Math.max(Number(request.query.limit || 180), 1), 1000);",',
    '  "const limit = Math.min(Math.max(Number(request.query.limit || 50000), 1), 50000);",',
    '  "wide inspection history limit"',
    ");",
  ].join("\n")
);

await fs.mkdir(path.dirname(runnerPath), { recursive: true });
await fs.writeFile(runnerPath, runner);
await import(pathToFileURL(runnerPath).href);
