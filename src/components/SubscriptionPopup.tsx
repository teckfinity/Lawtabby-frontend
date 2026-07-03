import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PromoCodeField from '@/components/PromoCodeField';
import {
  billingCycleToInterval,
  createCheckoutSession,
  fetchPublicPlans,
  getPlanDisplayPrice,
  getPlanPeriodLabel,
  isCurrentPlan,
  isEnterprisePlan,
  validateCoupon,
  type BillingCycle,
  type PublicPlan,
} from '@/api/billing';
import type { UpgradeRequiredDetail } from '@/api/upgradeRequired';

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  upgradeDetail?: UpgradeRequiredDetail | null;
}

const SubscriptionPopup = ({
  isOpen,
  onClose,
  currentPlan,
  upgradeDetail,
}: SubscriptionPopupProps) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [promoDraft, setPromoDraft] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchPublicPlans().then(setPlans).catch(() => setPlans([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPromoDraft('');
      setAppliedPromo('');
      setCheckoutLoading(null);
    }
  }, [isOpen]);

  const handleCheckout = async (plan: PublicPlan) => {
    if (isEnterprisePlan(plan) || plan.cta.toLowerCase().includes('contact')) {
      onClose();
      navigate('/contact-support');
      return;
    }

    if (plan.slug === 'starter') return;

    setCheckoutLoading(plan.slug);
    try {
      if (appliedPromo) {
        try {
          await validateCoupon(appliedPromo, plan.slug);
        } catch {
          toast.error('Invalid promo code for this plan.');
          setCheckoutLoading(null);
          return;
        }
      }

      const session = await createCheckoutSession({
        plan_slug: plan.slug,
        interval: billingCycleToInterval(billingCycle),
        coupon_code: appliedPromo || undefined,
      });

      window.location.href = session.checkout_url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not start checkout.';
      toast.error(msg);
      setCheckoutLoading(null);
    }
  };

  const limitHint =
    upgradeDetail?.message ||
    (upgradeDetail?.feature_key && upgradeDetail.limit != null
      ? `You've used ${upgradeDetail.used ?? 0} of ${upgradeDetail.limit} this month.`
      : '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Plan</DialogTitle>
          <p className="text-center text-muted-foreground">
            {limitHint ||
              'Unlock more AI research, analytics, and premium tools when you need them.'}
          </p>
        </DialogHeader>

        <div className="flex justify-center gap-2 mt-2">
          <Button
            size="sm"
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
          </Button>
        </div>

        <PromoCodeField
          className="mt-4"
          compact
          value={promoDraft}
          onChange={setPromoDraft}
          onApplied={(code) => setAppliedPromo(code)}
          onClear={() => {
            setAppliedPromo('');
            setPromoDraft('');
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {plans.length === 0 ? (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">Loading plans...</p>
          ) : (
            plans.map((plan) => {
              const isCurrent = isCurrentPlan(currentPlan, plan);
              const isLoading = checkoutLoading === plan.slug;
              return (
                <Card
                  key={plan.slug}
                  className={`relative transition-all duration-200 ${
                    plan.popular ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
                  } ${isCurrent ? 'ring-2 ring-accent' : ''}`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  )}

                  {isCurrent && (
                    <Badge variant="secondary" className="absolute -top-3 right-4">
                      Current Plan
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        {getPlanDisplayPrice(plan, billingCycle)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {getPlanPeriodLabel(plan, billingCycle)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features_list.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full mt-4"
                      variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrent || isLoading}
                      onClick={() => !isCurrent && handleCheckout(plan)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting...
                        </>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : plan.slug === 'starter' ? (
                        'Included'
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          {plan.cta}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Starter is free. Paid plans bill via Stripe — monthly or yearly.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/subscription');
            }}
          >
            Compare all features on Subscription page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPopup;
