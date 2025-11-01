'use client';

import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    const loadKakaoMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.error('카카오맵 로드 실패');
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();

      // 주소로 좌표 검색
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          // 지도 생성
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3, // 확대 레벨
          });

          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: coords,
          });

          // 인포윈도우 생성 (장소명이 있으면)
          if (placeName) {
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;text-align:center;">${placeName}</div>`,
            });
            infowindow.open(map, marker);
          }
        } else {
          console.error('주소 검색 실패:', status);
        }
      });
    };

    // 카카오맵 스크립트 로드 확인
    if (window.kakao && window.kakao.maps) {
      loadKakaoMap();
    } else {
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(loadKakaoMap);
      };
      document.head.appendChild(script);
    }
  }, [address, placeName]);

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-lg border border-slate-200"
    />
  );
}
