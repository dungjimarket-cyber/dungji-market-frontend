/**
 * 중고폰 필터 컴포넌트
 * 최적화: 디바운싱, 메모이제이션
 */

'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Filter, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PHONE_BRANDS, CONDITION_GRADES } from '@/types/used';
import { regions } from '@/lib/regions';

interface FilterOptions {
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  storage?: number;
  acceptOffers?: boolean;
  sortBy?: string;
  region?: string;
  includeCompleted?: boolean; // 거래완료 포함 옵션
}

interface UsedPhoneFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  totalCount?: number;
}

const UsedPhoneFilter = memo(function UsedPhoneFilter({
  onFilterChange,
  totalCount = 0
}: UsedPhoneFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    includeCompleted: true // 기본적으로 거래완료 포함
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [onFilterChange]);

  // 개별 필터 변경
  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    const updated = { ...filters, [key]: value };
    if (value === '' || value === undefined) {
      delete updated[key];
    }
    handleFilterChange(updated);
  }, [filters, handleFilterChange]);

  // 시/도 선택 시 시/군/구 목록 업데이트
  useEffect(() => {
    if (selectedProvince) {
      const region = regions.find(r => r.name === selectedProvince);
      setCities(region?.cities || []);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedProvince]);

  // 검색 실행 함수
  const handleSearch = useCallback(() => {
    if (searchInput.trim() !== filters.search) {
      updateFilter('search', searchInput.trim() || undefined);
    }
  }, [searchInput, filters.search, updateFilter]);

  // 엔터키 핸들러
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);


  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters({ includeCompleted: true });
    setSearchInput('');
    setSelectedProvince('');
    setSelectedCity('');
    onFilterChange({ includeCompleted: true });
  }, [onFilterChange]);

  // 활성 필터 개수
  const activeFilterCount = Object.keys(filters).filter(key => 
    key !== 'search' && filters[key as keyof FilterOptions] !== undefined
  ).length;

  return (
    <div className="py-3">
      {/* 모든 화면에서 동일한 필터 사용 */}
      <div className="flex flex-col gap-3">
        {/* 검색바와 지역검색을 반반 처리 */}
        <div className="flex gap-2">
          {/* 통합검색 (50%) */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="모델명 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-9 pr-10 w-full"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              aria-label="검색"
            >
              <Search className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 지역검색 (50%) */}
          <div className="flex gap-1 flex-1">
            {/* 시/도 선택 */}
            <Select
              value={selectedProvince || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedProvince('');
                  setSelectedCity('');
                  updateFilter('region', undefined);
                } else {
                  setSelectedProvince(value);
                  setSelectedCity('');
                  updateFilter('region', value);
                }
              }}
            >
              <SelectTrigger className="flex-1 min-w-0">
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <SelectValue placeholder="시/도" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 시/군/구 선택 */}
            {selectedProvince && (
              <Select
                value={selectedCity || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedCity('');
                    const regionValue = selectedProvince;
                    updateFilter('region', regionValue);
                  } else {
                    setSelectedCity(value);
                    const regionValue = `${selectedProvince} ${value}`;
                    updateFilter('region', regionValue);
                  }
                }}
              >
                <SelectTrigger className="flex-1 min-w-0">
                  <SelectValue placeholder="시/군/구" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* 필터들을 컴팩트하게 가로 배치 */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* 브랜드 */}
          <Select value={filters.brand || 'all'} onValueChange={(value) => updateFilter('brand', value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-20 text-xs">
              <SelectValue placeholder="브랜드" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(PHONE_BRANDS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 상태 */}
          <Select value={filters.condition || 'all'} onValueChange={(value) => updateFilter('condition', value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-16 text-xs">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(CONDITION_GRADES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 정렬 */}
          <Select value={filters.sortBy || ''} onValueChange={(value) => updateFilter('sortBy', value || undefined)}>
            <SelectTrigger className="w-20 text-xs">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_low">낮은가격</SelectItem>
              <SelectItem value="price_high">높은가격</SelectItem>
            </SelectContent>
          </Select>

          {/* 거래완료 포함 */}
          <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={filters.includeCompleted === true}
              onChange={(e) => updateFilter('includeCompleted', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 w-3 h-3"
            />
            <span className="text-xs">완료포함</span>
          </label>

          {/* 초기화 */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              초기화
            </Button>
          )}

          {/* 결과 수 */}
          <div className="text-xs text-gray-600 whitespace-nowrap ml-auto">
            <span className="font-medium">{totalCount.toLocaleString()}</span>개
          </div>
        </div>
      </div>
    </div>
  );
});
UsedPhoneFilter.displayName = 'UsedPhoneFilter';

export default UsedPhoneFilter;