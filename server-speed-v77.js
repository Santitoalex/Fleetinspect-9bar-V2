import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const appPath = path.join(root, "app.js");
const adminPath = path.join(root, "admin.js");
const adminHtmlPath = path.join(root, "admin.html");
const driverCssPath = path.join(root, "driver-v74.css");
const runtimeAdminPath = path.join(root, ".runtime", "admin.js");
const runtimeAdminHtmlPath = path.join(root, ".runtime", "admin.html");
const runtimeServiceWorkerPath = path.join(root, ".runtime", "service-worker.js");

await import(pathToFileURL(path.join(root, "server-speed-v75.js")).href);

let appJs = await fs.readFile(appPath, "utf8");
if (!appJs.includes("let fleetRefreshInFlight = false;")) {
  appJs = appJs.replace(
    "let fleetVehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];",
    "let fleetVehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];\nlet fleetRefreshInFlight = false;"
  );
}
appJs = appJs.replace(
  "    if (!apiVehicles.length) return;\n    fleetVehicles = apiVehicles;",
  "    fleetVehicles = apiVehicles;"
);
const reliableVehicleOptions = `function renderVehicleOptions(vehicles, previousValue = "") {
  const uniqueVehicles = [...new Set((vehicles || []).map(normalizePlate).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  nodes.vehiclePlate.innerHTML = [
    \`<option value="">\${t("selectRegistration")}</option>\`,
    ...uniqueVehicles.map((plate) => \`<option value="\${escapeHtml(plate)}">\${escapeHtml(plate)}</option>\`),
  ].join("");
  const normalizedPrevious = normalizePlate(previousValue);
  if (normalizedPrevious && uniqueVehicles.includes(normalizedPrevious)) {
    nodes.vehiclePlate.value = normalizedPrevious;
  }
  window.setTimeout(() => window.dispatchEvent(new Event("fleetinspect:force-start-state")), 0);
}`;

appJs = appJs.replace(
  /function renderVehicleOptions\(vehicles, previousValue = ""\) \{[\s\S]*?\n\}\n\nfunction bindEvents/,
  `${reliableVehicleOptions}\n\nfunction bindEvents`
);

const strongerStartState = [
  "function updateStartFormState(showErrors = false) {",
  "  const site = normalizeSite(nodes.siteSelect?.value);",
  "  const driverName = nodes.driverName?.value.trim();",
  "  const plate = normalizePlate(nodes.vehiclePlate?.value);",
  "  const ready = Boolean(site && driverName && plate);",
  "",
  "  if (nodes.startPhotosButton) {",
  "    nodes.startPhotosButton.disabled = false;",
  "    nodes.startPhotosButton.removeAttribute(\"disabled\");",
  "    nodes.startPhotosButton.setAttribute(\"aria-disabled\", \"false\");",
  "    nodes.startPhotosButton.classList.toggle(\"is-ready\", ready);",
  "  }",
  "",
  "  const siteLabel = nodes.siteSelect?.closest(\"label\");",
  "  siteLabel?.classList.toggle(\"field-invalid\", Boolean(showErrors && !site));",
  "  if (nodes.siteError) {",
  "    nodes.siteError.textContent = showErrors && !site ? siteRequiredMessage() : \"\";",
  "  }",
  "}",
].join("\n");

appJs = appJs.replace(
  /function updateStartFormState\(showErrors = false\) \{[\s\S]*?\n\}\n\nfunction siteRequiredMessage/,
  `${strongerStartState}\n\nfunction siteRequiredMessage`
);

if (!appJs.includes('window.addEventListener("fleetinspect:force-start-state"')) {
  appJs = appJs.replace(
    "  bindEvents();\n  updateStartFormState();",
    [
      "  bindEvents();",
      "  updateStartFormState();",
      "  window.setTimeout(updateStartFormState, 150);",
      "  window.setTimeout(updateStartFormState, 600);",
      "  window.setTimeout(updateStartFormState, 1500);",
      "  document.addEventListener(\"click\", () => window.setTimeout(updateStartFormState, 0));",
      "  document.addEventListener(\"touchend\", () => window.setTimeout(updateStartFormState, 0));",
      "  window.addEventListener(\"fleetinspect:force-start-state\", () => updateStartFormState());",
    ].join("\n")
  );
}

appJs = appJs.replace(
  "  nodes.startPhotosButton.disabled = !ready;",
  "  nodes.startPhotosButton.disabled = false;"
);

appJs = appJs.replace(
  "  nodes.startPhotosButton.setAttribute(\"aria-disabled\", String(!ready));",
  "  nodes.startPhotosButton.setAttribute(\"aria-disabled\", \"false\");\n    nodes.startPhotosButton.removeAttribute(\"disabled\");"
);

appJs = appJs.replace(
  '  nodes.photoCounter.textContent = `${completedCount} / ${STEPS.length}`;',
  '  if (nodes.photoCounter) nodes.photoCounter.textContent = `${completedCount} / ${STEPS.length}`;'
);

const cameraMessageWithRetry = [
  "function showCameraMessage(message) {",
  "  nodes.cameraFrame.classList.remove(\"is-live\");",
  "  nodes.cameraEmpty.classList.remove(\"hidden\");",
  "  const retryLabels = {",
  "    en: \"Retry camera\",",
  "    es: \"Reintentar camara\",",
  "    de: \"Kamera erneut versuchen\",",
  "    ro: \"Reincearca camera\",",
  "  };",
  "  const language = window.FI18N?.getLanguage?.() || \"en\";",
  "  nodes.cameraEmpty.innerHTML = `<strong>${escapeHtml(t(\"cameraPending\"))}</strong><span>${escapeHtml(message)}</span><button id=\"retryCameraButton\" class=\"camera-retry-button\" type=\"button\">${escapeHtml(retryLabels[language] || retryLabels.en)}</button>`;",
  "  nodes.cameraEmpty.querySelector(\"#retryCameraButton\")?.addEventListener(\"click\", () => openCamera());",
  "}",
].join("\n");

appJs = appJs.replace(
  /function showCameraMessage\(message\) \{[\s\S]*?\n\}\n\nfunction stopCamera/,
  `${cameraMessageWithRetry}\n\nfunction stopCamera`
);

appJs = appJs.replace(
  /function previousStep\(\) \{[\s\S]*?\n\}/,
  `function previousStep() {
  if (!session) return;
  if (stepIndex === 0) {
    resetSession();
    return;
  }
  stepIndex -= 1;
  updateCaptureUI();
  openCamera();
}`
);

appJs = appJs.replace(
  "  nodes.previousPhoto.disabled = stepIndex === 0;",
  "  nodes.previousPhoto.disabled = false;"
);

appJs = appJs.replace(
  "    renderVehicleOptions(fleetVehicles, previousValue);\n    updateStartFormState();",
  "    renderVehicleOptions(fleetVehicles, previousValue);\n    updateStartFormState();\n    window.setTimeout(updateStartFormState, 0);"
);

appJs = appJs.replace(
  "  if (normalizedPrevious && uniqueVehicles.includes(normalizedPrevious)) {\n    nodes.vehiclePlate.value = normalizedPrevious;\n  }\n}",
  [
    "  if (normalizedPrevious && uniqueVehicles.includes(normalizedPrevious)) {",
    "    nodes.vehiclePlate.value = normalizedPrevious;",
    "  }",
    "  window.setTimeout(() => window.dispatchEvent(new Event(\"fleetinspect:force-start-state\")), 0);",
    "}",
  ].join("\n")
);

const synchronizedDriverFleetLoader = [
  "async function fetchFleetVehicles(previousValue = nodes.vehiclePlate?.value || \"\") {",
  "  if (fleetRefreshInFlight) return;",
  "  fleetRefreshInFlight = true;",
  "  const selectedPlate = normalizePlate(previousValue || nodes.vehiclePlate?.value || \"\");",
  "  try {",
  "    const response = await fetch(\"/api/vehicles?ts=\" + Date.now(), { cache: \"no-store\" });",
  "    const result = await response.json();",
  "    if (!response.ok || result.ok === false || !Array.isArray(result.vehicles)) return;",
  "    fleetVehicles = result.vehicles.map((vehicle) => vehicle.plate || vehicle).filter(Boolean);",
  "    renderVehicleOptions(fleetVehicles, selectedPlate);",
  "    updateStartFormState();",
  "  } catch {",
  "    // Keep the most recently loaded list when the phone is temporarily offline.",
  "  } finally {",
  "    fleetRefreshInFlight = false;",
  "  }",
  "}",
].join("\n");

appJs = appJs.replace(
  /async function fetchFleetVehicles\(previousValue = nodes\.vehiclePlate\.value\) \{[\s\S]*?\n\}\n\nfunction renderVehicleOptions/,
  `${synchronizedDriverFleetLoader}\n\nfunction renderVehicleOptions`
);

if (!appJs.includes("fleetinspect:driver-fleet-sync-v91")) {
  appJs = appJs.replace(
    "  loadVehicleOptions();\n  bindEvents();",
    [
      "  loadVehicleOptions();",
      "  document.documentElement.dataset.fleetSync = \"fleetinspect:driver-fleet-sync-v91\";",
      "  window.setInterval(() => {",
      "    if (!document.hidden) fetchFleetVehicles();",
      "  }, 15000);",
      "  document.addEventListener(\"visibilitychange\", () => {",
      "    if (!document.hidden) fetchFleetVehicles();",
      "  });",
      "  window.addEventListener(\"focus\", () => fetchFleetVehicles());",
      "  bindEvents();",
    ].join("\n")
  );
}

await fs.writeFile(appPath, appJs);

let driverCss = await fs.readFile(driverCssPath, "utf8");
if (!driverCss.includes(".camera-retry-button")) {
  driverCss += `

.driver-v74 .camera-empty .camera-retry-button {
  width: auto !important;
  min-height: 46px !important;
  margin-top: 14px !important;
  padding: 10px 20px !important;
  border: 1px solid rgba(255, 255, 255, .72) !important;
  border-radius: 10px !important;
  background: #ffffff !important;
  color: #101828 !important;
  font-size: 15px !important;
  font-weight: 800 !important;
}
`;
}

if (!driverCss.includes("/* driver-mobile-v85 */")) {
  driverCss += `

/* driver-mobile-v85 */
.driver-v85 {
  --driver-accent: #f57c00;
  --driver-accent-strong: #d96500;
  --driver-ink: #172033;
  --driver-muted: #667085;
  --driver-line: #d9e0e8;
  --driver-surface: #ffffff;
  --driver-canvas: #f3f6f9;
  min-height: 100svh;
  background: var(--driver-canvas) !important;
  color: var(--driver-ink) !important;
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
}

.driver-v85 .driver-topbar {
  position: sticky !important;
  top: 0 !important;
  z-index: 100 !important;
  min-height: 64px !important;
  border-bottom: 1px solid var(--driver-line) !important;
  background: rgba(255, 255, 255, .96) !important;
  padding: 9px max(14px, env(safe-area-inset-right)) 9px max(14px, env(safe-area-inset-left)) !important;
  box-shadow: none !important;
  backdrop-filter: blur(16px);
}

.driver-v85 .driver-brand {
  gap: 10px !important;
}

.driver-v85 .driver-brand .brand-logo {
  width: 82px !important;
  height: 40px !important;
  border: 0 !important;
  border-radius: 6px !important;
  background: #fff !important;
  object-fit: contain !important;
  box-shadow: none !important;
}

.driver-v85 .driver-brand strong {
  color: var(--driver-ink) !important;
  font-size: 18px !important;
  letter-spacing: 0 !important;
}

.driver-v85 .driver-brand span {
  display: none !important;
}

.driver-v85 .language-select {
  width: 68px !important;
  min-height: 42px !important;
  border: 1px solid var(--driver-line) !important;
  border-radius: 8px !important;
  background: #fff !important;
  color: var(--driver-ink) !important;
  font-size: 15px !important;
  font-weight: 800 !important;
}

.driver-v85 .driver-shell {
  width: min(100%, 680px) !important;
  margin: 0 auto !important;
  padding: 18px 16px max(30px, env(safe-area-inset-bottom)) !important;
}

.driver-v85 .install-banner {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: center !important;
  gap: 12px !important;
  margin: 0 0 14px !important;
  border: 1px solid var(--driver-line) !important;
  border-radius: 12px !important;
  background: #fff !important;
  padding: 12px !important;
  box-shadow: none !important;
}

.driver-v85 .install-banner > div:first-child {
  min-width: 0 !important;
}

.driver-v85 .install-actions {
  display: flex !important;
  grid-template-columns: none !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 8px !important;
}

.driver-v85 .install-banner p {
  margin: 3px 0 0 !important;
  color: var(--driver-muted) !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
}

.driver-v85 .install-actions button {
  min-height: 38px !important;
  border-radius: 8px !important;
  padding: 7px 12px !important;
  font-size: 13px !important;
}

.driver-v85 .driver-home:not(.hidden),
.driver-v85 .driver-start-layout {
  display: block !important;
  width: 100% !important;
}

.driver-v85 .driver-home.hidden {
  display: none !important;
}

.driver-v85 .driver-home-header,
.driver-v85 .driver-hero {
  margin: 0 0 14px !important;
  padding: 0 2px !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.driver-v85 .driver-home-header > span,
.driver-v85 .driver-hero > span {
  display: inline-block !important;
  margin-bottom: 6px !important;
  color: var(--driver-accent-strong) !important;
  font-size: 12px !important;
  font-weight: 850 !important;
  letter-spacing: 0 !important;
  text-transform: uppercase !important;
}

.driver-v85 .driver-home-header h1,
.driver-v85 .driver-hero h1 {
  max-width: 520px !important;
  margin: 0 !important;
  color: var(--driver-ink) !important;
  font-size: 32px !important;
  line-height: 1.08 !important;
  letter-spacing: 0 !important;
}

.driver-v85 .driver-home-header p,
.driver-v85 .driver-hero p {
  margin: 8px 0 0 !important;
  color: var(--driver-muted) !important;
  font-size: 15px !important;
  line-height: 1.45 !important;
}

.driver-v85 .driver-start-card {
  display: block !important;
  width: 100% !important;
  border: 1px solid var(--driver-line) !important;
  border-radius: 14px !important;
  background: var(--driver-surface) !important;
  padding: 16px !important;
  box-shadow: 0 8px 28px rgba(15, 23, 42, .06) !important;
}

.driver-v85 .driver-section-title,
.driver-v85 .driver-step-card {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  margin-bottom: 16px !important;
  border: 0 !important;
  background: transparent !important;
  padding: 0 !important;
}

.driver-v85 .driver-section-title > span,
.driver-v85 .driver-step-card > span {
  display: grid !important;
  width: 36px !important;
  height: 36px !important;
  place-items: center !important;
  border-radius: 8px !important;
  background: #fff2e5 !important;
  color: var(--driver-accent-strong) !important;
  font-size: 13px !important;
  font-weight: 850 !important;
}

.driver-v85 .driver-section-title strong,
.driver-v85 .driver-step-card strong {
  display: block !important;
  color: var(--driver-ink) !important;
  font-size: 16px !important;
  line-height: 1.2 !important;
}

.driver-v85 .driver-section-title small,
.driver-v85 .driver-step-card small {
  display: block !important;
  margin-top: 2px !important;
  color: var(--driver-muted) !important;
  font-size: 12px !important;
}

.driver-v85 .driver-form-fields {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 14px !important;
}

.driver-v85 .driver-form-fields label > span {
  display: block !important;
  margin: 0 0 6px !important;
  color: #475467 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  text-transform: uppercase !important;
}

.driver-v85 .driver-form-fields input,
.driver-v85 .driver-form-fields select,
.driver-v85 .driver-form-fields textarea {
  width: 100% !important;
  min-height: 52px !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 10px !important;
  background: #fff !important;
  color: var(--driver-ink) !important;
  padding: 0 14px !important;
  font-size: 17px !important;
  font-weight: 700 !important;
  box-shadow: none !important;
}

.driver-v85 .driver-form-fields textarea {
  min-height: 78px !important;
  resize: vertical !important;
  padding: 12px 14px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
}

.driver-v85 .driver-form-fields input:focus,
.driver-v85 .driver-form-fields select:focus,
.driver-v85 .driver-form-fields textarea:focus {
  border-color: var(--driver-accent) !important;
  outline: 3px solid rgba(245, 124, 0, .14) !important;
}

.driver-v85 #startPhotosButton {
  width: 100% !important;
  min-height: 54px !important;
  margin-top: 18px !important;
  border: 0 !important;
  border-radius: 10px !important;
  background: var(--driver-accent) !important;
  color: #fff !important;
  font-size: 17px !important;
  font-weight: 850 !important;
  box-shadow: none !important;
}

.driver-v85 #startPhotosButton:active {
  background: var(--driver-accent-strong) !important;
  transform: translateY(1px) !important;
}

.driver-v85 .driver-workflow-card {
  display: none !important;
}

@media (max-width: 759px) {
  .driver-v85 .install-banner {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  .driver-v85 .install-banner p {
    display: -webkit-box !important;
    overflow: hidden !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 3 !important;
  }

  .driver-v85 .driver-home-header h1,
  .driver-v85 .driver-hero h1 {
    font-size: 28px !important;
  }

  .driver-v85:has(#captureScreen:not(.hidden)) {
    height: 100svh !important;
    overflow: hidden !important;
    background: #080b12 !important;
  }

  .driver-v85:has(#captureScreen:not(.hidden)) .driver-topbar {
    display: none !important;
  }

  .driver-v85:has(#captureScreen:not(.hidden)) .driver-shell {
    width: 100% !important;
    height: 100svh !important;
    padding: 0 !important;
  }

  .driver-v85 #captureScreen:not(.hidden),
  .driver-v85 #captureScreen:not(.hidden) .driver-capture-app,
  .driver-v85 #captureScreen:not(.hidden) .capture-layout,
  .driver-v85 #captureScreen:not(.hidden) .camera-card {
    position: fixed !important;
    inset: 0 !important;
    display: block !important;
    width: 100% !important;
    height: 100svh !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #080b12 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .capture-header {
    position: absolute !important;
    top: max(10px, env(safe-area-inset-top)) !important;
    left: 12px !important;
    right: 12px !important;
    z-index: 40 !important;
    display: flex !important;
    min-height: 58px !important;
    align-items: center !important;
    justify-content: space-between !important;
    border: 0 !important;
    border-radius: 12px !important;
    background: rgba(8, 11, 18, .82) !important;
    padding: 9px 10px 9px 14px !important;
    color: #fff !important;
    box-shadow: none !important;
    backdrop-filter: blur(14px);
  }

  .driver-v85 #captureScreen:not(.hidden) .capture-kicker,
  .driver-v85 #captureScreen:not(.hidden) #sessionMeta,
  .driver-v85 #captureScreen:not(.hidden) #stepHelp,
  .driver-v85 #captureScreen:not(.hidden) #resetSession {
    display: none !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .capture-header h2 {
    margin: 0 !important;
    color: #fff !important;
    font-size: 20px !important;
    line-height: 1.1 !important;
    letter-spacing: 0 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-counter {
    min-width: 64px !important;
    border: 1px solid rgba(255, 255, 255, .22) !important;
    border-radius: 9px !important;
    background: rgba(255, 255, 255, .1) !important;
    color: #fff !important;
    padding: 9px 10px !important;
    font-size: 14px !important;
    text-align: center !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-progress-rail {
    position: absolute !important;
    top: calc(max(10px, env(safe-area-inset-top)) + 64px) !important;
    left: 16px !important;
    right: 16px !important;
    z-index: 41 !important;
    height: 4px !important;
    border-radius: 2px !important;
    background: rgba(255, 255, 255, .2) !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-progress-rail span {
    background: var(--driver-accent) !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-camera-frame {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 100svh !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #080b12 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .camera-frame video,
  .driver-v85 #captureScreen:not(.hidden) .camera-frame img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-camera-frame::before,
  .driver-v85 #captureScreen:not(.hidden) .photo-camera-frame::after,
  .driver-v85 #captureScreen:not(.hidden) .camera-corners {
    display: none !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .camera-toolbar {
    display: contents !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .camera-picker-control,
  .driver-v85 #captureScreen:not(.hidden) .camera-zoom-control {
    top: calc(max(10px, env(safe-area-inset-top)) + 78px) !important;
    left: 12px !important;
    right: 12px !important;
    z-index: 38 !important;
    border: 0 !important;
    border-radius: 10px !important;
    background: rgba(8, 11, 18, .8) !important;
    box-shadow: none !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-guide-card {
    position: absolute !important;
    left: 12px !important;
    right: 12px !important;
    bottom: calc(98px + env(safe-area-inset-bottom)) !important;
    z-index: 35 !important;
    display: flex !important;
    min-height: 50px !important;
    align-items: center !important;
    gap: 10px !important;
    border: 0 !important;
    border-radius: 10px !important;
    background: rgba(8, 11, 18, .82) !important;
    padding: 9px 12px !important;
    backdrop-filter: blur(14px);
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-guide-card > span {
    display: grid !important;
    width: 34px !important;
    height: 34px !important;
    flex: 0 0 34px !important;
    place-items: center !important;
    border-radius: 8px !important;
    background: var(--driver-accent) !important;
    color: #fff !important;
    font-size: 12px !important;
    font-weight: 850 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-guide-card strong {
    display: block !important;
    color: #fff !important;
    font-size: 15px !important;
    line-height: 1.2 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-guide-card p {
    display: block !important;
    margin: 2px 0 0 !important;
    overflow: hidden !important;
    color: rgba(255, 255, 255, .72) !important;
    font-size: 12px !important;
    line-height: 1.25 !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .camera-empty {
    left: 18px !important;
    right: 18px !important;
    top: 50% !important;
    bottom: auto !important;
    width: auto !important;
    min-height: 190px !important;
    transform: translateY(-50%) !important;
    border: 1px solid rgba(255, 255, 255, .16) !important;
    border-radius: 14px !important;
    background: #111722 !important;
    padding: 24px 18px !important;
    text-align: center !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .camera-empty strong {
    color: #fff !important;
    font-size: 20px !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .camera-empty span {
    max-width: 300px !important;
    margin-top: 8px !important;
    color: #b6c0cf !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-action-dock {
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 42 !important;
    display: grid !important;
    grid-template-columns: 76px minmax(0, 1fr) 76px !important;
    gap: 10px !important;
    align-items: center !important;
    min-height: calc(88px + env(safe-area-inset-bottom)) !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #080b12 !important;
    padding: 12px 12px max(12px, env(safe-area-inset-bottom)) !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-action-dock button {
    min-width: 0 !important;
    min-height: 54px !important;
    border-radius: 10px !important;
    box-shadow: none !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .photo-small-action,
  .driver-v85 #captureScreen:not(.hidden) .secondary {
    border: 1px solid rgba(255, 255, 255, .2) !important;
    background: #171e2a !important;
    color: #fff !important;
    padding: 0 8px !important;
    font-size: 12px !important;
  }

  .driver-v85 #captureScreen:not(.hidden) #previousPhoto {
    grid-column: 1 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) #capturePhoto {
    grid-column: 2 !important;
    width: 100% !important;
    height: 56px !important;
    min-height: 56px !important;
    border: 0 !important;
    border-radius: 10px !important;
    background: var(--driver-accent) !important;
    color: #fff !important;
    padding: 0 14px !important;
    font-size: 16px !important;
    font-weight: 850 !important;
  }

  .driver-v85 #captureScreen:not(.hidden)[data-capture-state="review"] #capturePhoto {
    width: 100% !important;
    min-width: 0 !important;
    background: #fff !important;
    color: #101828 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) #retakePhoto:not(.hidden) {
    display: block !important;
    grid-column: 1 !important;
  }

  .driver-v85 #captureScreen:not(.hidden):has(#retakePhoto:not(.hidden)) #previousPhoto {
    display: none !important;
  }

  .driver-v85 #captureScreen:not(.hidden) #zoomPhoto:not(.hidden) {
    display: block !important;
    grid-column: 3 !important;
  }

  .driver-v85 #captureScreen:not(.hidden) .inspection-drawer {
    display: none !important;
  }
}

@media (min-width: 760px) {
  .driver-v85 .driver-shell {
    width: min(100%, 1100px) !important;
    padding-top: 28px !important;
  }

  .driver-v85 .driver-home {
    width: min(100%, 680px) !important;
    margin: 0 auto !important;
  }

  .driver-v85 .capture-screen:not(.hidden) {
    width: 100% !important;
  }
}
`;
}
await fs.writeFile(driverCssPath, driverCss);

let adminJs = await fs.readFile(runtimeAdminPath, "utf8").catch(() => fs.readFile(adminPath, "utf8"));
if (!adminJs.includes("const SITE_DAILY_DAYS = 7;")) {
  adminJs = adminJs.replace(
    'const FALLBACK_SITE = "UNASSIGNED";',
    'const FALLBACK_SITE = "UNASSIGNED";\nconst SITE_DAILY_DAYS = 7;'
  );
}
adminJs = adminJs.replace(
  "let fleetVehicles = [];",
  "let fleetVehicles = [];\nlet fleetVehiclesLoading = null;"
);
adminJs = adminJs.replace(
  '  fleetVehicleCount: document.querySelector("#fleetVehicleCount"),',
  [
    '  fleetVehicleCount: document.querySelector("#fleetVehicleCount"),',
    '  fleetVehicleStatus: document.querySelector("#fleetVehicleStatus"),',
    '  refreshFleetVehicles: document.querySelector("#refreshFleetVehicles"),',
  ].join("\n")
);
adminJs = adminJs.replace(
  '  nodes.fleetVehicleList?.addEventListener("click", handleFleetVehicleAction);',
  [
    '  nodes.fleetVehicleList?.addEventListener("click", handleFleetVehicleAction);',
    '  nodes.refreshFleetVehicles?.addEventListener("click", loadFleetVehicles);',
    '  document.addEventListener("fleetinspect:open-fleet", loadFleetVehicles);',
  ].join("\n")
);
adminJs = adminJs.replace(
  "  applyRoleUi();\n  nodes.dispatcherPassword.value = \"\";",
  "  applyRoleUi();\n  window.setTimeout(() => loadFleetVehicles(), 0);\n  nodes.dispatcherPassword.value = \"\";"
);
if (!adminJs.includes('const OPERATION_TIME_ZONE = "Europe/Berlin";')) {
  adminJs = adminJs.replace(
    'const FALLBACK_SITE = "UNASSIGNED";',
    'const FALLBACK_SITE = "UNASSIGNED";\nconst OPERATION_TIME_ZONE = "Europe/Berlin";'
  );
}
adminJs = adminJs.replace(
  "  const todayKey = new Date().toISOString().slice(0, 10);",
  "  const todayKey = localDateKey(new Date());"
);
adminJs = adminJs.replace(
  /function localDateKey\(value\) \{[\s\S]*?\n\}/,
  `function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: OPERATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return \`${"${parts.year}-${parts.month}-${parts.day}"}\`;
}`
);
adminJs = adminJs
  .replace("  const allGroups = groupByPlate(siteItems);", "  const allGroups = groupByPlate(items);")
  .replace("nodes.metricInspections.textContent = String(siteItems.length);", "nodes.metricInspections.textContent = String(items.length);")
  .replace("nodes.metricPhotos.textContent = String(siteItems.reduce", "nodes.metricPhotos.textContent = String(items.reduce")
  .replace("const alertCount = siteItems.filter", "const alertCount = items.filter")
  .replace(
    /nodes\.metricToday\.textContent = String\([^\n]+\);/,
    'nodes.metricToday.textContent = String(items.filter((item) => localDateKey(new Date(item.finishedAt || item.startedAt || 0)) === todayKey).length);'
  )
  .replace("  renderControlRoom(siteItems);", "  renderControlRoom(items);")
  .replace("  renderOperationsBoard(siteItems);", "  renderOperationsBoard(items);")
  .replace("  renderDataCommandCenter(siteItems);", "  renderDataCommandCenter(items);")
  .replace("  renderAlerts(items.length ? items : siteItems);", "  renderAlerts(items);")
  .replace("  renderAiStatusSummary(siteItems);", "  renderAiStatusSummary(items);")
  .replace("  renderDriverSummary(siteItems);", "  renderDriverSummary(items);")
  .replace("  renderRecentActivity(siteItems);", "  renderRecentActivity(items);");
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

const synchronizedAdminFleetLoader = [
  "async function loadFleetVehicles() {",
  "  if (!nodes.fleetVehicleList) return [];",
  "  if (fleetVehiclesLoading) return fleetVehiclesLoading;",
  "",
  "  nodes.fleetVehicleList.setAttribute(\"aria-busy\", \"true\");",
  "  if (!fleetVehicles.length) {",
  "    nodes.fleetVehicleList.innerHTML = `<article class=\"fleet-loading-state\">Cargando matrículas de Driver...</article>`;",
  "  }",
  "  if (nodes.fleetVehicleStatus) {",
  "    nodes.fleetVehicleStatus.textContent = \"Sincronizando con Driver...\";",
  "    nodes.fleetVehicleStatus.dataset.state = \"loading\";",
  "  }",
  "  if (nodes.refreshFleetVehicles) nodes.refreshFleetVehicles.disabled = true;",
  "",
  "  fleetVehiclesLoading = (async () => {",
  "    try {",
  "      const response = await fetch(\"/api/vehicles?ts=\" + Date.now(), { cache: \"no-store\" });",
  "      const result = await response.json();",
  "      if (!response.ok || result.ok === false || !Array.isArray(result.vehicles)) {",
  "        throw new Error(result.error || \"No se pudo cargar la flota.\");",
  "      }",
  "      fleetVehicles = result.vehicles;",
  "      renderFleetVehicles();",
  "      if (nodes.fleetVehicleStatus) {",
  "        nodes.fleetVehicleStatus.textContent = `${fleetVehicles.length} matrículas visibles en Driver · actualizado ${formatTime(new Date())}`;",
  "        nodes.fleetVehicleStatus.dataset.state = \"ready\";",
  "      }",
  "      return fleetVehicles;",
  "    } catch (error) {",
  "      if (nodes.fleetVehicleStatus) {",
  "        nodes.fleetVehicleStatus.textContent = error.message || \"No se pudo sincronizar la flota.\";",
  "        nodes.fleetVehicleStatus.dataset.state = \"error\";",
  "      }",
  "      if (fleetVehicles.length) renderFleetVehicles();",
  "      else nodes.fleetVehicleList.innerHTML = `<article class=\"empty-state\">${escapeHtml(error.message || \"No se pudo cargar la flota.\")}</article>`;",
  "      return fleetVehicles;",
  "    } finally {",
  "      nodes.fleetVehicleList.removeAttribute(\"aria-busy\");",
  "      if (nodes.refreshFleetVehicles) nodes.refreshFleetVehicles.disabled = false;",
  "    }",
  "  })();",
  "",
  "  try {",
  "    return await fleetVehiclesLoading;",
  "  } finally {",
  "    fleetVehiclesLoading = null;",
  "  }",
  "}",
].join("\n");

adminJs = adminJs.replace(
  /async function loadFleetVehicles\(\) \{[\s\S]*?\n\}\n\nfunction renderFleetVehicles/,
  `${synchronizedAdminFleetLoader}\n\nfunction renderFleetVehicles`
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
  "      <strong class=\"fleet-vehicle-plate\">${escapeHtml(vehicle.plate)}</strong>",
  "      <span class=\"fleet-vehicle-site\">${escapeHtml(vehicle.site === \"all\" ? \"DRP3 + DSU1\" : siteLabel(vehicle.site))}</span>",
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

const fleetVehicleAddHandler = [
  "async function addFleetVehicle() {",
  "  if (!canEditOperations()) {",
  "    alert(t(\"readonlyMode\"));",
  "    return;",
  "  }",
  "",
  "  const plate = normalizeFleetVehiclePlate(nodes.fleetVehiclePlate?.value || \"\");",
  "  const site = normalizeSite(nodes.fleetVehicleSite?.value || \"all\");",
  "  if (!plate) {",
  "    alert(\"Escribe una matrícula válida.\");",
  "    nodes.fleetVehiclePlate?.focus();",
  "    return;",
  "  }",
  "",
  "  nodes.addFleetVehicle.disabled = true;",
  "  if (nodes.fleetVehicleStatus) {",
  "    nodes.fleetVehicleStatus.textContent = `Añadiendo ${plate} a Driver...`;",
  "    nodes.fleetVehicleStatus.dataset.state = \"loading\";",
  "  }",
  "  try {",
  "    const response = await fetch(\"/api/admin/vehicles\", {",
  "      method: \"POST\",",
  "      headers: { \"Content-Type\": \"application/json\" },",
  "      body: JSON.stringify({ plate, site }),",
  "    });",
  "    const result = await response.json();",
  "    if (!response.ok || result.ok === false) throw new Error(result.error || \"No se pudo guardar el vehículo.\");",
  "    nodes.fleetVehiclePlate.value = \"\";",
  "    fleetVehicles = Array.isArray(result.vehicles) ? result.vehicles : fleetVehicles;",
  "    renderFleetVehicles();",
  "    await loadFleetVehicles();",
  "    renderDailyVehicleControl();",
  "  } catch (error) {",
  "    alert(error.message || \"No se pudo guardar el vehículo.\");",
  "    if (nodes.fleetVehicleStatus) {",
  "      nodes.fleetVehicleStatus.textContent = error.message || \"No se pudo guardar el vehículo.\";",
  "      nodes.fleetVehicleStatus.dataset.state = \"error\";",
  "    }",
  "  } finally {",
  "    nodes.addFleetVehicle.disabled = false;",
  "  }",
  "}",
].join("\n");

adminJs = adminJs.replace(
  /async function addFleetVehicle\(\) \{[\s\S]*?\n\}\n\nasync function handleFleetVehicleAction/,
  `${fleetVehicleAddHandler}\n\nasync function handleFleetVehicleAction`
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
  "  if (nodes.fleetVehicleStatus) {",
  "    nodes.fleetVehicleStatus.textContent = `Quitando ${plate} de Driver...`;",
  "    nodes.fleetVehicleStatus.dataset.state = \"loading\";",
  "  }",
  "  try {",
  "    const response = await fetch(`/api/admin/vehicles/${encodeURIComponent(plate)}`, { method: \"DELETE\" });",
  "    const result = await response.json();",
  "    if (!response.ok || result.ok === false) throw new Error(result.error || \"No se pudo quitar el vehiculo.\");",
  "    fleetVehicles = Array.isArray(result.vehicles) ? result.vehicles : fleetVehicles;",
  "    renderFleetVehicles();",
  "    await loadFleetVehicles();",
  "    renderDailyVehicleControl();",
  "  } catch (error) {",
  "    alert(error.message || \"No se pudo quitar el vehiculo.\");",
  "    if (nodes.fleetVehicleStatus) {",
  "      nodes.fleetVehicleStatus.textContent = error.message || \"No se pudo quitar el vehículo.\";",
  "      nodes.fleetVehicleStatus.dataset.state = \"error\";",
  "    }",
  "    button.disabled = false;",
  "  }",
  "}",
].join("\n");

adminJs = adminJs.replace(
  /async function handleFleetVehicleAction\(event\) \{[\s\S]*?\n\}\n\nfunction normalizeFleetVehiclePlate/,
  `${fleetVehicleActionHandler}\n\nfunction normalizeFleetVehiclePlate`
);
await fs.writeFile(adminPath, adminJs);
await fs.writeFile(runtimeAdminPath, adminJs);

let adminHtml = await fs.readFile(runtimeAdminHtmlPath, "utf8").catch(() => fs.readFile(adminHtmlPath, "utf8"));
const cleanNavHtml = `    <nav class="fleet-nav" aria-label="Admin navigation">
     <section class="nav-group">
      <p>Operación</p>
      <a class="active" href="#overview" data-admin-view-target="overview" title="Resumen"><span>⌂</span><b>Resumen</b><small>Actividad de hoy</small></a>
      <a href="#inspections" data-admin-view-target="inspections" title="Inspecciones"><span>▦</span><b>Inspecciones</b><small>Control e historial</small></a>
      <a href="#alerts" data-admin-view-target="alerts" title="Alertas IA"><span>△</span><b data-i18n="aiAlerts">Alertas IA</b><small>Revisión prioritaria</small></a>
     </section>
     <section class="nav-group">
      <p>Gestión</p>
      <a href="#fleet" data-admin-view-target="fleet" title="Flota driver"><span>▤</span><b>Flota driver</b><small>Añadir o quitar</small></a>
      <a id="userManagementNav" class="hidden" href="#users" data-admin-view-target="users" title="Usuarios"><span>◎</span><b data-i18n="userManagement">Usuarios</b><small>Roles y permisos</small></a>
     </section>
     <section class="nav-group">
      <p>Administración</p>
      <a href="#reports" data-admin-view-target="reports" title="Reportes"><span>▧</span><b data-i18n="reports">Reportes</b><small>PDF y exportación</small></a>
      <a href="#system" data-admin-view-target="system" title="Sistema"><span>◉</span><b>Sistema</b><small>Estado y actividad</small></a>
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
         <div class="fleet-vehicle-statusbar">
          <span id="fleetVehicleStatus" data-state="loading" aria-live="polite">Cargando matrículas de Driver...</span>
          <button id="refreshFleetVehicles" type="button">Actualizar lista</button>
         </div>
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
         <p class="fleet-vehicle-note">Esta es la misma lista que aparece en la app Driver. Añadir o quitar aquí actualiza su selector automáticamente.</p>
         <div class="fleet-vehicle-list-head" aria-hidden="true">
          <span>Matrícula</span>
          <span>Site</span>
          <span>Acción</span>
         </div>
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
    const viewContent = {
     overview: [".admin-filter-panel", ".control-room-strip", "#siteOverview", ".metrics"],
     inspections: ["#dailyVehicleControl", "#vehicleSummary", "#vehicleHistoryPlate"],
     fleet: ["#fleetVehicleManagement"],
     alerts: [".admin-filter-panel", "#alertList", "#aiStatusSummary"],
     users: ["#userManagement"],
     reports: [".admin-filter-panel", "#reportList"],
     system: ["#systemStatus", "#driverSummary", "#recentActivity", "#auditWidget"],
    };
    const viewTitles = {
     overview: ["Resumen operativo", "Estado de la flota y actividad de hoy"],
     inspections: ["Inspecciones", "Control diario e historial por vehículo"],
     fleet: ["Flota del conductor", "Vehículos disponibles en la app driver"],
     alerts: ["Alertas IA", "Inspecciones que necesitan revisión"],
     users: ["Usuarios y permisos", "Accesos del equipo de operaciones"],
     reports: ["Reportes", "Consulta, exportación y cierre diario"],
     system: ["Estado del sistema", "Servicios, actividad y sincronización"],
    };

    const applySidebarState = () => {
     const stored = localStorage.getItem("fleetinspect_admin_sidebar");
     const isOpen = stored !== "closed";
     document.body.classList.toggle("admin-sidebar-open", isOpen);
     document.querySelector(".menu-button")?.setAttribute("aria-expanded", String(isOpen));
    };

    const markViewElements = () => {
     Object.entries(viewContent).forEach(([view, selectors]) => {
      selectors.forEach((selector) => {
       document.querySelectorAll(selector).forEach((node) => {
        const target = node.matches(".dashboard-widget, .admin-filter-panel, .control-room-strip, .site-overview-grid, .metrics")
         ? node
         : node.closest(".dashboard-widget");
        if (target) {
         const views = new Set(String(target.dataset.adminView || "").split(" ").filter(Boolean));
         views.add(view);
         target.dataset.adminView = [...views].join(" ");
        }
       });
      });
     });
    };

    const activateView = (requestedView, updateHash = true) => {
     const view = viewTitles[requestedView] ? requestedView : "overview";
     document.body.dataset.adminView = view;
     document.querySelectorAll("[data-admin-view]").forEach((node) => {
      const views = String(node.dataset.adminView || "").split(" ");
      node.classList.toggle("admin-view-hidden", !views.includes(view));
     });
     document.querySelectorAll("[data-admin-view-target]").forEach((link) => {
      const active = link.dataset.adminViewTarget === view;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
     });
     const [title, subtitle] = viewTitles[view];
     const titleNode = document.querySelector(".admin-command-header h2");
     const subtitleNode = document.querySelector(".admin-command-header .eyebrow");
     if (titleNode) titleNode.textContent = title;
     if (subtitleNode) subtitleNode.textContent = subtitle;
     localStorage.setItem("fleetinspect_admin_view", view);
     if (updateHash) history.replaceState(null, "", "#" + view);
     if (view === "fleet") document.dispatchEvent(new CustomEvent("fleetinspect:open-fleet"));
     window.scrollTo({ top: 0, behavior: "smooth" });
    };

    applySidebarState();

    document.addEventListener("DOMContentLoaded", () => {
     markViewElements();
     const hashView = location.hash.replace("#", "");
     activateView(viewTitles[hashView] ? hashView : (localStorage.getItem("fleetinspect_admin_view") || "overview"), false);
    });

    document.addEventListener("click", (event) => {
     const menuButton = event.target.closest(".menu-button");
     if (menuButton) {
      const nextOpen = !document.body.classList.contains("admin-sidebar-open");
      document.body.classList.toggle("admin-sidebar-open", nextOpen);
      localStorage.setItem("fleetinspect_admin_sidebar", nextOpen ? "open" : "closed");
      menuButton.setAttribute("aria-expanded", String(nextOpen));
      return;
     }

     const viewLink = event.target.closest("[data-admin-view-target]");
     if (viewLink) {
      event.preventDefault();
      activateView(viewLink.dataset.adminViewTarget);
      if (window.innerWidth < 900) {
       document.body.classList.remove("admin-sidebar-open");
      }
      return;
     }

     const usersLink = event.target.closest("#userManagementTopLink");
     if (usersLink) {
      event.preventDefault();
      activateView("users");
     }
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

const organizedCss = `
  <style id="admin-organized-v89-styles">
   .admin-body.admin-organized-v89 {
    --admin-bg:#f4f7fa;
    --admin-panel:#ffffff;
    --admin-line:#dbe3eb;
    --admin-line-soft:#e9eef3;
    --admin-text:#152033;
    --admin-muted:#637083;
    --admin-navy:#0b1724;
    --admin-navy-soft:#14283a;
    --admin-blue:#155b91;
    --admin-orange:#ef8b17;
    background:var(--admin-bg)!important;
    color:var(--admin-text)!important;
    font-size:13px!important;
   }

   .admin-body.admin-organized-v89 .admin-shell {
    display:grid!important;
    grid-template-columns:68px minmax(0,1fr)!important;
    min-height:100vh!important;
    transition:grid-template-columns .2s ease!important;
   }

   .admin-body.admin-organized-v89.admin-sidebar-open .admin-shell {
    grid-template-columns:248px minmax(0,1fr)!important;
   }

   .admin-body.admin-organized-v89 .fleet-sidebar {
    position:sticky!important;
    top:0!important;
    z-index:120!important;
    width:auto!important;
    height:100vh!important;
    min-height:100vh!important;
    padding:14px 10px!important;
    overflow:hidden auto!important;
    border:0!important;
    background:var(--admin-navy)!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .fleet-logo {
    display:grid!important;
    grid-template-columns:40px minmax(0,1fr)!important;
    align-items:center!important;
    gap:11px!important;
    min-height:46px!important;
    margin:0 0 20px!important;
    padding:3px!important;
    border:0!important;
    background:transparent!important;
   }

   .admin-body.admin-organized-v89 .fleet-logo img {
    width:40px!important;
    height:40px!important;
    border-radius:8px!important;
    background:#fff!important;
    padding:4px!important;
    object-fit:contain!important;
   }

   .admin-body.admin-organized-v89 .fleet-logo p {
    overflow:hidden!important;
    max-width:0!important;
    margin:0!important;
    color:#fff!important;
    font-size:14px!important;
    font-weight:800!important;
    letter-spacing:0!important;
    white-space:nowrap!important;
    opacity:0!important;
    transition:max-width .2s ease,opacity .15s ease!important;
   }

   .admin-body.admin-organized-v89.admin-sidebar-open .fleet-logo p {
    max-width:170px!important;
    opacity:1!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav {
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:18px!important;
    margin:0!important;
   }

   .admin-body.admin-organized-v89 .nav-group {
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:5px!important;
    padding:0 0 14px!important;
    border:0!important;
    border-bottom:1px solid rgba(255,255,255,.08)!important;
   }

   .admin-body.admin-organized-v89 .nav-group:last-child {
    border-bottom:0!important;
   }

   .admin-body.admin-organized-v89 .nav-group > p {
    display:block!important;
    overflow:hidden!important;
    max-width:0!important;
    height:15px!important;
    margin:0 0 4px 50px!important;
    color:#8092a5!important;
    font-size:10px!important;
    font-weight:800!important;
    letter-spacing:.08em!important;
    text-transform:uppercase!important;
    white-space:nowrap!important;
    opacity:0!important;
   }

   .admin-body.admin-organized-v89.admin-sidebar-open .nav-group > p {
    max-width:160px!important;
    opacity:1!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a {
    display:grid!important;
    grid-template-columns:40px minmax(0,1fr)!important;
    grid-template-rows:auto auto!important;
    align-items:center!important;
    column-gap:10px!important;
    width:100%!important;
    min-height:44px!important;
    padding:3px!important;
    border:0!important;
    border-radius:8px!important;
    background:transparent!important;
    color:#aebdca!important;
    text-decoration:none!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a > span {
    display:grid!important;
    grid-row:1 / span 2!important;
    width:40px!important;
    height:38px!important;
    place-items:center!important;
    border:0!important;
    border-radius:7px!important;
    background:rgba(255,255,255,.055)!important;
    color:#cfdae4!important;
    font-size:17px!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a b,
   .admin-body.admin-organized-v89 .fleet-nav a small {
    display:block!important;
    overflow:hidden!important;
    max-width:0!important;
    opacity:0!important;
    white-space:nowrap!important;
    text-overflow:ellipsis!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a b {
    color:#f8fafc!important;
    font-size:13px!important;
    font-weight:800!important;
    line-height:1.2!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a small {
    margin-top:2px!important;
    color:#8295a8!important;
    font-size:10px!important;
    font-weight:600!important;
    line-height:1.1!important;
   }

   .admin-body.admin-organized-v89.admin-sidebar-open .fleet-nav a b,
   .admin-body.admin-organized-v89.admin-sidebar-open .fleet-nav a small {
    max-width:165px!important;
    opacity:1!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a:hover {
    background:rgba(255,255,255,.06)!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a.active {
    background:#17314a!important;
    color:#fff!important;
   }

   .admin-body.admin-organized-v89 .fleet-nav a.active > span {
    background:var(--admin-orange)!important;
    color:#fff!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .admin-workspace {
    min-width:0!important;
    background:var(--admin-bg)!important;
   }

   .admin-body.admin-organized-v89 .fleet-topbar {
    position:sticky!important;
    top:0!important;
    z-index:100!important;
    display:flex!important;
    min-height:58px!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:14px!important;
    padding:8px 18px!important;
    border:0!important;
    border-bottom:1px solid var(--admin-line)!important;
    background:rgba(255,255,255,.97)!important;
    box-shadow:none!important;
    backdrop-filter:blur(12px)!important;
   }

   .admin-body.admin-organized-v89 .topbar-left,
   .admin-body.admin-organized-v89 .topbar-actions {
    display:flex!important;
    align-items:center!important;
    gap:8px!important;
   }

   .admin-body.admin-organized-v89 .menu-button {
    display:grid!important;
    width:38px!important;
    height:38px!important;
    min-height:38px!important;
    place-items:center!important;
    padding:0!important;
    border:1px solid var(--admin-line)!important;
    border-radius:8px!important;
    background:#fff!important;
    color:var(--admin-text)!important;
    font-size:17px!important;
   }

   .admin-body.admin-organized-v89 .topbar-company-logo {
    width:78px!important;
    height:34px!important;
    object-fit:contain!important;
   }

   .admin-body.admin-organized-v89 .global-search {
    width:min(430px,36vw)!important;
    min-height:38px!important;
    border:1px solid var(--admin-line)!important;
    border-radius:8px!important;
    background:#f8fafc!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .global-search input {
    font-size:13px!important;
   }

   .admin-body.admin-organized-v89 .sync-chip,
   .admin-body.admin-organized-v89 .user-chip,
   .admin-body.admin-organized-v89 .role-chip,
   .admin-body.admin-organized-v89 .language-select,
   .admin-body.admin-organized-v89 .icon-button,
   .admin-body.admin-organized-v89 .user-admin-link {
    min-height:34px!important;
    padding:6px 9px!important;
    border:1px solid var(--admin-line)!important;
    border-radius:8px!important;
    background:#fff!important;
    color:#24415f!important;
    font-size:11px!important;
    font-weight:750!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .role-chip {
    border-color:#fed7aa!important;
    background:#fff8ed!important;
    color:#9a3412!important;
   }

   .admin-body.admin-organized-v89 .dashboard-main {
    display:block!important;
    width:100%!important;
    max-width:1640px!important;
    margin:0 auto!important;
    padding:22px 24px 40px!important;
   }

   .admin-body.admin-organized-v89 .admin-hero {
    display:none!important;
   }

   .admin-body.admin-organized-v89 .hero-dashboard {
    overflow:visible!important;
    border:0!important;
    border-radius:0!important;
    background:transparent!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .admin-command-header {
    display:flex!important;
    min-height:64px!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:18px!important;
    margin:0 0 14px!important;
    padding:0!important;
    border:0!important;
    background:transparent!important;
   }

   .admin-body.admin-organized-v89 .admin-command-header .eyebrow {
    margin:0 0 3px!important;
    color:var(--admin-muted)!important;
    font-size:12px!important;
    font-weight:600!important;
    letter-spacing:0!important;
    text-transform:none!important;
   }

   .admin-body.admin-organized-v89 .admin-command-header h2 {
    margin:0!important;
    color:var(--admin-text)!important;
    font-size:26px!important;
    line-height:1.1!important;
    letter-spacing:0!important;
   }

   .admin-body.admin-organized-v89 .dashboard-actions {
    display:none!important;
    flex-wrap:wrap!important;
    justify-content:flex-end!important;
    gap:7px!important;
   }

   .admin-body.admin-organized-v89[data-admin-view="reports"] .dashboard-actions {
    display:flex!important;
   }

   .admin-body.admin-organized-v89 .dashboard-actions button {
    min-height:34px!important;
    padding:6px 10px!important;
    border:1px solid var(--admin-line)!important;
    border-radius:7px!important;
    background:#fff!important;
    color:var(--admin-text)!important;
    font-size:11px!important;
    font-weight:750!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .dashboard-actions .strong-action {
    border-color:var(--admin-orange)!important;
    background:var(--admin-orange)!important;
    color:#fff!important;
   }

   .admin-body.admin-organized-v89 #dashboardContent {
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    gap:14px!important;
    padding:0!important;
    background:transparent!important;
   }

   .admin-body.admin-organized-v89 #dashboardContent.hidden,
   .admin-body.admin-organized-v89 .dashboard-widget.hidden,
   .admin-body.admin-organized-v89 .admin-view-hidden {
    display:none!important;
   }

   .admin-body.admin-organized-v89 .admin-filter-panel {
    display:grid!important;
    grid-template-columns:190px minmax(250px,1fr) 210px 90px!important;
    gap:0!important;
    margin:0!important;
    overflow:hidden!important;
    border:1px solid var(--admin-line)!important;
    border-radius:10px!important;
    background:var(--admin-panel)!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .admin-filter-panel > label,
   .admin-body.admin-organized-v89 .admin-filter-panel > article {
    min-height:64px!important;
    padding:10px 12px!important;
    border:0!important;
    border-right:1px solid var(--admin-line-soft)!important;
    border-radius:0!important;
    background:#fff!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .admin-filter-panel > *:last-child {
    border-right:0!important;
   }

   .admin-body.admin-organized-v89 .admin-filter-panel span,
   .admin-body.admin-organized-v89 .control-room-strip span,
   .admin-body.admin-organized-v89 .metrics span {
    color:var(--admin-muted)!important;
    font-size:10px!important;
    font-weight:800!important;
    letter-spacing:.03em!important;
    text-transform:uppercase!important;
   }

   .admin-body.admin-organized-v89 .admin-filter-panel select {
    min-height:28px!important;
    border:0!important;
    background:transparent!important;
    padding:0!important;
    color:var(--admin-text)!important;
    font-size:13px!important;
    font-weight:750!important;
   }

   .admin-body.admin-organized-v89 .admin-filter-panel strong {
    color:var(--admin-text)!important;
    font-size:22px!important;
   }

   .admin-body.admin-organized-v89 .control-room-strip,
   .admin-body.admin-organized-v89 .metrics {
    display:grid!important;
    gap:0!important;
    margin:0!important;
    overflow:hidden!important;
    border:1px solid var(--admin-line)!important;
    border-radius:10px!important;
    background:#fff!important;
   }

   .admin-body.admin-organized-v89 .control-room-strip {
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
   }

   .admin-body.admin-organized-v89 .metrics {
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
   }

   .admin-body.admin-organized-v89 .control-room-strip article,
   .admin-body.admin-organized-v89 .metrics article {
    min-height:76px!important;
    padding:13px 15px!important;
    border:0!important;
    border-right:1px solid var(--admin-line-soft)!important;
    border-radius:0!important;
    background:#fff!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .control-room-strip article:last-child,
   .admin-body.admin-organized-v89 .metrics article:last-child {
    border-right:0!important;
   }

   .admin-body.admin-organized-v89 .control-room-strip strong,
   .admin-body.admin-organized-v89 .metrics strong {
    margin-top:5px!important;
    color:var(--admin-text)!important;
    font-size:25px!important;
    line-height:1!important;
   }

   .admin-body.admin-organized-v89 .control-room-strip small {
    margin-top:5px!important;
    color:var(--admin-muted)!important;
    font-size:10px!important;
   }

   .admin-body.admin-organized-v89 .site-overview-grid {
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:14px!important;
    margin:0!important;
   }

   .admin-body.admin-organized-v89 .site-overview-panel {
    display:grid!important;
    grid-template-columns:1fr!important;
    min-height:0!important;
    padding:0!important;
    overflow:hidden!important;
    border:1px solid var(--admin-line)!important;
    border-radius:10px!important;
    background:#fff!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .site-overview-head {
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-rows:auto auto!important;
    align-items:center!important;
    min-height:68px!important;
    padding:12px 15px!important;
    border:0!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    border-radius:0!important;
    background:#fff!important;
    color:var(--admin-text)!important;
    text-align:left!important;
   }

   .admin-body.admin-organized-v89 .site-overview-head span {
    color:var(--admin-text)!important;
    font-size:14px!important;
    font-weight:850!important;
   }

   .admin-body.admin-organized-v89 .site-overview-head strong {
    grid-row:1 / span 2!important;
    grid-column:2!important;
    color:var(--admin-blue)!important;
    font-size:30px!important;
    line-height:1!important;
   }

   .admin-body.admin-organized-v89 .site-overview-head small {
    color:var(--admin-muted)!important;
    font-size:10px!important;
    font-weight:650!important;
   }

   .admin-body.admin-organized-v89 .site-inspection-table {
    display:grid!important;
    align-content:start!important;
    max-height:248px!important;
    overflow:auto!important;
    gap:0!important;
    padding:0!important;
   }

   .admin-body.admin-organized-v89 .site-inspection-row {
    display:grid!important;
    grid-template-columns:120px minmax(0,1fr) 50px!important;
    align-items:center!important;
    gap:10px!important;
    min-height:38px!important;
    padding:8px 15px!important;
    border:0!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    border-radius:0!important;
    background:#fff!important;
    color:var(--admin-text)!important;
    text-decoration:none!important;
   }

   .admin-body.admin-organized-v89 .site-inspection-row:hover {
    background:#f7fafc!important;
   }

   .admin-body.admin-organized-v89 .site-inspection-row strong {
    color:var(--admin-text)!important;
    font-size:12px!important;
    font-weight:850!important;
   }

   .admin-body.admin-organized-v89 .site-inspection-row span,
   .admin-body.admin-organized-v89 .site-inspection-row time,
   .admin-body.admin-organized-v89 .site-empty-line {
    color:var(--admin-muted)!important;
    font-size:11px!important;
    font-weight:650!important;
   }

   .admin-body.admin-organized-v89 .site-empty-line {
    margin:0!important;
    padding:24px 15px!important;
   }

   .admin-body.admin-organized-v89 .operations-board {
    display:none!important;
   }

   .admin-body.admin-organized-v89 .dashboard-card-grid {
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:14px!important;
    align-items:start!important;
   }

   .admin-body.admin-organized-v89 .dashboard-widget {
    overflow:hidden!important;
    border:1px solid var(--admin-line)!important;
    border-radius:10px!important;
    background:#fff!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .dashboard-widget.wide-widget,
   .admin-body.admin-organized-v89 #dailyVehicleControl,
   .admin-body.admin-organized-v89 #fleetVehicleManagement,
   .admin-body.admin-organized-v89 #userManagement {
    grid-column:1 / -1!important;
   }

   .admin-body.admin-organized-v89 .dashboard-widget > header {
    display:flex!important;
    min-height:58px!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:14px!important;
    padding:12px 15px!important;
    border:0!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    background:#fff!important;
   }

   .admin-body.admin-organized-v89 .dashboard-widget h3 {
    margin:0!important;
    color:var(--admin-text)!important;
    font-size:16px!important;
    line-height:1.2!important;
   }

   .admin-body.admin-organized-v89 .dashboard-widget header span {
    margin-top:3px!important;
    color:var(--admin-muted)!important;
    font-size:10px!important;
    font-weight:650!important;
    letter-spacing:0!important;
    text-transform:none!important;
   }

   .admin-body.admin-organized-v89 .primary-widget,
   .admin-body.admin-organized-v89 .vehicle-control-widget,
   .admin-body.admin-organized-v89 .fleet-vehicle-widget,
   .admin-body.admin-organized-v89 .user-management-widget,
   .admin-body.admin-organized-v89 .status-widget {
    border-top:1px solid var(--admin-line)!important;
   }

   .admin-body.admin-organized-v89 .vehicle-control-tools,
   .admin-body.admin-organized-v89 .fleet-vehicle-tools {
    display:grid!important;
    grid-template-columns:170px minmax(210px,1fr) 180px!important;
    align-items:end!important;
    gap:8px!important;
    padding:10px 15px!important;
    border:0!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    background:#f8fafc!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-tools {
    grid-template-columns:170px 190px 90px minmax(220px,1fr)!important;
   }

   .admin-body.admin-organized-v89 .vehicle-control-tools input,
   .admin-body.admin-organized-v89 .vehicle-control-tools select,
   .admin-body.admin-organized-v89 .fleet-vehicle-tools input,
   .admin-body.admin-organized-v89 .fleet-vehicle-tools select,
   .admin-body.admin-organized-v89 .fleet-vehicle-tools button {
    min-height:36px!important;
    border:1px solid var(--admin-line)!important;
    border-radius:7px!important;
    background:#fff!important;
    color:var(--admin-text)!important;
    font-size:12px!important;
    box-shadow:none!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-tools button {
    border-color:var(--admin-blue)!important;
    background:var(--admin-blue)!important;
    color:#fff!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-statusbar {
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:12px!important;
    min-height:44px!important;
    padding:8px 15px!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    background:#fff!important;
   }

   .admin-body.admin-organized-v89 #fleetVehicleStatus {
    display:flex!important;
    align-items:center!important;
    gap:8px!important;
    color:var(--admin-muted)!important;
    font-size:11px!important;
    font-weight:750!important;
   }

   .admin-body.admin-organized-v89 #fleetVehicleStatus::before {
    width:8px!important;
    height:8px!important;
    border-radius:50%!important;
    background:#94a3b8!important;
    content:""!important;
   }

   .admin-body.admin-organized-v89 #fleetVehicleStatus[data-state="ready"]::before { background:#0f8a72!important; }
   .admin-body.admin-organized-v89 #fleetVehicleStatus[data-state="error"]::before { background:#dc2626!important; }

   .admin-body.admin-organized-v89 #refreshFleetVehicles {
    min-height:32px!important;
    padding:6px 11px!important;
    border:1px solid var(--admin-line)!important;
    border-radius:6px!important;
    background:#fff!important;
    color:var(--admin-blue)!important;
    font-size:11px!important;
    font-weight:800!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-list-head {
    display:grid!important;
    grid-template-columns:minmax(150px,1fr) 150px 74px!important;
    gap:12px!important;
    padding:8px 15px!important;
    border-top:1px solid var(--admin-line-soft)!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    background:#f8fafc!important;
    color:var(--admin-muted)!important;
    font-size:9px!important;
    font-weight:850!important;
    text-transform:uppercase!important;
   }

   .admin-body.admin-organized-v89 .vehicle-control-summary {
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:0!important;
    margin:0!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
   }

   .admin-body.admin-organized-v89 .vehicle-control-summary article {
    min-height:62px!important;
    padding:10px 15px!important;
    border:0!important;
    border-right:1px solid var(--admin-line-soft)!important;
    border-radius:0!important;
    background:#fff!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-list {
    display:grid!important;
    grid-template-columns:1fr!important;
    max-height:520px!important;
    overflow:auto!important;
    gap:0!important;
    padding:0 15px 12px!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-row {
    display:grid!important;
    grid-template-columns:minmax(150px,1fr) 150px 74px!important;
    align-items:center!important;
    gap:12px!important;
    min-height:40px!important;
    padding:6px 0!important;
    border:0!important;
    border-bottom:1px solid var(--admin-line-soft)!important;
    border-radius:0!important;
    background:#fff!important;
   }

   .admin-body.admin-organized-v89 .fleet-vehicle-plate { color:var(--admin-text)!important; font-size:12px!important; }
   .admin-body.admin-organized-v89 .fleet-vehicle-site { color:var(--admin-muted)!important; font-size:11px!important; font-weight:650!important; }
   .admin-body.admin-organized-v89 .fleet-vehicle-row button {
    min-height:28px!important;
    padding:4px 8px!important;
    border:1px solid #fecaca!important;
    border-radius:5px!important;
    background:#fff!important;
    color:#b42318!important;
    font-size:10px!important;
    font-weight:800!important;
   }

   .admin-body.admin-organized-v89 .fleet-loading-state {
    padding:24px 0!important;
    color:var(--admin-muted)!important;
    font-size:12px!important;
    text-align:center!important;
   }

   .admin-body.admin-organized-v89 .report-list,
   .admin-body.admin-organized-v89 .vehicle-summary,
   .admin-body.admin-organized-v89 .alert-list,
   .admin-body.admin-organized-v89 .vehicle-control-list,
   .admin-body.admin-organized-v89 .status-list,
   .admin-body.admin-organized-v89 .driver-summary-list,
   .admin-body.admin-organized-v89 .activity-list,
   .admin-body.admin-organized-v89 .dispatcher-list,
   .admin-body.admin-organized-v89 .vehicle-history-list {
    max-height:620px!important;
    padding:10px 12px!important;
    gap:6px!important;
   }

   .admin-body.admin-organized-v89 .report-card,
   .admin-body.admin-organized-v89 .vehicle-tile,
   .admin-body.admin-organized-v89 .alert-card,
   .admin-body.admin-organized-v89 .dispatcher-row,
   .admin-body.admin-organized-v89 .activity-row,
   .admin-body.admin-organized-v89 .status-row,
   .admin-body.admin-organized-v89 .vehicle-control-row,
   .admin-body.admin-organized-v89 .history-row {
    padding:9px 11px!important;
    border:1px solid var(--admin-line-soft)!important;
    border-radius:7px!important;
    background:#fff!important;
    box-shadow:none!important;
   }

   @media (max-width:1100px) {
    .admin-body.admin-organized-v89 .sync-chip,
    .admin-body.admin-organized-v89 .user-chip,
    .admin-body.admin-organized-v89 .user-admin-link { display:none!important; }
    .admin-body.admin-organized-v89 .admin-filter-panel { grid-template-columns:repeat(2,minmax(0,1fr))!important; }
    .admin-body.admin-organized-v89 .control-room-strip,
    .admin-body.admin-organized-v89 .metrics { grid-template-columns:repeat(2,minmax(0,1fr))!important; }
    .admin-body.admin-organized-v89 .site-overview-grid,
    .admin-body.admin-organized-v89 .dashboard-card-grid { grid-template-columns:1fr!important; }
   }

   @media (max-width:900px) {
    .admin-body.admin-organized-v89 .admin-shell,
    .admin-body.admin-organized-v89.admin-sidebar-open .admin-shell { display:block!important; }
    .admin-body.admin-organized-v89 .fleet-sidebar {
     position:fixed!important;
     inset:0 auto 0 0!important;
     width:260px!important;
     height:100dvh!important;
     transform:translateX(-105%)!important;
     transition:transform .2s ease!important;
     box-shadow:0 24px 60px rgba(2,6,23,.28)!important;
    }
    .admin-body.admin-organized-v89.admin-sidebar-open .fleet-sidebar { transform:translateX(0)!important; }
    .admin-body.admin-organized-v89 .fleet-logo p,
    .admin-body.admin-organized-v89 .nav-group > p,
    .admin-body.admin-organized-v89 .fleet-nav a b,
    .admin-body.admin-organized-v89 .fleet-nav a small { max-width:170px!important; opacity:1!important; }
    .admin-body.admin-organized-v89 .fleet-nav { grid-template-columns:1fr!important; }
    .admin-body.admin-organized-v89 .fleet-topbar { padding:8px 12px!important; }
    .admin-body.admin-organized-v89 .topbar-company-logo { display:none!important; }
    .admin-body.admin-organized-v89 .global-search { width:min(52vw,420px)!important; }
    .admin-body.admin-organized-v89 .dashboard-main { padding:16px 12px 32px!important; }
   }

   @media (max-width:640px) {
    .admin-body.admin-organized-v89 .fleet-topbar { align-items:flex-start!important; }
    .admin-body.admin-organized-v89 .topbar-left { flex:1!important; min-width:0!important; }
    .admin-body.admin-organized-v89 .topbar-actions > :not(.language-select):not(.icon-button) { display:none!important; }
    .admin-body.admin-organized-v89 .global-search { width:100%!important; }
    .admin-body.admin-organized-v89 .admin-command-header { align-items:flex-start!important; }
    .admin-body.admin-organized-v89 .admin-command-header h2 { font-size:22px!important; }
    .admin-body.admin-organized-v89 .admin-filter-panel,
    .admin-body.admin-organized-v89 .control-room-strip,
    .admin-body.admin-organized-v89 .metrics,
    .admin-body.admin-organized-v89 .vehicle-control-summary,
    .admin-body.admin-organized-v89 .vehicle-control-tools,
    .admin-body.admin-organized-v89 .fleet-vehicle-tools { grid-template-columns:1fr!important; }
    .admin-body.admin-organized-v89 .admin-filter-panel > label,
    .admin-body.admin-organized-v89 .admin-filter-panel > article,
    .admin-body.admin-organized-v89 .control-room-strip article,
    .admin-body.admin-organized-v89 .metrics article,
    .admin-body.admin-organized-v89 .vehicle-control-summary article { border-right:0!important; border-bottom:1px solid var(--admin-line-soft)!important; }
    .admin-body.admin-organized-v89 .site-inspection-row { grid-template-columns:100px minmax(0,1fr) 45px!important; padding-inline:11px!important; }
    .admin-body.admin-organized-v89 .fleet-vehicle-list-head,
    .admin-body.admin-organized-v89 .fleet-vehicle-row { grid-template-columns:minmax(110px,1fr) 82px 62px!important; gap:6px!important; }
    .admin-body.admin-organized-v89 .fleet-vehicle-statusbar { align-items:flex-start!important; }
   }
  </style>
`;

adminHtml = adminHtml.replace("\n </head>", `${organizedCss}\n </head>`);

adminHtml = adminHtml.replace(/<body class="([^"]*)"/, (_match, className) => {
  const classes = new Set(`${className} admin-clean-v77 admin-organized-v89 admin-redesign-v92 admin-ops-v100`.split(/\s+/).filter(Boolean));
  return `<body class="${[...classes].join(" ")}"`;
});

adminHtml = adminHtml
  .replace('<p class="eyebrow" data-i18n="operationsOverview">Operations overview</p>', '<p class="eyebrow">Estado de la flota y actividad de hoy</p>')
  .replace('<h2 data-i18n="reports">Reports</h2>', '<h2>Resumen operativo</h2>');

if (!adminHtml.includes('href="/admin-v92.css')) {
  adminHtml = adminHtml.replace(
    "\n </head>",
    '  <link rel="stylesheet" href="/admin-v92.css?v=96" />\n\n </head>'
  );
}

if (!adminHtml.includes('href="/admin-v100.css')) {
  adminHtml = adminHtml.replace(
    "\n </head>",
    '  <link rel="stylesheet" href="/admin-v100.css?v=103" />\n\n </head>'
  );
}

const adminV92Script = `  <script id="admin-v92-ui">
   (() => {
    const copy = {
     es: { ready: "Operativa", error: "Revisar sistema", checking: "Comprobando", dark: "Modo oscuro", light: "Modo claro" },
     en: { ready: "Operational", error: "Check system", checking: "Checking", dark: "Dark mode", light: "Light mode" },
     de: { ready: "Betriebsbereit", error: "System prüfen", checking: "Prüfung", dark: "Dunkelmodus", light: "Hellmodus" },
     ro: { ready: "Operațional", error: "Verifică sistemul", checking: "Se verifică", dark: "Mod întunecat", light: "Mod luminos" },
    };

    const currentCopy = () => {
     const language = document.querySelector("[data-language-select]")?.value || "es";
     return copy[language] || copy.es;
    };

    const initialize = () => {
     const body = document.body;
     const actions = document.querySelector(".topbar-actions");
     const menuButton = document.querySelector(".menu-button");
     if (!body || !actions) return;

     let themeButton = document.querySelector("#adminThemeToggle");
     if (!themeButton) {
      themeButton = document.createElement("button");
      themeButton.id = "adminThemeToggle";
      themeButton.type = "button";
      themeButton.className = "icon-button";
      actions.insertBefore(themeButton, document.querySelector("#refreshDashboard"));
     }

     const setTheme = (theme) => {
      const dark = theme === "dark";
      body.classList.toggle("admin-theme-dark", dark);
      const label = dark ? currentCopy().light : currentCopy().dark;
      themeButton.textContent = dark ? "☀" : "☾";
      themeButton.title = label;
      themeButton.setAttribute("aria-label", label);
      themeButton.setAttribute("aria-pressed", String(dark));
     };

     let savedTheme = "light";
     try {
      savedTheme = localStorage.getItem("fleetinspect_admin_theme") || "light";
     } catch (_error) {}
     setTheme(savedTheme);

     themeButton.addEventListener("click", () => {
      const nextTheme = body.classList.contains("admin-theme-dark") ? "light" : "dark";
      try { localStorage.setItem("fleetinspect_admin_theme", nextTheme); } catch (_error) {}
      setTheme(nextTheme);
     });

     let health = document.querySelector("#adminSystemHealth");
     if (!health) {
      health = document.createElement("span");
      health.id = "adminSystemHealth";
      health.className = "system-health";
      health.innerHTML = '<span class="health-dot" aria-hidden="true"></span><span class="health-label"></span>';
      actions.insertBefore(health, document.querySelector("#lastSync"));
     }

     const storage = document.querySelector("#storagePill");
     const ai = document.querySelector("#aiPill");
     const syncHealth = () => {
      const services = [storage, ai].filter(Boolean);
      const isChecking = services.length < 2 || services.some((node) => !node.classList.contains("ready") && !node.classList.contains("warn"));
      const isReady = !isChecking && services.every((node) => node.classList.contains("ready"));
      const state = isChecking ? "checking" : (isReady ? "ready" : "error");
      health.dataset.state = state;
      health.querySelector(".health-label").textContent = currentCopy()[state];
     };

     [storage, ai].filter(Boolean).forEach((node) => {
      new MutationObserver(syncHealth).observe(node, { attributes: true, childList: true, characterData: true, subtree: true });
     });
     syncHealth();

     let backdrop = document.querySelector(".admin-sidebar-backdrop");
     if (!backdrop) {
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "admin-sidebar-backdrop";
      backdrop.tabIndex = -1;
      backdrop.setAttribute("aria-label", "Cerrar menú");
      body.appendChild(backdrop);
     }

     const closeMobileSidebar = () => {
      if (window.innerWidth > 900) return;
      body.classList.remove("admin-sidebar-open");
      menuButton?.setAttribute("aria-expanded", "false");
     };

     if (window.innerWidth <= 900) closeMobileSidebar();
     backdrop.addEventListener("click", closeMobileSidebar);
     window.addEventListener("resize", () => {
      if (window.innerWidth <= 900 && body.classList.contains("admin-sidebar-open")) closeMobileSidebar();
     });
     document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileSidebar();
     });
     document.querySelector("[data-language-select]")?.addEventListener("change", () => {
      setTheme(body.classList.contains("admin-theme-dark") ? "dark" : "light");
      syncHealth();
     });
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
    else initialize();
   })();
  </script>`;

if (!adminHtml.includes('id="admin-v92-ui"')) {
  adminHtml = adminHtml.replace("\n  <script src=\"/vehicles.js", `\n${adminV92Script}\n  <script src="/vehicles.js`);
}

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
adminHtml = adminHtml
  .replaceAll("/styles.css?v=79", "/styles.css?v=89")
  .replaceAll("/vehicles.js?v=79", "/vehicles.js?v=89")
  .replaceAll("/i18n.js?v=79", "/i18n.js?v=89")
  .replaceAll("/admin.js?v=79", "/admin.js?v=89");
adminHtml = adminHtml
  .replaceAll("/styles.css?v=89", "/styles.css?v=90")
  .replaceAll("/vehicles.js?v=89", "/vehicles.js?v=90")
  .replaceAll("/i18n.js?v=89", "/i18n.js?v=90")
  .replaceAll("/admin.js?v=89", "/admin.js?v=90");
adminHtml = adminHtml.replaceAll("?v=90", "?v=91").replaceAll("?v=91", "?v=100").replaceAll("?v=96", "?v=100");

if (!adminHtml.includes('src="/admin-v100.js')) {
  adminHtml = adminHtml.replace(
    "\n </body>",
    '  <script src="/admin-v100.js?v=103"></script>\n </body>'
  );
}

await fs.writeFile(adminHtmlPath, adminHtml);
await fs.writeFile(runtimeAdminHtmlPath, adminHtml);

let indexHtml = await fs.readFile(path.join(root, "index.html"), "utf8");
indexHtml = indexHtml
  .replace('class="driver-body driver-v72 driver-v74"', 'class="driver-body driver-v72 driver-v74 driver-v85"')
  .replace(" data-i18n=\"startPhotos\" disabled>Start photos</button>", " data-i18n=\"startPhotos\">Start photos</button>")
  .replaceAll('data-i18n="enterDetailsBeforeCamera"', 'data-i18n="enterDetails"')
  .replaceAll('data-i18n="driverCheckIn"', 'data-i18n="checkIn"')
  .replaceAll('data-i18n="vehicleRegistration"', 'data-i18n="registrationNumber"')
  .replaceAll('data-i18n-placeholder="optionalNotes"', 'data-i18n-placeholder="notesPlaceholder"')
  .replaceAll('data-i18n="guidedCapture"', 'data-i18n="captureStep"')
  .replaceAll('data-i18n="reset"', 'data-i18n="newReport"')
  .replaceAll('data-i18n="camera"', 'data-i18n="cameraLens"')
  .replaceAll('data-i18n="back"', 'data-i18n="previousPhoto"')
  .replaceAll('data-i18n="retake"', 'data-i18n="retakePhoto"')
  .replaceAll('data-i18n="zoom"', 'data-i18n="zoomPhoto"')
  .replaceAll("/styles.css?v=76", "/styles.css?v=80")
  .replaceAll("/driver-v74.css?v=76", "/driver-v74.css?v=80")
  .replaceAll("/i18n.js?v=76", "/i18n.js?v=80")
  .replaceAll("/vehicles.js?v=76", "/vehicles.js?v=80")
  .replaceAll("/app.js?v=76", "/app.js?v=80")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=76", "/driver-vehicles-fallback-v76.js?v=80")
  .replaceAll("/styles.css?v=80", "/styles.css?v=81")
  .replaceAll("/driver-v74.css?v=80", "/driver-v74.css?v=81")
  .replaceAll("/i18n.js?v=80", "/i18n.js?v=81")
  .replaceAll("/vehicles.js?v=80", "/vehicles.js?v=81")
  .replaceAll("/app.js?v=80", "/app.js?v=81")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=80", "/driver-vehicles-fallback-v76.js?v=81")
  .replaceAll("/styles.css?v=81", "/styles.css?v=82")
  .replaceAll("/driver-v74.css?v=81", "/driver-v74.css?v=82")
  .replaceAll("/i18n.js?v=81", "/i18n.js?v=82")
  .replaceAll("/vehicles.js?v=81", "/vehicles.js?v=82")
  .replaceAll("/app.js?v=81", "/app.js?v=82")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=81", "/driver-vehicles-fallback-v76.js?v=82")
  .replaceAll("/styles.css?v=82", "/styles.css?v=83")
  .replaceAll("/driver-v74.css?v=82", "/driver-v74.css?v=83")
  .replaceAll("/i18n.js?v=82", "/i18n.js?v=83")
  .replaceAll("/vehicles.js?v=82", "/vehicles.js?v=83")
  .replaceAll("/app.js?v=82", "/app.js?v=83")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=82", "/driver-vehicles-fallback-v76.js?v=83")
  .replaceAll("/styles.css?v=83", "/styles.css?v=84")
  .replaceAll("/driver-v74.css?v=83", "/driver-v74.css?v=84")
  .replaceAll("/i18n.js?v=83", "/i18n.js?v=84")
  .replaceAll("/vehicles.js?v=83", "/vehicles.js?v=84")
  .replaceAll("/app.js?v=83", "/app.js?v=84")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=83", "/driver-vehicles-fallback-v76.js?v=84")
  .replaceAll("/styles.css?v=84", "/styles.css?v=85")
  .replaceAll("/driver-v74.css?v=84", "/driver-v74.css?v=85")
  .replaceAll("/i18n.js?v=84", "/i18n.js?v=85")
  .replaceAll("/vehicles.js?v=84", "/vehicles.js?v=85")
  .replaceAll("/app.js?v=84", "/app.js?v=85")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=84", "/driver-vehicles-fallback-v76.js?v=85")
  .replaceAll("/styles.css?v=85", "/styles.css?v=86")
  .replaceAll("/driver-v74.css?v=85", "/driver-v74.css?v=86")
  .replaceAll("/i18n.js?v=85", "/i18n.js?v=86")
  .replaceAll("/vehicles.js?v=85", "/vehicles.js?v=86")
  .replaceAll("/app.js?v=85", "/app.js?v=86")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=85", "/driver-vehicles-fallback-v76.js?v=86")
  .replaceAll("/styles.css?v=86", "/styles.css?v=87")
  .replaceAll("/driver-v74.css?v=86", "/driver-v74.css?v=87")
  .replaceAll("/i18n.js?v=86", "/i18n.js?v=87")
  .replaceAll("/vehicles.js?v=86", "/vehicles.js?v=87")
  .replaceAll("/app.js?v=86", "/app.js?v=87")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=86", "/driver-vehicles-fallback-v76.js?v=87")
  .replaceAll("/styles.css?v=87", "/styles.css?v=88")
  .replaceAll("/driver-v74.css?v=87", "/driver-v74.css?v=88")
  .replaceAll("/i18n.js?v=87", "/i18n.js?v=88")
  .replaceAll("/vehicles.js?v=87", "/vehicles.js?v=88")
  .replaceAll("/app.js?v=87", "/app.js?v=88")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=87", "/driver-vehicles-fallback-v76.js?v=88");
indexHtml = indexHtml
  .replaceAll("/styles.css?v=88", "/styles.css?v=90")
  .replaceAll("/driver-v74.css?v=88", "/driver-v74.css?v=90")
  .replaceAll("/i18n.js?v=88", "/i18n.js?v=90")
  .replaceAll("/vehicles.js?v=88", "/vehicles.js?v=90")
  .replaceAll("/app.js?v=88", "/app.js?v=90")
  .replaceAll("/driver-vehicles-fallback-v76.js?v=88", "/driver-vehicles-fallback-v76.js?v=90");
indexHtml = indexHtml.replaceAll("?v=90", "?v=91");
await fs.writeFile(path.join(root, "index.html"), indexHtml);

let serviceWorker = await fs.readFile(runtimeServiceWorkerPath, "utf8").catch(() => fs.readFile(path.join(root, "service-worker.js"), "utf8"));
serviceWorker = serviceWorker
  .replaceAll("fleetinspect-driver-v75", "fleetinspect-driver-v80")
  .replaceAll("fleetinspect-driver-v80", "fleetinspect-driver-v81")
  .replaceAll("/driver-v74.css?v=75", "/driver-v74.css?v=80")
  .replaceAll("/app.js?v=75", "/app.js?v=80")
  .replaceAll("/vehicles.js?v=75", "/vehicles.js?v=80")
  .replaceAll("/driver-v74.css?v=80", "/driver-v74.css?v=81")
  .replaceAll("/app.js?v=80", "/app.js?v=81")
  .replaceAll("/vehicles.js?v=80", "/vehicles.js?v=81")
  .replaceAll("fleetinspect-driver-v81", "fleetinspect-driver-v82")
  .replaceAll("/driver-v74.css?v=81", "/driver-v74.css?v=82")
  .replaceAll("/app.js?v=81", "/app.js?v=82")
  .replaceAll("/vehicles.js?v=81", "/vehicles.js?v=82")
  .replaceAll("fleetinspect-driver-v82", "fleetinspect-driver-v83")
  .replaceAll("/driver-v74.css?v=82", "/driver-v74.css?v=83")
  .replaceAll("/app.js?v=82", "/app.js?v=83")
  .replaceAll("/vehicles.js?v=82", "/vehicles.js?v=83")
  .replaceAll("fleetinspect-driver-v83", "fleetinspect-driver-v84")
  .replaceAll("/driver-v74.css?v=83", "/driver-v74.css?v=84")
  .replaceAll("/app.js?v=83", "/app.js?v=84")
  .replaceAll("/vehicles.js?v=83", "/vehicles.js?v=84")
  .replaceAll("fleetinspect-driver-v84", "fleetinspect-driver-v85")
  .replaceAll("/driver-v74.css?v=84", "/driver-v74.css?v=85")
  .replaceAll("/app.js?v=84", "/app.js?v=85")
  .replaceAll("/vehicles.js?v=84", "/vehicles.js?v=85")
  .replaceAll("fleetinspect-driver-v85", "fleetinspect-driver-v86")
  .replaceAll("/driver-v74.css?v=85", "/driver-v74.css?v=86")
  .replaceAll("/app.js?v=85", "/app.js?v=86")
  .replaceAll("/vehicles.js?v=85", "/vehicles.js?v=86")
  .replaceAll("fleetinspect-driver-v86", "fleetinspect-driver-v87")
  .replaceAll("/driver-v74.css?v=86", "/driver-v74.css?v=87")
  .replaceAll("/app.js?v=86", "/app.js?v=87")
  .replaceAll("/vehicles.js?v=86", "/vehicles.js?v=87")
  .replaceAll("fleetinspect-driver-v87", "fleetinspect-driver-v88")
  .replaceAll("/driver-v74.css?v=87", "/driver-v74.css?v=88")
  .replaceAll("/app.js?v=87", "/app.js?v=88")
  .replaceAll("/vehicles.js?v=87", "/vehicles.js?v=88");
serviceWorker = serviceWorker
  .replaceAll("fleetinspect-driver-v88", "fleetinspect-driver-v90")
  .replaceAll("fleetinspect-driver-v89", "fleetinspect-driver-v90")
  .replaceAll("?v=88", "?v=90")
  .replaceAll("?v=89", "?v=90")
  .replaceAll("?v=75", "?v=90");
serviceWorker = serviceWorker
  .replaceAll("fleetinspect-driver-v90", "fleetinspect-driver-v91")
  .replaceAll("?v=90", "?v=91");
serviceWorker = serviceWorker
  .replaceAll("fleetinspect-driver-v91", "fleetinspect-driver-v103")
  .replaceAll("fleetinspect-driver-v96", "fleetinspect-driver-v103")
  .replaceAll("fleetinspect-driver-v100", "fleetinspect-driver-v103")
  .replaceAll("fleetinspect-driver-v101", "fleetinspect-driver-v103")
  .replaceAll("fleetinspect-driver-v102", "fleetinspect-driver-v103")
  .replace('"/admin.html",', '"/admin.html",\n  "/admin-v92.css?v=103",\n  "/admin-v100.css?v=103",\n  "/admin-v100.js?v=103",');
await fs.writeFile(path.join(root, "service-worker.js"), serviceWorker);
await fs.writeFile(runtimeServiceWorkerPath, serviceWorker);
