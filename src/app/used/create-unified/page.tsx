/**
 * 통합 중고거래 상품 등록 선택 페이지
 * 카드 선택 방식으로 휴대폰/전자제품 등록 페이지로 이동
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Monitor, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import phoneAPI from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';

export default function UnifiedCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  // 카테고리 선택 및 등록 제한 체크
  const handleCategorySelect = async (category: 'phone' | 'electronics') => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '상품 등록은 로그인 후 이용 가능합니다.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsChecking(true);
    try {
      let response;
      let createPath: string;

      if (category === 'electronics') {
        response = await electronicsApi.checkRegistrationLimit();
        createPath = '/used-electronics/create';
      } else {
        const token = localStorage.getItem('accessToken');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
        const apiUrl = `${baseUrl}/used/phones/check-limit/`;

        const res = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        response = await res.json();
        createPath = '/used/create';
      }

      console.log('Registration limit check response:', response);

      if (!response.can_register) {
        const currentCount = response.active_count ?? response.current_count ?? 0;
        const maxCount = response.max_count ?? 5;

        // 페널티가 있는 경우 우선 처리
        if (response.penalty_end) {
          const penaltyDate = new Date(response.penalty_end);
          const now = new Date();

          console.log('Penalty check:', {
            penalty_end: response.penalty_end,
            penaltyDate: penaltyDate.toISOString(),
            now: now.toISOString(),
            isPenalty: penaltyDate > now
          });

          // 패널티 시간이 미래인 경우 (아직 패널티 중)
          if (penaltyDate > now) {
            const diffMs = penaltyDate.getTime() - now.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            toast({
              title: '등록 제한 (패널티)',
              description: `제안받은 상품 삭제로 인한 패널티가 적용중입니다. ${hours > 0 ? `${hours}시간 ` : ''}${minutes}분 후 등록 가능합니다.`,
              variant: 'destructive',
            });

            // 중고거래 마이페이지로 이동
            router.push('/used/mypage');
            return;
          }
        }

        // 패널티가 없는 경우에만 개수 제한 체크
        if (currentCount >= maxCount) {
          toast({
            title: '등록 제한',
            description: category === 'electronics'
              ? `전자제품 최대 ${maxCount}개까지만 등록 가능합니다. (현재 ${currentCount}개)`
              : `휴대폰 최대 ${maxCount}개까지만 등록 가능합니다. (현재 ${currentCount}개)`,
            variant: 'destructive',
          });

          // 중고거래 마이페이지로 이동
          router.push('/used/mypage');
          return;
        }

        // can_register가 false인데 위 조건들에 해당하지 않는 경우
        console.warn('Unknown registration restriction:', response);
      }

      // 해당 카테고리 등록 페이지로 이동
      router.push(createPath);
    } catch (error) {
      console.error('Registration limit check failed:', error);
      toast({
        title: '오류',
        description: '등록 가능 여부 확인에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-lg font-semibold">상품 등록</h1>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">어떤 상품을 판매하시나요?</h2>
          <p className="text-sm text-gray-600">카테고리를 선택해주세요</p>
        </div>

        <div className="space-y-3">
          {/* 휴대폰 카드 */}
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={() => !isChecking && handleCategorySelect('phone')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base">휴대폰</h3>
                    <p className="text-sm text-gray-500">스마트폰, 태블릿</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* 전자제품 카드 */}
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={() => !isChecking && handleCategorySelect('electronics')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base">전자제품/가전</h3>
                    <p className="text-sm text-gray-500">노트북, TV, 냉장고 등</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex gap-2">
            <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">등록 제한 안내</p>
              <p className="text-xs text-blue-600">
각 카테고리별 최대 5개까지 동시 등록 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 로딩 오버레이 */}
        {isChecking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm">등록 가능 여부 확인중...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}