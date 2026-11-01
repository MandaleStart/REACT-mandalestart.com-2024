import * as billingRepository from '../billingRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import { setPublicCache } from './responseCache.js';

function projectPublicPlan(plan) {
  return {
    id: plan.id,
    service_slug: plan.service_slug,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    currency: plan.currency,
    amount_cents: plan.amount_cents,
    billing_period: plan.billing_period,
    tax_rate_bp: plan.tax_rate_bp,
    features: Array.isArray(plan.features)
      ? plan.features.filter((feature) => typeof feature === 'string')
      : [],
  };
}

export function createPublicBillingControllers(
  repository = billingRepository,
  databaseConfigured = isPostgresConfigured,
) {
  return {
    async listPlans(req, res, next) {
      try {
        setPublicCache(res);
        if (!databaseConfigured()) return res.json([]);
        const plans = await repository.listPlans();
        return res.json(
          plans
            .filter((plan) => plan.is_public === true && plan.is_active === true)
            .map(projectPublicPlan),
        );
      } catch (error) {
        return next(error);
      }
    },
  };
}

export const publicBillingControllers = createPublicBillingControllers();
