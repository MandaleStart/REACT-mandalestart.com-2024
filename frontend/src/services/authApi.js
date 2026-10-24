const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'Error en la solicitud';
    throw new Error(message);
  }

  return payload;
}

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
