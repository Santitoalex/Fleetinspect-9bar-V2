# FleetInspect 9Bar - Web Service gratis

Web app profesional para inspecciones diarias de vehiculos desde movil.

## URLs

- Conductores: `/driver`
- Administrador: `/admin`

## Version limpia para empezar gratis

Esta version esta preparada para empezar en Render Free + Supabase Free usando Web Service normal, sin Blueprint y sin Docker:

- Fotos comprimidas para datos moviles.
- Instalable en movil como app PWA desde `/driver`.
- Icono propio para iPhone y Android.
- Panel admin instalable como app PWA separada desde `/admin`.
- Icono propio para el dashboard administrador.
- Aviso de calidad de foto: posible foto oscura, borrosa o con poco detalle.
- Reintento automatico si falla la subida.
- Cola local visible en el movil: si falla internet, las fotos quedan pendientes y se reintentan.
- Confirmacion final con numero de reporte.
- Fotos separadas por matricula en Supabase Storage.
- Datos de inspecciones en Supabase Database.
- Dashboard administrador separado en `/admin`.
- Acceso admin con email y contrasena.
- Registro de dispatchers/trabajadores desde `/admin` con codigo interno de empresa.
- Control diario por fecha con vehiculos revisados y vehiculos pendientes.
- Historial por matricula, resumen de conductores y estado claro de IA.
- Exportacion CSV general y reporte diario imprimible en PDF con vehiculos hechos/faltantes.
- IA con OpenAI opcional para comparar danos nuevos con inspecciones anteriores.
- Guardado rapido: primero se guardan fotos y reporte; despues la IA analiza en segundo plano.

## Variables en Render

Obligatorias:

- `SESSION_SECRET`: palabra secreta larga para proteger las sesiones.
- `DISPATCHER_SIGNUP_CODE`: codigo interno para que cada dispatcher cree su cuenta.
- `DISPATCHER_TABLE`: `dispatchers`.
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave secreta `service_role` de Supabase.
- `SUPABASE_BUCKET`: `fleetinspect-photos`.
- `SUPABASE_TABLE`: `inspections`.

Opcional:

- `DISPATCHER_ACCOUNTS`: cuentas creadas manualmente desde Render.

Ejemplo opcional de `DISPATCHER_ACCOUNTS`:

```text
alex@empresa.com:ClaveSegura123:Alex:Admin,maria@empresa.com:OtraClave456:Maria:Dispatcher
```

Formato:

```text
email:contrasena:nombre:rol
```

Si no pones `DISPATCHER_ACCOUNTS`, tus dispatchers pueden crear su propia cuenta desde `/admin` usando el `DISPATCHER_SIGNUP_CODE`.

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
- `day-report.html`, `day-report.js`: reporte diario imprimible para guardar como PDF.
- `CONFIGURAR-SUPABASE.md`: pasos para crear bucket, tabla y variables.
- `INSTALAR-APP-MOVIL.md`: pasos para instalar la app del conductor en iPhone y Android.

## Render recomendado para esta version

Crear en Render como:

- New > Web Service.
- Runtime: Node.
- Build Command: `npm install`.
- Start Command: `npm start`.
- Plan: Free para pruebas.
