import { apiClient } from './config';

export type BillingCycle = 'monthly' | 'yearly';

export interface PlanPrice {
  id: number;
  interval: 'monthly' | 'annual';
  amount_cents: number;
  display_amount: string;
  currency: string;
  is_active: boolean;
}

export interface PublicPlan {
  id: number;
  name: string;
  slug: string;
  tier_rank: number;
  price: number;
  display_price: string;
  features: string;
  features_list: string[];
  description: string;
  target: string;
  badge: string | null;
  popular: boolean;
  cta: string;
  annual_savings: string;
  entitlements: Record<string, unknown>;
  included_credits_monthly: number;
  max_seats: number;
  free_trial: boolean;
  is_public: boolean;
  prices: PlanPrice[];
}

export interface PaginatedPlansResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: PublicPlan[];
}

function normalizePlansResponse(data: PublicPlan[] | PaginatedPlansResponse): PublicPlan[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}

export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const { data } = await apiClient.get<PublicPlan[] | PaginatedPlansResponse>('/payment/subscription_list/');
  return normalizePlansResponse(data);
}

export function getPlanDisplayPrice(plan: PublicPlan, cycle: BillingCycle): string {
  if (plan.slug === 'starter' || plan.price === 0) {
    return 'FREE';
  }
  if (plan.slug === 'enterprise' && cycle === 'yearly') {
    return 'Custom';
  }
  if (cycle === 'yearly') {
    const annual = plan.prices.find((p) => p.interval === 'annual');
    if (annual) {
      const monthlyEquivalent = Math.round(annual.amount_cents / 100 / 12);
      return `$${monthlyEquivalent}`;
    }
  }
  const monthly = plan.prices.find((p) => p.interval === 'monthly');
  if (monthly) {
    const amount = Math.round(monthly.amount_cents / 100);
    return plan.slug === 'enterprise' ? `$${amount}+` : `$${amount}`;
  }
  if (plan.price > 0) {
    return `$${Math.round(plan.price / 100)}`;
  }
  return 'Custom';
}

export function getPlanPeriodLabel(plan: PublicPlan, cycle: BillingCycle): string {
  if (plan.slug === 'starter') return '';
  if (plan.slug === 'enterprise' && cycle === 'yearly') return '';
  return cycle === 'monthly' ? '/month' : '/month billed annually';
}

export function isCurrentPlan(currentPlanName: string | undefined, plan: PublicPlan): boolean {
  if (!currentPlanName) return plan.slug === 'starter';
  const normalized = currentPlanName.toLowerCase();
  return (
    normalized === plan.name.toLowerCase() ||
    normalized === plan.slug ||
    (plan.slug === 'starter' &&
      (normalized.includes('free') || normalized.includes('starter') || normalized.includes('trial')))
  );
}

export function isEnterprisePlan(plan: PublicPlan): boolean {
  return plan.slug === 'enterprise';
}

export interface UsageFeatureSummary {
  used: number;
  limit: number | null;
}

export interface UsageSummary {
  plan: { slug: string; name: string };
  period_start: string;
  period_end: string;
  usage: Record<string, UsageFeatureSummary>;
  entitlements: Record<string, unknown>;
}

export function billingCycleToInterval(cycle: BillingCycle): 'monthly' | 'annual' {
  return cycle === 'yearly' ? 'annual' : 'monthly';
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
  interval: 'monthly' | 'annual';
}

export interface CouponValidation {
  valid: boolean;
  code?: string;
  description?: string;
  discount_type?: string;
  discount_value?: number;
  message?: string;
}

export async function createCheckoutSession(params: {
  plan_slug: string;
  interval: 'monthly' | 'annual';
  coupon_code?: string;
}): Promise<CheckoutResponse> {
  const { data } = await apiClient.post<CheckoutResponse>('/payment/checkout/', {
    ...params,
    // Stripe must redirect back to the same origin where the user logged in.
    return_url: typeof window !== 'undefined' ? window.location.origin : undefined,
  });
  return data;
}

export async function validateCoupon(code: string, planSlug?: string): Promise<CouponValidation> {
  const { data } = await apiClient.post<CouponValidation>('/payment/coupons/validate/', {
    code,
    plan_slug: planSlug || '',
  });
  return data;
}

export async function fetchStripeConfig(): Promise<{ publishable_key: string; checkout_enabled: boolean }> {
  const { data } = await apiClient.get('/payment/config/');
  return data;
}

export async function fetchUsageSummary(): Promise<UsageSummary> {
  const response = await apiClient.get('/payment/usage/');
  return response.data;
}
