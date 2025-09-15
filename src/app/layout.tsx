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
  title: "둥지마켓 - 국내 유일 휴대폰·인터넷 비교견적 플랫폼",
  description: "둥지마켓 - 국내 유일 휴대폰·인터넷 비교견적 플랫폼\n★지원금 혜택 NO.1 공동구매 플랫폼\n✓전국 판매점이 다~ 모였다!\n▶이제 한곳에서 비교 끝!",
  keywords: "둥지마켓, 휴대폰 공동구매, 인터넷 비교견적, 휴대폰 지원금, 인터넷 가입, 통신사 비교, SKT, KT, LGU+",
  authors: [{ name: '둥지마켓' }],
  creator: '둥지마켓',
  publisher: '둥지마켓',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'naver-site-verification': '', // 네이버 서치어드바이저에서 발급받은 코드 입력
    },
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "둥지마켓 - 국내 유일 휴대폰·인터넷 비교견적 플랫폼",
    description: "둥지마켓 - 국내 유일 휴대폰·인터넷 비교견적 플랫폼\n★지원금 혜택 NO.1 공동구매 플랫폼\n✓전국 판매점이 다~ 모였다!\n▶이제 한곳에서 비교 끝!",
    url: process.env.NEXTAUTH_URL || 'https://dungji-market.com',
    siteName: '둥지마켓',
    images: [
      {
        url: '/logos/dungji_logo_text.jpg',
        width: 1200,
        height: 630,
        alt: '둥지마켓',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "둥지마켓 - 국내 유일 휴대폰·인터넷 비교견적 플랫폼",
    description: "둥지마켓 - 국내 유일 휴대폰·인터넷 비교견적 플랫폼\n★지원금 혜택 NO.1 공동구매 플랫폼\n✓전국 판매점이 다~ 모였다!\n▶이제 한곳에서 비교 끝!",
    images: ['/logos/dungji_logo_text.jpg'],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://dungji-market.com'),
  icons: {
    icon: [
      { url: '/logos/dunji_logo.jpg', type: 'image/jpeg' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/logos/dunji_logo.jpg', type: 'image/jpeg' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "둥지마켓",
  },
  other: {
    'X-DNS-Prefetch-Control': 'on',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': '둥지마켓',
    'theme-color': '#27AE60',
    'msapplication-navbutton-color': '#27AE60',
    'msapplication-TileColor': '#27AE60',
    'msapplication-TileImage': '/icons/icon-144x144.png',
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#27AE60" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="둥지마켓" />
        <link rel="icon" href="/logos/dunji_logo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logos/dunji_logo.jpg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6300478122055996"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Ads Conversion Tracking */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17509206142"
          strategy="afterInteractive"
        />
        <Script
          id="google-ads-gtag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17509206142');
            `,
          }}
        />
        <Providers>
          <KakaoInAppBrowserHandler />
          <Toaster />
          <RoleUpdateNotice />
          <DesktopNavbar />
          <main className="flex-grow pb-16 md:pb-0">
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
