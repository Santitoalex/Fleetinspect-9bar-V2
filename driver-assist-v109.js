(function () {
  "use strict";

  const TF_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
  const COCO_URL = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
  const VEHICLE_CLASSES = new Set(["car", "truck", "bus"]);
  const DETECTION_INTERVAL_MS = 260;
  const AUTO_CAPTURE_HOLD_MS = 1350;
  const INTERIOR_HOLD_MS = 1800;

  const copy = {
    en: {
      loading: "Preparing Sprinter recognition",
      search: "Place the Sprinter inside the outline",
      closer: "Move closer to the vehicle",
      farther: "Move back a little",
      center: "Center the Sprinter in the outline",
      steady: "Good framing. Hold the phone steady",
      ready: "Correct framing. Taking photo",
      captured: "Photo taken automatically",
      interior: "Align the dashboard and hold the phone steady",
      manual: "Automatic recognition is unavailable. Use Capture.",
      badge: "Automatic capture",
      final: "Nine photos ready. Review and save the inspection.",
    },
    es: {
      loading: "Preparando reconocimiento de la Sprinter",
      search: "Coloca la Sprinter dentro de la silueta",
      closer: "Acércate al vehículo",
      farther: "Aléjate un poco",
      center: "Centra la Sprinter en la silueta",
      steady: "Buen encuadre. Mantén el móvil quieto",
      ready: "Encuadre correcto. Haciendo la foto",
      captured: "Foto hecha automáticamente",
      interior: "Encaja el salpicadero y mantén el móvil quieto",
      manual: "El reconocimiento automático no está disponible. Usa Capturar.",
      badge: "Captura automática",
      final: "Las nueve fotos están listas. Revisa y guarda la inspección.",
    },
    de: {
      loading: "Sprinter-Erkennung wird vorbereitet",
      search: "Sprinter in die Kontur einpassen",
      closer: "Näher an das Fahrzeug gehen",
      farther: "Etwas weiter zurückgehen",
      center: "Sprinter in der Kontur zentrieren",
      steady: "Guter Bildausschnitt. Telefon ruhig halten",
      ready: "Ausrichtung korrekt. Foto wird aufgenommen",
      captured: "Foto automatisch aufgenommen",
      interior: "Armaturenbrett ausrichten und Telefon ruhig halten",
      manual: "Automatische Erkennung nicht verfügbar. Aufnahme verwenden.",
      badge: "Automatische Aufnahme",
      final: "Neun Fotos sind fertig. Prüfung kontrollieren und speichern.",
    },
    ro: {
      loading: "Se pregătește recunoașterea Sprinterului",
      search: "Încadrează Sprinterul în contur",
      closer: "Apropie-te de vehicul",
      farther: "Îndepărtează-te puțin",
      center: "Centrează Sprinterul în contur",
      steady: "Încadrare bună. Ține telefonul nemișcat",
      ready: "Încadrare corectă. Se face fotografia",
      captured: "Fotografie realizată automat",
      interior: "Încadrează bordul și ține telefonul nemișcat",
      manual: "Recunoașterea automată nu este disponibilă. Folosește Captură.",
      badge: "Captură automată",
      final: "Cele nouă fotografii sunt gata. Verifică și salvează inspecția.",
    },
  };

  const targetByStep = {
    front: { x: 0.14, y: 0.2, w: 0.72, h: 0.62 },
    front_left: { x: 0.08, y: 0.2, w: 0.84, h: 0.61 },
    left_side: { x: 0.05, y: 0.23, w: 0.9, h: 0.56 },
    rear_left: { x: 0.08, y: 0.2, w: 0.84, h: 0.61 },
    rear: { x: 0.15, y: 0.19, w: 0.7, h: 0.64 },
    rear_right: { x: 0.08, y: 0.2, w: 0.84, h: 0.61 },
    right_side: { x: 0.05, y: 0.23, w: 0.9, h: 0.56 },
    front_right: { x: 0.08, y: 0.2, w: 0.84, h: 0.61 },
    interior: { x: 0.09, y: 0.26, w: 0.82, h: 0.48 },
  };

  let detector = null;
  let detectorPromise = null;
  let detectorFailed = false;
  let loopTimer = 0;
  let detectionBusy = false;
  let stableSince = 0;
  let lastBox = null;
  let lastStep = "";
  let autoCapturing = false;
  let previousInteriorFrame = null;

  const ui = {};

  function language() {
    const value = window.FI18N?.getLanguage?.() || document.documentElement.lang || "en";
    return copy[value] ? value : "en";
  }

  function text(key) {
    return copy[language()][key] || copy.en[key] || key;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing?.dataset.loaded === "true") {
        resolve();
        return;
      }
      const script = existing || document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", reject, { once: true });
      if (!existing) document.head.appendChild(script);
    });
  }

  async function ensureDetector() {
    if (detector) return detector;
    if (detectorFailed) return null;
    if (detectorPromise) return detectorPromise;

    detectorPromise = (async () => {
      setAssistState("loading", text("loading"), 0);
      await loadScript(TF_URL);
      await loadScript(COCO_URL);
      if (!window.tf || !window.cocoSsd) throw new Error("Vehicle detector did not load");
      await window.tf.ready();
      detector = await window.cocoSsd.load({ base: "lite_mobilenet_v2" });
      return detector;
    })().catch((error) => {
      console.warn("[FleetInspect] Automatic vehicle guide unavailable", error);
      detectorFailed = true;
      setAssistState("manual", text("manual"), 0);
      return null;
    });

    return detectorPromise;
  }

  function createAssistUi() {
    const frame = document.querySelector(".photo-camera-frame");
    if (!frame || document.querySelector("#vehicleCaptureAssist")) return;

    const root = document.createElement("div");
    root.id = "vehicleCaptureAssist";
    root.className = "vehicle-capture-assist is-searching";
    root.setAttribute("aria-live", "polite");
    root.innerHTML = `
      <div class="vehicle-assist-status">
        <span class="vehicle-assist-dot"></span>
        <strong id="vehicleAssistMessage"></strong>
        <small id="vehicleAssistBadge"></small>
      </div>
      <div id="vehicleGuide" class="vehicle-guide" aria-hidden="true"></div>
      <div class="vehicle-assist-progress" aria-hidden="true"><span id="vehicleAssistProgress"></span></div>
    `;
    frame.appendChild(root);

    ui.root = root;
    ui.guide = root.querySelector("#vehicleGuide");
    ui.message = root.querySelector("#vehicleAssistMessage");
    ui.badge = root.querySelector("#vehicleAssistBadge");
    ui.progress = root.querySelector("#vehicleAssistProgress");
    ui.video = document.querySelector("#cameraVideo");
    ui.frame = frame;
    ui.captureScreen = document.querySelector("#captureScreen");
    ui.captureButton = document.querySelector("#capturePhoto");

    updateGuide();
    updateLanguage();
  }

  function updateLanguage() {
    if (!ui.badge) return;
    ui.badge.textContent = text("badge");
    if (ui.root?.dataset.state === "manual") setAssistState("manual", text("manual"), 0);
  }

  function currentStep() {
    return ui.captureScreen?.dataset.step || "front";
  }

  function exteriorPath(kind) {
    const front = `
      <g class="sprinter-lines">
        <path d="M292 500 L268 466 L282 196 Q292 105 384 82 H616 Q708 105 718 196 L732 466 L708 500 Z"/>
        <path d="M330 220 Q344 132 405 119 H595 Q656 132 670 220 Z"/>
        <path d="M304 250 H696 M320 410 Q500 446 680 410 M342 452 H658"/>
        <path d="M310 294 L372 276 L382 326 L312 335 Z M690 294 L628 276 L618 326 L688 335 Z"/>
        <path d="M438 350 H562 L578 401 H422 Z M450 371 H550 M452 391 H548"/>
        <path d="M270 250 L226 276 L220 320 L278 314 M730 250 L774 276 L780 320 L722 314"/>
        <path d="M318 500 V526 M682 500 V526"/>
      </g>`;
    const side = `
      <g class="sprinter-lines">
        <path d="M90 466 L108 285 L226 132 Q256 102 326 96 H836 Q887 99 900 150 L918 450 L884 478 H112 Z"/>
        <path d="M119 282 L244 148 H335 L343 283 Z M361 139 H822 Q854 145 862 181 L871 284 H361 Z"/>
        <path d="M345 128 V450 M642 132 V451 M872 284 H344 M108 314 H914"/>
        <path d="M169 470 A82 82 0 0 1 333 470 M701 470 A82 82 0 0 1 865 470"/>
        <circle cx="251" cy="470" r="55"/><circle cx="783" cy="470" r="55"/>
        <path d="M390 326 H600 M401 350 H589 M651 326 H830"/>
        <path d="M210 160 L198 254 L124 294 M889 194 L921 213 L919 257"/>
      </g>`;
    const frontQuarter = `
      <g class="sprinter-lines">
        <path d="M92 462 L126 258 L286 113 Q316 88 370 86 H760 Q831 91 865 143 L918 421 L872 486 H132 Z"/>
        <path d="M150 259 L305 125 H397 L410 276 Z M432 122 H746 Q800 129 820 166 L844 280 H431 Z"/>
        <path d="M412 109 V458 M412 281 H848 M648 120 V455"/>
        <path d="M123 320 L410 284 L410 458 L103 445 M410 320 H897"/>
        <path d="M159 466 A77 77 0 0 1 313 466 M711 466 A77 77 0 0 1 865 466"/>
        <circle cx="236" cy="466" r="50"/><circle cx="788" cy="466" r="50"/>
        <path d="M122 354 L208 332 L218 386 L112 404 Z M265 407 H376 M696 329 H824"/>
      </g>`;
    const rearQuarter = `
      <g class="sprinter-lines">
        <path d="M83 454 L119 147 Q128 91 193 82 H699 Q760 87 793 118 L908 239 L925 442 L884 486 H116 Z"/>
        <path d="M151 122 H398 V304 H130 L142 159 Q145 134 151 122 Z M417 122 H684 Q731 127 758 153 L844 244 H417 Z"/>
        <path d="M407 92 V455 M407 119 H407 M407 305 H858 M117 315 H915 M647 122 V455"/>
        <path d="M118 168 H150 V384 H105 M369 150 H397 V388 H365"/>
        <path d="M146 470 A76 76 0 0 1 298 470 M718 470 A76 76 0 0 1 870 470"/>
        <circle cx="222" cy="470" r="50"/><circle cx="794" cy="470" r="50"/>
        <path d="M196 352 H330 M455 342 H618 M692 344 H822"/>
      </g>`;
    const rear = `
      <g class="sprinter-lines">
        <path d="M286 505 L263 474 L278 156 Q285 92 360 78 H640 Q715 92 722 156 L737 474 L714 505 Z"/>
        <path d="M315 126 H685 V352 H315 Z M500 126 V457 M315 362 H685"/>
        <path d="M302 166 H330 V405 H298 M670 166 H698 V405 H702"/>
        <path d="M352 395 H648 V454 H352 Z M398 476 H602"/>
        <path d="M454 306 H482 M518 306 H546 M325 505 V528 M675 505 V528"/>
      </g>`;
    if (kind === "front") return front;
    if (kind === "side") return side;
    if (kind === "frontQuarter") return frontQuarter;
    if (kind === "rearQuarter") return rearQuarter;
    return rear;
  }

  function interiorPath() {
    return `
      <g class="sprinter-lines">
        <path d="M112 390 Q150 226 312 170 H688 Q850 226 888 390 L836 498 H164 Z"/>
        <path d="M202 353 Q245 230 342 208 H658 Q755 230 798 353 Z"/>
        <path d="M160 394 H840 M250 394 L295 470 H705 L750 394"/>
        <path d="M351 364 H649 V455 H351 Z M391 389 H609 M407 418 H593"/>
        <circle cx="278" cy="391" r="73"/><circle cx="278" cy="391" r="39"/>
        <path d="M116 390 L78 355 M884 390 L922 355 M458 176 V216 M542 176 V216"/>
      </g>`;
  }

  function silhouetteSvg(step) {
    let kind = "front";
    let mirror = false;
    if (step === "front_left") kind = "frontQuarter";
    if (step === "front_right") { kind = "frontQuarter"; mirror = true; }
    if (step === "left_side") kind = "side";
    if (step === "right_side") { kind = "side"; mirror = true; }
    if (step === "rear_left") kind = "rearQuarter";
    if (step === "rear_right") { kind = "rearQuarter"; mirror = true; }
    if (step === "rear") kind = "rear";

    const paths = step === "interior" ? interiorPath() : exteriorPath(kind);
    return `
      <svg class="vehicle-guide-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" focusable="false">
        <g ${mirror ? 'transform="translate(1000 0) scale(-1 1)"' : ""}>${paths}</g>
      </svg>`;
  }

  function updateGuide() {
    if (!ui.guide) return;
    const step = currentStep();
    if (step === lastStep && ui.guide.firstElementChild) return;
    lastStep = step;
    stableSince = 0;
    lastBox = null;
    previousInteriorFrame = null;
    ui.guide.innerHTML = silhouetteSvg(step);
    setAssistState("searching", text(step === "interior" ? "interior" : "search"), 0);
  }

  function setAssistState(state, message, progress) {
    if (!ui.root) return;
    ui.root.dataset.state = state;
    ui.root.className = `vehicle-capture-assist is-${state}`;
    if (ui.message) ui.message.textContent = message;
    if (ui.progress) ui.progress.style.width = `${Math.round(Math.max(0, Math.min(1, progress || 0)) * 100)}%`;
  }

  function isCaptureActive() {
    return Boolean(
      ui.captureScreen &&
      !ui.captureScreen.classList.contains("hidden") &&
      ui.captureScreen.dataset.captureState !== "review" &&
      ui.video?.readyState >= 2 &&
      ui.video.videoWidth > 0
    );
  }

  function mapDetectionToFrame(bbox) {
    const frameRect = ui.frame.getBoundingClientRect();
    const videoRect = ui.video.getBoundingClientRect();
    const sourceWidth = ui.video.videoWidth;
    const sourceHeight = ui.video.videoHeight;
    if (!frameRect.width || !frameRect.height || !sourceWidth || !sourceHeight) return null;

    const scale = Math.max(videoRect.width / sourceWidth, videoRect.height / sourceHeight);
    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;
    const cropX = (videoRect.width - drawnWidth) / 2;
    const cropY = (videoRect.height - drawnHeight) / 2;
    const [x, y, width, height] = bbox;

    return {
      x: (videoRect.left - frameRect.left + cropX + x * scale) / frameRect.width,
      y: (videoRect.top - frameRect.top + cropY + y * scale) / frameRect.height,
      w: (width * scale) / frameRect.width,
      h: (height * scale) / frameRect.height,
    };
  }

  function chooseVehicle(predictions) {
    const candidates = predictions
      .filter((item) => VEHICLE_CLASSES.has(item.class) && item.score >= 0.34)
      .map((item) => ({ ...item, mapped: mapDetectionToFrame(item.bbox) }))
      .filter((item) => item.mapped)
      .sort((a, b) => (b.mapped.w * b.mapped.h * b.score) - (a.mapped.w * a.mapped.h * a.score));
    return candidates[0] || null;
  }

  function evaluateAlignment(box, target) {
    const centerX = box.x + box.w / 2;
    const centerY = box.y + box.h / 2;
    const targetCenterX = target.x + target.w / 2;
    const targetCenterY = target.y + target.h / 2;
    const centerError = Math.hypot(
      (centerX - targetCenterX) / target.w,
      (centerY - targetCenterY) / target.h
    );
    const widthRatio = box.w / target.w;
    const heightRatio = box.h / target.h;

    if (widthRatio < 0.58 || heightRatio < 0.46) return { aligned: false, reason: "closer" };
    if (widthRatio > 1.24 || heightRatio > 1.3) return { aligned: false, reason: "farther" };
    if (centerError > 0.19) return { aligned: false, reason: "center" };
    return { aligned: true, reason: "steady" };
  }

  function movementFrom(previous, current) {
    if (!previous || !current) return 1;
    const previousCenterX = previous.x + previous.w / 2;
    const previousCenterY = previous.y + previous.h / 2;
    const currentCenterX = current.x + current.w / 2;
    const currentCenterY = current.y + current.h / 2;
    return Math.max(
      Math.abs(currentCenterX - previousCenterX),
      Math.abs(currentCenterY - previousCenterY),
      Math.abs(current.w - previous.w),
      Math.abs(current.h - previous.h)
    );
  }

  function sampleInteriorFrame() {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 30;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(ui.video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const frame = new Uint8Array(canvas.width * canvas.height);
    let brightness = 0;
    for (let source = 0, target = 0; source < pixels.length; source += 4, target += 1) {
      const value = Math.round(pixels[source] * 0.2126 + pixels[source + 1] * 0.7152 + pixels[source + 2] * 0.0722);
      frame[target] = value;
      brightness += value;
    }
    brightness /= frame.length;
    let difference = 255;
    if (previousInteriorFrame) {
      let total = 0;
      for (let index = 0; index < frame.length; index += 1) total += Math.abs(frame[index] - previousInteriorFrame[index]);
      difference = total / frame.length;
    }
    previousInteriorFrame = frame;
    return { brightness, difference };
  }

  function updateStableState(aligned, reason, box, holdMs) {
    const now = performance.now();
    if (!aligned) {
      stableSince = 0;
      lastBox = box || null;
      setAssistState("adjust", text(reason), 0);
      return;
    }

    const movement = movementFrom(lastBox, box);
    lastBox = box || lastBox;
    if (!stableSince || movement > 0.038) stableSince = now;
    const progress = Math.max(0, Math.min(1, (now - stableSince) / holdMs));
    setAssistState(progress >= 1 ? "ready" : "steady", text(progress >= 1 ? "ready" : "steady"), progress);
    if (progress >= 1) autoCapture();
  }

  async function analyzeExterior() {
    const model = await ensureDetector();
    if (!model || !isCaptureActive()) return;
    const predictions = await model.detect(ui.video, 5, 0.3);
    const vehicle = chooseVehicle(predictions);
    if (!vehicle) {
      stableSince = 0;
      lastBox = null;
      setAssistState("searching", text("search"), 0);
      return;
    }
    const target = targetByStep[currentStep()] || targetByStep.front;
    const result = evaluateAlignment(vehicle.mapped, target);
    updateStableState(result.aligned, result.reason, vehicle.mapped, AUTO_CAPTURE_HOLD_MS);
  }

  function analyzeInterior() {
    const sample = sampleInteriorFrame();
    const usableLight = sample.brightness > 38 && sample.brightness < 232;
    const stable = usableLight && sample.difference < 5.6;
    updateStableState(stable, "interior", lastBox || { x: 0.1, y: 0.25, w: 0.8, h: 0.5 }, INTERIOR_HOLD_MS);
  }

  async function autoCapture() {
    if (autoCapturing || !isCaptureActive() || !ui.captureButton) return;
    autoCapturing = true;
    setAssistState("ready", text("ready"), 1);
    if (navigator.vibrate) navigator.vibrate(45);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    ui.captureButton.click();
    setAssistState("captured", text("captured"), 1);

    await new Promise((resolve) => window.setTimeout(resolve, 820));
    const stepNumber = Number(document.querySelector("#currentStepNumber")?.textContent || 1);
    if (stepNumber < 9 && ui.captureScreen?.dataset.captureState === "review") {
      ui.captureButton.click();
    } else if (stepNumber >= 9) {
      setAssistState("captured", text("final"), 1);
    }
    stableSince = 0;
    lastBox = null;
    previousInteriorFrame = null;
    autoCapturing = false;
  }

  async function detectionLoop() {
    window.clearTimeout(loopTimer);
    if (!isCaptureActive() || autoCapturing || detectionBusy) {
      loopTimer = window.setTimeout(detectionLoop, DETECTION_INTERVAL_MS);
      return;
    }

    detectionBusy = true;
    try {
      updateGuide();
      if (currentStep() === "interior") analyzeInterior();
      else await analyzeExterior();
    } catch (error) {
      console.warn("[FleetInspect] Vehicle alignment check failed", error);
    } finally {
      detectionBusy = false;
      loopTimer = window.setTimeout(detectionLoop, DETECTION_INTERVAL_MS);
    }
  }

  function observeCaptureState() {
    const observer = new MutationObserver(() => {
      updateGuide();
      if (isCaptureActive()) detectionLoop();
      else {
        stableSince = 0;
        lastBox = null;
      }
    });
    observer.observe(ui.captureScreen, { attributes: true, attributeFilter: ["class", "data-step", "data-capture-state"] });
    ui.video.addEventListener("playing", detectionLoop);
    window.addEventListener("fleetinspect:language", updateLanguage);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && isCaptureActive()) detectionLoop();
    });
  }

  function init() {
    createAssistUi();
    if (!ui.root || !ui.captureScreen || !ui.video) return;
    observeCaptureState();
    detectionLoop();
  }

  window.FleetInspectVehicleGuides = Object.freeze({ render: silhouetteSvg });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
