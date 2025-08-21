'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PartnerProvider } from '@/contexts/PartnerContext';
import PartnerSidebar from '@/components/partner/PartnerSidebar';

export default function PartnerDashboardLayout({
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

  return (
    <PartnerProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <PartnerSidebar />
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-64">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PartnerProvider>
  );
}