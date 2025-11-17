'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft,
  Loader2,
  Save
} from 'lucide-react';
import { employeeAPI } from '@/lib/api';

export default function CreateEmployeePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfHire, setDateOfHire] = useState(new Date().toISOString().split('T')[0]);
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [baseSalary, setBaseSalary] = useState<number | ''>('');
  const [salaryFrequency, setSalaryFrequency] = useState('MONTHLY');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  const [overtimeRate, setOvertimeRate] = useState<number | ''>('');
  const [trn, setTrn] = useState('');
  const [nisNumber, setNisNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountType, setBankAccountType] = useState('CHECKING');
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [parish, setParish] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !dateOfHire) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await employeeAPI.createEmployee({
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        dateOfHire,
        employmentType,
        department: department || undefined,
        position: position || undefined,
        baseSalary: typeof baseSalary === 'number' ? baseSalary : parseFloat(baseSalary.toString()) || 0,
        salaryFrequency,
        hourlyRate: typeof hourlyRate === 'number' ? hourlyRate : parseFloat(hourlyRate.toString()) || undefined,
        overtimeRate: typeof overtimeRate === 'number' ? overtimeRate : parseFloat(overtimeRate.toString()) || 0,
        trn: trn || undefined,
        nisNumber: nisNumber || undefined,
        bankName: bankName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        bankAccountType,
        status,
        notes: notes || undefined,
        address: {
          street: street || undefined,
          city: city || undefined,
          parish: parish || undefined,
          country: 'Jamaica',
          postalCode: postalCode || undefined
        }
      });
      
      router.push('/employees');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

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
        title="Add Employee"
        subtitle="Add a new employee to the system"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => router.push('/employees')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <ModernCard title="Personal Information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </ModernCard>

            {/* Employment Details */}
            <ModernCard title="Employment Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfHire">Date of Hire *</Label>
                  <Input
                    id="dateOfHire"
                    type="date"
                    value={dateOfHire}
                    onChange={(e) => setDateOfHire(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <select
                    id="employmentType"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
              </div>
            </ModernCard>

            {/* Payroll Details */}
            <ModernCard title="Payroll Details">
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
                  <Label htmlFor="salaryFrequency">Salary Frequency</Label>
                  <select
                    id="salaryFrequency"
                    value={salaryFrequency}
                    onChange={(e) => setSalaryFrequency(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Biweekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || '')}
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
              </div>
            </ModernCard>

            {/* Tax Information */}
            <ModernCard title="Tax Information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
                  <Input
                    id="trn"
                    type="text"
                    value={trn}
                    onChange={(e) => setTrn(e.target.value.toUpperCase())}
                    className="mt-2"
                    placeholder="TRN"
                  />
                </div>

                <div>
                  <Label htmlFor="nisNumber">NIS Number</Label>
                  <Input
                    id="nisNumber"
                    type="text"
                    value={nisNumber}
                    onChange={(e) => setNisNumber(e.target.value.toUpperCase())}
                    className="mt-2"
                    placeholder="NIS Number"
                  />
                </div>
              </div>
            </ModernCard>

            {/* Banking Information */}
            <ModernCard title="Banking Information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccountType">Account Type</Label>
                  <select
                    id="bankAccountType"
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                  </select>
                </div>
              </div>
            </ModernCard>

            {/* Address */}
            <ModernCard title="Address">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="parish">Parish</Label>
                  <Input
                    id="parish"
                    type="text"
                    value={parish}
                    onChange={(e) => setParish(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </ModernCard>

            {/* Notes */}
            <ModernCard title="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </ModernCard>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/employees')}
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
                    Create Employee
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

