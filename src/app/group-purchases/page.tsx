import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Clock } from 'lucide-react';

interface GroupBuy {
  id: number;
  status: string;
  current_participants: number;
  max_participants: number;
  product: {
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
}

async function getGroupBuys() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch group buys');
  }

  return res.json();
}

export default async function GroupPurchasesPage() {
  const groupBuys = await getGroupBuys();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">공동구매 둘러보기</h1>
        <Link href="/group-purchases/create">
          <Button>
            <span className="mr-2">+</span>
            공구 등록
          </Button>
        </Link>
      </div>
      
      {groupBuys.length === 0 ? (
        <p className="text-gray-500">현재 진행중인 공동구매가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupBuys.map((groupBuy: GroupBuy) => {
            const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
            const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;
            
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
              <Link key={groupBuy.id} href={`/groupbuys/${groupBuy.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{groupBuy.product.category_name}</p>
                        <CardTitle className="text-xl">{groupBuy.product.name}</CardTitle>
                      </div>
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        groupBuy.status === 'recruiting'
                          ? 'bg-blue-100 text-blue-800'
                          : groupBuy.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {groupBuy.status === 'recruiting' ? '모집중' :
                         groupBuy.status === 'confirmed' ? '확정' : '종료'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                      <Image
                        src={groupBuy.product.image_url || '/placeholder.png'}
                        alt={groupBuy.product.name}
                        width={800}
                        height={450}
                        className="object-cover rounded-lg"
                      />                  
                    <div className="space-y-4">
                      <div>
                        <Progress value={progress} className="h-2" />
                        <div className="mt-2 flex justify-between text-sm text-gray-600">
                          <span>{groupBuy.current_participants}명 참여중</span>
                          <span>{remainingSpots}자리 남음</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <div className="flex items-center text-red-500">
                            <Clock size={14} className="mr-1" />
                            <span>
                              {timeDiff > 0 ? `${days}일 ${hours}시간 ${minutes}분` : '종료됨'}
                            </span>
                          </div>
                          <span className="text-gray-500">{formattedEndDate} 마감</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-col">
                          <div className="flex space-x-2 text-sm">
                            <span className="font-medium text-red-500">통신사: {groupBuy.product.carrier || 'SK텔레콤'}</span>
                            <span className="font-medium text-blue-500">유형: {groupBuy.product.registration_type || '번호이동'}</span>
                          </div>
                          <p className="text-sm font-medium">요금제: {groupBuy.product.plan_info || '5만원대'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-sm text-gray-500">출고가</p>
                            <p className="text-xl font-bold">{groupBuy.product.base_price.toLocaleString()}원</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {groupBuy.product.contract_info || '2년 약정'}
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
      )}
    </div>
  );
}
