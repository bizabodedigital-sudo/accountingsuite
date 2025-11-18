'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  DollarSign, 
  ArrowLeft,
  Loader2,
  Calculator,
  Save
} from 'lucide-react';
import { payrollAPI, employeeAPI } from '@/lib/api';

function CreatePayrollPageContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseSalary, setBaseSalary] = useState<number | ''>('');
  const [overtimeHours, setOvertimeHours] = useState<number | ''>('');
  const [overtimeRate, setOvertimeRate] = useState<number | ''>('');
  const [bonuses, setBonuses] = useState<number | ''>('');
  const [allowances, setAllowances] = useState<number | ''>('');
  const [nis, setNis] = useState<number | ''>('');
  const [nht, setNht] = useState<number | ''>('');
  const [educationTax, setEducationTax] = useState<number | ''>('');
  const [incomeTax, setIncomeTax] = useState<number | ''>('');
  const [pension, setPension] = useState<number | ''>('');
  const [healthInsurance, setHealthInsurance] = useState<number | ''>('');
  const [otherDeductions, setOtherDeductions] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEmployees();
      // Pre-select employee if provided in query params
      const employeeIdParam = searchParams.get('employeeId');
      if (employeeIdParam) {
        setEmployeeId(employeeIdParam);
      }
    }
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeDetails();
    }
  }, [employeeId]);

  const loadEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees({ status: 'ACTIVE' });
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadEmployeeDetails = async () => {
    try {
      const response = await employeeAPI.getEmployee(employeeId);
      const emp = response.data.data;
      setSelectedEmployee(emp);
      if (!baseSalary) {
        setBaseSalary(emp.baseSalary || '');
      }
      if (!overtimeRate) {
        setOvertimeRate(emp.overtimeRate || '');
      }
    } catch (error) {
      console.error('Failed to load employee:', error);
    }
  };

  const calculateTotals = () => {
    const base = typeof baseSalary === 'number' ? baseSalary : parseFloat(baseSalary.toString()) || 0;
    const otHours = typeof overtimeHours === 'number' ? overtimeHours : parseFloat(overtimeHours.toString()) || 0;
    const otRate = typeof overtimeRate === 'number' ? overtimeRate : parseFloat(overtimeRate.toString()) || 0;
    const bonus = typeof bonuses === 'number' ? bonuses : parseFloat(bonuses.toString()) || 0;
    const allowance = typeof allowances === 'number' ? allowances : parseFloat(allowances.toString()) || 0;
    
    const overtimeAmount = otHours * otRate;
    const grossPay = base + overtimeAmount + bonus + allowance;
    
    const nisAmount = typeof nis === 'number' ? nis : parseFloat(nis.toString()) || 0;
    const nhtAmount = typeof nht === 'number' ? nht : parseFloat(nht.toString()) || 0;
    const edTax = typeof educationTax === 'number' ? educationTax : parseFloat(educationTax.toString()) || 0;
    const incTax = typeof incomeTax === 'number' ? incomeTax : parseFloat(incomeTax.toString()) || 0;
    const pen = typeof pension === 'number' ? pension : parseFloat(pension.toString()) || 0;
    const health = typeof healthInsurance === 'number' ? healthInsurance : parseFloat(healthInsurance.toString()) || 0;
    const other = typeof otherDeductions === 'number' ? otherDeductions : parseFloat(otherDeductions.toString()) || 0;
    
    const totalDeductions = nisAmount + nhtAmount + edTax + incTax + pen + health + other;
    const netPay = grossPay - totalDeductions;
    
    return { grossPay, overtimeAmount, totalDeductions, netPay };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !payPeriodStart || !payPeriodEnd || !payDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await payrollAPI.createPayroll({
        employeeId,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        baseSalary: typeof baseSalary === 'number' ? baseSalary : parseFloat(baseSalary.toString()) || 0,
        overtimeHours: typeof overtimeHours === 'number' ? overtimeHours : parseFloat(overtimeHours.toString()) || 0,
        overtimeRate: typeof overtimeRate === 'number' ? overtimeRate : parseFloat(overtimeRate.toString()) || 0,
        bonuses: typeof bonuses === 'number' ? bonuses : parseFloat(bonuses.toString()) || 0,
        allowances: typeof allowances === 'number' ? allowances : parseFloat(allowances.toString()) || 0,
        nis: typeof nis === 'number' ? nis : parseFloat(nis.toString()) || 0,
        nht: typeof nht === 'number' ? nht : parseFloat(nht.toString()) || 0,
        educationTax: typeof educationTax === 'number' ? educationTax : parseFloat(educationTax.toString()) || 0,
        incomeTax: typeof incomeTax === 'number' ? incomeTax : parseFloat(incomeTax.toString()) || 0,
        pension: typeof pension === 'number' ? pension : parseFloat(pension.toString()) || 0,
        healthInsurance: typeof healthInsurance === 'number' ? healthInsurance : parseFloat(healthInsurance.toString()) || 0,
        otherDeductions: typeof otherDeductions === 'number' ? otherDeductions : parseFloat(otherDeductions.toString()) || 0,
        paymentMethod,
        notes
      });
      
      router.push('/payroll');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create payroll');
    } finally {
      setLoading(false);
    }
  };

  const { grossPay, overtimeAmount, totalDeductions, netPay } = calculateTotals();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Create Payroll"
        subtitle="Create a new payroll record"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => router.push('/payroll')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payroll
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee & Period */}
            <ModernCard title="Employee & Period">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee *</Label>
                  <select
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      setBaseSalary('');
                      setOvertimeRate('');
                    }}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} - {emp.employeeNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="payPeriodStart">Period Start *</Label>
                  <Input
                    id="payPeriodStart"
                    type="date"
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payPeriodEnd">Period End *</Label>
                  <Input
                    id="payPeriodEnd"
                    type="date"
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payDate">Pay Date *</Label>
                  <Input
                    id="payDate"
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
              </div>
            </ModernCard>

            {/* Earnings */}
            <ModernCard title="Earnings">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseSalary">Base Salary</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    step="0.01"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="overtimeHours">Overtime Hours</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    step="0.1"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="overtimeRate">Overtime Rate</Label>
                  <Input
                    id="overtimeRate"
                    type="number"
                    step="0.01"
                    value={overtimeRate}
                    onChange={(e) => setOvertimeRate(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bonuses">Bonuses</Label>
                  <Input
                    id="bonuses"
                    type="number"
                    step="0.01"
                    value={bonuses}
                    onChange={(e) => setBonuses(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="allowances">Allowances</Label>
                  <Input
                    id="allowances"
                    type="number"
                    step="0.01"
                    value={allowances}
                    onChange={(e) => setAllowances(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>
              </div>
            </ModernCard>

            {/* Deductions */}
            <ModernCard title="Deductions">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nis">NIS</Label>
                  <Input
                    id="nis"
                    type="number"
                    step="0.01"
                    value={nis}
                    onChange={(e) => setNis(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="nht">NHT</Label>
                  <Input
                    id="nht"
                    type="number"
                    step="0.01"
                    value={nht}
                    onChange={(e) => setNht(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="educationTax">Education Tax</Label>
                  <Input
                    id="educationTax"
                    type="number"
                    step="0.01"
                    value={educationTax}
                    onChange={(e) => setEducationTax(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="incomeTax">Income Tax</Label>
                  <Input
                    id="incomeTax"
                    type="number"
                    step="0.01"
                    value={incomeTax}
                    onChange={(e) => setIncomeTax(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="pension">Pension</Label>
                  <Input
                    id="pension"
                    type="number"
                    step="0.01"
                    value={pension}
                    onChange={(e) => setPension(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="healthInsurance">Health Insurance</Label>
                  <Input
                    id="healthInsurance"
                    type="number"
                    step="0.01"
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="otherDeductions">Other Deductions</Label>
                  <Input
                    id="otherDeductions"
                    type="number"
                    step="0.01"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || '')}
                    className="mt-2"
                  />
                </div>
              </div>
            </ModernCard>

            {/* Summary */}
            <ModernCard title="Summary">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Base Salary:</span>
                  <span className="font-semibold">${(typeof baseSalary === 'number' ? baseSalary : parseFloat(baseSalary.toString()) || 0).toFixed(2)}</span>
                </div>
                {overtimeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Overtime ({typeof overtimeHours === 'number' ? overtimeHours : parseFloat(overtimeHours.toString()) || 0} hrs):</span>
                    <span className="font-semibold">${overtimeAmount.toFixed(2)}</span>
                  </div>
                )}
                {(typeof bonuses === 'number' ? bonuses : parseFloat(bonuses.toString()) || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bonuses:</span>
                    <span className="font-semibold">${(typeof bonuses === 'number' ? bonuses : parseFloat(bonuses.toString()) || 0).toFixed(2)}</span>
                  </div>
                )}
                {(typeof allowances === 'number' ? allowances : parseFloat(allowances.toString()) || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Allowances:</span>
                    <span className="font-semibold">${(typeof allowances === 'number' ? allowances : parseFloat(allowances.toString()) || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold">Gross Pay:</span>
                  <span className="font-bold text-lg">${grossPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-red-600 dark:text-red-400">Total Deductions:</span>
                  <span className="font-bold text-lg text-red-600 dark:text-red-400">${totalDeductions.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300 dark:border-gray-600">
                  <span className="font-bold text-lg">Net Pay:</span>
                  <span className="font-bold text-2xl text-green-600 dark:text-green-400">${netPay.toFixed(2)}</span>
                </div>
              </div>
            </ModernCard>

            {/* Payment Method & Notes */}
            <ModernCard title="Payment Details">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHECK">Check</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </ModernCard>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/payroll')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Payroll
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreatePayrollPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CreatePayrollPageContent />
    </Suspense>
  );
}

