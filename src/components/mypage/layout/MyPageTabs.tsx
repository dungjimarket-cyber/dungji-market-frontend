'use client';

import { useState } from 'react';
import { Package, ShoppingCart, MessageSquare, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesTab from '../sales/SalesTab';
import PurchasesTab from '../purchases/PurchasesTab';
import ReviewsTab from '../reviews/ReviewsTab';
import SettingsTab from '../settings/SettingsTab';

export default function MyPageTabs() {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="sales" className="gap-1.5">
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">판매관리</span>
          <span className="sm:hidden">판매</span>
        </TabsTrigger>
        <TabsTrigger value="purchases" className="gap-1.5">
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">구매관리</span>
          <span className="sm:hidden">구매</span>
        </TabsTrigger>
        <TabsTrigger value="reviews" className="gap-1.5">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">거래후기</span>
          <span className="sm:hidden">후기</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">설정</span>
          <span className="sm:hidden">설정</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sales" className="space-y-4">
        <SalesTab />
      </TabsContent>

      <TabsContent value="purchases" className="space-y-4">
        <PurchasesTab />
      </TabsContent>

      <TabsContent value="reviews" className="space-y-4">
        <ReviewsTab />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <SettingsTab />
      </TabsContent>
    </Tabs>
  );
}