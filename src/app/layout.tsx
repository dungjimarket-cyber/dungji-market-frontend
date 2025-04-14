import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import Image from 'next/image';
import "./globals.css";
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import AuthButtons from '@/components/auth/AuthButtons';
import Providers from './Providers';
import { Toaster } from "@/components/ui/toaster";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen relative`}>
        <Providers session={session}>
          <Toaster />
          <header className="sticky top-0 z-50 w-full border-b bg-white">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                  <Image src="/logo.png" alt="둥지마켓" width={40} height={40} />
                  <span className="text-xl font-bold">둥지마켓</span>
                </Link>
                
                <nav className="hidden md:flex space-x-8">
                  <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900">
                    공구둘러보기
                  </Link>
                  <Link href="/ongoing" className="text-gray-600 hover:text-gray-900">
                    진행중인 공구
                  </Link>
                  <Link href="/completed" className="text-gray-600 hover:text-gray-900">
                    완료된 공구
                  </Link>
                  <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
                    마이페이지
                  </Link>
                </nav>

                <AuthButtons isAuthenticated={!!session} />
              </div>
            </div>
          </header>

          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          
          {/* 모바일 화면에서만 표시되는 하단 네비게이션 */}
          <MobileNavbar />
        </Providers>
      </body>
    </html>
  );
}
