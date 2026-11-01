import { auth } from '../firebase';
import { apiRequest } from './apiClient.js';

async function adminRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const user = auth?.currentUser;
  if (!user) {
    const error = new Error('Tu sesión venció, volvé a ingresar.');
    error.status = 401;
    throw error;
  }
  const token = await user.getIdToken();
  return apiRequest(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(headers || {}),
    },
  });
}

function versionHeader(updatedAt) {
  if (!updatedAt)
    throw new Error('El registro no tiene una versión actualizada para proteger el cambio.');
  return { 'If-Match': `"${updatedAt}"` };
}

export const listBillingPlans = () => adminRequest('/api/admin/plans');
export const createBillingPlan = (plan) =>
  adminRequest('/api/admin/plans', { method: 'POST', body: plan });
export const updateBillingPlan = (id, plan, updatedAt) =>
  adminRequest(`/api/admin/plans/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: plan,
    headers: versionHeader(updatedAt),
  });
export const deactivateBillingPlan = (id) =>
  adminRequest(`/api/admin/plans/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const listClientSubscriptions = (clientId) =>
  adminRequest(`/api/admin/clients/${encodeURIComponent(clientId)}/subscriptions`);
export const createBillingSubscription = (clientId, subscription) =>
  adminRequest(`/api/admin/clients/${encodeURIComponent(clientId)}/subscriptions`, {
    method: 'POST',
    body: subscription,
  });
export const cancelBillingSubscription = (id) =>
  adminRequest(`/api/admin/subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const listBillingInvoices = (filters = {}) => {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  );
  return adminRequest(`/api/admin/invoices${query.size ? `?${query}` : ''}`);
};
export const createBillingInvoice = (invoice) =>
  adminRequest('/api/admin/invoices', { method: 'POST', body: invoice });
export const getBillingInvoice = (invoiceId) =>
  adminRequest(`/api/admin/invoices/${encodeURIComponent(invoiceId)}`);
export const recordBillingPayment = (invoiceId, payment) =>
  adminRequest(`/api/admin/invoices/${encodeURIComponent(invoiceId)}/payments`, {
    method: 'POST',
    body: payment,
  });
export const voidBillingInvoice = (invoiceId) =>
  adminRequest(`/api/admin/invoices/${encodeURIComponent(invoiceId)}/void`, { method: 'POST' });
export const getBillingRevenue = (from, to) => {
  const query = new URLSearchParams({ from, to });
  return adminRequest(`/api/admin/reports/revenue?${query}`);
};
export const getBillingReceivables = () => adminRequest('/api/admin/reports/receivables');
export const listBillingAudit = (filters = {}) => {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  );
  return adminRequest(`/api/admin/audit${query.size ? `?${query}` : ''}`);
};
export const listUnappliedMercadoPagoPayments = () =>
  adminRequest('/api/admin/unapplied-payments');
export const applyUnappliedMercadoPagoPayment = (id, invoiceId) =>
  adminRequest(`/api/admin/unapplied-payments/${encodeURIComponent(id)}/apply`, {
    method: 'POST',
    body: { invoice_id: invoiceId },
  });
export const dismissUnappliedMercadoPagoPayment = (id) =>
  adminRequest(`/api/admin/unapplied-payments/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
  });
export const getPublicBillingPlans = () => apiRequest('/api/plans/public');

async function clientRequest(idToken, path) {
  return apiRequest(path, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

export const getClientSubscriptions = (idToken) =>
  clientRequest(idToken, '/api/clients/me/subscriptions');
export const getClientInvoices = (idToken) => clientRequest(idToken, '/api/clients/me/invoices');
export const getClientInvoice = (idToken, id) =>
  clientRequest(idToken, `/api/clients/me/invoices/${encodeURIComponent(id)}`);
export const createClientInvoiceCheckout = (idToken, id) =>
  clientRequest(idToken, `/api/clients/me/invoices/${encodeURIComponent(id)}/checkout`);
