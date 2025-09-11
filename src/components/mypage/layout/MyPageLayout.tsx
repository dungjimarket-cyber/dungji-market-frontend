'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MyPageLayoutProps {
  children: ReactNode;
}

export default function MyPageLayout({ children }: MyPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/used">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">마이페이지</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/used">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">중고거래</span>
              </Button>
            </Link>
            <Link href="/groupbuys">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">공동구매</span>
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