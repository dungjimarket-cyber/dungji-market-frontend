'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime, formatGroupBuyTitle, getRegistrationTypeText } from '@/lib/groupbuy-utils';
import JoinGroupBuyModal from './JoinGroupBuyModal';

// 공통 유틸리튰는 lib/groupbuy-utils.ts에서 import하여 사용

interface Product {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  category_name?: string;
  carrier?: string;
  registration_type?: string;
  registration_type_korean?: string;
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
  product_details?: Product; // 상세 제품 정보
  product_info?: any; // 상품 정보 (custom_values 포함)
  
  // 통신 관련 공구 정보 (명시적 필드)
  telecom_carrier?: string; // 통신사 (SKT, KT, LGU, MVNO)
  subscription_type?: string; // 가입유형 (new, transfer, change)
  subscription_type_korean?: string; // 가입유형 한글 (신규가입, 번호이동, 기기변경)
  plan_info?: string; // 요금제 (5G_basic, 5G_standard, 5G_premium, 5G_special, 5G_platinum)
  
  // 휴대폰 상세 정보
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    subscription_type_display: string;
    plan_info: string;
  };
  
  // 인터넷/TV 상세 정보
  internet_detail?: {
    carrier: string;
    carrier_display: string;
    subscription_type: string;
    subscription_type_display: string;
    speed: string;
    has_tv: boolean;
  };
  
  // 방장(생성자) 정보
  creator_name?: string;
  host_username?: string;
  creator?: {
    id: number;
    username: string;
    profile_image?: string;
  };
  
  // 지역 관련 정보
  region_type?: string; // 지역 유형 (local, nationwide)
  region?: string; // 지역명 (서울, 부산 등)
  region_name?: string; // 지역 상세명
  regions?: Array<{
    id: number;
    name: string;
    parent?: string;
  }>; // 다중 지역 정보
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
              <CardHeader className="relative">
                {/* 공구 상태를 동적으로 계산하여 우측 상단에 표시 */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full shadow-lg ${getStatusClass(calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time))}`}>
                    {getStatusText(calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time))}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm text-gray-500">{groupBuy.product_details?.category_name || '휴대폰'}</p>
                      {/* 지역 정보 표시 */}
                      {groupBuy.region_type && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {groupBuy.region_type === 'nationwide' 
                            ? '전국' 
                            : groupBuy.regions && groupBuy.regions.length > 0
                              ? groupBuy.regions.map(r => r.name).join(', ')
                              : groupBuy.region_name 
                                ? groupBuy.region_name.split(' ').pop() // "서울특별시 강남구" -> "강남구"
                                : groupBuy.region || '미지정'}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl line-clamp-2 h-14 overflow-hidden">
                    {formatGroupBuyTitle(groupBuy)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center overflow-hidden">
                  <Image
                    src={groupBuy.product_details?.image_url || '/placeholder.png'}
                    alt={groupBuy.product_details?.name || groupBuy.product_name}
                    width={200}
                    height={200}
                    className="object-cover rounded-lg"
                  />
                </div>
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
                  <div className="mt-2 space-y-2 h-24">
                    <div className="flex justify-between items-center pt-2">
                      {(groupBuy.product_details?.category_name === '인터넷' || groupBuy.product_details?.category_name === '인터넷+TV') ? (
                        <div className="flex-1">
                          <a
                            href="https://www.bworld.co.kr/product/internet/charge.do?menu_id=P02010000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <span>통신사 요금제 확인</span>
                            <span className="ml-1">→</span>
                          </a>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">출고가</p>
                          <p className="text-lg sm:text-xl font-bold truncate">{groupBuy.product_details?.base_price?.toLocaleString() || '1,200,000'}원</p>
                        </div>
                      )}
                      <div className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px]">
                        {groupBuy.product_details?.contract_info || '2년 약정'}
                      </div>
                    </div>
                    
                    {/* 방장 이름 표시 */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs">👑</span>
                          <p className="text-xs text-gray-500">방장</p>
                        </div>
                        <p className="text-xs font-medium truncate max-w-[100px]">{groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username || '익명'}</p>
                      </div>
                    </div>
                    
                    {/* 카테고리별 정보 표시 */}
                    <div className="flex items-center gap-2 text-xs">
                      {/* 휴대폰 상품 정보 */}
                      {groupBuy.product_info?.category_detail_type === 'telecom' && groupBuy.telecom_detail && (
                        <>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{groupBuy.telecom_detail.telecom_carrier}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{groupBuy.telecom_detail.subscription_type_display}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{groupBuy.telecom_detail.plan_info}</span>
                        </>
                      )}
                      
                      {/* 인터넷/TV 상품 정보 */}
                      {(groupBuy.product_info?.category_detail_type === 'internet' || 
                        groupBuy.product_info?.category_detail_type === 'internet_tv') && 
                       groupBuy.internet_detail && (
                        <>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{groupBuy.internet_detail.carrier_display}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{groupBuy.internet_detail.subscription_type_display}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{groupBuy.internet_detail.speed}</span>
                        </>
                      )}
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
            product_details: {
              name: selectedGroupBuy.product_name,
              image_url: selectedGroupBuy.product_details?.image_url || '/placeholder.png',
              carrier: selectedGroupBuy.product_details?.carrier || '',
              registration_type: selectedGroupBuy.product_details?.registration_type || '',
              base_price: selectedGroupBuy.product_details?.base_price || 0
            }
          }} 
        />
      )}
    </>
  );
}
