const STEPS = [
  { id: "front", labelKey: "front" },
  { id: "front_left", labelKey: "frontLeft" },
  { id: "left_side", labelKey: "leftSide" },
  { id: "rear_left", labelKey: "rearLeft" },
  { id: "rear", labelKey: "rear" },
  { id: "rear_right", labelKey: "rearRight" },
  { id: "right_side", labelKey: "rightSide" },
  { id: "front_right", labelKey: "frontRight" },
  { id: "interior", labelKey: "interior" },
];

let session = null;
let stepIndex = 0;
let stream = null;
let cameraTrack = null;
let selectedCameraId = localStorage.getItem("fleetinspect_camera_id") || "";
let cameraZoomState = { min: 1, max: 1, step: 0.1, value: 1, dragging: false };
let deferredInstallPrompt = null;

const nodes = {
  startScreen: document.querySelector("#startScreen"),
  captureScreen: document.querySelector("#captureScreen"),
  startForm: document.querySelector("#startForm"),
  siteSelect: document.querySelector("#siteSelect"),
  driverName: document.querySelector("#driverName"),
  vehiclePlate: document.querySelector("#vehiclePlate"),
  sessionMeta: document.querySelector("#sessionMeta"),
  stepTitle: document.querySelector("#stepTitle"),
  stepHelp: document.querySelector("#stepHelp"),
  photoCounter: document.querySelector("#photoCounter"),
  cameraVideo: document.querySelector("#cameraVideo"),
  capturedPreview: document.querySelector("#capturedPreview"),
  cameraEmpty: document.querySelector("#cameraEmpty"),
  cameraFrame: document.querySelector(".camera-frame"),
  cameraPickerControl: document.querySelector("#cameraPickerControl"),
  cameraPicker: document.querySelector("#cameraPicker"),
  cameraZoomControl: document.querySelector("#cameraZoomControl"),
  cameraZoom: document.querySelector("#cameraZoom"),
  cameraZoomFill: document.querySelector("#cameraZoomFill"),
  cameraZoomThumb: document.querySelector("#cameraZoomThumb"),
  cameraZoomValue: document.querySelector("#cameraZoomValue"),
  capturePhoto: document.querySelector("#capturePhoto"),
  previousPhoto: document.querySelector("#previousPhoto"),
  retakePhoto: document.querySelector("#retakePhoto"),
  zoomPhoto: document.querySelector("#zoomPhoto"),
  photoModal: document.querySelector("#photoModal"),
  photoModalTitle: document.querySelector("#photoModalTitle"),
  closePhotoModal: document.querySelector("#closePhotoModal"),
  zoomPreview: document.querySelector("#zoomPreview"),
  progressList: document.querySelector("#progressList"),
  driverNotes: document.querySelector("#driverNotes"),
  aiStatus: document.querySelector("#aiStatus"),
  qualityStatus: document.querySelector("#qualityStatus"),
  syncStatus: document.querySelector("#syncStatus"),
  retryPending: document.querySelector("#retryPending"),
  saveToast: document.querySelector("#saveToast"),
  resetSession: document.querySelector("#resetSession"),
  installPrompt: document.querySelector("#installPrompt"),
  installPromptText: document.querySelector("#installPromptText"),
  installAppButton: document.querySelector("#installAppButton"),
  dismissInstallPrompt: document.querySelector("#dismissInstallPrompt"),
};

document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  window.FI18N.bindLanguageSelectors();
  window.addEventListener("fleetinspect:language", () => {
    loadVehicleOptions();
    renderProgress();
    showInstallPrompt();
    if (session) updateCaptureUI();
  });
  loadVehicleOptions();
  bindEvents();
  renderProgress();
  processPendingInspections();
  updateSyncStatus();
  window.addEventListener("online", () => {
    updateSyncStatus();
    processPendingInspections();
  });
  window.addEventListener("offline", updateSyncStatus);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallPrompt();
  });
  window.addEventListener("appinstalled", hideInstallPrompt);
  window.setTimeout(showInstallPrompt, 1000);
});

function loadVehicleOptions() {
  const vehicles = Array.isArray(window.FLEET_VEHICLES) ? window.FLEET_VEHICLES : [];
  nodes.vehiclePlate.innerHTML = [
    `<option value="">${t("selectRegistration")}</option>`,
    ...vehicles.map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`),
  ].join("");
}

function bindEvents() {
  nodes.startForm.addEventListener("submit", beginSession);
  nodes.capturePhoto.addEventListener("click", primaryCaptureAction);
  nodes.previousPhoto.addEventListener("click", previousStep);
  nodes.retakePhoto.addEventListener("click", retakeCurrentPhoto);
  nodes.zoomPhoto.addEventListener("click", openPhotoZoom);
  nodes.capturedPreview.addEventListener("click", openPhotoZoom);
  nodes.closePhotoModal.addEventListener("click", closePhotoZoom);
  nodes.photoModal.addEventListener("click", (event) => {
    if (event.target === nodes.photoModal) closePhotoZoom();
  });
  nodes.progressList.addEventListener("click", handleProgressClick);
  nodes.retryPending.addEventListener("click", processPendingInspections);
  nodes.cameraPicker.addEventListener("change", changeCamera);
  nodes.cameraZoom.addEventListener("pointerdown", startCameraZoomDrag);
  nodes.resetSession.addEventListener("click", resetSession);
  nodes.installAppButton.addEventListener("click", installDriverApp);
  nodes.dismissInstallPrompt.addEventListener("click", dismissInstallPrompt);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}

function showInstallPrompt() {
  if (!nodes.installPrompt || isStandaloneApp() || localStorage.getItem("fleetinspect_install_dismissed") === "1") {
    return;
  }

  const isiPhone = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const canInstallFromButton = Boolean(deferredInstallPrompt);
  nodes.installPromptText.textContent = isiPhone
    ? t("installIosHint")
    : canInstallFromButton
      ? t("installDriverHint")
      : t("installAndroidHint");
  nodes.installAppButton.classList.toggle("hidden", !canInstallFromButton);
  nodes.installPrompt.classList.remove("hidden");
}

function hideInstallPrompt() {
  nodes.installPrompt?.classList.add("hidden");
}

async function installDriverApp() {
  if (!deferredInstallPrompt) {
    alert(t("installAndroidHint"));
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  hideInstallPrompt();
}

function dismissInstallPrompt() {
  localStorage.setItem("fleetinspect_install_dismissed", "1");
  hideInstallPrompt();
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

async function beginSession(event) {
  event.preventDefault();

  const driverName = nodes.driverName.value.trim();
  const plate = normalizePlate(nodes.vehiclePlate.value);
  const site = normalizeSite(nodes.siteSelect?.value);

  if (!site || !driverName || !plate) {
    alert(t("missingDetails"));
    return;
  }

  session = {
    id: `inspection-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    site,
    driverName,
    plate,
    startedAt: new Date().toISOString(),
    photos: {},
  };

  stepIndex = 0;
  nodes.startScreen.classList.add("hidden");
  nodes.captureScreen.classList.remove("hidden");
  updateCaptureUI();
  await openCamera();
}

async function openCamera() {
  stopCamera();

  if (!navigator.mediaDevices?.getUserMedia) {
    showCameraMessage(t("allowCamera"));
    return;
  }

  try {
    const video = selectedCameraId
      ? {
          deviceId: { exact: selectedCameraId },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        }
      : {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        };

    stream = await navigator.mediaDevices.getUserMedia({
      video,
      audio: false,
    });

    nodes.cameraVideo.srcObject = stream;
    cameraTrack = stream.getVideoTracks()[0] || null;
    nodes.cameraVideo.setAttribute("playsinline", "");
    await nodes.cameraVideo.play();
    nodes.cameraFrame.classList.add("is-live");
    nodes.cameraEmpty.classList.add("hidden");
    await loadCameraDevices();
    setupCameraZoom();
  } catch {
    if (selectedCameraId) {
      selectedCameraId = "";
      localStorage.removeItem("fleetinspect_camera_id");
      await openCamera();
      return;
    }
    showCameraMessage(t("cameraNoAccess"));
  }
}

async function loadCameraDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;

  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
  const cameras = devices.filter((device) => device.kind === "videoinput");
  const choices = getDriverCameraChoices(cameras);
  if (choices.length <= 1) {
    nodes.cameraPickerControl?.classList.add("hidden");
    return;
  }

  const activeId = cameraTrack?.getSettings?.().deviceId || selectedCameraId;
  nodes.cameraPicker.innerHTML = choices.map((camera) => {
    return `<option value="${escapeHtml(camera.deviceId)}">${escapeHtml(camera.friendlyLabel)}</option>`;
  }).join("");
  nodes.cameraPicker.value = choices.some((camera) => camera.deviceId === activeId)
    ? activeId
    : choices[0].deviceId;
  nodes.cameraPickerControl.classList.remove("hidden");
}

async function changeCamera() {
  selectedCameraId = nodes.cameraPicker.value;
  localStorage.setItem("fleetinspect_camera_id", selectedCameraId);
  await openCamera();
}

function getDriverCameraChoices(cameras) {
  const usable = cameras
    .map((camera, index) => {
      const label = camera.label || `${t("cameraLens")} ${index + 1}`;
      const lower = label.toLowerCase();
      return { ...camera, label, lower, index };
    })
    .filter((camera) => !isFrontCamera(camera.lower) && !isTeleOrMacroCamera(camera.lower));

  const source = usable.length ? usable : cameras.map((camera, index) => ({
    ...camera,
    label: camera.label || `${t("cameraLens")} ${index + 1}`,
    lower: String(camera.label || "").toLowerCase(),
    index,
  }));

  const wide = source.find((camera) => isWideCamera(camera.lower));
  const normal = source.find((camera) => !isWideCamera(camera.lower)) || source[0];
  const choices = [];

  if (normal) {
    choices.push({ ...normal, friendlyLabel: t("rearCamera") });
  }
  if (wide && wide.deviceId !== normal?.deviceId) {
    choices.push({ ...wide, friendlyLabel: t("wideCamera") });
  }

  if (choices.length < 2 && source.length > 1) {
    const extra = source.find((camera) => !choices.some((choice) => choice.deviceId === camera.deviceId));
    if (extra) choices.push({ ...extra, friendlyLabel: t("wideCamera") });
  }

  return choices.slice(0, 2);
}

function isWideCamera(label) {
  return label.includes("ultra") || label.includes("wide") || label.includes("0.5") || label.includes("0,5");
}

function isFrontCamera(label) {
  return label.includes("front") || label.includes("user") || label.includes("face") || label.includes("selfie");
}

function isTeleOrMacroCamera(label) {
  return label.includes("tele") || label.includes("macro") || label.includes("zoom");
}

function setupCameraZoom() {
  const capabilities = cameraTrack?.getCapabilities?.() || {};
  const settings = cameraTrack?.getSettings?.() || {};
  const zoom = capabilities.zoom;

  if (!zoom || !nodes.cameraZoomControl) {
    nodes.cameraZoomControl?.classList.add("hidden");
    return;
  }

  const min = Number(zoom.min || 1);
  const max = Number(zoom.max || Math.max(min, 1));
  const step = Number(zoom.step || 0.1);
  const current = Number(settings.zoom || min);

  cameraZoomState = { min, max, step, value: current, dragging: false };
  renderCameraZoomSlider();
  nodes.cameraZoomControl.classList.toggle("hidden", max <= min);
}

async function applyCameraZoom(value = cameraZoomState.value) {
  if (!cameraTrack) return;
  const zoom = clampZoom(value);
  cameraZoomState.value = zoom;
  renderCameraZoomSlider();

  try {
    await cameraTrack.applyConstraints({
      advanced: [{ zoom }],
    });
  } catch {
    nodes.cameraZoomControl?.classList.add("hidden");
  }
}

function startCameraZoomDrag(event) {
  event.preventDefault();
  cameraZoomState.dragging = true;
  nodes.cameraZoom.setPointerCapture?.(event.pointerId);
  updateCameraZoomFromPointer(event);
  nodes.cameraZoom.addEventListener("pointermove", updateCameraZoomFromPointer);
  nodes.cameraZoom.addEventListener("pointerup", stopCameraZoomDrag, { once: true });
  nodes.cameraZoom.addEventListener("pointercancel", stopCameraZoomDrag, { once: true });
}

function updateCameraZoomFromPointer(event) {
  if (!cameraZoomState.dragging && event.type === "pointermove") return;
  const rect = nodes.cameraZoom.getBoundingClientRect();
  const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
  const rawValue = cameraZoomState.min + clamp(ratio, 0, 1) * (cameraZoomState.max - cameraZoomState.min);
  applyCameraZoom(rawValue);
}

function stopCameraZoomDrag() {
  cameraZoomState.dragging = false;
  nodes.cameraZoom.removeEventListener("pointermove", updateCameraZoomFromPointer);
}

function renderCameraZoomSlider() {
  const range = cameraZoomState.max - cameraZoomState.min;
  const ratio = range ? (cameraZoomState.value - cameraZoomState.min) / range : 0;
  const percent = clamp(ratio, 0, 1) * 100;
  nodes.cameraZoomFill.style.width = `${percent}%`;
  nodes.cameraZoomThumb.style.left = `${percent}%`;
  nodes.cameraZoomValue.textContent = `${cameraZoomState.value.toFixed(1)}x`;
}

function clampZoom(value) {
  const stepped = Math.round(Number(value) / cameraZoomState.step) * cameraZoomState.step;
  return clamp(stepped, cameraZoomState.min, cameraZoomState.max);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function captureFromCamera() {
  if (!session) return;

  if (!stream || !nodes.cameraVideo.videoWidth) {
    alert(t("cameraNotReady"));
    openCamera();
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = nodes.cameraVideo.videoWidth;
  canvas.height = nodes.cameraVideo.videoHeight;
  canvas.getContext("2d").drawImage(nodes.cameraVideo, 0, 0);
  const quality = analyzePhotoQuality(canvas);
  saveCurrentPhoto(compressCanvas(canvas, 1100, 0.62), quality);
}

function saveCurrentPhoto(dataUrl, quality = null) {
  const step = STEPS[stepIndex];
  session.photos[step.id] = {
    id: step.id,
    label: getStepLabel(step),
    url: dataUrl,
    quality,
    capturedAt: new Date().toISOString(),
  };

  nodes.capturedPreview.src = dataUrl;
  nodes.cameraFrame.classList.add("has-photo");
  showSaveToast(t("photoSaved"), "ok");
  updateCaptureUI();
}

async function primaryCaptureAction() {
  if (!session) return;

  const currentStep = STEPS[stepIndex];
  const hasCurrent = Boolean(session.photos[currentStep.id]);
  const complete = STEPS.every((step) => session.photos[step.id]);

  if (complete) {
    await finishInspection();
    return;
  }

  if (hasCurrent) {
    nextStep();
    return;
  }

  captureFromCamera();
}

function nextStep() {
  const current = STEPS[stepIndex];
  if (!session?.photos[current.id]) {
    alert(t("takeCurrentFirst"));
    return;
  }

  if (stepIndex < STEPS.length - 1) {
    stepIndex += 1;
    updateCaptureUI();
    openCamera();
  }
}

function previousStep() {
  if (!session || stepIndex === 0) return;
  stepIndex -= 1;
  updateCaptureUI();
  openCamera();
}

function retakeCurrentPhoto() {
  if (!session) return;

  const step = STEPS[stepIndex];
  delete session.photos[step.id];
  nodes.capturedPreview.removeAttribute("src");
  nodes.cameraFrame.classList.remove("has-photo");
  updateCaptureUI();
  openCamera();
}

function handleProgressClick(event) {
  const button = event.target.closest("[data-step-index]");
  if (!button || !session) return;

  const targetIndex = Number(button.dataset.stepIndex);
  const targetStep = STEPS[targetIndex];
  const currentFirstMissing = STEPS.findIndex((step) => !session.photos[step.id]);
  const canOpen = targetIndex <= stepIndex || Boolean(session.photos[targetStep.id]) || targetIndex === currentFirstMissing;

  if (!canOpen) return;

  stepIndex = targetIndex;
  updateCaptureUI();
  openCamera();
}

async function finishInspection() {
  if (!session) return;

  const complete = STEPS.every((step) => session.photos[step.id]);
  if (!complete) {
    alert(t("missingPhotos"));
    return;
  }

  nodes.capturePhoto.disabled = true;
  nodes.capturePhoto.textContent = t("saving");

  const photos = STEPS.map((step) => session.photos[step.id]);
  const payload = {
    ...session,
    notes: nodes.driverNotes.value.trim(),
    finishedAt: new Date().toISOString(),
    photos,
    ai: {
      label: "Pending review",
      summary: t("aiComplete", { count: photos.length }),
    },
  };

  try {
    const response = await postInspectionWithRetry(payload);
    const result = await safeJson(response);
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || t("couldNotSave"));
    }

    await deletePendingInspection(payload.id).catch(() => {});
    await updateSyncStatus();
    showSaveToast(t("savedOkWithId", { id: result.item?.id || payload.id }), "ok");
    resetSession();
  } catch (error) {
    const queued = await savePendingInspection(payload).then(() => true).catch(() => false);
    await updateSyncStatus();
    showSaveToast(`${t("couldNotSave")}: ${getSaveErrorMessage(error)} ${queued ? t("savedPendingRetry") : t("retryWithoutClosing")}`, queued ? "warn" : "error");
  } finally {
    nodes.capturePhoto.disabled = false;
    updateButtons();
  }
}

function resetSession() {
  stopCamera();
  closePhotoZoom();
  session = null;
  stepIndex = 0;
  nodes.startForm.reset();
  nodes.driverNotes.value = "";
  nodes.startScreen.classList.remove("hidden");
  nodes.captureScreen.classList.add("hidden");
  nodes.cameraFrame.classList.remove("is-live", "has-photo");
  nodes.qualityStatus.textContent = t("qualityWaiting");
  renderProgress();
}

function updateCaptureUI() {
  const step = STEPS[stepIndex];
  const photo = session?.photos[step.id];
  const completedCount = STEPS.filter((item) => session?.photos[item.id]).length;

  nodes.stepTitle.textContent = getStepLabel(step);
  nodes.sessionMeta.textContent = `${session.site} - ${session.driverName} - ${session.plate}`;
  nodes.photoCounter.textContent = `${completedCount} / ${STEPS.length}`;
  nodes.stepHelp.textContent = photo ? t("photoSavedNext") : t("placeVehicle");

  if (photo) {
    nodes.capturedPreview.src = photo.url;
    nodes.cameraFrame.classList.add("has-photo");
  } else {
    nodes.capturedPreview.removeAttribute("src");
    nodes.cameraFrame.classList.remove("has-photo");
  }

  renderProgress();
  updateButtons();
}

function updateButtons() {
  if (!session) return;

  const hasCurrent = Boolean(session.photos[STEPS[stepIndex].id]);
  const complete = STEPS.every((step) => session.photos[step.id]);

  nodes.previousPhoto.disabled = stepIndex === 0;
  nodes.retakePhoto.classList.toggle("hidden", !hasCurrent);
  nodes.zoomPhoto.classList.toggle("hidden", !hasCurrent);

  if (complete) {
    nodes.capturePhoto.textContent = t("saveInspection");
  } else if (hasCurrent) {
    nodes.capturePhoto.textContent = t("nextPhoto");
  } else {
    nodes.capturePhoto.textContent = t("capture");
  }

  nodes.aiStatus.textContent = complete
    ? t("allPhotosDone")
    : hasCurrent
      ? t("photoSavedNext")
      : t("placeVehicle");

  const quality = session.photos[STEPS[stepIndex].id]?.quality;
  renderQualityStatus(quality, hasCurrent);
}

function renderProgress() {
  nodes.progressList.innerHTML = STEPS.map((step, index) => {
    const done = Boolean(session?.photos?.[step.id]);
    const active = index === stepIndex;
    return `
      <button type="button" class="progress-item ${active ? "active" : ""} ${done ? "done" : ""}" data-step-index="${index}">
        <strong>${escapeHtml(getStepLabel(step))}</strong>
        <span>${done ? t("done") : active ? t("current") : t("pending")}</span>
      </button>
    `;
  }).join("");
}

function openPhotoZoom() {
  if (!session) return;

  const step = STEPS[stepIndex];
  const photo = session.photos[step.id];
  if (!photo?.url) return;

  nodes.photoModalTitle.textContent = getStepLabel(step);
  nodes.zoomPreview.src = photo.url;
  nodes.photoModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closePhotoZoom() {
  nodes.photoModal.classList.add("hidden");
  nodes.zoomPreview.removeAttribute("src");
  document.body.classList.remove("modal-open");
}

function compressCanvas(sourceCanvas, maxSize, quality) {
  const scale = Math.min(1, maxSize / Math.max(sourceCanvas.width, sourceCanvas.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sourceCanvas.width * scale);
  canvas.height = Math.round(sourceCanvas.height * scale);
  canvas.getContext("2d").drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function postInspectionWithRetry(payload) {
  try {
    return await postInspection(payload);
  } catch (error) {
    await sleep(1800);
    return postInspection(payload);
  }
}

async function postInspection(payload) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 150000);

  try {
    return await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getSaveErrorMessage(error) {
  if (error?.name === "AbortError") {
    return t("saveTimedOut");
  }

  if (String(error?.message || "").includes("Failed to fetch")) {
    return t("saveConnectionFailed");
  }

  return error?.message || t("saveConnectionFailed");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function processPendingInspections() {
  await updateSyncStatus("syncing");
  if (!navigator.onLine) {
    await updateSyncStatus();
    return;
  }

  const pending = await getPendingInspections();
  for (const entry of pending) {
    try {
      const response = await postInspectionWithRetry(entry.payload);
      const result = await safeJson(response);
      if (response.ok && result.ok !== false) {
        await deletePendingInspection(entry.id);
      }
    } catch {
      // Keep it queued for the next attempt.
    }
  }
  await updateSyncStatus();
}

async function savePendingInspection(payload) {
  const db = await openQueueDb();
  await idbRequest(db.transaction("pending", "readwrite").objectStore("pending").put({
    id: payload.id,
    payload,
    savedAt: new Date().toISOString(),
  }));
  await updateSyncStatus();
}

async function getPendingInspections() {
  const db = await openQueueDb();
  return idbRequest(db.transaction("pending", "readonly").objectStore("pending").getAll());
}

async function deletePendingInspection(id) {
  const db = await openQueueDb();
  await idbRequest(db.transaction("pending", "readwrite").objectStore("pending").delete(id));
  await updateSyncStatus();
}

async function updateSyncStatus(mode = "") {
  if (!nodes.syncStatus) return;
  const pending = await getPendingInspections().catch(() => []);
  nodes.retryPending.classList.toggle("hidden", pending.length === 0 || mode === "syncing");

  if (!navigator.onLine) {
    nodes.syncStatus.textContent = pending.length
      ? t("offlineWithPending", { count: pending.length })
      : t("offlineNoPending");
    return;
  }

  if (mode === "syncing") {
    nodes.syncStatus.textContent = t("syncingPending");
    return;
  }

  nodes.syncStatus.textContent = pending.length
    ? t("onlineWithPending", { count: pending.length })
    : t("syncReady");
}

function renderQualityStatus(quality, hasPhoto) {
  if (!nodes.qualityStatus) return;
  if (!hasPhoto || !quality) {
    nodes.qualityStatus.textContent = t("qualityWaiting");
    nodes.qualityStatus.dataset.state = "neutral";
    return;
  }

  nodes.qualityStatus.dataset.state = quality.score >= 80 ? "ok" : quality.score >= 55 ? "warn" : "bad";
  nodes.qualityStatus.innerHTML = `
    <span>${escapeHtml(quality.label)}</span>
    <small>${quality.messages.map(escapeHtml).join(" · ")}</small>
  `;
}

function analyzePhotoQuality(sourceCanvas) {
  const sampleSize = 96;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceCanvas, 0, 0, sampleSize, sampleSize);
  const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
  let brightness = 0;
  let contrastSum = 0;
  const luminance = [];

  for (let index = 0; index < data.length; index += 4) {
    const value = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
    luminance.push(value);
    brightness += value;
  }

  brightness /= luminance.length;
  for (const value of luminance) {
    contrastSum += Math.abs(value - brightness);
  }
  const contrast = contrastSum / luminance.length;
  const sharpness = estimateSharpness(luminance, sampleSize);
  const messages = [];
  let score = 100;

  if (brightness < 48) {
    score -= 30;
    messages.push(t("qualityTooDark"));
  }
  if (brightness > 225) {
    score -= 20;
    messages.push(t("qualityTooBright"));
  }
  if (sharpness < 11) {
    score -= 30;
    messages.push(t("qualityBlurry"));
  }
  if (contrast < 20) {
    score -= 20;
    messages.push(t("qualityFarOrLowDetail"));
  }

  if (!messages.length) messages.push(t("qualityGoodDetail"));
  const label = score >= 80 ? t("qualityGood") : score >= 55 ? t("qualityReview") : t("qualityRetakeRecommended");
  return { score, label, messages, brightness: Math.round(brightness), sharpness: Math.round(sharpness), contrast: Math.round(contrast) };
}

function estimateSharpness(luminance, width) {
  let total = 0;
  let count = 0;
  for (let y = 1; y < width - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const edge = Math.abs(luminance[index] * 4 - luminance[index - 1] - luminance[index + 1] - luminance[index - width] - luminance[index + width]);
      total += edge;
      count += 1;
    }
  }
  return count ? total / count : 0;
}

function showSaveToast(message, type = "ok") {
  if (!nodes.saveToast) {
    alert(message);
    return;
  }

  nodes.saveToast.className = `save-toast ${type}`;
  nodes.saveToast.textContent = message;
  window.setTimeout(() => nodes.saveToast.classList.add("hidden"), 6500);
}

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fleetinspect-offline-queue", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("pending", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function showCameraMessage(message) {
  nodes.cameraFrame.classList.remove("is-live");
  nodes.cameraEmpty.classList.remove("hidden");
  nodes.cameraEmpty.innerHTML = `<strong>${escapeHtml(t("cameraPending"))}</strong><span>${escapeHtml(message)}</span>`;
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  cameraTrack = null;
  nodes.cameraZoomControl?.classList.add("hidden");
}

function normalizePlate(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
}

function normalizeSite(value) {
  const site = String(value || "").trim().toUpperCase();
  return ["DRP3", "DSU1"].includes(site) ? site : "";
}

function getStepLabel(step) {
  return t(step.labelKey);
}

function t(key, replacements = {}) {
  return window.FI18N.t(key, replacements);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
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
