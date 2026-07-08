const root = document.querySelector("#reportRoot");
const params = new URLSearchParams(location.search);
const id = params.get("id");

loadReport();

async function loadReport() {
  if (!id) {
    root.textContent = "Report ID is missing.";
    return;
  }

  try {
    const response = await fetch(`/api/inspections/${encodeURIComponent(id)}`);
    const item = await response.json();
    if (!response.ok) throw new Error(item.error || "Report not found.");
    renderReport(item);
  } catch (error) {
    root.textContent = error.message;
  }
}

function renderReport(item) {
  root.innerHTML = `
    <header class="report-header">
      <div>
        <p class="muted">Inspection report</p>
        <h1>${escapeHtml(item.plate)}</h1>
      </div>
      <button onclick="window.print()">Save PDF</button>
    </header>

    <section class="summary">
      <div><span>Driver</span><strong>${escapeHtml(item.driverName)}</strong></div>
      <div><span>Registration</span><strong>${escapeHtml(item.plate)}</strong></div>
      <div><span>Date</span><strong>${formatDate(item.finishedAt)}</strong></div>
      <div><span>Photos</span><strong>${item.photos.length}</strong></div>
    </section>

    <section class="ai">
      <h2>AI analysis</h2>
      <p><strong>${escapeHtml(item.ai?.label || "Pending review")}</strong></p>
      <p>${escapeHtml(item.ai?.summary || "Pending review.")}</p>
      ${item.ai?.recommendation ? `<p><strong>Recommendation:</strong> ${escapeHtml(item.ai.recommendation)}</p>` : ""}
      ${item.ai?.comparedViews ? `<p class="muted">Compared views: ${escapeHtml(item.ai.comparedViews)}${item.ai?.model ? ` · Model: ${escapeHtml(item.ai.model)}` : ""}</p>` : ""}
      ${item.ai?.findings?.length ? `
        <ul>
          ${item.ai.findings.map((finding) => `
            <li>
              <strong>${escapeHtml(finding.view || "View")}</strong>:
              ${escapeHtml(finding.description || "")}
              ${finding.confidence ? `<span class="muted">(${escapeHtml(finding.confidence)} confidence)</span>` : ""}
            </li>
          `).join("")}
        </ul>
      ` : ""}
    </section>

    ${item.notes ? `<section class="notes"><h2>Notes</h2><p>${escapeHtml(item.notes)}</p></section>` : ""}

    <section class="photos">
      ${item.photos.map((photo) => `
        <article class="photo">
          <img src="${photo.url}" alt="${escapeHtml(photo.label)}" />
          <strong>${escapeHtml(photo.label)}</strong>
          <p class="muted">${formatDate(photo.capturedAt || item.finishedAt)}</p>
        </article>
      `).join("")}
    </section>
  `;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
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
