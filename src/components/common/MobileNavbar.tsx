'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import { FaSearch, FaHome, FaShoppingCart, FaUser, FaSignInAlt, FaChartBar, FaStore, FaExchangeAlt, FaList } from 'react-icons/fa';
import { FileText, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import MobileNotificationButton from '@/components/notification/MobileNotificationButton';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';

/**
 * 모바일용 하단 네비게이션 바 컴포넌트
 */
export default function MobileNavbar() {
  const { isAuthenticated, user, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);
  const [sellerMissingFields, setSellerMissingFields] = useState<string[]>([]);

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
    if (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) {
      setShowPenaltyModal(true);
      return;
    }

    // 판매자인 경우 판매유형 체크 후 견적 내역 페이지로 이동
    if (isSeller) {
      if (!sellerProfile?.sellerCategory) {
        setSellerMissingFields(['판매유형']);
        setShowSellerProfileModal(true);
        return;
      }
      router.push('/mypage/seller/bids');
      return;
    }

    // 프로필 완성도 체크
    const isProfileComplete = await checkProfile();

    if (!isProfileComplete) {
      setShowProfileModal(true);
      return;
    }

    // 프로필이 완성된 경우에만 페이지 이동
    router.push('/group-purchases/create');
  };
  
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
  }, [user, isAuthenticated, isLoading, accessToken]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-20 pb-2 w-full px-0.5">
        {/* 1. 홈 */}
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 flex-1 py-2">
          <FaHome className="text-lg mb-1" />
          <span className="text-[10px] font-black-han-sans">홈</span>
        </Link>

        {/* 2. 견적요청/견적내역 - 본인 역할에 맞게 버튼 변경 */}
        <Link
          href={isAuthenticated ?
            (isSeller ? "/mypage/seller/bids" : "/group-purchases/create")
            : "/login"}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 flex-1 py-2"
          onClick={handleCreateClick}
        >
          {isSeller ? (
            <>
              <ClipboardList className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-black-han-sans">견적내역</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-black-han-sans">견적요청</span>
            </>
          )}
        </Link>

        {/* 3. 견적목록 */}
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 flex-1 py-2">
          <FaList className="text-lg mb-1" />
          <span className="text-[10px] font-black-han-sans">견적목록</span>
        </Link>

        {/* 4. 커공 (큰 버튼) */}
        <Link href="/custom-deals" className="flex flex-col items-center justify-center flex-1 py-2">
          <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg mb-1 transform hover:scale-105 transition-transform">
            <FaStore className="text-xl" />
          </button>
          <span className="text-[10px] font-semibold text-green-600 font-black-han-sans">커공</span>
        </Link>

        {/* 5. 중고거래 */}
        <Link href="/used" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 flex-1 py-2">
          <FaExchangeAlt className="text-lg mb-1" />
          <span className="text-[10px] font-black-han-sans">중고거래</span>
        </Link>

        {/* 6. 알림 - 로그인한 경우에만 활성화 */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-400 w-full py-2">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-[10px] font-black-han-sans">알림</span>
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
              <span className="text-[10px] font-black-han-sans">알림</span>
            </Link>
          )}
        </div>

        {/* 7. MY */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-gray-600 flex-1 py-2">
            <FaUser className="text-lg mb-1 animate-pulse" />
            <span className="text-[10px] font-black-han-sans">...</span>
          </div>
        ) : isAuthenticated ? (
          <Link
            href={isSeller ? "/mypage/seller" : "/mypage"}
            className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 flex-1 py-2"
          >
            <FaUser className="text-lg mb-1" />
            <span className="text-[10px] font-black-han-sans">MY</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 flex-1 py-2"
          >
            <FaSignInAlt className="text-lg mb-1" />
            <span className="text-[10px] font-black-han-sans">로그인</span>
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
      
      {/* 프로필 체크 모달 (구매자용) */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => {
          // 모달을 닫으면 현재 페이지에 머물기
          setShowProfileModal(false);
        }}
        missingFields={missingFields}
        onUpdateProfile={() => {
          // 프로필 업데이트 페이지로 이동
          clearCache();

          // 사용자 역할 확인
          const isSeller = user?.role === 'seller' || user?.user_type === '판매';
          const redirectPath = isSeller ? '/mypage/seller/settings' : '/mypage/settings';

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
    </nav>
  );
}
