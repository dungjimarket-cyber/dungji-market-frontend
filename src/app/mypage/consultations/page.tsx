'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  MessageSquare,
  Phone,
  User,
  CheckCircle,
  Clock,
  Building2,
  Send,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchMyConsultations,
  fetchExpertRequests,
  fetchMyExpertProfile,
  replyToRequest,
  ConsultationForCustomer,
  ConsultationForExpert,
  ExpertProfile,
} from '@/lib/api/expertService';
import { useToast } from '@/components/ui/use-toast';
import ExpertProfileCheckModal from '@/components/expert/ExpertProfileCheckModal';

function ConsultationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<ConsultationForCustomer[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConsultationForExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedReceivedId, setExpandedReceivedId] = useState<number | null>(null);
  const initialTab = searchParams.get('tab') === 'received' ? 'received' : 'sent';
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>(initialTab);

  // 전문가 프로필 체크 관련 상태
  const [showProfileCheckModal, setShowProfileCheckModal] = useState(false);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [missingFields, setMissingFields] = useState({
    category: false,
    contactPhone: false,
    regions: false,
  });

  const isExpert = user?.role === 'expert';

  const loadReceived = async () => {
    if (!accessToken || !isExpert) return;
    try {
      const expertData = await fetchExpertRequests(accessToken);
      setReceivedRequests(expertData.results || []);
    } catch (err) {
      console.error('전문가 상담 요청 로드 오류:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;
      try {
        setIsLoading(true);
        const myData = await fetchMyConsultations(accessToken);
        setConsultations(myData.results || []);

        if (isExpert) {
          await loadReceived();

          // 전문가 프로필 체크
          const profile = await fetchMyExpertProfile(accessToken);
          setExpertProfile(profile);

          if (profile) {
            // 필수 정보 누락 체크
            // regions: 전문가 프로필 regions 또는 일반 프로필 address_region 중 하나만 있으면 OK
            const hasRegion = (profile.regions && profile.regions.length > 0) ||
                              (user?.address_region && user.address_region.code);

            // 연락처: 전문가 프로필 contact_phone 또는 일반 프로필 phone_number 중 하나만 있으면 OK
            const hasContactPhone = profile.contact_phone || user?.phone_number;
            const missing = {
              category: !profile.category || !profile.category.id,
              contactPhone: !hasContactPhone,
              regions: !hasRegion,
            };

            setMissingFields(missing);

            // 하나라도 누락되면 모달 표시
            if (missing.category || missing.contactPhone || missing.regions) {
              setShowProfileCheckModal(true);
            }
          } else {
            // 프로필 자체가 없는 경우
            // 일반 프로필 지역이 있으면 regions는 OK
            const hasRegion = user?.address_region && user.address_region.code;
            // 일반 프로필 연락처가 있으면 contactPhone은 OK
            const hasContactPhone = user?.phone_number;

            setMissingFields({
              category: true,
              contactPhone: !hasContactPhone,
              regions: !hasRegion,
            });
            setShowProfileCheckModal(true);
          }
        }
      } catch (err) {
        console.error('상담 내역 로드 오류:', err);
        toast({
          title: '오류',
          description: '상담 내역을 불러오지 못했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && accessToken) {
      loadData();
    }
  }, [accessToken, authLoading, isAuthenticated, isExpert, toast]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/mypage/consultations');
    }
  }, [authLoading, isAuthenticated, router]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleReceivedExpand = (id: number) => {
    setExpandedReceivedId(expandedReceivedId === id ? null : id);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const hasMyConsultations = consultations.length > 0;
  const hasReceivedRequests = receivedRequests.length > 0;
  const hasAnyContent = hasMyConsultations || hasReceivedRequests;
  const showSent = !isExpert || activeTab === 'sent';
  const showReceived = isExpert && activeTab === 'received';

  return (
    <>
      {/* 전문가 프로필 체크 모달 */}
      <ExpertProfileCheckModal
        isOpen={showProfileCheckModal}
        onClose={() => setShowProfileCheckModal(false)}
        missingFields={missingFields}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            <h1 className="text-lg font-bold">상담 내역</h1>
          </div>
          {isExpert && (
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-3 py-2 rounded-md border ${activeTab === 'sent' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-600 hover:border-gray-200'}`}
              >
                상담 신청내역
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-3 py-2 rounded-md border ${activeTab === 'received' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-600 hover:border-gray-200'}`}
              >
                문의 답변하기
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!hasAnyContent ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              상담 신청내역이 없습니다
            </h3>
            <p className="text-gray-500 mb-4">
              전문가 상담을 신청해보세요.
            </p>
            <Link
              href="/local-businesses"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              상담 신청하기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {showSent && hasMyConsultations && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Send className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-900">상담 신청내역</h2>
                  <span className="text-sm text-gray-500">({consultations.length}건)</span>
                </div>
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <ConsultationCard
                      key={consultation.id}
                      consultation={consultation}
                      isExpanded={expandedId === consultation.id}
                      onToggle={() => toggleExpand(consultation.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {showReceived && isExpert && hasReceivedRequests && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Inbox className="w-5 h-5 text-green-600" />
                  <h2 className="text-base font-semibold text-gray-900">문의 답변하기</h2>
                  <span className="text-sm text-gray-500">({receivedRequests.length}건)</span>
                </div>
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <ReceivedRequestCard
                      key={request.id}
                      request={request}
                      isExpanded={expandedReceivedId === request.id}
                      onToggle={() => toggleReceivedExpand(request.id)}
                      accessToken={accessToken}
                      onUpdated={loadReceived}
                    />
                  ))}
                </div>
              </section>
            )}

            {showSent && !hasMyConsultations && (
              <div className="text-center text-sm text-gray-500">신청한 상담이 없습니다.</div>
            )}
            {showReceived && isExpert && !hasReceivedRequests && (
              <div className="text-center text-sm text-gray-500">답변할 문의가 없습니다.</div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default function MyConsultationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ConsultationsContent />
    </Suspense>
  );
}

function ConsultationCard({
  consultation,
  isExpanded,
  onToggle,
}: {
  consultation: ConsultationForCustomer;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const replyMatch = consultation.matches?.find((m) =>
    m.status === 'replied' || m.status === 'connected' || m.status === 'completed'
  );
  const replyText = replyMatch?.expert_message || '';
  const questionSnippet = consultation.answers && Object.entries(consultation.answers)[0]
    ? `${Object.entries(consultation.answers)[0][0]}: ${Object.entries(consultation.answers)[0][1]}`
    : '';
  const summaryText = replyText || questionSnippet;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                {consultation.category_name}
              </span>
              {consultation.connected_expert ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  연결 완료
                </span>
              ) : consultation.replied_experts_count > 0 ? (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  답변 {consultation.replied_experts_count}개
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  답변 대기
                </span>
              )}
            </div>

            {consultation.region && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                {consultation.region}
              </div>
            )}

            <div className="text-sm text-gray-700 line-clamp-1">
              {summaryText
                ? summaryText
                : '상담 내용이 없습니다'}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
              <Calendar className="w-3 h-3" />
              {new Date(consultation.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div className="ml-4 text-gray-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
          {/* 상담 유형 (첫 번째 답변) */}
          {consultation.answers && Object.entries(consultation.answers)[0] && (
            <div>
              <p className="font-medium mb-1">상담 유형</p>
              <p className="text-gray-800">{Object.entries(consultation.answers)[0][1]}</p>
            </div>
          )}
          {/* 나머지 상담 내용 */}
          {consultation.answers && Object.entries(consultation.answers).length > 1 && (
            <div className="flex flex-col gap-1">
              {Object.entries(consultation.answers).slice(1).map(([question, answer]) => (
                <div key={question} className="flex gap-2">
                  <span className="font-semibold text-gray-800">{question}:</span>
                  <span>{answer}</span>
                </div>
              ))}
            </div>
          )}
          {consultation.matches && consultation.matches.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium mb-1">전문가 답변</p>
              {consultation.matches
                .filter(m => m.status === 'replied' || m.status === 'connected' || m.status === 'completed')
                .map((match) => (
                  <div key={match.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    {/* 전문가 정보 헤더 */}
                    {(() => {
                      const expertImage = match.expert.user_profile_image || match.expert.profile_image || '';
                      return (
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-2 ring-gray-200">
                              {expertImage ? (
                                <img
                                  src={expertImage}
                                  alt={match.expert.representative_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900">{match.expert.representative_name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  match.status === 'replied'
                                    ? 'bg-blue-100 text-blue-700'
                                    : match.status === 'connected'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {match.status === 'replied'
                                    ? '답변 완료'
                                    : match.status === 'connected'
                                      ? '연결됨'
                                      : '종료'}
                                </span>
                              </div>
                              {match.expert.tagline && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {match.expert.tagline}
                                </p>
                              )}
                              {match.available_time && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  상담 가능: {match.available_time}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 답변 내용 */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-l-4 border-blue-400">
                      <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        답변 내용
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {match.expert_message || '답변 내용이 없습니다.'}
                      </p>
                    </div>

                    {/* 연락처 영역 */}
                    {match.expert.contact_phone && (
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{match.expert.contact_phone}</span>
                          <div className="flex gap-2">
                            <a
                              href={`tel:${match.expert.contact_phone}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              전화
                            </a>
                            <a
                              href={`sms:${match.expert.contact_phone}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              문자
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
          {consultation.connected_expert && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {consultation.connected_expert.profile_image ? (
                  <img
                    src={consultation.connected_expert.profile_image}
                    alt={consultation.connected_expert.representative_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {consultation.connected_expert.representative_name}
                </p>
                {consultation.connected_expert.business_name && (
                  <p className="text-xs text-gray-500">{consultation.connected_expert.business_name}</p>
                )}
                {consultation.connected_expert.tagline && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {consultation.connected_expert.tagline}
                  </p>
                )}
              </div>
              {consultation.connected_expert.contact_phone && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600">{consultation.connected_expert.contact_phone}</span>
                  <a
                    href={`tel:${consultation.connected_expert.contact_phone}`}
                    className="px-2 py-1 rounded border text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  >
                    전화
                  </a>
                  <a
                    href={`sms:${consultation.connected_expert.contact_phone}`}
                    className="px-2 py-1 rounded border text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  >
                    문자
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReceivedRequestCard({
  request,
  isExpanded,
  onToggle,
  accessToken,
  onUpdated,
}: {
  request: ConsultationForExpert;
  isExpanded: boolean;
  onToggle: () => void;
  accessToken: string | null;
  onUpdated: () => Promise<void>;
}) {
  const statusLabel =
    request.match_status === 'replied'
      ? '답변 완료'
      : request.match_status === 'connected'
        ? '연결됨'
        : request.match_status === 'completed'
          ? '종료'
          : '대기';
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState(request.expert_message || '');
  const [tempAvailable, setTempAvailable] = useState(request.available_time || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { accessToken: ctxToken } = useAuth();

  const tokenToUse = accessToken || ctxToken;

  const handleSave = async () => {
    if (!tokenToUse) {
      toast({ title: '로그인이 필요합니다.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await replyToRequest(request.id, { expert_message: tempMessage, available_time: tempAvailable }, tokenToUse);
      await onUpdated();
      setIsEditing(false);
      toast({ title: '답변이 저장되었습니다.' });
    } catch (err) {
      console.error('답변 수정 오류:', err);
      toast({ title: '오류', description: '답변 저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded">
                {request.category_name}
              </span>
              {request.match_status === 'connected' ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  연결됨
                </span>
              ) : request.match_status === 'replied' ? (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  답변 완료
                </span>
              ) : request.match_status === 'pending' ? (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  답변 대기
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  완료
                </span>
              )}
            </div>

            {request.region && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                {request.region}
              </div>
            )}

            <div className="text-sm text-gray-700 line-clamp-1">
              {request.answers && Object.entries(request.answers)[0] && (
                <>
                  <span className="font-medium">{Object.entries(request.answers)[0][0]}:</span>{' '}
                  {Object.entries(request.answers)[0][1]}
                </>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
              <Calendar className="w-3 h-3" />
              {new Date(request.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div className="ml-4 text-gray-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
          {/* 상담 유형 (첫 번째 답변) */}
          {request.answers && Object.entries(request.answers)[0] && (
            <div>
              <p className="font-medium mb-1">상담 유형</p>
              <p className="text-gray-800">{Object.entries(request.answers)[0][1]}</p>
            </div>
          )}
          {/* 나머지 상담 내용 */}
          {request.answers && Object.entries(request.answers).length > 1 && (
            <div className="flex flex-col gap-1">
              {Object.entries(request.answers).slice(1).map(([question, answer]) => (
                <div key={question} className="flex gap-2">
                  <span className="font-semibold text-gray-800">{question}:</span>
                  <span>{answer}</span>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="font-medium mb-1">내 답변 ({statusLabel})</p>
            <div className="p-3 bg-white rounded border text-sm text-gray-800 whitespace-pre-line">
              {request.expert_message || '답변을 작성하지 않았습니다.'}
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                {request.expert_message ? '답변 수정' : '답변하기'}
              </Button>
            </div>
          </div>
          {request.customer_name && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{request.customer_name}</p>
                {request.customer_phone && (
                  <p className="text-xs text-gray-500 mt-1">{request.customer_phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{request.expert_message ? '답변 수정' : '답변하기'}</h3>
              <button className="text-sm text-gray-500" onClick={() => setIsEditing(false)}>
                닫기
              </button>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">답변 내용</label>
              <textarea
                value={tempMessage}
                onChange={(e) => setTempMessage(e.target.value.slice(0, 500))}
                rows={5}
                maxLength={500}
                className="w-full mt-1 p-2 border rounded text-sm"
                placeholder="답변을 입력해주세요"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">{tempMessage.length}/500</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">상담 가능일자</label>
              <input
                type="text"
                value={tempAvailable}
                onChange={(e) => setTempAvailable(e.target.value)}
                className="w-full mt-1 p-2 border rounded text-sm"
                placeholder="예: 6/10(월) 오후 가능"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
