'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">B</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bizabode
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Bizabode Accounting Suite
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Modern invoicing & bookkeeping designed specifically for Jamaican SMEs. 
            Streamline your finances with local tax compliance and business practices.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 hover:bg-gray-50">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Easy Invoicing</CardTitle>
              <CardDescription>
                Create and send professional invoices in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Custom invoice templates</li>
                <li>• Automated email sending</li>
                <li>• Payment tracking</li>
                <li>• PDF generation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Tracking</CardTitle>
              <CardDescription>
                Keep track of all your business expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Categorized expenses</li>
                <li>• Receipt upload</li>
                <li>• Tax deduction tracking</li>
                <li>• Vendor management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Get insights into your business performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Profit & Loss statements</li>
                <li>• Balance sheets</li>
                <li>• Cash flow reports</li>
                <li>• Tax reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Built for Jamaican Businesses
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Designed with local tax requirements and business practices in mind
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">JMD</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Jamaican Dollar Support</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">GCT</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">GCT Tax Calculations</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Local</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Local Business Support</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Secure</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Bank-level Security</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}