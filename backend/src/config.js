import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://dev.mandalestart.com',
    'https://mandalestart.com',
    'https://www.mandalestart.com',
].join(',');

export function getValidatedEnv(env = process.env) {
    const normalizedEnv = { ...env };
    const frontendOrigins = (normalizedEnv.FRONTEND_ORIGINS || DEFAULT_ORIGINS)
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    const proxyHops = Number(
        normalizedEnv.TRUST_PROXY_HOPS || (normalizedEnv.NODE_ENV === 'production' ? '1' : '0'),
    );

    if (!Number.isInteger(proxyHops) || proxyHops < 0) {
        throw new Error('TRUST_PROXY_HOPS debe ser un entero mayor o igual a cero.');
    }

    normalizedEnv.FRONTEND_ORIGINS = frontendOrigins.join(',');
    normalizedEnv.TRUST_PROXY_HOPS = String(proxyHops);

    return normalizedEnv;
}

export function getAllowedOrigins(env = process.env) {
    return new Set(
        (getValidatedEnv(env).FRONTEND_ORIGINS || '')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
    );
}
