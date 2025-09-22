/**
 * 통합 탭 컴포넌트
 * 전체/휴대폰/전자제품 탭 관리
 */

'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Monitor, Grid3X3 } from 'lucide-react';

export type TabType = 'all' | 'phone' | 'electronics';

interface UnifiedTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts?: {
    all: number;
    phone: number;
    electronics: number;
  };
}

export default function UnifiedTabs({
  activeTab,
  onTabChange,
  counts
}: UnifiedTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabType)}>
      <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
        <TabsTrigger value="all" className="flex items-center gap-1.5">
          <Grid3X3 className="w-4 h-4" />
          <span>전체</span>
          {counts?.all !== undefined && (
            <span className="text-xs text-gray-500 ml-1">({counts.all})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="phone" className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4" />
          <span>휴대폰/태블릿</span>
          {counts?.phone !== undefined && (
            <span className="text-xs text-gray-500 ml-1">({counts.phone})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="electronics" className="flex items-center gap-1.5">
          <Monitor className="w-4 h-4" />
          <span>전자제품</span>
          {counts?.electronics !== undefined && (
            <span className="text-xs text-gray-500 ml-1">({counts.electronics})</span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}