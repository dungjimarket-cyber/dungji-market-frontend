'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react';
import {
  fetchExpertRequestDetail,
  replyToRequest,
  completeRequestAsExpert,
  ConsultationForExpert,
  ConsultationMatch,
} from '@/lib/api/expertService';
import { useToast } from '@/components/ui/use-toast';

export default function ExpertRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { toast } = useToast();

  const [consultation, setConsultation] = useState<ConsultationForExpert | null>(null);
  const [match, setMatch] = useState<ConsultationMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({
    expert_message: '',
    available_time: '',
  });

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!accessToken || !requestId) return;

      try {
        setIsLoading(true);
        const data = await fetchExpertRequestDetail(parseInt(requestId), accessToken);
        if (!data) {
          toast({
            title: '오류',
            description: '요청을 찾을 수 없습니다.',
            variant: 'destructive',
          });
          router.push('/expert/dashboard');
          return;
        }
        setConsultation(data.consultation);
        setMatch(data.match);
      } catch (err) {
        console.error('데이터 로드 오류:', err);
        toast({
          title: '오류',
          description: '데이터를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && accessToken) {
      loadData();
    }
  }, [accessToken, authLoading, isAuthenticated, requestId, router, toast]);

  // 인증되지 않은 사용자 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/expert/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // 답변하기
  const handleReply = async () => {
    if (!accessToken || !requestId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await replyToRequest(
        parseInt(requestId),
        {
          expert_message: replyData.expert_message,
          available_time: replyData.available_time,
        },
        accessToken
      );

      if (result.success) {
        toast({
          title: '답변 완료',
          description: result.message,
        });
        setMatch(result.match || null);
        setShowReplyModal(false);
        // 새로고침
        const data = await fetchExpertRequestDetail(parseInt(requestId), accessToken);
        if (data) {
          setConsultation(data.consultation);
          setMatch(data.match);
        }
      } else {
        toast({
          title: '오류',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('답변 오류:', err);
      toast({
        title: '오류',
        description: '답변 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 상담 완료
  const handleComplete = async () => {
    if (!accessToken || !requestId || isSubmitting) return;

    if (!confirm('상담을 완료 처리하시겠습니까?')) return;

    setIsSubmitting(true);
    try {
      const result = await completeRequestAsExpert(parseInt(requestId), accessToken);

      if (result.success) {
        toast({
          title: '완료',
          description: result.message,
        });
        // 새로고침
        const data = await fetchExpertRequestDetail(parseInt(requestId), accessToken);
        if (data) {
          setConsultation(data.consultation);
          setMatch(data.match);
        }
      } else {
        toast({
          title: '오류',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('완료 처리 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !consultation) {
    return null;
  }

  const status = match?.status || consultation.match_status;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">상담 요청 상세</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 상태 배지 */}
        <div className="mb-4">
          {status === 'pending' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              <Clock className="w-4 h-4" />
              답변 대기
            </span>
          )}
          {status === 'replied' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              <MessageSquare className="w-4 h-4" />
              답변 완료 - 고객 연결 대기
            </span>
          )}
          {status === 'connected' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              <CheckCircle className="w-4 h-4" />
              고객과 연결됨
            </span>
          )}
          {status === 'completed' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
              <CheckCircle className="w-4 h-4" />
              상담 완료
            </span>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded">
              {consultation.category_name}
            </span>
            {consultation.region && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {consultation.region}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(consultation.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* 상담 내용 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">상담 요청 내용</h2>
          <div className="space-y-4">
            {Object.entries(consultation.answers).map(([question, answer], idx) => (
              <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-gray-700 mb-1">{question}</div>
                <div className="text-gray-900">{answer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 고객 정보 (연결된 경우) */}
        {(status === 'connected' || status === 'completed') && consultation.customer_name && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 mb-4">
            <h2 className="font-semibold text-green-800 mb-3">고객 연락처</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <User className="w-4 h-4" />
                <span>{consultation.customer_name}</span>
              </div>
              {consultation.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-700" />
                  <a
                    href={`tel:${consultation.customer_phone}`}
                    className="text-green-700 font-medium hover:underline"
                  >
                    {consultation.customer_phone}
                  </a>
                </div>
              )}
            </div>
            <p className="text-sm text-green-600 mt-3">
              고객에게 먼저 연락하여 상담을 진행해주세요.
            </p>
          </div>
        )}

        {/* 내 답변 (답변한 경우) */}
        {match && (match.expert_message || match.available_time) && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
            <h2 className="font-semibold text-blue-800 mb-3">내 답변</h2>
            {match.expert_message && (
              <div className="mb-3">
                <div className="text-sm text-blue-600 mb-1">메시지</div>
                <div className="text-blue-900 whitespace-pre-wrap">{match.expert_message}</div>
              </div>
            )}
            {match.available_time && (
              <div>
                <div className="text-sm text-blue-600 mb-1">상담 가능 시간</div>
                <div className="text-blue-900">{match.available_time}</div>
              </div>
            )}
            {match.replied_at && (
              <div className="text-xs text-blue-500 mt-2">
                {new Date(match.replied_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}에 답변
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {/* 답변하기 버튼 (pending일 때만) */}
          {status === 'pending' && (
            <button
              onClick={() => setShowReplyModal(true)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              답변하기
            </button>
          )}

          {/* 상담 완료 버튼 (connected일 때만) */}
          {status === 'connected' && (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              상담 완료
            </button>
          )}
        </div>
      </div>

      {/* 답변 모달 */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold">답변하기</h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객에게 전달할 메시지 <span className="text-gray-500">(선택)</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="예: 안녕하세요, 문의하신 내용에 대해 답변드리겠습니다..."
                  value={replyData.expert_message}
                  onChange={(e) => setReplyData(prev => ({ ...prev, expert_message: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담 가능 시간 <span className="text-gray-500">(선택)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 평일 오전 10시~오후 6시"
                  value={replyData.available_time}
                  onChange={(e) => setReplyData(prev => ({ ...prev, available_time: e.target.value }))}
                />
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                답변을 등록하면 고객에게 알림이 전송됩니다.
                고객이 연결을 선택하면 연락처가 공개됩니다.
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowReplyModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleReply}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                답변 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
