'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import JoinGroupBuyModal from './JoinGroupBuyModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface GroupBuyActionButtonProps {
  isRecruiting: boolean;
  isFull: boolean;
  isCreator?: boolean; // 자신이 만든 공구인지 여부
  isSeller?: boolean; // 판매회원(셀러) 여부
  isParticipating?: boolean; // 이미 참여한 공구인지 여부
  hasSellerMembers?: boolean; // 판매회원이 1명 이상 있는지 여부
  onRefresh?: () => void; // 참여 상태 및 참여자 수 새로고침 함수
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
  onRefresh,
  groupBuy
}: GroupBuyActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

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
    console.log('버튼 클릭 - 초기 상태:', {
      isRecruiting,
      isFull,
      isCreator,
      isSeller,
      isParticipating,
      user
    });
    
    // 판매회원은 상세 페이지에서 입찰 처리하도록 이벤트 발생
    if (isSeller) {
      // 부모 컴포넌트에 입찰 이벤트 전달
      if (onRefresh) {
        // onRefresh를 입찰 모달 오픈 용도로 재활용
        onRefresh();
      }
      return;
    }
    
    // 일반 구매회원은 프로필 체크 후 참여 모달 표시
    if (isRecruiting && !isFull && !isCreator && !isParticipating) {
      // 프로필 체크 디버깅
      console.log('프로필 체크 시작:', {
        user,
        sns_type: user?.sns_type,
        role: user?.role,
        phone_number: user?.phone_number,
        address_region: user?.address_region
      });
      
      // 모든 일반회원 프로필 체크 (sns_type 관계없이)
      if (user && user.role === 'buyer') {
        if (!user.phone_number || !user.address_region) {
          console.log('프로필 정보 누락 감지');
          if (confirm('공구에 참여하기 위한 활동지역, 연락처 정보를 업데이트 해주세요~\n\n확인을 누르시면 내 정보 설정 페이지로 이동합니다.')) {
            router.push('/mypage/settings');
            return;
          }
          return;
        }
      }
      
      // 프로필 체크 통과 시 모달 오픈
      setIsModalOpen(true);
    }
  };

  // 버튼 텍스트 결정 (구성표 기준)
  const getButtonText = () => {
    if (isCreator) return '내가 만든 공구';
    if (!isRecruiting) return '종료된 공구';
    if (isFull) return '인원 마감';
    
    // 판매회원인 경우 - 입찰 텍스트 유지
    if (isSeller) {
      // 이미 입찰한 경우
      if (isParticipating) {
        return '견적 수정하기';
      }
      return '견적 제안하기';
    }
    
    // 일반회원인 경우
    if (isParticipating) {
      return '참여 완료';
    }
    
    if (!hasSellerMembers) {
      return '판매회원 없음';
    }
    
    return '공구 참여하기';
  };

  // 버튼 비활성화 조건
  const isDisabled = () => {
    if (!isRecruiting) return true;
    if (isFull) return true;
    if (isCreator) return true;
    if (isParticipating) return true;
    if (!isSeller && !hasSellerMembers) return true;
    return false;
  };

  return (
    <>
      <Button 
        className="w-full py-6 text-lg font-bold" 
        disabled={isDisabled()}
        onClick={handleClick}
      >
        {getButtonText()}
      </Button>

      {/* 공구 참여 모달 */}
      <JoinGroupBuyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={onRefresh} 
        groupBuy={groupBuy} 
      />
    </>
  );
}
