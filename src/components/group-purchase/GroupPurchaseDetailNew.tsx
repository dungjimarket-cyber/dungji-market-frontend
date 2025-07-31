'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Share2, Heart, Clock, Users, MapPin, Calendar, Star, ChevronRight, Gavel, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import JoinGroupBuyModal from '@/components/groupbuy/JoinGroupBuyModal';
import BidModal from '@/components/groupbuy/BidModal';
import BidHistoryModal from '@/components/groupbuy/BidHistoryModal';
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
  
  // 판매자 관련 상태
  const [myBidAmount, setMyBidAmount] = useState<number | null>(null);
  const [myBidId, setMyBidId] = useState<number | null>(null);
  const [canCancelBid, setCanCancelBid] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState<number | string>('');
  const [bidType, setBidType] = useState<'price' | 'support'>('support');
  const [myBidRank, setMyBidRank] = useState<{ rank: number; total: number } | null>(null);
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false);
  const [showNoBidTokenDialog, setShowNoBidTokenDialog] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const fetchBidInfoRef = useRef<() => Promise<void>>(() => Promise.resolve());

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
        if (bid) {
          setHasBid(true);
          setMyBidAmount(bid.amount);
          setMyBidId(bid.id);
          setBidType(bid.bid_type || 'support');
          
          // 입찰 취소 가능 여부 확인
          const now = new Date();
          const endTime = new Date(groupBuy.end_time);
          setCanCancelBid(now < endTime);
          
          // 입찰 순위 확인
          fetchBidRank(bid.id);
        } else {
          setHasBid(false);
          setMyBidAmount(null);
          setMyBidId(null);
        }
      }
    } catch (error) {
      console.error('입찰 상태 확인 오류:', error);
    }
  };
  
  // 입찰 순위 확인
  const fetchBidRank = async (bidId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/bids/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const bids = await response.json();
        const sortedBids = bids.sort((a: any, b: any) => b.amount - a.amount);
        const myBidIndex = sortedBids.findIndex((b: any) => b.id === bidId);
        
        if (myBidIndex !== -1) {
          setMyBidRank({
            rank: myBidIndex + 1,
            total: sortedBids.length
          });
        }
      }
    } catch (error) {
      console.error('입찰 순위 확인 오류:', error);
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

  const handleJoinClick = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/groupbuys/${groupBuy.id}`);
      return;
    }

    if (isSeller) {
      // 입찰권 확인
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bid-tokens/balance/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.balance === 0) {
            setShowNoBidTokenDialog(true);
            return;
          }
        }
      } catch (error) {
        console.error('입찰권 확인 오류:', error);
      }
      
      setShowBidModal(true);
      return;
    }

    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setIsParticipant(true);
    setShowJoinModal(false);
    router.refresh();
  };

  const handleBidSuccess = () => {
    checkBidStatus();
    router.refresh();
  };

  const handleCancelBid = async () => {
    if (!myBidId || !accessToken) return;
    
    setCancellingBid(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/${myBidId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (response.ok) {
        setHasBid(false);
        setMyBidAmount(null);
        setMyBidId(null);
        setMyBidRank(null);
        toast({
          title: '입찰 취소 완료',
          description: '입찰이 성공적으로 취소되었습니다.',
        });
        router.refresh();
      } else {
        toast({
          title: '입찰 취소 실패',
          description: '입찰 취소에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('입찰 취소 오류:', error);
      toast({
        title: '오류 발생',
        description: '입찰 취소 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setCancellingBid(false);
      setShowCancelBidDialog(false);
    }
  };

  const renderActionButton = () => {
    if (isEnded) {
      return (
        <Button disabled className="w-full py-4 text-base font-medium bg-gray-400">
          마감된 공구
        </Button>
      );
    }

    if (isFinalSelection) {
      return (
        <Button disabled className="w-full py-4 text-base font-medium bg-orange-500">
          최종 선택 진행중
        </Button>
      );
    }

    if (isSeller) {
      if (hasBid) {
        return (
          <Button 
            onClick={() => setShowBidModal(true)}
            className="w-full py-4 text-base font-medium bg-indigo-600 hover:bg-indigo-700"
          >
            입찰 수정하기
          </Button>
        );
      }
      return (
        <Button 
          onClick={handleJoinClick}
          className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
        >
          공구 입찰하기
        </Button>
      );
    }

    if (isParticipant) {
      return (
        <Button disabled className="w-full py-4 text-base font-medium bg-green-600">
          ✓ 참여 완료
        </Button>
      );
    }

    return (
      <Button 
        onClick={handleJoinClick}
        className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
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

  // 남은 자리 계산
  const remainingSlots = groupBuy.max_participants - groupBuy.current_participants;

  return (
    <div className="min-h-screen bg-white">
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
      <div className="relative w-full bg-gray-100">
        <div className="relative aspect-square w-full">
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
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold mb-3">
          {groupBuy.product_details?.name || '상품명 없음'}
        </h2>
        
        {/* 가격 */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-sm text-gray-500">출고가</span>
          <span className="text-2xl font-bold">￦{groupBuy.product_details?.base_price?.toLocaleString() || '0'}원</span>
        </div>

        {/* 태그들 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
            가입유형 : {groupBuy.product_details?.registration_type_korean || 
                     groupBuy.telecom_detail?.subscription_type_korean || 
                     getRegistrationTypeText(groupBuy.product_details?.registration_type || groupBuy.telecom_detail?.subscription_type || '신규가입')}
          </span>
          {groupBuy.telecom_detail?.telecom_carrier && (
            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
              통신사 : {groupBuy.telecom_detail.telecom_carrier}
            </span>
          )}
          {groupBuy.telecom_detail?.plan_info && (
            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
              요금제 : {groupBuy.telecom_detail.plan_info}
            </span>
          )}
        </div>

        {/* 날짜 정보 */}
        <div className="text-sm text-gray-500 mb-1">
          종료일: {new Date(groupBuy.end_time).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div className="text-sm text-gray-500 mb-6">
          • 가입약정 기간은 24개월 입니다
        </div>

        {/* 최고 지원금 박스 */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">현재 최고 지원금</p>
            <p className="text-3xl font-bold text-orange-500">
              {groupBuy.highest_bid_amount ? groupBuy.highest_bid_amount.toLocaleString() : 0}<span className="text-lg">원</span>
            </p>
            {groupBuy.total_bids !== undefined && groupBuy.total_bids > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-1">총 {groupBuy.total_bids}개 입찰</p>
                {!isSeller && (
                  <button
                    onClick={() => setShowBidHistoryModal(true)}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    입찰 내역 보기
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="text-sm text-gray-500 text-center mb-8">
          <p>*카드 제휴할인이나 증정품을 제외한 순수 지원금입니다.</p>
          <p className="mt-1">(공시지원금+추가지원금)</p>
          <p className="mt-1">*앞자리를 제외한 입찰 금액은 비공개 입니다.</p>
        </div>
      </div>

      {/* 공구 정보 섹션 */}
      <div className="border-t border-gray-200">
        {/* 공구 주최자 */}
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500">공구 중심지역</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                {groupBuy.creator?.profile_image ? (
                  <Image
                    src={groupBuy.creator.profile_image}
                    alt={groupBuy.creator?.username || '사용자'}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    {(groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username)?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <span className="font-medium">{groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username || '익명'}</span>
              <span className="text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded">방장</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* 공구 참여인원 */}
        <div className="px-4 py-4 flex items-center justify-between border-t">
          <span className="text-gray-500">공구 참여인원</span>
          <span className="font-medium">{groupBuy.current_participants}명</span>
        </div>
      </div>

      {/* 공구 상태 정보 */}
      <div className="mt-2 px-4 py-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm mb-1">참여인원</p>
            <p className="text-2xl font-bold">{groupBuy.current_participants}/{groupBuy.max_participants}</p>
            <p className="text-xs text-gray-500 mt-1">명</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm mb-1">남은 시간</p>
            <p className="text-2xl font-bold text-red-500">{timeLeftText}</p>
            <p className="text-xs text-gray-500 mt-1">{remainingSlots > 0 ? `${remainingSlots}자리 남음` : '마감'}</p>
          </div>
        </div>
      </div>
      
      {/* 판매자 입찰 정보 */}
      {isSeller && hasBid && myBidAmount && (
        <div className="mx-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-800 flex items-center">
              <Gavel className="w-5 h-5 mr-2" />
              나의 입찰 정보
            </h3>
            {canCancelBid && (
              <button
                onClick={() => setShowCancelBidDialog(true)}
                className="text-sm text-red-600 hover:underline"
              >
                입찰 취소
              </button>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">입찰 금액</span>
              <span className="font-medium">{myBidAmount.toLocaleString()}원</span>
            </div>
            {myBidRank && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">현재 순위</span>
                <span className="font-medium text-blue-600">
                  {myBidRank.rank}위 / {myBidRank.total}개
                </span>
              </div>
            )}
            <button
              onClick={() => setShowBidHistoryModal(true)}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              전체 입찰 내역 보기
            </button>
          </div>
        </div>
      )}

      {/* 버튼 영역 (고정되지 않음) */}
      <div className="px-4 py-6">
        <div className="space-y-3">
          {/* 참여/입찰 버튼 */}
          {renderActionButton()}
          
          {/* 공유하기 버튼 */}
          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full py-3"
          >
            지인과 공유하기
          </Button>
          
          {/* 탈퇴하기 버튼 (참여자만 표시) */}
          {isParticipant && !isBidding && (
            <Button
              onClick={() => setShowWithdrawDialog(true)}
              variant="outline"
              className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
            >
              탈퇴하기
            </Button>
          )}
        </div>
        
        {/* 가이드라인 링크 */}
        <div className="text-center mt-6">
          <button className="text-sm text-blue-600 underline">
            공동 구매 가이드라인
          </button>
          <p className="text-xs text-gray-500 mt-2">
            • 입찰 진행중에는 탈퇴가 제한되니 신중한 참여 부탁드립니다.
          </p>
        </div>
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

      {/* 입찰 모달 */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        groupBuyId={groupBuy.id}
        targetPrice={groupBuy.product_details?.base_price || 0}
        productName={groupBuy.product_details?.name || ''}
        minParticipants={groupBuy.max_participants}
        currentParticipants={groupBuy.current_participants}
        onBidSuccess={handleBidSuccess}
        isClosed={isEnded}
        productCategory={groupBuy.product_details?.category_name}
      />

      {/* 입찰 내역 모달 */}
      <BidHistoryModal
        isOpen={showBidHistoryModal}
        onClose={() => setShowBidHistoryModal(false)}
        groupBuyId={groupBuy.id}
      />

      {/* 입찰권 부족 다이얼로그 */}
      <AlertDialog open={showNoBidTokenDialog} onOpenChange={setShowNoBidTokenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰권 부족</AlertDialogTitle>
            <AlertDialogDescription>
              입찰하려면 입찰권이 필요합니다. 
              입찰권을 구매하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/mypage/seller/bid-tokens')}
            >
              입찰권 구매하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 입찰 취소 다이얼로그 */}
      <AlertDialog open={showCancelBidDialog} onOpenChange={setShowCancelBidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 취소 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 입찰을 취소하시겠습니까?
              취소 후에는 입찰권이 환불되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBid}
              disabled={cancellingBid}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancellingBid ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  취소 중...
                </>
              ) : (
                '입찰 취소'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}