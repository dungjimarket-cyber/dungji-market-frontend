import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import PartnerLayoutClient from './PartnerLayoutClient';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '둥지 파트너스 - 파트너 대시보드',
  description: '둥지 파트너스 대시보드에서 추천 회원을 관리하고 수익을 확인하세요.',
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <PartnerLayoutClient>
          {children}
        </PartnerLayoutClient>
      </body>
    </html>
  );
}