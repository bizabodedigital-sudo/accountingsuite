'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Tenant, AuthResponse } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantName: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Wait until window is available (client-side hydration)
    if (typeof window === 'undefined') {
      return;
    }

    // Set loading to false immediately - don't wait for anything
    setIsLoading(false);

    // Check for existing token on mount
    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');
    const existingTenant = localStorage.getItem('tenant');

    console.log('🔍 AuthContext: Checking localStorage:', {
      token: !!existingToken,
      user: !!existingUser,
      tenant: !!existingTenant
    });

    if (existingToken && existingUser && existingTenant) {
      try {
        setToken(existingToken);
        const parsedUser = JSON.parse(existingUser);
        const parsedTenant = JSON.parse(existingTenant);
        setUser(parsedUser);
        setTenant(parsedTenant);
        
        // Apply theme from tenant settings if available
        if (parsedTenant?.theme && typeof window !== 'undefined') {
          localStorage.setItem('theme', parsedTenant.theme);
          const root = document.documentElement;
          const resolved = parsedTenant.theme === 'auto' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : parsedTenant.theme;
          if (resolved === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
        
        // Validate token in the background (non-blocking, with very short timeout)
        validateToken(existingToken);
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        // Clear invalid data
        logout();
      }
    } else {
      console.log('🔍 AuthContext: No stored auth data');
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      console.log('🔍 AuthContext: Validating token...');
      // Use Promise.race with a very short timeout (2 seconds) to prevent blocking
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token validation timeout')), 2000)
      );
      
      await Promise.race([authAPI.getMe(), timeoutPromise]);
      console.log('✅ AuthContext: Token validation successful');
    } catch (error: any) {
      console.log('❌ AuthContext: Token validation failed', error?.message || error);
      // Only clear auth if it's an authentication error (401), not a timeout/network error
      // This allows the user to continue using the app even if backend is temporarily unreachable
      if (error?.response?.status === 401) {
        console.log('🔍 AuthContext: Token is invalid, clearing auth data');
        logout();
      } else {
        console.log('🔍 AuthContext: Backend unreachable or timeout, keeping cached auth');
        // Keep the cached auth data if it's just a network issue
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔍 AuthContext: Attempting login...');
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser, tenant: newTenant } = response.data;

      console.log('✅ AuthContext: Login successful, storing auth data');
      setToken(newToken);
      setUser(newUser);
      setTenant(newTenant);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('tenant', JSON.stringify(newTenant));
      
      // Apply theme from tenant settings if available
      if (newTenant?.theme && typeof window !== 'undefined') {
        localStorage.setItem('theme', newTenant.theme);
        const root = document.documentElement;
        const resolved = newTenant.theme === 'auto' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : newTenant.theme;
        if (resolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      
      console.log('✅ AuthContext: Auth data stored in localStorage');
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantName: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser, tenant: newTenant } = response.data;

      setToken(newToken);
      setUser(newUser);
      setTenant(newTenant);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('tenant', JSON.stringify(newTenant));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTenant(null);
    setToken(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; email?: string }) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tenant,
    token,
    login,
    register,
    logout,
    updateProfile,
    isLoading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};




