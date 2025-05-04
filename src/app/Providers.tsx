'use client';

import { AuthProvider } from '@/contexts/AuthContext';

/**
 * 애플리케이션에 필요한 모든 Context Provider를 제공하는 컴포넌트
 * 현재는 JWT 기반 인증을 위한 AuthProvider만 포함
 */
export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
