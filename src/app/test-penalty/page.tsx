'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestPenaltyPage() {
  const { user, accessToken } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setError('No access token');
        return;
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        
        if (!response.ok) {
          setError(`HTTP ${response.status}`);
          return;
        }
        
        const data = await response.json();
        setProfileData(data);
        console.log('🔴 프로필 API 직접 호출 결과:', data);
        console.log('🔴 패널티 정보:', data.penalty_info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    fetchProfile();
  }, [accessToken]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">패널티 테스트 페이지</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">현재 사용자 (Context)</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-bold mb-2">프로필 API 응답</h2>
          {error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : profileData ? (
            <pre className="text-xs overflow-auto">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        {profileData?.penalty_info && (
          <div className="p-4 bg-red-100 rounded">
            <h2 className="font-bold mb-2">패널티 정보</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(profileData.penalty_info, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}