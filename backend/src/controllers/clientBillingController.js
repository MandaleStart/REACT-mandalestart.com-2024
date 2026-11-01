import * as billingRepository from '../billingRepository.js';
import { getClientByEmail } from '../portalRepository.js';
import {
  projectClientInvoice,
  projectClientSubscription,
} from '../services/clientBillingProjection.js';
import {
  createMercadoPagoClient,
  getMercadoPagoWebhookConfig,
  verifyMercadoPagoSignature,
  centsFromProviderAmount,
} from '../services/mercadoPago.js';
import { logger } from '../logger.js';
import { setPrivateNoStore } from './responseCache.js';

function validId(value) {
  return (
    typeof value === 'string' && /^[^/]{1,150}$/.test(value) && value !== '.' && value !== '..'
  );
}

export function createClientBillingControllers(
  repository = billingRepository,
  resolveClient = getClientByEmail,
  mercadoPago = createMercadoPagoClient(),
  getConfig = getMercadoPagoWebhookConfig,
) {
  async function getOwnedClient(req, res) {
    setPrivateNoStore(res);
    const email = req.auth?.email;
    if (typeof email !== 'string' || !email) {
      res.status(401).json({ message: 'La sesión no tiene un email verificado.' });
      return null;
    }
    const client = await resolveClient(email);
    if (!client) {
      res.status(404).json({
        message:
          'No encontramos una ficha de cliente vinculada a este correo. Escribime para que pueda asociarla.',
      });
      return null;
    }
    return client;
  }

  return {
    async listSubscriptions(req, res, next) {
      try {
        const client = await getOwnedClient(req, res);
        if (!client) return;
        const subscriptions = await repository.listClientSubscriptions(client.id);
        return res.json(subscriptions.map(projectClientSubscription));
      } catch (error) {
        return next(error);
      }
    },

    async listInvoices(req, res, next) {
      try {
        const client = await getOwnedClient(req, res);
        if (!client) return;
        const invoices = await repository.listClientInvoices(client.id);
        return res.json(invoices.map(projectClientInvoice));
      } catch (error) {
        return next(error);
      }
    },

    async getInvoice(req, res, next) {
      try {
        const client = await getOwnedClient(req, res);
        if (!client) return;
        if (!validId(req.params.id)) {
          return res.status(400).json({ message: 'El identificador de la factura no es válido.' });
        }
        const invoice = await repository.getClientInvoice(client.id, req.params.id);
        return invoice
          ? res.json(projectClientInvoice(invoice))
          : res.status(404).json({ message: 'Factura no encontrada.' });
      } catch (error) {
        return next(error);
      }
    },

    async createCheckout(req, res, next) {
      try {
        const client = await getOwnedClient(req, res);
        if (!client) return;
        if (!validId(req.params.id)) {
          return res.status(400).json({ message: 'El identificador de la factura no es válido.' });
        }
        const config = getConfig();
        const webhookUrl = parseHttpsUrl(config.webhookUrl);
        const publicAppUrl = parsePublicAppUrl(config.publicAppUrl);
        if (!config.accessToken || !config.webhookSecret || !webhookUrl || !publicAppUrl) {
          return res.status(503).json({ message: 'El pago online no está configurado todavía.' });
        }

        const outcome = await repository.createMercadoPagoCheckout(
          client.id,
          req.params.id,
          ({ invoice, amountCents }) =>
            mercadoPago.createPreference({
              invoice,
              amountCents,
              publicAppUrl,
              webhookUrl,
            }),
        );
        if (outcome.status === 'not-found') {
          return res.status(404).json({ message: 'Factura no encontrada.' });
        }
        if (outcome.status === 'not-payable') {
          return res.status(409).json({ message: 'La factura no admite pagos online.' });
        }
        return res.json({
          checkout_url: outcome.checkout_url,
          expires_at: outcome.expires_at,
        });
      } catch (error) {
        if (error.code === 'MERCADOPAGO_NOT_CONFIGURED') {
          return res.status(503).json({ message: 'El pago online no está configurado todavía.' });
        }
        return next(error);
      }
    },
  };
}

function parseHttpsUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

function parsePublicAppUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    const secure = url.protocol === 'https:';
    const localDevelopment =
      process.env.NODE_ENV !== 'production' &&
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((!secure && !localDevelopment) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export const clientBillingControllers = createClientBillingControllers();

export function createMercadoPagoWebhookController(
  repository = billingRepository,
  mercadoPago = createMercadoPagoClient(),
  getConfig = getMercadoPagoWebhookConfig,
  log = logger,
) {
  return async function mercadopagoWebhook(req, res, next) {
    const config = getConfig();
    if (!config.accessToken || !config.webhookSecret) {
      return res.status(503).json({ message: 'El webhook de pagos no está configurado.' });
    }

    const dataId = req.query['data.id'];
    const requestId = req.get('x-request-id');
    if (
      !verifyMercadoPagoSignature({
        signature: req.get('x-signature'),
        requestId,
        dataId,
        secret: config.webhookSecret,
      })
    ) {
      return res.status(401).json({ message: 'La firma de la notificación no es válida.' });
    }

    const topic = req.query.type || req.body?.type;
    if (topic !== 'payment') return res.status(200).json({ received: true });
    if (typeof dataId !== 'string' || !/^\d{1,40}$/.test(dataId)) {
      return res.status(400).json({ message: 'El identificador del pago no es válido.' });
    }

    try {
      const payment = await mercadoPago.getPayment(dataId);
      if (String(payment.id) !== dataId || payment.status !== 'approved') {
        return res.status(200).json({ received: true });
      }
      const amountCents = centsFromProviderAmount(payment.transaction_amount);
      if (
        amountCents === null ||
        typeof payment.external_reference !== 'string' ||
        !validId(payment.external_reference) ||
        typeof payment.preference_id !== 'string' ||
        !payment.preference_id ||
        !['UYU', 'USD'].includes(payment.currency_id)
      ) {
        log.warn('mercadopago_payment_rejected', {
          requestId: req.id,
          reason: 'invalid_provider_payment_fields',
          providerPaymentId: dataId,
        });
        return res.status(200).json({ received: true });
      }

      const outcome = await repository.approveMercadoPagoPayment({
        provider_payment_id: dataId,
        external_reference: payment.external_reference,
        preference_id: payment.preference_id,
        currency: payment.currency_id,
        amount_cents: amountCents,
        provider_payload: {
          status: payment.status,
          transaction_amount: payment.transaction_amount,
          currency_id: payment.currency_id,
          external_reference: payment.external_reference,
          preference_id: payment.preference_id,
          date_approved: payment.date_approved || null,
          payment_method_id: payment.payment_method_id || null,
        },
      });
      if (outcome.status !== 'approved' && outcome.status !== 'duplicate') {
        log.warn('mercadopago_payment_not_applied', {
          requestId: req.id,
          reason: outcome.status,
          providerPaymentId: dataId,
        });
      }
      return res.status(200).json({ received: true });
    } catch (error) {
      return next(error);
    }
  };
}

export const mercadopagoWebhookController = createMercadoPagoWebhookController();
