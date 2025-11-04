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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMapLoadedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // 스크립트가 로드되지 않았으면 대기
    if (!isScriptLoaded) {
      return;
    }

    // 이미 지도가 로드되었으면 리턴
    if (isMapLoadedRef.current) {
      return;
    }

    const loadMap = () => {
      // window.kakao가 없으면 재시도
      if (!window.kakao || !window.kakao.maps) {
        console.log('[KakaoMap] Kakao SDK not ready, retrying...');
        retryTimeoutRef.current = setTimeout(() => {
          loadMap();
        }, 100);
        return;
      }

      if (!mapRef.current) {
        console.log('[KakaoMap] Map ref not ready');
        return;
      }

      try {
        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.addressSearch(address, (result: any, status: any) => {
          if (!mapRef.current) {
            console.log('[KakaoMap] Map ref disappeared during geocoding');
            return;
          }

          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

            const map = new window.kakao.maps.Map(mapRef.current, {
              center: coords,
              level: 3,
            });

            const marker = new window.kakao.maps.Marker({
              map: map,
              position: coords,
            });

            if (placeName) {
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;text-align:center;white-space:nowrap;">${placeName}</div>`,
              });
              infowindow.open(map, marker);
            }

            isMapLoadedRef.current = true;
            setIsLoading(false);
            setError(null);
            console.log('[KakaoMap] Map loaded successfully');
          } else {
            console.error('[KakaoMap] Geocoding failed:', status);
            setError('주소를 찾을 수 없습니다');
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('[KakaoMap] Error loading map:', err);
        setError('지도를 불러오는 중 오류가 발생했습니다');
        setIsLoading(false);
      }
    };

    // kakao.maps.load 사용하여 지도 API 로드 대기
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        // 약간의 지연을 두어 DOM이 완전히 준비되도록 함
        setTimeout(() => {
          loadMap();
        }, 50);
      });
    } else {
      // window.kakao.maps가 없으면 재시도
      retryTimeoutRef.current = setTimeout(() => {
        loadMap();
      }, 100);
    }
  }, [address, placeName, isScriptLoaded]);

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div className="relative w-full h-64">
        <div
          ref={mapRef}
          className="w-full h-64 rounded-lg border border-slate-200 bg-slate-100"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
            <div className="text-sm text-slate-600">지도를 불러오는 중...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}
      </div>
    </>
  );
}
