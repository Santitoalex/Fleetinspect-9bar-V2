const params = new URLSearchParams(location.search);
const selectedDate = params.get("date") || localDateKey(new Date());
const fleetVehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];

const nodes = {
  date: document.querySelector("#dayReportDate"),
  total: document.querySelector("#dayTotal"),
  done: document.querySelector("#dayDone"),
  missing: document.querySelector("#dayMissing"),
  alerts: document.querySelector("#dayAlerts"),
  doneList: document.querySelector("#dayDoneList"),
  missingList: document.querySelector("#dayMissingList"),
};

document.addEventListener("DOMContentLoaded", loadDayReport);

async function loadDayReport() {
  nodes.date.textContent = selectedDate;
  const response = await fetch("/api/inspections");
  const inspections = await response.json();
  const dayItems = inspections.filter((item) => localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === selectedDate);
  const byPlate = dayItems.reduce((groups, item) => {
    const plate = normalizePlate(item.plate || "");
    if (!groups[plate]) groups[plate] = [];
    groups[plate].push(item);
    return groups;
  }, {});

  const rows = fleetVehicles.map((plate) => {
    const normalized = normalizePlate(plate);
    const items = (byPlate[normalized] || [])
      .sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));
    const latest = items[0];
    return { plate, inspected: Boolean(latest), latest };
  });

  const done = rows.filter((row) => row.inspected);
  const missing = rows.filter((row) => !row.inspected);
  const alerts = done.filter((row) => row.latest?.ai?.newDamageDetected);

  nodes.total.textContent = String(rows.length);
  nodes.done.textContent = String(done.length);
  nodes.missing.textContent = String(missing.length);
  nodes.alerts.textContent = String(alerts.length);
  nodes.doneList.innerHTML = done.length ? done.map(renderDoneRow).join("") : `<p>No inspected vehicles.</p>`;
  nodes.missingList.innerHTML = missing.length ? missing.map(renderMissingRow).join("") : `<p>No missing vehicles.</p>`;
}

function renderDoneRow(row) {
  const item = row.latest;
  const aiLabel = item.ai?.newDamageDetected ? "AI alert" : item.ai?.status === "queued" ? "AI queued" : "OK";
  return `
    <article>
      <strong>${escapeHtml(row.plate)}</strong>
      <span>${escapeHtml(item.driverName || "-")}</span>
      <span>${formatTime(item.finishedAt || item.startedAt)}</span>
      <span>${item.photos?.length || 0} photos</span>
      <span>${escapeHtml(aiLabel)}</span>
      <a href="/report.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">Report</a>
    </article>
  `;
}

function renderMissingRow(row) {
  return `
    <article class="missing">
      <strong>${escapeHtml(row.plate)}</strong>
      <span>Missing inspection</span>
    </article>
  `;
}

function normalizePlate(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
}

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
