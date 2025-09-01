'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Megaphone, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NoticePopup from '@/components/notice/NoticePopup';

interface Notice {
  id: number;
  title: string;
  summary: string;
  category: string;
  content?: string;
  thumbnail: string | null;
  is_pinned: boolean;
  is_new: boolean;
  created_at: string;
  published_at: string;
  show_in_main: boolean;
  display_type: 'banner' | 'text' | 'both' | 'popup';
  main_banner_image: string | null;
  banner_link: string | null;
  main_display_order: number;
  popup_width?: number;
  popup_height?: number;
  popup_image?: string | null;
  popup_link?: string | null;
  popup_expires_at?: string | null;
}

export default function NoticeSection() {
  const [bannerNotices, setBannerNotices] = useState<Notice[]>([]);
  const [textNotices, setTextNotices] = useState<Notice[]>([]);
  const [popupNotices, setPopupNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [activePopup, setActivePopup] = useState<Notice | null>(null);

  useEffect(() => {
    fetchMainNotices();
  }, []);

  useEffect(() => {
    // 자동 슬라이드 (배너가 2개 이상일 때만)
    if (bannerNotices.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % bannerNotices.length);
      }, 5000); // 5초마다 변경
      
      return () => clearInterval(timer);
    }
  }, [bannerNotices.length]);

  const fetchMainNotices = async () => {
    try {
      console.log('Fetching main notices from:', `${process.env.NEXT_PUBLIC_API_URL}/notices/main/`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notices/main/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Main notices response:', data);
        
        // 배너, 텍스트, 팝업 공지 분류
        setBannerNotices(data.banners || []);
        setTextNotices(data.texts || []);
        setPopupNotices(data.popups || []);
        
        // 첫 번째 텍스트 공지에 대한 숨김 상태 확인
        if (data.texts && data.texts.length > 0) {
          const firstText = data.texts[0];
          const hiddenUntil = localStorage.getItem(`notice_hidden_${firstText.id}`);
          if (hiddenUntil && new Date(hiddenUntil) > new Date()) {
            setIsTopBarVisible(false);
          }
        }
        
        // 팝업 공지 표시 처리
        if (data.popups && data.popups.length > 0) {
          const firstPopup = data.popups[0];
          const popupHiddenUntil = localStorage.getItem(`notice_popup_hidden_${firstPopup.id}`);
          
          // 숨김 기간이 지났거나 설정되지 않은 경우 팝업 표시
          if (!popupHiddenUntil || new Date(popupHiddenUntil) <= new Date()) {
            // 페이지 로드 후 1초 뒤에 팝업 표시 (사용자 경험 개선)
            setTimeout(() => {
              setActivePopup(firstPopup);
            }, 1000);
          }
        }
      } else {
        console.error('Failed to fetch notices:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopBarClose = () => {
    if (textNotices.length > 0) {
      // 24시간 동안 숨기기
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem(`notice_hidden_${textNotices[0].id}`, tomorrow.toISOString());
      setIsTopBarVisible(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      general: { label: '공지', className: 'bg-gray-100 text-gray-700' },
      event: { label: '이벤트', className: 'bg-purple-100 text-purple-700' },
      update: { label: '업데이트', className: 'bg-blue-100 text-blue-700' },
      maintenance: { label: '점검', className: 'bg-yellow-100 text-yellow-700' },
      important: { label: '중요', className: 'bg-red-100 text-red-700' }
    };
    
    const config = categoryMap[category] || categoryMap.general;
    return config;
  };

  if (loading) {
    console.log('NoticeSection: Loading...');
    return null;
  }
  
  if (bannerNotices.length === 0 && textNotices.length === 0 && popupNotices.length === 0) {
    console.log('NoticeSection: No notices to display', { bannerNotices, textNotices, popupNotices });
    return null;
  }

  return (
    <>
      {/* 상단 고정 바 (텍스트 공지) */}
      {textNotices.length > 0 && isTopBarVisible && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2">
              <Link 
                href="/notices" 
                className="flex items-center gap-2 flex-1 text-sm hover:text-blue-600 transition-colors"
              >
                <Megaphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-blue-900 truncate">
                  {textNotices[0].title}
                </span>
                {textNotices[0].summary && (
                  <span className="text-gray-600 hidden sm:inline truncate">
                    - {textNotices[0].summary}
                  </span>
                )}
              </Link>
              <button
                onClick={handleTopBarClose}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                aria-label="공지 닫기"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 배너 섹션 */}
      {bannerNotices.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">공지사항</h2>
            </div>
            <Link 
              href="/notices" 
              className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
            >
              전체보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            {/* 배너 캐러셀 */}
            <div className="overflow-hidden rounded-lg">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {bannerNotices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={notice.banner_link || '/notices'}
                    className="w-full flex-shrink-0"
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="relative h-[200px] sm:h-[250px] md:h-[300px]">
                        {notice.main_banner_image ? (
                          <Image
                            src={notice.main_banner_image}
                            alt={notice.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : notice.thumbnail ? (
                          <Image
                            src={notice.thumbnail}
                            alt={notice.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg" />
                        )}
                        
                        {/* 오버레이 텍스트 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 rounded-b-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryBadge(notice.category).className}>
                              {getCategoryBadge(notice.category).label}
                            </Badge>
                            {notice.is_new && (
                              <Badge className="bg-green-500 text-white">NEW</Badge>
                            )}
                          </div>
                          <h3 className="text-white font-bold text-lg sm:text-xl mb-1">
                            {notice.title}
                          </h3>
                          {notice.summary && (
                            <p className="text-white/90 text-sm sm:text-base line-clamp-2">
                              {notice.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-white/70 text-xs sm:text-sm">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>
                              {new Date(notice.published_at || notice.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* 인디케이터 (배너가 2개 이상일 때만) */}
            {bannerNotices.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {bannerNotices.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-label={`공지 ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 팝업 공지 */}
      {activePopup && (
        <NoticePopup
          popup={activePopup}
          onClose={() => setActivePopup(null)}
        />
      )}
    </>
  );
}