'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime } from '@/lib/groupbuy-utils';
import { getCarrierDisplay, getSubscriptionTypeDisplay, getPlanDisplay } from '@/lib/telecom-utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Product {
  id: number;
  name: string;
  base_price: number;
  image_url?: string;
  category_name?: string;
  carrier?: string;
  registration_type?: string;
  subscription_type_korean?: string;
  plan_info?: string;
}

interface GroupBuy {
  id: number;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product_details: Product;
  calculated_status?: string;
  remaining_seconds?: number;
  
  // 통신 관련 공구 정보 (명시적 필드)
  telecom_carrier?: string; // 통신사 (SKT, KT, LGU, MVNO)
  subscription_type?: string; // 가입유형 (new, transfer, change)
  subscription_type_korean?: string; // 가입유형 한글명 (백엔드에서 제공)
  plan_info?: string; // 요금제 (5G_basic, 5G_standard, 5G_premium, 5G_special, 5G_platinum)
  
  // 지역 관련 필드
  region_name?: string; // 기존 단일 지역 이름
  regions?: Array<{
    id: number;
    name: string;
    parent?: string;
  }>; // 다중 지역 정보
}

/**
 * 내가 생성한 공구 목록 컴포넌트
 */
export default function CreatedGroupBuys() {
  const { isAuthenticated, isLoading, accessToken, user } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'end_time' | 'participants'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 최신순이 기본
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<GroupBuy | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // 인증 로딩 상태일 때는 로딩 표시
  if (isLoading) return <p className="text-gray-500">로딩 중...</p>;

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <p className="text-gray-500">로그인이 필요합니다.</p>;
  }

  // 데이터 로딩
  useEffect(() => {
    const fetchCreatedGroupBuys = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/my_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('내가 만든 공구 목록을 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        setGroupBuys(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        console.error('내가 만든 공구 목록 조회 오류:', err);
        setError('내가 만든 공구 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatedGroupBuys();
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

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (groupBuys.length === 0) {
    return <p className="text-gray-500">내가 만든 공동구매가 없습니다.</p>;
  }

  /**
   * 공구 삭제 처리 함수
   * 생성자만 참여한 공구(참여자 1명)만 삭제 가능
   */
  const handleDeleteGroupBuy = async () => {
    if (!selectedGroupBuy) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${selectedGroupBuy.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        throw new Error('공구 삭제에 실패했습니다.');
      }

      toast({
        title: '삭제 완료',
        description: '공구가 성공적으로 삭제되었습니다.',
        variant: 'default',
      });
      
      // 목록에서 삭제된 공구 제거
      setGroupBuys(groupBuys.filter((groupBuy) => groupBuy.id !== selectedGroupBuy.id));
      setDeleteModalOpen(false);
      setSelectedGroupBuy(null);
    } catch (err) {
      console.error('공구 삭제 오류:', err);
      toast({
        title: '삭제 실패',
        description: '공구 삭제에 실패했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  /**
   * 삭제 버튼 클릭 처리 (이벤트 전파 방지)
   */
  const handleDeleteClick = (e: React.MouseEvent, groupBuy: GroupBuy) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroupBuy(groupBuy);
    setDeleteModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedGroupBuys.map((groupBuy) => {
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
        
        return (
          <div key={groupBuy.id} className="relative">
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(calculatedStatus)}`}>
                      {getStatusText(calculatedStatus)}
                    </span>
                    {groupBuy.current_participants === 1 && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => handleDeleteClick(e, groupBuy)}
                      >
                        <Trash2 size={16} className="mr-1" />
                        삭제
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 relative flex-shrink-0">
                      <Image
                        src={groupBuy.product_details?.image_url || '/placeholder.png'}
                        alt={groupBuy.product_details?.name || '상품 이미지'}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{groupBuy.product_details?.name}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="mr-2">{
                          getCarrierDisplay(
                            groupBuy.telecom_carrier || 
                            groupBuy.product_details?.carrier || 
                            'SKT'
                          )
                        }</span>
                        <span>{
                          groupBuy.subscription_type_korean || 
                          groupBuy.product_details?.subscription_type_korean ||
                          getSubscriptionTypeDisplay(
                            groupBuy.subscription_type || 
                            groupBuy.product_details?.registration_type || 
                            'transfer'
                          )
                        }</span>
                        <span className="ml-2">{
                          getPlanDisplay(
                            groupBuy.plan_info || 
                            groupBuy.product_details?.plan_info || 
                            '5G_standard'
                          )
                        }</span>
                      </div>
                      {/* 인터넷/인터넷+TV 카테고리가 아닌 경우에만 가격 표시 */}
                      {groupBuy.product_details?.category_name !== '인터넷' && 
                       groupBuy.product_details?.category_name !== '인터넷+TV' && (
                        <p className="text-sm font-bold mt-1">
                          {groupBuy.product_details?.base_price?.toLocaleString() || '0'}원
                        </p>
                      )}
                      
                      {/* 인터넷/인터넷+TV 카테고리인 경우 통신사/가입유형만 표시 */}
                      {(groupBuy.product_details?.category_name === '인터넷' || 
                        groupBuy.product_details?.category_name === '인터넷+TV') && (
                        <div className="mt-1 space-y-1">
                          {groupBuy.telecom_carrier && (
                            <p className="text-sm font-medium text-blue-600">
                              {getCarrierDisplay(groupBuy.telecom_carrier)}
                            </p>
                          )}
                          {groupBuy.subscription_type_korean && (
                            <p className="text-xs text-purple-600">
                              {groupBuy.subscription_type_korean}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* 지역 정보 표시 - 다중 지역 지원 */}
                      {(groupBuy.regions && groupBuy.regions.length > 0) ? (
                        <div className="text-xs text-gray-500 mt-1">
                          <span>📍 {groupBuy.regions.map(region => region.name).join(', ')}</span>
                        </div>
                      ) : groupBuy.region_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span>📍 {groupBuy.region_name}</span>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <Progress value={progress} className="h-1" />
                        <div className="flex justify-between text-xs mt-1">
                          <span>{groupBuy.current_participants}/{groupBuy.max_participants}명</span>
                          {((groupBuy.remaining_seconds !== undefined && groupBuy.remaining_seconds > 0) || new Date(groupBuy.end_time) > new Date()) && (
                            <div className="flex items-center text-red-500">
                              <Clock size={10} className="mr-1" />
                              <span>{remainingTime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/group-purchases/${groupBuy.id}`)}
                    >
                      공구보기
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/mypage/creator/group-buy/${groupBuy.id}`)}
                    >
                      관리하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
          </div>
        );
      })}
      </div>

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공구 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              '{selectedGroupBuy?.title}' 공구를 정말로 삭제하시겠습니까?
              <br />
              아직 다른 참여자가 없어 삭제가 가능합니다.
              <br />
              삭제된 공구는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroupBuy}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
