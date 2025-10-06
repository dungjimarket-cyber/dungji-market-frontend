/**
 * 통합 아이템 카드 컴포넌트
 * 휴대폰과 전자제품을 모두 표시
 */

'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Edit3, MapPin, Eye, MessageCircle, Clock } from 'lucide-react';
import type { UnifiedMarketItem } from '@/types/market';
import {
  isPhoneItem,
  getMainImageUrl,
  getItemTitle,
  getItemDetailUrl,
} from '@/types/market';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CONDITION_GRADES as PHONE_CONDITIONS } from '@/types/used';
import { CONDITION_GRADES as ELEC_CONDITIONS, ELECTRONICS_SUBCATEGORIES } from '@/types/electronics';

interface UnifiedItemCardProps {
  item: UnifiedMarketItem;
  priority?: boolean;
  onFavorite?: (itemId: number) => void;
}

// 상태 등급 라벨 (휴대폰)
const PHONE_CONDITION_LABELS: Record<string, string> = {
  'S': 'S급',
  'A': 'A급',
  'B': 'B급',
  'C': 'C급'
};

// 배터리 상태 라벨
const BATTERY_STATUS_LABELS: Record<string, string> = {
  'under_70': '70% 미만',
  '70_80': '70-80%',
  '80_85': '80-85%',
  '85_90': '85-90%',
  'over_90': '90% 이상',
  'replaced': '교체됨'
};

const UnifiedItemCard = memo(function UnifiedItemCard({
  item,
  priority = false,
  onFavorite
}: UnifiedItemCardProps) {

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
    if (item.status === 'sold' || item.status === 'completed') {
      return;
    }
    if (onFavorite) {
      onFavorite(item.id);
    }
  };

  // 거래완료 상태 확인
  const isCompleted = item.status === 'sold' || item.status === 'completed';

  // 찜 상태 확인
  const isFavorite = (item as any).is_favorited || (item as any).is_favorite;

  // 이미지 URL
  const imageUrl = getMainImageUrl(item);
  const hasImage = imageUrl && imageUrl !== '/images/phone-placeholder.png' && imageUrl !== '/images/electronics-placeholder.png';

  return (
    <Link
      href={getItemDetailUrl(item)}
      className={`group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={getItemTitle(item)}
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

        {/* 거래중 상태 */}
        {item.status === 'trading' && (
          <>
            <div className="absolute inset-0 bg-black/30 z-10" />
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs rounded font-medium z-20">
              거래중
            </div>
          </>
        )}
        {item.status === 'sold' && (
          <>
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="text-white text-lg font-bold">거래완료</span>
            </div>
          </>
        )}

        {/* 찜하기 버튼 - 항상 표시, 거래 완료 상품은 표시하지 않음 */}
        {!isCompleted && (
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200 hover:bg-white opacity-100"
            aria-label="찜하기"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}

        {/* 수정됨 표시 */}
        {(item as any).is_modified && item.offer_count && item.offer_count > 0 && (
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
                {formatPrice((item as any).final_price || item.price)}
              </span>
            </div>
          ) : (
            // 판매중 상품 가격 표시
            <>
              {item.accept_offers && (item as any).min_offer_price ? (
                <>
                  {/* 최소제안가를 먼저 크게 표시 */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-blue-600 font-medium">가격제안</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice((item as any).min_offer_price)}~
                    </span>
                  </div>
                  {/* 즉시구매가는 작게 부가정보로 */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">
                      즉시구매 {formatPrice(item.price)}
                    </span>
                  </div>
                </>
              ) : (
                /* 제안불가 상품은 즉시구매가만 표시 */
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">즉시구매</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(item.price)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 모델명/제품명 */}
        <h3 className="mt-2 font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {getItemTitle(item)}
        </h3>

        {/* 상태 정보 */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
          {isPhoneItem(item) ? (
            <>
              {item.condition_grade && (
                <span className="inline-flex items-center">
                  <span className={`
                    px-1.5 py-0.5 rounded font-medium
                    ${item.condition_grade === 'S' ? 'bg-blue-100 text-blue-700' : ''}
                    ${item.condition_grade === 'A' ? 'bg-green-100 text-green-700' : ''}
                    ${item.condition_grade === 'B' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${item.condition_grade === 'C' ? 'bg-orange-100 text-orange-700' : ''}
                  `}>
                    {PHONE_CONDITION_LABELS[item.condition_grade]}
                  </span>
                </span>
              )}
              {item.storage && (
                <span>{item.storage}GB</span>
              )}
            </>
          ) : (
            <>
              {/* 전자제품 상태: 미개봉 또는 등급 */}
              {((item as any).is_unused || item.condition_grade) && (
                <span className="inline-flex items-center">
                  <span className={`
                    px-1.5 py-0.5 rounded font-medium
                    ${(item as any).is_unused ? 'bg-purple-100 text-purple-700' : ''}
                    ${!((item as any).is_unused) && item.condition_grade === 'S' ? 'bg-blue-100 text-blue-700' : ''}
                    ${!((item as any).is_unused) && item.condition_grade === 'A' ? 'bg-green-100 text-green-700' : ''}
                    ${!((item as any).is_unused) && item.condition_grade === 'B' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${!((item as any).is_unused) && item.condition_grade === 'C' ? 'bg-orange-100 text-orange-700' : ''}
                  `}>
                    {(item as any).is_unused ? '미개봉' : `${item.condition_grade}급`}
                  </span>
                </span>
              )}
              {/* 카테고리 표시 */}
              <span className="text-xs text-gray-500">
                {ELECTRONICS_SUBCATEGORIES[item.subcategory as keyof typeof ELECTRONICS_SUBCATEGORIES] || item.subcategory}
              </span>
            </>
          )}
        </div>

        {/* 배터리 상태 (휴대폰만) */}
        {isPhoneItem(item) && (item as any).battery_status && (
          <div className="mt-1 text-xs text-gray-600">
            배터리 {BATTERY_STATUS_LABELS[(item as any).battery_status]}
          </div>
        )}

        {/* 위치 정보 - 여러 지역 표시 */}
        <div className="mt-2 text-xs text-gray-500">
          {item.regions && item.regions.length > 0 ? (
            <div className="space-y-0.5">
              {item.regions.map((region: any, index: number) => (
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
                지역 미정
              </span>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {item.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {item.offer_count || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
});

export default UnifiedItemCard;