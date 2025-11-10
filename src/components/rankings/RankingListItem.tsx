'use client';

import { PlaceRanking } from '@/types/ranking';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, MapPin, ExternalLink } from 'lucide-react';

interface RankingListItemProps {
  place: PlaceRanking;
  rank: number;
}

export default function RankingListItem({ place, rank }: RankingListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 랭킹 번호 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
            {rank}
          </div>

          {/* 매장 사진 (있으면) */}
          {place.photoUrl && (
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
              <img
                src={place.photoUrl}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-lg mb-1">{place.name}</h4>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{place.address}</span>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{place.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>{place.userRatingCount.toLocaleString()}개</span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(place.googleMapsUrl, '_blank')}
              >
                <MapPin className="w-3 h-3 mr-1" />
                구글 지도
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => window.open(place.naverSearchUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                네이버 리뷰
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
