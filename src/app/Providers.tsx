'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SessionProvider } from 'next-auth/react';

/**
 * 애플리케이션에 필요한 모든 Context Provider를 제공하는 컴포넌트
 * NextAuth와 JWT 기반 인증을 모두 제공
 */
export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
