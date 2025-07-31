'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, Users, Flame, Sparkles, Gavel, CheckCircle } from 'lucide-react';
import { getRegistrationTypeText, calculateGroupBuyStatus } from '@/lib/groupbuy-utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

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
  // 지역 관련 정보
  region_type?: string; // 지역 유형 (local, nationwide)
  region?: string; // 지역명 (서울, 부산 등)
  region_name?: string; // 지역명 (서울특별시, 부산광역시 등)
  regions?: Array<{
    id: number;
    name: string;
    full_name?: string;
    parent?: string;
  }>; // 다중 지역 정보
}

interface GroupPurchaseCardProps {
  groupBuy: GroupBuy;
  onJoin?: (id: number) => void;
  isParticipant?: boolean; // 참여 여부
  hasBid?: boolean; // 입찰 여부
}

/**
 * 공구 카드 컴포넌트
 * @param groupBuy - 공구 정보
 * @param onJoin - 참여하기 버튼 클릭 핸들러 (사용하지 않음, 상세 페이지로 이동)
 */
export function GroupPurchaseCard({ groupBuy, isParticipant = false, hasBid = false }: GroupPurchaseCardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isHot = groupBuy.current_participants >= groupBuy.max_participants * 0.8;
  const isNew = new Date(groupBuy.start_time) > new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // 실제 상태를 시간 기반으로 계산
  const actualStatus = calculateGroupBuyStatus(groupBuy.status, groupBuy.start_time, groupBuy.end_time);
  
  const isBidding = actualStatus === 'bidding';
  const isCompleted = actualStatus === 'completed';
  const isRecruiting = actualStatus === 'recruiting';
  const isFinalSelection = actualStatus === 'voting' || actualStatus === 'seller_confirmation';
  
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

  const getButtonText = () => {
    if (isCompleted) return '마감완료';
    
    // 최종선택중 상태 체크
    if (isFinalSelection) return '공구 마감';
    
    // 비로그인
    if (!isAuthenticated) {
      return '공구 둘러보기';
    }
    
    // 판매회원
    if (user?.role === 'seller') {
      if (hasBid) {
        return '다시 입찰하기';
      }
      return '공구 입찰하기';
    }
    
    // 일반회원
    if (isParticipant) {
      return '참여 완료';
    }
    return '공구 참여하기';
  };

  const getButtonStyle = () => {
    if (isCompleted) {
      return 'bg-gray-500 text-white cursor-not-allowed';
    }
    
    // 최종선택중 상태
    if (isFinalSelection) {
      return 'bg-orange-500 text-white cursor-not-allowed';
    }
    
    // 참여 완료 상태
    if (isParticipant && user?.role !== 'seller') {
      return 'bg-blue-600 text-white hover:bg-blue-700';
    }
    
    // 입찰 완료 상태
    if (hasBid && user?.role === 'seller') {
      return 'bg-indigo-600 text-white hover:bg-indigo-700';
    }
    
    if (isUrgent) {
      return 'bg-gradient-to-r from-purple-600 to-purple-700 text-purple-100 hover:from-purple-700 hover:to-purple-800';
    }
    return 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800';
  };

  /**
   * 상세 페이지로 이동
   */
  const handleViewDetail = () => {
    // 로그인하지 않은 경우 바로 상세 페이지로 이동
    if (!isAuthenticated || !user) {
      router.push(`/groupbuys/${groupBuy.id}`);
      return;
    }

    // 카카오톡 간편가입 사용자 체크
    if (user.sns_type === 'kakao') {
      // 일반회원: 활동지역, 연락처 체크
      if (user.role === 'buyer') {
        if (!user.phone_number || !user.address_region) {
          if (confirm('공구에 참여하기 위한 활동지역, 연락처 정보를 업데이트 해주세요~\n\n확인을 누르시면 마이페이지로 이동합니다.')) {
            router.push('/mypage');
            return;
          }
          return;
        }
      }
      
      // 판매회원: 사업자등록번호, 주소지, 연락처 체크
      if (user.role === 'seller') {
        if (!user.phone_number || !user.address_region || !user.business_number) {
          if (confirm('공구에 입찰하기 위한 사업자등록번호, 주소지, 연락처 정보를 업데이트 해주세요~\n\n확인을 누르시면 마이페이지로 이동합니다.')) {
            router.push('/mypage');
            return;
          }
          return;
        }
      }
    }

    // 모든 조건 통과시 상세 페이지로 이동
    router.push(`/groupbuys/${groupBuy.id}`);
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl">
      {/* 메인 이미지 */}
      <div className="relative h-80 w-full">
        <Image
          src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
          alt={groupBuy.product_details?.name || '상품 이미지'}
          fill
          className="object-cover"
        />
        
        {/* 공구 상태 배지 - 우측 상단 */}
        <div className="absolute top-4 right-4">
          {isRecruiting && (
            <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
              <Users className="w-4 h-4" />
              <span>모집중</span>
            </div>
          )}
          {isBidding && (
            <div className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
              <Gavel className="w-4 h-4" />
              <span>입찰중</span>
            </div>
          )}
          {isFinalSelection && (
            <div className="flex items-center gap-1 bg-orange-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
              <CheckCircle className="w-4 h-4" />
              <span>최종선택중</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
              <CheckCircle className="w-4 h-4" />
              <span>공구종료</span>
            </div>
          )}
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

        {/* 제품 정보 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          {/* 지역 정보를 제목 위에 표시 */}
          {groupBuy.region_type === 'nationwide' ? (
            <div className="mb-2">
              <span className="text-yellow-300 text-base font-bold">
                [전국 비대면]
              </span>
            </div>
          ) : (
            groupBuy.regions && groupBuy.regions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {groupBuy.regions.slice(0, 2).map((region, index) => {
                  // full_name이 '서울특별시 강남구' 형태로 되어 있음
                  // '특별시', '광역시', '도' 등을 짧은 형태로 변환
                  let displayName = region.name || region.full_name || '';
                  displayName = displayName
                    .replace('특별시', '시')
                    .replace('광역시', '시')
                    .replace('특별자치시', '시')
                    .replace('특별자치도', '도');
                  
                  return (
                    <span key={index} className="text-white text-sm font-medium">
                      [{displayName}]
                    </span>
                  );
                })}
              </div>
            )
          )}
          <h3 className="text-white text-xl font-bold mb-2 line-clamp-2">
            {groupBuy.product_details?.name || '상품명 없음'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* 통신사, 가입유형, 요금제 순서로 변경하고 크기 키움 */}
            {groupBuy.telecom_detail?.telecom_carrier && (
              <span className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                {groupBuy.telecom_detail.telecom_carrier}
              </span>
            )}
            {(groupBuy.product_details?.registration_type || groupBuy.telecom_detail?.subscription_type) && (
              <span className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                {groupBuy.product_details?.registration_type_korean || 
                 groupBuy.telecom_detail?.subscription_type_korean || 
                 getRegistrationTypeText(groupBuy.product_details?.registration_type || groupBuy.telecom_detail?.subscription_type)}
              </span>
            )}
            {groupBuy.telecom_detail?.plan_info && (
              <span className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                {groupBuy.telecom_detail.plan_info}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="p-6 space-y-4">
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full overflow-hidden">
              {groupBuy.creator?.profile_image ? (
                <Image
                  src={groupBuy.creator.profile_image}
                  alt={groupBuy.creator?.username || '사용자'}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white text-xs">
                  {(groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username)?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-300 text-sm font-medium truncate max-w-[120px]">{groupBuy.creator_name || groupBuy.host_username || groupBuy.creator?.username || '익명'}</p>
              <p className="text-gray-500 text-xs">
                {new Date(groupBuy.start_time).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={`text-lg font-bold ${getParticipantColor()}`}>
              {groupBuy.current_participants}/{groupBuy.max_participants}명
            </p>
            <p className="text-gray-400 text-xs">
              {isCompleted ? '마감' : `${remainingSlots}자리 남음`}
            </p>
          </div>
        </div>

        {/* 시간 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${getStatusColor()}`} />
            <span className={`font-medium ${getStatusColor()}`}>
              {timeLeftText || formatTimeLeft(currentTimeLeft)}
            </span>
          </div>
          <div className={`text-sm ${isUrgent ? 'text-red-400' : isCompleted ? 'text-gray-500' : 'text-green-400'}`}>
            {isUrgent ? '마감임박!' : isCompleted ? '마감완료' : '여유있음'}
          </div>
        </div>

        {/* 남은 시간 바 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>남은 시간</span>
            <span>{Math.round(timeRemainingPercent)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-gray-500' : isUrgent ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${timeRemainingPercent}%` }}
            />
          </div>
        </div>

        {/* 참여 버튼 */}
        <button
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${getButtonStyle()}`}
          onClick={handleViewDetail}
          disabled={isFinalSelection}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
