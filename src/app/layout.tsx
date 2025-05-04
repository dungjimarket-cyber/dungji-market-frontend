import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from './Providers';
import { Toaster } from "@/components/ui/toaster";
import DesktopNavbar from '@/components/common/DesktopNavbar';
import MobileNavbar from '@/components/common/MobileNavbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen relative`}>
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
