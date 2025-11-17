'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernCard } from '@/components/ui/modern-card';
import Header from '@/components/Header';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building,
  Star,
  TrendingUp,
  Users,
  CreditCard,
  Globe,
  Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { customerAPI } from '@/lib/api';
import CustomerModal from '@/components/CustomerModal';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'inactive';
  totalInvoices?: number;
  totalAmount?: number;
  lastInvoiceDate?: string;
}

export default function CustomersPage() {
  const { user, tenant } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading customers...');
      const response = await customerAPI.getCustomers();
      console.log('✅ Customers loaded:', response.data);
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('❌ Failed to load customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    try {
      console.log('➕ Adding new customer:', customerData);
      setError('');
      
      const response = await customerAPI.createCustomer({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        country: customerData.country || 'Jamaica',
        taxId: customerData.taxId,
        isActive: true
      });
      
      console.log('✅ Customer created:', response.data);
      
      // Reload customers to get updated list
      await loadCustomers();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('❌ Failed to create customer:', err);
      setError(err.response?.data?.error || 'Failed to create customer');
    }
  };

  const handleEditCustomer = async (customerData: Partial<Customer>) => {
    try {
      console.log('✏️ Editing customer:', customerData);
      setError('');
      
      if (!editingCustomer) {
        setError('No customer selected for editing');
        return;
      }
      
      const response = await customerAPI.updateCustomer(editingCustomer._id, {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        country: customerData.country,
        taxId: customerData.taxId,
        isActive: customerData.status === 'active'
      });
      
      console.log('✅ Customer updated:', response.data);
      
      // Reload customers to get updated list
      await loadCustomers();
      setEditingCustomer(null);
    } catch (err: any) {
      console.error('❌ Failed to update customer:', err);
      setError(err.response?.data?.error || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting customer:', customerId);
      setError('');
      
      await customerAPI.deleteCustomer(customerId);
      console.log('✅ Customer deleted');
      
      // Reload customers to get updated list
      await loadCustomers();
    } catch (err: any) {
      console.error('❌ Failed to delete customer:', err);
      setError(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalAmount || 0), 0),
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        onMenuClick={() => {}}
        title="Customer Management"
        subtitle="Build lasting relationships with your clients"
        showSearch={false}
        showActions={false}
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-800 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Total Customers</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-semibold text-sm uppercase tracking-wider">Active</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.active}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Inactive</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">{stats.inactive}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-semibold text-sm uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">J${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-lg border border-gray-200/40 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200/60 focus:border-purple-500 focus:ring-purple-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500/30 bg-white/70 backdrop-blur-sm font-semibold"
                >
                  <option value="all">All Customers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/40 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <ModernCard className="text-center py-16 bg-white/80 backdrop-blur-lg border border-gray-200/40 rounded-2xl shadow-xl">
            <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500 mb-8 text-lg">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Get started by adding your first customer to build your client base'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 font-semibold transform hover:scale-105"
              >
                <Plus className="mr-2 h-5 w-5" /> Add Your First Customer
              </Button>
            )}
          </ModernCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <ModernCard key={customer._id} className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-lg border border-gray-200/40 rounded-2xl shadow-xl overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{customer.email}</p>
                        <div className="flex items-center mt-1">
                          <div className={`h-2 w-2 rounded-full mr-2 ${customer.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {customer.status || 'active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-3 text-purple-500" />
                      <span className="font-medium">{customer.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-purple-500" />
                      <span className="font-medium">{customer.city}, {customer.country}</span>
                    </div>
                    {customer.taxId && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="h-4 w-4 mr-3 text-purple-500" />
                        <span className="font-medium">Tax ID: {customer.taxId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">
                      Added {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingCustomer(customer)}
                        className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer._id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={handleEditCustomer}
        />
      )}
    </div>
  );
}