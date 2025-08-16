'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
}

export interface DashboardSummary {
  monthly_signup: number;
  active_subscribers: number;
  monthly_revenue: number;
  available_settlement: number;
}

interface PartnerContextType {
  partner: Partner | null;
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  login: (partnerId: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};

interface PartnerProviderProps {
  children: ReactNode;
}

export const PartnerProvider: React.FC<PartnerProviderProps> = ({ children }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem('partner_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const login = async (partnerId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
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

      const data = await response.json();
      
      // 토큰과 파트너 정보 저장
      localStorage.setItem('partner_token', data.access_token);
      localStorage.setItem('partner_refresh_token', data.refresh_token);
      setPartner(data.partner_info);
      
      await refreshData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_refresh_token');
    setPartner(null);
    setSummary(null);
    setError(null);
    router.push('/partner-login');
  };

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('partner_token');
      if (!token) {
        logout();
        return;
      }

      const [summaryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/partners/dashboard/summary/`, {
          headers: getAuthHeader(),
        }),
      ]);

      if (!summaryResponse.ok) {
        if (summaryResponse.status === 401) {
          logout();
          return;
        }
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
    }
  };

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('partner_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      await refreshData();
    } catch (err) {
      console.error('Auth check failed:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: PartnerContextType = {
    partner,
    summary,
    isLoading,
    error,
    login,
    logout,
    refreshData,
  };

  return (
    <PartnerContext.Provider value={value}>
      {children}
    </PartnerContext.Provider>
  );
};