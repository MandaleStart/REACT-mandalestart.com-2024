import {
    getCatalogService,
    listCatalogServices,
    saveCatalogService,
} from '../portalRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import {
    getCatalogServices,
    getCatalogServiceBySlug,
    staticServiceSlugs,
} from '../serviceCatalogFallback.js';
import { projectPublicService, validatePublicService } from '../services/adminValidation.js';
import { setPrivateNoStore } from './responseCache.js';

export async function listAdminServices(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });

    try {
        const records = await listCatalogServices();
        const servicesBySlug = new Map(getCatalogServices().map((service) => [
            service.slug,
            projectPublicService(service.slug, service),
        ]));
        for (const record of records) {
            if (!staticServiceSlugs.has(record.slug)) continue;
            servicesBySlug.set(record.slug, projectPublicService(record.slug, record.data));
        }
        return res.json([...servicesBySlug.values()]);
    } catch (error) {
        return next(error);
    }
}

export async function updateAdminService(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    const result = validatePublicService(req.body, req.params.slug);
    if (!result.ok) return res.status(400).json({ message: result.message });

    try {
        const service = await saveCatalogService(result.value.slug, result.value);
        return res.json(projectPublicService(service.slug, service.data));
    } catch (error) {
        return next(error);
    }
}

export async function deleteAdminService(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    if (!staticServiceSlugs.has(req.params.slug)) {
        return res.status(400).json({ message: 'El identificador del servicio no es válido.' });
    }
    try {
        const service = await getCatalogService(req.params.slug);
        if (!service && !getCatalogServiceBySlug(req.params.slug)) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }
        const current = service
            ? projectPublicService(service.slug, service.data)
            : projectPublicService(req.params.slug, getCatalogServiceBySlug(req.params.slug));
        await saveCatalogService(req.params.slug, { ...current, status: 'archived' });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}