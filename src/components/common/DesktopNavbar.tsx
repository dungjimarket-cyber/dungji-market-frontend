'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import AuthButtons from '@/components/auth/AuthButtons';
import NotificationBell from '@/components/notification/NotificationBell';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import { ShoppingSearchModal } from '@/components/shopping/ShoppingSearchModal';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';

/**
 * 데스크탑용 상단 네비게이션 바 컴포넌트
 */
export default function DesktopNavbar() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);
  const [sellerMissingFields, setSellerMissingFields] = useState<string[]>([]);
  const [showShoppingModal, setShowShoppingModal] = useState(false);

  // 프로필 체크 Hook 사용
  const {
    checkProfile,
    showProfileModal,
    setShowProfileModal,
    missingFields,
    clearCache
  } = useProfileCheck();

  // 판매자 프로필 조회 함수
  const fetchSellerProfile = async () => {
    if (user?.role === 'seller' || user?.user_type === '판매') {
      try {
        const profile = await getSellerProfile();
        setSellerProfile(profile);
      } catch (error) {
        console.error('판매자 프로필 조회 오류:', error);
      }
    }
  };

  // 판매자 프로필 조회
  useEffect(() => {
    fetchSellerProfile();
  }, [user?.role, user?.user_type]);
  
  // 견적요청 버튼 클릭 핸들러
  const handleCreateClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // 기본 링크 동작 방지

    // 로그인 확인
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/group-purchases/create');
      return;
    }

    // 패널티 체크
    console.log('🔴 DesktopNavbar - 견적요청 클릭');
    console.log('🔴 User:', user);
    console.log('🔴 Penalty info:', user?.penalty_info);
    console.log('🔴 Is active:', user?.penalty_info?.is_active);

    if (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) {
      console.log('🔴 패널티 활성 상태 감지! 패널티 모달 표시');
      setShowPenaltyModal(true);
      return;
    }

    // 프로필 완성도 체크
    console.log('[DesktopNavbar] 프로필 체크 시작');
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

  // 판매자 견적내역 버튼 클릭 핸들러
  const handleBidsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // 판매유형 체크
    if (!sellerProfile?.sellerCategory) {
      setSellerMissingFields(['판매유형']);
      setShowSellerProfileModal(true);
      return;
    }

    router.push('/mypage/seller/bids');
  };

  return (
    <nav className="hidden md:block bg-white shadow-lg">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logos/dungji_logo.jpg" alt="둥지마켓" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold font-black-han-sans">둥지마켓</span>
          </Link>

          <div className="flex space-x-8">
            <Link href="/custom-deals" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
              커공 특가
            </Link>
            <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
              견적서비스
            </Link>

            {/* 비로그인 시 */}
            {/* {!isAuthenticated && (
              <>
                <Link href="/register" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
                  견적요청
                </Link>
              </>
            )} */}

            {/* 구매회원(buyer) 로그인 시 */}
            {/* {isAuthenticated && (user?.role === 'buyer' || user?.user_type === '일반' || (!user?.role && !user?.user_type)) && (
              <>
                <Link
                  href="/group-purchases/create"
                  className="text-gray-600 hover:text-gray-900 font-black-han-sans"
                  onClick={handleCreateClick}
                >
                  견적요청
                </Link>
              </>
            )} */}

            {/* 판매회원 로그인 시 */}
            {/* {isAuthenticated && (user?.role === 'seller' || user?.user_type === '판매') && (
              <>
                <Link
                  href="/mypage/seller/bids"
                  className="text-gray-600 hover:text-gray-900 font-black-han-sans"
                  onClick={handleBidsClick}
                >
                  견적 내역
                </Link>
              </>
            )} */}

            <Link href="/used" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
              중고거래
            </Link>
            <Link href="/events" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
              이벤트
            </Link>

            {/* 비로그인 시 - 회원가입 */}
            {!isAuthenticated && (
              <Link href="/register" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
                회원가입
              </Link>
            )}

            {/* 로그인 시 - 마이페이지 */}
            {isAuthenticated && (
              <Link href="/mypage" className="text-gray-600 hover:text-gray-900 font-black-han-sans">
                마이페이지
              </Link>
            )}

            {/* 오픈마켓 검색 */}
            <button
              onClick={() => setShowShoppingModal(true)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-black-han-sans"
            >
              <Search className="w-4 h-4" />
              <span>오픈마켓 검색</span>
            </button>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            {isAuthenticated && (
              <div className="relative">
                <NotificationBell
                  onClick={() => setShowNotifications(!showNotifications)}
                  unreadCount={unreadCount}
                  onUnreadCountChange={(count) => {
                    console.log('[DesktopNavbar] Received unreadCount update:', count);
                    setUnreadCount(count);
                  }}
                />
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
                      onUnreadCountChange={setUnreadCount}
                    />
                  </>
                )}
              </div>
            )}
            <AuthButtons isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
      
      {/* 패널티 모달 */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={user?.penalty_info || user?.penaltyInfo}
        userRole="buyer"
      />
      
      {/* 프로필 체크 모달 (구매자용) */}
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

      {/* 프로필 체크 모달 (판매자용 - 판매유형) */}
      <ProfileCheckModal
        isOpen={showSellerProfileModal}
        onClose={() => setShowSellerProfileModal(false)}
        missingFields={sellerMissingFields}
        onUpdateProfile={async () => {
          setShowSellerProfileModal(false);
          // 설정 완료 후 돌아올 때 프로필 갱신
          const handleFocus = () => {
            fetchSellerProfile();
            window.removeEventListener('focus', handleFocus);
          };
          window.addEventListener('focus', handleFocus);
          router.push('/mypage/seller/settings');
        }}
      />

      {/* 오픈마켓 검색 모달 */}
      <ShoppingSearchModal
        isOpen={showShoppingModal}
        onClose={() => setShowShoppingModal(false)}
      />
    </nav>
  );
}
