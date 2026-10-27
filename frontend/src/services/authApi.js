import { apiRequest } from './apiClient.js';

export async function getBackendHealth() {
  const health = await apiRequest('/api/health', { method: 'GET' });
  if (!health || typeof health !== 'object' || health.ok !== true) {
    throw new Error('El servicio de cuentas no respondió correctamente.');
  }
  return health;
}

export async function getClientAccount(idToken) {
  return apiRequest('/api/clients/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export async function getClientDashboard(idToken) {
  return apiRequest('/api/clients/me/dashboard', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export async function updateClientProfile(idToken, profile) {
  return apiRequest('/api/clients/me/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(profile),
  });
}
