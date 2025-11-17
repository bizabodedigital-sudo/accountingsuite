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
  Filter, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { bankRuleAPI, chartOfAccountAPI } from '@/lib/api';

export default function BankRulesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionContains, setDescriptionContains] = useState('');
  const [descriptionRegex, setDescriptionRegex] = useState('');
  const [amountMin, setAmountMin] = useState<number | ''>('');
  const [amountMax, setAmountMax] = useState<number | ''>('');
  const [transactionType, setTransactionType] = useState('BOTH');
  const [merchantContains, setMerchantContains] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [descriptionOverride, setDescriptionOverride] = useState('');
  const [priority, setPriority] = useState<number | ''>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRules();
      loadAccounts();
    }
  }, [isAuthenticated]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await bankRuleAPI.getBankRules();
      setRules(response.data.data || []);
    } catch (error) {
      console.error('Failed to load bank rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await chartOfAccountAPI.getAccounts({ isActive: true });
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleCreate = async () => {
    if (!name) {
      alert('Please enter a rule name');
      return;
    }

    try {
      await bankRuleAPI.createBankRule({
        name,
        description: description || undefined,
        conditions: {
          descriptionContains: descriptionContains || undefined,
          descriptionRegex: descriptionRegex || undefined,
          amountMin: typeof amountMin === 'number' ? amountMin : undefined,
          amountMax: typeof amountMax === 'number' ? amountMax : undefined,
          transactionType,
          merchantContains: merchantContains || undefined
        },
        actions: {
          accountId: accountId || undefined,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
          setDescription: descriptionOverride || undefined
        },
        priority: typeof priority === 'number' ? priority : 0,
        isActive
      });
      
      resetForm();
      setShowCreateModal(false);
      loadRules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create bank rule');
    }
  };

  const handleUpdate = async () => {
    if (!selectedRule || !name) {
      alert('Please enter a rule name');
      return;
    }

    try {
      await bankRuleAPI.updateBankRule(selectedRule._id, {
        name,
        description: description || undefined,
        conditions: {
          descriptionContains: descriptionContains || undefined,
          descriptionRegex: descriptionRegex || undefined,
          amountMin: typeof amountMin === 'number' ? amountMin : undefined,
          amountMax: typeof amountMax === 'number' ? amountMax : undefined,
          transactionType,
          merchantContains: merchantContains || undefined
        },
        actions: {
          accountId: accountId || undefined,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
          setDescription: descriptionOverride || undefined
        },
        priority: typeof priority === 'number' ? priority : 0,
        isActive
      });
      
      resetForm();
      setShowEditModal(false);
      setSelectedRule(null);
      loadRules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update bank rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await bankRuleAPI.deleteBankRule(id);
      loadRules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete bank rule');
    }
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setName(rule.name);
    setDescription(rule.description || '');
    setDescriptionContains(rule.conditions?.descriptionContains || '');
    setDescriptionRegex(rule.conditions?.descriptionRegex || '');
    setAmountMin(rule.conditions?.amountMin || '');
    setAmountMax(rule.conditions?.amountMax || '');
    setTransactionType(rule.conditions?.transactionType || 'BOTH');
    setMerchantContains(rule.conditions?.merchantContains || '');
    setAccountId(rule.actions?.accountId?._id || rule.actions?.accountId || '');
    setCategory(rule.actions?.category || '');
    setTags(rule.actions?.tags?.join(', ') || '');
    setDescriptionOverride(rule.actions?.setDescription || '');
    setPriority(rule.priority || 0);
    setIsActive(rule.isActive !== false);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setDescriptionContains('');
    setDescriptionRegex('');
    setAmountMin('');
    setAmountMax('');
    setTransactionType('BOTH');
    setMerchantContains('');
    setAccountId('');
    setCategory('');
    setTags('');
    setDescriptionOverride('');
    setPriority(0);
    setIsActive(true);
  };

  const filteredRules = rules.filter(rule => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        rule.name?.toLowerCase().includes(search) ||
        rule.description?.toLowerCase().includes(search) ||
        rule.conditions?.descriptionContains?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bank rules...</p>
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
        title="Bank Rules"
        subtitle="Automatically categorize bank transactions"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-2 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>

          {/* Rules List */}
          {filteredRules.length === 0 ? (
            <ModernCard className="p-12 text-center">
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No bank rules found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create rules to automatically categorize transactions</p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            </ModernCard>
          ) : (
            <div className="grid gap-4">
              {filteredRules.map((rule) => (
                <ModernCard key={rule._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {rule.name}
                        </h3>
                        {rule.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Priority: {rule.priority}
                        </span>
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {rule.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {rule.conditions?.descriptionContains && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Contains:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">"{rule.conditions.descriptionContains}"</span>
                          </div>
                        )}
                        {rule.actions?.accountId && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Account:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">
                              {typeof rule.actions.accountId === 'object' 
                                ? `${rule.actions.accountId.code} - ${rule.actions.accountId.name}`
                                : 'N/A'}
                            </span>
                          </div>
                        )}
                        {rule.actions?.category && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Category:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">{rule.actions.category}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Matches:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">{rule.matchCount || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule._id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ModernCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Bank Rule</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                  placeholder="e.g., Starbucks purchases"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                  placeholder="Optional description"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Conditions (Match When)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="descriptionContains">Description Contains</Label>
                    <Input
                      id="descriptionContains"
                      value={descriptionContains}
                      onChange={(e) => setDescriptionContains(e.target.value)}
                      className="mt-2"
                      placeholder="e.g., Starbucks"
                    />
                  </div>

                  <div>
                    <Label htmlFor="merchantContains">Merchant Contains</Label>
                    <Input
                      id="merchantContains"
                      value={merchantContains}
                      onChange={(e) => setMerchantContains(e.target.value)}
                      className="mt-2"
                      placeholder="e.g., AMAZON"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amountMin">Min Amount</Label>
                    <Input
                      id="amountMin"
                      type="number"
                      step="0.01"
                      value={amountMin}
                      onChange={(e) => setAmountMin(parseFloat(e.target.value) || '')}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amountMax">Max Amount</Label>
                    <Input
                      id="amountMax"
                      type="number"
                      step="0.01"
                      value={amountMax}
                      onChange={(e) => setAmountMax(parseFloat(e.target.value) || '')}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transactionType">Transaction Type</Label>
                    <select
                      id="transactionType"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="BOTH">Both</option>
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Actions (Apply When Matched)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountId">Assign to Account</Label>
                    <select
                      id="accountId"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select account</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2"
                      placeholder="e.g., Meals & Entertainment"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="mt-2"
                      placeholder="e.g., coffee, meals"
                    />
                  </div>

                  <div>
                    <Label htmlFor="descriptionOverride">Set Description</Label>
                    <Input
                      id="descriptionOverride"
                      value={descriptionOverride}
                      onChange={(e) => setDescriptionOverride(e.target.value)}
                      className="mt-2"
                      placeholder="Override description"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Create Rule
                </Button>
              </div>
            </div>
          </ModernCard>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ModernCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Bank Rule</h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowEditModal(false);
                setSelectedRule(null);
                resetForm();
              }}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Rule Name *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Conditions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-descriptionContains">Description Contains</Label>
                    <Input
                      id="edit-descriptionContains"
                      value={descriptionContains}
                      onChange={(e) => setDescriptionContains(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-merchantContains">Merchant Contains</Label>
                    <Input
                      id="edit-merchantContains"
                      value={merchantContains}
                      onChange={(e) => setMerchantContains(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-amountMin">Min Amount</Label>
                    <Input
                      id="edit-amountMin"
                      type="number"
                      step="0.01"
                      value={amountMin}
                      onChange={(e) => setAmountMin(parseFloat(e.target.value) || '')}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-amountMax">Max Amount</Label>
                    <Input
                      id="edit-amountMax"
                      type="number"
                      step="0.01"
                      value={amountMax}
                      onChange={(e) => setAmountMax(parseFloat(e.target.value) || '')}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-transactionType">Transaction Type</Label>
                    <select
                      id="edit-transactionType"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="BOTH">Both</option>
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Input
                      id="edit-priority"
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-accountId">Assign to Account</Label>
                    <select
                      id="edit-accountId"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select account</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-tags">Tags</Label>
                    <Input
                      id="edit-tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-descriptionOverride">Set Description</Label>
                    <Input
                      id="edit-descriptionOverride"
                      value={descriptionOverride}
                      onChange={(e) => setDescriptionOverride(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="edit-isActive" className="cursor-pointer">Active</Label>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowEditModal(false);
                  setSelectedRule(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Update Rule
                </Button>
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  );
}

