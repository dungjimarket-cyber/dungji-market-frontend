'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MapPinIcon } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
  }
}

interface DaumPostcodeData {
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
  zonecode: string;
  sido: string;
  sigungu: string;
  roadAddress: string;
  jibunAddress: string;
}

interface DaumPostcodeSearchProps {
  onComplete: (data: {
    sido: string;
    sigungu: string;
    fullAddress: string;
    zonecode: string;
  }) => void;
  buttonText?: string;
  multiple?: boolean;
  maxSelections?: number;
}

/**
 * 다음 주소 검색 컴포넌트
 * @param onComplete - 주소 선택 완료 시 호출되는 콜백
 * @param buttonText - 버튼 텍스트
 * @param multiple - 다중 선택 여부
 * @param maxSelections - 최대 선택 가능 개수
 */
export default function DaumPostcodeSearch({ 
  onComplete, 
  buttonText = '주소 검색',
  multiple = false,
  maxSelections = 1 
}: DaumPostcodeSearchProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // 이미 스크립트가 로드되어 있는지 확인
    if (window.daum && window.daum.Postcode) {
      scriptLoaded.current = true;
      return;
    }

    // 다음 주소 검색 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (재사용을 위해)
    };
  }, []);

  const handleClick = () => {
    if (!scriptLoaded.current || !window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: DaumPostcodeData) {
        // 시도명과 시군구명 추출
        const sido = data.sido;
        const sigungu = data.sigungu;
        const fullAddress = data.roadAddress || data.jibunAddress;
        const zonecode = data.zonecode;

        // 콜백 호출
        onComplete({
          sido,
          sigungu,
          fullAddress,
          zonecode
        });
      },
      theme: {
        bgColor: "#FFFFFF",
        searchBgColor: "#6366F1",
        contentBgColor: "#FFFFFF",
        pageBgColor: "#FAFAFA",
        textColor: "#333333",
        queryTextColor: "#FFFFFF",
        postcodeTextColor: "#6366F1",
        emphTextColor: "#6366F1",
        outlineColor: "#E5E7EB"
      },
      width: '100%',
      height: '100%'
    }).open({
      // 모바일에서는 팝업으로, PC에서는 레이어로 띄우기
      popupKey: 'dungjiPostcodePopup',
      left: (window.screen.width / 2) - 250,
      top: (window.screen.height / 2) - 300
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="w-full"
    >
      <MapPinIcon className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  );
}