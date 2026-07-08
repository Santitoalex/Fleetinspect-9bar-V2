# Configurar Supabase para FleetInspect

Esta es la configuracion recomendada para 100 conductores diarios con Render Standard.

## 1. Crear proyecto

1. Entra en `https://supabase.com`.
2. Crea un proyecto nuevo.
3. Guarda estos dos datos:
   - `SUPABASE_URL`: Project Settings > API > Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role key.

Importante: la `service_role key` es secreta. Solo se pone en Render, nunca en GitHub.

## 2. Crear bucket para fotos

1. Ve a Storage.
2. Crea un bucket llamado:

```text
fleetinspect-photos
```

3. Puede ser privado. La app genera enlaces temporales para ver fotos en reportes.

## 3. Crear tabla de inspecciones

Ve a SQL Editor y ejecuta esto:

```sql
create table if not exists public.inspections (
  id text primary key,
  "driverName" text,
  plate text,
  "startedAt" timestamptz,
  "finishedAt" timestamptz,
  notes text,
  ai jsonb,
  photos jsonb,
  drive jsonb,
  storage jsonb,
  created_at timestamptz default now()
);

create index if not exists inspections_plate_finished_idx
on public.inspections (plate, "finishedAt" desc);
```

## 4. Variables en Render

En Render > tu servicio > Environment, pon:

```text
ADMIN_PIN=tu pin
SUPABASE_URL=tu Project URL
SUPABASE_SERVICE_ROLE_KEY=tu service_role key
SUPABASE_BUCKET=fleetinspect-photos
SUPABASE_TABLE=inspections
OPENAI_API_KEY=tu clave OpenAI
OPENAI_MODEL=gpt-4.1-mini
OPENAI_MAX_PAIRS=9
OPENAI_TIMEOUT_MS=60000
```

## 5. URLs

Cuando Render termine de desplegar:

```text
App conductores: https://TU-APP.onrender.com/driver
Panel admin: https://TU-APP.onrender.com/admin
Estado sistema: https://TU-APP.onrender.com/api/status
```

## 6. Que debe salir en el panel

En el panel admin, Estado del sistema debe mostrar:

- Configuracion Supabase: Configurado.
- Almacenamiento cloud: Sincronizado cuando ya exista al menos una inspeccion guardada.
- Servicio IA: Configurado si pusiste `OPENAI_API_KEY`.
