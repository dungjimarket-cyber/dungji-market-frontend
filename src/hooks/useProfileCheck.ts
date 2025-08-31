'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProfileCheckResult {
  isCheckingProfile: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  checkProfile: () => Promise<boolean>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  clearCache: () => void;
}

// 캐시 유효 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

interface CachedProfile {
  data: any;
  timestamp: number;
}

// 누락된 필드 체크 함수
function checkMissingFields(profileData: any): string[] {
  const missing: string[] = [];
  
  // 일반회원(buyer) 필수 정보 체크
  if (profileData.role === 'buyer') {
    if (!profileData.phone_number) {
      missing.push('연락처');
    }
    if (!profileData.address_region) {
      missing.push('활동지역');
    }
  }
  
  // 판매회원(seller) 필수 정보 체크
  if (profileData.role === 'seller') {
    if (!profileData.phone_number) {
      missing.push('연락처');
    }
    if (!profileData.business_number) {
      missing.push('사업자등록번호');
    }
    if (!profileData.address_region) {
      missing.push('활동지역');
    }
  }
  
  return missing;
}

export function useProfileCheck(): ProfileCheckResult {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // 캐시 저장소
  const profileCache = useRef<CachedProfile | null>(null);

  // 프로필 완성도 체크 함수
  const checkProfile = useCallback(async (): Promise<boolean> => {
    if (!user || !accessToken) {
      console.log('[ProfileCheck] 사용자 정보 없음');
      return false;
    }

    // 캐시 확인
    if (profileCache.current) {
      const now = Date.now();
      const cacheAge = now - profileCache.current.timestamp;
      
      // 캐시가 유효한 경우
      if (cacheAge < CACHE_DURATION) {
        console.log('[ProfileCheck] 캐시된 데이터 사용 (age:', Math.floor(cacheAge / 1000), '초)');
        const profileData = profileCache.current.data;
        
        // 캐시된 데이터로 체크 수행
        const missing = checkMissingFields(profileData);
        setMissingFields(missing);
        const isComplete = missing.length === 0;
        setIsProfileComplete(isComplete);
        
        return isComplete;
      }
    }

    setIsCheckingProfile(true);
    
    try {
      // 백엔드에서 최신 사용자 정보 가져오기
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('[ProfileCheck] 프로필 정보 가져오기 실패:', response.status);
        setIsCheckingProfile(false);
        return false;
      }

      const profileData = await response.json();
      console.log('[ProfileCheck] 프로필 데이터 (새로 가져옴):', profileData);
      
      // 캐시 업데이트
      profileCache.current = {
        data: profileData,
        timestamp: Date.now()
      };

      // 누락된 필드 체크
      const missing = checkMissingFields(profileData);
      setMissingFields(missing);
      const isComplete = missing.length === 0;
      setIsProfileComplete(isComplete);
      
      if (!isComplete) {
        console.log('[ProfileCheck] 누락된 필수 정보:', missing);
      }

      setIsCheckingProfile(false);
      return isComplete;
    } catch (error) {
      console.error('[ProfileCheck] 프로필 체크 오류:', error);
      setIsCheckingProfile(false);
      return false;
    }
  }, [user, accessToken]);

  // 캐시 무효화 함수
  const clearCache = useCallback(() => {
    profileCache.current = null;
    console.log('[ProfileCheck] 캐시 초기화됨');
  }, []);

  return {
    isCheckingProfile,
    isProfileComplete,
    missingFields,
    checkProfile,
    showProfileModal,
    setShowProfileModal,
    clearCache,
  };
}