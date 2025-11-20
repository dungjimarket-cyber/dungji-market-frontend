'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { regions } from '@/lib/regions';
import { LocalBusinessCategory, LocalBusinessList } from '@/types/localBusiness';
import { fetchCategories, fetchBusinesses } from '@/lib/api/localBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Star, Phone, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LocalBusinessesPage() {
  const { user } = useAuth();

  // 상태
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<LocalBusinessCategory | null>(null);
  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<LocalBusinessList[]>([]);
  const [loading, setLoading] = useState(false);

  // 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 초기 지역 설정
  useEffect(() => {
    if (categories.length === 0) return;

    const initializeRegion = () => {
      // 사용자 활동지역이 있으면 사용
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

    // 첫 번째 카테고리 선택
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, user]);

  // 지역 또는 카테고리 변경 시 검색
  useEffect(() => {
    if (selectedCity && selectedCategory) {
      loadBusinesses();
    }
  }, [selectedCity, selectedCategory]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const loadBusinesses = async () => {
    if (!selectedCity || !selectedCategory) return;

    setLoading(true);
    try {
      const data = await fetchBusinesses({
        // region 필터는 나중에 추가 (현재는 전체 조회 후 클라이언트 필터)
        category: selectedCategory.id,
        ordering: 'rank_in_region'
      });

      // 클라이언트 사이드 필터링 (선택한 지역만)
      const filtered = data.filter(b => b.region_name === selectedCity);
      setBusinesses(filtered);
    } catch (error) {
      console.error('업체 로드 실패:', error);
      setBusinesses([]);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl mb-3">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            지역 전문업체 정보
          </h1>
          <p className="text-sm text-muted-foreground">
            Google 리뷰 기반 우리 동네 전문가 찾기
          </p>
        </div>

        {/* 검색 필터 */}
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              value={selectedCategory?.id.toString() || ''}
              onValueChange={(id) => {
                const cat = categories.find(c => c.id === parseInt(id));
                if (cat) setSelectedCategory(cat);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* 결과 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">검색 중...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-2">
              다른 지역이나 업종을 선택해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 상위 정보 */}
            <div className="text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 inline mr-1" />
              {selectedCity} {selectedCategory?.name} • 총 {businesses.length}개
            </div>

            {/* 업체 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {businesses.map((business, index) => (
                <Link
                  key={business.id}
                  href={`/local-businesses/${business.id}`}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {/* 사진 */}
                    {business.photo_url && (
                      <div className="relative h-40 w-full">
                        <img
                          src={business.photo_url}
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                        {/* 랭킹 배지 */}
                        <div className="absolute top-2 left-2">
                          <Badge className={`
                            ${business.rank_in_region === 1 ? 'bg-yellow-500' : ''}
                            ${business.rank_in_region === 2 ? 'bg-gray-400' : ''}
                            ${business.rank_in_region === 3 ? 'bg-orange-500' : ''}
                            ${business.rank_in_region >= 4 ? 'bg-muted' : ''}
                            text-white font-bold
                          `}>
                            {business.rank_in_region}위
                          </Badge>
                        </div>
                        {/* 신규/인증 배지 */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {business.is_new && (
                            <Badge className="bg-green-500 text-white">
                              <Sparkles className="w-3 h-3 mr-1" />
                              신규
                            </Badge>
                          )}
                          {business.is_verified && (
                            <Badge className="bg-blue-500 text-white">인증</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 정보 */}
                    <CardContent className="p-4 space-y-2">
                      {/* 사진 없을 때 랭킹 */}
                      {!business.photo_url && (
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`
                            ${business.rank_in_region === 1 ? 'bg-yellow-500' : ''}
                            ${business.rank_in_region === 2 ? 'bg-gray-400' : ''}
                            ${business.rank_in_region === 3 ? 'bg-orange-500' : ''}
                            ${business.rank_in_region >= 4 ? 'bg-muted' : ''}
                            text-white font-bold
                          `}>
                            {business.rank_in_region}위
                          </Badge>
                          <div className="flex gap-1">
                            {business.is_new && (
                              <Badge className="bg-green-500 text-white text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                신규
                              </Badge>
                            )}
                            {business.is_verified && (
                              <Badge className="bg-blue-500 text-white text-xs">인증</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <h3 className="font-bold text-base line-clamp-1">{business.name}</h3>

                      {business.rating && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{business.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            리뷰 {business.review_count.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground line-clamp-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {business.address}
                      </p>

                      {business.phone_number && (
                        <p className="text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 inline mr-1" />
                          {business.phone_number}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
