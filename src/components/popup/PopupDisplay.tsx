'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { getActivePopups, recordPopupView, recordPopupClick, Popup } from '@/lib/api/popupService';

interface PopupDisplayProps {
  popup: Popup;
  onClose: (popupId: number, dontShowPeriod?: 'today' | 'week') => void;
}

export function PopupDisplay({ popup, onClose }: PopupDisplayProps) {
  const [dontShowToday, setDontShowToday] = useState(false);
  const [dontShowWeek, setDontShowWeek] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 여부 체크 (768px 이하)
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 팝업 조회수 기록
    recordPopupView(popup.id);
  }, [popup.id]);

  const handleClose = () => {
    let period: 'today' | 'week' | undefined;
    if (dontShowWeek) {
      period = 'week';
    } else if (dontShowToday) {
      period = 'today';
    }
    onClose(popup.id, period);
  };

  const handleContentClick = async () => {
    if (popup.link_url) {
      // 클릭수 기록
      await recordPopupClick(popup.id);
      
      if (popup.link_target === '_self') {
        window.location.href = popup.link_url;
      } else {
        window.open(popup.link_url, '_blank');
      }
    }
  };

  const getPositionStyles = () => {
    switch (popup.position) {
      case 'top':
        return 'top-10 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'bottom-10 left-1/2 transform -translate-x-1/2';
      case 'custom':
        return `top-[${popup.position_y || 50}%] left-[${popup.position_x || 50}%] transform -translate-x-1/2 -translate-y-1/2`;
      case 'center':
      default:
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  // 이미지 전용 팝업
  if (popup.popup_type === 'image' && popup.image) {
    return (
      <>
        {/* 배경 오버레이 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
          onClick={handleClose}
        />
        
        {/* 이미지 팝업 */}
        <div
          className={`fixed z-[9999] bg-white rounded-lg shadow-2xl overflow-hidden ${getPositionStyles()}`}
          style={isMobile ? {
            // 모바일: 화면의 75% 고정
            width: `${window.innerWidth * 0.75}px`,
            maxHeight: `${window.innerHeight * 0.85}px`,
          } : {
            // PC: 팝업 설정값 기준
            width: 'auto',
            maxWidth: `${Math.min(popup.width, window.innerWidth * 0.96)}px`,
            maxHeight: `${window.innerHeight * 0.92}px`,
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* 이미지 */}
          <div
            className="relative cursor-pointer"
            onClick={handleContentClick}
          >
            <Image
              src={popup.image}
              alt={popup.title}
              width={popup.width}
              height={popup.height}
              className="w-full h-auto object-contain"
              style={{
                maxHeight: `${Math.min(popup.height, window.innerHeight * 0.85)}px`
              }}
              priority
            />
          </div>
          
          {/* 오늘 하루 보지 않기 옵션 */}
          {(popup.show_today_close || popup.show_week_close) && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black bg-opacity-50">
              <div className="flex items-center justify-center gap-4">
                {popup.show_today_close && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontShowToday}
                      onChange={(e) => {
                        setDontShowToday(e.target.checked);
                        if (e.target.checked) setDontShowWeek(false);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">오늘 하루 보지 않기</span>
                  </label>
                )}
                {popup.show_week_close && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontShowWeek}
                      onChange={(e) => {
                        setDontShowWeek(e.target.checked);
                        if (e.target.checked) setDontShowToday(false);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">일주일 보지 않기</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // 텍스트 전용 팝업 (컴팩트 디자인)
  if (popup.popup_type === 'text') {
    return (
      <>
        {/* 배경 오버레이 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
          onClick={handleClose}
        />
        
        {/* 텍스트 팝업 - 공지사항 스타일 */}
        <div
          className={`fixed z-[9999] bg-white rounded-xl shadow-2xl ${getPositionStyles()}`}
          style={isMobile ? {
            // 모바일: 화면의 75% 고정
            width: `${window.innerWidth * 0.75}px`,
            maxHeight: `${window.innerHeight * 0.8}px`,
          } : {
            // PC: 팝업 설정값 기준
            width: `${Math.min(popup.width || 400, window.innerWidth * 0.9)}px`,
            maxWidth: '500px',
            maxHeight: `${Math.min(popup.height || 500, window.innerHeight * 0.85)}px`,
          }}
        >
          {/* 컴팩트 헤더 */}
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full" />
              <h3 className="font-semibold text-base text-gray-800">{popup.title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-white hover:bg-opacity-70 rounded-full transition-all"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* 텍스트 내용 - 줄바꿈과 간격 유지 */}
          <div 
            className="overflow-y-auto px-5 py-4"
            style={{ maxHeight: `${(popup.height || 500) - 120}px` }}
          >
            {popup.content && (
              <div 
                className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  wordBreak: 'keep-all'
                }}
              >
                {popup.content}
              </div>
            )}
            
            {popup.link_url && (
              <button 
                onClick={handleContentClick}
                className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                자세히 보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          
          {/* 컴팩트 하단 */}
          {(popup.show_today_close || popup.show_week_close) && (
            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              {popup.show_today_close && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={dontShowToday}
                    onChange={(e) => {
                      setDontShowToday(e.target.checked);
                      if (e.target.checked) setDontShowWeek(false);
                    }}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 group-hover:text-gray-800">오늘 하루 보지 않기</span>
                </label>
              )}
              {popup.show_week_close && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={dontShowWeek}
                    onChange={(e) => {
                      setDontShowWeek(e.target.checked);
                      if (e.target.checked) setDontShowToday(false);
                    }}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 group-hover:text-gray-800">일주일간 보지 않기</span>
                </label>
              )}
              <button
                onClick={handleClose}
                className="ml-auto px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </>
    );
  }
  
  // 혼합 팝업 (기존 스타일 유지)
  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={handleClose}
      />
      
      {/* 팝업 */}
      <div
        className={`fixed z-[9999] bg-white rounded-lg shadow-2xl ${getPositionStyles()}`}
        style={isMobile ? {
          // 모바일: 화면의 75% 고정
          width: `${window.innerWidth * 0.75}px`,
          maxHeight: `${window.innerHeight * 0.85}px`,
        } : {
          // PC: 팝업 설정값 기준
          width: `${Math.min(popup.width, window.innerWidth * 0.9)}px`,
          maxHeight: `${Math.min(popup.height, window.innerHeight * 0.85)}px`,
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">{popup.title}</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 내용 */}
        <div 
          className="overflow-y-auto p-6"
          style={{ maxHeight: `${popup.height - 120}px` }}
        >
          {popup.popup_type === 'mixed' && popup.image && (
            <div 
              className="relative cursor-pointer mb-4"
              onClick={handleContentClick}
            >
              <Image
                src={popup.image}
                alt={popup.title}
                width={popup.width - 48}
                height={200}
                className="w-full h-auto rounded"
              />
            </div>
          )}
          
          {popup.content && (
            <div 
              className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                wordBreak: 'keep-all'
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(popup.content.replace(/\n/g, '<br>'), {
                  ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 
                    'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 
                    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 
                    'td', 'span', 'div', 'hr', 'code', 'pre'
                  ],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 
                                'class', 'style', 'width', 'height'],
                  ALLOW_DATA_ATTR: false,
                })
              }}
            />
          )}
          
          {popup.link_url && (
            <button 
              onClick={handleContentClick}
              className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              자세히 보기
            </button>
          )}
        </div>
        
        {/* 하단 */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            {popup.show_today_close && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => {
                    setDontShowToday(e.target.checked);
                    if (e.target.checked) setDontShowWeek(false);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">오늘 하루 보지 않기</span>
              </label>
            )}
            {popup.show_week_close && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowWeek}
                  onChange={(e) => {
                    setDontShowWeek(e.target.checked);
                    if (e.target.checked) setDontShowToday(false);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">일주일 보지 않기</span>
              </label>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}

interface PopupManagerProps {
  pageType?: string;
}

export function PopupManager({ pageType = 'main' }: PopupManagerProps) {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);

  useEffect(() => {
    loadPopups();
  }, [pageType]);

  const loadPopups = async () => {
    try {
      // 현재 경로에 따라 pageType 자동 결정
      let currentPageType = pageType;
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.includes('/group-purchases')) {
          currentPageType = 'groupbuy_list';
        } else if (path.includes('/groupbuys/')) {
          currentPageType = 'groupbuy_detail';
        } else if (path === '/used') {
          currentPageType = 'used_list';
        } else if (path.includes('/used/')) {
          currentPageType = 'used_detail';
        } else if (path.includes('/mypage')) {
          currentPageType = 'mypage';
        }
      }

      const activePopups = await getActivePopups(currentPageType);

      // 쿠키에서 숨김 처리된 팝업만 필터링 (TWA 필터링은 백엔드에서 처리)
      const filteredPopups = activePopups.filter(popup => {
        const todayHidden = getCookie(`popup_hidden_today_${popup.id}`);
        const weekHidden = getCookie(`popup_hidden_week_${popup.id}`);

        if (todayHidden || weekHidden) {
          return false;
        }

        return true;
      });

      setPopups(filteredPopups);
    } catch (error) {
      console.error('팝업 로드 실패:', error);
    }
  };

  const handlePopupClose = (popupId: number, period?: 'today' | 'week') => {
    if (period) {
      const days = period === 'week' ? 7 : 1;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      
      setCookie(`popup_hidden_${period}_${popupId}`, 'true', days);
    }

    // 다음 팝업 표시 또는 종료
    if (currentPopupIndex < popups.length - 1) {
      setCurrentPopupIndex(currentPopupIndex + 1);
    } else {
      setPopups([]);
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  if (popups.length === 0 || currentPopupIndex >= popups.length) {
    return null;
  }

  return (
    <PopupDisplay
      popup={popups[currentPopupIndex]}
      onClose={handlePopupClose}
    />
  );
}