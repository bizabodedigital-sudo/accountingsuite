'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernCard } from '@/components/ui/modern-card';
import {
  Banknote,
  Users,
  Building2,
  Package,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { openingBalanceAPI, chartOfAccountAPI, customerAPI } from '@/lib/api';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

interface BankBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
}

interface CustomerBalance {
  customerId: string;
  customerName: string;
  balance: number;
}

interface SupplierBalance {
  vendorId: string;
  vendorName: string;
  balance: number;
}

interface InventoryBalance {
  productId: string;
  productName: string;
  quantity: number;
  value: number;
}

export default function OpeningBalancesWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Step 1: Bank Balances
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);

  // Step 2: Customer Balances (AR)
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerBalances, setCustomerBalances] = useState<CustomerBalance[]>([]);

  // Step 3: Supplier Balances (AP)
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierBalances, setSupplierBalances] = useState<SupplierBalance[]>([]);

  // Step 4: Inventory
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([]);

  // Step 5: Equity/Retained Earnings
  const [retainedEarnings, setRetainedEarnings] = useState(0);

  const steps: WizardStep[] = [
    {
      id: 'banks',
      title: 'Bank Balances',
      description: 'Enter opening balances for your bank accounts',
      icon: Banknote,
      color: 'text-green-600'
    },
    {
      id: 'customers',
      title: 'Customer Balances',
      description: 'Enter outstanding amounts customers owe you (Accounts Receivable)',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'suppliers',
      title: 'Supplier Balances',
      description: 'Enter amounts you owe to suppliers (Accounts Payable)',
      icon: Building2,
      color: 'text-orange-600'
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Enter opening inventory quantities and values',
      icon: Package,
      color: 'text-purple-600'
    },
    {
      id: 'equity',
      title: 'Equity & Retained Earnings',
      description: 'Enter opening retained earnings or equity balance',
      icon: TrendingUp,
      color: 'text-indigo-600'
    }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // Load bank accounts (Asset accounts with type BANK or CASH)
      const accountsRes = await chartOfAccountAPI.getAccounts({ 
        type: 'ASSET',
        isActive: true 
      });
      const allAccounts = accountsRes.data.data || [];
      const banks = allAccounts.filter((acc: any) => 
        acc.category === 'BANK' || acc.category === 'CASH' || 
        acc.name.toLowerCase().includes('bank') || 
        acc.name.toLowerCase().includes('cash')
      );
      setBankAccounts(banks);
      setBankBalances(banks.map((acc: any) => ({
        accountId: acc._id,
        accountCode: acc.code,
        accountName: acc.name,
        balance: 0
      })));

      // Load customers
      const customersRes = await customerAPI.getCustomers();
      const customersList = customersRes.data.data || [];
      setCustomers(customersList);
      setCustomerBalances(customersList.map((cust: any) => ({
        customerId: cust._id,
        customerName: cust.name,
        balance: 0
      })));

      // Suppliers are also customers (vendors)
      setSuppliers(customersList);
      setSupplierBalances(customersList.map((cust: any) => ({
        vendorId: cust._id,
        vendorName: cust.name,
        balance: 0
      })));

      // TODO: Load products for inventory step
      setProducts([]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get AR and AP account IDs
      const accountsRes = await chartOfAccountAPI.getAccounts({ isActive: true });
      const allAccounts = accountsRes.data.data || [];
      const arAccount = allAccounts.find((acc: any) => acc.code === '1030' || acc.name.includes('Receivable'));
      const apAccount = allAccounts.find((acc: any) => acc.code === '2010' || acc.name.includes('Payable'));
      const equityAccount = allAccounts.find((acc: any) => acc.code === '5010' || acc.name.includes('Equity'));

      // Save bank balances
      for (const bank of bankBalances) {
        if (bank.balance !== 0) {
          await openingBalanceAPI.createOpeningBalance({
            accountId: bank.accountId,
            balance: bank.balance,
            asOfDate,
            description: `Opening bank balance - ${bank.accountName}`
          });
        }
      }

      // Save customer balances (AR)
      if (arAccount) {
        for (const cust of customerBalances) {
          if (cust.balance !== 0) {
            await openingBalanceAPI.createOpeningBalance({
              accountId: arAccount._id,
              balance: cust.balance,
              asOfDate,
              customerId: cust.customerId,
              description: `Opening AR balance - ${cust.customerName}`
            });
          }
        }
      }

      // Save supplier balances (AP)
      if (apAccount) {
        for (const supp of supplierBalances) {
          if (supp.balance !== 0) {
            await openingBalanceAPI.createOpeningBalance({
              accountId: apAccount._id,
              balance: supp.balance,
              asOfDate,
              vendorId: supp.vendorId,
              description: `Opening AP balance - ${supp.vendorName}`
            });
          }
        }
      }

      // Save inventory balances
      // TODO: Implement when inventory accounts are set up

      // Save retained earnings
      if (equityAccount && retainedEarnings !== 0) {
        await openingBalanceAPI.createOpeningBalance({
          accountId: equityAccount._id,
          balance: retainedEarnings,
          asOfDate,
          description: 'Opening retained earnings'
        });
      }

      alert('Opening balances created successfully! You can now post them from the Opening Balances page.');
      onComplete();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save opening balances');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'banks':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter the opening balance for each bank account as of {asOfDate}
            </p>
            {bankBalances.map((bank, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{bank.accountCode} - {bank.accountName}</p>
                </div>
                <div className="w-48">
                  <Input
                    type="number"
                    step="0.01"
                    value={bank.balance || ''}
                    onChange={(e) => {
                      const newBalances = [...bankBalances];
                      newBalances[idx].balance = parseFloat(e.target.value) || 0;
                      setBankBalances(newBalances);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter amounts that customers owe you (Accounts Receivable)
            </p>
            {customerBalances.map((cust, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{cust.customerName}</p>
                </div>
                <div className="w-48">
                  <Input
                    type="number"
                    step="0.01"
                    value={cust.balance || ''}
                    onChange={(e) => {
                      const newBalances = [...customerBalances];
                      newBalances[idx].balance = parseFloat(e.target.value) || 0;
                      setCustomerBalances(newBalances);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'suppliers':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter amounts you owe to suppliers (Accounts Payable)
            </p>
            {supplierBalances.map((supp, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{supp.vendorName}</p>
                </div>
                <div className="w-48">
                  <Input
                    type="number"
                    step="0.01"
                    value={supp.balance || ''}
                    onChange={(e) => {
                      const newBalances = [...supplierBalances];
                      newBalances[idx].balance = parseFloat(e.target.value) || 0;
                      setSupplierBalances(newBalances);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter opening inventory quantities and values (optional - can be set up later)
            </p>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Inventory opening balances can be set up later from the Inventory module.
              </p>
            </div>
          </div>
        );

      case 'equity':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter your opening retained earnings or equity balance
            </p>
            <div className="p-4 border rounded-lg">
              <Label htmlFor="retainedEarnings">Retained Earnings / Opening Equity</Label>
              <Input
                id="retainedEarnings"
                type="number"
                step="0.01"
                value={retainedEarnings || ''}
                onChange={(e) => setRetainedEarnings(parseFloat(e.target.value) || 0)}
                className="mt-2"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  isActive 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : isCompleted
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <p className={`mt-2 text-xs text-center ${isActive ? 'font-semibold' : ''}`}>
                  {step.title}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-6 h-6 text-gray-400 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <ModernCard title={steps[currentStep].title} description={steps[currentStep].description}>
        <div className="mb-4">
          <Label htmlFor="asOfDate">As Of Date</Label>
          <Input
            id="asOfDate"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="mt-2"
          />
        </div>
        {renderStepContent()}
      </ModernCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save All Balances
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

