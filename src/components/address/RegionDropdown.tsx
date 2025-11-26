'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { regions } from '@/lib/regions';

interface RegionDropdownProps {
  selectedProvince?: string;
  selectedCity?: string;
  onSelect: (province: string, city: string) => void;
  required?: boolean;
  className?: string;
}

export default function RegionDropdown({ 
  selectedProvince = '', 
  selectedCity = '', 
  onSelect, 
  required = false,
  className = ''
}: RegionDropdownProps) {
  const [province, setProvince] = useState(selectedProvince);
  const [city, setCity] = useState(selectedCity);
  const [cities, setCities] = useState<string[]>([]);

  // 선택된 시/도에 따른 시/군/구 목록 업데이트
  useEffect(() => {
    if (province) {
      const provinceData = regions.find(r => r.name === province);
      if (provinceData) {
        setCities(provinceData.cities);
      }
    } else {
      setCities([]);
    }
  }, [province]);

  // props 변경 시 상태 업데이트 및 부모에게 알림
  useEffect(() => {
    if (selectedProvince !== province) {
      setProvince(selectedProvince);
    }
    if (selectedCity !== city) {
      setCity(selectedCity);
    }
    // props로 둘 다 있으면 부모에게 알림 (초기 로드 시)
    if (selectedProvince && selectedCity && selectedProvince !== '' && selectedCity !== '') {
      onSelect(selectedProvince, selectedCity);
    }
  }, [selectedProvince, selectedCity]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value;
    setProvince(newProvince);
    setCity(''); // 시/도 변경 시 시/군/구 초기화
    if (!newProvince) {
      onSelect('', '');
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setCity(newCity);
    if (province && newCity) {
      onSelect(province, newCity);
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div className="relative">
        <select
          value={province}
          onChange={handleProvinceChange}
          required={required}
          className="appearance-none rounded-md w-full px-3 py-2 pr-8 border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">시/도 선택</option>
          {regions.map((region) => (
            <option key={region.name} value={region.name}>
              {region.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={city}
          onChange={handleCityChange}
          required={required && !!province}
          disabled={!province}
          className="appearance-none rounded-md w-full px-3 py-2 pr-8 border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">시/군/구 선택</option>
          {cities.map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}