'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime } from '@/lib/groupbuy-utils';
import JoinGroupBuyModal from './JoinGroupBuyModal';

interface Product {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  category_name?: string;
  carrier?: string;
  registration_type?: string;
  plan_info?: string;
  contract_info?: string;
  total_support_amount?: number;
  release_date?: string;
}

interface GroupBuy {
  id: number;
  title: string;
  description: string;
  product_name: string;
  end_time: string;
  start_time: string;
  status: string;
  current_participants: number;
  min_participants: number;
  max_participants: number;
  product: number; // product ID
  product_detail?: Product; // 상세 제품 정보
}

interface GroupBuyListProps {
  type?: 'all' | 'active' | 'completed' | 'popular' | 'recent';
  limit?: number;
}

export default function GroupBuyList({ type = 'all', limit }: GroupBuyListProps) {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<GroupBuy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchGroupBuys = async () => {
      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`;
  
        if (type === 'popular') {
          url = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/popular/`;
        } else if (type === 'recent') {
          url = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/recent/`;
        } else if (type !== 'all') {
          url = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?status=${type}`;
        }
  
        const response = await fetch(url);
        const data = await response.json();
  
        setGroupBuys(limit ? data.slice(0, limit) : data);
      } catch {
        setError('공동구매 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchGroupBuys();
  }, [type, limit]);

  if (loading) {
    return <div className="text-center">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (groupBuys.length === 0) {
    return <div className="text-gray-500">진행중인 공동구매가 없습니다.</div>;
  }

  // 상세 페이지로 이동하는 함수로 변경
  const handleGroupBuyClick = (groupBuy: GroupBuy) => {
    // 모달 대신 상세 페이지로 이동
    window.location.href = `/groupbuys/${groupBuy.id}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupBuys.map((groupBuy) => {
          const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
          const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;
          const isActive = new Date(groupBuy.end_time) > new Date();
          
          // 남은 시간 계산
          const now = new Date();
          const endTime = new Date(groupBuy.end_time);
          const timeDiff = endTime.getTime() - now.getTime();
          
          // 남은 시간 포맷팅
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          
          // 종료 날짜 포맷팅
          const year = endTime.getFullYear();
          const month = endTime.getMonth() + 1;
          const date = endTime.getDate();
          const formattedEndDate = `${year}년 ${month}월 ${date}일`;
          
          return (
            <Card 
              key={groupBuy.id} 
              className="h-full hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => handleGroupBuyClick(groupBuy)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">{groupBuy.product_detail?.category_name || '휴대폰'}</p>
                    <CardTitle className="text-base sm:text-lg md:text-xl">{groupBuy.title || groupBuy.product_name}</CardTitle>
                  </div>
                  {/* 공구 상태를 동적으로 계산하여 표시 */}
                  <span className={`px-2 py-1 text-sm rounded-full ${getStatusClass(calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time))}`}>
                    {getStatusText(calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time))}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Image
                  src={groupBuy.product_detail?.image_url || '/placeholder.png'}
                  alt={groupBuy.product_detail?.name || groupBuy.product_name}
                  width={200}
                  height={200}
                  className="object-cover rounded-lg"
                />
                <div className="space-y-4 mt-4">
                  <div>
                    <Progress value={progress} className="h-2" />
                    <div className="mt-2 flex justify-between text-xs sm:text-sm text-gray-600">
                      <span>{groupBuy.current_participants}명 참여중</span>
                      <span>{remainingSpots}자리 남음</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center text-red-500">
                        <Clock size={12} className="mr-1" />
                        <span>
                          {getRemainingTime(groupBuy.end_time)}
                        </span>
                      </div>
                      <span className="text-gray-500">{formattedEndDate}</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-col">
                      <div className="flex space-x-2 text-xs sm:text-sm">
                        <span className="font-medium text-red-500">통신사: {groupBuy.product_detail?.carrier || 'SK텔레콤'}</span>
                        <span className="font-medium text-blue-500">유형: {groupBuy.product_detail?.registration_type || '번호이동'}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium">요금제: {groupBuy.product_detail?.plan_info || '5만원대'}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">출고가</p>
                        <p className="text-lg sm:text-xl font-bold">{groupBuy.product_detail?.base_price?.toLocaleString() || '1,200,000'}원</p>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {groupBuy.product_detail?.contract_info || '2년 약정'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 공구 참여 모달 */}
      {isModalOpen && selectedGroupBuy && (
        <JoinGroupBuyModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          groupBuy={{
            id: selectedGroupBuy.id,
            title: selectedGroupBuy.title,
            product_detail: {
              name: selectedGroupBuy.product_name,
              image_url: selectedGroupBuy.product_detail?.image_url || '/placeholder.png',
              carrier: selectedGroupBuy.product_detail?.carrier || '',
              registration_type: selectedGroupBuy.product_detail?.registration_type || '',
              base_price: selectedGroupBuy.product_detail?.base_price || 0
            }
          }} 
        />
      )}
    </>
  );
}
