'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ChevronDown, Clock, Home, X, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { normalizeRegion } from '@/lib/utils/keywordMapping';
import { regions } from '@/lib/regions';
import { useAuth } from '@/contexts/AuthContext';

interface RecentRegion {
  province: string;
  city: string;
  timestamp: number;
}

interface RecentSearch {
  keyword: string;
  timestamp: number;
}

interface UnifiedSearchBarProps {
  onSearchChange?: (search: string, region: string) => void;
}

/**
 * 통합 검색바 컴포넌트 - 검색어와 내지역 필터를 최상단에 제공
 */
export function UnifiedSearchBar({ onSearchChange }: UnifiedSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [showRecentRegions, setShowRecentRegions] = useState(false);
  const [recentRegions, setRecentRegions] = useState<RecentRegion[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

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

  // 최근 본 지역 로드
  useEffect(() => {
    const stored = localStorage.getItem('recentRegions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentRegions(parsed);
      } catch (error) {
        console.error('최근 지역 로드 실패:', error);
      }
    }
  }, []);

  // 최근 검색어 로드
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
      } catch (error) {
        console.error('최근 검색어 로드 실패:', error);
      }
    }
  }, []);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecentRegions(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 최근 본 지역 저장
  const saveRecentRegion = (province: string, city: string) => {
    if (!province) return;

    const newRegion: RecentRegion = {
      province,
      city: city || '',
      timestamp: Date.now()
    };

    let recent = [...recentRegions];
    
    // 중복 제거
    recent = recent.filter(r => 
      !(r.province === province && r.city === city)
    );
    
    // 맨 앞에 추가
    recent.unshift(newRegion);
    
    // 5개만 유지
    recent = recent.slice(0, 5);
    
    setRecentRegions(recent);
    localStorage.setItem('recentRegions', JSON.stringify(recent));
  };

  // 최근 검색어 저장
  const saveRecentSearch = (keyword: string) => {
    if (!keyword || !keyword.trim()) return;

    const newSearch: RecentSearch = {
      keyword: keyword.trim(),
      timestamp: Date.now()
    };

    let recent = [...recentSearches];
    
    // 중복 제거
    recent = recent.filter(s => s.keyword !== keyword.trim());
    
    // 맨 앞에 추가
    recent.unshift(newSearch);
    
    // 5개만 유지
    recent = recent.slice(0, 5);
    
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  };

  // 검색 실행
  const handleSearch = () => {
    // 검색어는 그대로 사용 (영어/한글 변환 제거)
    const searchTerms = searchQuery;
    
    // 검색어 저장
    if (searchTerms) {
      saveRecentSearch(searchTerms);
    }
    
    // 지역 조합
    let regionStr = '';
    if (selectedProvince && selectedCity) {
      regionStr = `${selectedProvince} ${selectedCity}`;
      // 최근 지역 저장
      saveRecentRegion(selectedProvince, selectedCity);
    } else if (selectedProvince) {
      regionStr = selectedProvince;
      // 최근 지역 저장
      saveRecentRegion(selectedProvince, '');
    }
    
    // 원본 지역명 그대로 전달 (확장 없이)
    onSearchChange?.(searchTerms, regionStr);
    
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
    setShowRecentSearches(false);
  };

  // 검색어 입력 처리 (실시간 검색 제거, 값만 업데이트)
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
  };
  
  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 초기화
  const handleReset = () => {
    setSearchQuery('');
    setSelectedProvince('');
    setSelectedCity('');
    
    // 모든 필터 제거 - 완전히 초기 상태로
    router.push('/group-purchases');
    
    // 전체 공구 표시
    onSearchChange?.('', '');
  };

  // 시/도 변경 처리
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value;
    setSelectedProvince(province);
    setSelectedCity(''); // 시/도 변경 시 시/군/구 초기화
    
    // 지역 변경 시 즉시 검색 실행
    const searchTerms = searchQuery; // 검색어 그대로 사용
    
    if (province) {
      console.log(`시/도 선택: ${province}`);
      
      // 원본 지역명 그대로 전달 (확장 없이)
      onSearchChange?.(searchTerms, province);
      
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('region', province);
      router.push(`?${params.toString()}`);
      
      // 시/도만 선택해도 최근 지역 저장
      saveRecentRegion(province, '');
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
        
        // 원본 지역명 그대로 전달 (확장 없이)
        onSearchChange?.(searchTerms, regionStr);
        
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        params.set('region', regionStr);
        router.push(`?${params.toString()}`);
        
        // 최근 지역 저장
        saveRecentRegion(selectedProvince, city);
      } else {
        // 시/군/구 선택 해제 시 시/도만으로 검색
        onSearchChange?.(searchTerms, selectedProvince);
        
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        params.set('region', selectedProvince);
        router.push(`?${params.toString()}`);
        
        // 최근 지역 저장
        saveRecentRegion(selectedProvince, '');
      }
    }
  };

  // 내지역 버튼 클릭 (사용자 지역으로 설정 및 즉시 검색)
  const handleMyRegionClick = () => {
    if (!user || !user.address_region) {
      alert('로그인 후 지역 설정이 필요합니다. 마이페이지에서 지역을 설정해주세요.');
      return;
    }

    const region = user.address_region;
    console.log('내지역 설정:', region);

    // 지역 정보 파싱
    let province = '';
    let city = '';

    if (region.parent && region.name) {
      province = region.parent;
      city = region.name;
    } else if (region.full_name) {
      const parts = region.full_name.split(' ');
      if (parts.length >= 2) {
        province = parts[0];
        city = parts[1] || '';
      } else if (parts.length === 1) {
        province = parts[0];
      }
    } else if (region.name) {
      // name만 있는 경우 처리
      province = region.name;
    }

    if (!province) {
      alert('지역 정보를 확인할 수 없습니다. 마이페이지에서 지역을 다시 설정해주세요.');
      return;
    }

    // 드롭다운 설정
    setSelectedProvince(province);
    
    // 시/도가 변경되면 cities가 업데이트되므로 약간의 딜레이 후 city 설정
    setTimeout(() => {
      setSelectedCity(city);
      
      // 즉시 검색 실행
      const searchTerms = searchQuery;
      let regionStr = '';
      
      if (city) {
        regionStr = `${province} ${city}`;
      } else {
        regionStr = province;
      }
      
      // 최근 지역 저장
      saveRecentRegion(province, city);
      
      // 원본 지역명 그대로 전달 (확장 없이)
      onSearchChange?.(searchTerms, regionStr);
      
      // URL 업데이트
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('region', regionStr);
      router.push(`?${params.toString()}`);
    }, 100);
  };

  // 최근 지역 선택
  const handleRecentRegionSelect = (region: RecentRegion) => {
    // 현재 선택된 지역과 같은지 확인
    const isSameRegion = selectedProvince === region.province && selectedCity === region.city;
    
    setSelectedProvince(region.province);
    
    // 시/도가 변경되면 cities가 업데이트되므로 약간의 딜레이 후 city 설정
    setTimeout(() => {
      setSelectedCity(region.city);
      
      // 즉시 검색 실행
      const searchTerms = searchQuery;
      let regionStr = '';
      
      if (region.city) {
        regionStr = `${region.province} ${region.city}`;
      } else {
        regionStr = region.province;
      }
      
      // 같은 지역이어도 강제로 검색 실행 (타임스탬프 추가로 강제 갱신)
      if (isSameRegion) {
        // URL에 임시 파라미터를 추가했다가 제거하여 강제 갱신
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        params.set('region', regionStr);
        params.set('_t', Date.now().toString()); // 타임스탬프 추가
        router.push(`?${params.toString()}`);
        
        // 타임스탬프 제거하고 다시 설정
        setTimeout(() => {
          params.delete('_t');
          router.push(`?${params.toString()}`);
        }, 10);
      } else {
        // 다른 지역이면 일반적인 처리
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        params.set('region', regionStr);
        router.push(`?${params.toString()}`);
      }
      
      // 원본 지역명 그대로 전달 (확장 없이)
      onSearchChange?.(searchTerms, regionStr);
      
      // 드롭다운 닫기
      setShowRecentRegions(false);
    }, 100);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* 검색창 + 초기화 버튼 */}
        <div className="flex gap-2">
          {/* 통합 검색창 - 모바일: 75%, PC: 자동 확장 */}
          <div className="flex-1 relative" ref={searchDropdownRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="상품명, 브랜드, 키워드로 검색하세요..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowRecentSearches(true)}
              className="pl-10 pr-4 py-2 w-full"
            />
            
            {/* 최근 검색어 드롭다운 */}
            {showRecentSearches && recentSearches.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-gray-500 font-medium border-b">최근 검색어</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(search.keyword);
                      handleSearchInputChange(search.keyword);
                      setShowRecentSearches(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {search.keyword}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const filtered = recentSearches.filter(s => s.keyword !== search.keyword);
                        setRecentSearches(filtered);
                        localStorage.setItem('recentSearches', JSON.stringify(filtered));
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 검색 버튼 */}
          <Button 
            onClick={handleSearch} 
            variant="default"
            className="px-4 sm:px-6 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Search className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">검색</span>
          </Button>
          
          {/* 초기화 버튼 */}
          <Button 
            onClick={handleReset} 
            variant="ghost"
            className="px-3 sm:px-4 text-gray-600 hover:text-gray-800"
            title="검색 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* 지역 필터 - 시/도 + 시/군/구 + 내지역 버튼 (지도 아이콘 제거) */}
        <div className="flex items-center gap-2">
          
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
          
          {/* 내지역 버튼 */}
          <div className="relative" ref={dropdownRef}>
            <Button
              type="button"
              onClick={() => {
                if (recentRegions.length > 0) {
                  setShowRecentRegions(!showRecentRegions);
                } else {
                  handleMyRegionClick();
                }
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 whitespace-nowrap px-3 py-2"
              title={user?.address_region?.full_name || user?.address_region?.name || '지역 미설정'}
            >
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline">내지역</span>
              {recentRegions.length > 0 && (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
            
            {/* 최근 본 지역 드롭다운 */}
            {showRecentRegions && recentRegions.length > 0 && (
              <div className="absolute top-full mt-1 right-0 bg-white border rounded-lg shadow-lg z-50 min-w-[160px]">
                {/* 내 지역 */}
                {user?.address_region && (
                  <>
                    <button
                      onClick={() => {
                        handleMyRegionClick();
                        setShowRecentRegions(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                    >
                      <Home className="w-3 h-3 text-blue-500" />
                      <span>내 지역</span>
                      <span className="text-xs text-gray-500">
                        ({user.address_region.name || user.address_region.full_name})
                      </span>
                    </button>
                    <div className="border-t" />
                  </>
                )}
                
                {/* 최근 본 지역 */}
                <div className="px-3 py-1.5 text-xs text-gray-500 font-medium">최근 본 지역</div>
                {recentRegions.map((region, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentRegionSelect(region)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>
                      {region.city ? `${region.province} ${region.city}` : region.province}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}