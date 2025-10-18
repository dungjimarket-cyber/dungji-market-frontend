/**
 * 중고폰 카드 컴포넌트
 * 최적화: lazy loading, 이미지 최적화, 메모이제이션
 */

'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Clock, Eye, MessageCircle, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UsedPhone, CONDITION_GRADES, BATTERY_STATUS_LABELS, PHONE_BRANDS } from '@/types/used';

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
  const imageUrl = phone.images?.[0]?.imageUrl;
  const hasImage = !!imageUrl;
  
  // 가격 포맷팅
  const formatPrice = (price?: number) => {
    if (!price) return '가격 협의';
    return `${price.toLocaleString('ko-KR')}원`;
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
    // 거래 완료 상품은 찜하기 불가
    if (phone.status === 'sold' || phone.status === 'completed') {
      return;
    }
    if (phone.id && onFavorite) {
      onFavorite(phone.id);
    }
  };

  // 거래완료 상태 확인
  const isCompleted = phone.status === 'sold' || phone.status === 'completed';

  return (
    <Link
      href={`/used/${phone.id}`}
      className={`group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={phone.model || '중고폰'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
              isCompleted ? 'grayscale' : ''
            }`}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}

        {/* 거래완료 오버레이 */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white/95 rounded-lg px-4 py-2">
              <span className="text-sm font-bold text-gray-700">거래완료</span>
            </div>
          </div>
        )}

        {/* 상태 뱃지 */}
        {phone.status === 'trading' && (
          <>
            <div className="absolute inset-0 bg-black/30 z-10" />
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs rounded font-medium z-20">
              거래중
            </div>
          </>
        )}
        {phone.status === 'sold' && (
          <>
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="text-white text-lg font-bold">거래완료</span>
            </div>
          </>
        )}
        
        {/* 찜하기 버튼 - 거래 완료 상품은 표시하지 않음 */}
        {!isCompleted && (
          <button
            onClick={handleFavorite}
            className={`absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200 hover:bg-white ${
              phone.is_favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            aria-label="찜하기"
          >
            <Heart
              className={`w-4 h-4 ${phone.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}

        {/* 제안 가능 표시 - 제거 (가격에 통합) */}
        
        {/* 수정됨 표시 */}
        {phone.is_modified && phone.offer_count && phone.offer_count > 0 && (
          <div className="absolute bottom-2 right-2 bg-yellow-500/90 backdrop-blur-sm text-white px-2 py-1 text-xs rounded font-medium flex items-center gap-1">
            <Edit3 className="w-3 h-3" />
            수정됨
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-3">
        {/* 가격 */}
        <div>
          {isCompleted ? (
            // 거래완료 상품 - 거래가격만 표시
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-700">
                {formatPrice(phone.final_price || phone.price)}
              </span>
            </div>
          ) : (
            // 판매중 상품 가격 표시
            <>
              {phone.accept_offers && phone.min_offer_price ? (
                <>
                  {/* 최소제안가를 먼저 크게 표시 */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(phone.min_offer_price)}~
                    </span>
                  </div>
                  {/* 즉시구매가는 작게 부가정보로 */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">
                      즉시구매 {formatPrice(phone.price)}
                    </span>
                  </div>
                </>
              ) : (
                /* 제안불가 상품은 즉시구매가만 표시 */
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">즉시구매</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(phone.price)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 모델명 */}
        <h3 className="mt-2 font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {phone.brand && PHONE_BRANDS[phone.brand] ? `${PHONE_BRANDS[phone.brand]} ` : ''}{phone.model}
        </h3>

        {/* 상태 정보 */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
          {phone.condition_grade && (
            <span className="inline-flex items-center">
              <span className={`
                px-1.5 py-0.5 rounded font-medium
                ${phone.condition_grade === 'S' ? 'bg-blue-100 text-blue-700' : ''}
                ${phone.condition_grade === 'A' ? 'bg-green-100 text-green-700' : ''}
                ${phone.condition_grade === 'B' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${phone.condition_grade === 'C' ? 'bg-orange-100 text-orange-700' : ''}
              `}>
                {CONDITION_GRADES[phone.condition_grade]}
              </span>
            </span>
          )}
          {phone.storage && (
            <span>{phone.storage}GB</span>
          )}
        </div>

        {/* 배터리 상태 */}
        {phone.battery_status && (
          <div className="mt-1 text-xs text-gray-600">
            배터리 {BATTERY_STATUS_LABELS[phone.battery_status]}
          </div>
        )}

        {/* 위치 정보 - 여러 지역 표시 */}
        <div className="mt-2 text-xs text-gray-500">
          {phone.regions && phone.regions.length > 0 ? (
            <div className="space-y-0.5">
              {phone.regions.map((region: any, index: number) => (
                <div key={index} className="flex items-center gap-1">
                  {index === 0 && <MapPin className="w-3 h-3" />}
                  {index > 0 && <span className="w-3" />}
                  <span className="truncate">
                    {region.full_name || region.name || '지역 미정'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {phone.region_name || '지역 미정'}
              </span>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {phone.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {phone.offer_count || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(phone.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
});

UsedPhoneCard.displayName = 'UsedPhoneCard';

export default UsedPhoneCard;