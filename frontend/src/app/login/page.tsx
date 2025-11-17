'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { testAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleTestAPI = async () => {
    try {
      console.log('🧪 Testing API connectivity with axios...');
      const response = await testAPI.test();
      console.log('✅ Axios Test successful:', response.data);
      setError('Axios Test successful! Check console for details.');
    } catch (err: any) {
      console.error('❌ Axios Test failed:', err);
      setError(`Axios Test failed: ${err.message}`);
    }
  };

  const handleTestFetch = async () => {
    try {
      console.log('🧪 Testing API connectivity with fetch...');
      const result = await testAPI.testWithFetch();
      if (result.success) {
        console.log('✅ Fetch Test successful:', result.data);
        setError('Fetch Test successful! Check console for details.');
      } else {
        console.error('❌ Fetch Test failed:', result.error);
        setError(`Fetch Test failed: ${result.error.message}`);
      }
    } catch (err: any) {
      console.error('❌ Fetch Test error:', err);
      setError(`Fetch Test error: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your Bizabode account
          </p>
        </div>
        
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100">Sign In</CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="owner@jamaicatech.com"
                  className="h-11 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="h-11 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <Button 
                type="button" 
                onClick={handleTestAPI}
                className="w-full h-11 bg-gray-500 hover:bg-gray-600 text-white font-medium" 
              >
                Test API (Axios)
              </Button>
              
              <Button 
                type="button" 
                onClick={handleTestFetch}
                className="w-full h-11 bg-green-500 hover:bg-green-600 text-white font-medium" 
              >
                Test API (Fetch)
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Create one here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Demo Credentials */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
              <div><strong>Owner:</strong> owner@jamaicatech.com</div>
              <div><strong>Accountant:</strong> accountant@jamaicatech.com</div>
              <div><strong>Staff:</strong> staff@jamaicatech.com</div>
              <div className="text-green-600 font-medium">Password: password123</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




