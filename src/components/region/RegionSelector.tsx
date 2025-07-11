import React, { useState, useEffect } from 'react';
import { getRegions, Region } from '@/lib/api/regionService';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface RegionSelectorProps {
  onChange: (region: Region | null) => void;
  value?: string | null;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/**
 * 지역 선택 컴포넌트
 * 시/도, 시/군/구, 읍/면/동 계층 구조로 지역을 선택할 수 있음
 */
const RegionSelector: React.FC<RegionSelectorProps> = ({
  onChange,
  value,
  label = '지역',
  placeholder = '지역을 선택하세요',
  className = '',
  required = false,
}) => {
  const [level1Regions, setLevel1Regions] = useState<Region[]>([]);
  const [level2Regions, setLevel2Regions] = useState<Region[]>([]);
  const [level3Regions, setLevel3Regions] = useState<Region[]>([]);
  
  const [selectedLevel1, setSelectedLevel1] = useState<string | null>(null);
  const [selectedLevel2, setSelectedLevel2] = useState<string | null>(null);
  const [selectedLevel3, setSelectedLevel3] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 시/도 목록 로드
  useEffect(() => {
    const fetchLevel1Regions = async () => {
      try {
        setLoading(true);
        setError(null);
        const regions = await getRegions({ level: 0 });
        setLevel1Regions(regions);
      } catch (err) {
        console.error('시/도 목록을 불러오는 중 오류가 발생했습니다:', err);
        setError('지역 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchLevel1Regions();
  }, []);

  // 시/군/구 목록 로드
  useEffect(() => {
    const fetchLevel2Regions = async () => {
      if (!selectedLevel1) {
        setLevel2Regions([]);
        return;
      }

      try {
        setLoading(true);
        const regions = await getRegions({ parent_code: selectedLevel1 });
        setLevel2Regions(regions);
      } catch (err) {
        console.error('시/군/구 목록을 불러오는 중 오류가 발생했습니다:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel2Regions();
  }, [selectedLevel1]);

  // 읍/면/동 목록 로드
  useEffect(() => {
    const fetchLevel3Regions = async () => {
      if (!selectedLevel2) {
        setLevel3Regions([]);
        return;
      }

      try {
        setLoading(true);
        const regions = await getRegions({ parent_code: selectedLevel2 });
        setLevel3Regions(regions);
      } catch (err) {
        console.error('읍/면/동 목록을 불러오는 중 오류가 발생했습니다:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel3Regions();
  }, [selectedLevel2]);

  // 시/도 선택 시
  const handleLevel1Change = (value: string) => {
    setSelectedLevel1(value);
    setSelectedLevel2(null);
    setSelectedLevel3(null);
    onChange(null);
  };

  // 시/군/구 선택 시
  const handleLevel2Change = (value: string) => {
    setSelectedLevel2(value);
    setSelectedLevel3(null);
    
    // 시/군/구까지만 선택한 경우에도 값을 전달
    const selectedRegion = level2Regions.find(region => region.code === value) || null;
    onChange(selectedRegion);
  };

  // 읍/면/동 선택 시
  const handleLevel3Change = (value: string) => {
    setSelectedLevel3(value);
    
    // 최종 선택된 지역 정보 전달
    const selectedRegion = level3Regions.find(region => region.code === value) || null;
    onChange(selectedRegion);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* 시/도 선택 */}
        <Select
          value={selectedLevel1 || ''}
          onValueChange={handleLevel1Change}
          disabled={loading || level1Regions.length === 0}
        >
          <SelectItem value="" disabled>
            시/도 선택
          </SelectItem>
          {level1Regions.map((region) => (
            <SelectItem key={region.code} value={region.code}>
              {region.name}
            </SelectItem>
          ))}
        </Select>

        {/* 시/군/구 선택 */}
        <Select
          value={selectedLevel2 || ''}
          onValueChange={handleLevel2Change}
          disabled={loading || !selectedLevel1 || level2Regions.length === 0}
        >
          <SelectItem value="" disabled>
            시/군/구 선택
          </SelectItem>
          {level2Regions.map((region) => (
            <SelectItem key={region.code} value={region.code}>
              {region.name}
            </SelectItem>
          ))}
        </Select>

        {/* 읍/면/동 선택 */}
        <Select
          value={selectedLevel3 || ''}
          onValueChange={handleLevel3Change}
          disabled={loading || !selectedLevel2 || level3Regions.length === 0}
        >
          <SelectItem value="" disabled>
            읍/면/동 선택
          </SelectItem>
          {level3Regions.map((region) => (
            <SelectItem key={region.code} value={region.code}>
              {region.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default RegionSelector;
