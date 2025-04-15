'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FaSearch, FaHome, FaShoppingCart, FaUser } from 'react-icons/fa';

export default function MobileNavbar() {
  const { data: session } = useSession();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 w-full">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-2">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaHome className="text-xl mb-1" />
          <span className="text-xs">홈</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaSearch className="text-xl mb-1" />
          <span className="text-xs">검색</span>
        </Link>
        <Link 
          href={session ? "/group-purchases/create" : "/auth/signin"} 
          className="flex flex-col items-center justify-center w-1/5 py-2"
        >
          <button className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md mb-1">
            <span className="text-2xl">+</span>
          </button>
          <span className="text-xs mt-0.5">공구 등록</span>
        </Link>
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaShoppingCart className="text-xl mb-1" />
          <span className="text-xs">공구</span>
        </Link>
        <Link 
          href={session ? "/mypage" : "/auth/signin"} 
          className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2"
        >
          <FaUser className="text-xl mb-1" />
          <span className="text-xs">내정보</span>
        </Link>
      </div>
    </nav>
  );
}
