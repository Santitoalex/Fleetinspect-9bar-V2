import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FRONTEND_VERSION = "60";
const sourcePath = path.join(process.cwd(), "server.js");
const runtimeDir = path.join(process.cwd(), ".runtime");
const runtimePath = path.join(runtimeDir, "server.optimized.mjs");
const runtimeAdminHtmlPath = path.join(runtimeDir, "admin.html");
const runtimeAdminJsPath = path.join(runtimeDir, "admin.js");
const runtimeServiceWorkerPath = path.join(runtimeDir, "service-worker.js");

let source = await fs.readFile(sourcePath, "utf8");

function replaceOnce(value, pattern, replacement, label) {
  const next = value.replace(pattern, replacement);
  if (next === value) console.warn(`[server-speed] patch not applied: ${label}`);
  return next;
}

source = replaceOnce(
  source,
  /app\.get\("\/api\/inspections", requireAdmin, async \(_request, response\) => \{\n  response\.json\(await listAllInspectionRecords\(\)\);\n\}\);/,
  `app.get("/api/inspections", requireAdmin, async (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit || 180), 1), 1000);
  response.json(await listAllInspectionRecords({ limit, compact: true }));
});`,
  "compact inspections route"
);

source = replaceOnce(
  source,
  /async function listSupabaseInspections\(\) \{[\s\S]*?\n\}\n\nasync function readSupabaseInspection/,
  `async function listSupabaseInspections({ limit = 1000, compact = false } = {}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .order("finishedAt", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (compact) return (data || []).map(compactInspectionRecord);
  return Promise.all((data || []).map(withSignedSupabasePhotos));
}

async function readSupabaseInspection`,
  "limited supabase inspections"
);

source = replaceOnce(
  source,
  /async function listAllInspectionRecords\(\) \{[\s\S]*?\n\}\n\nfunction getSupabaseBucketUrl/,
  `async function listAllInspectionRecords({ limit = 1000, compact = false } = {}) {
  if (supabaseEnabled) {
    const supabaseItems = await listSupabaseInspections({ limit, compact }).catch(() => null);
    if (supabaseItems) return supabaseItems;
  }

  const files = await fs.readdir(inspectionsDir).catch(() => []);
  const items = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(inspectionsDir, file), "utf8");
      items.push(JSON.parse(raw));
    } catch {
      // Ignore damaged local files.
    }
  }

  items.sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));
  return items.slice(0, limit).map((item) => compact ? compactInspectionRecord(item) : item);
}

function compactInspectionRecord(item) {
  return {
    ...item,
    photos: Array.isArray(item.photos)
      ? item.photos.map((photo) => ({
          id: photo.id,
          label: photo.label,
          storagePath: photo.storagePath,
          bytes: photo.bytes,
        }))
      : [],
  };
}

function getSupabaseBucketUrl`,
  "compact inspection records"
);

source = replaceOnce(
  source,
  /app\.post\("\/api\/inspections", async \(request, response\) => \{\n  const payload = request\.body \|\| \{\};\n  const id = safeName\(payload\.id \|\| `inspection-\$\{Date\.now\(\)\}`\);\n  const dateKey = new Date\(payload\.finishedAt \|\| Date\.now\(\)\)\.toISOString\(\)\.slice\(0, 10\);/,
  `app.post("/api/inspections", async (request, response) => {
  const payload = request.body || {};
  const submittedSite = normalizeSite(payload.site || payload.depot || payload.station || "");
  if (!FLEET_SITES.includes(submittedSite)) {
    return response.status(400).json({ ok: false, error: "Selecciona DRP3 o DSU1 antes de guardar la inspeccion." });
  }
  const id = safeName(payload.id || \`inspection-\${Date.now()}\`);
  const dateKey = new Date(payload.finishedAt || Date.now()).toISOString().slice(0, 10);`,
  "require valid inspection site"
);

source = replaceOnce(
  source,
  /    site: normalizeSite\(payload\.site \|\| payload\.depot \|\| payload\.station \|\| FALLBACK_SITE\),/,
  "    site: submittedSite,",
  "store submitted inspection site"
);

source = replaceOnce(
  source,
  /app\.use\(express\.static\(process\.cwd\(\), \{/,
  `app.get(["/admin", "/admin.html"], (_request, response) => {
  response.type("html").setHeader("Cache-Control", "no-store");
  response.sendFile(path.join(process.cwd(), ".runtime", "admin.html"));
});

app.get("/admin.js", (_request, response) => {
  response.type("application/javascript").setHeader("Cache-Control", "no-store");
  response.sendFile(path.join(process.cwd(), ".runtime", "admin.js"));
});

app.get("/service-worker.js", (_request, response) => {
  response.type("application/javascript").setHeader("Cache-Control", "no-store");
  response.sendFile(path.join(process.cwd(), ".runtime", "service-worker.js"));
});

app.use(express.static(process.cwd(), {`,
  "runtime admin routes"
);

function patchAdminHtml(html) {
  let patched = html.replace(/\?v=\d+/g, `?v=${FRONTEND_VERSION}`);

  patched = patched.replace(
    /<span data-i18n="pendingToday">Pending today<\/span>\s*<strong id="todayPendingCount">0<\/strong>\s*<small data-i18n="dailyVehicleControl">Daily vehicle control<\/small>/,
    [
      "<span>IA pendiente/fallo</span>",
      '         <strong id="todayPendingCount">0</strong>',
      "         <small>Inspecciones de hoy</small>",
    ].join("\n")
  );

  patched = patched.replace(
    /<option value="missing" data-i18n="onlyMissing">Only missing<\/option>/,
    '<option value="missing">IA pendiente/fallo</option>'
  );

  patched = patched.replace(
    /<article><span data-i18n="plannedRoutesShort">Planned routes<\/span><strong id="controlTotalVehicles">0<\/strong><\/article>\s*<article><span data-i18n="inspected">Inspected<\/span><strong id="controlInspectedVehicles">0<\/strong><\/article>\s*<article><span data-i18n="missing">Missing<\/span><strong id="controlMissingVehicles">0<\/strong><\/article>/,
    [
      '<article><span>Inspecciones dia</span><strong id="controlTotalVehicles">0</strong></article>',
      '          <article><span>Vehiculos unicos</span><strong id="controlInspectedVehicles">0</strong></article>',
      '          <article><span>IA pendiente/fallo</span><strong id="controlMissingVehicles">0</strong></article>',
    ].join("\n")
  );

  patched = patched.replace(
    /\s*<div class="route-plan-card">[\s\S]*?<p id="routePlanStatus" data-i18n="routePlanHelp">[\s\S]*?<\/p>\s*<\/div>/,
    '\n         <p id="routePlanStatus" class="daily-control-note">Vista basada solo en inspecciones reales guardadas.</p>'
  );

  patched = patched.replace(
    '<select id="vehicleHistoryPlate"></select>',
    '<input id="vehicleHistoryPlate" list="vehicleHistoryPlateOptions" type="search" placeholder="Buscar matricula" autocomplete="off" />\n           <datalist id="vehicleHistoryPlateOptions"></datalist>'
  );

  patched = patched
    .replace('<h3 data-i18n="dailyVehicleControl">Daily vehicle control</h3>', '<h3>Historial por vehiculo</h3>')
    .replace('<span data-i18n="dailyVehicleControlSubtitle">Choose a date and verify every registration in the fleet</span>', '<span>Busca una matricula y revisa todo su historial de inspecciones</span>')
    .replace('<span data-i18n="controlDate">Control date</span>', '<span>Fecha</span>')
    .replace('<span data-i18n="registrationNumber">Registration number</span>', '<span>Matricula</span>')
    .replace('placeholder="M AZ 1003"', 'placeholder="Buscar matricula"');

  const extraCss = `
   .admin-body.admin-compact-v54 .route-plan-card { display: none !important; }
   .admin-body.admin-compact-v54 {
    background: #f4f7fb !important;
   }
   .admin-body.admin-compact-v54 .fleet-topbar {
    min-height: 58px !important;
   }
   .admin-body.admin-compact-v54 .dashboard-main {
    padding: 18px !important;
   }
   .admin-body.admin-compact-v54 .admin-hero,
   .admin-body.admin-compact-v54 .hero-status-grid,
   .admin-body.admin-compact-v54 .control-room-strip,
   .admin-body.admin-compact-v54 .metrics,
   .admin-body.admin-compact-v54 .dashboard-card-grid {
    gap: 10px !important;
   }
   .admin-body.admin-compact-v54 .admin-hero {
    display: none !important;
   }
   .admin-body.admin-compact-v54 .dashboard-actions,
   .admin-body.admin-compact-v54 #operationsBoard,
   .admin-body.admin-compact-v54 .data-command-center,
   .admin-body.admin-compact-v54 #auditWidget,
   .admin-body.admin-compact-v54 .dashboard-widget.status-widget:has(#systemStatus) {
    display: none !important;
   }
   .admin-body.admin-compact-v54 .admin-filter-panel {
    grid-template-columns: minmax(160px, 220px) minmax(220px, 1fr) minmax(180px, 260px) 100px !important;
    gap: 8px !important;
   }
   .admin-body.admin-compact-v54 .admin-filter-panel label,
   .admin-body.admin-compact-v54 .admin-filter-panel article,
   .admin-body.admin-compact-v54 .vehicle-control-tools label,
   .admin-body.admin-compact-v54 .history-selector {
    min-height: 54px !important;
    padding: 9px 11px !important;
    border-radius: 9px !important;
   }
   .admin-body.admin-compact-v54 .admin-filter-panel span,
   .admin-body.admin-compact-v54 .vehicle-control-tools span,
   .admin-body.admin-compact-v54 .history-selector span,
   .admin-body.admin-compact-v54 .control-room-strip span,
   .admin-body.admin-compact-v54 .metrics span {
    font-size: 10px !important;
    letter-spacing: .02em !important;
   }
   .admin-body.admin-compact-v54 select,
   .admin-body.admin-compact-v54 input,
   .admin-body.admin-compact-v54 button {
    font-size: 13px !important;
   }
   .admin-body.admin-compact-v54 .system-health-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid #9ee6bf;
    border-radius: 9px;
    background: #ecfdf5;
    color: #146c43;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
   }
   .admin-body.admin-compact-v54 .system-health-pill::before {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: #16a34a;
    box-shadow: 0 0 0 4px rgba(22, 163, 74, .14);
   }
   .admin-body.admin-compact-v54 .system-health-pill.offline {
    border-color: #fecaca;
    background: #fff1f2;
    color: #b91c1c;
   }
   .admin-body.admin-compact-v54 .system-health-pill.offline::before {
    background: #dc2626;
    box-shadow: 0 0 0 4px rgba(220, 38, 38, .14);
   }
   .admin-body.admin-compact-v54 .system-health-pill .muted {
    color: inherit;
    opacity: .7;
    font-weight: 800;
   }
   .admin-body.admin-compact-v54 .site-day-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin: 8px 0;
   }
   .admin-body.admin-compact-v54 .site-day-cell {
    min-width: 0;
    padding: 7px 6px;
    border: 1px solid #d8e3ee;
    border-radius: 8px;
    background: #f8fafc;
   }
   .admin-body.admin-compact-v54 .site-day-cell.has-data {
    background: #ecfdf5;
    border-color: #a7f3d0;
   }
   .admin-body.admin-compact-v54 .site-day-cell.has-alert {
    background: #fff7ed;
    border-color: #fed7aa;
   }
   .admin-body.admin-compact-v54 .site-day-cell span,
   .admin-body.admin-compact-v54 .site-day-cell small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px !important;
   }
   .admin-body.admin-compact-v54 .site-day-cell strong {
    display: block;
    margin: 3px 0;
    font-size: 20px !important;
    line-height: 1 !important;
   }
   .admin-body.admin-compact-v54 .ops-site-metrics.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
   }
   .admin-body.admin-compact-v54 .site-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    align-items: stretch;
   }
   .admin-body.admin-compact-v54 .site-overview-card {
    display: block !important;
    text-align: left !important;
    height: auto !important;
   }
   .admin-body.admin-compact-v54 .site-overview-head {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 10px;
    align-items: end;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
   }
   .admin-body.admin-compact-v54 .site-overview-head span,
   .admin-body.admin-compact-v54 .site-overview-head small {
    grid-column: 1 / -1;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-list {
    display: grid;
    gap: 4px;
    margin-top: 7px;
    max-height: 180px;
    overflow: auto;
    padding-right: 2px;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    padding: 5px 7px;
    border: 1px solid #dbe6f0;
    border-radius: 7px;
    background: #fff;
    color: #0f172a;
    text-decoration: none;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row:hover {
    border-color: #1f6b9d;
    background: #f5fbff;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row strong,
   .admin-body.admin-compact-v54 .site-vehicle-report-row small {
    display: block;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row strong,
   .admin-body.admin-compact-v54 .vehicle-control-row strong,
   .admin-body.admin-compact-v54 .history-row strong,
   .admin-body.admin-compact-v54 .vehicle-summary strong {
    font-size: 12px !important;
    line-height: 1.1 !important;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row small,
   .admin-body.admin-compact-v54 .vehicle-control-row span,
   .admin-body.admin-compact-v54 .history-row span,
   .admin-body.admin-compact-v54 .vehicle-summary span {
    font-size: 10px !important;
    line-height: 1.2 !important;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row em {
    flex: 0 0 auto;
    font-size: 10px;
    font-style: normal;
    font-weight: 900;
    color: #1f6b9d;
    text-transform: uppercase;
   }
   .admin-body.admin-compact-v54 .site-vehicle-report-row.alert {
    border-color: #fed7aa;
    background: #fff7ed;
   }
   .admin-body.admin-compact-v54 .empty-site-report {
    display: block;
    padding: 8px;
    border: 1px dashed #d8e3ee;
    border-radius: 7px;
    color: #607089;
    font-weight: 800;
   }
   .admin-body.admin-compact-v54 .daily-control-note {
    margin: 6px 0 8px;
    color: #607089;
    font-size: 11px;
    font-weight: 800;
   }
   .admin-body.admin-compact-v54 .vehicle-control-tools label:has(#vehicleControlDate),
   .admin-body.admin-compact-v54 .vehicle-control-tools label:has(#vehicleControlView),
   .admin-body.admin-compact-v54 .vehicle-control-summary article:nth-child(3) {
    display: none !important;
   }
   .admin-body.admin-compact-v54 .vehicle-control-tools {
    grid-template-columns: minmax(260px, 1fr) !important;
    max-width: 520px;
   }
   .admin-body.admin-compact-v54 .vehicle-control-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 8px !important;
   }
   .admin-body.admin-compact-v54 .vehicle-control-list,
   .admin-body.admin-compact-v54 .vehicle-history-list,
   .admin-body.admin-compact-v54 .report-list,
   .admin-body.admin-compact-v54 .vehicle-summary {
    gap: 6px !important;
   }
   .admin-body.admin-compact-v54 .vehicle-control-row,
   .admin-body.admin-compact-v54 .history-row,
   .admin-body.admin-compact-v54 .report-row,
   .admin-body.admin-compact-v54 .vehicle-summary article {
    padding: 8px 10px !important;
    border-radius: 8px !important;
   }
   .admin-body.admin-compact-v54 .dashboard-widget {
    border-radius: 10px !important;
   }
   .admin-body.admin-compact-v54 .dashboard-widget > header {
    padding: 12px 14px !important;
   }
   .admin-body.admin-compact-v54 .dashboard-widget > header h3 {
    font-size: 16px !important;
   }
   .admin-body.admin-compact-v54 .dashboard-widget > header span {
    font-size: 10px !important;
   }
   .admin-body.admin-compact-v54 .history-selector input {
    width: min(260px, 34vw);
    border: 0;
    outline: none;
    background: transparent;
    color: #0f172a;
    font-weight: 900;
   }`;

  return patched.replace("</style>\n </head>", `${extraCss}\n  </style>\n </head>`);
}

function patchAdminJs(adminJs) {
  let js = adminJs;

  if (!js.includes("const SITE_DAILY_DAYS")) {
    js = js.replace(
      /const VEHICLE_HISTORY_LIMIT = 24;\n/,
      "const VEHICLE_HISTORY_LIMIT = 24;\nconst SITE_DAILY_DAYS = 7;\n"
    );
  }

  js = js.replace(
    /nodes\.siteFilter\?\.addEventListener\("change", async \(\) => \{[\s\S]*?renderDashboard\(\);\n  \}\);/,
    'nodes.siteFilter?.addEventListener("change", () => {\n    renderDashboard();\n  });'
  );

  js = js.replace(
    /nodes\.vehicleControlDate\.addEventListener\("change", async \(\) => \{[\s\S]*?renderDashboard\(\);\n  \}\);/,
    'nodes.vehicleControlDate.addEventListener("change", () => {\n    renderDashboard();\n  });'
  );

  js = js.replace(
    'nodes.saveRoutePlan.addEventListener("click", saveRoutePlan);\n  nodes.clearRoutePlan.addEventListener("click", clearRoutePlan);',
    'nodes.saveRoutePlan?.addEventListener("click", saveRoutePlan);\n  nodes.clearRoutePlan?.addEventListener("click", clearRoutePlan);'
  );

  js = js.replace(
    'nodes.vehicleHistoryPlate.addEventListener("change", renderVehicleHistory);',
    'nodes.vehicleHistoryPlate.addEventListener("change", renderVehicleHistory);\n  nodes.vehicleHistoryPlate.addEventListener("input", renderVehicleHistory);'
  );

  js = js.replace(
    /  syncRoutePlanInput\(\);\n  window\.setTimeout\(showAdminInstallPanel, 500\);/,
    "  window.setTimeout(showAdminInstallPanel, 500);"
  );

  js = js.replace(
    /    auditEvents = \[\];\n    await Promise\.all\(\[\n      loadRoutePlanForDate\(localDateKey\(new Date\(\)\)\),\n      loadRoutePlanForDate\(nodes\.vehicleControlDate\.value \|\| localDateKey\(new Date\(\)\)\),\n    \]\);/,
    "    auditEvents = [];"
  );

  js = js.replace(
    /\[nodes\.saveRoutePlan, nodes\.clearRoutePlan, nodes\.closeDay\]\.forEach/,
    "[nodes.saveRoutePlan, nodes.clearRoutePlan, nodes.closeDay].filter(Boolean).forEach"
  );

  js = js.replace(
    /function renderControlRoom\(items\) \{[\s\S]*?\n\}\n\nfunction renderSiteOverview/,
    [
      "function renderControlRoom(items) {",
      "  const today = localDateKey(new Date());",
      "  const todayItems = items.filter((item) => localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === today);",
      "  const done = todayItems.length;",
      "  const todayVehicles = new Set(todayItems.map((item) => normalizePlate(item.plate || \"\")).filter(Boolean)).size;",
      "  const todayAiReview = todayItems.filter((item) => [\"queued\", \"failed\"].includes(getAiStatus(item).key)).length;",
      "  const latest = [...items].sort((a, b) => new Date(b.finishedAt || b.startedAt || 0) - new Date(a.finishedAt || a.startedAt || 0))[0];",
      "  const latestStatus = latest ? getAiStatus(latest) : null;",
      "",
      "  nodes.todayCompletion.textContent = String(done);",
      "  nodes.todayCompletionMeta.textContent = `${todayVehicles} vehiculos unicos`;",
      "  nodes.todayPendingCount.textContent = String(todayAiReview);",
      "  nodes.latestInspectionTime.textContent = latest ? formatTime(new Date(latest.finishedAt || latest.startedAt)) : \"--\";",
      "  nodes.latestInspectionMeta.textContent = latest ? `${latest.plate || t(\"noRegistration\")} · ${latest.driverName || t(\"noDriver\")}` : t(\"noRecentActivity\");",
      "  nodes.liveAiState.textContent = latestStatus ? latestStatus.label : t(\"pending\");",
      "  nodes.liveDriver.textContent = latest?.driverName || \"--\";",
      "  nodes.livePlate.textContent = latest?.plate || \"--\";",
      "}",
      "",
      "function renderSiteOverview",
    ].join("\n")
  );

  js = js.replace(
    /function renderStatusPills\(\) \{[\s\S]*?\n\}\n\nfunction renderPhotoStrip/,
    [
      "function renderStatusPills() {",
      "  const storageReady = Boolean(systemConfig.supabaseConfigured || systemConfig.cloudStorageConfigured || systemConfig.driveConfigured);",
      "  const aiReady = Boolean(systemConfig.aiConfigured);",
      "  const ready = storageReady && aiReady;",
      "  nodes.storagePill.textContent = storageReady ? t(\"ready\") : t(\"needsSetup\");",
      "  nodes.aiPill.textContent = aiReady ? t(\"ready\") : t(\"needsSetup\");",
      "  nodes.storagePill.className = storageReady ? \"ready\" : \"warn\";",
      "  nodes.aiPill.className = aiReady ? \"ready\" : \"warn\";",
      "",
      "  const topbar = document.querySelector(\".topbar-actions\");",
      "  let healthPill = document.querySelector(\"#systemHealthPill\");",
      "  if (!healthPill && topbar) {",
      "    healthPill = document.createElement(\"span\");",
      "    healthPill.id = \"systemHealthPill\";",
      "    topbar.insertBefore(healthPill, nodes.logoutAdmin || null);",
      "  }",
      "  if (healthPill) {",
      "    healthPill.className = `system-health-pill ${ready ? \"online\" : \"offline\"}`;",
      "    healthPill.innerHTML = ready ? \"Operativa\" : \"Revisar\";",
      "    healthPill.title = ready ? \"Supabase e IA operativas\" : \"Revisar conexion cloud o IA\";",
      "  }",
      "}",
      "",
      "function renderPhotoStrip",
    ].join("\n")
  );

  js = js.replace(
    /function renderVehicleHistoryPicker\(\) \{[\s\S]*?\n\}\n\nfunction renderVehicleHistory/,
    [
      "function renderVehicleHistoryPicker() {",
      "  const selected = nodes.vehicleHistoryPlate.value;",
      "  const plates = [...new Set(dashboardItems.map((item) => normalizePlate(item.plate || \"\")).filter(Boolean))]",
      "    .sort((a, b) => a.localeCompare(b));",
      "  const datalist = document.querySelector(\"#vehicleHistoryPlateOptions\");",
      "  if (datalist) {",
      "    datalist.innerHTML = plates.map((plate) => `<option value=\"${escapeHtml(plate)}\"></option>`).join(\"\");",
      "    nodes.vehicleHistoryPlate.placeholder = \"Buscar matricula\";",
      "    if (selected && plates.includes(normalizePlate(selected))) nodes.vehicleHistoryPlate.value = normalizePlate(selected);",
      "    return;",
      "  }",
      "  nodes.vehicleHistoryPlate.innerHTML = [",
      "    `<option value=\"\">${escapeHtml(t(\"selectVehicle\"))}</option>`,",
      "    ...plates.map((plate) => `<option value=\"${escapeHtml(plate)}\">${escapeHtml(plate)}</option>`),",
      "  ].join(\"\");",
      "  if (plates.includes(selected)) nodes.vehicleHistoryPlate.value = selected;",
      "}",
      "",
      "function renderVehicleHistory",
    ].join("\n")
  );

  js = js.replace(
    /function renderVehicleHistory\(\) \{[\s\S]*?\n\}\n\nfunction renderSystemStatus/,
    [
      "function renderVehicleHistory() {",
      "  const query = normalizePlate(nodes.vehicleHistoryPlate.value || \"\");",
      "  if (!query) {",
      "    nodes.vehicleHistoryList.innerHTML = `<article class=\"empty-state\">Escribe o selecciona una matricula</article>`;",
      "    return;",
      "  }",
      "",
      "  const items = dashboardItems",
      "    .filter((item) => normalizePlate(item.plate || \"\").includes(query))",
      "    .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));",
      "",
      "  if (!items.length) {",
      "    nodes.vehicleHistoryList.innerHTML = `<article class=\"empty-state\">Sin historial para ${escapeHtml(query)}</article>`;",
      "    return;",
      "  }",
      "",
      "  const limitedItems = items.slice(0, VEHICLE_HISTORY_LIMIT);",
      "  nodes.vehicleHistoryList.innerHTML = limitedItems.map((item) => `",
      "    <article class=\"history-row ${item.ai?.newDamageDetected ? \"alert\" : \"\"}\">",
      "      <div>",
      "        <strong>${escapeHtml(normalizePlate(item.plate || query))}</strong>",
      "        <span>${formatDate(item.finishedAt || item.startedAt)} · ${escapeHtml(item.driverName || t(\"noDriver\"))}</span>",
      "      </div>",
      "      <div>",
      "        ${renderAiBadge(item)}",
      "        <span>${escapeHtml(item.ai?.label || t(\"aiPending\"))}</span>",
      "      </div>",
      "      <div>",
      "        <strong>${item.photos?.length || 0}</strong>",
      "        <span>${escapeHtml(t(\"photos\"))}</span>",
      "      </div>",
      "      <a href=\"/report.html?id=${encodeURIComponent(item.id)}\" target=\"_blank\" rel=\"noopener\">${escapeHtml(t(\"viewPdf\"))}</a>",
      "    </article>",
      "  `).join(\"\") + (items.length > limitedItems.length",
      "    ? `<p class=\"list-limit-note\">${escapeHtml(t(\"filtered\"))}: ${limitedItems.length} / ${items.length}</p>`",
      "    : \"\");",
      "}",
      "",
      "function renderSystemStatus",
    ].join("\n")
  );

  js = js.replace(
    /function renderSiteOverview\(\) \{[\s\S]*?\n\}\n\nfunction renderOperationsBoard/,
    [
      "function renderSiteOverview() {",
      "  if (!nodes.siteOverview) return;",
      "  const today = localDateKey(new Date());",
      "  const todayUnassigned = dashboardItems.some((item) => {",
      "    return getItemSite(item) === FALLBACK_SITE && localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === today;",
      "  });",
      "  const visibleOverviewSites = todayUnassigned ? [...FLEET_SITES, FALLBACK_SITE] : FLEET_SITES;",
      "  nodes.siteOverview.innerHTML = visibleOverviewSites.map((site) => {",
      "    const todayItems = dashboardItems.filter((item) => {",
      "      return getItemSite(item) === site && localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === today;",
      "    });",
      "    const latestByPlate = Object.values(todayItems.reduce((groups, item) => {",
      "      const plate = normalizePlate(item.plate || \"\");",
      "      if (!plate) return groups;",
      "      if (!groups[plate] || new Date(item.finishedAt || item.startedAt || 0) > new Date(groups[plate].finishedAt || groups[plate].startedAt || 0)) {",
      "        groups[plate] = item;",
      "      }",
      "      return groups;",
      "    }, {})).sort((a, b) => normalizePlate(a.plate || \"\").localeCompare(normalizePlate(b.plate || \"\")));",
      "    const vehicles = latestByPlate.length;",
      "    const alerts = todayItems.filter((item) => item.ai?.newDamageDetected).length;",
      "    const active = getSelectedSite() === site;",
      "    return `",
      "      <article class=\"site-overview-card ${active ? \"active\" : \"\"}\">",
      "        <button class=\"site-overview-head\" type=\"button\" data-site-jump=\"${escapeHtml(site)}\">",
      "          <span>${escapeHtml(siteLabel(site))}</span>",
      "          <strong>${todayItems.length}</strong>",
      "          <small>${vehicles} vehiculos · ${alerts} alertas hoy</small>",
      "        </button>",
      "        <div class=\"site-vehicle-report-list\">",
      "          ${latestByPlate.length ? latestByPlate.map(renderSiteVehicleReportRow).join(\"\") : `<span class=\"empty-site-report\">Sin inspecciones hoy</span>`}",
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
      "",
      "function renderSiteVehicleReportRow(item) {",
      "  const status = getAiStatus(item);",
      "  const plate = normalizePlate(item.plate || t(\"noRegistration\"));",
      "  const driver = item.driverName || t(\"noDriver\");",
      "  const time = formatTime(new Date(item.finishedAt || item.startedAt || 0));",
      "  return `",
      "    <a class=\"site-vehicle-report-row ${item.ai?.newDamageDetected ? \"alert\" : status.className}\" href=\"/report.html?id=${encodeURIComponent(item.id)}\" target=\"_blank\" rel=\"noopener\">",
      "      <span><strong>${escapeHtml(plate)}</strong><small>${escapeHtml(driver)} · ${escapeHtml(time)}</small></span>",
      "      <em>Reporte</em>",
      "    </a>",
      "  `;",
      "}",
      "",
      "function renderOperationsBoard",
    ].join("\n")
  );

  js = js.replace(
    /function renderOperationsBoard\(items\) \{[\s\S]*?\n\}\n\nfunction renderAlertState/,
    [
      "function renderOperationsBoard(items) {",
      "  if (!nodes.operationsBoard) return;",
      "  const today = new Date();",
      "  const days = Array.from({ length: SITE_DAILY_DAYS }, (_, index) => {",
      "    const date = new Date(today);",
      "    date.setDate(today.getDate() - index);",
      "    return localDateKey(date);",
      "  });",
      "  const selectedSite = getSelectedSite();",
      "  const visibleSites = selectedSite === \"all\" ? FLEET_SITES : FLEET_SITES.filter((site) => site === selectedSite);",
      "",
      "  nodes.operationsBoard.innerHTML = visibleSites.map((site) => {",
      "    const siteItems = items.filter((item) => getItemSite(item) === site);",
      "    const total = siteItems.length;",
      "    const vehicles = new Set(siteItems.map((item) => normalizePlate(item.plate || \"\")).filter(Boolean)).size;",
      "    const alerts = siteItems.filter((item) => item.ai?.newDamageDetected).length;",
      "    const latest = [...siteItems].sort((a, b) => new Date(b.finishedAt || b.startedAt || 0) - new Date(a.finishedAt || a.startedAt || 0))[0];",
      "",
      "    return `",
      "      <article class=\"ops-site-card ${alerts ? \"has-alert\" : \"\"}\">",
      "        <header>",
      "          <div>",
      "            <span>Site</span>",
      "            <strong>${escapeHtml(siteLabel(site))}</strong>",
      "          </div>",
      "          <em>${total} total</em>",
      "        </header>",
      "        <div class=\"site-day-grid\">",
      "          ${days.map((dateKey) => renderSiteDayCell(siteItems, dateKey)).join(\"\")}",
      "        </div>",
      "        <div class=\"ops-site-metrics compact\">",
      "          <span><b>${vehicles}</b> vehiculos</span>",
      "          <span><b>${alerts}</b> alertas IA</span>",
      "        </div>",
      "        <small>${latest ? `${escapeHtml(latest.plate || \"\")} · ${escapeHtml(latest.driverName || \"\")} · ${formatTime(new Date(latest.finishedAt || latest.startedAt))}` : \"Sin actividad hoy\"}</small>",
      "      </article>",
      "    `;",
      "  }).join(\"\");",
      "}",
      "",
      "function renderSiteDayCell(siteItems, dateKey) {",
      "  const dayItems = siteItems.filter((item) => localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === dateKey);",
      "  const vehicles = new Set(dayItems.map((item) => normalizePlate(item.plate || \"\")).filter(Boolean)).size;",
      "  const alerts = dayItems.filter((item) => item.ai?.newDamageDetected).length;",
      "  const date = new Date(`${dateKey}T12:00:00`);",
      "  const label = date.toLocaleDateString(undefined, { weekday: \"short\", day: \"2-digit\" });",
      "  return `",
      "    <div class=\"site-day-cell ${dayItems.length ? \"has-data\" : \"\"} ${alerts ? \"has-alert\" : \"\"}\">",
      "      <span>${escapeHtml(label)}</span>",
      "      <strong>${dayItems.length}</strong>",
      "      <small>${vehicles} veh.</small>",
      "    </div>",
      "  `;",
      "}",
      "",
      "function renderAlertState",
    ].join("\n")
  );

  js = js.replace(
    /function renderDailyVehicleControl\(\) \{[\s\S]*?\n\}\n\nfunction renderRoutePendingSection/,
    [
      "function renderDailyVehicleControl() {",
      "  const query = normalizePlate(nodes.vehicleControlSearch.value || \"\");",
      "  const siteItems = getSiteScopedItems(dashboardItems).filter((item) => normalizePlate(item.plate || \"\"));",
      "  const inspectionsByPlate = siteItems.reduce((groups, item) => {",
      "    const plate = normalizePlate(item.plate || \"\");",
      "    if (!plate) return groups;",
      "    if (!groups[plate]) groups[plate] = [];",
      "    groups[plate].push(item);",
      "    return groups;",
      "  }, {});",
      "",
      "  const vehicles = Object.keys(inspectionsByPlate)",
      "    .map((plate) => {",
      "      const normalized = normalizePlate(plate);",
      "      const inspections = (inspectionsByPlate[normalized] || [])",
      "        .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));",
      "      const latest = inspections[0];",
      "      return {",
      "        plate,",
      "        normalized,",
      "        inspected: inspections.length > 0,",
      "        inspections,",
      "        latest,",
      "        hasAlert: inspections.some((item) => item.ai?.newDamageDetected),",
      "      };",
      "    })",
      "    .filter((vehicle) => !query || vehicle.normalized.includes(query));",
      "",
      "  const doneVehicles = vehicles.filter((vehicle) => vehicle.inspected);",
      "  const totalInspections = vehicles.reduce((sum, vehicle) => sum + vehicle.inspections.length, 0);",
      "  const aiReviewCount = vehicles.filter((vehicle) => vehicle.latest && [\"queued\", \"failed\"].includes(getAiStatus(vehicle.latest).key)).length;",
      "  const alertCount = vehicles.filter((vehicle) => vehicle.hasAlert).length;",
      "",
      "  nodes.controlTotalVehicles.textContent = String(totalInspections);",
      "  nodes.controlInspectedVehicles.textContent = String(doneVehicles.length);",
      "  nodes.controlMissingVehicles.textContent = String(aiReviewCount);",
      "  nodes.controlAlertVehicles.textContent = String(alertCount);",
      "  if (nodes.routePlanStatus) nodes.routePlanStatus.textContent = query",
      "    ? `${totalInspections} inspecciones encontradas para ${query} · ${siteLabel(getSelectedSite())}`",
      "    : `Escribe una matricula para ver todo el historial · ${doneVehicles.length} vehiculos con inspecciones`;",
      "",
      "  if (!vehicles.length) {",
      "    nodes.vehicleControlList.innerHTML = `<article class=\"empty-state\">Sin historial para esa matricula</article>`;",
      "    return;",
      "  }",
      "",
      "  if (!query) {",
      "    nodes.vehicleControlList.innerHTML = renderVehicleControlSection(\"Vehiculos con historial\", doneVehicles.slice(0, 80), \"Historial\", \"priority\");",
      "    return;",
      "  }",
      "",
      "  const historyItems = vehicles",
      "    .flatMap((vehicle) => vehicle.inspections)",
      "    .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));",
      "  nodes.vehicleControlList.innerHTML = renderVehicleFullHistory(query, historyItems);",
      "}",
      "",
      "function renderVehicleFullHistory(query, items) {",
      "  return `",
      "    <section class=\"vehicle-control-section priority\">",
      "      <header>",
      "        <div>",
      "          <strong>Historial completo ${escapeHtml(query)}</strong>",
      "          <span>${items.length} inspecciones guardadas</span>",
      "        </div>",
      "      </header>",
      "      <div class=\"vehicle-control-table\">",
      "        ${items.length ? items.map(renderVehicleHistoryControlRow).join(\"\") : `<article class=\"empty-state\">Sin historial para esa matricula</article>`}",
      "      </div>",
      "    </section>",
      "  `;",
      "}",
      "",
      "function renderVehicleHistoryControlRow(item) {",
      "  const status = getAiStatus(item);",
      "  const date = formatDate(item.finishedAt || item.startedAt);",
      "  const time = formatTime(new Date(item.finishedAt || item.startedAt || 0));",
      "  const hasAlert = Boolean(item.ai?.newDamageDetected);",
      "  return `",
      "    <article class=\"vehicle-control-row ${hasAlert ? \"alert\" : status.className}\">",
      "      <div>",
      "        <strong>${escapeHtml(normalizePlate(item.plate || \"\"))}</strong>",
      "        <span>Matricula</span>",
      "      </div>",
      "      <div>",
      "        <strong>${escapeHtml(date)}</strong>",
      "        <span>${escapeHtml(time)}</span>",
      "      </div>",
      "      <div>",
      "        <strong>${escapeHtml(item.driverName || t(\"noDriver\"))}</strong>",
      "        <span>Conductor</span>",
      "      </div>",
      "      <div>",
      "        <strong>${item.photos?.length || 0}</strong>",
      "        <span>${escapeHtml(t(\"photos\"))}</span>",
      "      </div>",
      "      <div>",
      "        <strong>${escapeHtml(status.label)}</strong>",
      "        <span>Estado IA</span>",
      "      </div>",
      "      <div class=\"vehicle-control-actions\">",
      "        <a href=\"/report.html?id=${encodeURIComponent(item.id)}\" target=\"_blank\" rel=\"noopener\">Reporte</a>",
      "      </div>",
      "    </article>",
      "  `;",
      "}",
      "",
      "function renderRoutePendingSection",
    ].join("\n")
  );

  return js;
}

function patchServiceWorker(serviceWorker) {
  return serviceWorker
    .replace(/fleetinspect-driver-v\d+/g, `fleetinspect-driver-v${FRONTEND_VERSION}`)
    .replace(/\?v=\d+/g, `?v=${FRONTEND_VERSION}`);
}

await fs.mkdir(runtimeDir, { recursive: true });
await Promise.all([
  fs.writeFile(runtimeAdminHtmlPath, patchAdminHtml(await fs.readFile(path.join(process.cwd(), "admin.html"), "utf8"))),
  fs.writeFile(runtimeAdminJsPath, patchAdminJs(await fs.readFile(path.join(process.cwd(), "admin.js"), "utf8"))),
  fs.writeFile(runtimeServiceWorkerPath, patchServiceWorker(await fs.readFile(path.join(process.cwd(), "service-worker.js"), "utf8"))),
  fs.writeFile(runtimePath, source),
]);

await import(pathToFileURL(runtimePath).href);
