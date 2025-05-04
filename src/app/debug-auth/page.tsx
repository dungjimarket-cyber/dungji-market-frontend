'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { tokenUtils } from '@/lib/tokenUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * JWT 기반 인증 디버깅 페이지
 */
export default function DebugAuthPage() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  
  useEffect(() => {
    async function fetchAuthInfo() {
      try {
        // tokenUtils를 사용하여 현재 토큰 정보 가져오기
        const token = await tokenUtils.getAccessToken();
        setTokenInfo({ token });
        
        // 토큰 디코딩 시도
        if (token) {
          const decoded = tokenUtils.decodeToken(token);
          setDecodedToken(decoded);
        }
      } catch (error) {
        console.error('인증 정보 가져오기 오류:', error);
      }
    }
    
    fetchAuthInfo();
  }, [accessToken]);
  
  const handleRefresh = async () => {
    // 토큰 정보 새로 가져오기
    const token = await tokenUtils.getAccessToken();
    setTokenInfo({ token });
    
    // 토큰 디코딩
    if (token) {
      const decoded = tokenUtils.decodeToken(token);
      setDecodedToken(decoded);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">인증 디버깅 페이지</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>로그인 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <p>인증 상태: {isLoading ? '로딩 중...' : isAuthenticated ? '인증됨' : '비인증'}</p>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>사용자 ID:</strong> {user?.id}
          </div>
          <div className="mb-2">
            <strong>이메일:</strong> {user?.email}
          </div>
          <div className="mb-2">
            <strong>역할(role):</strong> <span className={user?.role === 'seller' ? 'text-green-600 font-bold' : ''}>{user?.role}</span>
          </div>
          <div className="mb-2">
            <strong>역할 배열(roles):</strong> {user?.roles?.join(', ')}
          </div>
          <div className="mb-4">
            <strong>판매회원 여부:</strong> {user?.role === 'seller' ? '✅ 판매회원' : '❌ 일반회원'}
          </div>
          
          <details>
            <summary>전체 사용자 정보 (JSON)</summary>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
              {JSON.stringify(user, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>JWT 토큰 원본</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>디코딩된 JWT 토큰</CardTitle>
        </CardHeader>
        <CardContent>
          {decodedToken ? (
            <>
              <div className="mb-2">
                <strong>sub/user_id:</strong> {decodedToken.sub || decodedToken.user_id}
              </div>
              <div className="mb-2">
                <strong>이메일:</strong> {decodedToken.email}
              </div>
              <div className="mb-2">
                <strong>역할(role):</strong> <span className="text-red-600 font-bold">{decodedToken.role || '없음'}</span>
              </div>
              <div className="mb-2">
                <strong>역할 배열(roles):</strong> {Array.isArray(decodedToken.roles) ? decodedToken.roles.join(', ') : '없음'}
              </div>
              <div className="mb-2">
                <strong>만료 시간:</strong> {decodedToken.exp ? new Date(decodedToken.exp * 1000).toLocaleString() : '알 수 없음'}
              </div>
              
              <details className="mt-4">
                <summary>전체 토큰 데이터 (JSON)</summary>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
                  {JSON.stringify(decodedToken, null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <div className="text-red-500">토큰이 없거나 디코딩할 수 없습니다.</div>
          )}
        </CardContent>
      </Card>
      
      <Button onClick={handleRefresh}>정보 새로고침</Button>
    </div>
  );
}
