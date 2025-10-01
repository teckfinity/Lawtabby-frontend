import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
}

const SubscriptionPopup = ({ isOpen, onClose, currentPlan }: SubscriptionPopupProps) => {
  const navigate = useNavigate();
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '5 AI legal consultations per month',
        'Basic PDF tools',
        'Standard support',
        '1 GB storage'
      ],
      popular: false,
      current: currentPlan === 'Free Plan'
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'For legal professionals',
      features: [
        'Unlimited AI legal consultations',
        'Advanced PDF tools & automation',
        'Priority support',
        '50 GB storage',
        'Case prediction analytics',
        'Judge insights & patterns'
      ],
      popular: true,
      current: currentPlan === 'Professional Plan'
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For law firms and teams',
      features: [
        'Everything in Professional',
        'Team collaboration tools',
        'Custom AI model training',
        'Unlimited storage',
        'Advanced analytics dashboard',
        'White-label solutions',
        'Dedicated account manager'
      ],
      popular: false,
      current: currentPlan === 'Enterprise Plan'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Unlock the full potential of LegalAI Pro with our professional plans
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative transition-all duration-200 ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border hover:border-primary/50'
              } ${plan.current ? 'ring-2 ring-accent' : ''}`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
                >
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              {plan.current && (
                <Badge 
                  variant="secondary"
                  className="absolute -top-3 right-4"
                >
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full mt-6" 
                  variant={plan.current ? "secondary" : (plan.popular ? "default" : "outline")}
                  disabled={plan.current}
                >
                  {plan.current ? (
                    'Current Plan'
                  ) : plan.name === 'Free' ? (
                    'Downgrade'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              All plans include a 30-day money-back guarantee
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Learn More button clicked');
                onClose();
                navigate('/subscription');
              }}
            >
              Learn More About Plans
            </Button>
            <p className="text-xs text-muted-foreground">
              Need a custom solution? Contact our sales team for enterprise pricing.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPopup;