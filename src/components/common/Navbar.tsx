'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

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
