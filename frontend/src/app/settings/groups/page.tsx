'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { FolderTree, Plus } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Group Settings" subtitle="Organize clients, products, and invoices by groups" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Groups">
          <p className="text-gray-600 mb-4">Create groups to organize your data by tags, regions, or business units</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </ModernCard>
      </div>
    </div>
  );
}

