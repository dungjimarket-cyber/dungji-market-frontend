'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

/**
 * 사용자 객체가 소셜 공급자 정보를 포함하는지 확인하는 타입 가드 함수
 */
function isExtendedUser(user: any): user is { provider: string } {
  return typeof user?.provider === 'string';
}

function getLoginProviderLabel(user: any) {
  const type = user?.sns_type || user?.provider;
  if (type === 'kakao') return '카카오';
  if (type === 'google') return '구글';
  if (type === 'naver') return '네이버';
  if (type === 'apple') return '애플';
  if (type === 'email') return '이메일';
  if (!type) return '직접 가입';
  return type;
}

/**
 * 사용자 프로필 섹션 컴포넌트
 * 마이페이지에 표시되는 사용자 정보 섹션
 */

// 사용자 타입 정의 확장 (프로필 원활한 표시를 위한 필드 포함)
interface ExtendedUser {
  id?: number;
  email?: string;
  username?: string;
  name?: string;
  image?: string;
  roles?: string[];
}

export default function ProfileSection() {
  const { user: authUser, accessToken, isAuthenticated, isLoading, logout } = useAuth();
  // 확장된 타입으로 사용자 정보를 처리
  const user = authUser as unknown as ExtendedUser;
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // 이메일 필드 초기화
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  /**
   * 이메일 주소 업데이트 함수
   * JWT 토큰을 활용하여 사용자 프로필 업데이트
   */
  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  /**
   * 이메일 주소 업데이트 함수
   */
  const handleEmailUpdate = async () => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email }),
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        throw new Error('이메일 업데이트에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 업데이트 성공 - 새로고침을 통해 새 정보 적용
      router.refresh();
      
      setIsEditing(false);
      setError('');
    } catch (error: any) {
      setError(error.message || '이메일 업데이트 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) return null;
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">내 정보</h2>
      <div className="flex items-start space-x-4">
        {user?.image && (
          <div className="relative w-24 h-24">
            <Image
              src={user.image}
              alt="Profile"
              fill
              className="rounded-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">이름:</span> {user?.name || user?.username}
          </p>
          <div className="mb-2">
            <span className="font-semibold text-gray-600">이메일:</span>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="새로운 이메일 주소"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex space-x-2">
                  <button
                    onClick={handleEmailUpdate}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>{user?.email || '이메일 미등록'}</span>
                {!user?.email && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    이메일 등록
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600">
            <span className="font-semibold">로그인 방식:</span>{' '}
            {getLoginProviderLabel(user)}
          </p>
          
          {/* 로그아웃 버튼 추가 */}
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full text-sm transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
