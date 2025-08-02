'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';

interface BidConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bidAmount: number;
  isRebid: boolean;
  loading?: boolean;
  remainingTokens?: number;
  hasUnlimitedSubscription?: boolean;
}

export default function BidConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  bidAmount, 
  isRebid,
  loading = false,
  remainingTokens = 0,
  hasUnlimitedSubscription = false
}: BidConfirmModalProps) {
  
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{isRebid ? '다시 입찰하기' : '입찰하기'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 입찰 금액 표시 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">나의 입찰금액</span>
              <span className="text-xl font-bold">{bidAmount.toLocaleString()} 원</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              입찰 금액은 1,000원 단위로 입력됩니다.
            </p>
          </div>

          {/* 입찰권/구독권 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-sm">
                {hasUnlimitedSubscription ? (
                  <>
                    <p className="font-medium text-blue-900 mb-1">
                      {isRebid ? '다시 입찰 하시겠습니까?' : '입찰 하시겠습니까?'}
                    </p>
                    <p className="text-blue-700">무제한 구독권 이용중</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-blue-900 mb-1">
                      입찰권 1개가 소모됩니다. {isRebid ? '다시 입찰 하시겠습니까?' : '입찰 하시겠습니까?'}
                    </p>
                    <p className="text-blue-700">남은 입찰권 갯수 <span className="font-bold text-orange-600">{remainingTokens}개</span></p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            고민해볼게요
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리중...
              </>
            ) : (
              '예'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}