import { createHmac, timingSafeEqual } from 'node:crypto';

const apiBaseUrl = 'https://api.mercadopago.com';
const requestTimeoutMs = 10000;

export function verifyMercadoPagoSignature({ signature, requestId, dataId, secret }) {
  if (
    typeof signature !== 'string' ||
    typeof requestId !== 'string' ||
    !requestId ||
    typeof dataId !== 'string' ||
    !dataId ||
    typeof secret !== 'string' ||
    !secret
  )
    return false;

  const fields = Object.fromEntries(
    signature.split(',').map((part) => {
      const separator = part.indexOf('=');
      return separator < 0
        ? ['', '']
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  const timestamp = fields.ts;
  const receivedHash = fields.v1;
  if (!timestamp || !/^\d+$/.test(timestamp) || !/^[a-f\d]{64}$/i.test(receivedHash || '')) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac('sha256', secret).update(manifest).digest();
  const suppliedHash = Buffer.from(receivedHash, 'hex');
  return suppliedHash.length === expectedHash.length && timingSafeEqual(suppliedHash, expectedHash);
}

function requireAccessToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw Object.assign(new Error('Mercado Pago no está configurado en el servidor.'), {
      code: 'MERCADOPAGO_NOT_CONFIGURED',
    });
  }
  return accessToken.trim();
}

async function requestMercadoPago(path, { method = 'GET', body, accessToken, fetchImpl }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetchImpl(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${requireAccessToken(accessToken)}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw Object.assign(new Error('Mercado Pago rechazó la solicitud.'), {
        code: 'MERCADOPAGO_REQUEST_FAILED',
        status: response.status,
      });
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw Object.assign(new Error('Mercado Pago devolvió una respuesta inválida.'), {
        code: 'MERCADOPAGO_INVALID_RESPONSE',
      });
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('La solicitud a Mercado Pago superó el tiempo de espera.'), {
        code: 'MERCADOPAGO_TIMEOUT',
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function createMercadoPagoClient({
  accessToken = process.env.MP_ACCESS_TOKEN,
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    async createPreference({ invoice, amountCents, publicAppUrl, webhookUrl }) {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const now = new Date();
      const invoicePath = `/area-cliente/invoices/${encodeURIComponent(invoice.id)}`;
      const result = await requestMercadoPago('/checkout/preferences', {
        method: 'POST',
        accessToken,
        fetchImpl,
        body: {
          items: [
            {
              id: invoice.id,
              title: `Factura ${invoice.number}`,
              quantity: 1,
              currency_id: invoice.currency,
              unit_price: amountCents / 100,
            },
          ],
          external_reference: invoice.id,
          expires: true,
          expiration_date_from: now.toISOString(),
          expiration_date_to: expiresAt.toISOString(),
          notification_url: webhookUrl,
          back_urls: {
            success: `${publicAppUrl}${invoicePath}`,
            pending: `${publicAppUrl}${invoicePath}`,
            failure: `${publicAppUrl}${invoicePath}`,
          },
        },
      });
      if (
        typeof result.id !== 'string' ||
        typeof result.init_point !== 'string' ||
        !result.init_point.startsWith('https://')
      ) {
        throw Object.assign(new Error('Mercado Pago no devolvió un enlace de pago válido.'), {
          code: 'MERCADOPAGO_INVALID_RESPONSE',
        });
      }
      return {
        preference_id: result.id,
        init_point: result.init_point,
        expires_at: expiresAt.toISOString(),
      };
    },

    getPayment(paymentId) {
      return requestMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`, {
        accessToken,
        fetchImpl,
      });
    },
  };
}

export function centsFromProviderAmount(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && Math.abs(amount * 100 - cents) < 0.000001 ? cents : null;
}

export function getMercadoPagoWebhookConfig(env = process.env) {
  return {
    accessToken: env.MP_ACCESS_TOKEN || '',
    webhookSecret: env.MP_WEBHOOK_SECRET || '',
    webhookUrl: env.MP_WEBHOOK_URL || '',
    publicAppUrl: env.PUBLIC_APP_URL || '',
  };
}
