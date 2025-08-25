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
const getSubscriptionIcon = (type: string) => {
  const normalizedType = getSubscriptionTypeLabel(type);
  switch(normalizedType) {
    case '신규가입':
      return <UserPlus className="w-5 h-5 text-blue-600" />;
    case '번호이동':
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case '기기변경':
      return <Smartphone className="w-5 h-5 text-blue-600" />;
    default:
      return <UserPlus className="w-5 h-5 text-blue-600" />;
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
  const cardClass = variant === 'detail' 
    ? "min-w-[100px] flex-1" 
    : "min-w-[85px]";
  const containerClass = variant === 'detail'
    ? "flex gap-3 flex-wrap"
    : "flex gap-2 overflow-x-auto scrollbar-hide";

  return (
    <div className={containerClass}>
      {/* 통신사 카드 */}
      {carrier && (
        <div className={`${cardClass} bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center justify-center hover:shadow-md transition-shadow`}>
          <div className="text-[10px] text-gray-500 mb-2 font-medium">통신사</div>
          {carrierIcon ? (
            <div className="relative w-10 h-10 mb-1">
              <Image
                src={carrierIcon}
                alt={carrier}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 mb-1 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="text-xs font-bold text-gray-900">{carrier}</div>
        </div>
      )}

      {/* 가입유형 카드 */}
      {subscriptionType && (
        <div className={`${cardClass} bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center justify-center hover:shadow-md transition-shadow`}>
          <div className="text-[10px] text-gray-500 mb-2 font-medium">가입유형</div>
          <div className="w-10 h-10 mb-1 flex items-center justify-center bg-blue-50 rounded-lg">
            {getSubscriptionIcon(subscriptionType)}
          </div>
          <div className="text-xs font-bold text-gray-900">
            {getSubscriptionTypeLabel(subscriptionType)}
          </div>
        </div>
      )}

      {/* 요금제/속도 카드 */}
      {(planInfo || speed) && (
        <div className={`${cardClass} bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center justify-center hover:shadow-md transition-shadow`}>
          <div className="text-[10px] text-gray-500 mb-2 font-medium">
            {isInternet ? '속도' : '요금제'}
          </div>
          <div className="w-10 h-10 mb-1 flex items-center justify-center bg-purple-50 rounded-lg">
            {isInternet ? (
              <Gauge className="w-5 h-5 text-purple-600" />
            ) : (
              <CreditCard className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div className="text-xs font-bold text-gray-900">
            {speed || planInfo || '-'}
          </div>
        </div>
      )}

      {/* TV 포함 여부 (인터넷+TV만) */}
      {category === '인터넷+TV' && hasTV !== undefined && variant === 'detail' && (
        <div className={`${cardClass} bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center justify-center hover:shadow-md transition-shadow`}>
          <div className="text-[10px] text-gray-500 mb-2 font-medium">TV 포함</div>
          <div className="w-10 h-10 mb-1 flex items-center justify-center bg-green-50 rounded-lg">
            <Tv className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-xs font-bold text-gray-900">
            {hasTV ? 'TV 포함' : 'TV 미포함'}
          </div>
        </div>
      )}
    </div>
  );
}