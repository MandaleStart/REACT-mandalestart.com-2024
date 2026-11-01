import * as billingRepository from '../billingRepository.js';
import { getClientByEmail } from '../portalRepository.js';
import { projectClientInvoice, projectClientSubscription } from '../services/clientBillingProjection.js';
import { setPrivateNoStore } from './responseCache.js';

function validId(value) {
  return typeof value === 'string' && /^[^/]{1,150}$/.test(value) && value !== '.' && value !== '..';
}

export function createClientBillingControllers(
  repository = billingRepository,
  resolveClient = getClientByEmail,
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
      res.status(404).json({ message: 'No encontramos una ficha de cliente asociada a tu cuenta.' });
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
  };
}

export const clientBillingControllers = createClientBillingControllers();
