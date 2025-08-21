'use client';

import { useEffect, useState } from 'react';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { ReferralRecord, PartnerStats, ReferralLink } from '@/types/partner';
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
  CreditCard
} from 'lucide-react';

export default function PartnerDashboardNew() {
  const { partner, summary, isLoading } = usePartner();
  const [recentMembers, setRecentMembers] = useState<ReferralRecord[]>([]);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [stats, setStats] = useState<PartnerStats[]>([]);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'link' | 'settlements'>('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, [partner]);

  const loadDashboardData = async () => {
    if (!partner) return;

    try {
      const [membersData, linkData, statsData] = await Promise.all([
        partnerService.getReferralMembers({ limit: 10 }),
        partnerService.getReferralLink(),
        partnerService.getStatistics('month')
      ]);

      setRecentMembers(membersData.results || []);
      setReferralLink(linkData);
      setStats(statsData || []);
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

  const downloadQRCode = () => {
    if (!referralLink?.qr_code_url) return;

    const qrCodeUrl = referralLink.qr_code_url.startsWith('http') 
      ? referralLink.qr_code_url 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${referralLink.qr_code_url}`;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `둥지마켓_파트너_QR_${referralLink.partner_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img className="h-8 w-auto" src="/logo.png" alt="둥지마켓" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">둥지파트너스</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                안녕하세요, <span className="font-medium">{partner?.partner_name}</span>님
              </span>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {partner?.partner_name?.charAt(0) || 'P'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: '대시보드', icon: BarChart3 },
              { id: 'members', label: '회원 관리', icon: Users },
              { id: 'link', label: '추천링크', icon: QrCode },
              { id: 'settlements', label: '정산 관리', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-2 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

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
function MembersTab({ recentMembers }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">추천 회원 목록</h3>
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
                  구독권
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  견적티켓
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
              {recentMembers?.map((member: ReferralRecord) => (
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
                      {member.subscription_status === 'active' ? '✓' : '✗'}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {formatCurrency(member.subscription_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.ticket_count}개
                    <div className="text-xs text-gray-500">
                      {formatCurrency(member.ticket_amount)}
                    </div>
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
      </div>
    </div>
  );
}

// Link Tab Component
function LinkTab({ referralLink, copyToClipboard, copiedItem, downloadQRCode }: any) {
  return (
    <div className="space-y-6">
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
              <div className="inline-block p-4 bg-white rounded-lg border border-gray-200">
                <img
                  src={referralLink.qr_code_url.startsWith('http') 
                    ? referralLink.qr_code_url 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${referralLink.qr_code_url}`
                  }
                  alt="추천 링크 QR 코드"
                  className="w-48 h-48"
                />
              </div>
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
    </div>
  );
}

// Settlements Tab Component  
function SettlementsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">정산 관리</h3>
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>정산 관리 기능이 곧 제공될 예정입니다.</p>
        </div>
      </div>
    </div>
  );
}