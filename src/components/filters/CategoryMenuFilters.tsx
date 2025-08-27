'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryFilterOptions {
  brands: string[];
  priceRanges: string[];
  features: string[];
  conditions: string[];
}

interface CategoryMenuFiltersProps {
  onFiltersChange?: (filters: Record<string, string>) => void;
}

/**
 * 카테고리 메뉴 필터 컴포넌트
 * @param onFiltersChange - 필터 변경 시 호출되는 콜백 함수
 */
export function CategoryMenuFilters({ onFiltersChange }: CategoryMenuFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 필터 옵션 정의
  const filterOptions: CategoryFilterOptions = {
    brands: ['삼성', '애플', 'LG', '샤오미', '구글', '소니', '화웨이'],
    priceRanges: [
      '10만원 이하',
      '10만원대',
      '20만원대',
      '30만원대',
      '40만원대',
      '50만원대',
      '60만원대',
      '70만원대',
      '80만원대',
      '90만원대',
      '100만원 이상'
    ],
    features: ['5G', '무선충전', '방수', '고화질카메라', '대용량배터리', '빠른충전'],
    conditions: ['새제품', '리퍼제품', '중고A급', '중고B급']
  };

  // 현재 적용된 필터 상태
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({
    brand: 'all',
    priceRange: 'all',
    feature: 'all',
    condition: 'all'
  });

  // 필터 표시 상태
  const [showFilters, setShowFilters] = useState(false);

  /**
   * URL 쿼리 파라미터에서 필터 초기화
   */
  useEffect(() => {
    const filters: Record<string, string> = {
      brand: searchParams.get('brand') || 'all',
      priceRange: searchParams.get('priceRange') || 'all',
      feature: searchParams.get('feature') || 'all',
      condition: searchParams.get('condition') || 'all'
    };
    setCurrentFilters(filters);
  }, [searchParams]);

  /**
   * 필터 변경 처리
   */
  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = {
      ...currentFilters,
      [filterType]: value
    };
    
    setCurrentFilters(newFilters);
    updateURL(newFilters);
    onFiltersChange?.(newFilters);
  };

  /**
   * URL 업데이트
   */
  const updateURL = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    router.push(`?${params.toString()}`);
  };

  /**
   * 개별 필터 제거
   */
  const removeFilter = (filterType: string) => {
    handleFilterChange(filterType, 'all');
  };

  /**
   * 모든 필터 초기화
   */
  const clearAllFilters = () => {
    const emptyFilters = {
      brand: 'all',
      priceRange: 'all',
      feature: 'all',
      condition: 'all'
    };
    
    setCurrentFilters(emptyFilters);
    updateURL(emptyFilters);
    onFiltersChange?.(emptyFilters);
  };

  /**
   * 활성 필터 개수 계산
   */
  const getActiveFilterCount = () => {
    return Object.values(currentFilters).filter(value => value !== 'all').length;
  };

  /**
   * 활성 필터 배지 생성
   */
  const getActiveFilterBadges = () => {
    const badges: { key: string; label: string; value: string }[] = [];
    
    if (currentFilters.brand && currentFilters.brand !== 'all') {
      badges.push({ key: 'brand', label: '브랜드', value: currentFilters.brand });
    }
    if (currentFilters.priceRange && currentFilters.priceRange !== 'all') {
      badges.push({ key: 'priceRange', label: '가격대', value: currentFilters.priceRange });
    }
    if (currentFilters.feature && currentFilters.feature !== 'all') {
      badges.push({ key: 'feature', label: '기능', value: currentFilters.feature });
    }
    if (currentFilters.condition && currentFilters.condition !== 'all') {
      badges.push({ key: 'condition', label: '상태', value: currentFilters.condition });
    }
    
    return badges;
  };

  return (
    <div className="space-y-4">
      {/* 필터 토글 버튼 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          필터
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            전체 해제
          </Button>
        )}
      </div>

      {/* 활성 필터 배지 */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilterBadges().map((badge) => (
            <Badge
              key={badge.key}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              <span className="text-xs text-gray-600">{badge.label}:</span>
              <span>{badge.value}</span>
              <button
                onClick={() => removeFilter(badge.key)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 필터 선택 영역 */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* 브랜드 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">브랜드</label>
              <Select
                value={currentFilters.brand}
                onValueChange={(value) => handleFilterChange('brand', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="브랜드 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가격대 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가격대</label>
              <Select
                value={currentFilters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="가격대 선택" />
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

            {/* 기능 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">주요 기능</label>
              <Select
                value={currentFilters.feature}
                onValueChange={(value) => handleFilterChange('feature', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기능 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.features.map((feature) => (
                    <SelectItem key={feature} value={feature}>
                      {feature}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상태 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">상품 상태</label>
              <Select
                value={currentFilters.condition}
                onValueChange={(value) => handleFilterChange('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
