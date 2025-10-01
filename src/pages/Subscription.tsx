import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Star, 
  Zap, 
  ArrowLeft,
  Shield,
  Clock,
  Users,
  Database,
  Brain,
  Scale,
  FileText,
  BarChart3,
  Award,
  Headphones
} from 'lucide-react';

const Subscription = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'Perfect for getting started with legal AI',
      features: [
        '5 AI legal consultations per month',
        'Basic PDF tools',
        'Standard support',
        '1 GB storage',
        'Basic case search',
        'Email notifications'
      ],
      popular: false,
      cta: 'Current Plan'
    },
    {
      name: 'Professional',
      monthlyPrice: '$29',
      yearlyPrice: '$290',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For legal professionals who need advanced tools',
      features: [
        'Unlimited AI legal consultations',
        'Advanced PDF tools & automation',
        'Priority support',
        '50 GB storage',
        'Case prediction analytics',
        'Judge insights & patterns',
        'Document automation',
        'Custom templates',
        'API access',
        'Advanced search filters'
      ],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      monthlyPrice: '$99',
      yearlyPrice: '$990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For law firms and teams that need everything',
      features: [
        'Everything in Professional',
        'Team collaboration tools',
        'Custom AI model training',
        'Unlimited storage',
        'Advanced analytics dashboard',
        'White-label solutions',
        'Dedicated account manager',
        'Custom integrations',
        'SSO & advanced security',
        'Training & onboarding'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Legal Analysis',
      description: 'Advanced AI that understands legal context and provides intelligent insights.'
    },
    {
      icon: Scale,
      title: 'Case Prediction',
      description: 'Predict case outcomes using historical data and judicial patterns.'
    },
    {
      icon: FileText,
      title: 'Document Automation',
      description: 'Generate contracts, briefs, and legal documents automatically.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into your legal practice and performance.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with encryption and compliance standards.'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Round-the-clock support from our legal technology experts.'
    }
  ];

  const getSavings = (plan: any) => {
    if (billingCycle === 'yearly') {
      const monthly = parseFloat(plan.monthlyPrice.replace('$', '')) * 12;
      const yearly = parseFloat(plan.yearlyPrice.replace('$', ''));
      return monthly - yearly;
    }
    return 0;
  };

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6 lg:p-8 lg:pl-12">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
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
        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
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
                Save 17%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative transition-all duration-200 ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
                >
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold">
                    {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                  {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      Save ${getSavings(plan)} per year
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  onClick={() => {
                    if (plan.cta === 'Contact Sales') {
                      navigate('/contact-support');
                    }
                  }}
                >
                  {plan.name === 'Free' ? (
                    'Current Plan'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {plan.cta}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              LegalAI Pro combines cutting-edge artificial intelligence with deep legal expertise 
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

        {/* FAQ Section */}
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
                      Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">Is there a free trial?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes, all paid plans come with a 30-day free trial. No credit card required to start.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">What payment methods do you accept?</h4>
                    <p className="text-muted-foreground text-sm">
                      We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">How accurate is the AI legal analysis?</h4>
                    <p className="text-muted-foreground text-sm">
                      Our AI is trained on millions of legal documents and cases, achieving 95%+ accuracy in legal analysis.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">Can I integrate with existing tools?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes, we offer API access and integrations with popular legal practice management systems.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="support" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">What kind of support do you provide?</h4>
                    <p className="text-muted-foreground text-sm">
                      Free plans get email support, Professional gets priority support, and Enterprise gets dedicated account management.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">Do you provide training?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes, we offer comprehensive training materials, webinars, and one-on-one training for Enterprise customers.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Legal Practice?</h2>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Join thousands of legal professionals who are already using LegalAI Pro 
              to work smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="gap-2">
                <Zap className="w-4 h-4" />
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
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