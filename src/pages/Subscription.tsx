import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PromoCodeField from '@/components/PromoCodeField';
import { getUserProfile } from '@/api';
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
import { toast } from 'sonner';
import {
  Check,
  Star,
  Zap,
  ArrowLeft,
  Shield,
  Brain,
  Scale,
  FileText,
  BarChart3,
  Headphones,
  Loader2,
} from 'lucide-react';

const Subscription = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [currentPlanName, setCurrentPlanName] = useState('Starter');
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [promoDraft, setPromoDraft] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');

  const refreshProfile = useCallback(() => {
    getUserProfile()
      .then((data) => {
        setCurrentPlanName(data.subscription?.plan?.name || data.plan || 'Starter');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success('Subscription updated! Your plan will reflect shortly.');
      refreshProfile();
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get('canceled') === '1') {
      toast.info('Checkout canceled.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshProfile]);

  useEffect(() => {
    setLoadingPlans(true);
    fetchPublicPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleCheckout = async (plan: PublicPlan) => {
    if (isEnterprisePlan(plan)) {
      navigate('/contact-support');
      return;
    }

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
        'Could not start checkout. Please try again.';
      toast.error(msg);
      setCheckoutLoading(null);
    }
  };

  const getPeriodLabel = (plan: PublicPlan) => getPlanPeriodLabel(plan, billingCycle);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Legal Analysis',
      description: 'Advanced AI that understands legal context and provides intelligent insights.',
    },
    {
      icon: Scale,
      title: 'Case Prediction',
      description: 'Predict case outcomes using historical data and judicial patterns.',
    },
    {
      icon: FileText,
      title: 'Document Automation',
      description: 'Generate contracts, briefs, and legal documents automatically.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into your legal practice and performance.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with encryption and compliance standards.',
    },
    {
      icon: Headphones,
      title: 'Priority Support',
      description: 'Email and priority support based on your plan tier.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6 lg:p-8 lg:pl-12">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground mt-2">
              Choose the perfect plan to supercharge your legal practice with AI
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-4 p-1 bg-muted rounded-lg">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="gap-2"
            >
              Yearly
              <Badge variant="secondary" className="text-xs">
                Save up to 17%
              </Badge>
            </Button>
          </div>
        </div>

        <PromoCodeField
          className="mb-8"
          value={promoDraft}
          onChange={setPromoDraft}
          onApplied={(code) => setAppliedPromo(code)}
          onClear={() => {
            setAppliedPromo('');
            setPromoDraft('');
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {loadingPlans ? (
            <p className="col-span-full text-center text-muted-foreground py-12">Loading plans...</p>
          ) : (
            plans.map((plan) => {
              const isCurrent = isCurrentPlan(currentPlanName, plan);
              const isLoading = checkoutLoading === plan.slug;
              return (
                <Card
                  key={plan.slug}
                  className={`relative transition-all duration-200 ${
                    plan.popular
                      ? 'border-primary shadow-lg scale-[1.02]'
                      : 'border-border hover:border-primary/50'
                  } ${isCurrent ? 'ring-2 ring-accent' : ''}`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  )}

                  {isCurrent && (
                    <Badge variant="secondary" className="absolute -top-3 right-3">
                      Current Plan
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">{plan.target}</p>
                    <div className="mt-6">
                      <span className="text-4xl font-bold">{getPlanDisplayPrice(plan, billingCycle)}</span>
                      <span className="text-muted-foreground">{getPeriodLabel(plan)}</span>
                      {billingCycle === 'yearly' && plan.annual_savings && (
                        <div className="text-sm text-green-600 mt-1">{plan.annual_savings}</div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features_list.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      size="lg"
                      disabled={isCurrent || isLoading}
                      onClick={() => {
                        if (isEnterprisePlan(plan) || plan.cta.toLowerCase().includes('contact')) {
                          navigate('/contact-support');
                        } else if (plan.slug !== 'starter') {
                          handleCheckout(plan);
                        }
                      }}
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

        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              LexOrbit combines cutting-edge artificial intelligence with deep legal expertise
              to transform how you practice law.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              <TabsContent value="billing" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Can I change my plan anytime?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes, you can upgrade your plan at any time. Changes take effect after checkout.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">Is there a free tier?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes — Starter is free forever with limited monthly usage. No credit card required.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">What payment methods do you accept?</h4>
                    <p className="text-muted-foreground text-sm">
                      We accept all major credit and debit cards via Stripe.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">How accurate is the AI legal analysis?</h4>
                    <p className="text-muted-foreground text-sm">
                      Our AI is trained on millions of legal documents and cases for high-quality analysis.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">What kind of support do you provide?</h4>
                    <p className="text-muted-foreground text-sm">
                      Starter gets forum support; Professional gets email support; Business gets priority support.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Legal Practice?</h2>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Start on Starter for free, then upgrade when you need more AI power and analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="gap-2"
                onClick={() => {
                  const pro = plans.find((p) => p.slug === 'professional');
                  if (pro) handleCheckout(pro);
                }}
              >
                <Zap className="w-4 h-4" />
                Subscribe — Professional
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate('/contact-support')}
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
