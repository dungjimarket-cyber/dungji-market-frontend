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
      console.log('[BannerCarousel] 배너 데이터 요청 시작');
      const response = await getMainBanners();
      console.log('[BannerCarousel] 배너 응답:', response);
      setBanners(response || []);
      console.log('[BannerCarousel] 설정된 배너 개수:', (response || []).length);
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
      <div className="w-full aspect-[16/9] md:aspect-[21/5] bg-gray-100 animate-pulse md:rounded-lg" />
    );
  }

  if (error) {
    console.log('[BannerCarousel] 오류 발생:', error);
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/5] bg-red-100 md:rounded-lg flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (banners.length === 0) {
    console.log('[BannerCarousel] 배너가 없음');
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/5] bg-gray-100 md:rounded-lg flex items-center justify-center">
        <p className="text-gray-600">표시할 배너가 없습니다.</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  
  // currentBanner가 없는 경우 처리
  if (!currentBanner) {
    return null;
  }
  
  // 디버깅: 배너 링크 확인
  console.log('[BannerCarousel] 현재 배너:', {
    title: currentBanner.title,
    target_url: currentBanner.target_url,
    image_url: currentBanner.image_url
  });

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden md:rounded-lg">
        {/* 배너 컨테이너 - aspect ratio로 이미지 비율 유지 */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/5] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
                className="absolute -left-12 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-auto md:h-auto bg-black/40 md:bg-white/80 hover:bg-black/60 md:hover:bg-white text-white md:text-gray-800 rounded-full md:p-2 md:shadow-lg transition-all duration-200 z-10 flex items-center justify-center"
                aria-label="이전 배너"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  goToNext();
                }}
                className="absolute -right-12 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-auto md:h-auto bg-black/40 md:bg-white/80 hover:bg-black/60 md:hover:bg-white text-white md:text-gray-800 rounded-full md:p-2 md:shadow-lg transition-all duration-200 z-10 flex items-center justify-center"
                aria-label="다음 배너"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* 인디케이터 - 배너 영역 밖 하단에 위치, 배너가 2개 이상일 때만 표시 */}
      {banners.length > 1 && (
        <div className="flex justify-center space-x-2 mt-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-gray-600' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
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
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white drop-shadow-lg">
              {currentBanner.event_detail.title}
            </h2>
            {currentBanner.event_detail.short_description && (
              <p className="text-xs sm:text-sm md:text-base line-clamp-2 text-white/90 drop-shadow">
                {currentBanner.event_detail.short_description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}