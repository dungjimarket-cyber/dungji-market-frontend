'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Filter, Search, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOptions {
  categories: string[];
  manufacturers: string[];
  carriers: string[];
  purchaseTypes: string[];
  priceRanges: string[];
  sortOptions: string[];
}

interface GroupBuyFiltersProps {
  onFiltersChange?: (filters: Record<string, string>) => void;
  hideSort?: boolean; // 정렬 옵션 숨김 여부
}

/**
 * 공구 목록 필터 컴포넌트
 * @param onFiltersChange - 필터 변경 시 호출되는 콜백 함수
 */
export function GroupBuyFilters({ onFiltersChange, hideSort = true }: GroupBuyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 필터 옵션들
  const filterOptions: FilterOptions = {
    categories: ['휴대폰', '인터넷', '인터넷+TV'],
    manufacturers: ['삼성', '애플', 'LG', '샤오미', '구글'],
    carriers: ['SKT', 'KT', 'LG U+', 'SK브로드밴드'],
    purchaseTypes: ['신규가입', '번호이동', '기기변경', '통신사이동'],
    priceRanges: ['5만원대', '6만원대', '7만원대', '8만원대', '9만원대', '10만원 이상'],
    sortOptions: ['최신순', '인기순(참여자많은순)']
  };

  // 현재 적용된 필터들
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    manufacturer: searchParams.get('manufacturer') || 'all',
    carrier: searchParams.get('carrier') || 'all',
    purchaseType: searchParams.get('purchaseType') || 'all',
    priceRange: searchParams.get('priceRange') || 'all',
    sort: searchParams.get('sort') || 'all', // 기본값은 all로 변경
    search: searchParams.get('search') || '' // 검색어 추가
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  /**
   * 필터 변경 처리
   */
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // URL 쿼리 파라미터 업데이트
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
    
    // 부모 컴포넌트에 필터 변경 알림
    onFiltersChange?.(newFilters);
  };

  /**
   * 모든 필터 초기화
   */
  const clearAllFilters = () => {
    const clearedFilters = {
      category: 'all',
      manufacturer: 'all',
      carrier: 'all',
      purchaseType: 'all',
      priceRange: 'all',
      sort: 'all', // 기본값을 all로 변경
      search: ''
    };
    setSearchQuery('');
    setFilters(clearedFilters);
    
    // URL에서 모든 필터 파라미터 제거
    const params = new URLSearchParams();
    router.push(`?${params.toString()}`, { scroll: false });
    
    onFiltersChange?.(clearedFilters);
  };

  /**
   * 개별 필터 제거
   */
  const removeFilter = (key: string) => {
    handleFilterChange(key, 'all');
  };

  /**
   * 적용된 필터 개수 계산
   */
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length;
  };

  /**
   * 적용된 필터들을 배지로 표시
   */
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value !== 'all')
      .map(([key, value]) => ({ key, value }));

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {activeFilters.map(({ key, value }) => (
          <Badge key={key} variant="secondary" className="flex items-center gap-1">
            {value}
            <button
              onClick={() => removeFilter(key)}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        {activeFilters.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            모두 지우기
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* 검색창 */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="통합검색 (상품명, 제목, 지역 등)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleFilterChange('search', searchQuery);
                }
              }}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleFilterChange('search', '');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <Button
            onClick={() => handleFilterChange('search', searchQuery)}
            disabled={!searchQuery}
            className="px-6"
          >
            검색
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
              }
              
              // 사용자의 지역 정보를 기반으로 필터링
              if (user.address_region) {
                const regionName = user.address_region.name || user.address_region.full_name;
                handleFilterChange('region', regionName);
                setSearchQuery(regionName);
              } else {
                alert('내 지역 정보가 설정되지 않았습니다. 마이페이지에서 지역을 설정해주세요.');
                router.push('/mypage');
              }
            }}
            className="flex items-center gap-1 px-4"
          >
            <MapPin className="w-4 h-4" />
            <span>내지역</span>
          </Button>
        </div>
        
        {/* 필터 토글 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            검색필터 {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Button>
          
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              전체 초기화
            </Button>
          )}
        </div>

        {/* 적용된 필터 배지들 */}
        {renderActiveFilters()}

        {/* 필터 옵션들 */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 카테고리 필터 */}
            <div>
              <label className="text-sm font-medium mb-1 block">카테고리</label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 정렬 옵션 - hideSort가 false일 때만 표시 */}
            {!hideSort && (
              <div>
                <label className="text-sm font-medium mb-1 block">정렬</label>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => handleFilterChange('sort', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="정렬 방식 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {filterOptions.sortOptions.map((sortOption) => (
                      <SelectItem key={sortOption} value={sortOption}>
                        {sortOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 제조사 필터 */}
            <div>
              <label className="text-sm font-medium mb-1 block">제조사</label>
              <Select
                value={filters.manufacturer}
                onValueChange={(value) => handleFilterChange('manufacturer', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="제조사 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 통신사 필터 */}
            <div>
              <label className="block text-sm font-medium mb-2">통신사</label>
              <Select
                value={filters.carrier}
                onValueChange={(value) => handleFilterChange('carrier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="통신사 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.carriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 구매방식 필터 */}
            <div>
              <label className="block text-sm font-medium mb-2">구매방식</label>
              <Select
                value={filters.purchaseType}
                onValueChange={(value) => handleFilterChange('purchaseType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="구매방식 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.purchaseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 요금제 필터 */}
            <div>
              <label className="block text-sm font-medium mb-2">요금제</label>
              <Select
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="요금제 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.priceRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
