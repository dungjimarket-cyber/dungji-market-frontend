/**
 * 견적이용권 구매 페이지 - /mypage/seller/bid-tokens로 리다이렉트
 * 이 페이지는 더 이상 사용되지 않으며, 새로운 통합 견적이용권 관리 페이지로 리다이렉트됩니다.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * 견적이용권 구매 페이지 리다이렉트 컴포넌트
 * /mypage/seller/bid-tokens로 자동 리다이렉트합니다.
 * 
 * @returns {JSX.Element} 로딩 표시 후 리다이렉트
 */
export default function BidTicketsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 즉시 새로운 견적이용권 관리 페이지로 리다이렉트
    router.replace('/mypage/seller/bid-tokens');
  }, [router]);
  
  // 리다이렉트 중 로딩 표시
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">견적이용권 관리 페이지로 이동 중...</p>
      </div>
    </div>
  );
}