'use client';

import { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { tokenUtils } from '@/lib/tokenUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugAuthPage() {
  const { data: sessionData, status } = useSession();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  useEffect(() => {
    async function fetchSessionInfo() {
      try {
        const session = await getSession();
        setSessionInfo(session);
        
        // 토큰 가져오기 시도
        const token = await tokenUtils.getAccessToken();
        setTokenInfo({ token });
      } catch (error) {
        console.error('세션 정보 가져오기 오류:', error);
      }
    }
    
    fetchSessionInfo();
  }, []);
  
  const handleRefresh = async () => {
    const session = await getSession();
    setSessionInfo(session);
    
    const token = await tokenUtils.getAccessToken();
    setTokenInfo({ token });
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">인증 디버깅 페이지</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>로그인 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Status: {status}</p>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>토큰 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Button onClick={handleRefresh}>정보 새로고침</Button>
    </div>
  );
}
