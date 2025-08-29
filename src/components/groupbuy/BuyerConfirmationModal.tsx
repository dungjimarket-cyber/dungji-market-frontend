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
  pendingCount?: number; // 미선택 구매자 수 추가
  declinedCount?: number; // 실제 포기한 구매자 수 추가
}

export function BuyerConfirmationModal({
  isOpen,
  onClose,
  totalParticipants,
  confirmedCount,
  confirmationRate,
  pendingCount = 0,
  declinedCount: propDeclinedCount
}: BuyerConfirmationModalProps) {
  // 실제 포기한 수가 prop으로 전달되면 사용, 아니면 계산
  const actualDeclinedCount = propDeclinedCount !== undefined 
    ? propDeclinedCount 
    : totalParticipants - confirmedCount - pendingCount;
  
  // 미선택 구매자 수
  const actualPendingCount = pendingCount || (totalParticipants - confirmedCount - actualDeclinedCount);
  
  // 실제 확정률 재계산 (미선택 제외)
  const actualConfirmationRate = totalParticipants > 0 && (confirmedCount + actualDeclinedCount) > 0
    ? Math.round((confirmedCount / (confirmedCount + actualDeclinedCount)) * 100)
    : confirmationRate;
  
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
            
            {/* 확정/포기/미선택 통계 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <CheckCircle className="h-7 w-7 text-green-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">구매확정</p>
                <p className="text-xl font-bold text-green-600">{confirmedCount}명</p>
              </div>
              
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <XCircle className="h-7 w-7 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">구매포기</p>
                <p className="text-xl font-bold text-red-600">{actualDeclinedCount}명</p>
              </div>
              
              {actualPendingCount > 0 && (
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Users className="h-7 w-7 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">미선택</p>
                  <p className="text-xl font-bold text-gray-600">{actualPendingCount}명</p>
                </div>
              )}
            </div>
          </div>

          {/* 확정률 진행바 섹션 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-gray-700">구매 확정률</span>
                {actualPendingCount > 0 && (
                  <span className="text-xs text-gray-500 ml-2">(미선택 {actualPendingCount}명 제외)</span>
                )}
              </div>
              <span className={`text-lg font-bold ${
                actualConfirmationRate > 50 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {actualConfirmationRate}%
              </span>
            </div>
            
            {/* 진행바 */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${
                    actualConfirmationRate > 50 
                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                      : 'bg-gradient-to-r from-orange-400 to-orange-500'
                  }`}
                  style={{ width: `${actualConfirmationRate}%` }}
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
              {actualConfirmationRate <= 50 ? (
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