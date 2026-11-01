import * as billingRepository from '../billingRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import {
  validateInvoice,
  validateInvoiceUpdate,
  validateManualPayment,
  validatePlan,
  validateSubscription,
} from '../services/billingValidation.js';
import { setPrivateNoStore } from './responseCache.js';

const invoiceStatuses = new Set(['draft', 'open', 'paid', 'void', 'overdue']);
const auditEntityTypes = new Set(['plan', 'subscription', 'invoice', 'client', 'client_account']);

function validId(value) {
  return (
    typeof value === 'string' && /^[^/]{1,150}$/.test(value) && value !== '.' && value !== '..'
  );
}

function parseIfMatch(req, res) {
  const header = req.get('if-match');
  if (!header) {
    res.status(428).json({ message: 'Enviá If-Match con la versión updated_at actual.' });
    return null;
  }
  const value = header.startsWith('"') && header.endsWith('"') ? header.slice(1, -1) : header;
  if (
    header.startsWith('W/') ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    res.status(400).json({
      message: 'El encabezado If-Match no contiene un updated_at válido.',
    });
    return null;
  }
  return value;
}

function pagination(query, res) {
  const limit = query.limit === undefined ? 100 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 500 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 100000
  ) {
    res.status(400).json({ message: 'La paginación no es válida.' });
    return null;
  }
  return { limit, offset };
}

function actor(req) {
  return { uid: req.auth.uid, email: req.auth.email };
}

function sendRepositoryError(error, res, next) {
  if (error.code === '23505') {
    res.status(409).json({ message: 'Ya existe un registro con esos datos únicos.' });
    return;
  }
  if (error.code === '23503') {
    res.status(400).json({
      message: 'La referencia a un cliente, plan o suscripción no es válida.',
    });
    return;
  }
  if (error.code === 'INVALID_AUDIT_ACTOR') {
    res.status(500).json({
      message: 'No se pudo identificar al administrador para auditar el cambio.',
    });
    return;
  }
  if (error.code === 'INVALID_INVOICE_SUBSCRIPTION') {
    res.status(400).json({ message: error.message });
    return;
  }
  if (error.code === 'INVALID_INVOICE_CLIENT') {
    res.status(400).json({ message: error.message });
    return;
  }
  next(error);
}

export function createAdminBillingControllers(
  repository = billingRepository,
  databaseConfigured = isPostgresConfigured,
) {
  function prepare(req, res) {
    setPrivateNoStore(res);
    if (!databaseConfigured()) {
      res.status(503).json({ message: 'PostgreSQL no está configurado.' });
      return false;
    }
    return true;
  }

  return {
    async listPlans(req, res, next) {
      if (!prepare(req, res)) return;
      try {
        return res.json(await repository.listPlans());
      } catch (error) {
        return next(error);
      }
    },

    async createPlan(req, res, next) {
      if (!prepare(req, res)) return;
      const result = validatePlan(req.body);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        return res.status(201).json(await repository.createPlan(result.value, actor(req)));
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async updatePlan(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador del plan no es válido.' });
      const updatedAt = parseIfMatch(req, res);
      if (!updatedAt) return;
      const result = validatePlan(req.body);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        const outcome = await repository.updatePlan(
          req.params.id,
          result.value,
          updatedAt,
          actor(req),
        );
        if (outcome.status === 'not-found')
          return res.status(404).json({ message: 'Plan no encontrado.' });
        if (outcome.status === 'conflict') {
          return res.status(409).json({
            message: 'Otra persona modificó este registro mientras lo editabas. Recargá para ver los cambios.',
          });
        }
        return res.json(outcome.record);
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async deactivatePlan(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador del plan no es válido.' });
      try {
        const outcome = await repository.deactivatePlan(req.params.id, actor(req));
        if (outcome.status === 'not-found')
          return res.status(404).json({ message: 'Plan no encontrado o ya inactivo.' });
        return res.status(204).end();
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async listSubscriptions(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador del cliente no es válido.' });
      try {
        return res.json(await repository.listSubscriptionsByClient(req.params.id));
      } catch (error) {
        return next(error);
      }
    },

    async createSubscription(req, res, next) {
      if (!prepare(req, res)) return;
      const result = validateSubscription(req.body, req.params.id);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        return res.status(201).json(await repository.createSubscription(result.value, actor(req)));
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async updateSubscription(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({
          message: 'El identificador de la suscripción no es válido.',
        });
      const updatedAt = parseIfMatch(req, res);
      if (!updatedAt) return;
      const result = validateSubscription(req.body, req.body?.client_id);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        const outcome = await repository.updateSubscription(
          req.params.id,
          result.value,
          updatedAt,
          actor(req),
        );
        if (outcome.status === 'not-found')
          return res.status(404).json({ message: 'Suscripción no encontrada.' });
        if (outcome.status === 'conflict') {
          return res.status(409).json({
            message:
              'Otra persona modificó este registro mientras lo editabas. Recargá para ver los cambios.',
          });
        }
        return res.json(outcome.record);
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async cancelSubscription(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({
          message: 'El identificador de la suscripción no es válido.',
        });
      try {
        const outcome = await repository.cancelSubscription(req.params.id, actor(req));
        if (outcome.status === 'not-found') {
          return res.status(404).json({ message: 'Suscripción no encontrada o ya cancelada.' });
        }
        return res.status(204).end();
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async listInvoices(req, res, next) {
      if (!prepare(req, res)) return;
      const page = pagination(req.query, res);
      if (!page) return;
      const filters = { ...page };
      if (req.query.status) {
        if (!invoiceStatuses.has(req.query.status))
          return res.status(400).json({ message: 'El estado de factura no es válido.' });
        filters.status = req.query.status;
      }
      if (req.query.client_id) {
        if (!validId(req.query.client_id))
          return res.status(400).json({ message: 'El identificador del cliente no es válido.' });
        filters.client_id = req.query.client_id;
      }
      if (req.query.from) {
        const date = validateInvoiceDate(req.query.from);
        if (!date)
          return res.status(400).json({
            message: 'La fecha inicial debe tener formato AAAA-MM-DD.',
          });
        filters.from = req.query.from;
      }
      if (req.query.to) {
        const date = validateInvoiceDate(req.query.to);
        if (!date)
          return res.status(400).json({ message: 'La fecha final debe tener formato AAAA-MM-DD.' });
        filters.to = req.query.to;
      }
      if (filters.from && filters.to && filters.to < filters.from) {
        return res.status(400).json({
          message: 'La fecha final no puede ser anterior a la fecha inicial.',
        });
      }
      try {
        return res.json(await repository.listInvoices(filters));
      } catch (error) {
        return next(error);
      }
    },

    async createInvoice(req, res, next) {
      if (!prepare(req, res)) return;
      const result = validateInvoice(req.body);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        return res.status(201).json(await repository.createInvoice(result.value, actor(req)));
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async getInvoice(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador de la factura no es válido.' });
      try {
        const invoice = await repository.getInvoice(req.params.id);
        return invoice
          ? res.json(invoice)
          : res.status(404).json({ message: 'Factura no encontrada.' });
      } catch (error) {
        return next(error);
      }
    },

    async updateInvoice(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador de la factura no es válido.' });
      const updatedAt = parseIfMatch(req, res);
      if (!updatedAt) return;
      const result = validateInvoiceUpdate(req.body);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        const outcome = await repository.updateInvoice(
          req.params.id,
          result.value,
          updatedAt,
          actor(req),
        );
        if (outcome.status === 'not-found')
          return res.status(404).json({ message: 'Factura no encontrada.' });
        if (outcome.status === 'conflict') {
          return res.status(409).json({
            message:
              'Otra persona modificó este registro mientras lo editabas. Recargá para ver los cambios.',
          });
        }
        if (outcome.status === 'not-editable') {
          return res.status(409).json({
            message: 'Solo se pueden editar facturas en borrador, abiertas o vencidas.',
          });
        }
        return res.json(outcome.record);
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async recordManualPayment(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador de la factura no es válido.' });
      const result = validateManualPayment(req.body);
      if (!result.ok) return res.status(400).json({ message: result.message });
      try {
        const outcome = await repository.recordManualPayment(
          req.params.id,
          result.value,
          actor(req),
        );
        if (outcome.status === 'not-found')
          return res.status(404).json({ message: 'Factura no encontrada.' });
        if (outcome.status === 'not-payable')
          return res.status(409).json({ message: 'La factura no admite pagos.' });
        if (outcome.status === 'currency-mismatch')
          return res.status(400).json({
            message: 'La moneda del pago debe coincidir con la factura.',
          });
        if (outcome.status === 'overpayment')
          return res.status(409).json({
            message: 'El pago supera el saldo pendiente de la factura.',
          });
        if (outcome.status === 'checkout-pending')
          return res.status(409).json({
            message:
              'Hay un pago online activo para esta factura. Esperá que venza antes de registrar un pago manual.',
          });
        return res.status(201).json(outcome);
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async voidInvoice(req, res, next) {
      if (!prepare(req, res)) return;
      if (!validId(req.params.id))
        return res.status(400).json({ message: 'El identificador de la factura no es válido.' });
      try {
        const outcome = await repository.voidInvoice(req.params.id, actor(req));
        if (outcome.status === 'not-found')
          return res.status(404).json({ message: 'Factura no encontrada.' });
        if (outcome.status === 'not-voidable')
          return res.status(409).json({
            message: 'La factura no se puede anular en su estado actual.',
          });
        return res.json(outcome.record);
      } catch (error) {
        return sendRepositoryError(error, res, next);
      }
    },

    async listAudit(req, res, next) {
      if (!prepare(req, res)) return;
      const page = pagination({ limit: req.query.limit }, res);
      if (!page) return;
      const filters = { limit: page.limit };
      if (req.query.entity_type) {
        if (!auditEntityTypes.has(req.query.entity_type)) {
          return res.status(400).json({ message: 'El tipo de entidad de auditoría no es válido.' });
        }
        filters.entity_type = req.query.entity_type;
      }
      if (req.query.entity_id) {
        if (!validId(req.query.entity_id))
          return res.status(400).json({ message: 'El identificador de entidad no es válido.' });
        filters.entity_id = req.query.entity_id;
      }
      try {
        return res.json(await repository.listAudit(filters));
      } catch (error) {
        return next(error);
      }
    },

    async revenueReport(req, res, next) {
      if (!prepare(req, res)) return;
      const from = req.query.from;
      const to = req.query.to;
      if (!validateInvoiceDate(from) || !validateInvoiceDate(to) || to < from) {
        return res.status(400).json({
          message: 'Indicá un rango válido con from y to en formato AAAA-MM-DD.',
        });
      }
      try {
        return res.json(await repository.getRevenueReport(from, to));
      } catch (error) {
        return next(error);
      }
    },
  };
}

function validateInvoiceDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export const adminBillingControllers = createAdminBillingControllers();
