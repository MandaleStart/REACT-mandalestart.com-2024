# Migración de facturación

Ejecutá `npm run db:migrate` desde `backend/` para aplicar `002_billing.sql`. La migración conserva `client_accounts.services` como respaldo y crea una suscripción por cada servicio con un identificador determinístico, por lo que puede reintentarse sin duplicar filas.

El costo heredado es texto libre y no se interpreta como dinero. Las suscripciones importadas comienzan con `amount_cents = 0`, `currency = 'UYU'`, `billing_period = 'one_time'` y `auto_renew = false`; el costo original y la necesidad de revisión quedan en `internal_notes`. Antes de emitir facturas, revisá el precio, la moneda y la periodicidad de cada servicio.

Los paneles de cliente y admin usan `subscriptions` como fuente operativa. La API ya no proyecta ni actualiza `client_accounts.services`; la columna y los registros originales se conservan como respaldo hasta verificar una copia externa y la importación de cada entorno. No la elimines antes de esa verificación.

La conversión de fechas usa `pg_input_is_valid`, disponible desde PostgreSQL 16. La migración `002_billing.sql` se aplicó correctamente en PostgreSQL 18.6. Se verificaron `schema_migrations`, las seis tablas de facturación/auditoría y las columnas adicionales de `client_accounts`. La base no tenía clientes, por lo que no se importaron suscripciones heredadas. Las suites posteriores a la migración pasaron: backend 55/55 y frontend 49/49; también pasaron lint y `npm ls eslint @eslint/js --depth=0`.

La ejecución fue transaccional y el runner registró la migración. No se verificó la existencia de un respaldo previo. Para comprobar el estado o ejecutar migraciones pendientes, repetí `npm run db:migrate`; las ya aplicadas se omiten. `005_recurring_billing.sql` agrega el registro idempotente de facturas de renovación y la cola única de recordatorios; aplicá las migraciones pendientes antes de habilitar el cron diario.
