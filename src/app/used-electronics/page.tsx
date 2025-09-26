/**
 * 전자제품/가전 목록 페이지
 * /used-electronics
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, MapPin, Heart, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import electronicsApi from '@/lib/api/electronics';
import type { UsedElectronics } from '@/types/electronics';
import { ELECTRONICS_SUBCATEGORIES, CONDITION_GRADES, PURCHASE_PERIODS } from '@/types/electronics';
import Image from 'next/image';
import { regions } from '@/lib/regions';

function UsedElectronicsListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [electronics, setElectronics] = useState<UsedElectronics[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);

  // 데이터 로드
  const loadElectronics = useCallback(async (resetList = false) => {
    try {
      setLoading(true);
      const params: any = {
        page: resetList ? 1 : page,
        search: searchTerm,
        ordering: sortBy === 'latest' ? '-created_at' : sortBy === 'price_low' ? 'price' : '-price',
        include_completed: 'true'  // 거래완료 상품도 포함
      };

      if (selectedCategory) params.subcategory = selectedCategory;
      if (selectedCondition) params.condition = selectedCondition;

      // 지역 필터 추가 - 휴대폰과 동일한 방식
      if (selectedProvince) {
        const regionValue = selectedCity ? `${selectedProvince} ${selectedCity}` : selectedProvince;
        params.region = regionValue;
      }

      const response = await electronicsApi.getElectronicsList(params);

      if (resetList) {
        setElectronics(response.results);
        setPage(1);
      } else {
        setElectronics(prev => [...prev, ...response.results]);
      }

      setHasMore(!!response.next);
    } catch (error) {
      console.error('Failed to load electronics:', error);
      toast({
        title: '오류',
        description: '상품 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, selectedCondition, sortBy, selectedProvince, selectedCity, toast]);

  // 시/도 선택 시 시/군/구 목록 업데이트
  useEffect(() => {
    if (selectedProvince) {
      const region = regions.find(r => r.name === selectedProvince);
      setCities(region?.cities || []);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedProvince]);

  // 초기 로드
  useEffect(() => {
    loadElectronics(true);
  }, [selectedCategory, selectedCondition, sortBy, selectedProvince, selectedCity]);

  // 검색
  const handleSearch = () => {
    loadElectronics(true);
  };

  // 찜하기 토글
  const handleToggleFavorite = async (e: React.MouseEvent, electronicsId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: '로그인 필요',
        description: '찜하기는 로그인 후 이용 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find current item to get its favorite status
      const currentItem = electronics.find(item => item.id === electronicsId);
      const isFavorited = currentItem?.is_favorited || false;

      const response = await electronicsApi.toggleFavorite(electronicsId, isFavorited);
      const newFavoriteState = !isFavorited;

      setElectronics(prev =>
        prev.map(item =>
          item.id === electronicsId
            ? {
                ...item,
                is_favorited: newFavoriteState,
                favorite_count: newFavoriteState
                  ? (item.favorite_count || 0) + 1
                  : Math.max(0, (item.favorite_count || 0) - 1),
              }
            : item
        )
      );

      toast({
        description: newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.',
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // 무한 스크롤
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) {
        return;
      }
      if (!loading && hasMore) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    if (page > 1) {
      loadElectronics();
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">전자제품/가전</h1>
            {user && (
              <Link href="/used-electronics/create">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">판매하기</span>
                </Button>
              </Link>
            )}
          </div>

          {/* 검색바 */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="브랜드, 모델명으로 검색"
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="icon" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* 지역 필터 - 휴대폰과 동일한 방식 */}
            <Select
              value={selectedProvince || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedProvince('');
                  setSelectedCity('');
                } else {
                  setSelectedProvince(value);
                  setSelectedCity('');
                }
              }}
            >
              <SelectTrigger className="w-[120px] h-9">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <SelectValue placeholder="전국" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전국</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 시/군/구 선택 */}
            {selectedProvince && (
              <Select
                value={selectedCity || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedCity('');
                  } else {
                    setSelectedCity(value);
                  }
                }}
              >
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="시/군/구" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="제품군" className="whitespace-nowrap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">제품군</SelectItem>
                {Object.entries(ELECTRONICS_SUBCATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="상태" className="whitespace-nowrap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">상태</SelectItem>
                {Object.entries(CONDITION_GRADES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="price_low">가격 낮은순</SelectItem>
                <SelectItem value="price_high">가격 높은순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="container mx-auto px-4 py-4">
        {electronics.length === 0 && !loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
            {user && (
              <Link href="/used-electronics/create">
                <Button>첫 상품 등록하기</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {electronics.map((item) => (
              <Link key={item.id} href={`/used-electronics/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-square">
                    {item.images && item.images.length > 0 ? (
                      <Image
                        src={item.images[0].imageUrl || '/images/no-image.png'}
                        alt={item.model_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}

                    {/* 상태 뱃지 */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status === 'active' ? '판매중' : item.status === 'trading' ? '거래중' : '판매완료'}
                      </Badge>
                    </div>

                    {/* 찜 버튼 */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, item.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          item.is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </div>

                  <CardContent className="p-3">
                    {/* 카테고리 */}
                    <div className="text-xs text-gray-500 mb-1">
                      {item.subcategory_display || ELECTRONICS_SUBCATEGORIES[item.subcategory as keyof typeof ELECTRONICS_SUBCATEGORIES]}
                    </div>

                    {/* 제품명 */}
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {item.brand} {item.model_name}
                    </h3>

                    {/* 상태 정보 */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <span>{CONDITION_GRADES[item.condition_grade as keyof typeof CONDITION_GRADES]?.split(' ')[0]}</span>
                      <span>·</span>
                      <span>{PURCHASE_PERIODS[item.purchase_period as keyof typeof PURCHASE_PERIODS] || '미입력'}</span>
                    </div>

                    {/* 가격 - 휴대폰과 동일한 스타일 */}
                    <div className="mb-2">
                      {item.status === 'sold' ? (
                        // 거래완료 상품
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-gray-700">
                            {item.price?.toLocaleString() || item.price}원
                          </span>
                        </div>
                      ) : (
                        // 판매중 상품
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-gray-500">즉시구매</span>
                            <span className="text-base font-bold text-gray-900">
                              {item.price?.toLocaleString() || item.price}원
                            </span>
                          </div>
                          {item.accept_offers && item.min_offer_price && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                                가격제안 {item.min_offer_price?.toLocaleString() || item.min_offer_price}원부터
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

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
                            {item.region_name || '지역 미정'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 조회수, 찜 */}
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
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* 플로팅 버튼 (모바일) */}
      {user && (
        <Link href="/used-electronics/create" className="md:hidden">
          <Button
            className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-50"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// Suspense로 감싸서 export
export default function UsedElectronicsListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <UsedElectronicsListPageContent />
    </Suspense>
  );
}