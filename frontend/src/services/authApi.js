const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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

export async function registerWithEmailBackend({ email, password, name }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function loginWithEmailBackend({ email, password }) {
  return apiRequest('/api/auth/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogleBackend({ idToken, email }) {
  return apiRequest('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, email }),
  });
}

export async function getCurrentUserSession(token) {
  return apiRequest('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getClientByEmailBackend(email) {
  const cleanEmail = encodeURIComponent(email);
  return apiRequest(`/api/clients/by-email?email=${cleanEmail}`);
}
