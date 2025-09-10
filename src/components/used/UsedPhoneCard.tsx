/**
 * 중고폰 카드 컴포넌트
 * 최적화: lazy loading, 이미지 최적화, 메모이제이션
 */

'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Clock, Eye, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UsedPhone, CONDITION_GRADES, BATTERY_STATUS_LABELS } from '@/types/used';

interface UsedPhoneCardProps {
  phone: Partial<UsedPhone>;
  priority?: boolean; // 첫 번째 행 이미지 우선 로딩
  onFavorite?: (phoneId: number) => void;
}

const UsedPhoneCard = memo(function UsedPhoneCard({ 
  phone, 
  priority = false,
  onFavorite 
}: UsedPhoneCardProps) {
  // 기본 이미지 설정
  const imageUrl = phone.images?.[0]?.imageUrl || phone.images?.[0]?.thumbnailUrl || '/images/phone-placeholder.svg';
  // 썸네일이 있으면 사용, 없으면 원본 이미지 사용
  const thumbnailUrl = phone.images?.[0]?.thumbnailUrl || imageUrl;
  
  // 가격 포맷팅
  const formatPrice = (price?: number) => {
    if (!price) return '가격 협의';
    return `${(price / 10000).toFixed(0)}만원`;
  };

  // 날짜 포맷팅
  const formatDate = (date?: string) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ko
      });
    } catch {
      return '';
    }
  };

  // 찜하기 핸들러
  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (phone.id && onFavorite) {
      onFavorite(phone.id);
    }
  };

  return (
    <Link 
      href={`/used/${phone.id}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={phone.model || '중고폰'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onError={(e) => {
            // 썸네일 로드 실패 시 원본 이미지 시도
            const target = e.target as HTMLImageElement;
            if (target.src !== imageUrl) {
              target.src = imageUrl;
            }
          }}
        />
        
        {/* 상태 뱃지 */}
        {phone.status === 'reserved' && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 text-xs rounded font-medium">
            예약중
          </div>
        )}
        {phone.status === 'sold' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-lg font-bold">판매완료</span>
          </div>
        )}
        
        {/* 찜하기 버튼 */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
          aria-label="찜하기"
        >
          <Heart 
            className={`w-4 h-4 ${phone.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        {/* 제안 가능 표시 */}
        {phone.acceptOffers && (
          <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded font-medium">
            가격제안 가능
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-3">
        {/* 모델명 */}
        <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {phone.model}
        </h3>

        {/* 가격 */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(phone.price)}
          </span>
          {phone.minOfferPrice && (
            <span className="text-xs text-gray-500">
              (최소 {formatPrice(phone.minOfferPrice)})
            </span>
          )}
        </div>

        {/* 상태 정보 */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
          {phone.conditionGrade && (
            <span className="inline-flex items-center">
              <span className={`
                px-1.5 py-0.5 rounded font-medium
                ${phone.conditionGrade === 'A' ? 'bg-green-100 text-green-700' : ''}
                ${phone.conditionGrade === 'B' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${phone.conditionGrade === 'C' ? 'bg-orange-100 text-orange-700' : ''}
              `}>
                {CONDITION_GRADES[phone.conditionGrade]}
              </span>
            </span>
          )}
          {phone.storage && (
            <span>{phone.storage}GB</span>
          )}
        </div>

        {/* 배터리 상태 */}
        {phone.batteryStatus && phone.batteryStatus !== 'unknown' && (
          <div className="mt-1 text-xs text-gray-600">
            배터리 {BATTERY_STATUS_LABELS[phone.batteryStatus]}
          </div>
        )}

        {/* 위치 정보 */}
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span className="truncate">
            {phone.sigungu || phone.sido || '지역 미정'}
          </span>
        </div>

        {/* 하단 정보 */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {phone.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {phone.offerCount || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(phone.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
});

UsedPhoneCard.displayName = 'UsedPhoneCard';

export default UsedPhoneCard;