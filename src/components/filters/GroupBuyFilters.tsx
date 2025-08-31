'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  currentRegion?: string;
}

/**
 * 공구 둘러보기 필터 컴포넌트
 * 버튼 토글 형태의 필터를 제공
 */
export function GroupBuyFilters({ onFiltersChange, category = 'phone', currentRegion }: GroupBuyFiltersProps) {
  // 필터 그룹 정의
  const filterGroups: Record<string, FilterGroup[]> = {
    phone: [
      {
        id: 'manufacturer',
        label: '제조사',
        options: [
          { value: 'all', label: '전체' },
          { value: 'samsung', label: '삼성' },
          { value: 'apple', label: '애플' },
        ]
      },
      {
        id: 'carrier',
        label: '통신사',
        options: [
          { value: 'all', label: '전체' },
          { value: 'skt', label: 'SKT' },
          { value: 'kt', label: 'KT' },
          { value: 'lgu', label: 'LG U+' },
        ]
      },
      {
        id: 'subscriptionType',
        label: '가입유형',
        options: [
          { value: 'all', label: '전체' },
          { value: 'device_change', label: '기기변경' },
          { value: 'number_port', label: '번호이동' },
          { value: 'new_signup', label: '신규가입' },
        ]
      },
      {
        id: 'planRange',
        label: '요금제',
        options: [
          { value: 'all', label: '전체' },
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
        id: 'internet_carrier',
        label: '통신사',
        options: [
          { value: 'all', label: '전체' },
          { value: 'skt', label: 'SKT' },
          { value: 'kt', label: 'KT' },
          { value: 'lgu', label: 'LG U+' },
        ]
      },
      {
        id: 'internet_subscriptionType',
        label: '가입유형',
        options: [
          { value: 'all', label: '전체' },
          { value: 'carrier_change', label: '통신사이동' },
          { value: 'new_signup', label: '신규가입' },
        ]
      },
      {
        id: 'speed',
        label: '인터넷속도',
        options: [
          { value: 'all', label: '전체' },
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
        id: 'internet_tv_carrier',
        label: '통신사',
        options: [
          { value: 'all', label: '전체' },
          { value: 'skt', label: 'SKT' },
          { value: 'kt', label: 'KT' },
          { value: 'lgu', label: 'LG U+' },
        ]
      },
      {
        id: 'internet_tv_subscriptionType',
        label: '가입유형',
        options: [
          { value: 'all', label: '전체' },
          { value: 'carrier_change', label: '통신사이동' },
          { value: 'new_signup', label: '신규가입' },
        ]
      },
      {
        id: 'internet_tv_speed',
        label: '인터넷속도',
        options: [
          { value: 'all', label: '전체' },
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

  // 현재 카테고리의 필터 그룹
  const currentFilterGroups = filterGroups[category] || filterGroups.phone;

  // 카테고리를 추적하기 위한 ref
  const prevCategoryRef = useRef<string>(category);
  
  // 카테고리가 변경될 때만 필터 초기화 (지역 변경은 필터 유지)
  useEffect(() => {
    if (category !== prevCategoryRef.current) {
      console.log('카테고리 변경 감지, 필터 초기화:', prevCategoryRef.current, '->', category);
      setSelectedFilters({});
      onFiltersChange?.({});
      prevCategoryRef.current = category;
    }
  }, [category]);

  /**
   * 필터 옵션 토글
   */
  const toggleFilter = (groupId: string, value: string) => {
    // '전체' 버튼 클릭 시
    if (value === 'all') {
      setSelectedFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[groupId];
        onFiltersChange?.(newFilters);
        return newFilters;
      });
      return;
    }
    
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
   * 필터가 선택되었는지 확인
   */
  const isFilterSelected = (groupId: string, value: string) => {
    // '전체' 버튼은 해당 그룹에 선택된 필터가 없을 때 활성화
    if (value === 'all') {
      return !selectedFilters[groupId] || selectedFilters[groupId].length === 0;
    }
    return selectedFilters[groupId]?.includes(value) || false;
  };

  // 카테고리 변경 시 필터 초기화
  useEffect(() => {
    setSelectedFilters({});
  }, [category]);

  return (
    <div className="space-y-3">
      {currentFilterGroups.map((group) => (
        <div key={group.id} className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2 sm:mb-0 sm:min-w-[80px]">{group.label}</h3>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isSelected = isFilterSelected(group.id, option.value);
              
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFilter(group.id, option.value)}
                  className={cn(
                    "h-8 px-3 font-normal transition-all",
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}