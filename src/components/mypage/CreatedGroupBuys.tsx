'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime } from '@/lib/groupbuy-utils';

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

export default function CreatedGroupBuys() {
  const { data: session, status } = useSession();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'end_time' | 'participants'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 최신순이 기본

  // 세션 로딩 상태일 때는 로딩 표시
  if (status === "loading") return <p className="text-gray-500">로딩 중...</p>;

  useEffect(() => {
    /**
     * 내가 만든 공구 목록을 가져오는 함수
     */
    const fetchCreatedGroupBuys = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 1. 로컬 스토리지에서 토큰 확인
        let accessToken = null;
        if (typeof window !== 'undefined') {
          accessToken = localStorage.getItem('dungji_auth_token');
        }
        
        // 2. 로컬 스토리지에 없으면 세션에서 가져오기
        if (!accessToken && session) {
          accessToken = session?.jwt?.access || 
                        session?.user?.jwt?.access || 
                        session?.accessToken;
        }
        
        // 토큰이 없는 경우 처리
        if (!accessToken) {
          console.error('토큰을 찾을 수 없습니다.');
          setError('로그인이 필요합니다. 세션이 만료되었을 수 있습니다.');
          return;
        }
        
        // 백엔드 API 호출 - 내가 생성한 공구 목록 API
        console.log('내가 만든 공구 API 호출, 토큰:', accessToken.substring(0, 10) + '...');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/my_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        // 오류 처리
        if (!response.ok) {
          // 401 인증 오류
          if (response.status === 401) {
            // 로컬 스토리지에서 만료된 토큰 삭제
            if (typeof window !== 'undefined') {
              localStorage.removeItem('dungji_auth_token');
            }
            throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
          }
          throw new Error('내가 만든 공구 목록을 가져오는데 실패했습니다.');
        }

        // 성공 처리
        const data = await response.json();
        console.log('가져온 내가 만든 공구 데이터:', data);
        setGroupBuys(data);
      } catch (err) {
        console.error('내가 만든 공구 목록 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '내가 만든 공구 목록을 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    // 초기 로딩 시 API 호출
    fetchCreatedGroupBuys();
  }, [session]);

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  // 정렬 함수
  const sortGroupBuys = (groupBuys: GroupBuy[]) => {
    return [...groupBuys].sort((a, b) => {
      if (sortBy === 'created_at') {
        // 생성일 기준 정렬 (최신 ID가 더 큰 값)
        return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
      } else if (sortBy === 'end_time') {
        // 마감일 기준 정렬
        const dateA = new Date(a.end_time).getTime();
        const dateB = new Date(b.end_time).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        // 참여자 수 기준 정렬
        return sortOrder === 'desc' 
          ? b.current_participants - a.current_participants 
          : a.current_participants - b.current_participants;
      }
    });
  };

  const sortedGroupBuys = sortGroupBuys(groupBuys);

  if (groupBuys.length === 0) {
    return <p className="text-gray-500">내가 만든 공동구매가 없습니다.</p>;
  }

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
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
