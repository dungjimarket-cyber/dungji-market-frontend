'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Calendar,
  MessageSquare,
  Phone,
  User,
  CheckCircle,
  Clock,
  Building2,
  Mail,
} from 'lucide-react';
import {
  fetchMyConsultationDetail,
  connectWithExpert,
  completeConsultation,
  ConsultationForCustomer,
} from '@/lib/api/expertService';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { toast } = useToast();

  const [consultation, setConsultation] = useState<ConsultationForCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!accessToken || !consultationId) return;

      try {
        setIsLoading(true);
        const data = await fetchMyConsultationDetail(parseInt(consultationId), accessToken);
        if (!data) {
          toast({
            title: '오류',
            description: '상담을 찾을 수 없습니다.',
            variant: 'destructive',
          });
          router.push('/mypage/consultations');
          return;
        }
        setConsultation(data);
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
  }, [accessToken, authLoading, isAuthenticated, consultationId, router, toast]);

  // 인증되지 않은 사용자 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/mypage/consultations');
    }
  }, [authLoading, isAuthenticated, router]);

  // 전문가 연결
  const handleConnect = async (expertId: number) => {
    if (!accessToken || !consultationId || isSubmitting) return;

    if (!confirm('이 전문가와 연결하시겠습니까?\n연결 후에는 전문가에게 연락처가 공개됩니다.')) return;

    setIsSubmitting(true);
    try {
      const result = await connectWithExpert(parseInt(consultationId), expertId, accessToken);

      if (result.success) {
        toast({
          title: '연결 완료',
          description: result.message,
        });
        // 새로고침
        const data = await fetchMyConsultationDetail(parseInt(consultationId), accessToken);
        if (data) {
          setConsultation(data);
        }
      } else {
        toast({
          title: '오류',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('연결 오류:', err);
      toast({
        title: '오류',
        description: '전문가 연결에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 상담 완료
  const handleComplete = async () => {
    if (!accessToken || !consultationId || isSubmitting) return;

    if (!confirm('상담을 완료 처리하시겠습니까?')) return;

    setIsSubmitting(true);
    try {
      const result = await completeConsultation(parseInt(consultationId), accessToken);

      if (result.success) {
        toast({
          title: '완료',
          description: result.message,
        });
        // 새로고침
        const data = await fetchMyConsultationDetail(parseInt(consultationId), accessToken);
        if (data) {
          setConsultation(data);
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

  const hasConnectedExpert = !!consultation.connected_expert;
  const repliedMatches = consultation.matches?.filter(m => m.status === 'replied' || m.status === 'connected' || m.status === 'completed') || [];
  const connectedMatch = consultation.matches?.find(m => m.status === 'connected' || m.status === 'completed');

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
            <h1 className="text-lg font-bold">상담 상세</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 상태 배지 */}
        <div className="mb-4">
          {hasConnectedExpert ? (
            connectedMatch?.status === 'completed' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                <CheckCircle className="w-4 h-4" />
                상담 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <CheckCircle className="w-4 h-4" />
                전문가 연결됨
              </span>
            )
          ) : repliedMatches.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              <MessageSquare className="w-4 h-4" />
              전문가 답변 {repliedMatches.length}개
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              <Clock className="w-4 h-4" />
              답변 대기 중
            </span>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
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

        {/* 요청 내용 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">요청 내용</h2>
          <div className="space-y-4">
            {Object.entries(consultation.answers).map(([question, answer], idx) => (
              <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-gray-700 mb-1">{question}</div>
                <div className="text-gray-900">{answer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 연결된 전문가 정보 */}
        {consultation.connected_expert && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 mb-4">
            <h2 className="font-semibold text-green-800 mb-3">연결된 전문가</h2>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center overflow-hidden">
                {consultation.connected_expert.profile_image ? (
                  <img
                    src={consultation.connected_expert.profile_image}
                    alt={consultation.connected_expert.representative_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 text-lg">
                  {consultation.connected_expert.representative_name}
                </div>
                {consultation.connected_expert.is_business && consultation.connected_expert.business_name && (
                  <div className="text-sm text-green-700 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {consultation.connected_expert.business_name}
                  </div>
                )}
                {consultation.connected_expert.tagline && (
                  <div className="text-sm text-green-600 mt-1">
                    {consultation.connected_expert.tagline}
                  </div>
                )}
              </div>
            </div>

            {/* 연락처 */}
            <div className="mt-4 pt-3 border-t border-green-200 space-y-2">
              {consultation.connected_expert.contact_phone && (
                <a
                  href={`tel:${consultation.connected_expert.contact_phone}`}
                  className="flex items-center gap-2 text-green-700 font-medium hover:text-green-800"
                >
                  <Phone className="w-4 h-4" />
                  {consultation.connected_expert.contact_phone}
                </a>
              )}
              {consultation.connected_expert.contact_email && (
                <a
                  href={`mailto:${consultation.connected_expert.contact_email}`}
                  className="flex items-center gap-2 text-green-700 hover:text-green-800"
                >
                  <Mail className="w-4 h-4" />
                  {consultation.connected_expert.contact_email}
                </a>
              )}
            </div>

            {/* 전문가 소개 */}
            {consultation.connected_expert.introduction && (
              <div className="mt-4 pt-3 border-t border-green-200">
                <div className="text-sm text-green-600 mb-1">전문가 소개</div>
                <div className="text-sm text-green-800 whitespace-pre-wrap">
                  {consultation.connected_expert.introduction}
                </div>
              </div>
            )}

            {/* 영업 지역 */}
            {consultation.connected_expert.regions && consultation.connected_expert.regions.length > 0 && (
              <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                <MapPin className="w-4 h-4" />
                {consultation.connected_expert.regions.map(r => r.name).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* 상담 완료 버튼 (연결된 경우) */}
        {hasConnectedExpert && connectedMatch?.status === 'connected' && (
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            상담 완료
          </button>
        )}

        {/* 답변한 전문가 목록 (아직 연결 안 된 경우) */}
        {!hasConnectedExpert && repliedMatches.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              답변한 전문가 ({repliedMatches.length}명)
            </h2>
            <div className="space-y-4">
              {repliedMatches.map((match) => (
                <div
                  key={match.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {match.expert.profile_image ? (
                        <img
                          src={match.expert.profile_image}
                          alt={match.expert.representative_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {match.expert.representative_name}
                      </div>
                      {match.expert.is_business && match.expert.business_name && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {match.expert.business_name}
                        </div>
                      )}
                      {match.expert.tagline && (
                        <div className="text-xs text-gray-500 mt-1">
                          {match.expert.tagline}
                        </div>
                      )}
                      {match.expert.regions && match.expert.regions.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {match.expert.regions.map(r => r.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 전문가 메시지 */}
                  {match.expert_message && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {match.expert_message}
                    </div>
                  )}

                  {/* 상담 가능 시간 */}
                  {match.available_time && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      상담 가능: {match.available_time}
                    </div>
                  )}

                  {/* 연결 버튼 */}
                  <button
                    onClick={() => handleConnect(match.expert.id)}
                    disabled={isSubmitting}
                    className="w-full mt-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    이 전문가와 연결하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 답변 대기 안내 */}
        {!hasConnectedExpert && repliedMatches.length === 0 && (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-medium text-yellow-800 mb-1">전문가 답변을 기다리고 있어요</h3>
            <p className="text-sm text-yellow-700">
              전문가가 답변하면 알림으로 알려드릴게요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
