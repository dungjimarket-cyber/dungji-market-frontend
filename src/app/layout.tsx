import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from './Providers';
import { Toaster } from "@/components/ui/toaster";
import DesktopNavbar from '@/components/common/DesktopNavbar';
import MobileNavbar from '@/components/common/MobileNavbar';

const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: "둥지마켓 - 공동구매 플랫폼",
  description: "둥지마켓은 공동구매 플랫폼입니다. 다양한 상품을 저렴한 가격에 구매하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /**
   * 최상위 레이아웃 컴포넌트
   * 전체 앱 구조를 정의하고 인증 프로바이더를 설정합니다.
   */
  return (
    <html lang="ko">
      <body className={`${pretendard.variable} font-sans min-h-screen relative`}>
        <Providers>
          <Toaster />
          <DesktopNavbar />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <MobileNavbar />
        </Providers>
      </body>
    </html>
  );
}
