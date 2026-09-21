(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizePlate(value) {
    return String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
  }

  function fallbackVehicles() {
    return [...new Set((window.FLEET_VEHICLES || []).map(normalizePlate).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function fillVehicleSelectIfEmpty() {
    const select = document.querySelector("#vehiclePlate");
    const vehicles = fallbackVehicles();
    if (!select || !vehicles.length || select.options.length > 1) return;

    const current = normalizePlate(select.value);
    select.innerHTML = [
      '<option value="">Selecciona matricula</option>',
      ...vehicles.map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`),
    ].join("");

    if (current && vehicles.includes(current)) {
      select.value = current;
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    fillVehicleSelectIfEmpty();
    window.setTimeout(fillVehicleSelectIfEmpty, 500);
    window.setTimeout(fillVehicleSelectIfEmpty, 1500);
    window.setTimeout(fillVehicleSelectIfEmpty, 3000);
  });

  window.addEventListener("fleetinspect:language", () => {
    window.setTimeout(fillVehicleSelectIfEmpty, 0);
  });
})();
