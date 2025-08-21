'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PartnerProvider } from '@/contexts/PartnerContext';
import { LogOut, Home, Users, Link2, CreditCard, BarChart3, QrCode } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function PartnerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = searchParams.get('tab') || 'dashboard';

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
            
            {/* 데스크톱 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => router.push('/partner-dashboard')}
                className={`flex items-center space-x-2 transition-colors ${
                  pathname === '/partner-dashboard' && !searchParams.get('tab')
                    ? 'text-purple-600 font-medium'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>대시보드</span>
              </button>
              <button
                onClick={() => router.push('/partner-dashboard?tab=members')}
                className={`flex items-center space-x-2 transition-colors ${
                  currentTab === 'members'
                    ? 'text-purple-600 font-medium'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>회원 관리</span>
              </button>
              <button
                onClick={() => router.push('/partner-dashboard?tab=link')}
                className={`flex items-center space-x-2 transition-colors ${
                  currentTab === 'link'
                    ? 'text-purple-600 font-medium'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>추천링크</span>
              </button>
              <button
                onClick={() => router.push('/partner-dashboard?tab=settlements')}
                className={`flex items-center space-x-2 transition-colors ${
                  currentTab === 'settlements'
                    ? 'text-purple-600 font-medium'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>정산 관리</span>
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
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => router.push('/partner-dashboard')}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              pathname === '/partner-dashboard' && !searchParams.get('tab')
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">대시보드</span>
          </button>
          <button
            onClick={() => router.push('/partner-dashboard?tab=members')}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              currentTab === 'members'
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">회원관리</span>
          </button>
          <button
            onClick={() => router.push('/partner-dashboard?tab=link')}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              currentTab === 'link'
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-xs">추천링크</span>
          </button>
          <button
            onClick={() => router.push('/partner-dashboard?tab=settlements')}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              currentTab === 'settlements'
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">정산관리</span>
          </button>
        </div>
      </nav>

      {/* 둥지 파트너스 전용 푸터 (데스크톱만) */}
      <footer className="hidden md:block bg-white border-t mt-12">
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