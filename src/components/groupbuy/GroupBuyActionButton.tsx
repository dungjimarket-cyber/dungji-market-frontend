'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import JoinGroupBuyModal from './JoinGroupBuyModal';

interface GroupBuyActionButtonProps {
  isRecruiting: boolean;
  isFull: boolean;
  isCreator?: boolean; // 자신이 만든 공구인지 여부
  isSeller?: boolean; // 판매회원(셀러) 여부
  isParticipating?: boolean; // 이미 참여한 공구인지 여부
  hasSellerMembers?: boolean; // 판매회원이 1명 이상 있는지 여부
  groupBuy: {
    id: number;
    title: string;
    product_details: {
      name: string;
      image_url: string;
      carrier?: string; // telecom_detail에서 가져온 값
      registration_type?: string; // telecom_detail에서 가져온 값
      base_price: number;
    };
  };
}

export default function GroupBuyActionButton({
  isRecruiting,
  isFull,
  isCreator = false,
  isSeller = false,
  isParticipating = false,
  hasSellerMembers = false,
  groupBuy
}: GroupBuyActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 디버깅 로그 추가
  console.log('그룹구매 버튼 상태:', {
    isRecruiting,
    isFull,
    isCreator,
    isSeller,
    isParticipating,
    hasSellerMembers,
    groupBuyId: groupBuy.id
  });

  const handleClick = () => {
    // 판매회원은 입찰 기록을 보거나 입찰 관리 페이지로 이동
    if (isSeller) {
      // 입찰 기록 모달 표시 또는 관리 페이지로 링크 시도
      console.log('판매회원: 입찰 기록/관리 접근', {
        groupBuyId: groupBuy.id,
        isSeller
      });
      
      // 판매자 대시보드로 이동
      window.location.href = `/seller-dashboard?groupBuyId=${groupBuy.id}`;
      return;
    }
    
    // 일반 구매회원은 입찰 모달 표시
    if (isRecruiting && !isFull && !isCreator) {
      setIsModalOpen(true);
    }
  };

  // 판매회원이거나 이미 참여한 공구인 경우 버튼 표시하지 않음
  if (isSeller || isParticipating) return null;

  return (
    <>
      <Button 
        className="w-full py-6 text-lg font-bold" 
        disabled={!isRecruiting || isFull || isCreator || !hasSellerMembers}
        onClick={handleClick}
      >
        {isCreator
          ? '내가 만든 공구'
          : !isRecruiting
            ? '종료된 공구'
            : isFull
              ? '인원 마감'
              : !hasSellerMembers
                ? '판매회원 없음'
                : '공구 참여하기'}
      </Button>

      {/* 공구 참여 모달 */}
      <JoinGroupBuyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        groupBuy={groupBuy} 
      />
    </>
  );
}
