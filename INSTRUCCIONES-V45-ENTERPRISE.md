# FleetInspect 9Bar - Enterprise v45

Esta version mantiene la base de Supabase que ya esta preparada y mejora la presentacion profesional de la app.

## Cambios principales

- Interfaz admin mas profesional, compacta y operativa.
- Sidebar oscuro tipo centro de control.
- Topbar mas limpia con busqueda, idioma, usuario, rol y acciones.
- Tarjetas de metricas con jerarquia visual mas clara.
- Paneles por sede DRP3 / DSU1 mas sobrios.
- Control diario de rutas mas visible y ordenado.
- Driver app con aspecto de aplicacion movil interna.
- Pantalla de fotos mas seria: zona de camara oscura, acciones claras y panel lateral ordenado.
- Cache actualizado a v45 para evitar que el movil cargue la version antigua.

## Como publicar

1. Sube todos los archivos de esta carpeta a GitHub.
2. En Render pulsa Manual Deploy.
3. Al abrir la app en movil, cierra y vuelve a abrir. Si sigue igual, borra cache/datos del sitio.

## Supabase

No hace falta mover Supabase. Ya se queda en el proyecto actual.

Variables importantes en Render:

- SUPABASE_BUCKET=fleetinspect
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- OPENAI_MODEL=gpt-4.1-mini
- ADMIN_SIGNUP_CODE
- OWNER_EMAIL
