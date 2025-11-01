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
    if (!isScriptLoaded || !window.kakao || !window.kakao.maps) {
      return;
    }

    const loadMap = () => {
      if (!mapRef.current) {
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(address, (result: any, status: any) => {
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
        }
      });
    };

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
