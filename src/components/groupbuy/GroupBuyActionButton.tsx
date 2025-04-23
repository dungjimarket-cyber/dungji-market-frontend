'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import JoinGroupBuyModal from './JoinGroupBuyModal';

interface GroupBuyActionButtonProps {
  isRecruiting: boolean;
  isFull: boolean;
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
  groupBuy
}: GroupBuyActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (isRecruiting && !isFull) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button 
        className="w-full py-6 text-lg font-bold" 
        disabled={!isRecruiting || isFull}
        onClick={handleClick}
      >
        {!isRecruiting ? '종료된 공구' : isFull ? '인원 마감' : '공구 참여하기'}
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
