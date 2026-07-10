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
   - `SESSION_SECRET`
   - `DISPATCHER_SIGNUP_CODE`
   - `DISPATCHER_TABLE`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET`
   - `SUPABASE_TABLE`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
7. Haz Manual Deploy.
8. Entra a `/admin` y crea la primera cuenta con email, contrasena y el codigo de empresa.

`DISPATCHER_ACCOUNTS` es opcional si quieres crear cuentas manualmente desde Render.

La app para conductores sera:

https://fleetinspect-pro.onrender.com/driver

El panel administrador sera:

https://fleetinspect-pro.onrender.com/admin

## Instalar en el movil

Cuando Render este publicado, abre la URL de conductores desde el movil:

```text
https://TU-APP.onrender.com/driver
```

En iPhone: Safari > Compartir > Anadir a pantalla de inicio.

En Android: Chrome > Instalar app o Anadir a pantalla de inicio.

Tambien puedes enviar a los conductores el archivo `INSTALAR-APP-MOVIL.md` como instrucciones.
