import { apiRequest } from './apiClient.js';

export async function submitContactMessage(message) {
  try {
    return await apiRequest('/api/contact', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  } catch (error) {
    if (error.status === 429) throw error;
    if (!error.status) {
      throw new Error('No se pudo conectar con el servidor. Podés contactarnos por email.', { cause: error });
    }
    if (error.status >= 500) {
      throw new Error('No se pudo enviar tu consulta. Podés contactarnos por email.', { cause: error });
    }
    throw error;
  }
}
