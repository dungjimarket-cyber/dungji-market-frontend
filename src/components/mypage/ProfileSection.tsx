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
  username?: string;  // 사용자 닉네임
  nickname?: string;  // 대체 닉네임 필드
  name?: string;      // 실명
  image?: string;
  roles?: string[];
}

export default function ProfileSection() {
  const { user: authUser, setUser, accessToken, isAuthenticated, isLoading, logout } = useAuth();
  // 확장된 타입으로 사용자 정보를 처리
  const user = authUser as unknown as ExtendedUser;
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<'email' | 'nickname' | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  
  // 컴포넌트 마운트시 백엔드에서 최신 프로필 정보 가져오기
  useEffect(() => {
    const fetchProfileData = async () => {
      if (accessToken) {
        try {
          console.log('백엔드에서 최신 프로필 정보 가져오기 시도...');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            console.log('백엔드에서 가져온 프로필 정보:', profileData);
            
            // 이메일과 닉네임 상태 업데이트
            setEmail(profileData.email || '');
            setNickname(profileData.username || '');
            
            // AuthContext와 로컬스토리지 업데이트
            if (setUser && authUser) {
              // authUser 사용 (user가 아님) - 원본 AuthContext의 사용자 객체
              const updatedUser = {
                ...authUser,
                email: profileData.email,
                username: profileData.username,
                sns_type: profileData.sns_type,
              };
              
              // AuthContext 업데이트
              setUser(updatedUser as any); // 타입 캐스팅 추가
              
              // 로컬스토리지 업데이트
              localStorage.setItem('user', JSON.stringify(updatedUser));
              localStorage.setItem('auth.user', JSON.stringify(updatedUser));
              
              console.log('사용자 정보 업데이트 완료:', updatedUser);
            }
          } else {
            console.error('프로필 정보 가져오기 실패:', response.status);
          }
        } catch (error) {
          console.error('프로필 정보 가져오기 오류:', error);
        }
      }
    };
    
    fetchProfileData();
  }, [accessToken, setUser]); // user 의존성 제거
  
  // 이메일 및 닉네임 필드 초기화 (선택적 백업 용도)
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    
    // 닉네임 초기화 - username 또는 nickname 또는 이메일 앞부분 사용
    if (user?.username) {
      setNickname(user.username);
    } else if (user?.nickname) {
      setNickname(user.nickname);
    } else if (user?.email) {
      // 닉네임이 없는 경우 이메일 앞부분을 기본 닉네임으로 사용
      const defaultNickname = user.email.split('@')[0];
      setNickname(defaultNickname);
    }
  }, [user?.email, user?.username, user?.nickname]);

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
   * 프로필 정보 업데이트 함수 (이메일 또는 닉네임)
   */
  const handleProfileUpdate = async () => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 업데이트할 필드 확인
    if (!editField) {
      setError('업데이트할 필드를 선택해주세요.');
      return;
    }

    // 업데이트할 데이터 객체 준비
    const updateData: {email?: string, username?: string} = {};
    if (editField === 'email') {
      updateData.email = email;
    } else if (editField === 'nickname') {
      updateData.username = nickname; // 백엔드에서는 username 필드 사용
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updateData),
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        const errorData = await response.json();
        setError(errorData.error || '프로필 업데이트에 실패했습니다.');
        return;
      }

      setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');

      // 최신 프로필 정보 GET
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log('프로필 업데이트 후 백엔드 응답:', profileData);
        
        // 닉네임 및 이메일 상태 업데이트
        setEmail(profileData.email);
        setNickname(profileData.username);
        
        // AuthContext 및 로컬스토리지 동기화
        if (setUser) {
          const updatedUser = {
            ...authUser,
            email: profileData.email,
            username: profileData.username,
            sns_type: profileData.sns_type,
            provider: profileData.sns_type,
          };
          
          console.log('새로운 사용자 정보:', updatedUser);
          setUser(updatedUser as any);
          
          // 로컬스토리지 업데이트
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('auth.user', JSON.stringify(updatedUser));
        }
      }
      setIsEditing(false);
      setEditField(null);
      setError('');
      
    } catch (err: any) {
      setError(err.message || '업데이트 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) return null;
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">사용자 정보</h2>
        <button
          onClick={handleLogout}
          className="flex items-center text-red-500 hover:text-red-700 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4 mr-1" />
          로그아웃
        </button>
      </div>
      
      <div className="flex flex-col gap-4">
        {/* 닉네임 정보 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500">닉네임</p>
            {isEditing && editField === 'nickname' ? (
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="사용할 닉네임을 입력하세요"
              />
            ) : (
              <p className="font-medium">{nickname || '닉네임이 설정되지 않았습니다'}</p>
            )}
          </div>
          
          <div>
            {isEditing && editField === 'nickname' ? (
              <div className="flex gap-2">
                <button
                  onClick={handleProfileUpdate}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditField(null);
                    setNickname(user?.username || user?.nickname || (user?.email ? user.email.split('@')[0] : ''));
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditField('nickname');
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm whitespace-nowrap"
              >
                닉네임 수정
              </button>
            )}
          </div>
        </div>
        
        {/* 이메일 정보 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500">이메일</p>
            {isEditing && editField === 'email' ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 border rounded w-full"
              />
            ) : (
              <p className="font-medium">{user?.email || '이메일 정보가 없습니다'}</p>
            )}
          </div>
          
          <div>
            {isEditing && editField === 'email' ? (
              <div className="flex gap-2">
                <button
                  onClick={handleProfileUpdate}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditField(null);
                    setEmail(user?.email || '');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditField('email');
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm whitespace-nowrap"
              >
                이메일 수정
              </button>
            )}
          </div>
        </div>
        
        {/* 로그인 방식 */}
        <div>
          <p className="text-sm text-gray-500">로그인 방식</p>
          <p className="font-medium">{getLoginProviderLabel(user)}</p>
        </div>
        
        {/* 성공 메시지 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm mt-2">
            {successMessage}
          </div>
        )}
        
        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
