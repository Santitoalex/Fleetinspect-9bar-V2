import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const app = express();
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR || "./data";
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_MAX_PAIRS = Number(process.env.OPENAI_MAX_PAIRS || 9);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 60000);
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "fleetinspect-photos";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "inspections";
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

const inspectionsDir = path.join(DATA_DIR, "inspections");
const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_BUCKET);
const supabase = supabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: WebSocket },
    })
  : null;

app.use(express.json({ limit: "45mb" }));
app.use(express.static(process.cwd(), {
  etag: false,
  maxAge: 0,
  setHeaders(response) {
    response.setHeader("Cache-Control", "no-store");
  },
}));

await fs.mkdir(inspectionsDir, { recursive: true });

app.get(["/", "/driver", "/driver/"], (_request, response) => {
  response.sendFile(path.join(process.cwd(), "index.html"));
});

app.get(["/admin", "/admin/"], (_request, response) => {
  response.sendFile(path.join(process.cwd(), "admin.html"));
});

app.post("/api/admin/unlock", (request, response) => {
  if (request.body?.pin !== ADMIN_PIN) {
    return response.status(401).json({ ok: false, error: "Incorrect PIN" });
  }
  response.json({ ok: true });
});

app.get("/api/status", (_request, response) => {
  response.json({
    driveConfigured: supabaseEnabled,
    supabaseConfigured: supabaseEnabled,
    cloudStorageConfigured: supabaseEnabled,
    firestoreConfigured: supabaseEnabled,
    aiConfigured: Boolean(OPENAI_API_KEY),
    model: OPENAI_MODEL,
    storageProvider: supabaseEnabled ? "supabase" : "local",
  });
});

app.get("/api/inspections", async (_request, response) => {
  if (supabaseEnabled) {
    const supabaseItems = await listSupabaseInspections().catch(() => null);
    if (supabaseItems) return response.json(supabaseItems);
  }

  const files = await fs.readdir(inspectionsDir).catch(() => []);
  const items = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(inspectionsDir, file), "utf8");
      items.push(JSON.parse(raw));
    } catch {
      // Ignore damaged local files.
    }
  }

  items.sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));
  response.json(items);
});

app.get("/api/inspections/:id", async (request, response) => {
  const item = supabaseEnabled
    ? await readSupabaseInspection(request.params.id).catch(() => null)
    : await readInspection(request.params.id);
  if (!item) return response.status(404).json({ ok: false, error: "Report not found" });
  response.json(item);
});

app.post("/api/inspections", async (request, response) => {
  const payload = request.body || {};
  const id = safeName(payload.id || `inspection-${Date.now()}`);
  const dateKey = new Date(payload.finishedAt || Date.now()).toISOString().slice(0, 10);

  const item = {
    id,
    driverName: String(payload.driverName || "").trim(),
    plate: String(payload.plate || "").trim().toUpperCase(),
    startedAt: payload.startedAt || new Date().toISOString(),
    finishedAt: payload.finishedAt || new Date().toISOString(),
    notes: payload.notes || "",
    ai: payload.ai || { label: "Pending", summary: "Pending review." },
    photos: Array.isArray(payload.photos) ? payload.photos : [],
    drive: null,
  };

  if (!item.driverName || !item.plate || item.photos.length === 0) {
    return response.status(400).json({ ok: false, error: "Missing details or photos." });
  }

  let previousInspection = supabaseEnabled
    ? await findPreviousSupabaseInspection(item.plate, item.id).catch(() => null)
    : await findPreviousInspection(item.plate, item.id);
  item.ai = await analyzeInspection(item, previousInspection);

  if (supabaseEnabled) {
    try {
      await saveToSupabase(item, dateKey);
    } catch (error) {
      return response.status(502).json({ ok: false, error: error.message });
    }
  }

  await fs.writeFile(path.join(inspectionsDir, `${id}.json`), JSON.stringify(item, null, 2));
  response.json({ ok: true, item });
});

async function saveToSupabase(item, dateKey) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const plateKey = safeName(item.plate);
  const folderPath = `fleetinspect/${plateKey}/${dateKey}/${item.id}`;
  const storedPhotos = [];

  for (const [index, photo] of item.photos.entries()) {
    const parsed = parseDataUrl(photo.url);
    const objectPath = `${folderPath}/${String(index + 1).padStart(2, "0")}-${safeName(photo.id || photo.label || "photo")}.jpg`;
    const buffer = Buffer.from(parsed.base64, "base64");
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, buffer, {
        contentType: parsed.mimeType,
        upsert: true,
        cacheControl: "0",
      });

    if (error) throw new Error(`Supabase Storage: ${error.message}`);

    storedPhotos.push({
      ...photo,
      url: "",
      storagePath: objectPath,
      bytes: buffer.byteLength,
    });
  }

  item.photos = await Promise.all(storedPhotos.map(signSupabasePhoto));
  item.storage = {
    provider: "supabase",
    bucket: SUPABASE_BUCKET,
    folderPath,
  };
  item.drive = {
    folderUrl: getSupabaseBucketUrl(),
  };

  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(item, { onConflict: "id" });

  if (error) throw new Error(`Supabase Database: ${error.message}`);
}

async function listSupabaseInspections() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .order("finishedAt", { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);
  return data || [];
}

async function readSupabaseInspection(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .eq("id", safeName(id))
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? withSignedSupabasePhotos(data) : null;
}

async function findPreviousSupabaseInspection(plate, currentId) {
  if (!supabase) return null;

  const normalizedPlate = String(plate || "").trim().toUpperCase();
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .eq("plate", normalizedPlate)
    .order("finishedAt", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  const previous = (data || []).find((item) => item.id !== currentId) || null;
  return previous ? withSignedSupabasePhotos(previous) : null;
}

async function withSignedSupabasePhotos(item) {
  return {
    ...item,
    photos: await Promise.all((item.photos || []).map(signSupabasePhoto)),
  };
}

async function signSupabasePhoto(photo) {
  if (!supabase || !photo.storagePath) return photo;

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(photo.storagePath, SIGNED_URL_SECONDS);

  return {
    ...photo,
    url: error ? photo.url : data.signedUrl,
  };
}

function getSupabaseBucketUrl() {
  const match = SUPABASE_URL.match(/^https:\/\/([^.]+)\.supabase\.co/i);
  if (!match) return SUPABASE_URL;
  return `https://supabase.com/dashboard/project/${match[1]}/storage/buckets/${SUPABASE_BUCKET}`;
}

async function readInspection(id) {
  try {
    const raw = await fs.readFile(path.join(inspectionsDir, `${safeName(id)}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function findPreviousInspection(plate, currentId) {
  const files = await fs.readdir(inspectionsDir).catch(() => []);
  const normalizedPlate = String(plate || "").trim().toUpperCase();
  const items = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(inspectionsDir, file), "utf8");
      const item = JSON.parse(raw);
      if (item.id !== currentId && String(item.plate || "").trim().toUpperCase() === normalizedPlate) {
        items.push(item);
      }
    } catch {
      // Ignore damaged local files.
    }
  }

  items.sort((a, b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt));
  return items[0] || null;
}

async function analyzeInspection(current, previous) {
  if (!OPENAI_API_KEY) {
    return {
      label: "AI not configured",
      severity: "unknown",
      newDamageDetected: false,
      summary: "OpenAI API key is not configured. Inspection was saved without automatic damage comparison.",
    };
  }

  if (!previous) {
    return {
      label: "Baseline saved",
      severity: "none",
      newDamageDetected: false,
      summary: "This is the first saved inspection for this registration. It will be used as the baseline for future comparisons.",
    };
  }

  const comparisons = buildPhotoComparisons(current, previous).slice(0, OPENAI_MAX_PAIRS);
  if (!comparisons.length) {
    return {
      label: "No matching previous photos",
      severity: "unknown",
      newDamageDetected: false,
      summary: "No matching previous photos were found for the same vehicle views.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    const content = [
      {
        type: "input_text",
        text: [
          "Eres un asistente profesional de inspeccion de danos en vehiculos de flota.",
          `Matricula: ${current.plate}.`,
          `Inspeccion anterior: ${previous.finishedAt || previous.startedAt || "unknown"}. Inspeccion actual: ${current.finishedAt || current.startedAt || "unknown"}.`,
          "Compara cada foto anterior con la foto actual de la misma vista.",
          "Busca SOLO danos NUEVOS visibles: golpes, abolladuras, rayones profundos, grietas, luces rotas, piezas faltantes, danos en rueda/neumatico, espejo, parachoques o deformacion de panel.",
          "No marques suciedad, reflejos, lluvia, sombras, cambios de luz, angulo de camara, desenfoque, o danos que ya aparecen en la foto anterior.",
          "Si tienes duda, baja la confianza y no marques dano nuevo salvo que sea claro.",
          "Responde en espanol.",
          "Return strict JSON only with this shape:",
          "{\"newDamageDetected\":boolean,\"severity\":\"none|minor|moderate|severe|unknown\",\"label\":\"short label in Spanish\",\"summary\":\"short Spanish summary\",\"findings\":[{\"view\":\"Front\",\"description\":\"...\",\"confidence\":\"low|medium|high\"}],\"recommendation\":\"short operational recommendation in Spanish\"}",
        ].join(" "),
      },
    ];

    comparisons.forEach((comparison) => {
      content.push({ type: "input_text", text: `Previous ${comparison.label}` });
      content.push({ type: "input_image", image_url: comparison.previous.url });
      content.push({ type: "input_text", text: `Current ${comparison.label}` });
      content.push({ type: "input_image", image_url: comparison.current.url });
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [{ role: "user", content }],
        temperature: 0,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || "OpenAI analysis failed.");
    }

    const text = extractResponseText(result);
    const parsed = parseAiJson(text);

    return {
      label: parsed.label || (parsed.newDamageDetected ? "Possible new damage" : "No new damage detected"),
      severity: parsed.severity || "unknown",
      newDamageDetected: Boolean(parsed.newDamageDetected),
      summary: parsed.summary || "AI comparison completed.",
      recommendation: parsed.recommendation || "",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      comparedWith: previous.id,
      comparedAt: new Date().toISOString(),
      comparedViews: comparisons.length,
      model: OPENAI_MODEL,
    };
  } catch (error) {
    return {
      label: "AI analysis failed",
      severity: "unknown",
      newDamageDetected: false,
      summary: `AI analysis could not be completed: ${error.message}`,
      comparedWith: previous.id,
    };
  }
}

function buildPhotoComparisons(current, previous) {
  const previousById = new Map((previous.photos || []).map((photo) => [photo.id, photo]));
  return (current.photos || [])
    .map((currentPhoto) => ({
      label: currentPhoto.label || currentPhoto.id,
      current: currentPhoto,
      previous: previousById.get(currentPhoto.id),
    }))
    .filter((comparison) => comparison.current?.url && comparison.previous?.url);
}

function extractResponseText(result) {
  if (typeof result.output_text === "string") return result.output_text;
  return (result.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}

function parseAiJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!cleaned.startsWith("{")) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  }
  return JSON.parse(cleaned);
}

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid photo.");
  return { mimeType: match[1], base64: match[2] };
}

function safeName(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "sin_nombre";
}

app.listen(PORT, HOST, () => {
  console.log(`FleetInspect Pro listo en http://${HOST}:${PORT}`);
});
