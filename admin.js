let dashboardItems = [];
let systemConfig = {
  driveConfigured: false,
  aiConfigured: false,
};

const nodes = {
  refreshDashboard: document.querySelector("#refreshDashboard"),
  adminLock: document.querySelector("#adminLock"),
  dashboardContent: document.querySelector("#dashboardContent"),
  adminPin: document.querySelector("#adminPin"),
  unlockAdmin: document.querySelector("#unlockAdmin"),
  reportList: document.querySelector("#reportList"),
  alertList: document.querySelector("#alertList"),
  vehicleSummary: document.querySelector("#vehicleSummary"),
  systemStatus: document.querySelector("#systemStatus"),
  recentActivity: document.querySelector("#recentActivity"),
  searchReports: document.querySelector("#searchReports"),
  statusFilter: document.querySelector("#statusFilter"),
  dateFilter: document.querySelector("#dateFilter"),
  exportCsv: document.querySelector("#exportCsv"),
  exportDay: document.querySelector("#exportDay"),
  printDashboard: document.querySelector("#printDashboard"),
  lastSync: document.querySelector("#lastSync"),
  activeFilterCount: document.querySelector("#activeFilterCount"),
  storagePill: document.querySelector("#storagePill"),
  aiPill: document.querySelector("#aiPill"),
  vehicleControlDate: document.querySelector("#vehicleControlDate"),
  vehicleControlSearch: document.querySelector("#vehicleControlSearch"),
  vehicleControlView: document.querySelector("#vehicleControlView"),
  vehicleControlList: document.querySelector("#vehicleControlList"),
  controlTotalVehicles: document.querySelector("#controlTotalVehicles"),
  controlInspectedVehicles: document.querySelector("#controlInspectedVehicles"),
  controlMissingVehicles: document.querySelector("#controlMissingVehicles"),
  controlAlertVehicles: document.querySelector("#controlAlertVehicles"),
  aiStatusSummary: document.querySelector("#aiStatusSummary"),
  driverSummary: document.querySelector("#driverSummary"),
  vehicleHistoryPlate: document.querySelector("#vehicleHistoryPlate"),
  vehicleHistoryList: document.querySelector("#vehicleHistoryList"),
  metricInspections: document.querySelector("#metricInspections"),
  metricVehicles: document.querySelector("#metricVehicles"),
  metricPhotos: document.querySelector("#metricPhotos"),
  metricAlerts: document.querySelector("#metricAlerts"),
  metricToday: document.querySelector("#metricToday"),
  widgetAlertCount: document.querySelector("#widgetAlertCount"),
};

document.addEventListener("DOMContentLoaded", () => {
  window.FI18N.bindLanguageSelectors();
  nodes.refreshDashboard.addEventListener("click", loadDashboard);
  nodes.unlockAdmin.addEventListener("click", unlockAdmin);
  nodes.adminPin.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlockAdmin();
  });
  nodes.searchReports.addEventListener("input", renderDashboard);
  nodes.statusFilter.addEventListener("change", renderDashboard);
  nodes.dateFilter.addEventListener("change", renderDashboard);
  nodes.vehicleControlDate.value = localDateKey(new Date());
  nodes.vehicleControlDate.addEventListener("change", renderDashboard);
  nodes.vehicleControlSearch.addEventListener("input", renderDailyVehicleControl);
  nodes.vehicleControlView.addEventListener("change", renderDailyVehicleControl);
  nodes.exportCsv.addEventListener("click", exportCurrentCsv);
  nodes.exportDay.addEventListener("click", openSelectedDayReport);
  nodes.vehicleHistoryPlate.addEventListener("change", renderVehicleHistory);
  nodes.printDashboard.addEventListener("click", () => window.print());
  window.addEventListener("fleetinspect:language", renderDashboard);
});

async function unlockAdmin() {
  const pin = nodes.adminPin.value.trim();
  if (!pin) {
    alert(t("adminPin"));
    return;
  }

  try {
    const response = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const result = await response.json();

    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "Incorrect PIN.");
    }

    nodes.adminLock.classList.add("hidden");
    nodes.dashboardContent.classList.remove("hidden");
    await loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function loadDashboard() {
  nodes.reportList.innerHTML = `<p>${t("loadingReports")}</p>`;

  try {
    const [statusResponse, inspectionsResponse] = await Promise.all([
      fetch("/api/status"),
      fetch("/api/inspections"),
    ]);
    systemConfig = await statusResponse.json();
    dashboardItems = await inspectionsResponse.json();
    nodes.lastSync.textContent = `${t("lastSync")}: ${formatTime(new Date())}`;
    renderDashboard();
  } catch {
    nodes.reportList.innerHTML = `<p>${t("reportsCouldNotLoad")}</p>`;
  }
}

function renderDashboard() {
  const items = getFilteredItems();

  const allGroups = groupByPlate(dashboardItems);
  const todayKey = new Date().toISOString().slice(0, 10);
  nodes.metricInspections.textContent = String(dashboardItems.length);
  nodes.metricVehicles.textContent = String(Object.keys(allGroups).length);
  nodes.metricPhotos.textContent = String(dashboardItems.reduce((sum, item) => sum + (item.photos?.length || 0), 0));
  const alertCount = dashboardItems.filter((item) => item.ai?.newDamageDetected).length;
  nodes.metricAlerts.textContent = String(alertCount);
  nodes.widgetAlertCount.textContent = String(alertCount);
  nodes.metricToday.textContent = String(dashboardItems.filter((item) => String(item.finishedAt || item.startedAt || "").startsWith(todayKey)).length);
  nodes.activeFilterCount.textContent = String(items.length);
  renderStatusPills();

  renderAlerts(items.length ? items : dashboardItems);
  renderVehicleSummary(allGroups);
  renderDailyVehicleControl();
  renderAiStatusSummary(dashboardItems);
  renderDriverSummary(dashboardItems);
  renderVehicleHistoryPicker();
  renderVehicleHistory();
  renderSystemStatus(dashboardItems);
  renderRecentActivity(dashboardItems);

  if (!items.length) {
    nodes.reportList.innerHTML = `<p>${t("noReports")}</p>`;
    return;
  }

  const groups = groupByPlate(items);
  nodes.reportList.innerHTML = Object.entries(groups).map(([plate, plateItems]) => `
    <section class="vehicle-group">
      <header class="vehicle-group-header">
        <div>
          <span>${escapeHtml(t("vehicle"))}</span>
          <strong>${escapeHtml(plate)}</strong>
        </div>
        <small>${plateItems.length} ${escapeHtml(t("inspection"))}${plateItems.length === 1 ? "" : "s"}</small>
      </header>
      <div class="vehicle-group-list">
        ${plateItems.map((item) => `
          <article class="report-card">
            <div>
              <strong>${escapeHtml(item.driverName || t("noDriver"))}</strong>
              <span>${formatDate(item.finishedAt || item.startedAt)}</span>
              <small>${item.photos?.length || 0} ${escapeHtml(t("photos").toLowerCase())}</small>
              ${renderPhotoStrip(item)}
              <p class="ai-result ${item.ai?.newDamageDetected ? "alert" : ""}">
                ${renderAiBadge(item)} ${escapeHtml(item.ai?.label || t("aiPending"))} - ${escapeHtml(item.ai?.summary || t("noAiSummary"))}
              </p>
              ${renderAiFindings(item)}
              ${item.drive?.folderUrl ? `<a href="${item.drive.folderUrl}" target="_blank" rel="noopener">${escapeHtml(t("openDrive"))}</a>` : ""}
            </div>
            <div class="report-actions">
              <a href="/report.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">${escapeHtml(t("viewPdf"))}</a>
              ${item.drive?.folderUrl ? `<a href="${item.drive.folderUrl}" target="_blank" rel="noopener">${escapeHtml(t("openFolder"))}</a>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderAlerts(items) {
  const alerts = items
    .filter((item) => item.ai?.newDamageDetected)
    .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt))
    .slice(0, 8);

  if (!alerts.length) {
    const recent = [...items]
      .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt))
      .slice(0, 4);
    nodes.alertList.innerHTML = recent.length
      ? recent.map((item) => `
        <article class="alert-card quiet">
          <div>
            <strong>${escapeHtml(item.plate || t("noRegistration"))}</strong>
            <span>${escapeHtml(t("healthGood"))}</span>
            <p>${escapeHtml(item.driverName || t("noDriver"))} · ${formatDate(item.finishedAt || item.startedAt)}</p>
          </div>
          <a href="/report.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">${escapeHtml(t("viewReport"))}</a>
        </article>
      `).join("")
      : `<article class="empty-state">${escapeHtml(t("noPriorityItems"))}</article>`;
    return;
  }

  nodes.alertList.innerHTML = alerts.map((item) => `
    <article class="alert-card">
      <div>
        <strong>${escapeHtml(item.plate || t("noRegistration"))}</strong>
        <span>${escapeHtml(item.ai?.label || t("possibleNewDamage"))}</span>
        <p>${escapeHtml(item.ai?.summary || t("reviewInspection"))}</p>
      </div>
      <a href="/report.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">${escapeHtml(t("review"))}</a>
    </article>
  `).join("");
}

function renderVehicleSummary(groups) {
  const vehicles = Object.entries(groups)
    .map(([plate, items]) => {
      const sorted = [...items].sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));
      const latest = sorted[0];
      return {
        plate,
        inspections: sorted.length,
        photos: sorted.reduce((sum, item) => sum + (item.photos?.length || 0), 0),
        alerts: sorted.filter((item) => item.ai?.newDamageDetected).length,
        latest,
      };
    })
    .sort((a, b) => new Date(b.latest?.finishedAt || b.latest?.startedAt || 0) - new Date(a.latest?.finishedAt || a.latest?.startedAt || 0));

  if (!vehicles.length) {
    nodes.vehicleSummary.innerHTML = `<article class="empty-state">${escapeHtml(t("noVehicleInspections"))}</article>`;
    return;
  }

  nodes.vehicleSummary.innerHTML = vehicles.map((vehicle) => `
    <article class="vehicle-tile ${vehicle.alerts ? "has-alert" : ""}">
      <div>
        <strong>${escapeHtml(vehicle.plate)}</strong>
        <span>${vehicle.inspections} ${escapeHtml(t("inspection"))}${vehicle.inspections === 1 ? "" : "s"} · ${vehicle.photos} ${escapeHtml(t("photos").toLowerCase())}</span>
        <small>${escapeHtml(t("latest"))}: ${formatDate(vehicle.latest?.finishedAt || vehicle.latest?.startedAt)} · ${escapeHtml(vehicle.latest?.driverName || t("noDriver"))}</small>
      </div>
      <em>${vehicle.alerts} ${escapeHtml(vehicle.alerts === 1 ? t("alert") : t("alerts"))}</em>
    </article>
  `).join("");
}

function renderDailyVehicleControl() {
  const fleetVehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];
  const selectedDate = nodes.vehicleControlDate.value || localDateKey(new Date());
  const search = nodes.vehicleControlSearch.value.trim().toLowerCase();
  const inspectionsByPlate = dashboardItems.reduce((groups, item) => {
    const plate = normalizePlate(item.plate || "");
    const inspectionDate = localDateKey(new Date(item.finishedAt || item.startedAt || 0));
    if (inspectionDate !== selectedDate || !plate) return groups;
    if (!groups[plate]) groups[plate] = [];
    groups[plate].push(item);
    return groups;
  }, {});

  const vehicles = fleetVehicles
    .map((plate) => {
      const normalized = normalizePlate(plate);
      const inspections = (inspectionsByPlate[normalized] || [])
        .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));
      const latest = inspections[0];
      const hasAlert = inspections.some((item) => item.ai?.newDamageDetected);
      return {
        plate,
        normalized,
        inspected: inspections.length > 0,
        inspections,
        latest,
        hasAlert,
      };
    })
    .filter((vehicle) => vehicle.normalized.toLowerCase().includes(search));
  const viewMode = nodes.vehicleControlView.value;
  const missingVehicles = vehicles.filter((vehicle) => !vehicle.inspected);
  const doneVehicles = vehicles.filter((vehicle) => vehicle.inspected);
  const allVehicles = [...missingVehicles, ...doneVehicles];

  const inspectedCount = doneVehicles.length;
  const alertCount = vehicles.filter((vehicle) => vehicle.hasAlert).length;
  nodes.controlTotalVehicles.textContent = String(vehicles.length);
  nodes.controlInspectedVehicles.textContent = String(inspectedCount);
  nodes.controlMissingVehicles.textContent = String(vehicles.length - inspectedCount);
  nodes.controlAlertVehicles.textContent = String(alertCount);

  if (!vehicles.length) {
    nodes.vehicleControlList.innerHTML = `<article class="empty-state">${escapeHtml(t("noVehiclesFound"))}</article>`;
    return;
  }

  if (viewMode === "missing") {
    nodes.vehicleControlList.innerHTML = renderVehicleControlSection(t("missingVehicles"), missingVehicles, selectedDate);
    return;
  }

  if (viewMode === "done") {
    nodes.vehicleControlList.innerHTML = renderVehicleControlSection(t("inspectedVehicles"), doneVehicles, selectedDate);
    return;
  }

  if (viewMode === "all") {
    nodes.vehicleControlList.innerHTML = renderVehicleControlSection(t("allVehicles"), allVehicles, selectedDate);
    return;
  }

  nodes.vehicleControlList.innerHTML = [
    renderVehicleControlSection(t("missingVehicles"), missingVehicles, selectedDate, "priority"),
    renderVehicleControlSection(t("inspectedVehicles"), doneVehicles, selectedDate),
  ].join("");
}

function renderVehicleControlSection(title, vehicles, selectedDate, variant = "") {
  return `
    <section class="vehicle-control-section ${variant}">
      <header>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${vehicles.length} ${escapeHtml(t("vehicles").toLowerCase())}</span>
        </div>
      </header>
      <div class="vehicle-control-table">
        ${vehicles.length ? vehicles.map((vehicle) => renderVehicleControlRow(vehicle, selectedDate)).join("") : `<article class="empty-state">${escapeHtml(t("noVehiclesFound"))}</article>`}
      </div>
    </section>
  `;
}

function renderVehicleControlRow(vehicle, selectedDate) {
    const statusClass = vehicle.hasAlert ? "alert" : vehicle.inspected ? "ok" : "missing";
    const statusLabel = vehicle.hasAlert ? t("alert") : vehicle.inspected ? t("inspected") : t("missing");
    const driver = vehicle.latest?.driverName || "-";
    const time = vehicle.latest ? formatTime(new Date(vehicle.latest.finishedAt || vehicle.latest.startedAt)) : "-";
    const photoCount = vehicle.latest?.photos?.length || 0;
    const aiStatus = vehicle.latest ? getAiStatus(vehicle.latest) : { label: t("pending"), className: "queued" };
    return `
      <article class="vehicle-control-row ${statusClass}">
        <div>
          <strong>${escapeHtml(vehicle.plate)}</strong>
          <span>${escapeHtml(t("registrationNumber"))}</span>
        </div>
        <div>
          <strong>${escapeHtml(statusLabel)}</strong>
          <span>${escapeHtml(t("status"))}</span>
        </div>
        <div>
          <strong>${escapeHtml(driver)}</strong>
          <span>${escapeHtml(t("driverName"))}</span>
        </div>
        <div>
          <strong>${escapeHtml(time)}</strong>
          <span>${escapeHtml(selectedDate)}</span>
        </div>
        <div>
          <strong>${photoCount}</strong>
          <span>${escapeHtml(t("photos"))}</span>
        </div>
        <div>
          <strong>${escapeHtml(aiStatus.label)}</strong>
          <span>${escapeHtml(t("aiDamageDetection"))}</span>
        </div>
        <div class="vehicle-control-actions">
          ${vehicle.latest ? `<a href="/report.html?id=${encodeURIComponent(vehicle.latest.id)}" target="_blank" rel="noopener">${escapeHtml(t("viewPdf"))}</a>` : `<span>${escapeHtml(t("pending"))}</span>`}
        </div>
      </article>
    `;
}

function renderAiStatusSummary(items) {
  const summary = items.reduce((result, item) => {
    const status = getAiStatus(item).key;
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});

  nodes.aiStatusSummary.innerHTML = `
    <article class="status-row ok">
      <span>${escapeHtml(t("aiCompleted"))}</span>
      <strong>${summary.completed || 0}</strong>
    </article>
    <article class="status-row warn">
      <span>${escapeHtml(t("aiQueued"))}</span>
      <strong>${summary.queued || 0}</strong>
    </article>
    <article class="status-row warn">
      <span>${escapeHtml(t("aiFailed"))}</span>
      <strong>${summary.failed || 0}</strong>
    </article>
  `;
}

function renderDriverSummary(items) {
  const drivers = Object.entries(items.reduce((groups, item) => {
    const name = item.driverName || t("noDriver");
    if (!groups[name]) {
      groups[name] = { name, inspections: 0, alerts: 0, photos: 0, latest: null };
    }
    groups[name].inspections += 1;
    groups[name].alerts += item.ai?.newDamageDetected ? 1 : 0;
    groups[name].photos += item.photos?.length || 0;
    if (!groups[name].latest || new Date(item.finishedAt || item.startedAt) > new Date(groups[name].latest.finishedAt || groups[name].latest.startedAt)) {
      groups[name].latest = item;
    }
    return groups;
  }, {}))
    .map(([, driver]) => driver)
    .sort((a, b) => b.inspections - a.inspections || a.name.localeCompare(b.name))
    .slice(0, 10);

  nodes.driverSummary.innerHTML = drivers.length
    ? drivers.map((driver) => `
      <article class="driver-summary-row">
        <div>
          <strong>${escapeHtml(driver.name)}</strong>
          <span>${driver.inspections} ${escapeHtml(t("inspections").toLowerCase())} · ${driver.photos} ${escapeHtml(t("photos").toLowerCase())}</span>
        </div>
        <em>${driver.alerts} ${escapeHtml(t(driver.alerts === 1 ? "alert" : "alerts"))}</em>
      </article>
    `).join("")
    : `<article class="empty-state">${escapeHtml(t("noReports"))}</article>`;
}

function renderVehicleHistoryPicker() {
  const selected = nodes.vehicleHistoryPlate.value;
  const plates = [...new Set(dashboardItems.map((item) => normalizePlate(item.plate || "")).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  nodes.vehicleHistoryPlate.innerHTML = [
    `<option value="">${escapeHtml(t("selectVehicle"))}</option>`,
    ...plates.map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`),
  ].join("");
  if (plates.includes(selected)) nodes.vehicleHistoryPlate.value = selected;
}

function renderVehicleHistory() {
  const plate = nodes.vehicleHistoryPlate.value;
  if (!plate) {
    nodes.vehicleHistoryList.innerHTML = `<article class="empty-state">${escapeHtml(t("noVehicleSelected"))}</article>`;
    return;
  }

  const items = dashboardItems
    .filter((item) => normalizePlate(item.plate || "") === plate)
    .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));

  nodes.vehicleHistoryList.innerHTML = items.map((item) => `
    <article class="history-row ${item.ai?.newDamageDetected ? "alert" : ""}">
      <div>
        <strong>${formatDate(item.finishedAt || item.startedAt)}</strong>
        <span>${escapeHtml(item.driverName || t("noDriver"))}</span>
      </div>
      <div>
        ${renderAiBadge(item)}
        <span>${escapeHtml(item.ai?.label || t("aiPending"))}</span>
      </div>
      <div>
        <strong>${item.photos?.length || 0}</strong>
        <span>${escapeHtml(t("photos"))}</span>
      </div>
      <a href="/report.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">${escapeHtml(t("viewPdf"))}</a>
    </article>
  `).join("");
}

function renderSystemStatus(items) {
  const hasDriveLinks = items.some((item) => item.drive?.folderUrl);
  const driveReady = Boolean(systemConfig.supabaseConfigured || systemConfig.cloudStorageConfigured || systemConfig.driveConfigured);
  const aiReady = Boolean(systemConfig.aiConfigured);

  nodes.systemStatus.innerHTML = `
    <article class="status-row ${driveReady ? "ok" : "warn"}">
      <span>${escapeHtml(t("driveConfiguration"))}</span>
      <strong>${escapeHtml(driveReady ? t("configured") : t("notConfigured"))}</strong>
    </article>
    <article class="status-row ${hasDriveLinks ? "ok" : "warn"}">
      <span>${escapeHtml(t("driveStorage"))}</span>
      <strong>${escapeHtml(hasDriveLinks ? t("synced") : t("noDriveLinks"))}</strong>
    </article>
    <article class="status-row ${aiReady ? "ok" : "warn"}">
      <span>${escapeHtml(t("aiService"))}</span>
      <strong>${escapeHtml(aiReady ? t("configured") : t("notConfigured"))}</strong>
    </article>
  `;
}

function renderRecentActivity(items) {
  const recent = [...items]
    .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt))
    .slice(0, 8);

  if (!recent.length) {
    nodes.recentActivity.innerHTML = `<article class="empty-state">${escapeHtml(t("noRecentActivity"))}</article>`;
    return;
  }

  nodes.recentActivity.innerHTML = recent.map((item) => `
    <article class="activity-row">
      <div>
        <strong>${escapeHtml(item.plate || t("noRegistration"))}</strong>
        <span>${escapeHtml(item.driverName || t("noDriver"))}</span>
      </div>
      <time>${formatDate(item.finishedAt || item.startedAt)}</time>
    </article>
  `).join("");
}

function getFilteredItems() {
  const query = nodes.searchReports.value.trim().toLowerCase();
  const status = nodes.statusFilter.value;
  const dateRange = nodes.dateFilter.value;
  const now = Date.now();

  return dashboardItems.filter((item) => {
    const text = `${item.driverName || ""} ${item.plate || ""}`.toLowerCase();
    const matchesQuery = text.includes(query);
    const hasAlert = Boolean(item.ai?.newDamageDetected);
    const matchesStatus =
      status === "all" ||
      (status === "alerts" && hasAlert) ||
      (status === "pending" && getAiStatus(item).key === "queued") ||
      (status === "failed" && getAiStatus(item).key === "failed") ||
      (status === "clean" && !hasAlert);
    const itemDate = new Date(item.finishedAt || item.startedAt || 0);
    const ageDays = (now - itemDate.getTime()) / 86400000;
    const matchesDate =
      dateRange === "all" ||
      (dateRange === "today" && localDateKey(itemDate) === localDateKey(new Date())) ||
      (Number(dateRange) && ageDays <= Number(dateRange));
    return matchesQuery && matchesStatus && matchesDate;
  });
}

function renderStatusPills() {
  const storageReady = Boolean(systemConfig.supabaseConfigured || systemConfig.cloudStorageConfigured || systemConfig.driveConfigured);
  const aiReady = Boolean(systemConfig.aiConfigured);
  nodes.storagePill.textContent = storageReady ? t("ready") : t("needsSetup");
  nodes.aiPill.textContent = aiReady ? t("ready") : t("needsSetup");
  nodes.storagePill.className = storageReady ? "ready" : "warn";
  nodes.aiPill.className = aiReady ? "ready" : "warn";
}

function renderPhotoStrip(item) {
  const photos = (item.photos || []).slice(0, 5);
  if (!photos.length) return "";
  return `
    <div class="report-photo-strip">
      ${photos.map((photo) => `<img src="${photo.url}" alt="${escapeHtml(photo.label || t("photos"))}" loading="lazy" />`).join("")}
    </div>
  `;
}

function renderAiFindings(item) {
  const findings = Array.isArray(item.ai?.findings) ? item.ai.findings.slice(0, 3) : [];
  if (!findings.length && !item.ai?.recommendation) return "";
  return `
    <div class="ai-findings">
      ${findings.map((finding) => `
        <span>
          <strong>${escapeHtml(finding.view || t("vehicle"))}</strong>
          ${escapeHtml(finding.description || "")}
        </span>
      `).join("")}
      ${item.ai?.recommendation ? `<em>${escapeHtml(item.ai.recommendation)}</em>` : ""}
    </div>
  `;
}

function renderAiBadge(item) {
  const status = getAiStatus(item);
  return `<span class="ai-status-badge ${status.className}">${escapeHtml(status.label)}</span>`;
}

function getAiStatus(item) {
  const label = String(item.ai?.label || "").toLowerCase();
  const summary = String(item.ai?.summary || "").toLowerCase();
  if (item.ai?.status === "queued" || label.includes("cola") || label.includes("queued")) {
    return { key: "queued", className: "queued", label: t("aiQueued") };
  }
  if (label.includes("failed") || label.includes("fall") || summary.includes("could not") || summary.includes("no se pudo")) {
    return { key: "failed", className: "failed", label: t("aiFailed") };
  }
  if (item.ai?.newDamageDetected) {
    return { key: "completed", className: "alert", label: t("aiAlerts") };
  }
  return { key: "completed", className: "completed", label: t("aiCompleted") };
}

function exportCurrentCsv() {
  const items = getFilteredItems();
  const rows = [
    ["Date", "Driver", "Registration", "Photos", "AI", "Report"],
    ...items.map((item) => [
      formatDate(item.finishedAt || item.startedAt),
      item.driverName || "",
      item.plate || "",
      item.photos?.length || 0,
      item.ai?.label || "",
      `${location.origin}/report.html?id=${item.id}`,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `fleetinspect-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function openSelectedDayReport() {
  const selectedDate = nodes.vehicleControlDate.value || localDateKey(new Date());
  window.open(`/day-report.html?date=${encodeURIComponent(selectedDate)}`, "_blank", "noopener");
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function groupByPlate(items) {
  return items.reduce((groups, item) => {
    const plate = item.plate || t("noRegistration");
    if (!groups[plate]) groups[plate] = [];
    groups[plate].push(item);
    return groups;
  }, {});
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePlate(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function t(key, replacements = {}) {
  return window.FI18N.t(key, replacements);
}
