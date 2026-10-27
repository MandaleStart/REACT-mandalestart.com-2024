import app from './app.js';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info('backend_started', {
    port: PORT,
    healthCheckPath: '/api/health',
    environment: process.env.NODE_ENV || 'development',
  });
});
