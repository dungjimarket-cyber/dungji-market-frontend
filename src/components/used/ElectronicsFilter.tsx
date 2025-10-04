/**
 * 전자제품 필터 컴포넌트
 * UsedPhoneFilter 기반으로 전자제품용으로 수정
 */

'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ELECTRONICS_SUBCATEGORIES, CONDITION_GRADES } from '@/types/electronics';
import { regions } from '@/lib/regions';

interface FilterOptions {
  search?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: string;
  region?: string;
  includeCompleted?: boolean; // 거래완료 포함 옵션
}

interface ElectronicsFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  totalCount?: number;
}

const ElectronicsFilter = memo(function ElectronicsFilter({
  onFilterChange,
  totalCount = 0
}: ElectronicsFilterProps) {
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
              placeholder="브랜드, 모델명 검색..."
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
                  updateFilter('region', value); // 시/도만 선택해도 필터 적용
                }
              }}
            >
              <SelectTrigger className="flex-1 min-w-0">
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <SelectValue placeholder="전국" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전국</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 시/군/구 선택 */}
            <Select
              value={selectedCity || 'all'}
              disabled={!selectedProvince}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedCity('');
                  updateFilter('region', selectedProvince); // 시/도만 유지
                } else {
                  setSelectedCity(value);
                  updateFilter('region', `${selectedProvince} ${value}`);
                }
              }}
            >
              <SelectTrigger className="flex-1 min-w-0" disabled={!selectedProvince}>
                <div className="flex items-center gap-1 truncate">
                  <SelectValue placeholder="시/군/구" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 필터 버튼 행 */}
        <div className="flex gap-2">
          {/* 카테고리 선택 */}
          <Select
            value={filters.subcategory || 'all'}
            onValueChange={(value) => updateFilter('subcategory', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="제품군" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">제품군</SelectItem>
              {Object.entries(ELECTRONICS_SUBCATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 상태 필터 */}
          <Select
            value={filters.condition || 'all'}
            onValueChange={(value) => updateFilter('condition', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">상태</SelectItem>
              {Object.entries(CONDITION_GRADES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.split(' ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 정렬 필터 */}
          <Select
            value={filters.sortBy || 'price'}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">가격</SelectItem>
              <SelectItem value="price_low">가격 낮은순</SelectItem>
              <SelectItem value="price_high">가격 높은순</SelectItem>
            </SelectContent>
          </Select>

          {/* 초기화 버튼 */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs ml-auto"
            >
              <X className="w-3 h-3 mr-1" />
              초기화
            </Button>
          )}
        </div>

        {/* 완료포함 체크박스와 결과 요약 */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-completed-electronics"
              checked={!!filters.includeCompleted}
              onCheckedChange={(checked) => {
                updateFilter('includeCompleted', !!checked);
              }}
            />
            <label htmlFor="include-completed-electronics" className="text-xs cursor-pointer">
              완료포함
            </label>
          </div>
          <div>
            총 <span className="font-semibold text-gray-900">{totalCount}개</span>의 상품
          </div>
        </div>
      </div>
    </div>
  );
});

export default ElectronicsFilter;