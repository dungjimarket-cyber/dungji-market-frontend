'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { regions } from '@/lib/regions';
import { LocalBusinessCategory, LocalBusinessList } from '@/types/localBusiness';
import { fetchCategories, fetchBusinesses } from '@/lib/api/localBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, MapPin, Star, Phone, ExternalLink, Copy, Map } from 'lucide-react';
import { toast } from 'sonner';
import KakaoMap from '@/components/kakao/KakaoMap';

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
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<LocalBusinessList | null>(null);

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
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      setCategories([]);
    }
  };

  const loadBusinesses = async () => {
    if (!selectedCity || !selectedCategory) return;

    setLoading(true);
    try {
      // 지역명을 전체 형식으로 변환
      const fullRegionName = `${selectedProvince === '서울' ? '서울특별시' : selectedProvince === '경기' ? '경기도' : selectedProvince} ${selectedCity}`;

      const data = await fetchBusinesses({
        region_name: fullRegionName,
        category: selectedCategory.id,
        ordering: 'rank_in_region'
      });

      if (Array.isArray(data)) {
        setBusinesses(data);
      } else {
        setBusinesses([]);
      }
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

  // 주소 복사
  const handleCopyAddress = (address: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(address);
    toast.success('복사 완료');
  };

  // 전화걸기
  const handleCall = (phone: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.location.href = `tel:${phone}`;
  };

  // 지도 보기
  const handleShowMap = (business: LocalBusinessList, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBusiness(business);
    setMapDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* 헤더 */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl mb-2 sm:mb-3">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            지역 전문업체 정보
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Google 리뷰 기반 우리 동네 전문가 찾기
          </p>
        </div>

        {/* 지역 선택 */}
        <Card className="mb-4 p-3 sm:p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <MapPin className="w-4 h-4" />
              <span>지역 선택</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* 시/도 */}
              <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                <SelectTrigger className="h-9 sm:h-10">
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
                <SelectTrigger className="h-9 sm:h-10">
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
            </div>
          </div>
        </Card>

        {/* 업종 선택 (버튼식) */}
        <Card className="mb-4 p-3 sm:p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Building2 className="w-4 h-4" />
              <span>업종 선택</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory?.id === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className={`h-auto py-3 px-2 flex flex-col items-center gap-1 transition-all ${
                    selectedCategory?.id === cat.id
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'hover:border-primary'
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium whitespace-nowrap">{cat.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* 결과 */}
        {loading ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">검색 중...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              다른 지역이나 업종을 선택해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* 상위 정보 */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground px-1">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{selectedCity} {selectedCategory?.name}</span>
              <span className="text-primary font-medium">• 총 {businesses.length}개</span>
            </div>

            {/* 업체 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {businesses.map((business) => (
                <Card key={business.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
                  {/* 사진 또는 대체 이미지 */}
                  <div className="relative h-44 sm:h-48 w-full bg-slate-100">
                    {business.has_photo ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/local-businesses/${business.id}/photo/`}
                        alt={business.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            e.currentTarget.style.display = 'none';
                            const fallback = parent.querySelector('.fallback-image');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'flex';
                            }
                          }
                        }}
                      />
                    ) : null}

                    {/* 대체 이미지 (사진 없을 때) */}
                    <div
                      className={`fallback-image w-full h-full bg-gradient-to-br ${
                        business.category_name === '변호사' ? 'from-blue-400 to-blue-600' :
                        business.category_name === '세무사' ? 'from-green-400 to-green-600' :
                        business.category_name === '법무사' ? 'from-indigo-400 to-indigo-600' :
                        business.category_name === '부동산' ? 'from-orange-400 to-orange-600' :
                        business.category_name === '인테리어' ? 'from-purple-400 to-purple-600' :
                        business.category_name === '휴대폰매장' ? 'from-pink-400 to-pink-600' :
                        business.category_name === '자동차정비' ? 'from-gray-400 to-gray-600' :
                        'from-slate-400 to-slate-600'
                      } flex items-center justify-center`}
                      style={{ display: business.has_photo ? 'none' : 'flex' }}
                    >
                      <div className="text-center text-white">
                        <div className="text-5xl sm:text-6xl mb-2">{business.category_icon}</div>
                        <div className="text-xs sm:text-sm font-medium opacity-90">{business.category_name}</div>
                      </div>
                    </div>

                    {/* 랭킹 배지 */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`
                        ${business.rank_in_region === 1 ? 'bg-yellow-500 hover:bg-yellow-500' : ''}
                        ${business.rank_in_region === 2 ? 'bg-gray-400 hover:bg-gray-400' : ''}
                        ${business.rank_in_region === 3 ? 'bg-orange-500 hover:bg-orange-500' : ''}
                        ${business.rank_in_region >= 4 ? 'bg-slate-600 hover:bg-slate-600' : ''}
                        text-white font-bold text-xs shadow-md
                      `}>
                        {business.rank_in_region}위
                      </Badge>
                    </div>
                    {/* 인증 배지 */}
                    {business.is_verified && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-500 hover:bg-blue-500 text-white shadow-md">인증</Badge>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <h3 className="font-bold text-sm sm:text-base line-clamp-1">{business.name}</h3>

                    {business.rating && (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
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

                    {/* 액션 버튼 */}
                    <div className="flex gap-1.5 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8 px-2"
                        onClick={(e) => handleShowMap(business, e)}
                      >
                        <Map className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">지도</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8 px-2"
                        onClick={(e) => handleCopyAddress(business.address, e)}
                      >
                        <Copy className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">주소복사</span>
                      </Button>
                      {business.phone_number && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 px-2"
                          onClick={(e) => handleCall(business.phone_number!, e)}
                        >
                          <Phone className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">전화</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 지도 다이얼로그 */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Map className="w-4 h-4 sm:w-5 sm:h-5" />
              {selectedBusiness?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              {selectedBusiness?.address}
            </div>
            {selectedBusiness && (
              <KakaoMap
                address={selectedBusiness.address}
                placeName={selectedBusiness.name}
              />
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => {
                  if (selectedBusiness) {
                    handleCopyAddress(selectedBusiness.address);
                  }
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                주소복사
              </Button>
              {selectedBusiness?.phone_number && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    if (selectedBusiness?.phone_number) {
                      handleCall(selectedBusiness.phone_number);
                    }
                  }}
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  전화하기
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1 h-9"
                onClick={() => {
                  if (selectedBusiness) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBusiness.name + ' ' + selectedBusiness.address)}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Google 지도
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
