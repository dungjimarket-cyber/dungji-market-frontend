'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UsedProfileCheckResult {
  isCheckingProfile: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  checkProfile: () => Promise<boolean>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

// 중고거래용 필수 필드 체크 함수
function checkMissingFieldsForUsed(profileData: any): string[] {
  const missing: string[] = [];

  // 중고거래 필수 필드 (회원구분 없이 모두 동일)
  if (!profileData.nickname && !profileData.username) {
    missing.push('닉네임');
  }

  if (!profileData.phone_number) {
    missing.push('연락처');
  }

  if (!profileData.address_region) {
    missing.push('거래지역');
  }

  return missing;
}

export function useUsedProfileCheck(): UsedProfileCheckResult {
  const { user } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 프로필 완성도 체크 함수
  const checkProfile = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsCheckingProfile(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // 누락된 필드 체크
          const missing = checkMissingFieldsForUsed(user);
          setMissingFields(missing);

          const isComplete = missing.length === 0;
          setIsProfileComplete(isComplete);

          setIsCheckingProfile(false);
          resolve(isComplete);
        } catch (error) {
          console.error('[UsedProfileCheck] 프로필 체크 오류:', error);
          setIsCheckingProfile(false);
          resolve(false);
        }
      }, 100);
    });
  }, [user]);

  // user 객체가 변경될 때마다 프로필 완성도 업데이트
  useEffect(() => {
    if (user) {
      const missing = checkMissingFieldsForUsed(user);
      setMissingFields(missing);
      setIsProfileComplete(missing.length === 0);
    } else {
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