'use client';

import { useEffect, useState } from 'react';
import Categories from '@/components/Categories';
import Link from 'next/link';
import GroupBuyList from '@/components/groupbuy/GroupBuyList';
import { RoleButton } from '@/components/auth/RoleButton';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 메인 홈페이지 컴포넌트
 */
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 클라이언트 사이드 마운트 전에는 인증 상태를 확인할 수 없음
  const showAuthButtons = mounted ? !isAuthenticated : true;

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-6">둥지마켓에 오신 것을 환영합니다!</h1>
        <p className="text-lg text-gray-600 mb-8">
          함께 모여 더 좋은 가격으로 구매하세요.
        </p>
        <div className="flex gap-4 mb-6">
          {/* 판매자 역할이 아닐 때만 공구 등록 버튼 표시 - 클라이언트 컴포넌트 */}
          <RoleButton 
            href="/group-purchases/create"
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            disableForRoles={['seller']}
          >
            공구 등록하기
          </RoleButton>
          <Link
            href="/group-purchases"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            공구 둘러보기
          </Link>
        </div>
        {showAuthButtons && (
          <div className="flex gap-4">
            <Link
              href="/register"
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              회원가입하기
            </Link>
            <Link
              href="/about"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              둥지마켓 알아보기
            </Link>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">카테고리</h2>
        <Categories />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">인기 공동구매</h2>
          <div className="space-y-4">
            <GroupBuyList type="popular" limit={2} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">새로운 공동구매</h2>
          <div className="space-y-4">
            <GroupBuyList type="recent" limit={2} />
          </div>
        </div>
      </section>
    </div>
  );
}
