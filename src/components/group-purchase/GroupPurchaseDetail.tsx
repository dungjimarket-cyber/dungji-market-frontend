'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Users, Clock, Gavel, Share2, Info, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import JoinGroupBuyModal from '@/components/groupbuy/JoinGroupBuyModal';
import { getRegistrationTypeText } from '@/lib/groupbuy-utils';
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
  host_username?: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
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
  const [showJoinModal, setShowJoinModal] = useState(false); // 참여하기 모달 표시 여부
  const [bidAmount, setBidAmount] = useState<number | ''>(groupBuy.highest_bid_amount ? groupBuy.highest_bid_amount + 1000 : '');
  const [isBidding, setIsBidding] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBidSuccessModal, setShowBidSuccessModal] = useState(false);
  const [showBidCancelModal, setShowBidCancelModal] = useState(false);
  const [bidType, setBidType] = useState<'price' | 'subsidy'>(groupBuy.product_details?.category_name?.includes('휴대폰') ? 'subsidy' : 'price'); // 휴대폰은 지원금 입찰, 그 외는 가격 입찰
  const [hasBid, setHasBid] = useState(false); // 이미 입찰했는지 여부
  const [bidEndTime, setBidEndTime] = useState<Date | null>(null); // 입찰 마감 시간
  const [canCancelBid, setCanCancelBid] = useState(false); // 입찰 취소 가능 여부
  const [topBids, setTopBids] = useState<Array<{id: number, amount: string, is_mine: boolean}>>([]);  // 상위 5개 입찰 정보
  
  // 판매회원 여부 확인 - user_type 또는 role 속성 확인
  const [isSeller, setIsSeller] = useState(false);
  
  // 입찰 정보 가져오기 함수 - useCallback으로 메모이제이션
  const fetchBidInfo = useCallback(async () => {
    const groupBuyId = groupBuy?.id;
    if (!isAuthenticated || !accessToken || !groupBuyId) return;
    
    try {
      // 입찰 정보 API 호출
      const bidInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/bids/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!bidInfoResponse.ok) {
        throw new Error(`입찰 정보 조회 실패: ${bidInfoResponse.status}`);
      }
      
      const bidInfoData = await bidInfoResponse.json();
      console.log('입찰 정보 조회 결과:', bidInfoData);
      
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
      setCanCancelBid(now < endTime && hasMyBid);
      
      // 내 입찰 여부 확인
      setHasBid(!!bidInfoData.my_bid);
      
      // 상위 5개 입찰 정보 가져오기
      if (bidInfoData.top_bids && Array.isArray(bidInfoData.top_bids)) {
        setTopBids(bidInfoData.top_bids.map((bid: any) => ({
          id: bid.id,
          amount: bid.is_mine ? bid.amount.toLocaleString() : bid.amount.toString().replace(/\d/g, '*'),
          is_mine: bid.is_mine
        })).slice(0, 5));
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
  
  // 입찰금액 포맷팅 함수
  const formatCurrency = (value: number | string | '') => {
    if (value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString() + '원';
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
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
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
      
      // 페이지 새로고침하여 최신 데이터 반영 (짧은 지연 후)
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error('[GroupPurchaseDetail] 공구 참여 오류:', error);
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
  
  // 통화 관련 함수는 위에서 이미 정의되어 있음
  
  /**
   * 입찰하기 버튼 클릭
   */
  const handleBidClick = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      // 로그인 페이지로 이동
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
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
    if (!accessToken || !groupBuy?.id) return;
    
    try {
      // 실제 API 호출 구현
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/bid/cancel/`, {
        method: 'POST',
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
      // 실제 API 호출 구현
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/bid/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          amount: amountToSubmit,
          bid_type: bidType || 'price' // 'price' 또는 'subsidy'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || '입찰 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('입찰 결과:', data);
      const isDuplicate = data.is_duplicate || false; // 중복 입찰 여부
      
      setShowBidModal(false);
      setShowBidSuccessModal(true);
      setHasBid(true);
      
      // 입찰 후 입찰 정보 다시 가져오기
      fetchBidInfo();
      
      if (isDuplicate) {
        toast.success('수정 입찰 되었습니다.');
      } else {
        toast.success('입찰이 완료되었습니다.');
      }
      
      // 새로고침하여 최신 정보 가져오기
      router.refresh();
    } catch (error) {
      console.error('입찰 오류:', error);
      toast.error('입찰 중 오류가 발생했습니다.');
    } finally {
      setIsBidding(false);
    }
  };
  
  /**
   * 입찰금액 입력 처리
   */
  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setBidAmount('');
      return;
    }
    
    // 숫자만 추출
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setBidAmount('');
      return;
    }
    
    const parsedValue = parseInt(numericValue, 10);
    setBidAmount(parsedValue);
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
                  <p className="text-sm font-medium">
                    {groupBuy.host_username || groupBuy.creator_name || groupBuy.creator?.username || '익명'}
                  </p>
                  <p className="text-xs text-gray-500">공구 방장</p>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Info className="w-3 h-3 mr-1" />
                <span>신고하기</span>
              </div>
            </div>

            {/* 버튼 영역 */}
            {isSeller ? (
              // 판매회원용 입찰 인터페이스
              <div className="space-y-4 mb-4">
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-800 mb-1">판매회원 입찰 모드</h3>
                  <p className="text-sm text-yellow-700">입찰에 참여하여 공구 판매 기회를 얻으세요.</p>
                </div>
                
                {/* 입찰 타입 선택 */}
                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                  <div className="text-sm font-medium">입찰 유형:</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBidType('price')}
                      className={`px-3 py-1 text-sm rounded-md ${bidType === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      가격 입찰
                    </button>
                    <button
                      onClick={() => setBidType('subsidy')}
                      className={`px-3 py-1 text-sm rounded-md ${bidType === 'subsidy' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      지원금 입찰
                    </button>
                  </div>
                </div>
                
                {/* 상위 입찰 정보 */}
                {topBids.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">현재 입찰 현황 (상위 5개)</h4>
                    <div className="space-y-1">
                      {topBids.map((bid, index) => (
                        <div key={bid.id} className="flex justify-between text-sm">
                          <span className={`${bid.is_mine ? 'font-medium text-blue-600' : ''}`}>
                            {index + 1}위 {bid.is_mine && '(내 입찰)'}
                          </span>
                          <span>{bid.amount}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">앞자리를 제외한 입찰가는 비공개입니다.</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={typeof bidAmount === 'number' ? formatCurrency(bidAmount) : bidAmount}
                      onChange={(e) => handleBidAmountChange(e)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder={`${bidType === 'subsidy' ? '지원금' : '가격'} 입력 (원)`}
                    />
                  </div>
                  <button
                    onClick={handleBidClick}
                    disabled={isBidding || isCompleted}
                    className={`py-2 px-4 rounded-lg font-medium ${
                      isCompleted 
                        ? 'bg-gray-200 text-gray-500' 
                        : isBidding
                        ? 'bg-gray-400 text-white'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {isBidding ? '처리 중...' : '입찰하기'}
                  </button>
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
                  <p>• 입찰 시 입찰권 1개가 소모됩니다.</p>
                  <p>• 최소 입찰 단위는 1,000원입니다.</p>
                  <p>• 입찰 취소는 입찰 마감 시간 이전에만 가능합니다.</p>
                  <p>• 중복 입찰 시 기존 입찰금액이 자동으로 수정됩니다.</p>
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
                    router.push('/login');
                  }
                }}
                disabled={isJoining || isCompleted || isParticipant}
                className={`w-full py-3 rounded-lg font-medium mb-4 ${
                  isCompleted 
                    ? 'bg-gray-200 text-gray-500' 
                    : isParticipant
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isJoining ? '처리 중...' : isCompleted ? '마감된 공구입니다' : isParticipant ? '참여 완료' : '참여하기'}
              </button>
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
      
      {/* 참여하기 모달 */}
      <JoinGroupBuyModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        groupBuy={groupBuy}
      />
      
      {/* 입찰하기 모달 */}
      <AlertDialog open={showBidModal} onOpenChange={setShowBidModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입찰 확인</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <p className="mb-4">
              {typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원으로 입찰하시겠습니까?
              {hasBid && <span className="block mt-2 text-orange-600">이미 입찰하셨습니다. 기존 입찰금액이 수정됩니다.</span>}
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="font-medium">입찰 정보</p>
              <p className="text-sm mt-1">입찰 금액: {typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원</p>
              <p className="text-sm">입찰 유형: {bidType === 'price' ? '가격 입찰' : '지원금 입찰'}</p>
            </div>
            <p className="text-sm text-yellow-600">입찰 시 입찰권 1개가 소모됩니다. 입찰 취소는 입찰 마감 시간 이전에만 가능합니다.</p>
          </AlertDialogDescription>
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
            <AlertDialogTitle>입찰 완료</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <p className="mb-4">입찰이 성공적으로 완료되었습니다.</p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium">입찰 정보</p>
              <p className="text-sm mt-1">입찰 금액: {typeof bidAmount === 'number' ? bidAmount.toLocaleString() : ''}원</p>
              <p className="text-sm">입찰 유형: {bidType === 'price' ? '가격 입찰' : '지원금 입찰'}</p>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
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
    </div>
  );
}
