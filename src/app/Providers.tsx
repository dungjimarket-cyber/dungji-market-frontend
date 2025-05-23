'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SessionProvider } from 'next-auth/react';
import AuthDataSync from '@/components/auth/AuthDataSync';

/**
 * 애플리케이션에 필요한 모든 Context Provider를 제공하는 컴포넌트
 * NextAuth와 JWT 기반 인증을 모두 제공
 * AuthDataSync 컴포넌트를 통해 쿠키-로컬스토리지 간 인증 데이터 동기화
 */
export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>
        {/* 인증 데이터 동기화 (쿠키 -> 로컬스토리지) */}
        <AuthDataSync />
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
