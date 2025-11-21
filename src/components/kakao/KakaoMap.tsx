'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  address: string;
  placeName?: string;
  scriptLoaded?: boolean; // 스크립트 로드 상태를 prop으로 받음
}

export default function KakaoMap({ address, placeName, scriptLoaded = true }: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initAttemptRef = useRef(0);
  const isInitializingRef = useRef(false);

  // Cleanup 함수
  const cleanup = () => {
    if (infoWindowRef.current) {
      try {
        infoWindowRef.current.close();
      } catch (e) {
        console.warn('[KakaoMap] Error closing infowindow:', e);
      }
      infoWindowRef.current = null;
    }

    if (markerRef.current) {
      try {
        markerRef.current.setMap(null);
      } catch (e) {
        console.warn('[KakaoMap] Error removing marker:', e);
      }
      markerRef.current = null;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    // DOM 완전히 비우기
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
    }
  };

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      console.log('[KakaoMap] Component unmounting, cleanup');
      cleanup();
      isInitializingRef.current = false;
      initAttemptRef.current = 0;
    };
  }, []);

  // 지도 초기화 (address나 placeName이 변경될 때만)
  useEffect(() => {
    // 스크립트가 로드되지 않았으면 대기
    if (!scriptLoaded) {
      console.log('[KakaoMap] Script not loaded yet');
      return;
    }

    // 주소가 없으면 초기화 안 함
    if (!address) {
      console.log('[KakaoMap] No address provided');
      setError('주소 정보가 없습니다');
      setIsLoading(false);
      return;
    }

    console.log('[KakaoMap] Starting initialization for address:', address);

    // 기존 지도 완전히 정리
    cleanup();

    // 초기화 상태 리셋
    isInitializingRef.current = false; // 초기화 중 플래그 해제
    setIsLoading(true);
    setError(null);
    initAttemptRef.current = 0;

    const initializeMap = () => {
      initAttemptRef.current += 1;

      // 최대 재시도 횟수 체크
      if (initAttemptRef.current > 30) {
        console.error('[KakaoMap] Max initialization attempts reached');
        setError('지도를 불러올 수 없습니다');
        setIsLoading(false);
        isInitializingRef.current = false;
        return;
      }

      // Kakao SDK 체크
      if (!window.kakao || !window.kakao.maps) {
        console.log(`[KakaoMap] Waiting for Kakao SDK... (attempt ${initAttemptRef.current})`);
        setTimeout(initializeMap, 100);
        return;
      }

      // 지도 컨테이너 체크
      if (!mapContainerRef.current) {
        console.log('[KakaoMap] Map container not ready');
        setTimeout(initializeMap, 100);
        return;
      }

      // kakao.maps.load로 API 준비 완료 후 실행
      window.kakao.maps.load(() => {
        console.log('[KakaoMap] Kakao maps loaded, creating map...');

        try {
          // 기존 지도 정리
          cleanup();

          // Geocoder로 주소 검색 ("대한민국" 제거)
          const geocoder = new window.kakao.maps.services.Geocoder();
          const searchAddress = address.replace('대한민국 ', '').trim();

          console.log('[KakaoMap] Searching for address:', searchAddress);

          geocoder.addressSearch(searchAddress, (result: any, status: any) => {
            // 컨테이너가 사라진 경우
            if (!mapContainerRef.current) {
              console.log('[KakaoMap] Container disappeared during geocoding');
              setIsLoading(false);
              isInitializingRef.current = false;
              return;
            }

            if (status === window.kakao.maps.services.Status.OK) {
              console.log('[KakaoMap] Geocoding successful:', result[0]);

              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

              // 지도 생성
              const map = new window.kakao.maps.Map(mapContainerRef.current, {
                center: coords,
                level: 3,
              });
              mapInstanceRef.current = map;

              // 마커 생성
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: coords,
              });
              markerRef.current = marker;

              // 인포윈도우 생성 (placeName이 있는 경우)
              if (placeName) {
                const infowindow = new window.kakao.maps.InfoWindow({
                  content: `<div style="padding:5px 10px;font-size:12px;text-align:center;white-space:nowrap;">${placeName}</div>`,
                });
                infowindow.open(map, marker);
                infoWindowRef.current = infowindow;
              }

              setIsLoading(false);
              setError(null);
              isInitializingRef.current = false;
              console.log('[KakaoMap] Map initialized successfully');
            } else {
              console.error('[KakaoMap] Geocoding failed with status:', status);
              setError('주소를 찾을 수 없습니다');
              setIsLoading(false);
              isInitializingRef.current = false;
            }
          });
        } catch (err) {
          console.error('[KakaoMap] Error initializing map:', err);
          setError('지도를 불러오는 중 오류가 발생했습니다');
          setIsLoading(false);
          isInitializingRef.current = false;
        }
      });
    };

    initializeMap();
  }, [address, placeName, scriptLoaded]);

  return (
    <div className="relative w-full h-64">
        <div
          ref={mapContainerRef}
          className="w-full h-64 rounded-lg border border-slate-200 bg-slate-100"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-sm text-slate-600">지도를 불러오는 중...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <div className="text-sm text-red-600">{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  isInitializingRef.current = false;
                  initAttemptRef.current = 0;
                }}
                className="text-xs text-primary hover:underline"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
