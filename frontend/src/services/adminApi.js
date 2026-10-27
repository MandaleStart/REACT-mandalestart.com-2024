import { auth } from '../firebase';
import { apiRequest } from './apiClient.js';

async function adminRequest(path, options = {}) {
  const user = auth?.currentUser;
  if (!user) {
    const error = new Error('Tu sesión venció, volvé a ingresar.');
    error.status = 401;
    throw error;
  }

  const idToken = await user.getIdToken();
  return apiRequest(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
}

export const getAdminDashboard = () => adminRequest('/api/admin/dashboard');

export const getAdminClients = () => adminRequest('/api/admin/clients');
export const getAdminUsers = () => adminRequest('/api/admin/users');
export const updateAdminUserStatus = (uid, disabled) =>
  adminRequest(`/api/admin/users/${encodeURIComponent(uid)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ disabled }),
  });
export const createAdminClient = (client) =>
  adminRequest('/api/admin/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
export const updateAdminClient = (id, client) =>
  adminRequest(`/api/admin/clients/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  });
export const deleteAdminClient = (id) =>
  adminRequest(`/api/admin/clients/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const getAdminServices = () => adminRequest('/api/admin/services');
export const saveAdminService = (slug, service) =>
  adminRequest(`/api/admin/services/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    body: JSON.stringify(service),
  });
export const archiveAdminService = (slug) =>
  adminRequest(`/api/admin/services/${encodeURIComponent(slug)}`, { method: 'DELETE' });
