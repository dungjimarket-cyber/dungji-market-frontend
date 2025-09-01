'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface NoticePopup {
  id: number;
  title: string;
  content: string;
  summary: string;
  popup_width: number;
  popup_height: number;
  popup_image: string | null;
  popup_link: string | null;
  popup_expires_at: string | null;
}

interface NoticePopupProps {
  popup: NoticePopup;
  onClose: () => void;
}

export default function NoticePopup({ popup, onClose }: NoticePopupProps) {
  const [dontShowToday, setDontShowToday] = useState(false);

  const handleClose = () => {
    if (dontShowToday) {
      // 오늘 하루 동안 보지 않기
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      localStorage.setItem(`notice_popup_hidden_${popup.id}`, tomorrow.toISOString());
    }
    onClose();
  };

  const handleContentClick = () => {
    if (popup.popup_link) {
      window.open(popup.popup_link, '_blank');
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={handleClose}
      />
      
      {/* 팝업 */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white rounded-lg shadow-2xl"
        style={{
          width: `${Math.min(popup.popup_width, window.innerWidth - 40)}px`,
          maxHeight: `${Math.min(popup.popup_height, window.innerHeight - 40)}px`,
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
          className="overflow-y-auto"
          style={{ maxHeight: `${popup.popup_height - 120}px` }}
        >
          {popup.popup_image ? (
            <div 
              className="relative cursor-pointer"
              onClick={handleContentClick}
            >
              <Image
                src={popup.popup_image}
                alt={popup.title}
                width={popup.popup_width}
                height={popup.popup_height - 120}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="p-6">
              {popup.summary && (
                <p className="text-gray-600 mb-4">{popup.summary}</p>
              )}
              
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(popup.content, {
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
              
              {popup.popup_link && (
                <Link 
                  href={popup.popup_link}
                  target="_blank"
                  className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  자세히 보기
                </Link>
              )}
            </div>
          )}
        </div>
        
        {/* 하단 */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">오늘 하루 보지 않기</span>
          </label>
          
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