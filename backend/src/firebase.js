import * as admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const firebaseState = {
  ready: false,
  app: null,
  db: null,
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
      const resolvedPath = resolveServiceAccountPath(candidate);
      if (fs.existsSync(resolvedPath)) {
        const raw = fs.readFileSync(resolvedPath, 'utf8');
        return JSON.parse(raw);
      }

      if (candidate.startsWith('{')) {
        return JSON.parse(candidate);
      }
    } catch (error) {
      console.warn('No se pudo cargar la credencial de Firebase:', error.message);
    }
  }

  return null;
}

export function initFirebase() {
  if (firebaseState.ready || (admin.apps && admin.apps.length > 0)) {
    firebaseState.ready = true;
    firebaseState.app = admin.app();
    firebaseState.db = admin.firestore();
    return firebaseState;
  }

  const serviceAccount = loadServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } else if (projectId) {
    admin.initializeApp({ projectId });
  } else {
    console.log('Firebase Admin no configurado. El backend correrá en modo mock.');
    return firebaseState;
  }

  firebaseState.ready = true;
  firebaseState.app = admin.app();
  firebaseState.db = admin.firestore();

  console.log('Firebase Admin inicializado correctamente.');
  return firebaseState;
}

export const isFirebaseReady = () => firebaseState.ready;
export const getDb = () => firebaseState.db;

export async function verifyFirebaseToken(idToken) {
  if (!idToken || !isFirebaseReady() || !firebaseState.app) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.warn('Token de Firebase inválido:', error.message);
    return null;
  }
}
