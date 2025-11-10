'use client';

import { PlaceRanking } from '@/types/ranking';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, MapPin, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PodiumCardProps {
  place: PlaceRanking;
  rank: 1 | 2 | 3;
}

export default function PodiumCard({ place, rank }: PodiumCardProps) {
  const isFirst = rank === 1;

  // 랭킹별 스타일
  const rankStyles = {
    1: {
      container: 'lg:col-span-2 lg:row-start-1',
      badge: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-lg w-12 h-12',
      card: 'border-4 border-yellow-400 shadow-xl shadow-yellow-200',
      title: 'text-2xl',
      iconSize: 'w-6 h-6'
    },
    2: {
      container: 'lg:col-start-1 lg:row-start-2',
      badge: 'bg-gradient-to-r from-gray-300 to-gray-400 text-white w-10 h-10',
      card: 'border-2 border-gray-300 shadow-lg',
      title: 'text-xl',
      iconSize: 'w-5 h-5'
    },
    3: {
      container: 'lg:col-start-3 lg:row-start-2',
      badge: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white w-10 h-10',
      card: 'border-2 border-orange-300 shadow-lg',
      title: 'text-xl',
      iconSize: 'w-5 h-5'
    }
  };

  const style = rankStyles[rank];

  return (
    <div className={style.container}>
      <Card className={`${style.card} hover:scale-[1.02] transition-transform duration-300`}>
        <CardContent className="p-6 space-y-4">
          {/* 랭킹 배지 */}
          <div className="flex items-start justify-between">
            <div className={`${style.badge} rounded-full flex items-center justify-center font-bold shadow-lg`}>
              {rank}
            </div>
            <Badge variant="secondary" className="text-xs">
              인기도 {place.popularityScore.toFixed(1)}
            </Badge>
          </div>

          {/* 업체명 */}
          <div>
            <h3 className={`${style.title} font-bold leading-tight mb-2`}>
              {place.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{place.address}</span>
            </div>
          </div>

          {/* 평점 & 리뷰 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className={`${style.iconSize} fill-yellow-400 text-yellow-400`} />
              <span className="text-lg font-bold">{place.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className={`${style.iconSize}`} />
              <span className="text-sm">
                {place.userRatingCount.toLocaleString()}개
              </span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size={isFirst ? 'default' : 'sm'}
              className="w-full"
              onClick={() => window.open(place.googleMapsUrl, '_blank')}
            >
              <MapPin className="w-4 h-4 mr-1" />
              구글 지도
            </Button>
            <Button
              variant="outline"
              size={isFirst ? 'default' : 'sm'}
              className="w-full text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => window.open(place.naverSearchUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              네이버 리뷰
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
