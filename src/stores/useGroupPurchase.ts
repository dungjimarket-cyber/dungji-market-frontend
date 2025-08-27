import { create } from 'zustand';

export interface Bid {
  timestamp: string;
  amount: number;
  userId?: string;
  bidderName?: string;
}

interface GroupPurchase {
  id: string;
  title: string;
  productName: string;
  description?: string;
  currentBid: number;
  minBid: number;
  endTime: string;
  deadline: string;
  bidHistory: Bid[];
  status: 'ongoing' | 'completed' | 'cancelled';
  sellerId: string;
}

type GroupPurchaseState = {
  ongoingPurchases: GroupPurchase[];
  addPurchase: (purchase: GroupPurchase) => void;
  removePurchase: (id: string) => void;
  updateBid: (auctionId: string, newBid: Bid) => void;
};

export const useGroupPurchaseStore = create<GroupPurchaseState>((set) => ({
  ongoingPurchases: [],
  addPurchase: (purchase) =>
    set((state) => ({
      ongoingPurchases: [...state.ongoingPurchases, purchase]
    })),
  removePurchase: (id) =>
    set((state) => ({
      ongoingPurchases: state.ongoingPurchases.filter(p => p.id !== id)
    })),
  updateBid: (auctionId: string, newBid: Bid) =>
    set((state) => ({
      ongoingPurchases: state.ongoingPurchases.map(purchase =>
        purchase.id === auctionId
          ? { 
              ...purchase, 
              currentBid: newBid.amount,
              bidHistory: [...(purchase.bidHistory || []), newBid]
            }
          : purchase
      )
    })),
}));
