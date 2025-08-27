'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

// Define custom session user type that includes role
interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  accessToken?: string;
  jwt?: {
    access: string;
    refresh: string;
  };
}

/**
 * 사용자 역할에 따라 조건부로 버튼을 렌더링하는 컴포넌트
 * 특정 역할의 사용자에게는 버튼이 보이지 않도록 할 수 있음
 */
interface RoleButtonProps {
  href: string;
  className?: string;
  children: ReactNode;
  disableForRoles?: string[]; // 버튼을 비활성화할 역할 목록
  style?: React.CSSProperties; // 스타일 속성 추가
}

export function RoleButton({ href, className, children, disableForRoles = [], style }: RoleButtonProps) {
  // Initialize state variables
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // 세션 훅 사용 시 오류 방지를 위한 상태 변수
  const [isSessionAvailable, setIsSessionAvailable] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  
  // 안전하게 세션 데이터 가져오기
  let session: any = null;
  try {
    // useSession 훅 직접 사용 (SessionProvider가 있는 경우에만 작동)
    const { data } = useSession({ required: false });
    session = data;
  } catch (error) {
    // SessionProvider가 없는 경우 조용히 실패
    console.error('SessionProvider 없이 useSession이 호출됨:', error);
  }
  

  useEffect(() => {
    setMounted(true);
    
    // 클라이언트 사이드에서만 실행되는 코드
    if (typeof window !== 'undefined') {
      // 사용자 역할 확인 함수
      const checkUserRole = () => {
        // First check session if available
        if (session?.user) {
          // Use type assertion for the custom user properties
          const user = session.user as CustomUser;
          if (user.role) {
            return user.role;
          }
        }
        
        // Fall back to localStorage if session is not available
        try {
          // 여러 소스에서 사용자 정보 추출 시도
          const userRole = localStorage.getItem('userRole');
          if (userRole) return userRole;
          
          const authUserStr = localStorage.getItem('auth.user') || localStorage.getItem('user');
          if (authUserStr) {
            const authUser = JSON.parse(authUserStr);
            if (authUser.role) return authUser.role;
          }
          
          // 세션 스토리지 확인
          const sessionStr = sessionStorage.getItem('next-auth.session');
          if (sessionStr) {
            const sessionData = JSON.parse(sessionStr);
            if (sessionData.user?.role) return sessionData.user.role;
          }
          
          // dungji_auth_token 확인
          const authToken = localStorage.getItem('dungji_auth_token');
          if (authToken) {
            try {
              // JWT 토큰에서 역할 정보 추출 시도
              const tokenParts = authToken.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                if (payload.role) return payload.role;
              }
            } catch (e) {
              console.error('JWT 토큰 파싱 오류:', e);
            }
          }
        } catch (error) {
          console.error('사용자 역할 추출 오류:', error);
        }
        
        return null;
      };
      
      // 역할 확인 및 렌더링 여부 결정
      const role = checkUserRole();
      setUserRole(role);
      
      // disableForRoles 배열에 현재 사용자 역할이 포함되어 있으면 렌더링하지 않음
      if (role && disableForRoles.includes(role)) {
        setShouldRender(false);
      } else {
        setShouldRender(true);
      }
    
      // 스토리지 변경 감지
      const handleStorageChange = () => {
        const newRole = checkUserRole();
        setUserRole(newRole);
        setShouldRender(!(newRole && disableForRoles.includes(newRole)));
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [disableForRoles, session]);

  // 클라이언트 사이드 마운트 전에는 아무것도 렌더링하지 않음 (Hydration 오류 방지)
  if (!mounted) return null;
  
  // 역할에 따라 버튼 표시 여부 결정
  if (!shouldRender) return null;
  
  // Add default styles for responsive text handling
  const responsiveStyles: React.CSSProperties = {
    // Allow text to wrap naturally
    whiteSpace: 'normal',
    // Ensure text breaks at word boundaries when possible
    wordBreak: 'break-word',
    // Prevent overflow with ellipsis
    overflow: 'hidden',
    // Combine user-provided styles with our responsive defaults
    ...style
  };
  
  return (
    <Link 
      href={href} 
      className={`${className || ''} whitespace-normal break-words`}
      style={responsiveStyles}
    >
      {children}
    </Link>
  );
}
