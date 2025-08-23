'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Smartphone, Wifi, Monitor } from 'lucide-react';

// 대분류 카테고리 정의
type MainCategory = 'all' | 'phone' | 'internet' | 'internet_tv';

interface MainCategoryItem {
  id: MainCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
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
      id: 'all' as MainCategory,
      name: '전체',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200'
    },
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

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<MainCategory>(
    initialCategory || (searchParams.get('category') as MainCategory) || 'phone'
  );

  /**
   * URL 파라미터에서 카테고리 초기화
   */
  useEffect(() => {
    const category = initialCategory || (searchParams.get('category') as MainCategory) || 'phone';
    console.log('URL에서 카테고리 로드:', category);
    
    setSelectedCategory(category);
  }, [searchParams, initialCategory]);

  // 카테고리 변경 중인지 추적하는 ref
  const categoryChangingRef = useRef(false);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 카테고리 변경 처리
   */
  const handleCategoryChange = (category: MainCategory) => {
    console.log('카테고리 클릭:', category);
    
    // 이미 선택된 카테고리인 경우 무시
    if (selectedCategory === category) {
      console.log('이미 선택된 카테고리, 무시');
      return;
    }
    
    // 변경 중 플래그 확인
    if (categoryChangingRef.current) {
      console.log('카테고리 변경 중, 무시');
      return;
    }
    
    // 이전 타임아웃이 있으면 취소
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    // 변경 중 플래그 설정
    categoryChangingRef.current = true;
    
    setSelectedCategory(category);
    
    // 카테고리 변경 시 URL 업데이트 및 콜백 호출
    const params = new URLSearchParams();
    params.set('category', category);
    
    const newUrl = `?${params.toString()}`;
    console.log('URL 업데이트:', newUrl);
    router.push(newUrl);
    
    onFiltersChange?.({ category });
    onCategoryChange?.(category);
    
    // 변경 완료 후 플래그 해제 (더 짧은 시간으로 조정)
    changeTimeoutRef.current = setTimeout(() => {
      categoryChangingRef.current = false;
      changeTimeoutRef.current = null;
    }, 50);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
        categoryChangingRef.current = false;
      }
    };
  }, []);

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
                  ? `${category.color} bg-white border-2 font-semibold` 
                  : `hover:${category.bgColor} hover:border-current`
              }`}
              onClick={() => handleCategoryChange(category.id)}
              disabled={false} // 버튼은 항상 활성화 상태로 유지
              style={{ cursor: isSelected ? 'default' : 'pointer' }}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}