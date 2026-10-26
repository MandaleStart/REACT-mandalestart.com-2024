const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, { status = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
  }
}

function getErrorMessage(payload, status) {
  if (status === 429) return 'Demasiados intentos, probá en unos minutos.';
  if (typeof payload === 'string' && payload) return payload;
  return payload?.message || 'No se pudo completar la solicitud.';
}

async function parsePayload(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

export async function apiRequest(path, options = {}) {
  const {
    headers: requestHeaders,
    signal: externalSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...requestOptions
  } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abortFromExternal = () => controller.abort(externalSignal.reason);
  if (externalSignal?.aborted) abortFromExternal();
  else externalSignal?.addEventListener('abort', abortFromExternal, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers = new Headers(requestHeaders);
  const hasBody = requestOptions.body !== undefined && requestOptions.body !== null;
  if (hasBody && typeof requestOptions.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal,
    });
    const payload = await parsePayload(response);

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, response.status), { status: response.status });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) {
      throw new ApiError('La solicitud tardó demasiado. Probá de nuevo.', { status: null, cause: error });
    }
    if (externalSignal?.aborted) throw error;
    throw new ApiError('No se pudo conectar con el servidor.', { status: null, cause: error });
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}
