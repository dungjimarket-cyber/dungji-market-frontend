'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/contexts/AuthContext';
import { regions } from '@/lib/regions';
import { LocalBusinessCategory, LocalBusinessList } from '@/types/localBusiness';
import { fetchCategories, fetchBusinesses } from '@/lib/api/localBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Building2, MapPin, Star, Phone, ExternalLink, Copy, Map, Search } from 'lucide-react';
import { toast } from 'sonner';
import KakaoMap from '@/components/kakao/KakaoMap';

export default function LocalBusinessesPage() {
  const { user } = useAuth();

  // 상태 - 초기값을 서울로 설정
  const [selectedProvince, setSelectedProvince] = useState<string>('서울');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<LocalBusinessCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<LocalBusinessList[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<LocalBusinessList | null>(null);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [mapKey, setMapKey] = useState(0); // 지도 강제 재생성용
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 완료 플래그
  const [kakaoScriptLoaded, setKakaoScriptLoaded] = useState(false); // Kakao Script 로드 상태

  // IntersectionObserver용 ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);
  const nextUrlRef = useRef<string | null>(null);

  // 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 초기 지역 설정 (한 번만 실행)
  useEffect(() => {
    if (isInitialized) return;

    const initializeRegion = () => {
      // 서울 지역 데이터 설정
      const seoul = regions.find(r => r.name === '서울');
      if (seoul) {
        setCities(seoul.cities);
      }

      // 사용자 활동지역이 있으면 사용 (로그인 사용자)
      const userRegion = user?.address_region?.name || user?.region;

      if (userRegion) {
        console.log('[LocalBusinesses] User region:', userRegion);
        // regions 배열에서 해당 지역 찾기
        for (const region of regions) {
          if (region.cities.includes(userRegion)) {
            console.log('[LocalBusinesses] Found region:', region.name, 'City:', userRegion);
            setSelectedProvince(region.name);
            setCities(region.cities);
            setSelectedCity(userRegion);
            setIsInitialized(true);
            return;
          }
        }
      }

      // 기본값: 서울 전체 (비로그인 또는 지역 설정 없음)
      console.log('[LocalBusinesses] Using default: Seoul (전체)');
      setSelectedProvince('서울');
      setSelectedCity('all');
      setIsInitialized(true);
    };

    initializeRegion();
  }, [user, isInitialized]);

  // 지역/카테고리/검색어 변경 시 검색
  useEffect(() => {
    if (selectedProvince) {
      loadBusinesses();
    }
  }, [selectedProvince, selectedCity, selectedCategory, searchQuery]);

  // 무한스크롤 IntersectionObserver 설정
  useEffect(() => {
    nextUrlRef.current = nextUrl;
  }, [nextUrl]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && nextUrlRef.current && !loadingMoreRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore]);

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
    if (!selectedProvince) return;

    setLoading(true);
    try {
      // 지역명을 전체 형식으로 변환
      // selectedCity가 'all'이면 시/도만 검색 (전체)
      let regionParam: string;
      if (selectedCity && selectedCity !== 'all') {
        // 특정 시/군/구 선택
        const fullRegionName = `${selectedProvince === '서울' ? '서울특별시' : selectedProvince === '경기' ? '경기도' : selectedProvince} ${selectedCity}`;
        regionParam = fullRegionName;
      } else {
        // 시/도만 선택 (전체 검색)
        regionParam = selectedProvince === '서울' ? '서울특별시' : selectedProvince === '경기' ? '경기도' : selectedProvince;
      }

      console.log('🔍 검색 조건:', {
        selectedProvince,
        selectedCity: selectedCity === 'all' ? '전체' : selectedCity,
        regionParam,
        category: selectedCategory?.name || '전체'
      });

      // URL 파라미터 구성 (카테고리와 검색어는 선택사항)
      const params = new URLSearchParams({
        region_name__icontains: regionParam,
        ordering: 'rank_in_region',
        page_size: '12'
      });

      // 카테고리가 선택되어 있으면 추가
      if (selectedCategory) {
        params.append('category', selectedCategory.id.toString());
      }

      // 검색어가 있으면 추가
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/local-businesses/?${params.toString()}`
      );
      const data = await response.json();

      console.log('📊 검색 결과:', {
        count: data.results?.length || 0,
        next: data.next,
        previous: data.previous
      });

      setBusinesses(data.results || []);
      setNextUrl(data.next || null);
      setHasMore(!!data.next);
    } catch (error) {
      console.error('업체 로드 실패:', error);
      setBusinesses([]);
      setNextUrl(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (!nextUrlRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await fetch(nextUrlRef.current);
      const data = await response.json();

      setBusinesses(prev => [...prev, ...(data.results || [])]);
      setNextUrl(data.next || null);
      setHasMore(!!data.next);
    } catch (error) {
      console.error('추가 로드 실패:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // 시/도 선택 핸들러
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    const region = regions.find(r => r.name === province);
    setCities(region?.cities || []);
    setSelectedCity('all'); // 시/도 변경 시 시/군/구는 초기화 (전체로)
  };

  // 주소 복사
  const handleCopyAddress = (address: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(address.replace('대한민국 ', ''));
    toast.success('복사 완료');
  };

  // 전화번호 포맷팅 (+82 제거하고 필요시 0 추가)
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // +82 제거
    let formatted = phone.replace('+82 ', '').replace('+82', '');

    // 10으로 시작하면 010으로, 2로 시작하면 02로 변환
    // 1566, 1588 등 대표번호는 그대로 유지
    if (formatted.startsWith('10-') || formatted.startsWith('10 ')) {
      formatted = '0' + formatted;
    } else if (formatted.startsWith('2-') || formatted.startsWith('2 ')) {
      formatted = '0' + formatted;
    }

    return formatted;
  };

  // 전화걸기
  const handleCall = (phone: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const formattedPhone = formatPhoneNumber(phone);
    window.location.href = `tel:${formattedPhone}`;
  };

  // 지도 보기
  const handleShowMap = (business: LocalBusinessList, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedBusiness(business);
    setMapDialogOpen(true);
    setShouldRenderMap(false);

    // Dialog 열린 직후 지도 새로 렌더링
    setTimeout(() => {
      setMapKey(prev => prev + 1); // key 변경으로 완전히 새로운 컴포넌트 생성
      setShouldRenderMap(true);
    }, 100);
  };

  return (
    <>
      {/* Kakao Map Script - 페이지 전체에서 한 번만 로드 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Page] Kakao Map Script loaded');
          setKakaoScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('[Page] Kakao Map Script load error:', e);
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* 헤더 */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl mb-2 sm:mb-3">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            우리동네 전문가를 만나보세요
          </h1>
        </div>

        {/* 검색 */}
        <Card className="mb-4 p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="업체명 또는 주소로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 sm:h-11"
            />
          </div>
        </Card>

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
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
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
              {/* 전체 버튼 */}
              <Button
                variant={!selectedCategory ? 'default' : 'outline'}
                size="sm"
                className={`h-auto py-3 px-2 flex flex-col items-center gap-1 transition-all ${
                  !selectedCategory
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'hover:border-primary'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs font-medium whitespace-nowrap">전체</span>
              </Button>

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
              <span>{selectedCity || selectedProvince} {selectedCategory?.name}</span>
              <span className="text-primary font-medium">• 총 {businesses.length}개</span>
            </div>

            {/* 업체 카드 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {businesses.map((business) => (
                <Card key={business.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
                  {/* 사진 또는 대체 이미지 */}
                  <div className="relative h-32 sm:h-48 w-full bg-slate-100">
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

                    {/* AI/Google 요약 - 별점 바로 아래 */}
                    {business.editorial_summary && (
                      <div className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm">
                        <p className="text-xs font-bold text-black italic underline decoration-slate-400 decoration-1 underline-offset-2 leading-relaxed line-clamp-2 break-words">
                          "{business.editorial_summary}"
                        </p>
                      </div>
                    )}

                    {/* 주소 - 클릭하면 복사 */}
                    <div
                      className="text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded transition-colors group"
                      onClick={(e) => handleCopyAddress(business.address, e)}
                    >
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="break-words">{business.address.replace('대한민국 ', '')}</span>
                          <span className="text-[10px] text-primary ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            복사
                          </span>
                        </div>
                      </div>
                    </div>

                    {business.phone_number && (
                      <p className="text-xs text-slate-700">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {business.phone_number}
                      </p>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-1 sm:gap-1.5 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] sm:text-xs h-9 px-1.5 sm:px-2 flex items-center justify-center gap-0.5 sm:gap-1"
                        onClick={(e) => handleShowMap(business, e)}
                      >
                        <Map className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">지도</span>
                      </Button>
                      {business.phone_number && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[10px] sm:text-xs h-9 px-1.5 sm:px-2 flex items-center justify-center gap-0.5 sm:gap-1"
                          onClick={(e) => handleCall(business.phone_number!, e)}
                        >
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">전화</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 무한스크롤 트리거 */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">더 불러오는 중...</p>
                  </div>
                )}
              </div>
            )}

            {!hasMore && businesses.length > 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                모든 업체를 불러왔습니다
              </div>
            )}
          </div>
        )}
      </div>

      {/* 지도 다이얼로그 */}
      <Dialog
        open={mapDialogOpen}
        onOpenChange={(open) => {
          setMapDialogOpen(open);
          if (!open) {
            setShouldRenderMap(false);
            setSelectedBusiness(null);
          }
        }}
      >
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
                {selectedBusiness?.address.replace('대한민국 ', '')}
              </div>
              {selectedBusiness && shouldRenderMap && (
                <KakaoMap
                  key={mapKey}
                  address={selectedBusiness.address}
                  placeName={selectedBusiness.name}
                  scriptLoaded={kakaoScriptLoaded}
                />
              )}
              {selectedBusiness && !shouldRenderMap && (
                <div className="w-full h-64 flex items-center justify-center bg-slate-100 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <div className="text-sm text-slate-600">지도를 불러오는 중...</div>
                  </div>
                </div>
              )}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs font-medium"
                onClick={() => {
                  if (selectedBusiness) {
                    handleCopyAddress(selectedBusiness.address);
                  }
                }}
              >
                <Copy className="w-4 h-4" />
                <span>주소복사</span>
              </Button>
              {selectedBusiness?.phone_number ? (
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center gap-1 text-xs font-medium"
                  onClick={() => {
                    if (selectedBusiness?.phone_number) {
                      handleCall(selectedBusiness.phone_number);
                    }
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span>전화하기</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="h-12 flex flex-col items-center justify-center gap-1 text-xs font-medium opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  <span>전화없음</span>
                </Button>
              )}
              <Button
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs font-medium"
                onClick={() => {
                  if (selectedBusiness) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBusiness.name + ' ' + selectedBusiness.address)}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="w-4 h-4" />
                <span>추가정보</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
