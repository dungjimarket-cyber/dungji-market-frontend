import type { Metadata } from "next";
import { Inter, Black_Han_Sans } from 'next/font/google';
import "./globals.css";
import Providers from './Providers';
import { Toaster } from "@/components/ui/toaster";
import DesktopNavbar from '@/components/common/DesktopNavbar';
import MobileNavbar from '@/components/common/MobileNavbar';
import Footer from '@/components/common/Footer';
import { Analytics } from "@vercel/analytics/next"
import { RoleUpdateNotice } from '@/components/auth/RoleUpdateNotice';
import KakaoInAppBrowserHandler from '@/components/common/KakaoInAppBrowserHandler';
import ServiceWorkerRegister from '@/components/common/ServiceWorkerRegister';
import NotificationPermissionHandler from '@/components/notification/NotificationPermissionHandler';
import MaintenanceBanner from '@/components/common/MaintenanceBanner';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const blackHanSans = Black_Han_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-black-han-sans',
});


export const metadata: Metadata = {
  title: "둥지마켓 - 우리동네 전문가 상담 & 공동구매 플랫폼",
  description: "내 주변 검증된 전문가에게 무료 상담받고, 동네 할인 공구까지!\n✓ 세무사·회계사·변호사·법무사 무료 상담\n✓ 공인중개사·인테리어·이사·청소 무료 상담\n✓ 우리동네 맛집·카페·헬스장 단체할인\n✓ 지역기반 중고직거래",
  keywords: "둥지마켓, 전문가 상담, 세무사 상담, 회계사 상담, 변호사 상담, 법무사 상담, 공인중개사 상담, 인테리어 상담, 이사 상담, 청소 상담, 우리동네 전문가, 무료 상담, 단체할인, 지역 공구, 동네 맛집 할인, 카페 공동구매, 커스텀 공구, 공동구매 플랫폼, 중고폰, 지역중고거래, 직거래",
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
      'naver-site-verification': 'b84da89efc7c43a863ca22364b524d19', // 네이버 서치어드바이저 인증 코드
    },
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "둥지마켓 - 우리동네 전문가 상담 & 공동구매 플랫폼",
    description: "내 주변 검증된 전문가 무료 상담!\n✓ 세무·회계·법률·부동산 전문가 상담\n✓ 인테리어·이사·청소 무료 상담\n✓ 우리동네 단체할인 공구\n✓ 지역기반 중고직거래",
    url: process.env.NEXTAUTH_URL || 'https://dungji-market.com',
    siteName: '둥지마켓',
    images: [
      {
        url: 'https://www.dungjimarket.com/logos/dungji_logo.jpg',
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
    title: "둥지마켓 - 우리동네 전문가 상담 & 공동구매 플랫폼",
    description: "내 주변 검증된 전문가 무료 상담!\n✓ 세무·회계·법률·부동산 전문가 상담\n✓ 인테리어·이사·청소 무료 상담\n✓ 우리동네 단체할인 공구\n✓ 지역기반 중고직거래",
    images: ['https://www.dungjimarket.com/logos/dungji_logo.jpg'],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://dungji-market.com'),
  icons: {
    icon: [
      { url: '/logos/dungji_logo.jpg', type: 'image/jpeg' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/logos/dungji_logo.jpg', type: 'image/jpeg' },
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#27AE60" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="둥지마켓" />
        <link rel="icon" href="/logos/dungji_logo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logos/dungji_logo.jpg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} ${blackHanSans.variable} min-h-screen flex flex-col`}>
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
        <MaintenanceBanner />
        <ServiceWorkerRegister />
        <Providers>
          <KakaoInAppBrowserHandler />
          <Toaster />
          <RoleUpdateNotice />
          <NotificationPermissionHandler />
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
