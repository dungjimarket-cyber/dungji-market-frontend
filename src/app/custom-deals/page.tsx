'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Heart, Users, Clock, MapPin, Tag, Info, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import NoticeSection from '@/components/home/NoticeSection';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { CustomPenalty } from '@/lib/api/custom/penaltyApi';
import { checkCanCreateCustomDeal } from '@/lib/api/custom/createDealCheck';
import { useAuth } from '@/contexts/AuthContext';

interface CustomDeal {
  id: number;
  title: string;
  type: 'online' | 'offline';
  type_display: string;
  deal_type?: 'participant_based' | 'time_based';
  deal_type_display?: string;
  categories: string[];
  regions?: Array<{
    code: string;
    name: string;
    full_name: string;
  }>;
  pricing_type?: 'single_product' | 'all_products' | 'coupon_only';
  products?: Array<{
    name: string;
    original_price: number;
    discount_rate: number;
  }>;
  product_name: string | null;
  original_price: number;
  discount_rate: number;
  final_price: number;
  target_participants: number;
  current_participants: number;
  is_completed: boolean;
  status: string;
  status_display: string;
  expired_at: string;
  seller_name: string;
  seller_type: string;
  primary_image: string | null;
  view_count: number;
  favorite_count: number;
  is_favorited: boolean;
  created_at: string;
  discount_valid_until?: string;
  online_discount_type?: 'link_only' | 'code_only' | 'both';
  discount_url?: string; // 기간특가 링크
  description_link_previews?: Array<{
    url: string;
    title?: string;
    image?: string;
    description?: string;
  }>;
  location?: string; // 오프라인 매장 주소
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function CustomDealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [deals, setDeals] = useState<CustomDeal[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 필터 상태
  const [selectedType, setSelectedType] = useState<'all' | 'online' | 'offline' | 'coupon_only' | 'time_based'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(''); // 지역 검색
  const [showClosedDeals, setShowClosedDeals] = useState(true); // 마감된 공구 표시 여부
  const [sortType, setSortType] = useState<'latest' | 'popular'>('latest'); // 정렬 방식

  // 패널티 모달 상태
  const [penaltyInfo, setPenaltyInfo] = useState<CustomPenalty | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);

  // 프로필 체크 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchDeals();
  }, [selectedType, selectedCategory, locationQuery]);

  // 1분마다 현재 시간 업데이트 (실시간 카운트다운)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom/categories/`);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      let url = `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/`;
      const params = new URLSearchParams();

      // 기간특가 필터
      if (selectedType === 'time_based') {
        params.append('deal_type', 'time_based');
      }
      // 쿠폰/이벤트가 아닐 때만 type 파라미터 추가
      else if (selectedType !== 'all' && selectedType !== 'coupon_only') {
        params.append('type', selectedType);
      }

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (locationQuery) {
        params.append('location', locationQuery);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const dealsData = Array.isArray(data) ? data : data.results || [];

      // 디버깅: deal_type 필드 확인
      console.log('📊 API Response Sample:', dealsData.slice(0, 3).map((d: CustomDeal) => ({
        id: d.id,
        title: d.title,
        deal_type: d.deal_type,
        pricing_type: d.pricing_type
      })));

      setDeals(dealsData);
    } catch (error) {
      console.error('목록 로드 실패:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeals();
  };

  const handleCreateDeal = async () => {
    const result = await checkCanCreateCustomDeal(user);

    if (!result.canProceed) {
      // 패널티가 있는 경우
      if (result.penaltyInfo) {
        setPenaltyInfo(result.penaltyInfo);
        setShowPenaltyModal(true);
        return;
      }

      // 중복 등록인 경우
      if (result.duplicateMessage) {
        alert(result.duplicateMessage);
        return;
      }

      // 프로필 정보 부족한 경우
      if (result.missingFields) {
        setMissingFields(result.missingFields);
        setShowProfileModal(true);
        return;
      }
    }

    // 모든 체크 통과 시 페이지 이동
    router.push('/custom-deals/create');
  };

  const getRemainingTime = (expiredAt: string) => {
    const now = new Date();
    const expire = new Date(expiredAt);
    const diff = expire.getTime() - now.getTime();

    if (diff <= 0) return '마감';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 남음`;
    return `${hours}시간 남음`;
  };

  const getValidityDisplay = (
    validUntil: string | null,
    type: 'online' | 'offline',
    onlineDiscountType?: 'link_only' | 'code_only' | 'both'
  ) => {
    if (!validUntil) return null;

    const endDate = new Date(validUntil);
    const diff = endDate.getTime() - currentTime.getTime();

    // 라벨 결정: 오프라인은 항상 "유효기간", 온라인은 link_only일 때만 "판매기간"
    const isLinkOnly = type === 'online' && onlineDiscountType === 'link_only';
    const label = isLinkOnly ? '판매기간' : '유효기간';

    // 만료됨
    if (diff <= 0) {
      return { label, time: '만료됨', color: 'text-red-600', expired: true };
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let timeText = '';
    let color = 'text-slate-600';

    if (minutes < 60) {
      // 1시간 미만: 분 단위
      timeText = `${minutes}분 남음`;
      color = 'text-red-600';
    } else if (hours < 24) {
      // 1시간~24시간: 시간 단위
      timeText = `${hours}시간 남음`;
      color = 'text-orange-600';
    } else {
      // 1일 이상: 일 단위
      timeText = `${days}일 남음`;
      color = days < 1 ? 'text-orange-600' : 'text-slate-600';
    }

    return { label, time: timeText, color, expired: false };
  };

  const getStatusBadge = (deal: CustomDeal) => {
    if (deal.status === 'completed') {
      const badgeText = deal.deal_type === 'time_based' ? '마감' : '선착순 마감';
      return <Badge className="bg-red-50 text-red-600 border-red-200 whitespace-nowrap">{badgeText}</Badge>;
    }
    if (deal.status === 'recruiting') {
      if (deal.deal_type === 'time_based') {
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 whitespace-nowrap">진행중</Badge>;
      }
      const progress = (deal.current_participants / deal.target_participants) * 100;
      if (progress >= 80) {
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 whitespace-nowrap">마감 임박</Badge>;
      }
      return <Badge className="bg-gray-50 text-gray-700 border-gray-200 whitespace-nowrap">모집중</Badge>;
    }
    if (deal.status === 'pending_seller') {
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 whitespace-nowrap">판매자 결정 대기</Badge>;
    }
    if (deal.status === 'cancelled') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200 whitespace-nowrap">취소됨</Badge>;
    }
    if (deal.status === 'expired') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200 whitespace-nowrap">기간만료</Badge>;
    }
    return <Badge variant="secondary" className="whitespace-nowrap">{deal.status_display}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-gray-900">커공특가</h1>
              <span
                className="text-sm font-black whitespace-nowrap"
                style={{
                  transform: 'rotate(-8deg)',
                  marginTop: '-4px',
                  background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                모이면 할인!
              </span>
              <p className="text-xs text-blue-600 font-medium ml-2">수수료 없는 진짜 공동구매 혜택!</p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Link href="/custom-deals/guide">
                <Button
                  size="sm"
                  variant="outline"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs whitespace-nowrap"
                >
                  가이드
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/custom-deals/my')}
              >
                커공 관리
              </Button>
              <Button
                size="sm"
                onClick={handleCreateDeal}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                공구 등록
              </Button>
            </div>
          </div>
        </div>

        {/* Notice Section */}
        <NoticeSection pageType="custom" compact />
      </div>

      {/* Main Content */}
      <div className="pb-20">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen">
          {/* Search Bar */}
          <div className="px-4 pt-3">
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="찾고 계신 공구를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
              <Button type="submit" size="sm" variant="outline">
                검색
              </Button>
            </form>
          </div>

          {/* Filters */}
          <div className="px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {/* Type Filter */}
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedType('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'online'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                온라인
              </button>
              <button
                onClick={() => setSelectedType('offline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'offline'
                    ? 'bg-gray-900 text-white border-2 border-gray-900'
                    : 'bg-white text-gray-700 border-2 border-green-500 hover:bg-green-50'
                }`}
              >
                오프라인매장
              </button>
              <button
                onClick={() => setSelectedType('coupon_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'coupon_only'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-white text-gray-700 border border-orange-300 hover:bg-orange-50'
                }`}
              >
                쿠폰/이벤트
              </button>
              <button
                onClick={() => setSelectedType('time_based')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'time_based'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border border-orange-300 hover:bg-orange-50'
                }`}
              >
                기간특가
              </button>

              {/* Sort Type Filter */}
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as 'latest' | 'popular')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="all">모든 카테고리</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label === '건강/의료' ? '건강/헬스케어' : cat.label}
                  </option>
                ))}
              </select>

              {/* Location Filter (오프라인 공구용, 쿠폰/이벤트/기간특가 탭에서는 숨김) */}
              {selectedType !== 'online' && selectedType !== 'coupon_only' && selectedType !== 'time_based' && (
                <input
                  type="text"
                  placeholder="지역 검색"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              )}

              {/* Status Filter */}
              <button
                onClick={() => setShowClosedDeals(!showClosedDeals)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !showClosedDeals
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showClosedDeals ? '진행중만 보기' : '전체 보기'}
              </button>
            </div>
          </div>

          {/* Deals Grid */}
          <div className="px-4 py-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-20">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">진행 중인 공구가 없습니다</p>
                <p className="text-sm text-gray-500">첫 번째 공구를 등록해보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals
              .filter((deal) => {
                // 취소된 공구는 항상 제외
                if (deal.status === 'cancelled') return false;

                // 기간특가 탭: deal_type이 time_based인 것만
                if (selectedType === 'time_based') {
                  if (deal.deal_type !== 'time_based') return false;
                  return showClosedDeals || deal.status === 'recruiting';
                }

                // 쿠폰/이벤트 탭: pricing_type이 coupon_only이면서 time_based가 아닌 것만
                if (selectedType === 'coupon_only') {
                  if (deal.pricing_type !== 'coupon_only') return false;
                  if (deal.deal_type === 'time_based') return false; // 기간특가 제외
                  return showClosedDeals || deal.status === 'recruiting';
                }

                // 온라인/오프라인 탭: 해당 타입이면서 coupon_only와 time_based 제외
                if (selectedType === 'online' || selectedType === 'offline') {
                  if (deal.pricing_type === 'coupon_only') return false;
                  if (deal.deal_type === 'time_based') return false;
                }

                // 전체 탭: 모든 타입 표시 (쿠폰전용 포함)

                // showClosedDeals에 따라 마감된 공구 표시 여부 결정
                return showClosedDeals || deal.status === 'recruiting';
              })
              .sort((a, b) => {
                // 1차 정렬: 마감된 공구(completed, expired)를 뒤로
                const aIsClosed = a.status === 'completed' || a.status === 'expired';
                const bIsClosed = b.status === 'completed' || b.status === 'expired';

                if (aIsClosed && !bIsClosed) return 1;  // a가 마감이면 뒤로
                if (!aIsClosed && bIsClosed) return -1; // b가 마감이면 뒤로

                // 2차 정렬: 인기순이면 참여율로 정렬 (마감 제외)
                if (sortType === 'popular' && !aIsClosed && !bIsClosed) {
                  const aRate = (a.current_participants / a.target_participants) * 100;
                  const bRate = (b.current_participants / b.target_participants) * 100;
                  return bRate - aRate; // 참여율 높은 순
                }

                return 0; // 최신순이거나 같은 상태면 순서 유지
              })
              .map((deal) => {
                const isClosed = deal.status === 'completed' || deal.status === 'expired';
                return (
              <Link key={deal.id} href={`/custom-deals/${deal.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer border-slate-200 overflow-hidden flex flex-col">
                  {/* Image - 고정 높이 */}
                  <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
                    {deal.primary_image ? (
                      <img
                        src={deal.primary_image}
                        alt={deal.title}
                        className={`w-full h-full object-contain ${isClosed ? 'opacity-60' : ''}`}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Tag className="w-12 h-12 text-slate-300" />
                      </div>
                    )}

                    {/* 마감 오버레이 */}
                    {isClosed && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-white font-bold text-3xl mb-1 drop-shadow-lg">마감</div>
                          <div className="text-white text-xs bg-black/30 px-3 py-1 rounded-full">
                            {deal.status_display}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    {!isClosed && (
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(deal)}
                      </div>
                    )}
                    {/* Type & Deal Type Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className="bg-white/90 text-slate-700 border-0 whitespace-nowrap text-xs">
                        {deal.type_display}
                      </Badge>
                      {deal.deal_type === 'time_based' && (
                        <Badge className="bg-orange-500 text-white border-0 whitespace-nowrap text-xs">
                          기간한정특가
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    {/* Location (offline only) - 제목 위에 표시 */}
                    <div className="h-5 mb-1">
                      {deal.type === 'offline' && deal.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {deal.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title - 고정 높이 (2줄) */}
                    <h3 className="font-bold text-base text-slate-900 mb-1 line-clamp-2 h-12 whitespace-pre-line">
                      {deal.title}
                    </h3>

                    {/* Price - 고정 높이 */}
                    <div className="mb-2 h-16">
                      {/* 기간특가 구분: deal_type이 명시적으로 'time_based'인 경우만 */}
                      {deal.deal_type === 'time_based' ? (
                        <div className="flex flex-col gap-1">
                          {deal.original_price && deal.final_price ? (
                            <>
                              {/* products 배열 우선, 없으면 product_name 폴백 */}
                              {deal.products && deal.products.length > 0 && deal.products[0].name && (
                                <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                  {deal.products[0].name}
                                </div>
                              )}
                              {!deal.products && deal.product_name && (
                                <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                  {deal.product_name}
                                </div>
                              )}
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 line-through">
                                  {deal.original_price.toLocaleString()}원
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-base font-bold text-red-600">
                                    {deal.discount_rate}%
                                  </span>
                                  <span className="text-[10px] font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                                    기간특가
                                  </span>
                                </div>
                              </div>
                              <div className="text-xl font-bold text-slate-900">
                                {deal.final_price.toLocaleString()}원
                              </div>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-orange-600">
                              기간특가
                            </span>
                          )}
                        </div>
                      ) : deal.original_price && deal.final_price ? (
                        <>
                          {/* products 배열 우선, 없으면 product_name 폴백 */}
                          {deal.products && deal.products.length > 0 && deal.products[0].name && (
                            <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                              {deal.products[0].name}
                            </div>
                          )}
                          {!deal.products && deal.product_name && (
                            <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                              {deal.product_name}
                            </div>
                          )}
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 line-through">
                              {deal.original_price.toLocaleString()}원
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-base font-bold text-red-600">
                                {deal.discount_rate}%
                              </span>
                              <span className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                                커공특가
                              </span>
                            </div>
                          </div>
                          <div className="text-xl font-bold text-slate-900">
                            {deal.final_price.toLocaleString()}원
                          </div>
                        </>
                      ) : deal.pricing_type === 'coupon_only' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-lg font-bold text-blue-600">
                            선착순 쿠폰 증정
                          </span>
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                            이벤트
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-lg font-bold text-blue-600">
                            전품목 {deal.discount_rate}% 할인
                          </span>
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                            커공특가
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress or Validity - 고정 높이 */}
                    <div className="mb-2">
                      {deal.deal_type === 'time_based' ? (
                        // 기간특가: 판매기간 표시 (인원 바 위치)
                        <>
                          <div className="flex items-center justify-between text-xs mt-2 mb-3">
                            <span className="text-orange-700 font-semibold flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              판매기간
                            </span>
                            <span className="text-slate-500 font-semibold whitespace-nowrap">
                              {getRemainingTime(deal.expired_at)}
                            </span>
                          </div>
                        </>
                      ) : deal.status === 'completed' && deal.discount_valid_until ? (
                        // 마감된 경우: 참여자 인원 (위) + 유효기간/판매기간 (아래)
                        <>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-600 flex items-center gap-1 whitespace-nowrap">
                              <Users className="w-3 h-3 flex-shrink-0" />
                              참여자
                            </span>
                            <span className="font-semibold text-slate-900">
                              {deal.current_participants}명
                            </span>
                          </div>
                          {(() => {
                            const validity = getValidityDisplay(
                              deal.discount_valid_until,
                              deal.type,
                              deal.online_discount_type
                            );
                            if (validity) {
                              return (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">{validity.label}</span>
                                  <span className={`font-semibold ${validity.color}`}>
                                    {validity.time}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </>
                      ) : (
                        // 모집 중: 눈에 띄는 인원/시간 + 프로그레스 바
                        <>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full">
                              <div className="bg-blue-600 rounded-full p-0.5">
                                <Users className="w-2.5 h-2.5 text-white flex-shrink-0" />
                              </div>
                              <span className="text-blue-600 font-semibold whitespace-nowrap">
                                {deal.current_participants}/{deal.target_participants}명
                              </span>
                            </div>
                            <span className="text-slate-500 flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {getRemainingTime(deal.expired_at)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                (deal.current_participants / deal.target_participants) * 100 >= 100
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : (deal.current_participants / deal.target_participants) * 100 >= 80
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (deal.current_participants / deal.target_participants) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer - 하단 고정 */}
                    <div className="flex items-center justify-end pt-2 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-0.5 whitespace-nowrap">
                          <Heart className="w-3 h-3 flex-shrink-0" />
                          {deal.favorite_count}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
                );
              })}
              </div>
            )}
          </div>

          {/* 하단 태그라인 */}
          <div className="px-4 pb-6 text-center">
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              차원이 다른 선착순 할인 혜택!
            </p>
          </div>
        </div>
      </div>

      {/* 패널티 모달 */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={penaltyInfo}
        userRole="buyer"
      />

      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={() => {
          setShowProfileModal(false);
          router.push('/mypage');
        }}
      />
    </div>
  );
}