import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface GroupBuy {
  id: number;
  title: string;
  description: string;
  status: string;
  current_participants: number;
  min_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
  };
}

async function getGroupBuy(id: string) {
  const res = await fetch(`http://localhost:8000/api/groupbuys/${id}/`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export default async function GroupBuyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const groupBuy = await getGroupBuy(id);

  if (!groupBuy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">공구를 찾을 수 없습니다</h1>
          <p>요청하신 공구가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
  const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-2">{groupBuy.product.category_name}</p>
              <CardTitle className="text-2xl">{groupBuy.title || groupBuy.product.name}</CardTitle>
            </div>
            <span className={`px-3 py-1 rounded-full ${
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
        <CardContent className="space-y-6">
          <div>
            <img
              src={groupBuy.product.image_url || '/placeholder.png'}
              alt={groupBuy.product.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
          <div>
            <h3 className="font-semibold mb-2">상품 설명</h3>
            <p className="text-gray-600">{groupBuy.description || groupBuy.product.description}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">공구 진행 상황</h3>
            <Progress value={progress} className="h-2" />
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>{groupBuy.current_participants}명 참여</span>
              <span>{remainingSpots}자리 남음</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">공구가</p>
              <p className="text-2xl font-bold">{groupBuy.product.base_price.toLocaleString()}원</p>
            </div>
            <Button 
              size="lg"
              disabled={groupBuy.status !== 'recruiting' || remainingSpots === 0}
            >
              {groupBuy.status === 'recruiting'
                ? remainingSpots > 0
                  ? '참여하기'
                  : '인원 마감'
                : '종료된 공구'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
