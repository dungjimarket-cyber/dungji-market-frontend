'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, Users, Flame, Sparkles, Gavel, CheckCircle } from 'lucide-react';
import { getRegistrationTypeText, calculateGroupBuyStatus } from '@/lib/groupbuy-utils';
import { getPlanDisplay } from '@/lib/telecom-utils';
import { ServiceInfoCards } from '@/components/common/ServiceInfoCards';

// 통신사 로고 이미지 컴포넌트
const getCarrierDisplay = (carrier: string, categoryName?: string) => {
  // 인터넷이나 인터넷+TV 카테고리인지 확인
  const isInternetCategory = categoryName === '인터넷' || categoryName === '인터넷+TV';
  
  switch(carrier) {
    case 'SK':
    case 'SKB':
    case 'SK브로드밴드':
      // 인터넷/인터넷+TV 서비스에서 SK는 SK 브로드밴드 로고 사용
      return (
        <Image
          src="/logos/sk-broadband.png"
          alt="SK"
          width={48}
          height={32}
          className="object-contain w-[60px] h-[40px] md:w-[40px] md:h-[26px] border border-gray-300 rounded-md"
        />
      );
    case 'SKT':
      // 휴대폰 서비스에서만 SKT 로고 사용
      return (
        <Image
          src="/logos/skt.png"
          alt="SKT"
          width={44}
          height={32}
          className="object-contain w-[54px] h-[40px] md:w-[36px] md:h-[26px] border border-gray-300 rounded-md"
        />
      );
    case 'KT':
      return (
        <Image
          src="/logos/kt.png"
          alt="KT"
          width={44}
          height={24}
          className="object-contain w-[54px] h-[30px] md:w-[36px] md:h-[20px] border border-gray-300 rounded-md"
        />
      );
    case 'LGU':
    case 'LG U+':
    case 'LGU+':
      return (
        <Image
          src="/logos/lgu.png"
          alt="LG U+"
          width={60}
          height={24}
          className="object-contain w-[78px] h-[30px] md:w-[52px] md:h-[20px] border border-gray-300 rounded-md"
        />
      );
    default:
      return (
        <span className="text-xs font-bold text-gray-600">{carrier}</span>
      );
  }
};

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SimplifiedGroupBuyButton } from '@/components/groupbuy/SimplifiedGroupBuyButton';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  created_at?: string;
  creator_name?: string;
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
  // 지역 관련 정보
  region_type?: string; // 지역 유형 (local, nationwide)
  region?: string; // 지역명 (서울, 부산 등)
  region_name?: string; // 지역명 (서울특별시, 부산광역시 등)
  regions?: Array<{
    id: number;
    name: string;
    full_name?: string;
    parent_id?: string;
  }>; // 다중 지역 정보
}

interface GroupPurchaseCardProps {
  groupBuy: GroupBuy;
  onJoin?: (id: number) => void;
  isParticipant?: boolean; // 참여 여부
  hasBid?: boolean; // 입찰 여부
  priority?: boolean; // 이미지 우선순위
  isCompletedTab?: boolean; // 공구완료 탭인지 여부
}

/**
 * 공구 카드 컴포넌트
 * @param groupBuy - 공구 정보
 * @param onJoin - 참여하기 버튼 클릭 핸들러 (사용하지 않음, 상세 페이지로 이동)
 */
export function GroupPurchaseCard({ groupBuy, isParticipant = false, hasBid = false, priority = false, isCompletedTab = false }: GroupPurchaseCardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isHot = groupBuy.current_participants >= groupBuy.max_participants * 0.8;
  // NEW 배지: created_at 기준 24시간 이내
  const isNew = groupBuy.created_at ? new Date(groupBuy.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) : false;
  
  // 실제 상태를 시간 기반으로 계산
  const actualStatus = calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time);
  
  const isBidding = actualStatus === 'bidding';
  const isCompleted = actualStatus === 'completed';
  const isRecruiting = actualStatus === 'recruiting';
  const isFinalSelection = actualStatus === 'final_selection' || actualStatus === 'seller_confirmation';
  
  const remainingSlots = groupBuy.max_participants - groupBuy.current_participants;
  
  // 실시간 타이머 상태 추가
  const [currentTimeLeft, setCurrentTimeLeft] = useState<number>(
    new Date(groupBuy.end_time).getTime() - Date.now()
  );
  const [timeLeftText, setTimeLeftText] = useState<string>('');
  
  // 전체 시간과 남은 시간 비율 계산
  const totalDuration = new Date(groupBuy.end_time).getTime() - new Date(groupBuy.start_time).getTime();
  const [timeRemainingPercent, setTimeRemainingPercent] = useState<number>(() => {
    const now = Date.now();
    const startTime = new Date(groupBuy.start_time).getTime();
    const endTime = new Date(groupBuy.end_time).getTime();
    
    // 아직 시작 전인 경우 100%
    if (now < startTime) return 100;
    
    // 이미 종료된 경우 0%
    if (now > endTime || isCompleted) return 0;
    
    // 진행 중인 경우 남은 시간 비율 계산
    const remaining = endTime - now;
    return Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  });
  
  // 마감 임박 조건: 3시간 미만 또는 잔여 인원 3명 이하
  const isUrgent = (currentTimeLeft < 3 * 60 * 60 * 1000 && currentTimeLeft > 0) || 
                  (remainingSlots <= 3 && remainingSlots > 0);
  
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return '마감완료';
    
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    if (days > 0) {
      return `${days}일 ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 실시간 타이머 업데이트
  useEffect(() => {
    // 초기 타이머 설정
    setTimeLeftText(formatTimeLeft(currentTimeLeft));
    
    // 1초마다 타이머 갱신
    const timerInterval = setInterval(() => {
      const newTimeLeft = new Date(groupBuy.end_time).getTime() - Date.now();
      setCurrentTimeLeft(newTimeLeft);
      setTimeLeftText(formatTimeLeft(newTimeLeft));
      
      // 남은 시간 퍼센트 업데이트
      const now = Date.now();
      const startTime = new Date(groupBuy.start_time).getTime();
      const endTime = new Date(groupBuy.end_time).getTime();
      
      let percent;
      if (now < startTime) {
        percent = 100;
      } else if (now > endTime || groupBuy.status === 'completed') {
        percent = 0;
      } else {
        percent = Math.max(0, Math.min(100, (newTimeLeft / totalDuration) * 100));
      }
      setTimeRemainingPercent(percent);
    }, 1000);
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timerInterval);
  }, [groupBuy.end_time, totalDuration]);

  const getStatusColor = () => {
    if (isCompleted) return 'text-gray-500';
    if (isUrgent) return 'text-red-500';
    if (isBidding) return 'text-blue-600';
    return 'text-green-600';
  };

  const getParticipantColor = () => {
    if (isCompleted) return 'text-blue-600';
    if (isUrgent) return 'text-purple-600';
    return 'text-green-600';
  };

  // 간소화된 버튼 텍스트 (4개로 통합)
  const getButtonText = () => {
    const status = groupBuy.status;
    
    // 비로그인
    if (!isAuthenticated) {
      return '공구 둘러보기';
    }
    
    // 일반회원
    if (user?.role === 'buyer' || !user?.role) {
      if (status === 'recruiting') {
        return isParticipant ? '참여 완료' : '공구 참여하기';
      }
      if (status === 'final_selection_buyers' || 
          status === 'final_selection_seller' || 
          status === 'in_progress') {
        return '진행상황 확인';
      }
      if (status === 'completed') {
        return '공구 완료';
      }
      if (status === 'cancelled') {
        return '공구 취소';
      }
    }
    
    // 판매회원
    if (user?.role === 'seller') {
      if (status === 'recruiting') {
        return hasBid ? '견적 수정하기' : '견적 제안하기';
      }
      if (status === 'final_selection_buyers' || 
          status === 'final_selection_seller' || 
          status === 'in_progress') {
        return '진행상황 확인';
      }
      if (status === 'completed') {
        return '공구 완료';
      }
      if (status === 'cancelled') {
        return '공구 취소';
      }
    }
    
    return '확인';
  };

  // 간소화된 버튼 스타일
  const getButtonStyle = () => {
    const status = groupBuy.status;
    
    if (status === 'completed' || status === 'cancelled') {
      return 'bg-gray-500 text-white hover:bg-gray-600';
    }
    
    if (status === 'recruiting') {
      if (user?.role === 'buyer' && isParticipant) {
        return 'bg-blue-600 text-white hover:bg-blue-700';
      }
      if (user?.role === 'seller' && hasBid) {
        return 'bg-indigo-600 text-white hover:bg-indigo-700';
      }
      return 'bg-purple-600 text-white hover:bg-purple-700';
    }
    
    // 진행상황 확인 버튼
    return 'bg-orange-600 text-white hover:bg-orange-700';
  };

  /**
   * 상세 페이지로 이동
   */
  const handleViewDetail = () => {
    // 공구완료 탭에서 비참여자는 접근 불가
    if (isCompletedTab && !isParticipant && !hasBid) {
      return; // 클릭 무시
    }
    
    // 프로필 체크 없이 바로 상세 페이지로 이동
    router.push(`/groupbuys/${groupBuy.id}`);
  };

  // 공구완료 탭에서 비참여자인 경우 비활성화 스타일 적용
  const isDisabled = isCompletedTab && !isParticipant && !hasBid;
  
  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden shadow-lg transition-shadow duration-300 ${
        isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-xl cursor-pointer'
      }`}
      onClick={handleViewDetail}>
      {/* 메인 이미지 - 단독 표시 */}
      <div className="relative h-52 w-full bg-gray-50">
        <Image
          src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
          alt={groupBuy.product_details?.name || '상품 이미지'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        
        {/* 공구 상태 배지 - 우측 상단 */}
        <div className="absolute top-4 right-4">
            {(() => {
              const status = groupBuy.status;
              
              // 모집중
              if (status === 'recruiting') {
                // 참여/입찰 상태 표시
                if (user?.role === 'buyer' && isParticipant) {
                  return (
                    <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>참여완료</span>
                    </div>
                  );
                }
                if (user?.role === 'seller' && hasBid) {
                  return (
                    <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>제안완료</span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <Users className="w-4 h-4" />
                    <span>모집중</span>
                  </div>
                );
              }
              
              // 견적중 상태
              if (status === 'bidding') {
                return (
                  <div className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <Gavel className="w-4 h-4" />
                    <span>견적중</span>
                  </div>
                );
              }
              
              // 진행 상태별 배지
              if (status === 'final_selection_buyers') {
                return (
                  <div className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span>구매자 선택중</span>
                  </div>
                );
              }
              if (status === 'final_selection_seller') {
                return (
                  <div className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span>판매자 선택중</span>
                  </div>
                );
              }
              if (status === 'in_progress') {
                return (
                  <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>거래중</span>
                  </div>
                );
              }
              
              // 완료 상태
              if (status === 'completed') {
                return (
                  <div className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>완료</span>
                  </div>
                );
              }
              
              // 취소 상태
              if (status === 'cancelled') {
                return (
                  <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span>취소</span>
                  </div>
                );
              }
              
              return null;
            })()}
        </div>
        
        {/* 추가 정보 배지 - 왼쪽 상단 */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isHot && (
            <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <Flame className="w-3 h-3" />
              <span>HOT</span>
            </div>
          )}
          {isNew && (
            <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              <span>NEW</span>
            </div>
          )}
        </div>

      </div>

      {/* 상품 정보 영역 - 고정 높이로 버튼 정렬 유지 */}
      <div className="p-4 border-b h-[220px] md:h-[180px] flex flex-col">
        {/* 상품명 - 2줄로 제한 */}
        <h3 className="text-gray-900 text-base md:text-sm font-bold mb-2 line-clamp-2 min-h-[48px] md:min-h-[40px]">
          {groupBuy.product_details?.name || '상품명 없음'}
        </h3>
        
        {/* 상품명 하단 구분선 */}
        <div className="border-b border-gray-100 mb-2"></div>
        
        {/* 지역 정보 */}
        <div className="mb-1.5 md:mb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base md:text-xs font-semibold text-gray-600 whitespace-nowrap">공구지역</span>
            {groupBuy.region_type === 'nationwide' ? (
              <span className="inline-flex items-center px-3 md:px-2 py-1 md:py-0.5 rounded-full text-sm md:text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                전국 비대면
              </span>
            ) : (
              groupBuy.regions && groupBuy.regions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {groupBuy.regions.slice(0, 3).map((region, index) => {
                    let displayName = region.name || region.full_name || '';
                    displayName = displayName
                      .replace('특별시', '')
                      .replace('광역시', '')
                      .replace('특별자치시', '')
                      .replace('특별자치도', '');
                    
                    return (
                      <span key={index} className="inline-flex items-center px-2.5 md:px-1.5 py-0.5 rounded-full text-sm md:text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {displayName}
                      </span>
                    );
                  })}
                  {groupBuy.regions.length > 3 && (
                    <span className="inline-flex items-center px-2.5 md:px-1.5 py-0.5 rounded-full text-sm md:text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                      +{groupBuy.regions.length - 3}
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
        
        {/* 카테고리별 정보 표시 - 새로운 카드 디자인 */}
        <div className="w-full mt-2">
          {/* 휴대폰 상품 정보 */}
          {((groupBuy.product_info?.category_detail_type === 'telecom' ||
             groupBuy.product_details?.category_detail_type === 'telecom') && 
            groupBuy.telecom_detail) && (
            <ServiceInfoCards
              category={groupBuy.product_details?.category_name}
              carrier={groupBuy.telecom_detail.telecom_carrier}
              subscriptionType={groupBuy.telecom_detail.subscription_type_display || 
                               groupBuy.telecom_detail.subscription_type_korean || 
                               groupBuy.telecom_detail.subscription_type}
              planInfo={groupBuy.telecom_detail.plan_info ? getPlanDisplay(groupBuy.telecom_detail.plan_info) : undefined}
              variant="list"
            />
          )}
          
          {/* 인터넷/TV 상품 정보 */}
          {((groupBuy.product_info?.category_detail_type === 'internet' || 
             groupBuy.product_info?.category_detail_type === 'internet_tv' ||
             groupBuy.product_details?.category_detail_type === 'internet' ||
             groupBuy.product_details?.category_detail_type === 'internet_tv') && 
            groupBuy.internet_detail) && (
            <ServiceInfoCards
              category={groupBuy.product_details?.category_name || 
                       (groupBuy.product_info?.category_detail_type === 'internet_tv' ? '인터넷+TV' : '인터넷')}
              carrier={groupBuy.internet_detail.carrier_display || groupBuy.internet_detail.carrier}
              subscriptionType={groupBuy.internet_detail.subscription_type_display}
              speed={groupBuy.internet_detail.speed}
              hasTV={groupBuy.internet_detail.has_tv}
              variant="list"
            />
          )}
          
          {/* 기존 telecom_detail 기반 표시 (fallback) */}
          {!groupBuy.product_info?.category_detail_type && 
           !groupBuy.product_details?.category_detail_type && 
           groupBuy.telecom_detail?.telecom_carrier && (
            <ServiceInfoCards
              category={groupBuy.product_details?.category_name}
              carrier={groupBuy.telecom_detail.telecom_carrier}
              subscriptionType={groupBuy.product_details?.registration_type_korean || 
                               groupBuy.telecom_detail?.subscription_type_korean || 
                               groupBuy.product_details?.registration_type || 
                               groupBuy.telecom_detail?.subscription_type}
              planInfo={groupBuy.telecom_detail?.plan_info && 
                       groupBuy.product_details?.category_name !== '인터넷' &&
                       groupBuy.product_details?.category_name !== '인터넷+TV' 
                       ? getPlanDisplay(groupBuy.telecom_detail.plan_info) 
                       : undefined}
              variant="list"
            />
          )}
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="p-4 space-y-3 bg-gray-50">
        {/* 작성자 정보 및 참여 현황 */}
        <div className="space-y-2">
          {/* 첫번째 줄: 방장 및 참여 인원 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm">👑</span>
                <span className="text-gray-500 text-xs">방장</span>
              </div>
              <p className="text-gray-700 text-sm font-medium truncate max-w-[120px]">
                {groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username || '익명'}
              </p>
            </div>
            
            <p className="text-lg font-bold text-gray-900">
              {groupBuy.current_participants}/{groupBuy.max_participants}명
            </p>
          </div>
          
          {/* 두번째 줄: 등록일 및 남은 자리 */}
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs">
              등록일: {new Date(groupBuy.start_time).toLocaleDateString('ko-KR')}
            </p>
            {!isCompleted && (
              <p className="text-gray-500 text-xs">
                {remainingSlots}자리 남음
              </p>
            )}
          </div>
        </div>

        {/* 남은 시간 바 - 모집중일 때만 표시 */}
        {groupBuy.status === 'recruiting' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>남은 시간</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                  {timeLeftText || formatTimeLeft(currentTimeLeft)}
                </span>
                <span className={`${isUrgent ? 'text-red-500' : 'text-green-600'}`}>
                  {isUrgent ? '마감임박!' : '여유있음'}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isUrgent ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${timeRemainingPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 참여 버튼 */}
        <button
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${getButtonStyle()}`}
          onClick={handleViewDetail}
          disabled={isFinalSelection || isCompleted}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
