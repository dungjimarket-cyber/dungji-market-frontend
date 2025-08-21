'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface GroupBuyFiltersProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void;
  category?: 'phone' | 'internet' | 'internet_tv';
}

/**
 * 공구 둘러보기 필터 컴포넌트
 * 이미지처럼 팝오버 형태의 필터를 제공
 */
export function GroupBuyFilters({ onFiltersChange, category = 'phone' }: GroupBuyFiltersProps) {
  // 필터 그룹 정의
  const filterGroups: Record<string, FilterGroup[]> = {
    phone: [
      {
        id: 'manufacturer',
        label: '제조사',
        options: [
          { value: 'samsung', label: '삼성' },
          { value: 'apple', label: '애플' },
        ]
      },
      {
        id: 'carrier',
        label: '통신사',
        options: [
          { value: 'skt', label: 'SKT' },
          { value: 'kt', label: 'KT' },
          { value: 'lgu', label: 'LG U+' },
        ]
      },
      {
        id: 'subscriptionType',
        label: '가입유형',
        options: [
          { value: 'device_change', label: '기기변경' },
          { value: 'number_port', label: '번호이동' },
          { value: 'new_signup', label: '신규가입' },
        ]
      },
      {
        id: 'planRange',
        label: '요금제',
        options: [
          { value: '50000', label: '5만원대' },
          { value: '60000', label: '6만원대' },
          { value: '70000', label: '7만원대' },
          { value: '80000', label: '8만원대' },
          { value: '90000', label: '9만원대' },
          { value: '100000', label: '10만원이상' },
        ]
      }
    ],
    internet: [
      {
        id: 'carrier',
        label: '통신사',
        options: [
          { value: 'skt', label: 'SKT' },
          { value: 'kt', label: 'KT' },
          { value: 'lgu', label: 'LG U+' },
        ]
      },
      {
        id: 'subscriptionType',
        label: '가입유형',
        options: [
          { value: 'carrier_change', label: '통신사이동' },
          { value: 'new_signup', label: '신규가입' },
        ]
      },
      {
        id: 'speed',
        label: '인터넷속도',
        options: [
          { value: '100M', label: '100M' },
          { value: '200M', label: '200M' },
          { value: '500M', label: '500M' },
          { value: '1G', label: '1G' },
          { value: '2.5G', label: '2.5G' },
        ]
      }
    ],
    internet_tv: [
      {
        id: 'carrier',
        label: '통신사',
        options: [
          { value: 'skt', label: 'SKT' },
          { value: 'kt', label: 'KT' },
          { value: 'lgu', label: 'LG U+' },
        ]
      },
      {
        id: 'subscriptionType',
        label: '가입유형',
        options: [
          { value: 'carrier_change', label: '통신사이동' },
          { value: 'new_signup', label: '신규가입' },
        ]
      },
      {
        id: 'speed',
        label: '인터넷속도',
        options: [
          { value: '100M', label: '100M' },
          { value: '200M', label: '200M' },
          { value: '500M', label: '500M' },
          { value: '1G', label: '1G' },
          { value: '2.5G', label: '2.5G' },
        ]
      }
    ]
  };

  // 선택된 필터 상태
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  // 현재 카테고리의 필터 그룹
  const currentFilterGroups = filterGroups[category] || filterGroups.phone;

  /**
   * 필터 옵션 토글
   */
  const toggleFilter = (groupId: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[groupId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      const newFilters = {
        ...prev,
        [groupId]: newValues
      };
      
      // 빈 배열은 제거
      if (newValues.length === 0) {
        delete newFilters[groupId];
      }
      
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  };

  /**
   * 특정 그룹의 모든 필터 초기화
   */
  const clearGroupFilters = (groupId: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[groupId];
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  };

  /**
   * 팝오버 열기/닫기
   */
  const togglePopover = (groupId: string) => {
    setOpenPopovers(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  /**
   * 선택된 필터 개수 계산
   */
  const getSelectedCount = (groupId: string) => {
    return selectedFilters[groupId]?.length || 0;
  };

  /**
   * 선택된 필터 레이블 가져오기
   */
  const getSelectedLabels = (groupId: string) => {
    const group = currentFilterGroups.find(g => g.id === groupId);
    const selected = selectedFilters[groupId] || [];
    
    if (selected.length === 0) return group?.label || '';
    if (selected.length === 1) {
      const option = group?.options.find(o => o.value === selected[0]);
      return option?.label || '';
    }
    
    return `${group?.label} ${selected.length}개`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {currentFilterGroups.map((group) => {
        const hasSelection = getSelectedCount(group.id) > 0;
        
        return (
          <Popover 
            key={group.id}
            open={openPopovers[group.id] || false}
            onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [group.id]: open }))}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 px-3 font-normal border-gray-200",
                  hasSelection && "bg-purple-50 border-purple-300 text-purple-700"
                )}
              >
                <span className="mr-1">{getSelectedLabels(group.id)}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {group.options.map((option) => {
                  const isSelected = selectedFilters[group.id]?.includes(option.value);
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleFilter(group.id, option.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        isSelected 
                          ? "bg-purple-100 text-purple-700 font-medium" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
                
                {getSelectedCount(group.id) > 0 && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      onClick={() => clearGroupFilters(group.id)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100"
                    >
                      초기화
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
      
      {/* 선택된 필터 요약 */}
      {Object.keys(selectedFilters).length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedFilters({});
            onFiltersChange?.({});
          }}
          className="h-9 px-2 text-gray-500"
        >
          전체 초기화
        </Button>
      )}
    </div>
  );
}