import app from './app.js';
import dotenv from 'dotenv';
import { logger } from './logger.js';
import { getValidatedEnv } from './config.js';

dotenv.config();

const env = getValidatedEnv(process.env);
const PORT = process.env.PORT || 4000;

if (env.HTTP_MODE !== 'true') {
  throw new Error('HTTP_MODE=false requiere HTTPS, que todavía no está configurado en este servidor.');
}

app.listen(PORT, () => {
  logger.info('backend_started', {
    port: PORT,
    protocol: 'http',
    healthCheckPath: '/api/health',
    environment: process.env.NODE_ENV || 'development',
  });
});
