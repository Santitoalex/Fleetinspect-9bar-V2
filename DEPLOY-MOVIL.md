# Pasos para publicar

1. Sube todos estos archivos a GitHub.
2. Crea Supabase siguiendo `CONFIGURAR-SUPABASE.md`.
3. En Render crea un Web Service nuevo desde el repositorio.
4. Para probar usa plan Free. Cuando todo funcione, cambia a Standard.
5. Configuracion en Render:
   - Runtime: Node.
   - Build Command: `npm install`.
   - Start Command: `npm start`.
6. Pon estas variables en Render:
   - `ADMIN_PIN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET`
   - `SUPABASE_TABLE`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
7. Haz Manual Deploy.

La app para conductores sera:

https://fleetinspect-pro.onrender.com/driver

El panel administrador sera:

https://fleetinspect-pro.onrender.com/admin
