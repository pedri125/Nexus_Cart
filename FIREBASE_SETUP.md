# Configuración de Firebase para NexusCart

## 1. Habilitar la API de Cloud Firestore

El error **"Cloud Firestore API has not been used or it is disabled"** se soluciona así:

1. Abre este enlace (reemplaza `nexuscart-1254` por tu **Project ID** si es distinto):
   - **https://console.cloud.google.com/apis/api/firestore.googleapis.com/overview?project=nexuscart-1254**

2. Haz clic en **"Habilitar"** (Enable).

3. Espera 1–2 minutos y vuelve a intentar en la app (registro, pedidos, perfil, etc.).

## 2. Crear la base de datos Firestore

1. Entra a [Firebase Console](https://console.firebase.google.com) y selecciona tu proyecto.

2. En el menú izquierdo: **Build → Firestore Database**.

3. Si aún no tienes base de datos:
   - Clic en **"Create database"**.
   - Elige **modo de producción** (o pruebas si solo estás desarrollando).
   - Selecciona la ubicación (por ejemplo `us-central1` o `southamerica-east1`).

4. Cuando la base esté creada, la app podrá guardar:
   - **users**: perfiles (nombre, email, rol, dirección, etc.).
   - **orders**: pedidos del checkout (items, total, dirección, método de pago).

## 3. Índice para pedidos (si lo pide la consola)

Si al listar pedidos aparece un error pidiendo un índice:

1. En Firebase Console → **Firestore → Indexes**.
2. Clic en el enlace del mensaje de error para crear el índice, o créalo manualmente:
   - Colección: `orders`
   - Campos: `userId` (Ascending), `createdAt` (Descending).

También puedes desplegar los índices del proyecto con:

```bash
npx firebase deploy --only firestore:indexes
```

(Necesitas tener `firebase` CLI y el proyecto vinculado.)

## 4. Usuario administrador

Para poder entrar al panel de administración (`/admin`):

```bash
ADMIN_EMAIL=admin@tudominio.com ADMIN_PASSWORD=TuPasswordSeguro npm run seed:admin
```

Luego inicia sesión en la app con ese correo y contraseña. Si el rol es `admin`, serás redirigido al panel al hacer login.

## Resumen

| Problema | Solución |
|----------|----------|
| "Firestore API has not been used or disabled" | Habilitar la API en el enlace de la sección 1 |
| No se guardan usuarios ni pedidos | Crear la base Firestore (sección 2) |
| Error al listar pedidos por índice | Crear el índice (sección 3) |
| No puedo entrar como admin | Ejecutar `npm run seed:admin` y volver a iniciar sesión (sección 4) |
