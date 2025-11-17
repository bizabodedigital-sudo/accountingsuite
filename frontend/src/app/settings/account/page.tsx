'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { CreditCard, Save, Trash2, AlertTriangle } from 'lucide-react';

export default function AccountManagementPage() {
  const { tenant } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Account Management" subtitle="Manage subscription, billing, and account settings" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Subscription Plan">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Current Plan: {tenant?.plan || 'STARTER'}</h3>
              <p className="text-sm text-gray-600 mb-4">Manage your subscription and billing</p>
              <Button>
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          </div>
        </ModernCard>

        <ModernCard title="Billing Information">
          <p className="text-gray-600 mb-4">Update payment method and billing details</p>
          <Button variant="outline">
            Update Payment Method
          </Button>
        </ModernCard>

        <ModernCard title="Account Actions" className="border-red-200">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete your account and all data. This action cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  ) : (
                    <div className="mt-3 space-x-2">
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => {/* Handle delete */}}
                      >
                        Confirm Delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

