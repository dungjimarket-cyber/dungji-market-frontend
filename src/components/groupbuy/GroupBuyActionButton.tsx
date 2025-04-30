'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import JoinGroupBuyModal from './JoinGroupBuyModal';

interface GroupBuyActionButtonProps {
  isRecruiting: boolean;
  isFull: boolean;
  isCreator?: boolean; // 자신이 만든 공구인지 여부
  groupBuy: {
    id: number;
    title: string;
    product_details: {
      name: string;
      image_url: string;
      carrier?: string;
      registration_type?: string;
      base_price: number;
    };
  };
}

export default function GroupBuyActionButton({
  isRecruiting,
  isFull,
  isCreator = false,
  groupBuy
}: GroupBuyActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (isRecruiting && !isFull && !isCreator) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button 
        className="w-full py-6 text-lg font-bold" 
        disabled={!isRecruiting || isFull || isCreator}
        onClick={handleClick}
      >
        {isCreator 
          ? '내가 만든 공구' 
          : !isRecruiting 
            ? '종료된 공구' 
            : isFull 
              ? '인원 마감' 
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
