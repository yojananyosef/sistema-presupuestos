# Esquema de Base de Datos — Sistema Presupuestos Zinc

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
| `empresa_nombre`       | `Zinc Industrial S.A.`         | Nombre de la empresa                 |
| `empresa_rut`          | `76.XXX.XXX-X`                 | RUT de la empresa                    |
| `empresa_direccion`    | `Av. Industrial 1234, Santiago`| Dirección                            |
| `empresa_telefono`     | `+56 2 2345 6789`              | Teléfono                             |
| `empresa_email`        | `ventas@zincindustrial.cl`     | Email de contacto                    |
| `iva_porcentaje`       | `19`                           | Porcentaje de IVA                    |
| `moneda`               | `CLP`                          | Moneda de los presupuestos           |

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
| `configuracion_admin_modificar`     | ALL       | public         | `jwt->user_metadata->rol = 'admin'`  |

---

## Flujo de Estados (Presupuestos)

```
borrador → emitido → aprobado
                   → rechazado → emitido (reemitir)
```
