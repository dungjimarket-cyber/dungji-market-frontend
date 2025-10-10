'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface AddressSearchProps {
  onComplete: (address: string) => void;
  buttonText?: string;
  className?: string;
}

declare global {
  interface Window {
    daum: any;
  }
}

export default function AddressSearch({ onComplete, buttonText = '주소 검색', className = '' }: AddressSearchProps) {
  useEffect(() => {
    // 카카오 주소 검색 API 스크립트 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleClick = () => {
    if (!window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 도로명 주소 우선, 없으면 지번 주소
        const fullAddress = data.roadAddress || data.jibunAddress;

        // 건물명이 있으면 추가
        let extraAddress = '';
        if (data.buildingName) {
          extraAddress = data.buildingName;
        }

        const finalAddress = extraAddress ? `${fullAddress} (${extraAddress})` : fullAddress;
        onComplete(finalAddress);
      },
      width: '100%',
      height: '100%'
    }).open();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <MapPin className="w-4 h-4" />
      {buttonText}
    </Button>
  );
}
