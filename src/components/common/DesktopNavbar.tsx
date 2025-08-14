'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthButtons from '@/components/auth/AuthButtons';
import NotificationBell from '@/components/notification/NotificationBell';
import NotificationDropdown from '@/components/notification/NotificationDropdown';

/**
 * 데스크탑용 상단 네비게이션 바 컴포넌트
 */
export default function DesktopNavbar() {
  const { isAuthenticated, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="hidden md:block bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="둥지마켓" width={40} height={40} />
            <span className="text-xl font-bold">둥지마켓</span>
          </Link>
          
          <div className="flex space-x-8">
            <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900">
              공구 둘러보기
            </Link>
            <Link href="/events" className="text-gray-600 hover:text-gray-900">
              이벤트
            </Link>
            
            {/* 비로그인 시 */}
            {!isAuthenticated && (
              <>
                <Link href="/register" className="text-gray-600 hover:text-gray-900">
                  공구 등록하기
                </Link>
                <Link href="/register" className="text-gray-600 hover:text-gray-900">
                  회원가입
                </Link>
              </>
            )}
            
            {/* 구매회원(buyer) 로그인 시 */}
            {isAuthenticated && (user?.role === 'buyer' || user?.user_type === '일반' || (!user?.role && !user?.user_type)) && (
              <>
                <Link href="/group-purchases/create" className="text-gray-600 hover:text-gray-900">
                  공구 등록하기
                </Link>
                <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
                  마이페이지
                </Link>
              </>
            )}
            
            {/* 판매회원 로그인 시 */}
            {isAuthenticated && (user?.role === 'seller' || user?.user_type === '판매') && (
              <>
                <Link href="/mypage/seller/bids" className="text-gray-600 hover:text-gray-900">
                  입찰 내역
                </Link>
                <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
                  마이페이지
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="relative">
                <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
                {showNotifications && (
                  <>
                    {/* Click outside to close */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <NotificationDropdown 
                      isOpen={showNotifications} 
                      onClose={() => setShowNotifications(false)} 
                    />
                  </>
                )}
              </div>
            )}
            <AuthButtons isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </nav>
  );
}
