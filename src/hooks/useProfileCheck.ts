'use client';

import { useEffect, useState, useCallback } from 'react';
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

// 누락된 필드 체크 함수
function checkMissingFields(profileData: any): string[] {
  const missing: string[] = [];
  
  console.log('[checkMissingFields] 입력 데이터:', {
    role: profileData.role,
    user_type: profileData.user_type,
    phone_number: profileData.phone_number,
    address_region: profileData.address_region,
    business_number: profileData.business_number,
    representative_name: profileData.representative_name
  });
  
  // 모든 사용자 공통 필수 필드
  if (!profileData.phone_number) {
    console.log('[checkMissingFields] phone_number 누락');
    missing.push('연락처');
  }
  
  if (!profileData.address_region) {
    console.log('[checkMissingFields] address_region 누락');
    missing.push('활동지역');
  }
  
  // 판매자만 추가 필수 필드 체크
  if (profileData.role === 'seller' || profileData.user_type === '판매') {
    console.log('[checkMissingFields] 판매자 역할 감지, 추가 필드 체크');
    
    if (!profileData.business_number) {
      console.log('[checkMissingFields] business_number 누락');
      missing.push('사업자등록번호');
    }
    
    if (!profileData.representative_name) {
      console.log('[checkMissingFields] representative_name 누락');
      missing.push('대표자명');
    }
  }
  // 일반 회원은 공통 필드만 체크하므로 추가 로직 불필요
  
  console.log('[checkMissingFields] 최종 누락 필드:', missing);
  return missing;
}

export function useProfileCheck(): ProfileCheckResult {
  const { user } = useAuth();
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 프로필 완성도 체크 함수 (API 호출 없이 로컬 데이터 사용)
  const checkProfile = useCallback(async (): Promise<boolean> => {
    console.log('[ProfileCheck] 체크 시작 (로컬 데이터 사용):', user);
    
    if (!user) {
      console.log('[ProfileCheck] 사용자 정보 없음');
      return false;
    }

    // 비동기 효과를 위해 setTimeout 사용 (기존 동작과 동일하게)
    setIsCheckingProfile(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // 로컬 user 객체로 체크 수행
          console.log('[ProfileCheck] 로컬 사용자 데이터:', {
            phone_number: user.phone_number,
            address_region: user.address_region,
            role: user.role || user.user_type,
            business_number: user.business_number,
            business_address: user.business_address,
            representative_name: user.representative_name
          });
          
          // 누락된 필드 체크
          const missing = checkMissingFields(user);
          setMissingFields(missing);
          
          const isComplete = missing.length === 0;
          setIsProfileComplete(isComplete);
          
          console.log('[ProfileCheck] 프로필 완성도:', isComplete, '누락 필드:', missing);
          
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

  // 캐시 초기화 함수 (더 이상 필요 없지만 호환성 위해 유지)
  const clearCache = useCallback(() => {
    console.log('[ProfileCheck] clearCache 호출됨 (로컬 데이터 사용으로 실제 동작 없음)');
    // AuthContext에서 user 객체를 직접 사용하므로 캐시 초기화 불필요
  }, []);

  // user 객체가 변경될 때마다 프로필 완성도 업데이트
  useEffect(() => {
    if (user) {
      const missing = checkMissingFields(user);
      setMissingFields(missing);
      setIsProfileComplete(missing.length === 0);
    }
  }, [user]);

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