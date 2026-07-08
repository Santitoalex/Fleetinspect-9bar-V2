window.FI18N = (() => {
  const translations = {
    en: {
      dailyInspection: "Daily vehicle inspection",
      vehicleInspectionPortal: "Vehicle inspection portal",
      admin: "Admin",
      dailyReport: "Daily report",
      driverVehicleId: "Driver and vehicle identification",
      enterDetails: "Enter the details before opening the camera.",
      guidedViews: "Guided views",
      reportReady: "Report ready",
      cloudSync: "Cloud sync",
      checkIn: "Driver check-in",
      captureStep: "Capture step",
      inspectionStatus: "Inspection status",
      driverName: "Driver name",
      driverPlaceholder: "Example: John Smith",
      registrationNumber: "Registration number",
      selectRegistration: "Select registration",
      startPhotos: "Start photos",
      newReport: "New report",
      cameraPending: "Camera pending",
      allowCamera: "Allow camera access to start the inspection.",
      capturedPhoto: "Captured photo",
      capture: "Capture",
      nextPhoto: "Next photo",
      previousPhoto: "Back",
      retakePhoto: "Retake photo",
      zoomPhoto: "Zoom photo",
      saveInspection: "Save inspection",
      saving: "Saving...",
      driverNotes: "Driver notes",
      notesPlaceholder: "Visible damage, incidents, mileage...",
      aiAnalysis: "AI analysis",
      aiInitial: "Capture all views to save and review the inspection.",
      missingDetails: "Enter the driver name and registration number.",
      cameraNoAccess: "Camera could not be opened. Check browser permissions.",
      cameraNotReady: "The camera is not ready yet. Wait a moment and press again.",
      takeCurrentFirst: "Take the photo for this view first.",
      missingPhotos: "Some photos are still missing.",
      savedOk: "Inspection saved successfully.",
      couldNotSave: "Could not save",
      saveTimedOut: "The server took too long to respond. The photos are still on this screen; try saving again with better connection.",
      saveConnectionFailed: "Connection failed while uploading. The photos are still on this screen; try saving again.",
      savedPendingRetry: "A backup copy was kept on this device and the app will retry when it has connection.",
      retryWithoutClosing: "Keep this screen open and press Save again.",
      aiComplete: "Inspection completed with {count} photos. Review the report to compare possible new damage.",
      allPhotosDone: "All photos completed. Press Save inspection.",
      photoSaved: "Photo saved. Press Next photo.",
      placeVehicle: "Place the vehicle in frame and press Capture.",
      done: "done",
      current: "current",
      pending: "pending",
      front: "Front",
      frontLeft: "Front left",
      leftSide: "Left side",
      rearLeft: "Rear left",
      rear: "Rear",
      rearRight: "Rear right",
      rightSide: "Right side",
      frontRight: "Front right",
      interior: "Interior",
      fleetInspect: "FleetInspect",
      dashboard: "Dashboard",
      captureApp: "Capture app",
      aiAlerts: "AI alerts",
      vehicles: "Vehicles",
      reports: "Reports",
      searchPlaceholder: "Search vehicle, driver or registration",
      refresh: "Refresh",
      fleetControl: "Fleet control center",
      inspectionDashboard: "Inspection dashboard",
      allInspections: "All inspections",
      aiAlertsOnly: "AI alerts only",
      noNewDamage: "No new damage",
      adminPin: "Admin PIN",
      enter: "Enter",
      inspections: "Inspections",
      photos: "Photos",
      today: "Today",
      aiDamageDetection: "AI damage detection",
      latestDamage: "Latest possible new damage",
      groupedRegistration: "Grouped by registration",
      inspectionHistory: "Inspection history",
      reportsPdfsDrive: "Reports, PDFs and Drive folders",
      loadingReports: "Loading reports...",
      reportsCouldNotLoad: "Reports could not be loaded.",
      noReports: "No reports yet.",
      noAiAlerts: "No AI alerts detected yet.",
      noVehicleInspections: "No vehicle inspections yet.",
      possibleNewDamage: "Possible new damage",
      reviewInspection: "Review this inspection.",
      review: "Review",
      vehicle: "Vehicle",
      noRegistration: "No registration",
      noDriver: "No driver",
      aiPending: "AI pending",
      noAiSummary: "No AI summary available.",
      openDrive: "Open storage folder",
      viewPdf: "View PDF report",
      latest: "Latest",
      alert: "alert",
      alerts: "alerts",
      inspection: "inspection",
      language: "Language"
      ,systemStatus: "System status"
      ,operationalHealth: "Operational health"
      ,driveConfiguration: "Supabase configuration"
      ,driveStorage: "Cloud storage"
      ,aiService: "AI damage detection"
      ,recentActivity: "Recent activity"
      ,latestSubmissions: "Latest driver submissions"
      ,configured: "Configured"
      ,notConfigured: "Not configured"
      ,synced: "Synced"
      ,noDriveLinks: "No storage links yet"
      ,noRecentActivity: "No recent activity yet."
      ,controlRoom: "Professional inspection control room for 9Bar Solutions GmbH."
      ,operationsOverview: "Operations overview"
      ,exportCsv: "Export CSV"
      ,print: "Print"
      ,lastSync: "Last sync"
      ,filtered: "Filtered"
      ,dateRange: "Date range"
      ,allDates: "All dates"
      ,last7Days: "Last 7 days"
      ,last30Days: "Last 30 days"
      ,priorityQueue: "Priority queue"
      ,priorityQueueSubtitle: "Inspections that need attention first"
      ,fleetCoverage: "Fleet coverage"
      ,completionQueue: "Completion queue"
      ,noPriorityItems: "No priority items."
      ,viewReport: "View report"
      ,openFolder: "Open folder"
      ,healthGood: "Inspection OK"
      ,ready: "Ready"
      ,needsSetup: "Needs setup"
    },
    es: {
      dailyInspection: "Inspección diaria del vehículo",
      vehicleInspectionPortal: "Portal de inspección de vehículos",
      admin: "Admin",
      dailyReport: "Parte diario",
      driverVehicleId: "Identificación del conductor y vehículo",
      enterDetails: "Introduce los datos antes de abrir la cámara.",
      guidedViews: "Vistas guiadas",
      reportReady: "Reporte listo",
      cloudSync: "Sincronización cloud",
      checkIn: "Registro del conductor",
      captureStep: "Paso de captura",
      inspectionStatus: "Estado de inspección",
      driverName: "Nombre del conductor",
      driverPlaceholder: "Ejemplo: Juan Pérez",
      registrationNumber: "Matrícula",
      selectRegistration: "Selecciona matrícula",
      startPhotos: "Empezar fotos",
      newReport: "Nuevo parte",
      cameraPending: "Cámara pendiente",
      allowCamera: "Permite la cámara para iniciar la inspección.",
      capturedPhoto: "Foto capturada",
      capture: "Capturar",
      nextPhoto: "Siguiente foto",
      previousPhoto: "Atrás",
      retakePhoto: "Repetir foto",
      zoomPhoto: "Ampliar foto",
      saveInspection: "Guardar inspección",
      saving: "Guardando...",
      driverNotes: "Notas del conductor",
      notesPlaceholder: "Daños visibles, incidencias, kilometraje...",
      aiAnalysis: "Análisis IA",
      aiInitial: "Captura todas las vistas para guardar y revisar la inspección.",
      missingDetails: "Introduce el nombre del conductor y la matrícula.",
      cameraNoAccess: "No se pudo abrir la cámara. Revisa los permisos del navegador.",
      cameraNotReady: "La cámara todavía no está lista. Espera un momento y pulsa otra vez.",
      takeCurrentFirst: "Primero haz la foto de esta vista.",
      missingPhotos: "Faltan fotos por hacer.",
      savedOk: "Inspección guardada correctamente.",
      couldNotSave: "No se pudo guardar",
      saveTimedOut: "El servidor tardó demasiado en responder. Las fotos siguen en esta pantalla; intenta guardar otra vez con mejor conexión.",
      saveConnectionFailed: "Falló la conexión al subir. Las fotos siguen en esta pantalla; intenta guardar otra vez.",
      savedPendingRetry: "Se guardó una copia en este móvil y la app volverá a intentarlo cuando tenga conexión.",
      retryWithoutClosing: "No cierres esta pantalla y pulsa Guardar otra vez.",
      aiComplete: "Inspección completa con {count} fotos. Revisa el reporte para comparar posibles daños nuevos.",
      allPhotosDone: "Fotos completas. Pulsa Guardar inspección.",
      photoSaved: "Foto guardada. Pulsa Siguiente foto.",
      placeVehicle: "Coloca el vehículo en pantalla y pulsa Capturar.",
      done: "lista",
      current: "actual",
      pending: "pendiente",
      front: "Delantera",
      frontLeft: "Delantera izquierda",
      leftSide: "Parte izquierda",
      rearLeft: "Trasera izquierda",
      rear: "Trasera",
      rearRight: "Trasera derecha",
      rightSide: "Parte derecha",
      frontRight: "Delantera derecha",
      interior: "Interior",
      fleetInspect: "FleetInspect",
      dashboard: "Dashboard",
      captureApp: "Captura",
      aiAlerts: "Alertas IA",
      vehicles: "Vehículos",
      reports: "Reportes",
      searchPlaceholder: "Buscar vehículo, conductor o matrícula",
      refresh: "Actualizar",
      fleetControl: "Centro de control de flota",
      inspectionDashboard: "Dashboard de inspecciones",
      allInspections: "Todas las inspecciones",
      aiAlertsOnly: "Solo alertas IA",
      noNewDamage: "Sin daño nuevo",
      adminPin: "PIN administrador",
      enter: "Entrar",
      inspections: "Inspecciones",
      photos: "Fotos",
      today: "Hoy",
      aiDamageDetection: "Detección de daños IA",
      latestDamage: "Últimos posibles daños nuevos",
      groupedRegistration: "Agrupado por matrícula",
      inspectionHistory: "Historial de inspecciones",
      reportsPdfsDrive: "Reportes, PDFs y carpetas Drive",
      loadingReports: "Cargando reportes...",
      reportsCouldNotLoad: "No se pudieron cargar los reportes.",
      noReports: "No hay reportes todavía.",
      noAiAlerts: "No hay alertas IA todavía.",
      noVehicleInspections: "Aún no hay inspecciones.",
      possibleNewDamage: "Posible daño nuevo",
      reviewInspection: "Revisa esta inspección.",
      review: "Revisar",
      vehicle: "Vehículo",
      noRegistration: "Sin matrícula",
      noDriver: "Sin conductor",
      aiPending: "IA pendiente",
      noAiSummary: "No hay resumen IA disponible.",
      openDrive: "Abrir carpeta de almacenamiento",
      viewPdf: "Ver reporte PDF",
      latest: "Última",
      alert: "alerta",
      alerts: "alertas",
      inspection: "inspección",
      language: "Idioma"
      ,systemStatus: "Estado del sistema"
      ,operationalHealth: "Salud operativa"
      ,driveConfiguration: "Configuración Supabase"
      ,driveStorage: "Almacenamiento cloud"
      ,aiService: "Detección de daños IA"
      ,recentActivity: "Actividad reciente"
      ,latestSubmissions: "Últimos envíos de conductores"
      ,configured: "Configurado"
      ,notConfigured: "No configurado"
      ,synced: "Sincronizado"
      ,noDriveLinks: "Aún no hay enlaces de almacenamiento"
      ,noRecentActivity: "Aún no hay actividad reciente."
      ,controlRoom: "Centro profesional de control de inspecciones para 9Bar Solutions GmbH."
      ,operationsOverview: "Resumen operativo"
      ,exportCsv: "Exportar CSV"
      ,print: "Imprimir"
      ,lastSync: "Última actualización"
      ,filtered: "Filtradas"
      ,dateRange: "Rango de fecha"
      ,allDates: "Todas las fechas"
      ,last7Days: "Últimos 7 días"
      ,last30Days: "Últimos 30 días"
      ,priorityQueue: "Prioridad"
      ,priorityQueueSubtitle: "Inspecciones que necesitan atención primero"
      ,fleetCoverage: "Cobertura de flota"
      ,completionQueue: "Cola de inspecciones"
      ,noPriorityItems: "No hay elementos prioritarios."
      ,viewReport: "Ver reporte"
      ,openFolder: "Abrir carpeta"
      ,healthGood: "Inspección OK"
      ,ready: "Listo"
      ,needsSetup: "Falta configurar"
    },
    de: {
      dailyInspection: "Tägliche Fahrzeuginspektion",
      vehicleInspectionPortal: "Portal für Fahrzeuginspektionen",
      admin: "Admin",
      dailyReport: "Tagesbericht",
      driverVehicleId: "Fahrer- und Fahrzeugdaten",
      enterDetails: "Daten eingeben, bevor die Kamera geöffnet wird.",
      guidedViews: "Geführte Ansichten",
      reportReady: "Bericht bereit",
      cloudSync: "Cloud-Sync",
      checkIn: "Fahrer-Check-in",
      captureStep: "Aufnahmeschritt",
      inspectionStatus: "Inspektionsstatus",
      driverName: "Name des Fahrers",
      driverPlaceholder: "Beispiel: Max Müller",
      registrationNumber: "Kennzeichen",
      selectRegistration: "Kennzeichen auswählen",
      startPhotos: "Fotos starten",
      newReport: "Neuer Bericht",
      cameraPending: "Kamera wartet",
      allowCamera: "Kamerazugriff erlauben, um die Inspektion zu starten.",
      capturedPhoto: "Aufgenommenes Foto",
      capture: "Aufnehmen",
      nextPhoto: "Nächstes Foto",
      previousPhoto: "Zurück",
      retakePhoto: "Foto wiederholen",
      zoomPhoto: "Foto vergrößern",
      saveInspection: "Inspektion speichern",
      saving: "Speichern...",
      driverNotes: "Fahrernotizen",
      notesPlaceholder: "Sichtbare Schäden, Vorfälle, Kilometerstand...",
      aiAnalysis: "KI-Analyse",
      aiInitial: "Alle Ansichten aufnehmen, um die Inspektion zu speichern und zu prüfen.",
      missingDetails: "Fahrername und Kennzeichen eingeben.",
      cameraNoAccess: "Kamera konnte nicht geöffnet werden. Browser-Berechtigungen prüfen.",
      cameraNotReady: "Die Kamera ist noch nicht bereit. Kurz warten und erneut drücken.",
      takeCurrentFirst: "Zuerst das Foto dieser Ansicht aufnehmen.",
      missingPhotos: "Es fehlen noch Fotos.",
      savedOk: "Inspektion erfolgreich gespeichert.",
      couldNotSave: "Konnte nicht speichern",
      saveTimedOut: "Der Server hat zu lange gebraucht. Die Fotos bleiben auf diesem Bildschirm; bitte erneut mit besserer Verbindung speichern.",
      saveConnectionFailed: "Verbindung beim Hochladen fehlgeschlagen. Die Fotos bleiben auf diesem Bildschirm; bitte erneut speichern.",
      savedPendingRetry: "Eine Sicherung wurde auf diesem Gerät gespeichert und die App versucht es bei Verbindung erneut.",
      retryWithoutClosing: "Diese Seite offen lassen und erneut Speichern drücken.",
      aiComplete: "Inspektion mit {count} Fotos abgeschlossen. Bericht prüfen, um mögliche neue Schäden zu vergleichen.",
      allPhotosDone: "Alle Fotos abgeschlossen. Inspektion speichern drücken.",
      photoSaved: "Foto gespeichert. Nächstes Foto drücken.",
      placeVehicle: "Fahrzeug im Bild ausrichten und Aufnehmen drücken.",
      done: "fertig",
      current: "aktuell",
      pending: "offen",
      front: "Vorne",
      frontLeft: "Vorne links",
      leftSide: "Linke Seite",
      rearLeft: "Hinten links",
      rear: "Hinten",
      rearRight: "Hinten rechts",
      rightSide: "Rechte Seite",
      frontRight: "Vorne rechts",
      interior: "Innenraum",
      fleetInspect: "FleetInspect",
      dashboard: "Dashboard",
      captureApp: "Aufnahme-App",
      aiAlerts: "KI-Warnungen",
      vehicles: "Fahrzeuge",
      reports: "Berichte",
      searchPlaceholder: "Fahrzeug, Fahrer oder Kennzeichen suchen",
      refresh: "Aktualisieren",
      fleetControl: "Flotten-Kontrollzentrum",
      inspectionDashboard: "Inspektions-Dashboard",
      allInspections: "Alle Inspektionen",
      aiAlertsOnly: "Nur KI-Warnungen",
      noNewDamage: "Kein neuer Schaden",
      adminPin: "Admin-PIN",
      enter: "Einloggen",
      inspections: "Inspektionen",
      photos: "Fotos",
      today: "Heute",
      aiDamageDetection: "KI-Schadenerkennung",
      latestDamage: "Neueste mögliche Schäden",
      groupedRegistration: "Nach Kennzeichen gruppiert",
      inspectionHistory: "Inspektionshistorie",
      reportsPdfsDrive: "Berichte, PDFs und Drive-Ordner",
      loadingReports: "Berichte werden geladen...",
      reportsCouldNotLoad: "Berichte konnten nicht geladen werden.",
      noReports: "Noch keine Berichte.",
      noAiAlerts: "Noch keine KI-Warnungen erkannt.",
      noVehicleInspections: "Noch keine Fahrzeuginspektionen.",
      possibleNewDamage: "Möglicher neuer Schaden",
      reviewInspection: "Diese Inspektion prüfen.",
      review: "Prüfen",
      vehicle: "Fahrzeug",
      noRegistration: "Kein Kennzeichen",
      noDriver: "Kein Fahrer",
      aiPending: "KI ausstehend",
      noAiSummary: "Keine KI-Zusammenfassung verfügbar.",
      openDrive: "Speicherordner öffnen",
      viewPdf: "PDF-Bericht ansehen",
      latest: "Letzte",
      alert: "Warnung",
      alerts: "Warnungen",
      inspection: "Inspektion",
      language: "Sprache"
      ,systemStatus: "Systemstatus"
      ,operationalHealth: "Betriebszustand"
      ,driveConfiguration: "Supabase-Konfiguration"
      ,driveStorage: "Cloud-Speicher"
      ,aiService: "KI-Schadenerkennung"
      ,recentActivity: "Letzte Aktivität"
      ,latestSubmissions: "Neueste Fahrereinsendungen"
      ,configured: "Konfiguriert"
      ,notConfigured: "Nicht konfiguriert"
      ,synced: "Synchronisiert"
      ,noDriveLinks: "Noch keine Speicherlinks"
      ,noRecentActivity: "Noch keine Aktivität."
      ,controlRoom: "Professioneller Kontrollraum für Inspektionen von 9Bar Solutions GmbH."
      ,operationsOverview: "Betriebsübersicht"
      ,exportCsv: "CSV exportieren"
      ,print: "Drucken"
      ,lastSync: "Letzte Aktualisierung"
      ,filtered: "Gefiltert"
      ,dateRange: "Zeitraum"
      ,allDates: "Alle Daten"
      ,last7Days: "Letzte 7 Tage"
      ,last30Days: "Letzte 30 Tage"
      ,priorityQueue: "Priorität"
      ,priorityQueueSubtitle: "Inspektionen, die zuerst geprüft werden müssen"
      ,fleetCoverage: "Flottenabdeckung"
      ,completionQueue: "Inspektionsliste"
      ,noPriorityItems: "Keine Prioritäten."
      ,viewReport: "Bericht ansehen"
      ,openFolder: "Ordner öffnen"
      ,healthGood: "Inspektion OK"
      ,ready: "Bereit"
      ,needsSetup: "Einrichtung nötig"
    },
    ro: {
      dailyInspection: "Inspecție zilnică vehicul",
      vehicleInspectionPortal: "Portal inspecții vehicule",
      admin: "Admin",
      dailyReport: "Raport zilnic",
      driverVehicleId: "Identificare șofer și vehicul",
      enterDetails: "Introduceți datele înainte de a deschide camera.",
      guidedViews: "Unghiuri ghidate",
      reportReady: "Raport pregătit",
      cloudSync: "Sincronizare cloud",
      checkIn: "Check-in șofer",
      captureStep: "Pas captură",
      inspectionStatus: "Stare inspecție",
      driverName: "Numele șoferului",
      driverPlaceholder: "Exemplu: Ion Popescu",
      registrationNumber: "Număr de înmatriculare",
      selectRegistration: "Selectați numărul",
      startPhotos: "Începe fotografiile",
      newReport: "Raport nou",
      cameraPending: "Camera în așteptare",
      allowCamera: "Permiteți accesul la cameră pentru a începe inspecția.",
      capturedPhoto: "Fotografie capturată",
      capture: "Capturează",
      nextPhoto: "Următoarea foto",
      previousPhoto: "Înapoi",
      retakePhoto: "Repetă foto",
      zoomPhoto: "Mărește foto",
      saveInspection: "Salvează inspecția",
      saving: "Se salvează...",
      driverNotes: "Note șofer",
      notesPlaceholder: "Daune vizibile, incidente, kilometraj...",
      aiAnalysis: "Analiză IA",
      aiInitial: "Capturează toate unghiurile pentru a salva și verifica inspecția.",
      missingDetails: "Introduceți numele șoferului și numărul de înmatriculare.",
      cameraNoAccess: "Camera nu a putut fi deschisă. Verificați permisiunile browserului.",
      cameraNotReady: "Camera nu este încă pregătită. Așteptați și apăsați din nou.",
      takeCurrentFirst: "Faceți mai întâi fotografia pentru această vedere.",
      missingPhotos: "Mai lipsesc fotografii.",
      savedOk: "Inspecția a fost salvată cu succes.",
      couldNotSave: "Nu s-a putut salva",
      saveTimedOut: "Serverul a răspuns prea greu. Fotografiile rămân pe acest ecran; încercați din nou cu o conexiune mai bună.",
      saveConnectionFailed: "Conexiunea a eșuat la încărcare. Fotografiile rămân pe acest ecran; încercați din nou.",
      savedPendingRetry: "O copie a fost păstrată pe acest telefon și aplicația va reîncerca atunci când are conexiune.",
      retryWithoutClosing: "Nu închideți acest ecran și apăsați din nou Salvează.",
      aiComplete: "Inspecție finalizată cu {count} fotografii. Verificați raportul pentru posibile daune noi.",
      allPhotosDone: "Toate fotografiile sunt finalizate. Apăsați Salvează inspecția.",
      photoSaved: "Fotografie salvată. Apăsați Următoarea foto.",
      placeVehicle: "Încadrați vehiculul și apăsați Capturează.",
      done: "gata",
      current: "curent",
      pending: "în așteptare",
      front: "Față",
      frontLeft: "Față stânga",
      leftSide: "Partea stângă",
      rearLeft: "Spate stânga",
      rear: "Spate",
      rearRight: "Spate dreapta",
      rightSide: "Partea dreaptă",
      frontRight: "Față dreapta",
      interior: "Interior",
      fleetInspect: "FleetInspect",
      dashboard: "Dashboard",
      captureApp: "Aplicație captură",
      aiAlerts: "Alerte IA",
      vehicles: "Vehicule",
      reports: "Rapoarte",
      searchPlaceholder: "Caută vehicul, șofer sau număr",
      refresh: "Actualizează",
      fleetControl: "Centru control flotă",
      inspectionDashboard: "Dashboard inspecții",
      allInspections: "Toate inspecțiile",
      aiAlertsOnly: "Doar alerte IA",
      noNewDamage: "Fără daune noi",
      adminPin: "PIN admin",
      enter: "Intră",
      inspections: "Inspecții",
      photos: "Fotografii",
      today: "Astăzi",
      aiDamageDetection: "Detectare daune IA",
      latestDamage: "Cele mai recente posibile daune",
      groupedRegistration: "Grupat după număr",
      inspectionHistory: "Istoric inspecții",
      reportsPdfsDrive: "Rapoarte, PDF-uri și foldere Drive",
      loadingReports: "Se încarcă rapoartele...",
      reportsCouldNotLoad: "Rapoartele nu au putut fi încărcate.",
      noReports: "Nu există rapoarte încă.",
      noAiAlerts: "Nu există alerte IA încă.",
      noVehicleInspections: "Nu există inspecții încă.",
      possibleNewDamage: "Posibilă daună nouă",
      reviewInspection: "Verificați această inspecție.",
      review: "Verifică",
      vehicle: "Vehicul",
      noRegistration: "Fără număr",
      noDriver: "Fără șofer",
      aiPending: "IA în așteptare",
      noAiSummary: "Nu există rezumat IA.",
      openDrive: "Deschide folder stocare",
      viewPdf: "Vezi raport PDF",
      latest: "Ultima",
      alert: "alertă",
      alerts: "alerte",
      inspection: "inspecție",
      language: "Limbă"
      ,systemStatus: "Stare sistem"
      ,operationalHealth: "Sănătate operațională"
      ,driveConfiguration: "Configurare Supabase"
      ,driveStorage: "Stocare cloud"
      ,aiService: "Detectare daune IA"
      ,recentActivity: "Activitate recentă"
      ,latestSubmissions: "Ultimele trimiteri ale șoferilor"
      ,configured: "Configurat"
      ,notConfigured: "Neconfigurat"
      ,synced: "Sincronizat"
      ,noDriveLinks: "Nu există linkuri de stocare încă"
      ,noRecentActivity: "Nu există activitate recentă."
      ,controlRoom: "Centru profesional de control al inspecțiilor pentru 9Bar Solutions GmbH."
      ,operationsOverview: "Rezumat operațional"
      ,exportCsv: "Exportă CSV"
      ,print: "Tipărește"
      ,lastSync: "Ultima actualizare"
      ,filtered: "Filtrate"
      ,dateRange: "Interval dată"
      ,allDates: "Toate datele"
      ,last7Days: "Ultimele 7 zile"
      ,last30Days: "Ultimele 30 zile"
      ,priorityQueue: "Prioritate"
      ,priorityQueueSubtitle: "Inspecții care trebuie verificate primele"
      ,fleetCoverage: "Acoperire flotă"
      ,completionQueue: "Listă inspecții"
      ,noPriorityItems: "Nu există priorități."
      ,viewReport: "Vezi raport"
      ,openFolder: "Deschide folder"
      ,healthGood: "Inspecție OK"
      ,ready: "Pregătit"
      ,needsSetup: "Necesită configurare"
    }
  };

  const languages = ["en", "es", "de", "ro"];
  const fallback = "en";

  function getLanguage() {
    const saved = localStorage.getItem("fleetinspect_language");
    if (languages.includes(saved)) return saved;
    const browser = (navigator.language || "").slice(0, 2).toLowerCase();
    return languages.includes(browser) ? browser : fallback;
  }

  function setLanguage(language) {
    const next = languages.includes(language) ? language : fallback;
    localStorage.setItem("fleetinspect_language", next);
    document.documentElement.lang = next;
    applyStatic(next);
    window.dispatchEvent(new CustomEvent("fleetinspect:language", { detail: { language: next } }));
  }

  function t(key, replacements = {}, language = getLanguage()) {
    const value = translations[language]?.[key] || translations[fallback][key] || key;
    return Object.entries(replacements).reduce((text, [name, replacement]) => {
      return text.replaceAll(`{${name}}`, replacement);
    }, value);
  }

  function applyStatic(language = getLanguage()) {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n, {}, language);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder, {}, language));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAria, {}, language));
    });
    document.querySelectorAll("[data-language-select]").forEach((node) => {
      node.value = language;
    });
  }

  function bindLanguageSelectors() {
    document.querySelectorAll("[data-language-select]").forEach((node) => {
      node.value = getLanguage();
      node.addEventListener("change", () => setLanguage(node.value));
    });
    applyStatic();
  }

  return { bindLanguageSelectors, getLanguage, setLanguage, t };
})();
