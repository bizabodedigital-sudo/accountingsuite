'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Edit, Trash2, Shield } from 'lucide-react';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Fetch users from API
    setUsers([user].filter(Boolean));
  }, [user]);

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="User Management" subtitle="Manage team members and permissions" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Users</h2>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        <ModernCard title="Team Members">
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u._id || u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-sm text-gray-600">{u.email} • {u.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>

        <ModernCard title="Roles & Permissions">
          <p className="text-gray-600 mb-4">Configure permissions for each role</p>
          <div className="space-y-2">
            {['OWNER', 'ACCOUNTANT', 'STAFF', 'READONLY'].map((role) => (
              <div key={role} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{role}</span>
                  <Button variant="outline" size="sm">
                    Edit Permissions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

