'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { expandSearchQuery, normalizeRegion, expandRegionSearch } from '@/lib/utils/keywordMapping';

interface UnifiedSearchBarProps {
  onSearchChange?: (search: string, region: string) => void;
}

/**
 * 통합 검색바 컴포넌트 - 검색어와 내지역 필터를 최상단에 제공
 */
export function UnifiedSearchBar({ onSearchChange }: UnifiedSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // 지역 옵션 (주요 시/도)
  const regions = [
    { value: 'all', label: '전체 지역' },
    { value: '서울특별시', label: '서울' },
    { value: '부산광역시', label: '부산' },
    { value: '대구광역시', label: '대구' },
    { value: '인천광역시', label: '인천' },
    { value: '광주광역시', label: '광주' },
    { value: '대전광역시', label: '대전' },
    { value: '울산광역시', label: '울산' },
    { value: '세종특별자치시', label: '세종' },
    { value: '경기도', label: '경기' },
    { value: '강원도', label: '강원' },
    { value: '충청북도', label: '충북' },
    { value: '충청남도', label: '충남' },
    { value: '전라북도', label: '전북' },
    { value: '전라남도', label: '전남' },
    { value: '경상북도', label: '경북' },
    { value: '경상남도', label: '경남' },
    { value: '제주특별자치도', label: '제주' }
  ];

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || 'all';
    setSearchQuery(search);
    setSelectedRegion(region);
  }, [searchParams]);

  // 검색 실행
  const handleSearch = () => {
    // 검색어 확장 (영어/한글 변형 포함)
    const expandedQueries = searchQuery ? expandSearchQuery(searchQuery) : [];
    const searchTerms = expandedQueries.length > 0 ? expandedQueries.join(',') : searchQuery;
    
    // 지역명 정규화 및 확장 (시/군/구 포함)
    let regionSearchTerms = '';
    if (selectedRegion !== 'all') {
      const normalizedRegion = normalizeRegion(selectedRegion);
      const expandedRegions = expandRegionSearch(selectedRegion);
      regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : normalizedRegion;
    }
    
    const filters = {
      search: searchTerms,
      region: regionSearchTerms
    };
    
    onSearchChange?.(searchTerms, regionSearchTerms);
    
    // URL 업데이트 (원본 검색어는 URL에 표시)
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    if (selectedRegion !== 'all') {
      params.set('region', selectedRegion); // URL에는 원본 표시
    } else {
      params.delete('region');
    }
    
    router.push(`?${params.toString()}`);
  };

  // 엔터 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 지역 변경 처리
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    
    // 검색어 확장 (영어/한글 변형 포함)
    const expandedQueries = searchQuery ? expandSearchQuery(searchQuery) : [];
    const searchTerms = expandedQueries.length > 0 ? expandedQueries.join(',') : searchQuery;
    
    // 지역명 정규화 및 확장 (시/군/구 포함)
    let regionSearchTerms = '';
    if (region !== 'all') {
      const normalizedRegion = normalizeRegion(region);
      const expandedRegions = expandRegionSearch(region);
      regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : normalizedRegion;
    }
    
    // 지역 변경 시 즉시 적용
    const filters = {
      search: searchTerms,
      region: regionSearchTerms
    };
    
    onSearchChange?.(searchTerms, regionSearchTerms);
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    if (region !== 'all') {
      params.set('region', region); // URL에는 원본 표시
    } else {
      params.delete('region');
    }
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 통합 검색창 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="상품명, 브랜드, 키워드 검색 (한글/영어 모두 가능)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>

        {/* 내지역 필터 */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <MapPin className="text-gray-400 w-4 h-4 flex-shrink-0" />
          <Select value={selectedRegion} onValueChange={handleRegionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="지역 선택" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 검색 버튼 */}
        <Button onClick={handleSearch} className="px-6 min-w-[80px]">
          검색
        </Button>
      </div>
    </div>
  );
}