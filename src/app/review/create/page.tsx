'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ReviewForm from '@/components/review/ReviewForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function ReviewCreateContent() {
  const searchParams = useSearchParams();
  const groupbuyId = searchParams.get('groupbuy') || searchParams.get('groupBuyId') || searchParams.get('groupbuy_id');
  const [groupBuyData, setGroupBuyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupbuyId) {
      const fetchGroupBuyData = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/`);
          if (response.ok) {
            const data = await response.json();
            setGroupBuyData(data);
          }
        } catch (error) {
          console.error('공구 정보 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchGroupBuyData();
    } else {
      setLoading(false);
    }
  }, [groupbuyId]);

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
          <CardTitle>공구 후기 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm 
            groupbuyId={parseInt(groupbuyId)} 
            creatorId={groupBuyData?.creator?.id || groupBuyData?.creator}
          />
        </CardContent>
      </Card>
      
      {/* 노쇼 신고 안내 카드 */}
      <Card className="mt-6 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg text-orange-800">거래 상대방이 나타나지 않으셨나요?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            약속된 거래 시간에 상대방이 나타나지 않거나 연락이 두절된 경우, 
            노쇼 신고를 통해 불이익을 받지 않도록 조치하세요.
          </p>
          <Link href={`/noshow-report/create?groupbuy=${groupbuyId}`}>
            <Button variant="outline" className="border-orange-500 text-orange-700 hover:bg-orange-100">
              노쇼 신고하기
            </Button>
          </Link>
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