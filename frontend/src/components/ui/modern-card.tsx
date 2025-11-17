import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export function ModernCard({ 
  title, 
  description, 
  children, 
  className,
  variant = 'default',
  size = 'md'
}: ModernCardProps) {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg',
    outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-700 shadow-none',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 shadow-xl'
  };

  const sizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg',
      variants[variant],
      sizes[size],
      className
    )}>
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && (
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        title || description ? 'pt-0' : '',
        'space-y-4'
      )}>
        {children}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  trend,
  className 
}: StatCardProps) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    negative: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    neutral: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <ModernCard 
      variant="gradient" 
      className={cn('relative overflow-hidden', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change && (
            <div className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2',
              changeColors[changeType]
            )}>
              {trend && <span className="mr-1">{trendIcons[trend]}</span>}
              {change}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </ModernCard>
  );
}

interface ActivityCardProps {
  title: string;
  activities: Array<{
    id: string;
    type: 'invoice' | 'customer' | 'expense' | 'payment';
    title: string;
    description: string;
    amount?: string;
    time: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
  className?: string;
}

export function ActivityCard({ title, activities, className }: ActivityCardProps) {
  const statusColors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
  };

  const typeIcons = {
    invoice: '📄',
    customer: '👤',
    expense: '💰',
    payment: '✅'
  };

  return (
    <ModernCard title={title} className={className}>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className={cn(
              'flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md',
              statusColors[activity.status]
            )}
          >
            <div className="text-2xl">{typeIcons[activity.type]}</div>
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm opacity-75">{activity.description}</p>
              <p className="text-xs opacity-60 mt-1">{activity.time}</p>
            </div>
            {activity.amount && (
              <div className="text-right">
                <p className="font-semibold">{activity.amount}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </ModernCard>
  );
}







