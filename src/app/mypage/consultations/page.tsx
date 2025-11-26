'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import {
  fetchMyConsultations,
  ConsultationForCustomer,
} from '@/lib/api/expertService';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function MyConsultationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<ConsultationForCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;

      try {
        setIsLoading(true);
        const data = await fetchMyConsultations(accessToken);
        setConsultations(data.results);
      } catch (err) {
        console.error('데이터 로드 오류:', err);
        toast({
          title: '오류',
          description: '상담 내역을 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && accessToken) {
      loadData();
    }
  }, [accessToken, authLoading, isAuthenticated, toast]);

  // 인증되지 않은 사용자 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/mypage/consultations');
    }
  }, [authLoading, isAuthenticated, router]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
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
            <h1 className="text-lg font-bold">내 상담 내역</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              상담 내역이 없습니다
            </h3>
            <p className="text-gray-500 mb-4">
              전문가 상담을 요청해보세요.
            </p>
            <Link
              href="/local-businesses"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              상담신청 하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* 상담 헤더 (클릭 가능) */}
                <button
                  onClick={() => toggleExpand(consultation.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* 카테고리 및 상태 */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          {consultation.category_name}
                        </span>
                        {consultation.connected_expert ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            전문가 연결됨
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

                      {/* 지역 */}
                      {consultation.region && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          {consultation.region}
                        </div>
                      )}

                      {/* 요청 내용 미리보기 */}
                      <div className="text-sm text-gray-700 line-clamp-1">
                        {Object.entries(consultation.answers)[0] && (
                          <>
                            <span className="font-medium">{Object.entries(consultation.answers)[0][0]}:</span>{' '}
                            {Object.entries(consultation.answers)[0][1]}
                          </>
                        )}
                      </div>

                      {/* 시간 */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(consultation.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* 펼치기/접기 아이콘 */}
                    <div className="ml-4 flex-shrink-0">
                      {expandedId === consultation.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* 상세 내용 (펼쳐진 경우) */}
                {expandedId === consultation.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* 요청 내용 전체 */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">요청 내용</h4>
                      <div className="space-y-2">
                        {Object.entries(consultation.answers).map(([question, answer], idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">{question}</div>
                            <div className="text-sm text-gray-900">{answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 연결된 전문가 정보 */}
                    {consultation.connected_expert && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                        <h4 className="text-sm font-medium text-green-800 mb-2">연결된 전문가</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center overflow-hidden">
                            {consultation.connected_expert.profile_image ? (
                              <img
                                src={consultation.connected_expert.profile_image}
                                alt={consultation.connected_expert.representative_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-green-900">
                              {consultation.connected_expert.representative_name}
                            </div>
                            {consultation.connected_expert.is_business && consultation.connected_expert.business_name && (
                              <div className="text-sm text-green-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {consultation.connected_expert.business_name}
                              </div>
                            )}
                            {consultation.connected_expert.tagline && (
                              <div className="text-xs text-green-600 mt-1">
                                {consultation.connected_expert.tagline}
                              </div>
                            )}
                          </div>
                        </div>
                        {consultation.connected_expert.contact_phone && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <a
                              href={`tel:${consultation.connected_expert.contact_phone}`}
                              className="flex items-center gap-2 text-green-700 font-medium"
                            >
                              <Phone className="w-4 h-4" />
                              {consultation.connected_expert.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 답변한 전문가 목록 (아직 연결 안 된 경우) */}
                    {!consultation.connected_expert && consultation.matches && consultation.matches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          답변한 전문가 ({consultation.matches.filter(m => m.status === 'replied').length}명)
                        </h4>
                        <div className="space-y-3">
                          {consultation.matches
                            .filter(m => m.status === 'replied')
                            .map((match) => (
                              <div
                                key={match.id}
                                className="bg-white rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                      {match.expert.profile_image ? (
                                        <img
                                          src={match.expert.profile_image}
                                          alt={match.expert.representative_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {match.expert.representative_name}
                                      </div>
                                      {match.expert.is_business && match.expert.business_name && (
                                        <div className="text-xs text-gray-500">
                                          {match.expert.business_name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Link
                                    href={`/mypage/consultations/${consultation.id}/experts/${match.expert.id}`}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                  >
                                    연결하기
                                  </Link>
                                </div>
                                {match.expert_message && (
                                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    {match.expert_message}
                                  </div>
                                )}
                                {match.available_time && (
                                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    상담 가능: {match.available_time}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* 상세 보기 링크 */}
                    <Link
                      href={`/mypage/consultations/${consultation.id}`}
                      className="block w-full text-center py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      상세 보기 →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
