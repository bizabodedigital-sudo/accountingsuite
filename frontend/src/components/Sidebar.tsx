'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Users,
  UserCircle,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  TrendingUp,
  DollarSign,
  Package,
  Banknote,
  Calculator,
  Database,
  FolderOpen,
  Coins,
  Warehouse,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  if (!user) return null;

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, badge: null },
    { name: 'Invoices', href: '/invoices', icon: FileText, badge: '3' },
    { name: 'Quotes', href: '/quotes', icon: FileText, badge: null },
    { name: 'Payments', href: '/payments', icon: DollarSign, badge: null },
    { name: 'Payroll', href: '/payroll', icon: Users, badge: null },
    { name: 'Employees', href: '/employees', icon: UserCircle, badge: null },
    { name: 'Products', href: '/products', icon: Package, badge: '10' },
    { name: 'Customers', href: '/customers', icon: Users, badge: '3' },
    { name: 'Expenses', href: '/expenses', icon: Receipt, badge: '4' },
    { name: 'Inventory', href: '/inventory', icon: Warehouse, badge: null },
    { name: 'Documents', href: '/documents', icon: FolderOpen, badge: null },
    { name: 'Tax Calculator', href: '/tax', icon: Calculator, badge: null },
    { name: 'Currencies', href: '/currencies', icon: Coins, badge: null },
    { name: 'Reconciliation', href: '/reconciliation', icon: Banknote, badge: '2' },
        { name: 'Reports', href: '/reports', icon: BarChart3, badge: null },
        { name: 'Fixed Assets', href: '/fixed-assets', icon: Building2, badge: null },
        { name: 'Backup', href: '/backup', icon: Database, badge: null },
        { name: 'Settings', href: '/settings', icon: Settings, badge: null },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 flex flex-col
        ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-12' : 'translate-x-0 w-64'}
        lg:static lg:h-full lg:translate-x-0
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">B</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Bizabode
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{tenant?.name}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-200 dark:border-blue-800">
              <div className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{user.firstName} {user.lastName}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Button
                key={item.name}
                asChild
                variant={active ? "default" : "ghost"}
                  className={`
                  w-full justify-start h-10 px-3 transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                  }
                  ${isCollapsed ? 'px-2' : ''}
                `}
              >
                <Link href={item.href}>
                  <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-sm">{item.name}</span>
                      {item.badge && (
                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-800 dark:text-green-300">Revenue</span>
                </div>
                <span className="text-xs font-bold text-green-900 dark:text-green-200">J$258,750</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Profit</span>
                </div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">J$30,250</span>
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle & Logout */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 h-10"
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} />
            ) : (
              <Moon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} />
            )}
            {!isCollapsed && <span className="text-sm">{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>
          
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 h-10"
          >
            <LogOut className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );
}
