'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, ArrowRightLeft, TrendingUp, DollarSign } from 'lucide-react';

export default function CurrenciesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [fromAmount, setFromAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('JMD');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCurrencies();
    }
  }, [isAuthenticated]);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const res = await fetch('/api/currencies');
      // const data = await res.json();
      
      // Mock data
      setCurrencies([
        { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', exchangeRate: 1, baseCurrency: true },
        { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0064 },
        { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0059 },
        { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.0050 }
      ]);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const res = await fetch('/api/currencies/convert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount: parseFloat(fromAmount), fromCode: fromCurrency, toCode: toCurrency })
      // });
      // const data = await res.json();
      
      // Mock conversion
      const fromCurr = currencies.find(c => c.code === fromCurrency);
      const toCurr = currencies.find(c => c.code === toCurrency);
      if (fromCurr && toCurr) {
        const baseAmount = parseFloat(fromAmount) / fromCurr.exchangeRate;
        const converted = baseAmount * toCurr.exchangeRate;
        setConvertedAmount(converted);
      }
    } catch (error) {
      console.error('Failed to convert currency:', error);
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
        title="Currency Management"
        subtitle="View exchange rates and convert between currencies"
      />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Currency Converter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard title="Currency Converter">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={convertCurrency} className="w-full" disabled={!fromAmount}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Convert
              </Button>

              {convertedAmount !== null && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Converted Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currencies.find(c => c.code === toCurrency)?.symbol}
                    {convertedAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Exchange Rates */}
          <ModernCard title="Exchange Rates">
            <div className="space-y-3">
              {currencies.map((curr) => (
                <div key={curr.code} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Coins className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{curr.code}</p>
                      <p className="text-sm text-gray-600">{curr.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {curr.exchangeRate.toFixed(4)}
                    </p>
                    {curr.baseCurrency && (
                      <p className="text-xs text-green-600">Base Currency</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}

