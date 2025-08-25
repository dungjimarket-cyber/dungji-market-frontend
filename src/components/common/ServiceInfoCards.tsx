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
const getSubscriptionIcon = (type: string, size: 'small' | 'normal' = 'normal') => {
  const normalizedType = getSubscriptionTypeLabel(type);
  const iconClass = size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  
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
  
  // 리스트용: 컴팩트하게, 상세용: 1/3 너비로 제한
  const cardClass = variant === 'detail' 
    ? "min-w-[90px] max-w-[120px] flex-1" 
    : "min-w-[75px] flex-shrink-0";
  
  // 리스트용: 스크롤 없이 wrap, 상세용: 간격 좁게
  const containerClass = variant === 'detail'
    ? "flex gap-2 flex-wrap max-w-md"
    : "flex gap-1.5 flex-wrap";

  return (
    <div className={containerClass}>
      {/* 통신사 카드 */}
      {carrier && (
        <div className={`${cardClass} bg-white rounded-lg border border-gray-200 ${variant === 'detail' ? 'p-2.5' : 'p-2'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className="text-[9px] text-gray-500 mb-1 font-medium">통신사</div>
          {carrierIcon ? (
            <div className={`relative ${variant === 'detail' ? 'w-8 h-8' : 'w-7 h-7'} mb-1`}>
              <Image
                src={carrierIcon}
                alt={carrier}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className={`${variant === 'detail' ? 'w-8 h-8' : 'w-7 h-7'} mb-1 flex items-center justify-center`}>
              <Wifi className={`${variant === 'detail' ? 'w-6 h-6' : 'w-5 h-5'} text-gray-400`} />
            </div>
          )}
          <div className="text-[10px] font-bold text-gray-900 text-center break-all">{carrier}</div>
        </div>
      )}

      {/* 가입유형 카드 */}
      {subscriptionType && (
        <div className={`${cardClass} bg-white rounded-lg border border-gray-200 ${variant === 'detail' ? 'p-2.5' : 'p-2'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className="text-[9px] text-gray-500 mb-1 font-medium">가입유형</div>
          <div className={`${variant === 'detail' ? 'w-8 h-8' : 'w-7 h-7'} mb-1 flex items-center justify-center bg-blue-50 rounded-md`}>
            {getSubscriptionIcon(subscriptionType, variant === 'list' ? 'small' : 'normal')}
          </div>
          <div className="text-[10px] font-bold text-gray-900 text-center">
            {getSubscriptionTypeLabel(subscriptionType)}
          </div>
        </div>
      )}

      {/* 요금제/속도 카드 */}
      {(planInfo || speed) && (
        <div className={`${cardClass} bg-white rounded-lg border border-gray-200 ${variant === 'detail' ? 'p-2.5' : 'p-2'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className="text-[9px] text-gray-500 mb-1 font-medium">
            {isInternet ? '속도' : '요금제'}
          </div>
          <div className={`${variant === 'detail' ? 'w-8 h-8' : 'w-7 h-7'} mb-1 flex items-center justify-center bg-purple-50 rounded-md`}>
            {isInternet ? (
              <Gauge className={`${variant === 'detail' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-purple-600`} />
            ) : (
              <CreditCard className={`${variant === 'detail' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-purple-600`} />
            )}
          </div>
          <div className="text-[10px] font-bold text-gray-900 text-center">
            {speed || planInfo || '-'}
          </div>
        </div>
      )}

      {/* TV 포함 여부 (인터넷+TV만) */}
      {category === '인터넷+TV' && hasTV !== undefined && variant === 'detail' && (
        <div className={`${cardClass} bg-white rounded-lg border border-gray-200 ${variant === 'detail' ? 'p-2.5' : 'p-2'} flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}>
          <div className="text-[9px] text-gray-500 mb-1 font-medium">TV 포함</div>
          <div className={`${variant === 'detail' ? 'w-8 h-8' : 'w-7 h-7'} mb-1 flex items-center justify-center bg-green-50 rounded-md`}>
            <Tv className={`${variant === 'detail' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-green-600`} />
          </div>
          <div className="text-[10px] font-bold text-gray-900 text-center">
            {hasTV ? 'TV 포함' : 'TV 미포함'}
          </div>
        </div>
      )}
    </div>
  );
}