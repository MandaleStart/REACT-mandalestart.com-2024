# Migración de facturación

Ejecutá `npm run db:migrate` desde `backend/` para aplicar `002_billing.sql`. La migración conserva `client_accounts.services` como respaldo y crea una suscripción por cada servicio con un identificador determinístico, por lo que puede reintentarse sin duplicar filas.

El costo heredado es texto libre y no se interpreta como dinero. Las suscripciones importadas comienzan con `amount_cents = 0`, `currency = 'UYU'`, `billing_period = 'one_time'` y `auto_renew = false`; el costo original y la necesidad de revisión quedan en `internal_notes`. Antes de emitir facturas, revisá el precio, la moneda y la periodicidad de cada servicio.

La conversión de fechas usa `pg_input_is_valid`, disponible desde PostgreSQL 16. Probá primero en una base de desarrollo con versión compatible y un respaldo reciente. El entorno usado para preparar esta migración no permitió conectarse a una instancia PostgreSQL; las pruebas locales solo validan el contrato SQL, no la ejecución del DDL.
