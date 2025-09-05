/**
 * 환불 관리 API 서비스
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// 타입 정의
export interface RefundRequest {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  request_amount: number;
  admin_note?: string;
  refund_method?: string;
  refund_amount?: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  user_info: {
    id: string;
    username: string;
    email: string;
    nickname?: string;
  };
  payment_info: {
    order_id: string;
    tid: string;
    amount: number;
    pay_method: string;
    created_at: string;
    product_name: string;
  };
  can_refund_info?: {
    can_refund: boolean;
    reason: string;
  };
}

export interface UserPayment {
  id: string;
  order_id: string;
  amount: number;
  product_name: string;
  pay_method: string;
  created_at: string;
  can_refund: boolean;
  refund_deadline?: string;
  has_refund_request: boolean;
}

export class RefundService {
  private getAuthHeaders() {
    const token = localStorage.getItem('dungji_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  /**
   * 사용자 결제 내역 조회 (환불 가능한 결제 포함)
   */
  async getUserPayments(): Promise<{ payments: UserPayment[] }> {
    try {
      const response = await fetch(`${API_BASE}/payments/user-payments/`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('결제 내역을 불러올 수 없습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('사용자 결제 내역 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 요청 생성
   */
  async createRefundRequest(paymentId: string, reason: string): Promise<RefundRequest> {
    try {
      const response = await fetch(`${API_BASE}/payments/refund-requests/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          payment_id: paymentId,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '환불 요청에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('환불 요청 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 환불 요청 목록 조회
   */
  async getRefundRequests(): Promise<RefundRequest[]> {
    try {
      const response = await fetch(`${API_BASE}/payments/refund-requests/`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('환불 요청 목록을 불러올 수 없습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('환불 요청 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 요청 상세 조회
   */
  async getRefundRequest(id: string): Promise<RefundRequest> {
    try {
      const response = await fetch(`${API_BASE}/payments/refund-requests/${id}/`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('환불 요청 정보를 불러올 수 없습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('환불 요청 상세 조회 실패:', error);
      throw error;
    }
  }

  // 관리자 API들
  /**
   * 관리자용 환불 요청 목록 조회
   */
  async getAdminRefundRequests(status?: string): Promise<RefundRequest[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await fetch(`${API_BASE}/admin/refund-requests/${params}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('환불 요청 목록을 불러올 수 없습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('관리자 환불 요청 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 관리자용 환불 요청 상세 조회
   */
  async getAdminRefundRequest(id: string): Promise<RefundRequest> {
    try {
      const response = await fetch(`${API_BASE}/admin/refund-requests/${id}/`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('환불 요청 정보를 불러올 수 없습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('관리자 환불 요청 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 요청 승인
   */
  async approveRefundRequest(
    id: string, 
    adminNote?: string
  ): Promise<{ success: boolean; message: string; refund_amount?: number }> {
    try {
      const response = await fetch(`${API_BASE}/admin/refund-requests/${id}/approve/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          admin_note: adminNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '환불 승인에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('환불 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 요청 거부
   */
  async rejectRefundRequest(
    id: string,
    reason: string,
    adminNote?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/admin/refund-requests/${id}/reject/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          reason,
          admin_note: adminNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '환불 거부에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('환불 거부 실패:', error);
      throw error;
    }
  }

  /**
   * 관리자용 환불 요청 수정 (상태, 메모 등)
   */
  async updateRefundRequest(
    id: string,
    data: Partial<Pick<RefundRequest, 'status' | 'admin_note' | 'refund_method' | 'refund_amount'>>
  ): Promise<RefundRequest> {
    try {
      const response = await fetch(`${API_BASE}/admin/refund-requests/${id}/`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '환불 요청 수정에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('환불 요청 수정 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const refundService = new RefundService();