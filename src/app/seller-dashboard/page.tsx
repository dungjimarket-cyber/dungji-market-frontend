'use client';

import BidManagementTable from '@/components/seller/BidManagementTable';

export default function SellerDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">판매자 대시보드</h1>
      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">진행중인 입찰</h2>
        <BidManagementTable />
      </div>
    </div>
  );
}
