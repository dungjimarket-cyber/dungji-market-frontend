'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import axios from 'axios';

// 디버깅 유틸리티 함수
const logDebug = (message: string, data?: any) => {
  const isKakaoInAppBrowser = typeof navigator !== 'undefined' && /KAKAOTALK/i.test(navigator.userAgent);
  console.log(`[Auth Debug${isKakaoInAppBrowser ? ' - Kakao' : ''}] ${message}`, data || '');
};

/**
 * 사용자 정보 타입 정의
 */
type User = {
  id: string;
  email: string;
  username?: string; // 닉네임 추가
  nickname?: string; // 대체 닉네임 필드
  name?: string; // 실명
  image?: string; // 프로필 이미지
  role?: string;
  roles?: string[];
  user_type?: string; // 회원 구분 (일반/판매)
  sns_type?: string; // SNS 로그인 타입 (kakao, google, email)
  phone_number?: string; // 휴대폰 번호
  region?: string; // 활동 지역 (구버전 호환용)
  address_region?: any; // 활동 지역 객체 (신버전)
  business_number?: string; // 사업자등록번호
  business_address?: string; // 사업장 주소
  is_business_verified?: boolean; // 사업자 인증 완료 여부
  representative_name?: string; // 사업자등록증상 대표자명
  penalty_info?: any; // 패널티 정보 (snake_case)
  penaltyInfo?: any; // 패널티 정보 (camelCase)
};

/**
 * 인증 컨텍스트 타입 정의
 */
// 로그인 결과 타입 정의
type LoginResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
  errorMessage?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  setInactivityTimeout: (minutes: number) => void;
  clearInactivityTimeout: () => void;
};

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * JWT 토큰에서 페이로드를 디코딩하는 유틸리티 함수
 * @param token JWT 토큰 문자열
 * @returns 디코딩된 페이로드 객체 또는 null
 */
const decodeJwtPayload = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('JWT 토큰 디코딩 오류:', error);
    return null;
  }
};

/**
 * 인증 프로바이더 컴포넌트
 * 애플리케이션에 인증 상태와 관련 기능을 제공
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 자동 로그아웃 관련 상태 및 참조
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [inactivityTimeout, setInactivityTimeoutValue] = useState<number>(60); // 기본값 60분
  
  /**
   * 자동 로그아웃을 위한 타이머 설정 함수
   * @param minutes 비활성 시간(분)
   */
  const setInactivityTimeout = useCallback((minutes: number) => {
    // 기존 타이머가 있으면 제거
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    // 새로운 타임아웃 값 저장
    setInactivityTimeoutValue(minutes);
    
    // 사용자가 로그인 상태인 경우에만 타이머 설정
    if (user && accessToken) {
      resetInactivityTimer();
    }
    
    // 로컬 스토리지에 타임아웃 설정 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('inactivityTimeout', minutes.toString());
    }
  }, [user, accessToken]);
  
  /**
   * 비활성 타이머 초기화 함수
   */
  const resetInactivityTimer = useCallback(() => {
    // 기존 타이머가 있으면 제거
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    // 사용자가 로그인 상태인 경우에만 새 타이머 설정
    if (user && accessToken) {
      inactivityTimerRef.current = setTimeout(async () => {
        logDebug(`비활성 시간 ${inactivityTimeout}분 경과, 자동 로그아웃 실행`);
        await logout();
      }, inactivityTimeout * 60 * 1000); // 분을 밀리초로 변환
    }
  }, [inactivityTimeout, user, accessToken]);
  
  /**
   * 비활성 타이머 제거 함수
   */
  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);
  
  // 사용자 활동 이벤트 리스너 설정
  useEffect(() => {
    if (typeof window === 'undefined' || !user || !accessToken) return;
    
    // 사용자 활동 감지 이벤트 리스너
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    
    // 다양한 사용자 활동 이벤트에 리스너 등록
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // 초기 타이머 설정
    resetInactivityTimer();
    
    // 클린업 함수
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInactivityTimeout();
    };
  }, [user, accessToken, resetInactivityTimer, clearInactivityTimeout]);
  
  // 초기 로딩시 로컬 스토리지에서 토큰 및 사용자 정보 복원
  useEffect(() => {
    let isInitializing = false;
    const initializeAuth = async () => {
      // 카카오톡 인앱 브라우저 감지
      const isKakaoInAppBrowser = typeof navigator !== 'undefined' && /KAKAOTALK/i.test(navigator.userAgent);
      
      // 이미 초기화 중이면 스킵
      if (isInitializing) {
        console.log('인증 초기화 이미 진행 중, 스킵합니다.');
        return;
      }
      
      // 카카오톡 브라우저에서 로딩 상태를 더 빠르게 완료하되, 기본 토큰 체크는 수행
      if (isKakaoInAppBrowser) {
        console.log('카카오톡 브라우저 감지 - 단순 초기화 모드');
        try {
          // 기본 토큰 체크만 수행
          const tokenKeys = ['dungji_auth_token', 'accessToken', 'auth.token'];
          let storedToken = null;
          
          for (const key of tokenKeys) {
            const token = localStorage.getItem(key);
            if (token) {
              storedToken = token;
              break;
            }
          }
          
          if (storedToken) {
            setAccessToken(storedToken);
            // 로컬 스토리지에서 사용자 정보 복원
            const userJson = localStorage.getItem('user') || localStorage.getItem('auth.user');
            if (userJson) {
              try {
                const userData = JSON.parse(userJson);
                setUser(userData);
              } catch (e) {
                console.error('사용자 정보 파싱 오류:', e);
              }
            }
          }
        } catch (error) {
          console.error('카카오톡 브라우저 초기화 오류:', error);
        }
        setIsLoading(false);
        return;
      }
      
      isInitializing = true;
      
      // 로컬 스토리지에서 비활성 타임아웃 설정 로드
      if (typeof window !== 'undefined') {
        const storedTimeout = localStorage.getItem('inactivityTimeout');
        if (storedTimeout) {
          const timeoutValue = parseInt(storedTimeout, 10);
          if (!isNaN(timeoutValue) && timeoutValue > 0) {
            setInactivityTimeoutValue(timeoutValue);
          }
        }
      }
      try {
        if (typeof window !== 'undefined') {
          console.log('페이지 로드 시 인증 상태 초기화 시작...');
          
          // 모든 호환 토큰 키 확인
          const tokenKeys = ['dungji_auth_token', 'accessToken', 'auth.token'];
          let storedToken = null;
          
          // 가장 먼저 발견된 유효한 토큰 사용
          for (const key of tokenKeys) {
            const token = localStorage.getItem(key);
            if (token) {
              storedToken = token;
              console.log(`토큰 발견: ${key}`);
              break;
            }
          }
          
          if (storedToken) {
            logDebug('유효한 토큰 발견: 인증 상태 복원 중');
            setAccessToken(storedToken);
            
            // 리프레시 토큰이 있는 경우 설정
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken);
            }
            
            // 1. 먼저 로컬 스토리지에서 사용자 정보 복원 시도
            let userData = null;
            const userKeys = ['user', 'auth.user'];
            
            for (const key of userKeys) {
              const userJson = localStorage.getItem(key);
              if (userJson) {
                try {
                  userData = JSON.parse(userJson);
                  logDebug(`사용자 정보 발견`, key);
                  break;
                } catch (e) {
                  console.error(`${key} 파싱 오류:`, e);
                }
              }
            }
            
            // 2. 백엔드에서 최신 프로필 정보 가져오기 시도
            // 카카오톡 인앱 브라우저에서는 프로필 API 호출 스킵 (무한 루프 방지)
            const isKakaoInAppBrowser = /KAKAOTALK/i.test(navigator.userAgent);
            if (isKakaoInAppBrowser && userData) {
              logDebug('카카오톡 브라우저에서 로컬 사용자 정보 사용', userData);
              setUser(userData);
            } else {
              try {
                console.log('백엔드에서 최신 프로필 정보 가져오기 시도...');
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/profile/`;
                const response = await fetch(apiUrl, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${storedToken}`,
                  },
                });
              
              if (response.ok) {
                const profileData = await response.json();
                console.log('프로필 API 응답 데이터:', profileData);
                console.log('sns_type 값:', profileData.sns_type);
                console.log('🔴 패널티 정보:', profileData.penalty_info);
                console.log('🔴 패널티 활성 상태:', profileData.penalty_info?.is_active);
                console.log('🔴 패널티 종료시간:', profileData.penalty_info?.end_date);
                logDebug('백엔드에서 프로필 정보 가져오기 성공', profileData);
                
                // 기존 로컬 데이터와 병합
                if (userData) {
                  userData = {
                    ...userData,
                    username: profileData.username,
                    nickname: profileData.nickname, // nickname 필드 추가
                    sns_type: profileData.sns_type,
                    provider: profileData.sns_type, // 호환성을 위해 provider 필드도 설정
                    phone_number: profileData.phone_number,
                    region: profileData.region,
                    address_region: profileData.address_region,
                    business_number: profileData.business_number, // 사업자등록번호 추가
                    business_address: profileData.business_address,
                    representative_name: profileData.representative_name, // 대표자명 추가
                    penalty_info: profileData.penalty_info, // 패널티 정보 추가
                    penaltyInfo: profileData.penaltyInfo // camelCase 버전도 추가
                  };
                  console.log('병합된 사용자 데이터:', userData);
                  logDebug('사용자 정보 업데이트 완료', userData);
                } else {
                  // 로컬 스토리지에 사용자 정보가 없는 경우
                  const decoded = decodeJwtPayload(storedToken);
                  userData = {
                    id: profileData.id || decoded?.user_id || '',
                    email: profileData.email || '',
                    username: profileData.username || '',
                    nickname: profileData.nickname || '', // nickname 필드 추가
                    role: decoded?.role || 'buyer',
                    token: storedToken,
                    sns_type: profileData.sns_type,
                    provider: profileData.sns_type,
                    phone_number: profileData.phone_number,
                    region: profileData.region,
                    address_region: profileData.address_region,
                    business_number: profileData.business_number, // 사업자등록번호 추가
                    business_address: profileData.business_address,
                    representative_name: profileData.representative_name, // 대표자명 추가
                  };
                  logDebug('새 사용자 정보 생성', userData);
                }
                
                // 로컬 스토리지에 업데이트된 정보 저장
                const userJson = JSON.stringify(userData);
                localStorage.setItem('user', userJson);
                localStorage.setItem('auth.user', userJson);
                localStorage.setItem('userRole', userData.role || 'buyer');
                
                // 상태 업데이트
                setUser(userData);
              } else {
                console.warn('프로필 정보 가져오기 실패:', response.status);
                console.error('프로필 API 응답 상태:', response.status, response.statusText);
                
                // 백엔드 요청 실패시 로컬 데이터만 사용
                if (userData) {
                  console.log('프로필 API 실패, 로컬 데이터 사용:', userData);
                  setUser(userData);
                  console.log('로컬 스토리지에서 사용자 정보 복원 성공', userData.role || 'role 없음');
                } else {
                  // 로컬 데이터도 없는 경우 토큰에서 추출
                  console.log('사용자 정보 발견 실패, 토큰에서 정보 추출 시도...');
                  
                  const decoded = decodeJwtPayload(storedToken);
                  if (decoded) {
                    const userId = decoded.user_id || decoded.sub || '';
                    const userEmail = decoded.email || '';
                    const userRole = decoded.role || 'buyer';
                    
                    const extractedUser = {
                      id: userId,
                      email: userEmail,
                      role: userRole,
                      token: storedToken
                    };
                    
                    // 사용자 정보 설정 및 로컬 스토리지에 저장
                    setUser(extractedUser);
                    localStorage.setItem('user', JSON.stringify(extractedUser));
                    localStorage.setItem('auth.user', JSON.stringify(extractedUser));
                    localStorage.setItem('userRole', userRole);
                    console.log('토큰에서 사용자 정보 추출 성공:', userRole);
                  }
                }
              }
            } catch (apiError) {
              console.error('API 호출 오류:', apiError);
              // API 호출 실패시 기존 로직으로 폴백
              if (userData) {
                setUser(userData);
              } else {
                // 토큰에서 정보 추출 시도
                try {
                  const decoded = decodeJwtPayload(storedToken);
                  if (decoded) {
                    const userId = decoded.user_id || decoded.sub || '';
                    const userEmail = decoded.email || '';
                    const userRole = decoded.role || 'buyer';
                    
                    const extractedUser = {
                      id: userId,
                      email: userEmail,
                      role: userRole,
                      token: storedToken
                    };
                    
                    setUser(extractedUser);
                    localStorage.setItem('user', JSON.stringify(extractedUser));
                    localStorage.setItem('auth.user', JSON.stringify(extractedUser));
                    localStorage.setItem('userRole', userRole);
                  }
                } catch (jwtError) {
                  console.error('JWT 파싱 오류:', jwtError);
                }
              }
            }
          }
          } else {
            logDebug('로컬 스토리지에서 토큰을 찾을 수 없습니다. 비로그인 상태입니다.');
            // 비로그인 상태로 초기화
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
        }
      } catch (error) {
        console.error('인증 상태 초기화 오류:', error);
      } finally {
        setIsLoading(false);
        // 초기화 완료 후 플래그 리셋
        setTimeout(() => {
          isInitializing = false;
        }, 500);
      }
    };

    initializeAuth();
    
    // 스토리지 이벤트 리스너 추가 - 다른 컴포넌트에서 인증 상태 변경 시 반영
    let isHandlingStorageChange = false;
    const handleStorageChange = (event: StorageEvent) => {
      // 카카오톡 인앱 브라우저 감지
      const isKakaoInAppBrowser = /KAKAOTALK/i.test(navigator.userAgent);
      
      // 이미 처리 중이거나 카카오톡 브라우저에서 특정 이벤트는 무시
      if (isHandlingStorageChange || (isKakaoInAppBrowser && !event.newValue)) {
        return;
      }
      
      if (event.key && (
          event.key.includes('token') || 
          event.key.includes('auth') || 
          event.key === 'user' || 
          event.key === 'userRole'
        )) {
        logDebug('인증 상태 변경 감지', event.key);
        
        // 중복 실행 방지
        isHandlingStorageChange = true;
        setTimeout(() => {
          isHandlingStorageChange = false;
        }, 1000);
        
        initializeAuth();
      }
    };
    
    // 수동 이벤트 리스너
    const handleManualStorageChange = () => {
      if (isHandlingStorageChange) return;
      
      logDebug('수동 스토리지 이벤트 감지');
      isHandlingStorageChange = true;
      setTimeout(() => {
        isHandlingStorageChange = false;
      }, 1000);
      
      initializeAuth();
    };
    
    // 이벤트 리스너 등록 (카카오톡 브라우저에서는 비활성화)
    const isKakaoInAppBrowser = typeof navigator !== 'undefined' && /KAKAOTALK/i.test(navigator.userAgent);
    if (typeof window !== 'undefined' && !isKakaoInAppBrowser) {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('auth-changed', handleManualStorageChange);
    }
    
    // 클린업 함수
    return () => {
      if (typeof window !== 'undefined' && !isKakaoInAppBrowser) {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('auth-changed', handleManualStorageChange);
      }
    };
  }, []);

  /**
   * 로그인 함수
   * @param email 이메일 (실제로는 username으로 전송됨)
   * @param password 비밀번호
   * @returns 로그인 결과 객체 {success, error, errorCode, errorMessage}
   */
  const login = useCallback(async (email: string, password: string): Promise<{ 
    success: boolean; 
    error?: string; 
    errorCode?: string;
    errorMessage?: string;
  }> => {
    try {
      setIsLoading(true);
      logDebug('로그인 시도 중', email);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email, // 백엔드 API는 username 필드 사용
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('로그인 실패:', response.status, errorData);
        
        // 백엔드에서 반환하는 에러 메시지 처리
        let errorMessage = '로그인에 실패했습니다.';
        let errorCode = 'unknown';
        
        // HTTP 상태 코드에 따른 에러 메시지
        if (response.status === 401) {
          errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.';
          errorCode = 'invalid_credentials';
        } else if (response.status === 404) {
          errorMessage = '로그인 서비스를 찾을 수 없습니다. 관리자에게 문의하세요.';
          errorCode = 'service_unavailable';
        } else if (response.status === 429) {
          errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
          errorCode = 'too_many_requests';
        } else if (response.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          errorCode = 'server_error';
        }
        
        // 백엔드에서 반환한 에러 메시지가 있는 경우 사용
        if (errorData.detail) {
          // "지정된 자격 증명에 해당하는 활성화된 사용자를 찾을 수 없습니다" 메시지를 변환
          if (errorData.detail.includes('자격 증명') || errorData.detail.includes('활성화된 사용자')) {
            errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.';
          } else {
            errorMessage = errorData.detail;
          }
          
          // 사업자번호 검증 실패 처리
          if (errorData.business_verification_failed) {
            errorCode = 'business_verification_failed';
            
            // 검증 상태에 따른 상세 메시지
            switch (errorData.verification_status) {
              case 'closed':
                errorMessage = '폐업한 사업자번호로 등록된 계정입니다. 사업자번호를 확인하거나 고객센터로 문의해주세요.';
                break;
              case 'invalid':
                errorMessage = '등록되지 않은 사업자번호로 등록된 계정입니다. 사업자번호를 확인하거나 고객센터로 문의해주세요.';
                break;
              case 'error':
                errorMessage = '사업자번호 검증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                break;
              case 'system_error':
                errorMessage = '사업자번호 검증 중 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                break;
              default:
                errorMessage = errorData.detail;
            }
          }
          
          // 사업자번호 등록 필요
          if (errorData.business_verification_required) {
            errorCode = 'business_verification_required';
            errorMessage = '등록된 사업자번호가 없습니다. 고객센터로 문의해주세요.';
          }
        } else if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          const msg = errorData.non_field_errors[0];
          // 영어 메시지도 처리
          if (msg.includes('No active account') || msg.includes('credentials')) {
            errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.';
          } else {
            errorMessage = msg;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        return {
          success: false,
          error: `로그인 실패 (${response.status})`,
          errorCode,
          errorMessage
        };
      }

      const data = await response.json();
      const { access, refresh } = data;
      logDebug('로그인 성공: 토큰 수신됨');

      // 토큰 저장
      setAccessToken(access);
      setRefreshToken(refresh);

      if (typeof window !== 'undefined') {
        // localStorage에 토큰 저장
        localStorage.setItem('accessToken', access);
        localStorage.setItem('dungji_auth_token', access); 
        localStorage.setItem('auth.token', access);
        localStorage.setItem('auth.status', 'authenticated');
        
        if (refresh) {
          localStorage.setItem('refreshToken', refresh);
        }
        
        // 쿠키에도 토큰 저장 (서버 컴포넌트에서 인식하기 위함)
        document.cookie = `accessToken=${access}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `dungji_auth_token=${access}; path=/; max-age=86400; SameSite=Lax`;
        
        if (refresh) {
          document.cookie = `refreshToken=${refresh}; path=/; max-age=86400; SameSite=Lax`;
        }
      }

      // 토큰에서 사용자 정보 추출
      try {
        const decoded = decodeJwtPayload(access);
        if (decoded) {
          const userId = decoded.user_id;
          const userEmail = decoded.email || email;
          const userRole = decoded.role || 'buyer';
          
          // 프로필 정보 가져오기
          try {
            const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/profile/`, {
              headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const user = {
                id: userId,
                email: userEmail,
                role: userRole,
                username: profileData.username,
                nickname: profileData.nickname, // nickname 필드 추가
                phone_number: profileData.phone_number,
                region: profileData.region,
                address_region: profileData.address_region,
                business_address: profileData.business_address,
                representative_name: profileData.representative_name, // 대표자명 추가
                sns_type: profileData.sns_type,
                provider: profileData.sns_type,
                token: access,
                penalty_info: profileData.penalty_info, // 패널티 정보 추가
                penaltyInfo: profileData.penaltyInfo // camelCase 버전도 추가
              };
              
              setUser(user);
              
              if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('auth.user', JSON.stringify(user));
                localStorage.setItem('userRole', userRole);
              }
              
              logDebug('로그인 성공 및 프로필 정보 로드 완료');
              setIsLoading(false);
              return { success: true };
            }
          } catch (profileError) {
            console.error('프로필 정보 로드 실패:', profileError);
          }
          
          // 프로필 정보 로드 실패시 기본 정보만 사용
          const user = {
            id: userId,
            email: userEmail,
            role: userRole
          };
          
          setUser(user);
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('auth.user', JSON.stringify(user));
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('isSeller', userRole === 'seller' ? 'true' : 'false');
            
            // 인증 상태 변경 이벤트 발생
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('auth-changed'));
            logDebug('인증 상태 변경 이벤트 발생됨 - 로그인 성공');
          }
        }
      } catch (error) {
        console.error('토큰 파싱 오류:', error);
      }
      
      setIsLoading(false);
      return { success: true };
    
    } catch (error) {
      console.error('로그인 오류:', error);
      setIsLoading(false);
      return {
        success: false,
        error: '네트워크 오류',
        errorCode: 'network_error',
        errorMessage: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
      };
    }
  }, []);

  /**
   * 사용자 로그아웃 처리 함수
   * localStorage, sessionStorage, 쿠키에서 모든 사용자 관련 데이터를 제거합니다.
   * 
   * @example
   * ```tsx
   * const { logout } = useAuth();
   * 
   * const handleLogout = () => {
   *   logout();
   *   // 로그아웃 후 처리
   * };
   * ```
   */
  const logout = useCallback(async () => {
    try {
      logDebug('로그아웃 처리 중');
      
      // 사용자 상태 먼저 삭제 (UI 즉시 반영)
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      
      if (typeof window !== 'undefined') {
        // 모든 인증 관련 로컬 스토리지 클리어
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('dungji_auth_token');
        localStorage.removeItem('auth.token');
        localStorage.removeItem('auth.status');
        
        // 인증 관련 쿠키도 삭제
        document.cookie = 'accessToken=; path=/; max-age=0';
        document.cookie = 'dungji_auth_token=; path=/; max-age=0';
        document.cookie = 'refreshToken=; path=/; max-age=0';
        localStorage.removeItem('auth.user');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isSeller');
        localStorage.removeItem('__auth_time');
        localStorage.removeItem('dungji_redirect_url');
        
        // 프로필 관련 캐시 제거
        localStorage.removeItem('profile_cache');
        localStorage.removeItem('seller_profile');
        localStorage.removeItem('buyer_profile');
        localStorage.removeItem('business_number');
        localStorage.removeItem('representative_name');
        localStorage.removeItem('business_address');
        
        // 추가로 생성된 수 있는 로컬 스토리지 클리어
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('auth.') || 
              key.includes('token') || 
              key.includes('Token') ||
              key.includes('profile') ||
              key.includes('Profile') ||
              key.includes('business') ||
              key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
        
        // 세션 스토리지도 정리
        sessionStorage.clear();
        
        // 로그아웃 이벤트 발생
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth-changed'));
        logDebug('인증 상태 변경 이벤트 발생됨 - 로그아웃');
      }

      // NextAuth 세션 삭제
      await signOut({ redirect: false });
      console.log('NextAuth 세션 삭제 완료');
      
      // 세션 변경 이벤트 발생
      typeof window !== 'undefined' && window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  }, []);

  /**
   * 토큰 만료 감지 및 자동 갱신 함수
   * 401 Unauthorized 오류 발생 시 리프레시 토큰으로 새 액세스 토큰 요청
   * @returns 토큰 갱신 성공 여부
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;
    
    try {
      logDebug('액세스 토큰 갱신 시도...');
      // 실제 백엔드 엔드포인트 사용
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh/`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error(`토큰 갱신 실패: ${response.status}`);
      }
      
      const data = await response.json();
      const newAccessToken = data.access;
      
      // 새 액세스 토큰 저장
      setAccessToken(newAccessToken);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('dungji_auth_token', newAccessToken);
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('auth.token', newAccessToken);
        localStorage.setItem('auth.status', 'authenticated');
        
        // 세션 변경 이벤트 발생
        window.dispatchEvent(new Event('storage'));
      }
      
      logDebug('토큰 갱신 성공');
      return true;
    } catch (error) {
      logDebug('토큰 갱신 오류:', error);
      
      // 리프레시 토큰도 만료된 경우 로그아웃 처리
      if (error instanceof Error && error.message.includes('401')) {
        logDebug('리프레시 토큰이 만료되었습니다. 재로그인이 필요합니다.');
        console.warn('리프레시 토큰이 만료되었습니다. 재로그인이 필요합니다.');
        await logout();
      }
      
      return false;
    }
  }, [refreshToken, logout]);

  // Axios 인터셉터 설정 - 401 오류 시 토큰 갱신
  useEffect(() => {
    if (typeof window === 'undefined' || !accessToken) return;
    
    // 요청 인터셉터
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        if (accessToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );
    
    // 응답 인터셉터
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // 401 오류이고 재시도하지 않은 요청인 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // 토큰 갱신 시도
            const refreshed = await refreshTokens();
            
            if (refreshed) {
              // 새 토큰으로 원래 요청 재시도
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('토큰 갱신 중 오류:', refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // 클린업 함수
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshTokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        refreshToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        logout,
        refreshTokens,
        setInactivityTimeout,
        clearInactivityTimeout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 상태 및 기능에 접근하기 위한 훅
 * 
 * @returns 인증 컨텍스트 객체
 * 
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>로그인이 필요합니다</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>프로필: {user?.email}</h1>
 *       <button onClick={logout}>로그아웃</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
