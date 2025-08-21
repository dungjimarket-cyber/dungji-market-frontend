'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PartnerProvider } from '@/contexts/PartnerContext';
import { LogOut, Home, Users, Link2, CreditCard } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function PartnerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // 쿠키에서 localStorage로 파트너 토큰 이동
    const moveTokensFromCookies = () => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const setCookie = (name: string, value: string, days: number = -1) => {
        let expires = "";
        if (days >= 0) {
          const date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = "; expires=" + date.toUTCString();
        } else {
          expires = "; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
      };

      const partnerToken = getCookie('partner_token');
      const partnerRefreshToken = getCookie('partner_refresh_token');

      if (partnerToken) {
        localStorage.setItem('partner_token', partnerToken);
        setCookie('partner_token', '', -1); // 쿠키 삭제
      }

      if (partnerRefreshToken) {
        localStorage.setItem('partner_refresh_token', partnerRefreshToken);
        setCookie('partner_refresh_token', '', -1); // 쿠키 삭제
      }
    };

    moveTokensFromCookies();

    // 파트너 인증 확인
    const partnerToken = localStorage.getItem('partner_token');
    if (!partnerToken) {
      router.push('/partner-login');
      return;
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_refresh_token');
    router.push('/partner-login');
  };

  return (
    <PartnerProvider>
      <Toaster />
      {/* 둥지 파트너스 전용 헤더 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                className="h-8 w-auto cursor-pointer" 
                src="/logo.png" 
                alt="둥지 파트너스"
                onClick={() => router.push('/partner-dashboard')}
              />
              <span className="ml-3 text-xl font-semibold text-gray-900">
                둥지 파트너스
              </span>
            </div>
            
            {/* 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => router.push('/partner-dashboard')}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>대시보드</span>
              </button>
              <button
                onClick={() => router.push('/partner-dashboard?tab=members')}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>추천 회원</span>
              </button>
              <button
                onClick={() => router.push('/partner-dashboard?tab=link')}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                <span>추천 링크</span>
              </button>
              <button
                onClick={() => router.push('/partner-dashboard?tab=settlements')}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>정산 내역</span>
              </button>
            </nav>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 둥지 파트너스 전용 푸터 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>© 2025 둥지 파트너스. All rights reserved.</p>
            <p className="mt-2">
              문의: partners@dungjimarket.com | 고객센터: 1588-0000
            </p>
          </div>
        </div>
      </footer>
    </PartnerProvider>
  );
}