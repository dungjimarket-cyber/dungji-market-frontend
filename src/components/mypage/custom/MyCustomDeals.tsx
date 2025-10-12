'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Tag, MapPin, Eye, Heart, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import PenaltyAlert from '@/components/penalty/PenaltyAlert';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import { checkCustomActivePenalty, CustomPenalty } from '@/lib/api/custom/penaltyApi';

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
  discount_valid_until?: string;
  online_discount_type?: 'link_only' | 'code_only' | 'both';
}

export default function MyCustomDeals() {
  const router = useRouter();
  const [deals, setDeals] = useState<CustomDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [penaltyInfo, setPenaltyInfo] = useState<CustomPenalty | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchDeals();
    fetchPenaltyStatus();
  }, [filter]);

  // 1분마다 현재 시간 업데이트 (실시간 카운트다운)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchDeals = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setDeals([]);
      }

      const token = localStorage.getItem('accessToken');
      let url = `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?seller=me&limit=20`;

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

      const newDeals = Array.isArray(data) ? data : data.results || [];
      setDeals(newDeals);
      setNextUrl(data.next || null);
      setHasMore(!!data.next);
    } catch (error) {
      console.error('로드 실패:', error);
      toast.error('공구 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextUrl || loadingMore) return;

    try {
      setLoadingMore(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      const newDeals = Array.isArray(data) ? data : data.results || [];
      setDeals(prev => [...prev, ...newDeals]);
      setNextUrl(data.next || null);
      setHasMore(!!data.next);
    } catch (error) {
      console.error('추가 로드 실패:', error);
      toast.error('공구 목록을 불러오는데 실패했습니다');
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchPenaltyStatus = async () => {
    try {
      const response = await checkCustomActivePenalty();
      if (response.has_active_penalty && response.penalty) {
        setPenaltyInfo(response.penalty);
      } else {
        setPenaltyInfo(null);
      }
    } catch (error) {
      console.error('패널티 상태 조회 실패:', error);
    }
  };

  const handleCreateDeal = async () => {
    // 패널티 체크
    try {
      const response = await checkCustomActivePenalty();
      if (response.has_active_penalty && response.penalty) {
        // 패널티가 있으면 모달 표시
        setPenaltyInfo(response.penalty);
        setShowPenaltyModal(true);
        return;
      }
    } catch (error) {
      console.error('패널티 체크 실패:', error);
    }

    // 패널티가 없으면 페이지 이동
    router.push('/custom-deals/create');
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

  const getValidityDisplay = (validUntil: string | null) => {
    if (!validUntil) return null;

    const endDate = new Date(validUntil);
    const diff = endDate.getTime() - currentTime.getTime();

    // 라벨: 모든 경우에 "할인 유효기간" 사용
    const label = '할인 유효기간';

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
      return <Badge className="bg-red-50 text-red-600 border-red-200 whitespace-nowrap">선착순 마감</Badge>;
    }
    if (deal.status === 'recruiting') {
      const progress = (deal.current_participants / deal.target_participants) * 100;
      if (progress >= 80) {
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 whitespace-nowrap">마감 임박</Badge>;
      }
      return <Badge className="bg-gray-50 text-gray-700 border-gray-200 whitespace-nowrap">모집중</Badge>;
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
        <div className="flex gap-2">
          <Button
            onClick={handleCreateDeal}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            공구 등록
          </Button>
          <Button
            onClick={() => router.push('/custom-deals')}
            variant="outline"
            className="text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            공구 목록
          </Button>
        </div>
      </div>

      {/* 패널티 알림 */}
      {penaltyInfo && (
        <PenaltyAlert
          penaltyInfo={penaltyInfo}
          userRole="buyer"
        />
      )}

      {/* 패널티 모달 */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={penaltyInfo ? {
          ...penaltyInfo,
          reason: penaltyInfo.reason,
          count: penaltyInfo.count
        } : null}
        userRole="buyer"
      />

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          전체 ({filterCounts.all})
        </Button>
        <Button
          variant={filter === 'recruiting' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('recruiting')}
          className={filter === 'recruiting' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          모집중 ({filterCounts.recruiting})
        </Button>
        <Button
          variant={filter === 'pending_seller' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending_seller')}
          className={filter === 'pending_seller' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          결정대기 ({filterCounts.pending_seller})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          마감 ({filterCounts.completed})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('cancelled')}
          className={filter === 'cancelled' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          취소 ({filterCounts.cancelled})
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('expired')}
          className={filter === 'expired' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          만료 ({filterCounts.expired})
        </Button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-600 mb-2">등록한 공구가 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push('/custom-deals/create')}
            className="mt-4"
          >
            첫 공구 등록하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {deals.map((deal) => (
            <Card key={deal.id} className="border-slate-200 overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
              <Link href={`/custom-deals/${deal.id}`}>
                {/* Image - 고정 높이 */}
                <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer group flex-shrink-0">
                  {deal.primary_image ? (
                    <img
                      src={deal.primary_image}
                      alt={deal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Tag className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(deal)}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-white/90 text-slate-700 border-0 text-xs px-2 py-0.5 whitespace-nowrap">
                      {deal.type_display}
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-3 flex flex-col flex-1">
                <Link href={`/custom-deals/${deal.id}`}>
                  {/* Title - 고정 높이 (2줄) */}
                  <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 leading-tight h-10">
                    {deal.title}
                  </h3>
                </Link>

                {/* Location - 고정 높이 */}
                <div className="h-5 mb-1">
                  {deal.type === 'offline' && deal.regions && deal.regions.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {deal.regions.map(r => r.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price - 고정 높이 */}
                <div className="mb-2 h-14">
                  {deal.original_price && deal.final_price ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-slate-400 line-through">
                          {deal.original_price.toLocaleString()}원
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          {deal.discount_rate}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {typeof deal.final_price === 'object' && deal.final_price !== null
                          ? ((deal.final_price as any).min || 0).toLocaleString()
                          : deal.final_price.toLocaleString()}원
                      </div>
                    </>
                  ) : (
                    <div className="text-base font-bold text-gray-900">
                      전품목 {deal.discount_rate}% 할인
                    </div>
                  )}
                </div>

                {/* Progress or Validity - 고정 높이 */}
                <div className="mb-2">
                  {deal.status === 'completed' && deal.discount_valid_until ? (
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
                        const validity = getValidityDisplay(deal.discount_valid_until);
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
                    // 모집 중: 기존 인원/시간 + 프로그레스 바
                    <>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 flex items-center gap-1 whitespace-nowrap">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          {deal.current_participants}/{deal.target_participants}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {getRemainingTime(deal.expired_at)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
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

                {/* Stats - 고정 높이 */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-2 pt-2 border-t border-slate-100 h-8">
                  <span className="flex items-center gap-0.5 whitespace-nowrap">
                    <Eye className="w-3 h-3 flex-shrink-0" />
                    {deal.view_count}
                  </span>
                  <span className="flex items-center gap-0.5 whitespace-nowrap">
                    <Heart className="w-3 h-3 flex-shrink-0" />
                    {deal.favorite_count}
                  </span>
                  <span className="flex items-center gap-0.5 text-slate-400 truncate">
                    {new Date(deal.created_at).toLocaleDateString('ko', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Action Buttons - 하단 고정 */}
                <div className="flex flex-col gap-1 mt-auto">
                  {deal.status === 'recruiting' && deal.current_participants >= 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7 text-orange-600 border-orange-300 hover:bg-orange-50 whitespace-nowrap"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEarlyClose(deal.id);
                      }}
                    >
                      조기종료
                    </Button>
                  )}

                  {deal.status === 'pending_seller' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-7 bg-gray-900 hover:bg-gray-800 text-white whitespace-nowrap"
                        onClick={(e) => {
                          e.preventDefault();
                          handleConfirmSale(deal.id);
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                        확정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 text-red-600 border-red-300 hover:bg-red-50 whitespace-nowrap"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCancelSale(deal.id);
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                        취소
                      </Button>
                    </div>
                  )}

                  {deal.status === 'completed' && deal.current_participants > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7 whitespace-nowrap"
                      onClick={() => router.push(`/mypage/custom-deals/${deal.id}/participants`)}
                    >
                      참여자 관리
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-7 whitespace-nowrap"
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

      {/* 더 보기 버튼 */}
      {!loading && hasMore && deals.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                로딩 중...
              </>
            ) : (
              '더 보기'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}