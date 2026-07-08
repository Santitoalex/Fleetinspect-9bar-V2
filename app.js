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

const nodes = {
  startScreen: document.querySelector("#startScreen"),
  captureScreen: document.querySelector("#captureScreen"),
  startForm: document.querySelector("#startForm"),
  driverName: document.querySelector("#driverName"),
  vehiclePlate: document.querySelector("#vehiclePlate"),
  sessionMeta: document.querySelector("#sessionMeta"),
  stepTitle: document.querySelector("#stepTitle"),
  cameraVideo: document.querySelector("#cameraVideo"),
  capturedPreview: document.querySelector("#capturedPreview"),
  cameraEmpty: document.querySelector("#cameraEmpty"),
  cameraFrame: document.querySelector(".camera-frame"),
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
  resetSession: document.querySelector("#resetSession"),
};

document.addEventListener("DOMContentLoaded", () => {
  window.FI18N.bindLanguageSelectors();
  window.addEventListener("fleetinspect:language", () => {
    loadVehicleOptions();
    renderProgress();
    if (session) updateCaptureUI();
  });
  loadVehicleOptions();
  bindEvents();
  renderProgress();
  processPendingInspections();
  window.addEventListener("online", processPendingInspections);
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
  nodes.resetSession.addEventListener("click", resetSession);
}

async function beginSession(event) {
  event.preventDefault();

  const driverName = nodes.driverName.value.trim();
  const plate = normalizePlate(nodes.vehiclePlate.value);

  if (!driverName || !plate) {
    alert(t("missingDetails"));
    return;
  }

  session = {
    id: `inspection-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1600 },
        height: { ideal: 1200 },
      },
      audio: false,
    });

    nodes.cameraVideo.srcObject = stream;
    nodes.cameraVideo.setAttribute("playsinline", "");
    await nodes.cameraVideo.play();
    nodes.cameraFrame.classList.add("is-live");
    nodes.cameraEmpty.classList.add("hidden");
  } catch {
    showCameraMessage(t("cameraNoAccess"));
  }
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
  saveCurrentPhoto(compressCanvas(canvas, 960, 0.55));
}

function saveCurrentPhoto(dataUrl) {
  const step = STEPS[stepIndex];
  session.photos[step.id] = {
    id: step.id,
    label: getStepLabel(step),
    url: dataUrl,
    capturedAt: new Date().toISOString(),
  };

  nodes.capturedPreview.src = dataUrl;
  nodes.cameraFrame.classList.add("has-photo");
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
    alert(t("savedOk"));
    resetSession();
  } catch (error) {
    const queued = await savePendingInspection(payload).then(() => true).catch(() => false);
    alert(`${t("couldNotSave")}: ${getSaveErrorMessage(error)} ${queued ? t("savedPendingRetry") : t("retryWithoutClosing")}`);
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
  renderProgress();
}

function updateCaptureUI() {
  const step = STEPS[stepIndex];
  const photo = session?.photos[step.id];

  nodes.stepTitle.textContent = getStepLabel(step);
  nodes.sessionMeta.textContent = `${session.driverName} - ${session.plate}`;

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
      ? t("photoSaved")
      : t("placeVehicle");
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
  if (!navigator.onLine) return;

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
}

async function savePendingInspection(payload) {
  const db = await openQueueDb();
  await idbRequest(db.transaction("pending", "readwrite").objectStore("pending").put({
    id: payload.id,
    payload,
    savedAt: new Date().toISOString(),
  }));
}

async function getPendingInspections() {
  const db = await openQueueDb();
  return idbRequest(db.transaction("pending", "readonly").objectStore("pending").getAll());
}

async function deletePendingInspection(id) {
  const db = await openQueueDb();
  await idbRequest(db.transaction("pending", "readwrite").objectStore("pending").delete(id));
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
}

function normalizePlate(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
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
