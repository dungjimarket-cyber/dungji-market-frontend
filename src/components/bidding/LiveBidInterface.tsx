'use client';

import { useState } from 'react';
import { useBiddingSocket } from '@/lib/socket';
import { useGroupPurchaseStore } from '@/stores/useGroupPurchase';
import { useAuth } from '@/contexts/AuthContext';
import CountdownTimer from './CountdownTimer';

export default function LiveBidInterface({ auctionId }: { auctionId: string }) {
  const [bidAmount, setBidAmount] = useState('');
  const { isAuthenticated } = useAuth();
  const { placeBid } = useBiddingSocket(auctionId, isAuthenticated);
  const auction = useGroupPurchaseStore(state =>
    state.ongoingPurchases.find(p => p.id === auctionId)
  );

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(bidAmount);
    if (!isNaN(amount) && amount > 0) {
      placeBid(amount);
      setBidAmount('');
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{auction?.productName}</h3>
        <div className="flex justify-between mt-2">
          <span>현재 최고가: {auction?.currentBid.toLocaleString() || '입찰 없음'}</span>
          <span>남은 시간: {auction?.deadline ? <CountdownTimer deadline={auction.deadline} /> : '정보 없음'}</span>
        </div>
      </div>
      
      <form onSubmit={handleBidSubmit} className="flex gap-2">
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 p-2"
          placeholder="입찰 금액 입력"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          입찰하기
        </button>
      </form>
    </div>
  );
}
