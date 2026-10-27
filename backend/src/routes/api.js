import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { getHealth, getSiteConfig } from '../controllers/healthController.js';
import { listServices, getServiceBySlug } from '../controllers/publicServicesController.js';
import {
    getClientDashboard,
    getCurrentClient,
    updateCurrentClientProfile,
} from '../controllers/clientController.js';
import { getAdminDashboard } from '../controllers/adminDashboardController.js';
import {
    createAdminClient,
    deleteAdminClient,
    listAdminClients,
    updateAdminClient,
} from '../controllers/adminClientsController.js';
import { listAdminUsers, updateAdminUserStatus } from '../controllers/adminUsersController.js';
import {
    deleteAdminService,
    listAdminServices,
    updateAdminService,
} from '../controllers/adminCatalogController.js';
import { submitContact } from '../controllers/contactController.js';
import { apiErrorHandler, apiLanding, notFound } from '../controllers/apiErrors.js';
import { requireFirebaseAdmin, requireVerifiedFirebaseUser } from '../middleware/firebaseAuth.js';

const router = Router();
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Se alcanzó el límite de consultas. Intentá nuevamente más tarde.' },
});

router.get('/health', getHealth);
router.get('/site-config', getSiteConfig);
router.get('/services', listServices);
router.get('/services/:slug', getServiceBySlug);
router.get('/clients/me', requireVerifiedFirebaseUser, getCurrentClient);
router.get('/clients/me/dashboard', requireVerifiedFirebaseUser, getClientDashboard);
router.put('/clients/me/profile', requireVerifiedFirebaseUser, updateCurrentClientProfile);
router.get('/admin/dashboard', requireFirebaseAdmin, getAdminDashboard);
router.get('/admin/clients', requireFirebaseAdmin, listAdminClients);
router.get('/admin/users', requireFirebaseAdmin, listAdminUsers);
router.patch('/admin/users/:uid/status', requireFirebaseAdmin, updateAdminUserStatus);
router.post('/admin/clients', requireFirebaseAdmin, createAdminClient);
router.put('/admin/clients/:id', requireFirebaseAdmin, updateAdminClient);
router.delete('/admin/clients/:id', requireFirebaseAdmin, deleteAdminClient);
router.get('/admin/services', requireFirebaseAdmin, listAdminServices);
router.put('/admin/services/:slug', requireFirebaseAdmin, updateAdminService);
router.delete('/admin/services/:slug', requireFirebaseAdmin, deleteAdminService);
router.post('/contact', contactLimiter, submitContact);
router.get('/', apiLanding);
router.use(notFound);
router.use(apiErrorHandler);

export default router;
