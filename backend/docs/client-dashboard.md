# Vencimientos del panel

Los vencimientos se comparan como fechas de calendario en `America/Montevideo`, no como instantes UTC. Una fecha de hoy cuenta como próxima y aparece con `diffDays: 0`; las fechas futuras hasta 30 días se muestran como próximas. Las anteriores a hoy quedan fuera de ese conteo y aparecen en `overdue` con `daysOverdue`.

El servidor sigue funcionando en HTTP mientras `HTTP_MODE=true`. El modo HTTPS aún no está implementado; `HTTP_MODE=false` detiene el arranque en lugar de servir tráfico sin cifrar. La limitación de solicitudes sigue siendo local al proceso y su distribución queda pendiente para el despliegue fuera de Vercel.
