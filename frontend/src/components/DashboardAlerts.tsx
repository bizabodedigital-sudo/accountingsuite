'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Bell, DollarSign, Package, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AlertItem {
  type: 'GCT_DUE' | 'LOW_STOCK' | 'PAYROLL_UPCOMING' | 'OVERDUE_INVOICE' | 'LOW_CASH';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  actionUrl?: string;
  actionLabel?: string;
}

interface DashboardAlertsProps {
  alerts: AlertItem[];
}

export default function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  const router = useRouter();

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No alerts at this time. Everything looks good!
          </p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'GCT_DUE':
        return <DollarSign className="w-4 h-4" />;
      case 'LOW_STOCK':
        return <Package className="w-4 h-4" />;
      case 'PAYROLL_UPCOMING':
        return <Calendar className="w-4 h-4" />;
      case 'OVERDUE_INVOICE':
        return <AlertCircle className="w-4 h-4" />;
      case 'LOW_CASH':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={getVariant(alert.severity)}>
              <div className="flex items-start gap-3">
                {getIcon(alert.type)}
                <div className="flex-1">
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription className="mt-1">
                    {alert.message}
                  </AlertDescription>
                  {alert.actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => router.push(alert.actionUrl!)}
                    >
                      {alert.actionLabel || 'View'}
                    </Button>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}





