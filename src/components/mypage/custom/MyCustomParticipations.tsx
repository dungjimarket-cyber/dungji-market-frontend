'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Tag, MapPin, Eye, Heart, Calendar, AlertCircle, CheckCircle, XCircle, Copy, ExternalLink, Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface CustomParticipation {
  id: number;
  custom_groupbuy: {
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

  useEffect(() => {
    fetchParticipations();
  }, [filter]);

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
      toast.error('목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelParticipation = async (participationId: number, groupbuyId: number) => {
    if (!confirm('참여를 취소하시겠습니까?')) return;

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

  const getValidUntilDisplay = (validUntil: string | null) => {
    if (!validUntil) return null;
    const date = new Date(validUntil);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return <span className="text-red-600">유효기간 만료</span>;
    if (daysLeft === 0) return <span className="text-orange-600">오늘까지</span>;
    return <span className="text-slate-600">{daysLeft}일 남음</span>;
  };

  const getStatusBadge = (participation: CustomParticipation) => {
    const groupbuyStatus = participation.custom_groupbuy.status;

    if (groupbuyStatus === 'completed' && participation.discount_code) {
      if (participation.discount_used) {
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">사용완료</Badge>;
      }
      return <Badge className="bg-green-50 text-green-600 border-green-200">할인발급</Badge>;
    }

    if (groupbuyStatus === 'recruiting') {
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200">모집중</Badge>;
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

  const canCancel = (participation: CustomParticipation) => {
    return (
      participation.status === 'confirmed' &&
      participation.custom_groupbuy.status !== 'completed' &&
      !participation.discount_code &&
      !participation.discount_url
    );
  };

  const filterCounts = {
    all: participations.length,
    confirmed: participations.filter(p => p.status === 'confirmed').length,
    cancelled: participations.filter(p => p.status === 'cancelled').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/custom-deals')}
        >
          특가 둘러보기
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
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('confirmed')}
          className={filter === 'confirmed' ? 'bg-blue-600' : ''}
        >
          참여중 ({filterCounts.confirmed})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('cancelled')}
          className={filter === 'cancelled' ? 'bg-blue-600' : ''}
        >
          취소됨 ({filterCounts.cancelled})
        </Button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      ) : participations.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-600 mb-2">참여한 특가가 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push('/custom-deals')}
            className="mt-4"
          >
            특가 둘러보기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {participations.map((participation) => {
            const groupbuy = participation.custom_groupbuy;

            return (
              <Card key={participation.id} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* 이미지 */}
                    <Link href={`/custom-deals/${groupbuy.id}`}>
                      <div className="w-40 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 cursor-pointer">
                        {groupbuy.primary_image ? (
                          <img
                            src={groupbuy.primary_image}
                            alt={groupbuy.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Tag className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{groupbuy.type_display}</Badge>
                            {getStatusBadge(participation)}
                          </div>
                          <Link href={`/custom-deals/${groupbuy.id}`}>
                            <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-blue-600 cursor-pointer">
                              {groupbuy.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-slate-600">판매자: {groupbuy.seller_name}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm text-slate-500 line-through">
                              {groupbuy.original_price.toLocaleString()}원
                            </span>
                            <span className="text-lg font-bold text-red-600">
                              {groupbuy.discount_rate}%
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-slate-900">
                            {groupbuy.final_price.toLocaleString()}원
                          </div>
                        </div>
                      </div>

                      {/* 위치 */}
                      {groupbuy.type === 'offline' && groupbuy.regions && groupbuy.regions.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-slate-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{groupbuy.regions.map(r => r.full_name).join(', ')}</span>
                        </div>
                      )}

                      {/* 참여 코드 */}
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">참여 코드</p>
                            <p className="font-mono font-bold text-slate-900">
                              {participation.participation_code}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              참여일: {new Date(participation.participated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(participation.participation_code, '참여 코드')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 할인 정보 */}
                      {(participation.discount_code || participation.discount_url) && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Ticket className="w-5 h-5 text-green-600" />
                            <h4 className="font-bold text-green-900">할인 발급완료</h4>
                            {participation.discount_valid_until && (
                              <span className="text-sm ml-auto">
                                {getValidUntilDisplay(participation.discount_valid_until)}
                              </span>
                            )}
                          </div>

                          {participation.discount_code && (
                            <div className="bg-white rounded p-3 mb-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">할인 코드</p>
                                  <p className="font-mono font-bold text-lg text-slate-900">
                                    {participation.discount_code}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(participation.discount_code!, '할인 코드')}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {participation.discount_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(participation.discount_url!, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              할인 링크로 이동
                            </Button>
                          )}

                          {participation.discount_used && participation.discount_used_at && (
                            <p className="text-xs text-slate-500 mt-2">
                              사용일: {new Date(participation.discount_used_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        {canCancel(participation) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleCancelParticipation(participation.id, groupbuy.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            참여 취소
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/custom-deals/${groupbuy.id}`)}
                        >
                          상세보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}