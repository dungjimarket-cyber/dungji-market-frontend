'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getMainBanners, Banner } from '@/lib/api/bannerService';

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await getMainBanners();
      setBanners(response || []);
    } catch (err) {
      setError('배너를 불러오는데 실패했습니다.');
      console.error('[BannerCarousel] Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  // 자동 슬라이드
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 8000); // 8초마다 변경

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % banners.length
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/7] lg:aspect-[21/6] max-h-[280px] md:max-h-[320px] lg:max-h-[380px] bg-gray-100 animate-pulse md:rounded-xl" />
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/7] lg:aspect-[21/6] max-h-[280px] md:max-h-[320px] lg:max-h-[380px] bg-red-100 md:rounded-xl flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/7] lg:aspect-[21/6] max-h-[280px] md:max-h-[320px] lg:max-h-[380px] bg-gray-100 md:rounded-xl flex items-center justify-center">
        <p className="text-gray-600">표시할 배너가 없습니다.</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  
  // currentBanner가 없는 경우 처리
  if (!currentBanner) {
    return null;
  }
  

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-4 lg:px-6">
      <div className="relative w-full overflow-hidden md:rounded-xl shadow-sm md:shadow-lg">
        {/* 배너 컨테이너 - 반응형 비율과 최대 높이 제한 */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/7] lg:aspect-[21/6] max-h-[280px] md:max-h-[320px] lg:max-h-[380px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          {/* 배너 이미지 */}
          {currentBanner.target_url && currentBanner.target_url !== '#' && currentBanner.target_url !== '' ? (
            <Link 
              href={
                currentBanner.target_url.startsWith('http') 
                  ? currentBanner.target_url 
                  : currentBanner.target_url.startsWith('/') 
                    ? currentBanner.target_url 
                    : `/${currentBanner.target_url}`
              }
              className="block absolute inset-0"
              target={currentBanner.target_url.startsWith('http') ? '_blank' : '_self'}
              rel={currentBanner.target_url.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <BannerImage currentBanner={currentBanner} currentIndex={currentIndex} />
            </Link>
          ) : (
            <BannerImage currentBanner={currentBanner} currentIndex={currentIndex} />
          )}

          {/* 이전/다음 버튼 - 배너가 2개 이상일 때만 표시 */}
          {banners.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  goToPrevious();
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/20 md:bg-white/90 backdrop-blur-sm hover:bg-black/30 md:hover:bg-white text-white md:text-gray-800 rounded-full shadow-md md:shadow-lg transition-all duration-200 z-10 flex items-center justify-center group"
                aria-label="이전 배너"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  goToNext();
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/20 md:bg-white/90 backdrop-blur-sm hover:bg-black/30 md:hover:bg-white text-white md:text-gray-800 rounded-full shadow-md md:shadow-lg transition-all duration-200 z-10 flex items-center justify-center group"
                aria-label="다음 배너"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* 인디케이터 - 배너 영역 밖 하단에 위치, 배너가 2개 이상일 때만 표시 */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 h-2 bg-blue-600' 
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400 hover:scale-125'
              }`}
              aria-label={`${index + 1}번째 배너로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 배너 이미지 컴포넌트
function BannerImage({ currentBanner, currentIndex }: { currentBanner: Banner; currentIndex: number }) {
  return (
    <div className="relative w-full h-full">
      {/* Temporary fix: Use regular img tag to bypass Next.js image optimization */}
      <img
        src={`${currentBanner.image_url}${currentBanner.image_url?.includes('?') ? '&' : '?'}t=${Date.now()}`}
        alt={currentBanner.title}
        className="absolute inset-0 w-full h-full object-contain"
        loading={currentIndex === 0 ? "eager" : "lazy"}
      />
      
      {/* 배경색 채우기 (이미지가 contain일 때 빈 공간 채우기) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
      
      {/* 배너 텍스트 (선택사항) */}
      {currentBanner.event_detail && (
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 bg-gradient-to-t from-black/50 via-black/30 to-transparent">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold mb-1 text-white drop-shadow-lg">
              {currentBanner.event_detail.title}
            </h2>
            {currentBanner.event_detail.short_description && (
              <p className="text-xs sm:text-sm md:text-sm lg:text-base line-clamp-1 md:line-clamp-2 text-white/90 drop-shadow">
                {currentBanner.event_detail.short_description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}