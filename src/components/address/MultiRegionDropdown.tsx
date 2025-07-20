'use client';

import { useState } from 'react';
import RegionDropdown from './RegionDropdown';
import { X, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SelectedRegion {
  province: string;
  city: string;
}

interface MultiRegionDropdownProps {
  maxSelections?: number;
  onSelectionChange: (regions: SelectedRegion[]) => void;
  selectedRegions?: SelectedRegion[];
}

/**
 * 다중 지역 선택 드롭다운 컴포넌트
 * RegionDropdown을 사용하여 여러 지역을 선택할 수 있도록 함
 */
export default function MultiRegionDropdown({
  maxSelections = 3,
  onSelectionChange,
  selectedRegions = []
}: MultiRegionDropdownProps) {
  const [regions, setRegions] = useState<SelectedRegion[]>(selectedRegions);
  const [currentProvince, setCurrentProvince] = useState('');
  const [currentCity, setCurrentCity] = useState('');

  const handleAddRegion = () => {
    if (!currentProvince || !currentCity) {
      alert('시/도와 시/군/구를 모두 선택해주세요.');
      return;
    }

    // 중복 확인
    const isDuplicate = regions.some(
      region => region.province === currentProvince && region.city === currentCity
    );

    if (isDuplicate) {
      alert('이미 선택된 지역입니다.');
      return;
    }

    // 최대 선택 개수 확인
    if (regions.length >= maxSelections) {
      alert(`최대 ${maxSelections}개 지역까지 선택 가능합니다.`);
      return;
    }

    const newRegion: SelectedRegion = {
      province: currentProvince,
      city: currentCity
    };

    const updatedRegions = [...regions, newRegion];
    setRegions(updatedRegions);
    onSelectionChange(updatedRegions);

    // 입력 초기화
    setCurrentProvince('');
    setCurrentCity('');
  };

  const handleRemoveRegion = (index: number) => {
    const updatedRegions = regions.filter((_, i) => i !== index);
    setRegions(updatedRegions);
    onSelectionChange(updatedRegions);
  };

  const handleRegionSelect = (province: string, city: string) => {
    setCurrentProvince(province);
    setCurrentCity(city);
  };

  return (
    <div className="space-y-4">
      {/* 지역 선택 드롭다운 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <RegionDropdown
              selectedProvince={currentProvince}
              selectedCity={currentCity}
              onSelect={handleRegionSelect}
            />
          </div>
          <Button
            type="button"
            onClick={handleAddRegion}
            disabled={!currentProvince || !currentCity || regions.length >= maxSelections}
            className="px-4"
          >
            추가
          </Button>
        </div>
      </div>

      {/* 선택된 지역 목록 */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">선택된 지역</div>
          <div className="flex flex-wrap gap-2">
            {regions.map((region, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1.5 flex items-center gap-2"
              >
                <MapPin className="h-3 w-3" />
                <span>{region.province} {region.city}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(index)}
                  className="ml-1 hover:text-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {regions.length}/{maxSelections}개 선택됨
          </p>
        </div>
      )}
    </div>
  );
}