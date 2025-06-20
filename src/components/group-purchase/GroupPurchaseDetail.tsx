'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Users, Clock, Gavel, Share2, Info, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    carrier?: string;
    registration_type?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    plan_info: string;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
  total_bids?: number;
  highest_bid_amount?: number;
}

interface GroupPurchaseDetailProps {
  groupBuy: GroupBuy;
}

/**
 * 공구 상세 페이지 컴포넌트 - Framer 디자인 기반
 * @param groupBuy - 공구 정보
 */
export function GroupPurchaseDetail({ groupBuy }: GroupPurchaseDetailProps) {
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);

  /**
   * 뒤로가기
   */
  const handleGoBack = () => {
    router.back();
  };

  /**
   * 사용자가 공구에 참여했는지 확인
   */
  useEffect(() => {
    const checkParticipation = async () => {
      if (!isAuthenticated || !user?.id || !accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/joined_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          // 현재 공구 ID가 참여 중인 공구 목록에 있는지 확인
          const isCurrentGroupBuyJoined = data.some((gb: any) => gb.id === groupBuy.id);
          setIsParticipant(isCurrentGroupBuyJoined);
        }
      } catch (error) {
        console.error('참여 확인 오류:', error);
      }
    };
    
    checkParticipation();
  }, [isAuthenticated, user?.id, accessToken, groupBuy.id]);

  /**
   * 공구 참여하기
   */
  const handleJoinGroupBuy = async () => {
    try {
      setIsJoining(true);
      if (!accessToken) {
        toast.error('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '참여에 실패했습니다.');
      }

      toast.success('공동구매에 참여했습니다!');
      setIsParticipant(true);
      // 페이지 새로고침하여 최신 데이터 반영
      window.location.reload();
      
    } catch (error) {
      console.error('Error joining group buy:', error);
      toast.error(error instanceof Error ? error.message : '참여에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  /**
   * 공구 탈퇴하기
   */
  const handleLeaveGroupBuy = async () => {
    try {
      setIsLeaving(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        throw new Error('공구 탈퇴에 실패했습니다.');
      }

      toast.success('공구에서 탈퇴했습니다.');
      setIsParticipant(false);
      setOpenLeaveDialog(false);
      
      // 마이페이지로 이동
      router.push('/mypage');
    } catch (err) {
      console.error('공구 탈퇴 오류:', err);
      toast.error(err instanceof Error ? err.message : '공구 탈퇴에 실패했습니다.');
    } finally {
      setIsLeaving(false);
    }
  };

  /**
   * 공유하기
   */
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: groupBuy.product_details?.name || '공동구매',
          text: `${groupBuy.product_details?.name} 공동구매에 참여해보세요!`,
          url: window.location.href,
        });
      } else {
        // 웹 공유 API가 지원되지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        toast.success('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('공유에 실패했습니다.');
    }
  };

  /**
   * 남은 시간 계산
   */
  const getRemainingTime = () => {
    const timeLeft = new Date(groupBuy.end_time).getTime() - Date.now();
    if (timeLeft <= 0) return '마감';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}일 ${hours}시간`;
    }
    return `${hours}시간`;
  };

  /**
   * 지원금 마스킹
   */
  const maskAmount = (amount?: number) => {
    if (!amount) return '0원';
    const amountStr = amount.toString();
    if (amountStr.length <= 2) return `${amountStr}원`;
    return `${amountStr[0]}${'*'.repeat(amountStr.length - 2)}${amountStr[amountStr.length - 1]}원`;
  };

  const isCompleted = groupBuy.status === 'completed' || groupBuy.status === 'cancelled';

  return (
    <div className="relative">
      <div className="min-h-screen bg-white">
        {/* 헤더 */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">공구 상세</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="px-4 py-6">
          {/* 제품 이미지 및 기본 정보 */}
          <div className="mb-6">
            <div className="relative w-full h-64 mb-4 rounded-2xl overflow-hidden">
              <Image
                src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
                alt={groupBuy.product_details?.name || '상품 이미지'}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">
                {groupBuy.product_details?.name || '상품명 없음'}
              </h2>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>출시일:</span>
                <span className="font-medium text-gray-700">
                  {new Date(groupBuy.start_time).toLocaleDateString('ko-KR')}
                </span>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{getRemainingTime()}</span>
                </div>
              </div>
              
              <div className="text-sm font-medium">
                {groupBuy.product_details?.base_price?.toLocaleString()}원
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {groupBuy.current_participants}/{groupBuy.max_participants}명 참여중
                  </span>
                </div>
                <span className="text-sm text-blue-600">
                  {Math.round((groupBuy.current_participants / groupBuy.max_participants) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(groupBuy.current_participants / groupBuy.max_participants) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 통신사 정보 (통신 관련 공구인 경우) */}
            {(groupBuy.telecom_detail || groupBuy.product_details?.carrier) && (
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <h3 className="text-sm font-medium mb-2">통신 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">통신사:</span>{' '}
                    <span>{groupBuy.telecom_detail?.telecom_carrier || groupBuy.product_details?.carrier || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">가입유형:</span>{' '}
                    <span>{groupBuy.telecom_detail?.subscription_type || groupBuy.product_details?.registration_type || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">요금제:</span>{' '}
                    <span>{groupBuy.telecom_detail?.plan_info || groupBuy.product_details?.plan_info || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">약정기간:</span>{' '}
                    <span>{groupBuy.telecom_detail?.contract_period || groupBuy.product_details?.contract_info || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 상품 설명 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">상품 설명</h3>
              <p className="text-sm text-gray-600">
                {groupBuy.product_details?.description || '상품 설명이 없습니다.'}
              </p>
            </div>

            {/* 경매 정보 (경매 공구인 경우) */}
            {groupBuy.highest_bid_amount && (
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <Gavel className="w-4 h-4 mr-1" />
                    경매 현황
                  </h3>
                  <span className="text-xs text-gray-500">{groupBuy.total_bids || 0}개 입찰</span>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">현재 최고 입찰가</span>
                    <span className="font-medium">{maskAmount(groupBuy.highest_bid_amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 공구 생성자 정보 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-2">
                  {groupBuy.creator?.profile_image ? (
                    <Image 
                      src={groupBuy.creator.profile_image} 
                      alt="프로필" 
                      width={32} 
                      height={32} 
                    />
                  ) : (
                    <span className="text-xs">👤</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{groupBuy.creator?.username || '익명'}</p>
                  <p className="text-xs text-gray-500">공구 생성자</p>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Info className="w-3 h-3 mr-1" />
                <span>신고하기</span>
              </div>
            </div>

            {/* 버튼 영역 */}
            <button
              onClick={handleJoinGroupBuy}
              disabled={isJoining || isCompleted}
              className={`w-full py-3 rounded-lg font-medium mb-4 ${
                isCompleted 
                  ? 'bg-gray-200 text-gray-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isJoining ? '처리 중...' : isCompleted ? '마감된 공구입니다' : '참여하기'}
            </button>

            <button 
              onClick={handleShare}
              className="w-full py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center mb-4"
            >
              <Share2 className="w-4 h-4 mr-1" />
              지인과 공유하기
            </button>

            {isParticipant && (
              <div className="text-center">
                <button 
                  className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center justify-center gap-1"
                  onClick={() => setOpenLeaveDialog(true)}
                  disabled={isLeaving}
                >
                  <UserMinus size={12} />
                  {isLeaving ? '처리 중...' : '탈퇴하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={openLeaveDialog} onOpenChange={setOpenLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공구에서 탈퇴하기</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            정말 이 공구에서 탈퇴하시겠습니까? 탈퇴 후에는 다시 참여할 수 있습니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroupBuy} disabled={isLeaving}>
              {isLeaving ? '처리 중...' : '탈퇴하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
