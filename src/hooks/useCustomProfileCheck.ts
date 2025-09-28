'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CustomProfileCheckResult {
  isCheckingProfile: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  checkProfile: (requiresBusiness?: boolean) => Promise<boolean>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

function checkMissingFieldsForCustom(profileData: any, requiresBusiness: boolean = false): string[] {
  const missing: string[] = [];

  if (!profileData.nickname && !profileData.username) {
    missing.push('닉네임');
  }

  if (!profileData.phone_number) {
    missing.push('연락처');
  }

  if (!profileData.address_region) {
    missing.push('활동지역');
  }

  // 사업자 인증 체크 (오프라인 공구일 때만)
  if (requiresBusiness) {
    console.log('[CustomProfileCheck] 사업자 인증 체크:', {
      is_business_verified: profileData.is_business_verified,
      business_number: profileData.business_number,
      user_type: profileData.user_type,
      role: profileData.role
    });

    // is_business_verified가 true이거나, business_number가 있으면 인증된 것으로 간주
    if (!profileData.is_business_verified && !profileData.business_number) {
      missing.push('사업자 인증');
    }
  }

  return missing;
}

export function useCustomProfileCheck(): CustomProfileCheckResult {
  const { user } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const checkProfile = useCallback(async (requiresBusiness: boolean = false): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsCheckingProfile(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const missing = checkMissingFieldsForCustom(user, requiresBusiness);
          setMissingFields(missing);

          const isComplete = missing.length === 0;
          setIsProfileComplete(isComplete);

          setIsCheckingProfile(false);
          resolve(isComplete);
        } catch (error) {
          console.error('[CustomProfileCheck] 프로필 체크 오류:', error);
          setIsCheckingProfile(false);
          resolve(false);
        }
      }, 100);
    });
  }, [user]);

  useEffect(() => {
    if (user) {
      const missing = checkMissingFieldsForCustom(user, false);
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