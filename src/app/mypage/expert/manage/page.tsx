'use client';

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchMyExpertProfile,
  fetchExpertRequests,
  toggleReceivingRequests,
  ExpertProfile,
  ConsultationForExpert,
} from '@/lib/api/expertService';
import ExpertProfileCard from '@/components/mypage/ExpertProfileCard';
import { Button } from '@/components/ui/button';

type TabType = 'pending' | 'replied' | 'connected' | 'completed';

const TAB_LABELS: Record<TabType, string> = {
  pending: '요청 대기',
  replied: '답변 완료',
  connected: '연결됨',
  completed: '완료',
};

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  pending: <AlertCircle className="w-4 h-4" />,
  replied: <MessageSquare className="w-4 h-4" />,
  connected: <Phone className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
};

export default function ExpertManagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();

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

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;

      try {
        setIsLoading(true);

        const profileData = await fetchMyExpertProfile(accessToken);
        if (!profileData) {
          router.push('/expert/register');
          return;
        }
        setProfile(profileData);

        const requestsData = await fetchExpertRequests(accessToken, activeTab);
        setRequests(requestsData.results);
        setCounts(requestsData.counts);
      } catch (err) {
        console.error('전문가 관리 내역 로드 오류:', err);
        toast({
          title: '오류',
          description: '요청을 불러오는 중 문제가 발생했습니다.',
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/mypage/expert/manage');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleToggleReceiving = async () => {
    if (!accessToken || isToggling) return;

    setIsToggling(true);
    try {
      const result = await toggleReceivingRequests(accessToken);
      if (result.success) {
        setProfile(prev => prev ? { ...prev, is_receiving_requests: result.is_receiving_requests! } : null);
        toast({
          title: result.is_receiving_requests ? '상담 수신 ON' : '상담 수신 OFF',
          description: result.message,
        });
      } else {
        toast({
          title: '오류',
          description: result.message || '수신 설정을 변경하지 못했습니다.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('수신 설정 변경 오류:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

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

  if (!isAuthenticated || !profile || !accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">전문가 관리 내역</p>
            <h1 className="text-2xl font-bold text-gray-900">요청·매칭 관리</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/mypage/settings')}>
              프로필 설정
            </Button>
          </div>
        </div>

        <ExpertProfileCard
          profile={profile}
          accessToken={accessToken}
          onProfileUpdate={(updated) => setProfile(updated)}
        />

        <div className="bg-blue-50 text-blue-900 border border-blue-100 rounded-lg p-3 text-xs leading-relaxed">
          프로필 이미지 가이드: 정사각형 JPG/PNG, 5MB 이하를 권장합니다. 이미지 수정 버튼을 눌러 업로드하면 카드에 바로 반영됩니다.
        </div>

        <div className="flex items-center gap-3">
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
              <MessageSquare className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {profile.is_receiving_requests ? '상담 수신 중' : '상담 수신 중지'}
          </button>
          <span className="text-sm text-gray-500">
            {profile.is_receiving_requests
              ? '고객 상담 요청을 받고 있습니다.'
              : '상담 요청을 받지 않는 상태입니다.'}
          </span>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
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

      <div className="max-w-5xl mx-auto px-4 py-6">
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
                ? '고객의 상담 요청이 접수되면 여기에 표시됩니다.'
                : '선택한 상태의 상담 내역이 없습니다.'}
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

                    <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {Object.entries(request.answers).slice(0, 2).map(([question, answer], idx) => (
                        <div key={idx} className="mb-1">
                          <span className="font-medium">{question}:</span> {answer}
                        </div>
                      ))}
                    </div>

                    {request.match_status === 'connected' && request.customer_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{request.customer_name}</span>
                        {request.customer_phone && (
                          <span className="ml-1 text-gray-500">{request.customer_phone}</span>
                        )}
                      </div>
                    )}

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
