'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { DefaultUser } from 'next-auth';

function isExtendedUser(user: DefaultUser | undefined): user is DefaultUser & { provider: string } {
  return typeof (user as any)?.provider === 'string';
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

export default function ProfileSection() {
  const { data: session, update, status } = useSession();
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailUpdate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
  
      if (!response.ok) throw new Error('Failed to update email');
      const data = await response.json();
  
      await update({
        ...session,
        user: {
          ...session?.user,
          email: data.email,
        },
      });
  
      setIsEditing(false);
      setError('');
    } catch (error: any) {
      setError(error.message || '이메일 업데이트 중 오류가 발생했습니다.');
    }
  };

  if (status === "loading") return null;
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">내 정보</h2>
      <div className="flex items-start space-x-4">
        {session?.user?.image && (
          <div className="relative w-24 h-24">
            <Image
              src={session.user.image}
              alt="Profile"
              fill
              className="rounded-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">이름:</span> {session?.user?.name}
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
                <span>{session?.user?.email || '이메일 미등록'}</span>
                {session?.user?.email === undefined && (
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
            {getLoginProviderLabel(session?.user)}
          </p>
        </div>
      </div>
    </div>
  );
}
