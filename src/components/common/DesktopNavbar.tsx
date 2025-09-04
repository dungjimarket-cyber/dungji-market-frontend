'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import AuthButtons from '@/components/auth/AuthButtons';
import NotificationBell from '@/components/notification/NotificationBell';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';

/**
 * 데스크탑용 상단 네비게이션 바 컴포넌트
 */
export default function DesktopNavbar() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // 프로필 체크 Hook 사용
  const { 
    checkProfile, 
    showProfileModal, 
    setShowProfileModal, 
    missingFields,
    clearCache 
  } = useProfileCheck();
  
  // 공구 등록하기 버튼 클릭 핸들러
  const handleCreateClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // 기본 링크 동작 방지
    
    // 로그인 확인
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/group-purchases/create');
      return;
    }
    
    // 프로필 완성도 체크
    console.log('[DesktopNavbar] 공구 등록하기 클릭, 프로필 체크 시작');
    const isProfileComplete = await checkProfile();
    
    if (!isProfileComplete) {
      console.log('[DesktopNavbar] 프로필 미완성, 모달 표시');
      setShowProfileModal(true);
      return;
    }
    
    // 프로필이 완성된 경우에만 페이지 이동
    console.log('[DesktopNavbar] 프로필 완성, 공구 등록 페이지로 이동');
    router.push('/group-purchases/create');
  };

  return (
    <nav className="hidden md:block bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="둥지마켓" width={160} height={40} className="object-contain" />
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
                <Link 
                  href="/group-purchases/create" 
                  className="text-gray-600 hover:text-gray-900"
                  onClick={handleCreateClick}
                >
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
                  견적 내역
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
      
      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => {
          // 모달을 닫으면 현재 페이지에 머물기
          setShowProfileModal(false);
          console.log('[DesktopNavbar] 프로필 모달 취소, 현재 페이지 유지');
        }}
        missingFields={missingFields}
        onUpdateProfile={() => {
          // 프로필 업데이트 페이지로 이동
          clearCache();
          
          // 사용자 역할 확인
          const isSeller = user?.role === 'seller' || user?.user_type === '판매';
          const redirectPath = isSeller ? '/mypage/seller/settings' : '/mypage/settings';
          
          console.log('[DesktopNavbar] 프로필 업데이트 이동:', {
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
