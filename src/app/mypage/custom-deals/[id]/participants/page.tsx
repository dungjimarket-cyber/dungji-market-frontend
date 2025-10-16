'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, CheckCircle, Clock, Copy, Calendar, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import QRScanner from '@/components/custom/QRScanner';

interface Participant {
  id: number;
  user_name: string;
  phone_number: string | null;
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

interface CustomDeal {
  id: number;
  title: string;
  type: 'online' | 'offline';
  type_display: string;
  status: string;
  status_display: string;
  target_participants: number;
  current_participants: number;
  online_discount_type?: 'link_only' | 'code_only' | 'both';
  discount_valid_until?: string;
  pricing_type?: 'single_product' | 'all_products' | 'coupon_only';
}

export default function ParticipantsManagePage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<CustomDeal | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const [dealRes, participantsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/participants/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!dealRes.ok || !participantsRes.ok) throw new Error('Failed to fetch');

      const dealData = await dealRes.json();
      const participantsData = await participantsRes.json();

      setDeal(dealData);
      setParticipants(participantsData);
    } catch (error) {
      console.error('로드 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
      router.push('/mypage/custom-deals');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUsed = async (participantId: number, currentUsed: boolean, validUntil: string | null) => {
    // 유효기간 만료 체크
    if (validUntil) {
      const validity = getValidityDisplay(validUntil);
      if (validity && validity.expired && !currentUsed) {
        toast.error('할인 유효기간이 만료되어 사용 처리할 수 없습니다');
        return;
      }
    }

    try {
      setToggleLoading(participantId);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/participants/${participantId}/toggle-used/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to toggle');

      const updatedParticipant = await response.json();

      setParticipants(prev =>
        prev.map(p => p.id === participantId ? updatedParticipant : p)
      );

      toast.success(currentUsed ? '미사용으로 변경되었습니다' : '사용 완료로 변경되었습니다');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast.error('상태 변경에 실패했습니다');
    } finally {
      setToggleLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}가 복사되었습니다`);
  };

  const getValidityDisplay = (validUntil: string | null) => {
    if (!validUntil) return null;

    const now = new Date();
    const expire = new Date(validUntil);
    const diff = expire.getTime() - now.getTime();

    // 만료됨
    if (diff <= 0) {
      return { label: '할인 유효기간', time: '만료됨', color: 'text-red-600', expired: true };
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let timeText = '';
    if (minutes < 60) {
      // 1시간 미만: 분 단위
      timeText = `${minutes}분 남음`;
    } else if (hours < 24) {
      // 1시간~24시간: 시간 단위
      timeText = `${hours}시간 남음`;
    } else {
      // 1일 이상: 일 단위
      timeText = `${days}일 남음`;
    }

    return {
      label: '할인 유효기간',
      time: timeText,
      color: days < 1 ? 'text-orange-600' : 'text-slate-600',
      expired: false
    };
  };

  const handleQRScanSuccess = async (data: { participationCode: string; discountCode: string; groupbuyId: string }) => {
    try {
      const token = localStorage.getItem('accessToken');

      // 할인코드 검증
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-participants/verify_discount/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            discount_code: data.discountCode,
            groupbuy_id: data.groupbuyId
          })
        }
      );

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.valid) {
        toast.error(verifyResult.error || '유효하지 않은 할인코드입니다');
        return;
      }

      // 참여자 찾기
      const participant = participants.find(p => p.discount_code === data.discountCode);

      if (!participant) {
        toast.error('참여자 정보를 찾을 수 없습니다');
        return;
      }

      // 이미 사용된 경우 체크
      if (participant.discount_used) {
        toast.warning(`${verifyResult.user_name}님은 이미 사용 처리되었습니다`);
        setShowQRScanner(false);
        return;
      }

      // 사용 처리 API 호출
      const toggleUrl = `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/participants/${participant.id}/toggle-used/`;

      const toggleResponse = await fetch(toggleUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!toggleResponse.ok) {
        throw new Error(`사용 처리 실패: ${toggleResponse.status}`);
      }

      const toggleResult = await toggleResponse.json();

      // 성공
      toast.success(`✅ ${verifyResult.user_name}님 할인코드 사용 처리 완료!`);
      setShowQRScanner(false);

      // 참여자 목록 리프레시
      await fetchData();
    } catch (error) {
      toast.error(`QR 인증에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!deal) return null;

  const usedCount = participants.filter(p => p.discount_used).length;
  const unusedCount = participants.length - usedCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로가기</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{deal.title}</h1>
            <p className="text-sm text-slate-600 mt-1">참여자 관리</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* QR 스캔 버튼 (오프라인 공구만) */}
        <div className="flex flex-wrap gap-3 mb-6">
          {deal.type === 'offline' && (
            <div className="flex-1 min-w-[200px]">
              <Button
                onClick={() => setShowQRScanner(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <QrCode className="w-5 h-5 mr-2" />
                QR 코드 스캔
              </Button>
              <p className="text-sm text-slate-600 mt-2">구매자의 QR코드를 스캔하면 즉시 인증 및 사용처리 됩니다</p>
            </div>
          )}

          {/* 노쇼 신고 버튼 */}
          <div className={deal.type === 'offline' ? 'flex-1 min-w-[200px]' : 'w-full'}>
            <Button
              onClick={() => router.push(`/custom-noshow-report/create?groupbuy=${params.id}`)}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              노쇼 신고하기
            </Button>
            <p className="text-sm text-slate-600 mt-2">거래가 이루어지지 않은 참여자를 선택하여 신고하세요</p>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">전체</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{participants.length}</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">사용완료</p>
                  <p className="text-2xl font-bold text-gray-600 mt-0.5">{usedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">미사용</p>
                  <p className="text-2xl font-bold text-orange-600 mt-0.5">{unusedCount}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* 할인 유효기간 카드 */}
          {deal.discount_valid_until && (
            <Card>
              <CardContent className="p-4">
                {(() => {
                  const validity = getValidityDisplay(deal.discount_valid_until);
                  if (validity) {
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">{validity.label}</p>
                          <p className={`text-2xl font-bold mt-0.5 ${validity.color}`}>
                            {validity.time}
                          </p>
                        </div>
                        <Clock className={`w-8 h-8 ${
                          validity.expired ? 'text-red-500' : 'text-blue-500'
                        }`} />
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 구매자 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4" />
              구매자 목록 (판매자: 본인)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {participants.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                참여자가 없습니다
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      {/* 번호 및 이름 */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono w-6">#{index + 1}</span>
                        <span className="font-semibold text-sm text-slate-900">
                          {participant.user_name}
                        </span>
                        {participant.discount_used ? (
                          <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs px-1.5 py-0">
                            사용완료
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-1.5 py-0">
                            미사용
                          </Badge>
                        )}
                      </div>

                      {/* 사용 상태 토글 */}
                      <Switch
                        checked={participant.discount_used}
                        onCheckedChange={() => handleToggleUsed(participant.id, participant.discount_used, participant.discount_valid_until)}
                        disabled={
                          toggleLoading === participant.id ||
                          // 유효기간 만료 시 미사용 상태에서는 사용처리 불가
                          (!participant.discount_used && (() => {
                            const validity = getValidityDisplay(participant.discount_valid_until);
                            return validity ? validity.expired : false;
                          })())
                        }
                        className="data-[state=checked]:bg-gray-600"
                      />
                    </div>

                    {/* 참여 정보 */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2 flex-wrap">
                      {participant.phone_number && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          📞 {participant.phone_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(participant.participated_at).toLocaleDateString('ko', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {participant.discount_used && participant.discount_used_at && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <CheckCircle className="w-3 h-3" />
                          사용: {new Date(participant.discount_used_at).toLocaleDateString('ko', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>

                    {/* 할인코드/링크 또는 만료 메시지 */}
                    {(() => {
                      const validity = getValidityDisplay(participant.discount_valid_until);
                      const isExpired = validity && validity.expired;

                      // 유효기간 만료된 경우
                      if (isExpired) {
                        return (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                            <span className="flex-1 text-xs font-semibold text-red-700">
                              ⏰ 할인 유효기간 만료
                            </span>
                          </div>
                        );
                      }

                      // 유효기간 내: pricing_type과 online_discount_type에 따라 할인코드/링크 표시
                      return (
                        <>
                          {/* 오프라인: 항상 할인코드 표시 */}
                          {deal.type === 'offline' && participant.discount_code && (
                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-1">
                              <code className="flex-1 font-mono text-sm font-semibold text-blue-900 break-all">
                                {participant.discount_code}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(
                                  participant.discount_code!,
                                  deal.pricing_type === 'coupon_only' ? '쿠폰코드' : '할인코드'
                                )}
                                className="h-7 w-7 p-0 flex-shrink-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                          {/* 온라인: 쿠폰전용 또는 online_discount_type에 따라 표시 */}
                          {deal.type === 'online' && (
                            <>
                              {/* 쿠폰전용: discount_url이 있으면 무조건 표시 */}
                              {deal.pricing_type === 'coupon_only' && participant.discount_url && (
                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-1">
                                  <a
                                    href={participant.discount_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm text-blue-600 hover:underline break-all"
                                  >
                                    {participant.discount_url}
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(participant.discount_url!, '쿠폰링크')}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}

                              {/* 쿠폰전용: discount_code가 있으면 무조건 표시 */}
                              {deal.pricing_type === 'coupon_only' && participant.discount_code && (
                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                  <code className="flex-1 font-mono text-sm font-semibold text-blue-900 break-all">
                                    {participant.discount_code}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(participant.discount_code!, '쿠폰코드')}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}

                              {/* 일반 온라인 공구: online_discount_type에 따라 표시 */}
                              {deal.pricing_type !== 'coupon_only' && (
                                <>
                                  {/* 할인링크 (link_only 또는 both) */}
                                  {(deal.online_discount_type === 'link_only' || deal.online_discount_type === 'both') && participant.discount_url && (
                                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-1">
                                      <a
                                        href={participant.discount_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 text-sm text-blue-600 hover:underline break-all"
                                      >
                                        {participant.discount_url}
                                      </a>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(participant.discount_url!, '할인링크')}
                                        className="h-7 w-7 p-0 flex-shrink-0"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}

                                  {/* 할인코드 (code_only 또는 both) */}
                                  {(deal.online_discount_type === 'code_only' || deal.online_discount_type === 'both') && participant.discount_code && (
                                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                      <code className="flex-1 font-mono text-sm font-semibold text-blue-900 break-all">
                                        {participant.discount_code}
                                      </code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(participant.discount_code!, '할인코드')}
                                        className="h-7 w-7 p-0 flex-shrink-0"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR 스캐너 모달 */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        groupbuyId={params.id as string}
      />
    </div>
  );
}