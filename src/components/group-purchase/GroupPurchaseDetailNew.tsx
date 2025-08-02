'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Share2, Heart, Clock, Users, MapPin, Calendar, Star, ChevronRight, Gavel, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import JoinGroupBuyModal from '@/components/groupbuy/JoinGroupBuyModal';
import BidHistoryModal from '@/components/groupbuy/BidHistoryModal';
import BidConfirmModal from '@/components/groupbuy/BidConfirmModal';
import { getRegistrationTypeText, calculateGroupBuyStatus, getStatusText } from '@/lib/groupbuy-utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
import { ConsentStatusCard } from '@/components/group-purchase/ConsentStatusCard';
import { VotingTimer } from '@/components/groupbuy/VotingTimer';
import { BidVotingList } from '@/components/groupbuy/BidVotingList';
import { WinningBidDisplay } from '@/components/groupbuy/WinningBidDisplay';
import { FinalSelectionTimer } from '@/components/final-selection/FinalSelectionTimer';
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
  
  // 디버깅을 위한 로그 제거
  
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
  const [showFinalSelectionModal, setShowFinalSelectionModal] = useState(false);
  
  // 판매자 관련 상태
  const [myBidAmount, setMyBidAmount] = useState<number | null>(null);
  const [myBidId, setMyBidId] = useState<number | null>(null);
  const [canCancelBid, setCanCancelBid] = useState(false);
  const [bidAmount, setBidAmount] = useState<number | string>('');
  const [bidType, setBidType] = useState<'price' | 'support'>('support');  // 초기값은 일단 support로 설정
  const [myBidRank, setMyBidRank] = useState<{ rank: number; total: number } | null>(null);
  const [isMyBidSelected, setIsMyBidSelected] = useState(false);
  const [myBidFinalDecision, setMyBidFinalDecision] = useState<'pending' | 'confirmed' | 'cancelled' | null>(null);
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false);
  const [showNoBidTokenDialog, setShowNoBidTokenDialog] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [selectedBidAmount, setSelectedBidAmount] = useState<number | null>(null);
  const fetchBidInfoRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [topBids, setTopBids] = useState<any[]>([]);
  const [isBidding, setIsBidding] = useState(false);
  const [highestBidAmount, setHighestBidAmount] = useState<number | null>(groupBuy.highest_bid_amount || null);
  const [totalBids, setTotalBids] = useState<number>(groupBuy.total_bids || 0);
  const [showBidConfirmModal, setShowBidConfirmModal] = useState(false);
  const [remainingTokens, setRemainingTokens] = useState<number>(0);
  const [hasUnlimitedSubscription, setHasUnlimitedSubscription] = useState(false);
  const [confirmedBidAmount, setConfirmedBidAmount] = useState<number>(0);
  const [bidTokenInfo, setBidTokenInfo] = useState({
    remaining_tokens: 0,
    has_unlimited_subscription: false
  });

  useEffect(() => {
    setIsKakaoInAppBrowser(/KAKAOTALK/i.test(navigator.userAgent));
  }, []);

  // 카테고리에 따라 입찰 타입 설정
  useEffect(() => {
    const telecom = groupBuy.product_details?.category_name === '휴대폰' || groupBuy.product_details?.category_detail_type === 'telecom';
    setBidType(telecom ? 'support' : 'price');
  }, [groupBuy.product_details]);

  // 실제 상태 계산
  const actualStatus = calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time);
  const isEnded = actualStatus === 'completed' || actualStatus === 'cancelled';
  const isBiddingStatus = actualStatus === 'bidding';
  const isVoting = actualStatus === 'voting';
  const isSellerConfirmation = actualStatus === 'seller_confirmation';
  const isFinalSelection = isVoting || isSellerConfirmation;
  const isCreator = user && (parseInt(user.id) === groupBuy.creator.id || parseInt(user.id) === groupBuy.host_id);
  const isSeller = user?.role === 'seller';
  const isTelecom = groupBuy.product_details?.category_name === '휴대폰' || groupBuy.product_details?.category_detail_type === 'telecom';

  // 금액 마스킹 함수
  const maskAmount = (amount: number): string => {
    const amountStr = amount.toString();
    const length = amountStr.length;
    
    if (length <= 1) {
      return amountStr;
    } else {
      // 첫 자리만 보이고 나머지는 * 표시
      return amountStr[0] + "*".repeat(length - 1);
    }
  };

  // 금액 포맷 함수
  const formatCurrency = (value: number | string): string => {
    if (typeof value === 'string') {
      value = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    }
    return value.toLocaleString();
  };

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

  // fetchBidInfoRef 설정
  useEffect(() => {
    fetchBidInfoRef.current = checkBidStatus;
  }, []);

  // 사용자 참여 상태 확인
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      checkParticipationStatus();
      checkWishStatus();
      if (isSeller) {
        fetchBidTokenInfo();
      }
    }
  }, [isAuthenticated, accessToken, groupBuy.id]);

  // 입찰권 정보 가져오기
  const fetchBidTokenInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bid-tokens/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRemainingTokens(data.single_tokens || 0);
        setHasUnlimitedSubscription(data.unlimited_subscription || false);
        setBidTokenInfo({
          remaining_tokens: data.single_tokens || 0,
          has_unlimited_subscription: data.unlimited_subscription || false
        });
      }
    } catch (error) {
      console.error('입찰권 정보 조회 오류:', error);
    }
  };

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
    // fetchTopBids에서 내 입찰 정보를 확인하므로 별도로 호출할 필요 없음
    if (isSeller) {
      await fetchTopBids();
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

  const fetchTopBids = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/bids/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const bids = await response.json();
        
        // 내 입찰 찾기
        if (user && isSeller) {
          console.log('내 user.id:', user.id, typeof user.id);
          console.log('입찰 목록:', bids.map((bid: any) => ({ 
            id: bid.id, 
            seller: bid.seller, 
            sellerType: typeof bid.seller,
            amount: bid.amount 
          })));
          
          const myBid = bids.find((bid: any) => {
            // seller가 객체인 경우 id 속성을 추출, 그렇지 않으면 직접 사용
            const sellerId = typeof bid.seller === 'object' && bid.seller?.id 
              ? bid.seller.id 
              : (typeof bid.seller === 'string' ? parseInt(bid.seller) : bid.seller);
            const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
            return sellerId === userId;
          });
          
          console.log('내 입찰:', myBid);
          
          if (myBid) {
            setHasBid(true);
            setMyBidAmount(myBid.amount);
            setMyBidId(myBid.id);
            
            // 입찰 선택 상태 확인
            if (myBid.status === 'selected' || myBid.is_selected) {
              setIsMyBidSelected(true);
              setMyBidFinalDecision(myBid.final_decision || 'pending');
              setSelectedBidAmount(myBid.amount);
            }
            
            // 입찰 취소 가능 여부 설정 (입찰 중이고 마감 시간 전)
            const now = new Date();
            const endTime = new Date(groupBuy.end_time);
            const canCancel = groupBuy.status === 'bidding' && now < endTime;
            setCanCancelBid(canCancel);
            
            // 내 입찰 순위 계산
            const sortedForRank = [...bids].sort((a: any, b: any) => b.amount - a.amount);
            const myRank = sortedForRank.findIndex((bid: any) => bid.id === myBid.id) + 1;
            setMyBidRank({
              rank: myRank,
              total: bids.length
            });
          }
        }
        
        const sortedBids = bids.sort((a: any, b: any) => {
          if (bidType === 'price') {
            return a.amount - b.amount;
          } else {
            return b.amount - a.amount;
          }
        }).slice(0, 5);
        setTopBids(sortedBids);
        
        // 최고 입찰금액과 총 입찰 수 업데이트
        setTotalBids(bids.length);
        if (bids.length > 0) {
          const highestBid = Math.max(...bids.map((bid: any) => bid.amount));
          setHighestBidAmount(highestBid);
        }
      }
    } catch (error) {
      console.error('상위 입찰 조회 오류:', error);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchTopBids();
    }
  }, [accessToken, groupBuy.id]);

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setBidAmount('');
      return;
    }
    
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setBidAmount('');
      return;
    }
    
    const numValue = parseInt(numericValue, 10);
    // 999만원 이하로 제한
    if (numValue > 9999999) {
      toast({
        title: '입찰 금액 제한',
        description: '입찰 금액은 999만원을 초과할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    // 입력 중에는 그대로 저장
    setBidAmount(numericValue === '' ? '' : numValue);
  };

  const handleBidClick = async () => {
    if (!bidAmount || bidAmount === '' || (typeof bidAmount === 'number' && bidAmount < 1000)) {
      toast({
        title: '입찰 금액 오류',
        description: '최소 입찰 금액은 1,000원입니다.',
        variant: 'destructive',
      });
      return;
    }

    // 1,000원 단위로 반올림
    const numAmount = typeof bidAmount === 'number' ? bidAmount : parseInt(bidAmount.toString(), 10);
    const roundedAmount = Math.round(numAmount / 1000) * 1000;
    
    // 반올림된 금액이 원래 금액과 다르면 알림
    if (roundedAmount !== numAmount) {
      toast({
        title: '입찰 금액 조정',
        description: `입찰 금액이 ${roundedAmount.toLocaleString()}원으로 조정됩니다.`,
      });
      setBidAmount(roundedAmount);
    }

    // 입찰권/구독권이 없는 경우 바로 구매 화면으로 이동
    if (!hasUnlimitedSubscription && remainingTokens === 0) {
      setShowNoBidTokenDialog(true);
      return;
    }

    // 확인될 입찰 금액 저장
    setConfirmedBidAmount(roundedAmount);

    // 입찰 확인 모달 표시
    setShowBidConfirmModal(true);
  };

  const handleBidConfirm = async () => {
    setShowBidConfirmModal(false);
    setIsBidding(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupbuy: groupBuy.id,
          bid_type: bidType,
          amount: confirmedBidAmount,
          message: '',
          seller: user?.id // 판매자 ID 추가
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHasBid(true);
        setMyBidAmount(confirmedBidAmount);
        setMyBidId(data.id);
        
        toast({
          title: '입찰 완료',
          description: '입찰이 성공적으로 완료되었습니다.',
        });
        
        await checkBidStatus();
        await fetchTopBids();
        router.refresh();
      } else {
        const errorData = await response.json();
        
        if (errorData.detail?.includes('입찰권') || errorData.detail?.includes('사용 가능한 입찰권이 없습니다')) {
          setShowNoBidTokenDialog(true);
        } else {
          toast({
            title: '입찰 실패',
            description: errorData.detail || '입찰 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('입찰 오류:', error);
      toast({
        title: '입찰 오류',
        description: '입찰 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsBidding(false);
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

    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setIsParticipant(true);
    setShowJoinModal(false);
    router.refresh();
  };

  const handleBidSuccess = async () => {
    // 입찰 상태 확인
    await checkBidStatus();
    
    // 그룹 구매 정보 새로고침하여 최고 지원금 업데이트
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/`);
      if (response.ok) {
        const updatedGroupBuy = await response.json();
        // 부모 컴포넌트에서 전달받은 groupBuy가 업데이트되도록 페이지 새로고침
        router.refresh();
      }
    } catch (error) {
      console.error('그룹 구매 정보 새로고침 오류:', error);
    }
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
      // 최종선택중인 공구는 참여한 회원만 최종선택 버튼 표시
      if (isParticipant) {
        return (
          <Button 
            onClick={() => setShowFinalSelectionModal(true)}
            className="w-full py-4 text-base font-medium bg-orange-600 hover:bg-orange-700"
          >
            최종선택하기
          </Button>
        );
      } else {
        // 참여하지 않은 사용자에게는 공구 마감 표시
        return (
          <Button disabled className="w-full py-4 text-base font-medium bg-gray-400">
            공구 마감
          </Button>
        );
      }
    }

    // 판매자는 renderActionButton을 사용하지 않음 (인라인 UI 사용)

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/leave/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
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
        <div className="relative aspect-square w-full md:max-w-md md:mx-auto lg:max-w-lg">
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
            <div className="relative inline-flex items-center group">
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                통신사 : {groupBuy.telecom_detail.telecom_carrier}
                <button className="ml-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </span>
              
              {/* 툴팁 - 통신사별 요금제 링크 */}
              <div className="absolute top-full left-0 mt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
                  <p className="text-xs font-medium text-gray-700 mb-2">통신사별 요금제 알아보기</p>
                  <div className="space-y-1">
                    <a
                      href="https://www.tworld.co.kr/web/product/plan/list"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      SK텔레콤 →
                    </a>
                    <a
                      href="https://product.kt.com/wDic/index.do?CateCode=6002"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      KT →
                    </a>
                    <a
                      href="https://www.lguplus.com/mobile/plan/mplan/plan-all"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      LG유플러스 →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          {groupBuy.telecom_detail?.plan_info && (
            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
              요금제 : {groupBuy.telecom_detail.plan_info}
            </span>
          )}
        </div>

        {/* 날짜 정보 */}
        <div className="text-sm text-gray-500 mb-1">
          공구 등록일: {new Date(groupBuy.start_time).toLocaleString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="text-sm text-gray-500 mb-6">
          • 가입약정 기간은 24개월 입니다
        </div>

        {/* 최고 지원금 박스 */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">현재 최고 지원금</p>
            <p className="text-3xl font-bold text-orange-500">
              <span>{highestBidAmount && highestBidAmount > 0 ? maskAmount(highestBidAmount) : '0'}</span>
              <span className="text-lg">원</span>
            </p>
            {totalBids > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-1">총 {totalBids}개 입찰</p>
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
            <span className="text-gray-500">방장</span>
            <span className="font-medium">{groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username || '익명'}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* 공구 지역 */}
        <div className="px-4 py-4 flex items-center gap-3 border-t">
          <span className="text-gray-500">공구 지역</span>
          <div className="flex flex-wrap gap-1">
            {groupBuy.region_type === 'nationwide' ? (
              <span className="font-medium text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">전국</span>
            ) : groupBuy.regions && groupBuy.regions.length > 0 ? (
              groupBuy.regions.map((region, index) => (
                <span key={index} className="font-medium text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {region.name || ''}
                </span>
              ))
            ) : (
              <span className="font-medium text-sm">지역 정보 없음</span>
            )}
          </div>
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
      {isSeller && (
        <div className="mx-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-800 flex items-center">
              <Gavel className="w-5 h-5 mr-2" />
              입찰 정보
            </h3>
            {hasBid && canCancelBid && (
              <button
                onClick={() => setShowCancelBidDialog(true)}
                className="text-sm text-red-600 hover:underline"
              >
                입찰 취소
              </button>
            )}
          </div>
          <div className="space-y-2">
            {hasBid && myBidAmount ? (
              <>
                <div className="text-sm text-gray-600 mb-1">나의 입찰 정보</div>
                <div className="pl-2">
                  {myBidRank && (
                    <div className="text-sm font-medium text-blue-600 mb-1 flex items-center">
                      <span className="mr-2">{myBidRank.rank}위</span>
                      <span>{myBidAmount.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                아직 입찰하지 않았습니다.
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
        {isSeller && isFinalSelection && isMyBidSelected && myBidFinalDecision === 'pending' ? (
          // 판매자 최종선택 버튼
          <Button 
            onClick={() => setShowFinalSelectionModal(true)}
            className="w-full py-4 text-base font-medium bg-orange-600 hover:bg-orange-700"
          >
            최종선택하기
          </Button>
        ) : isSeller && groupBuy.status !== 'final_selection' && groupBuy.status !== 'voting' && 
         groupBuy.status !== 'seller_confirmation' && groupBuy.status !== 'completed' && 
         groupBuy.status !== 'cancelled' ? (
          // 판매자용 입찰 인터페이스
          <div className="space-y-4">
            {!hasBid && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h3 className="font-medium text-yellow-800 mb-1">판매회원 입찰 모드</h3>
                <p className="text-sm text-yellow-700">입찰에 참여하여 공구 판매 기회를 얻으세요.</p>
              </div>
            )}
            
            {/* 입찰 타입 표시 */}
            {!hasBid && (
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                <div className="text-sm font-medium">입찰 유형:</div>
                <div className="text-sm font-medium px-3 py-1 bg-blue-600 text-white rounded-md">
                  {isTelecom ? '지원금 입찰' : '가격 입찰'}
                </div>
              </div>
            )}
            
            {/* 입찰 현황 */}
            {(topBids.length > 0 || myBidRank) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">현재 입찰 현황</h4>
                
                {myBidRank && hasBid && (
                  <div className="mb-2 py-1 px-2 bg-blue-50 border border-blue-100 rounded">
                    <span className="text-sm font-medium text-blue-700">
                      내 입찰 순위: 총 {myBidRank.total}개 중 {myBidRank.rank}위
                    </span>
                  </div>
                )}
                
                {topBids.length > 0 && (
                  <>
                    <div className="space-y-1">
                      {topBids.map((bid: any, index: number) => {
                        const isMyBid = (() => {
                          const sellerId = typeof bid.seller === 'object' && bid.seller?.id 
                            ? bid.seller.id 
                            : (typeof bid.seller === 'string' ? parseInt(bid.seller) : bid.seller);
                          const userId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
                          return sellerId === userId;
                        })();
                        return (
                          <div key={bid.id} className={`flex text-sm ${isMyBid ? 'font-bold' : ''}`}>
                            <span className={`${isMyBid ? 'text-blue-600' : ''} flex items-center gap-2`}>
                              <span>{index + 1}위</span>
                              {isMyBid && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                  내순위
                                </span>
                              )}
                            </span>
                            <span className={`ml-2 ${isMyBid ? 'text-blue-600' : ''}`}>
                              {isMyBid
                                ? `${bid.amount.toLocaleString()}원`
                                : maskAmount(bid.amount) + '원'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm font-semibold text-blue-800 mt-2 bg-blue-50 p-2 rounded border border-blue-200">❗ 앞자리를 제외한 입찰가는 비공개입니다.</p>
                  </>
                )}
              </div>
            )}
            
            <div className="flex flex-col w-full">
              {/* 입찰 유형별 안내 문구 */}
              {bidType === 'support' && (
                <div className="text-gray-500 text-sm mb-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                  <div>카드 제휴할인이나 증정품을 제외한 순수 현금지원금입니다 (공시지원금+추가지원금)</div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={typeof bidAmount === 'number' ? formatCurrency(bidAmount) : bidAmount}
                    onChange={(e) => handleBidAmountChange(e)}
                    className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-lg"
                    placeholder={`${bidType === 'support' ? '지원금' : '가격'} 입력`}
                    disabled={isEnded || isFinalSelection}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
                </div>
                
                <button
                  onClick={handleBidClick}
                  disabled={isBidding || isEnded || isFinalSelection}
                  className={`whitespace-nowrap py-2 px-4 rounded-lg font-medium ${
                    isEnded || isFinalSelection
                      ? 'bg-gray-200 text-gray-500'
                      : isBidding
                        ? 'bg-gray-400 text-white'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isBidding ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      입찰 중...
                    </span>
                  ) : hasBid && myBidAmount ? (
                    '다시 입찰하기'
                  ) : (
                    '공구 입찰하기'
                  )}
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                <p className="text-sm font-medium text-blue-900 mb-2">💰 입찰 금액은 1,000원 단위로 입력됩니다.</p>
                <p className="text-sm font-semibold text-blue-800 mb-1">❗ 앞자리를 제외한 입찰가는 비공개입니다.</p>
              </div>
            </div>
            
            {/* 입찰 취소 버튼 */}
            {hasBid && canCancelBid && !isEnded && !isFinalSelection && (
              <button
                onClick={() => setShowCancelBidDialog(true)}
                className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
              >
                입찰 취소하기
              </button>
            )}
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">📝 입찰 안내사항</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>• 입찰 시 입찰권 1개가 소모됩니다.</div>
                <div>• 최소 입찰 단위는 1,000원입니다.</div>
                <div>• 입찰 취소는 입찰 마감 시간 이전에만 가능합니다.</div>
                <div>• 중복 입찰 시 기존 입찰금액이 자동으로 수정됩니다.</div>
              </div>
            </div>
            
            {/* 공유하기 버튼 */}
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full py-3"
            >
              지인과 공유하기
            </Button>
          </div>
        ) : (
          // 일반 사용자용 버튼
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
            {isParticipant && !isBiddingStatus && (
              <Button
                onClick={() => setShowWithdrawDialog(true)}
                variant="outline"
                className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
              >
                탈퇴하기
              </Button>
            )}
          </div>
        )}
        
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


      {/* 입찰 내역 모달 */}
      <BidHistoryModal
        isOpen={showBidHistoryModal}
        onClose={() => setShowBidHistoryModal(false)}
        groupBuyId={groupBuy.id}
      />

      {/* 최종선택 모달 */}
      <AlertDialog open={showFinalSelectionModal} onOpenChange={setShowFinalSelectionModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="sr-only">최종선택</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="p-0">
            {groupBuy.voting_end && (
              <FinalSelectionTimer
                groupBuyId={groupBuy.id}
                endTime={groupBuy.voting_end}
                bidAmount={selectedBidAmount || undefined}
                participantCount={groupBuy.current_participants}
                onSelectionMade={() => {
                  setShowFinalSelectionModal(false);
                  // 페이지 새로고침 또는 상태 업데이트
                  router.refresh();
                }}
              />
            )}
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowFinalSelectionModal(false)}>
              닫기
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* 입찰 확인 모달 */}
      <BidConfirmModal
        isOpen={showBidConfirmModal}
        onClose={() => setShowBidConfirmModal(false)}
        onConfirm={handleBidConfirm}
        bidAmount={confirmedBidAmount}
        isRebid={hasBid && myBidAmount !== null}
        loading={isBidding}
        remainingTokens={bidTokenInfo.remaining_tokens}
        hasUnlimitedSubscription={bidTokenInfo.has_unlimited_subscription}
      />
    </div>
  );
}