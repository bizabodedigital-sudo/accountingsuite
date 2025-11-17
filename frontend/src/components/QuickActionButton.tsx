'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileText, 
  DollarSign, 
  Users, 
  UserCircle,
  Receipt,
  X,
  Loader2
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export default function QuickActionButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    // Define context-aware actions based on current route
    const contextActions: QuickAction[] = [];

    if (pathname?.startsWith('/invoices')) {
      contextActions.push({
        label: 'New Invoice',
        icon: FileText,
        action: () => router.push('/invoices/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/quotes')) {
      contextActions.push({
        label: 'New Quote',
        icon: FileText,
        action: () => router.push('/quotes/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/payments')) {
      contextActions.push({
        label: 'Record Payment',
        icon: DollarSign,
        action: () => router.push('/payments/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/employees')) {
      contextActions.push({
        label: 'Add Employee',
        icon: UserCircle,
        action: () => router.push('/employees/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/payroll')) {
      contextActions.push({
        label: 'Create Payroll',
        icon: Receipt,
        action: () => router.push('/payroll/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/expenses')) {
      contextActions.push({
        label: 'New Expense',
        icon: Receipt,
        action: () => router.push('/expenses/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/products')) {
      contextActions.push({
        label: 'New Product',
        icon: Plus,
        action: () => router.push('/products/create'),
        shortcut: 'N'
      });
    } else if (pathname?.startsWith('/customers')) {
      contextActions.push({
        label: 'New Customer',
        icon: Users,
        action: () => router.push('/customers/create'),
        shortcut: 'N'
      });
    }

    // Add global actions if on dashboard or main pages
    if (pathname === '/dashboard' || pathname === '/') {
      contextActions.push(
        {
          label: 'New Invoice',
          icon: FileText,
          action: () => router.push('/invoices/create'),
          shortcut: 'I'
        },
        {
          label: 'New Quote',
          icon: FileText,
          action: () => router.push('/quotes/create'),
          shortcut: 'Q'
        },
        {
          label: 'Record Payment',
          icon: DollarSign,
          action: () => router.push('/payments/create'),
          shortcut: 'P'
        },
        {
          label: 'New Expense',
          icon: Receipt,
          action: () => router.push('/expenses/create'),
          shortcut: 'E'
        }
      );
    }

    setActions(contextActions);
  }, [pathname, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + K to toggle menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
        return;
      }

      // If menu is open, handle shortcuts
      if (isOpen && actions.length > 0) {
        const action = actions.find(a => a.shortcut && a.shortcut.toLowerCase() === e.key.toLowerCase());
        if (action) {
          e.preventDefault();
          action.action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, actions]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.quick-action-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (actions.length === 0) {
    return null;
  }

  const primaryAction = actions[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 quick-action-menu">
      {/* Action Menu */}
      {isOpen && actions.length > 1 && (
        <div className="absolute bottom-16 right-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {actions.slice(1).map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="flex-1 text-gray-900 dark:text-gray-100">{action.label}</span>
                {action.shortcut && (
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                    {action.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Primary FAB Button */}
      <Button
        onClick={() => {
          if (actions.length === 1) {
            primaryAction.action();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 flex items-center justify-center"
        aria-label={primaryAction.label}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <primaryAction.icon className="w-6 h-6" />
        )}
      </Button>

      {/* Keyboard shortcut hint */}
      {!isOpen && (
        <div className="absolute bottom-20 right-0 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Press Ctrl+K for quick actions
        </div>
      )}
    </div>
  );
}
