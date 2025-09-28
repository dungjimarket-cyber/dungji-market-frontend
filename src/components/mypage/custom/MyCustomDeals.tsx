'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Tag, MapPin, Eye, Heart, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  primary_image: string | null;
  view_count: number;
  favorite_count: number;
  created_at: string;
}

export default function MyCustomDeals() {
  const router = useRouter();
  const [deals, setDeals] = useState<CustomDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchDeals();
  }, [filter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      let url = `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?seller=me`;

      if (filter !== 'all') {
        url += `&status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setDeals(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('로드 실패:', error);
      toast.error('목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleEarlyClose = async (dealId: number) => {
    if (!confirm('정말 조기 종료하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${dealId}/early_close/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed');
      toast.success('조기 종료되었습니다');
      fetchDeals();
    } catch (error) {
      console.error('조기 종료 실패:', error);
      toast.error('조기 종료에 실패했습니다');
    }
  };

  const handleConfirmSale = async (dealId: number) => {
    if (!confirm('판매를 확정하시겠습니까? 참여자들에게 할인코드가 발급됩니다.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${dealId}/confirm_sale/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed');
      toast.success('판매가 확정되었습니다');
      fetchDeals();
    } catch (error) {
      console.error('확정 실패:', error);
      toast.error('판매 확정에 실패했습니다');
    }
  };

  const handleCancelSale = async (dealId: number) => {
    if (!confirm('판매를 취소하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${dealId}/cancel_sale/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed');
      toast.success('판매가 취소되었습니다');
      fetchDeals();
    } catch (error) {
      console.error('취소 실패:', error);
      toast.error('판매 취소에 실패했습니다');
    }
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
    if (deal.status === 'pending_seller') {
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 whitespace-nowrap">결정 대기</Badge>;
    }
    if (deal.status === 'cancelled') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200 whitespace-nowrap">취소됨</Badge>;
    }
    if (deal.status === 'expired') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200 whitespace-nowrap">기간만료</Badge>;
    }
    return <Badge variant="secondary">{deal.status_display}</Badge>;
  };

  const filterCounts = {
    all: deals.length,
    recruiting: deals.filter(d => d.status === 'recruiting').length,
    pending_seller: deals.filter(d => d.status === 'pending_seller').length,
    completed: deals.filter(d => d.status === 'completed').length,
    cancelled: deals.filter(d => d.status === 'cancelled').length,
    expired: deals.filter(d => d.status === 'expired').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={() => router.push('/custom-deals/create')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          특가 등록
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-blue-600' : ''}
        >
          전체 ({filterCounts.all})
        </Button>
        <Button
          variant={filter === 'recruiting' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('recruiting')}
          className={filter === 'recruiting' ? 'bg-blue-600' : ''}
        >
          모집중 ({filterCounts.recruiting})
        </Button>
        <Button
          variant={filter === 'pending_seller' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending_seller')}
          className={filter === 'pending_seller' ? 'bg-blue-600' : ''}
        >
          결정대기 ({filterCounts.pending_seller})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-blue-600' : ''}
        >
          마감 ({filterCounts.completed})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('cancelled')}
          className={filter === 'cancelled' ? 'bg-blue-600' : ''}
        >
          취소 ({filterCounts.cancelled})
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('expired')}
          className={filter === 'expired' ? 'bg-blue-600' : ''}
        >
          만료 ({filterCounts.expired})
        </Button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-600 mb-2">등록한 특가가 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push('/custom-deals/create')}
            className="mt-4"
          >
            첫 특가 등록하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Card key={deal.id} className="border-slate-200 overflow-hidden">
              <Link href={`/custom-deals/${deal.id}`}>
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer">
                  {deal.primary_image ? (
                    <img
                      src={deal.primary_image}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Tag className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(deal)}
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-slate-700 border-0">
                      {deal.type_display}
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-5">
                <Link href={`/custom-deals/${deal.id}`}>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600">
                    {deal.title}
                  </h3>
                </Link>

                {/* 위치 */}
                {deal.type === 'offline' && deal.regions && deal.regions.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-slate-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">
                      {deal.regions.map(r => r.name).join(', ')}
                    </span>
                  </div>
                )}

                {/* 가격 */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-slate-500 line-through">
                      {deal.original_price.toLocaleString()}원
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {deal.discount_rate}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {deal.final_price.toLocaleString()}원
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {deal.current_participants}/{deal.target_participants}명
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getRemainingTime(deal.expired_at)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (deal.current_participants / deal.target_participants) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 통계 */}
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {deal.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {deal.favorite_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(deal.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  {deal.status === 'recruiting' && deal.current_participants >= 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEarlyClose(deal.id);
                      }}
                    >
                      조기종료
                    </Button>
                  )}

                  {deal.status === 'pending_seller' && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.preventDefault();
                          handleConfirmSale(deal.id);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        확정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCancelSale(deal.id);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        취소
                      </Button>
                    </>
                  )}

                  {deal.status === 'completed' && deal.current_participants > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/mypage/custom-deals/${deal.id}/participants`)}
                    >
                      참여자 관리
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/custom-deals/${deal.id}`)}
                  >
                    상세보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}