'use client';

import { useState } from 'react';
import DaumPostcodeSearch from './DaumPostcodeSearch';
import { X, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SelectedRegion {
  sido: string;
  sigungu: string;
  fullAddress: string;
  zonecode: string;
}

interface MultiRegionSelectorProps {
  maxSelections?: number;
  onSelectionChange: (regions: SelectedRegion[]) => void;
  selectedRegions?: SelectedRegion[];
}

/**
 * 다중 지역 선택 컴포넌트
 * @param maxSelections - 최대 선택 가능 개수 (기본값: 3)
 * @param onSelectionChange - 선택 변경 시 호출되는 콜백
 * @param selectedRegions - 선택된 지역 목록
 */
export default function MultiRegionSelector({
  maxSelections = 3,
  onSelectionChange,
  selectedRegions = []
}: MultiRegionSelectorProps) {
  const [regions, setRegions] = useState<SelectedRegion[]>(selectedRegions);

  const handleAddRegion = (data: {
    sido: string;
    sigungu: string;
    fullAddress: string;
    zonecode: string;
  }) => {
    // 중복 확인
    const isDuplicate = regions.some(
      region => region.sido === data.sido && region.sigungu === data.sigungu
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

    const newRegions = [...regions, data];
    setRegions(newRegions);
    onSelectionChange(newRegions);
  };

  const handleRemoveRegion = (index: number) => {
    const newRegions = regions.filter((_, i) => i !== index);
    setRegions(newRegions);
    onSelectionChange(newRegions);
  };

  return (
    <div className="space-y-4">
      {/* 선택된 지역 목록 */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              선택된 지역 ({regions.length}/{maxSelections})
            </p>
          </div>
          <div className="space-y-2">
            {regions.map((region, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">
                      {region.sido} {region.sigungu}
                    </p>
                    <p className="text-xs text-gray-500">{region.fullAddress}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 지역 추가 버튼 */}
      {regions.length < maxSelections && (
        <DaumPostcodeSearch
          onComplete={handleAddRegion}
          buttonText={regions.length > 0 ? '지역 추가' : '지역 선택'}
        />
      )}

      {/* 안내 메시지 */}
      {regions.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            <MapPin className="h-4 w-4 inline-block mr-1" />
            지역을 선택하면 해당 지역에 사는 사람들에게 공구가 노출됩니다.
          </p>
        </div>
      )}
    </div>
  );
}