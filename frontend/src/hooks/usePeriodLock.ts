import { useState, useEffect } from 'react';
import { financialPeriodAPI } from '@/lib/api';

interface PeriodLockStatus {
  isLocked: boolean;
  period?: {
    year: number;
    month: number;
    periodLabel: string;
    lockedAt?: string;
    lockedBy?: any;
  };
  loading: boolean;
}

export function usePeriodLock(date: Date | string | null): PeriodLockStatus {
  const [status, setStatus] = useState<PeriodLockStatus>({
    isLocked: false,
    loading: true
  });

  useEffect(() => {
    if (!date) {
      setStatus({ isLocked: false, loading: false });
      return;
    }

    const checkPeriodLock = async () => {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;

        const response = await financialPeriodAPI.getFinancialPeriod(year, month);
        const period = response.data.data;

        if (period && period.isLocked) {
          setStatus({
            isLocked: true,
            period: {
              year: period.year,
              month: period.month,
              periodLabel: period.periodLabel || `${year}-${String(month).padStart(2, '0')}`,
              lockedAt: period.lockedAt,
              lockedBy: period.lockedBy
            },
            loading: false
          });
        } else {
          setStatus({
            isLocked: false,
            period: period ? {
              year: period.year,
              month: period.month,
              periodLabel: period.periodLabel || `${year}-${String(month).padStart(2, '0')}`
            } : undefined,
            loading: false
          });
        }
      } catch (error) {
        console.error('Failed to check period lock:', error);
        setStatus({ isLocked: false, loading: false });
      }
    };

    checkPeriodLock();
  }, [date]);

  return status;
}

