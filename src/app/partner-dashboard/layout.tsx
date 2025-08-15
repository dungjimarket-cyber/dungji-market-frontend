'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PartnerProvider } from '@/contexts/PartnerContext';
import PartnerSidebar from '@/components/partner/PartnerSidebar';

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
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <PartnerSidebar />
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-64">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PartnerProvider>
  );
}