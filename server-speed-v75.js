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
    const item = await saveFleetVehicle({
      plate,
      site,
      updatedBy: request.adminUser?.email || request.adminUser?.username || "admin",
    });
    await logAuditEvent({
      actor: request.adminUser?.email || request.adminUser?.username || "admin",
      action: "fleet_vehicle_added",
      site,
      plate,
      details: { plate, site },
    }).catch(() => {});
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
    await logAuditEvent({
      actor: request.adminUser?.email || request.adminUser?.username || "admin",
      action: "fleet_vehicle_removed",
      plate,
      details: { plate },
    }).catch(() => {});
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
  const seedVehicles = await readSeedFleetVehicles();
  let vehicles = null;

  if (supabase) {
    const { data, error } = await supabase
      .from(FLEET_VEHICLE_TABLE)
      .select("*")
      .order("plate", { ascending: true });

    if (!error) {
      const merged = new Map(seedVehicles.map((vehicle) => [vehicle.plate, vehicle]));
      (data || []).map(mapFleetVehicle).forEach((vehicle) => merged.set(vehicle.plate, vehicle));
      vehicles = [...merged.values()];
    } else if (error.code !== "42P01" && error.code !== "PGRST205") {
      throw new Error(\`Supabase Fleet Vehicles: \${error.message}\`);
    }
  }

  if (!vehicles) {
    const localVehicles = await readLocalFleetVehicles();
    const merged = new Map(seedVehicles.map((vehicle) => [vehicle.plate, vehicle]));
    localVehicles.forEach((vehicle) => merged.set(vehicle.plate, vehicle));
    vehicles = [...merged.values()];
  }

  return vehicles
    .filter((item) => item.active !== false)
    .sort((a, b) => a.plate.localeCompare(b.plate));
}

async function saveFleetVehicle(vehicle) {
  const item = {
    plate: normalizeFleetPlate(vehicle.plate),
    site: normalizeVehicleSite(vehicle.site || "all"),
    active: true,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeEmail(vehicle.updatedBy || "admin") || "admin",
  };

  if (!item.plate) throw new Error("Matricula no valida.");

  if (supabase) {
    const row = {
      plate: item.plate,
      site: item.site,
      active: true,
      updated_at: item.updatedAt,
      updated_by: item.updatedBy,
    };
    const { data, error } = await supabase
      .from(FLEET_VEHICLE_TABLE)
      .upsert(row, { onConflict: "plate" })
      .select("*")
      .maybeSingle();

    if (error) throw new Error(\`Supabase Fleet Vehicles: \${error.message}\`);
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
    const { error } = await supabase
      .from(FLEET_VEHICLE_TABLE)
      .upsert({
        plate: normalized,
        site: "all",
        active: false,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      }, { onConflict: "plate" });

    if (error) throw new Error(\`Supabase Fleet Vehicles: \${error.message}\`);
    return;
  }

  const vehicles = await readLocalFleetVehicles();
  const inactive = {
    plate: normalized,
    site: "all",
    active: false,
    updatedAt: new Date().toISOString(),
    updatedBy: "admin",
  };
  await writeLocalFleetVehicles([...vehicles.filter((vehicle) => normalizeFleetPlate(vehicle.plate) !== normalized), inactive]);
}

async function readLocalFleetVehicles() {
  try {
    const raw = await fs.readFile(fleetVehiclesFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(mapFleetVehicle).filter((item) => item.plate) : [];
  } catch {
    return [];
  }
}

async function writeLocalFleetVehicles(vehicles) {
  await fs.writeFile(fleetVehiclesFile, JSON.stringify(vehicles.map(mapFleetVehicle), null, 2));
}

async function readSeedFleetVehicles() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "vehicles.js"), "utf8");
    const match = raw.match(/window\\.FLEET_VEHICLES\\s*=\\s*(\\[[\\s\\S]*?\\]);/);
    if (!match) return [];
    const plates = JSON.parse(match[1]);
    return Array.isArray(plates)
      ? plates.map((plate) => ({ plate: normalizeFleetPlate(plate), site: "all", active: true })).filter((item) => item.plate)
      : [];
  } catch {
    return [];
  }
}

function mapFleetVehicle(row) {
  return {
    plate: normalizeFleetPlate(row.plate),
    site: normalizeVehicleSite(row.site || "all"),
    active: row.active !== false,
    updatedAt: row.updated_at || row.updatedAt || "",
    updatedBy: row.updated_by || row.updatedBy || "",
  };
}

function normalizeFleetPlate(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\\s+/g, " ")
    .replace(/[^A-Z0-9 ]/g, "");
}

function normalizeVehicleSite(value) {
  const site = normalizeSite(value || "all");
  return site === FALLBACK_SITE ? "all" : site;
}

async function logAuditEvent(event) {`,
    "fleet vehicle storage functions"
  );

  await fs.writeFile(serverPath, serverSource);
}

const fleetListerV90 = `async function listFleetVehicles() {
  const seedVehicles = await readSeedFleetVehicles();
  let vehicles = null;

  if (supabase) {
    const { data, error } = await supabase
      .from(FLEET_VEHICLE_TABLE)
      .select("*")
      .order("plate", { ascending: true });

    if (!error) {
      const merged = new Map(seedVehicles.map((vehicle) => [vehicle.plate, vehicle]));
      (data || []).map(mapFleetVehicle).forEach((vehicle) => merged.set(vehicle.plate, vehicle));
      vehicles = [...merged.values()];
    } else if (error.code !== "42P01" && error.code !== "PGRST205") {
      throw new Error(\`Supabase Fleet Vehicles: \${error.message}\`);
    }
  }

  if (!vehicles) {
    const localVehicles = await readLocalFleetVehicles();
    const merged = new Map(seedVehicles.map((vehicle) => [vehicle.plate, vehicle]));
    localVehicles.forEach((vehicle) => merged.set(vehicle.plate, vehicle));
    vehicles = [...merged.values()];
  }

  return vehicles
    .filter((item) => item.active !== false)
    .sort((a, b) => a.plate.localeCompare(b.plate));
}`;

const fleetDeleteV90 = `async function deleteFleetVehicle(plate) {
  const normalized = normalizeFleetPlate(plate);
  if (!normalized) return;

  if (supabase) {
    const { error } = await supabase
      .from(FLEET_VEHICLE_TABLE)
      .upsert({
        plate: normalized,
        site: "all",
        active: false,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      }, { onConflict: "plate" });

    if (error) throw new Error(\`Supabase Fleet Vehicles: \${error.message}\`);
    return;
  }

  const vehicles = await readLocalFleetVehicles();
  const inactive = {
    plate: normalized,
    site: "all",
    active: false,
    updatedAt: new Date().toISOString(),
    updatedBy: "admin",
  };
  await writeLocalFleetVehicles([...vehicles.filter((vehicle) => normalizeFleetPlate(vehicle.plate) !== normalized), inactive]);
}`;

const fleetListerPattern = /async function listFleetVehicles\(\) \{[\s\S]*?\n\}(?=\n\nasync function saveFleetVehicle)/;
const fleetDeletePattern = /async function deleteFleetVehicle\(plate\) \{[\s\S]*?\n\}(?=\n\nasync function readLocalFleetVehicles)/;
if (!fleetListerPattern.test(serverSource)) throw new Error("[server-speed-v75] fleet list function not found");
if (!fleetDeletePattern.test(serverSource)) throw new Error("[server-speed-v75] fleet delete function not found");
serverSource = serverSource.replace(fleetListerPattern, fleetListerV90);
serverSource = serverSource.replace(fleetDeletePattern, fleetDeleteV90);
await fs.writeFile(serverPath, serverSource);

let appJs = await fs.readFile(appPath, "utf8");
if (!appJs.includes("fetchFleetVehicles")) {
  appJs = replaceRequired(
    appJs,
    "let deferredInstallPrompt = null;",
    'let deferredInstallPrompt = null;\nlet fleetVehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];',
    "driver fleet vehicles state"
  );
  appJs = replaceRequired(
    appJs,
    /function loadVehicleOptions\(\) \{[\s\S]*?\n\}/,
    `function loadVehicleOptions() {
  const previousValue = nodes.vehiclePlate.value;
  renderVehicleOptions(fleetVehicles, previousValue);
  fetchFleetVehicles(previousValue);
}

async function fetchFleetVehicles(previousValue = nodes.vehiclePlate.value) {
  try {
    const response = await fetch("/api/vehicles", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || result.ok === false || !Array.isArray(result.vehicles)) return;
    fleetVehicles = result.vehicles.map((vehicle) => vehicle.plate || vehicle).filter(Boolean);
    renderVehicleOptions(fleetVehicles, previousValue);
    updateStartFormState();
  } catch {
    // Keep the static vehicles.js fallback.
  }
}

function renderVehicleOptions(vehicles, previousValue = "") {
  const uniqueVehicles = [...new Set((vehicles || []).map(normalizePlate).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  nodes.vehiclePlate.innerHTML = [
    \`<option value="">\${t("selectRegistration")}</option>\`,
    ...uniqueVehicles.map((plate) => \`<option value="\${escapeHtml(plate)}">\${escapeHtml(plate)}</option>\`),
  ].join("");
  const normalizedPrevious = normalizePlate(previousValue);
  if (normalizedPrevious && uniqueVehicles.includes(normalizedPrevious)) {
    nodes.vehiclePlate.value = normalizedPrevious;
  }
}`,
    "driver dynamic fleet options"
  );
  await fs.writeFile(appPath, appJs);
}

let adminJs = await fs.readFile(adminPath, "utf8");
adminJs = adminJs.replace("const DASHBOARD_INSPECTION_LIMIT = 180;", "const DASHBOARD_INSPECTION_LIMIT = 50000;");
adminJs = adminJs.replace("const VEHICLE_HISTORY_LIMIT = 24;", "const VEHICLE_HISTORY_LIMIT = 500;");
if (!adminJs.includes("let fleetVehicles = []")) {
  adminJs = replaceRequired(
    adminJs,
    "let auditEvents = [];",
    "let auditEvents = [];\nlet fleetVehicles = [];",
    "admin fleet state"
  );

  adminJs = replaceRequired(
    adminJs,
    '  dispatcherList: document.querySelector("#dispatcherList"),',
    [
      '  dispatcherList: document.querySelector("#dispatcherList"),',
      '  fleetVehicleManagement: document.querySelector("#fleetVehicleManagement"),',
      '  fleetVehicleSite: document.querySelector("#fleetVehicleSite"),',
      '  fleetVehiclePlate: document.querySelector("#fleetVehiclePlate"),',
      '  addFleetVehicle: document.querySelector("#addFleetVehicle"),',
      '  fleetVehicleSearch: document.querySelector("#fleetVehicleSearch"),',
      '  fleetVehicleList: document.querySelector("#fleetVehicleList"),',
      '  fleetVehicleCount: document.querySelector("#fleetVehicleCount"),',
    ].join("\n"),
    "admin fleet nodes"
  );

  adminJs = replaceRequired(
    adminJs,
    '  nodes.dispatcherList.addEventListener("change", handleDispatcherRoleChange);',
    [
      '  nodes.dispatcherList.addEventListener("change", handleDispatcherRoleChange);',
      '  nodes.addFleetVehicle?.addEventListener("click", addFleetVehicle);',
      '  nodes.fleetVehiclePlate?.addEventListener("keydown", (event) => {',
      '    if (event.key === "Enter") addFleetVehicle();',
      '  });',
      '  nodes.fleetVehicleSearch?.addEventListener("input", renderFleetVehicles);',
      '  nodes.fleetVehicleList?.addEventListener("click", handleFleetVehicleAction);',
    ].join("\n"),
    "admin fleet events"
  );

  adminJs = replaceRequired(
    adminJs,
    "    dashboardItems = await inspectionsResponse.json();",
    "    dashboardItems = await inspectionsResponse.json();\n    await loadFleetVehicles();",
    "admin load fleet"
  );

  adminJs = replaceRequired(
    adminJs,
    "  renderDailyVehicleControl();",
    "  renderDailyVehicleControl();\n  renderFleetVehicles();",
    "admin render fleet"
  );

  adminJs = replaceRequired(
    adminJs,
    `  [nodes.saveRoutePlan, nodes.clearRoutePlan, nodes.closeDay].filter(Boolean).forEach((node) => {
    node.disabled = !canEdit;
    node.classList.toggle("disabled", !canEdit);
    node.title = canEdit ? "" : t("readonlyMode");
  });
}`,
    `  [nodes.saveRoutePlan, nodes.clearRoutePlan, nodes.closeDay].filter(Boolean).forEach((node) => {
    node.disabled = !canEdit;
    node.classList.toggle("disabled", !canEdit);
    node.title = canEdit ? "" : t("readonlyMode");
  });
  [nodes.fleetVehiclePlate, nodes.fleetVehicleSite, nodes.addFleetVehicle].filter(Boolean).forEach((node) => {
    node.disabled = !canEdit;
    node.classList.toggle("disabled", !canEdit);
    node.title = canEdit ? "" : t("readonlyMode");
  });
}`,
    "admin fleet role ui"
  );

  adminJs = replaceRequired(
    adminJs,
    "\nasync function handleDispatcherRoleChange(event) {",
    `
async function loadFleetVehicles() {
  if (!nodes.fleetVehicleList) return;
  try {
    const response = await fetch("/api/vehicles", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.error || "No se pudo cargar la flota.");
    fleetVehicles = Array.isArray(result.vehicles) ? result.vehicles : [];
  } catch (error) {
    fleetVehicles = [];
    nodes.fleetVehicleList.innerHTML = \`<article class="empty-state">\${escapeHtml(error.message || "No se pudo cargar la flota.")}</article>\`;
  }
}

function renderFleetVehicles() {
  if (!nodes.fleetVehicleList) return;
  const query = normalizePlate(nodes.fleetVehicleSearch?.value || "");
  const selectedSite = getSelectedSite();
  const vehicles = fleetVehicles
    .map((vehicle) => ({
      plate: normalizeFleetVehiclePlate(vehicle.plate || vehicle),
      site: normalizeSite(vehicle.site || "all"),
      active: vehicle.active !== false,
    }))
    .filter((vehicle) => vehicle.plate && vehicle.active)
    .filter((vehicle) => selectedSite === "all" || vehicle.site === "all" || vehicle.site === selectedSite)
    .filter((vehicle) => !query || normalizePlate(vehicle.plate).includes(query))
    .sort((a, b) => a.plate.localeCompare(b.plate));

  if (nodes.fleetVehicleCount) nodes.fleetVehicleCount.textContent = String(vehicles.length);

  if (!vehicles.length) {
    nodes.fleetVehicleList.innerHTML = \`<article class="empty-state">No hay vehiculos para este filtro.</article>\`;
    return;
  }

  const canEdit = canEditOperations();
  nodes.fleetVehicleList.innerHTML = vehicles.map((vehicle) => \`
    <article class="fleet-vehicle-row">
      <div>
        <strong>\${escapeHtml(vehicle.plate)}</strong>
        <span>\${escapeHtml(vehicle.site === "all" ? "DRP3 + DSU1" : siteLabel(vehicle.site))}</span>
      </div>
      <button type="button" data-remove-fleet-vehicle="\${escapeHtml(vehicle.plate)}" \${canEdit ? "" : "disabled"}>Quitar</button>
    </article>
  \`).join("");
}

async function addFleetVehicle() {
  if (!canEditOperations()) {
    alert(t("readonlyMode"));
    return;
  }

  const plate = normalizeFleetVehiclePlate(nodes.fleetVehiclePlate?.value || "");
  const site = normalizeSite(nodes.fleetVehicleSite?.value || "all");
  if (!plate) {
    alert("Escribe una matricula valida.");
    return;
  }

  nodes.addFleetVehicle.disabled = true;
  try {
    const response = await fetch("/api/admin/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate, site }),
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.error || "No se pudo guardar el vehiculo.");
    fleetVehicles = result.vehicles || [];
    nodes.fleetVehiclePlate.value = "";
    renderFleetVehicles();
  } catch (error) {
    alert(error.message || "No se pudo guardar el vehiculo.");
  } finally {
    nodes.addFleetVehicle.disabled = false;
  }
}

async function handleFleetVehicleAction(event) {
  const button = event.target.closest("[data-remove-fleet-vehicle]");
  if (!button) return;
  if (!canEditOperations()) {
    alert(t("readonlyMode"));
    return;
  }

  const plate = button.dataset.removeFleetVehicle;
  button.disabled = true;
  try {
    const response = await fetch(\`/api/admin/vehicles/\${encodeURIComponent(plate)}\`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.error || "No se pudo quitar el vehiculo.");
    fleetVehicles = result.vehicles || [];
    renderFleetVehicles();
  } catch (error) {
    alert(error.message || "No se pudo quitar el vehiculo.");
    button.disabled = false;
  }
}

function normalizeFleetVehiclePlate(value) {
  return String(value || "").trim().toUpperCase().replace(/\\s+/g, " ").replace(/[^A-Z0-9 ]/g, "");
}

async function handleDispatcherRoleChange(event) {`,
    "admin fleet functions"
  );
}
const cleanSiteOverviewRenderer = [
  "function renderSiteOverview() {",
  "  if (!nodes.siteOverview) return;",
  "  const today = localDateKey(new Date());",
  "  nodes.siteOverview.innerHTML = FLEET_SITES.map((site) => {",
  "    const todayItems = dashboardItems.filter((item) => {",
  "      return getItemSite(item) === site && localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === today;",
  "    });",
  "    const vehicles = new Set(todayItems.map((item) => normalizePlate(item.plate || \"\")).filter(Boolean)).size;",
  "    const alerts = todayItems.filter((item) => item.ai?.newDamageDetected).length;",
  "    const active = getSelectedSite() === site;",
  "    const rows = [...todayItems]",
  "      .sort((a, b) => new Date(b.finishedAt || b.startedAt || 0) - new Date(a.finishedAt || a.startedAt || 0))",
  "      .slice(0, 16);",
  "    return `",
  "      <article class=\"site-overview-card site-overview-panel ${active ? \"active\" : \"\"}\" data-site=\"${escapeHtml(site)}\">",
  "        <button class=\"site-overview-head\" type=\"button\" data-site-jump=\"${escapeHtml(site)}\">",
  "          <span>${escapeHtml(siteLabel(site))}</span>",
  "          <strong>${todayItems.length}</strong>",
  "          <small>${vehicles} vehiculos · ${alerts} alertas hoy</small>",
  "        </button>",
  "        <div class=\"site-inspection-table\">",
  "          ${rows.length ? rows.map((item) => `",
  "            <a class=\"site-inspection-row\" href=\"/report.html?id=${encodeURIComponent(item.id)}\" target=\"_blank\" rel=\"noopener\">",
  "              <strong>${escapeHtml(item.plate || t(\"noRegistration\"))}</strong>",
  "              <span>${escapeHtml(item.driverName || t(\"noDriver\"))}</span>",
  "              <time>${escapeHtml(formatTime(new Date(item.finishedAt || item.startedAt || 0)))}</time>",
  "            </a>",
  "          `).join(\"\") : `<p class=\"site-empty-line\">Sin inspecciones hoy</p>`}",
  "        </div>",
  "      </article>",
  "    `;",
  "  }).join(\"\");",
  "",
  "  nodes.siteOverview.querySelectorAll(\"[data-site-jump]\").forEach((button) => {",
  "    button.addEventListener(\"click\", () => {",
  "      nodes.siteFilter.value = button.dataset.siteJump;",
  "      renderDashboard();",
  "    });",
  "  });",
  "}",
].join("\n");
adminJs = adminJs.replace(
  /function renderSiteOverview\(\) \{[\s\S]*?\n\}\n\nfunction renderOperationsBoard/,
  `${cleanSiteOverviewRenderer}\n\nfunction renderOperationsBoard`
);
adminJs = adminJs.replace(
  /function normalizePlate\(value\) \{[\s\S]*?\n\}/,
  `function normalizePlate(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}`
);
await fs.writeFile(adminPath, adminJs);

let adminHtml = await fs.readFile(adminHtmlPath, "utf8");
if (!adminHtml.includes("fleetVehicleManagement")) {
  const fleetWidget = `

        <article id="fleetVehicleManagement" class="dashboard-widget wide-widget fleet-vehicle-widget">
         <header>
          <div>
           <h3>Vehiculos en app driver</h3>
           <span>Anade o quita las matriculas que aparecen al conductor.</span>
          </div>
          <strong id="fleetVehicleCount">0</strong>
         </header>
         <div class="fleet-vehicle-tools">
          <label>
           <span>Site</span>
           <select id="fleetVehicleSite">
            <option value="all">DRP3 + DSU1</option>
            <option value="DRP3">DRP3</option>
            <option value="DSU1">DSU1</option>
           </select>
          </label>
          <label>
           <span>Matricula</span>
           <input id="fleetVehiclePlate" type="text" placeholder="M AZ 1003" autocomplete="off" />
          </label>
          <button id="addFleetVehicle" type="button">Anadir vehiculo</button>
          <label>
           <span>Buscar</span>
           <input id="fleetVehicleSearch" type="search" placeholder="Buscar matricula" autocomplete="off" />
          </label>
         </div>
         <div id="fleetVehicleList" class="fleet-vehicle-list"></div>
        </article>
`;
  adminHtml = replaceRequired(
    adminHtml,
    '\n        <article class="dashboard-widget status-widget">',
    `${fleetWidget}\n        <article class="dashboard-widget status-widget">`,
    "admin fleet widget html"
  );
}

if (!adminHtml.includes("fleet-vehicle-v75-styles")) {
  const fleetCss = `
  <style id="fleet-vehicle-v75-styles">
   .fleet-vehicle-widget > header strong { min-width: 44px; text-align: right; color: #123c69; }
   .fleet-vehicle-tools { display: grid; grid-template-columns: 160px minmax(180px, 1fr) auto minmax(180px, 1fr); gap: 10px; align-items: end; margin-bottom: 14px; }
   .fleet-vehicle-tools label { display: grid; gap: 6px; }
   .fleet-vehicle-tools span { color: #667085; font-size: 11px; font-weight: 950; letter-spacing: .04em; text-transform: uppercase; }
   .fleet-vehicle-tools input, .fleet-vehicle-tools select { width: 100%; min-height: 42px; border: 1px solid #cdddec; border-radius: 10px; background: #fff; padding: 0 12px; color: #101828; font: inherit; font-weight: 850; }
   .fleet-vehicle-tools button { min-height: 42px; border: 0; border-radius: 10px; background: #123c69; color: #fff; padding: 0 16px; font: inherit; font-weight: 950; cursor: pointer; }
   .fleet-vehicle-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; max-height: 360px; overflow: auto; padding-right: 4px; }
   .fleet-vehicle-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; border: 1px solid #dbe7f2; border-left: 4px solid #0f766e; border-radius: 10px; background: #fff; padding: 10px 10px 10px 12px; }
   .fleet-vehicle-row strong, .fleet-vehicle-row span { display: block; }
   .fleet-vehicle-row strong { color: #101828; font-size: 14px; font-weight: 950; }
   .fleet-vehicle-row span { margin-top: 2px; color: #667085; font-size: 11px; font-weight: 850; }
   .fleet-vehicle-row button { min-height: 32px; border: 1px solid #ffd0c8; border-radius: 999px; background: #fff7f5; color: #b42318; padding: 0 10px; font: inherit; font-size: 12px; font-weight: 950; cursor: pointer; }
   @media (max-width: 980px) { .fleet-vehicle-tools { grid-template-columns: 1fr; } }
  </style>
`;
  adminHtml = replaceRequired(adminHtml, "\n </head>", `${fleetCss}\n </head>`, "admin fleet css");
}
if (!adminHtml.includes("admin-clean-v77-styles")) {
  const cleanCss = `
  <style id="admin-clean-v77-styles">
   .admin-body.admin-clean-v77 { --v77-bg:#f4f7fb; --v77-panel:#fff; --v77-line:#d9e4ef; --v77-text:#0f172a; --v77-muted:#64748b; background:var(--v77-bg)!important; color:var(--v77-text)!important; font-size:12px!important; }
   .admin-body.admin-clean-v77 .admin-shell { grid-template-columns:52px minmax(0,1fr)!important; }
   .admin-body.admin-clean-v77 .fleet-sidebar { width:52px!important; padding:6px 5px!important; }
   .admin-body.admin-clean-v77 .fleet-nav a { width:34px!important; height:34px!important; border-radius:9px!important; }
   .admin-body.admin-clean-v77 .fleet-topbar { min-height:44px!important; padding:5px 10px!important; }
   .admin-body.admin-clean-v77 .topbar-company-logo { width:68px!important; height:28px!important; }
   .admin-body.admin-clean-v77 .global-search { width:min(390px,34vw)!important; min-height:32px!important; border-radius:8px!important; }
   .admin-body.admin-clean-v77 .sync-chip,
   .admin-body.admin-clean-v77 .user-chip,
   .admin-body.admin-clean-v77 .role-chip,
   .admin-body.admin-clean-v77 .language-select,
   .admin-body.admin-clean-v77 .icon-button,
   .admin-body.admin-clean-v77 .user-admin-link { min-height:30px!important; padding:5px 8px!important; border-radius:8px!important; font-size:11px!important; }
   .admin-body.admin-clean-v77 .dashboard-main { max-width:none!important; padding:8px 10px 18px!important; gap:8px!important; }
   .admin-body.admin-clean-v77 .dashboard-header { min-height:42px!important; padding:8px 10px!important; }
   .admin-body.admin-clean-v77 .dashboard-header h2 { font-size:18px!important; }
   .admin-body.admin-clean-v77 #dashboardContent { padding:9px 10px 12px!important; }
   .admin-body.admin-clean-v77 .admin-filter-panel { grid-template-columns:190px minmax(260px,1fr) 200px 82px!important; gap:6px!important; margin-bottom:7px!important; }
   .admin-body.admin-clean-v77 .control-room-strip { grid-template-columns:repeat(4,minmax(0,1fr))!important; gap:6px!important; margin-bottom:7px!important; }
   .admin-body.admin-clean-v77 .metrics { grid-template-columns:repeat(5,minmax(0,1fr))!important; gap:6px!important; margin:7px 0!important; }
   .admin-body.admin-clean-v77 .admin-filter-panel label,
   .admin-body.admin-clean-v77 .admin-filter-panel article,
   .admin-body.admin-clean-v77 .control-room-strip article,
   .admin-body.admin-clean-v77 .metrics article,
   .admin-body.admin-clean-v77 .dashboard-widget,
   .admin-body.admin-clean-v77 .site-overview-panel,
   .admin-body.admin-clean-v77 .ops-site-card { border:1px solid var(--v77-line)!important; border-radius:8px!important; box-shadow:none!important; background:var(--v77-panel)!important; }
   .admin-body.admin-clean-v77 .control-room-strip article,
   .admin-body.admin-clean-v77 .metrics article { min-height:54px!important; padding:7px 9px!important; }
   .admin-body.admin-clean-v77 .control-room-strip strong,
   .admin-body.admin-clean-v77 .metrics strong,
   .admin-body.admin-clean-v77 .admin-filter-panel strong { font-size:22px!important; line-height:1!important; }
   .admin-body.admin-clean-v77 .site-overview-grid { display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; gap:8px!important; margin:8px 0!important; }
   .admin-body.admin-clean-v77 .site-overview-panel { display:grid!important; grid-template-columns:152px minmax(0,1fr)!important; min-height:0!important; padding:0!important; overflow:hidden!important; }
   .admin-body.admin-clean-v77 .site-overview-head { display:grid!important; place-items:center!important; min-height:142px!important; border:0!important; border-right:1px solid var(--v77-line)!important; border-radius:0!important; background:#123c69!important; color:#fff!important; cursor:pointer!important; }
   .admin-body.admin-clean-v77 .site-overview-head span,
   .admin-body.admin-clean-v77 .site-overview-head small { color:rgba(255,255,255,.74)!important; font-size:10px!important; text-transform:uppercase!important; }
   .admin-body.admin-clean-v77 .site-overview-head strong { color:#fff!important; font-size:34px!important; line-height:1!important; }
   .admin-body.admin-clean-v77 .site-inspection-table { display:grid!important; align-content:start!important; max-height:142px!important; overflow:auto!important; padding:6px!important; gap:3px!important; }
   .admin-body.admin-clean-v77 .site-inspection-row { display:grid!important; grid-template-columns:120px minmax(0,1fr) 44px!important; align-items:center!important; gap:8px!important; min-height:26px!important; padding:4px 7px!important; border:1px solid #edf2f7!important; border-radius:6px!important; color:var(--v77-text)!important; text-decoration:none!important; background:#fbfdff!important; }
   .admin-body.admin-clean-v77 .site-inspection-row strong,
   .admin-body.admin-clean-v77 .site-inspection-row span,
   .admin-body.admin-clean-v77 .site-inspection-row time { overflow:hidden!important; text-overflow:ellipsis!important; white-space:nowrap!important; }
   .admin-body.admin-clean-v77 .site-inspection-row strong { color:#0b2447!important; font-size:12px!important; font-weight:900!important; }
   .admin-body.admin-clean-v77 .site-inspection-row span,
   .admin-body.admin-clean-v77 .site-inspection-row time,
   .admin-body.admin-clean-v77 .site-empty-line { color:var(--v77-muted)!important; font-size:11px!important; font-weight:700!important; }
   .admin-body.admin-clean-v77 .operations-board { display:none!important; }
   .admin-body.admin-clean-v77 .dashboard-card-grid { grid-template-columns:minmax(340px,.82fr) minmax(520px,1.18fr)!important; gap:8px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-widget { order:0!important; grid-column:1 / -1!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools { grid-template-columns:150px 180px 130px minmax(200px,1fr)!important; gap:7px!important; margin:0 0 8px!important; padding:8px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools input,
   .admin-body.admin-clean-v77 .fleet-vehicle-tools select,
   .admin-body.admin-clean-v77 .fleet-vehicle-tools button { min-height:32px!important; border-radius:7px!important; font-size:12px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-list { grid-template-columns:repeat(auto-fill,minmax(150px,1fr))!important; max-height:170px!important; gap:5px!important; padding:0 8px 8px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row { min-height:36px!important; padding:5px 6px!important; border-radius:7px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row strong { font-size:12px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row button { min-height:26px!important; padding:0 8px!important; font-size:11px!important; }
   .admin-body.admin-clean-v77 .report-list,
   .admin-body.admin-clean-v77 .vehicle-summary,
   .admin-body.admin-clean-v77 .alert-list,
   .admin-body.admin-clean-v77 .vehicle-control-list,
   .admin-body.admin-clean-v77 .status-list,
   .admin-body.admin-clean-v77 .driver-summary-list,
   .admin-body.admin-clean-v77 .activity-list,
   .admin-body.admin-clean-v77 .dispatcher-list,
   .admin-body.admin-clean-v77 .vehicle-history-list { max-height:260px!important; padding:7px!important; gap:5px!important; }
   .admin-body.admin-clean-v77 .report-card,
   .admin-body.admin-clean-v77 .vehicle-tile,
   .admin-body.admin-clean-v77 .alert-card,
   .admin-body.admin-clean-v77 .dispatcher-row,
   .admin-body.admin-clean-v77 .activity-row,
   .admin-body.admin-clean-v77 .status-row,
   .admin-body.admin-clean-v77 .vehicle-control-row,
   .admin-body.admin-clean-v77 .history-row { padding:6px 8px!important; border-radius:7px!important; }
   @media (max-width:980px) {
    .admin-body.admin-clean-v77 .admin-shell,
    .admin-body.admin-clean-v77 .admin-filter-panel,
    .admin-body.admin-clean-v77 .control-room-strip,
    .admin-body.admin-clean-v77 .site-overview-grid,
    .admin-body.admin-clean-v77 .dashboard-card-grid,
    .admin-body.admin-clean-v77 .fleet-vehicle-tools { grid-template-columns:1fr!important; }
    .admin-body.admin-clean-v77 .site-overview-panel { grid-template-columns:1fr!important; }
    .admin-body.admin-clean-v77 .site-overview-head { min-height:84px!important; border-right:0!important; border-bottom:1px solid var(--v77-line)!important; }
   }
  </style>
`;
  adminHtml = replaceRequired(adminHtml, "\n </head>", `${cleanCss}\n </head>`, "admin clean v77 css");
}
adminHtml = adminHtml.replace(/<body class="([^"]*)"/, (_match, className) => {
  return className.includes("admin-clean-v77") ? `<body class="${className}"` : `<body class="${className} admin-clean-v77"`;
});
adminHtml = adminHtml
  .replaceAll("/styles.css?v=54", "/styles.css?v=77")
  .replaceAll("/styles.css?v=75", "/styles.css?v=77")
  .replaceAll("/vehicles.js?v=54", "/vehicles.js?v=77")
  .replaceAll("/vehicles.js?v=75", "/vehicles.js?v=77")
  .replaceAll("/i18n.js?v=54", "/i18n.js?v=77")
  .replaceAll("/i18n.js?v=75", "/i18n.js?v=77")
  .replaceAll("/admin.js?v=54", "/admin.js?v=77")
  .replaceAll("/admin.js?v=75", "/admin.js?v=77");
await fs.writeFile(adminHtmlPath, adminHtml);

let runner = await fs.readFile(path.join(process.cwd(), "server-speed-v63.js"), "utf8");
runner = runner
  .replaceAll("server-speed-v63", "server-speed-v75")
  .replaceAll("admin-natural-v63", "admin-natural-v75")
  .replaceAll('"63"', '"75"');

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
