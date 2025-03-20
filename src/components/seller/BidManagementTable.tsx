'use client';

import { useGroupPurchaseStore } from '@/stores/useGroupPurchase';

export default function BidManagementTable() {
  const { ongoingPurchases } = useGroupPurchaseStore();

  const sellerAuctions = ongoingPurchases.filter(
    purchase => purchase.sellerId === 'current-user-id'
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">현재 최고가</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">남은 시간</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sellerAuctions.map((auction) => (
            <tr key={auction.id}>
              <td className="px-6 py-4 whitespace-nowrap">{auction.productName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{auction.currentBid?.toLocaleString() || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(auction.deadline).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  진행중
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
