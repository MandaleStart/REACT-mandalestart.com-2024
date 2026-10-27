import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';

import { getAllowedOrigins, getValidatedEnv } from './config.js';
import { initFirebase } from './firebase.js';
import { logger } from './logger.js';
import apiRoutes from './routes/api.js';
import { projectClientRecord } from './services/clientProjection.js';

const env = getValidatedEnv(process.env);
const allowedOrigins = getAllowedOrigins(env);
const proxyHops = Number(env.TRUST_PROXY_HOPS || '0');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', proxyHops);
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: false,
}));
app.use(express.json({ limit: '20kb' }));
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  const startedAt = Date.now();

  res.on('finish', () => {
    logger.request({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      route: req.route?.path || req.path,
    });
  });

  next();
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Esperá un momento y volvé a intentar.' },
});

app.use('/api', apiLimiter);
app.use('/api', apiRoutes);
initFirebase();

export { projectClientRecord };
export default app;
