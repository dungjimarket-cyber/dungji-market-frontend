'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { refreshUserToken } from '@/lib/api/auth/token';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function TokenRefreshButton() {
  const { data: session } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    setMessage('');
    
    try {
      const result = await refreshUserToken();
      setMessage(`토큰이 갱신되었습니다. 새로운 role: ${result.user.role}`);
      
      // 세션 갱신을 위해 재로그인 권장
      setTimeout(() => {
        if (confirm('토큰이 갱신되었습니다. 변경사항을 적용하려면 다시 로그인해주세요.')) {
          signOut({ callbackUrl: '/login' });
        }
      }, 1000);
    } catch (error) {
      setMessage('토큰 갱신에 실패했습니다.');
      console.error('토큰 갱신 오류:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // role이 'user'인 경우에만 표시
  if (session?.user?.role !== 'user') {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800 mb-2">
        회원 정보가 업데이트되었습니다. 토큰을 갱신해주세요.
      </p>
      <Button
        onClick={handleRefreshToken}
        disabled={isRefreshing}
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? '갱신 중...' : '토큰 갱신'}
      </Button>
      {message && (
        <p className="text-sm mt-2 text-gray-600">{message}</p>
      )}
    </div>
  );
}