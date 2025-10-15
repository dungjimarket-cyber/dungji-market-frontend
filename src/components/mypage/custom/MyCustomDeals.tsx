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
  location?: string; // 오프라인 매장 주소
  pricing_type?: 'single_product' | 'all_products' | 'coupon_only';
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

      // completed, cancelled 필터는 전체를 가져와서 프론트에서 필터링
      if (filter !== 'all' && filter !== 'completed' && filter !== 'cancelled') {
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

  // 표시할 deals 필터링
  const displayDeals = filter === 'completed'
    ? deals.filter(d => d.status === 'completed' || d.status === 'pending_seller')
    : filter === 'cancelled'
    ? deals.filter(d => d.status === 'cancelled' || d.status === 'expired')
    : deals; // 'all' 또는 'recruiting'

  const filterCounts = {
    all: deals.length, // 실제 전체 개수
    recruiting: deals.filter(d => d.status === 'recruiting').length,
    completed: deals.filter(d => d.status === 'completed' || d.status === 'pending_seller').length,
    cancelled: deals.filter(d => d.status === 'cancelled' || d.status === 'expired').length,
  };

  // 데이터가 없으면 간단한 메시지만 표시
  if (!loading && deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-600">내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
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
          취소됨 ({filterCounts.cancelled})
        </Button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      ) : displayDeals.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">등록한 공구가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayDeals.map((deal) => {
            const isCancelled = deal.status === 'cancelled' || deal.status === 'expired';

            return (
            <Card key={deal.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* 이미지 */}
                  {isCancelled ? (
                    // 취소된 항목: 링크 없이, 회색처리
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 relative">
                      {deal.primary_image ? (
                        <img
                          src={deal.primary_image}
                          alt={deal.title}
                          className="w-full h-full object-cover opacity-40"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-40">
                          <Tag className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-500/20" />
                    </div>
                  ) : (
                    // 정상 항목: 링크 있음
                    <Link href={`/custom-deals/${deal.id}`}>
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                        {deal.primary_image ? (
                          <img
                            src={deal.primary_image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Tag className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="text-xs">{deal.type_display}</Badge>
                          {getStatusBadge(deal)}
                        </div>
                        {isCancelled ? (
                          // 취소된 항목: 링크 없음
                          <h3 className="text-base font-bold text-slate-600 truncate">
                            {deal.title}
                          </h3>
                        ) : (
                          // 정상 항목: 링크 있음
                          <Link href={`/custom-deals/${deal.id}`}>
                            <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate">
                              {deal.title}
                            </h3>
                          </Link>
                        )}
                        {/* Location (offline only) */}
                        {deal.type === 'offline' && deal.location && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {deal.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {deal.original_price && deal.final_price ? (
                          <>
                            <div className="flex items-baseline gap-1.5 justify-end">
                              <span className="text-xs text-slate-400 line-through">
                                {deal.original_price.toLocaleString()}원
                              </span>
                              <span className="text-sm font-bold text-red-600">
                                {deal.discount_rate}%
                              </span>
                            </div>
                            <div className="text-lg font-bold text-slate-900 mt-0.5">
                              {typeof deal.final_price === 'object' && deal.final_price !== null
                                ? ((deal.final_price as any).min || 0).toLocaleString()
                                : deal.final_price.toLocaleString()}원
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Progress or Validity */}
                    <div className="mb-2">
                      {deal.status === 'completed' && deal.discount_valid_until ? (
                        // 마감된 경우: 참여자 + 유효기간
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="font-semibold text-slate-900">
                              {deal.current_participants}명 참여
                            </span>
                          </div>
                          {(() => {
                            const validity = getValidityDisplay(deal.discount_valid_until);
                            if (validity) {
                              return (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 flex-shrink-0 text-slate-600" />
                                  <span className={`font-medium ${validity.color}`}>
                                    {validity.time}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        // 모집 중: 인원/시간
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="font-semibold text-slate-900">
                              {deal.current_participants}/{deal.target_participants}명
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="font-medium">
                              {getRemainingTime(deal.expired_at)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!isCancelled && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-3"
                          onClick={() => router.push(`/custom-deals/${deal.id}`)}
                        >
                          상세보기
                        </Button>
                        {deal.status === 'recruiting' && deal.current_participants >= 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-3 text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEarlyClose(deal.id);
                            }}
                          >
                            조기종료
                          </Button>
                        )}
                        {deal.status === 'completed' && deal.current_participants > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-3"
                            onClick={() => router.push(`/mypage/custom-deals/${deal.id}/participants`)}
                          >
                            참여자 관리
                          </Button>
                        )}
                        {deal.status === 'pending_seller' && (
                          <>
                            <Button
                              size="sm"
                              className="text-xs h-7 px-3 bg-gray-900 hover:bg-gray-800 text-white"
                              onClick={(e) => {
                                e.preventDefault();
                                handleConfirmSale(deal.id);
                              }}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              확정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-3 text-red-600 border-red-300 hover:bg-red-50"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCancelSale(deal.id);
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              취소
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* 더 보기 버튼 */}
      {!loading && hasMore && displayDeals.length > 0 && (
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