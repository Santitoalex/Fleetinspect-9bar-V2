import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = path.join(process.cwd(), "server.js");
const runtimeDir = path.join(process.cwd(), ".runtime");
const runtimePath = path.join(runtimeDir, "server.optimized.mjs");
let source = await fs.readFile(sourcePath, "utf8");

source = source.replace(
  /app\.get\("\/api\/inspections", requireAdmin, async \(_request, response\) => \{\n  response\.json\(await listAllInspectionRecords\(\)\);\n\}\);/,
  `app.get("/api/inspections", requireAdmin, async (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit || 180), 1), 1000);
  response.json(await listAllInspectionRecords({ limit, compact: true }));
});`
);

source = source.replace(
  /async function listSupabaseInspections\(\) \{[\s\S]*?\n\}\n\nasync function readSupabaseInspection/,
  `async function listSupabaseInspections({ limit = 1000, compact = false } = {}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .order("finishedAt", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (compact) return (data || []).map(compactInspectionRecord);
  return Promise.all((data || []).map(withSignedSupabasePhotos));
}

async function readSupabaseInspection`
);

source = source.replace(
  /async function listAllInspectionRecords\(\) \{[\s\S]*?\n\}\n\nfunction getSupabaseBucketUrl/,
  `async function listAllInspectionRecords({ limit = 1000, compact = false } = {}) {
  if (supabaseEnabled) {
    const supabaseItems = await listSupabaseInspections({ limit, compact }).catch(() => null);
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
  return items.slice(0, limit).map((item) => compact ? compactInspectionRecord(item) : item);
}

function compactInspectionRecord(item) {
  return {
    ...item,
    photos: Array.isArray(item.photos)
      ? item.photos.map((photo) => ({
          id: photo.id,
          label: photo.label,
          storagePath: photo.storagePath,
          bytes: photo.bytes,
        }))
      : [],
  };
}

function getSupabaseBucketUrl`
);

await fs.mkdir(runtimeDir, { recursive: true });
await fs.writeFile(runtimePath, source);
await import(pathToFileURL(runtimePath).href);
