'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UsedPhoneProfileCheckResult {
  isCheckingProfile: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  checkProfile: () => Promise<boolean>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

// 중고폰용 필수 필드 체크 함수 (일반회원, 판매자 모두 동일)
function checkMissingFieldsForUsedPhone(profileData: any): string[] {
  const missing: string[] = [];
  
  // 중고폰 거래를 위한 기본 필수 정보만 체크
  if (!profileData.phone_number) {
    missing.push('연락처');
  }
  
  // 거래 지역은 선택사항 (등록 시 별도 입력 가능)
  // if (!profileData.address_region) {
  //   missing.push('활동지역');
  // }
  
  // 판매자/일반회원 구분 없이 동일한 체크
  // 비즈니스 정보는 중고폰 거래에서는 불필요
  
  return missing;
}

export function useUsedPhoneProfileCheck(): UsedPhoneProfileCheckResult {
  const { user } = useAuth();
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

  return {
    isCheckingProfile,
    isProfileComplete,
    missingFields,
    checkProfile,
    showProfileModal,
    setShowProfileModal,
  };
}