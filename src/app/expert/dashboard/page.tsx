'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  Settings,
  Bell,
  BellOff,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  fetchMyExpertProfile,
  fetchExpertRequests,
  toggleReceivingRequests,
  ExpertProfile,
  ConsultationForExpert,
} from '@/lib/api/expertService';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

type TabType = 'pending' | 'replied' | 'connected' | 'completed';

const TAB_LABELS: Record<TabType, string> = {
  pending: '새 요청',
  replied: '답변함',
  connected: '연결됨',
  completed: '완료',
};

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  pending: <AlertCircle className="w-4 h-4" />,
  replied: <MessageSquare className="w-4 h-4" />,
  connected: <Phone className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
};

export default function ExpertDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [requests, setRequests] = useState<ConsultationForExpert[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    replied: 0,
    connected: 0,
    completed: 0,
  });
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // 프로필 및 요청 로드
  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;

      try {
        setIsLoading(true);

        // 프로필 조회
        const profileData = await fetchMyExpertProfile(accessToken);
        if (!profileData) {
          // 전문가 프로필이 없으면 등록 페이지로
          router.push('/expert/register');
          return;
        }
        setProfile(profileData);

        // 요청 목록 조회
        const requestsData = await fetchExpertRequests(accessToken, activeTab);
        setRequests(requestsData.results);
        setCounts(requestsData.counts);
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
  }, [accessToken, authLoading, isAuthenticated, activeTab, router, toast]);

  // 인증되지 않은 사용자 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/expert/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // 상담 수신 토글
  const handleToggleReceiving = async () => {
    if (!accessToken || isToggling) return;

    setIsToggling(true);
    try {
      const result = await toggleReceivingRequests(accessToken);
      if (result.success) {
        setProfile(prev => prev ? { ...prev, is_receiving_requests: result.is_receiving_requests! } : null);
        toast({
          title: result.is_receiving_requests ? '상담 수신 시작' : '상담 수신 중지',
          description: result.message,
        });
      } else {
        toast({
          title: '오류',
          description: result.message || '설정 변경에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('수신 설정 변경 오류:', err);
    } finally {
      setIsToggling(false);
    }
  };

  // 탭 변경
  const handleTabChange = async (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  // 요청 상세 페이지로 이동
  const handleRequestClick = (requestId: number) => {
    router.push(`/expert/requests/${requestId}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 프로필 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* 프로필 이미지 */}
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile.profile_image ? (
                  <img src={profile.profile_image} alt={profile.representative_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{profile.representative_name}</h1>
                  {profile.is_business && profile.business_name && (
                    <span className="text-sm text-gray-500">({profile.business_name})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile.category.icon} {profile.category.name}
                  </span>
                  {profile.status === 'verified' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      인증됨
                    </span>
                  )}
                </div>
                {profile.tagline && (
                  <p className="text-sm text-gray-600 mt-1">{profile.tagline}</p>
                )}
              </div>
            </div>

            {/* 설정 버튼 */}
            <Link
              href="/expert/settings"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {/* 영업 지역 */}
          {profile.regions.length > 0 && (
            <div className="flex items-center gap-1 mt-4 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>영업 지역: {profile.regions.map(r => r.name).join(', ')}</span>
            </div>
          )}

          {/* 상담 수신 토글 */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleToggleReceiving}
              disabled={isToggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                profile.is_receiving_requests
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : profile.is_receiving_requests ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              {profile.is_receiving_requests ? '상담 수신 중' : '상담 수신 중지'}
            </button>
            <span className="text-sm text-gray-500">
              {profile.is_receiving_requests
                ? '새로운 상담 요청을 받고 있습니다.'
                : '상담 요청을 받지 않고 있습니다.'}
            </span>
          </div>
        </div>
      </div>

      {/* 탭 & 카운트 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto">
            {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {TAB_ICONS[tab]}
                  <span>{TAB_LABELS[tab]}</span>
                  {counts[tab] > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {counts[tab]}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 요청 목록 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '새로운 상담 요청이 없습니다' : `${TAB_LABELS[activeTab]} 상담이 없습니다`}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'pending'
                ? '고객의 상담 요청이 도착하면 알려드릴게요.'
                : '해당하는 상담 내역이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => handleRequestClick(request.id)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 카테고리 및 지역 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        {request.category_name}
                      </span>
                      {request.region && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.region}
                        </span>
                      )}
                    </div>

                    {/* 요청 내용 미리보기 */}
                    <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {Object.entries(request.answers).slice(0, 2).map(([question, answer], idx) => (
                        <div key={idx} className="mb-1">
                          <span className="font-medium">{question}:</span> {answer}
                        </div>
                      ))}
                    </div>

                    {/* 고객 정보 (연결된 경우만) */}
                    {request.match_status === 'connected' && request.customer_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{request.customer_name}</span>
                        {request.customer_phone && (
                          <>
                            <Phone className="w-4 h-4 ml-2" />
                            <span>{request.customer_phone}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* 시간 */}
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

                  {/* 상태 & 화살표 */}
                  <div className="flex items-center gap-2 ml-4">
                    {request.match_status === 'pending' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        답변 대기
                      </span>
                    )}
                    {request.match_status === 'replied' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        답변 완료
                      </span>
                    )}
                    {request.match_status === 'connected' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        연결됨
                      </span>
                    )}
                    {request.match_status === 'completed' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        완료
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
