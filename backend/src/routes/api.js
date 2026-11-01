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
import { adminBillingControllers } from '../controllers/adminBillingController.js';
import { clientBillingControllers } from '../controllers/clientBillingController.js';
import { publicBillingControllers } from '../controllers/publicBillingController.js';
import {
    mercadopagoWebhookController,
    mercadopagoWebhookProcessor,
} from '../controllers/clientBillingController.js';
import { PostgresRateLimitStore } from '../middleware/postgresRateLimitStore.js';
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
    message: {
        message: 'Se alcanzó el límite de consultas. Intentá nuevamente más tarde.',
    },
    skip: () => process.env.NODE_ENV === 'test',
    store: new PostgresRateLimitStore({ keyPrefix: 'contact' }),
});
const mercadopagoWebhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Demasiadas notificaciones. Intentá nuevamente más tarde.',
    },
    skip: () => process.env.NODE_ENV === 'test',
    store: new PostgresRateLimitStore({ keyPrefix: 'mercadopago-webhook' }),
});

router.get('/health', getHealth);
router.get('/site-config', getSiteConfig);
router.get('/services', listServices);
router.get('/services/:slug', getServiceBySlug);
router.get('/plans/public', publicBillingControllers.listPlans);
router.post('/webhooks/mercadopago', mercadopagoWebhookLimiter, mercadopagoWebhookController);
router.get('/jobs/mercadopago-webhooks', mercadopagoWebhookProcessor);
router.get('/clients/me', requireVerifiedFirebaseUser, getCurrentClient);
router.get('/clients/me/dashboard', requireVerifiedFirebaseUser, getClientDashboard);
router.put('/clients/me/profile', requireVerifiedFirebaseUser, updateCurrentClientProfile);
router.get(
    '/clients/me/subscriptions',
    requireVerifiedFirebaseUser,
    clientBillingControllers.listSubscriptions,
);
router.get(
    '/clients/me/invoices',
    requireVerifiedFirebaseUser,
    clientBillingControllers.listInvoices,
);
router.get(
    '/clients/me/invoices/:id',
    requireVerifiedFirebaseUser,
    clientBillingControllers.getInvoice,
);
router.post(
    '/clients/me/invoices/:id/checkout',
    requireVerifiedFirebaseUser,
    clientBillingControllers.createCheckout,
);
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
router.get('/admin/plans', requireFirebaseAdmin, adminBillingControllers.listPlans);
router.post('/admin/plans', requireFirebaseAdmin, adminBillingControllers.createPlan);
router.put('/admin/plans/:id', requireFirebaseAdmin, adminBillingControllers.updatePlan);
router.delete('/admin/plans/:id', requireFirebaseAdmin, adminBillingControllers.deactivatePlan);
router.get(
    '/admin/clients/:id/subscriptions',
    requireFirebaseAdmin,
    adminBillingControllers.listSubscriptions,
);
router.post(
    '/admin/clients/:id/subscriptions',
    requireFirebaseAdmin,
    adminBillingControllers.createSubscription,
);
router.put(
    '/admin/subscriptions/:id',
    requireFirebaseAdmin,
    adminBillingControllers.updateSubscription,
);
router.delete(
    '/admin/subscriptions/:id',
    requireFirebaseAdmin,
    adminBillingControllers.cancelSubscription,
);
router.get('/admin/invoices', requireFirebaseAdmin, adminBillingControllers.listInvoices);
router.post('/admin/invoices', requireFirebaseAdmin, adminBillingControllers.createInvoice);
router.get('/admin/invoices/:id', requireFirebaseAdmin, adminBillingControllers.getInvoice);
router.put('/admin/invoices/:id', requireFirebaseAdmin, adminBillingControllers.updateInvoice);
router.post(
    '/admin/invoices/:id/payments',
    requireFirebaseAdmin,
    adminBillingControllers.recordManualPayment,
);
router.post('/admin/invoices/:id/void', requireFirebaseAdmin, adminBillingControllers.voidInvoice);
router.get('/admin/reports/revenue', requireFirebaseAdmin, adminBillingControllers.revenueReport);
router.get('/admin/audit', requireFirebaseAdmin, adminBillingControllers.listAudit);
router.post('/contact', contactLimiter, submitContact);
router.get('/', apiLanding);
router.use(notFound);
router.use(apiErrorHandler);

export default router;
