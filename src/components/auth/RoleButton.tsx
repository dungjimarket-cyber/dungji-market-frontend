'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

/**
 * 사용자 역할에 따라 조건부로 버튼을 렌더링하는 컴포넌트
 * 특정 역할의 사용자에게는 버튼이 보이지 않도록 할 수 있음
 */
interface RoleButtonProps {
  href: string;
  className?: string;
  children: ReactNode;
  disableForRoles?: string[]; // 버튼을 비활성화할 역할 목록
}

export function RoleButton({ href, className, children, disableForRoles = [] }: RoleButtonProps) {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 사용자 역할 확인 함수
    const checkUserRole = () => {
      // 1. NextAuth 세션에서 역할 확인
      if (session?.user?.role) {
        return session.user.role as string;
      }
      
      // 2. 로컬 스토리지에서 역할 확인
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
  }, [session, disableForRoles]);

  // 클라이언트 사이드 마운트 전에는 아무것도 렌더링하지 않음 (Hydration 오류 방지)
  if (!mounted) return null;
  
  // 역할에 따라 버튼 표시 여부 결정
  if (!shouldRender) return null;
  
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
