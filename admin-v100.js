(() => {
  const translations = {
    es: {
      closeMenu: "Cerrar menú",
      controlCenter: "Centro de control",
      navOperation: "Operación",
      navManagement: "Gestión",
      navAdministration: "Administración",
      navOverview: "Resumen",
      navOverviewDetail: "Actividad de hoy",
      navInspections: "Inspecciones",
      navInspectionsDetail: "Control e historial",
      navAlerts: "Alertas IA",
      navAlertsDetail: "Revisión prioritaria",
      navFleet: "Flota Driver",
      navFleetDetail: "Añadir o quitar",
      navUsers: "Usuarios",
      navUsersDetail: "Roles y permisos",
      navReports: "Reportes",
      navReportsDetail: "PDF y exportación",
      navSystem: "Sistema",
      navSystemDetail: "Estado y actividad",
      pageOverviewEyebrow: "OPERACIÓN EN TIEMPO REAL",
      pageOverviewTitle: "Centro de operaciones",
      pageOverviewSubtitle: "Inspecciones de hoy, actividad por site y estado de los servicios.",
      pageInspectionsEyebrow: "CONTROL DE INSPECCIONES",
      pageInspectionsTitle: "Inspecciones y vehículos",
      pageInspectionsSubtitle: "Consulta el trabajo diario y el historial completo de cada matrícula.",
      pageAlertsEyebrow: "REVISIÓN PRIORITARIA",
      pageAlertsTitle: "Alertas de inteligencia artificial",
      pageAlertsSubtitle: "Inspecciones pendientes, fallidas o con posibles daños.",
      pageFleetEyebrow: "CONFIGURACIÓN DE DRIVER",
      pageFleetTitle: "Flota disponible",
      pageFleetSubtitle: "Administra las matrículas que aparecen en la aplicación del conductor.",
      pageUsersEyebrow: "ACCESOS Y PERMISOS",
      pageUsersTitle: "Equipo de operaciones",
      pageUsersSubtitle: "Gestiona cuentas, funciones y permisos de acceso.",
      pageReportsEyebrow: "ARCHIVO OPERATIVO",
      pageReportsTitle: "Reportes y exportaciones",
      pageReportsSubtitle: "Localiza reportes, genera archivos y cierra la operación diaria.",
      pageSystemEyebrow: "SERVICIOS Y AUDITORÍA",
      pageSystemTitle: "Estado del sistema",
      pageSystemSubtitle: "Supervisa la sincronización, la actividad reciente y la salud de los servicios.",
      today: "HOY",
      fleetActivity: "Actividad de la flota",
      driverData: "Información recibida desde la app Driver.",
      liveUpdate: "Actualización en vivo",
      siteInspections: "Inspecciones por site",
      vehiclesProcessedToday: "Vehículos procesados hoy",
      dayStatus: "Estado del día",
      operationsSummary: "Resumen operativo",
      periodTotals: "Totales del periodo",
      selectedFilters: "Según los filtros seleccionados",
      siteVehicleAlertSummary: "{vehicles} vehículos · {alerts} alertas hoy",
      noInspectionsToday: "Sin inspecciones hoy",
      moduleInspectionsEyebrow: "REGISTRO OPERATIVO",
      moduleInspectionsTitle: "Inspecciones",
      moduleInspectionsDescription: "Busca una matrícula, revisa el trabajo diario y abre su historial completo.",
      moduleAlertsEyebrow: "COLA DE REVISIÓN",
      moduleAlertsTitle: "Alertas IA",
      moduleAlertsDescription: "Prioriza inspecciones pendientes, fallidas o con posibles incidencias.",
      moduleFleetEyebrow: "FLOTA DE CONDUCTORES",
      moduleFleetTitle: "Vehículos disponibles",
      moduleFleetDescription: "Esta lista se sincroniza directamente con el selector de la app Driver.",
      moduleUsersEyebrow: "CONTROL DE ACCESO",
      moduleUsersTitle: "Usuarios y permisos",
      moduleUsersDescription: "El propietario puede asignar funciones y limitar el acceso de cada cuenta.",
      moduleReportsEyebrow: "DOCUMENTACIÓN",
      moduleReportsTitle: "Reportes guardados",
      moduleReportsDescription: "Consulta documentos, exporta datos o prepara el cierre del día.",
      moduleSystemEyebrow: "CENTRO TÉCNICO",
      moduleSystemTitle: "Servicios y actividad",
      moduleSystemDescription: "Estado de la plataforma, sincronización y trazabilidad de acciones.",
      editFleet: "MODIFICAR FLOTA",
      addVehicle: "Añadir vehículo",
      addVehicleDescription: "Selecciona el site e introduce la matrícula.",
      directory: "DIRECTORIO",
      activeRegistrations: "Matrículas activas",
      fleetManagementTitle: "Gestión de flota Driver",
      fleetManagementSubtitle: "Lista real de matrículas visibles en la app del conductor.",
      active: "Activos",
      refreshList: "Actualizar lista",
      siteForVehicle: "Site para nuevo vehículo",
      registration: "Matrícula",
      add: "Añadir",
      search: "Buscar",
      searchRegistration: "Buscar matrícula",
      fleetNote: "Esta es la misma lista que aparece en la app Driver. Añadir o quitar aquí actualiza su selector automáticamente.",
      action: "Acción",
      remove: "Quitar",
      loadingDriverVehicles: "Cargando matrículas de Driver...",
      syncingDriver: "Sincronizando con Driver...",
      syncedDriver: "{count} matrículas visibles en Driver · actualizado {time}",
      fleetLoadError: "No se pudo cargar la flota.",
      fleetSyncError: "No se pudo sincronizar la flota.",
      fleetEmpty: "No hay vehículos para este filtro.",
      invalidRegistration: "Escribe una matrícula válida.",
      addingVehicle: "Añadiendo {plate} a Driver...",
      vehicleSaveError: "No se pudo guardar el vehículo.",
      removeConfirm: "¿Quitar {plate} de la app del conductor?",
      removingVehicle: "Quitando {plate} de Driver...",
      vehicleRemoveError: "No se pudo quitar el vehículo.",
    },
    en: {
      closeMenu: "Close menu",
      controlCenter: "Control Center",
      navOperation: "Operations",
      navManagement: "Management",
      navAdministration: "Administration",
      navOverview: "Overview",
      navOverviewDetail: "Today's activity",
      navInspections: "Inspections",
      navInspectionsDetail: "Control and history",
      navAlerts: "AI alerts",
      navAlertsDetail: "Priority review",
      navFleet: "Driver fleet",
      navFleetDetail: "Add or remove",
      navUsers: "Users",
      navUsersDetail: "Roles and permissions",
      navReports: "Reports",
      navReportsDetail: "PDF and export",
      navSystem: "System",
      navSystemDetail: "Status and activity",
      pageOverviewEyebrow: "REAL-TIME OPERATIONS",
      pageOverviewTitle: "Operations center",
      pageOverviewSubtitle: "Today's inspections, site activity and service status.",
      pageInspectionsEyebrow: "INSPECTION CONTROL",
      pageInspectionsTitle: "Inspections and vehicles",
      pageInspectionsSubtitle: "Review daily work and the complete history of every registration.",
      pageAlertsEyebrow: "PRIORITY REVIEW",
      pageAlertsTitle: "Artificial intelligence alerts",
      pageAlertsSubtitle: "Pending or failed inspections and possible damage.",
      pageFleetEyebrow: "DRIVER CONFIGURATION",
      pageFleetTitle: "Available fleet",
      pageFleetSubtitle: "Manage the registrations shown in the Driver app.",
      pageUsersEyebrow: "ACCESS AND PERMISSIONS",
      pageUsersTitle: "Operations team",
      pageUsersSubtitle: "Manage accounts, roles and access permissions.",
      pageReportsEyebrow: "OPERATIONS ARCHIVE",
      pageReportsTitle: "Reports and exports",
      pageReportsSubtitle: "Find reports, generate files and close the daily operation.",
      pageSystemEyebrow: "SERVICES AND AUDIT",
      pageSystemTitle: "System status",
      pageSystemSubtitle: "Monitor synchronization, recent activity and service health.",
      today: "TODAY",
      fleetActivity: "Fleet activity",
      driverData: "Information received from the Driver app.",
      liveUpdate: "Live update",
      siteInspections: "Inspections by site",
      vehiclesProcessedToday: "Vehicles processed today",
      dayStatus: "Today's status",
      operationsSummary: "Operations summary",
      periodTotals: "Period totals",
      selectedFilters: "Based on the selected filters",
      siteVehicleAlertSummary: "{vehicles} vehicles · {alerts} alerts today",
      noInspectionsToday: "No inspections today",
      moduleInspectionsEyebrow: "OPERATIONS LOG",
      moduleInspectionsTitle: "Inspections",
      moduleInspectionsDescription: "Search a registration, review daily work and open its complete history.",
      moduleAlertsEyebrow: "REVIEW QUEUE",
      moduleAlertsTitle: "AI alerts",
      moduleAlertsDescription: "Prioritize pending or failed inspections and possible incidents.",
      moduleFleetEyebrow: "DRIVER FLEET",
      moduleFleetTitle: "Available vehicles",
      moduleFleetDescription: "This list synchronizes directly with the Driver app selector.",
      moduleUsersEyebrow: "ACCESS CONTROL",
      moduleUsersTitle: "Users and permissions",
      moduleUsersDescription: "The owner can assign roles and limit access for each account.",
      moduleReportsEyebrow: "DOCUMENTATION",
      moduleReportsTitle: "Saved reports",
      moduleReportsDescription: "Review documents, export data or prepare the daily close.",
      moduleSystemEyebrow: "TECHNICAL CENTER",
      moduleSystemTitle: "Services and activity",
      moduleSystemDescription: "Platform status, synchronization and action traceability.",
      editFleet: "EDIT FLEET",
      addVehicle: "Add vehicle",
      addVehicleDescription: "Select the site and enter the registration.",
      directory: "DIRECTORY",
      activeRegistrations: "Active registrations",
      fleetManagementTitle: "Driver fleet management",
      fleetManagementSubtitle: "The actual list of registrations visible in the Driver app.",
      active: "Active",
      refreshList: "Refresh list",
      siteForVehicle: "Site for new vehicle",
      registration: "Registration",
      add: "Add",
      search: "Search",
      searchRegistration: "Search registration",
      fleetNote: "This is the same list shown in the Driver app. Adding or removing a vehicle here updates its selector automatically.",
      action: "Action",
      remove: "Remove",
      loadingDriverVehicles: "Loading Driver registrations...",
      syncingDriver: "Synchronizing with Driver...",
      syncedDriver: "{count} registrations visible in Driver · updated {time}",
      fleetLoadError: "The fleet could not be loaded.",
      fleetSyncError: "The fleet could not be synchronized.",
      fleetEmpty: "No vehicles match this filter.",
      invalidRegistration: "Enter a valid registration.",
      addingVehicle: "Adding {plate} to Driver...",
      vehicleSaveError: "The vehicle could not be saved.",
      removeConfirm: "Remove {plate} from the Driver app?",
      removingVehicle: "Removing {plate} from Driver...",
      vehicleRemoveError: "The vehicle could not be removed.",
    },
    de: {
      closeMenu: "Menü schließen",
      controlCenter: "Kontrollzentrum",
      navOperation: "Betrieb",
      navManagement: "Verwaltung",
      navAdministration: "Administration",
      navOverview: "Übersicht",
      navOverviewDetail: "Heutige Aktivität",
      navInspections: "Inspektionen",
      navInspectionsDetail: "Kontrolle und Verlauf",
      navAlerts: "KI-Warnungen",
      navAlertsDetail: "Prioritätsprüfung",
      navFleet: "Driver-Flotte",
      navFleetDetail: "Hinzufügen oder entfernen",
      navUsers: "Benutzer",
      navUsersDetail: "Rollen und Rechte",
      navReports: "Berichte",
      navReportsDetail: "PDF und Export",
      navSystem: "System",
      navSystemDetail: "Status und Aktivität",
      pageOverviewEyebrow: "ECHTZEITBETRIEB",
      pageOverviewTitle: "Einsatzzentrale",
      pageOverviewSubtitle: "Heutige Inspektionen, Standortaktivität und Dienststatus.",
      pageInspectionsEyebrow: "INSPEKTIONSKONTROLLE",
      pageInspectionsTitle: "Inspektionen und Fahrzeuge",
      pageInspectionsSubtitle: "Tagesarbeit und vollständigen Verlauf jedes Kennzeichens prüfen.",
      pageAlertsEyebrow: "PRIORITÄTSPRÜFUNG",
      pageAlertsTitle: "Warnungen der künstlichen Intelligenz",
      pageAlertsSubtitle: "Ausstehende oder fehlgeschlagene Inspektionen und mögliche Schäden.",
      pageFleetEyebrow: "DRIVER-KONFIGURATION",
      pageFleetTitle: "Verfügbare Flotte",
      pageFleetSubtitle: "Kennzeichen verwalten, die in der Driver-App angezeigt werden.",
      pageUsersEyebrow: "ZUGÄNGE UND BERECHTIGUNGEN",
      pageUsersTitle: "Betriebsteam",
      pageUsersSubtitle: "Konten, Rollen und Zugriffsrechte verwalten.",
      pageReportsEyebrow: "BETRIEBSARCHIV",
      pageReportsTitle: "Berichte und Exporte",
      pageReportsSubtitle: "Berichte finden, Dateien erstellen und den Tagesbetrieb abschließen.",
      pageSystemEyebrow: "DIENSTE UND AUDIT",
      pageSystemTitle: "Systemstatus",
      pageSystemSubtitle: "Synchronisierung, aktuelle Aktivität und Dienstzustand überwachen.",
      today: "HEUTE",
      fleetActivity: "Flottenaktivität",
      driverData: "Informationen aus der Driver-App.",
      liveUpdate: "Live-Aktualisierung",
      siteInspections: "Inspektionen nach Standort",
      vehiclesProcessedToday: "Heute bearbeitete Fahrzeuge",
      dayStatus: "Tagesstatus",
      operationsSummary: "Betriebsübersicht",
      periodTotals: "Summen des Zeitraums",
      selectedFilters: "Gemäß den ausgewählten Filtern",
      siteVehicleAlertSummary: "{vehicles} Fahrzeuge · {alerts} Warnungen heute",
      noInspectionsToday: "Heute keine Inspektionen",
      moduleInspectionsEyebrow: "BETRIEBSPROTOKOLL",
      moduleInspectionsTitle: "Inspektionen",
      moduleInspectionsDescription: "Kennzeichen suchen, Tagesarbeit prüfen und den vollständigen Verlauf öffnen.",
      moduleAlertsEyebrow: "PRÜFWARTESCHLANGE",
      moduleAlertsTitle: "KI-Warnungen",
      moduleAlertsDescription: "Ausstehende oder fehlgeschlagene Inspektionen und mögliche Vorfälle priorisieren.",
      moduleFleetEyebrow: "FAHRERFLOTTE",
      moduleFleetTitle: "Verfügbare Fahrzeuge",
      moduleFleetDescription: "Diese Liste wird direkt mit der Auswahl in der Driver-App synchronisiert.",
      moduleUsersEyebrow: "ZUGRIFFSKONTROLLE",
      moduleUsersTitle: "Benutzer und Berechtigungen",
      moduleUsersDescription: "Der Eigentümer kann Rollen zuweisen und den Zugriff jedes Kontos begrenzen.",
      moduleReportsEyebrow: "DOKUMENTATION",
      moduleReportsTitle: "Gespeicherte Berichte",
      moduleReportsDescription: "Dokumente prüfen, Daten exportieren oder den Tagesabschluss vorbereiten.",
      moduleSystemEyebrow: "TECHNIKZENTRALE",
      moduleSystemTitle: "Dienste und Aktivität",
      moduleSystemDescription: "Plattformstatus, Synchronisierung und Nachverfolgbarkeit von Aktionen.",
      editFleet: "FLOTTE BEARBEITEN",
      addVehicle: "Fahrzeug hinzufügen",
      addVehicleDescription: "Standort auswählen und Kennzeichen eingeben.",
      directory: "VERZEICHNIS",
      activeRegistrations: "Aktive Kennzeichen",
      fleetManagementTitle: "Driver-Flottenverwaltung",
      fleetManagementSubtitle: "Tatsächliche Liste der in der Driver-App sichtbaren Kennzeichen.",
      active: "Aktiv",
      refreshList: "Liste aktualisieren",
      siteForVehicle: "Standort für neues Fahrzeug",
      registration: "Kennzeichen",
      add: "Hinzufügen",
      search: "Suchen",
      searchRegistration: "Kennzeichen suchen",
      fleetNote: "Dies ist dieselbe Liste wie in der Driver-App. Änderungen werden automatisch in der Fahrzeugauswahl übernommen.",
      action: "Aktion",
      remove: "Entfernen",
      loadingDriverVehicles: "Driver-Kennzeichen werden geladen...",
      syncingDriver: "Synchronisierung mit Driver...",
      syncedDriver: "{count} Kennzeichen in Driver sichtbar · aktualisiert {time}",
      fleetLoadError: "Die Flotte konnte nicht geladen werden.",
      fleetSyncError: "Die Flotte konnte nicht synchronisiert werden.",
      fleetEmpty: "Keine Fahrzeuge für diesen Filter.",
      invalidRegistration: "Geben Sie ein gültiges Kennzeichen ein.",
      addingVehicle: "{plate} wird zu Driver hinzugefügt...",
      vehicleSaveError: "Das Fahrzeug konnte nicht gespeichert werden.",
      removeConfirm: "{plate} aus der Driver-App entfernen?",
      removingVehicle: "{plate} wird aus Driver entfernt...",
      vehicleRemoveError: "Das Fahrzeug konnte nicht entfernt werden.",
    },
    ro: {
      closeMenu: "Închide meniul",
      controlCenter: "Centru de control",
      navOperation: "Operațiuni",
      navManagement: "Gestionare",
      navAdministration: "Administrare",
      navOverview: "Prezentare generală",
      navOverviewDetail: "Activitatea de azi",
      navInspections: "Inspecții",
      navInspectionsDetail: "Control și istoric",
      navAlerts: "Alerte IA",
      navAlertsDetail: "Revizuire prioritară",
      navFleet: "Flota Driver",
      navFleetDetail: "Adăugare sau eliminare",
      navUsers: "Utilizatori",
      navUsersDetail: "Roluri și permisiuni",
      navReports: "Rapoarte",
      navReportsDetail: "PDF și export",
      navSystem: "Sistem",
      navSystemDetail: "Stare și activitate",
      pageOverviewEyebrow: "OPERAȚIUNI ÎN TIMP REAL",
      pageOverviewTitle: "Centru de operațiuni",
      pageOverviewSubtitle: "Inspecțiile de azi, activitatea pe site și starea serviciilor.",
      pageInspectionsEyebrow: "CONTROLUL INSPECȚIILOR",
      pageInspectionsTitle: "Inspecții și vehicule",
      pageInspectionsSubtitle: "Verifică activitatea zilnică și istoricul complet al fiecărui număr.",
      pageAlertsEyebrow: "REVIZUIRE PRIORITARĂ",
      pageAlertsTitle: "Alerte de inteligență artificială",
      pageAlertsSubtitle: "Inspecții în așteptare, eșuate sau cu posibile daune.",
      pageFleetEyebrow: "CONFIGURARE DRIVER",
      pageFleetTitle: "Flotă disponibilă",
      pageFleetSubtitle: "Gestionează numerele afișate în aplicația Driver.",
      pageUsersEyebrow: "ACCES ȘI PERMISIUNI",
      pageUsersTitle: "Echipa de operațiuni",
      pageUsersSubtitle: "Gestionează conturile, rolurile și permisiunile de acces.",
      pageReportsEyebrow: "ARHIVĂ OPERAȚIONALĂ",
      pageReportsTitle: "Rapoarte și exporturi",
      pageReportsSubtitle: "Găsește rapoarte, generează fișiere și închide operațiunea zilnică.",
      pageSystemEyebrow: "SERVICII ȘI AUDIT",
      pageSystemTitle: "Starea sistemului",
      pageSystemSubtitle: "Monitorizează sincronizarea, activitatea recentă și starea serviciilor.",
      today: "AZI",
      fleetActivity: "Activitatea flotei",
      driverData: "Informații primite din aplicația Driver.",
      liveUpdate: "Actualizare live",
      siteInspections: "Inspecții pe site",
      vehiclesProcessedToday: "Vehicule procesate azi",
      dayStatus: "Starea zilei",
      operationsSummary: "Rezumat operațional",
      periodTotals: "Totaluri pentru perioadă",
      selectedFilters: "Conform filtrelor selectate",
      siteVehicleAlertSummary: "{vehicles} vehicule · {alerts} alerte azi",
      noInspectionsToday: "Nicio inspecție azi",
      moduleInspectionsEyebrow: "REGISTRU OPERAȚIONAL",
      moduleInspectionsTitle: "Inspecții",
      moduleInspectionsDescription: "Caută un număr, verifică activitatea zilnică și deschide istoricul complet.",
      moduleAlertsEyebrow: "COADĂ DE REVIZUIRE",
      moduleAlertsTitle: "Alerte IA",
      moduleAlertsDescription: "Prioritizează inspecțiile în așteptare, eșuate sau cu posibile incidente.",
      moduleFleetEyebrow: "FLOTA ȘOFERILOR",
      moduleFleetTitle: "Vehicule disponibile",
      moduleFleetDescription: "Această listă se sincronizează direct cu selectorul din aplicația Driver.",
      moduleUsersEyebrow: "CONTROLUL ACCESULUI",
      moduleUsersTitle: "Utilizatori și permisiuni",
      moduleUsersDescription: "Proprietarul poate atribui roluri și limita accesul fiecărui cont.",
      moduleReportsEyebrow: "DOCUMENTAȚIE",
      moduleReportsTitle: "Rapoarte salvate",
      moduleReportsDescription: "Consultă documente, exportă date sau pregătește închiderea zilei.",
      moduleSystemEyebrow: "CENTRU TEHNIC",
      moduleSystemTitle: "Servicii și activitate",
      moduleSystemDescription: "Starea platformei, sincronizarea și trasabilitatea acțiunilor.",
      editFleet: "MODIFICARE FLOTĂ",
      addVehicle: "Adaugă vehicul",
      addVehicleDescription: "Selectează site-ul și introdu numărul de înmatriculare.",
      directory: "DIRECTOR",
      activeRegistrations: "Numere active",
      fleetManagementTitle: "Gestionarea flotei Driver",
      fleetManagementSubtitle: "Lista reală a numerelor vizibile în aplicația șoferului.",
      active: "Active",
      refreshList: "Actualizează lista",
      siteForVehicle: "Site pentru vehiculul nou",
      registration: "Număr de înmatriculare",
      add: "Adaugă",
      search: "Caută",
      searchRegistration: "Caută numărul",
      fleetNote: "Aceasta este aceeași listă afișată în aplicația Driver. Adăugarea sau eliminarea actualizează automat selectorul.",
      action: "Acțiune",
      remove: "Elimină",
      loadingDriverVehicles: "Se încarcă numerele din Driver...",
      syncingDriver: "Sincronizare cu Driver...",
      syncedDriver: "{count} numere vizibile în Driver · actualizat la {time}",
      fleetLoadError: "Flota nu a putut fi încărcată.",
      fleetSyncError: "Flota nu a putut fi sincronizată.",
      fleetEmpty: "Nu există vehicule pentru acest filtru.",
      invalidRegistration: "Introdu un număr de înmatriculare valid.",
      addingVehicle: "Se adaugă {plate} în Driver...",
      vehicleSaveError: "Vehiculul nu a putut fi salvat.",
      removeConfirm: "Elimini {plate} din aplicația Driver?",
      removingVehicle: "Se elimină {plate} din Driver...",
      vehicleRemoveError: "Vehiculul nu a putut fi eliminat.",
    },
  };

  const getLanguage = () => window.FI18N?.getLanguage?.() || document.documentElement.lang || "en";
  const translate = (key, replacements = {}) => {
    const language = translations[getLanguage()] ? getLanguage() : "en";
    const value = translations[language][key] || translations.en[key] || key;
    return Object.entries(replacements).reduce(
      (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
      value
    );
  };

  window.FleetInspectAdminCopy = {
    t: translate,
    language: getLanguage,
  };

  const panelFor = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    return node.matches(".dashboard-widget") ? node : node.closest(".dashboard-widget");
  };

  const makeModule = (view, labelKey, titleKey, descriptionKey) => {
    const section = document.createElement("section");
    section.className = `ops-module ops-module-${view}`;
    section.dataset.adminView = view;
    section.innerHTML = `
      <header class="ops-module-heading">
        <div>
          <p data-ops-i18n="${labelKey}"></p>
          <h3 data-ops-i18n="${titleKey}"></h3>
          <span data-ops-i18n="${descriptionKey}"></span>
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
          <p data-ops-i18n="today"></p>
          <h3 data-ops-i18n="fleetActivity"></h3>
          <span data-ops-i18n="driverData"></span>
        </div>
        <span class="ops-live-label"><i></i><span data-ops-i18n="liveUpdate"></span></span>
      </div>
      <div class="ops-workspace-grid">
        <section class="ops-sites-column">
          <header><strong data-ops-i18n="siteInspections"></strong><span data-ops-i18n="vehiclesProcessedToday"></span></header>
        </section>
        <aside class="ops-day-column">
          <header><strong data-ops-i18n="dayStatus"></strong><span data-ops-i18n="operationsSummary"></span></header>
        </aside>
      </div>
      <section class="ops-totals-band">
        <header><strong data-ops-i18n="periodTotals"></strong><span data-ops-i18n="selectedFilters"></span></header>
      </section>`;

    overview.querySelector(".ops-sites-column").appendChild(siteOverview);
    overview.querySelector(".ops-day-column").appendChild(controlRoom);
    overview.querySelector(".ops-totals-band").appendChild(metrics);
    dashboardContent.appendChild(overview);
  };

  const buildModules = (dashboardContent) => {
    const inspections = makeModule(
      "inspections",
      "moduleInspectionsEyebrow",
      "moduleInspectionsTitle",
      "moduleInspectionsDescription"
    );
    const inspectionsContent = inspections.querySelector(".ops-module-content");
    appendPanel(inspectionsContent, panelFor("#dailyVehicleControl"), "ops-panel-primary");
    appendPanel(inspectionsContent, panelFor("#vehicleHistoryList"), "ops-panel-history");
    appendPanel(inspectionsContent, panelFor("#vehicleSummary"), "ops-panel-coverage");
    dashboardContent.appendChild(inspections);

    const alerts = makeModule(
      "alerts",
      "moduleAlertsEyebrow",
      "moduleAlertsTitle",
      "moduleAlertsDescription"
    );
    const alertsContent = alerts.querySelector(".ops-module-content");
    appendPanel(alertsContent, panelFor("#alertList"), "ops-panel-primary");
    appendPanel(alertsContent, panelFor("#aiStatusSummary"), "ops-panel-side");
    dashboardContent.appendChild(alerts);

    const fleet = makeModule(
      "fleet",
      "moduleFleetEyebrow",
      "moduleFleetTitle",
      "moduleFleetDescription"
    );
    appendPanel(fleet.querySelector(".ops-module-content"), document.querySelector("#fleetVehicleManagement"), "ops-panel-primary");
    dashboardContent.appendChild(fleet);

    const users = makeModule(
      "users",
      "moduleUsersEyebrow",
      "moduleUsersTitle",
      "moduleUsersDescription"
    );
    appendPanel(users.querySelector(".ops-module-content"), document.querySelector("#userManagement"), "ops-panel-primary");
    dashboardContent.appendChild(users);

    const reports = makeModule(
      "reports",
      "moduleReportsEyebrow",
      "moduleReportsTitle",
      "moduleReportsDescription"
    );
    appendPanel(reports.querySelector(".ops-module-content"), panelFor("#reportList"), "ops-panel-primary");
    dashboardContent.appendChild(reports);

    const system = makeModule(
      "system",
      "moduleSystemEyebrow",
      "moduleSystemTitle",
      "moduleSystemDescription"
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
        <p data-ops-i18n="editFleet"></p>
        <h4 data-ops-i18n="addVehicle"></h4>
        <span data-ops-i18n="addVehicleDescription"></span>
      </aside>
      <section class="ops-fleet-directory">
        <header><div><p data-ops-i18n="directory"></p><h4 data-ops-i18n="activeRegistrations"></h4></div></header>
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
    backdrop.dataset.opsI18nAria = "closeMenu";
    backdrop.addEventListener("click", () => document.body.classList.remove("admin-sidebar-open"));
    document.querySelector(".admin-shell")?.appendChild(backdrop);
    const caption = document.createElement("div");
    caption.className = "ops-sidebar-caption";
    caption.innerHTML = '<strong>FleetInspect</strong><span data-ops-i18n="controlCenter"></span>';
    logo.appendChild(caption);

    const footer = document.createElement("footer");
    footer.className = "ops-sidebar-footer";
    footer.innerHTML = '<span class="ops-footer-dot"></span><div><strong>9Bar Solutions</strong><small>DRP3 + DSU1</small></div>';
    sidebar.appendChild(footer);

    const formatNavigation = () => {
      sidebar.querySelectorAll(".fleet-nav .nav-group > p").forEach((label, index) => {
        label.dataset.opsI18n = ["navOperation", "navManagement", "navAdministration"][index] || "navAdministration";
      });
      sidebar.querySelectorAll(".fleet-nav a").forEach((link) => {
        const icon = link.querySelector(":scope > span");
        const label = link.querySelector(":scope > b");
        const detail = link.querySelector(":scope > small");
        const view = link.dataset.adminViewTarget;
        const viewName = view ? `${view.charAt(0).toUpperCase()}${view.slice(1)}` : "Overview";
        if (label) label.dataset.opsI18n = `nav${viewName}`;
        if (detail) detail.dataset.opsI18n = `nav${viewName}Detail`;
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
        if (label) link.title = translate(label.dataset.opsI18n);
      });
      applyLocalizedCopy();
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

  const localizeFleetManager = () => {
    const fleet = document.querySelector("#fleetVehicleManagement");
    if (!fleet) return;
    const headerTitle = fleet.querySelector(":scope > header h3");
    const headerSubtitle = fleet.querySelector(":scope > header h3 + span");
    const totalLabel = fleet.querySelector(".fleet-vehicle-total small");
    const refresh = fleet.querySelector("#refreshFleetVehicles");
    const labels = fleet.querySelectorAll(".fleet-vehicle-tools label > span");
    const addButton = fleet.querySelector("#addFleetVehicle");
    const searchInput = fleet.querySelector("#fleetVehicleSearch");
    const note = fleet.querySelector(".fleet-vehicle-note");
    const headings = fleet.querySelectorAll(".fleet-vehicle-list-head > span");
    const setText = (node, value) => {
      if (node && node.textContent !== value) node.textContent = value;
    };
    setText(headerTitle, translate("fleetManagementTitle"));
    setText(headerSubtitle, translate("fleetManagementSubtitle"));
    setText(totalLabel, translate("active"));
    setText(refresh, translate("refreshList"));
    setText(labels[0], translate("siteForVehicle"));
    setText(labels[1], translate("registration"));
    setText(labels[2], translate("search"));
    setText(addButton, translate("add"));
    if (searchInput) searchInput.placeholder = translate("searchRegistration");
    setText(note, translate("fleetNote"));
    setText(headings[0], translate("registration"));
    setText(headings[1], "Site");
    setText(headings[2], translate("action"));
    fleet.querySelectorAll("[data-remove-fleet-vehicle]").forEach((button) => {
      setText(button, translate("remove"));
    });
    fleet.querySelectorAll("[data-admin-copy-key]").forEach((node) => {
      setText(node, translate(node.dataset.adminCopyKey, {
        count: node.dataset.copyCount || "",
        time: node.dataset.copyTime || "",
        plate: node.dataset.copyPlate || "",
      }));
    });
  };

  const applyLocalizedCopy = () => {
    document.documentElement.lang = getLanguage();
    document.querySelectorAll("[data-ops-i18n]").forEach((node) => {
      const value = translate(node.dataset.opsI18n);
      if (node.textContent !== value) node.textContent = value;
    });
    document.querySelectorAll("[data-ops-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", translate(node.dataset.opsI18nAria));
    });
    document.querySelectorAll(".fleet-nav a[data-admin-view-target]").forEach((link) => {
      const label = link.querySelector(":scope > b");
      if (label?.dataset.opsI18n) link.title = translate(label.dataset.opsI18n);
    });
    localizeFleetManager();
  };

  window.FleetInspectAdminCopy.apply = applyLocalizedCopy;

  const syncPageHeading = () => {
    const view = document.body.dataset.adminView || "overview";
    const viewName = `${view.charAt(0).toUpperCase()}${view.slice(1)}`;
    const title = document.querySelector(".admin-command-header h2");
    const eyebrow = document.querySelector(".admin-command-header .eyebrow");
    let subtitle = document.querySelector(".admin-command-subtitle");
    if (!subtitle && title) {
      subtitle = document.createElement("span");
      subtitle.className = "admin-command-subtitle";
      title.parentElement.appendChild(subtitle);
    }
    if (eyebrow) eyebrow.textContent = translate(`page${viewName}Eyebrow`);
    if (title) title.textContent = translate(`page${viewName}Title`);
    if (subtitle) subtitle.textContent = translate(`page${viewName}Subtitle`);
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
    window.addEventListener("fleetinspect:language", () => {
      window.setTimeout(() => {
        applyLocalizedCopy();
        syncPageHeading();
      }, 0);
    });
    const fleetList = document.querySelector("#fleetVehicleList");
    if (fleetList) {
      new MutationObserver(localizeFleetManager).observe(fleetList, { childList: true, subtree: true });
    }
    applyLocalizedCopy();
    applyCurrentView();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
