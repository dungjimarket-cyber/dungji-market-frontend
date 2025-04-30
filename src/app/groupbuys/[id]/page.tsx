import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle, Info, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import GroupBuyActionButton from '@/components/groupbuy/GroupBuyActionButton';
import { WishButton } from '@/components/ui/WishButton';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime } from '@/lib/groupbuy-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface TelecomDetail {
  carrier: string;
  registration_type: string;
  plan_info: string;
  contract_info: string;
}

interface GroupBuyProduct {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  category_name?: string;
  // 카테고리별 특수 필드(통신 상품)
  telecom_detail?: TelecomDetail;
  // 기타 필드
  release_date?: string;
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
  product: number; // product ID
  product_details: GroupBuyProduct; // 상세 제품 정보
  creator: number; // 판매자(생성자) ID
  creator_name: string; // 판매자(생성자) 이름
}

// 총 지원금 마스킹 함수 추가
function maskSupportAmount(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0';
  const amountStr = amount.toString();
  if (amountStr.length <= 2) return amountStr;
  return `${amountStr[0]}${'*'.repeat(amountStr.length - 2)}${amountStr[amountStr.length - 1]}`;
}

// 남은 시간 계산 함수는 이제 lib/groupbuy-utils.ts에서 가져옵니다.

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

// 서버 컴포넌트에서 클라이언트 컴포넌트로 변경했으므로 이 함수는 제거

export default async function GroupBuyPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const groupBuy = await getGroupBuy(id);
  
  // 현재 로그인한 사용자 정보 가져오기
  const session = await getServerSession(authOptions);
  // 사용자 ID와 공구 생성자 ID를 숫자로 변환하여 비교
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const creatorId = groupBuy?.creator ? Number(groupBuy.creator) : null;
  const isCreator = userId !== null && creatorId !== null && userId === creatorId;

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
  
  // 공구 상태를 동적으로 계산
  const calculatedStatus = calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time);
  const isRecruiting = calculatedStatus === 'recruiting';
  const isFull = remainingSpots === 0;
  const remainingTime = getRemainingTime(groupBuy.end_time);
  // 지원금은 입찰 시 사용자가 제안하는 금액으로, 공구에 입찰된 최고 지원금을 표시
  // 실제로는 Bid 모델에서 가져와야 하지만, 현재는 임의의 값을 사용
  const maskedSupportAmount = maskSupportAmount(300000); // 임의의 값으로 대체

  return (
    <div className="bg-gray-100 min-h-screen pb-8">
      {/* 헤더 */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <Link href="/" className="mr-2">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-medium">공구 참여하기</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">공구에 참여하세요</p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto">
        {/* 상품 정보 카드 */}
        <div className="bg-white p-4 mb-4">
          {/* 상품 이미지 */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <Image
              src={groupBuy.product_details?.image_url || '/placeholder.png'}
              alt={groupBuy.product_details?.name || ''}
              width={400}
              height={400}
              className="object-cover rounded-lg"
            />
          </div>

          {/* 상품 기본 정보 */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">출시일: {groupBuy.product_details?.release_date || '2024년 1월'}</p>
            <h2 className="text-xl font-bold mb-2">{groupBuy.title || groupBuy.product_details?.name}</h2>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Share2 size={16} className="text-green-500 mr-1" />
                <button className="text-green-500 text-sm">공유하기</button>
              </div>
              <WishButton groupbuyId={groupBuy.id} showCount={true} />
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-4">
              <div className="flex gap-2 items-center">
                <span className="font-medium text-red-500">통신사: {groupBuy.product_details?.telecom_detail?.carrier || 'SK텔레콤'}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-medium text-blue-500">유형: {groupBuy.product_details?.telecom_detail?.registration_type || '번호이동'}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-medium">요금제: {groupBuy.product_details?.telecom_detail?.plan_info || '5G 프리미엄'}</span>
              </div>
            </div>
          </div>

          {/* 출고가 및 계약 정보 */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">출고가</p>
            <p className="text-2xl font-bold mb-2">
              ₩{new Intl.NumberFormat('ko-KR').format(groupBuy.product_details?.base_price || 0)}원
            </p>
            <p className="text-sm text-gray-700">{groupBuy.product_details?.telecom_detail?.contract_info || '2년 약정 기본 상품입니다'}</p>
          </div>

          {/* 총 지원금 정보 */}
          <div className="mb-4">
            <p className="text-sm font-medium">총 지원금(공시지원금+추가지원금)</p>
            <p className="text-lg font-bold text-red-500">{maskedSupportAmount || '0'}원</p>
            <p className="text-xs text-gray-500">*유심서비스나 카드결제를 제외한 순수 지원금입니다.</p>
          </div>
        </div>

        {/* 공구 참여 정보 카드 */}
        <div className="bg-white p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <CardTitle className="text-2xl">{groupBuy.title || groupBuy.product_details?.name}</CardTitle>
              <p className="text-gray-600">{groupBuy.description || groupBuy.product_details?.description}</p>
              
              {groupBuy.product_details?.release_date && (
                <div className="text-sm text-gray-500">출시일: {new Date(groupBuy.product_details.release_date).toLocaleDateString('ko-KR')}</div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">공구 참여인원</p>
              <p className="font-bold">{groupBuy.current_participants}/{groupBuy.max_participants}명</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">남은 시간</p>
              <p className="font-bold text-red-500">{remainingTime}</p>
            </div>
          </div>

          {/* 진행 상황 바 */}
          <Progress value={progress} className="h-2 mb-2" />
          
          {/* 총 입찰 건수 */}
          <div className="flex justify-between items-center text-sm mb-4">
            <p>총 입찰 건수</p>
            <p className="font-bold">{groupBuy.current_participants * 2 || 23}건</p>
          </div>

          {/* 현재 최고가 */}
          <div className="flex justify-between items-center text-sm">
            <p>현재 최고가</p>
            <p className="font-bold">{maskedSupportAmount || '0'}원</p>
          </div>
        </div>

        {/* 알림 메시지 */}
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-700">
            입찰가를 제외한 입찰 금액은 비공개 입니다.
          </AlertDescription>
        </Alert>

        {/* 가이드라인 */}
        <Alert className="bg-yellow-50 border-yellow-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm text-yellow-700">
            <Link href="/guidelines" className="underline">
              공동 구매 가이드라인
            </Link>
          </AlertDescription>
        </Alert>

        {/* 참여 버튼 */}
        <div className="px-4">
          <GroupBuyActionButton 
            isRecruiting={isRecruiting} 
            isFull={isFull}
            isCreator={isCreator} 
            groupBuy={{
              id: Number(id),
              title: groupBuy.title,
              product_details: {
                name: groupBuy.product_details?.name || '',
                image_url: groupBuy.product_details?.image_url || '/placeholder.png',
                carrier: groupBuy.product_details?.telecom_detail?.carrier || 'SK텔레콤',
                registration_type: groupBuy.product_details?.telecom_detail?.registration_type || '번호이동',
                base_price: groupBuy.product_details?.base_price || 0
              }
            }}
          />
        </div>
        
        {/* 리뷰 섹션 제거 - 공구 시스템에서 리뷰는 적절하지 않음 */}
      </div>
    </div>
  );
}
