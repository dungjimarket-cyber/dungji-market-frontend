'use client';

import { useGroupPurchaseStore, type Bid } from '@/stores/useGroupPurchase';

export default function BidHistory({ auctionId }: { auctionId: string }) {
  const auction = useGroupPurchaseStore(state =>
    state.ongoingPurchases.find(p => p.id === auctionId)
  );

  return (
    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">입찰 히스토리</h4>
      <div className="space-y-2">
        {auction?.bidHistory?.map((bid: Bid, index: number) => (
          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
            <span className="text-sm">
              {new Date(bid.timestamp).toLocaleTimeString()}
            </span>
            <span className="font-medium">
              {bid.amount.toLocaleString()}원
            </span>
            <span className="text-sm text-gray-500">
              {bid.bidderName}
            </span>
          </div>
        )) ?? (
          <p className="text-gray-500 text-center py-4">
            아직 입찰 기록이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
