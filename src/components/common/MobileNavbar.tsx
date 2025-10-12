'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import { FaSearch, FaHome, FaShoppingCart, FaUser, FaSignInAlt, FaChartBar, FaStore, FaExchangeAlt } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import MobileNotificationButton from '@/components/notification/MobileNotificationButton';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import PenaltyModal from '@/components/penalty/PenaltyModal';

/**
 * 모바일용 하단 네비게이션 바 컴포넌트
 */
export default function MobileNavbar() {
  const { isAuthenticated, user, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  
  // 프로필 체크 Hook 사용
  const { 
    checkProfile, 
    showProfileModal, 
    setShowProfileModal, 
    missingFields,
    clearCache 
  } = useProfileCheck();
  
  // 견적요청 버튼 클릭 핸들러
  const handleCreateClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // 기본 링크 동작 방지
    
    // 로그인 확인
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/group-purchases/create');
      return;
    }
    
    // 패널티 체크
    console.log('🔴 MobileNavbar - 견적요청 클릭');
    console.log('🔴 User:', user);
    console.log('🔴 Penalty info:', user?.penalty_info);
    console.log('🔴 Is active:', user?.penalty_info?.is_active);
    
    if (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) {
      console.log('🔴 패널티 활성 상태 감지! 패널티 모달 표시');
      setShowPenaltyModal(true);
      return;
    }
    
    // 판매자인 경우 견적 내역 페이지로 이동
    if (isSeller) {
      router.push('/mypage/seller/bids');
      return;
    }
    
    // 프로필 완성도 체크
    console.log('[MobileNavbar] 공구 등록 클릭, 프로필 체크 시작');
    const isProfileComplete = await checkProfile();
    
    if (!isProfileComplete) {
      console.log('[MobileNavbar] 프로필 미완성, 모달 표시');
      setShowProfileModal(true);
      return;
    }
    
    // 프로필이 완성된 경우에만 페이지 이동
    console.log('[MobileNavbar] 프로필 완성, 공구 등록 페이지로 이동');
    router.push('/group-purchases/create');
  };
  
  // 사용자 역할 확인
  useEffect(() => {
    console.log('[MobileNavbar] Auth 상태 체크:', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      userType: user?.user_type,
      hasAccessToken: !!accessToken,
      localStorage_token: typeof window !== 'undefined' ? !!localStorage.getItem('dungji_auth_token') : null,
      localStorage_user: typeof window !== 'undefined' ? !!localStorage.getItem('user') : null
    });

    // Auth context의 user 객체에서 직접 확인
    if (user) {
      const isSellerUser = user.role === 'seller' || user.user_type === '판매';
      setIsSeller(isSellerUser);
      setUserRole(isSellerUser ? 'seller' : 'buyer');
    } else {
      setIsSeller(false);
      setUserRole(null);
    }
  }, [user, isAuthenticated, isLoading, accessToken]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-20 pb-2 w-full px-1">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/6 py-2">
          <FaHome className="text-lg mb-1" />
          <span className="text-[10px]">홈</span>
        </Link>
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/6 py-2">
          <FaSearch className="text-lg mb-1" />
          <span className="text-[10px]">진행중</span>
        </Link>
        {/* 가운데 버튼 - 본인 역할에 맞게 버튼 변경 */}
        <Link
          href={isAuthenticated ?
            (isSeller ? "/mypage/seller/bids" : "/group-purchases/create")
            : "/login"}
          className="flex flex-col items-center justify-center w-1/6 py-2"
          onClick={handleCreateClick}
        >
          {isSeller ? (
            <>
              <button className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md mb-1">
                <FaStore className="text-lg" />
              </button>
              <span className="text-[10px] mt-0.5">견적</span>
            </>
          ) : (
            <>
              <button className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md mb-1">
                <span className="text-xl">+</span>
              </button>
              <span className="text-[10px] mt-1">견적요청</span>
            </>
          )}
        </Link>
        {/* 중고거래 버튼 */}
        <Link href="/used" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/6 py-2">
          <FaExchangeAlt className="text-lg mb-1" />
          <span className="text-[10px]">중고거래</span>
        </Link>
        {/* 커스텀 공구 버튼 */}
        <Link href="/custom-deals" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/6 py-2">
          <FaStore className="text-lg mb-1" />
          <span className="text-[10px]">커공</span>
        </Link>
        {/* 알림 버튼 - 로그인한 경우에만 활성화 */}
        <div className="w-1/6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-400 w-full py-2">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-[10px]">알림</span>
            </div>
          ) : isAuthenticated ? (
            <MobileNotificationButton />
          ) : (
            <Link href="/login" className="flex flex-col items-center justify-center text-gray-400 w-full py-2">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-[10px]">알림</span>
            </Link>
          )}
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-gray-600 w-1/6 py-2">
            <FaUser className="text-lg mb-1 animate-pulse" />
            <span className="text-[10px]">...</span>
          </div>
        ) : isAuthenticated ? (
          <Link
            href={isSeller ? "/mypage/seller" : "/mypage"}
            className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/6 py-2"
          >
            <FaUser className="text-lg mb-1" />
            <span className="text-[10px]">MY</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/6 py-2"
          >
            <FaSignInAlt className="text-lg mb-1" />
            <span className="text-[10px]">로그인</span>
          </Link>
        )}
      </div>
      
      {/* 패널티 모달 */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={user?.penalty_info || user?.penaltyInfo}
        userRole="buyer"
      />
      
      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => {
          // 모달을 닫으면 현재 페이지에 머물기
          setShowProfileModal(false);
          console.log('[MobileNavbar] 프로필 모달 취소, 현재 페이지 유지');
        }}
        missingFields={missingFields}
        onUpdateProfile={() => {
          // 프로필 업데이트 페이지로 이동
          clearCache();
          
          // 사용자 역할 확인
          const isSeller = user?.role === 'seller' || user?.user_type === '판매';
          const redirectPath = isSeller ? '/mypage/seller/settings' : '/mypage/settings';
          
          console.log('[MobileNavbar] 프로필 업데이트 이동:', {
            user_role: user?.role,
            user_type: user?.user_type,
            isSeller,
            redirectPath
          });
          
          setShowProfileModal(false);  // 모달 닫기
          router.push(redirectPath);
        }}
      />
    </nav>
  );
}
