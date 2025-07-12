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
  const { isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  
  // 사용자 역할 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkUserRole = () => {
      try {
        // 여러 소스에서 역할 정보 확인
        const userRole = localStorage.getItem('userRole');
        if (userRole) {
          setUserRole(userRole);
          setIsSeller(userRole === 'seller');
          return;
        }
        
        // auth.user에서 확인
        const authUserStr = localStorage.getItem('auth.user') || localStorage.getItem('user');
        if (authUserStr) {
          const authUser = JSON.parse(authUserStr);
          if (authUser.role) {
            setUserRole(authUser.role);
            setIsSeller(authUser.role === 'seller');
            return;
          }
        }
        
        // next-auth 세션 확인
        const sessionStr = sessionStorage.getItem('next-auth.session');
        if (sessionStr) {
          const sessionData = JSON.parse(sessionStr);
          if (sessionData.user?.role) {
            setUserRole(sessionData.user.role);
            setIsSeller(sessionData.user.role === 'seller');
            return;
          }
        }
      } catch (error) {
        console.error('사용자 역할 확인 오류:', error);
      }
    };
    
    checkUserRole();
    
    // 스토리지 변경 감지
    const handleStorageChange = () => checkUserRole();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 w-full">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-2">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaHome className="text-xl mb-1" />
          <span className="text-xs">홈</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaSearch className="text-xl mb-1" />
          <span className="text-xs">검색</span>
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
              <span className="text-xs mt-0.5">입찰 관리</span>
            </>
          ) : (
            <>
              <button className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md mb-1">
                <span className="text-2xl">+</span>
              </button>
              <span className="text-xs mt-0.5">공구 등록</span>
            </>
          )}
        </Link>
        {isAuthenticated ? (
          <MobileNotificationButton />
        ) : (
          <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
            <FaShoppingCart className="text-xl mb-1" />
            <span className="text-xs">공구</span>
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
