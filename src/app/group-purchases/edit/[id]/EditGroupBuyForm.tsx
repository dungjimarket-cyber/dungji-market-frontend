'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { tokenUtils } from '@/lib/tokenUtils';
import CreateForm from '../../create/CreateForm';
import { Loader2 } from 'lucide-react';

interface EditGroupBuyFormProps {
  groupBuyId: string;
}

export default function EditGroupBuyForm({ groupBuyId }: EditGroupBuyFormProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [groupBuyData, setGroupBuyData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupBuyData = async () => {
      if (!isAuthenticated || authLoading) return;

      try {
        setLoading(true);
        
        // 공구 데이터 가져오기
        const response: any = await tokenUtils.fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/`,
          {
            method: 'GET',
          }
        );

        if (!response) {
          throw new Error('공구 정보를 불러올 수 없습니다.');
        }

        console.log('공구 데이터:', response);
        console.log('제품 ID:', response.product);
        console.log('제품 상세 정보:', response.product_info);
        console.log('지역 정보:', response.regions);
        console.log('통신 상세:', response.telecom_detail);

        // 작성자 확인
        const creatorId = typeof response.creator === 'object' ? response.creator?.id : response.creator;
        if (creatorId !== user?.id) {
          toast({
            title: "권한 없음",
            description: "본인이 작성한 공구만 수정할 수 있습니다.",
            variant: "destructive",
          });
          router.push(`/groupbuys/${groupBuyId}`);
          return;
        }

        // 상태 확인 - 모집중인 공구만 수정 가능
        if (response && response.status && response.status !== 'recruiting' && response.status !== 'active') {
          toast({
            title: "수정 불가",
            description: "모집중인 공구만 수정할 수 있습니다.",
            variant: "destructive",
          });
          router.push(`/groupbuys/${groupBuyId}`);
          return;
        }

        setGroupBuyData(response);
      } catch (error) {
        console.error('공구 데이터 가져오기 오류:', error);
        setError('공구 정보를 불러오는데 실패했습니다.');
        toast({
          title: "오류",
          description: "공구 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroupBuyData();
  }, [groupBuyId, isAuthenticated, authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!groupBuyData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">공구 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // CreateForm에 전달할 초기 데이터 변환
  const initialData = {
    id: groupBuyData.id,
    title: groupBuyData.title,
    description: groupBuyData.description,
    min_participants: groupBuyData.min_participants,
    max_participants: groupBuyData.max_participants,
    end_time: groupBuyData.end_time,
    product_id: groupBuyData.product_info?.id || groupBuyData.product || groupBuyData.product_id,
    product: groupBuyData.product_info || null, // product_info 사용
    region_type: groupBuyData.region_type || 'local',
    regions: groupBuyData.regions || [],
    current_participants: groupBuyData.current_participants || 0, // 참여자 수 추가
    
    // 통신 상품 관련 정보
    telecom_detail: groupBuyData.telecom_detail,
    
    // 기타 제품 정보
    product_details: groupBuyData.product_details || groupBuyData.product,
  };

  return (
    <CreateForm 
      mode="edit" 
      initialData={initialData}
      groupBuyId={groupBuyId}
    />
  );
}