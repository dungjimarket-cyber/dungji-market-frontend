/**
 * 중고폰 필터 컴포넌트
 * 최적화: 디바운싱, 메모이제이션
 */

'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import { useDebounce } from '@/hooks/useDebounce';

interface FilterOptions {
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  storage?: number;
  acceptOffers?: boolean;
  sortBy?: string;
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
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchInput, setSearchInput] = useState('');
  
  // 검색어 디바운싱 (300ms)
  const debouncedSearch = useDebounce(searchInput, 300);

  // 검색어 변경 시
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      handleFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

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

  // 가격 범위 변경
  const handlePriceChange = useCallback((values: number[]) => {
    handleFilterChange({
      ...filters,
      minPrice: values[0] * 10000,
      maxPrice: values[1] * 10000
    });
  }, [filters, handleFilterChange]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchInput('');
    onFilterChange({});
    setIsOpen(false);
  }, [onFilterChange]);

  // 활성 필터 개수
  const activeFilterCount = Object.keys(filters).filter(key => 
    key !== 'search' && filters[key as keyof FilterOptions] !== undefined
  ).length;

  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        {/* 모바일 & 태블릿 뷰 */}
        <div className="lg:hidden">
          <div className="flex gap-2">
            {/* 검색 바 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="모델명 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>
            
            {/* 필터 버튼 */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96">
                <SheetHeader>
                  <SheetTitle>필터</SheetTitle>
                  <SheetDescription>
                    원하는 조건으로 검색하세요
                  </SheetDescription>
                </SheetHeader>
                <FilterContent
                  filters={filters}
                  updateFilter={updateFilter}
                  handlePriceChange={handlePriceChange}
                  resetFilters={resetFilters}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* 데스크톱 뷰 */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-4">
            {/* 검색 바 */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="모델명 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>

            {/* 브랜드 필터 */}
            <Select value={filters.brand || ''} onValueChange={(value) => updateFilter('brand', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="브랜드" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {Object.entries(PHONE_BRANDS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select value={filters.condition || ''} onValueChange={(value) => updateFilter('condition', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {Object.entries(CONDITION_GRADES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 정렬 */}
            <Select value={filters.sortBy || 'latest'} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="price_low">가격 낮은순</SelectItem>
                <SelectItem value="price_high">가격 높은순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
              </SelectContent>
            </Select>

            {/* 제안 가능 여부 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.acceptOffers || false}
                onChange={(e) => updateFilter('acceptOffers', e.target.checked || undefined)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">제안 가능만</span>
            </label>

            {/* 초기화 버튼 */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="ml-auto"
              >
                <X className="w-4 h-4 mr-1" />
                초기화
              </Button>
            )}

            {/* 결과 수 */}
            <div className="ml-auto text-sm text-gray-600">
              총 <span className="font-medium">{totalCount.toLocaleString()}</span>개
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// 필터 컨텐츠 (모바일 시트용)
const FilterContent = memo(function FilterContent({
  filters,
  updateFilter,
  handlePriceChange,
  resetFilters
}: any) {
  const priceRange = [
    (filters.minPrice || 0) / 10000,
    (filters.maxPrice || 3000000) / 10000
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* 브랜드 */}
      <div>
        <Label>브랜드</Label>
        <Select value={filters.brand || ''} onValueChange={(value) => updateFilter('brand', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            {Object.entries(PHONE_BRANDS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 가격 범위 */}
      <div>
        <Label>가격 범위</Label>
        <div className="mt-3 px-3">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            min={0}
            max={300}
            step={10}
            className="mt-2"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{priceRange[0]}만원</span>
            <span>{priceRange[1] === 300 ? '300만원+' : `${priceRange[1]}만원`}</span>
          </div>
        </div>
      </div>

      {/* 상태 */}
      <div>
        <Label>상태</Label>
        <Select value={filters.condition || ''} onValueChange={(value) => updateFilter('condition', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            {Object.entries(CONDITION_GRADES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 용량 */}
      <div>
        <Label>용량</Label>
        <Select value={filters.storage?.toString() || ''} onValueChange={(value) => updateFilter('storage', value ? parseInt(value) : undefined)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="64">64GB</SelectItem>
            <SelectItem value="128">128GB</SelectItem>
            <SelectItem value="256">256GB</SelectItem>
            <SelectItem value="512">512GB</SelectItem>
            <SelectItem value="1024">1TB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 제안 가능 여부 */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.acceptOffers || false}
            onChange={(e) => updateFilter('acceptOffers', e.target.checked || undefined)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">가격 제안 가능한 상품만</span>
        </label>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={resetFilters}
          className="flex-1"
        >
          초기화
        </Button>
        <Button
          onClick={() => document.getElementById('sheet-close')?.click()}
          className="flex-1"
        >
          적용
        </Button>
      </div>
    </div>
  );
});

UsedPhoneFilter.displayName = 'UsedPhoneFilter';
FilterContent.displayName = 'FilterContent';

export default UsedPhoneFilter;