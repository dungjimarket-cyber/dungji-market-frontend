'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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