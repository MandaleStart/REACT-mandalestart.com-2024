import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { initFirebase, isFirebaseReady, getDb, verifyFirebaseToken } from './firebase.js';
import {
  getMockServices,
  getMockServiceBySlug,
  getMockClients,
  getMockClientByEmail,
  getMockAuthUser,
  getMockAuthUserByToken,
  createMockAuthUser,
} from './mockDb.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

initFirebase();

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'mandalestart-backend',
    firebaseReady: isFirebaseReady(),
    mode: isFirebaseReady() ? 'firebase' : 'mock',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/services', async (req, res) => {
  try {
    if (isFirebaseReady() && getDb()) {
      const snapshot = await getDb().collection('services').get();
      const services = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json(services);
    }

    return res.json(getMockServices());
  } catch (error) {
    console.error('Error al leer servicios:', error);
    return res.status(500).json({ message: 'Error al obtener servicios', error: error.message });
  }
});

app.get('/api/services/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    if (isFirebaseReady() && getDb()) {
      const doc = await getDb().collection('services').doc(slug).get();
      if (!doc.exists) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }
      return res.json({ id: doc.id, ...doc.data() });
    }

    const service = getMockServiceBySlug(slug);
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    return res.json(service);
  } catch (error) {
    console.error('Error al leer servicio:', error);
    return res.status(500).json({ message: 'Error al obtener servicio', error: error.message });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    if (isFirebaseReady() && getDb()) {
      const snapshot = await getDb().collection('clients').get();
      const clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json(clients);
    }

    return res.json(getMockClients());
  } catch (error) {
    console.error('Error al leer clientes:', error);
    return res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
});

app.get('/api/clients/by-email', async (req, res) => {
  const email = String(req.query.email || '').trim();

  if (!email) {
    return res.status(400).json({ message: 'Debes enviar el parámetro email' });
  }

  try {
    if (isFirebaseReady() && getDb()) {
      const snapshot = await getDb().collection('clients').where('email', '==', email).limit(1).get();

      if (snapshot.empty) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      const client = snapshot.docs[0];
      return res.json({ id: client.id, ...client.data() });
    }

    const client = getMockClientByEmail(email);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    return res.json(client);
  } catch (error) {
    console.error('Error al buscar cliente por email:', error);
    return res.status(500).json({ message: 'Error al buscar cliente', error: error.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { idToken, email } = req.body || {};

  try {
    if (isFirebaseReady()) {
      const decoded = await verifyFirebaseToken(idToken);
      if (decoded) {
        return res.json({
          ok: true,
          user: {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email?.split('@')[0] || 'Usuario',
            provider: 'google',
            role: 'client',
          },
          token: idToken,
        });
      }
    }

    const user = getMockAuthUser({ email: email || 'clientea@demo.com', provider: 'google' });
    if (!user) {
      return res.status(401).json({ message: 'No se pudo validar el usuario de Google' });
    }

    return res.json({
      ok: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        provider: 'google',
        role: user.role,
      },
      token: 'demo-google-token',
    });
  } catch (error) {
    console.error('Error en login con Google:', error);
    return res.status(500).json({ message: 'Error en login con Google', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  try {
    const user = createMockAuthUser({
      email,
      password,
      provider: 'email',
      name,
    });

    if (!user) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese email' });
    }

    return res.status(201).json({
      ok: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        provider: 'email',
        role: user.role,
      },
      token: `demo-register-token-${user.uid}`,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Error al crear la cuenta', error: error.message });
  }
});

app.post('/api/auth/email', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  try {
    const user = getMockAuthUser({ email, password, provider: 'email' });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    return res.json({
      ok: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        provider: 'email',
        role: user.role,
      },
      token: 'demo-email-token',
    });
  } catch (error) {
    console.error('Error en login con email:', error);
    return res.status(500).json({ message: 'Error en login con email', error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    if (isFirebaseReady()) {
      const decoded = await verifyFirebaseToken(token);
      if (decoded) {
        return res.json({
          ok: true,
          user: {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email?.split('@')[0] || 'Usuario',
            provider: 'firebase',
            role: 'client',
          },
        });
      }
    }

    const user = getMockAuthUserByToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.json({
      ok: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        provider: user.provider,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return res.status(500).json({ message: 'Error al verificar sesión', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'API de mandalestart funcionando',
    endpoints: [
      '/api/health',
      '/api/services',
      '/api/services/:slug',
      '/api/clients',
      '/api/clients/by-email?email=clientea@demo.com',
    ],
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Hubo un error interno del servidor',
    error: err.message,
  });
});

export default app;
