import {
  Partner,
  DashboardSummary,
  ReferralRecord,
  PartnerSettlement,
  PartnerNotification,
  ReferralLink,
  PartnerAccount,
  PartnerStats,
  PaginatedResponse,
} from '@/types/partner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('partner_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class PartnerService {
  async login(partnerId: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/partners/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partner_id: partnerId,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '로그인에 실패했습니다.');
    }

    return await response.json();
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await fetch(`${API_BASE_URL}/api/partners/dashboard/summary/`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  async getReferralMembers(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    date_range?: string;
  } = {}): Promise<PaginatedResponse<ReferralRecord>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const response = await fetch(
      `${API_BASE_URL}/api/partners/members/?${searchParams.toString()}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error('회원 목록을 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  async getReferralLink(): Promise<ReferralLink> {
    const response = await fetch(`${API_BASE_URL}/api/partners/referral-link/`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('추천 링크를 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  async getAccountInfo(): Promise<PartnerAccount> {
    const response = await fetch(`${API_BASE_URL}/api/partners/account/`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('계좌 정보를 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  async updateAccount(accountData: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/partners/account/update/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '계좌 정보 수정에 실패했습니다.');
    }

    return await response.json();
  }

  async getSettlements(): Promise<PaginatedResponse<PartnerSettlement>> {
    const response = await fetch(`${API_BASE_URL}/api/partners/settlements/`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('정산 내역을 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  async requestSettlement(data: {
    amount: number;
    tax_invoice: boolean;
    memo?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/partners/settlements/request/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '정산 요청에 실패했습니다.');
    }

    return await response.json();
  }

  async exportData(params: {
    format: 'excel' | 'csv';
    start_date?: string;
    end_date?: string;
    status_filter?: string;
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(
      `${API_BASE_URL}/api/partners/export/?${searchParams.toString()}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error('데이터 내보내기에 실패했습니다.');
    }

    return await response.blob();
  }

  async getNotifications(): Promise<PaginatedResponse<PartnerNotification>> {
    const response = await fetch(`${API_BASE_URL}/api/partners/notifications/`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('알림을 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  async markNotificationRead(notificationId: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/partners/notifications/${notificationId}/read/`,
      {
        method: 'POST',
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error('알림 읽음 처리에 실패했습니다.');
    }

    return await response.json();
  }

  async markAllNotificationsRead() {
    const response = await fetch(
      `${API_BASE_URL}/api/partners/notifications/read-all/`,
      {
        method: 'POST',
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error('모든 알림 읽음 처리에 실패했습니다.');
    }

    return await response.json();
  }

  async getStatistics(period: 'month' | 'week' = 'month'): Promise<PartnerStats[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/partners/statistics/?period=${period}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error('통계 데이터를 불러오는데 실패했습니다.');
    }

    return await response.json();
  }

  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const partnerService = new PartnerService();