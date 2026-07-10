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
  vehicleGuide: document.querySelector("#vehicleGuide"),
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
  updateSyncStatus();
  window.addEventListener("online", () => {
    updateSyncStatus();
    processPendingInspections();
  });
  window.addEventListener("offline", updateSyncStatus);
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
  nodes.vehicleGuide.innerHTML = "";
  nodes.qualityStatus.textContent = t("qualityWaiting");
  renderProgress();
}

function updateCaptureUI() {
  const step = STEPS[stepIndex];
  const photo = session?.photos[step.id];

  nodes.stepTitle.textContent = getStepLabel(step);
  nodes.sessionMeta.textContent = `${session.driverName} - ${session.plate}`;
  renderVehicleGuide(step.id);

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

function renderVehicleGuide(stepId) {
  if (!nodes.vehicleGuide) return;
  nodes.vehicleGuide.className = `vehicle-guide vehicle-guide-${stepId}`;
  nodes.vehicleGuide.innerHTML = getVehicleGuideSvg(stepId);
}

function getVehicleGuideSvg(stepId) {
  const guides = {
    front: guideFront(),
    front_left: guideFrontAngle("left"),
    left_side: guideSide("left"),
    rear_left: guideRearAngle("left"),
    rear: guideRear(),
    rear_right: guideRearAngle("right"),
    right_side: guideSide("right"),
    front_right: guideFrontAngle("right"),
    interior: guideInterior(),
  };

  return guides[stepId] || guideSide("left");
}

function guideSvg(content, extraClass = "") {
  return `
    <svg class="vehicle-guide-svg ${extraClass}" viewBox="0 0 1000 560" preserveAspectRatio="none" role="img">
      <g class="guide-lines">
        ${content}
      </g>
    </svg>
  `;
}

function guideSide(direction = "left") {
  const mirror = direction === "right" ? 'transform="translate(1000 0) scale(-1 1)"' : "";
  return guideSvg(`
    <g ${mirror}>
      <path d="M92 430 L92 318 C92 272 124 244 176 232 L252 126 C284 92 324 76 374 76 L842 78 C902 78 938 114 942 172 L954 414 C956 448 932 472 898 472 L110 472 C99 472 92 461 92 430 Z" />
      <path d="M252 126 L350 126 C366 126 378 140 378 158 L378 248 L176 248" />
      <path d="M392 132 L802 132 C836 132 858 154 862 188 L878 352 L412 352 L392 132 Z" />
      <path d="M378 158 L402 352" />
      <path d="M468 132 L472 352" />
      <path d="M612 132 L612 352" />
      <path d="M760 132 L760 352" />
      <path d="M164 362 L306 362" />
      <path d="M462 386 L742 386" />
      <path d="M854 366 L922 366" />
      <circle cx="244" cy="472" r="74" />
      <circle cx="244" cy="472" r="38" />
      <circle cx="802" cy="472" r="74" />
      <circle cx="802" cy="472" r="38" />
      <path d="M88 476 L960 476" />
    </g>
  `, "vehicle-guide-side");
}

function guideFront() {
  return guideSvg(`
    <path d="M326 486 C312 486 300 474 302 460 L328 186 C336 112 390 76 500 76 C610 76 664 112 672 186 L698 460 C700 474 688 486 674 486 Z" />
    <path d="M352 252 L648 252" />
    <path d="M372 160 C404 126 448 112 500 112 C552 112 596 126 628 160 L648 246 L352 246 Z" />
    <path d="M378 282 L622 282" />
    <path d="M392 320 L608 320" />
    <path d="M412 356 L588 356" />
    <path d="M356 390 L446 390" />
    <path d="M554 390 L644 390" />
    <path d="M334 304 L260 336 L260 430" />
    <path d="M666 304 L740 336 L740 430" />
    <path d="M340 454 L426 454" />
    <path d="M574 454 L660 454" />
    <circle cx="384" cy="500" r="42" />
    <circle cx="616" cy="500" r="42" />
  `, "vehicle-guide-front");
}

function guideRear() {
  return guideSvg(`
    <path d="M324 486 C310 486 300 474 302 460 L326 156 C332 102 378 76 500 76 C622 76 668 102 674 156 L698 460 C700 474 690 486 676 486 Z" />
    <path d="M352 132 L648 132" />
    <path d="M356 164 L644 164 L644 376 L356 376 Z" />
    <path d="M500 164 L500 486" />
    <path d="M382 208 L618 208" />
    <path d="M382 250 L618 250" />
    <path d="M384 404 L454 404" />
    <path d="M546 404 L616 404" />
    <path d="M438 450 L562 450" />
    <path d="M304 330 L248 356 L248 442" />
    <path d="M696 330 L752 356 L752 442" />
    <circle cx="382" cy="502" r="38" />
    <circle cx="618" cy="502" r="38" />
  `, "vehicle-guide-rear");
}

function guideFrontAngle(direction = "left") {
  const mirror = direction === "right" ? 'transform="translate(1000 0) scale(-1 1)"' : "";
  return guideSvg(`
    <g ${mirror}>
      <path d="M120 458 C94 442 84 408 98 374 L154 242 C170 204 202 182 244 176 L318 92 C344 62 382 50 430 58 L792 116 C850 126 892 170 904 228 L948 426 C956 462 930 494 892 494 L270 494 C218 494 164 486 120 458 Z" />
      <path d="M244 176 L386 176 C412 176 430 194 430 220 L430 374 L154 374" />
      <path d="M448 128 L770 172 C812 178 842 210 850 252 L876 388 L458 374 Z" />
      <path d="M430 220 L458 374" />
      <path d="M538 142 L548 376" />
      <path d="M674 160 L692 382" />
      <path d="M150 316 C202 286 280 274 390 286" />
      <path d="M174 392 L346 404" />
      <path d="M520 414 L756 414" />
      <path d="M788 424 L908 430" />
      <circle cx="282" cy="494" r="78" />
      <circle cx="282" cy="494" r="40" />
      <circle cx="780" cy="494" r="68" />
      <circle cx="780" cy="494" r="34" />
      <path d="M102 500 L934 500" />
      <path d="M126 374 L84 430" />
      <path d="M178 246 L126 272" />
      <path d="M204 224 L256 218" />
    </g>
  `, "vehicle-guide-angle-front");
}

function guideRearAngle(direction = "left") {
  const mirror = direction === "right" ? 'transform="translate(1000 0) scale(-1 1)"' : "";
  return guideSvg(`
    <g ${mirror}>
      <path d="M114 430 L130 220 C136 150 186 106 258 98 L672 60 C738 54 792 84 820 144 L916 352 C932 386 918 432 884 454 C844 480 782 494 722 494 L174 494 C138 494 112 468 114 430 Z" />
      <path d="M144 222 L312 212 C338 210 356 230 356 258 L356 438 L130 438" />
      <path d="M374 110 L668 84 C718 80 760 104 780 150 L850 316 L372 438 Z" />
      <path d="M356 258 L372 438" />
      <path d="M464 102 L462 416" />
      <path d="M606 90 L612 386" />
      <path d="M736 130 L742 348" />
      <path d="M166 278 L288 272" />
      <path d="M170 366 L308 362" />
      <path d="M460 450 L662 450" />
      <path d="M704 432 L850 392" />
      <circle cx="268" cy="494" r="74" />
      <circle cx="268" cy="494" r="38" />
      <circle cx="732" cy="494" r="70" />
      <circle cx="732" cy="494" r="36" />
      <path d="M116 500 L906 500" />
      <path d="M144 248 L98 286" />
      <path d="M132 424 L94 456" />
      <path d="M248 124 L310 118" />
    </g>
  `, "vehicle-guide-angle-rear");
}

function guideInterior() {
  return guideSvg(`
    <path d="M190 96 L810 96 C842 96 866 122 858 152 L796 384 C788 416 762 436 728 436 L272 436 C238 436 212 416 204 384 L142 152 C134 122 158 96 190 96 Z" />
    <path d="M214 142 L786 142 L746 312 L254 312 Z" />
    <path d="M254 312 L184 418" />
    <path d="M746 312 L816 418" />
    <path d="M340 366 L660 366" />
    <circle cx="404" cy="384" r="56" />
    <circle cx="404" cy="384" r="28" />
    <path d="M514 382 L698 382" />
    <path d="M538 412 L676 412" />
    <path d="M286 182 L382 182" />
    <path d="M618 182 L714 182" />
  `, "vehicle-guide-interior");
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
