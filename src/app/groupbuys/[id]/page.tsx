import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

interface GroupBuyProduct {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  category_name: string;
  // release_date: string; // Added field
  // carrier: string; // Added field
  // plan_price: string; // Added field
}

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
  product: GroupBuyProduct;
}


async function getGroupBuy(id: string): Promise<GroupBuy | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch group buy');
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch group buy with id: ${id}`, error);
    return null;
  }
}
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function GroupBuyActionButton({
  isRecruiting,
  isFull,
}: {
  isRecruiting: boolean;
  isFull: boolean;
}) {
  return (
    <Button size="lg" disabled={!isRecruiting || isFull}>
      {!isRecruiting ? '종료된 공구' : isFull ? '인원 마감' : '참여하기'}
    </Button>
  );
}

export default async function GroupBuyPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
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

  const progress = groupBuy.max_participants
    ? (groupBuy.current_participants / groupBuy.max_participants) * 100
    : 0;
  const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;
  const isRecruiting = groupBuy.status === 'recruiting';
  const isFull = remainingSpots === 0;

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
            <Image
              src={groupBuy.product.image_url || '/placeholder.png'}
              alt={groupBuy.product.name}
              className="object-cover rounded-lg"
              width={800}
              height={256}
            />
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
              <p className="text-sm text-gray-500">소비자가</p>
              <p className="text-2xl font-bold">{new Intl.NumberFormat('ko-KR').format(groupBuy.product.base_price)}원</p>
            </div>
            <GroupBuyActionButton isRecruiting={isRecruiting} isFull={isFull} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
