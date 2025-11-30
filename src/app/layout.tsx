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
  title: "둥지마켓 - 세상에 없던 공동구매 플랫폼",
  description: "우리동네 식당·학원·카페 모이면 할인받는 단체할인 공구!\n✓ 지역 맛집·카페·헬스장 그룹 할인 쿠폰\n✓ 온라인 쇼핑몰 공동구매 특가\n✓ 같이 견적받기 (통신·렌탈 비교견적)\n✓ 지역기반 중고직거래\n✓ 수수료 무료 / 판매자 직접 등록",
  keywords: "둥지마켓, 단체할인, 우리동네 할인, 지역 공구, 동네 식당 할인, 학원 단체할인, 카페 공동구매, 헬스장 그룹할인, 온라인 공구, 오프라인 쿠폰, 맛집 할인, 커스텀 공구, N명 할인, 모이면 할인, 공동구매 플랫폼, 같이 견적받기, 통신 비교견적, 렌탈 견적, 휴대폰 공동구매, 인터넷 비교, 중고폰, 지역중고거래, 직거래",
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
    title: "둥지마켓 - 세상에 없던 공동구매 플랫폼",
    description: "🏪 우리동네 식당·학원·카페 모이면 할인!\n✓ 지역 단체할인 공구 (수수료 무료)\n✓ 온라인 쇼핑 공동구매\n✓ 같이 견적받기 (통신·렌탈)\n✓ 지역기반 중고직거래",
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
    title: "둥지마켓 - 세상에 없던 공동구매 플랫폼",
    description: "🏪 우리동네 식당·학원·카페 모이면 할인!\n✓ 지역 단체할인 공구 (수수료 무료)\n✓ 온라인 쇼핑 공동구매\n✓ 같이 견적받기 (통신·렌탈)\n✓ 지역기반 중고직거래",
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
