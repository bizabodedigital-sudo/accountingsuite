'use client';

import { Lock, AlertTriangle } from 'lucide-react';
import { usePeriodLock } from '@/hooks/usePeriodLock';

interface PeriodLockWarningProps {
  date: Date | string | null;
  className?: string;
  showIcon?: boolean;
}

export default function PeriodLockWarning({ date, className = '', showIcon = true }: PeriodLockWarningProps) {
  const { isLocked, period, loading } = usePeriodLock(date);

  if (loading || !isLocked) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      {showIcon && <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-900 dark:text-red-100">
          Period Locked
        </p>
        <p className="text-xs text-red-700 dark:text-red-300">
          Period {period?.periodLabel} is locked and cannot be modified. Contact an owner to unlock.
        </p>
        {period?.lockedAt && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Locked on {new Date(period.lockedAt).toLocaleDateString()}
            {period.lockedBy && ` by ${period.lockedBy.firstName} ${period.lockedBy.lastName}`}
          </p>
        )}
      </div>
    </div>
  );
}

