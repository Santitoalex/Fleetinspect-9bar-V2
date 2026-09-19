import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const runnerPath = path.join(process.cwd(), ".runtime", "server-speed-v75.runner.mjs");
const adminPath = path.join(process.cwd(), "admin.js");
const appPath = path.join(process.cwd(), "app.js");
const adminHtmlPath = path.join(process.cwd(), "admin.html");
const serverPath = path.join(process.cwd(), "server.js");

function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`[server-speed-v75] patch not applied: ${label}`);
  return next;
}

let serverSource = await fs.readFile(serverPath, "utf8");
if (!serverSource.includes("FLEET_VEHICLE_TABLE")) {
  serverSource = replaceRequired(
    serverSource,
    'const AUDIT_TABLE = process.env.AUDIT_TABLE || "audit_events";',
    'const AUDIT_TABLE = process.env.AUDIT_TABLE || "audit_events";\nconst FLEET_VEHICLE_TABLE = process.env.FLEET_VEHICLE_TABLE || "fleet_vehicles";',
    "fleet vehicle table const"
  );

  serverSource = replaceRequired(
    serverSource,
    'const auditFile = path.join(auditDir, "events.json");',
    'const auditFile = path.join(auditDir, "events.json");\nconst fleetDir = path.join(DATA_DIR, "fleet");\nconst fleetVehiclesFile = path.join(fleetDir, "vehicles.json");',
    "fleet vehicle local file"
  );

  serverSource = replaceRequired(
    serverSource,
    'await fs.mkdir(auditDir, { recursive: true });',
    'await fs.mkdir(auditDir, { recursive: true });\nawait fs.mkdir(fleetDir, { recursive: true });',
    "fleet local directory"
  );

  serverSource = replaceRequired(
    serverSource,
    '\napp.get("/api/route-plans/:date", requireAdmin, async (request, response) => {',
    `\napp.get("/api/vehicles", async (_request, response) => {
  try {
    response.json({ ok: true, vehicles: await listFleetVehicles() });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudo cargar la lista de vehiculos." });
  }
});

app.post("/api/admin/vehicles", requireOperationsEditor, async (request, response) => {
  try {
    const plate = normalizeFleetPlate(request.body?.plate || "");
    const site = normalizeVehicleSite(request.body?.site || "all");
    if (!plate) return response.status(400).json({ ok: false, error: "Matricula no valida." });
    const item = await saveFleetVehicle({ plate, site, updatedBy: request.adminUser?.email || request.adminUser?.username || "admin" });
    await logAuditEvent({ actor: request.adminUser?.email || request.adminUser?.username || "admin", action: "fleet_vehicle_added", site, plate, details: { plate, site } }).catch(() => {});
    response.json({ ok: true, vehicle: item, vehicles: await listFleetVehicles() });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudo guardar el vehiculo." });
  }
});

app.delete("/api/admin/vehicles/:plate", requireOperationsEditor, async (request, response) => {
  try {
    const plate = normalizeFleetPlate(request.params.plate || "");
    if (!plate) return response.status(400).json({ ok: false, error: "Matricula no valida." });
    await deleteFleetVehicle(plate);
    await logAuditEvent({ actor: request.adminUser?.email || request.adminUser?.username || "admin", action: "fleet_vehicle_removed", plate, details: { plate } }).catch(() => {});
    response.json({ ok: true, vehicles: await listFleetVehicles() });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudo quitar el vehiculo." });
  }
});

app.get("/api/route-plans/:date", requireAdmin, async (request, response) => {`,
    "fleet vehicle api routes"
  );

  serverSource = replaceRequired(
    serverSource,
    "\nasync function logAuditEvent(event) {",
    `
async function listFleetVehicles() {
  let vehicles = null;
  if (supabase) {
    const { data, error } = await supabase.from(FLEET_VEHICLE_TABLE).select("*").order("plate", { ascending: true });
    if (!error) {
      vehicles = (data || []).map(mapFleetVehicle);
      if (!vehicles.length) {
        const seedVehicles = await readSeedFleetVehicles();
        if (seedVehicles.length) {
          const { data: seeded, error: seedError } = await supabase
            .from(FLEET_VEHICLE_TABLE)
            .upsert(seedVehicles.map((vehicle) => ({ plate: vehicle.plate, site: vehicle.site, active: true, updated_at: new Date().toISOString(), updated_by: "seed" })), { onConflict: "plate" })
            .select("*")
            .order("plate", { ascending: true });
          if (!seedError) vehicles = (seeded || []).map(mapFleetVehicle);
        }
      }
    } else if (error.code !== "42P01" && error.code !== "PGRST205") {
      throw new Error("Supabase Fleet Vehicles: " + error.message);
    }
  }
  if (!vehicles) vehicles = await readLocalFleetVehicles();
  if (!vehicles.length) {
    vehicles = await readSeedFleetVehicles();
    if (vehicles.length) await writeLocalFleetVehicles(vehicles).catch(() => {});
  }
  return vehicles.filter((item) => item.active !== false).sort((a, b) => a.plate.localeCompare(b.plate));
}

async function saveFleetVehicle(vehicle) {
  const item = { plate: normalizeFleetPlate(vehicle.plate), site: normalizeVehicleSite(vehicle.site || "all"), active: true, updatedAt: new Date().toISOString(), updatedBy: normalizeEmail(vehicle.updatedBy || "admin") || "admin" };
  if (!item.plate) throw new Error("Matricula no valida.");
  if (supabase) {
    const row = { plate: item.plate, site: item.site, active: true, updated_at: item.updatedAt, updated_by: item.updatedBy };
    const { data, error } = await supabase.from(FLEET_VEHICLE_TABLE).upsert(row, { onConflict: "plate" }).select("*").maybeSingle();
    if (error) throw new Error("Supabase Fleet Vehicles: " + error.message);
    return data ? mapFleetVehicle(data) : item;
  }
  const vehicles = await readLocalFleetVehicles();
  const next = [...vehicles.filter((vehicle) => normalizeFleetPlate(vehicle.plate) !== item.plate), item];
  await writeLocalFleetVehicles(next);
  return item;
}

async function deleteFleetVehicle(plate) {
  const normalized = normalizeFleetPlate(plate);
  if (!normalized) return;
  if (supabase) {
    const { error } = await supabase.from(FLEET_VEHICLE_TABLE).update({ active: false, updated_at: new Date().toISOString() }).eq("plate", normalized);
    if (error) throw new Error("Supabase Fleet Vehicles: " + error.message);
    return;
  }
  const vehicles = await readLocalFleetVehicles();
  await writeLocalFleetVehicles(vehicles.filter((vehicle) => normalizeFleetPlate(vehicle.plate) !== normalized));
}

async function readLocalFleetVehicles() {
  try {
    const raw = await fs.readFile(fleetVehiclesFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(mapFleetVehicle).filter((item) => item.plate) : [];
  } catch { return []; }
}

async function writeLocalFleetVehicles(vehicles) { await fs.writeFile(fleetVehiclesFile, JSON.stringify(vehicles.map(mapFleetVehicle), null, 2)); }

async function readSeedFleetVehicles() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "vehicles.js"), "utf8");
    const match = raw.match(/window\.FLEET_VEHICLES\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return [];
    const plates = JSON.parse(match[1]);
    return Array.isArray(plates) ? plates.map((plate) => ({ plate: normalizeFleetPlate(plate), site: "all", active: true })).filter((item) => item.plate) : [];
  } catch { return []; }
}

function mapFleetVehicle(row) { return { plate: normalizeFleetPlate(row.plate), site: normalizeVehicleSite(row.site || "all"), active: row.active !== false, updatedAt: row.updated_at || row.updatedAt || "", updatedBy: row.updated_by || row.updatedBy || "" }; }
function normalizeFleetPlate(value) { return String(value || "").trim().toUpperCase().replace(/\s+/g, " ").replace(/[^A-Z0-9 ]/g, ""); }
function normalizeVehicleSite(value) { const site = normalizeSite(value || "all"); return site === FALLBACK_SITE ? "all" : site; }

async function logAuditEvent(event) {`,
    "fleet vehicle storage functions"
  );
  await fs.writeFile(serverPath, serverSource);
}

let appJs = await fs.readFile(appPath, "utf8");
if (!appJs.includes("fetchFleetVehicles")) {
  appJs = replaceRequired(appJs, "let deferredInstallPrompt = null;", 'let deferredInstallPrompt = null;\nlet fleetVehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];', "driver fleet vehicles state");
  appJs = replaceRequired(
    appJs,
    /function loadVehicleOptions\(\) \{[\s\S]*?\n\}/,
    'function loadVehicleOptions() {\n  const previousValue = nodes.vehiclePlate.value;\n  renderVehicleOptions(fleetVehicles, previousValue);\n  fetchFleetVehicles(previousValue);\n}\n\nasync function fetchFleetVehicles(previousValue = nodes.vehiclePlate.value) {\n  try {\n    const response = await fetch("/api/vehicles", { cache: "no-store" });\n    const result = await response.json();\n    if (!response.ok || result.ok === false || !Array.isArray(result.vehicles)) return;\n    fleetVehicles = result.vehicles.map((vehicle) => vehicle.plate || vehicle).filter(Boolean);\n    renderVehicleOptions(fleetVehicles, previousValue);\n    updateStartFormState();\n  } catch {}\n}\n\nfunction renderVehicleOptions(vehicles, previousValue = "") {\n  const uniqueVehicles = [...new Set((vehicles || []).map(normalizePlate).filter(Boolean))].sort((a, b) => a.localeCompare(b));\n  nodes.vehiclePlate.innerHTML = ["<option value=\"\">" + t("selectRegistration") + "</option>", ...uniqueVehicles.map((plate) => "<option value=\"" + escapeHtml(plate) + "\">" + escapeHtml(plate) + "</option>")].join("");\n  const normalizedPrevious = normalizePlate(previousValue);\n  if (normalizedPrevious && uniqueVehicles.includes(normalizedPrevious)) nodes.vehiclePlate.value = normalizedPrevious;\n}',
    "driver dynamic fleet options"
  );
  await fs.writeFile(appPath, appJs);
}

let adminHtml = await fs.readFile(adminHtmlPath, "utf8");
if (!adminHtml.includes("fleetVehicleManagement")) {
  const fleetWidget = '\n        <article id="fleetVehicleManagement" class="dashboard-widget wide-widget fleet-vehicle-widget">\n         <header><div><h3>Vehiculos en app driver</h3><span>Anade o quita las matriculas que aparecen al conductor.</span></div><strong id="fleetVehicleCount">0</strong></header>\n         <div class="fleet-vehicle-tools">\n          <label><span>Site</span><select id="fleetVehicleSite"><option value="all">DRP3 + DSU1</option><option value="DRP3">DRP3</option><option value="DSU1">DSU1</option></select></label>\n          <label><span>Matricula</span><input id="fleetVehiclePlate" type="text" placeholder="M AZ 1003" autocomplete="off" /></label>\n          <button id="addFleetVehicle" type="button">Anadir vehiculo</button>\n          <label><span>Buscar</span><input id="fleetVehicleSearch" type="search" placeholder="Buscar matricula" autocomplete="off" /></label>\n         </div>\n         <div id="fleetVehicleList" class="fleet-vehicle-list"></div>\n        </article>\n';
  adminHtml = replaceRequired(adminHtml, '\n        <article class="dashboard-widget status-widget">', fleetWidget + '\n        <article class="dashboard-widget status-widget">', "admin fleet widget html");
}
if (!adminHtml.includes("fleet-vehicle-v75-styles")) {
  const fleetCss = '\n  <style id="fleet-vehicle-v75-styles">.fleet-vehicle-widget > header strong{min-width:44px;text-align:right;color:#123c69}.fleet-vehicle-tools{display:grid;grid-template-columns:160px minmax(180px,1fr) auto minmax(180px,1fr);gap:10px;align-items:end;margin-bottom:14px}.fleet-vehicle-tools label{display:grid;gap:6px}.fleet-vehicle-tools span{color:#667085;font-size:11px;font-weight:950;letter-spacing:.04em;text-transform:uppercase}.fleet-vehicle-tools input,.fleet-vehicle-tools select{width:100%;min-height:42px;border:1px solid #cdddec;border-radius:10px;background:#fff;padding:0 12px;color:#101828;font:inherit;font-weight:850}.fleet-vehicle-tools button{min-height:42px;border:0;border-radius:10px;background:#123c69;color:#fff;padding:0 16px;font:inherit;font-weight:950;cursor:pointer}.fleet-vehicle-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;max-height:360px;overflow:auto;padding-right:4px}.fleet-vehicle-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;border:1px solid #dbe7f2;border-left:4px solid #0f766e;border-radius:10px;background:#fff;padding:10px 10px 10px 12px}.fleet-vehicle-row strong,.fleet-vehicle-row span{display:block}.fleet-vehicle-row strong{color:#101828;font-size:14px;font-weight:950}.fleet-vehicle-row span{margin-top:2px;color:#667085;font-size:11px;font-weight:850}.fleet-vehicle-row button{min-height:32px;border:1px solid #ffd0c8;border-radius:999px;background:#fff7f5;color:#b42318;padding:0 10px;font:inherit;font-size:12px;font-weight:950;cursor:pointer}@media(max-width:980px){.fleet-vehicle-tools{grid-template-columns:1fr}}</style>\n';
  adminHtml = replaceRequired(adminHtml, "\n </head>", fleetCss + "\n </head>", "admin fleet css");
}
if (!adminHtml.includes("fleet-vehicle-v75-script")) {
  const fleetScript = '\n  <script id="fleet-vehicle-v75-script">(()=>{let fleetVehicles=[];const normalizePlate=(value)=>String(value||"").trim().toUpperCase().replace(/\\s+/g," ").replace(/[^A-Z0-9 ]/g,"");const get=(id)=>document.querySelector(id);async function loadFleetVehicles(){const list=get("#fleetVehicleList");if(!list)return;try{const response=await fetch("/api/vehicles",{cache:"no-store"});const result=await response.json();if(!response.ok||result.ok===false)throw new Error(result.error||"No se pudo cargar la flota.");fleetVehicles=Array.isArray(result.vehicles)?result.vehicles:[];renderFleetVehicles()}catch(error){list.innerHTML="<article class=\\"empty-state\\">"+(error.message||"No se pudo cargar la flota.")+"</article>"}}function renderFleetVehicles(){const list=get("#fleetVehicleList");if(!list)return;const q=normalizePlate(get("#fleetVehicleSearch")?.value||"");const vehicles=fleetVehicles.map((vehicle)=>({plate:normalizePlate(vehicle.plate||vehicle),site:vehicle.site||"all",active:vehicle.active!==false})).filter((vehicle)=>vehicle.plate&&vehicle.active&&(!q||normalizePlate(vehicle.plate).includes(q))).sort((a,b)=>a.plate.localeCompare(b.plate));const count=get("#fleetVehicleCount");if(count)count.textContent=String(vehicles.length);list.innerHTML=vehicles.length?vehicles.map((vehicle)=>"<article class=\\"fleet-vehicle-row\\"><div><strong>"+vehicle.plate+"</strong><span>"+(vehicle.site==="all"?"DRP3 + DSU1":vehicle.site)+"</span></div><button type=\\"button\\" data-remove-fleet-vehicle=\\""+vehicle.plate+"\\">Quitar</button></article>").join(""):"<article class=\\"empty-state\\">No hay vehiculos.</article>"}async function addFleetVehicle(){const input=get("#fleetVehiclePlate");const plate=normalizePlate(input?.value||"");const site=get("#fleetVehicleSite")?.value||"all";if(!plate)return alert("Escribe una matricula valida.");const response=await fetch("/api/admin/vehicles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plate,site})});const result=await response.json();if(!response.ok||result.ok===false)return alert(result.error||"No se pudo guardar el vehiculo.");fleetVehicles=result.vehicles||[];input.value="";renderFleetVehicles()}document.addEventListener("DOMContentLoaded",()=>{get("#addFleetVehicle")?.addEventListener("click",addFleetVehicle);get("#fleetVehiclePlate")?.addEventListener("keydown",(event)=>{if(event.key==="Enter")addFleetVehicle()});get("#fleetVehicleSearch")?.addEventListener("input",renderFleetVehicles);get("#fleetVehicleList")?.addEventListener("click",async(event)=>{const button=event.target.closest("[data-remove-fleet-vehicle]");if(!button)return;const response=await fetch("/api/admin/vehicles/"+encodeURIComponent(button.dataset.removeFleetVehicle),{method:"DELETE"});const result=await response.json();if(!response.ok||result.ok===false)return alert(result.error||"No se pudo quitar el vehiculo.");fleetVehicles=result.vehicles||[];renderFleetVehicles()});loadFleetVehicles();setInterval(loadFleetVehicles,60000)})})();</script>\n';
  adminHtml = replaceRequired(adminHtml, "\n </body>", fleetScript + "\n </body>", "admin fleet script");
}
await fs.writeFile(adminHtmlPath, adminHtml);

let runner = await fs.readFile(path.join(process.cwd(), "server-speed-v63.js"), "utf8");
runner = runner.replaceAll("server-speed-v63", "server-speed-v75").replaceAll("admin-natural-v63", "admin-natural-v75").replaceAll('"63"', '"75"');
runner = runner.replace('  "frontend version"\n);', ['  "frontend version"', ");", "", "source = replaceRequired(", "  source,", '  "const limit = Math.min(Math.max(Number(request.query.limit || 180), 1), 1000);",', '  "const limit = Math.min(Math.max(Number(request.query.limit || 50000), 1), 50000);",', '  "wide inspection history limit"', ");"].join("\n"));
await fs.mkdir(path.dirname(runnerPath), { recursive: true });
await fs.writeFile(runnerPath, runner);
await import(pathToFileURL(runnerPath).href);
