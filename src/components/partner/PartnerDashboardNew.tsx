'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { ReferralRecord, PartnerStats, ReferralLink, PartnerSettlement, PartnerAccount } from '@/types/partner';
import { formatCurrency } from '@/lib/utils';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Gift,
  BarChart3,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  CalendarDays,
  CreditCard,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function PartnerDashboardNew() {
  const { partner, summary, isLoading } = usePartner();
  const searchParams = useSearchParams();
  const [recentMembers, setRecentMembers] = useState<ReferralRecord[]>([]);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [stats, setStats] = useState<PartnerStats[]>([]);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  
  // URL 쿼리 파라미터에서 탭 상태 가져오기
  const activeTab = (searchParams.get('tab') || 'dashboard') as 'dashboard' | 'members' | 'link' | 'settlements';

  useEffect(() => {
    loadDashboardData();
  }, [partner]);

  const loadDashboardData = async () => {
    if (!partner) return;

    try {
      // 각 API를 개별적으로 호출하여 하나가 실패해도 다른 데이터는 로드되도록 함
      const membersPromise = partnerService.getReferralMembers({ limit: 10 })
        .then(data => {
          setRecentMembers(data.results || []);
          return data;
        })
        .catch(err => {
          console.error('회원 데이터 로딩 실패:', err);
          return null;
        });

      const linkPromise = partnerService.getReferralLink()
        .then(data => {
          setReferralLink(data);
          return data;
        })
        .catch(err => {
          console.error('추천 링크 로딩 실패:', err);
          // 추천 링크가 없을 수 있으므로 null 반환
          return null;
        });

      const statsPromise = partnerService.getStatistics('month')
        .then(data => {
          setStats(data || []);
          return data;
        })
        .catch(err => {
          console.error('통계 데이터 로딩 실패:', err);
          return null;
        });

      await Promise.all([membersPromise, linkPromise, statsPromise]);
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const downloadQRCode = async () => {
    if (!referralLink?.qr_code_url) return;

    try {
      const qrCodeUrl = referralLink.qr_code_url.startsWith('http') 
        ? referralLink.qr_code_url 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${referralLink.qr_code_url}`;

      // QR 코드 이미지를 fetch하여 blob으로 변환
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `둥지파트너스_QR_${referralLink.partner_code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 메모리 해제
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('QR 코드 다운로드 실패:', error);
      alert('QR 코드 다운로드에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab summary={summary} stats={stats} recentMembers={recentMembers} />
        )}
        {activeTab === 'members' && (
          <MembersTab recentMembers={recentMembers} />
        )}
        {activeTab === 'link' && (
          <LinkTab 
            referralLink={referralLink} 
            copyToClipboard={copyToClipboard}
            copiedItem={copiedItem}
            downloadQRCode={downloadQRCode}
          />
        )}
        {activeTab === 'settlements' && (
          <SettlementsTab />
        )}
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ summary, stats, recentMembers }: any) {
  const currentMonth = new Date().toLocaleString('ko-KR', { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번달 신규가입</p>
              <p className="text-2xl font-semibold text-gray-900">{summary?.monthly_signup || 0}명</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 구독자</p>
              <p className="text-2xl font-semibold text-gray-900">{summary?.active_subscribers || 0}명</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번달 수익</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary?.monthly_revenue || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Gift className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">정산 가능 금액</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary?.available_settlement || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Info */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900">수수료 정보</h3>
            <p className="text-sm text-blue-700 mt-1">
              구독권 판매 시 <span className="font-bold">50%</span>의 수수료를 받으실 수 있습니다.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              * 수수료는 구독 시작일로부터 3개월간 지급됩니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">50%</div>
            <div className="text-sm text-blue-500">3개월간</div>
          </div>
        </div>
      </div>

      {/* Recent Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최근 가입 회원</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회원정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  구독상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수수료
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMembers?.slice(0, 5).map((member: ReferralRecord) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.member_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.member_phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joined_date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.subscription_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.subscription_status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(member.commission_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Members Tab Component
function MembersTab({ recentMembers: initialMembers }: any) {
  const [members, setMembers] = useState<ReferralRecord[]>(initialMembers || []);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    date_range: 'all'
  });
  
  useEffect(() => {
    fetchMembers();
  }, [page, filters]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await partnerService.getReferralMembers({
        page,
        limit: 20,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
        date_range: filters.date_range !== 'all' ? filters.date_range : undefined
      });
      
      setMembers(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="cancelled">해지</option>
              <option value="paused">휴면</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
            <select
              value={filters.date_range}
              onChange={(e) => handleFilterChange('date_range', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="이름, 전화번호 검색"
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">추천 회원 목록</h3>
          <span className="text-sm text-gray-500">총 {totalCount}명</span>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500">로딩 중...</p>
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회원정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구독권
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      견적이용권
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 결제
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수수료
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member: ReferralRecord) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.member_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.member_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.joined_date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.subscription_status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.subscription_status === 'active' ? '활성' : member.subscription_status === 'cancelled' ? '해지' : '휴면'}
                        </span>
                        {member.subscription_amount > 0 && (
                          <span className="ml-2 text-sm text-gray-600">
                            {formatCurrency(member.subscription_amount)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.ticket_count > 0 ? (
                          <>
                            {member.ticket_count}개
                            <div className="text-xs text-gray-500">
                              {formatCurrency(member.ticket_amount)}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(member.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(member.commission_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      전체 <span className="font-medium">{totalCount}</span>명 중{' '}
                      <span className="font-medium">{(page - 1) * 20 + 1}</span> -{' '}
                      <span className="font-medium">{Math.min(page * 20, totalCount)}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">추천 회원이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Link Tab Component
function LinkTab({ referralLink, copyToClipboard, copiedItem, downloadQRCode }: any) {
  // 추천 링크가 아직 없는 경우
  if (!referralLink) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              추천 링크가 아직 생성되지 않았습니다
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              파트너 코드가 자동으로 생성되며, 추천 링크로 회원을 초대할 수 있습니다.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-600">로딩 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              추천 링크로 회원을 초대하세요
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>아래 링크나 QR 코드를 통해 가입한 회원에 대해 수수료를 받을 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Referral Link */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">추천 링크</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                파트너 코드
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={referralLink?.partner_code || ''}
                  readOnly
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(referralLink?.partner_code || '', 'partner_code')}
                  className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50"
                >
                  {copiedItem === 'partner_code' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추천 링크
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={referralLink?.full_url || ''}
                  readOnly
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-900 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(referralLink?.full_url || '', 'full_url')}
                  className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50"
                >
                  {copiedItem === 'full_url' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                단축 링크
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={referralLink?.short_url || ''}
                  readOnly
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(referralLink?.short_url || '', 'short_url')}
                  className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50"
                >
                  {copiedItem === 'short_url' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">QR 코드</h3>
          
          <div className="text-center">
            {referralLink?.qr_code_url ? (
              <>
                <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img
                    src={referralLink.qr_code_url.startsWith('http') 
                      ? referralLink.qr_code_url 
                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${referralLink.qr_code_url}`
                    }
                    alt="추천 링크 QR 코드"
                    className="w-48 h-48"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-48 h-48 flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2m-2 0a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V8z"></path></svg></div>';
                      }
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  QR 코드를 스캔하면 추천 링크로 이동합니다
                </p>
              </>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            <button
              onClick={downloadQRCode}
              disabled={!referralLink?.qr_code_url}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              QR 코드 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* 사용 방법 안내 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">사용 방법</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600">
                1
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">링크 공유하기</p>
              <p className="mt-1 text-sm text-gray-500">
                위의 추천 링크나 단축 링크를 복사하여 SNS, 메신저, 블로그 등에 공유하세요.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600">
                2
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">QR 코드 활용</p>
              <p className="mt-1 text-sm text-gray-500">
                오프라인 행사나 명함에 QR 코드를 추가하여 쉽게 회원을 초대할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600">
                3
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">수수료 받기</p>
              <p className="mt-1 text-sm text-gray-500">
                추천 링크로 가입한 회원이 구독권이나 견적이용권을 구매하면 수수료가 지급됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settlements Tab Component  
function SettlementsTab() {
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [accountInfo, setAccountInfo] = useState<PartnerAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    amount: '',
    tax_invoice: false,
    memo: ''
  });

  useEffect(() => {
    fetchSettlementData();
  }, []);

  const fetchSettlementData = async () => {
    setIsLoading(true);
    try {
      // Fetch settlements
      const settlementsRes = await partnerService.getSettlements();
      setSettlements(settlementsRes.results || []);

      // Fetch account info
      const accountRes = await partnerService.getAccountInfo();
      setAccountInfo(accountRes);
    } catch (error) {
      console.error('Failed to fetch settlement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettlementRequest = async () => {
    if (!requestForm.amount || parseFloat(requestForm.amount) <= 0) {
      alert('정산 금액을 입력해주세요.');
      return;
    }

    try {
      await partnerService.requestSettlement({
        amount: parseFloat(requestForm.amount),
        tax_invoice: requestForm.tax_invoice,
        memo: requestForm.memo
      });
      
      alert('정산 요청이 성공적으로 제출되었습니다.');
      setShowRequestModal(false);
      setRequestForm({ amount: '', tax_invoice: false, memo: '' });
      fetchSettlementData();
    } catch (error) {
      alert('정산 요청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleAccountUpdate = async (accountData: any) => {
    try {
      await partnerService.updateAccount(accountData);
      alert('계좌 정보가 업데이트되었습니다.');
      setShowAccountModal(false);
      fetchSettlementData();
    } catch (error) {
      alert('계좌 정보 업데이트에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; className: string }> = {
      pending: { text: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      processing: { text: '처리중', className: 'bg-blue-100 text-blue-800' },
      completed: { text: '완료', className: 'bg-green-100 text-green-800' },
      rejected: { text: '거절', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 계좌 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">정산 계좌 정보</h3>
          <button
            onClick={() => setShowAccountModal(true)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            수정
          </button>
        </div>
        
        {accountInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">은행명</p>
              <p className="font-medium">{accountInfo.bank_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">계좌번호</p>
              <p className="font-medium">{accountInfo.account_number || accountInfo.masked_account_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">예금주</p>
              <p className="font-medium">{accountInfo.account_holder || '-'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">계좌 정보를 등록해주세요.</p>
            <button
              onClick={() => setShowAccountModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-500"
            >
              계좌 등록하기
            </button>
          </div>
        )}
      </div>

      {/* 정산 요청 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowRequestModal(true)}
          disabled={!accountInfo?.bank_name}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          정산 요청
        </button>
      </div>

      {/* 정산 내역 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">정산 내역</h3>
        </div>
        
        {settlements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    정산금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    세금계산서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    처리일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메모
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(settlement.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {settlement.settlement_amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {settlement.tax_invoice_requested ? '발행' : '미발행'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {settlement.processed_at 
                        ? new Date(settlement.processed_at).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {settlement.memo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">아직 정산 내역이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 정산 요청 모달 */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">정산 요청</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  정산 금액
                </label>
                <input
                  type="number"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tax_invoice"
                  checked={requestForm.tax_invoice}
                  onChange={(e) => setRequestForm({ ...requestForm, tax_invoice: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="tax_invoice" className="ml-2 block text-sm text-gray-900">
                  세금계산서 발행 요청
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  메모 (선택)
                </label>
                <textarea
                  value={requestForm.memo}
                  onChange={(e) => setRequestForm({ ...requestForm, memo: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSettlementRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                요청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계좌 정보 수정 모달 */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">계좌 정보 수정</h3>
            
            <AccountForm
              initialData={accountInfo}
              onSubmit={handleAccountUpdate}
              onCancel={() => setShowAccountModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// AccountForm Component
function AccountForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData: PartnerAccount | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    bank_name: initialData?.bank_name || '',
    account_number: initialData?.account_number || '',
    account_holder: initialData?.account_holder || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bank_name || !formData.account_number || !formData.account_holder) {
      alert('모든 정보를 입력해주세요.');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          은행명
        </label>
        <select
          value={formData.bank_name}
          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">선택하세요</option>
          <option value="KB국민은행">KB국민은행</option>
          <option value="신한은행">신한은행</option>
          <option value="우리은행">우리은행</option>
          <option value="하나은행">하나은행</option>
          <option value="IBK기업은행">IBK기업은행</option>
          <option value="NH농협은행">NH농협은행</option>
          <option value="카카오뱅크">카카오뱅크</option>
          <option value="케이뱅크">케이뱅크</option>
          <option value="토스뱅크">토스뱅크</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          계좌번호
        </label>
        <input
          type="text"
          value={formData.account_number}
          onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="숫자만 입력"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          예금주
        </label>
        <input
          type="text"
          value={formData.account_holder}
          onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="예금주명"
          required
        />
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          저장
        </button>
      </div>
    </form>
  );
}