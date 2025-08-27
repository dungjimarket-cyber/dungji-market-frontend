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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">구매자 확정 현황</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* 메인 통계 카드 */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200 shadow-sm">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-1">전체 참여인원</p>
              <p className="text-3xl font-bold text-blue-700">{totalParticipants}명</p>
            </div>
            
            {/* 확정/포기 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">구매확정</p>
                <p className="text-2xl font-bold text-green-600">{confirmedCount}명</p>
                <p className="text-xs text-gray-500 mt-1">({confirmationRate}%)</p>
              </div>
              
              <div className="bg-white/80 rounded-lg p-4 text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">구매포기</p>
                <p className="text-2xl font-bold text-red-600">{declinedCount}명</p>
                <p className="text-xs text-gray-500 mt-1">({100 - confirmationRate}%)</p>
              </div>
            </div>
          </div>

          {/* 확정률 진행바 섹션 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">구매 확정률</span>
              <span className={`text-lg font-bold ${
                confirmationRate > 50 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {confirmationRate}%
              </span>
            </div>
            
            {/* 진행바 */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${
                    confirmationRate > 50 
                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                      : 'bg-gradient-to-r from-orange-400 to-orange-500'
                  }`}
                  style={{ width: `${confirmationRate}%` }}
                />
              </div>
              
              {/* 50% 기준선 표시 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-4 w-0.5 bg-gray-400" />
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-gray-500">50%</span>
              </div>
            </div>
            
            {/* 패널티 안내 메시지 */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              {confirmationRate <= 50 ? (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-orange-700">
                    확정률이 50% 이하입니다. 판매포기시 패널티가 부과되지 않습니다.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    확정률이 50% 초과했습니다. 판매포기시 패널티가 부과됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}