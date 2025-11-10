'use client';

import { useState, useMemo } from 'react';
import { PlaceRanking, SortType } from '@/types/ranking';
import { sortPlaces } from '@/lib/api/googlePlaces';
import PodiumCard from './PodiumCard';
import RankingListItem from './RankingListItem';
import DebugInfo from './DebugInfo';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RankingsListProps {
  initialPlaces: PlaceRanking[];
  city: string;
  category: string;
  placeType: string;
}

export default function RankingsList({ initialPlaces, city, category, placeType }: RankingsListProps) {
  const [sortBy, setSortBy] = useState<SortType>('popularity');
  const [showAll, setShowAll] = useState(false);

  // 서버에서 받은 데이터 확인
  console.log('🎯 [RankingsList] 서버에서 받은 데이터:', {
    initialPlacesLength: initialPlaces.length,
    city,
    category,
    placeType
  });

  // 정렬된 장소 목록
  const sortedPlaces = useMemo(() => {
    return sortPlaces(initialPlaces, sortBy);
  }, [initialPlaces, sortBy]);

  // Top 3와 나머지 분리
  const top3 = sortedPlaces.slice(0, 3);
  const rest = sortedPlaces.slice(3);

  if (sortedPlaces.length === 0) {
    return (
      <div className="space-y-4">
        <DebugInfo city={city} category={category} placeType={placeType} />
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            검색 결과가 없습니다. 다른 지역이나 카테고리를 선택해보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 디버그 정보 */}
      <DebugInfo city={city} category={category} placeType={placeType} />

      {/* 정렬 옵션 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {city} {category}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {sortedPlaces.length}개의 업체를 찾았습니다
          </p>
        </div>

        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
          <TabsList>
            <TabsTrigger value="popularity">인기순</TabsTrigger>
            <TabsTrigger value="rating">평점순</TabsTrigger>
            <TabsTrigger value="reviews">리뷰순</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top 3 포디움 */}
      {top3.length >= 3 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:gap-6">
          {/* 2위 (왼쪽 아래) */}
          <PodiumCard place={top3[1]} rank={2} />

          {/* 1위 (중앙 상단, 2열 차지) */}
          <PodiumCard place={top3[0]} rank={1} />

          {/* 3위 (오른쪽 아래) */}
          <PodiumCard place={top3[2]} rank={3} />
        </div>
      ) : (
        // Top 3가 3개 미만일 경우 일반 그리드
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {top3.map((place, index) => (
            <PodiumCard key={place.placeId} place={place} rank={(index + 1) as 1 | 2 | 3} />
          ))}
        </div>
      )}

      {/* 4위 이하 */}
      {rest.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              4위 ~ {sortedPlaces.length}위
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  더보기 ({rest.length})
                </>
              )}
            </Button>
          </div>

          {showAll && (
            <div className="space-y-3">
              {rest.map((place, index) => (
                <RankingListItem
                  key={place.placeId}
                  place={place}
                  rank={index + 4}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          💡 이 랭킹은 Google Places API의 평점과 리뷰 개수를 기반으로 산정되었습니다.
          더 자세한 정보는 구글 지도와 네이버에서 확인하세요!
        </p>
      </div>
    </div>
  );
}
