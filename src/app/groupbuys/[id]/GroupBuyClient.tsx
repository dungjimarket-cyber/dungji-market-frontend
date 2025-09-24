'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCarrierDisplay, getSubscriptionTypeDisplay, getPlanDisplay } from '@/lib/telecom-utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Info, Share2, PlusCircle, History, Edit, Settings, Zap, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GroupBuyActionButton from '@/components/groupbuy/GroupBuyActionButton';
import GroupBuyActionButtons from '@/components/groupbuy/GroupBuyActionButtons';
import BidModal from '@/components/groupbuy/BidModal';
import BidHistoryModal from '@/components/groupbuy/BidHistoryModal';
import { FinalDecisionModal } from '@/components/groupbuy/FinalDecisionModal';
import { WishButton } from '@/components/ui/WishButton';
import { calculateGroupBuyStatus, getStatusText, getStatusClass, getRemainingTime, formatGroupBuyTitle, getRegistrationTypeText } from '@/lib/groupbuy-utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { tokenUtils } from '@/lib/tokenUtils';
import { useState, useEffect, useCallback } from 'react';
import { GroupBuy, ParticipationStatus } from '@/types/groupbuy';
import { useToast } from '@/components/ui/use-toast';
import { getGroupBuyBids, getSellerBids } from '@/lib/api/bidService';
import bidTokenService from '@/lib/bid-token-service';

// 총 지원금 마스킹 함수
function maskSupportAmount(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0';
  const amountStr = amount.toString();
  if (amountStr.length <= 2) return amountStr;
  return `${amountStr[0]}${'*'.repeat(amountStr.length - 2)}${amountStr[amountStr.length - 1]}`;
}

interface GroupBuyClientProps {
  groupBuy: GroupBuy;
  id: string;
  isCreator?: boolean;
  participationStatus?: any;
}

export default function GroupBuyClient({ groupBuy, id, isCreator: propIsCreator, participationStatus: propParticipationStatus }: GroupBuyClientProps) {
  console.log('GroupBuyClient 렌더링:', {
    groupBuyId: groupBuy?.id,
    groupBuyStatus: groupBuy?.status,
    id: id
  });
  
  const { user, isAuthenticated, accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // 프로필 체크 Hook 사용
  const { 
    checkProfile, 
    showProfileModal, 
    setShowProfileModal, 
    missingFields,
    clearCache 
  } = useProfileCheck();
  
  const [participationStatus, setParticipationStatus] = useState<any>(propParticipationStatus || null);
  const [groupBuyState, setGroupBuyState] = useState<GroupBuy>(groupBuy);
  const [loading, setLoading] = useState(true);
  
  // 참여 상태 및 공구 정보 새로고침 함수
  const refreshParticipationStatus = useCallback(async () => {
    if (!id || !accessToken) return;
    
    try {
      setLoading(true);
      // 참여 상태 확인 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/check_participation/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('참여 상태 새로고침 결과:', data);
        setParticipationStatus(data);
      }
      
      // 공구 정보 새로고침 (현재 참여자 수 등 업데이트)
      const groupBuyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/`);
      
      if (groupBuyResponse.ok) {
        const groupBuyData = await groupBuyResponse.json();
        
        // 공구 정보 업데이트 (참여자 수 등)
        if (groupBuyData) {
          console.log('공구 정보 새로고침:', {
            current: groupBuyState.current_participants,
            new: groupBuyData.current_participants
          });
          
          // 전체 객체를 업데이트하지 않고 필요한 필드만 업데이트
          setGroupBuyState(prevState => ({
            ...prevState,
            current_participants: groupBuyData.current_participants,
            // 필요한 다른 필드도 업데이트
          }));
        }
      }
    } catch (error) {
      console.error('참여 상태 또는 공구 정보 새로고침 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken, groupBuyState]);
  
  // 입찰 관련 상태
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [hasBidTokens, setHasBidTokens] = useState<boolean | null>(null); // null = loading
  const [isBidHistoryModalOpen, setIsBidHistoryModalOpen] = useState(false);
  const [hasBid, setHasBid] = useState(false);
  const [bidData, setBidData] = useState<any[]>([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [isValidBidStatus, setIsValidBidStatus] = useState(true); // 입찰 가능한 공구 상태인지 확인
  const [sellerCount, setSellerCount] = useState(0); // 판매자 회원 수 추적
  
  // 판매회원(셀러) 여부 확인
  const [isSeller, setIsSeller] = useState(false);
  
  // 최종선택 모달 상태
  const [isFinalDecisionModalOpen, setIsFinalDecisionModalOpen] = useState(false);
  const [hasWinningBid, setHasWinningBid] = useState(false);
  const [winningBidInfo, setWinningBidInfo] = useState<any>(null);
  
  // 자신이 생성한 공구인지 확인하는 상태 추가
  const [isCreator, setIsCreator] = useState<boolean>(!!propIsCreator);
  
  // 인증 상태가 초기화된 후 생성자 여부 계산
  useEffect(() => {
    if (isAuthenticated && user?.id && groupBuy?.creator) {
      // 두 값을 모두 문자열로 변환하여 비교
      const userId = String(user.id);
      const creatorId = String(groupBuyState?.creator || '');
      
      // 디버깅 로그
      console.log('공구 생성자 체크:', {
        propIsCreator,
        userId,
        userIdType: typeof userId,
        creatorId,
        creatorIdType: typeof creatorId,
        isMatch: userId === creatorId
      });
      
      // 생성자 여부 업데이트
      setIsCreator(propIsCreator || userId === creatorId);
    }
  }, [isAuthenticated, user?.id, groupBuy?.creator, propIsCreator]);
  
  useEffect(() => {
    // 사용자 권한 확인
    const checkSellerRole = async () => {
      console.log('그룹구매 상세 페이지 인증 상태:', {
        isAuthenticated,
        user,
        roles: user?.roles,
        id: user?.id,
        penalty_info: user?.penalty_info,
        penaltyInfo: user?.penaltyInfo
      });
      
      // 패널티 정보 디버깅
      console.log('🔴 GroupBuyClient - User penalty info check:', {
        penalty_info: user?.penalty_info,
        penaltyInfo: user?.penaltyInfo,
        is_active_snake: user?.penalty_info?.is_active,
        is_active_camel: user?.penaltyInfo?.isActive
      });
      
      // 1. 사용자 객체에서 역할 정보 확인
      let isSellerFromUserObj = false;
      
      if (isAuthenticated && user) {
        // 여러 방식으로 판매회원 여부 확인
        const hasSellerRole = user.role === 'seller';
        const hasSellerInRoles = Array.isArray(user.roles) && user.roles.includes('seller');
        isSellerFromUserObj = hasSellerRole || hasSellerInRoles;
      }
      
      // 2. JWT 토큰에서 직접 역할 확인
      let isSellerFromJwt = false;
      if (accessToken) {
        isSellerFromJwt = await tokenUtils.hasRole('seller');
      }
      
      // 3. 로컬 스토리지에서 역할 확인
      let isSellerFromStorage = false;
      if (typeof window !== 'undefined') {
        try {
          // 로컬 스토리지에서 사용자 정보 확인
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // 역할 확인
            const hasSellerRole = parsedUser.role === 'seller';
            const hasSellerInRoles = Array.isArray(parsedUser.roles) && parsedUser.roles.includes('seller');
            // seller@test.com 계정 확인
            const isSellerEmail = parsedUser.email === 'seller@test.com';
            
            isSellerFromStorage = hasSellerRole || hasSellerInRoles || isSellerEmail;
            
            console.log('로컬 스토리지 사용자 확인:', {
              hasSellerRole,
              hasSellerInRoles,
              isSellerEmail,
              user: parsedUser
            });
          }
          
          // 특별 플래그 확인
          const isSeller = localStorage.getItem('isSeller');
          if (isSeller === 'true') {
            console.log('판매회원 플래그 확인');
            isSellerFromStorage = true;
          }
          
          // 직접 사용자 역할 확인
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'seller') {
            console.log('로컬 스토리지 userRole 확인');
            isSellerFromStorage = true;
          }
        } catch (error) {
          console.error('로컬 스토리지에서 사용자 정보 파싱 오류:', error);
        }
      }
      
      // 종합적으로 판매회원 여부 확인
      const isSeller = isSellerFromUserObj || isSellerFromJwt || isSellerFromStorage;
      
      console.log('그룹구매 페이지 판매회원 확인 결과:', {
        isSellerFromUserObj,
        isSellerFromJwt,
        isSellerFromStorage,
        userRole: user?.role,
        userRoles: user?.roles,
        isSeller
      });
      
      // 상태 업데이트
      setIsSeller(isSeller);
    };
    
    // 사용자 인증 정보 초기화 및 역할 확인 완료 후 작업 수행
    checkSellerRole();
    
    // 참여 상태 확인
    const fetchParticipationStatus = async () => {
      // 이미 서버에서 참여 상태를 받았다면 호출 안함
      if (propParticipationStatus) {
        setLoading(false);
        return;
      }
      
      try {
        if (isAuthenticated && accessToken) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/check_participation/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setParticipationStatus(data);
          }
        }
      } catch (error) {
        console.error('참여 상태 확인 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSellerRole();
    fetchParticipationStatus();
  }, [id, isAuthenticated, accessToken, user]);
  
  useEffect(() => {
    if (groupBuyState && groupBuyState.id) {
      // 판매자 수 확인
      checkSellerCount(groupBuyState.id);
      
      if (isSeller) {
        checkSellerBid();
        checkBidTokens();
      }
    }
  }, [isSeller, groupBuy?.id]);

  // v3.0: groupBuyState가 변경될 때 입찰 가능 상태 체크
  useEffect(() => {
    if (groupBuyState && groupBuyState.status) {
      // recruiting 상태에서 입찰 가능 (v3.0: bidding 상태 제거)
      const canBid = groupBuyState.status === 'recruiting';
      setIsValidBidStatus(canBid);
      console.log('입찰 가능 상태 체크:', {
        status: groupBuyState.status,
        canBid: canBid
      });
    }
  }, [groupBuyState?.status]);
  
  // 판매자 이용권 보유 여부 확인
  const checkBidTokens = async () => {
    if (!isSeller) {
      setHasBidTokens(false);
      return;
    }

    try {
      const hasTokens = await bidTokenService.hasAvailableBidTokens();
      setHasBidTokens(hasTokens);
    } catch (error) {
      console.error('이용권 확인 중 오류:', error);
      setHasBidTokens(false);
    }
  };
  
  // 판매자가 현재 공구에 입찰 이력이 있는지 확인
  const checkSellerBid = async () => {
    if (!isSeller || !groupBuy?.id) {
      setHasBid(false);
      return;
    }

    try {
      setIsLoadingBids(true);
      // 판매자의 입찰 목록 조회
      const bids = await getSellerBids();
      
      // 현재 공구에 대한 입찰이 있는지 확인
      const existingBid = bids.find((bid: any) => 
        bid.groupbuy === groupBuyState?.id && 
        bid.status === 'pending'
      );
      
      setHasBid(!!existingBid);
      setBidData(bids.filter((bid: any) => bid.groupbuy === groupBuyState?.id));
    } catch (error) {
      console.error('입찰 이력 확인 중 오류:', error);
      setHasBid(false);
      setBidData([]);
    } finally {
      setIsLoadingBids(false);
    }
  };

  /**
   * 판매자가 해당 공구에 입찰했는지 확인
   */
  const checkSellerBidStatus = async (groupBuyId: number) => {
    try {
      setIsLoadingBids(true);
      const bids = await getGroupBuyBids(groupBuyId);
      setBidData(bids);
      
      // 사용자가 해당 공구에 입찰했는지 확인
      // user.id 를 number로 변환하여 비교
      const userId = user?.id ? Number(user.id) : 0;
      if (userId > 0 && bids.some(bid => 
        (bid.seller_id !== undefined && Number(bid.seller_id) === userId) || 
        (bid.seller !== undefined && Number(bid.seller) === userId)
      )) {
        setHasBid(true);
      } else {
        setHasBid(false);
      }
    } catch (error) {
      console.error('입찰 상태 확인 오류:', error);
    } finally {
      setIsLoadingBids(false);
    }
  };
  
  /**
   * 판매자가 낙찰된 입찰을 가지고 있는지 확인
   */
  const checkWinningBidStatus = useCallback(async () => {
    try {
      const token = await tokenUtils.getAccessToken();
      if (!token || !groupBuyState?.id) return;
      
      console.log('checkWinningBidStatus 시작, groupBuy ID:', Number(id));
      
      // 판매자의 최종선택 대기중인 입찰 조회
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/final-selection/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('낙찰 입찰 데이터:', data);
        console.log('찾고 있는 groupbuy ID:', Number(id));
        
        // 현재 공구의 낙찰된 입찰 찾기
        const winningBid = data.find((bid: any) => bid.groupbuy === Number(id));
        
        if (winningBid) {
          console.log('낙찰 입찰 찾음:', winningBid);
          setHasWinningBid(true);
          setWinningBidInfo(winningBid);
        } else {
          console.log('현재 공구의 낙찰 입찰을 찾을 수 없음');
        }
      }
    } catch (error) {
      console.error('낙찰 입찰 확인 오류:', error);
    }
  }, [groupBuyState?.id, id]);
  
  /**
   * 해당 공구에 참여한 판매자 수 확인
   */
  const checkSellerCount = async (groupBuyId: number) => {
    try {
      setIsLoadingBids(true);
      const bids = await getGroupBuyBids(groupBuyId);
      
      // 판매자 ID를 Set으로 수집하여 중복 제거 (한 판매자가 여러 번 입찰할 수 있으므로)
      const uniqueSellerIds = new Set();
      
      bids.forEach(bid => {
        if (bid.seller_id) {
          uniqueSellerIds.add(Number(bid.seller_id));
        } else if (bid.seller) {
          uniqueSellerIds.add(Number(bid.seller));
        }
      });
      
      // 판매자 수 업데이트
      setSellerCount(uniqueSellerIds.size);
      console.log('판매자 수 확인:', uniqueSellerIds.size);
    } catch (error) {
      console.error('판매자 수 확인 오류:', error);
      setSellerCount(0);
    } finally {
      setIsLoadingBids(false);
    }
  };

  useEffect(() => {
    const checkSeller = async () => {
      console.log('checkSeller 실행:', {
        isAuthenticated,
        userRole: user?.role,
        groupBuyId: groupBuy?.id,
        groupBuyStatus: groupBuy?.status
      });
      
      if (!isAuthenticated || !user) return;
      
      // 판매자 확인 로직
      if (user.role === 'seller') {
        setIsSeller(true);
        
        // 판매자가 이미 입찰했는지 확인 (API 호출 추가 필요)
        if (groupBuy?.id) {
          await checkSellerBidStatus(groupBuy.id);
          
          // 판매자 최종선택 상태인 경우 낙찰 여부 확인
          if (groupBuy.status === 'final_selection_seller') {
            console.log('판매자 최종선택 상태 확인, checkWinningBidStatus 호출');
            await checkWinningBidStatus();
          }
        }
      }
    };
    
    checkSeller();
  }, [isAuthenticated, user, groupBuy?.id, groupBuy?.status]);
  
  // 참여자 진행률
  const participantProgress = groupBuyState?.max_participants
    ? (groupBuyState.current_participants / groupBuyState.max_participants) * 100
    : 0;
  
  // 시간 진행률 계산 (100에서 시작해서 0으로 감소)
  const calculateTimeProgress = () => {
    if (!groupBuyState?.start_time || !groupBuyState?.end_time) return 100;
    
    const now = new Date();
    const start = new Date(groupBuyState.start_time);
    const end = new Date(groupBuyState.end_time);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    if (elapsed >= totalDuration) return 0;
    if (elapsed <= 0) return 100;
    
    // 남은 시간의 비율 (100에서 0으로 감소)
    return Math.round(((totalDuration - elapsed) / totalDuration) * 100);
  };
  
  const [timeProgress, setTimeProgress] = useState(100);
  
  useEffect(() => {
    if (!groupBuyState?.start_time || !groupBuyState?.end_time) return;
    
    const updateProgress = () => {
      setTimeProgress(calculateTimeProgress());
    };
    
    updateProgress();
    const interval = setInterval(updateProgress, 60000); // 1분마다 업데이트
    
    return () => clearInterval(interval);
  }, [groupBuyState?.start_time, groupBuyState?.end_time]);
  const remainingSpots = groupBuyState?.max_participants && groupBuyState?.current_participants
    ? groupBuyState.max_participants - groupBuyState.current_participants
    : 0;
  
  // 공구 상태를 동적으로 계산
  const calculatedStatus = groupBuyState 
    ? calculateGroupBuyStatus(groupBuyState.status, groupBuyState.start_time, groupBuyState.end_time)
    : 'recruiting';
  const isRecruiting = calculatedStatus === 'recruiting';
  const isFull = remainingSpots === 0;
  const isClosed = !isRecruiting || isFull;
  const remainingTime = groupBuyState?.end_time ? getRemainingTime(groupBuyState.end_time) : '';
  
  // 지원금은 입찰 시 사용자가 제안하는 금액으로, 공구에 입찰된 최고 지원금을 표시
  // 실제로는 Bid 모델에서 가져와야 하지만, 현재는 임의의 값을 사용
  const maskedSupportAmount = maskSupportAmount(300000); // 임의의 값으로 대체

  if (loading || !groupBuyState) {
    return (
      <div className="bg-gray-100 min-h-screen pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-8">
      {/* 헤더 */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <Link href="/" className="mr-2">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-medium">같이 견적받기</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">같이 더 좋은 조건으로 견적받으세요</p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto">
        {/* 상품 정보 카드 */}
        <div className="bg-white p-4 mb-4">
          {/* 상품 이미지 */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <Image
              src={groupBuyState?.product_details?.image_url || '/placeholder.png'}
              alt={groupBuyState?.product_details?.name || ''}
              width={400}
              height={400}
              className="object-cover rounded-lg"
            />
          </div>

          {/* 상품 기본 정보 */}
          {(groupBuyState?.product_details?.category_name === '인터넷' || groupBuyState?.product_details?.category_name === '인터넷+TV') ? (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">통신사별 요금제 확인하기</p>
              <a
                href="https://www.bworld.co.kr/product/internet/charge.do?menu_id=P02010000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <span>SK브로드밴드 요금제</span>
                <span className="ml-2">→</span>
              </a>
              <p className="text-sm text-gray-700 mt-3">{groupBuyState?.product_details?.telecom_detail?.contract_info || '2년 약정 기본 상품입니다'}</p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">기기 출고가</span>
                <span className="text-base font-medium text-gray-900">
                  {new Intl.NumberFormat('ko-KR').format(groupBuyState?.product_details?.base_price || 0)}원
                </span>
              </div>
              <p className="text-xs text-gray-500">{groupBuyState?.product_details?.telecom_detail?.contract_info || '2년 약정 기본 상품입니다'}</p>
            </div>
          )}

          {/* 총 지원금 정보 */}
          <div className="mb-4">
            <p className="text-sm font-medium">총 지원금(공시지원금+추가지원금)</p>
            <p className="text-lg font-bold text-red-500">{maskedSupportAmount || '0'}원</p>
            <p className="text-xs text-gray-500">*유심서비스나 카드결제를 제외한 순수 지원금입니다.</p>
          </div>
        </div>

        {/* 공구 참여 정보 카드 */}
        <div className="bg-white p-4 mb-4">
          {/* 지역 정보를 제목 위에 표시 */}
          {groupBuyState?.regions && groupBuyState.regions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {groupBuyState.regions.map((region, index) => (
                <span key={index} className="text-amber-600 text-sm font-medium">
                  [{region.name}]
                </span>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mb-4">
            <div>
              <CardTitle className="text-2xl">
                {formatGroupBuyTitle(groupBuy, false)}
              </CardTitle>
              
              {/* 참여중 표시 - 본인이 참여중인 경우에만 */}
              {participationStatus?.is_participating && (
                <div className="flex items-center mt-1 mb-1 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">✨</span>
                    <span className="text-red-500 text-xs font-medium">참여중</span>
                  </div>
                </div>
              )}
              
              {/* 통신사, 가입유형 정보 - 공구 목록 스타일로 */}
              {/* 휴대폰 상품 정보 */}
              {groupBuy.telecom_detail && groupBuy.product_info?.category_detail_type === 'telecom' && (
                <div className="flex items-center gap-2 mt-4">
                  {/* 통신사 표시 - 흰색 배경 */}
                  {groupBuy.telecom_detail.telecom_carrier && (
                    <div className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-400 rounded-lg min-h-[60px]">
                      {(() => {
                        const carrier = groupBuy.telecom_detail.telecom_carrier;

                        switch(carrier) {
                          case 'SKT':
                            return (
                              <Image
                                src="/logos/skt.png"
                                alt="SKT"
                                width={76}
                                height={56}
                                className="object-contain"
                              />
                            );
                          case 'KT':
                            return (
                              <Image
                                src="/logos/kt.png"
                                alt="KT"
                                width={76}
                                height={44}
                                className="object-contain"
                              />
                            );
                          case 'LGU':
                          case 'LG U+':
                          case 'LGU+':
                            return (
                              <Image
                                src="/logos/lgu.png"
                                alt="LG U+"
                                width={112}
                                height={44}
                                className="object-contain"
                              />
                            );
                          default:
                            return (
                              <span className="text-2xl font-bold text-gray-700">{carrier}</span>
                            );
                        }
                      })()}
                    </div>
                  )}

                  {/* 가입유형 */}
                  {groupBuy.telecom_detail.subscription_type && (
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-400 rounded-lg min-h-[60px]">
                      <span className="text-2xl font-bold text-purple-800">
                        {groupBuy.telecom_detail.subscription_type_korean || getSubscriptionTypeDisplay(groupBuy.telecom_detail.subscription_type)}
                      </span>
                    </div>
                  )}

                  {/* 요금제 */}
                  {groupBuy.telecom_detail.plan_info && (
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-lg min-h-[60px]">
                      <span className="text-2xl font-bold text-green-800">
                        {getPlanDisplay(groupBuy.telecom_detail.plan_info)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* 인터넷/TV 상품 정보 */}
              {groupBuy.internet_detail && (groupBuy.product_info?.category_detail_type === 'internet' ||
                                              groupBuy.product_info?.category_detail_type === 'internet_tv') && (
                <div className="flex items-center gap-2 mt-4">
                  {/* 통신사 표시 */}
                  {groupBuy.internet_detail.carrier_display && (
                    <div className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-400 rounded-lg min-h-[60px]">
                      {(() => {
                        const carrier = groupBuy.internet_detail.carrier_display;

                        switch(carrier) {
                          case 'SK브로드밴드':
                          case 'SKT':
                            return (
                              <Image
                                src="/logos/sk-broadband.png"
                                alt="SK브로드밴드"
                                width={84}
                                height={56}
                                className="object-contain"
                              />
                            );
                          case 'KT':
                            return (
                              <Image
                                src="/logos/kt.png"
                                alt="KT"
                                width={76}
                                height={44}
                                className="object-contain"
                              />
                            );
                          case 'LG U+':
                          case 'LGU':
                            return (
                              <Image
                                src="/logos/lgu.png"
                                alt="LG U+"
                                width={112}
                                height={44}
                                className="object-contain"
                              />
                            );
                          default:
                            return (
                              <span className="text-2xl font-bold text-gray-700">{carrier}</span>
                            );
                        }
                      })()}
                    </div>
                  )}

                  {/* 가입유형 */}
                  {groupBuy.internet_detail.subscription_type_display && (
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-400 rounded-lg min-h-[60px]">
                      <span className="text-2xl font-bold text-purple-800">
                        {groupBuy.internet_detail.subscription_type_display}
                      </span>
                    </div>
                  )}
                  
                  {/* 속도 */}
                  {groupBuy.internet_detail.speed && (
                    <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg h-11">
                      <span className="text-sm font-bold text-blue-800">
                        {groupBuy.internet_detail.speed}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {groupBuyState?.product_details?.release_date && (
                <div className="text-sm text-gray-500 mt-2">출시일: {new Date(groupBuyState.product_details.release_date).toLocaleDateString('ko-KR')}</div>
              )}
            </div>
            <div className="flex flex-col">
              <div>
                <p className="text-sm text-gray-500">공구 참여인원</p>
                <p className="font-bold">{groupBuy.current_participants}/{groupBuy.max_participants}명</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">남은 시간</p>
                <p className="font-bold text-red-500">{remainingTime}</p>
              </div>
            </div>
          </div>

          {/* 진행 상황 바 - 시간 기준으로 우측에서 좌측으로 감소 */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div 
              className="absolute top-0 right-0 h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${timeProgress}%` }}
            />
          </div>
          
          {/* 총 입찰 건수 */}
          <div className="flex justify-between items-center text-sm mb-4">
            <p>총 입찰 건수</p>
            <p className="font-bold">{groupBuy.current_participants * 2 || 23}건</p>
          </div>

          {/* 현재 최고가 */}
          <div className="flex justify-between items-center text-sm">
            <p>현재 최고가</p>
            <p className="font-bold">{maskedSupportAmount || '0'}원</p>
          </div>
          
          {/* 요금제 정보 - 하단에 별도 표시 (휴대폰만) */}
          {groupBuy.telecom_detail?.plan_info &&
           groupBuy.product_details?.category_name !== '인터넷' &&
           groupBuy.product_details?.category_name !== '인터넷+TV' && (
            <>
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-700">희망요금제</span>
                  <span className="text-base font-bold text-green-900">
                    {getPlanDisplay(groupBuy.telecom_detail.plan_info)}
                  </span>
                </div>
              </div>

              {/* 9~10만원대 요금제 안내 */}
              {(groupBuy.telecom_detail.plan_info === '5G_special' ||
                groupBuy.telecom_detail.plan_info === '5G_platinum') && (
                <div className="mt-2 p-2.5 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">
                        최고지원금 도전 가능
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">
                          4~6개월 필수유지
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 생성자 전용 수정/관리 UI */}
        {isCreator && (
          <div className="bg-white p-4 mb-4 border-2 border-blue-500 rounded-lg">
            <h3 className="text-lg font-bold text-blue-700 mb-2">공구 관리</h3>
            <p className="text-sm text-gray-600 mb-4">내가 만든 공구를 관리할 수 있습니다.</p>
            
            <div className="flex space-x-2">
              {/* 공구 수정 기능 사용 안함
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 flex-1"
                onClick={() => router.push(`/group-purchases/edit/${id}`)}
              >
                <Edit className="w-4 h-4 mr-1" /> 공구 수정
              </Button>
              */}
              
              <Button 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full"
                onClick={() => router.push(`/mypage/seller/sales/${id}`)}
              >
                <Settings className="w-4 h-4 mr-1" /> 관리 페이지
              </Button>
            </div>
            
            {/* 참여자가 본인 1명인 경우 특별 안내 */}
            {groupBuy.current_participants === 1 && (
              <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                <Info className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm text-yellow-700">
                  현재 참여자가 본인 1명입니다. 더 많은 참여자를 모집하기 위해 공구를 공유해보세요!
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-yellow-700 hover:bg-yellow-100 mt-2 w-full"
                    onClick={() => {
                      // 공유 기능 구현
                      if (navigator.share) {
                        navigator.share({
                          title: formatGroupBuyTitle(groupBuy, false),
                          text: `${formatGroupBuyTitle(groupBuy, false)} 공구에 참여해보세요!`,
                          url: window.location.href
                        })
                        .catch(error => console.error('공유 오류:', error));
                      } else {
                        // 클립보드에 복사
                        navigator.clipboard.writeText(window.location.href)
                          .then(() => {
                            toast({
                              title: '링크 복사 완료',
                              description: '공구 링크가 클립보드에 복사되었습니다.'
                            });
                          })
                          .catch(error => console.error('클립보드 복사 오류:', error));
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-1" /> 공구 공유하기
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {/* 알림 메시지 */}
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-700">
          앞자리를 제외한 견적금액은 비공개 처리됩니다
          </AlertDescription>
        </Alert>

        {/* 가이드라인 */}
        <Alert className="bg-yellow-50 border-yellow-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm text-yellow-700">
            <a href="https://doongji-market-1vi5n3i.gamma.site/" target="_blank" rel="noopener noreferrer" className="underline">
              이용 가이드
            </a>
          </AlertDescription>
        </Alert>

        {/* 판매회원용 입찰 UI */}
        {isSeller && (
          <div className="bg-white p-4 mb-4 border-2 border-green-500 rounded-lg">
            <h3 className="text-lg font-bold text-green-700 mb-2">판매회원 입찰 관리</h3>
            
            {/* 낙찰 실패 메시지 - 입찰했지만 다른 판매자가 낙찰된 경우 */}
            {hasBid && !hasWinningBid && groupBuyState?.status && 
             ['final_selection_buyers', 'final_selection_seller', 'in_progress', 'completed'].includes(groupBuyState.status) && (
              <Alert className="bg-red-50 border-red-200 mb-4">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  아쉽지만 낙찰되지 못했어요. 다음 공구에서 더 좋은 조건으로 입찰해보세요!
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-gray-600 mb-4">이 공구에 입찰하여 고객을 유치하세요.</p>
            
            <div className="flex justify-between mb-4">
              <div className="relative w-full">
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700 w-full mb-2"
                  onClick={async () => {
                    // 프로필 체크 먼저 수행
                    console.log('[GroupBuyClient] 견적 제안하기 버튼 클릭, 프로필 체크 시작');
                    const isProfileComplete = await checkProfile();
                    console.log('[GroupBuyClient] 프로필 체크 결과:', isProfileComplete);
                    
                    if (!isProfileComplete) {
                      console.log('[GroupBuyClient] 프로필 미완성, 모달 표시');
                      setShowProfileModal(true);
                      return;
                    }
                    
                    // 마감된 공구인 경우 입찰 불가 토스트 메시지 표시
                    if (isClosed) {
                      toast({
                        variant: 'destructive',
                        title: '입찰 불가',
                        description: `다음 상황으로 인해 입찰할 수 없습니다:
- ${calculatedStatus === 'expired' ? '공구 기간이 마감되었습니다.' : ''}
- ${calculatedStatus === 'completed' ? '공구가 완료되었습니다.' : ''}
- ${isFull ? '공구 인원이 다 차었습니다.' : ''}`
                      });
                      return;
                    }
                    
                    // 이용권이 없는 경우 입찰 불가 메시지 표시
                    if (hasBidTokens === false) {
                      toast({
                        variant: 'destructive',
                        title: '이용권 없음',
                        description: '사용 가능한 이용권이 없습니다. 이용권을 구매하신 후 다시 시도해주세요.'
                      });
                      return;
                    }
                    
                    // 입찰 불가능한 공구 상태인 경우
                    if (!isValidBidStatus) {
                      toast({
                        variant: 'destructive',
                        title: '입찰 불가',
                        description: '모집 중인 공구만 입찰할 수 있습니다.'
                      });
                      return;
                    }
                    
                    setIsBidModalOpen(true);
                  }}
                  disabled={isClosed || hasBidTokens === false || !isValidBidStatus}
                >
                  <PlusCircle className="w-4 h-4 mr-1" /> {hasBid ? '견적 수정하기' : '견적 제안하기'}
                </Button>
                {(isClosed || hasBidTokens === false || !isValidBidStatus) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                      <p className="text-white text-sm font-semibold text-center">
                        입찰 불가
                        <br />
                        <span className="text-xs font-normal">
                          {calculatedStatus === 'expired' && '공구 기간이 마감되었습니다.'}
                          {calculatedStatus === 'completed' && '공구가 완료되었습니다.'}
                          {isFull && '공구 인원이 다 차었습니다.'}
                          {hasBidTokens === false && '이용권이 없습니다.'}
                          {!isValidBidStatus && '입찰 불가능한 상태입니다.'}
                        </span>
                      </p>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="border-green-600 text-green-700 font-bold py-2 px-4"
                onClick={() => setIsBidHistoryModalOpen(true)}
              >
                <History className="w-4 h-4 mr-1" /> 입찰 기록 보기
              </Button>
            </div>
            
            {hasBid && (
              <div className="bg-green-50 p-3 rounded-md text-sm text-green-800">
                <p className="font-medium">입찰 완료</p>
                <p>입찰 내역은 마이페이지의 '입찰 관리' 탭에서도 확인할 수 있습니다.</p>
              </div>
            )}
          </div>
        )}
        
        {/* 판매자 최종선택 UI - 판매자가 낙찰된 경우에만 표시 */}
        {(() => {
          console.log('판매자 최종선택 UI 조건:', {
            isSeller,
            status: groupBuyState?.status,
            hasWinningBid,
            winningBidInfo
          });
          return null;
        })()}
        {isSeller && groupBuyState?.status === 'final_selection_seller' && hasWinningBid && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">판매자 최종선택</h3>
              <span className="text-sm text-yellow-700">최종선택 대기중</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              구매자가 모두 최종선택을 완료했습니다. 판매확정 또는 판매포기를 선택해주세요.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsFinalDecisionModalOpen(true)}
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
        
        {/* 참여 버튼 - 이미 참여한 경우 표시하지 않음 */}
        <div className="px-4">
          {/* participationStatus가 null이 아니고 is_participating이 true인 경우에는 버튼 표시하지 않음 */}
          {(!participationStatus || !participationStatus.is_participating) && (
            <GroupBuyActionButton 
              isRecruiting={!!isRecruiting} 
              isFull={!!isFull}
              isCreator={!!isCreator}
              isSeller={!!isSeller}
              isParticipating={participationStatus?.is_participating || false}
              hasSellerMembers={sellerCount > 0}
              onRefresh={isSeller ? () => setIsBidModalOpen(true) : refreshParticipationStatus}
              groupBuy={{
                id: Number(id),
                title: groupBuyState?.title || '',
                product_details: {
                  name: groupBuyState?.product_details?.name || '',
                  image_url: groupBuyState?.product_details?.image_url || '/placeholder.png',
                  carrier: groupBuyState?.telecom_detail?.telecom_carrier || groupBuyState?.product_details?.carrier || '',
                  registration_type: groupBuyState?.telecom_detail?.subscription_type || groupBuyState?.product_details?.registration_type || '',
                  base_price: groupBuyState?.product_details?.base_price || 0
                }
              }}
            />
          )}
        </div>
        
        {/* 공유하기 버튼 및 탈퇴 버튼 - 클라이언트 컴포넌트로 분리 */}
        <GroupBuyActionButtons 
          groupBuyId={id} 
          token={accessToken || undefined}
          onRefresh={refreshParticipationStatus} 
          participationStatus={participationStatus || undefined} 
        />
      </div>
      
      {/* 입찰 모달 */}
      {isSeller && (
        <>
          <BidModal
            isOpen={isBidModalOpen}
            onClose={() => setIsBidModalOpen(false)}
            groupBuyId={parseInt(id)}
            targetPrice={groupBuyState?.product_details?.base_price || 0}
            productName={groupBuyState?.product_details?.name || groupBuyState?.title || ''}
            minParticipants={groupBuyState?.min_participants || 0}
            currentParticipants={groupBuyState?.current_participants || 0}
            onBidSuccess={() => {
              setHasBid(true);
              toast({
                title: "입찰이 성공적으로 등록되었습니다",
                description: "입찰 내역은 마이페이지에서 확인할 수 있습니다."
              });
            }}
            isClosed={isClosed}
          />
          
          <BidHistoryModal
            isOpen={isBidHistoryModalOpen}
            onClose={() => setIsBidHistoryModalOpen(false)}
            groupBuyId={parseInt(id)}
            currentUserId={user?.id ? parseInt(user.id) : undefined}
            isSeller={isSeller}
            isParticipant={participationStatus?.is_participating || false}
            groupBuyStatus={groupBuyState?.status}
          />
        </>
      )}
      
      {/* 최종선택 모달 */}
      {hasWinningBid && (
        <FinalDecisionModal
          isOpen={isFinalDecisionModalOpen}
          onClose={() => setIsFinalDecisionModalOpen(false)}
          groupBuyId={parseInt(id)}
          groupBuyTitle={groupBuyState?.title || ''}
          onDecisionComplete={() => {
            setIsFinalDecisionModalOpen(false);
            refreshParticipationStatus();
            checkWinningBidStatus();
          }}
        />
      )}

      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={clearCache}
      />
    </div>
  );
}
