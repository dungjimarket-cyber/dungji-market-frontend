'use client';

import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthButtons({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <button
          onClick={() => signOut()}
          className="text-gray-600 hover:text-gray-900"
        >
          로그아웃
        </button>
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
  );
}
