import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const firebaseState = {
  ready: false,
  app: null,
};

function resolveServiceAccountPath(value) {
  if (!value) return null;
  return path.isAbsolute(value) ? value : path.resolve(__dirname, '..', value);
}

function loadServiceAccount() {
  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.FIREBASE_SERVICE_ACCOUNT,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      if (candidate.trimStart().startsWith('{')) {
        return JSON.parse(candidate);
      }

      const resolvedPath = resolveServiceAccountPath(candidate);
      if (fs.existsSync(resolvedPath)) {
        return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      }
    } catch (error) {
      console.warn('No se pudo cargar la credencial de Firebase:', error.name);
    }
  }

  return null;
}

export function initFirebase() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseState.app = getApp();
    firebaseState.ready = true;
    return firebaseState;
  }

  const serviceAccount = loadServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id;

  if (serviceAccount) {
    firebaseState.app = initializeApp({
      credential: cert(serviceAccount),
      ...(projectId ? { projectId } : {}),
      ...(process.env.FIREBASE_DATABASE_URL ? { databaseURL: process.env.FIREBASE_DATABASE_URL } : {}),
    });
  } else if (projectId) {
    firebaseState.app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } else {
    console.info('Firebase Admin no configurado; las rutas que requieren autenticación quedan deshabilitadas.');
    return firebaseState;
  }
  firebaseState.ready = true;
  firebaseState.ready = true;
  console.info('Firebase Admin inicializado correctamente.');

  return firebaseState;
}

export const isFirebaseReady = () => firebaseState.ready;

export async function verifyFirebaseToken(idToken) {
  if (!idToken || !isFirebaseReady() || !firebaseState.app) {
    return null;
  }

  try {
    return await getAuth(firebaseState.app).verifyIdToken(idToken, true);
  } catch (error) {
    console.warn('Token de Firebase inválido:', error.code || error.name);
    return null;
  }
}
