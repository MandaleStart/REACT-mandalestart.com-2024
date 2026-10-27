import { getCatalogService, listCatalogServices } from '../portalRepository.js';
import {
    getCatalogServices,
    getCatalogServiceBySlug,
    staticServiceSlugs,
} from '../serviceCatalogFallback.js';
import { projectPublicService } from '../services/adminValidation.js';
import { isPostgresConfigured } from '../postgres.js';
import { setPublicCache } from './responseCache.js';

export async function listServices(req, res, next) {
    try {
        setPublicCache(res);
        if (isPostgresConfigured()) {
            const records = await listCatalogServices();
            const servicesBySlug = new Map(getCatalogServices().map((service) => [
                service.slug,
                projectPublicService(service.slug, service),
            ]));
            for (const record of records) {
                if (!staticServiceSlugs.has(record.slug)) continue;
                const service = projectPublicService(record.slug, record.data);
                if (service.status === 'archived') servicesBySlug.delete(record.slug);
                else if (service.status === 'active') servicesBySlug.set(record.slug, service);
                else servicesBySlug.delete(record.slug);
            }
            return res.json([...servicesBySlug.values()]);
        }

        return res.json(getCatalogServices());
    } catch (error) {
        return next(error);
    }
}

export async function getServiceBySlug(req, res, next) {
    try {
        setPublicCache(res);
        if (!staticServiceSlugs.has(req.params.slug)) {
            return res.status(404).json({ message: 'Servicio no encontrado' });
        }

        if (isPostgresConfigured()) {
            const record = await getCatalogService(req.params.slug);
            if (!record) {
                const fallback = getCatalogServiceBySlug(req.params.slug);
                if (!fallback) return res.status(404).json({ message: 'Servicio no encontrado' });
                return res.json(projectPublicService(fallback.slug, fallback));
            }
            const service = projectPublicService(record.slug, record.data);
            if (service.status !== 'active') {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            return res.json(service);
        }

        const service = getCatalogServiceBySlug(req.params.slug);
        if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
        return res.json(service);
    } catch (error) {
        return next(error);
    }
}