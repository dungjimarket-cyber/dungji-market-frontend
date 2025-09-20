'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, ShoppingBag, Edit2, AlertTriangle, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface MyPageLayoutProps {
  children: ReactNode;
  onFavoritesClick?: () => void;
  onReviewsClick?: () => void;
  favoritesCount?: number;
  reviewsCount?: number;
}

export default function MyPageLayout({
  children,
  onFavoritesClick,
  onReviewsClick,
  favoritesCount = 0,
  reviewsCount = 0
}: MyPageLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();

  // 회원 유형에 따라 설정 페이지 분기
  const handleSettingsClick = () => {
    if (user?.role === 'seller' || user?.user_type === '판매') {
      router.push('/mypage/seller/settings');
    } else {
      router.push('/mypage/settings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b">
        {/* PC: 기존 1줄 레이아웃 */}
        <div className="hidden sm:flex max-w-5xl mx-auto px-4 h-14 items-center justify-between">
          {/* 왼쪽: 신고관리, 내정보설정 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/used/mypage/reports')}
              className="border-red-300 text-red-600 hover:bg-red-50 gap-1 text-xs"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>신고관리</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettingsClick}
              className="gap-1 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>내정보설정</span>
            </Button>
          </div>

          {/* 오른쪽: 중고거래, 공동구매 */}
          <div className="flex items-center gap-2">
            <Link href="/used">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Package className="h-3.5 w-3.5" />
                <span>중고거래</span>
              </Button>
            </Link>
            <Link href="/group-purchases">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>공동구매</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 모바일: 1줄 레이아웃 */}
        <div className="sm:hidden flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/used/mypage/reports')}
              className="border-red-300 text-red-600 hover:bg-red-50 gap-1 text-xs px-2.5 py-1"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>신고</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettingsClick}
              className="gap-1 text-xs px-2.5 py-1"
            >
              <Edit2 className="h-3 w-3" />
              <span>설정</span>
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/used">
              <Button variant="outline" size="sm" className="gap-1 text-xs px-2.5 py-1">
                <Package className="h-3 w-3" />
                <span>중고</span>
              </Button>
            </Link>
            <Link href="/group-purchases">
              <Button variant="outline" size="sm" className="gap-1 text-xs px-2.5 py-1">
                <ShoppingBag className="h-3 w-3" />
                <span>공구</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}