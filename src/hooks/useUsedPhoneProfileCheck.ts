'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UsedPhoneProfileCheckResult {
  isCheckingProfile: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  checkProfile: () => Promise<boolean>;
  recheckProfile: () => Promise<boolean>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

// 중고폰용 필수 필드 체크 함수 (일반회원, 판매자 모두 동일)
function checkMissingFieldsForUsedPhone(profileData: any): string[] {
  const missing: string[] = [];
  
  // 중고폰 거래를 위한 기본 필수 정보 체크
  if (!profileData.phone_number) {
    missing.push('연락처');
  }
  
  // 거래 지역도 필수 (내 지역 기능 사용을 위해)
  if (!profileData.address_region) {
    missing.push('활동지역');
  }
  
  // 판매자/일반회원 구분 없이 동일한 체크
  // 비즈니스 정보는 중고폰 거래에서는 불필요
  
  return missing;
}

export function useUsedPhoneProfileCheck(): UsedPhoneProfileCheckResult {
  const { user, refetchProfile } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 프로필 완성도 체크 함수 (중고폰용)
  const checkProfile = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsCheckingProfile(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // 중고폰용 필수 필드만 체크
          const missing = checkMissingFieldsForUsedPhone(user);
          setMissingFields(missing);

          const isComplete = missing.length === 0;
          setIsProfileComplete(isComplete);

          setIsCheckingProfile(false);
          resolve(isComplete);
        } catch (error) {
          console.error('[UsedPhoneProfileCheck] 프로필 체크 오류:', error);
          setIsCheckingProfile(false);
          resolve(false);
        }
      }, 100);
    });
  }, [user]);

  // 프로필 재확인 (서버에서 최신 정보 가져온 후 체크)
  const recheckProfile = useCallback(async (): Promise<boolean> => {
    console.log('[UsedPhoneProfileCheck] 프로필 재확인 시작');
    setIsCheckingProfile(true);

    try {
      // 서버에서 최신 프로필 정보 가져오기
      await refetchProfile();

      // refetchProfile이 완료되면 user 상태가 업데이트됨
      // 약간의 지연 후 user 상태 확인
      return new Promise((resolve) => {
        setTimeout(() => {
          if (!user) {
            setIsCheckingProfile(false);
            resolve(false);
            return;
          }

          const missing = checkMissingFieldsForUsedPhone(user);
          setMissingFields(missing);

          const isComplete = missing.length === 0;
          setIsProfileComplete(isComplete);

          console.log('[UsedPhoneProfileCheck] 재확인 완료:', { missing, isComplete });
          setIsCheckingProfile(false);
          resolve(isComplete);
        }, 300);
      });
    } catch (error) {
      console.error('[UsedPhoneProfileCheck] 재확인 오류:', error);
      setIsCheckingProfile(false);
      return false;
    }
  }, [user, refetchProfile]);

  // user 객체가 변경될 때마다 프로필 완성도 업데이트
  useEffect(() => {
    if (user) {
      const missing = checkMissingFieldsForUsedPhone(user);
      setMissingFields(missing);
      setIsProfileComplete(missing.length === 0);
    } else {
      // user가 null이면 (로그아웃) 상태 초기화
      setMissingFields([]);
      setIsProfileComplete(false);
    }
  }, [user]);

  // 페이지가 포커스를 받을 때 프로필 다시 체크 (마이페이지에서 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        // 프로필 정보 다시 체크
        const missing = checkMissingFieldsForUsedPhone(user);
        setMissingFields(missing);
        setIsProfileComplete(missing.length === 0);
        console.log('[ProfileCheck] 페이지 포커스 - 프로필 재확인:', { missing, isComplete: missing.length === 0 });
      }
    };

    window.addEventListener('focus', handleFocus);

    // visibility change 이벤트도 추가 (모바일 브라우저 대응)
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const missing = checkMissingFieldsForUsedPhone(user);
        setMissingFields(missing);
        setIsProfileComplete(missing.length === 0);
        console.log('[ProfileCheck] Visibility 변경 - 프로필 재확인:', { missing, isComplete: missing.length === 0 });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return {
    isCheckingProfile,
    isProfileComplete,
    missingFields,
    checkProfile,
    recheckProfile,
    showProfileModal,
    setShowProfileModal,
  };
}