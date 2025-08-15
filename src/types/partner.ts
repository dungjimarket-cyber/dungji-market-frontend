export interface Partner {
  id: number;
  partner_name: string;
  partner_code: string;
  commission_rate: number;
  is_active: boolean;
  referral_link: string;
  total_referrals: number;
  active_subscribers: number;
  available_settlement_amount: number;
  created_at: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
}

export interface DashboardSummary {
  monthly_signup: number;
  active_subscribers: number;
  monthly_revenue: number;
  available_settlement: number;
}

export interface ReferralRecord {
  id: number;
  member_name: string;
  member_phone: string;
  joined_date: string;
  subscription_status: 'active' | 'cancelled' | 'paused';
  subscription_amount: number;
  ticket_count: number;
  ticket_amount: number;
  total_amount: number;
  commission_amount: number;
  settlement_status: 'pending' | 'requested' | 'completed';
  status: string;
}

export interface PartnerSettlement {
  id: number;
  settlement_amount: number;
  tax_invoice_requested: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  requested_at: string;
  processed_at: string | null;
  memo?: string;
}

export interface PartnerNotification {
  id: number;
  notification_type: 'signup' | 'payment' | 'cancellation' | 'settlement' | 'system';
  type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ReferralLink {
  partner_code: string;
  full_url: string;
  short_url: string;
  qr_code_url: string;
}

export interface PartnerAccount {
  bank_name: string;
  masked_account_number: string;
  account_holder: string;
}

export interface PartnerStats {
  period: string;
  signup_count: number;
  revenue: number;
  subscription_count: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}