'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  address: string;
  placeName?: string;
}

export default function KakaoMap({ address, placeName }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    console.log('[KakaoMap] 초기화 시작', {
      isScriptLoaded,
      hasKakao: !!window.kakao,
      hasMaps: !!(window.kakao?.maps),
      address,
      placeName
    });

    if (!isScriptLoaded || !window.kakao || !window.kakao.maps) {
      console.log('[KakaoMap] 스크립트 로딩 대기 중...');
      return;
    }

    const loadMap = () => {
      console.log('[KakaoMap] loadMap 함수 실행');

      if (!mapRef.current) {
        console.error('[KakaoMap] mapRef가 없습니다');
        return;
      }

      console.log('[KakaoMap] Geocoder 생성 시작');
      const geocoder = new window.kakao.maps.services.Geocoder();

      // 주소로 좌표 검색
      console.log('[KakaoMap] 주소 검색 시작:', address);
      geocoder.addressSearch(address, (result: any, status: any) => {
        console.log('[KakaoMap] 주소 검색 결과:', { status, result });

        if (status === window.kakao.maps.services.Status.OK) {
          console.log('[KakaoMap] ✅ 주소 검색 성공:', {
            address,
            lat: result[0].y,
            lng: result[0].x
          });

          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          // 지도 생성
          console.log('[KakaoMap] 지도 생성 중...');
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3,
          });
          console.log('[KakaoMap] ✅ 지도 생성 완료');

          // 마커 생성
          console.log('[KakaoMap] 마커 생성 중...');
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: coords,
          });
          console.log('[KakaoMap] ✅ 마커 생성 완료');

          // 인포윈도우 생성
          if (placeName) {
            console.log('[KakaoMap] 인포윈도우 생성 중:', placeName);
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;text-align:center;white-space:nowrap;">${placeName}</div>`,
            });
            infowindow.open(map, marker);
            console.log('[KakaoMap] ✅ 인포윈도우 생성 완료');
          }
        } else {
          console.error('[KakaoMap] ❌ 주소 검색 실패:', { status, address });
        }
      });
    };

    // kakao.maps.load 사용
    console.log('[KakaoMap] kakao.maps.load 실행');
    if (window.kakao.maps.load) {
      window.kakao.maps.load(loadMap);
    } else {
      loadMap();
    }
  }, [address, placeName, isScriptLoaded]);

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-slate-200 bg-slate-100"
      />
    </>
  );
}
