'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ReviewForm from '@/components/review/ReviewForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getGroupbuyReviews } from '@/lib/review-service';

function ReviewCreateContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const groupbuyId = searchParams.get('groupbuy') || searchParams.get('groupBuyId') || searchParams.get('groupbuy_id');
  const [groupBuyData, setGroupBuyData] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupbuyId) {
      const fetchData = async () => {
        try {
          // 공구 정보 가져오기
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/`);
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Review - GroupBuy 데이터:', data);
            console.log('🔍 Review - winning_bid:', data.winning_bid);
            console.log('🔍 Review - selected_seller:', data.selected_seller);
            setGroupBuyData(data);
            
            // winning_bid API 호출 시도
            try {
              const winningBidResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/winning_bid/`);
              if (winningBidResponse.ok) {
                const winningBidData = await winningBidResponse.json();
                console.log('🔍 Review - Winning Bid API 데이터:', winningBidData);
                // winning_bid 정보를 groupBuyData에 추가
                setGroupBuyData(prev => ({
                  ...prev,
                  winning_bid: winningBidData
                }));
              }
            } catch (error) {
              console.log('Winning bid API 호출 실패:', error);
            }
          }
          
          // 기존 후기 확인
          if (user?.id) {
            const reviewsData = await getGroupbuyReviews(groupbuyId);
            const myReview = reviewsData.reviews?.find((review: any) => 
              review.user?.id === user.id || review.user === user.id
            );
            if (myReview) {
              setExistingReview(myReview);
            }
          }
        } catch (error) {
          console.error('데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [groupbuyId, user]);

  if (!groupbuyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">공구 정보가 없습니다.</p>
            <div className="text-center mt-4">
              <Link href="/mypage">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  마이페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/mypage">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            마이페이지로 돌아가기
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {existingReview ? '공구 후기 수정' : '공구 후기 작성'}
          </CardTitle>
          {groupBuyData && (
            <p className="text-sm text-gray-600 mt-1">
              {groupBuyData.title}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ReviewForm 
            groupbuyId={parseInt(groupbuyId)} 
            reviewId={existingReview?.id}
            initialRating={existingReview?.rating || 5}
            initialContent={existingReview?.content || ''}
            initialIsPurchased={existingReview?.is_purchased || false}
            creatorId={groupBuyData?.creator?.id || groupBuyData?.creator}
            productName={groupBuyData?.product_details?.name || groupBuyData?.title}
            sellerNickname={groupBuyData?.winning_bid?.seller?.nickname || groupBuyData?.winning_bid?.seller?.username || groupBuyData?.selected_seller?.nickname}
          />
        </CardContent>
      </Card>
      
    </div>
  );
}

export default function ReviewCreatePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    }>
      <ReviewCreateContent />
    </Suspense>
  );
}