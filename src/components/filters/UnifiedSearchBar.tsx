'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { normalizeRegion, expandRegionSearch } from '@/lib/utils/keywordMapping';
import { regions } from '@/lib/regions';

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
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  // 선택된 시/도에 따른 시/군/구 목록 업데이트
  useEffect(() => {
    if (selectedProvince) {
      const provinceData = regions.find(r => r.name === selectedProvince);
      if (provinceData) {
        setCities(provinceData.cities);
        // 도시가 선택되어 있지 않거나 현재 선택된 도시가 목록에 없으면 초기화
        if (!selectedCity || !provinceData.cities.includes(selectedCity)) {
          setSelectedCity('');
        }
      }
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedProvince]);

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || '';
    setSearchQuery(search);
    
    // 지역이 있으면 파싱 (예: "서울특별시 강남구")
    if (region && region.includes(' ')) {
      const [province, city] = region.split(' ');
      setSelectedProvince(province);
      setSelectedCity(city);
    } else if (region) {
      // 시/도만 있는 경우
      setSelectedProvince(region);
      setSelectedCity('');
    }
  }, [searchParams]);

  // 검색 실행
  const handleSearch = () => {
    // 검색어는 그대로 사용 (영어/한글 변환 제거)
    const searchTerms = searchQuery;
    
    // 지역 조합
    let regionStr = '';
    let regionSearchTerms = '';
    if (selectedProvince && selectedCity) {
      regionStr = `${selectedProvince} ${selectedCity}`;
      // 지역명 확장 검색
      const expandedRegions = expandRegionSearch(regionStr);
      regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : regionStr;
    } else if (selectedProvince) {
      regionStr = selectedProvince;
      const expandedRegions = expandRegionSearch(selectedProvince);
      regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : selectedProvince;
    }
    
    const filters = {
      search: searchTerms,
      region: regionSearchTerms
    };
    
    onSearchChange?.(searchTerms, regionSearchTerms);
    
    // URL 업데이트
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    if (regionStr) {
      params.set('region', regionStr); // URL에는 원본 표시
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

  // 시/도 변경 처리
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value;
    setSelectedProvince(province);
    setSelectedCity(''); // 시/도 변경 시 시/군/구 초기화
    
    // 지역 변경 시 즉시 검색 실행
    const searchTerms = searchQuery; // 검색어 그대로 사용
    
    if (province) {
      const expandedRegions = expandRegionSearch(province);
      console.log(`시/도 선택: ${province}, 확장된 지역: ${expandedRegions.length}개`, expandedRegions.slice(0, 5));
      const regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : province;
      
      onSearchChange?.(searchTerms, regionSearchTerms);
      
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('region', province);
      router.push(`?${params.toString()}`);
    } else {
      // 시/도 선택 해제 시 전체 검색
      onSearchChange?.(searchTerms, '');
      
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.delete('region');
      router.push(`?${params.toString()}`);
    }
  };

  // 시/군/구 변경 처리
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    
    // 지역 변경 시 즉시 검색 실행
    const searchTerms = searchQuery; // 검색어 그대로 사용
    
    if (selectedProvince) {
      if (city) {
        // 시/군/구가 선택된 경우
        const regionStr = `${selectedProvince} ${city}`;
        const expandedRegions = expandRegionSearch(regionStr);
        const regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : regionStr;
        
        onSearchChange?.(searchTerms, regionSearchTerms);
        
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        params.set('region', regionStr);
        router.push(`?${params.toString()}`);
      } else {
        // 시/군/구 선택 해제 시 시/도만으로 검색
        const expandedRegions = expandRegionSearch(selectedProvince);
        const regionSearchTerms = expandedRegions.length > 0 ? expandedRegions.join(',') : selectedProvince;
        
        onSearchChange?.(searchTerms, regionSearchTerms);
        
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        params.set('region', selectedProvince);
        router.push(`?${params.toString()}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* 검색창 + 검색 버튼 */}
        <div className="flex gap-2">
          {/* 통합 검색창 - 모바일: 75%, PC: 자동 확장 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="상품명, 브랜드, 키워드로 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          
          {/* 검색 버튼 - 모바일: 25%, PC: 자동 너비 */}
          <Button onClick={handleSearch} className="px-4 sm:px-6 w-[25%] sm:w-auto sm:min-w-[80px]">
            검색
          </Button>
        </div>

        {/* 내지역 필터 - 시/도 + 시/군/구 */}
        <div className="flex items-center gap-2">
          <MapPin className="text-gray-400 w-4 h-4 flex-shrink-0" />
          
          {/* 시/도 선택 */}
          <div className="relative flex-1">
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              className="appearance-none rounded-md w-full px-3 py-2 pr-8 border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">시/도 선택</option>
              {regions.map((region) => (
                <option key={region.name} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          
          {/* 시/군/구 선택 */}
          <div className="relative flex-1">
            <select
              value={selectedCity}
              onChange={handleCityChange}
              disabled={!selectedProvince}
              className="appearance-none rounded-md w-full px-3 py-2 pr-8 border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="">시/군/구 선택</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}