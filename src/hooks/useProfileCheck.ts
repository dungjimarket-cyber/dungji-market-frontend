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
  
  
  // 모든 사용자 공통 필수 필드
  if (!profileData.phone_number) {
    missing.push('연락처');
  }
  
  if (!profileData.address_region) {
    missing.push('활동지역');
  }
  
  // 판매자만 추가 필수 필드 체크
  if (profileData.role === 'seller' || profileData.user_type === '판매') {
    
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
  const { user } = useAuth();
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

  // 캐시 초기화 함수 - 프로필 업데이트 후 최신 정보 재확인
  const clearCache = useCallback(async () => {
    console.log('[ProfileCheck] clearCache 호출됨 - 프로필 정보 갱신');
    
    // 판매자인 경우 API를 통해 최신 프로필 정보 가져와서 확인
    if (user && (user.role === 'seller' || user.user_type === '판매')) {
      try {
        const token = localStorage.getItem('dungji_auth_token') || localStorage.getItem('accessToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const profileData = await response.json();
          
          // 갱신된 데이터로 누락 필드 체크
          const missing = checkMissingFields(profileData);
          setMissingFields(missing);
          setIsProfileComplete(missing.length === 0);
        }
      } catch (error) {
        // 프로필 갱신 실패
      }
    }
  }, [user]);

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
    showProfileModal,
    setShowProfileModal,
    clearCache,
  };
}