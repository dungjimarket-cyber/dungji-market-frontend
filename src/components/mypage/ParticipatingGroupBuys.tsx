'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime } from '@/lib/groupbuy-utils';
// Tabs removed - showing all participating groupbuys in one list
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Pagination } from '@/components/ui/Pagination';
import { getCarrierDisplay, getSubscriptionTypeDisplay, getPlanDisplay } from '@/lib/telecom-utils';

interface Product {
  id: number;
  name: string;
  base_price: number;
  image_url?: string;
  category?: {
    name: string;
    detail_type?: string;
  };
}

interface TelecomDetail {
  id?: number;
  telecom_carrier: string;
  subscription_type: string;
  subscription_type_korean?: string;
  plan_info: string;
  contract_period?: number;
}

interface GroupBuy {
  id: number;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  final_selection_end?: string;
  product: Product;
  product_details?: Product; // 하위 호환성
  product_info?: Product; // API에서 전체 상품 정보 포함
  calculated_status?: string;
  remaining_seconds?: number;
  telecom_detail?: TelecomDetail;
  
  // 지역 관련 정보
  region_type?: string;
  region?: string;
  region_name?: string;
}

/**
 * 참여하고 있는 공구 목록 컴포넌트
 */
export default function ParticipatingGroupBuys() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'end_time' | 'participants'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 최신순이 기본
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 인증 로딩 상태일 때는 로딩 표시
  if (isLoading) return <p className="text-gray-500">로딩 중...</p>;

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <p className="text-gray-500">로그인이 필요합니다.</p>;
  }

  // 데이터 로딩
  useEffect(() => {
    const fetchParticipatingGroupBuys = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/joined_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('참여중인 공구 목록을 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        console.log('참여중인 공구 데이터:', data);
        setGroupBuys(data);
      } catch (err) {
        console.error('참여중인 공구 목록 조회 오류:', err);
        setError('참여중인 공구 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipatingGroupBuys();
  }, [accessToken]);

  // 정렬 로직
  const sortedGroupBuys = [...groupBuys].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'created_at':
        // created_at 필드가 없으므로 id로 대체 (최신 ID가 더 큰 값)
        aValue = a.id;
        bValue = b.id;
        break;
      case 'end_time':
        aValue = new Date(a.end_time).getTime();
        bValue = new Date(b.end_time).getTime();
        break;
      case 'participants':
        aValue = a.current_participants;
        bValue = b.current_participants;
        break;
      default:
        aValue = a.id;
        bValue = b.id;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // 페이징된 데이터
  const paginatedGroupBuys = sortedGroupBuys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(sortedGroupBuys.length / itemsPerPage);

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (groupBuys.length === 0) {
    return <p className="text-gray-500">참여중인 공동구매가 없습니다.</p>;
  }

  // 그룹바이 카드 렌더링 함수
  const renderGroupBuyCard = (groupBuy: GroupBuy) => {
    const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
    
    // 백엔드에서 계산된 상태 사용 또는 프론트엔드에서 계산
    const calculatedStatus = groupBuy.calculated_status || calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time);
    
    // 남은 시간 계산 (백엔드에서 제공하는 값 사용 또는 직접 계산)
    let remainingTime;
    if (groupBuy.remaining_seconds !== undefined) {
      // 백엔드에서 제공하는 남은 시간 사용
      const days = Math.floor(groupBuy.remaining_seconds / (60 * 60 * 24));
      const hours = Math.floor((groupBuy.remaining_seconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((groupBuy.remaining_seconds % (60 * 60)) / 60);
      
      if (days > 0) {
        remainingTime = `${days}일 ${hours}시간`;
      } else if (hours > 0) {
        remainingTime = `${hours}시간 ${minutes}분`;
      } else {
        remainingTime = `${minutes}분`;
      }
    } else {
      // 직접 계산
      remainingTime = getRemainingTime(groupBuy.end_time);
    }
    
    // 통신 상품 정보 가져오기 (하위 호환성 유지)
    const product = groupBuy.product_info || groupBuy.product_details || groupBuy.product;
    const isElectronics = product?.category?.detail_type === 'electronics';
    const isTelecom = product?.category?.detail_type === 'telecom' || 
                      groupBuy.telecom_detail || 
                      (product as any)?.telecom_carrier || 
                      (product as any)?.subscription_type;
    
    // 통신사 관련 유틸리티 함수는 telecom-utils에서 import하여 사용
    
    return (
      <Link href={`/groupbuys/${groupBuy.id}`} key={groupBuy.id}>
        <Card className="h-full hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(calculatedStatus)}`}>
                {getStatusText(calculatedStatus)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image
                  src={product?.image_url || '/placeholder.png'}
                  alt={product?.name || '상품 이미지'}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{product?.name}</p>
                
                {/* 통신 상품인 경우에만 통신 정보 표시 */}
                {isTelecom && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    {/* telecom_detail이 있으면 우선 사용, 없으면 기존 필드 사용 */}
                    {groupBuy.telecom_detail ? (
                      <>
                        <span className="mr-2">
                          {getCarrierDisplay(groupBuy.telecom_detail.telecom_carrier)}
                        </span>
                        <span className="mr-2">
                          {groupBuy.telecom_detail.subscription_type_korean || getSubscriptionTypeDisplay(groupBuy.telecom_detail.subscription_type)}
                        </span>
                        <span>
                          {getPlanDisplay(groupBuy.telecom_detail.plan_info)}
                        </span>
                      </>
                    ) : (
                      <>
                        {/* 기존 product_details 필드에서 정보 추출 */}
                        {(product as any)?.telecom_carrier && (
                          <span className="mr-2">{getCarrierDisplay((product as any).telecom_carrier)}</span>
                        )}
                        {(product as any)?.subscription_type && (
                          <span className="mr-2">{(product as any).subscription_type_korean || getSubscriptionTypeDisplay((product as any).subscription_type)}</span>
                        )}
                        {(product as any)?.plan_info && (
                          <span>{getPlanDisplay((product as any).plan_info)}</span>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* 전자제품인 경우 카테고리명 표시 */}
                {isElectronics && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span>{product?.category?.name || '전자제품'}</span>
                  </div>
                )}
                
                {/* 지역 정보 표시 */}
                {groupBuy.region_name && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span>📍 {groupBuy.region_name}</span>
                  </div>
                )}
                
                {/* 인터넷/인터넷+TV 카테고리가 아닌 경우에만 가격 표시 */}
                {product?.category?.name !== '인터넷' && product?.category?.name !== '인터넷+TV' && (
                  <p className="text-sm font-bold mt-1">
                    {product?.base_price?.toLocaleString() || '0'}원
                  </p>
                )}
                
                {/* 인터넷/인터넷+TV 카테고리인 경우 통신사 정보만 표시 */}
                {(product?.category?.name === '인터넷' || product?.category?.name === '인터넷+TV') && (
                  <div className="mt-1 space-y-1">
                    {groupBuy.telecom_detail?.telecom_carrier && (
                      <p className="text-sm font-medium text-blue-600">
                        {groupBuy.telecom_detail.telecom_carrier}
                      </p>
                    )}
                    {(groupBuy.telecom_detail?.subscription_type_korean || groupBuy.telecom_detail?.subscription_type) && (
                      <p className="text-xs text-purple-600">
                        {groupBuy.telecom_detail.subscription_type_korean || 
                         getSubscriptionTypeDisplay(groupBuy.telecom_detail.subscription_type)}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-2">
                  <Progress value={progress} className="h-1" />
                  <div className="flex justify-between text-xs mt-1">
                    <span>{groupBuy.current_participants}/{groupBuy.max_participants}명</span>
                    {((groupBuy.remaining_seconds !== undefined && groupBuy.remaining_seconds > 0) || new Date(groupBuy.end_time) > new Date()) && (
                      <div className="flex items-center text-red-500">
                        <Clock size={10} className="mr-1" />
                        {(calculatedStatus === 'bidding' || calculatedStatus === 'final_selection') ? (
                          <CountdownTimer 
                            endTime={
                              calculatedStatus === 'final_selection' && groupBuy.final_selection_end ? 
                              groupBuy.final_selection_end : 
                              groupBuy.end_time
                            } 
                            format="compact" 
                            urgent={60}
                            className="text-xs"
                          />
                        ) : (
                          <span>{remainingTime}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* 상태에 따라 다른 버튼 표시 */}
                {['completed'].includes(calculatedStatus) ? (
                  <Button 
                    className="mt-2 text-xs"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 리뷰 작성 페이지로 이동
                      window.location.href = `/review/create?groupbuy_id=${groupBuy.id}`;
                    }}
                  >
                    <MessageSquare size={12} className="mr-1" />
                    후기 작성
                  </Button>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    나가기는 상세페이지에서 가능합니다
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div>
      {/* 정렬 옵션 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 {groupBuys.length}개의 참여중인 공구
        </div>
        <div className="flex gap-2">
          <select 
            className="px-2 py-1 border rounded text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'end_time' | 'participants')}
          >
            <option value="created_at">등록일 순</option>
            <option value="end_time">마감일 순</option>
            <option value="participants">참여자 수</option>
          </select>
          <select
            className="px-2 py-1 border rounded text-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* 공구 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedGroupBuys.map(renderGroupBuyCard)}
      </div>
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
