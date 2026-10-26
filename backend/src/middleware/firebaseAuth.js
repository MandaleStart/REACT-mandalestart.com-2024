import { isFirebaseReady, verifyFirebaseToken } from '../firebase.js';

export async function requireVerifiedFirebaseUser(req, res, next) {
  const decoded = await getVerifiedFirebaseUser(req, res);
  if (!decoded) return;
  req.auth = decoded;
  next();
}

export async function requireFirebaseAdmin(req, res, next) {
  const decoded = await getVerifiedFirebaseUser(req, res);
  if (!decoded) return;
  if (!hasAdminClaim(decoded)) {
    res.status(403).json({ message: 'No tenés permisos para administrar estos datos.' });
    return;
  }
  req.auth = decoded;
  next();
}

export const hasAdminClaim = (decoded) => decoded?.admin === true;

async function getVerifiedFirebaseUser(req, res) {
  if (!isFirebaseReady()) {
    res.status(503).json({ message: 'El área de clientes no está disponible en este momento.' });
    return null;
  }

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ message: 'Iniciá sesión para consultar tu cuenta.' });
    return null;
  }

  const decoded = await verifyFirebaseToken(token);
  if (!decoded?.email) {
    res.status(401).json({ message: 'La sesión no es válida. Iniciá sesión nuevamente.' });
    return null;
  }

  if (decoded.email_verified !== true) {
    res.status(403).json({ message: 'Verificá tu correo electrónico antes de consultar el área de clientes.' });
    return null;
  }

  return decoded;
}
