'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Tag, MapPin, Eye, Heart, Calendar, AlertCircle, CheckCircle, XCircle, Copy, ExternalLink, Ticket } from 'lucide-react';
import { toast } from 'sonner';

// QR 코드 표시 컴포넌트 (fetch로 JWT 토큰 인증)
function QRCodeDisplay({ participationId }: { participationId: number }) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        setError(false);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/custom-participants/${participationId}/qr_code/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('QR 코드 로드 실패');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrImageUrl(url);
      } catch (error) {
        console.error('QR 코드 로드 실패:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();

    // cleanup: Blob URL 해제
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [participationId]);

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-600 mb-2 text-center">QR 코드 로딩 중...</p>
        <div className="flex justify-center">
          <div className="w-40 h-40 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !qrImageUrl) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-red-600 mb-2 text-center">QR 코드를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-200">
      <p className="text-xs text-slate-600 mb-2 text-center">판매자에게 QR 코드를 보여주세요</p>
      <div className="flex justify-center">
        <img
          src={qrImageUrl}
          alt="할인 QR 코드"
          className="w-40 h-40 border-2 border-slate-300 rounded"
        />
      </div>
    </div>
  );
}

interface CustomParticipation {
  id: number;
  custom_groupbuy: number | {  // 백엔드 배포 타이밍 차이 대응: ID 또는 객체
    id: number;
    title: string;
    type: 'online' | 'offline';
    type_display: string;
    seller_name: string;
    original_price: number;
    discount_rate: number;
    final_price: number;
    primary_image: string | null;
    status: string;
    status_display: string;
    online_discount_type?: 'link_only' | 'code_only' | 'both';
    regions?: Array<{
      code: string;
      name: string;
      full_name: string;
    }>;
  };
  participated_at: string;
  participation_code: string;
  discount_code: string | null;
  discount_url: string | null;
  discount_used: boolean;
  discount_used_at: string | null;
  discount_valid_until: string | null;
  status: string;
  status_display: string;
}

export default function MyCustomParticipations() {
  const router = useRouter();
  const [participations, setParticipations] = useState<CustomParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchParticipations();
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [filter]);

  // 1분마다 현재 시간 업데이트 (실시간 카운트다운)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다

    return () => clearInterval(timer);
  }, []);

  const fetchParticipations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      let url = `${process.env.NEXT_PUBLIC_API_URL}/custom-participants/`;

      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setParticipations(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('로드 실패:', error);
      toast.error('참여 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelParticipation = async (participationId: number, groupbuyId: number | undefined) => {
    if (!confirm('참여를 취소하시겠습니까?')) return;

    // groupbuyId 검증
    if (!groupbuyId) {
      toast.error('공구 정보를 찾을 수 없습니다');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${groupbuyId}/cancel_participation/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '취소 실패');
      }

      toast.success('참여가 취소되었습니다');
      fetchParticipations();
    } catch (error: any) {
      console.error('취소 실패:', error);
      toast.error(error.message || '참여 취소에 실패했습니다');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}가 복사되었습니다`);
  };

  const getValidityDisplay = (
    validUntil: string | null,
    groupbuyType: 'online' | 'offline',
    onlineDiscountType?: 'link_only' | 'code_only' | 'both',
    hasCode?: boolean
  ) => {
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

  const getStatusBadge = (
    participation: CustomParticipation,
    groupbuy: { status: string; status_display: string }
  ) => {
    const groupbuyStatus = groupbuy.status;

    if (groupbuyStatus === 'completed' && participation.discount_code) {
      if (participation.discount_used) {
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">사용완료</Badge>;
      }
      // 할인발급 뱃지 제거 - 할인코드 정보는 아래에 별도로 표시됨
      return null;
    }

    if (groupbuyStatus === 'recruiting') {
      return <Badge className="bg-gray-50 text-gray-700 border-gray-200">모집중</Badge>;
    }

    if (groupbuyStatus === 'pending_seller') {
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">판매자 검토중</Badge>;
    }

    if (groupbuyStatus === 'cancelled') {
      return <Badge className="bg-red-50 text-red-600 border-red-200">취소됨</Badge>;
    }

    if (participation.status === 'cancelled') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200">참여취소</Badge>;
    }

    return <Badge variant="secondary">{participation.status_display}</Badge>;
  };

  const canCancel = (
    participation: CustomParticipation,
    groupbuy: { status: string }
  ) => {
    return (
      participation.status === 'confirmed' &&
      groupbuy.status !== 'completed' &&
      !participation.discount_code &&
      !participation.discount_url
    );
  };

  const filterCounts = {
    all: participations.length,
    confirmed: participations.filter(p => p.status === 'confirmed').length,
    cancelled: participations.filter(p => p.status === 'cancelled').length,
  };

  // 페이징 처리
  const totalPages = Math.ceil(participations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipations = participations.slice(startIndex, endIndex);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/custom-deals')}
        >
          공구 둘러보기
        </Button>
      </div>

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
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('confirmed')}
          className={filter === 'confirmed' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
        >
          참여중 ({filterCounts.confirmed})
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
      ) : participations.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-600 mb-2">참여한 공구가 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push('/custom-deals')}
            className="mt-4"
          >
            공구 둘러보기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentParticipations.map((participation) => {
            // 백엔드 배포 타이밍 차이 대응: ID만 오거나 객체로 올 수 있음
            const groupbuy = typeof participation.custom_groupbuy === 'number'
              ? null
              : participation.custom_groupbuy;

            // groupbuy가 없으면 스킵 (데이터 불일치)
            if (!groupbuy) {
              return null;
            }

            return (
              <Card key={participation.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* 이미지 */}
                    <Link href={`/custom-deals/${groupbuy.id}`}>
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                        {groupbuy.primary_image ? (
                          <img
                            src={groupbuy.primary_image}
                            alt={groupbuy.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Tag className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className="text-xs">{groupbuy.type_display}</Badge>
                            {getStatusBadge(participation, groupbuy)}
                          </div>
                          <Link href={`/custom-deals/${groupbuy.id}`}>
                            <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate">
                              {groupbuy.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            판매자: {groupbuy.seller_name} • {new Date(participation.participated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {groupbuy.original_price && groupbuy.final_price ? (
                            <>
                              <div className="flex items-baseline gap-1.5 justify-end">
                                <span className="text-xs text-slate-400 line-through">
                                  {groupbuy.original_price.toLocaleString()}원
                                </span>
                                <span className="text-sm font-bold text-red-600">
                                  {groupbuy.discount_rate}%
                                </span>
                              </div>
                              <div className="text-lg font-bold text-slate-900 mt-0.5">
                                {typeof groupbuy.final_price === 'object' && groupbuy.final_price !== null
                                  ? ((groupbuy.final_price as any).min || 0).toLocaleString()
                                  : groupbuy.final_price.toLocaleString()}원
                              </div>
                            </>
                          ) : (
                            <div className="text-sm font-bold text-gray-900">
                              전품목 {groupbuy.discount_rate}% 할인
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 위치 */}
                      {groupbuy.type === 'offline' && groupbuy.regions && groupbuy.regions.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                          <MapPin className="w-3 h-3" />
                          <span>{groupbuy.regions.map(r => r.full_name).join(', ')}</span>
                        </div>
                      )}

                      {/* 참여 코드 - 작게 */}
                      <div className="bg-slate-50 rounded px-2 py-1.5 mb-1.5 inline-flex items-center gap-2">
                        <span className="text-xs text-slate-500">참여코드:</span>
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {participation.participation_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(participation.participation_code, '참여 코드')}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {/* 할인 정보 */}
                      {(participation.discount_code || participation.discount_url) && (() => {
                        const validity = getValidityDisplay(
                          participation.discount_valid_until,
                          groupbuy.type,
                          groupbuy.online_discount_type,
                          !!participation.discount_code
                        );
                        const isExpired = validity && validity.expired;

                        return (
                          <div className={`border rounded-lg p-3 mb-2 ${
                            isExpired
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Ticket className={`w-4 h-4 ${isExpired ? 'text-red-600' : 'text-slate-600'}`} />
                              <h4 className={`text-sm font-bold ${isExpired ? 'text-red-900' : 'text-slate-900'}`}>
                                {isExpired ? '할인 유효기간 만료' : '할인코드 발급 완료'}
                              </h4>
                              {validity && (
                                <span className={`text-xs ml-auto font-medium ${validity.color}`}>
                                  {validity.label}: {validity.time}
                                </span>
                              )}
                            </div>

                            {/* 유효기간 만료 시 메시지만 표시 */}
                            {isExpired ? (
                              <div className="bg-white rounded px-3 py-2">
                                <p className="text-xs text-red-700 font-medium">
                                  ⏰ 할인 사용 기간이 종료되었습니다
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* 유효기간 내: 할인코드/링크 표시 */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {participation.discount_code && (
                                    <div className="flex items-center gap-2 bg-white rounded px-3 py-1.5 flex-1 min-w-0">
                                      <span className="font-mono text-sm font-bold text-slate-900 truncate">
                                        {participation.discount_code}
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(participation.discount_code!, '할인 코드')}
                                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  {participation.discount_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => window.open(participation.discount_url!, '_blank')}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      링크 열기
                                    </Button>
                                  )}
                                </div>

                                {/* QR 코드 (오프라인 + 미사용) */}
                                {groupbuy.type === 'offline' && participation.discount_code && !participation.discount_used && (
                                  <QRCodeDisplay participationId={participation.id} />
                                )}

                                {participation.discount_used && (
                                  <p className="text-xs text-slate-500 mt-1.5">
                                    사용완료 • {new Date(participation.discount_used_at!).toLocaleDateString()}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-3"
                          onClick={() => router.push(`/custom-deals/${groupbuy.id}`)}
                        >
                          상세보기
                        </Button>
                        {canCancel(participation, groupbuy) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-3 text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleCancelParticipation(participation.id, groupbuy.id)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            참여 취소
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 페이징 */}
      {!loading && participations.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            이전
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'text-slate-900 border-slate-300'}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}