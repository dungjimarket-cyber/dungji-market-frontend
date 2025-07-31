'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Share2, Heart, Clock, Users, MapPin, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import JoinGroupBuyModal from '@/components/groupbuy/JoinGroupBuyModal';
import { getRegistrationTypeText, calculateGroupBuyStatus, getStatusText } from '@/lib/groupbuy-utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
import { ConsentStatusCard } from '@/components/group-purchase/ConsentStatusCard';
import { VotingTimer } from '@/components/groupbuy/VotingTimer';
import { BidVotingList } from '@/components/groupbuy/BidVotingList';
import { WinningBidDisplay } from '@/components/groupbuy/WinningBidDisplay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  voting_end?: string;
  creator_name?: string;
  host_id?: number;
  host_username?: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    category_detail_type?: string;
    carrier?: string;
    registration_type?: string;
    registration_type_korean?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    subscription_type_korean?: string;
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
  region_type?: string;
  region?: string;
  region_name?: string;
  regions?: Array<{
    id: number;
    name: string;
    parent?: string;
  }>;
}

interface GroupPurchaseDetailProps {
  groupBuy: GroupBuy;
}

export function GroupPurchaseDetailNew({ groupBuy }: GroupPurchaseDetailProps) {
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const { toast } = useToast();
  
  const [isKakaoInAppBrowser, setIsKakaoInAppBrowser] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [hasBid, setHasBid] = useState(false);
  const [timeLeftText, setTimeLeftText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawingParticipation, setWithdrawingParticipation] = useState(false);
  const [showCancelBidDialog, setShowCancelBidDialog] = useState(false);
  const [cancellingBid, setCancellingBid] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGroupBuy, setDeletingGroupBuy] = useState(false);
  const [hasReceivedContact, setHasReceivedContact] = useState(false);
  const [isWished, setIsWished] = useState(false);

  useEffect(() => {
    setIsKakaoInAppBrowser(/KAKAOTALK/i.test(navigator.userAgent));
  }, []);

  // 실제 상태 계산
  const actualStatus = calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time);
  const isEnded = actualStatus === 'completed' || actualStatus === 'cancelled';
  const isBidding = actualStatus === 'bidding';
  const isVoting = actualStatus === 'voting';
  const isSellerConfirmation = actualStatus === 'seller_confirmation';
  const isFinalSelection = isVoting || isSellerConfirmation;
  const isCreator = user && (parseInt(user.id) === groupBuy.creator.id || parseInt(user.id) === groupBuy.host_id);
  const isSeller = user?.role === 'seller';

  // 남은 시간 계산
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endTime = new Date(groupBuy.end_time);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeftText('마감');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeftText(`${days}일 ${hours}시간`);
      } else if (hours > 0) {
        setTimeLeftText(`${hours}시간 ${minutes}분`);
      } else {
        setTimeLeftText(`${minutes}분`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [groupBuy.end_time]);

  // 사용자 참여 상태 확인
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      checkParticipationStatus();
      checkBidStatus();
      checkWishStatus();
    }
  }, [isAuthenticated, accessToken, groupBuy.id]);

  const checkParticipationStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/participations/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const participation = data.find((p: any) => p.groupbuy === groupBuy.id);
        setIsParticipant(!!participation);
      }
    } catch (error) {
      console.error('참여 상태 확인 오류:', error);
    }
  };

  const checkBidStatus = async () => {
    if (!isSeller) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/bids/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const bid = data.find((b: any) => b.groupbuy === groupBuy.id);
        setHasBid(!!bid);
      }
    } catch (error) {
      console.error('입찰 상태 확인 오류:', error);
    }
  };

  const checkWishStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlists/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const wished = data.some((w: any) => w.groupbuy === groupBuy.id);
        setIsWished(wished);
      }
    } catch (error) {
      console.error('찜 상태 확인 오류:', error);
    }
  };

  const handleWishToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      if (isWished) {
        // 찜 삭제
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlists/${groupBuy.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });

        if (response.ok) {
          setIsWished(false);
          toast({
            title: '찜 삭제 완료',
            description: '찜 목록에서 삭제되었습니다.',
          });
        }
      } else {
        // 찜 추가
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlists/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            groupbuy: groupBuy.id
          })
        });

        if (response.ok) {
          setIsWished(true);
          toast({
            title: '찜 추가 완료',
            description: '찜 목록에 추가되었습니다.',
          });
        }
      }
    } catch (error) {
      console.error('찜 토글 오류:', error);
      toast({
        title: '오류 발생',
        description: '찜 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/groupbuys/${groupBuy.id}`;
    const shareText = `${groupBuy.product_details.name} 공동구매에 참여해보세요!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: groupBuy.product_details.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: '링크 복사 완료',
            description: '클립보드에 링크가 복사되었습니다.',
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: '링크 복사 완료',
        description: '클립보드에 링크가 복사되었습니다.',
      });
    }
  };

  const handleJoinClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/groupbuys/${groupBuy.id}`);
      return;
    }

    if (isSeller) {
      router.push(`/groupbuys/${groupBuy.id}/bid`);
      return;
    }

    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setIsParticipant(true);
    setShowJoinModal(false);
    router.refresh();
  };

  const renderActionButton = () => {
    if (isEnded) {
      return (
        <Button disabled className="w-full py-6 text-lg font-bold bg-gray-400">
          마감된 공구
        </Button>
      );
    }

    if (isFinalSelection) {
      return (
        <Button disabled className="w-full py-6 text-lg font-bold bg-orange-500">
          최종 선택 진행중
        </Button>
      );
    }

    if (isSeller) {
      if (hasBid) {
        return (
          <Button 
            onClick={() => router.push(`/groupbuys/${groupBuy.id}/bid`)}
            className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
          >
            입찰 수정하기
          </Button>
        );
      }
      return (
        <Button 
          onClick={handleJoinClick}
          className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700"
        >
          공구 입찰하기
        </Button>
      );
    }

    if (isParticipant) {
      return (
        <div className="space-y-2">
          <Button disabled className="w-full py-6 text-lg font-bold bg-green-600">
            ✓ 참여 완료
          </Button>
          {!isBidding && (
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(true)}
              className="w-full py-3 text-sm"
            >
              참여 철회하기
            </Button>
          )}
        </div>
      );
    }

    return (
      <Button 
        onClick={handleJoinClick}
        className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700"
      >
        공구 참여하기
      </Button>
    );
  };

  const handleWithdrawParticipation = async () => {
    setWithdrawingParticipation(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participations/withdraw/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupbuy_id: groupBuy.id
        })
      });

      if (response.ok) {
        setIsParticipant(false);
        toast({
          title: '참여 철회 완료',
          description: '공구 참여가 철회되었습니다.',
        });
        router.refresh();
      } else {
        const data = await response.json();
        toast({
          title: '참여 철회 실패',
          description: data.error || '참여 철회에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('참여 철회 오류:', error);
      toast({
        title: '오류 발생',
        description: '참여 철회 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawingParticipation(false);
      setShowWithdrawDialog(false);
    }
  };

  // 지역 정보 표시
  const renderRegionInfo = () => {
    if (groupBuy.region_type === 'nationwide') {
      return '전국';
    }
    
    if (groupBuy.regions && groupBuy.regions.length > 0) {
      return groupBuy.regions.map(region => {
        let displayName = region.name || '';
        return displayName
          .replace('특별시', '')
          .replace('광역시', '')
          .replace('특별자치시', '')
          .replace('특별자치도', '');
      }).join(', ');
    }
    
    return '지역 정보 없음';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-medium">공구 상세</h1>
          
          <button
            onClick={handleShare}
            className="p-2 -mr-2"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 메인 이미지 */}
      <div className="relative w-full bg-white">
        <div className="relative aspect-square max-w-lg mx-auto">
          <Image
            src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
            alt={groupBuy.product_details?.name || '상품 이미지'}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="bg-white px-4 py-6 border-b">
        <h2 className="text-2xl font-bold mb-2">
          {groupBuy.product_details?.name || '상품명 없음'}
        </h2>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span className="text-lg font-bold text-blue-600">￦{groupBuy.product_details?.base_price?.toLocaleString() || '0'}원</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {groupBuy.telecom_detail?.telecom_carrier && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              통신사: {groupBuy.telecom_detail.telecom_carrier}
            </span>
          )}
          {(groupBuy.product_details?.registration_type || groupBuy.telecom_detail?.subscription_type) && (
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              가입유형: {groupBuy.product_details?.registration_type_korean || 
                       groupBuy.telecom_detail?.subscription_type_korean || 
                       getRegistrationTypeText(groupBuy.product_details?.registration_type || groupBuy.telecom_detail?.subscription_type)}
            </span>
          )}
          {groupBuy.telecom_detail?.plan_info && (
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              요금제: {groupBuy.telecom_detail.plan_info}
            </span>
          )}
        </div>

        {/* 상품 설명 */}
        {groupBuy.product_details?.description && (
          <div className="mt-4 text-gray-600">
            <p className="whitespace-pre-wrap">{groupBuy.product_details.description}</p>
          </div>
        )}
      </div>

      {/* 공구 정보 */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">모집인원</span>
            <span className="font-bold text-lg">
              {groupBuy.current_participants}/{groupBuy.max_participants}명
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">마감시간</span>
            <span className="font-bold text-lg text-red-500">
              {timeLeftText}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">공구지역</span>
            <span className="font-bold">
              {renderRegionInfo()}
            </span>
          </div>

          {groupBuy.telecom_detail?.contract_period && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">약정기간</span>
              <span className="font-bold">
                {groupBuy.telecom_detail.contract_period}
              </span>
            </div>
          )}

          {groupBuy.total_bids !== undefined && groupBuy.total_bids > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">현재 최고 지원금</span>
              <span className="font-bold text-lg text-blue-600">
                {groupBuy.total_bids}건
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 공구 주최자 정보 */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              {groupBuy.creator?.profile_image ? (
                <Image
                  src={groupBuy.creator.profile_image}
                  alt={groupBuy.creator?.username || '사용자'}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  {(groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username)?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium">공구 주최자</p>
              <p className="text-sm text-gray-600">
                {groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username || '익명'}
              </p>
            </div>
          </div>
          
          <button className="text-blue-600 text-sm font-medium">
            방장
          </button>
        </div>
        
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
          <span>공구 참여인원</span>
          <span className="font-medium">{groupBuy.current_participants}명</span>
        </div>
      </div>

      {/* 안내 사항 */}
      <div className="bg-white px-4 py-4 mb-20">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            * 카트 제휴할인이나 중성물음 택포한 승수 최여 적용됩니다.
            (쿠키지쿠팅+추가지원금)
          </p>
          <p className="text-sm text-gray-600 mt-2">
            * 입자의룰 제안한 입찰 금액은 타공구 이탈시
          </p>
        </div>
      </div>

      {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-30">
        <div className="flex gap-3">
          <button
            onClick={handleWishToggle}
            className={`p-3 border rounded-lg ${isWished ? 'bg-red-50 border-red-500' : 'border-gray-300'}`}
          >
            <Heart className={`w-6 h-6 ${isWished ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
          </button>
          
          <div className="flex-1">
            {renderActionButton()}
          </div>
        </div>
        
        {/* 찜하기 버튼 아래 텍스트 */}
        <p className="text-center text-xs text-gray-500 mt-2">
          공동 구매 가이트라인
        </p>
      </div>

      {/* 모달들 */}
      <JoinGroupBuyModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        groupBuy={groupBuy}
        onSuccess={handleJoinSuccess}
      />

      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>참여 철회 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 공구 참여를 철회하시겠습니까?
              철회 후에는 다시 참여할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawParticipation}
              disabled={withdrawingParticipation}
              className="bg-red-600 hover:bg-red-700"
            >
              {withdrawingParticipation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  철회 중...
                </>
              ) : (
                '참여 철회'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}