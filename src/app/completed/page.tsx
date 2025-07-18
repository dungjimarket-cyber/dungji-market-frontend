'use client';

import { useState, useEffect, Suspense } from 'react';
import { MainHeader } from '@/components/navigation/MainHeader';
import { GroupPurchaseCard } from '@/components/group-purchase/GroupPurchaseCard';
import { toast } from 'sonner';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    carrier?: string;
    registration_type?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    plan_info: string;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
}

/**
 * 완료된 공동구매 페이지 컨텐츠
 */
function CompletedPageContent() {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * 완료된 공구 목록 가져오기
   */
  const fetchCompletedGroupBuys = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      params.append('status', 'completed');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('완료된 공구 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setGroupBuys(data);
    } catch (err) {
      console.error('완료된 공구 목록 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      toast.error('완료된 공구 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedGroupBuys();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader title="완료된 공동구매" />
      
      <div className="pt-16 pb-20">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen">
          {/* 페이지 헤더 */}
          <div className="px-4 py-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">완료된 공동구매</h1>
            <p className="text-sm text-gray-600 mt-1">종료된 공동구매 내역을 확인하세요</p>
          </div>

          {/* 공구 목록 */}
          <div className="px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : groupBuys.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">완료된 공동구매가 없습니다.</p>
                </div>
              ) : (
                groupBuys.map((groupBuy) => (
                  <GroupPurchaseCard key={groupBuy.id} groupBuy={groupBuy} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 완료된 공동구매 페이지
 */
export default function CompletedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <MainHeader title="완료된 공동구매" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>        
      </div>
    }>
      <CompletedPageContent />
    </Suspense>
  );
}
