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
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [sigunguList, setSigunguList] = useState<any[]>([]);
  
  // 검색어 디바운싱 (300ms)
  const debouncedSearch = useDebounce(searchInput, 300);

  // 지역 데이터 로드
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
        const data = await response.json();
        // 배열인지 확인
        if (Array.isArray(data)) {
          setRegions(data);
        } else {
          console.error('Regions data is not an array:', data);
          setRegions([]);
        }
      } catch (error) {
        console.error('Failed to fetch regions:', error);
        setRegions([]);
      }
    };
    fetchRegions();
  }, []);

  // 시/도 선택 시 시/군/구 목록 업데이트
  useEffect(() => {
    if (selectedSido && regions.length > 0) {
      const sido = regions.find(r => r.level === 0 && r.name === selectedSido);
      if (sido) {
        const subRegions = regions.filter(r => r.parent_id === sido.pk);
        setSigunguList(subRegions);
      }
    } else {
      setSigunguList([]);
    }
  }, [selectedSido, regions]);

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
    <div className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-3">
        {/* 모바일 & 태블릿 뷰 */}
        <div className="lg:hidden">
          <div className="flex gap-2">
            {/* 검색 바 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="아이폰 14 Pro, 갤럭시 S23..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
            
            {/* 필터 버튼 */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant={activeFilterCount > 0 ? "default" : "outline"} 
                  className="relative"
                >
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    상세 필터
                  </SheetTitle>
                  <SheetDescription>
                    원하는 조건을 선택해 딱 맞는 상품을 찾아보세요
                  </SheetDescription>
                </SheetHeader>
                <FilterContent
                  filters={filters}
                  updateFilter={updateFilter}
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

            {/* 지역 필터 */}
            <Select
              value={filters.region || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  updateFilter('region', undefined);
                  setSelectedSido('');
                } else if (value.includes(' ')) {
                  // 시/군/구 선택
                  updateFilter('region', value);
                } else {
                  // 시/도만 선택
                  setSelectedSido(value);
                  updateFilter('region', value);
                }
              }}
            >
              <SelectTrigger className="w-40">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <SelectValue placeholder="지역" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                {regions.filter(r => r.level === 0).map(region => (
                  <SelectItem key={region.pk} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
                {selectedSido && sigunguList.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t">
                      {selectedSido} 하위 지역
                    </div>
                    {sigunguList.map(sigungu => (
                      <SelectItem key={sigungu.pk} value={`${selectedSido} ${sigungu.name}`}>
                        {sigungu.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* 제조사 필터 */}
            <Select value={filters.brand || 'all'} onValueChange={(value) => updateFilter('brand', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="제조사" />
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

            {/* 상태 필터 */}
            <Select value={filters.condition || 'all'} onValueChange={(value) => updateFilter('condition', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-32">
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
              <SelectTrigger className="w-32">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_low">가격 낮은순</SelectItem>
                <SelectItem value="price_high">가격 높은순</SelectItem>
              </SelectContent>
            </Select>

            {/* 거래완료 포함 체크박스 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeCompleted !== false}
                onChange={(e) => updateFilter('includeCompleted', e.target.checked || undefined)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">거래완료 포함</span>
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
  resetFilters
}: any) {
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [sigunguList, setSigunguList] = useState<any[]>([]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
        const data = await response.json();
        setRegions(data);
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    if (selectedSido && regions.length > 0) {
      const sido = regions.find(r => r.level === 0 && r.name === selectedSido);
      if (sido) {
        const subRegions = regions.filter(r => r.parent_id === sido.pk);
        setSigunguList(subRegions);
      }
    } else {
      setSigunguList([]);
    }
  }, [selectedSido, regions]);

  return (
    <div className="mt-6 space-y-6">
      {/* 지역 */}
      <div>
        <Label className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          거래 지역
        </Label>
        <Select
          value={filters.region || 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              updateFilter('region', undefined);
              setSelectedSido('');
            } else if (value.includes(' ')) {
              updateFilter('region', value);
            } else {
              setSelectedSido(value);
              updateFilter('region', value);
            }
          }}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="전체 지역" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 지역</SelectItem>
            {regions.filter(r => r.level === 0).map(region => (
              <SelectItem key={region.pk} value={region.name}>
                {region.name}
              </SelectItem>
            ))}
            {selectedSido && sigunguList.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t">
                  {selectedSido} 하위 지역
                </div>
                {sigunguList.map(sigungu => (
                  <SelectItem key={sigungu.pk} value={`${selectedSido} ${sigungu.name}`}>
                    {sigungu.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 제조사 */}
      <div>
        <Label>제조사</Label>
        <Select value={filters.brand || 'all'} onValueChange={(value) => updateFilter('brand', value === 'all' ? undefined : value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="전체" />
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
      </div>

      {/* 상태 */}
      <div>
        <Label>상태</Label>
        <Select value={filters.condition || 'all'} onValueChange={(value) => updateFilter('condition', value === 'all' ? undefined : value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="전체" />
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
      </div>

      {/* 정렬 */}
      <div>
        <Label>정렬</Label>
        <Select value={filters.sortBy || ''} onValueChange={(value) => updateFilter('sortBy', value || undefined)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="기본순" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price_low">가격 낮은순</SelectItem>
            <SelectItem value="price_high">가격 높은순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 거래완료 포함 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeCompleted !== false}
            onChange={(e) => updateFilter('includeCompleted', e.target.checked || undefined)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">거래완료 상품 포함</span>
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