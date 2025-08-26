import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from './Providers';
import { Toaster } from "@/components/ui/toaster";
import DesktopNavbar from '@/components/common/DesktopNavbar';
import MobileNavbar from '@/components/common/MobileNavbar';
import Footer from '@/components/common/Footer';
import { Analytics } from "@vercel/analytics/next"
import { RoleUpdateNotice } from '@/components/auth/RoleUpdateNotice';
import KakaoInAppBrowserHandler from '@/components/common/KakaoInAppBrowserHandler';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});


export const metadata: Metadata = {
  title: "둥지마켓 - 휴대폰,인터넷 공동구매로 최고 지원금 혜택받기!",
  description: "휴대폰,인터넷 바꿀 때, 한 곳에서 비교 끝! 공동구매로 견적받고 최고 지원금 혜택을 누려보세요!",
  openGraph: {
    title: "둥지마켓 - 휴대폰,인터넷 공동구매로 최고 지원금 혜택받기!",
    description: "휴대폰,인터넷 바꿀 때, 한 곳에서 비교 끝! 공동구매로 견적받고 최고 지원금 혜택을 누려보세요!",
    url: process.env.NEXTAUTH_URL || 'https://dungji-market.com',
    siteName: '둥지마켓',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: '둥지마켓 로고',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "둥지마켓 - 휴대폰,인터넷 공동구매로 최고 지원금 혜택받기!",
    description: "휴대폰,인터넷 바꿀 때, 한 곳에서 비교 끝! 공동구매로 견적받고 최고 지원금 혜택을 누려보세요!",
    images: ['/logo.png'],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://dungji-market.com'),
  other: {
    'X-DNS-Prefetch-Control': 'on',
  }
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
      <body className={`${inter.className} min-h-screen relative`}>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6300478122055996"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Providers>
          <KakaoInAppBrowserHandler />
          <Toaster />
          <RoleUpdateNotice />
          <DesktopNavbar />
          <main className="flex-1 pb-20 md:pb-0 min-h-[calc(100vh-400px)]">
            {children}
          </main>
          <MobileNavbar />
          <Footer />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
