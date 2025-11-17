'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import ARAgingWidget from './widgets/ARAgingWidget';
import CashFlowWidget from './widgets/CashFlowWidget';
import QuickStatsWidget from './widgets/QuickStatsWidget';

export type WidgetType = 'revenue' | 'ar-aging' | 'cash-flow' | 'quick-stats';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  dateRange?: { start: string; end: string };
}

interface WidgetManagerProps {
  userId?: string;
}

const AVAILABLE_WIDGETS: { type: WidgetType; name: string; description: string }[] = [
  { type: 'revenue', name: 'Revenue Overview', description: 'Revenue, expenses, and profit' },
  { type: 'ar-aging', name: 'AR Aging', description: 'Accounts receivable aging report' },
  { type: 'cash-flow', name: 'Cash Flow', description: 'Operating, investing, and financing' },
  { type: 'quick-stats', name: 'Quick Stats', description: 'Invoices, payments, expenses, customers' },
];

export default function WidgetManager({ userId }: WidgetManagerProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    // Load saved widgets from localStorage
    const saved = localStorage.getItem(`dashboard-widgets-${userId || 'default'}`);
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load widgets:', e);
      }
    } else {
      // Default widgets
      setWidgets([
        { id: '1', type: 'quick-stats' },
        { id: '2', type: 'revenue' },
        { id: '3', type: 'ar-aging' },
      ]);
    }
  }, [userId]);

  useEffect(() => {
    // Save widgets to localStorage
    if (widgets.length > 0) {
      localStorage.setItem(`dashboard-widgets-${userId || 'default'}`, JSON.stringify(widgets));
    }
  }, [widgets, userId]);

  const addWidget = (type: WidgetType) => {
    const newId = Date.now().toString();
    setWidgets([...widgets, { id: newId, type }]);
    setShowAddMenu(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const renderWidget = (config: WidgetConfig) => {
    switch (config.type) {
      case 'revenue':
        return (
          <RevenueChartWidget
            key={config.id}
            id={config.id}
            onRemove={removeWidget}
            dateRange={config.dateRange}
          />
        );
      case 'ar-aging':
        return (
          <ARAgingWidget
            key={config.id}
            id={config.id}
            onRemove={removeWidget}
          />
        );
      case 'cash-flow':
        return (
          <CashFlowWidget
            key={config.id}
            id={config.id}
            onRemove={removeWidget}
            dateRange={config.dateRange}
          />
        );
      case 'quick-stats':
        return (
          <QuickStatsWidget
            key={config.id}
            id={config.id}
            onRemove={removeWidget}
          />
        );
      default:
        return null;
    }
  };

  const availableWidgets = AVAILABLE_WIDGETS.filter(
    w => !widgets.some(existing => existing.type === w.type)
  );

  return (
    <div className="space-y-6">
      {/* Add Widget Button */}
      {availableWidgets.length > 0 && (
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
          
          {showAddMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                {availableWidgets.map(widget => (
                  <button
                    key={widget.type}
                    onClick={() => addWidget(widget.type)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {widget.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {widget.description}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No widgets added yet</p>
          <Button onClick={() => setShowAddMenu(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Widget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map(config => renderWidget(config))}
        </div>
      )}
    </div>
  );
}

