'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, DollarSign, FileText, CheckCircle } from 'lucide-react';

export default function TaxPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subtotal, setSubtotal] = useState('');
  const [taxType, setTaxType] = useState('STANDARD');
  const [taxResult, setTaxResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const calculateTax = async () => {
    if (!subtotal || parseFloat(subtotal) <= 0) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const res = await fetch('/api/tax/calculate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ subtotal: parseFloat(subtotal), taxType })
      // });
      // const data = await res.json();
      
      // Mock calculation
      const subtotalNum = parseFloat(subtotal);
      const taxRate = taxType === 'STANDARD' ? 15 : 0;
      const taxAmount = (subtotalNum * taxRate) / 100;
      const total = subtotalNum + taxAmount;

      setTaxResult({
        subtotal: subtotalNum,
        taxRate,
        taxAmount,
        total,
        taxType
      });
    } catch (error) {
      console.error('Failed to calculate tax:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        onMenuClick={() => {}}
        title="Tax Calculator"
        subtitle="Calculate GCT (General Consumption Tax) for Jamaican businesses"
      />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator */}
          <ModernCard title="GCT Calculator">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtotal (JMD)
                </label>
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type
                </label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="STANDARD">Standard (15% GCT)</option>
                  <option value="ZERO">Zero-Rated (0%)</option>
                  <option value="EXEMPT">Exempt</option>
                </select>
              </div>

              <Button onClick={calculateTax} className="w-full" disabled={loading || !subtotal}>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Tax
              </Button>
            </div>
          </ModernCard>

          {/* Results */}
          <ModernCard title="Calculation Result">
            {taxResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">J${taxResult.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">GCT ({taxResult.taxRate}%):</span>
                    <span className="font-bold">J${taxResult.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">J${taxResult.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Calculation complete</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Enter values and click Calculate Tax</p>
              </div>
            )}
          </ModernCard>
        </div>

        {/* Information */}
        <ModernCard title="GCT Information">
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Standard GCT Rate</p>
                <p className="text-gray-600">15% applies to most goods and services</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Registration Threshold</p>
                <p className="text-gray-600">Businesses with annual turnover of J$3,000,000 or more must register for GCT</p>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

