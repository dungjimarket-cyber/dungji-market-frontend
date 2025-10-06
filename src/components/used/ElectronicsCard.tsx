/**
 * 전자제품 카드 컴포넌트
 * 최적화: lazy loading, 이미지 최적화, 메모이제이션
 * UsedPhoneCard 기반으로 작성
 */

'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Clock, Eye, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UsedElectronics } from '@/types/electronics';

interface ElectronicsCardProps {
  electronics: Partial<UsedElectronics>;
  priority?: boolean; // 첫 번째 행 이미지 우선 로딩
  onFavorite?: (electronicsId: number) => void;
}

// 상태 등급 라벨
const CONDITION_GRADES = {
  'S': 'S급',
  'A': 'A급',
  'B': 'B급',
  'C': 'C급'
};

const ElectronicsCard = memo(function ElectronicsCard({
  electronics,
  priority = false,
  onFavorite
}: ElectronicsCardProps) {
  // 기본 이미지 설정
  const imageUrl = electronics.images?.[0]?.imageUrl;
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
    if (electronics.status === 'sold') {
      return;
    }
    if (electronics.id && onFavorite) {
      onFavorite(electronics.id);
    }
  };

  // 거래완료 상태 확인
  const isCompleted = electronics.status === 'sold';

  // 제품명 생성
  const productName = `${electronics.brand || ''} ${electronics.model_name || ''}`.trim() || '전자제품';

  return (
    <Link
      href={`/used-electronics/${electronics.id}`}
      className={`group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={productName}
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
        {electronics.status === 'trading' && (
          <>
            <div className="absolute inset-0 bg-black/30 z-10" />
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs rounded font-medium z-20">
              거래중
            </div>
          </>
        )}
        {electronics.status === 'sold' && (
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
              electronics.is_favorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            aria-label="찜하기"
          >
            <Heart
              className={`w-4 h-4 ${electronics.is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}

      </div>

      {/* 정보 영역 */}
      <div className="p-3">
        {/* 제품명 */}
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {productName}
        </h3>


        {/* 가격 */}
        <div className="mt-2">
          {isCompleted ? (
            // 거래완료 상품 - 가격만 표시
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-700">
                {formatPrice(electronics.price)}
              </span>
            </div>
          ) : (
            // 판매중 상품 가격 표시
            <>
              {electronics.accept_offers && electronics.min_offer_price ? (
                <>
                  {/* 최소제안가를 먼저 크게 표시 */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-blue-600 font-medium">가격제안</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(electronics.min_offer_price)}~
                    </span>
                  </div>
                  {/* 즉시구매가는 작게 부가정보로 */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">
                      즉시구매 {formatPrice(electronics.price)}
                    </span>
                  </div>
                </>
              ) : (
                /* 제안불가 상품은 즉시구매가만 표시 */
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">즉시구매</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(electronics.price)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 상태 정보 */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
          {electronics.condition_grade && (
            <span className="inline-flex items-center">
              <span className={`
                px-1.5 py-0.5 rounded font-medium
                ${electronics.condition_grade === 'S' ? 'bg-blue-100 text-blue-700' : ''}
                ${electronics.condition_grade === 'A' ? 'bg-green-100 text-green-700' : ''}
                ${electronics.condition_grade === 'B' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${electronics.condition_grade === 'C' ? 'bg-orange-100 text-orange-700' : ''}
              `}>
                {CONDITION_GRADES[electronics.condition_grade as keyof typeof CONDITION_GRADES] || electronics.condition_grade}
              </span>
            </span>
          )}
        </div>

        {/* 위치 정보 - 여러 지역 표시 */}
        <div className="mt-2 text-xs text-gray-500">
          {electronics.regions && electronics.regions.length > 0 ? (
            <div className="space-y-0.5">
              {electronics.regions.map((region: any, index: number) => (
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
                {electronics.region_name || '지역 미정'}
              </span>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {electronics.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {electronics.offer_count || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(electronics.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
});

ElectronicsCard.displayName = 'ElectronicsCard';

export default ElectronicsCard;