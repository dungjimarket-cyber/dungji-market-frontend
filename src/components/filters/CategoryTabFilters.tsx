'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
type MainCategory = 'phone' | 'internet' | 'internet_tv';

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
    manufacturers: string[];
    carriers: string[];
    subscriptionTypes: string[];
    plans: string[];
  };
  internet: {
    carriers: string[];
    subscriptionTypes: string[];
    speeds: string[];
  };
  internet_tv: {
    carriers: string[];
    subscriptionTypes: string[];
    speeds: string[];
  };
}

interface CategoryTabFiltersProps {
  initialCategory?: MainCategory;
  onFiltersChange?: (filters: Record<string, string>) => void;
  onCategoryChange?: (category: MainCategory) => void;
}

/**
 * 카테고리 탭 기반 필터 컴포넌트
 */
export function CategoryTabFilters({ initialCategory, onFiltersChange, onCategoryChange }: CategoryTabFiltersProps) {
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
      id: 'internet_tv',
      name: '인터넷+TV',
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ];

  // 카테고리별 필터 옵션
  const filterOptions: CategoryFilterOptions = {
    phone: {
      manufacturers: ['삼성', '애플'],
      carriers: ['SKT', 'KT', 'LG U+'],
      subscriptionTypes: ['기기변경', '번호이동', '신규가입'],
      plans: ['5만원대', '6만원대', '7만원대', '8만원대', '9만원대', '10만원이상']
    },
    internet: {
      carriers: ['SK', 'KT', 'LG U+'],
      subscriptionTypes: ['통신사이동', '신규가입'],
      speeds: ['100M', '200M', '500M', '1G', '2.5G']
    },
    internet_tv: {
      carriers: ['SK', 'KT', 'LG U+'],
      subscriptionTypes: ['통신사이동', '신규가입'],
      speeds: ['100M', '200M', '500M', '1G', '2.5G']
    }
  };

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<MainCategory>(
    initialCategory || (searchParams.get('category') as MainCategory) || 'phone'
  );
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  /**
   * URL 파라미터에서 카테고리와 필터 초기화
   */
  useEffect(() => {
    const category = initialCategory || (searchParams.get('category') as MainCategory) || 'phone';
    console.log('URL에서 카테고리 로드:', category);
    
    setSelectedCategory(category);

    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'category') {
        filters[key] = value;
      }
    });
    setCurrentFilters(filters);
  }, [searchParams, initialCategory]);

  // 카테고리 변경 중인지 추적하는 ref
  const categoryChangingRef = useRef(false);

  /**
   * 카테고리 변경 처리
   */
  const handleCategoryChange = (category: MainCategory) => {
    console.log('카테고리 클릭:', category);
    
    // 이미 선택된 카테고리이거나 변경 중인 경우 무시
    if (selectedCategory === category || categoryChangingRef.current) {
      console.log('이미 선택된 카테고리 또는 변경 중, 무시');
      return;
    }
    
    // 변경 중 플래그 설정
    categoryChangingRef.current = true;
    
    setSelectedCategory(category);
    
    // 카테고리 변경 시 기존 필터 초기화
    const newFilters: Record<string, string> = { category };
    setCurrentFilters(newFilters);
    
    // URL 업데이트만 하고 콜백은 호출하지 않음 (URL 변경이 자동으로 트리거)
    updateURL({ category }, true);
    
    // 변경 완료 후 플래그 해제
    setTimeout(() => {
      categoryChangingRef.current = false;
    }, 300);
  };

  // 디바운싱을 위한 ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 필터 변경 처리 (디바운싱 적용)
   */
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    console.log('필터 변경:', filterType, value);
    
    const newFilters = {
      ...currentFilters,
      [filterType]: value
    };
    
    // 즉시 UI 업데이트
    setCurrentFilters(newFilters);
    
    // 디바운싱 적용 (300ms)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      updateURL(newFilters);
      onFiltersChange?.(newFilters);
    }, 300);
  }, [currentFilters, onFiltersChange]);

  // 컴포넌트 언마운트 시 디바운싱 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * URL 업데이트
   */
  const updateURL = (filters: Record<string, string>, categoryChanged = false) => {
    const params = new URLSearchParams();
    
    // 카테고리 설정 (카테고리 변경 시에만 설정)
    if (categoryChanged && filters.category) {
      params.set('category', filters.category);
    } else if (!categoryChanged) {
      params.set('category', selectedCategory);
    }
    
    // 필터 설정
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'category' && value && value !== 'all') {
        params.set(key, value);
      }
    });
    
    const newUrl = `?${params.toString()}`;
    console.log('URL 업데이트:', newUrl);
    router.push(newUrl);
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
            {/* 제조사 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">제조사</label>
              <Select
                value={currentFilters.manufacturer || 'all'}
                onValueChange={(value) => handleFilterChange('manufacturer', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="제조사 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  {filterOptions.phone.carriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가입유형 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가입유형</label>
              <Select
                value={currentFilters.subscriptionType || 'all'}
                onValueChange={(value) => handleFilterChange('subscriptionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="가입유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.subscriptionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 요금제 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">요금제</label>
              <Select
                value={currentFilters.plan || 'all'}
                onValueChange={(value) => handleFilterChange('plan', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="요금제 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.phone.plans.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'internet':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* 가입유형 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가입유형</label>
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

            {/* 인터넷 속도 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">인터넷속도</label>
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
          </div>
        );

      case 'internet_tv':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {filterOptions.internet_tv.carriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가입유형 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">가입유형</label>
              <Select
                value={currentFilters.subscriptionType || 'all'}
                onValueChange={(value) => handleFilterChange('subscriptionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="가입유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.internet_tv.subscriptionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 인터넷 속도 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">인터넷속도</label>
              <Select
                value={currentFilters.speed || 'all'}
                onValueChange={(value) => handleFilterChange('speed', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="속도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterOptions.internet_tv.speeds.map((speed) => (
                    <SelectItem key={speed} value={speed}>
                      {speed}
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
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                isSelected 
                  ? `${category.color} bg-white border-2 font-semibold cursor-default` 
                  : `hover:${category.bgColor} hover:border-current cursor-pointer`
              }`}
              onClick={() => handleCategoryChange(category.id)}
              disabled={isSelected || categoryChangingRef.current} // 이미 선택된 카테고리나 변경 중인 경우 비활성화
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