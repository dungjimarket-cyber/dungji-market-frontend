'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function RoleUpdateNotice() {
  const { user, logout } = useAuth();
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // user role이 'user'인 경우 감지
    if (user?.role === 'user') {
      setShowNotice(true);
      console.warn('구버전 role 감지됨. 재로그인이 필요합니다.');
    }
  }, [user]);

  const handleRelogin = async () => {
    // 로컬 스토리지 클리어
    if (typeof window !== 'undefined') {
      // 모든 인증 관련 스토리지 클리어
      const authKeys = [
        'accessToken',
        'refreshToken',
        'dungji_auth_token',
        'auth.token',
        'auth.status',
        'auth.user',
        'user',
        'userRole',
        'isSeller',
        'next-auth.session-token',
        'next-auth.session',
        'next-auth.csrf-token'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // 쿠키도 클리어
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    
    // 로그아웃 후 로그인 페이지로 이동
    await logout();
    window.location.href = '/login';
  };

  if (!showNotice || user?.role !== 'user') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">회원 정보 업데이트 필요</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-orange-700 mb-3">
            회원 역할 정보가 업데이트되었습니다. 
            원활한 서비스 이용을 위해 다시 로그인해주세요.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleRelogin}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              다시 로그인
            </Button>
            <Button
              onClick={() => setShowNotice(false)}
              size="sm"
              variant="outline"
            >
              나중에
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}