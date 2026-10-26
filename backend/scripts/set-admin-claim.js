import dotenv from 'dotenv';
import { getAuth } from 'firebase-admin/auth';
import { firebaseState, initFirebase, isFirebaseReady } from '../src/firebase.js';

dotenv.config();

const [uid, action = 'grant'] = process.argv.slice(2);
if (!uid || !['grant', 'revoke'].includes(action)) {
  throw new Error('Uso: node scripts/set-admin-claim.js <firebase-uid> [grant|revoke]');
}

initFirebase();
if (!isFirebaseReady()) {
  throw new Error('Configurá Firebase Admin antes de cambiar permisos administrativos.');
}

const auth = getAuth(firebaseState.app);
const user = await auth.getUser(uid);
const claims = { ...user.customClaims };

if (action === 'grant') {
  claims.admin = true;
} else {
  delete claims.admin;
}

await auth.setCustomUserClaims(uid, claims);
console.info(`Permiso administrativo ${action === 'grant' ? 'otorgado' : 'revocado'} correctamente.`);
