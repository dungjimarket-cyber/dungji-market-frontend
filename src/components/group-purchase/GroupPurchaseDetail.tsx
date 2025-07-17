'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check as CheckIcon, ArrowLeft, Bell, Users, Clock, Gavel, Share2, Info, UserMinus, Edit, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import JoinGroupBuyModal from '@/components/groupbuy/JoinGroupBuyModal';
import { getRegistrationTypeText, calculateGroupBuyStatus, getStatusText, getStatusClass } from '@/lib/groupbuy-utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
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
    category_detail_type?: string; // 카테고리 상세 타입 (telecom, electronics, rental 등)
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
  // 지역 관련 정보
  region_type?: string; // 지역 유형 (local, nationwide)
  region?: string; // 지역명 (서울, 부산 등)
  region_name?: string; // 지역명 (서울특별시, 부산광역시 등)
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
  
  // 카카오톡 인앱 브라우저 감지
  const isKakaoInAppBrowser = typeof navigator !== 'undefined' && /KAKAOTALK/i.test(navigator.userAgent);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState(groupBuy.current_participants);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [showLeaveRestrictionDialog, setShowLeaveRestrictionDialog] = useState(false);
  const [leaveErrorMessage, setLeaveErrorMessage] = useState<string>('');
  const [showJoinModal, setShowJoinModal] = useState(false); // 참여하기 모달 표시 여부
  const [bidAmount, setBidAmount] = useState<number | ''>(groupBuy.highest_bid_amount ? groupBuy.highest_bid_amount + 1000 : '');
  const [isBidding, setIsBidding] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBidSuccessModal, setShowBidSuccessModal] = useState(false);
  const [showBidCancelModal, setShowBidCancelModal] = useState(false);
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false);
  const [myBidAmount, setMyBidAmount] = useState<number | null>(null);
  // 과제 조건: 휴대폰 카테고리는 지원금 입찰, 그 외는 가격 입찰로 처리
  const categoryName = groupBuy.product_details?.category_name || '';
  const isTelecom = categoryName === '휴대폰';
  const [bidType, setBidType] = useState<'price' | 'support'>(
    isTelecom ? 'support' : 'price'
  ); // 휴대폰은 지원금 입찰, 그 외는 가격 입찰
  const [hasBid, setHasBid] = useState(false); // 이미 입찰했는지 여부
  const [bidEndTime, setBidEndTime] = useState<Date | null>(null); // 입찰 마감 시간
  const [canCancelBid, setCanCancelBid] = useState(false); // 입찰 취소 가능 여부
  type Bid = {
    id: number;
    amount: number;
    is_mine: boolean;
    bid_type: 'price' | 'support';
    profile_image?: string;
    username?: string;
  };
  const [topBids, setTopBids] = useState<Array<Bid>>([]);  // 상위 5개 입찰 정보
  
  // 판매회원 여부 확인 - user_type 또는 role 속성 확인
  const [isSeller, setIsSeller] = useState(false);
  // 자신이 생성한 공구인지 확인하는 상태 추가
  const [isCreator, setIsCreator] = useState(false);
  // 입찰권 부족 팝업 상태
  const [showNoBidTokenDialog, setShowNoBidTokenDialog] = useState(false);
  // 현재 사용자 프로필 정보
  const [userProfile, setUserProfile] = useState<{ username?: string, profile_image?: string } | null>(null);
  // 현재 사용자의 입찰 ID 저장
  const [myBidId, setMyBidId] = useState<number | null>(null);
  // 내 입찰 순위 저장 (총 N개 중 M위)
  const [myBidRank, setMyBidRank] = useState<{rank: number, total: number} | null>(null);
  const [showBidCompleteModal, setShowBidCompleteModal] = useState(false); // 입찰 완료 모달 표시 여부
  
  // 입찰 정보 가져오기 함수 - useCallback으로 메모이제이션
  const fetchBidInfo = useCallback(async () => {
    const groupBuyId = groupBuy?.id;
    if (!isAuthenticated || !accessToken || !groupBuyId) return;
    
    try {
      // 현재 사용자 ID 및 프로필 정보 가져오기
      let currentUserId = null;
      let currentUserProfile = null;
      
      if (user?.id) {
        currentUserId = user.id;
        // 사용자 프로필 정보 저장 (username은 카카오 로그인의 경우 닉네임 포함)
        setUserProfile({
          username: user.username || user.name,
          profile_image: user.image || (user as any).profile_image
        });
        console.log('현재 사용자 ID (user 객체):', currentUserId);
        console.log('현재 사용자 프로필:', { username: user.username || user.name, profile_image: user.image || (user as any).profile_image });
      } else {
        // 백업: 프로필 API에서 사용자 ID 및 프로필 정보 가져오기
        try {
          const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (profileResponse.ok) {
            const userProfileData = await profileResponse.json();
            currentUserId = userProfileData.id;
            currentUserProfile = {
              username: userProfileData.username || userProfileData.name,
              profile_image: userProfileData.profile_image || userProfileData.image
            };
            setUserProfile(currentUserProfile);
            console.log('현재 사용자 ID (프로필 API):', currentUserId);
            console.log('현재 사용자 프로필 (프로필 API):', currentUserProfile);
          }
        } catch (profileError) {
          console.error('프로필 정보 가져오기 오류:', profileError);
        }
      }
      
      // 입찰 정보 API 호출
      const bidInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/bids/?include_user_info=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!bidInfoResponse.ok) {
        throw new Error(`입찰 정보 조회 실패: ${bidInfoResponse.status}`);
      }
      
      let rawData = await bidInfoResponse.json();
      console.log('입찰 정보 원본 응답:', rawData);
      
      // API 응답이 배열인 경우 객체로 변환
      let bidInfoData = rawData;
      if (Array.isArray(rawData)) {
        // 각 입찰에 is_mine 플래그 추가/확인 및 사용자 정보 처리 (사용자 ID 기반)
        const bidsWithMineFlag = rawData.map(bid => {
          // 기존 is_mine 플래그 유지하면서 사용자 ID로 추가 확인
          const isMine = bid.is_mine === true || 
                        (currentUserId && bid.seller && bid.seller.toString() === currentUserId.toString());
          
          // 사용자 정보 처리 - username과 profile_image 확인
          // 카카오 로그인 사용자의 경우 username에 카카오 닉네임이 저장됨
          return {
            ...bid,
            is_mine: isMine,
            username: bid.seller_username || bid.username || '익명',
            profile_image: bid.seller_profile_image || bid.profile_image
          };
        });
        
        console.log('사용자 ID로 내 입찰 확인:', bidsWithMineFlag.map(b => ({ 
          id: b.id, 
          seller: b.seller, 
          is_mine: b.is_mine,
          amount: b.amount,
          username: b.username,
          profile_image: b.profile_image
        })));
        
        // 최종 가격 기준으로 정렬 (base_price - 지원금 또는 입찰가)
        const sortedBids = [...bidsWithMineFlag].sort((a, b) => {
          const aFinalPrice = a.bid_type === 'support' ? 
            (groupBuy.product_details?.base_price || 0) - a.amount : 
            a.amount;
          const bFinalPrice = b.bid_type === 'support' ? 
            (groupBuy.product_details?.base_price || 0) - b.amount : 
            b.amount;
          return aFinalPrice - bFinalPrice; // 낮은 가격이 더 높은 순위
        });
        
        // 정렬된 입찰에 프로필 이미지와 사용자명이 포함되어 있는지 한 번 더 확인
        const processedBids: Bid[] = sortedBids.map(bid => ({
          id: bid.id,
          amount: bid.amount,
          is_mine: bid.is_mine || false,
          bid_type: bid.bid_type || 'price',
          profile_image: bid.profile_image || bid.seller_profile_image || '',
          username: bid.username || bid.seller_username || '익명'
        }));
        
        // 내 입찰 찾기 (is_mine 플래그 기준)
        const myBid = processedBids.find(bid => bid.is_mine === true);
        console.log('내 입찰 찾기 결과:', myBid);
        
        if (myBid) {
          setMyBidAmount(myBid.amount);
          setMyBidId(myBid.id);
          setHasBid(true);
          // 입찰 취소 가능 여부 추가 설정
          setCanCancelBid((sortedBids.find(b => b.id === myBid.id)?.can_cancel) || false);
        } else {
          setHasBid(false);
          setMyBidAmount(null);
          setMyBidId(null);
          setCanCancelBid(false);
        }
        
        // 상위 5개 입찰만 화면에 표시 (프로필 이미지와 사용자명이 포함된 가공된 입찰 데이터 사용)
        setTopBids(processedBids.slice(0, 5));
        
        bidInfoData = {
          my_bid: myBid || null,
          top_bids: processedBids.slice(0, 5), // 상위 5개 입찰만 사용
          all_bids_count: rawData.length,
          bid_end_time: groupBuy?.end_time // 기본값 사용
        };
        console.log('배열 응답을 객체로 변환:', bidInfoData);
      }
      
      // 입찰 마감 시간 설정
      if (bidInfoData.bid_end_time) {
        setBidEndTime(new Date(bidInfoData.bid_end_time));
      } else {
        // API에서 제공하지 않을 경우 그룹 구매 종료 시간 기준으로 설정 (24시간 전)
        const endTime = new Date(groupBuy?.end_time || '');
        endTime.setHours(endTime.getHours() - 24); // 그룹 구매 종료 24시간 전으로 설정
        setBidEndTime(endTime);
      }
      
      // 입찰 취소 가능 여부 확인
      // 마감 시간이 지나지 않았고, 내 입찰이 있으면 취소 가능
      const now = new Date();
      const endTime = new Date(bidInfoData.bid_end_time || groupBuy?.end_time || '');
      const hasMyBid = bidInfoData.my_bid && bidInfoData.my_bid.id;
      
      // 내 입찰 ID와 금액 저장
      if (hasMyBid) {
        setMyBidId(bidInfoData.my_bid.id);
        setMyBidAmount(bidInfoData.my_bid.amount);
      } else {
        setMyBidId(null);
        setMyBidAmount(null);
      }
      
      setCanCancelBid(now < endTime && hasMyBid);
      
      // 내 입찰 여부 확인
      setHasBid(!!bidInfoData.my_bid);
      
      // 상위 5개 입찰 정보 가져오기
      if (bidInfoData.top_bids && Array.isArray(bidInfoData.top_bids)) {
        setTopBids(bidInfoData.top_bids.map((bid: any) => ({
          id: bid.id,
          amount: bid.amount,
          is_mine: bid.is_mine,
          bid_type: bid.bid_type || 'price' // 기본값은 가격 입찰
        })).slice(0, 5));
        
        // 내 입찰 순위 계산
        if (bidInfoData.my_bid && bidInfoData.all_bids_count) {
          // 내 입찰이 top_bids에 있는 경우, 순위 가져오기
          const myBidInTop = bidInfoData.top_bids.findIndex((bid: any) => bid.is_mine);
          if (myBidInTop !== -1) {
            setMyBidRank({
              rank: myBidInTop + 1,  // 0부터 시작하므로 +1
              total: bidInfoData.all_bids_count
            });
          } else if (bidInfoData.my_bid_rank) {
            // API가 내 순위를 제공하는 경우
            setMyBidRank({
              rank: bidInfoData.my_bid_rank,
              total: bidInfoData.all_bids_count
            });
          } else {
            // API가 내 순위를 제공하지 않는 경우, 총 입찰 개수만 표시
            setMyBidRank({
              rank: -1, // 순위 불확실
              total: bidInfoData.all_bids_count
            });
          }
        } else {
          setMyBidRank(null);
        }
      }
    } catch (error) {
      console.error('입찰 정보 가져오기 오류:', error);
      
      // API 오류 시 기본값 설정
      const endTime = new Date(groupBuy?.end_time || '');
      endTime.setHours(endTime.getHours() - 24); // 그룹 구매 종료 24시간 전으로 설정
      setBidEndTime(endTime);
      setCanCancelBid(false);
      setHasBid(false);
      setTopBids([]);
    }
  }, [groupBuy, isAuthenticated, accessToken]);
  
  // 판매회원 여부 확인 및 입찰 정보 가져오기
  useEffect(() => {
    // 서버에서 받아온 user 객체에서 확인
    if (user?.user_type === '판매') {
      setIsSeller(true);
    } else {
      // localStorage에서 확인
      if (typeof window !== 'undefined') {
        try {
          // localStorage에서 사용자 정보 가져오기
          const userStr = localStorage.getItem('auth.user') || localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.role === 'seller') {
              setIsSeller(true);
            }
          }
          
          // 추가 확인: isSeller 플래그 확인
          const isSellerFlag = localStorage.getItem('isSeller');
          if (isSellerFlag === 'true') {
            setIsSeller(true);
          }
        } catch (error) {
          console.error('판매회원 여부 확인 오류:', error);
        }
      }
    }
  }, [user]);
  
  // 입찰 정보 가져오기
  useEffect(() => {
    if (isSeller && groupBuy?.id) {
      fetchBidInfo();
    }
  }, [isSeller, groupBuy, isAuthenticated, accessToken, fetchBidInfo]);
  
  // 자신이 생성한 공구인지 확인
  useEffect(() => {
    // 디버깅: groupBuy 객체 구조 확인 (개발용)
    console.log('groupBuy 객체 구조:', {
      groupBuy,
      creator: groupBuy?.creator,
      host_id: groupBuy?.host_id,
      host_username: groupBuy?.host_username,
      creator_name: groupBuy?.creator_name
    });
    
    if (isAuthenticated && user?.id && groupBuy) {
      // 두 값을 모두 문자열로 변환하여 비교
      const userId = String(user.id);
      
      // creator가 직접 ID로 전달되는 경우 처리
      // API 응답에서 groupBuy.creator가 직접 숫자로 전달됨
      const creatorId = groupBuy.creator ? String(groupBuy.creator) : 
                       (groupBuy.host_id ? String(groupBuy.host_id) : '');
      
      // 디버깅 로그
      console.log('공구 생성자 체크:', {
        userId,
        userIdType: typeof userId,
        creatorId,
        creatorIdType: typeof creatorId,
        creatorSource: groupBuy.creator ? 'creator' : 
                     (groupBuy.host_id ? 'host_id' : 'not_found'),
        isMatch: userId === creatorId
      });
      
      // 생성자 여부 업데이트
      setIsCreator(userId === creatorId && creatorId !== '');
    }
  }, [isAuthenticated, user?.id, groupBuy]);
  
  // 입찰금액 포맷팅 함수
  const formatCurrency = (value: number | string | '') => {
    if (value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString();
  };
  
  // 입찰금액 파싱 함수 (콤마, 원 기호 제거)
  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[^0-9]/g, ''), 10);
  };

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
      console.log('[GroupPurchaseDetail] 공구 참여 시도:', { groupBuyId: groupBuy.id });
      setIsJoining(true);
      
      if (!accessToken) {
        console.log('[GroupPurchaseDetail] 인증 토큰 없음');
        toast.error('로그인이 필요합니다.');
        // 카카오톡 브라우저에서는 자동 리다이렉트 비활성화
        if (!isKakaoInAppBrowser) {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        }
        return;
      }
      
      // API URL 구성
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const joinUrl = `${apiBaseUrl}/groupbuys/${groupBuy.id}/join/`;
      console.log('[GroupPurchaseDetail] 공구 참여 API 호출:', joinUrl);

      const res = await fetch(joinUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      console.log('[GroupPurchaseDetail] API 응답 상태:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorMessage = '참여에 실패했습니다.';
        try {
          const errorData = await res.json();
          console.log('[GroupPurchaseDetail] API 오류 데이터:', errorData);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (jsonError) {
          console.error('[GroupPurchaseDetail] API 오류 응답 파싱 실패:', jsonError);
        }
        throw new Error(errorMessage);
      }

      console.log('[GroupPurchaseDetail] 공구 참여 성공');
      toast.success('공동구매에 참여했습니다!');
      setIsParticipant(true);
      setCurrentParticipants(prev => prev + 1);
      
      // 참여인원이 즉시 반영됩니다
      
    } catch (error) {
      console.error('[GroupPurchaseDetail] 공구 참여 오류:', error);
      toast.error(error instanceof Error ? error.message : '참여에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };
  
  /**
   * 공구 나가기
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
        
        // 백엔드에서 반환한 상세 에러 메시지 처리
        const errorData = await response.json();
        if (errorData && errorData.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error('공구 나가기에 실패했습니다.');
        }
      }

      toast.success('공구에서 나갔습니다.');
      setIsParticipant(false);
      setCurrentParticipants(prev => Math.max(0, prev - 1));
      setOpenLeaveDialog(false);
      
      // 마이페이지로 이동
      router.push('/mypage');
    } catch (err) {
      console.error('공구 나가기 오류:', err);
      
      // 입찰 진행 중인 경우 특별 처리
      const errorMessage = err instanceof Error ? err.message : '공구 나가기에 실패했습니다.';
      
      if (errorMessage.includes('Cannot leave group buy with active bids') || 
          errorMessage.includes('입찰이 진행 중인 공구에서는 탈퇴할 수 없습니다')) {
        setLeaveErrorMessage('입찰이 진행되어 탈퇴가 불가합니다. 입찰 종료후 최종선택을 통해 진행여부를 결정해주세요.');
        setShowLeaveRestrictionDialog(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLeaving(false);
      setOpenLeaveDialog(false);
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
  const [remainingTimeText, setRemainingTimeText] = useState<string>('');
  
  const calculateRemainingTime = () => {
    const timeLeft = new Date(groupBuy.end_time).getTime() - Date.now();
    if (timeLeft <= 0) return '마감';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${days}일 ${hours}시간`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분 ${seconds}초`;
    }
  };
  
  // 실시간 타이머 구현
  useEffect(() => {
    // 초기 타이머 설정
    setRemainingTimeText(calculateRemainingTime());
    
    // 1초마다 타이머 갱신
    const timerInterval = setInterval(() => {
      setRemainingTimeText(calculateRemainingTime());
    }, 1000);
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timerInterval);
  }, [groupBuy.end_time]);
  
  const getRemainingTime = () => {
    return remainingTimeText;
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
  
  // 통화 관련 함수는 위에서 이미 정의되어 있음
  
  /**
   * 입찰하기 버튼 클릭
   */
  const handleBidClick = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      // 카카오톡 브라우저에서는 자동 리다이렉트 비활성화
      if (!isKakaoInAppBrowser) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
      return;
    }
    
    // 입찰권 보유 여부 확인
    try {
      const bidTokenService = (await import('@/lib/bid-token-service')).default;
      const hasTokens = await bidTokenService.hasAvailableBidTokens();
      
      if (!hasTokens) {
        setShowNoBidTokenDialog(true);
        return;
      }
    } catch (error) {
      console.error('입찰권 확인 오류:', error);
      toast.error('입찰권 확인 중 오류가 발생했습니다.');
      return;
    }
    
    // 입찰금액 파싱 및 검증
    let amountToCheck = bidAmount;
    if (typeof amountToCheck === 'string') {
      amountToCheck = parseCurrency(amountToCheck);
    }
    
    if (typeof amountToCheck !== 'number' || isNaN(amountToCheck) || amountToCheck < (groupBuy.highest_bid_amount || 0) + 1000) {
      toast.error('입찰금액은 현재 최고 입찰가보다 1,000원 이상 높아야 합니다.');
      return;
    }
    
    setShowBidModal(true);
  };
  
  /**
   * 입찰 취소 버튼 클릭
   */
  const handleCancelBidClick = () => {
    if (!canCancelBid) {
      toast.error('입찰 마감 시간이 지나 취소할 수 없습니다.');
      return;
    }
    
    setShowBidCancelModal(true);
  };
  
  /**
   * 입찰 취소 확인
   */
  const handleConfirmCancelBid = async () => {
    if (!accessToken || !myBidId) {
      alert('취소할 입찰이 없습니다.');
      return;
    }
    
    try {
      // 실제 API 호출 구현 - BidViewSet의 cancel 액션 사용
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/${myBidId}/cancel/`, {
        method: 'DELETE',  // 백엔드에서 @action(detail=True, methods=['delete'])
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || '입찰 취소 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }
      
      toast.success('입찰이 취소되었습니다.');
      setShowBidCancelModal(false);
      setHasBid(false);
      
      // 입찰 정보 다시 가져오기
      fetchBidInfo();
      
      // 새로고침하여 최신 정보 가져오기
      router.refresh();
    } catch (error) {
      console.error('입찰 취소 오류:', error);
      toast.error('입찰 취소 중 오류가 발생했습니다.');
    }
  };
  
  /**
   * 입찰 확인
   */
  const handleConfirmBid = async () => {
    if (!accessToken || !groupBuy?.id) return;
    
    let amountToSubmit = bidAmount;
    if (typeof amountToSubmit === 'string') {
      amountToSubmit = parseCurrency(amountToSubmit);
    }
    
    if (typeof amountToSubmit !== 'number' || isNaN(amountToSubmit)) return;
    
    setIsBidding(true);
    
    try {
      // 기본 프로필 정보에서 사용자 ID 가져오기
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!profileResponse.ok) {
        throw new Error('프로필 정보를 가져올 수 없습니다.');
      }
      
      const userProfile = await profileResponse.json();
      console.log('사용자 프로필:', userProfile);
      
      // profile API에서 id 추출
      const userId = userProfile.id; // user_id가 아닌 id 필드 사용
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.');
      }
      
      // 실제 API 호출 구현
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          groupbuy: groupBuy.id,
          seller: userId, // 사용자 ID를 판매자 ID로 사용
          amount: amountToSubmit,
          bid_type: bidType || 'price' // 'price' 또는 'support'
        })
      });
      
      console.log('입찰 전송 데이터:', { 
        groupbuy: groupBuy.id,
        seller: userId,
        amount: amountToSubmit,
        bid_type: bidType || 'price'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('입찰 오류:', errorData);
        
        // 중복 입찰 에러 처리 (unique constraint violation)
        if (errorData.detail && errorData.detail.includes('unique')) {
          // 이미 입찰한 경우, 수정 모드로 전환
          setShowBidModal(false);
          toast.info('이미 입찰하셨습니다. 기존 입찰을 수정합니다.');
          
          // 기존 입찰 금액을 업데이트
          if (typeof amountToSubmit === 'number') {
            // 입찰 수정 API 호출 (PUT 요청)
            try {
              const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/${myBidId}/`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ 
                  groupbuy: groupBuy.id,
                  seller: userId,
                  amount: amountToSubmit,
                  bid_type: bidType || 'price'
                })
              });
              
              if (!updateResponse.ok) {
                const updateErrorData = await updateResponse.json().catch(() => ({}));
                throw new Error(updateErrorData.detail || '입찰 수정 중 오류가 발생했습니다.');
              }
              
              const updateData = await updateResponse.json();
              console.log('입찰 수정 결과:', updateData);
              
              setMyBidAmount(amountToSubmit);
              setShowBidSuccessModal(true);
              
              // 입찰 정보 다시 가져오기
              setTimeout(() => {
                fetchBidInfo();
              }, 500);
              
              toast.success('입찰이 수정되었습니다.');
              return;
            } catch (updateError) {
              console.error('입찰 수정 오류:', updateError);
              toast.error('입찰 수정 중 오류가 발생했습니다.');
              setIsBidding(false);
              return;
            }
          }
        } else {
          // 기타 에러 처리
          const errorMessage = errorData.detail || '입찰 중 오류가 발생했습니다.';
          toast.error(errorMessage);
          setIsBidding(false);
          throw new Error(JSON.stringify(errorData));
        }
      }
      
      const data = await response.json();
      console.log('입찰 결과:', data);
      const isDuplicate = data.is_duplicate || false; // 중복 입찰 여부
      
      setShowBidModal(false);
      setShowBidSuccessModal(true);
      setHasBid(true);
      
      // 입찰 금액 즉시 업데이트 (UI 반영을 위해)
      if (typeof amountToSubmit === 'number') {
        setMyBidAmount(amountToSubmit);
        
        // 입찰 ID 저장 (API 응답에서 가져옴)
        if (data && data.id) {
          setMyBidId(data.id);
          
          // 내 입찰 순위 임시 설정 (정확한 순위는 fetchBidInfo에서 업데이트)
          setMyBidRank(prev => ({
            rank: prev?.rank || 1, // 임시로 1위로 설정
            total: prev?.total || 1
          }));
        }
      }
      
      // 입찰 후 입찰 정보 다시 가져오기 (약간의 지연을 두어 백엔드 반영 시간 확보)
      setTimeout(() => {
        fetchBidInfo();
      }, 500);
      
      if (isDuplicate) {
        toast.success('수정 입찰 되었습니다.');
      } else {
        toast.success('입찰이 완료되었습니다.');
      }
      
      // 새로고침하여 최신 정보 가져오기
      router.refresh();
    } catch (error: any) {
      console.error('입찰 오류:', error);
      
      // 에러 메시지 추출 시도
      let errorMessage = '입찰 시 오류가 발생했습니다.';
      let errorData: { detail?: string; code?: string } = {};
      let isBidTokenError = false;
      
      try {
        // 에러가 JSON 문자열로 반환된 경우
        if (typeof error.message === 'string' && error.message.startsWith('{')) {
          errorData = JSON.parse(error.message);
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } 
        // 에러 객체에 response.data가 있는 경우
        else if (error.response?.data) {
          errorData = error.response.data;
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        }
      } catch (parseError) {
        console.error('에러 파싱 실패:', parseError);
      }
      
      // 입찰권 부족 관련 오류인지 확인
      isBidTokenError = 
        typeof errorMessage === 'string' && 
        (errorMessage.includes('입찰권') || 
         errorMessage.includes('사용 가능한 입찰권이 없습니다') ||
         errorMessage.includes('구매') || 
         errorMessage.includes('다시 시도해주세요'));
      
      // 오류 알림 표시
      toast.error(isBidTokenError ? '입찰권 부족' : '입찰 실패', {
        description: errorMessage,
      });
      
      // 입찰권 부족 오류인 경우 팝업 표시
      if (isBidTokenError) {
        setShowNoBidTokenDialog(true);
      }
    } finally {
      setIsBidding(false);
    }
  };
  
  /**
   * 입찰금액 입력 처리
   * 숫자만 입력 가능하도록 처리
   * 백스페이스 정상 동작을 위해 문자열 형태로 처리
   */
  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setBidAmount('');
      return;
    }
    
    // 숫자만 추출 (콤마, 원 등 제거)
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setBidAmount('');
      return;
    }
    
    // 문자열을 숫자로 변환하여 저장
    setBidAmount(numericValue === '' ? '' : parseInt(numericValue, 10));
  };

  const isCompleted = groupBuy.status === 'completed' || groupBuy.status === 'cancelled';

  return (
    <>
      <div className="relative">
        <div className="bg-white">
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
        </div>

        {/* 메인 컨텐츠 */}
        <div className="px-4 py-6">
          {/* 제품 이미지 및 기본 정보 */}
          <div className="mb-6">
            <div className="relative w-full mb-4 rounded-2xl overflow-hidden aspect-[4/3]">
              {/* 상태 표시 배지 - 우측 상단 */}
              <div className="absolute top-2 right-2 z-10">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time))}`}>
                  {getStatusText(calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time))}
                </span>
              </div>
              <Image
                src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
                alt={groupBuy.product_details?.name || '상품 이미지'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
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
              
              {/* 지역 정보 표시 */}
              {groupBuy.region_type && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">지역:</span>
                  <span className="font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    {groupBuy.region_type === 'nationwide' ? '전국' : groupBuy.region_name || groupBuy.region || '지역한정'}
                  </span>
                </div>
              )}
              
              <div className="text-sm font-medium">
                {groupBuy.product_details?.base_price?.toLocaleString()}원
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {currentParticipants}/{groupBuy.max_participants}명 참여중
                  </span>
                </div>
                <span className="text-sm text-blue-600">
                  {Math.round((currentParticipants / groupBuy.max_participants) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(currentParticipants / groupBuy.max_participants) * 100}%` }}
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
                    <span>
                      {groupBuy.telecom_detail?.subscription_type_korean || 
                       groupBuy.product_details?.registration_type_korean || 
                       getRegistrationTypeText(groupBuy.telecom_detail?.subscription_type || groupBuy.product_details?.registration_type)}
                    </span>
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
                  <button 
                    onClick={() => setShowBidHistoryModal(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {groupBuy.total_bids || 0}개 입찰 현황 보기
                  </button>
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
                    <>
                      <Image 
                        src={groupBuy.creator.profile_image} 
                        alt="프로필" 
                        width={32} 
                        height={32} 
                        unoptimized={true}
                        onError={(e) => {
                          // 이미지 로드 오류 시 기본 아이콘으로 대체
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.querySelector('span')?.classList.remove('hidden');
                        }}
                      />
                      <span className="text-xs hidden">👤</span>
                    </>
                  ) : (
                    <span className="text-xs">👤</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {groupBuy.creator?.username || groupBuy.host_username || groupBuy.creator_name || '익명'}
                  </p>
                  <p className="text-xs text-gray-500">공구 방장</p>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Info className="w-3 h-3 mr-1" />
                <span>신고하기</span>
              </div>
            </div>

            {/* 내 입찰 정보 영역 - 입찰한 경우에만 표시 */}
            {hasBid && myBidAmount && (
              <div className="p-4 bg-blue-100 rounded-lg border-l-4 border-blue-500 mb-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-medium text-blue-800 text-lg">나의 입찰 정보</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-600 block mb-1">입찰 유형</span>
                    <span className="font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded">{bidType === 'price' ? '가격 입찰' : '지원금 입찰'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">입찰 금액</span>
                    <span className="font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded">{typeof myBidAmount === 'number' ? myBidAmount.toLocaleString() : 0}원</span>
                  </div>
                  
                  {myBidRank && (
                    <div className="col-span-2 mt-2">
                      <span className="text-gray-600 block mb-1">입찰 순위</span>
                      <div className="flex items-center">
                        <span className="font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          전체 {myBidRank.total}개 중 <span className="text-red-600 font-bold mx-1">{myBidRank.rank}위</span>
                        </span>
                        {myBidRank.rank === 1 && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">현재 최고 입찰자</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">요금제: </span>
                  <span className="text-sm">{groupBuy.telecom_detail?.plan_info || groupBuy.product_details?.plan_info || '-'}</span>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => setShowBidModal(true)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    다시 입찰하기
                  </button>
                  <button
                    onClick={() => setShowBidHistoryModal(true)}
                    className="flex-1 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50"
                  >
                    입찰 기록 보기
                  </button>
                </div>
              </div>
            )}
            
            {/* 버튼 영역 */}
            {isSeller ? (
              // 판매회원용 입찰 인터페이스
              <div className="space-y-4 mb-4">
                {!hasBid && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h3 className="font-medium text-yellow-800 mb-1">판매회원 입찰 모드</h3>
                    <p className="text-sm text-yellow-700">입찰에 참여하여 공구 판매 기회를 얻으세요.</p>
                  </div>
                )}
                
                {/* 입찰 타입 표시 - 카테고리별로 하나만 표시 */}
                {!hasBid && (
                  <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                    <div className="text-sm font-medium">입찰 유형:</div>
                    <div className="text-sm font-medium px-3 py-1 bg-blue-600 text-white rounded-md">
                      {isTelecom ? '지원금 입찰' : '가격 입찰'}
                    </div>
                  </div>
                )}
                
                {/* 입찰 현황 및 내 순위 */}
                {(topBids.length > 0 || myBidRank) && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">현재 입찰 현황</h4>
                    
                    {/* 내 입찰 순위 표시 */}
                    {myBidRank && hasBid && (
                      <div className="mb-2 py-1 px-2 bg-blue-50 border border-blue-100 rounded">
                        <span className="text-sm font-medium text-blue-700">
                          {myBidRank.rank > 0 
                            ? `내 입찰 순위: 총 ${myBidRank.total}개 중 ${myBidRank.rank}위`
                            : `총 ${myBidRank.total}개의 입찰이 있습니다.`
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* 상위 입찰 리스트 */}
                    {topBids.length > 0 && (
                      <>
                        <div className="space-y-1">
                          {topBids.map((bid, index) => (
                            <div key={bid.id} className="flex justify-between text-sm">
                              <span className={`${bid.is_mine ? 'font-medium text-blue-600' : ''}`}>
                                {index + 1}위 {bid.is_mine && '(내 입찰)'}
                              </span>
                              <span>
                                {bid.is_mine 
                                  ? `${bid.amount.toLocaleString()}원` 
                                  : `${String(bid.amount)[0]}${'*'.repeat(String(Math.floor(bid.amount)).length - 1)},***원`}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">앞자리를 제외한 입찰가는 비공개입니다.</p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col w-full">
                  {/* 입찰 유형별 안내 문구 - 입력 필드 위로 이동 */}
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
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
                    </div>
                    
                    <button
                      onClick={handleBidClick}
                      disabled={isBidding || isCompleted}
                      className={`whitespace-nowrap py-2 px-4 rounded-lg font-medium ${
                        isCompleted 
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
                        '다시입찰하기'
                      ) : (
                        '입찰하기'
                      )}
                    </button>
                  </div>
                  
                  <div className="text-gray-500 text-sm mt-2">
                    앞자리를 제외한 입찰가는 비공개입니다.
                  </div>
                </div>
                
                {/* 입찰 취소 버튼 */}
                {hasBid && canCancelBid && (
                  <button
                    onClick={handleCancelBidClick}
                    className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                  >
                    입찰 취소하기
                  </button>
                )}
                
                <div className="text-xs text-gray-500">
                  <div>• 입찰 시 입찰권 1개가 소모됩니다.</div>
                  <div>• 최소 입찰 단위는 1,000원입니다.</div>
                  <div>• 입찰 취소는 입찰 마감 시간 이전에만 가능합니다.</div>
                  <div>• 중복 입찰 시 기존 입찰금액이 자동으로 수정됩니다.</div>
                </div>
              </div>
          ) : (
              // 일반회원용 참여 버튼
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setShowJoinModal(true);
                  } else {
                    toast.error('로그인이 필요합니다.');
                    // 카카오톡 브라우저에서는 자동 리다이렉트 비활성화
                    if (!isKakaoInAppBrowser) {
                      router.push('/login');
                    }
                  }
                }}
                disabled={isJoining || isCompleted || isParticipant}
                className={`w-full py-3 rounded-lg font-medium mb-4 ${isCompleted ? 'bg-gray-200 text-gray-500' : isParticipant ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isJoining ? '처리 중...' : isCompleted ? '마감된 공구입니다' : isParticipant ? '참여 완료' : '참여하기'}
              </button>
            )}

            {/* 생성자 전용 수정/관리 UI */}
            {isCreator && (
              <div className="bg-white p-4 mb-4 border-2 border-blue-500 rounded-lg">
                <h3 className="text-lg font-bold text-blue-700 mb-2">공구 관리</h3>
                <p className="text-sm text-gray-600 mb-4">내가 만든 공구를 관리할 수 있습니다.</p>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="default" 
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                    onClick={() => router.push(`/groupbuys/edit/${groupBuy.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> 공구 수정
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1"
                    onClick={() => router.push(`/mypage/seller/sales/${groupBuy.id}`)}
                  >
                    <Settings className="w-4 h-4 mr-1" /> 관리 페이지
                  </Button>
                </div>
                
                {/* 참여자가 본인 1명인 경우 특별 안내 */}
                {currentParticipants === 1 && (
                  <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-sm text-yellow-700">
                      현재 참여자가 본인 1명입니다. 더 많은 참여자를 모집하기 위해 공구를 공유해보세요!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
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
                  {isLeaving ? '처리 중...' : '공구 나가기'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={openLeaveDialog} onOpenChange={setOpenLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공구 나가기</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            정말 이 공구에서 나가시겠습니까? 나간 후에는 다시 참여할 수 있습니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroupBuy} disabled={isLeaving}>
              {isLeaving ? '처리 중...' : '공구 나가기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 탈퇴 제한 안내 팝업 */}
      <AlertDialog open={showLeaveRestrictionDialog} onOpenChange={setShowLeaveRestrictionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>탈퇴 불가 안내</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {leaveErrorMessage || '입찰이 진행되어 탈퇴가 불가합니다. 입찰 종료후 최종선택을 통해 진행여부를 결정해주세요.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 참여하기 모달 */}
      <JoinGroupBuyModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        groupBuy={groupBuy}
        onSuccess={() => {
          setIsParticipant(true);
          setCurrentParticipants(prev => prev + 1);
        }}
      />
      
      {/* 입찰하기 모달 */}
      <AlertDialog open={showBidModal} onOpenChange={setShowBidModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 확인</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="space-y-4">
            {typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원으로 입찰하시겠습니까?
            {hasBid && <span className="block mt-2 text-orange-600">이미 입찰하셨습니다. 기존 입찰금액이 수정됩니다.</span>}
          </AlertDialogDescription>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4 mt-4">
            <p className="font-medium">입찰 정보</p>
            <p className="text-sm mt-1">입찰 금액: {typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원</p>
            <p className="text-sm">입찰 유형: {bidType === 'price' ? '가격 입찰' : '지원금 입찰'}</p>
          </div>
          
          <p className="text-sm text-yellow-600 mb-4">입찰 시 입찰권 1개가 소모됩니다. 입찰 취소는 입찰 마감 시간 이전에만 가능합니다.</p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBidding}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBid}
              disabled={isBidding}
            >
              {isBidding ? '처리 중...' : '입찰하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 입찰 성공 모달 */}
      <AlertDialog open={showBidSuccessModal} onOpenChange={setShowBidSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 성공</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            입찰이 성공적으로 완료되었습니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 입찰 기록 보기 모달 */}
      <AlertDialog open={showBidHistoryModal} onOpenChange={setShowBidHistoryModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 기록</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            공구의 모든 입찰 내역입니다. 본인의 입찰은 실제 금액이 표시됩니다.
          </AlertDialogDescription>
          
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border-b">순위</th>
                  <th className="px-4 py-2 border-b">입찰자</th>
                  <th className="px-4 py-2 border-b">입찰 유형</th>
                  <th className="px-4 py-2 border-b">입찰 금액</th>
                  <th className="px-4 py-2 border-b">최종 가격</th>
                  <th className="px-4 py-2 border-b">본인 여부</th>
                </tr>
              </thead>
              <tbody>
                {topBids.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-4 text-gray-400">입찰 내역이 없습니다.</td></tr>
                ) : (
                  topBids.map((bid, idx) => (
                    <tr key={bid.id} className={bid.is_mine ? 'bg-blue-100 font-bold border-l-4 border-blue-500' : ''}>
                      <td className="px-4 py-2 border-b text-center">{idx + 1}</td>
                      <td className="px-4 py-2 border-b">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {bid.profile_image ? (
                              <>
                                <Image 
                                  src={bid.profile_image} 
                                  alt="프로필" 
                                  width={32} 
                                  height={32} 
                                  unoptimized={true}
                                  onError={(e) => {
                                    // 이미지 로드 오류 시 기본 아이콘으로 대체
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement?.querySelector('span')?.classList.remove('hidden');
                                  }}
                                />
                                <span className="text-xs hidden">👤</span>
                              </>
                            ) : (
                              <span className="text-xs">👤</span>
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {bid.username || '익명'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border-b text-center">{bid.bid_type === 'price' ? '가격 입찰' : '지원금 입찰'}</td>
                      <td className="px-4 py-2 border-b text-center">
                        {bid.is_mine 
                          ? <span className="text-blue-600">{bid.amount.toLocaleString()}원 <span className="ml-1 text-xs bg-blue-100 px-1 py-0.5 rounded">내 입찰</span></span>
                          : `${String(bid.amount)[0]}${'*'.repeat(String(Math.floor(bid.amount)).length - 1)},***원`}
                      </td>
                      <td className="px-4 py-2 border-b text-center">
                        {bid.bid_type === 'price' 
                          ? bid.amount.toLocaleString()
                          : (groupBuy.product_details?.base_price - bid.amount).toLocaleString()}
                        원
                      </td>
                      <td className="px-4 py-2 border-b text-center">
                        {bid.is_mine ? '예' : '아니오'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowBidHistoryModal(false)}>
              닫기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 입찰 완료 모달 */}
      <AlertDialog open={showBidCompleteModal} onOpenChange={setShowBidCompleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 완료</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-lg font-medium">입찰이 성공적으로 완료되었습니다.</div>
            </div>
            
            {isSeller && hasBid && myBidAmount !== null && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">판매회원 입찰 관리</h3>
                    <p className="text-sm font-medium text-green-600">입찰 완료</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">입찰 금액:</span>
                    <span className="text-sm font-medium">{typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="font-medium text-gray-900 mb-2">입찰 정보</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">입찰 상태:</p>
                  <p className="text-sm font-medium text-green-600">입찰 완료</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">입찰 금액:</p>
                  <p className="text-sm font-medium">{typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">입찰 유형:</p>
                  <p className="text-sm font-medium">{bidType === 'price' ? '가격 입찰' : '지원금 입찰'}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">입찰 시간:</p>
                  <p className="text-sm font-medium">{new Date().toLocaleString('ko-KR')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg mb-2">
              <p className="text-sm text-blue-800">
                입찰 금액은 상품의 최종 구매 금액에 영향을 줍니다. 필요시 재입찰을 통해 금액을 수정할 수 있습니다.
              </p>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => {
                setShowBidCompleteModal(false);
                // 잠시 후 입찰 모달 열기
                setTimeout(() => setShowBidModal(true), 100);
              }}>
              재입찰하기
            </Button>
            <AlertDialogAction className="w-full sm:w-auto">확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 입찰 취소 모달 */}
      <AlertDialog open={showBidCancelModal} onOpenChange={setShowBidCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 취소</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <p>입찰을 취소하시겠습니까?</p>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelBid}
              className="bg-red-600 hover:bg-red-700"
            >
              취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 입찰권 부족 팝업 */}
      <AlertDialog open={showNoBidTokenDialog} onOpenChange={setShowNoBidTokenDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-500" />
              입찰권이 부족합니다
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                입찰에 참여하려면 입찰권이 필요합니다.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                입찰권 1개당 1회 입찰이 가능하며, 
                입찰권은 마이페이지에서 구매할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">현재 보유 입찰권</p>
                <p className="text-lg font-bold text-orange-600">0개</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">입찰권 가격</p>
                <p className="text-sm font-medium">1개당 1,000원</p>
              </div>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel className="flex-1">취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowNoBidTokenDialog(false);
                router.push('/mypage/seller/bid-tokens');
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              입찰권 구매하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
