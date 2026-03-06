# Esquema de Base de Datos — Sistema de Presupuestos

**Motor:** PostgreSQL 17 (Supabase)  
**Proyecto:** `gafhqzitmmjemmkzlrmc` — Región `sa-east-1`

---

## Diagrama de Relaciones

```
auth.users (Supabase Auth)
    │
    │ on_auth_user_created → handle_new_user()
    │
    ▼
┌──────────────┐       ┌──────────────────────┐
│   perfiles   │◄──────│    presupuestos      │
│              │  FK   │                      │
│ id (PK, FK)  │       │ usuario_id (FK)      │
│ nombre       │       │ correlativo (UNIQUE)  │
│ email        │       │ cliente_*            │
│ rol          │       │ items (JSONB)        │
│ activo       │       │ subtotal, iva, total │
│ creado_en    │       │ estado               │
└──────────────┘       └──────────┬───────────┘
                                  │
                                  │ FK
                                  ▼
                       ┌──────────────────────────┐
                       │ historial_presupuestos   │
                       │                          │
                       │ presupuesto_id (FK)      │
                       │ usuario_id (FK → perfiles)│
                       │ accion, estados, detalles│
                       └──────────────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  productos_zinc  │       │  configuracion   │
│                  │       │                  │
│ id (PK)          │       │ id (PK)          │
│ nombre, tipo     │       │ clave (UNIQUE)   │
│ precio_por_m2    │       │ valor            │
│ precio_minimo    │       └──────────────────┘
│ ancho_estandar_m │
│ activo           │
└──────────────────┘
```

---

## Tablas

### `perfiles`

Usuarios del sistema. Se crea automáticamente al registrarse vía trigger `handle_new_user()`.

| Columna    | Tipo                     | Nullable | Default          | Descripción                      |
|------------|--------------------------|----------|------------------|----------------------------------|
| `id`       | uuid **(PK, FK)**        | NO       | —                | Mismo ID que `auth.users.id`     |
| `nombre`   | text                     | NO       | —                | Nombre completo                  |
| `email`    | text                     | NO       | —                | Email del usuario                |
| `rol`      | text                     | NO       | `'usuario'`      | `admin` o `usuario`              |
| `activo`   | boolean                  | NO       | `true`           | Si la cuenta está habilitada     |
| `creado_en`| timestamp with time zone | NO       | `now()`          | Fecha de creación                |

**FK:** `perfiles.id` → `auth.users.id`

---

### `presupuestos`

Presupuestos/cotizaciones creados por los usuarios.

| Columna              | Tipo                     | Nullable | Default            | Descripción                              |
|----------------------|--------------------------|----------|--------------------|------------------------------------------|
| `id`                 | uuid **(PK)**            | NO       | `gen_random_uuid()`| Identificador único                      |
| `correlativo`        | integer **(UNIQUE)**     | NO       | —                  | Número secuencial (PRE-000001)           |
| `usuario_id`         | uuid **(FK)**            | NO       | —                  | Quién creó el presupuesto                |
| `cliente_nombre`     | text                     | NO       | —                  | Nombre del cliente                       |
| `cliente_rut`        | text                     | SÍ       | —                  | RUT del cliente                          |
| `cliente_email`      | text                     | SÍ       | —                  | Email del cliente                        |
| `cliente_telefono`   | text                     | SÍ       | —                  | Teléfono del cliente                     |
| `cliente_direccion`  | text                     | SÍ       | —                  | Dirección del cliente                    |
| `descripcion`        | text                     | SÍ       | —                  | Descripción general del presupuesto      |
| `items`              | jsonb                    | NO       | `'[]'::jsonb`      | Array de ítems (productos, medidas, precios) |
| `subtotal`           | real                     | NO       | `0`                | Suma de precios de ítems                 |
| `iva`                | real                     | NO       | `0`                | Monto IVA calculado                      |
| `total`              | real                     | NO       | `0`                | Subtotal + IVA                           |
| `tiempo_ejecucion`   | text                     | SÍ       | —                  | Plazo estimado de ejecución              |
| `condiciones`        | text                     | SÍ       | —                  | Condiciones comerciales                  |
| `estado`             | text                     | NO       | `'borrador'`       | `borrador`, `emitido`, `aprobado`, `rechazado` |
| `creado_en`          | timestamp with time zone | NO       | `now()`            | Fecha de creación                        |
| `actualizado_en`     | timestamp with time zone | NO       | `now()`            | Última actualización (vía trigger)       |

**FK:** `presupuestos.usuario_id` → `perfiles.id`

**Índices:**

| Índice | Columna(s) | Propósito |
|--------|------------|----------|
| `idx_presupuestos_usuario_id` | `usuario_id` | Filtro por dueño (aislamiento por usuario) |
| `idx_presupuestos_estado` | `estado` | Filtro por estado en listados y dashboard |
| `idx_presupuestos_creado_en` | `creado_en DESC` | Ordenamiento cronológico y rangos temporales |

**Estructura de `items` (JSONB):**
```json
[
  {
    "descripcion": "Plancha zinc",
    "productoId": "uuid",
    "cantidad": 10,
    "anchoM": 0.35,
    "largoM": 2.5,
    "m2": 8.75,
    "precioUnitario": 4500,
    "precioTotal": 45000
  }
]
```

---

### `historial_presupuestos`

Registro de auditoría de cambios en presupuestos.

| Columna           | Tipo                     | Nullable | Default            | Descripción                        |
|-------------------|--------------------------|----------|--------------------|------------------------------------|
| `id`              | uuid **(PK)**            | NO       | `gen_random_uuid()`| Identificador único                |
| `presupuesto_id`  | uuid **(FK)**            | NO       | —                  | Presupuesto afectado               |
| `usuario_id`      | uuid **(FK)**            | NO       | —                  | Quién realizó la acción            |
| `accion`          | text                     | NO       | —                  | `creado`, `actualizado`, `estado_cambio` |
| `estado_anterior` | text                     | SÍ       | —                  | Estado previo al cambio            |
| `estado_nuevo`    | text                     | SÍ       | —                  | Estado después del cambio          |
| `detalles`        | jsonb                    | SÍ       | `'{}'::jsonb`      | Información adicional del cambio   |
| `creado_en`       | timestamp with time zone | SÍ       | `now()`            | Cuándo ocurrió                     |

**FK:** `historial_presupuestos.presupuesto_id` → `presupuestos.id`  
**FK:** `historial_presupuestos.usuario_id` → `perfiles.id`

---

### `productos_zinc`

Catálogo de productos de zinc disponibles.

| Columna           | Tipo                     | Nullable | Default            | Descripción                         |
|-------------------|--------------------------|----------|--------------------|-------------------------------------|
| `id`              | uuid **(PK)**            | NO       | `gen_random_uuid()`| Identificador único                 |
| `nombre`          | text                     | NO       | —                  | Nombre del producto                 |
| `tipo`            | text                     | NO       | —                  | Tipo/categoría                      |
| `descripcion`     | text                     | SÍ       | —                  | Descripción opcional                |
| `precio_por_m2`   | real                     | NO       | —                  | Precio por metro cuadrado (CLP)     |
| `precio_minimo`   | real                     | NO       | `0`                | Precio mínimo por unidad garantizado|
| `ancho_estandar_m`| real                     | NO       | `0`                | Ancho estándar del producto (metros)|
| `activo`          | boolean                  | NO       | `true`             | Si está disponible para presupuestos|
| `creado_en`       | timestamp with time zone | NO       | `now()`            | Fecha de creación                   |

---

### `configuracion`

Configuraciones clave-valor del sistema.

| Columna | Tipo                     | Nullable | Default            | Descripción                |
|---------|--------------------------|----------|--------------------|----------------------------|
| `id`    | uuid **(PK)**            | NO       | `gen_random_uuid()`| Identificador único        |
| `clave` | text **(UNIQUE)**        | NO       | —                  | Nombre de la configuración |
| `valor` | text                     | NO       | —                  | Valor de la configuración  |

**Claves actuales:**

| Clave                  | Ejemplo de valor               | Descripción                          |
|------------------------|--------------------------------|--------------------------------------|
| `correlativo_siguiente`| `3`                            | Próximo número de correlativo        |
| `empresa_nombre`       | `Acme Corp S.A.`               | Nombre de la empresa                 |
| `empresa_rut`          | `76.123.456-7`                 | RUT/ID fiscal de la empresa          |
| `empresa_direccion`    | `Calle Principal 123, Ciudad`  | Dirección                            |
| `empresa_telefono`     | `+1 234 567 8900`              | Teléfono                             |
| `empresa_email`        | `contacto@empresa.com`         | Email de contacto                    |
| `iva_porcentaje`       | `19`                           | Porcentaje de IVA                    |
| `moneda`               | `CLP`                          | Moneda de los presupuestos           |
| `pdf_logo_url`         | `https://...supabase.co/storage/v1/object/public/logos/empresa-logo` | URL pública del logo (Supabase Storage) |
| `pdf_color_primario`   | `#0284c7`                      | Color primario del PDF               |
| `pdf_color_cabecera`   | `#0f172a`                      | Color de cabecera del PDF            |
| `pdf_pie_izquierdo`    | `Texto pie izquierdo`          | Texto del pie de página izquierdo    |
| `pdf_pie_derecho`      | `Texto pie derecho`            | Texto del pie de página derecho      |

---

## Storage (Supabase Storage)

### Bucket `logos`

| Propiedad          | Valor                                          |
|--------------------|-------------------------------------------------|
| **ID/Nombre**      | `logos`                                          |
| **Público**        | Sí                                               |
| **Límite archivo** | 512 KB                                           |
| **MIME permitidos** | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` |
| **Ruta del logo**  | `logos/empresa-logo`                             |
| **URL pública**    | `https://gafhqzitmmjemmkzlrmc.supabase.co/storage/v1/object/public/logos/empresa-logo` |

**Políticas RLS (`storage.objects`):**

| Política                       | Operación | Roles         | Condición            |
|--------------------------------|-----------|---------------|----------------------|
| Admin puede subir logos        | INSERT    | authenticated | `bucket_id = 'logos'`|
| Admin puede actualizar logos   | UPDATE    | authenticated | `bucket_id = 'logos'`|
| Admin puede eliminar logos     | DELETE    | authenticated | `bucket_id = 'logos'`|
| Lectura pública de logos       | SELECT    | public        | `bucket_id = 'logos'`|

---

## Funciones

### `siguiente_correlativo()`
Genera el siguiente número de correlativo atómicamente. Usa `SECURITY DEFINER` para saltear RLS.

```sql
-- Incrementa el contador en configuracion y retorna el valor anterior
UPDATE configuracion SET valor = (valor::integer + 1)::text
  WHERE clave = 'correlativo_siguiente'
  RETURNING (valor::integer - 1)
```

### `handle_new_user()`
Trigger `SECURITY DEFINER` que se ejecuta al crear un usuario en `auth.users`. Inserta automáticamente un registro en `perfiles` con el nombre, email y rol del `user_metadata`.

```sql
-- Trigger: on_auth_user_created → AFTER INSERT ON auth.users
INSERT INTO perfiles (id, nombre, email, rol)
VALUES (
  NEW.id,
  COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'rol', 'usuario')
);
```

### `actualizar_timestamp()`
Trigger que actualiza `actualizado_en` automáticamente al hacer UPDATE en `presupuestos`.

```sql
-- Trigger: trigger_presupuestos_actualizado → BEFORE UPDATE ON presupuestos
NEW.actualizado_en = now();
```

---

## Políticas RLS (Row Level Security)

Todas las tablas tienen RLS habilitado.

### `perfiles`
| Política                  | Operación | Roles          | Condición                                  |
|---------------------------|-----------|----------------|--------------------------------------------|
| `perfiles_select`         | SELECT    | public         | `auth.uid() IS NOT NULL`                   |
| `perfiles_insert_propio`  | INSERT    | public         | `id = auth.uid()`                          |
| `perfiles_update_propio`  | UPDATE    | public         | `id = auth.uid()`                          |
| `perfiles_admin_all`      | ALL       | public         | `jwt->user_metadata->rol = 'admin'`        |

### `presupuestos`
| Política                            | Operación | Roles          | Condición                                           |
|-------------------------------------|-----------|----------------|-----------------------------------------------------|
| `presupuestos_select_autenticados`  | SELECT    | authenticated  | `true` (todos ven todos)                            |
| `presupuestos_insert_autenticados`  | INSERT    | authenticated  | `usuario_id = auth.uid()`                           |
| `presupuestos_update_autenticados`  | UPDATE    | public         | `usuario_id = auth.uid()` OR `rol = 'admin'`        |
| `presupuestos_delete_admin`         | DELETE    | public         | `jwt->user_metadata->rol = 'admin'`                 |

### `historial_presupuestos`
| Política                                      | Operación | Roles          | Condición |
|-----------------------------------------------|-----------|----------------|-----------|
| `Usuarios autenticados pueden ver historial`  | SELECT    | authenticated  | `true`    |
| `Usuarios autenticados pueden insertar historial` | INSERT | authenticated | `true`    |

### `productos_zinc`
| Política                    | Operación | Roles  | Condición                            |
|-----------------------------|-----------|--------|--------------------------------------|
| `productos_select_todos`    | SELECT    | public | `true` (público, usado por widget)   |
| `productos_admin_modificar` | ALL       | public | `jwt->user_metadata->rol = 'admin'`  |

### `configuracion`
| Política                            | Operación | Roles          | Condición                            |
|-------------------------------------|-----------|----------------|--------------------------------------|
| `configuracion_select_autenticados` | SELECT    | authenticated  | `true`                               |
| `configuracion_select_publica`      | SELECT    | anon           | `clave IN ('empresa_nombre', 'pdf_logo_url')` |
| `configuracion_admin_modificar`     | ALL       | public         | `jwt->user_metadata->rol = 'admin'`  |

---

## Flujo de Estados (Presupuestos)

```
borrador → emitido → aprobado      (solo admin)
                   → rechazado     (solo admin)
                     rechazado → emitido (reemitir, cualquier usuario)
```

**Restricción de negocio (app-level):** Solo los usuarios con rol `admin` pueden cambiar el estado a `aprobado` o `rechazado`. Los usuarios regulares solo pueden emitir borradores y reemitir rechazados.

---

## Reglas de Negocio (App-Level)

| Regla | Descripción |
|-------|-------------|
| Aislamiento por usuario | Cada usuario solo ve, edita, exporta y accede al historial de **sus propios** presupuestos. Admin ve todo. |
| Solo admin aprueba/rechaza | La API `/api/presupuestos/[id]` (PUT) valida que `rol = 'admin'` para estados `aprobado` y `rechazado` |
| Validación de propiedad | GET, PUT y historial de `/api/presupuestos/[id]` verifican `usuario_id = sesion.user.id` (o admin). Retorna 403 si no es dueño. |
| Export filtrado | `/api/presupuestos/exportar` filtra por `usuario_id` a menos que sea admin |
| Recálculo server-side | POST y PUT de presupuestos **recalculan todos los precios** en el servidor usando `productos_zinc.precio_por_m2` y `precio_minimo`. Los precios enviados por el cliente son ignorados. |
| Redondeo centralizado | Todos los cálculos monetarios usan `redondearMoneda()` para evitar acumulación de errores de punto flotante. El unitario se redondea ANTES de multiplicar por cantidad. |
| No desactivar admin | La API `/api/configuracion` (PUT, toggleUsuario) impide desactivar usuarios con `rol = 'admin'` |
| Registro público | Los nuevos usuarios se registran con `rol = 'usuario'` automáticamente |
| Cambio de contraseña | Usuarios autenticados pueden cambiar su contraseña vía `/api/auth/cambiar-contrasena` |
| Recuperación de contraseña | Flujo público vía Supabase Auth: `/recuperar` → email → `/nueva-contrasena` |

---

## Rutas de Autenticación

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/login` | Página pública | Inicio de sesión |
| `/registro` | Página pública | Registro de nuevos usuarios |
| `/recuperar` | Página pública | Solicitar email de recuperación de contraseña |
| `/nueva-contrasena` | Página pública | Establecer nueva contraseña (vía enlace de email) |
| `/api/auth/login` | API pública | POST — Autenticación con email/contraseña |
| `/api/auth/registro` | API pública | POST — Registro de usuario |
| `/api/auth/recuperar` | API pública | POST — Enviar email de recuperación |
| `/api/auth/cambiar-contrasena` | API protegida | POST — Cambiar contraseña (usuario logueado) |
