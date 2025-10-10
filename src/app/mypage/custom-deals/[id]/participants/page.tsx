'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, CheckCircle, Clock, Copy, Calendar, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import QRScanner from '@/components/custom/QRScanner';

interface Participant {
  id: number;
  user_name: string;
  participated_at: string;
  participation_code: string;
  discount_code: string | null;
  discount_url: string | null;
  discount_used: boolean;
  discount_used_at: string | null;
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

  const handleToggleUsed = async (participantId: number, currentUsed: boolean) => {
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

  const handleQRScanSuccess = async (data: { participationCode: string; discountCode: string; groupbuyId: string }) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
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

      const result = await response.json();

      if (result.valid) {
        toast.success(`할인코드 인증 완료: ${result.user_name}`);
        setShowQRScanner(false);
        // 참여자 목록 리프레시
        fetchData();
      } else {
        toast.error(result.error || '유효하지 않은 할인코드입니다');
      }
    } catch (error) {
      console.error('QR 인증 실패:', error);
      toast.error('QR 인증에 실패했습니다');
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
        {deal.type === 'offline' && (
          <div className="mb-6">
            <Button
              onClick={() => setShowQRScanner(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="w-5 h-5 mr-2" />
              QR 코드 스캔
            </Button>
            <p className="text-sm text-slate-600 mt-2">고객의 QR 코드를 스캔하여 할인코드를 즉시 인증하세요</p>
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">전체 참여자</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{participants.length}명</p>
                </div>
                <User className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">사용 완료</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{usedCount}명</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">미사용</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{unusedCount}명</p>
                </div>
                <Clock className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 참여자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              참여자 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                참여자가 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="border border-slate-200 rounded-lg p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 왼쪽: 참여자 정보 */}
                      <div className="flex-1 space-y-3">
                        {/* 번호 및 이름 */}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm">
                            #{index + 1}
                          </Badge>
                          <span className="font-semibold text-lg text-slate-900">
                            {participant.user_name}
                          </span>
                          {participant.discount_used ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              사용완료
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                              미사용
                            </Badge>
                          )}
                        </div>

                        {/* 참여 정보 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>참여일: {new Date(participant.participated_at).toLocaleString()}</span>
                          </div>
                          {participant.discount_used && participant.discount_used_at && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>사용일: {new Date(participant.discount_used_at).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* 할인코드/링크 */}
                        {participant.discount_code && (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                            <span className="text-sm text-slate-600 min-w-fit">할인코드:</span>
                            <code className="flex-1 font-mono font-semibold text-blue-900">
                              {participant.discount_code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(participant.discount_code!, '할인코드')}
                              className="h-7 px-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {participant.discount_url && (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                            <span className="text-sm text-slate-600 min-w-fit">할인링크:</span>
                            <a
                              href={participant.discount_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-sm text-blue-600 hover:underline truncate"
                            >
                              {participant.discount_url}
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(participant.discount_url!, '할인링크')}
                              className="h-7 px-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 오른쪽: 사용 상태 토글 */}
                      <div className="flex flex-col items-center gap-2 min-w-fit">
                        <span className="text-xs text-slate-600 whitespace-nowrap">사용 상태</span>
                        <Switch
                          checked={participant.discount_used}
                          onCheckedChange={() => handleToggleUsed(participant.id, participant.discount_used)}
                          disabled={toggleLoading === participant.id}
                          className="data-[state=checked]:bg-green-600"
                        />
                        <span className={`text-xs font-medium whitespace-nowrap ${
                          participant.discount_used ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {participant.discount_used ? '사용됨' : '미사용'}
                        </span>
                      </div>
                    </div>
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