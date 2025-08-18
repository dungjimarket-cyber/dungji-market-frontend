'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FaSearch, FaHome, FaShoppingCart, FaUser, FaSignInAlt, FaChartBar, FaStore } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import MobileNotificationButton from '@/components/notification/MobileNotificationButton';

/**
 * 모바일용 하단 네비게이션 바 컴포넌트
 */
export default function MobileNavbar() {
  const { isAuthenticated, user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  
  // 사용자 역할 확인
  useEffect(() => {
    // Auth context의 user 객체에서 직접 확인
    if (user) {
      const isSellerUser = user.role === 'seller' || user.user_type === '판매';
      setIsSeller(isSellerUser);
      setUserRole(isSellerUser ? 'seller' : 'buyer');
    } else {
      setIsSeller(false);
      setUserRole(null);
    }
  }, [user]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-20 pb-2 w-full px-2">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaHome className="text-xl mb-1" />
          <span className="text-xs">홈</span>
        </Link>
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaSearch className="text-xl mb-1" />
          <span className="text-xs">공구</span>
        </Link>
        {/* 가운데 버튼 - 본인 역할에 맞게 버튼 변경 */}
        <Link 
          href={isAuthenticated ? 
            (isSeller ? "/mypage/seller/bids" : "/group-purchases/create") 
            : "/login"} 
          className="flex flex-col items-center justify-center w-1/5 py-2"
        >
          {isSeller ? (
            <>
              <button className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md mb-1">
                <FaStore className="text-xl" />
              </button>
              <span className="text-xs mt-0.5">견적 내역</span>
            </>
          ) : (
            <>
              <button className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md mb-1">
                <span className="text-2xl">+</span>
              </button>
              <span className="text-xs mt-1">공구등록</span>
            </>
          )}
        </Link>
        {/* 알림 버튼 - 로그인한 경우에만 활성화 */}
        {isAuthenticated ? (
          <MobileNotificationButton />
        ) : (
          <Link href="/login" className="flex flex-col items-center justify-center text-gray-400 w-1/5 py-2">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="text-xs">알림</span>
          </Link>
        )}
        {isAuthenticated ? (
          <Link 
            href={isSeller ? "/mypage/seller" : "/mypage"} 
            className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2"
          >
            <FaUser className="text-xl mb-1" />
            <span className="text-xs">마이페이지</span>
          </Link>
        ) : (
          <Link 
            href="/login" 
            className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2"
          >
            <FaSignInAlt className="text-xl mb-1" />
            <span className="text-xs">로그인</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
