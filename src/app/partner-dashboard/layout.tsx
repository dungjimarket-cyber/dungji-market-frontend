'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PartnerProvider } from '@/contexts/PartnerContext';

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // 파트너 인증 확인
    const partnerToken = localStorage.getItem('partner_token');
    if (!partnerToken) {
      router.push('/partner-login');
      return;
    }
  }, [router]);

  return (
    <PartnerProvider>
      {children}
    </PartnerProvider>
  );
}