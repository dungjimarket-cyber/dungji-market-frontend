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
  product_detail: Product;
  calculated_status?: string;
  remaining_seconds?: number;
}

export default function ParticipatingGroupBuys() {
  const { data: session, status } = useSession();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 세션 로딩 상태일 때는 로딩 표시
  // 세션 로딩 상태 처리 - status는 "authenticated", "unauthenticated", "loading" 중 하나
  if (status === "loading") return <p className="text-gray-500">로딩 중...</p>;

  useEffect(() => {
    // 세션 로딩 중이거나 세션이 없으면 API 호출하지 않음
    if (status !== "authenticated" || !session) return;
    
    const fetchParticipatingGroupBuys = async () => {
      try {
        setLoading(true);
        // 백엔드 API에서 사용자가 참여중인 공동구매 목록 가져오기
        // JWT 토큰 가져오기 - 여러 경로를 확인하여 일관성 보장
        const accessToken = session?.jwt?.access || 
                           session?.user?.jwt?.access || 
                           session?.accessToken;
        
        console.log('세션 데이터:', session);
        console.log('JWT 토큰 검색 경로:', { 
          'session.jwt?.access': session?.jwt?.access,
          'session.user?.jwt?.access': session?.user?.jwt?.access,
          'session.accessToken': session?.accessToken
        });
        
        if (!accessToken) {
          throw new Error('JWT 토큰을 찾을 수 없습니다. 다시 로그인해주세요.');
        }
        
        console.log('JWT 토큰 확인:', accessToken.substring(0, 10) + '...');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/joined_groupbuys/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('참여중인 공동구매 목록을 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        setGroupBuys(data);
      } catch (err) {
        console.error('Error fetching participating group buys:', err);
        setError('참여중인 공동구매 목록을 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchParticipatingGroupBuys();
  }, [session, status]);

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (groupBuys.length === 0) {
    return <p className="text-gray-500">참여중인 공동구매가 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groupBuys.map((groupBuy) => {
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
                      src={groupBuy.product_detail.image_url || '/placeholder.png'}
                      alt={groupBuy.product_detail.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{groupBuy.product_detail.name}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="mr-2">{groupBuy.product_detail.carrier || 'SK텔레콤'}</span>
                      <span>{groupBuy.product_detail.registration_type || '번호이동'}</span>
                    </div>
                    <p className="text-sm font-bold mt-1">
                      {groupBuy.product_detail.base_price.toLocaleString()}원
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
  );
}
