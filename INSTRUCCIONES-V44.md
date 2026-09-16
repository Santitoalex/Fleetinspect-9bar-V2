# FleetInspect 9Bar - Version v44

Esta version prepara la app para uso mas profesional con Supabase Pro y Render Standard.

## Que mejora

- Panel admin mas operativo por sedes: DRP3, DSU1 y sin asignar.
- Control diario de rutas por sede y por fecha.
- Exportacion diaria con resumen por sede.
- Auditoria para owner: login, cambios de roles, rutas guardadas, rutas borradas e inspecciones guardadas.
- Guardado de inspecciones con site en Supabase.
- Fotos organizadas en Storage por site, matricula, fecha e inspeccion.
- Cache actualizado a v44 para que movil y navegador refresquen la app.

## Pasos para actualizar

1. Sube todos los archivos de esta carpeta a GitHub reemplazando los anteriores.
2. En Supabase abre SQL Editor > New query.
3. Copia y ejecuta el archivo `supabase-schema.sql`.
4. En Render pulsa Manual Deploy.
5. En movil cierra la app/web y vuelve a abrirla. Si ves la version vieja, borra datos del sitio o espera unos minutos.

## Variables necesarias en Render

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_BUCKET=fleetinspect
- OPENAI_API_KEY
- OPENAI_MODEL
- ADMIN_SIGNUP_CODE
- OWNER_EMAIL

## Notas importantes

- `SUPABASE_SERVICE_ROLE_KEY` solo debe estar en Render, nunca dentro del navegador.
- La tabla nueva `audit_events` queda con RLS activado.
- Si no ejecutas el SQL, el panel puede funcionar, pero auditoria y rutas por sede pueden fallar.
