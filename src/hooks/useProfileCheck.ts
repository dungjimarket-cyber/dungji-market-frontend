'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProfileCheckResult {
  isCheckingProfile: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  checkProfile: () => Promise<boolean>;
  recheckProfile: () => Promise<boolean>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  clearCache: () => void;
}

// 누락된 필드 체크 함수
function checkMissingFields(profileData: any): string[] {
  const missing: string[] = [];
  
  
  // 모든 사용자 공통 필수 필드
  if (!profileData.phone_number) {
    missing.push('연락처');
  }
  
  if (!profileData.address_region) {
    missing.push('활동지역');
  }
  
  // 판매자만 추가 필수 필드 체크
  if (profileData.role === 'seller' || profileData.user_type === '판매') {
    // seller_category는 회원가입 시 필수이므로 체크 불필요
    // 견적 제안 권한은 백엔드에서 seller_category로 제어

    if (!profileData.business_number) {
      missing.push('사업자등록번호');
    }

    if (!profileData.representative_name) {
      missing.push('대표자명');
    }
  }
  // 일반 회원은 공통 필드만 체크하므로 추가 로직 불필요
  
  return missing;
}

export function useProfileCheck(): ProfileCheckResult {
  const { user, refetchProfile } = useAuth();
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 프로필 완성도 체크 함수 (API 호출 없이 로컬 데이터 사용)
  const checkProfile = useCallback(async (): Promise<boolean> => {
    
    if (!user) {
      return false;
    }

    // 비동기 효과를 위해 setTimeout 사용 (기존 동작과 동일하게)
    setIsCheckingProfile(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // 로컬 user 객체로 체크 수행
          
          // 누락된 필드 체크
          const missing = checkMissingFields(user);
          setMissingFields(missing);
          
          const isComplete = missing.length === 0;
          setIsProfileComplete(isComplete);
          
          
          setIsCheckingProfile(false);
          resolve(isComplete);
        } catch (error) {
          console.error('[ProfileCheck] 프로필 체크 오류:', error);
          setIsCheckingProfile(false);
          resolve(false);
        }
      }, 100); // 비동기 효과를 위한 최소 딜레이
    });
  }, [user]);

  // 프로필 재확인 (서버에서 최신 정보 가져온 후 체크)
  const recheckProfile = useCallback(async (): Promise<boolean> => {
    console.log('[ProfileCheck] 프로필 재확인 시작');
    setIsCheckingProfile(true);

    // 서버에서 최신 프로필 정보 가져오기
    await refetchProfile();

    return new Promise((resolve) => {
      // refetchProfile 완료 후 user가 업데이트되는 시간 대기
      setTimeout(() => {
        if (!user) {
          setIsCheckingProfile(false);
          resolve(false);
          return;
        }

        const missing = checkMissingFields(user);
        setMissingFields(missing);

        const isComplete = missing.length === 0;
        setIsProfileComplete(isComplete);

        console.log('[ProfileCheck] 재확인 완료:', { missing, isComplete });
        setIsCheckingProfile(false);
        resolve(isComplete);
      }, 300); // refetchProfile 완료 대기
    });
  }, [user, refetchProfile]);

  // 캐시 초기화 함수 - 프로필 업데이트 후 최신 정보 재확인 (하위 호환성 유지)
  const clearCache = useCallback(async () => {
    console.log('[ProfileCheck] clearCache 호출됨 - recheckProfile로 위임');
    await recheckProfile();
  }, [recheckProfile]);

  // user 객체가 변경될 때마다 프로필 완성도 업데이트
  useEffect(() => {
    if (user) {
      console.log('[ProfileCheck] User 변경 감지, 프로필 재확인:', {
        userId: user.id,
        role: user.role,
        business_number: user.business_number,
        representative_name: user.representative_name
      });
      const missing = checkMissingFields(user);
      setMissingFields(missing);
      setIsProfileComplete(missing.length === 0);
    } else {
      // user가 null이면 (로그아웃) 상태 초기화
      console.log('[ProfileCheck] User null - 상태 초기화');
      setMissingFields([]);
      setIsProfileComplete(false);
    }
  }, [user]);

  return {
    isCheckingProfile,
    isProfileComplete,
    missingFields,
    checkProfile,
    recheckProfile,
    showProfileModal,
    setShowProfileModal,
    clearCache,
  };
}