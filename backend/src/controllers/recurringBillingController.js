import { timingSafeEqual } from 'node:crypto';
import * as recurringBillingRepository from '../recurringBillingRepository.js';
import { PostgresRateLimitStore } from '../middleware/postgresRateLimitStore.js';
import { sendBillingReminder } from '../services/contactMail.js';
import { logger } from '../logger.js';

function matchesCronSecret(req, secret) {
  const authorization = typeof req.get === 'function'
    ? req.get('authorization')
    : req.headers?.authorization;
  if (typeof authorization !== 'string' || typeof secret !== 'string' || !secret) return false;
  const received = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function createRecurringBillingProcessor({
  repository = recurringBillingRepository,
  sendReminder = sendBillingReminder,
  cleanupExpiredRateLimits = () => new PostgresRateLimitStore().cleanupExpired(),
  getCronSecret = () => process.env.CRON_SECRET,
  log = logger,
} = {}) {
  return async function processRecurringBilling(req, res) {
    const secret = getCronSecret();
    if (!secret) {
      return res.status(503).json({ message: 'El cron de facturación no está configurado.' });
    }
    if (!matchesCronSecret(req, secret)) {
      return res.status(401).json({ message: 'No autorizado.' });
    }

    let expiredRateLimitWindows = null;
    try {
      expiredRateLimitWindows = await cleanupExpiredRateLimits();
    } catch (error) {
      log.warn('recurring_billing_rate_limit_cleanup_failed', {
        code: error.code || error.name,
      });
    }

    try {
      const billing = await repository.runRecurringBillingJob();
      const reminders = await repository.claimDueInvoiceReminders();
      let reminderEmailsSent = 0;
      let reminderEmailsFailed = 0;

      for (const reminder of reminders) {
        try {
          await sendReminder(reminder);
          await repository.markInvoiceReminderSent(reminder.id);
          reminderEmailsSent += 1;
        } catch (error) {
          reminderEmailsFailed += 1;
          try {
            await repository.retryInvoiceReminder(reminder.id, error.code || error.name);
          } catch (retryError) {
            log.error('recurring_billing_reminder_retry_failed', {
              reminderId: reminder.id,
              code: retryError.code || retryError.name,
            });
          }
          log.error('recurring_billing_reminder_failed', {
            reminderId: reminder.id,
            code: error.code || error.name,
          });
        }
      }

      return res.status(reminderEmailsFailed ? 503 : 200).json({
        ok: reminderEmailsFailed === 0,
        ...billing,
        expiredRateLimitWindows,
        reminderEmailsSent,
        reminderEmailsFailed,
      });
    } catch (error) {
      log.error('recurring_billing_job_failed', {
        code: error.code || error.name,
      });
      return res.status(500).json({ message: 'No se pudo completar el proceso de facturación.' });
    }
  };
}

export const processRecurringBilling = createRecurringBillingProcessor();
