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

  if (requiresBusiness && !profileData.is_business_verified) {
    missing.push('사업자 인증');
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