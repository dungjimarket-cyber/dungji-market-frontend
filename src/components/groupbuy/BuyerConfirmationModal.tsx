'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, CheckCircle, XCircle } from 'lucide-react';

interface BuyerConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalParticipants: number;
  confirmedCount: number;
  confirmationRate: number;
}

export function BuyerConfirmationModal({
  isOpen,
  onClose,
  totalParticipants,
  confirmedCount,
  confirmationRate
}: BuyerConfirmationModalProps) {
  const declinedCount = totalParticipants - confirmedCount;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            구매자 확정 현황
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 전체 참여인원 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">전체 참여인원</span>
              </div>
              <span className="text-xl font-bold">{totalParticipants}명</span>
            </div>
          </div>

          {/* 구매확정/포기 현황 */}
          <div className="space-y-3">
            {/* 구매확정 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">구매확정</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-green-600">{confirmedCount}명</span>
                  <span className="text-sm text-gray-600 ml-2">({confirmationRate}%)</span>
                </div>
              </div>
            </div>

            {/* 구매포기 */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700">구매포기</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-red-600">{declinedCount}명</span>
                  <span className="text-sm text-gray-600 ml-2">({100 - confirmationRate}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 확정률 진행바 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>확정률</span>
              <span className="font-bold">{confirmationRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  confirmationRate > 50 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${confirmationRate}%` }}
              />
            </div>
            {confirmationRate <= 50 && (
              <p className="text-xs text-orange-600 mt-2 text-center">
                ※ 확정률 50% 이하 시 판매포기 패널티 면제
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}