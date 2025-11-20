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
  const retryCountRef = useRef(0);
  const maxRetries = 20; // 최대 2초 (100ms * 20)

  useEffect(() => {
    // 컴포넌트 마운트 시 상태 초기화
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;

    // 스크립트가 로드되지 않았으면 대기
    if (!isScriptLoaded) {
      return;
    }

    const initMap = () => {
      if (!mapRef.current) {
        console.log('[KakaoMap] Map ref not ready');
        return;
      }

      if (!window.kakao?.maps?.services) {
        console.log('[KakaoMap] Kakao services not ready');
        return;
      }

      try {
        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.addressSearch(address, (result: any, status: any) => {
          if (!mapRef.current) {
            console.log('[KakaoMap] Map ref disappeared during geocoding');
            setIsLoading(false);
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

    const tryLoadMap = () => {
      // window.kakao가 없으면 재시도
      if (!window.kakao || !window.kakao.maps) {
        retryCountRef.current += 1;

        if (retryCountRef.current >= maxRetries) {
          console.error('[KakaoMap] Max retries reached');
          setError('지도를 불러올 수 없습니다');
          setIsLoading(false);
          return;
        }

        console.log(`[KakaoMap] Kakao SDK not ready, retrying... (${retryCountRef.current}/${maxRetries})`);
        setTimeout(tryLoadMap, 100);
        return;
      }

      // kakao.maps.load 사용
      window.kakao.maps.load(() => {
        console.log('[KakaoMap] Kakao maps loaded, initializing...');
        initMap();
      });
    };

    tryLoadMap();
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
