'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Bell, 
  Menu,
  Filter,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showActions?: boolean;
}

export default function Header({ 
  onMenuClick, 
  title, 
  subtitle, 
  showSearch = true, 
  showActions = true 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center Section - Search */}
          {showSearch && (
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search invoices, customers, expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Right Section - Actions */}
          {showActions && (
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
                className="relative"
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}





