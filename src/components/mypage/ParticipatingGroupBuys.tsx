'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, UserMinus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime } from '@/lib/groupbuy-utils';
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
  carrier?: string;
  registration_type?: string;
  plan_info?: string;
}

interface GroupBuy {
  id: number;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  end_time: string;
  product_details: Product;
  calculated_status?: string;
  remaining_seconds?: number;
  
  // 통신 관련 공구 정보 (명시적 필드)
  telecom_carrier?: string; // 통신사 (SKT, KT, LGU, MVNO)
  subscription_type?: string; // 가입유형 (new, transfer, change)
  plan_info?: string; // 요금제 (5G_basic, 5G_standard, 5G_premium, 5G_special, 5G_platinum)
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
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<GroupBuy | null>(null);
  const { toast } = useToast();

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

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (groupBuys.length === 0) {
    return <p className="text-gray-500">참여중인 공동구매가 없습니다.</p>;
  }

  /**
   * 공구 나가기 처리 함수
   */
  const handleLeaveGroupBuy = async () => {
    if (!selectedGroupBuy) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${selectedGroupBuy.id}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        throw new Error('공구 나가기에 실패했습니다.');
      }

      toast({
        title: '나가기 완료',
        description: '공구에서 성공적으로 나갔습니다.',
        variant: 'default',
      });
      
      // 목록에서 해당 공구 제거
      setGroupBuys(groupBuys.filter((gb) => gb.id !== selectedGroupBuy.id));
      setOpenLeaveDialog(false);
      setSelectedGroupBuy(null);
    } catch (err) {
      console.error('공구 나가기 오류:', err);
      toast({
        title: '나가기 실패',
        description: err instanceof Error ? err.message : '공구 나가기에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  /**
   * 나가기 버튼 클릭 처리 (이벤트 전파 방지)
   */
  const handleLeaveClick = (e: React.MouseEvent, groupBuy: GroupBuy) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroupBuy(groupBuy);
    setOpenLeaveDialog(true);
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
        const calculatedStatus = groupBuy.calculated_status || calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time);
        
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
                        // 공구의 명시적 필드 우선 사용
                        groupBuy.telecom_carrier || 
                        groupBuy.product_details?.carrier || 
                        'SKT'
                      }</span>
                      <span>{
                        // 가입유형 표시
                        groupBuy.subscription_type === 'new' ? '신규가입' :
                        groupBuy.subscription_type === 'transfer' ? '번호이동' :
                        groupBuy.subscription_type === 'change' ? '기기변경' :
                        groupBuy.product_details?.registration_type || 
                        '번호이동'
                      }</span>
                      <span className="ml-2">{
                        // 요금제 표시
                        groupBuy.plan_info === '5G_basic' ? '3만원대' :
                        groupBuy.plan_info === '5G_standard' ? '5만원대' :
                        groupBuy.plan_info === '5G_premium' ? '7만원대' :
                        groupBuy.plan_info === '5G_special' ? '9만원대' :
                        groupBuy.plan_info === '5G_platinum' ? '10만원대' :
                        '5만원대'
                      }</span>
                    </div>
                    <p className="text-sm font-bold mt-1">
                      {groupBuy.product_details?.base_price?.toLocaleString() || '0'}원
                    </p>
                    
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
                    <Button 
                      className="mt-2 text-xs text-red-500 hover:text-red-700"
                      onClick={(e) => handleLeaveClick(e, groupBuy)}
                    >
                      <UserMinus size={12} className="mr-1" />
                      나가기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
      </div>

      <AlertDialog
        open={openLeaveDialog}
        onOpenChange={setOpenLeaveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공구에서 나가기</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            정말 공구에서 나가시겠습니까?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenLeaveDialog(false)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroupBuy}>
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
