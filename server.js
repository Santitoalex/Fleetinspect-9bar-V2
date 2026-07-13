import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const app = express();
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR || "./data";
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const OWNER_EMAIL = normalizeEmail(process.env.OWNER_EMAIL || "a.marinescu");
const DISPATCHER_ACCOUNTS = process.env.DISPATCHER_ACCOUNTS || "";
const DISPATCHER_SIGNUP_CODE = process.env.DISPATCHER_SIGNUP_CODE || "";
const DISPATCHER_TABLE = process.env.DISPATCHER_TABLE || "dispatchers";
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.COOKIE_SECRET || ADMIN_PIN || "fleetinspect-session";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_MAX_PAIRS = Number(process.env.OPENAI_MAX_PAIRS || 9);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 60000);
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "fleetinspect-photos";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "inspections";
const ROUTE_PLAN_TABLE = process.env.ROUTE_PLAN_TABLE || "route_plans";
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

const inspectionsDir = path.join(DATA_DIR, "inspections");
const dispatchersDir = path.join(DATA_DIR, "dispatchers");
const dispatchersFile = path.join(dispatchersDir, "accounts.json");
const routePlansDir = path.join(DATA_DIR, "route-plans");
const routePlansFile = path.join(routePlansDir, "plans.json");
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
await fs.mkdir(dispatchersDir, { recursive: true });
await fs.mkdir(routePlansDir, { recursive: true });

function parseDispatcherAccounts() {
  if (!DISPATCHER_ACCOUNTS.trim()) {
    return [{
      username: "admin",
      password: ADMIN_PIN,
      name: "Admin",
      role: "Owner",
    }];
  }

  try {
    const parsed = JSON.parse(DISPATCHER_ACCOUNTS);
    if (Array.isArray(parsed)) {
      return parsed
        .map((account) => ({
          username: String(account.username || account.user || account.email || "").trim(),
          email: normalizeEmail(account.email || account.username || account.user || ""),
          password: String(account.password || ""),
          name: String(account.name || account.username || account.user || account.email || "Dispatcher").trim(),
          role: normalizeRole(account.role || "Dispatcher"),
        }))
        .filter((account) => account.username && account.password);
    }
  } catch {
    // Fall back to the compact format: user:password:name:role,user2:password2:name2:role2
  }

  return DISPATCHER_ACCOUNTS
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [username, password, name, role] = entry.split(":").map((part) => String(part || "").trim());
      return {
        username,
        password,
        name: name || username,
        role: normalizeRole(role || "Dispatcher"),
      };
    })
    .filter((account) => account.username && account.password);
}

async function findDispatcherAccount(username) {
  const normalized = normalizeEmail(username);
  const configured = parseDispatcherAccounts().find((account) => {
    return [account.username, account.email].filter(Boolean).some((value) => normalizeEmail(value) === normalized);
  });
  if (configured) return withEffectiveRole(configured);
  return findStoredDispatcher(normalized);
}

function publicDispatcher(account) {
  const role = getEffectiveRole(account);
  return {
    username: account.username || account.email,
    email: account.email || account.username,
    name: account.name,
    role,
    roleKey: roleKey(role),
    canManageUsers: roleKey(role) === "owner",
    canEditOperations: ["owner", "supervisor", "dispatcher"].includes(roleKey(role)),
  };
}

async function findStoredDispatcher(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (supabase) {
    const { data, error } = await supabase
      .from(DISPATCHER_TABLE)
      .select("*")
      .eq("email", normalized)
      .maybeSingle();

    if (error) throw new Error(`Dispatcher database: ${error.message}`);
    return data ? mapStoredDispatcher(data) : null;
  }

  const accounts = await readLocalDispatchers();
  const account = accounts.find((item) => normalizeEmail(item.email) === normalized) || null;
  return account ? withEffectiveRole(account) : null;
}

async function saveStoredDispatcher(account) {
  const stored = {
    email: normalizeEmail(account.email),
    name: account.name,
    role: normalizeRole(account.role || "Read only"),
    password_hash: account.passwordHash,
    created_at: account.createdAt || new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase
      .from(DISPATCHER_TABLE)
      .insert(stored);

    if (error) throw new Error(`Dispatcher database: ${error.message}`);
    return;
  }

  const accounts = await readLocalDispatchers();
  accounts.push(mapStoredDispatcher(stored));
  await fs.writeFile(dispatchersFile, JSON.stringify(accounts, null, 2));
}

async function readLocalDispatchers() {
  try {
    const raw = await fs.readFile(dispatchersFile, "utf8");
    const accounts = JSON.parse(raw);
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function mapStoredDispatcher(row) {
  const mapped = {
    username: row.email,
    email: row.email,
    name: row.name || row.email,
    role: normalizeRole(row.role || "Read only"),
    passwordHash: row.password_hash || row.passwordHash,
    createdAt: row.created_at || row.createdAt,
  };
  return withEffectiveRole(mapped);
}

async function listDispatcherAccounts() {
  const configured = parseDispatcherAccounts().map((account) => ({
    ...withEffectiveRole(account),
    source: "config",
  }));
  const stored = await listStoredDispatchers();
  const byEmail = new Map();

  [...configured, ...stored].forEach((account) => {
    const key = normalizeEmail(account.email || account.username);
    if (!key) return;
    byEmail.set(key, {
      email: key,
      name: account.name || key,
      role: getEffectiveRole(account),
      roleKey: roleKey(getEffectiveRole(account)),
      source: account.source || "database",
      createdAt: account.createdAt || account.created_at || "",
      lockedOwner: isOwnerEmail(key),
    });
  });

  return [...byEmail.values()].sort((a, b) => {
    if (a.roleKey === "owner") return -1;
    if (b.roleKey === "owner") return 1;
    return a.email.localeCompare(b.email);
  });
}

async function listStoredDispatchers() {
  if (supabase) {
    const { data, error } = await supabase
      .from(DISPATCHER_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Dispatcher database: ${error.message}`);
    return (data || []).map((row) => ({ ...mapStoredDispatcher(row), source: "database" }));
  }

  return (await readLocalDispatchers()).map((account) => ({ ...withEffectiveRole(account), source: "local" }));
}

async function updateStoredDispatcherRole(email, role) {
  const normalized = normalizeEmail(email);
  const normalizedRole = normalizeRole(role);
  if (!normalized || isOwnerEmail(normalized)) {
    throw new Error("No se puede cambiar el rol del dueno.");
  }

  if (supabase) {
    const { data, error } = await supabase
      .from(DISPATCHER_TABLE)
      .update({ role: normalizedRole })
      .eq("email", normalized)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`Dispatcher database: ${error.message}`);
    if (!data) throw new Error("Cuenta no encontrada.");
    return mapStoredDispatcher(data);
  }

  const accounts = await readLocalDispatchers();
  const index = accounts.findIndex((account) => normalizeEmail(account.email) === normalized);
  if (index === -1) throw new Error("Cuenta no encontrada.");
  accounts[index].role = normalizedRole;
  await fs.writeFile(dispatchersFile, JSON.stringify(accounts, null, 2));
  return withEffectiveRole(accounts[index]);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function roleKey(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (["owner", "admin", "dueno", "dueño", "propietario"].includes(normalized)) return "owner";
  if (["supervisor", "manager"].includes(normalized)) return "supervisor";
  if (["dispatcher", "dispatch", "operador"].includes(normalized)) return "dispatcher";
  if (["readonly", "read only", "solo lectura", "viewer", "lector"].includes(normalized)) return "readonly";
  return "readonly";
}

function normalizeRole(value) {
  const labels = {
    owner: "Owner",
    supervisor: "Supervisor",
    dispatcher: "Dispatcher",
    readonly: "Read only",
  };
  return labels[roleKey(value)] || labels.readonly;
}

function isOwnerEmail(email) {
  const normalized = normalizeEmail(email);
  if (!OWNER_EMAIL || !normalized) return false;
  if (OWNER_EMAIL.includes("@")) return normalized === OWNER_EMAIL;
  return normalized === OWNER_EMAIL || normalized.startsWith(`${OWNER_EMAIL}@`);
}

function getEffectiveRole(account) {
  if (isOwnerEmail(account.email || account.username)) return "Owner";
  return normalizeRole(account.role || "Read only");
}

function withEffectiveRole(account) {
  return {
    ...account,
    role: getEffectiveRole(account),
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(account, password) {
  if (account.passwordHash) {
    const [, salt, expected] = String(account.passwordHash).split(":");
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(String(password), salt, 64).toString("base64url");
    if (Buffer.byteLength(actual) !== Buffer.byteLength(expected)) return false;
    return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  }

  return account.password === password;
}

function setAdminSessionCookie(request, response, user) {
  const maxAge = 60 * 60 * 12;
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };
  const token = signSession(payload);
  response.setHeader("Set-Cookie", adminCookie(token, {
    maxAge,
    httpOnly: true,
    sameSite: "Lax",
    secure: isSecureRequest(request),
    path: "/",
  }));
}

function getAdminSession(request) {
  const token = parseCookies(request.headers.cookie || "").fleetinspect_admin;
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload || Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) return null;
  return publicDispatcher({
    username: String(payload.username || ""),
    email: String(payload.email || payload.username || ""),
    name: String(payload.name || payload.username || "Dispatcher"),
    role: String(payload.role || "Dispatcher"),
  });
}

function requireAdmin(request, response, next) {
  const user = getAdminSession(request);
  if (!user) return response.status(401).json({ ok: false, error: "Admin login required." });
  request.adminUser = user;
  next();
}

function requireOwner(request, response, next) {
  const user = getAdminSession(request);
  if (!user) return response.status(401).json({ ok: false, error: "Admin login required." });
  if (roleKey(user.role) !== "owner") {
    return response.status(403).json({ ok: false, error: "Solo el dueno puede gestionar usuarios." });
  }
  request.adminUser = user;
  next();
}

function requireOperationsEditor(request, response, next) {
  const user = getAdminSession(request);
  if (!user) return response.status(401).json({ ok: false, error: "Admin login required." });
  if (!["owner", "supervisor", "dispatcher"].includes(roleKey(user.role))) {
    return response.status(403).json({ ok: false, error: "Modo solo lectura. No puedes cambiar el plan diario." });
  }
  request.adminUser = user;
  next();
}

function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifySession(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");
      if (index === -1) return cookies;
      cookies[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function adminCookie(value, options = {}) {
  const parts = [`fleetinspect_admin=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function isSecureRequest(request) {
  return request.secure || request.headers["x-forwarded-proto"] === "https";
}

app.get(["/", "/driver", "/driver/"], (_request, response) => {
  response.sendFile(path.join(process.cwd(), "index.html"));
});

app.get(["/admin", "/admin/"], (_request, response) => {
  response.sendFile(path.join(process.cwd(), "admin.html"));
});

app.post("/api/admin/login", (request, response) => {
  const email = normalizeEmail(request.body?.email || request.body?.username || "");
  const password = String(request.body?.password || "");

  findDispatcherAccount(email)
    .then((account) => {
      if (!account || !verifyPassword(account, password)) {
        return response.status(401).json({ ok: false, error: "Email o contrasena incorrectos." });
      }

      setAdminSessionCookie(request, response, {
        username: account.username || account.email,
        email: account.email || account.username,
        name: account.name,
        role: account.role,
      });
      response.json({ ok: true, user: publicDispatcher(account) });
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ ok: false, error: "No se pudo comprobar la cuenta." });
    });
});

app.post("/api/admin/register", async (request, response) => {
  const email = normalizeEmail(request.body?.email || "");
  const name = String(request.body?.name || "").trim();
  const password = String(request.body?.password || "");
  const signupCode = String(request.body?.signupCode || "").trim();

  if (!isValidEmail(email)) {
    return response.status(400).json({ ok: false, error: "Email no valido." });
  }

  if (password.length < 8) {
    return response.status(400).json({ ok: false, error: "La contrasena debe tener minimo 8 caracteres." });
  }

  if (DISPATCHER_SIGNUP_CODE && signupCode !== DISPATCHER_SIGNUP_CODE) {
    return response.status(403).json({ ok: false, error: "Codigo de empresa incorrecto." });
  }

  const existing = await findDispatcherAccount(email).catch((error) => {
    console.error(error);
    return null;
  });

  if (existing) {
    return response.status(409).json({ ok: false, error: "Ya existe una cuenta con este email." });
  }

  const account = {
    email,
    username: email,
    name: name || email.split("@")[0],
    role: isOwnerEmail(email) ? "Owner" : "Read only",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  try {
    await saveStoredDispatcher(account);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ ok: false, error: error.message });
  }

  setAdminSessionCookie(request, response, account);
  response.json({ ok: true, user: publicDispatcher(account) });
});

app.get("/api/admin/session", (request, response) => {
  const user = getAdminSession(request);
  if (!user) return response.status(401).json({ ok: false, error: "No session" });
  response.json({ ok: true, user });
});

app.get("/api/admin/dispatchers", requireOwner, async (_request, response) => {
  try {
    response.json({ ok: true, users: await listDispatcherAccounts() });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudieron cargar los usuarios." });
  }
});

app.patch("/api/admin/dispatchers/:email", requireOwner, async (request, response) => {
  try {
    const role = normalizeRole(request.body?.role || "");
    const account = await updateStoredDispatcherRole(request.params.email, role);
    response.json({ ok: true, user: publicDispatcher(account) });
  } catch (error) {
    console.error(error);
    response.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/admin/logout", (_request, response) => {
  response.setHeader("Set-Cookie", adminCookie("", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  }));
  response.json({ ok: true });
});

app.get("/api/status", (_request, response) => {
  response.json({
    driveConfigured: supabaseEnabled,
    supabaseConfigured: supabaseEnabled,
    cloudStorageConfigured: supabaseEnabled,
    firestoreConfigured: supabaseEnabled,
    routePlansConfigured: supabaseEnabled,
    aiConfigured: Boolean(OPENAI_API_KEY),
    model: OPENAI_MODEL,
    storageProvider: supabaseEnabled ? "supabase" : "local",
  });
});

app.get("/api/route-plans/:date", requireAdmin, async (request, response) => {
  try {
    const date = normalizeDateKey(request.params.date);
    if (!date) return response.status(400).json({ ok: false, error: "Fecha no valida." });
    response.json({ ok: true, plan: await readRoutePlan(date) });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudo cargar el plan de rutas." });
  }
});

app.put("/api/route-plans/:date", requireOperationsEditor, async (request, response) => {
  try {
    const date = normalizeDateKey(request.params.date);
    const plannedRoutes = Math.max(0, Math.round(Number(request.body?.plannedRoutes || 0)));
    if (!date) return response.status(400).json({ ok: false, error: "Fecha no valida." });
    const plan = await saveRoutePlanRecord({
      date,
      plannedRoutes,
      updatedBy: request.adminUser?.email || request.adminUser?.username || "admin",
    });
    response.json({ ok: true, plan });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudo guardar el plan de rutas." });
  }
});

app.delete("/api/route-plans/:date", requireOperationsEditor, async (request, response) => {
  try {
    const date = normalizeDateKey(request.params.date);
    if (!date) return response.status(400).json({ ok: false, error: "Fecha no valida." });
    await deleteRoutePlanRecord(date);
    response.json({ ok: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "No se pudo borrar el plan de rutas." });
  }
});

app.get("/api/inspections", requireAdmin, async (_request, response) => {
  response.json(await listAllInspectionRecords());
});

app.get("/api/admin/export/:date", requireAdmin, async (request, response) => {
  const date = normalizeDateKey(request.params.date);
  if (!date) return response.status(400).json({ ok: false, error: "Fecha no valida." });

  const items = (await listAllInspectionRecords()).filter((item) => {
    return normalizeDateKey(item.finishedAt || item.startedAt) === date;
  });
  const plan = await readRoutePlan(date).catch(() => emptyRoutePlan(date));
  const payload = {
    date,
    generatedAt: new Date().toISOString(),
    plannedRoutes: plan.plannedRoutes,
    completedInspections: items.length,
    pendingRoutes: Math.max((plan.plannedRoutes || 0) - items.length, 0),
    vehicles: [...new Set(items.map((item) => item.plate).filter(Boolean))].length,
    photos: items.reduce((sum, item) => sum + (item.photos?.length || 0), 0),
    aiAlerts: items.filter((item) => item.ai?.newDamageDetected).length,
    inspections: items,
  };

  response.setHeader("Content-Disposition", `attachment; filename="fleetinspect-${date}.json"`);
  response.json(payload);
});

app.get("/api/inspections/:id", requireAdmin, async (request, response) => {
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
    ai: {
      status: "queued",
      label: "Analisis IA en cola",
      severity: "unknown",
      newDamageDetected: false,
      summary: "La inspeccion ya esta guardada. La comparacion de danos se ejecuta en segundo plano.",
      queuedAt: new Date().toISOString(),
    },
    photos: Array.isArray(payload.photos) ? payload.photos : [],
    drive: null,
  };

  if (!item.driverName || !item.plate || item.photos.length === 0) {
    return response.status(400).json({ ok: false, error: "Missing details or photos." });
  }

  if (supabaseEnabled) {
    try {
      await saveToSupabase(item, dateKey);
    } catch (error) {
      return response.status(502).json({ ok: false, error: error.message });
    }
  }

  await fs.writeFile(path.join(inspectionsDir, `${id}.json`), JSON.stringify(item, null, 2));
  queueAiAnalysis(item);
  response.json({ ok: true, item });
});

function queueAiAnalysis(item) {
  setTimeout(() => {
    runAiAnalysis(item).catch((error) => {
      console.error(`AI background analysis failed for ${item.id}:`, error);
    });
  }, 0);
}

async function runAiAnalysis(item) {
  const current = supabaseEnabled ? await readSupabaseInspection(item.id) : await readInspection(item.id);
  if (!current) return;

  const previousInspection = supabaseEnabled
    ? await findPreviousSupabaseInspection(current.plate, current.id).catch(() => null)
    : await findPreviousInspection(current.plate, current.id);

  current.ai = {
    ...(await analyzeInspection(current, previousInspection)),
    status: "completed",
  };

  await persistInspectionRecord(current);
}

async function persistInspectionRecord(item) {
  if (supabaseEnabled) {
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .upsert(item, { onConflict: "id" });

    if (error) throw new Error(`Supabase Database: ${error.message}`);
    return;
  }

  await fs.writeFile(path.join(inspectionsDir, `${safeName(item.id)}.json`), JSON.stringify(item, null, 2));
}

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
  return Promise.all((data || []).map(withSignedSupabasePhotos));
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

async function listAllInspectionRecords() {
  if (supabaseEnabled) {
    const supabaseItems = await listSupabaseInspections().catch(() => null);
    if (supabaseItems) return supabaseItems;
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
  return items;
}

function getSupabaseBucketUrl() {
  const match = SUPABASE_URL.match(/^https:\/\/([^.]+)\.supabase\.co/i);
  if (!match) return SUPABASE_URL;
  return `https://supabase.com/dashboard/project/${match[1]}/storage/buckets/${SUPABASE_BUCKET}`;
}

async function readRoutePlan(date) {
  const dateKey = normalizeDateKey(date);
  if (!dateKey) return emptyRoutePlan(date);

  if (supabase) {
    const { data, error } = await supabase
      .from(ROUTE_PLAN_TABLE)
      .select("*")
      .eq("date", dateKey)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw new Error(`Supabase Route Plans: ${error.message}`);
    return data ? mapRoutePlan(data) : emptyRoutePlan(dateKey);
  }

  const plans = await readLocalRoutePlans();
  return plans[dateKey] || emptyRoutePlan(dateKey);
}

async function saveRoutePlanRecord(plan) {
  const item = {
    date: normalizeDateKey(plan.date),
    plannedRoutes: Math.max(0, Math.round(Number(plan.plannedRoutes || 0))),
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeEmail(plan.updatedBy || "admin"),
  };

  if (supabase) {
    const row = {
      date: item.date,
      planned_routes: item.plannedRoutes,
      updated_at: item.updatedAt,
      updated_by: item.updatedBy,
    };
    const { data, error } = await supabase
      .from(ROUTE_PLAN_TABLE)
      .upsert(row, { onConflict: "date" })
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`Supabase Route Plans: ${error.message}`);
    return data ? mapRoutePlan(data) : item;
  }

  const plans = await readLocalRoutePlans();
  plans[item.date] = item;
  await fs.writeFile(routePlansFile, JSON.stringify(plans, null, 2));
  return item;
}

async function deleteRoutePlanRecord(date) {
  const dateKey = normalizeDateKey(date);
  if (!dateKey) return;

  if (supabase) {
    const { error } = await supabase
      .from(ROUTE_PLAN_TABLE)
      .delete()
      .eq("date", dateKey);

    if (error) throw new Error(`Supabase Route Plans: ${error.message}`);
    return;
  }

  const plans = await readLocalRoutePlans();
  delete plans[dateKey];
  await fs.writeFile(routePlansFile, JSON.stringify(plans, null, 2));
}

async function readLocalRoutePlans() {
  try {
    const raw = await fs.readFile(routePlansFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mapRoutePlan(row) {
  return {
    date: normalizeDateKey(row.date),
    plannedRoutes: Math.max(0, Math.round(Number(row.planned_routes ?? row.plannedRoutes ?? 0))),
    updatedAt: row.updated_at || row.updatedAt || "",
    updatedBy: row.updated_by || row.updatedBy || "",
  };
}

function emptyRoutePlan(date) {
  return {
    date: normalizeDateKey(date),
    plannedRoutes: 0,
    updatedAt: "",
    updatedBy: "",
  };
}

function normalizeDateKey(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
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
