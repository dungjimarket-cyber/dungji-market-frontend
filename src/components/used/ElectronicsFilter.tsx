/**
 * 전자제품 필터 컴포넌트
 * UsedPhoneFilter 기반으로 전자제품용으로 수정
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
              <SelectTrigger className="flex-1">
                <MapPin className="w-3 h-3 mr-1" />
                <SelectValue placeholder="시/도" />
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
              <SelectTrigger className="flex-1" disabled={!selectedProvince}>
                <SelectValue placeholder="시/군/구" />
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
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
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
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(CONDITION_GRADES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.split(' ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 정렬 필터 */}
          <Select
            value={filters.sortBy || 'latest'}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="price_low">가격낮은순</SelectItem>
              <SelectItem value="price_high">가격높은순</SelectItem>
            </SelectContent>
          </Select>

          {/* 세부 필터 (가격대, 거래완료 포함 등) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                필터
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-dungji-primary text-white px-1.5 py-0.5 rounded-full text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>상세 필터</SheetTitle>
                <SheetDescription>
                  원하는 조건으로 상품을 찾아보세요
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* 가격대 */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">가격대</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.minPrice || ''}
                      onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-24"
                    />
                    <span className="text-gray-500">~</span>
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.maxPrice || ''}
                      onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-24"
                    />
                    <span className="text-gray-500">원</span>
                  </div>
                </div>

                {/* 거래완료 포함 */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-completed" className="text-sm font-medium">
                    거래완료 상품 포함
                  </Label>
                  <Button
                    id="include-completed"
                    variant={filters.includeCompleted ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('includeCompleted', !filters.includeCompleted)}
                  >
                    {filters.includeCompleted ? '포함' : '제외'}
                  </Button>
                </div>

                {/* 초기화 버튼 */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resetFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    필터 초기화
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* 결과 요약 */}
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">{totalCount}개</span>의 상품
        </div>
      </div>
    </div>
  );
});

export default ElectronicsFilter;