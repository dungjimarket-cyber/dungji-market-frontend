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
    }, 5000); // 5초마다 변경

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
      <div className="w-full h-64 sm:h-96 bg-gray-100 animate-pulse rounded-lg" />
    );
  }

  if (error) {
    console.log('[BannerCarousel] 오류 발생:', error);
    return (
      <div className="w-full h-64 sm:h-96 bg-red-100 rounded-lg flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (banners.length === 0) {
    console.log('[BannerCarousel] 배너가 없음');
    return (
      <div className="w-full h-64 sm:h-96 bg-gray-100 rounded-lg flex items-center justify-center">
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
    <div className="relative w-full overflow-hidden rounded-lg">
      {/* 배너 컨테이너 */}
      <div className="relative h-64 sm:h-96 md:h-[400px] lg:h-[500px] bg-gray-100">
        {/* 배너 이미지 */}
        {currentBanner.target_url && currentBanner.target_url !== '#' ? (
          <Link 
            href={currentBanner.target_url.startsWith('http') ? currentBanner.target_url : `/${currentBanner.target_url.replace(/^\//, '')}`}
            className="block w-full h-full"
            target={currentBanner.target_url.startsWith('http') ? '_blank' : '_self'}
            rel={currentBanner.target_url.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            <div className="relative w-full h-full">
              <Image
                src={currentBanner.image_url}
                alt={currentBanner.title}
                fill
                className="object-contain sm:object-cover"
                priority={currentIndex === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
              />
              {/* 그라데이션 오버레이 (선택사항) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              
              {/* 배너 텍스트 (선택사항) */}
              {currentBanner.event_detail && (
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    {currentBanner.event_detail.title}
                  </h2>
                  {currentBanner.event_detail.short_description && (
                    <p className="text-sm sm:text-base line-clamp-2">
                      {currentBanner.event_detail.short_description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={currentBanner.image_url}
              alt={currentBanner.title}
              fill
              className="object-contain sm:object-cover"
              priority={currentIndex === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
            />
            {/* 그라데이션 오버레이 (선택사항) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            
            {/* 배너 텍스트 (선택사항) */}
            {currentBanner.event_detail && (
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  {currentBanner.event_detail.title}
                </h2>
                {currentBanner.event_detail.short_description && (
                  <p className="text-sm sm:text-base line-clamp-2">
                    {currentBanner.event_detail.short_description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 이전/다음 버튼 - 배너가 2개 이상일 때만 표시 */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
              aria-label="이전 배너"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
              aria-label="다음 배너"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* 인디케이터 - 배너가 2개 이상일 때만 표시 */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`${index + 1}번째 배너로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
}