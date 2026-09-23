import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const appPath = path.join(root, "app.js");
const adminPath = path.join(root, "admin.js");
const adminHtmlPath = path.join(root, "admin.html");
const driverCssPath = path.join(root, "driver-v74.css");

await import(pathToFileURL(path.join(root, "server-speed-v75.js")).href);

let appJs = await fs.readFile(appPath, "utf8");
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
  margin: 0 0 14px !important;
  border: 1px solid var(--driver-line) !important;
  border-radius: 12px !important;
  background: #fff !important;
  padding: 12px !important;
  box-shadow: none !important;
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

.driver-v85 .driver-home,
.driver-v85 .driver-start-layout {
  display: block !important;
  width: 100% !important;
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
  .replaceAll("/driver-vehicles-fallback-v76.js?v=85", "/driver-vehicles-fallback-v76.js?v=86");
await fs.writeFile(path.join(root, "index.html"), indexHtml);

let serviceWorker = await fs.readFile(path.join(root, "service-worker.js"), "utf8");
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
  .replaceAll("/vehicles.js?v=85", "/vehicles.js?v=86");
await fs.writeFile(path.join(root, "service-worker.js"), serviceWorker);
