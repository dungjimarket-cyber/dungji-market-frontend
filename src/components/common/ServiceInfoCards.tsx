'use client';

import Image from 'next/image';
import { Smartphone, UserPlus, CreditCard, Wifi, Tv, Gauge } from 'lucide-react';

interface ServiceInfoCardsProps {
  category?: string;
  carrier?: string;
  subscriptionType?: string;
  planInfo?: string;
  speed?: string;
  hasTV?: boolean;
  variant?: 'list' | 'detail'; // list: 공구 목록용, detail: 상세 페이지용
}

// 통신사 아이콘 가져오기
const getCarrierIcon = (carrier: string) => {
  switch(carrier) {
    case 'SKT':
    case 'SK텔레콤':
      return '/logos/skt.png';
    case 'KT':
      return '/logos/kt.png';
    case 'LGU':
    case 'LG U+':
    case 'LGU+':
      return '/logos/lgu.png';
    case 'SK':
    case 'SKB':
    case 'SK브로드밴드':
      return '/logos/sk-broadband.png';
    default:
      return null;
  }
};

// 가입유형 한글명 변환
const getSubscriptionTypeLabel = (type: string) => {
  switch(type) {
    case 'new':
    case '신규가입':
      return '신규가입';
    case 'transfer':
    case '번호이동':
      return '번호이동';
    case 'change':
    case '기기변경':
      return '기기변경';
    default:
      return type;
  }
};

// 가입유형 아이콘
const getSubscriptionIcon = (type: string, size: 'small' | 'normal' | 'large' = 'normal') => {
  const normalizedType = getSubscriptionTypeLabel(type);
  const iconClass = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-8 h-8' : 'w-4 h-4';

  switch(normalizedType) {
    case '신규가입':
      return <UserPlus className={`${iconClass} text-blue-600`} />;
    case '번호이동':
      return (
        <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case '기기변경':
      return <Smartphone className={`${iconClass} text-blue-600`} />;
    default:
      return <UserPlus className={`${iconClass} text-blue-600`} />;
  }
};

export function ServiceInfoCards({
  category,
  carrier,
  subscriptionType,
  planInfo,
  speed,
  hasTV,
  variant = 'list'
}: ServiceInfoCardsProps) {
  const carrierIcon = carrier ? getCarrierIcon(carrier) : null;
  const isInternet = category === '인터넷' || category === '인터넷+TV';

  // PC에서 detail variant일 때 더 큰 카드 크기
  const cardClass = variant === 'detail'
    ? "flex-1 min-w-0 md:min-w-[150px] max-w-none md:max-w-[200px]"
    : "min-w-[75px] md:min-w-[65px] md:max-w-[70px] flex-shrink-0";

  // detail variant: 모바일은 한 줄, PC는 여백 확보
  const containerClass = variant === 'detail'
    ? "flex gap-2 md:gap-3 flex-nowrap md:flex-wrap max-w-none md:max-w-3xl"
    : "flex gap-1.5 md:gap-1 flex-wrap md:flex-nowrap";

  return (
    <div className={containerClass}>
      {/* 통신사 카드 */}
      {carrier && (
        <div className={`${cardClass} bg-white rounded-md border border-gray-200 ${variant === 'detail' ? 'p-3 md:p-4' : 'p-2 md:p-1.5'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className={variant === 'detail' ? "text-xs md:text-sm text-gray-500 mb-1.5 md:mb-2 font-medium" : "text-[9px] md:text-[8px] text-gray-500 mb-1 md:mb-0.5 font-medium"}>통신사</div>
          {carrierIcon ? (
            <div className={`relative ${variant === 'detail' ? 'w-10 h-10 md:w-16 md:h-16' : 'w-7 h-7 md:w-6 md:h-6'} mb-1.5 md:mb-2`}>
              <Image
                src={carrierIcon}
                alt={carrier}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className={`${variant === 'detail' ? 'w-10 h-10 md:w-16 md:h-16' : 'w-7 h-7 md:w-6 md:h-6'} mb-1.5 md:mb-2 flex items-center justify-center`}>
              <Wifi className={`${variant === 'detail' ? 'w-8 h-8 md:w-12 md:h-12' : 'w-5 h-5 md:w-4 md:h-4'} text-gray-400`} />
            </div>
          )}
          <div className={variant === 'detail' ? "text-sm md:text-xl font-bold text-gray-900 text-center leading-tight" : "text-[10px] md:text-[9px] font-bold text-gray-900 text-center leading-tight"}>{carrier}</div>
        </div>
      )}

      {/* 가입유형 카드 */}
      {subscriptionType && (
        <div className={`${cardClass} bg-white rounded-md border border-gray-200 ${variant === 'detail' ? 'p-3 md:p-4' : 'p-2 md:p-1.5'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className={variant === 'detail' ? "text-xs md:text-sm text-gray-500 mb-1.5 md:mb-2 font-medium" : "text-[9px] md:text-[8px] text-gray-500 mb-1 md:mb-0.5 font-medium"}>가입유형</div>
          <div className={`${variant === 'detail' ? 'w-10 h-10 md:w-16 md:h-16' : 'w-7 h-7 md:w-6 md:h-6'} mb-1.5 md:mb-2 flex items-center justify-center bg-blue-50 rounded`}>
            {getSubscriptionIcon(subscriptionType, variant === 'detail' ? 'large' : 'small')}
          </div>
          <div className={variant === 'detail' ? "text-sm md:text-xl font-bold text-gray-900 text-center leading-tight" : "text-[10px] md:text-[9px] font-bold text-gray-900 text-center leading-tight"}>
            {getSubscriptionTypeLabel(subscriptionType)}
          </div>
        </div>
      )}

      {/* 요금제/속도 카드 */}
      {(planInfo || speed) && (
        <div className={`${cardClass} bg-white rounded-md border border-gray-200 ${variant === 'detail' ? 'p-3 md:p-4' : 'p-2 md:p-1.5'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className={variant === 'detail' ? "text-xs md:text-sm text-gray-500 mb-1.5 md:mb-2 font-medium" : "text-[9px] md:text-[8px] text-gray-500 mb-1 md:mb-0.5 font-medium"}>
            {isInternet ? '속도' : '요금제'}
          </div>
          <div className={`${variant === 'detail' ? 'w-10 h-10 md:w-16 md:h-16' : 'w-7 h-7 md:w-6 md:h-6'} mb-1.5 md:mb-2 flex items-center justify-center bg-purple-50 rounded`}>
            {isInternet ? (
              <Gauge className={`${variant === 'detail' ? 'w-6 h-6 md:w-10 md:h-10' : 'w-3.5 h-3.5 md:w-3 md:h-3'} text-purple-600`} />
            ) : (
              <CreditCard className={`${variant === 'detail' ? 'w-6 h-6 md:w-10 md:h-10' : 'w-3.5 h-3.5 md:w-3 md:h-3'} text-purple-600`} />
            )}
          </div>
          <div className={variant === 'detail' ? "text-sm md:text-xl font-bold text-gray-900 text-center leading-tight" : "text-[10px] md:text-[9px] font-bold text-gray-900 text-center leading-tight"}>
            {speed || planInfo || '-'}
          </div>
        </div>
      )}

      {/* TV 포함 여부 (인터넷+TV만) */}
      {category === '인터넷+TV' && hasTV !== undefined && variant === 'detail' && (
        <div className={`${cardClass} bg-white rounded-md border border-gray-200 p-3 md:p-4 flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className="text-xs md:text-sm text-gray-500 mb-1.5 md:mb-2 font-medium">TV 포함</div>
          <div className="w-10 h-10 md:w-16 md:h-16 mb-1.5 md:mb-2 flex items-center justify-center bg-green-50 rounded">
            <Tv className="w-6 h-6 md:w-10 md:h-10 text-green-600" />
          </div>
          <div className="text-sm md:text-xl font-bold text-gray-900 text-center leading-tight">
            {hasTV ? 'TV 포함' : 'TV 미포함'}
          </div>
        </div>
      )}
    </div>
  );
}