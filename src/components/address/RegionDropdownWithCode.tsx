'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Region {
  code: string;
  name: string;
  full_name: string;
  level: number;
  parent_code?: string;
}

interface RegionDropdownWithCodeProps {
  selectedProvince?: string;
  selectedCity?: string;
  selectedCityCode?: string;
  onSelect: (province: string, city: string, cityCode: string) => void;
  required?: boolean;
  className?: string;
}

// 지역 데이터 캐싱
let cachedRegions: Region[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

export default function RegionDropdownWithCode({ 
  selectedProvince = '', 
  selectedCity = '',
  selectedCityCode = '',
  onSelect, 
  required = false,
  className = ''
}: RegionDropdownWithCodeProps) {
  const [province, setProvince] = useState(selectedProvince);
  const [city, setCity] = useState(selectedCity);
  const [cityCode, setCityCode] = useState(selectedCityCode);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);

  // props가 변경될 때 state 업데이트
  useEffect(() => {
    if (selectedProvince !== province) {
      setProvince(selectedProvince);
    }
    if (selectedCity !== city) {
      setCity(selectedCity);
    }
    if (selectedCityCode !== cityCode) {
      setCityCode(selectedCityCode);
    }
    
    // 시/도가 변경되었고 provinces가 로드되어 있으면 cities 업데이트
    if (selectedProvince && provinces.length > 0 && !cities.length) {
      const updateCities = async () => {
        const regions = await loadRegions();
        const selectedProvinceData = provinces.find(p => 
          p.name === selectedProvince || 
          p.full_name === selectedProvince
        );
        if (selectedProvinceData) {
          // parent_code로 하위 지역 찾기
          const cityList = regions.filter((r: Region) => 
            r.level === 1 && r.parent_code === selectedProvinceData.code
          );
          setCities(cityList);
          
          // 선택된 시/군/구가 있으면 해당 코드도 설정
          if (selectedCity && cityList.length > 0) {
            const matchedCity = cityList.find((c: Region) => 
              c.name === selectedCity || 
              c.full_name === selectedCity ||
              c.full_name?.includes(selectedCity)
            );
            if (matchedCity && !selectedCityCode) {
              setCityCode(matchedCity.code);
            }
          }
        }
      };
      updateCities();
    }
  }, [selectedProvince, selectedCity, selectedCityCode, provinces.length]);

  // 지역 데이터 로드 (캐싱 적용, 페이지네이션 처리)
  const loadRegions = async () => {
    const now = Date.now();

    // 캐시가 유효한 경우 캐시된 데이터 사용
    if (cachedRegions && (now - cacheTimestamp < CACHE_DURATION)) {
      return cachedRegions;
    }

    try {
      setLoading(true);
      // limit=1000으로 모든 지역 데이터 한번에 가져오기
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/?limit=1000`);
      if (response.ok) {
        const data = await response.json();
        // data가 배열이 아니라 객체일 수도 있음 (페이지네이션 응답)
        const regions = Array.isArray(data) ? data : data.results || [];
        cachedRegions = regions;
        cacheTimestamp = now;
        return regions;
      }
    } catch (error) {
      console.error('지역 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  // 컴포넌트 마운트 시 지역 데이터 로드
  useEffect(() => {
    const initRegions = async () => {
      const regions = await loadRegions();
      
      // 시/도 목록 추출 (level 0)
      const provinceList = regions.filter((r: Region) => r.level === 0);
      console.log('Province list:', provinceList);
      console.log('First province:', provinceList[0]);
      setProvinces(provinceList);
    };
    
    initRegions();
  }, []);

  // 선택된 시/도가 변경될 때 시/군/구 목록 로드
  useEffect(() => {
    if (!selectedProvince || provinces.length === 0) return;
    
    const loadCities = async () => {
      const regions = await loadRegions();
      const selectedProvinceData = provinces.find((p: Region) => 
        p.name === selectedProvince || 
        p.full_name === selectedProvince
      );
      
      if (selectedProvinceData) {
        // parent_code로 하위 지역 찾기
        const cityList = regions.filter((r: Region) => 
          r.level === 1 && r.parent_code === selectedProvinceData.code
        );
        setCities(cityList);
        
        // 선택된 시/군/구가 있으면 해당 아이템 찾기
        if (selectedCity) {
          // 코드가 있으면 코드로 매칭
          if (selectedCityCode) {
            const cityData = cityList.find((c: Region) => c.code === selectedCityCode);
            if (cityData) {
              setCity(cityData.name);
              setCityCode(cityData.code);
            }
          } else {
            // 코드가 없으면 이름으로 매칭
            const cityData = cityList.find((c: Region) => 
              c.name === selectedCity || 
              c.full_name === selectedCity ||
              c.full_name?.endsWith(selectedCity)
            );
            if (cityData) {
              setCity(cityData.name);
              setCityCode(cityData.code);
            }
          }
        }
      }
    };
    
    loadCities();
  }, [selectedProvince, selectedCity, selectedCityCode, provinces.length]);

  // 시/도 선택 시 시/군/구 목록 업데이트
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value;
    setProvince(newProvince);
    setCity('');
    setCityCode('');
    
    if (!newProvince) {
      setCities([]);
      onSelect('', '', '');
      return;
    }

    const regions = await loadRegions();
    const selectedProvinceData = provinces.find(p => p.name === newProvince);
    
    if (selectedProvinceData) {
      // parent_code로 하위 지역 찾기
      const cityList = regions.filter((r: Region) => 
        r.level === 1 && r.parent_code === selectedProvinceData.code
      );
      setCities(cityList);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCityCode = e.target.value;
    const selectedCityData = cities.find(c => c.code === selectedCityCode);
    
    if (selectedCityData) {
      setCity(selectedCityData.name);
      setCityCode(selectedCityData.code);
      onSelect(province, selectedCityData.name, selectedCityData.code);
    } else {
      setCity('');
      setCityCode('');
      onSelect(province, '', '');
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div className="relative">
        <select
          value={province}
          onChange={handleProvinceChange}
          required={required}
          disabled={loading}
          className="appearance-none rounded-md w-full px-3 py-2 pr-8 border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">시/도 선택</option>
          {provinces && provinces.length > 0 && provinces.map((region) => {
            if (!region || typeof region !== 'object') return null;
            return (
              <option key={region.code || ''} value={region.name || ''}>
                {String(region.name || '')}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={cityCode}
          onChange={handleCityChange}
          required={required && !!province}
          disabled={!province || loading}
          className="appearance-none rounded-md w-full px-3 py-2 pr-8 border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">시/군/구 선택</option>
          {cities && cities.length > 0 && cities.map((cityData) => {
            if (!cityData || typeof cityData !== 'object') return null;
            return (
              <option key={cityData.code || ''} value={cityData.code || ''}>
                {String(cityData.name || '')}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}