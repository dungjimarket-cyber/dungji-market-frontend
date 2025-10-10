'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Heart, Users, Clock, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CustomDeal {
  id: number;
  title: string;
  type: 'online' | 'offline';
  type_display: string;
  categories: string[];
  regions?: Array<{
    code: string;
    name: string;
    full_name: string;
  }>;
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
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function CustomDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<CustomDeal[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [selectedType, setSelectedType] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClosedDeals, setShowClosedDeals] = useState(true); // 마감된 공구 표시 여부

  useEffect(() => {
    fetchCategories();
    fetchDeals();
  }, [selectedType, selectedCategory]);

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

      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setDeals(Array.isArray(data) ? data : data.results || []);
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

  const getStatusBadge = (deal: CustomDeal) => {
    if (deal.status === 'completed') {
      return <Badge className="bg-red-50 text-red-600 border-red-200 whitespace-nowrap">선착순 마감</Badge>;
    }
    if (deal.status === 'recruiting') {
      const progress = (deal.current_participants / deal.target_participants) * 100;
      if (progress >= 80) {
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 whitespace-nowrap">마감 임박</Badge>;
      }
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200 whitespace-nowrap">모집중</Badge>;
    }
    return <Badge variant="secondary" className="whitespace-nowrap">{deal.status_display}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">커스텀 공구</h1>
              <p className="text-sm text-slate-600">원하는 만큼 모여서, 함께 할인받아요</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/custom-deals/my')}
              >
                내 공구 관리
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/custom-deals/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                공구 등록
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="찾고 계신 공구를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              검색
            </Button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedType('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'online'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                온라인
              </button>
              <button
                onClick={() => setSelectedType('offline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'offline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                오프라인
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 카테고리</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <button
              onClick={() => setShowClosedDeals(!showClosedDeals)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !showClosedDeals
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showClosedDeals ? '진행중만 보기' : '전체 보기'}
            </button>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">로딩 중...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600 mb-2">진행 중인 공구가 없습니다</p>
            <p className="text-sm text-slate-500">첫 번째 공구를 등록해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals
              .filter((deal) => showClosedDeals || deal.status === 'recruiting')
              .map((deal) => {
                const isClosed = deal.status === 'completed' || deal.status === 'cancelled' || deal.status === 'expired';
                return (
              <Link key={deal.id} href={`/custom-deals/${deal.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer border-slate-200 overflow-hidden flex flex-col">
                  {/* Image - 고정 높이 */}
                  <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
                    {deal.primary_image ? (
                      <img
                        src={deal.primary_image}
                        alt={deal.title}
                        className={`w-full h-full object-cover ${isClosed ? 'opacity-60' : ''}`}
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
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-slate-700 border-0 whitespace-nowrap text-xs">
                        {deal.type_display}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    {/* Title - 고정 높이 (2줄) */}
                    <h3 className="font-bold text-base text-slate-900 mb-1.5 line-clamp-2 h-12">
                      {deal.title}
                    </h3>

                    {/* Location (offline only) - 고정 높이 */}
                    <div className="h-5 mb-2">
                      {deal.type === 'offline' && deal.regions && deal.regions.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {deal.regions.map(r => r.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price - 고정 높이 */}
                    <div className="mb-3 h-16">
                      {deal.original_price && deal.final_price ? (
                        <>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-slate-500 line-through">
                              {deal.original_price.toLocaleString()}원
                            </span>
                            <span className="text-base font-bold text-red-600">
                              {deal.discount_rate}%
                            </span>
                          </div>
                          <div className="text-xl font-bold text-slate-900">
                            {deal.final_price.toLocaleString()}원
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-bold text-blue-600">
                          전품목 {deal.discount_rate}% 할인
                        </div>
                      )}
                    </div>

                    {/* Progress - 고정 높이 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 flex items-center gap-1 whitespace-nowrap">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          {deal.current_participants}/{deal.target_participants}명
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {getRemainingTime(deal.expired_at)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (deal.current_participants / deal.target_participants) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer - 하단 고정 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                      <span className="text-xs text-slate-600 truncate">{deal.seller_name}</span>
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
    </div>
  );
}