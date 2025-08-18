'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Smartphone, Wifi, Monitor } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 대분류 카테고리 정의
type MainCategory = 'phone' | 'internet' | 'electronics';

interface MainCategoryItem {
  id: MainCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

// 카테고리별 필터 옵션 정의
interface CategoryFilterOptions {
  phone: {
    brands: string[];
    priceRanges: string[];
    features: string[];
    conditions: string[];
  };
  internet: {
    carriers: string[];
    subscriptionTypes: string[];
    speeds: string[];
    regions: string[];
  };
  electronics: {
    categories: string[];
    brands: string[];
    priceRanges: string[];
    conditions: string[];
  };
}

interface CategoryTabFiltersProps {
  onFiltersChange?: (filters: Record<string, string>) => void;
  onCategoryChange?: (category: MainCategory) => void;
}

/**
 * 카테고리 탭 기반 필터 컴포넌트
 */
export function CategoryTabFilters({ onFiltersChange, onCategoryChange }: CategoryTabFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 대분류 카테고리 설정
  const mainCategories: MainCategoryItem[] = [
    {
      id: 'phone',
      name: '휴대폰',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'internet',
      name: '인터넷',
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    },
    {
      id: 'electronics',
      name: '전자제품',
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ];

  // 카테고리별 필터 옵션
  const filterOptions: CategoryFilterOptions = {
    phone: {
      brands: ['삼성', '애플', 'LG', '샤오미', '구글', '소니', '화웨이', '오포', '비보'],
      priceRanges: [
        '10만원 이하', '10만원대', '20만원대', '30만원대', '40만원대',
        '50만원대', '60만원대', '70만원대', '80만원대', '90만원대', '100만원 이상'
      ],
      features: ['5G', '무선충전', '방수', '고화질카메라', '대용량배터리', '빠른충전'],
      conditions: ['새제품', '리퍼제품', '중고A급', '중고B급']
    },
    internet: {
      carriers: ['SKT', 'KT', 'LGU+', 'MVNO'],
      subscriptionTypes: ['신규', '번호이동', '기기변경'],
      speeds: ['100Mbps', '500Mbps', '1Gbps', '5Gbps', '10Gbps'],
      regions: ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
    },
    electronics: {
      categories: ['TV', '냉장고', '세탁기', '에어컨', '청소기', '오디오', '게임기', '카메라'],
      brands: ['삼성', 'LG', '소니', '파나소닉', '다이슨', '필립스', '샤프', '하이어'],
      priceRanges: [
        '10만원 이하', '10-30만원', '30-50만원', '50-100만원',
        '100-200만원', '200-300만원', '300만원 이상'
      ],
      conditions: ['새제품', '리퍼제품', '전시상품', '중고A급', '중고B급']
    }
  };

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<MainCategory>('phone');
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  /**
   * URL 파라미터에서 카테고리와 필터 초기화
   */
  useEffect(() => {
    const category = (searchParams.get('category') as MainCategory) || 'phone';
    setSelectedCategory(category);

    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'category') {
        filters[key] = value;
      }
    });
    setCurrentFilters(filters);
  }, [searchParams]);

  /**
   * 카테고리 변경 처리
   */
  const handleCategoryChange = (category: MainCategory) => {
    setSelectedCategory(category);
    
    // 카테고리 변경 시 기존 필터 초기화
    const newFilters: Record<string, string> = {};
    setCurrentFilters(newFilters);
    
    // URL 업데이트
    updateURL({ category }, true);
    onCategoryChange?.(category);
    onFiltersChange?.(newFilters);
  };

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
  const updateURL = (filters: Record<string, string>, categoryChanged = false) => {
    const params = new URLSearchParams();
    
    // 카테고리 설정
    params.set('category', selectedCategory);
    
    // 필터 설정
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'category' && value && value !== 'all') {
        params.set(key, value);
      }
    });
    
    router.push(`?${params.toString()}`);
  };

  /**
   * 개별 필터 제거
   */
  const removeFilter = (filterType: string) => {
    const newFilters = { ...currentFilters };
    delete newFilters[filterType];
    setCurrentFilters(newFilters);
    updateURL(newFilters);
    onFiltersChange?.(newFilters);
  };

  /**
   * 모든 필터 초기화
   */
  const clearAllFilters = () => {
    setCurrentFilters({});
    updateURL({});
    onFiltersChange?.({});
  };

  /**
   * 활성 필터 개수 계산
   */
  const getActiveFilterCount = () => {
    return Object.keys(currentFilters).filter(key => currentFilters[key] && currentFilters[key] !== 'all').length;
  };

  /**
   * 현재 카테고리의 필터 렌더링
   */
  const renderCategoryFilters = () => {
    switch (selectedCategory) {
      case 'phone':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 브랜드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">브랜드</label>
              <Select
                value={currentFilters.brand || 'all'}
                onValueChange={(value) => handleFilterChange('brand', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="브랜드 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가격대 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가격대</label>
              <Select
                value={currentFilters.priceRange || 'all'}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="가격대 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.priceRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 주요 기능 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">주요 기능</label>
              <Select
                value={currentFilters.feature || 'all'}
                onValueChange={(value) => handleFilterChange('feature', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기능 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.features.map((feature) => (
                    <SelectItem key={feature} value={feature}>
                      {feature}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상품 상태 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">상품 상태</label>
              <Select
                value={currentFilters.condition || 'all'}
                onValueChange={(value) => handleFilterChange('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'internet':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 통신사 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">통신사</label>
              <Select
                value={currentFilters.carrier || 'all'}
                onValueChange={(value) => handleFilterChange('carrier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="통신사 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.internet.carriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가입 유형 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가입 유형</label>
              <Select
                value={currentFilters.subscriptionType || 'all'}
                onValueChange={(value) => handleFilterChange('subscriptionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="가입유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.internet.subscriptionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 속도 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">인터넷 속도</label>
              <Select
                value={currentFilters.speed || 'all'}
                onValueChange={(value) => handleFilterChange('speed', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="속도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.internet.speeds.map((speed) => (
                    <SelectItem key={speed} value={speed}>
                      {speed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 지역 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">지역</label>
              <Select
                value={currentFilters.region || 'all'}
                onValueChange={(value) => handleFilterChange('region', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.internet.regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'electronics':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 카테고리 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">제품 분류</label>
              <Select
                value={currentFilters.subCategory || 'all'}
                onValueChange={(value) => handleFilterChange('subCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="분류 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.electronics.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 브랜드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">브랜드</label>
              <Select
                value={currentFilters.brand || 'all'}
                onValueChange={(value) => handleFilterChange('brand', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="브랜드 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.electronics.brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가격대 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가격대</label>
              <Select
                value={currentFilters.priceRange || 'all'}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="가격대 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.electronics.priceRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상품 상태 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">상품 상태</label>
              <Select
                value={currentFilters.condition || 'all'}
                onValueChange={(value) => handleFilterChange('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.electronics.conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 대분류 탭 */}
      <div className="flex flex-wrap gap-2">
        {mainCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              className={`flex items-center gap-2 px-4 py-2 ${
                isSelected 
                  ? `${category.color} bg-white border-2` 
                  : `hover:${category.bgColor} hover:border-current`
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* 필터 토글 및 초기화 */}
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
          {Object.entries(currentFilters).map(([key, value]) => {
            if (!value || value === 'all') return null;
            
            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <span>{value}</span>
                <button
                  onClick={() => removeFilter(key)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* 필터 선택 영역 */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            {renderCategoryFilters()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}