# FleetInspect 9Bar - Web Service gratis

Web app profesional para inspecciones diarias de vehiculos desde movil.

## URLs

- Conductores: `/driver`
- Administrador: `/admin`

## Version limpia para empezar gratis

Esta version esta preparada para empezar en Render Free + Supabase Free usando Web Service normal, sin Blueprint y sin Docker:

- Fotos comprimidas para datos moviles.
- Reintento automatico si falla la subida.
- Cola local en el movil: si falla internet, las fotos quedan pendientes y se reintentan.
- Fotos separadas por matricula en Supabase Storage.
- Datos de inspecciones en Supabase Database.
- Dashboard administrador separado en `/admin`.
- IA con OpenAI opcional para comparar danos nuevos con inspecciones anteriores.
- Guardado rapido: primero se guardan fotos y reporte; despues la IA analiza en segundo plano.

## Variables en Render

Obligatorias:

- `ADMIN_PIN`: PIN para entrar al panel admin.
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave secreta `service_role` de Supabase.
- `SUPABASE_BUCKET`: `fleetinspect-photos`.
- `SUPABASE_TABLE`: `inspections`.

IA:

- `OPENAI_API_KEY`: clave de OpenAI para analisis IA.
- `OPENAI_MODEL`: `gpt-4.1-mini`.
- `OPENAI_MAX_PAIRS`: numero maximo de vistas comparadas por inspeccion. Recomendado: `9`.
- `OPENAI_TIMEOUT_MS`: tiempo maximo para analisis IA. Recomendado: `60000`.

Como funciona la IA:

- La primera inspeccion de una matricula se guarda como referencia.
- Desde la segunda inspeccion, la IA compara la foto anterior y la foto actual de la misma vista.
- La app no espera a la IA para guardar: el conductor termina antes y el analisis aparece despues en admin.
- Marca solo danos nuevos visibles y los guarda en el reporte PDF y en el dashboard admin.
- Si no hay `OPENAI_API_KEY`, la app guarda inspecciones sin deteccion automatica.

Compresion de fotos:

- Las fotos se reducen antes de subir para ahorrar datos moviles y evitar fallos con muchos conductores.
- La IA sigue pudiendo detectar danos visibles como golpes, abolladuras, roturas y rayones claros.
- Los aranazos muy pequenos pueden verse peor si la foto esta lejos, borrosa o con poca luz.

## Coste

Para pruebas:

- Render Free.
- Supabase Free.
- OpenAI opcional.

Para produccion con muchos conductores:

- Cambiar Render de Free a Standard.
- Mantener Supabase o subir de plan si el uso crece.
- Activar OpenAI con `OPENAI_API_KEY`.

## Archivos importantes

- `index.html`: app del conductor.
- `app.js`: camara, compresion, cola local y envio.
- `server.js`: API, Supabase e IA.
- `admin.html`, `admin.js`: dashboard administrador.
- `vehicles.js`: lista de matriculas.
- `report.html`, `report.js`, `report.css`: reporte imprimible.
- `render.yaml`: configuracion inicial para Render Free.
- `CONFIGURAR-SUPABASE.md`: pasos para crear bucket, tabla y variables.

## Render recomendado para esta version

Crear en Render como:

- New > Web Service.
- Runtime: Node.
- Build Command: `npm install`.
- Start Command: `npm start`.
- Plan: Free para pruebas.
