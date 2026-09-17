import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FRONTEND_VERSION = "55";
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
  let patched = html.replaceAll("?v=54", `?v=${FRONTEND_VERSION}`);

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

  const extraCss = `
   .admin-body.admin-compact-v54 .route-plan-card { display: none !important; }
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
   .admin-body.admin-compact-v54 .daily-control-note {
    margin: 6px 0 8px;
    color: #607089;
    font-size: 11px;
    font-weight: 800;
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
    /function renderSiteOverview\(\) \{[\s\S]*?\n\}\n\nfunction renderOperationsBoard/,
    [
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
      "    return `",
      "      <button class=\"site-overview-card ${active ? \"active\" : \"\"}\" type=\"button\" data-site-jump=\"${escapeHtml(site)}\">",
      "        <span>${escapeHtml(siteLabel(site))}</span>",
      "        <strong>${todayItems.length}</strong>",
      "        <small>${vehicles} vehiculos · ${alerts} alertas hoy</small>",
      "      </button>",
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
      "  const selectedDate = nodes.vehicleControlDate.value || localDateKey(new Date());",
      "  const search = nodes.vehicleControlSearch.value.trim().toLowerCase();",
      "  const inspectionsByPlate = getSiteScopedItems(dashboardItems).reduce((groups, item) => {",
      "    const plate = normalizePlate(item.plate || \"\");",
      "    const inspectionDate = localDateKey(new Date(item.finishedAt || item.startedAt || 0));",
      "    if (inspectionDate !== selectedDate || !plate) return groups;",
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
      "    .filter((vehicle) => vehicle.normalized.toLowerCase().includes(search));",
      "",
      "  const viewMode = nodes.vehicleControlView.value;",
      "  const doneVehicles = vehicles.filter((vehicle) => vehicle.inspected);",
      "  const totalInspections = vehicles.reduce((sum, vehicle) => sum + vehicle.inspections.length, 0);",
      "  const aiReviewCount = vehicles.filter((vehicle) => vehicle.latest && [\"queued\", \"failed\"].includes(getAiStatus(vehicle.latest).key)).length;",
      "  const alertCount = vehicles.filter((vehicle) => vehicle.hasAlert).length;",
      "",
      "  nodes.controlTotalVehicles.textContent = String(totalInspections);",
      "  nodes.controlInspectedVehicles.textContent = String(doneVehicles.length);",
      "  nodes.controlMissingVehicles.textContent = String(aiReviewCount);",
      "  nodes.controlAlertVehicles.textContent = String(alertCount);",
      "  if (nodes.routePlanStatus) nodes.routePlanStatus.textContent = `${totalInspections} inspecciones en ${siteLabel(getSelectedSite())} · ${selectedDate}`;",
      "",
      "  if (!vehicles.length) {",
      "    nodes.vehicleControlList.innerHTML = `<article class=\"empty-state\">${escapeHtml(t(\"noVehiclesFound\"))}</article>`;",
      "    return;",
      "  }",
      "",
      "  if (viewMode === \"missing\") {",
      "    nodes.vehicleControlList.innerHTML = renderVehicleControlSection(\"IA pendiente/fallo\", doneVehicles.filter((vehicle) => vehicle.latest && [\"queued\", \"failed\"].includes(getAiStatus(vehicle.latest).key)), selectedDate);",
      "    return;",
      "  }",
      "",
      "  nodes.vehicleControlList.innerHTML = renderVehicleControlSection(t(\"inspectedVehicles\"), doneVehicles, selectedDate, \"priority\");",
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
    .replaceAll("?v=54", `?v=${FRONTEND_VERSION}`);
}

await fs.mkdir(runtimeDir, { recursive: true });
await Promise.all([
  fs.writeFile(runtimeAdminHtmlPath, patchAdminHtml(await fs.readFile(path.join(process.cwd(), "admin.html"), "utf8"))),
  fs.writeFile(runtimeAdminJsPath, patchAdminJs(await fs.readFile(path.join(process.cwd(), "admin.js"), "utf8"))),
  fs.writeFile(runtimeServiceWorkerPath, patchServiceWorker(await fs.readFile(path.join(process.cwd(), "service-worker.js"), "utf8"))),
  fs.writeFile(runtimePath, source),
]);

await import(pathToFileURL(runtimePath).href);
