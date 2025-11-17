'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { employeeAPI } from '@/lib/api';

export default function EmployeesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEmployees();
    }
  }, [isAuthenticated, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await employeeAPI.getEmployees(params);
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await employeeAPI.deleteEmployee(id);
      loadEmployees();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete employee');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Active' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: XCircle, label: 'Inactive' },
      TERMINATED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: 'Terminated' },
      ON_LEAVE: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: XCircle, label: 'On Leave' },
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredEmployees = employees.filter(employee => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        employee.firstName?.toLowerCase().includes(search) ||
        employee.lastName?.toLowerCase().includes(search) ||
        employee.employeeNumber?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
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
        title="Employees"
        subtitle="Manage employee information"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    loadEmployees();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
          <Button
            onClick={() => router.push('/employees/create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Employees List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No employees found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first employee</p>
            <Button
              onClick={() => router.push('/employees/create')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <ModernCard key={employee._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      {getStatusBadge(employee.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Employee #:</span> {employee.employeeNumber}
                      </div>
                      <div>
                        <span className="font-medium">Position:</span> {employee.position || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {employee.department || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Base Salary:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${employee.baseSalary?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {employee.email && (
                        <div>
                          <span className="font-medium">Email:</span> {employee.email}
                        </div>
                      )}
                      {employee.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {employee.phone}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Hire Date:</span>{' '}
                        {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {employee.employmentType?.replace('_', ' ') || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/employees/${employee._id}`)}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/employees/${employee._id}/edit`)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/payroll/create?employeeId=${employee._id}`)}
                      title="Create Payroll"
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                    {user?.role === 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(employee._id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

