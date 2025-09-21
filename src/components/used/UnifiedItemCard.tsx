/**
 * 통합 아이템 카드 컴포넌트
 * 휴대폰과 전자제품을 모두 표시
 */

'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, MessageCircle, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UnifiedMarketItem } from '@/types/market';
import {
  isPhoneItem,
  isElectronicsItem,
  getMainImageUrl,
  getItemTitle,
  getItemDetailUrl,
  getSellerNickname
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

const UnifiedItemCard = memo(function UnifiedItemCard({
  item,
  priority = false,
  onFavorite
}: UnifiedItemCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(item.id);
    }
  };

  // 상태에 따른 배지 스타일
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trading':
        return 'secondary';
      case 'sold':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '판매중';
      case 'trading':
        return '거래중';
      case 'sold':
        return '판매완료';
      default:
        return status;
    }
  };

  // 지역 정보 가져오기
  const getRegionDisplay = () => {
    if (item.regions && item.regions.length > 0) {
      const firstRegion = item.regions[0];
      const regionName = firstRegion.dong || firstRegion.sigungu || firstRegion.name;
      return item.regions.length > 1
        ? `${regionName} 외 ${item.regions.length - 1}곳`
        : regionName;
    }
    return '지역 미정';
  };

  return (
    <Link href={getItemDetailUrl(item)} className="block">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        {/* 이미지 섹션 */}
        <div className="relative aspect-square">
          <Image
            src={getMainImageUrl(item)}
            alt={getItemTitle(item)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            priority={priority}
          />

          {/* 상태 배지 */}
          <div className="absolute top-2 left-2">
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {getStatusText(item.status)}
            </Badge>
          </div>

          {/* 찜 버튼 */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
            aria-label="찜하기"
          >
            <Heart
              className={`w-4 h-4 ${
                ((item as any).is_favorited || (item as any).is_favorite) ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>

          {/* 아이템 타입 표시 */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs bg-white/90">
              {isPhoneItem(item) ? '휴대폰' : '전자제품'}
            </Badge>
          </div>
        </div>

        {/* 정보 섹션 */}
        <div className="p-3">
          {/* 카테고리/제조사 */}
          <div className="text-xs text-gray-500 mb-1">
            {isPhoneItem(item) ? (
              item.brand
            ) : (
              ELECTRONICS_SUBCATEGORIES[item.subcategory as keyof typeof ELECTRONICS_SUBCATEGORIES] || item.subcategory
            )}
          </div>

          {/* 제목 */}
          <h3 className="font-medium text-sm mb-1 line-clamp-2">
            {getItemTitle(item)}
          </h3>

          {/* 상태 정보 */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            {isPhoneItem(item) ? (
              <>
                {item.condition_grade && (
                  <span>{PHONE_CONDITIONS[item.condition_grade as keyof typeof PHONE_CONDITIONS]}</span>
                )}
                {item.storage && (
                  <>
                    <span>·</span>
                    <span>{item.storage}GB</span>
                  </>
                )}
              </>
            ) : (
              <>
                {item.condition_grade && (
                  <span>{ELEC_CONDITIONS[item.condition_grade as keyof typeof ELEC_CONDITIONS]?.split(' ')[0]}</span>
                )}
                {item.brand && (
                  <>
                    <span>·</span>
                    <span>{item.brand}</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* 가격 */}
          <div className="font-bold text-base mb-2">
            {item.price.toLocaleString()}원
            {item.accept_offers && (
              <span className="text-xs font-normal text-blue-600 ml-1">제안가능</span>
            )}
          </div>

          {/* 위치 */}
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            {getRegionDisplay()}
          </div>

          {/* 통계 정보 */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {item.view_count}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="w-3 h-3" />
              {item.favorite_count}
            </span>
            {item.offer_count > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" />
                {item.offer_count}
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default UnifiedItemCard;