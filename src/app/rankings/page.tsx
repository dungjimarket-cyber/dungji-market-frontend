'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { regions } from '@/lib/regions';
import { POPULAR_CATEGORIES, PlaceRanking } from '@/types/ranking';
import { fetchPlaceRankings, sortPlaces } from '@/lib/api/googlePlaces';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, MapPin, Star, MessageSquare, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RankingsPage() {
  const { user } = useAuth();

  // 상태
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState(POPULAR_CATEGORIES[0]);
  const [cities, setCities] = useState<string[]>([]);
  const [places, setPlaces] = useState<PlaceRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'popularity'>('popularity');

  // 초기 지역 설정
  useEffect(() => {
    const initializeRegion = () => {
      // 사용자 활동지역이 있으면 사용 (address_region 객체 또는 region 문자열)
      const userRegion = user?.address_region?.name || user?.region;

      if (userRegion) {
        // regions 배열에서 해당 지역 찾기
        for (const region of regions) {
          if (region.cities.includes(userRegion)) {
            setSelectedProvince(region.name);
            setCities(region.cities);
            setSelectedCity(userRegion);
            return;
          }
        }
      }

      // 기본값: 서울 강남구
      const seoul = regions.find(r => r.name === '서울');
      if (seoul) {
        setSelectedProvince('서울');
        setCities(seoul.cities);
        setSelectedCity('강남구');
      }
    };

    initializeRegion();
  }, [user]);

  // 지역 변경 시 검색 결과 로드
  useEffect(() => {
    if (selectedCity && selectedCategory) {
      loadRankings();
    }
  }, [selectedCity, selectedCategory]);

  // 랭킹 데이터 로드
  const loadRankings = async () => {
    if (!selectedCity) return;

    setLoading(true);
    try {
      const results = await fetchPlaceRankings(
        selectedCity,
        selectedCategory.label,
        selectedCategory.placeType
      );
      setPlaces(results);
    } catch (error) {
      console.error('랭킹 로드 실패:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // 시/도 선택 핸들러
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    const region = regions.find(r => r.name === province);
    setCities(region?.cities || []);
    setSelectedCity('');
  };

  // 정렬된 결과
  const sortedPlaces = sortPlaces(places, sortBy);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            지역별 업체 랭킹
          </h1>
          <p className="text-sm text-muted-foreground">
            Google 리뷰 기반 우리 동네 인기 업체
          </p>
        </div>

        {/* 검색 필터 */}
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 시/도 */}
            <Select value={selectedProvince} onValueChange={handleProvinceChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="시/도" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 시/군/구 */}
            <Select
              value={selectedCity}
              onValueChange={setSelectedCity}
              disabled={!selectedProvince}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="시/군/구" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 카테고리 */}
            <Select
              value={selectedCategory.id}
              onValueChange={(id) => {
                const cat = POPULAR_CATEGORIES.find(c => c.id === id);
                if (cat) setSelectedCategory(cat);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 정렬 */}
            <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="popularity" className="text-xs">인기</TabsTrigger>
                <TabsTrigger value="rating" className="text-xs">평점</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs">리뷰</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        {/* 결과 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">검색 중...</p>
          </div>
        ) : sortedPlaces.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 상위 정보 */}
            <div className="text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 inline mr-1" />
              {selectedCity} {selectedCategory.label} • 총 {sortedPlaces.length}개
            </div>

            {/* 랭킹 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedPlaces.map((place, index) => (
                <Card
                  key={place.placeId}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.open(place.googleMapsUrl, '_blank')}
                >
                  {/* 사진 */}
                  {place.photoUrl && (
                    <div className="relative h-32 w-full">
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                      {/* 랭킹 배지 */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`
                          ${index === 0 ? 'bg-yellow-500' : ''}
                          ${index === 1 ? 'bg-gray-400' : ''}
                          ${index === 2 ? 'bg-orange-500' : ''}
                          ${index >= 3 ? 'bg-muted' : ''}
                          text-white font-bold
                        `}>
                          {index + 1}위
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* 정보 */}
                  <div className="p-3 space-y-2">
                    {/* 사진 없을 때 랭킹 */}
                    {!place.photoUrl && (
                      <Badge className={`
                        ${index === 0 ? 'bg-yellow-500' : ''}
                        ${index === 1 ? 'bg-gray-400' : ''}
                        ${index === 2 ? 'bg-orange-500' : ''}
                        ${index >= 3 ? 'bg-muted' : ''}
                        text-white font-bold
                      `}>
                        {index + 1}위
                      </Badge>
                    )}

                    <h3 className="font-bold text-sm line-clamp-1">{place.name}</h3>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{place.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-xs">{place.userRatingCount.toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {place.address}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
