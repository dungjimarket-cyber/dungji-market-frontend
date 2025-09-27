'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { ArrowLeft, Share2, Clock, Users, MapPin, Calendar, Star, ChevronRight, Gavel, AlertCircle, TrendingUp, Crown, Trophy, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import JoinGroupBuyModal from '@/components/groupbuy/JoinGroupBuyModal';
import BidHistoryModal from '@/components/groupbuy/BidHistoryModal';
import BidConfirmModal from '@/components/groupbuy/BidConfirmModal';
import { getRegistrationTypeText, calculateGroupBuyStatus, getStatusText } from '@/lib/groupbuy-utils';
import { getPlanDisplay } from '@/lib/telecom-utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
import { ConsentStatusCard } from '@/components/group-purchase/ConsentStatusCard';
import { WinningBidDisplay } from '@/components/groupbuy/WinningBidDisplay';
import { FinalSelectionTimer } from '@/components/final-selection/FinalSelectionTimer';
import { SimpleFinalSelectionTimer } from '@/components/final-selection/SimpleFinalSelectionTimer';
import { ContactInfoModal } from '@/components/final-selection/ContactInfoModal';
import { BuyerConfirmationModal } from '@/components/groupbuy/BuyerConfirmationModal';
import { BuyerInfoModal } from '@/components/groupbuy/BuyerInfoModal';
import { EndedGroupBuyAccessControl } from '@/components/groupbuy/EndedGroupBuyAccessControl';
import { SimplifiedGroupBuyButton } from '@/components/groupbuy/SimplifiedGroupBuyButton';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Progress } from '@/components/ui/progress';
import { FinalDecisionModal } from '@/components/groupbuy/FinalDecisionModal';
import { ServiceInfoCards } from '@/components/common/ServiceInfoCards';
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
  final_selection_end?: string;
  seller_selection_end?: string;
  creator_name?: string;
  host_id?: number;
  host_username?: string;
  product_info?: any; // 상품 정보 (custom_values 포함)
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
    telecom_carrier?: string;
    subscription_type_korean?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    subscription_type_korean?: string;
    subscription_type_display?: string;
    plan_info: string;
    contract_period?: string;
  };
  internet_detail?: {
    carrier: string;
    carrier_display: string;
    subscription_type: string;
    subscription_type_display: string;
    speed: string;
    has_tv: boolean;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
  total_bids?: number;
  highest_bid_amount?: number;
  winning_bid_amount?: number;
  winning_bid_amount_masked?: string;
  total_bids_count?: number;
  bid_ranking?: Array<{
    rank: number;
    amount?: number;
    amount_masked?: string;
    is_winner: boolean;
  }>;
  region_type?: string;
  region?: string;
  region_name?: string;
  regions?: Array<{
    id?: number;
    code?: string;
    name: string;
    full_name?: string;
  }>;
}

interface GroupPurchaseDetailProps {
  groupBuy: GroupBuy;
}

export function GroupPurchaseDetailNew({ groupBuy }: GroupPurchaseDetailProps) {
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const { toast } = useToast();
  
  // 프로필 체크 Hook 사용
  const { 
    checkProfile, 
    showProfileModal, 
    setShowProfileModal, 
    missingFields,
    clearCache 
  } = useProfileCheck();
  
  // 디버깅을 위한 로그 제거
  
  const [isKakaoInAppBrowser, setIsKakaoInAppBrowser] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isParticipant, setIsParticipant] = useState<boolean | undefined>(undefined);
  const [isParticipantLoading, setIsParticipantLoading] = useState(true);
  const [hasBid, setHasBid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawingParticipation, setWithdrawingParticipation] = useState(false);
  const [showCancelBidDialog, setShowCancelBidDialog] = useState(false);
  const [cancellingBid, setCancellingBid] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGroupBuy, setDeletingGroupBuy] = useState(false);
  const [hasReceivedContact, setHasReceivedContact] = useState(false);
  const [showFinalSelectionModal, setShowFinalSelectionModal] = useState(false);
  const [myParticipationFinalDecision, setMyParticipationFinalDecision] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const [showFinalSelectionDialog, setShowFinalSelectionDialog] = useState(false);
  const [finalSelectionType, setFinalSelectionType] = useState<'confirm' | 'cancel'>('confirm');
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [showBuyerInfoModal, setShowBuyerInfoModal] = useState(false);
  
  // 판매자 관련 상태
  const [myBidAmount, setMyBidAmount] = useState<number | null>(null);
  const [myBidId, setMyBidId] = useState<number | null>(null);
  const [canCancelBid, setCanCancelBid] = useState(false);
  const [bidAmount, setBidAmount] = useState<number | string>('');
  const [bidType, setBidType] = useState<'price' | 'support'>('support');  // 초기값은 일단 support로 설정
  const [myBidRank, setMyBidRank] = useState<{ rank: number; total: number } | null>(null);
  const [isMyBidSelected, setIsMyBidSelected] = useState(false);
  const [myBidFinalDecision, setMyBidFinalDecision] = useState<'pending' | 'confirmed' | 'cancelled' | null>(null);
  const [myBidInfo, setMyBidInfo] = useState<any>(null); // 서버에서 받은 내 입찰 정보
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false);
  const [showNoBidTokenDialog, setShowNoBidTokenDialog] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [selectedBidAmount, setSelectedBidAmount] = useState<number | null>(null);
  const fetchBidInfoRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [topBids, setTopBids] = useState<any[]>([]);
  const [isBidding, setIsBidding] = useState(false);
  const [highestBidAmount, setHighestBidAmount] = useState<number | null>(groupBuy.highest_bid_amount || null);
  const [totalBids, setTotalBids] = useState<number>(groupBuy.total_bids || 0);
  const [currentParticipants, setCurrentParticipants] = useState<number>(groupBuy.current_participants);
  const [showBidConfirmModal, setShowBidConfirmModal] = useState(false);
  const [remainingTokens, setRemainingTokens] = useState<number>(0);
  const [hasUnlimitedSubscription, setHasUnlimitedSubscription] = useState(false);
  const [confirmedBidAmount, setConfirmedBidAmount] = useState<number>(0);
  const [bidTokenInfo, setBidTokenInfo] = useState({
    remaining_tokens: 0,
    has_unlimited_subscription: false
  });
  
  // 판매자 최종선택 관련 상태
  const [showSellerFinalDecisionModal, setShowSellerFinalDecisionModal] = useState(false);
  const [hasWinningBid, setHasWinningBid] = useState(false);
  const [winningBidInfo, setWinningBidInfo] = useState<any>(null);
  const [groupBuyData, setGroupBuyData] = useState(groupBuy);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  
  // 구매자 확정률 모달 상태
  const [showBuyerConfirmationModal, setShowBuyerConfirmationModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [buyerConfirmationData, setBuyerConfirmationData] = useState<{
    total_participants: number;
    confirmed_count: number;
    confirmation_rate: number;
    pending_count?: number;
    declined_count?: number;
  } | null>(null);

  useEffect(() => {
    setIsKakaoInAppBrowser(/KAKAOTALK/i.test(navigator.userAgent));
  }, []);

  // 판매자 프로필 가져오기
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!accessToken || !isAuthenticated || user?.role !== 'seller') return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/seller-profile/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const profileData = await response.json();
          setSellerProfile(profileData);
        }
      } catch (error) {
        console.error('판매자 프로필 조회 오류:', error);
      }
    };
    
    fetchSellerProfile();
  }, [accessToken, isAuthenticated, user]);

  // 인증된 사용자로 공구 데이터 다시 가져오기
  useEffect(() => {
    const fetchAuthenticatedGroupBuyData = async () => {
      if (!accessToken || !isAuthenticated) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setGroupBuyData(data);
          
          // 내 입찰 정보 설정
          if (data.my_bid_info) {
            setMyBidInfo(data.my_bid_info);
            setMyBidRank({ rank: data.my_bid_info.rank, total: data.my_bid_info.total_bidders });
          }
        }
      } catch (error) {
        console.error('공구 데이터 재조회 오류:', error);
      }
    };

    fetchAuthenticatedGroupBuyData();
  }, [accessToken, isAuthenticated, groupBuy.id]);

  // 카테고리에 따라 입찰 타입 설정
  useEffect(() => {
    const categoryName = groupBuyData.product_details?.category_name;
    const detailType = groupBuyData.product_details?.category_detail_type;
    
    // 휴대폰, 인터넷, 인터넷+TV, 통신 카테고리는 모두 지원금 견적
    const isSupport = categoryName === '휴대폰' || 
                     categoryName === '인터넷' ||
                     categoryName === '인터넷+TV' ||
                     detailType === 'telecom' ||
                     detailType === 'internet';
    
    setBidType(isSupport ? 'support' : 'price');
  }, [groupBuyData.product_details]);

  // 실제 상태 계산
  const actualStatus = calculateGroupBuyStatus(groupBuyData.status, groupBuyData.start_time, groupBuyData.end_time);
  const isEnded = actualStatus === 'completed' || actualStatus === 'cancelled';
  // v3.0: bidding 상태 제거
  // const isBiddingStatus = actualStatus === 'bidding';
  const isSellerConfirmation = actualStatus === 'seller_confirmation';
  const isBuyerFinalSelection = groupBuyData.status === 'final_selection_buyers';
  const isSellerFinalSelection = groupBuyData.status === 'final_selection_seller';
  const isInProgress = groupBuyData.status === 'in_progress';
  const isCompleted = groupBuyData.status === 'completed';
  const isFinalSelection = isBuyerFinalSelection || isSellerFinalSelection || isSellerConfirmation;
  const isCreator = user && (parseInt(user.id) === groupBuy.creator.id || parseInt(user.id) === groupBuy.host_id);
  const isSeller = user?.role === 'seller';
  
  const isTelecom = groupBuy.product_details?.category_name === '휴대폰' || groupBuy.product_details?.category_detail_type === 'telecom';
  const isInternetCategory = groupBuy.product_details?.category_name === '인터넷' || groupBuy.product_details?.category_name === '인터넷+TV';
  const isSupportBidType = isTelecom || isInternetCategory;
  
  
  // 판매자가 낙찰된 입찰을 가지고 있는지 확인
  const checkWinningBidStatus = useCallback(async () => {
    if (!accessToken || !isSeller || !groupBuy.id) return;
    
    console.log('checkWinningBidStatus 시작, groupBuy ID:', groupBuy.id);
    
    try {
      // 현재 공구의 판매자 입찰 정보 조회
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/?groupbuy_id=${groupBuy.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('판매자 입찰 정보:', data);
        
        if (data.results && data.results.length > 0) {
          const myBid = data.results[0];
          // 낙찰 여부 확인
          if (myBid.status === 'selected' || myBid.is_selected) {
            console.log('낙찰 입찰 찾음:', myBid);
            setHasWinningBid(true);
            setWinningBidInfo(myBid);
            setIsMyBidSelected(true);
            setMyBidFinalDecision(myBid.final_decision || 'pending');
          }
          setHasBid(true);
          setMyBidAmount(myBid.amount);
          setMyBidId(myBid.id);
        }
      }
    } catch (error) {
      console.error('낙찰 입찰 확인 오류:', error);
    }
  }, [accessToken, isSeller, groupBuy.id]);
  
  // 판매자의 입찰 정보 조회
  const fetchSellerBidInfo = useCallback(async () => {
    if (!accessToken || !isSeller || !groupBuy.id) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/?groupbuy_id=${groupBuy.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('판매자 입찰 정보:', data);
        
        if (data.results && data.results.length > 0) {
          const myBid = data.results[0];
          setHasBid(true);
          setMyBidAmount(myBid.amount);
          setMyBidId(myBid.id);
          setIsMyBidSelected(myBid.status === 'selected' || myBid.is_selected);
          if (myBid.status === 'selected' || myBid.is_selected) {
            setHasWinningBid(true);
            setWinningBidInfo(myBid);
            setMyBidFinalDecision(myBid.final_decision || 'pending');
          }
        }
      }
    } catch (error) {
      console.error('판매자 입찰 정보 조회 오류:', error);
    }
  }, [accessToken, isSeller, groupBuy.id]);
  
  // 판매자인 경우 입찰 정보 조회
  useEffect(() => {
    if (isSeller && groupBuy.id) {
      fetchSellerBidInfo();
    }
  }, [isSeller, groupBuy.id, fetchSellerBidInfo]);
  
  // 최종선택 기간 종료 확인
  const isBuyerSelectionExpired = groupBuy.final_selection_end ? 
    new Date(groupBuy.final_selection_end) < new Date() : false;
  const isSellerSelectionExpired = groupBuy.seller_selection_end ? 
    new Date(groupBuy.seller_selection_end) < new Date() : false;
  const isFinalSelectionExpired = isBuyerFinalSelection ? isBuyerSelectionExpired : isSellerSelectionExpired;

  // 판매자의 낙찰 여부 확인 - 더 많은 상태에서 필요
  useEffect(() => {
    const sellerNeedsWinningCheck = 
      groupBuyData.status === 'final_selection_seller' || 
      groupBuyData.status === 'final_selection_buyers' || 
      groupBuyData.status === 'in_progress' ||
      groupBuyData.status === 'completed';
    
    if (sellerNeedsWinningCheck && isSeller) {
      console.log('판매자 상태 확인, checkWinningBidStatus 호출, status:', groupBuyData.status);
      checkWinningBidStatus();
    }
  }, [groupBuyData.status, isSeller, checkWinningBidStatus]);

  // 디버깅을 위한 상태 로그
  useEffect(() => {
    if (isSeller && isSellerFinalSelection) {
      console.log('판매자 최종선택 UI 조건:', {
        isSellerFinalSelection,
        isFinalSelectionExpired,
        hasWinningBid,
        isMyBidSelected,
        myBidFinalDecision,
        groupBuyStatus: groupBuy.status
      });
    }
  }, [isSeller, isSellerFinalSelection, isFinalSelectionExpired, hasWinningBid, isMyBidSelected, myBidFinalDecision, groupBuy.status]);

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


  // fetchBidInfoRef 설정
  useEffect(() => {
    fetchBidInfoRef.current = checkBidStatus;
  }, []);

  // 사용자 참여 상태 확인
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      checkParticipationStatus();
      if (isSeller) {
        fetchBidTokenInfo();
      }
      // 최종선택 관련 상태인 경우 최종선택 정보 확인
      // completed, in_progress 상태에서도 최종선택 정보가 필요함
      const needsFinalDecisionStatus = 
        isBuyerFinalSelection || 
        isSellerFinalSelection || 
        groupBuyData.status === 'in_progress' || 
        groupBuyData.status === 'completed';
      
      if (needsFinalDecisionStatus) {
        fetchFinalDecisionStatus();
      }
    }
  }, [isAuthenticated, accessToken, groupBuy.id, isBuyerFinalSelection, isSellerFinalSelection, groupBuyData.status]);

  // 견적이용권 정보 가져오기
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
      console.error('견적이용권 정보 조회 오류:', error);
    }
  };

  const checkParticipationStatus = async () => {
    setIsParticipantLoading(true);
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

        // 최종선택 상태 설정
        if (participation && participation.final_decision) {
          setMyParticipationFinalDecision(participation.final_decision);
        }
      } else {
        setIsParticipant(false);
      }
    } catch (error) {
      console.error('참여 상태 확인 오류:', error);
      setIsParticipant(false);
    } finally {
      setIsParticipantLoading(false);
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

  const fetchFinalDecisionStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/decision-status/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('최종선택 상태:', data);
        
        if (data.role === 'buyer') {
          setMyParticipationFinalDecision(data.decision || 'pending');
        } else if (data.role === 'seller') {
          setMyBidFinalDecision(data.decision || 'pending');
        }
      }
    } catch (error) {
      console.error('최종선택 상태 확인 오류:', error);
    }
  };


  const fetchTopBids = async () => {
    try {
      // 인증 헤더를 조건부로 추가
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/bids/`, {
        headers
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
            
            // 입찰 취소 가능 여부 설정 (v3.0: 모집중 또는 입찰중이고 마감 시간 전)
            const now = new Date();
            const endTime = new Date(groupBuy.end_time);
            const canCancel = groupBuyData.status === 'recruiting' && now < endTime;
            setCanCancelBid(canCancel);
            
            // 내 견적 순위 계산 (카테고리에 따라 정렬)
            const sortedForRank = [...bids].sort((a: any, b: any) => {
              // 휴대폰/인터넷/인터넷+TV/통신 카테고리는 항상 지원금(높은 순)으로 정렬
              const categoryName = groupBuyData.product_details?.category_name;
              const detailType = groupBuyData.product_details?.category_detail_type;
              const isSupport = categoryName === '휴대폰' || 
                               categoryName === '인터넷' ||
                               categoryName === '인터넷+TV' ||
                               detailType === 'telecom' ||
                               detailType === 'internet';
              
              if (isSupport || bidType === 'support') {
                return b.amount - a.amount; // 지원금: 높은 금액이 1위
              } else {
                return a.amount - b.amount; // 가격: 낮은 금액이 1위
              }
            });
            const myRank = sortedForRank.findIndex((bid: any) => bid.id === myBid.id) + 1;
            setMyBidRank({
              rank: myRank,
              total: bids.length
            });
          }
        }
        
        // 정렬: 지원금은 높은 순, 가격은 낮은 순
        const sortedBids = bids.sort((a: any, b: any) => {
          // 휴대폰/인터넷/인터넷+TV/통신 카테고리는 항상 지원금(높은 순)으로 정렬
          const categoryName = groupBuyData.product_details?.category_name;
          const detailType = groupBuyData.product_details?.category_detail_type;
          const isSupport = categoryName === '휴대폰' || 
                           categoryName === '인터넷' ||
                           categoryName === '인터넷+TV' ||
                           detailType === 'telecom' ||
                           detailType === 'internet';
          
          if (isSupport || bidType === 'support') {
            return b.amount - a.amount; // 지원금: 높은 금액이 1위
          } else {
            return a.amount - b.amount; // 가격: 낮은 금액이 1위
          }
        });
        
        // 전체 순위를 먼저 매긴 후 상위 5개만 추출
        const bidsWithRank = sortedBids.map((bid: any, index: number) => ({
          ...bid,
          actualRank: index + 1
        }));
        setTopBids(bidsWithRank.slice(0, 5));
        
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
    // 인증 여부와 관계없이 입찰 정보를 가져옴
    fetchTopBids();
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
        title: '견적 금액 제한',
        description: '견적 금액은 999만원을 초과할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    // 입력 중에는 그대로 저장
    setBidAmount(numericValue === '' ? '' : numValue);
  };

  const handleBidClick = async () => {
    // 패널티 체크 먼저 수행
    console.log('🔴 GroupPurchaseDetailNew - Bid Penalty check');
    console.log('🔴 User:', user);
    console.log('🔴 Penalty info:', user?.penalty_info);
    console.log('🔴 Is active:', user?.penalty_info?.is_active);
    
    if (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) {
      console.log('🔴 패널티 활성 상태 감지! 패널티 모달 표시');
      setShowPenaltyModal(true);
      return;
    }

    // 프로필 체크 수행
    console.log('[GroupPurchaseDetailNew] 견적 제안하기 버튼 클릭, 프로필 체크 시작');
    const isProfileComplete = await checkProfile();
    console.log('[GroupPurchaseDetailNew] 프로필 체크 결과:', isProfileComplete);
    
    if (!isProfileComplete) {
      console.log('[GroupPurchaseDetailNew] 프로필 미완성, 모달 표시');
      setShowProfileModal(true);
      return;
    }

    if (!bidAmount || bidAmount === '' || (typeof bidAmount === 'number' && bidAmount < 1000)) {
      toast({
        title: '견적 금액 오류',
        description: '최소 견적 금액은 1,000원입니다.',
        variant: 'destructive',
      });
      return;
    }

    // 판매회원 필수 정보 완성도 체크
    if (user?.role === 'seller') {
      const missingFields = [];
      // sellerProfile이 있으면 사용, 없으면 user 객체 사용
      const sellerUser = sellerProfile || user;
      console.log('[GroupPurchaseDetailNew] 판매자 정보 체크, sellerProfile:', sellerProfile, 'user:', user);
      
      // 필수 정보 체크 - API 응답 필드명과 호환되도록 수정
      if (!sellerUser.nickname || (typeof sellerUser.nickname === 'string' && sellerUser.nickname.trim() === '')) {
        missingFields.push('닉네임 또는 상호명');
      }
      if (!sellerUser.address_region && !sellerUser.addressRegion) {
        missingFields.push('사업장주소지/영업활동지역');
      }
      // representativeName, representative_name, first_name 모두 체크
      const hasRepName = sellerUser.representativeName || sellerUser.representative_name || sellerUser.first_name;
      if (!hasRepName || (typeof hasRepName === 'string' && hasRepName.trim() === '')) {
        missingFields.push('사업자등록증상 대표자명');
      }
      // business_number와 businessNumber 모두 체크
      const hasBizNumber = sellerUser.business_number || sellerUser.businessNumber;
      if (!hasBizNumber || (typeof hasBizNumber === 'string' && hasBizNumber.trim() === '')) {
        missingFields.push('사업자등록번호');
      }
      // is_business_verified와 businessVerified 모두 체크
      const isVerified = sellerUser.is_business_verified || sellerUser.businessVerified;
      if (hasBizNumber && !isVerified) {
        missingFields.push('사업자등록번호 인증');
      }
      
      if (missingFields.length > 0) {
        toast({
          title: '필수 정보 입력 필요',
          description: `견적 제안을 위해 ${missingFields[0]} 등의 필수 정보를 완료해주세요.`,
          variant: 'destructive',
        });
        
        // 내정보 페이지로 이동
        router.push('/mypage/seller/settings');
        return;
      }
    }

    // 1,000원 단위로 반올림
    const numAmount = typeof bidAmount === 'number' ? bidAmount : parseInt(bidAmount.toString(), 10);
    const roundedAmount = Math.round(numAmount / 1000) * 1000;
    
    // 반올림된 금액이 원래 금액과 다르면 알림
    if (roundedAmount !== numAmount) {
      toast({
        title: '견적 금액 자동 조정',
        description: `견적 금액이 ${roundedAmount.toLocaleString()}원으로 조정됩니다.`,
      });
      setBidAmount(roundedAmount);
    }

    // 견적이용권/구독권이 없는 경우 바로 구매 화면으로 이동
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
    
    // 확인 버튼 누르는 시점에 타이머 재확인
    const now = new Date();
    const endTime = new Date(groupBuy.end_time);
    
    if (now > endTime) {
      toast({
        title: '공구가 마감되었습니다',
        description: '마감된 공구에는 견적을 제안할 수 없습니다.',
        variant: 'destructive',
      });
      // 3초 후 목록으로 이동
      setTimeout(() => {
        router.push('/group-purchases');
      }, 3000);
      return;
    }
    
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
          title: '제출 완료',
          description: '견적 제안이 완료되었습니다.',
        });
        
        // 견적이용권 정보 실시간 업데이트
        await fetchBidTokenInfo();
        await checkBidStatus();
        await fetchTopBids();
        router.refresh();
      } else {
        const errorData = await response.json();
        
        if (errorData.detail?.includes('입찰권') || errorData.detail?.includes('견적이용권') || errorData.detail?.includes('사용 가능한 입찰권이 없습니다') || errorData.detail?.includes('사용 가능한 견적이용권이 없습니다')) {
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

    // 패널티 체크 먼저 수행
    console.log('🔴 GroupPurchaseDetailNew - Penalty check');
    console.log('🔴 User:', user);
    console.log('🔴 Penalty info:', user?.penalty_info);
    console.log('🔴 Is active:', user?.penalty_info?.is_active);
    
    if (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) {
      console.log('🔴 패널티 활성 상태 감지! 패널티 모달 표시');
      setShowPenaltyModal(true);
      return;
    }

    // 프로필 체크 수행
    console.log('[GroupPurchaseDetailNew] 같이 견적받기 버튼 클릭, 프로필 체크 시작');
    const isProfileComplete = await checkProfile();
    console.log('[GroupPurchaseDetailNew] 프로필 체크 결과:', isProfileComplete);
    
    if (!isProfileComplete) {
      console.log('[GroupPurchaseDetailNew] 프로필 미완성, 모달 표시');
      setShowProfileModal(true);
      return;
    }

    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setIsParticipant(true);
    setShowJoinModal(false);
    // 실시간으로 참여인원 +1 업데이트
    setCurrentParticipants(prev => prev + 1);
    router.refresh();
  };

  const handleFinalSelection = (type: 'confirm' | 'cancel') => {
    setFinalSelectionType(type);
    setShowFinalSelectionDialog(true);
  };

  const processFinalSelection = async () => {
    try {
      const endpoint = isSeller 
        ? `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/seller-decision/`
        : `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-decision/`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: finalSelectionType === 'confirm' ? 'confirmed' : 'cancelled'
        })
      });

      if (response.ok) {
        toast({
          title: finalSelectionType === 'confirm' 
            ? (isSeller ? '판매를 확정했습니다' : '구매를 확정했습니다')
            : (isSeller ? '판매를 포기했습니다' : '구매를 포기했습니다'),
          description: finalSelectionType === 'confirm'
            ? (isSeller ? '구매자 정보를 확인할 수 있습니다' : '판매자 정보를 확인할 수 있습니다')
            : '마이페이지에서 취소된 공구를 확인할 수 있습니다'
        });
        
        // 상태 업데이트
        if (isSeller) {
          setMyBidFinalDecision(finalSelectionType === 'confirm' ? 'confirmed' : 'cancelled');
        } else {
          setMyParticipationFinalDecision(finalSelectionType === 'confirm' ? 'confirmed' : 'cancelled');
        }
        
        router.refresh();
      } else {
        throw new Error('최종선택 처리 중 오류가 발생했습니다');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '최종선택 처리 중 문제가 발생했습니다'
      });
    } finally {
      setShowFinalSelectionDialog(false);
    }
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

    // recruiting 또는 bidding 상태가 아니면 참여 불가
    if (!['recruiting', 'bidding'].includes(groupBuy.status)) {
      return (
        <Button disabled className="w-full py-4 text-base font-medium bg-gray-400">
          참여 불가
        </Button>
      );
    }

    return (
      <Button 
        onClick={handleJoinClick}
        className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
      >
        같이 견적받기
      </Button>
    );
  };

  const handleWithdrawParticipation = async () => {
    setWithdrawingParticipation(true);
    
    try {
      // 만든 사람인 경우 공구 삭제
      if (isCreator) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast({
            title: '공구 삭제 완료',
            description: '공구가 삭제되었습니다.',
          });
          // 삭제 후 공구 리스트 페이지로 이동
          router.push('/group-purchases');
        } else {
          const data = await response.json();
          toast({
            title: '공구 삭제 실패',
            description: data.detail || '공구를 삭제할 수 없습니다.',
            variant: 'destructive',
          });
        }
      } else {
        // 일반 참여자인 경우 나가기
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/leave/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsParticipant(false);
          // 실시간으로 참여인원 -1 업데이트
          setCurrentParticipants(prev => Math.max(0, prev - 1));
          toast({
            title: '공구 나가기 완료',
            description: '공구에서 나왔습니다.',
          });
          // 나가기 후 공구 리스트 페이지로 이동
          router.push('/group-purchases');
        } else {
          const data = await response.json();
          toast({
            title: '나가기 실패',
            description: data.error || '공구에서 나갈 수 없습니다.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('나가기 오류:', error);
      toast({
        title: '오류 발생',
        description: '공구 나가기 중 오류가 발생했습니다.',
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
  const remainingSlots = groupBuy.max_participants - currentParticipants;

  // 종료된 공구인지 확인
  const isEndedGroupBuy = [
    'final_selection_buyers',
    'final_selection_seller',
    'in_progress',
    'completed',
    'cancelled'
  ].includes(groupBuyData.status);

  // 권한 체크가 필요한 상태에서 로딩 중일 때 로딩 표시
  if (isEndedGroupBuy && isAuthenticated && isParticipantLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <EndedGroupBuyAccessControl
      status={groupBuyData.status}
      isAuthenticated={!!user}
      isParticipant={isParticipant === true || hasBid}
      hasWinningBid={hasWinningBid}
    >
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

      {/* 메인 컨텐츠 래퍼 - PC에서 좌우 분할 */}
      <div className="lg:flex lg:gap-8 lg:max-w-7xl lg:mx-auto lg:px-6">
        {/* 왼쪽 영역 - 상품 정보 (PC: 50%, 모바일: 100%) */}
        <div className="lg:w-[50%] lg:border-r lg:border-gray-200 lg:pr-8">
          {/* 상품 정보 */}
          <div className="px-4 lg:px-0 py-6">
        <h2 className="text-2xl font-bold mb-3">
          {groupBuy.product_details?.name || '상품명 없음'}
        </h2>
        
        {/* 상품명 하단 구분선 */}
        <div className="border-b border-gray-100 mb-4"></div>
        
        {/* 공구 지역 - 최상단 이동 */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500">공구 지역</span>
          <div className="flex flex-wrap gap-1">
            {groupBuy.region_type === 'nationwide' ? (
              <span className="inline-flex items-center px-2.5 md:px-1.5 py-0.5 rounded-full text-sm md:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                전국
              </span>
            ) : groupBuy.regions && groupBuy.regions.length > 0 ? (
              groupBuy.regions.map(region => {
                let displayName = region.name || '';
                displayName = displayName
                  .replace('특별시', '')
                  .replace('광역시', '')
                  .replace('특별자치시', '')
                  .replace('특별자치도', '');
                
                return (
                  <span key={region.id || region.code || region.name} className="inline-flex items-center px-2.5 md:px-1.5 py-0.5 rounded-full text-sm md:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {displayName}
                  </span>
                );
              })
            ) : (
              <span className="font-medium text-sm">지역 정보 없음</span>
            )}
          </div>
        </div>
        
        {/* 참여 상태 표시 - 본인이 참여중인 경우에만 */}
        {isParticipant && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <span className="text-sm">✨</span>
              <span className="text-red-500 text-sm font-medium">참여중</span>
            </div>
          </div>
        )}

        {/* 구분선 */}
        <div className="border-b border-gray-100 mb-4"></div>
        
        {/* 가격 - 인터넷/인터넷+TV 카테고리가 아닌 경우에만 표시 */}
        {groupBuy.product_details?.category_name !== '인터넷' &&
         groupBuy.product_details?.category_name !== '인터넷+TV' && (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-sm text-gray-500">출고가</span>
            <span className="text-lg font-bold">￦{groupBuy.product_details?.base_price?.toLocaleString() || '0'}원~</span>
          </div>
        )}

        {/* 통신사, 가입유형, 희망요금제/속도 정보 - 새로운 카드 디자인 */}
        <div className="mb-4">
          {/* 휴대폰 상품 정보 */}
          {groupBuy.product_info?.category_detail_type === 'telecom' && groupBuy.telecom_detail && (
            <>
              <ServiceInfoCards
                category={groupBuy.product_details?.category_name || '휴대폰'}
                carrier={groupBuy.telecom_detail.telecom_carrier}
                subscriptionType={groupBuy.telecom_detail.subscription_type_display ||
                                 groupBuy.telecom_detail.subscription_type_korean ||
                                 groupBuy.telecom_detail.subscription_type}
                planInfo={groupBuy.telecom_detail.plan_info ? getPlanDisplay(groupBuy.telecom_detail.plan_info) : undefined}
                variant="detail"
              />

              {/* 9-10만원대 요금제 프리미엄 안내 */}
              {(groupBuy.telecom_detail.plan_info === '5G_special' ||
                groupBuy.telecom_detail.plan_info === '5G_platinum' ||
                groupBuy.telecom_detail.plan_info === '9만원대' ||
                (groupBuy.telecom_detail.plan_info && groupBuy.telecom_detail.plan_info.includes('10만'))) && (
                <div className="mt-2 p-2.5 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-blue-800">
                        최고지원금 도전
                      </p>
                      <p className="text-gray-700">차원이 다른 비교견적 가능</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <Clock className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-gray-600">
                      가입유형별 4~6개월 가입요금제 필수유지 조건
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* 인터넷/TV 상품 정보 */}
          {(groupBuy.product_info?.category_detail_type === 'internet' || 
            groupBuy.product_info?.category_detail_type === 'internet_tv') && 
           groupBuy.internet_detail && (
            <ServiceInfoCards
              category={groupBuy.product_info?.category_detail_type === 'internet_tv' ? '인터넷+TV' : '인터넷'}
              carrier={groupBuy.internet_detail.carrier_display || groupBuy.internet_detail.carrier}
              subscriptionType={groupBuy.internet_detail.subscription_type_display}
              speed={groupBuy.internet_detail.speed}
              hasTV={groupBuy.internet_detail.has_tv}
              variant="detail"
            />
          )}
        </div>

        {/* 통신사별 요금제 확인 링크 - PC/모바일 공통 세련된 디자인 */}
        {(groupBuy.product_details?.category_name === '휴대폰' ||
          groupBuy.product_details?.category_name === '인터넷' ||
          groupBuy.product_details?.category_name === '인터넷+TV') && (
          <div className="mt-4 mb-4">
            <div className="group relative inline-block">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow">
                <span className="text-sm font-medium text-blue-700">
                  {groupBuy.product_details?.category_name === '휴대폰' ? '📱' : '🌐'}
                  통신사별 요금제 확인하기
                </span>
                <svg className="w-4 h-4 text-blue-600 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="flex flex-col">
                  {groupBuy.product_details?.category_name === '휴대폰' ? (
                    <>
                      <a
                        href="https://www.tworld.co.kr/web/product/plan/list"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-lg transition-all duration-200 group/item"
                        title="SKT 요금제"
                      >
                        <img src="/logos/skt.png" alt="SKT" className="h-6 w-auto group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm text-gray-600 group-hover/item:text-gray-900">요금제 보기</span>
                      </a>
                      <a
                        href="https://product.kt.com/wDic/index.do?CateCode=6002"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-lg transition-all duration-200 group/item"
                        title="KT 요금제"
                      >
                        <img src="/logos/kt.png" alt="KT" className="h-6 w-auto group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm text-gray-600 group-hover/item:text-gray-900">요금제 보기</span>
                      </a>
                      <a
                        href="https://www.lguplus.com/mobile/plan/mplan/plan-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-lg transition-all duration-200 group/item"
                        title="LG U+ 요금제"
                      >
                        <img src="/logos/lgu.png" alt="LG U+" className="h-6 w-auto group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm text-gray-600 group-hover/item:text-gray-900">요금제 보기</span>
                      </a>
                    </>
                  ) : (
                    <>
                      <a
                        href="https://www.bworld.co.kr/product/internet/charge.do?menu_id=P02010000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-lg transition-all duration-200 group/item"
                        title="SK브로드밴드"
                      >
                        <img src="/logos/sk-broadband.png" alt="SK브로드밴드" className="h-6 w-auto group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm text-gray-600 group-hover/item:text-gray-900">요금제 보기</span>
                      </a>
                      <a
                        href="https://product.kt.com/wDic/productDetail.do?ItemCode=1505&CateCode=6005&filter_code=118&option_code=170&pageSize=10"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-lg transition-all duration-200 group/item"
                        title="KT 인터넷"
                      >
                        <img src="/logos/kt.png" alt="KT" className="h-6 w-auto group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm text-gray-600 group-hover/item:text-gray-900">요금제 보기</span>
                      </a>
                      <a
                        href="https://www.lguplus.com/internet/plan?tab=IN&subtab=all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-lg transition-all duration-200 group/item"
                        title="LG유플러스"
                      >
                        <img src="/logos/lgu.png" alt="LG U+" className="h-6 w-auto group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm text-gray-600 group-hover/item:text-gray-900">요금제 보기</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 날짜 정보 */}
        <div className="text-sm text-gray-500 mb-1">
          공구 등록일: {new Date(groupBuy.start_time).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            // hour: '2-digit',
            // minute: '2-digit'
          })}
        </div>

        {/* 중요 안내사항 - PC에서만 표시 */}
        <div className="hidden lg:block mb-6">
          {(groupBuy.product_details?.category_name === '휴대폰' ||
            groupBuy.product_details?.category_name === '인터넷' ||
            groupBuy.product_details?.category_name === '인터넷+TV') && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                ⚠️ 중요 안내사항
              </div>
              {groupBuy.product_details?.category_name === '휴대폰' ? (
                <>
                  <div className="text-sm text-gray-500">
                    • 기존 기기의 남은 할부금과 위약금은 본인 부담입니다.
                  </div>
                  <div className="text-sm text-gray-500">
                    • 자세한 내용은 통신사 고객센터 또는 앱을 통해 확인 가능합니다.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500">
                    • 기존 서비스의 위약금은 본인 부담입니다.
                  </div>
                  <div className="text-sm text-gray-500">
                    • 설치비, 철거비 등 추가 비용이 발생할 수 있습니다.
                  </div>
                  <div className="text-sm text-gray-500">
                    • 자세한 내용은 통신사 고객센터 또는 앱을 통해 확인 가능합니다.
                  </div>
                </>
              )}
              <div className="text-sm text-gray-500 mt-4">
                • 가입약정 기간은 {(groupBuy.product_details?.category_name === '인터넷' || groupBuy.product_details?.category_name === '인터넷+TV') ? '36개월' : '24개월'} 입니다
              </div>
            </div>
          )}
        </div>

        {/* 최종선택 타이머 - 공구 상태 정보 섹션으로 통합 이동 */}
        
        {/* 판매자 최종선택 UI */}
        {isSeller && isSellerFinalSelection && hasWinningBid && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">판매자 최종선택</h3>
              <span className="text-sm text-yellow-700">최종선택 대기중</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              구매자가 모두 최종선택을 완료했습니다. 판매확정 또는 판매포기를 선택해주세요.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowSellerFinalDecisionModal(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                최종선택 하기
              </Button>
            </div>
            {winningBidInfo?.final_selection_end && (
              <div className="mt-3 text-xs text-gray-500">
                마감 시간: {new Date(winningBidInfo.final_selection_end).toLocaleString('ko-KR')}
              </div>
            )}
          </div>
        )}

          </div>

        {/* 최고 지원금/최종 낙찰 지원금 박스 - 하단으로 이동됨 */}
        {false && (isFinalSelection || groupBuyData.status === 'completed' || groupBuyData.status === 'in_progress' || groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' ? (
          // 최종선택 상태일 때 낙찰 정보 표시
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 mb-6 border border-orange-200 shadow-md">
            <div className="text-center">
              
              {/* 구매자 최종선택 단계부터는 중앙에 "견적이 최종 선정되었습니다" 문구 추가 - 판매자와 참여자만 표시 */}
              {(groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' || groupBuyData.status === 'in_progress' || groupBuyData.status === 'completed') && (isParticipant || isSeller) && (
                <div className="mb-4">
                  <p className="text-lg sm:text-xl font-bold text-center text-green-700 mb-2 whitespace-nowrap">
                    <span className="inline-block">🎉</span>
                    <span className="inline-block mx-1">
                      {isSeller && (hasWinningBid || isMyBidSelected || myBidInfo?.status === 'won') ? '공구에 최종 선정되셨습니다!' : '견적이 최종 선정되었습니다!'}
                    </span>
                    <span className="inline-block">🎉</span>
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-orange-500" />
                <p className="text-xl font-bold text-gray-800">
                  최종 지원금
                </p>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-orange-600 mb-1">
                {/* 최종선택 단계 이후부터는 참여자와 판매회원에게 정상 금액 표시, 미참여자는 마스킹 */}
                {((groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' || groupBuyData.status === 'in_progress' || groupBuyData.status === 'completed') && (isParticipant || isSeller)) || (isSeller && hasWinningBid) ? (
                  <>
                    <span>{
                      groupBuyData.winning_bid_amount?.toLocaleString() || 
                      (groupBuyData.bid_ranking?.[0]?.amount ? groupBuyData.bid_ranking?.[0]?.amount?.toLocaleString() : '0')
                    }원</span>
                  </>
                ) : (
                  <span>{groupBuyData.winning_bid_amount_masked || '***,***원'}</span>
                )}
              </p>
              <div className="mt-4 space-y-3">
                {/* 견적 내역 보기 버튼과 구매자 확정률 버튼을 나란히 배치 */}
                {(groupBuyData.status !== 'recruiting' && groupBuyData.status !== 'bidding') && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <Button
                      onClick={() => setShowBidHistoryModal(true)}
                      variant="outline"
                      size="default"
                      className="px-6"
                    >
                      견적 내역 보기
                    </Button>
                    
                    {/* 낙찰된 판매자에게 구매자 확정률 버튼 표시 - 입찰내역보기 우측에 나란히 배치 */}
                    {isSeller && hasWinningBid && (groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller') && (
                      <Button
                        onClick={async () => {
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-confirmation-stats/`, {
                              headers: {
                                'Authorization': `Bearer ${accessToken}`,
                              }
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setBuyerConfirmationData(data);
                              setShowBuyerConfirmationModal(true);
                            }
                          } catch (error) {
                            console.error('구매자 확정률 조회 실패:', error);
                            toast({
                              title: '오류',
                              description: '구매자 확정률을 조회할 수 없습니다.',
                              variant: 'destructive'
                            });
                          }
                        }}
                        variant="outline"
                        size="default"
                        className="px-6"
                      >
                        구매자확정률 확인하기
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // 진행중인 상태일 때 기존 표시
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">현재 최고 지원금</p>
              <p className="text-3xl font-bold text-black">
                {(highestBidAmount ?? 0) > 0 ? (
                  <span>{maskAmount(highestBidAmount!)}원</span>
                ) : (
                  <span className="text-lg text-gray-600">견적 제안을 기다리고 있습니다😊</span>
                )}
              </p>
              {totalBids > 0 && (
                <>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    {!isSeller && (
                      <button
                        onClick={() => setShowBidHistoryModal(true)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        견적 내역 보기
                      </button>
                    )}
                    {/* 낙찰된 판매자에게 구매자 확정률 버튼 표시 */}
                    {isSeller && hasWinningBid && (groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller') && (
                      <>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-confirmation-stats/`, {
                                headers: {
                                  'Authorization': `Bearer ${accessToken}`,
                                }
                              });
                              const data = await res.json();
                              setBuyerConfirmationData(data);
                              setShowBuyerConfirmationModal(true);
                            } catch (error) {
                              console.error('Error fetching buyer confirmation stats:', error);
                            }
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          구매자확정률 확인하기
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

          {/* 할부금 및 위약금 안내사항 - 통신 카테고리(휴대폰)일 때만 표시 - 하단으로 이동됨 */}
          {false && ((groupBuy.product_details?.category_name === 'telecom' || 
        groupBuy.product_details?.category_name === '휴대폰') && (
        <div className="mx-4 mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-800 mb-2">중요 안내사항</h3>
              <div className="space-y-3 text-sm text-amber-700">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
                  <div className="text-left leading-relaxed">
                    <p className="break-keep">기존 사용하시던 기기의 남은 할부금과 약정기간 이전 해지시 위약금은 본인 부담입니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
                  <div className="text-left leading-relaxed">
                    <p className="break-keep">자세한 내용은 통신사 고객센터 또는 앱을 통해 확인 가능합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          ))}

          {/* 인터넷 관련 안내사항 - 인터넷 카테고리일 때만 표시 - 하단으로 이동됨 */}
      {false && ((groupBuy.product_details?.category_name === '인터넷' || 
        groupBuy.product_details?.category_name === '인터넷+TV') && (
        <div className="mx-4 mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-800 mb-2">⚠️ 중요 안내사항</h3>
              <div className="space-y-3 text-sm text-amber-700">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
                  <div className="text-left leading-relaxed">
                    <p className="break-keep">기존 사용 중인 인터넷 또는 TV 서비스의 약정기간 이전 해지 시 위약금은 본인 부담입니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
                  <div className="text-left leading-relaxed">
                    <p className="break-keep">설치비, 철거비, 이전설치비 등의 추가 비용이 발생할 수 있습니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
                  <div className="text-left leading-relaxed">
                    <p className="break-keep">자세한 내용은 통신사 고객센터 또는 앱을 통해 확인 가능합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          ))}
        </div>
        {/* 왼쪽 영역 끝 */}

        {/* 오른쪽 영역 - 참여 정보 (PC: 50%, 모바일: 100%) */}
        <div className="lg:w-[50%] lg:sticky lg:top-20 lg:h-fit">
          {/* 모바일에서는 하단 고정, PC에서는 오른쪽 사이드바 */}
          <div className="mt-6 lg:mt-0 px-4 lg:px-0">
            <div className="bg-white lg:rounded-lg lg:p-6">
              {/* 참여인원 카드 */}
              <div className="bg-gray-50 lg:bg-white rounded-lg p-3 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-500 text-xs">참여인원</p>
                  <p className="text-xs text-gray-500">
                    {remainingSlots > 0 ? `${remainingSlots}자리 남음` : '마감'}
                  </p>
                </div>
                <p className="text-xl font-bold text-center">
                  {currentParticipants}/{groupBuy.max_participants}
                  <span className="text-xs text-gray-500 ml-1">명</span>
                </p>
                {/* 참여 진행률 바 */}
                <div className="mt-2">
                  <Progress
                    value={(currentParticipants / groupBuy.max_participants) * 100}
                    className="h-1.5"
                  />
                </div>
              </div>


              {/* 시간 정보 카드 */}
              <div className="bg-gray-50 lg:bg-white rounded-lg p-3">
            {/* 상태별 타이머 표시 */}
            {groupBuyData.status === 'recruiting' && (
              <>
                <p className="text-gray-500 text-sm mb-2 text-center">공구 마감까지</p>
                <CountdownTimer 
                  endTime={groupBuy.end_time}
                  format="compact"
                  showLabel={false}
                  urgent={60}
                  className="text-xl font-bold text-center"
                />
                {/* 시간 진행률 바 */}
                <div className="mt-3">
                  <Progress 
                    value={(() => {
                      const now = new Date().getTime();
                      const start = new Date(groupBuy.start_time).getTime();
                      const end = new Date(groupBuy.end_time).getTime();
                      const total = end - start;
                      const remaining = end - now;
                      // 남은 시간 비율 계산 (100%에서 시작해서 0%로 감소)
                      return Math.min(100, Math.max(0, (remaining / total) * 100));
                    })()}
                    className="h-2"
                  />
                </div>
              </>
            )}
            
            {groupBuyData.status === 'final_selection_buyers' && groupBuy.final_selection_end && (
              <>
                <p className="text-gray-500 text-sm mb-2 text-center">구매자 최종선택 마감까지</p>
                <CountdownTimer 
                  endTime={groupBuy.final_selection_end}
                  format="compact"
                  showLabel={false}
                  urgent={60}
                  className="text-xl font-bold text-center"
                />
                <div className="mt-3">
                  <Progress 
                    value={(() => {
                      const now = new Date().getTime();
                      const start = new Date(groupBuy.end_time).getTime();
                      const end = new Date(groupBuy.final_selection_end).getTime();
                      const total = 12 * 60 * 60 * 1000; // 12시간
                      const remaining = end - now;
                      // 남은 시간 비율 계산 (100%에서 시작해서 0%로 감소)
                      return Math.min(100, Math.max(0, (remaining / total) * 100));
                    })()}
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-red-500 mt-2 text-center font-medium">
                  ⚠️ 시간 내 선택하지 않으면 자동 포기 처리
                </p>
              </>
            )}
            
            {groupBuyData.status === 'final_selection_seller' && groupBuy.seller_selection_end && (
              <>
                <p className="text-gray-500 text-sm mb-2 text-center">판매자 최종선택 마감까지</p>
                <CountdownTimer 
                  endTime={groupBuy.seller_selection_end}
                  format="compact"
                  showLabel={false}
                  urgent={60}
                  className="text-xl font-bold text-center"
                />
                <div className="mt-3">
                  <Progress 
                    value={(() => {
                      const now = new Date().getTime();
                      const end = new Date(groupBuy.seller_selection_end).getTime();
                      const total = 6 * 60 * 60 * 1000; // 6시간
                      const remaining = end - now;
                      // 남은 시간 비율 계산 (100%에서 시작해서 0%로 감소)
                      return Math.min(100, Math.max(0, (remaining / total) * 100));
                    })()}
                    className="h-2"
                  />
                </div>
                {isSeller && (
                  <p className="text-xs text-red-500 mt-2 text-center font-medium">
                    ⚠️ 시간 내 선택하지 않으면 자동 포기 처리
                  </p>
                )}
              </>
            )}
            
            {(groupBuyData.status === 'in_progress' || groupBuyData.status === 'completed' || groupBuyData.status === 'cancelled') && (
              <>
                <p className="text-gray-500 text-sm mb-2 text-center">거래 상태</p>
                <p className="text-xl font-bold text-center">
                  {groupBuyData.status === 'in_progress' && '거래중'}
                  {groupBuyData.status === 'completed' && '판매완료'}
                  {groupBuyData.status === 'cancelled' && '취소됨'}
                </p>
              </>
            )}
              </div>
              
              {/* PC에서만 표시되는 버튼 및 견적 영역 */}
              <div className="hidden lg:block mt-6 border-t pt-4 space-y-4">
                {/* 일반회원 버튼 구성 */}
                {!isSeller && isParticipant ? (
                  // 참여한 일반회원
                  <div className="space-y-3">
                    {/* 참여중인 공구 */}
                    {groupBuyData.status === 'recruiting' && (
                      <>
                        <Button
                          onClick={handleShare}
                          variant="outline"
                          className="w-full py-3"
                        >
                          공동구매 초대하기
                        </Button>
                        {/* 공구 나가기 버튼 - 조건부 표시 */}
                        {groupBuy.status === 'recruiting' && totalBids === 0 && (
                          isCreator ? (
                            // 생성자: 참여자가 본인만 있고 입찰이 없을 때만 삭제 가능
                            currentParticipants <= 1 && (
                              <Button
                                onClick={() => setShowWithdrawDialog(true)}
                                variant="outline"
                                className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
                              >
                                공구 삭제
                              </Button>
                            )
                          ) : (
                            // 일반 참여자: 모집중이고 입찰이 없을 때만 나가기 가능
                            <Button
                              onClick={() => setShowWithdrawDialog(true)}
                              variant="outline"
                              className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              공구 나가기
                            </Button>
                          )
                        )}
                      </>
                    )}

                    {/* 구매확정/포기 선택하기 */}
                    {isBuyerFinalSelection && !isFinalSelectionExpired && (
                      <>
                        {myParticipationFinalDecision === 'pending' ? (
                          <>
                            <Button
                              onClick={() => handleFinalSelection('confirm')}
                              className="w-full py-4 text-base font-medium bg-green-600 hover:bg-green-700"
                            >
                              구매확정
                            </Button>
                            <Button
                              onClick={() => handleFinalSelection('cancel')}
                              variant="outline"
                              className="w-full py-4 text-base font-medium border-red-600 text-red-600 hover:bg-red-50"
                            >
                              구매포기
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              disabled
                              className="w-full py-4 text-base font-medium"
                            >
                              {myParticipationFinalDecision === 'confirmed' ? '✓ 구매확정' : '✓ 구매포기'}
                            </Button>
                            {myParticipationFinalDecision === 'confirmed' && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-center">
                                <p className="text-sm text-blue-700">다른 참여자의 선택을 기다리는 중</p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : isSeller && (hasWinningBid || isMyBidSelected) ? (
                  // 낙찰된 판매회원
                  <div className="space-y-3">
                    {/* 1. 구매자 최종선택 대기중 */}
                    {isBuyerFinalSelection && (
                      <>
                        <div className="p-4 bg-yellow-50 rounded-lg text-center mb-3">
                          <p className="font-semibold text-yellow-800">구매자 최종선택 대기중</p>
                        </div>
                        <Button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-confirmation-stats/`, {
                                headers: {
                                  'Authorization': `Bearer ${accessToken}`,
                                }
                              });
                              const data = await res.json();
                              setBuyerConfirmationData(data);
                              setShowBuyerConfirmationModal(true);
                            } catch (error) {
                              console.error('Error fetching buyer confirmation stats:', error);
                            }
                          }}
                          variant="outline"
                          className="w-full py-3"
                        >
                          구매자확정률 확인하기
                        </Button>
                      </>
                    )}

                    {/* 2. 판매확정/포기 선택하기 */}
                    {isSellerFinalSelection && !isFinalSelectionExpired && (
                      <>
                        <Button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-confirmation-stats/`, {
                                headers: {
                                  'Authorization': `Bearer ${accessToken}`,
                                }
                              });
                              const data = await res.json();
                              setBuyerConfirmationData(data);
                              setShowBuyerConfirmationModal(true);
                            } catch (error) {
                              console.error('Error fetching buyer confirmation stats:', error);
                            }
                          }}
                          variant="outline"
                          className="w-full py-3 mb-3"
                        >
                          구매자 확정률 보기
                        </Button>
                        {myBidFinalDecision === 'pending' ? (
                          <>
                            <Button
                              onClick={() => handleFinalSelection('confirm')}
                              className="w-full py-4 text-base font-medium bg-green-600 hover:bg-green-700"
                            >
                              판매확정
                            </Button>
                            <Button
                              onClick={() => handleFinalSelection('cancel')}
                              variant="outline"
                              className="w-full py-4 text-base font-medium border-red-600 text-red-600 hover:bg-red-50"
                            >
                              판매포기
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled
                            className="w-full py-4 text-base font-medium"
                          >
                            {myBidFinalDecision === 'confirmed' ? '✓ 판매확정' : '✓ 판매포기'}
                          </Button>
                        )}
                      </>
                    )}

                    {/* 3. 거래중 및 판매자 최종선택 */}
                    {(isInProgress || isSellerFinalSelection) && myBidFinalDecision === 'confirmed' && (
                      <>
                        <div className="p-4 bg-green-50 rounded-lg text-center mb-3">
                          <p className="font-semibold text-green-800">
                            {isInProgress ? '거래중' : '판매자 최종선택중'}
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowBuyerInfoModal(true)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700"
                        >
                          구매자정보보기
                        </Button>
                      </>
                    )}

                    {/* 4. 판매완료 */}
                    {isCompleted && myBidFinalDecision === 'confirmed' && (
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="font-semibold text-purple-800">판매완료</p>
                      </div>
                    )}
                  </div>
                ) : isSeller && !isFinalSelection &&
                 groupBuyData.status === 'recruiting' &&
                 !isEnded ? (
                  // 판매자용 인터페이스
                  <div className="space-y-4">
                    {/* 견적 제안 현황 */}
                    {(topBids.length > 0 || myBidRank) && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">견적 제안 현황</h4>
                        
                        {myBidRank && hasBid && (
                          <div className="mb-2 py-1 px-2 bg-blue-50 border border-blue-100 rounded">
                            <span className="text-sm font-medium text-blue-700">
                              내 견적 순위: 총 {myBidRank.total}개 중 {myBidRank.rank}위
                            </span>
                          </div>
                        )}
                        
                        {topBids.length > 0 && (
                          <>
                            <div className="space-y-1">
                              {topBids.map((bid: any, index: number) => {
                                const isMyBid = (() => {
                                  const sellerId = bid.seller_id 
                                    ? (typeof bid.seller_id === 'string' ? parseInt(bid.seller_id) : bid.seller_id)
                                    : (typeof bid.seller === 'object' && bid.seller?.id 
                                      ? bid.seller.id 
                                      : (typeof bid.seller === 'string' ? parseInt(bid.seller) : bid.seller));
                                  const userId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
                                  return sellerId === userId;
                                })();
                                return (
                                  <div key={bid.id} className={`flex text-sm ${isMyBid ? 'font-bold' : ''}`}>
                                    <span className={`${isMyBid ? 'text-blue-600' : ''} flex items-center gap-2`}>
                                      <span>{bid.actualRank || (index + 1)}위</span>
                                      <span className={`ml-2 ${isMyBid ? 'text-blue-600' : ''}`}>
                                        {isMyBid
                                          ? `${bid.amount.toLocaleString()}원`
                                          : maskAmount(bid.amount) + '원'}
                                      </span>
                                      {isMyBid && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold ml-2">
                                          내순위
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-sm font-semibold text-blue-800 mt-2 bg-blue-50 p-2 rounded border border-blue-200">❗ 앞자리를 제외한 견적금액은 비공개 처리됩니다.</p>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* 견적 입력 폼 */}
                    {groupBuyData.status === 'recruiting' && (
                    <div className="flex flex-col w-full">
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
                              제안 중...
                            </span>
                          ) : hasBid && myBidAmount ? (
                            '견적 수정'
                          ) : (
                            '견적 제안'
                          )}
                        </button>
                      </div>
                    </div>
                    )}
                    
                    {/* 견적 취소 버튼 */}
                    {groupBuyData.status === 'recruiting' && hasBid && canCancelBid && !isEnded && !isFinalSelection && (
                      <button
                        onClick={() => setShowCancelBidDialog(true)}
                        className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                      >
                        견적 철회하기
                      </button>
                    )}
                  </div>
                ) : (
                  // 비참여자 또는 비회원
                  <>
                    {(groupBuyData.status === 'completed' || groupBuyData.status === 'cancelled' || 
                      groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' ||
                      groupBuyData.status === 'in_progress') ? (
                      <div className="p-4 bg-gray-100 rounded-lg text-center">
                        <p className="font-semibold text-gray-700">공구종료</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groupBuyData.status === 'recruiting' && (
                          <Button
                            onClick={handleJoinClick}
                            className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
                          >
                            같이 견적받기
                          </Button>
                        )}
                        <Button
                          onClick={handleShare}
                          variant="outline"
                          className="w-full py-3"
                        >
                          공동구매 초대하기
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 판매자 입찰 정보 - PC에서만 오른쪽 영역에 표시 */}
              {isSeller && myBidInfo && groupBuyData.status !== 'recruiting' && (
                <div className="hidden lg:block mt-6">
                  <div className={`p-6 rounded-lg border ${
                    myBidInfo.status === 'won'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-medium flex items-center ${
                        myBidInfo.status === 'won' ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        <Gavel className="w-5 h-5 mr-2" />
                        견적제안 내역
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="font-medium">내 순위:</span>
                        <span className={myBidInfo.rank === 1 ? "text-lg font-bold text-green-600 mx-1" : ""}>{myBidInfo.rank}위</span>
                        {myBidInfo.rank !== 1 && " "}/ 전체 {myBidInfo.total_bidders}명
                        {isSeller && (hasWinningBid || isMyBidSelected || myBidInfo?.status === 'won') && (
                          <span className="text-yellow-600 font-bold ml-2">축하합니다!</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">견적 금액:</span> {myBidInfo.amount.toLocaleString()}원
                      </div>
                      {/* 선정된 경우 메시지 숨김, 미선정은 표시 */}
                      {myBidInfo.status === 'won' ? (
                        null  // 선정된 경우 백엔드 메시지 숨김
                      ) : (
                        <div className="mt-4 p-4 bg-yellow-100 rounded-md">
                          <p className="text-yellow-800">아쉽지만 공구에 선정되지 않았습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 오른쪽 영역 끝 */}
      </div>
      {/* 메인 컨텐츠 래퍼 끝 */}

      {/* 하단 구분선 */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-6 mt-6">
        <hr className="border-gray-200" />
      </div>

      {/* 하단 영역 - 최고지원금 */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-6 py-6">
        {/* 최고 지원금 */}
        <div className="px-4 lg:px-0">
            {isFinalSelection || groupBuyData.status === 'completed' || groupBuyData.status === 'in_progress' || groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' ? (
              // 최종선택 상태일 때 낙찰 정보 표시
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-8 border border-orange-200 shadow-md">
                <div className="text-center">
                  {(groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' || groupBuyData.status === 'in_progress' || groupBuyData.status === 'completed') && (isParticipant || isSeller) && (
                    <div className="mb-6">
                      <p className="text-lg sm:text-xl font-bold text-center text-green-700 mb-2 whitespace-nowrap">
                        <span className="inline-block">🎉</span>
                        <span className="inline-block mx-1">
                          {isSeller && (hasWinningBid || isMyBidSelected || myBidInfo?.status === 'won') ? '공구에 최종 선정되셨습니다!' : '견적이 최종 선정되었습니다!'}
                        </span>
                        <span className="inline-block">🎉</span>
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Crown className="h-6 w-6 text-orange-500" />
                    <p className="text-xl font-bold text-gray-800">
                      최종 지원금
                    </p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-dungji-primary mb-1">
                    {((groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' || groupBuyData.status === 'in_progress' || groupBuyData.status === 'completed') && (isParticipant || isSeller)) || (isSeller && hasWinningBid) ? (
                      <>
                        <span>{
                          groupBuyData.winning_bid_amount?.toLocaleString() ||
                          (groupBuyData.bid_ranking?.[0]?.amount ? groupBuyData.bid_ranking?.[0]?.amount?.toLocaleString() : '0')
                        }원</span>
                      </>
                    ) : (
                      <span>{groupBuyData.winning_bid_amount_masked || '***,***원'}</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              // 진행중인 상태일 때 기존 표시
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="text-center">
                  <p className="text-sm text-blue-800 mb-3 font-medium">현재 최고 지원금</p>
                  <div className="bg-white rounded-lg py-4 px-6 inline-block shadow-md border border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">
                      {(highestBidAmount ?? 0) > 0 ? (
                        <span>{maskAmount(highestBidAmount!)}원</span>
                      ) : (
                        <span className="text-lg text-gray-600">견적 제안을 기다리고 있습니다😊</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

      </div>
      
      {/* 판매자 입찰 정보 - 모바일에서만 하단에 표시 */}
      {isSeller && myBidInfo && groupBuyData.status !== 'recruiting' && (
        <div className="lg:hidden px-4 mt-8 mb-8">
          <div className={`p-6 rounded-lg border ${
            myBidInfo.status === 'won'
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-medium flex items-center ${
                myBidInfo.status === 'won' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                <Gavel className="w-5 h-5 mr-2" />
                견적제안 내역
              </h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">내 순위:</span>
                <span className={myBidInfo.rank === 1 ? "text-lg font-bold text-green-600 mx-1" : ""}>{myBidInfo.rank}위</span>
                {myBidInfo.rank !== 1 && " "}/ 전체 {myBidInfo.total_bidders}명
                {isSeller && (hasWinningBid || isMyBidSelected || myBidInfo?.status === 'won') && (
                  <span className="text-yellow-600 font-bold ml-2">축하합니다!</span>
                )}
              </div>
              <div className="text-sm">
                <span className="font-medium">견적 금액:</span> {myBidInfo.amount.toLocaleString()}원
              </div>
              {/* 선정된 경우 메시지 숨김, 미선정은 표시 */}
              {myBidInfo.status === 'won' ? (
                null  // 선정된 경우 백엔드 메시지 숨김
              ) : (
                <div className="mt-4 p-4 bg-yellow-100 rounded-md">
                  <p className="text-yellow-800">아쉽지만 공구에 선정되지 않았습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 판매자 입찰 정보 - 히든 처리 */}
      {/* {isSeller && (
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
              전체 견적 내역 보기
            </button>
          </div>
        </div>
      )} */}

      {/* 하단 버튼 영역 - 모바일에서만 표시 */}
      <div className="lg:hidden px-4 py-2">
        {/* 일반회원 버튼 구성 */}
        {!isSeller && isParticipant ? (
          // 참여한 일반회원
          <div className="space-y-3">
            {/* 1. 참여중인 공구 (recruiting, bidding 상태) */}
            {groupBuyData.status === 'recruiting' && (
              <>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full py-3"
                >
                  공동구매 초대하기
                </Button>
                {/* 공구 나가기 버튼 - 조건부 표시 */}
                {groupBuy.status === 'recruiting' && totalBids === 0 && (
                  isCreator ? (
                    // 생성자: 참여자가 본인만 있고 입찰이 없을 때만 삭제 가능
                    currentParticipants <= 1 && (
                      <Button
                        onClick={() => setShowWithdrawDialog(true)}
                        variant="outline"
                        className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        공구 삭제
                      </Button>
                    )
                  ) : (
                    // 일반 참여자: 모집중이고 입찰이 없을 때만 나가기 가능
                    <Button
                      onClick={() => setShowWithdrawDialog(true)}
                      variant="outline"
                      className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      공구 나가기
                    </Button>
                  )
                )}
              </>
            )}

            {/* 2. 구매확정/포기 선택하기 (구매자 최종선택) */}
            {isBuyerFinalSelection && !isFinalSelectionExpired && (
              <>
                {myParticipationFinalDecision === 'pending' ? (
                  // 최초: 구매확정, 구매포기 둘 다 표시
                  <>
                    <Button
                      onClick={() => handleFinalSelection('confirm')}
                      className="w-full py-4 text-base font-medium bg-green-600 hover:bg-green-700"
                    >
                      구매확정
                    </Button>
                    <Button
                      onClick={() => handleFinalSelection('cancel')}
                      variant="outline"
                      className="w-full py-4 text-base font-medium border-red-600 text-red-600 hover:bg-red-50"
                    >
                      구매포기
                    </Button>
                  </>
                ) : (
                  // 선택 후: 선택한 버튼만 표시
                  <Button
                    disabled
                    className="w-full py-4 text-base font-medium"
                  >
                    {myParticipationFinalDecision === 'confirmed' ? '✓ 구매확정' : '✓ 구매포기'}
                  </Button>
                )}
              </>
            )}

            {/* 3. 판매자 최종선택 대기중 */}
            {isSellerFinalSelection && myParticipationFinalDecision === 'confirmed' && (
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="font-semibold text-yellow-800">판매자 최종선택 대기중</p>
              </div>
            )}

            {/* 4. 거래중 및 판매자 최종선택 */}
            {(isInProgress || isSellerFinalSelection) && myParticipationFinalDecision === 'confirmed' && (
              <>
                <div className="p-4 bg-green-50 rounded-lg text-center mb-3">
                  <p className="font-semibold text-green-800">
                    {isInProgress ? '거래중' : '판매자 최종선택 대기중'}
                  </p>
                </div>
                <Button
                  onClick={() => setShowContactInfoModal(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700"
                >
                  판매자정보보기
                </Button>
              </>
            )}

            {/* 5. 구매완료 */}
            {isCompleted && myParticipationFinalDecision === 'confirmed' && (
              <>
                <div className="p-4 bg-purple-50 rounded-lg text-center mb-3">
                  <p className="font-semibold text-purple-800">구매완료</p>
                </div>
                <Button
                  onClick={() => router.push(`/review/create?groupbuy=${groupBuy.id}`)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700"
                >
                  후기작성
                </Button>
              </>
            )}
          </div>
        ) : isSeller && (hasWinningBid || isMyBidSelected) ? (
          // 낙찰된 판매회원
          <div className="space-y-3">
            {/* 1. 구매자 최종선택 대기중 */}
            {isBuyerFinalSelection && (
              <>
                <div className="p-4 bg-yellow-50 rounded-lg text-center mb-3">
                  <p className="font-semibold text-yellow-800">구매자 최종선택 대기중</p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-confirmation-stats/`, {
                        headers: {
                          'Authorization': `Bearer ${accessToken}`,
                        }
                      });
                      const data = await res.json();
                      setBuyerConfirmationData(data);
                      setShowBuyerConfirmationModal(true);
                    } catch (error) {
                      console.error('Error fetching buyer confirmation stats:', error);
                    }
                  }}
                  variant="outline"
                  className="w-full py-3"
                >
                  구매자확정률 확인하기
                </Button>
              </>
            )}

            {/* 2. 판매확정/포기 선택하기 */}
            {isSellerFinalSelection && !isFinalSelectionExpired && (
              <>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/buyer-confirmation-stats/`, {
                        headers: {
                          'Authorization': `Bearer ${accessToken}`,
                        }
                      });
                      const data = await res.json();
                      setBuyerConfirmationData(data);
                      setShowBuyerConfirmationModal(true);
                    } catch (error) {
                      console.error('Error fetching buyer confirmation stats:', error);
                    }
                  }}
                  variant="outline"
                  className="w-full py-3 mb-3"
                >
                  구매자 확정률 보기
                </Button>
                {myBidFinalDecision === 'pending' ? (
                  <>
                    <Button
                      onClick={() => handleFinalSelection('confirm')}
                      className="w-full py-4 text-base font-medium bg-green-600 hover:bg-green-700"
                    >
                      판매확정
                    </Button>
                    <Button
                      onClick={() => handleFinalSelection('cancel')}
                      variant="outline"
                      className="w-full py-4 text-base font-medium border-red-600 text-red-600 hover:bg-red-50"
                    >
                      판매포기
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled
                    className="w-full py-4 text-base font-medium"
                  >
                    {myBidFinalDecision === 'confirmed' ? '✓ 판매확정' : '✓ 판매포기'}
                  </Button>
                )}
              </>
            )}

            {/* 3. 거래중 및 판매자 최종선택 */}
            {(isInProgress || isSellerFinalSelection) && myBidFinalDecision === 'confirmed' && (
              <>
                <div className="p-4 bg-green-50 rounded-lg text-center mb-3">
                  <p className="font-semibold text-green-800">
                    {isInProgress ? '거래중' : '판매자 최종선택중'}
                  </p>
                </div>
                <Button
                  onClick={() => setShowBuyerInfoModal(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700"
                >
                  구매자정보보기
                </Button>
              </>
            )}

            {/* 4. 판매완료 */}
            {isCompleted && myBidFinalDecision === 'confirmed' && (
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="font-semibold text-purple-800">판매완료</p>
              </div>
            )}
          </div>
        ) : isSeller && !isFinalSelection && 
         groupBuyData.status === 'recruiting' && 
         !isEnded ? (
          // 판매자용 인터페이스
          <div className="space-y-4">
            {groupBuyData.status === 'recruiting' && !hasBid ? (
              // v3.0: 모집과 입찰 동시 진행
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h3 className="font-medium text-yellow-800 mb-1">🎯 경쟁력 있는 견적을 제안해 보세요.</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <div>• 현재 참여자: {currentParticipants}/{groupBuy.max_participants}명</div>
                  <div>• 공구 종료까지 견적 제안 가능합니다</div>
                </div>
              </div>
            ) : null}
            
            {/* 견적 타입 표시 - v3.0: recruiting 상태에서 표시 */}
            {groupBuyData.status === 'recruiting' && !hasBid && (
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                <div className="text-sm font-medium">견적 유형:</div>
                <div className="text-sm font-medium px-3 py-1 bg-blue-600 text-white rounded-md">
                  {isSupportBidType ? '지원금 견적' : '가격 견적'}
                </div>
              </div>
            )}
            
            {/* 견적 현황 */}
            {(topBids.length > 0 || myBidRank) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">견적 제안 현황</h4>
                
                {myBidRank && hasBid && (
                  <div className="mb-2 py-1 px-2 bg-blue-50 border border-blue-100 rounded">
                    <span className="text-sm font-medium text-blue-700">
                      내 견적 순위: 총 {myBidRank.total}개 중 {myBidRank.rank}위
                    </span>
                  </div>
                )}
                
                {topBids.length > 0 && (
                  <>
                    <div className="space-y-1">
                      {topBids.map((bid: any, index: number) => {
                        const isMyBid = (() => {
                          // API에서 seller_id로 오는 경우와 seller 객체로 오는 경우 모두 처리
                          const sellerId = bid.seller_id 
                            ? (typeof bid.seller_id === 'string' ? parseInt(bid.seller_id) : bid.seller_id)
                            : (typeof bid.seller === 'object' && bid.seller?.id 
                              ? bid.seller.id 
                              : (typeof bid.seller === 'string' ? parseInt(bid.seller) : bid.seller));
                          const userId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
                          return sellerId === userId;
                        })();
                        return (
                          <div key={bid.id} className={`flex text-sm ${isMyBid ? 'font-bold' : ''}`}>
                            <span className={`${isMyBid ? 'text-blue-600' : ''} flex items-center gap-2`}>
                              <span>{bid.actualRank || (index + 1)}위</span>
                              <span className={`ml-2 ${isMyBid ? 'text-blue-600' : ''}`}>
                                {isMyBid
                                  ? `${bid.amount.toLocaleString()}원`
                                  : maskAmount(bid.amount) + '원'}
                              </span>
                              {isMyBid && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold ml-2">
                                  내순위
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm font-semibold text-blue-800 mt-2 bg-blue-50 p-2 rounded border border-blue-200">❗ 앞자리를 제외한 견적금액은 비공개 처리됩니다.</p>
                  </>
                )}
              </div>
            )}
            
            {/* 견적 입력 폼 - v3.0: 모집중과 견적중 모두 표시 */}
            {groupBuyData.status === 'recruiting' && (
            <div className="flex flex-col w-full">
              {/* 견적 유형별 안내 문구 */}
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
                      견적 제안 중...
                    </span>
                  ) : hasBid && myBidAmount ? (
                    '견적 수정하기'
                  ) : (
                    '견적 제안하기'
                  )}
                </button>
              </div>
              
              {/* <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                <p className="text-sm font-medium text-blue-900 mb-2">💰 견적 금액은 1,000원 단위로 입력됩니다.</p>
                <p className="text-sm font-semibold text-blue-800 mb-1">❗ 앞자리를 제외한 견적금액은 비공개 처리됩니다.</p>
              </div> */}
            </div>
            )}
            
            {/* 견적 취소 버튼 - v3.0: 모집중과 견적중 모두 */}
            {groupBuyData.status === 'recruiting' && hasBid && canCancelBid && !isEnded && !isFinalSelection && (
              <button
                onClick={() => setShowCancelBidDialog(true)}
                className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
              >
                견적 철회하기
              </button>
            )}
            
            {/* 견적 안내사항 - v3.0: 모집중과 견적중 모두 */}
            {groupBuyData.status === 'recruiting' && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 견적 제안 가이드</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>• 견적 제안 시 견적 이용권 1개가 소모됩니다</div>
                <div>• 최소 견적 단위는 1,000원이며, 신중하게 제안해주세요</div>
                <div>• 견적 철회 및 수정은 공구 마감 이전에만 가능합니다</div>
                <div>• 경쟁력 있는 견적일수록 선정될 가능성이 높습니다</div>
                <div>• 공구 기간 동안 참여 인원은 변동될 수 있습니다</div>
              </div>
            </div>
            )}
            
            {/* 공유하기 버튼 */}
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full py-3"
            >
              공동구매 초대하기
            </Button>
          </div>
        ) : (
          // 비참여자 또는 비회원
          <>
            {/* 공구가 종료된 경우 */}
            {(groupBuyData.status === 'completed' || groupBuyData.status === 'cancelled' || 
              groupBuyData.status === 'final_selection_buyers' || groupBuyData.status === 'final_selection_seller' ||
              groupBuyData.status === 'in_progress') ? (
              <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="font-semibold text-gray-700">공구종료</p>
              </div>
            ) : (
              // 진행 중인 공구 - 참여 가능
              <div className="space-y-3">
                {/* 같이 견적받기 버튼 */}
                {groupBuyData.status === 'recruiting' && (
                  <Button
                    onClick={handleJoinClick}
                    className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
                  >
                    같이 견적받기
                  </Button>
                )}
                {/* 공유하기 버튼 */}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full py-3"
                >
                  공동구매 초대하기
                </Button>
              </div>
            )}
          </>
        )}

        {/* 구분선 - 모바일에서만 표시 */}
        <div className="lg:hidden">
          <hr className="border-gray-200 mx-4 my-4" />
        </div>

        {/* 중요 안내사항 및 약정기간 안내 */}
        <div className="mb-6">
            {(groupBuy.product_details?.category_name === '휴대폰' ||
              groupBuy.product_details?.category_name === '인터넷' ||
              groupBuy.product_details?.category_name === '인터넷+TV') && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  ⚠️ 중요 안내사항
                </div>
                {groupBuy.product_details?.category_name === '휴대폰' ? (
                  <>
                    <div className="text-sm text-gray-500">
                      • 기존 기기의 남은 할부금과 위약금은 본인 부담입니다.
                    </div>
                    <div className="text-sm text-gray-500">
                      • 자세한 내용은 통신사 고객센터 또는 앱을 통해 확인 가능합니다.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">
                      • 기존 서비스의 위약금은 본인 부담입니다.
                    </div>
                    <div className="text-sm text-gray-500">
                      • 설치비, 철거비 등 추가 비용이 발생할 수 있습니다.
                    </div>
                    <div className="text-sm text-gray-500">
                      • 자세한 내용은 통신사 고객센터 또는 앱을 통해 확인 가능합니다.
                    </div>
                  </>
                )}
                <div className="text-sm text-gray-500 mt-4">
                  • 가입약정 기간은 {(groupBuy.product_details?.category_name === '인터넷' || groupBuy.product_details?.category_name === '인터넷+TV') ? '36개월' : '24개월'} 입니다
                </div>
              </div>
            )}
        </div>

        {/* 가이드라인 링크 */}
        <div className="text-center mt-4 mb-2">
          <a href="https://doongji-market-1vi5n3i.gamma.site/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline hover:text-blue-800">
            📋 이용 가이드 확인하기
          </a>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <div>• 공구 참여 전 가이드라인을 꼭 확인해주세요</div>
            <div>• 견적 제안 진행 중에는 중도 포기가 제한되니 신중한 참여 부탁드립니다</div>
          </div>
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
            <AlertDialogTitle>공구 나가기</AlertDialogTitle>
            <AlertDialogDescription>
              {totalBids > 0 ? (
                <>
                  견적이 제안된 공구는 나가기가 불가합니다.
                  <br />
                  이미 판매자가 견적을 제안한 상태입니다.
                </>
              ) : isCreator ? (
                <>
                  정말로 이 공구를 삭제하시겠습니까?
                  <br />
                  삭제 후에는 복구할 수 없습니다.
                </>
              ) : (
                <>
                  정말로 이 공구에서 나가시겠습니까?
                  <br />
                  공구 마감전에 언제든 다시 참여할 수 있습니다.
                </>
              )}
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
                  나가는 중...
                </>
              ) : (
                '나가기'
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
        currentUserId={user?.id ? parseInt(user.id) : undefined}
        isSeller={isSeller}
        isParticipant={isParticipant}
        hasBid={hasBid}
        groupBuyStatus={groupBuyData.status}
        isAuthenticated={isAuthenticated}
        categoryName={groupBuyData.product_details?.category_name}
        categoryDetailType={groupBuyData.product_details?.category_detail_type}
      />

      {/* 최종선택 모달 */}
      <AlertDialog open={showFinalSelectionModal} onOpenChange={setShowFinalSelectionModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="sr-only">최종선택</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="p-0">
            {groupBuy.final_selection_end && (
              <FinalSelectionTimer
                groupBuyId={groupBuy.id}
                endTime={groupBuy.final_selection_end}
                bidAmount={selectedBidAmount || undefined}
                participantCount={currentParticipants}
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

      {/* 견적이용권 부족 다이얼로그 */}
      <AlertDialog open={showNoBidTokenDialog} onOpenChange={setShowNoBidTokenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>견적이용권 부족</AlertDialogTitle>
            <AlertDialogDescription>
              입찰하려면 견적이용권이 필요합니다. 
              견적이용권을 구매하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/mypage/seller/bid-tokens')}
            >
              이용권 현황 페이지로 이동
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
              취소 후에는 견적이용권이 환불되지 않습니다.
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

      {/* 연락처 정보 모달 - 구매자용 */}
      <ContactInfoModal
        isOpen={showContactInfoModal}
        onClose={() => setShowContactInfoModal(false)}
        groupBuyId={groupBuy.id}
        accessToken={accessToken}
      />

      {/* 구매자 정보 모달 - 판매자용 */}
      <BuyerInfoModal
        isOpen={showBuyerInfoModal}
        onClose={() => setShowBuyerInfoModal(false)}
        groupBuyId={groupBuy.id}
      />

      {/* 최종선택 확인 다이얼로그 */}
      <AlertDialog open={showFinalSelectionDialog} onOpenChange={setShowFinalSelectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {finalSelectionType === 'confirm' 
                ? (isSeller ? '판매 확정' : '구매 확정')
                : (isSeller ? '판매 포기' : '구매 포기')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {finalSelectionType === 'confirm' ? (
                isSeller ? (
                  <>
                    선정된 금액으로 최종 판매확정 하시겠습니까?<br />
                    <span className="text-sm text-gray-600 mt-2 block">
                      (판매를 확정하시면 구매자 리스트를 제공해 드립니다)
                    </span>
                  </>
                ) : (
                  <>
                    선정된 금액으로 최종 구매확정 하시겠습니까?<br />
                    <span className="text-sm text-gray-600 mt-2 block">
                      (구매를 확정하시면 판매자 정보를 열람하실 수 있습니다)
                    </span>
                  </>
                )
              ) : (
                isSeller ? (
                  <>
                    판매 포기시 패널티가 부과될 수 있습니다.<br />
                    포기하시겠습니까?
                    {currentParticipants <= 1 && (
                      <span className="text-sm text-blue-600 mt-2 block">
                        (구매자가 1명 이하일 경우 패널티는 부과되지 않습니다)
                      </span>
                    )}
                  </>
                ) : (
                  <>공동구매 진행을 포기하시겠습니까?</>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              고민해 볼게요
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={processFinalSelection}
              className={finalSelectionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {finalSelectionType === 'confirm' 
                ? (isSeller ? '네 판매할게요' : '네 구매할게요')
                : '네 포기할게요'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 판매자 최종선택 모달 */}
      {hasWinningBid && (
        <FinalDecisionModal
          isOpen={showSellerFinalDecisionModal}
          onClose={() => setShowSellerFinalDecisionModal(false)}
          groupBuyId={groupBuy.id}
          groupBuyTitle={groupBuy.title}
          onDecisionComplete={() => {
            setShowSellerFinalDecisionModal(false);
            router.refresh();
            checkWinningBidStatus();
          }}
        />
      )}
      
      {/* 구매자 확정률 모달 */}
      {buyerConfirmationData && (
        <BuyerConfirmationModal
          isOpen={showBuyerConfirmationModal}
          onClose={() => setShowBuyerConfirmationModal(false)}
          totalParticipants={buyerConfirmationData.total_participants}
          confirmedCount={buyerConfirmationData.confirmed_count}
          confirmationRate={buyerConfirmationData.confirmation_rate}
          pendingCount={buyerConfirmationData.pending_count}
          declinedCount={buyerConfirmationData.declined_count}
        />
      )}
      
      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          // 모달만 닫기 - 사용자가 나중에 다시 시도할 수 있도록
        }}
        missingFields={missingFields}
        onUpdateProfile={() => {
          setShowProfileModal(false);
          clearCache();
          // 판매회원과 일반회원 구분하여 라우팅
          const isSeller = user?.role === 'seller' || user?.user_type === '판매';
          router.push(isSeller ? '/mypage/seller/settings' : '/mypage/settings');
        }}
      />

      {/* 패널티 모달 */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={user?.penalty_info || user?.penaltyInfo}
        userRole={isSeller ? 'seller' : 'buyer'}
      />
    </div>
    </EndedGroupBuyAccessControl>
  );
}