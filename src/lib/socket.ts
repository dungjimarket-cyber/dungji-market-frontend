import { useEffect, useRef } from 'react';
import { useGroupPurchaseStore } from '@/stores/useGroupPurchase';

export const useBiddingSocket = (auctionId: string) => {
  const ws = useRef<WebSocket | null>(null);
  const { updateBid } = useGroupPurchaseStore();

  useEffect(() => {
    ws.current = new WebSocket(
      `wss://${process.env.NEXT_PUBLIC_WS_URL}/auctions/${auctionId}`
    );

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'NEW_BID':
          updateBid(auctionId, data.bid);
          break;
        case 'AUCTION_CLOSED':
          console.log('Auction closed:', data);
          break;
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [auctionId, updateBid]);

  const placeBid = (amount: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'PLACE_BID',
        amount
      }));
    }
  };

  return { placeBid };
};
