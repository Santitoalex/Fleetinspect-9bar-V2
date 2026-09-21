import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const adminPath = path.join(root, "admin.js");
const adminHtmlPath = path.join(root, "admin.html");

await import(pathToFileURL(path.join(root, "server-speed-v75.js")).href);

let adminJs = await fs.readFile(adminPath, "utf8");
const siteOverviewRenderer = [
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
  `${siteOverviewRenderer}\n\nfunction renderOperationsBoard`
);
await fs.writeFile(adminPath, adminJs);

let adminHtml = await fs.readFile(adminHtmlPath, "utf8");
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
   .admin-body.admin-clean-v77 .site-overview-panel { border:1px solid var(--v77-line)!important; border-radius:8px!important; box-shadow:none!important; background:var(--v77-panel)!important; }
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

if (!adminHtml.includes("admin-clean-v77-styles")) {
  adminHtml = adminHtml.replace("\n </head>", `${cleanCss}\n </head>`);
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
