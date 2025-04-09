'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  
  // 디버깅용 코드
  console.log('세션 데이터:', session);
  console.log('사용자 정보:', session?.user);
  console.log('프로필 이미지:', session?.user?.image);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">둥지마켓</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900">
              공구 목록
            </Link>
            {session ? (
              <>
                <Link href="/my-page" className="text-gray-600 hover:text-gray-900">
                  마이페이지
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  로그아웃
                </button>
                {/* 닉네임 표시 */}
                {session.user?.name && (
                  <span className="text-gray-700 font-medium">
                    {session.user.name}
                  </span>
                )}
                
                {/* 프로필 이미지 */}
                <div className="relative w-8 h-8 overflow-hidden rounded-full border border-gray-200 bg-gray-200">
                  {session.user?.image ? (
                    <Image 
                      src={session.user.image}
                      alt="프로필 이미지"
                      width={32}
                      height={32}
                      className="object-cover"
                      unoptimized // 외부 이미지 URL을 위해 추가
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  로그인
                </button>
                <Link
                  href="/register"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
