'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ModernCard, StatCard } from '@/components/ui/modern-card';
import Header from '@/components/Header';
import {
  Building2,
  Users,
  Globe,
  DollarSign,
  Package,
  Workflow,
  FileText,
  Users2,
  Database,
  Palette,
  Shield,
  Settings2,
  CheckCircle,
  ArrowRight,
  Lock,
  Plug,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { user, tenant } = useAuth();

  const settingsCategories = [
    {
      id: 'organization',
      name: 'Organization',
      icon: Building2,
      description: 'Company and user details',
      color: 'from-blue-500 to-cyan-500',
      items: [
        { name: 'Company Details', path: '/settings/organization/company-details' },
        { name: 'User Details', path: '/settings/organization/user-details' }
      ]
    },
    {
      id: 'localization',
      name: 'Localization & Finance',
      icon: Globe,
      description: 'Tax, payments, and regional settings',
      color: 'from-green-500 to-emerald-500',
      items: [
        { name: 'Localization', path: '/settings/localization' },
        { name: 'Tax Settings', path: '/settings/tax' },
        { name: 'Payment Settings', path: '/settings/payments' },
        { name: 'Credit Cards & Banks', path: '/settings/banks' }
      ]
    },
    {
      id: 'products',
      name: 'Products, Tasks & Expenses',
      icon: Package,
      description: 'Product, task, and expense configuration',
      color: 'from-purple-500 to-pink-500',
      items: [
        { name: 'Product Settings', path: '/settings/products' },
        { name: 'Task Settings', path: '/settings/tasks' },
        { name: 'Expense Settings', path: '/settings/expenses' }
      ]
    },
    {
      id: 'workflows',
      name: 'Workflows & Automation',
      icon: Workflow,
      description: 'Automation and workflow settings',
      color: 'from-orange-500 to-red-500',
      items: [
        { name: 'Workflow Settings', path: '/settings/workflows' },
        { name: 'Schedules', path: '/settings/schedules' },
        { name: 'Payment Links', path: '/settings/payment-links' }
      ]
    },
    {
      id: 'documents',
      name: 'Documents & Invoicing',
      icon: FileText,
      description: 'Invoice design and document settings',
      color: 'from-indigo-500 to-purple-500',
      pro: true,
      items: [
        { name: 'Invoice Design', path: '/settings/invoice-design', pro: true },
        { name: 'Generated Numbers', path: '/settings/numbering', pro: true },
        { name: 'E-Invoicing', path: '/settings/e-invoicing', pro: true },
        { name: 'Templates & Reminders', path: '/settings/templates', pro: true }
      ]
    },
    {
      id: 'client',
      name: 'Client Experience',
      icon: Users2,
      description: 'Client portal and email settings',
      color: 'from-teal-500 to-cyan-500',
      items: [
        { name: 'Client Portal', path: '/settings/client-portal' },
        { name: 'Email Settings', path: '/settings/email' }
      ]
    },
    {
      id: 'data',
      name: 'Data & System',
      icon: Database,
      description: 'Backup, import, export, and logs',
      color: 'from-gray-500 to-slate-500',
      items: [
        { name: 'Backup | Restore', path: '/settings/backup' },
        { name: 'Import | Export', path: '/settings/import-export' },
        { name: 'System Logs', path: '/settings/logs' }
      ]
    },
    {
      id: 'customization',
      name: 'Customization',
      icon: Palette,
      description: 'Custom fields and groups',
      color: 'from-pink-500 to-rose-500',
      items: [
        { name: 'Custom Fields', path: '/settings/custom-fields' },
        { name: 'Group Settings', path: '/settings/groups' }
      ]
    },
    {
      id: 'security',
      name: 'Security & Accounts',
      icon: Shield,
      description: 'Account and user management',
      color: 'from-red-500 to-orange-500',
      items: [
        { name: 'Account Management', path: '/settings/account' },
        { name: 'User Management', path: '/settings/users' }
      ]
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: Plug,
      description: 'Connect with third-party services',
      color: 'from-indigo-500 to-purple-500',
      items: [
        { name: 'Integrations', path: '/settings/integrations' }
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced',
      icon: Settings2,
      description: 'Advanced settings and billing',
      color: 'from-slate-500 to-gray-500',
      items: [
        { name: 'Advanced Settings', path: '/settings/advanced' },
        { name: 'Pro (Plan / Billing)', path: '/settings/billing' }
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        onMenuClick={() => {}}
        title="Settings"
        subtitle="Manage your account, business settings, and preferences"
        showSearch={false}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Account Status"
            value="Active"
            change={`Plan: ${tenant?.plan || 'STARTER'}`}
            changeType="positive"
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20"
          />
          <StatCard
            title="Users"
            value="1"
            change="Active team members"
            changeType="neutral"
            icon={<Users className="w-6 h-6 text-blue-600" />}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20"
          />
          <StatCard
            title="Currency"
            value={tenant?.currency || 'JMD'}
            change="Default currency"
            changeType="neutral"
            icon={<DollarSign className="w-6 h-6 text-purple-600" />}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-900/20 dark:to-violet-900/20"
          />
          <StatCard
            title="Last Backup"
            value="Today"
            change="Data protected"
            changeType="positive"
            icon={<Database className="w-6 h-6 text-orange-600" />}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 dark:from-orange-900/20 dark:to-amber-900/20"
          />
        </div>

        {/* Settings Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  if (category.items && category.items.length > 0) {
                    router.push(category.items[0].path);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${category.color} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {category.pro && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      Pro
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {category.description}
                </p>

                <div className="space-y-2">
                  {category.items?.slice(0, 3).map((item, index) => (
                    <Link
                      key={index}
                      href={item.path}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                      {(item as any).pro && (
                        <Lock className="w-3 h-3 text-gray-400 mr-2" />
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover/item:text-blue-600 transition-colors" />
                    </Link>
                  ))}
                  {category.items && category.items.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                      +{category.items.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
