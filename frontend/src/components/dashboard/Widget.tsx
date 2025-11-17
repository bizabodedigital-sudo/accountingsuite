'use client';

import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Settings2 } from 'lucide-react';
import { ReactNode } from 'react';

interface WidgetProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  className?: string;
  draggable?: boolean;
}

export default function Widget({ 
  id, 
  title, 
  icon, 
  children, 
  onRemove, 
  onSettings,
  className = '',
  draggable = false
}: WidgetProps) {
  return (
    <ModernCard className={`relative group ${className}`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {draggable && (
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          )}
          {icon && <div className="text-gray-600 dark:text-gray-400">{icon}</div>}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSettings(id)}
              className="h-6 w-6 p-0"
            >
              <Settings2 className="w-3 h-3" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Widget Content */}
      <div className="widget-content">
        {children}
      </div>
    </ModernCard>
  );
}

