'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, CheckCircle, Clock, Copy, Calendar, QrCode, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import QRScanner from '@/components/custom/QRScanner';
import * as XLSX from 'xlsx';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // 입력 필드 값
  const [searchTerm, setSearchTerm] = useState(''); // 실제 검색에 사용되는 값
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id, page, searchTerm]); // searchTerm으로 변경

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // 참여자 목록 URL에 페이지네이션 및 검색 파라미터 추가
      const participantsUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/participants/`);
      participantsUrl.searchParams.set('page', page.toString());
      if (searchTerm.trim()) {
        participantsUrl.searchParams.set('search', searchTerm.trim());
      }

      const [dealRes, participantsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(participantsUrl.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!dealRes.ok || !participantsRes.ok) throw new Error('Failed to fetch');

      const dealData = await dealRes.json();
      const participantsData = await participantsRes.json();

      setDeal(dealData);

      // 페이지네이션 응답 처리
      if (participantsData.results) {
        setParticipants(participantsData.results);
        setTotalCount(participantsData.count);
        setTotalPages(Math.ceil(participantsData.count / 20));
      } else {
        // Fallback: 페이지네이션 없는 경우
        setParticipants(participantsData);
        setTotalCount(participantsData.length);
        setTotalPages(1);
      }
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

  // 텍스트에서 URL을 찾아 링크로 변환하는 함수
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    // URL 패턴 (http:// 또는 https://로 시작)
    const urlPattern = /(https?:\/\/[^\s<>"'\)]+)/g;
    const parts = text.split(urlPattern);

    return parts.map((part, index) => {
      // URL인 경우 링크로 렌더링
      if (part.match(urlPattern)) {
        // 끝 문장부호 제거
        const cleanUrl = part.replace(/[.,!?;:]+$/, '');
        return (
          <a
            key={index}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {cleanUrl}
          </a>
        );
      }
      // 일반 텍스트
      return <span key={index}>{part}</span>;
    });
  };

  const handleSearch = () => {
    setSearchTerm(searchQuery);
    setPage(1); // 검색 시 첫 페이지로
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // 전체 참여자 데이터 가져오기 (페이지네이션 없이)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/participants/?page_size=10000`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch all participants');

      const data = await response.json();
      const allParticipants = data.results || data;

      // 엑셀 데이터 생성
      const headers = ['번호', '닉네임', '연락처', '할인코드', '할인링크', '유효기간', '사용여부'];
      const rows = allParticipants.map((p: Participant, index: number) => {
        const validityText = p.discount_valid_until
          ? new Date(p.discount_valid_until).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-';

        return [
          index + 1,
          p.user_name,
          p.phone_number || '-', // 연락처는 텍스트로 유지됨
          p.discount_code || '-',
          p.discount_url || '-',
          validityText,
          p.discount_used ? '사용완료' : '미사용'
        ];
      });

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // 열 너비 자동 조정 (한글 고려)
      const getTextWidth = (text: string) => {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
          const char = text.charAt(i);
          // 한글, 한자, 일본어 등은 2배 너비
          if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7a3]/.test(char)) {
            width += 2;
          } else {
            width += 1;
          }
        }
        return width;
      };

      const colWidths = headers.map((_, colIndex) => {
        const columnData = [headers[colIndex], ...rows.map((row: (string | number)[]) => String(row[colIndex] || ''))];
        const maxWidth = Math.max(...columnData.map(cell => getTextWidth(String(cell))));

        // 각 열마다 다른 최대값 설정
        let maxLimit = 100; // 기본값
        if (colIndex === 0) maxLimit = 10;  // 번호
        if (colIndex === 1) maxLimit = 30;  // 닉네임
        if (colIndex === 2) maxLimit = 25;  // 연락처
        if (colIndex === 3) maxLimit = 50;  // 할인코드
        if (colIndex === 4) maxLimit = 100; // 할인링크 (길 수 있음)
        if (colIndex === 5) maxLimit = 30;  // 유효기간
        if (colIndex === 6) maxLimit = 15;  // 사용여부

        return { wch: Math.min(maxWidth + 2, maxLimit) };
      });
      ws['!cols'] = colWidths;

      // 헤더 스타일 (굵게)
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      // 워크북 생성
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '참여자목록');

      // 파일 다운로드
      const fileName = `참여자목록_${deal?.title}_${new Date().toLocaleDateString('ko-KR')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('참여자 목록을 다운로드했습니다');
    } catch (error) {
      console.error('다운로드 실패:', error);
      toast.error('다운로드에 실패했습니다');
    }
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

      // 이미 사용된 경우 체크
      if (verifyResult.discount_used) {
        toast.warning(`${verifyResult.user_name}님은 이미 사용 처리되었습니다`);
        setShowQRScanner(false);
        return;
      }

      // participant_id를 직접 사용 (배열 검색 불필요)
      const participantId = verifyResult.participant_id;
      const participantIndex = verifyResult.participant_index;

      // 사용 처리 API 호출
      const toggleUrl = `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/participants/${participantId}/toggle-used/`;

      const toggleResponse = await fetch(toggleUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!toggleResponse.ok) {
        throw new Error(`사용 처리 실패: ${toggleResponse.status}`);
      }

      // 성공
      toast.success(`✅ ${verifyResult.user_name}님 할인코드 사용 처리 완료!`);
      setShowQRScanner(false);

      // 해당 참여자가 있는 페이지로 이동 (0-based index → page number)
      const targetPage = Math.floor(participantIndex / 20) + 1;
      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        // 이미 해당 페이지면 새로고침만
        await fetchData();
      }
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
        {deal.type === 'offline' && (
          <div className="mb-4">
            <Button
              onClick={() => setShowQRScanner(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-2"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR 코드 스캔
            </Button>
            <p className="text-[10px] text-slate-600 mt-1">구매자의 QR코드를 스캔하면 즉시 인증 및 사용처리 됩니다</p>
          </div>
        )}

        {/* 검색 입력 및 엑셀 다운로드 */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="닉네임 또는 연락처로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2 whitespace-nowrap"
            >
              검색
            </Button>
          </div>

          {/* 엑셀 다운로드 버튼 */}
          <Button
            onClick={handleDownloadExcel}
            variant="outline"
            className="w-full text-xs py-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            참여자 목록 엑셀 다운로드 (전체 {totalCount}명)
          </Button>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">전체</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{totalCount}</p>
                </div>
                <User className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">사용완료</p>
                  <p className="text-lg font-bold text-gray-600 mt-0.5">{usedCount}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">미사용</p>
                  <p className="text-lg font-bold text-orange-600 mt-0.5">{unusedCount}</p>
                </div>
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* 할인 유효기간 카드 */}
          {deal.discount_valid_until && (
            <Card>
              <CardContent className="p-2">
                {(() => {
                  const validity = getValidityDisplay(deal.discount_valid_until);
                  if (validity) {
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500">{validity.label}</p>
                          <p className={`text-lg font-bold mt-0.5 ${validity.color}`}>
                            {validity.time}
                          </p>
                        </div>
                        <Clock className={`w-5 h-5 ${
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
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-3 h-3" />
              구매자 목록 {searchTerm && `(검색결과: ${totalCount}명)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {participants.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                {searchTerm ? '검색 결과가 없습니다' : '참여자가 없습니다'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {participants.map((participant, index) => {
                  // 현재 페이지의 실제 인덱스 계산
                  const actualIndex = (page - 1) * 20 + index + 1;
                  return (
                  <div
                    key={participant.id}
                    className="p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {/* 번호 및 이름 */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono w-6">#{actualIndex}</span>
                        <span className="font-semibold text-xs text-slate-900">
                          {participant.user_name}
                        </span>
                        {participant.discount_used ? (
                          <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-1 py-0">
                            사용완료
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1 py-0">
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
                                  <div className="flex-1 text-xs text-slate-700">
                                    {renderTextWithLinks(participant.discount_url)}
                                  </div>
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
                                      <div className="flex-1 text-xs text-slate-700">
                                        {renderTextWithLinks(participant.discount_url)}
                                      </div>
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
                );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs h-7"
                >
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs h-7"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>

                {/* 페이지 번호들 */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={`px-2 py-1 text-xs h-7 min-w-[28px] ${
                          page === pageNum ? 'bg-blue-600 text-white' : ''
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs h-7"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs h-7"
                >
                  <ChevronsRight className="w-3 h-3" />
                </Button>

                <span className="text-[10px] text-slate-500 ml-2">
                  {page} / {totalPages}
                </span>
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