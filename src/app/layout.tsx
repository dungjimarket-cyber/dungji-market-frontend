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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = typeof window === 'undefined' ? await getServerSession(authOptions) : null;

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen relative`}>
        <Providers session={session ?? undefined}>
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
