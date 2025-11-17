'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle, ArrowRight, Lock } from 'lucide-react';

export default function BillingPage() {
  const { tenant } = useAuth();

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      features: ['Up to 50 invoices/month', 'Basic reports', 'Email support']
    },
    {
      name: 'Pro',
      price: 'J$2,500/month',
      features: ['Unlimited invoices', 'Advanced reports', 'Priority support', 'Custom branding', 'API access'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Pro (Plan / Billing)" subtitle="Manage your subscription plan" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <ModernCard
              key={plan.name}
              className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                  Popular
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{plan.price}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={tenant?.plan === plan.name.toUpperCase()}
              >
                {tenant?.plan === plan.name.toUpperCase() ? 'Current Plan' : 'Select Plan'}
              </Button>
            </ModernCard>
          ))}
        </div>
      </div>
    </div>
  );
}

