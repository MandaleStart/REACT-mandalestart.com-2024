import { logger } from '../logger.js';

export function apiLanding(req, res) {
    res.json({
        message: 'API de mandalestart funcionando',
        endpoints: [
            '/api/health',
            '/api/services',
            '/api/services/:slug',
            '/api/clients/me',
            '/api/admin/clients',
            '/api/admin/services',
            '/api/contact',
        ],
    });
}

export function notFound(req, res) {
    res.status(404).json({ message: 'Recurso no encontrado.' });
}

export function apiErrorHandler(error, req, res, next) {
    if (res.headersSent) {
        next(error);
        return;
    }

    logger.error('Error de API', {
        requestId: req.id,
        code: error.code || error.name || 'UnknownError',
        message: error.message,
        url: req.originalUrl,
        method: req.method,
        route: req.route?.path || req.path,
    });
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        res.status(400).json({ message: 'El cuerpo de la solicitud no es JSON válido.' });
        return;
    }

    if (error.code === 'CONTACT_NOT_CONFIGURED') {
        res.status(503).json({ message: 'El envío del formulario no está disponible ahora. Probá escribir por WhatsApp.' });
        return;
    }

    if (error.code === 'DATABASE_NOT_CONFIGURED'
        || error.code?.startsWith('08')
        || ['28P01', '3D000', '42P01', '57P01', 'ECONNREFUSED', 'ENOTFOUND'].includes(error.code)) {
        res.status(503).json({ message: 'La base de datos del portal no está disponible. Revisá su conexión y configuración.' });
        return;
    }

    res.status(500).json({ message: 'Ocurrió un error interno. Intentá nuevamente más tarde.' });
}