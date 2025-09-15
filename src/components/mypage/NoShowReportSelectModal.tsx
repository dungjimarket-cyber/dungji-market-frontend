'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Package } from 'lucide-react';

interface RecentGroupBuy {
  id: number;
  title: string;
  product_name: string;
  product_image?: string;
  completed_at: string;
  days_ago: number;
  participant_count?: number;
  seller_name?: string;
  seller_id?: number;  // seller_id 추가
}

interface NoShowReportSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuys: RecentGroupBuy[];
}

export function NoShowReportSelectModal({
  isOpen,
  onClose,
  groupBuys
}: NoShowReportSelectModalProps) {
  const router = useRouter();

  const handleSelectGroupBuy = (groupBuy: RecentGroupBuy) => {
    // 구매자인 경우 seller_id도 함께 전달
    let url = `/noshow-report/create?groupbuy_id=${groupBuy.id}`;
    if (groupBuy.seller_id) {
      url += `&seller_id=${groupBuy.seller_id}`;
    }
    router.push(url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>노쇼 신고할 거래 선택</DialogTitle>
          <DialogDescription>
            최근 거래 중 신고할 거래를 선택하세요. (거래종료 후 15일 이내)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {groupBuys.map((groupBuy) => (
            <Card
              key={groupBuy.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectGroupBuy(groupBuy)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* 상품 이미지 */}
                  {groupBuy.product_image ? (
                    <img
                      src={groupBuy.product_image}
                      alt={groupBuy.product_name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* 공구 정보 */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">
                      {groupBuy.product_name || groupBuy.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        거래종료: {new Date(groupBuy.completed_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    {groupBuy.seller_name && (
                      <div className="text-sm text-gray-500 mt-1">
                        판매자: {groupBuy.seller_name}
                      </div>
                    )}
                  </div>

                  {/* 선택 버튼 */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectGroupBuy(groupBuy);
                    }}
                  >
                    이 거래 신고하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}