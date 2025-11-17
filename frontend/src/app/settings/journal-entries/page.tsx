'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  RotateCcw,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { journalEntryAPI, chartOfAccountAPI, financialPeriodAPI } from '@/lib/api';
import PeriodLockWarning from '@/components/PeriodLockWarning';

interface JournalEntryLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntry {
  _id: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  entryType: string;
  totalDebits: number;
  totalCredits: number;
  isReversed: boolean;
  reversedBy?: string;
  status: string;
}

export default function JournalEntriesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Create form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([
    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEntries();
      loadAccounts();
    }
  }, [isAuthenticated, dateFilter]);

  const loadAccounts = async () => {
    try {
      const response = await chartOfAccountAPI.getAccounts({ isActive: true });
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (dateFilter.start) params.startDate = dateFilter.start;
      if (dateFilter.end) params.endDate = dateFilter.end;
      const response = await journalEntryAPI.getJournalEntries(params);
      setEntries(response.data.data || []);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntryLine = () => {
    setEntryLines([...entryLines, { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeEntryLine = (index: number) => {
    if (entryLines.length > 2) {
      setEntryLines(entryLines.filter((_, i) => i !== index));
    }
  };

  const updateEntryLine = (index: number, field: string, value: any) => {
    const updated = [...entryLines];
    if (field === 'accountId') {
      const account = accounts.find(a => a._id === value);
      if (account) {
        updated[index].accountId = account._id;
        updated[index].accountCode = account.code;
        updated[index].accountName = account.name;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setEntryLines(updated);
  };

  const calculateTotals = () => {
    const totalDebits = entryLines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0);
    const totalCredits = entryLines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0);
    return { totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 };
  };

  const handleCreateEntry = async () => {
    const { totalDebits, totalCredits, isBalanced } = calculateTotals();
    
    if (!isBalanced) {
      alert(`Journal entry is not balanced! Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`);
      return;
    }

    if (entryLines.some(line => !line.accountId)) {
      alert('Please select an account for all lines');
      return;
    }

    // Check period lock before creating
    if (entryDate) {
      try {
        const dateObj = new Date(entryDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const periodRes = await financialPeriodAPI.getFinancialPeriod(year, month);
        const period = periodRes.data.data;
        
        if (period && period.isLocked && user?.role !== 'OWNER') {
          alert(`Cannot create journal entry: Period ${period.periodLabel || `${year}-${String(month).padStart(2, '0')}`} is locked. Contact an owner to unlock.`);
          return;
        }
      } catch (error) {
        // If period check fails, allow creation (backend will enforce)
        console.warn('Period check failed:', error);
      }
    }

    try {
      await journalEntryAPI.createJournalEntry({
        entryDate,
        description,
        entries: entryLines.map(line => ({
          accountId: line.accountId,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: parseFloat(line.debit.toString()) || 0,
          credit: parseFloat(line.credit.toString()) || 0,
          description: line.description
        })),
        entryType: 'MANUAL'
      });
      
      setShowCreateModal(false);
      setEntryLines([
        { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
        { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
      ]);
      setDescription('');
      loadEntries();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create journal entry');
    }
  };

  const { totalDebits, totalCredits, isBalanced } = calculateTotals();

  const filteredEntries = entries.filter(entry =>
    !searchTerm ||
    entry.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading journal entries...</p>
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
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        title="Journal Entries"
        subtitle="Manage double-entry journal entries"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              placeholder="Start Date"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              placeholder="End Date"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No journal entries found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first journal entry to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Entry
            </Button>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <ModernCard key={entry._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {entry.entryNumber || 'JE-001'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.isReversed 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {entry.isReversed ? 'Reversed' : entry.status || 'Posted'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {entry.entryType}
                      </div>
                      <div>
                        <span className="font-medium">Debits:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${entry.totalDebits?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Credits:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${entry.totalCredits?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {entry.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/settings/journal-entries/${entry._id}`)}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!entry.isReversed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Reverse this journal entry?')) {
                            try {
                              await journalEntryAPI.reverseJournalEntry(entry._id);
                              loadEntries();
                            } catch (error) {
                              console.error('Failed to reverse entry:', error);
                              alert('Failed to reverse journal entry');
                            }
                          }
                        }}
                        title="Reverse"
                      >
                        <RotateCcw className="w-4 h-4 text-orange-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Journal Entry</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entry Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <PeriodLockWarning date={entryDate} className="mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Journal entry description"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Entry Lines</label>
                <Button variant="outline" size="sm" onClick={addEntryLine}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Line
                </Button>
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium">Account</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-medium">Debit</th>
                      <th className="px-3 py-2 text-right text-xs font-medium">Credit</th>
                      <th className="px-3 py-2 text-center text-xs font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryLines.map((line, index) => (
                      <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="px-3 py-2">
                          <select
                            value={line.accountId}
                            onChange={(e) => updateEntryLine(index, 'accountId', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                          >
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                              <option key={acc._id} value={acc._id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateEntryLine(index, 'description', e.target.value)}
                            placeholder="Line description"
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.debit || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEntryLine(index, 'debit', val);
                              updateEntryLine(index, 'credit', 0);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.credit || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEntryLine(index, 'credit', val);
                              updateEntryLine(index, 'debit', 0);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {entryLines.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEntryLine(index)}
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700 font-semibold">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right">Totals:</td>
                      <td className="px-3 py-2 text-right">
                        ${totalDebits.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${totalCredits.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isBalanced ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!isBalanced && (
                <p className="mt-2 text-sm text-red-600">
                  Entry is not balanced! Difference: ${Math.abs(totalDebits - totalCredits).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEntryLines([
                    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
                    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
                  ]);
                  setDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEntry}
                disabled={!isBalanced}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Create Entry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

