(() => {
  const pageCopy = {
    overview: {
      eyebrow: "OPERACION EN TIEMPO REAL",
      title: "Centro de operaciones",
      subtitle: "Inspecciones de hoy, actividad por site y estado de los servicios.",
    },
    inspections: {
      eyebrow: "CONTROL DE INSPECCIONES",
      title: "Inspecciones y vehiculos",
      subtitle: "Consulta el trabajo diario y el historial completo de cada matricula.",
    },
    alerts: {
      eyebrow: "REVISION PRIORITARIA",
      title: "Alertas de inteligencia artificial",
      subtitle: "Inspecciones pendientes, fallidas o con posibles danos.",
    },
    fleet: {
      eyebrow: "CONFIGURACION DE DRIVER",
      title: "Flota disponible",
      subtitle: "Administra las matriculas que aparecen en la aplicacion del conductor.",
    },
    users: {
      eyebrow: "ACCESOS Y PERMISOS",
      title: "Equipo de operaciones",
      subtitle: "Gestiona cuentas, funciones y permisos de acceso.",
    },
    reports: {
      eyebrow: "ARCHIVO OPERATIVO",
      title: "Reportes y exportaciones",
      subtitle: "Localiza reportes, genera archivos y cierra la operacion diaria.",
    },
    system: {
      eyebrow: "SERVICIOS Y AUDITORIA",
      title: "Estado del sistema",
      subtitle: "Supervisa sincronizacion, actividad reciente y salud de los servicios.",
    },
  };

  const panelFor = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    return node.matches(".dashboard-widget") ? node : node.closest(".dashboard-widget");
  };

  const makeModule = (view, label, title, description) => {
    const section = document.createElement("section");
    section.className = `ops-module ops-module-${view}`;
    section.dataset.adminView = view;
    section.innerHTML = `
      <header class="ops-module-heading">
        <div>
          <p>${label}</p>
          <h3>${title}</h3>
          <span>${description}</span>
        </div>
      </header>
      <div class="ops-module-content"></div>`;
    return section;
  };

  const appendPanel = (container, panel, className = "") => {
    if (!container || !panel) return;
    panel.classList.add("ops-panel");
    if (className) panel.classList.add(className);
    const order = {
      "ops-panel-primary": "1",
      "ops-panel-history": "2",
      "ops-panel-coverage": "3",
    }[className];
    if (order) {
      panel.style.setProperty("order", order, "important");
      panel.style.setProperty("grid-column", "1 / -1", "important");
    }
    container.appendChild(panel);
  };

  const buildOverview = (dashboardContent) => {
    const controlRoom = document.querySelector(".control-room-strip");
    const siteOverview = document.querySelector("#siteOverview");
    const metrics = document.querySelector(".metrics");
    if (!controlRoom || !siteOverview || !metrics) return;

    const overview = document.createElement("section");
    overview.className = "ops-overview";
    overview.dataset.adminView = "overview";
    overview.innerHTML = `
      <div class="ops-overview-head">
        <div>
          <p>HOY</p>
          <h3>Actividad de la flota</h3>
          <span>Informacion recibida desde la app Driver.</span>
        </div>
        <span class="ops-live-label"><i></i> Actualizacion en vivo</span>
      </div>
      <div class="ops-workspace-grid">
        <section class="ops-sites-column">
          <header><strong>Inspecciones por site</strong><span>Vehiculos procesados hoy</span></header>
        </section>
        <aside class="ops-day-column">
          <header><strong>Estado del dia</strong><span>Resumen operativo</span></header>
        </aside>
      </div>
      <section class="ops-totals-band">
        <header><strong>Totales del periodo</strong><span>Segun los filtros seleccionados</span></header>
      </section>`;

    overview.querySelector(".ops-sites-column").appendChild(siteOverview);
    overview.querySelector(".ops-day-column").appendChild(controlRoom);
    overview.querySelector(".ops-totals-band").appendChild(metrics);
    dashboardContent.appendChild(overview);
  };

  const buildModules = (dashboardContent) => {
    const inspections = makeModule(
      "inspections",
      "REGISTRO OPERATIVO",
      "Inspecciones",
      "Busca una matricula, revisa el trabajo diario y abre su historial completo."
    );
    const inspectionsContent = inspections.querySelector(".ops-module-content");
    appendPanel(inspectionsContent, panelFor("#dailyVehicleControl"), "ops-panel-primary");
    appendPanel(inspectionsContent, panelFor("#vehicleHistoryList"), "ops-panel-history");
    appendPanel(inspectionsContent, panelFor("#vehicleSummary"), "ops-panel-coverage");
    dashboardContent.appendChild(inspections);

    const alerts = makeModule(
      "alerts",
      "COLA DE REVISION",
      "Alertas IA",
      "Prioriza inspecciones pendientes, fallidas o con posibles incidencias."
    );
    const alertsContent = alerts.querySelector(".ops-module-content");
    appendPanel(alertsContent, panelFor("#alertList"), "ops-panel-primary");
    appendPanel(alertsContent, panelFor("#aiStatusSummary"), "ops-panel-side");
    dashboardContent.appendChild(alerts);

    const fleet = makeModule(
      "fleet",
      "FLOTA DE CONDUCTORES",
      "Vehiculos disponibles",
      "Esta lista se sincroniza directamente con el selector de la app Driver."
    );
    appendPanel(fleet.querySelector(".ops-module-content"), document.querySelector("#fleetVehicleManagement"), "ops-panel-primary");
    dashboardContent.appendChild(fleet);

    const users = makeModule(
      "users",
      "CONTROL DE ACCESO",
      "Usuarios y permisos",
      "El propietario puede asignar funciones y limitar el acceso de cada cuenta."
    );
    appendPanel(users.querySelector(".ops-module-content"), document.querySelector("#userManagement"), "ops-panel-primary");
    dashboardContent.appendChild(users);

    const reports = makeModule(
      "reports",
      "DOCUMENTACION",
      "Reportes guardados",
      "Consulta documentos, exporta datos o prepara el cierre del dia."
    );
    appendPanel(reports.querySelector(".ops-module-content"), panelFor("#reportList"), "ops-panel-primary");
    dashboardContent.appendChild(reports);

    const system = makeModule(
      "system",
      "CENTRO TECNICO",
      "Servicios y actividad",
      "Estado de la plataforma, sincronizacion y trazabilidad de acciones."
    );
    const systemContent = system.querySelector(".ops-module-content");
    appendPanel(systemContent, panelFor("#systemStatus"), "ops-panel-service");
    appendPanel(systemContent, panelFor("#driverSummary"), "ops-panel-service");
    appendPanel(systemContent, panelFor("#recentActivity"), "ops-panel-activity");
    appendPanel(systemContent, document.querySelector("#auditWidget"), "ops-panel-activity");
    dashboardContent.appendChild(system);
  };

  const restructureFleet = () => {
    const fleet = document.querySelector("#fleetVehicleManagement");
    const tools = fleet?.querySelector(".fleet-vehicle-tools");
    const status = fleet?.querySelector(".fleet-vehicle-statusbar");
    const total = fleet?.querySelector(".fleet-vehicle-total");
    const note = fleet?.querySelector(".fleet-vehicle-note");
    const head = fleet?.querySelector(".fleet-vehicle-list-head");
    const list = fleet?.querySelector("#fleetVehicleList");
    if (!fleet || !tools || !list || fleet.querySelector(".ops-fleet-layout")) return;

    const layout = document.createElement("div");
    layout.className = "ops-fleet-layout";
    layout.innerHTML = `
      <aside class="ops-fleet-editor">
        <p>MODIFICAR FLOTA</p>
        <h4>Anadir vehiculo</h4>
        <span>Selecciona el site e introduce la matricula.</span>
      </aside>
      <section class="ops-fleet-directory">
        <header><div><p>DIRECTORIO</p><h4>Matriculas activas</h4></div></header>
      </section>`;
    const editor = layout.querySelector(".ops-fleet-editor");
    const directory = layout.querySelector(".ops-fleet-directory");
    editor.appendChild(tools);
    if (note) editor.appendChild(note);
    if (total) directory.querySelector("header").appendChild(total);
    if (status) directory.querySelector("header").appendChild(status);
    if (head) directory.appendChild(head);
    directory.appendChild(list);
    fleet.appendChild(layout);
  };

  const enhanceNavigation = () => {
    const sidebar = document.querySelector(".fleet-sidebar");
    const logo = document.querySelector(".fleet-logo");
    if (!sidebar || !logo || sidebar.querySelector(".ops-sidebar-caption")) return;

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "ops-mobile-backdrop";
    backdrop.setAttribute("aria-label", "Cerrar menu");
    backdrop.addEventListener("click", () => document.body.classList.remove("admin-sidebar-open"));
    document.querySelector(".admin-shell")?.appendChild(backdrop);
    const caption = document.createElement("div");
    caption.className = "ops-sidebar-caption";
    caption.innerHTML = "<strong>FleetInspect</strong><span>Control Center</span>";
    logo.appendChild(caption);

    const footer = document.createElement("footer");
    footer.className = "ops-sidebar-footer";
    footer.innerHTML = '<span class="ops-footer-dot"></span><div><strong>9Bar Solutions</strong><small>DRP3 + DSU1</small></div>';
    sidebar.appendChild(footer);

    const formatNavigation = () => {
      sidebar.querySelectorAll(".fleet-nav a").forEach((link) => {
        const icon = link.querySelector(":scope > span");
        const label = link.querySelector(":scope > b");
        const detail = link.querySelector(":scope > small");
        link.style.setProperty("justify-content", "stretch", "important");
        link.style.setProperty("justify-items", "stretch", "important");
        icon?.style.setProperty("grid-column", "1", "important");
        icon?.style.setProperty("grid-row", "1 / 3", "important");
        [label, detail].forEach((node, index) => {
          node?.style.setProperty("grid-column", "2", "important");
          node?.style.setProperty("grid-row", String(index + 1), "important");
          node?.style.setProperty("padding", "0", "important");
          node?.style.setProperty("margin", "0", "important");
          node?.style.setProperty("background", "transparent", "important");
          node?.style.setProperty("border", "0", "important");
          node?.style.setProperty("border-radius", "0", "important");
          node?.style.setProperty("position", "static", "important");
          node?.style.setProperty("inset", "auto", "important");
          node?.style.setProperty("width", "auto", "important");
          node?.style.setProperty("max-width", "none", "important");
          node?.style.setProperty("justify-self", "stretch", "important");
          node?.style.setProperty("text-align", "left", "important");
        });
      });
    };
    formatNavigation();
    new MutationObserver(formatNavigation).observe(sidebar.querySelector(".fleet-nav"), { childList: true, subtree: true });
    window.setTimeout(formatNavigation, 100);
    window.setTimeout(formatNavigation, 500);
  };

  const cleanTopbar = () => {
    ["lastSync", "userManagementTopLink", "systemHealthPill"].forEach((id) => {
      document.querySelector(`#${id}`)?.style.setProperty("display", "none", "important");
    });
    const search = document.querySelector(".global-search");
    search?.style.removeProperty("width");
    search?.style.removeProperty("flex");
    document.querySelector(".topbar-left")?.style.removeProperty("flex");
    document.querySelector(".topbar-actions")?.style.removeProperty("flex");
  };

  const syncPageHeading = () => {
    const view = document.body.dataset.adminView || "overview";
    const copy = pageCopy[view] || pageCopy.overview;
    const title = document.querySelector(".admin-command-header h2");
    const eyebrow = document.querySelector(".admin-command-header .eyebrow");
    let subtitle = document.querySelector(".admin-command-subtitle");
    if (!subtitle && title) {
      subtitle = document.createElement("span");
      subtitle.className = "admin-command-subtitle";
      title.parentElement.appendChild(subtitle);
    }
    if (eyebrow) eyebrow.textContent = copy.eyebrow;
    if (title) title.textContent = copy.title;
    if (subtitle) subtitle.textContent = copy.subtitle;
  };

  const applyCurrentView = () => {
    const requested = location.hash.replace("#", "") || localStorage.getItem("fleetinspect_admin_view") || "overview";
    const link = document.querySelector(`[data-admin-view-target="${requested}"]`) || document.querySelector('[data-admin-view-target="overview"]');
    link?.click();
    syncPageHeading();
  };

  const initialize = () => {
    const dashboardContent = document.querySelector("#dashboardContent");
    if (!dashboardContent || dashboardContent.dataset.opsReady === "true") return;
    dashboardContent.dataset.opsReady = "true";
    document.body.classList.add("admin-ops-v100");

    enhanceNavigation();
    cleanTopbar();
    buildOverview(dashboardContent);
    buildModules(dashboardContent);
    restructureFleet();
    document.querySelector(".dashboard-card-grid")?.classList.add("ops-source-grid");
    document.querySelector("#operationsBoard")?.classList.add("ops-source-grid");

    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-admin-view-target], #userManagementTopLink")) return;
      window.setTimeout(syncPageHeading, 0);
    });
    window.addEventListener("hashchange", syncPageHeading);
    applyCurrentView();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
