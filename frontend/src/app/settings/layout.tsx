'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Globe,
  DollarSign,
  Calculator,
  Package,
  CheckSquare,
  Receipt,
  Workflow,
  FileText,
  Mail,
  Users2,
  Database,
  Download,
  Upload,
  FileCode,
  Settings2,
  Shield,
  Key,
  CreditCard,
  Calendar,
  Palette,
  Zap,
  Link2,
  FolderTree,
  Lock,
  Logs,
  BarChart3,
  Bell,
  Clock,
  RefreshCw,
  Plug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface SettingsSection {
  id: string;
  name: string;
  icon: any;
  subsections?: { id: string; name: string; path: string }[];
  path?: string;
  pro?: boolean;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'organization',
    name: 'Organization',
    icon: Building2,
    subsections: [
      { id: 'company-details', name: 'Company Details', path: '/settings/organization/company-details' },
      { id: 'user-details', name: 'User Details', path: '/settings/organization/user-details' }
    ]
  },
  {
    id: 'localization',
    name: 'Localization & Finance',
    icon: Globe,
    subsections: [
      { id: 'localization', name: 'Localization', path: '/settings/localization' },
      { id: 'tax-settings', name: 'Tax Settings', path: '/settings/tax' },
      { id: 'payment-settings', name: 'Payment Settings', path: '/settings/payments' },
      { id: 'credit-cards-banks', name: 'Credit Cards & Banks', path: '/settings/banks' }
    ]
  },
  {
    id: 'products',
    name: 'Products, Tasks & Expenses',
    icon: Package,
    subsections: [
      { id: 'product-settings', name: 'Product Settings', path: '/settings/products' },
      { id: 'task-settings', name: 'Task Settings', path: '/settings/tasks' },
      { id: 'expense-settings', name: 'Expense Settings', path: '/settings/expenses' }
    ]
  },
  {
    id: 'workflows',
    name: 'Workflows & Automation',
    icon: Workflow,
    subsections: [
      { id: 'workflow-settings', name: 'Workflow Settings', path: '/settings/workflows' },
      { id: 'schedules', name: 'Schedules', path: '/settings/schedules' },
      { id: 'payment-links', name: 'Payment Links', path: '/settings/payment-links' }
    ]
  },
  {
    id: 'documents',
    name: 'Documents & Invoicing',
    icon: FileText,
    pro: true,
    subsections: [
      { id: 'invoice-design', name: 'Invoice Design', path: '/settings/invoice-design' },
      { id: 'generated-numbers', name: 'Generated Numbers', path: '/settings/numbering' },
      { id: 'e-invoicing', name: 'E-Invoicing', path: '/settings/e-invoicing' },
      { id: 'templates-reminders', name: 'Templates & Reminders', path: '/settings/templates' }
    ]
  },
  {
    id: 'client-experience',
    name: 'Client Experience',
    icon: Users2,
    subsections: [
      { id: 'client-portal', name: 'Client Portal', path: '/settings/client-portal' },
      { id: 'email-settings', name: 'Email Settings', path: '/settings/email' }
    ]
  },
  {
    id: 'data-system',
    name: 'Data & System',
    icon: Database,
    subsections: [
      { id: 'backup-restore', name: 'Backup | Restore', path: '/settings/backup' },
      { id: 'import-export', name: 'Import | Export', path: '/settings/import-export' },
      { id: 'system-logs', name: 'System Logs', path: '/settings/logs' },
      { id: 'audit-logs', name: 'Audit Logs', path: '/settings/audit-logs' }
    ]
  },
  {
    id: 'accounting',
    name: 'Accounting',
    icon: Calculator,
    subsections: [
      { id: 'chart-of-accounts', name: 'Chart of Accounts', path: '/settings/chart-of-accounts' },
      { id: 'opening-balances', name: 'Opening Balances', path: '/settings/opening-balances' },
      { id: 'financial-periods', name: 'Financial Periods', path: '/settings/financial-periods' },
      { id: 'journal-entries', name: 'Journal Entries', path: '/settings/journal-entries' },
      { id: 'bank-rules', name: 'Bank Rules', path: '/settings/bank-rules' }
    ]
  },
  {
    id: 'customization',
    name: 'Customization',
    icon: Palette,
    subsections: [
      { id: 'custom-fields', name: 'Custom Fields', path: '/settings/custom-fields' },
      { id: 'group-settings', name: 'Group Settings', path: '/settings/groups' }
    ]
  },
  {
    id: 'security',
    name: 'Security & Accounts',
    icon: Shield,
    subsections: [
      { id: 'account-management', name: 'Account Management', path: '/settings/account' },
      { id: 'user-management', name: 'User Management', path: '/settings/users' }
    ]
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: Plug,
    subsections: [
      { id: 'integrations', name: 'Integrations', path: '/settings/integrations' }
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: Settings2,
    subsections: [
      { id: 'advanced-settings', name: 'Advanced Settings', path: '/settings/advanced' },
      { id: 'pro-billing', name: 'Pro (Plan / Billing)', path: '/settings/billing' }
    ]
  }
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('');

  const isActive = (path: string) => {
    if (!pathname) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  // Auto-expand section if a subsection is active
  useEffect(() => {
    let found = false;
    for (const section of settingsSections) {
      if (section.subsections?.some(sub => {
        if (!pathname) return false;
        return pathname === sub.path || pathname.startsWith(sub.path + '/');
      })) {
        setActiveSection(section.id);
        found = true;
        break; // Only expand the first matching section
      }
    }
    if (!found) {
      setActiveSection('');
    }
  }, [pathname]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex h-full overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Settings</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage your account</p>
          </div>

          <nav className="p-2 space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const hasActiveSubsection = section.subsections?.some(sub => isActive(sub.path));
              
              return (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (section.subsections && section.subsections.length > 0) {
                        setActiveSection(activeSection === section.id ? '' : section.id);
                        if (!hasActiveSubsection && section.subsections[0]) {
                          router.push(section.subsections[0].path);
                        }
                      } else if (section.path) {
                        router.push(section.path);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${hasActiveSubsection || isActive(section.path || '')
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{section.name}</span>
                    </div>
                    {section.pro && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                        Pro
                      </span>
                    )}
                  </button>

                  {/* Subsections */}
                  {section.subsections && activeSection === section.id && (
                    <div className="ml-6 space-y-1 mt-1">
                      {section.subsections.map((subsection) => (
                        <Link
                          key={subsection.id}
                          href={subsection.path}
                          className={`
                            block px-3 py-2 rounded-lg text-sm transition-colors
                            ${isActive(subsection.path)
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {subsection.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Auto-expand if subsection is active */}
                  {hasActiveSubsection && activeSection !== section.id && (
                    <div className="ml-6 space-y-1 mt-1">
                      {section.subsections?.map((subsection) => (
                        <Link
                          key={subsection.id}
                          href={subsection.path}
                          className={`
                            block px-3 py-2 rounded-lg text-sm transition-colors
                            ${isActive(subsection.path)
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {subsection.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

