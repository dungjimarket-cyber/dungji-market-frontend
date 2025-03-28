import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

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
  };
}

async function getGroupBuys() {
  const res = await fetch('http://localhost:8000/api/groupbuys/', { next: { revalidate: 60 } });
  if (!res.ok) return [];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupBuys.map((groupBuy: GroupBuy) => {
            const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
            const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;
            
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
                          <span>{groupBuy.current_participants}명 참여</span>
                          <span>{remainingSpots}자리 남음</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">공구가</p>
                          <p className="text-xl font-bold">{groupBuy.product.base_price.toLocaleString()}원</p>
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
