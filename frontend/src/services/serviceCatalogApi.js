import { apiRequest } from './apiClient.js';

export async function getPublicServices(signal) {
  const services = await apiRequest('/api/services', { signal });
  if (!Array.isArray(services)) throw new Error('El catálogo recibido no tiene un formato válido.');
  return services;
}

export async function getPublicServiceBySlug(slug, signal) {
  let service;
  try {
    service = await apiRequest(`/api/services/${encodeURIComponent(slug)}`, { signal });
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
  if (!service || typeof service !== 'object' || Array.isArray(service)) {
    throw new Error('El servicio recibido no tiene un formato válido.');
  }
  return service;
}
