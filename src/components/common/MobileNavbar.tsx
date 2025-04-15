'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FaSearch,FaHome, FaShoppingCart, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function MobileNavbar() {
  const { data: session } = useSession();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 w-full">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-2">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
          <FaHome className="text-xl mb-1" />
          <span className="text-xs">홈</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
          <FaSearch className="text-xl mb-1" />
          <span className="text-xs">검색</span>
        </Link>
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
          <FaShoppingCart className="text-xl mb-1" />
          <span className="text-xs">공구 목록</span>
        </Link>
        
        {session ? (
          <>
            <Link href="/mypage" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
              <FaUser className="text-xl mb-1" />
              <span className="text-xs">마이페이지</span>
            </Link>
            
            <button onClick={() => signOut()} className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2 bg-transparent border-0">
              <FaSignOutAlt className="text-xl mb-1" />
              <span className="text-xs">로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => signIn()} className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2 bg-transparent border-0">
              <FaSignInAlt className="text-xl mb-1" />
              <span className="text-xs">로그인</span>
            </button>
            
            <Link href="/register" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
              <FaUserPlus className="text-xl mb-1" />
              <span className="text-xs">회원가입</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
