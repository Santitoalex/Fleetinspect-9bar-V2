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

const fleetVehicleRenderer = [
  "function renderFleetVehicles() {",
  "  if (!nodes.fleetVehicleList) return;",
  "  const query = normalizePlate(nodes.fleetVehicleSearch?.value || \"\");",
  "  const vehicles = fleetVehicles",
  "    .map((vehicle) => ({",
  "      plate: normalizeFleetVehiclePlate(vehicle.plate || vehicle),",
  "      site: normalizeSite(vehicle.site || \"all\"),",
  "      active: vehicle.active !== false,",
  "    }))",
  "    .filter((vehicle) => vehicle.plate && vehicle.active)",
  "    .filter((vehicle) => !query || normalizePlate(vehicle.plate).includes(query))",
  "    .sort((a, b) => a.plate.localeCompare(b.plate));",
  "",
  "  const activeTotal = fleetVehicles.filter((vehicle) => (vehicle.active !== false) && normalizeFleetVehiclePlate(vehicle.plate || vehicle)).length;",
  "  if (nodes.fleetVehicleCount) nodes.fleetVehicleCount.textContent = String(query ? vehicles.length : activeTotal);",
  "",
  "  if (!vehicles.length) {",
  "    nodes.fleetVehicleList.innerHTML = `<article class=\"empty-state\">No hay vehículos para este filtro.</article>`;",
  "    return;",
  "  }",
  "",
  "  const canEdit = canEditOperations();",
  "  nodes.fleetVehicleList.innerHTML = vehicles.map((vehicle) => `",
  "    <article class=\"fleet-vehicle-row\">",
  "      <div>",
  "        <strong>${escapeHtml(vehicle.plate)}</strong>",
  "        <span>${escapeHtml(vehicle.site === \"all\" ? \"DRP3 + DSU1\" : siteLabel(vehicle.site))}</span>",
  "      </div>",
  "      <button type=\"button\" data-remove-fleet-vehicle=\"${escapeHtml(vehicle.plate)}\" ${canEdit ? \"\" : \"disabled\"}>Quitar</button>",
  "    </article>",
  "  `).join(\"\");",
  "}",
].join("\n");

adminJs = adminJs.replace(
  /function renderFleetVehicles\(\) \{[\s\S]*?\n\}\n\nasync function addFleetVehicle/,
  `${fleetVehicleRenderer}\n\nasync function addFleetVehicle`
);

adminJs = adminJs.replace(
  /    renderFleetVehicles\(\);\n  \} catch \(error\) \{/,
  "    renderFleetVehicles();\n    renderDailyVehicleControl();\n  } catch (error) {"
);

const fleetVehicleActionHandler = [
  "async function handleFleetVehicleAction(event) {",
  "  const button = event.target.closest(\"[data-remove-fleet-vehicle]\");",
  "  if (!button) return;",
  "  if (!canEditOperations()) {",
  "    alert(t(\"readonlyMode\"));",
  "    return;",
  "  }",
  "",
  "  const plate = button.dataset.removeFleetVehicle;",
  "  if (!confirm(`Quitar ${plate} de la app del conductor?`)) return;",
  "",
  "  button.disabled = true;",
  "  try {",
  "    const response = await fetch(`/api/admin/vehicles/${encodeURIComponent(plate)}`, { method: \"DELETE\" });",
  "    const result = await response.json();",
  "    if (!response.ok || result.ok === false) throw new Error(result.error || \"No se pudo quitar el vehiculo.\");",
  "    fleetVehicles = result.vehicles || [];",
  "    renderFleetVehicles();",
  "    renderDailyVehicleControl();",
  "  } catch (error) {",
  "    alert(error.message || \"No se pudo quitar el vehiculo.\");",
  "    button.disabled = false;",
  "  }",
  "}",
].join("\n");

adminJs = adminJs.replace(
  /async function handleFleetVehicleAction\(event\) \{[\s\S]*?\n\}\n\nfunction normalizeFleetVehiclePlate/,
  `${fleetVehicleActionHandler}\n\nfunction normalizeFleetVehiclePlate`
);
await fs.writeFile(adminPath, adminJs);

let adminHtml = await fs.readFile(adminHtmlPath, "utf8");
const cleanNavHtml = `    <nav class="fleet-nav" aria-label="Admin navigation">
     <section class="nav-group">
      <p>Operación</p>
      <a class="active" href="/admin" title="Dashboard"><span>▦</span><b data-i18n="dashboard">Dashboard</b><small>Resumen diario</small></a>
      <a href="#siteOverview" title="Sites"><span>◇</span><b>Sites</b><small>DRP3 / DSU1</small></a>
      <a href="#dailyVehicleControl" title="Historial"><span>◫</span><b>Historial</b><small>Vehículos inspeccionados</small></a>
     </section>
     <section class="nav-group">
      <p>Gestión</p>
      <a href="#fleetVehicleManagement" title="Flota driver"><span>▤</span><b>Flota driver</b><small>Añadir o quitar</small></a>
      <a href="#vehicleSummary" title="Vehículos"><span>◉</span><b data-i18n="vehicles">Vehículos</b><small>Por matrícula</small></a>
      <a id="userManagementNav" class="hidden" href="#userManagement" title="Usuarios"><span>◎</span><b data-i18n="userManagement">Usuarios</b><small>Roles y permisos</small></a>
     </section>
     <section class="nav-group">
      <p>Reportes</p>
      <a href="#alertList" title="IA"><span>△</span><b data-i18n="aiAlerts">Alertas IA</b><small>Prioridad</small></a>
      <a href="#reportList" title="Reportes"><span>▧</span><b data-i18n="reports">Reportes</b><small>PDF y exportación</small></a>
     </section>
    </nav>`;

const fleetVehicleManagementHtml = `        <article id="fleetVehicleManagement" class="dashboard-widget wide-widget fleet-vehicle-widget">
         <header>
          <div>
           <h3>Gestión de flota driver</h3>
           <span>Lista real de matrículas visibles en la app del conductor.</span>
          </div>
          <div class="fleet-vehicle-total">
           <small>Activos</small>
           <strong id="fleetVehicleCount">0</strong>
          </div>
         </header>
         <div class="fleet-vehicle-tools">
          <label>
           <span>Site para nuevo vehículo</span>
           <select id="fleetVehicleSite">
            <option value="all">DRP3 + DSU1</option>
            <option value="DRP3">DRP3</option>
            <option value="DSU1">DSU1</option>
           </select>
          </label>
          <label>
           <span>Matrícula</span>
           <input id="fleetVehiclePlate" type="text" placeholder="M AZ 1003" autocomplete="off" />
          </label>
          <button id="addFleetVehicle" type="button">Añadir</button>
          <label>
           <span>Buscar</span>
           <input id="fleetVehicleSearch" type="search" placeholder="Buscar matrícula" autocomplete="off" />
          </label>
         </div>
         <p class="fleet-vehicle-note">Los cambios se guardan en Supabase y se reflejan en el selector de vehículos del driver.</p>
         <div id="fleetVehicleList" class="fleet-vehicle-list"></div>
        </article>`;

adminHtml = adminHtml.replace(
  /        <article id="fleetVehicleManagement"[\s\S]*?\n        <\/article>\n\n        <article class="dashboard-widget status-widget">/,
  `${fleetVehicleManagementHtml}\n\n        <article class="dashboard-widget status-widget">`
);

adminHtml = adminHtml.replace(
  /    <nav class="fleet-nav" aria-label="Admin navigation">[\s\S]*?\n    <\/nav>/,
  cleanNavHtml
);

const sidebarScript = `  <script id="admin-sidebar-toggle">
   (() => {
    const applySidebarState = () => {
     const isOpen = localStorage.getItem("fleetinspect_admin_sidebar") === "open";
     document.body.classList.toggle("admin-sidebar-open", isOpen);
     document.querySelector(".menu-button")?.setAttribute("aria-expanded", String(isOpen));
    };

    applySidebarState();

    document.addEventListener("click", (event) => {
     const menuButton = event.target.closest(".menu-button");
     if (!menuButton) return;
     const nextOpen = !document.body.classList.contains("admin-sidebar-open");
     document.body.classList.toggle("admin-sidebar-open", nextOpen);
     localStorage.setItem("fleetinspect_admin_sidebar", nextOpen ? "open" : "closed");
     menuButton.setAttribute("aria-expanded", String(nextOpen));
    });
   })();
  </script>`;

if (!adminHtml.includes('id="admin-sidebar-toggle"')) {
  adminHtml = adminHtml.replace("\n  <script src=\"/vehicles.js", `\n${sidebarScript}\n  <script src="/vehicles.js`);
}

const cleanCss = `
  <style id="admin-clean-v77-styles">
   .admin-body.admin-clean-v77 { --v77-bg:#eef3f8; --v77-panel:#fff; --v77-soft:#f7fafc; --v77-line:#d9e4ef; --v77-text:#0f172a; --v77-muted:#64748b; --v77-navy:#061420; --v77-blue:#0b4f8a; --v77-orange:#f39200; background:var(--v77-bg)!important; color:var(--v77-text)!important; font-size:12px!important; }
   .admin-body.admin-clean-v77 .admin-shell { grid-template-columns:58px minmax(0,1fr)!important; transition:grid-template-columns .18s ease!important; }
   .admin-body.admin-clean-v77.admin-sidebar-open .admin-shell { grid-template-columns:232px minmax(0,1fr)!important; }
   .admin-body.admin-clean-v77 .fleet-sidebar { position:sticky!important; top:0!important; align-self:start!important; width:auto!important; min-height:100vh!important; padding:10px 8px!important; background:var(--v77-navy)!important; border-right:1px solid #10283b!important; overflow:hidden!important; }
   .admin-body.admin-clean-v77 .fleet-logo { display:grid!important; grid-template-columns:36px minmax(0,1fr)!important; align-items:center!important; gap:10px!important; min-height:42px!important; margin:0 0 12px!important; padding:4px!important; border-radius:12px!important; background:rgba(255,255,255,.05)!important; }
   .admin-body.admin-clean-v77 .fleet-logo img { width:32px!important; height:32px!important; object-fit:contain!important; background:#fff!important; border-radius:8px!important; padding:3px!important; }
   .admin-body.admin-clean-v77 .fleet-logo p { display:block!important; overflow:hidden!important; max-width:0!important; margin:0!important; color:#fff!important; font-size:12px!important; font-weight:900!important; white-space:nowrap!important; opacity:0!important; transition:max-width .18s ease, opacity .18s ease!important; }
   .admin-body.admin-clean-v77.admin-sidebar-open .fleet-logo p { max-width:160px!important; opacity:1!important; }
   .admin-body.admin-clean-v77 .fleet-nav { display:grid!important; gap:12px!important; margin:0!important; }
   .admin-body.admin-clean-v77 .nav-group { display:grid!important; gap:5px!important; padding:0 0 10px!important; border-bottom:1px solid rgba(255,255,255,.08)!important; }
   .admin-body.admin-clean-v77 .nav-group:last-child { border-bottom:0!important; }
   .admin-body.admin-clean-v77 .nav-group p { overflow:hidden!important; max-width:0!important; margin:0 0 2px 48px!important; color:#7f93a8!important; font-size:9px!important; font-weight:900!important; letter-spacing:.08em!important; text-transform:uppercase!important; white-space:nowrap!important; opacity:0!important; }
   .admin-body.admin-clean-v77.admin-sidebar-open .nav-group p { max-width:140px!important; opacity:1!important; }
   .admin-body.admin-clean-v77 .fleet-nav a { position:relative!important; display:grid!important; grid-template-columns:36px minmax(0,1fr)!important; grid-template-rows:auto auto!important; align-items:center!important; column-gap:10px!important; width:auto!important; min-height:38px!important; padding:3px!important; border-radius:12px!important; color:#b8c7d8!important; text-decoration:none!important; border:1px solid transparent!important; background:transparent!important; }
   .admin-body.admin-clean-v77 .fleet-nav a span { display:grid!important; grid-row:1 / span 2!important; place-items:center!important; width:36px!important; height:32px!important; border-radius:10px!important; background:rgba(255,255,255,.07)!important; color:#d8e4ef!important; font-size:15px!important; }
   .admin-body.admin-clean-v77 .fleet-nav a b,
   .admin-body.admin-clean-v77 .fleet-nav a small { overflow:hidden!important; max-width:0!important; opacity:0!important; white-space:nowrap!important; text-overflow:ellipsis!important; transition:max-width .18s ease, opacity .18s ease!important; }
   .admin-body.admin-clean-v77 .fleet-nav a b { color:#fff!important; font-size:12px!important; font-weight:900!important; line-height:1.1!important; }
   .admin-body.admin-clean-v77 .fleet-nav a small { color:#8aa1b8!important; font-size:10px!important; font-weight:700!important; line-height:1.1!important; }
   .admin-body.admin-clean-v77.admin-sidebar-open .fleet-nav a b,
   .admin-body.admin-clean-v77.admin-sidebar-open .fleet-nav a small { max-width:150px!important; opacity:1!important; }
   .admin-body.admin-clean-v77 .fleet-nav a:hover,
   .admin-body.admin-clean-v77 .fleet-nav a.active { background:#10243a!important; border-color:rgba(255,255,255,.11)!important; color:#fff!important; }
   .admin-body.admin-clean-v77 .fleet-nav a.active span { background:rgba(243,146,0,.14)!important; color:var(--v77-orange)!important; box-shadow:inset 0 0 0 1px rgba(243,146,0,.55)!important; }
   .admin-body.admin-clean-v77 .fleet-topbar { min-height:44px!important; padding:5px 10px!important; }
   .admin-body.admin-clean-v77 .menu-button { width:34px!important; height:34px!important; border-radius:10px!important; border:1px solid var(--v77-line)!important; background:#fff!important; color:#123c69!important; font-weight:900!important; }
   .admin-body.admin-clean-v77 .topbar-company-logo { width:68px!important; height:28px!important; }
   .admin-body.admin-clean-v77 .global-search { width:min(390px,34vw)!important; min-height:32px!important; border-radius:8px!important; }
   .admin-body.admin-clean-v77 .sync-chip,
   .admin-body.admin-clean-v77 .user-chip,
   .admin-body.admin-clean-v77 .role-chip,
   .admin-body.admin-clean-v77 .language-select,
   .admin-body.admin-clean-v77 .icon-button,
   .admin-body.admin-clean-v77 .user-admin-link { min-height:30px!important; padding:5px 8px!important; border-radius:8px!important; font-size:11px!important; }
   .admin-body.admin-clean-v77 .dashboard-main { max-width:none!important; padding:10px 12px 20px!important; gap:10px!important; }
   .admin-body.admin-clean-v77 .admin-hero { display:none!important; }
   .admin-body.admin-clean-v77 .hero-dashboard { border-radius:12px!important; border:1px solid var(--v77-line)!important; background:#fff!important; overflow:hidden!important; box-shadow:0 12px 32px rgba(15,23,42,.05)!important; }
   .admin-body.admin-clean-v77 .dashboard-header { min-height:42px!important; padding:8px 10px!important; }
   .admin-body.admin-clean-v77 .dashboard-header h2 { font-size:18px!important; }
   .admin-body.admin-clean-v77 #dashboardContent { display:grid!important; grid-template-columns:1fr!important; gap:10px!important; padding:10px!important; background:#f8fbff!important; }
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
   .admin-body.admin-clean-v77 .site-overview-grid { display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; gap:10px!important; margin:0!important; }
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
   .admin-body.admin-clean-v77 .dashboard-card-grid { display:grid!important; grid-template-columns:minmax(320px,.72fr) minmax(560px,1.28fr)!important; gap:10px!important; align-items:start!important; }
   .admin-body.admin-clean-v77 .dashboard-widget { overflow:hidden!important; }
   .admin-body.admin-clean-v77 .dashboard-widget > header { min-height:42px!important; padding:9px 11px!important; background:linear-gradient(180deg,#fff,#f8fbff)!important; border-bottom:1px solid #e5edf5!important; }
   .admin-body.admin-clean-v77 .dashboard-widget h3 { font-size:15px!important; line-height:1.05!important; }
   .admin-body.admin-clean-v77 .dashboard-widget header span { color:var(--v77-muted)!important; font-size:10px!important; font-weight:800!important; text-transform:uppercase!important; }
   .admin-body.admin-clean-v77 .primary-widget { border-top:3px solid #e23b2e!important; }
   .admin-body.admin-clean-v77 .vehicle-control-widget { border-top:3px solid #123c69!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-widget { border-top:3px solid var(--v77-orange)!important; }
   .admin-body.admin-clean-v77 .user-management-widget { border-top:3px solid #7c3aed!important; }
   .admin-body.admin-clean-v77 .status-widget { border-top:3px solid #16877f!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-widget { order:0!important; grid-column:1 / -1!important; overflow:hidden!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-widget > header { min-height:42px!important; padding:8px 10px!important; border-bottom:1px solid var(--v77-line)!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-widget h3 { font-size:17px!important; line-height:1.05!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-total { display:grid!important; justify-items:end!important; gap:1px!important; min-width:74px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-total small { color:var(--v77-muted)!important; font-size:9px!important; text-transform:uppercase!important; font-weight:800!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-total strong { color:#0b2447!important; font-size:24px!important; line-height:1!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools { display:grid!important; grid-template-columns:170px 190px 94px minmax(220px,1fr)!important; align-items:end!important; gap:7px!important; margin:0!important; padding:8px 10px!important; border-bottom:1px solid #edf2f7!important; background:#f8fbff!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools label { display:grid!important; gap:3px!important; margin:0!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools span { color:var(--v77-muted)!important; font-size:9px!important; text-transform:uppercase!important; font-weight:900!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools input,
   .admin-body.admin-clean-v77 .fleet-vehicle-tools select,
   .admin-body.admin-clean-v77 .fleet-vehicle-tools button { width:100%!important; min-height:30px!important; border-radius:7px!important; font-size:12px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-tools button { background:#0b4f8a!important; border-color:#0b4f8a!important; color:#fff!important; font-weight:900!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-note { margin:0!important; padding:6px 10px!important; border-bottom:1px solid #edf2f7!important; color:var(--v77-muted)!important; font-size:11px!important; font-weight:700!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-list { display:grid!important; grid-template-columns:repeat(auto-fill,minmax(190px,1fr))!important; max-height:236px!important; overflow:auto!important; gap:4px!important; padding:8px 10px 10px!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row { display:grid!important; grid-template-columns:minmax(0,1fr) 62px!important; align-items:center!important; min-height:34px!important; gap:6px!important; padding:4px 5px 4px 8px!important; border:1px solid #e5edf5!important; border-radius:7px!important; background:#fff!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row div { min-width:0!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row strong,
   .admin-body.admin-clean-v77 .fleet-vehicle-row span { display:block!important; overflow:hidden!important; text-overflow:ellipsis!important; white-space:nowrap!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row strong { color:#0f172a!important; font-size:12px!important; font-weight:900!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row span { color:var(--v77-muted)!important; font-size:10px!important; font-weight:700!important; }
   .admin-body.admin-clean-v77 .fleet-vehicle-row button { min-height:25px!important; padding:0 7px!important; border-radius:6px!important; border:1px solid #fecaca!important; background:#fff7f7!important; color:#b42318!important; font-size:10px!important; font-weight:900!important; }
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
    .admin-body.admin-clean-v77 .fleet-sidebar { position:relative!important; min-height:auto!important; }
    .admin-body.admin-clean-v77 .fleet-nav { grid-template-columns:repeat(4,minmax(0,1fr))!important; }
    .admin-body.admin-clean-v77 .nav-group { border-bottom:0!important; padding:0!important; }
    .admin-body.admin-clean-v77 .nav-group p,
    .admin-body.admin-clean-v77 .fleet-logo p,
    .admin-body.admin-clean-v77 .fleet-nav a b,
    .admin-body.admin-clean-v77 .fleet-nav a small { display:none!important; }
   }
  </style>
`;

if (adminHtml.includes('id="admin-clean-v77-styles"')) {
  adminHtml = adminHtml.replace(/  <style id="admin-clean-v77-styles">[\s\S]*?<\/style>/, cleanCss.trimEnd());
} else {
  adminHtml = adminHtml.replace("\n </head>", `${cleanCss}\n </head>`);
}

adminHtml = adminHtml.replace(/<body class="([^"]*)"/, (_match, className) => {
  return className.includes("admin-clean-v77") ? `<body class="${className}"` : `<body class="${className} admin-clean-v77"`;
});

adminHtml = adminHtml
  .replaceAll("/styles.css?v=54", "/styles.css?v=77")
  .replaceAll("/styles.css?v=75", "/styles.css?v=77")
  .replaceAll("/styles.css?v=77", "/styles.css?v=78")
  .replaceAll("/styles.css?v=78", "/styles.css?v=79")
  .replaceAll("/vehicles.js?v=54", "/vehicles.js?v=77")
  .replaceAll("/vehicles.js?v=75", "/vehicles.js?v=77")
  .replaceAll("/vehicles.js?v=77", "/vehicles.js?v=78")
  .replaceAll("/vehicles.js?v=78", "/vehicles.js?v=79")
  .replaceAll("/i18n.js?v=54", "/i18n.js?v=77")
  .replaceAll("/i18n.js?v=75", "/i18n.js?v=77")
  .replaceAll("/i18n.js?v=77", "/i18n.js?v=78")
  .replaceAll("/i18n.js?v=78", "/i18n.js?v=79")
  .replaceAll("/admin.js?v=54", "/admin.js?v=77")
  .replaceAll("/admin.js?v=75", "/admin.js?v=77")
  .replaceAll("/admin.js?v=77", "/admin.js?v=78");
adminHtml = adminHtml.replaceAll("/admin.js?v=78", "/admin.js?v=79");

await fs.writeFile(adminHtmlPath, adminHtml);
